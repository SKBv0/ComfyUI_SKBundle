import torch
import numpy as np
from PIL import Image
import base64
from io import BytesIO

class TextBox:
    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("🖼️",)
    FUNCTION = "render_text"
    CATEGORY = "SKB/text"

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "text": ("STRING", {"multiline": True, "default": "", "hidden": True}),
                "font_size": ("INT", {"default": 32, "min": 8, "max": 128, "hidden": True}),
                "text_color": ("STRING", {"default": "#FFFFFF", "hidden": True}),
                "text_gradient_start": ("STRING", {"default": "", "hidden": True}),
                "text_gradient_end": ("STRING", {"default": "", "hidden": True}),
                "text_gradient_angle": ("INT", {"default": 0, "min": 0, "max": 360, "hidden": True}),
                "background_color": ("STRING", {"default": "#000000", "hidden": True}),
                "width": ("INT", {"default": 512, "min": 64, "max": 2048, "hidden": True}),
                "height": ("INT", {"default": 512, "min": 64, "max": 2048, "hidden": True}),
                "position_x": ("INT", {"default": 256, "min": 0, "max": 2048, "hidden": True}),
                "position_y": ("INT", {"default": 256, "min": 0, "max": 2048, "hidden": True}),
                "rotation": ("FLOAT", {"default": 0.0, "min": -360.0, "max": 360.0, "hidden": True}),
                "opacity": ("FLOAT", {"default": 1.0, "min": 0.0, "max": 1.0, "hidden": True}),
                "background_visible": ("BOOLEAN", {"default": True, "hidden": True}),
                "canvas_image": ("STRING", {"default": "", "hidden": True})
            }
        }

    def _process_image(self, image_np, background_visible, background_color):
        if background_visible:
            alpha = image_np[..., 3:4]
            rgb = image_np[..., :3]
            bg_color = np.array([int(background_color[i:i+2], 16) / 255.0 for i in (1, 3, 5)])
            bg = np.ones_like(rgb) * bg_color.reshape(1, 1, 3)
            return rgb * alpha + bg * (1 - alpha)
        return image_np

    def render_text(self, text, font_size=32, text_color="#FFFFFF", text_gradient_start="", text_gradient_end="",
                   text_gradient_angle=0, background_color="#000000", width=512, height=512, position_x=256, position_y=256, 
                   rotation=0.0, opacity=1.0, background_visible=True, canvas_image=None):
        try:
            if canvas_image and canvas_image.startswith('data:image/png;base64,'):
                image = Image.open(BytesIO(base64.b64decode(canvas_image.split(',')[1]))).convert('RGBA')
                image_np = np.array(image).astype(np.float32) / 255.0
                image_np = self._process_image(image_np, background_visible, background_color)
                return (torch.from_numpy(image_np)[None,],)

            channels = 4 if not background_visible else 3
            base_image = np.zeros((height, width, channels), dtype=np.float32)
            return (torch.from_numpy(base_image)[None,],)

        except Exception:
            channels = 4 if not background_visible else 3
            base_image = np.zeros((height, width, channels), dtype=np.float32)
            return (torch.from_numpy(base_image)[None,],)

NODE_CLASS_MAPPINGS = {"TextBox": TextBox}
NODE_DISPLAY_NAME_MAPPINGS = {"TextBox": "Text Box"}