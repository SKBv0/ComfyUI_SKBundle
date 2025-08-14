import { app } from "../../scripts/app.js";
import { preventNodeDrag } from "./dragHelper.js";

class MultiFloatNode {
    constructor(node) {
        this.node = node;
        this.currentSlider = undefined;
        this.isPressed = false;
        this.currentHoverSlider = undefined;

        this.colors = {
            sliderBackground: "rgba(240, 240, 245, 0.1)",
            sliderProgress: ["#000000", "#2980b9"],
            handle: "#ecf0f1",
            tooltip: "rgba(52, 152, 219, 0.9)",
            text: "#2c3e50"
        };

        this.fonts = {
            primary: "'Inter', sans-serif",
            size: {
                medium: "12px"
            }
        };

        this.handleRadius = {
            normal: 3,
            hover: 4,
            active: 5
        };

        
        this.topMargin = 12;
        this.bottomMargin = 50; 
        this.margin = 30;
        this.sliderHeight = 4;
        this.sliderSpacing = 16;
        
        this.setupNode();
        this.updateColors(node.properties.startColor || "#423438", node.properties.slidercolor || "#69414e");
        this.updateSliderCount(node.properties.sliderCount || 3);
        this.calculateConstants();
        
        // Instance-level onMouseDown to handle slider interactions cleanly
        this.node.onMouseDown = function(e, pos) {
            if (this.flags.collapsed) return false;

            if (this.multiFloat.checkSliderInteraction(pos)) return true;

            return this.multiFloat.checkSliderCountButtons(pos);
        }.bind(this.node);
    }

    calculateConstants() {
        
        this.sliderWidth = this.node.size[0] - (this.margin * 2);
    }

    setupNode() {
        this.node.outputs = [];
        
        
        const sliderCount = 3;
        const minHeight = this.topMargin + (sliderCount * (this.sliderHeight + this.sliderSpacing)) + this.bottomMargin;
        this.node.size = [240, minHeight];

        
        this.node.properties = {
            values: [0, 0, 0],
            min: -100,
            max: 100,
            step: 0.1,
            decimals: 1,
            snap: false,
            startColor: "#4A90E2",
            slidercolor: "#D0021B",
            sliderCount: 3,
            
        };

        this.node.widgets = [];
        
        this.node.onDrawForeground = this.onDrawForeground.bind(this);

        this.node.serialize_widgets = true;
    }

    updateValue(index, value) {
        const decimals = this.node.properties.decimals;
        const roundedValue = Number(value.toFixed(decimals));
        
        this.node.properties.values[index] = roundedValue;
        
        if (this.node.widgets[index]) {
            const widget = this.node.widgets[index];
            widget.value = roundedValue;
        }
        
        this.node.setDirtyCanvas(true);
        this.updateOutputs();
    }

    updateOutputs() {
        const activeCount = this.node.properties.sliderCount || 0;
        this.node.properties.values.forEach((value, i) => {
            if (i < activeCount && this.node.outputs[i]) {
                const decimals = this.node.properties.decimals;
                const roundedValue = parseFloat(value.toFixed(decimals));
                
                this.node.outputs[i].value = roundedValue;
                this.node.triggerSlot(i, roundedValue);
                
                if (this.node.widgets[i]) {
                    this.node.widgets[i].value = roundedValue;
                }
            }
        });
        
        for (let i = activeCount; i < (this.node.outputs?.length || 0); i++) {
            if (this.node.outputs[i]) {
                this.node.outputs[i].value = undefined;
            }
        }
    }
    onDrawForeground(ctx) {
        if (this.node.flags.collapsed) return;

        this.calculateConstants();
        const { properties } = this.node;
        const activeCount = properties.sliderCount || 0;

        properties.values.forEach((value, i) => {
            if (i < activeCount) {
                this.drawSlider(ctx, value, i);
            }
        });

        this.drawSliderCountControls(ctx);
    }

    drawSlider(ctx, value, index) {
        const y = this.topMargin + index * (this.sliderHeight + this.sliderSpacing);

        ctx.fillStyle = this.colors.sliderBackground;
        this.drawRoundRect(ctx, this.margin, y, this.sliderWidth, this.sliderHeight, 3);

        let progress = (value - this.node.properties.min) / (this.node.properties.max - this.node.properties.min);
        progress = Math.min(Math.max(progress, 0), 1);
        
        const progressWidth = Math.max(0, Math.min(this.sliderWidth * progress, this.sliderWidth));
        const progressGradient = ctx.createLinearGradient(this.margin, y, this.margin + this.sliderWidth, y);
        progressGradient.addColorStop(0, this.colors.sliderProgress[0]);
        progressGradient.addColorStop(1, this.colors.sliderProgress[1]);
        ctx.fillStyle = progressGradient;
        this.drawRoundRect(ctx, this.margin, y, progressWidth, this.sliderHeight, 3);

        const handleX = this.margin + progressWidth;
        const handleY = y + this.sliderHeight / 2;

        const isHovering = this.currentHoverSlider === index;
        const isActive = this.isPressed && this.currentSlider === index;
        
        if (isActive || isHovering) {
            this.drawTooltip(ctx, handleX, handleY, value);
        }

        this.drawSliderHandle(ctx, progress, y, index, value);
    }

    drawSliderHandle(ctx, progress, y, index, value) {
        const handleX = this.margin + this.sliderWidth * progress;
        const handleY = y + this.sliderHeight / 2;

        const isHovering = this.isHoveringHandle(handleX, handleY, index);
        const isActive = this.isPressed && this.currentSlider === index;
        let handleRadius = this.handleRadius.normal;

        if (isActive) {
            handleRadius = this.handleRadius.active;
        } else if (isHovering) {
            handleRadius = this.handleRadius.hover;
        }

        ctx.fillStyle = this.colors.handle;
        ctx.beginPath();
        ctx.arc(handleX, handleY, handleRadius, 0, 2 * Math.PI);
        ctx.fill();
    }

    drawTooltip(ctx, x, y, value) {
        const text = value.toFixed(this.node.properties.decimals);
        const padding = 6;
        
        ctx.font = `10px ${this.fonts.primary}`;
        const textWidth = ctx.measureText(text).width;
        
        const tooltipWidth = textWidth + (padding * 2);
        const tooltipHeight = 20;
        
        let tooltipX = x - tooltipWidth / 2;
        const tooltipY = y - 30;
        
        tooltipX = Math.max(0, Math.min(tooltipX, this.node.size[0] - tooltipWidth));
        
        ctx.fillStyle = this.colors.tooltip;
        this.drawRoundRect(ctx, tooltipX, tooltipY, tooltipWidth, tooltipHeight, 4);
        
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, tooltipX + tooltipWidth / 2, tooltipY + tooltipHeight / 2);
    }

    drawSliderCountControls(ctx) {
        const buttonY = this.node.size[1] - this.bottomMargin/2;
        const buttonWidth = 10;
        const buttonHeight = 10;
        const buttonSpacing = 2;
        const canDecrease = this.node.properties.sliderCount > 1;
        ctx.fillStyle = canDecrease ? "rgba(60, 60, 60, 0.6)" : "rgba(60, 60, 60, 0.2)";
        this.drawRoundRect(ctx, this.margin, buttonY, buttonWidth, buttonHeight, 3);
        ctx.fillStyle = canDecrease ? "white" : "rgba(255, 255, 255, 0.4)";
        ctx.font = "bold 8px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("-", this.margin + buttonWidth / 2, buttonY + buttonHeight / 2);
        const canIncrease = this.node.properties.sliderCount < 10;
        ctx.fillStyle = canIncrease ? "rgba(60, 60, 60, 0.6)" : "rgba(60, 60, 60, 0.2)";
        this.drawRoundRect(ctx, this.margin + buttonWidth + buttonSpacing, buttonY, buttonWidth, buttonHeight, 3);
        ctx.fillStyle = canIncrease ? "white" : "rgba(255, 255, 255, 0.4)";
        ctx.fillText("+", this.margin + buttonWidth + buttonSpacing + buttonWidth / 2, buttonY + buttonHeight / 2);
        const precisionX = this.margin + this.sliderWidth - 30;
        ctx.fillStyle = "rgba(60, 60, 60, 0.6)";
        this.drawRoundRect(ctx, precisionX, buttonY, 30, buttonHeight, 3);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "7px Arial";
        const precisionText = "1." + "0".repeat(this.node.properties.decimals);
        ctx.fillText(precisionText, precisionX + 15, buttonY + buttonHeight / 2);
    }

    onMouseDown(e, pos) {
        if (this.node.flags.collapsed) return false;

        if (this.checkSliderInteraction(pos)) return true;

        return this.checkSliderCountButtons(pos);
    }

    checkSliderInteraction(pos) {
        const { properties } = this.node;
        const hitAreaHeight = 20;

        for (let i = 0; i < properties.values.length; i++) {
            const y = this.topMargin + i * (this.sliderHeight + this.sliderSpacing);

            if (pos[1] >= y - hitAreaHeight / 2 && pos[1] <= y + hitAreaHeight / 2) {
                if (pos[0] >= this.margin && pos[0] <= this.margin + this.sliderWidth) {
                    this.currentSlider = i;
                    this.isPressed = true;
                    this.updateSliderValue(pos);
                    return true;
                }
            }
        }
        return false;
    }

    checkSliderCountButtons(pos) {
        const buttonY = this.node.size[1] - this.bottomMargin/2;
        const buttonWidth = 10;
        const buttonHeight = 10;
        const buttonSpacing = 2;

        if (pos[1] >= buttonY && pos[1] <= buttonY + buttonHeight) {
            if (pos[0] >= this.margin && pos[0] <= this.margin + buttonWidth) {
                if (this.node.properties.sliderCount > 1) {
                    this.updateSliderCount(this.node.properties.sliderCount - 1);
                    return true;
                }
            }
            else if (pos[0] >= this.margin + buttonWidth + buttonSpacing && 
                     pos[0] <= this.margin + buttonWidth * 2 + buttonSpacing) {
                if (this.node.properties.sliderCount < 10) {
                    this.updateSliderCount(this.node.properties.sliderCount + 1);
                    return true;
                }
            }
            else {
                const precisionX = this.margin + this.sliderWidth - 30;
                if (pos[0] >= precisionX && pos[0] <= precisionX + 30) {
                    let newDecimals = (this.node.properties.decimals % 3) + 1;
                    this.node.properties.decimals = newDecimals;

                    this._syncPrecisionStateAndVisuals(newDecimals);
                    return true;
                }
            }
        }
        return false;
    }

    _syncPrecisionStateAndVisuals(newDecimals) {
        this.node.widgets.forEach(w => {
            if (w?.options) {
                w.options.precision = newDecimals;
            }
        });

        this.updateAllValues();
        this.node.setDirtyCanvas(true, true);
    }

    onMouseMove(e, pos) {
        if (e.buttons === 0 && this.isPressed) {
            this.currentSlider = undefined;
            this.isPressed = false;
        }

        if (!this.isPressed) {
            const { properties } = this.node;
            const hitAreaHeight = 20;
            let found = false;
            
            for (let i = 0; i < properties.values.length; i++) {
                const y = this.topMargin + i * (this.sliderHeight + this.sliderSpacing);
                if (pos[1] >= y - hitAreaHeight / 2 && pos[1] <= y + hitAreaHeight / 2) {
                    this.currentHoverSlider = i;
                    found = true;
                    this.node.setDirtyCanvas(true);
                    break;
                }
            }
            
            if (!found) {
                this.currentHoverSlider = undefined;
                this.node.setDirtyCanvas(true);
            }
            
            return false;
        }
        
        if (this.currentSlider !== undefined) {
            this.updateSliderValue(pos);
            return true;
        }
        
        return false;
    }

    onMouseLeave() {
        this.currentSlider = undefined;
        this.isPressed = false;
        this.currentHoverSlider = undefined;
        this.node.setDirtyCanvas(true);
    }

    onMouseUp() {
        this.currentSlider = undefined;
        this.isPressed = false;
        this.currentHoverSlider = undefined;
        this.node.setDirtyCanvas(true);
        return true;
    }

    updateSliderValue(pos) {
        if (this.currentSlider === undefined) return;
        
        const { properties } = this.node;
        
        const relativeX = Math.min(Math.max(pos[0] - this.margin, 0), this.sliderWidth);
        const t = relativeX / this.sliderWidth;
        
        let value = properties.min + (properties.max - properties.min) * t;
        value = Math.min(Math.max(value, properties.min), properties.max);
        
        if (properties.snap) {
            value = Math.round(value / properties.step) * properties.step;
        }
        
        this.updateValue(this.currentSlider, value);
        this.node.setDirtyCanvas(true);
    }

    drawRoundRect(ctx, x, y, width, height, radius, stroke = false) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
        ctx.closePath();
        if (stroke) {
            ctx.strokeStyle = "#555";
            ctx.lineWidth = 1;
            ctx.stroke();
        } else {
            ctx.fillStyle = ctx.fillStyle || this.colors.sliderBackground;
            ctx.fill();
        }
    }

    isHoveringHandle(handleX, handleY, sliderIndex) {
        if (!this.node.mouse) return false;
        const distance = Math.sqrt(
            Math.pow(this.node.mouse[0] - handleX, 2) +
            Math.pow(this.node.mouse[1] - handleY, 2)
        );
        return distance < this.handleRadius.hover && this.currentHoverSlider === sliderIndex;
    }

    updateColors(startColor, endColor) {
        this.colors.sliderProgress = [startColor, endColor];
        
        
        if (endColor) {
            const rgbResult = this.hexToRgb(endColor);
            if (rgbResult) {
                this.colors.tooltip = `rgba(${rgbResult}, 0.9)`;
            }
        }
        
        this.node.setDirtyCanvas(true);
    }

    hexToRgb(hex) {
        if (!hex) return null;
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
    }

    updateSliderCount(count) {
        count = Math.round(count);
        count = Math.max(1, Math.min(10, count));

        if (this.node.properties.sliderCount === count) {
            return;
        }

        this.rebuildStructure(count, this.node.properties.values);
    }

    onResize() {
        this.calculateConstants();
        this.node.setDirtyCanvas(true, true);
    }

    updateAllValues() {
        const activeCount = this.node.properties.sliderCount || 0;
        this.node.properties.values.forEach((value, index) => {
            if (index < activeCount) {
                const roundedValue = Number(value.toFixed(this.node.properties.decimals));
                this.updateValue(index, roundedValue);
            }
        });
        
        this.node.setDirtyCanvas(true, true);
    }

    rebuildStructure(count, existingValues = []) {
        count = Math.round(count);
        count = Math.max(1, Math.min(10, count));

        if (this.node.widgets) {
             this.node.widgets.length = 0;
        }
        this.node.widgets = this.node.widgets || [];

        const newValues = existingValues.slice(0, count);
        while (newValues.length < count) {
            let defaultValue = 0;
            const min = this.node.properties.min ?? -100;
            const max = this.node.properties.max ?? 100;
            if (min > 0 || max < 0) {
                defaultValue = min + (max - min) / 2;
            }
            newValues.push(defaultValue);
        }
        this.node.properties.values = newValues;

        while (this.node.outputs && this.node.outputs.length > count) {
            this.node.removeOutput(this.node.outputs.length - 1);
        }
        while (!this.node.outputs || this.node.outputs.length < count) {
             const outputIndex = this.node.outputs ? this.node.outputs.length : 0;
             this.node.addOutput("", "FLOAT");
        }

        for (let i = 0; i < count; i++) {
            const widgetName = `value${i + 1}`;
            const widget = this.node.addWidget(
                "number",
                widgetName,
                this.node.properties.values[i],
                (v) => {
                    const currentIndex = this.node.widgets.findIndex(w => w.name === widgetName);
                    if (currentIndex !== -1 && currentIndex < this.node.properties.sliderCount) {
                         this.updateValue(currentIndex, v);
                     }
                },
                {
                    precision: this.node.properties.decimals,
                    min: this.node.properties.min,
                    max: this.node.properties.max,
                    step: this.node.properties.step,
                    hidden: true
                }
            );
            widget.type = "number";
            widget.computeSize = () => [0, -4];
            widget.hidden = true;
            Object.defineProperty(widget, "height", { get: () => 0, set: () => {} });
        }

        this.node.properties.sliderCount = count;
         this.updateAllValues();
         this.calculateConstants();
         this.node.setDirtyCanvas(true, true);
    }

    updateWidgetOptions() {
        if (!this.node.widgets) return;
        const options = {
            precision: this.node.properties.decimals,
            min: this.node.properties.min,
            max: this.node.properties.max,
            step: this.node.properties.step
        };
        this.node.widgets.forEach(w => {
            if (w.type === 'number' && w.options) {
                Object.assign(w.options, options);
            }
        });
    }
}

app.registerExtension({
    name: "MultiFloat",
    nodeType: "MultiFloat",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "MultiFloat") {
            nodeType.properties = {
                startColor: { type: "color", default: "#4A90E2" },
                slidercolor: { type: "color", default: "#D0021B" },
                sliderCount: { type: "number", default: 3, min: 1, max: 10, step: 1 },
                decimals: { type: "number", default: 1, min: 1, max: 3, step: 1 },
                values: { type: "array", default: [0, 0, 0] },
                min: { type: "number", default: -100 },
                max: { type: "number", default: 100 },
                step: { type: "number", default: 0.1 },
                snap: { type: "boolean", default: false },
            };

            Object.assign(nodeType.prototype, {
                computeSize() {
                    const count = this.properties?.sliderCount || 3;
                    const topMargin = 12;
                    const bottomMargin = 50;
                    const sliderHeight = 4;
                    const sliderSpacing = 16;
                    const height = topMargin + (count * (sliderHeight + sliderSpacing)) + bottomMargin;
                    const minHeight = 50;
                    
                    
                    
                    let width = 240; 
                    
                    
                    if (this.size && Array.isArray(this.size) && this.size.length >= 2) {
                        width = this.size[0]; 
                    }
                    
                    return [width, Math.max(minHeight, height)];
                },

                onSerialize(o) {
                    if (this.multiFloat && this.properties) {
                        o.multiFloatState = {
                            values: this.properties.values || [],
                            sliderCount: this.properties.sliderCount || 3,
                            startColor: this.properties.startColor,
                            slidercolor: this.properties.slidercolor,
                            decimals: this.properties.decimals,
                            min: this.properties.min,
                            max: this.properties.max,
                            step: this.properties.step,
                            snap: this.properties.snap
                        };
                    }
                },

                onConfigure(config) {
                    if (!this.multiFloat) {
                        this.multiFloat = new MultiFloatNode(this);
                    } else {
                    }

                    const state = config.multiFloatState;
                    let loadedCount = 3;
                    let loadedValues = [0,0,0];

                    if (state) {
                        this.properties = this.properties || {};
                        loadedValues = state.values || [0, 0, 0];
                        loadedCount = state.sliderCount || 3;
                        Object.assign(this.properties, {
                            values: loadedValues,
                            sliderCount: loadedCount,
                            startColor: state.startColor || nodeType.properties.startColor.default,
                            slidercolor: state.slidercolor || nodeType.properties.slidercolor.default,
                            decimals: state.decimals ?? nodeType.properties.decimals.default,
                            min: state.min ?? nodeType.properties.min.default,
                            max: state.max ?? nodeType.properties.max.default,
                            step: state.step ?? nodeType.properties.step.default,
                            snap: state.snap ?? nodeType.properties.snap.default,
                        });
                    } else {
                        loadedCount = nodeType.properties.sliderCount.default;
                        loadedValues = Array(loadedCount).fill(0);
                         this.properties = this.properties || {};
                         Object.assign(this.properties, {
                            values: loadedValues,
                            sliderCount: loadedCount,
                            startColor: nodeType.properties.startColor.default,
                            slidercolor: nodeType.properties.slidercolor.default,
                            decimals: nodeType.properties.decimals.default,
                            min: nodeType.properties.min.default,
                            max: nodeType.properties.max.default,
                            step: nodeType.properties.step.default,
                            snap: nodeType.properties.snap.default,
                        });
                    }

                    this.multiFloat.rebuildStructure(loadedCount, loadedValues);
                    this.multiFloat.updateColors(this.properties.startColor, this.properties.slidercolor);

                    
                    if (config.size && Array.isArray(config.size) && config.size.length >= 2) {
                        
                        this.size = [config.size[0], config.size[1]];
                    } else {
                        
                        const [width, height] = this.computeSize();
                        this.size = [width, height];
                    }
                    
                    this.setDirtyCanvas(true, true);
                },

                onNodeCreated() {
                    if (!this.multiFloat) {
                        this.multiFloat = new MultiFloatNode(this);

                        this.outputs = this.outputs || [];

                        if (!this.graph || !this.graph._configuring) {
                            const initialCount = this.properties?.sliderCount || nodeType.properties.sliderCount.default;
                            const initialValues = this.properties?.values || Array(initialCount).fill(0);
                            this.properties = this.properties || {};
                            Object.assign(this.properties, {
                                values: initialValues,
                                sliderCount: initialCount,
                                startColor: nodeType.properties.startColor.default,
                                slidercolor: nodeType.properties.slidercolor.default,
                                decimals: nodeType.properties.decimals.default,
                                min: nodeType.properties.min.default,
                                max: nodeType.properties.max.default,
                                step: nodeType.properties.step.default,
                                snap: nodeType.properties.snap.default,
                            });
                            this.multiFloat.rebuildStructure(initialCount, initialValues);
                            const [width, height] = this.computeSize();
                            this.size = [width, height];
                        }
                    }
                    if (this.multiFloat) {
                         this.onDrawForeground = this.multiFloat.onDrawForeground.bind(this.multiFloat);
                    }
                },

                onPropertyChanged(property, value, prevValue) {
                    try {
                        if (!this.multiFloat || !this.properties) return;
                        if (property === "startColor" || property === "slidercolor") {
                            this.multiFloat.updateColors(this.properties.startColor, this.properties.slidercolor);
                        } else if (property === "sliderCount") {
                            const newCount = Math.round(value);
                            if (newCount !== this.properties.sliderCount) {
                                this.properties.sliderCount = newCount;
                                this.multiFloat.rebuildStructure(newCount, this.properties.values);
                                const [width, height] = this.computeSize();
                                this.size = [width, height];
                                this.setDirtyCanvas(true, true);
                            }
                        } else if (property === "decimals") {
                             const newDecimals = Math.round(value);
                             if (newDecimals !== this.properties.decimals) {
                                 this.properties.decimals = newDecimals;
                                 this.multiFloat._syncPrecisionStateAndVisuals(newDecimals);
                                 this.multiFloat.updateAllValues();
                             }
                        } else if (["min", "max", "step"].includes(property)) {
                             this.properties[property] = value;
                             this.multiFloat.updateWidgetOptions();
                             this.multiFloat.updateAllValues();
                        } else if (property === "snap") {
                             this.properties.snap = value;
                             this.multiFloat.updateAllValues();
                        }
                        this.setDirtyCanvas(true, true);
                    } catch (error) {
                        console.warn(`MultiFloat property change error (${property}):`, error);
                    }
                },

                onMouseDown(e, pos) {
                    try {
                        return this.multiFloat?.onMouseDown(e, pos);
                    } catch (error) {
                        console.warn("MultiFloat mouse down error:", error);
                        return false;
                    }
                },
                onMouseMove(e, pos) {
                    try {
                        return this.multiFloat?.onMouseMove(e, pos);
                    } catch (error) {
                        console.warn("MultiFloat mouse move error:", error);
                        return false;
                    }
                },
                onMouseUp(e, pos) {
                    try {
                        return this.multiFloat?.onMouseUp(e, pos);
                    } catch (error) {
                        console.warn("MultiFloat mouse up error:", error);
                        return true;
                    }
                },
                onMouseLeave(e) {
                    try {
                        return this.multiFloat?.onMouseLeave(e);
                    } catch (error) {
                        console.warn("MultiFloat mouse leave error:", error);
                    }
                },
                onResize(size) {
                    if (this.multiFloat) {
                        this.multiFloat.calculateConstants();
                        this.multiFloat.node.setDirtyCanvas(true, true);
                    }
                }
            });
        }
    }
});
