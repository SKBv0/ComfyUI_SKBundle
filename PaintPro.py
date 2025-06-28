import torch
import numpy as np
from PIL import Image, ImageOps
import base64
from io import BytesIO
import traceback
import json
import logging

logger = logging.getLogger(__name__)

def pil_to_tensor(image):
    image = image.convert("RGBA")
    image_np = np.array(image).astype(np.float32) / 255.0
    return torch.from_numpy(image_np).unsqueeze(0)

def tensor_to_pil(tensor):
    tensor = tensor.cpu()
    if len(tensor.shape) == 4:
        if tensor.shape[1] == 3 or tensor.shape[1] == 4:
            tensor = tensor.permute(0, 2, 3, 1)
        tensor = tensor[0]
    elif len(tensor.shape) == 3:
        if tensor.shape[0] == 3 or tensor.shape[0] == 4:
            tensor = tensor.permute(1, 2, 0)
        else:
            raise ValueError(f"Unexpected tensor shape: {tensor.shape}")
    image_np = (tensor.numpy() * 255.0).clip(0, 255).astype(np.uint8)
    if image_np.shape[2] == 4:
        return Image.fromarray(image_np, 'RGBA')
    elif image_np.shape[2] == 3:
        return Image.fromarray(image_np, 'RGB')
    elif image_np.shape[2] == 1:
        return Image.fromarray(image_np[:, :, 0], 'L')
    else:
        raise ValueError(f"Unexpected number of channels: {image_np.shape[2]}")

class PaintPro:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {},
            "optional": {"image": ("IMAGE",)},
            "hidden": {"canvas_image": ("STRING", {"default": ""})}
        }
    RETURN_TYPES = ("IMAGE", "MASK")
    FUNCTION = "process_image_safe"
    CATEGORY = "SKB"

    def process_image_safe(self, image=None, canvas_image=None):
        if isinstance(canvas_image, str):
            if len(canvas_image) == 0:
                logger.warning("[PaintPro process_image_safe] Received empty canvas_image string.")
        else:
            logger.warning(f"[PaintPro process_image_safe] Received canvas_image is not a string.")
        if canvas_image is None:
            logger.warning("[PaintPro process_image_safe] canvas_image was None, setting to empty string.")
            canvas_image = ""
        try:
            return self.process_image_logic(image=image, canvas_image=canvas_image)
        except Exception as e:
            logger.error(f"Critical error caught by wrapper in PaintPro: {str(e)}", exc_info=True)
            default_width = 512
            default_height = 512
            final_h, final_w = default_height, default_width
            if image is not None and isinstance(image, torch.Tensor) and len(image.shape) >= 3:
                try:
                    if len(image.shape) == 4:
                        if image.shape[1] == 3 or image.shape[1] == 4:
                            final_h, final_w = image.shape[2], image.shape[3]
                        else:
                            final_h, final_w = image.shape[1], image.shape[2]
                    elif len(image.shape) == 3:
                        if image.shape[0] == 3 or image.shape[0] == 4:
                            final_h, final_w = image.shape[1], image.shape[2]
                        else:
                            final_h, final_w = image.shape[0], image.shape[1]
                except Exception as dim_e:
                    logger.warning(f"Could not extract dimensions during critical error fallback: {dim_e}")
            safe_mask = torch.zeros((1, final_h, final_w), dtype=torch.float32)
            if image is not None and isinstance(image, torch.Tensor) and len(image.shape) == 4:
                logger.warning("PaintPro returning original image due to critical error.")
                return (image, safe_mask)
            else:
                logger.warning("PaintPro returning blank image due to critical error and invalid/missing input.")
                blank_image = torch.zeros((1, final_h, final_w, 3), dtype=torch.float32)
                return (blank_image, safe_mask)

    def process_image_logic(self, image=None, canvas_image=None):
        try:
            output_mask = None
            default_width = 512
            default_height = 512
            if image is None:
                image = torch.zeros((1, default_height, default_width, 3), dtype=torch.float32)
                original_image_pil = Image.new('RGBA', (default_width, default_height), (0, 0, 0, 0))
                output_image_pil = original_image_pil.copy()
                w, h = default_width, default_height
                output_mask = torch.zeros((1, h, w), dtype=torch.float32)
            else:
                try:
                    original_image_pil = tensor_to_pil(image)
                    output_image_pil = original_image_pil.copy()
                    w, h = original_image_pil.size
                    output_mask = torch.zeros((1, h, w), dtype=torch.float32)
                except Exception as e:
                    h = w = 512
                    logger.warning(f"Could not reliably determine input image dimensions from tensor shape {image.shape}. Falling back to {w}x{h}.")
                    output_mask = torch.zeros((1, h, w), dtype=torch.float32)
                    logger.error(f"Error converting input tensor to PIL: {str(e)}", exc_info=True)
                    return (image, output_mask)
            if not (isinstance(w, int) and w > 0 and isinstance(h, int) and h > 0):
                logger.error(f"Invalid dimensions determined for mask processing: w={w}, h={h}. Falling back to default.")
                w, h = default_width, default_height
                output_mask = torch.zeros((1, h, w), dtype=torch.float32)
                if image is None:
                    output_image_pil = Image.new('RGBA', (w, h), (0, 0, 0, 0))
                elif not isinstance(original_image_pil, Image.Image):
                    output_image_pil = Image.new('RGBA', (w, h), (0, 0, 0, 0))
                else:
                    output_image_pil = original_image_pil.resize((w,h), Image.LANCZOS)
                original_image_pil = output_image_pil.copy()
            if canvas_image and canvas_image.startswith("data:application/json;base64,"):
                try:
                    data = json.loads(base64.b64decode(canvas_image.split(",")[1]).decode('utf-8'))
                    if "image" in data and "mask" in data:
                        try:
                            overlay_data = base64.b64decode(data['image'].split(",")[1])
                            overlay_pil = Image.open(BytesIO(overlay_data))
                            mask_data = base64.b64decode(data['mask'].split(",")[1])
                            mask_pil = Image.open(BytesIO(mask_data))
                            if not isinstance(overlay_pil, Image.Image) or not isinstance(mask_pil, Image.Image):
                                raise ValueError("Failed to load overlay or mask PIL image from canvas data.")
                            mask_pil = mask_pil.convert("L")
                            if overlay_pil.size != (w, h):
                                logger.warning(f"Resizing overlay from {overlay_pil.size} to {(w, h)}")
                                overlay_pil = overlay_pil.resize((w, h), Image.LANCZOS)
                            if mask_pil.size != (w, h):
                                logger.warning(f"Resizing mask from {mask_pil.size} to {(w, h)}")
                                mask_pil = mask_pil.resize((w, h), Image.NEAREST)
                        except Exception as e:
                            logger.error(f"Error processing image/mask data from canvas JSON: {str(e)}", exc_info=True)
                            overlay_pil = Image.new('RGBA', (w, h), (0, 0, 0, 0))
                            mask_pil = Image.new('L', (w, h), 0)
                        if not isinstance(output_image_pil, Image.Image):
                            logger.warning("output_image_pil was invalid before pasting overlay. Recreating.")
                            output_image_pil = Image.new('RGBA', (w, h), (0, 0, 0, 0))
                        if overlay_pil.mode != 'RGBA':
                            overlay_pil = overlay_pil.convert('RGBA')
                        output_image_pil.paste(overlay_pil, (0, 0), overlay_pil)
                        mask_np = np.array(mask_pil).astype(np.float32) / 255.0
                        output_mask = torch.from_numpy(mask_np).unsqueeze(0)
                    else:
                        logger.warning("PaintPro: Invalid JSON data from canvas: 'image' and/or 'mask' fields missing.")
                except Exception as e:
                    logger.error(f"PaintPro: Error processing canvas data string: {str(e)}", exc_info=True)
            else:
                logger.info("PaintPro: No valid canvas data received from widget.")
            if not isinstance(output_image_pil, Image.Image):
                logger.error("output_image_pil is invalid before final tensor conversion. Creating blank image.")
                output_image_pil = Image.new('RGBA', (w, h), (0, 0, 0, 0))
            output_tensor = pil_to_tensor(output_image_pil)
            if not isinstance(output_mask, torch.Tensor) or len(output_mask.shape) != 3 or output_mask.shape[0] != 1:
                logger.error(f"Final mask tensor has unexpected shape or type: {output_mask.shape if isinstance(output_mask, torch.Tensor) else type(output_mask)}. Creating default mask.")
                if len(output_tensor.shape) == 4:
                    final_h, final_w = (output_tensor.shape[2], output_tensor.shape[3]) if output_tensor.shape[1] in [3,4] else (output_tensor.shape[1], output_tensor.shape[2])
                else:
                    final_h, final_w = h, w
                output_mask = torch.zeros((1, final_h, final_w), dtype=torch.float32)
            if output_tensor.shape[-1] == 4:
                output_tensor_rgb = output_tensor[..., :3]
            else:
                output_tensor_rgb = output_tensor
            return (output_tensor_rgb, output_mask)
        except Exception as e:
            print(f"Error in process_image: {str(e)}")
            traceback.print_exc()
            if output_mask is None:
                if image is not None and len(image.shape) == 4:
                    if image.shape[1] == 3 or image.shape[1] == 4:
                        h, w = image.shape[2], image.shape[3]
                    else:
                        h, w = image.shape[1], image.shape[2]
                else:
                    h, w = default_width, default_height
                output_mask = torch.zeros((1, h, w), dtype=torch.float32)
            if image is not None:
                return (image, output_mask)
            else:
                blank_image = torch.zeros((1, default_height, default_width, 3), dtype=torch.float32)
                return (blank_image, output_mask)

NODE_CLASS_MAPPINGS = {
    "PaintPro": PaintPro
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "PaintPro": "PaintPro"
}
