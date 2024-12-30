import json


def get_name(name):
    return name

def get_category():
    return "SKB"

class AnyType(str):
    """A special class that is always equal in not equal comparisons. Credit to pythongosssss"""

    def __ne__(self, __value: object) -> bool:
        return False


any = AnyType("*")


class DisplayEverything:
    """Display any data node."""

    NAME = get_name('Display Everything')
    CATEGORY = "SKB/display"

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "source": (any, {}),
            },
        }

    RETURN_TYPES = (any,)
    FUNCTION = "main"
    OUTPUT_NODE = True

    def main(self, source=None):
        value = 'None'
        if source is not None:
            try:
                value = json.dumps(source)
            except Exception:
                try:
                    value = str(source)
                except Exception:
                    value = 'source exists, but could not be serialized.'

        return {"ui": {"text": (value,)}, "result": (value,)}


NODE_CLASS_MAPPINGS = {
    "DisplayEverything": DisplayEverything
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "DisplayEverything": "Display Everything"
}
