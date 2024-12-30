class MultiTextNode:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "separator": ("STRING", {
                    "default": " ",
                    "multiline": False,
                    "hidden": True,
                    "forceInput": True
                }),
                "active": ("BOOLEAN", {"default": True, "hidden": True}),
            },
            "hidden": {
                **{f"text{i}": ("STRING", {"multiline": True}) for i in range(1, 9)},
                **{f"weight{i}": ("FLOAT", {
                    "default": 1.0,
                    "min": 0.0,
                    "max": 2.0,
                    "step": 0.1
                }) for i in range(1, 9)}
            }
        }
    
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("*",)
    FUNCTION = "combine_text"
    CATEGORY = "SKB/text"
    
    def combine_text(self, separator, active=True, **kwargs):
        if not active:
            return ("",)

        separator = str(separator) if separator is not None else " "
        
        texts = []
        
        for i in range(1, 9):
            text = kwargs.get(f"text{i}", "").strip()
            weight = kwargs.get(f"weight{i}", 1.0)
            
            if text:
                if weight == 1.0:
                    texts.append(text)
                else:
                    texts.append(f"({text}:{weight:.1f})")

        result = separator.join(texts)
        return (result,)

NODE_CLASS_MAPPINGS = {
    "MultiTextNode": MultiTextNode
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "MultiTextNode": "Multi Text+"
}