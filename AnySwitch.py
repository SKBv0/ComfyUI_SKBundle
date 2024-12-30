import torch
import numpy as np
from server import PromptServer

class SKB_AnySwitch:
    name = "SKB_AnySwitch"
    description = "A dynamic switch supporting all data types"
    CATEGORY = "SKB"

    EMPTY_IMAGE = torch.zeros((1, 8, 8, 3))

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "select": ("INT", {"default": 1, "min": 1, "max": 5, "step": 1}),
            },
            "optional": {
                "input_1": ("*",),
                "input_2": ("*",),
                "input_3": ("*",),
                "input_4": ("*",),
                "input_5": ("*",),
            }
        }

    RETURN_TYPES = ("IMAGE", "STRING", "INT")
    RETURN_NAMES = ("image_output", "text_output", "int_output")
    FUNCTION = "switch"

    def switch(self, select, **kwargs):
        connected_inputs = sum(1 for key in kwargs if key.startswith('input_') and kwargs[key] is not None)
        
        empty_image = torch.zeros((1, 8, 8, 3))
        
        if connected_inputs == 0:
            PromptServer.instance.send_sync("SKB_AnySwitch.info", {"message": "No inputs connected"})
            return (empty_image, "", 0)
        
        select = min(select, connected_inputs)
        
        selected_input = kwargs.get(f"input_{select}", None)
        
        if selected_input is None:
            PromptServer.instance.send_sync("SKB_AnySwitch.info", {"message": f"Input {select} is not connected"})
            return (empty_image, "", 0)

        if isinstance(selected_input, str):
            return (empty_image, selected_input, 0)
        elif isinstance(selected_input, int):
            return (empty_image, "", selected_input)
        elif isinstance(selected_input, (torch.Tensor, np.ndarray)) and len(selected_input.shape) >= 3:
            return (selected_input, "", 0)
        else:
            return (empty_image, "", 0)

    @classmethod
    def IS_CHANGED(cls, select, **kwargs):
        return float("NaN")

    @classmethod
    def VALIDATE_INPUTS(cls, input_types):
        return True

NODE_CLASS_MAPPINGS = {
    "SKB_AnySwitch": SKB_AnySwitch
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "SKB_AnySwitch": "Any Switch"
}