import torch
import os
import folder_paths
from nodes import PreviewImage

class ImageComparer(PreviewImage):
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "image_a": ("IMAGE",),
                "image_b": ("IMAGE",),
            },
            "hidden": {
                "prompt": "PROMPT",
                "extra_pnginfo": "EXTRA_PNGINFO"
            },
        }

    RETURN_TYPES = ()
    FUNCTION = "compare"
    CATEGORY = "SKB/display"
    OUTPUT_NODE = True

    def compare(self, image_a, image_b, prompt=None, extra_pnginfo=None):
        result_a = self.save_images(image_a, filename_prefix="skb_compare_a_", prompt=prompt, extra_pnginfo=extra_pnginfo)
        result_b = self.save_images(image_b, filename_prefix="skb_compare_b_", prompt=prompt, extra_pnginfo=extra_pnginfo)
        
        result = {
            "ui": {
                "images": []
            }
        }
        
        if "ui" in result_a and "images" in result_a["ui"]:
            result["ui"]["images"].extend(result_a["ui"]["images"])
            
        if "ui" in result_b and "images" in result_b["ui"]:
            result["ui"]["images"].extend(result_b["ui"]["images"])
        
        return result

NODE_CLASS_MAPPINGS = {
    "ImageComparer": ImageComparer
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "ImageComparer": "SKB Image Comparer"
}