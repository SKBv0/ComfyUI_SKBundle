import math

class AspectRatioAdvanced:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "category": (["Custom", "Print", "Social Media", "Cinema", "Flux"],),
                "subcategory": ("STRING", {
                    "default": "Custom",
                    "multiline": False,
                }),
                "width": ("INT", {"default": 512, "min": 32, "max": 8192, "step": 8}),
                "height": ("INT", {"default": 512, "min": 32, "max": 8192, "step": 8}),
                "swap_dimensions": ("BOOLEAN", {"default": False}),
                "upscale_factor": ("FLOAT", {
                    "default": 1.0,
                    "min": 0.1,
                    "max": 4.0,
                    "step": 0.05,
                    "display": "slider"
                }),
                "round_to_64": ("BOOLEAN", {"default": False})
            }
        }

    RETURN_TYPES = ("INT", "INT", "FLOAT")
    RETURN_NAMES = ("width", "height", "upscale_factor")
    FUNCTION = "calculate_dimensions"
    CATEGORY = "SKB/display"

    def calculate_dimensions(self, category, subcategory, width, height, swap_dimensions, upscale_factor, round_to_64):
        print("\n--- Calculate Dimensions Başladı ---")
        print(f"Gelen parametreler: category={category}, subcategory={subcategory}")
        print(f"Başlangıç boyutları: width={width}, height={height}")
        print(f"swap_dimensions={swap_dimensions}, round_to_64={round_to_64}")
        print(f"upscale_factor={upscale_factor}")

        if width <= 0 or height <= 0:
            raise ValueError("Width and height must be positive values")
        
        if upscale_factor <= 0:
            raise ValueError("Upscale factor must be positive")

        # Upscale factor'ü 2 ondalık basamağa yuvarla
        upscale_factor = round(upscale_factor, 2)

        dimensions = {
            "A4 - 2480x3508": (2480, 3508),
            "A5 - 1748x2480": (1748, 2480),
            "Letter - 2550x3300": (2550, 3300),
            "Legal - 2550x4200": (2550, 4200),
            "Instagram Square - 1080x1080": (1080, 1080),
            "Facebook Cover - 851x315": (851, 315),
            "Twitter Post - 1200x675": (1200, 675),
            "LinkedIn Banner - 1584x396": (1584, 396),
            "16:9 - 1920x1080": (1920, 1080),
            "2.35:1 - 1920x817": (1920, 817),
            "4:3 - 1440x1080": (1440, 1080),
            "1:1 - 1080x1080": (1080, 1080)
        }

        # Önce preset veya flux boyutlarını al
        if category == "Flux" and subcategory:
            try:
                dimensions_part = subcategory.split(" - ")[1]
                w, h = map(int, dimensions_part.split("x"))
                width = w
                height = h
            except (ValueError, IndexError):
                pass
        elif category != "Custom" and subcategory in dimensions:
            width, height = dimensions[subcategory]

        # Swap işlemi
        if swap_dimensions:
            width, height = height, width

        # 64'e yuvarlama işlemi - upscale'den ÖNCE
        if round_to_64:
            width = math.ceil(width / 64.0) * 64
            height = math.ceil(height / 64.0) * 64

        # Upscale işlemi - en son yapılacak
        width = int(round(width * upscale_factor))
        height = int(round(height * upscale_factor))

        # Minimum boyut kontrolü
        width = max(32, int(width))
        height = max(32, int(height))

        print(f"Final boyutlar: width={width}, height={height}")
            
        print("--- Calculate Dimensions Tamamlandı ---\n")
        return (int(width), int(height), upscale_factor)

NODE_CLASS_MAPPINGS = {
    "AspectRatioAdvanced": AspectRatioAdvanced,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "AspectRatioAdvanced": "Advanced Aspect Ratio"
}