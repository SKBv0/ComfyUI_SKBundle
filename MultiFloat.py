class MultiFloat:
    @classmethod
    def INPUT_TYPES(cls):
        optional = {
            f"value{i+1}": ("FLOAT", {
                "default": 0.0,
                "min": -100.0,
                "max": 100.0,
                "step": 0.1,
                "hide": True,
                "forceInput": True
            })
            for i in range(10)
        }
        return {
            "required": {},
            "optional": optional
        }
    
    RETURN_TYPES = ("FLOAT",) * 10
    RETURN_NAMES = tuple(f"value{i+1}" for i in range(10))
    FUNCTION = "process"
    CATEGORY = "SKB"

    def process(self, **kwargs):
        values = []
        for i in range(10):
            key = f"value{i+1}"
            if key in kwargs:
                value = float(kwargs[key])
                values.append(value)
            else:
                values.append(0.0)
        
        return tuple(values)

NODE_CLASS_MAPPINGS = {
    "MultiFloat": MultiFloat
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "MultiFloat": "Multi Float"
}