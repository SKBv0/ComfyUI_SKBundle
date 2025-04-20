class MultiFloat:
    @classmethod
    def INPUT_TYPES(cls):
        hidden_inputs = {
            f"value{i+1}": ("FLOAT", {
                "default": 0.0,
                "min": -100.0, 
                "max": 100.0,
                "step": 0.1,
            })
            for i in range(10)
        }
        return {
            "required": {},
            "optional": {}, 
            "hidden": hidden_inputs 
        }
    
    RETURN_TYPES = ("FLOAT",) * 10
    RETURN_NAMES = tuple(f"value{i+1}" for i in range(10))
    FUNCTION = "process"
    CATEGORY = "SKB"

    def process(self, value1=0.0, value2=0.0, value3=0.0, value4=0.0, value5=0.0,
                value6=0.0, value7=0.0, value8=0.0, value9=0.0, value10=0.0):
        values = [value1, value2, value3, value4, value5, value6, value7, value8, value9, value10]
        float_values = [float(v) for v in values]
        return tuple(float_values)

NODE_CLASS_MAPPINGS = {
    "MultiFloat": MultiFloat
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "MultiFloat": "Multi Float"
}