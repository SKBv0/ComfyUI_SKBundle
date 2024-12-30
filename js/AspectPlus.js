import { app } from "../../../scripts/app.js";

class AspectRatioNode extends LiteGraph.LGraphNode {
    constructor() {
        super();
        this.properties = {
            category: "Custom",
            subcategory: "Custom",
            width: 512,
            height: 512,
            swap_dimensions: false,
            upscale_factor: 1.0,
            round_to_64: false,
            aspect_ratio_lock: false
        };

        this.base_dimensions = {width: 512, height: 512};
        this.current_dimensions = {width: 512, height: 512};
        this.aspect_ratio = 1.0;
    }

    static nodeData = {
        name: "AspectRatioAdvanced",
        subcategories: {
            "Custom": ["Custom"],
            "Print": ["A4 - 2480x3508", "A5 - 1748x2480", "Letter - 2550x3300", "Legal - 2550x4200"],
            "Social Media": ["Instagram Square - 1080x1080", "Facebook Cover - 851x315", "Twitter Post - 1200x675", "LinkedIn Banner - 1584x396"],
            "Cinema": ["16:9 - 1920x1080", "2.35:1 - 1920x817", "4:3 - 1440x1080", "1:1 - 1080x1080"],
            "Flux": {
                "2.0 MP (Flux maximum)": [
                    "1:1 - 1408x1408",
                    "3:2 - 1728x1152",
                    "4:3 - 1664x1216",
                    "16:9 - 1920x1088",
                    "21:9 - 2176x960"
                ],
                "1.0 MP (SDXL recommended)": [
                    "1:1 - 1024x1024",
                    "3:2 - 1216x832",
                    "4:3 - 1152x896",
                    "16:9 - 1344x768",
                    "21:9 - 1536x640"
                ],
                "0.1 MP (Flux minimum)": [
                    "1:1 - 320x320",
                    "3:2 - 384x256",
                    "4:3 - 448x320",
                    "16:9 - 448x256",
                    "21:9 - 576x256"
                ]
            }
        },
        inputs: [],
        outputs: [
            ["width", "number"],
            ["height", "number"],
            ["upscale_factor", "number"]
        ]
    };

    setupNode() {
        this.dimensionsMap = {
            "A4 - 2480x3508": [2480, 3508],
            "A5 - 1748x2480": [1748, 2480],
            "Letter - 2550x3300": [2550, 3300],
            "Legal - 2550x4200": [2550, 4200],
            "Instagram Square - 1080x1080": [1080, 1080],
            "Facebook Cover - 851x315": [851, 315],
            "Twitter Post - 1200x675": [1200, 675],
            "LinkedIn Banner - 1584x396": [1584, 396],
            "16:9 - 1920x1080": [1920, 1080],
            "2.35:1 - 1920x817": [1920, 817],
            "4:3 - 1440x1080": [1440, 1080],
            "1:1 - 1080x1080": [1080, 1080]
        };
    }

    createWidgets() {
        if (!this.widgets) this.widgets = [];
        
        this.categoryWidget = this.addWidget("combo", "category", "Custom", (v) => {
            this.properties.category = v;
            this.updateSubcategories();
        }, { values: Object.keys(AspectRatioNode.nodeData.subcategories) });

        this.subcategoryWidget = this.addWidget("combo", "subcategory", "", (v) => {
            this.properties.subcategory = v;
            this.updateDimensions();
        }, { values: [] });

        this.fluxSubcategoryWidget = this.addWidget("hidden", "flux_subcategory", "", (v) => {
            this.updateFluxOptions();
        }, { values: [] });

        this.fluxOptionsWidget = this.addWidget("hidden", "flux_options", "", (v) => {
            this.properties.subcategory = v;
            this.subcategoryWidget.value = v;
            this.updateDimensions();
        }, { values: [] });

        this.widthWidget = this.addWidget("number", "width", 512, (v) => {
            if (this.properties.round_to_64) {
                v = Math.ceil(v / 64) * 64;
                this.widthWidget.value = v;
            }
            
            this.properties.width = v;
            if (this.properties.aspect_ratio_lock) {
                this.properties.height = Math.round(v / this.aspect_ratio);
                this.heightWidget.value = this.properties.height;
            }
            this.setDirtyCanvas(true);
        }, { min: 32, max: 8192, step: 8 });

        this.heightWidget = this.addWidget("number", "height", 512, (v) => {
            if (this.properties.round_to_64) {
                v = Math.ceil(v / 64) * 64;
                this.heightWidget.value = v;
            }
            
            this.properties.height = v;
            if (this.properties.aspect_ratio_lock) {
                this.properties.width = Math.round(v * this.aspect_ratio);
                this.widthWidget.value = this.properties.width;
            }
            this.setDirtyCanvas(true);
        }, { min: 32, max: 8192, step: 8 });

        this.swapDimensionsWidget = this.addWidget("toggle", "swap_dimensions", false, (v) => {
            this.properties.swap_dimensions = v;
            this.updateDimensions();
        });

        this.upscaleWidget = this.addWidget("number", "upscale_factor", 1.0, (v) => {
            const rounded = Math.round(v * 100) / 100;
            this.properties.upscale_factor = rounded;
            this.updateDimensions();
        }, { min: 0.1, max: 4.0, step: 0.05, precision: 2 });

        this.roundTo64Widget = this.addWidget("toggle", "round_to_64", false, (v) => {
            this.properties.round_to_64 = v;
            
            const step = v ? 64 : 8;
            this.widthWidget.options.step = step;
            this.heightWidget.options.step = step;
            
            this.updateDimensions();
        });

        this.aspectRatioLockWidget = this.addWidget("toggle", "aspect_ratio_lock", false, (v) => {
            this.properties.aspect_ratio_lock = v;
            if (v) {
                this.aspect_ratio = this.properties.width / this.properties.height;
            }
        });

        requestAnimationFrame(() => {
            this.updateSubcategories();
        });
    }

    updateSubcategories() {
        if (!this.categoryWidget || !this.subcategoryWidget || 
            !this.fluxSubcategoryWidget || !this.fluxOptionsWidget) {
            return;
        }

        const category = this.categoryWidget.value;
        
        if (category === "Flux") {
            this.subcategoryWidget.type = "hidden";
            this.fluxSubcategoryWidget.type = "combo";
            this.fluxOptionsWidget.type = "combo";
            
            const fluxCategories = Object.keys(AspectRatioNode.nodeData.subcategories.Flux);
            this.fluxSubcategoryWidget.options.values = fluxCategories;
            this.fluxSubcategoryWidget.value = fluxCategories[0];
            
            const fluxOptions = AspectRatioNode.nodeData.subcategories.Flux[fluxCategories[0]];
            this.fluxOptionsWidget.options.values = fluxOptions;
            this.fluxOptionsWidget.value = fluxOptions[0];
            
            this.properties.subcategory = fluxOptions[0];
        } else {
            this.subcategoryWidget.type = "combo";
            this.fluxSubcategoryWidget.type = "hidden";
            this.fluxOptionsWidget.type = "hidden";
            
            const subcategories = AspectRatioNode.nodeData.subcategories[category] || ["Custom"];
            this.subcategoryWidget.options.values = subcategories;
            this.subcategoryWidget.value = subcategories[0];
            this.properties.subcategory = subcategories[0];
        }
        
        this.updateDimensions();
    }

    updateDimensions() {
        const category = this.categoryWidget.value;
        let width, height;

        if (category === "Flux") {
            const fluxOption = this.fluxOptionsWidget.value;
            this.properties.subcategory = fluxOption;
            this.subcategoryWidget.value = fluxOption;
            
            if (fluxOption) {
                const [_, dimensionsStr] = fluxOption.split(" - ");
                [width, height] = dimensionsStr.split("x").map(Number);
                this.base_dimensions = {width, height};
            }
        } else if (category === "Custom") {
            width = this.base_dimensions.width;
            height = this.base_dimensions.height;
        } else {
            const subcategory = this.subcategoryWidget.value;
            this.properties.subcategory = subcategory;
            
            if (subcategory in this.dimensionsMap) {
                [width, height] = this.dimensionsMap[subcategory];
                this.base_dimensions = {width, height};
            } else {
                width = this.base_dimensions.width;
                height = this.base_dimensions.height;
            }
        }

        if (this.properties.swap_dimensions) {
            [width, height] = [height, width];
        }

        if (this.properties.round_to_64) {
            width = Math.ceil(width / 64) * 64;
            height = Math.ceil(height / 64) * 64;
        }

        const factor = parseFloat(this.properties.upscale_factor) || 1.0;
        width = Math.round(width * factor);
        height = Math.round(height * factor);

        this.widthWidget.value = width;
        this.heightWidget.value = height;
        this.properties.width = width;
        this.properties.height = height;

        this.setDirtyCanvas(true);
    }

    updateFluxOptions() {
        const fluxSubcategory = this.fluxSubcategoryWidget.value;
        if (!fluxSubcategory) return;
        
        const fluxOptions = AspectRatioNode.nodeData.subcategories.Flux[fluxSubcategory];
        if (!fluxOptions) return;
        
        this.fluxOptionsWidget.options.values = fluxOptions;
        this.fluxOptionsWidget.value = fluxOptions[0];
        
        this.properties.subcategory = fluxOptions[0];
        this.subcategoryWidget.value = fluxOptions[0];
        
        this.updateDimensions();
    }
}

app.registerExtension({
    name: "SKB.AspectRatio",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "AspectRatioAdvanced") {
            Object.getOwnPropertyNames(AspectRatioNode.prototype).forEach(method => {
                if (method !== 'constructor') {
                    nodeType.prototype[method] = AspectRatioNode.prototype[method];
                }
            });
            
            nodeType.nodeData = AspectRatioNode.nodeData;
            
            nodeType.prototype.onNodeCreated = function() {
                if (this.widgets) {
                    this.widgets.length = 0;
                }

                this.properties = {
                    category: "Custom",
                    subcategory: "",
                    flux_subcategory: "",
                    flux_options: "",
                    width: 512,
                    height: 512,
                    aspect_ratio_lock: false,
                    swap_dimensions: false,
                    upscale_factor: 1.0
                };

                this.base_dimensions = {width: 512, height: 512};
                this.current_dimensions = {width: 512, height: 512};
                this.aspect_ratio = 1.0;

                this.setupNode();
                this.createWidgets();
                this.updateSubcategories();
            };
        }
    }
});