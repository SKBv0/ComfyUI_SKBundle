from PIL import Image, ImageDraw, ImageFont

class TitlePlus:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {},
            "hidden": {
                "text": ("STRING", {"multiline": True, "default": "Title"}),
                "font_size": ("INT", {"default": 20, "min": 1, "max": 100}),
                "font_weight": (["normal", "bold"],),
                "text_color": ("COLOR", {"default": "#ffffff"}),
                "background_color": ("COLOR", {"default": "#000000"}),
                "width": ("INT", {"default": 220, "min": 1, "max": 1000}),
                "height": ("INT", {"default": 100, "min": 1, "max": 1000}),
                "text_align": (["left", "center", "right"],),
                "padding": ("INT", {"default": 10, "min": 0, "max": 100}),
                "font_path": ("STRING", {"default": ""}),
                "border_color": ("COLOR", {"default": "#000000"}),
                "border_width": ("INT", {"default": 0, "min": 0, "max": 20}),
            }
        }

    RETURN_TYPES = ("IMAGE",)
    FUNCTION = "process"
    OUTPUT_NODE = True
    CATEGORY = "SKB/text"

    def process(self, text="Title", font_size=20, font_weight="normal", text_color="#ffffff", 
               background_color="#000000", width=220, height=100, text_align="center", 
               padding=10, font_path="", border_color="#000000", border_width=0):
        return (self.title_plus(text, font_size, font_weight, text_color, background_color,
                              width, height, text_align, padding, font_path, 
                              border_color, border_width),)

    def title_plus(self, text, font_size, font_weight, text_color, background_color, width, height, text_align, padding, font_path, border_color, border_width):
        image = Image.new("RGBA", (width, height), background_color)
        draw = ImageDraw.Draw(image)
        font_path = font_path if font_path else "arial.ttf"
        font = ImageFont.truetype(font_path, font_size)
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        if text_align == "left":
            position = (padding, (height - text_height) // 2)
        elif text_align == "center":
            position = ((width - text_width) // 2, (height - text_height) // 2)
        else:
            position = (width - text_width - padding, (height - text_height) // 2)

        if border_width > 0:
            draw.rectangle([0, 0, width-1, height-1], outline=border_color, width=border_width)

        draw.text(position, text, fill=text_color, font=font)
        return image

    @classmethod
    def IS_CHANGED(cls):
        return float("NaN")

NODE_CLASS_MAPPINGS = {
    "TitlePlus": TitlePlus
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "TitlePlus": "Title Plus"
}