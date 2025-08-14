import torch
import numpy as np
from PIL import Image
import base64
from io import BytesIO

class LensFlare:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "image": ("IMAGE",),
                "flare_type": (["50MM_PRIME", "COOL_FLARE", "GOBLIN", "GOLDEN_SUN", "GREEN_GRANITE", 
                               "GREEN_SPOTLIGHT", "LASER", "MOONS", "ANAMORPHIC_PRO", "VINTAGE_85MM", 
                               "CYBERPUNK", "ETHEREAL", "PRISM", "SUNSET_GLOW", "NEON_NIGHTS", "DREAMY",
                               "QUANTUM_FLARE", "FRACTAL_DREAMS", "TIME_WARP", "NEURAL_NETWORK", "TORCH"], 
                               {"default": "50MM_PRIME"}),
                "blend_mode": (["normal", "screen", "lighter", "overlay", "soft-light", "add", "overlay", "hard-light", "color-dodge", "linear-dodge"], {"default": "screen"}),
                "canvas_image": ("STRING", {"default": "", "hidden": True})
            }
        }
    
    RETURN_TYPES = ("IMAGE",)
    FUNCTION = "apply"
    CATEGORY = "SKB"
    TITLE = "Lens Flare Effect"

    def apply(self, image, flare_type="50MM_PRIME", intensity=1.0, size=1.0, position_x=0.5, position_y=0.5, 
             rotation=0.0, glow_radius=1.0, rays_count=8, chromatic=False, blend_mode="screen", canvas_image=None):
        try:
            if canvas_image and canvas_image.startswith('data:image/png;base64,'):
                image_data = base64.b64decode(canvas_image.split(',')[1])
                pil_image = Image.open(BytesIO(image_data)).convert('RGB')
                image_np = np.array(pil_image).astype(np.float32) / 255.0
                result = torch.from_numpy(image_np).unsqueeze(0)
                return (result,)
        except Exception as e:
            print(f"Error processing canvas image: {e}")
        
        return (image,)

NODE_CLASS_MAPPINGS = {
    "LensFlare": LensFlare
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "LensFlare": "Lens Flare Effect"
} 