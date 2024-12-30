import torch
import torch.nn.functional as F
import numpy as np
from scipy.ndimage import gaussian_filter
from skimage import feature, color, exposure

class SeamlessTexture:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "image": ("IMAGE",),
                "tile_size": ("INT", {"default": 512, "min": 64, "max": 2048, "step": 64}),
                "overlap": ("INT", {"default": 64, "min": 0, "max": 256, "step": 8}),
                "pattern_type": (["simple", "mirror", "rotate"], {"default": "simple"}),
                "interpolation": (["nearest", "bilinear", "bicubic"], {"default": "bilinear"}),
                "repeat_count": ("INT", {"default": 1, "min": 1, "max": 10, "step": 1}),
                "texture_direction": (["horizontal", "vertical", "diagonal"], {"default": "horizontal"}),
                "detail_level": ("FLOAT", {"default": 1.0, "min": 0.1, "max": 2.0, "step": 0.1}),
                "edge_padding": ("INT", {"default": 0, "min": 0, "max": 128, "step": 1}),
                "edge_blur": ("FLOAT", {"default": 0.0, "min": 0.0, "max": 100.0, "step": 1.0}),
                "edge_fade": ("FLOAT", {"default": 0.0, "min": 0.0, "max": 100.0, "step": 1.0}),
                "color_correction": ("BOOLEAN", {"default": False}),
                "color_correction_strength": ("FLOAT", {"default": 0.5, "min": 0.0, "max": 1.0, "step": 0.1}),
                "color_correction_clip_limit": ("FLOAT", {"default": 0.03, "min": 0.01, "max": 0.1, "step": 0.01}),
                "light_equalization": ("FLOAT", {"default": 0.0, "min": 0.0, "max": 100.0, "step": 1.0}),
                "gradient_removal": ("FLOAT", {"default": 0.0, "min": 0.0, "max": 100.0, "step": 1.0}),
            }
        }

    RETURN_TYPES = ("IMAGE",)
    FUNCTION = "generate"
    CATEGORY = "SKB/display"

    def generate(self, image, tile_size, overlap, pattern_type, interpolation, repeat_count, texture_direction, detail_level, edge_padding, edge_blur, edge_fade, light_equalization, gradient_removal, color_correction, color_correction_strength, color_correction_clip_limit):
        image_np = image.squeeze().cpu().numpy()
        
        if image_np.ndim == 3 and image_np.shape[2] == 3:
            pass
        elif image_np.ndim == 3 and image_np.shape[0] == 3:
            image_np = np.transpose(image_np, (1, 2, 0))
        else:
            raise ValueError(f"Unexpected image shape: {image_np.shape}")
        
        if gradient_removal > 0:
            image_np = self.apply_gradient_removal(image_np, gradient_removal / 100.0)
            
        if light_equalization > 0:
            image_np = self.apply_light_equalization(image_np, light_equalization / 100.0)
        
        if edge_blur > 0:
            image_np = self.apply_edge_blur(image_np, edge_blur / 100.0)
        
        if edge_fade > 0:
            image_np = self.apply_edge_fade(image_np, edge_fade / 100.0)
        
        if edge_padding > 0:
            image_np = self.apply_edge_padding(image_np, edge_padding)
        
        h, w, c = image_np.shape
        overlap = min(overlap, h // 2, w // 2)
        overlap = max(1, overlap)
        
        if pattern_type == "simple":
            seamless = self.simple_seamless(image_np, overlap)
        elif pattern_type == "mirror":
            seamless = self.mirror_seamless(image_np, overlap)
        elif pattern_type == "rotate":
            seamless = self.rotate_seamless(image_np, overlap)
        else:
            raise ValueError(f"Unknown pattern type: {pattern_type}")
        
        if color_correction:
            seamless = self.apply_color_correction(seamless, color_correction_strength, color_correction_clip_limit)
        
        seamless = self.apply_texture_direction(seamless, texture_direction)
        seamless = self.repeat_texture(seamless, repeat_count)
        seamless = self.adjust_detail(seamless, detail_level)
        
        if seamless.ndim == 3:
            seamless = torch.from_numpy(seamless).permute(2, 0, 1).unsqueeze(0).float()
        elif seamless.ndim == 4:
            seamless = torch.from_numpy(seamless).permute(0, 3, 1, 2).float()
        else:
            raise ValueError(f"Unexpected seamless shape: {seamless.shape}")
        
        seamless = F.interpolate(seamless, size=(tile_size, tile_size), mode=interpolation, align_corners=False if interpolation != 'nearest' else None)
        preview = F.interpolate(seamless, size=(256, 256), mode='bilinear', align_corners=False)
        
        seamless = seamless.permute(0, 2, 3, 1)
        preview = preview.permute(0, 2, 3, 1)
        
        return (seamless, preview)

    def simple_seamless(self, image, overlap):
        h, w, c = image.shape
        seamless = np.zeros((h + overlap*2, w + overlap*2, c), dtype=np.float32)
        
        seamless[overlap:-overlap, overlap:-overlap, :] = image
        seamless[:overlap, overlap:-overlap, :] = image[-overlap:, :, :]
        seamless[-overlap:, overlap:-overlap, :] = image[:overlap, :, :]
        seamless[overlap:-overlap, :overlap, :] = image[:, -overlap:, :]
        seamless[overlap:-overlap, -overlap:, :] = image[:, :overlap, :]
        
        seamless[:overlap, :overlap, :] = image[-overlap:, -overlap:, :]
        seamless[:overlap, -overlap:, :] = image[-overlap:, :overlap, :]
        seamless[-overlap:, :overlap, :] = image[:overlap, -overlap:, :]
        seamless[-overlap:, -overlap:, :] = image[:overlap, :overlap, :]
        
        mask = np.ones((h + overlap*2, w + overlap*2, 1))
        mask[overlap:-overlap, overlap:-overlap] = 0
        
        x = np.linspace(-3, 3, overlap)
        transition = 1 / (1 + np.exp(-x))
        transition = transition.reshape(-1, 1)
        
        for i in range(overlap):
            mask[i, overlap:-overlap] = transition[i, 0]
            mask[-(i+1), overlap:-overlap] = transition[-(i+1), 0]
            mask[overlap:-overlap, i] = transition[i, 0]
            mask[overlap:-overlap, -(i+1)] = transition[-(i+1), 0]
        
        for i in range(overlap):
            for j in range(overlap):
                weight = transition[i, 0] * transition[j, 0]
                mask[i, j] = weight
                mask[i, -(j+1)] = weight
                mask[-(i+1), j] = weight
                mask[-(i+1), -(j+1)] = weight
        
        mask = gaussian_filter(mask, sigma=overlap/4)
        mask = np.repeat(mask, 3, axis=2)
        
        edges = feature.canny(np.mean(image, axis=2), sigma=2)
        edge_weight = gaussian_filter(edges.astype(float), sigma=2)
        edge_weight = np.pad(edge_weight, ((overlap, overlap), (overlap, overlap)), mode='edge')
        edge_weight = np.expand_dims(edge_weight, -1)
        edge_weight = np.repeat(edge_weight, 3, axis=2)
        
        mask = mask * (1 - edge_weight * 0.5)
        
        blended = seamless.copy()
        blended[overlap:-overlap, overlap:-overlap, :] = image * (1 - mask[overlap:-overlap, overlap:-overlap]) + seamless[overlap:-overlap, overlap:-overlap, :] * mask[overlap:-overlap, overlap:-overlap]
        
        return blended

    def mirror_seamless(self, image, overlap):
        h, w, c = image.shape
        seamless = np.zeros((h*2, w*2, c), dtype=np.float32)
        seamless[:h, :w, :] = image
        seamless[:h, w:, :] = np.fliplr(image)
        seamless[h:, :w, :] = np.flipud(image)
        seamless[h:, w:, :] = np.flipud(np.fliplr(image))
        return seamless

    def rotate_seamless(self, image, overlap):
        h, w, c = image.shape
        max_dim = max(h, w)
        seamless = np.zeros((max_dim*2, max_dim*2, c), dtype=np.float32)
        
        seamless[:h, :w, :] = image
        
        rotated_90 = np.rot90(image)
        seamless[max_dim:max_dim+rotated_90.shape[0], :rotated_90.shape[1], :] = rotated_90
        
        rotated_180 = np.rot90(image, 2)
        seamless[max_dim:max_dim+rotated_180.shape[0], max_dim:max_dim+rotated_180.shape[1], :] = rotated_180
        
        rotated_270 = np.rot90(image, 3)
        seamless[:rotated_270.shape[0], max_dim:max_dim+rotated_270.shape[1], :] = rotated_270
        
        seamless[h:h+overlap, :w, :] = image[:overlap, :, :]
        seamless[:h, w:w+overlap, :] = image[:, :overlap, :]
        seamless[max_dim+h-overlap:max_dim+h, max_dim:max_dim+w, :] = image[-overlap:, :, :]
        seamless[max_dim:max_dim+h, max_dim+w-overlap:max_dim+w, :] = image[:, -overlap:, :]
        
        return seamless

    def apply_texture_direction(self, image, direction):
        if direction == "horizontal":
            return image
        elif direction == "vertical":
            return np.rot90(image)
        elif direction == "diagonal":
            return np.rot90(image, 3)
        return image

    def repeat_texture(self, image, repeat_count):
        return np.tile(image, (repeat_count, repeat_count, 1))

    def apply_edge_blur(self, image, edge_blur):
        h, w, c = image.shape
        result = image.copy()
        
        blur_width = max(1, int(edge_blur * min(h, w) * 0.1))
        mask = np.zeros((h, w))
        
        for i in range(blur_width):
            alpha = 1 - (1 / (1 + np.exp(-(i - blur_width/2))))
            mask[i, :] = np.maximum(mask[i, :], alpha)
            mask[-i-1, :] = np.maximum(mask[-i-1, :], alpha)
            mask[:, i] = np.maximum(mask[:, i], alpha)
            mask[:, -i-1] = np.maximum(mask[:, -i-1], alpha)
        
        mask = np.stack([mask] * c, axis=-1)
        blurred = np.zeros_like(result)
        
        for i in range(c):
            blurred[..., i] = gaussian_filter(result[..., i], sigma=blur_width/3)
        
        result = result * (1 - mask) + blurred * mask
        return result

    def apply_edge_padding(self, image_np, edge_padding):
        h, w, c = image_np.shape
        max_padding = min(h // 4, w // 4)
        edge_padding = min(edge_padding, max_padding)
        
        if edge_padding > 0:
            start_h = edge_padding
            end_h = h - edge_padding
            start_w = edge_padding
            end_w = w - edge_padding
            
            if start_h >= end_h or start_w >= end_w:
                return image_np
            
            result = image_np[start_h:end_h, start_w:end_w].copy()
            return result
        
        return image_np

    def adjust_detail(self, image, detail_level):
        if detail_level == 1.0:
            return image
        
        if image.ndim == 4:
            image = image.squeeze(0)
        
        gray = image.mean(axis=2)
        edges = feature.canny(gray, sigma=2 / detail_level)
        edges = np.stack([edges] * 3, axis=-1)
        
        enhanced = image.copy()
        enhanced[edges] *= detail_level
        enhanced = np.clip(enhanced, 0, 1)
        
        if image.ndim == 4:
            enhanced = enhanced[np.newaxis, ...]
        
        return enhanced

    def apply_color_correction(self, image, strength, clip_limit):
        image_normalized = np.clip(image, 0, 1)
        lab = color.rgb2lab(image_normalized)
        
        l_channel = lab[:,:,0]
        l_channel_normalized = (l_channel - l_channel.min()) / (l_channel.max() - l_channel.min())
        clahe = exposure.equalize_adapthist(l_channel_normalized, clip_limit=clip_limit)
        
        lab[:,:,0] = l_channel * (1 - strength) + (clahe * 100) * strength
        corrected = color.lab2rgb(lab)
        corrected = corrected * (np.max(image) - np.min(image)) + np.min(image)
        
        return corrected

    def apply_edge_fade(self, image, fade_strength):
        h, w, c = image.shape
        result = image.copy()
        fade_width = int(min(h, w) * 0.15 * fade_strength)
        
        if fade_width < 1:
            return result
        
        mask = np.ones((h, w))
        
        for i in range(fade_width):
            progress = i / fade_width
            alpha = progress * progress * (3 - 2 * progress)
            mask[i, :] *= alpha
            mask[-i-1, :] *= alpha
            mask[:, i] *= alpha
            mask[:, -i-1] *= alpha
        
        mask = np.stack([mask] * c, axis=-1)
        result *= mask
        return result

    def apply_light_equalization(self, image, strength):
        h, w, c = image.shape
        result = image.copy()
        result = np.clip(result, 0, 1)
        
        lab = color.rgb2lab(result)
        l_channel = lab[:,:,0]
        l_channel = (l_channel - l_channel.min()) / (l_channel.max() - l_channel.min())
        
        l_equalized = exposure.equalize_adapthist(l_channel, kernel_size=int(min(h,w)/8), clip_limit=0.01)
        l_mixed = l_channel * (1 - strength) + l_equalized * strength
        l_mixed = l_mixed * (lab[:,:,0].max() - lab[:,:,0].min()) + lab[:,:,0].min()
        lab[:,:,0] = l_mixed
        
        result = color.lab2rgb(lab)
        result = result * (image.max() - image.min()) + image.min()
        
        return result

    def apply_gradient_removal(self, image, strength):
        h, w, c = image.shape
        result = image.copy()
        result = np.clip(result, 0, 1)
        
        lab = color.rgb2lab(result)
        l_channel = lab[:,:,0]
        l_channel = (l_channel - l_channel.min()) / (l_channel.max() - l_channel.min())
        
        sigma = min(h, w) / 4
        gradient = gaussian_filter(l_channel, sigma=sigma)
        gradient = (gradient - np.min(gradient)) / (np.max(gradient) - np.min(gradient))
        
        l_corrected = l_channel - (gradient - 0.5) * strength
        l_corrected = np.clip(l_corrected, 0, 1)
        l_corrected = l_corrected * (lab[:,:,0].max() - lab[:,:,0].min()) + lab[:,:,0].min()
        
        lab[:,:,0] = l_corrected
        result = color.lab2rgb(lab)
        result = result * (image.max() - image.min()) + image.min()
        
        return result

NODE_CLASS_MAPPINGS = {
    "SeamlessTexture": SeamlessTexture
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "SeamlessTexture": "Seamless Texture"
}