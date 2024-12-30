import { app } from "../../scripts/app.js";

class MultiFloatNode {
    constructor(node) {
        this.node = node;
        this.setupNode();
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

        this.updateColors(node.properties.startColor || "#423438", node.properties.slidercolor || "#69414e");
        this.updateSliderCount(node.properties.sliderCount || 3);
        this.calculateConstants();
    }

    calculateConstants() {
        this.topMargin = 12;
        this.bottomMargin = 30;
        this.margin = 30;
        this.sliderHeight = 4;
        this.sliderSpacing = 16;
        this.sliderWidth = this.node.size[0] - (this.margin * 2);
    }

    setupNode() {
        this.node.outputs = [];
        
        for (let i = 0; i < 3; i++) {
            this.node.addOutput("", "FLOAT");
        }

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
            precisionMode: 0
        };

        this.node.widgets = [];
        
        for (let i = 0; i < 3; i++) {
            const widget = this.node.addWidget(
                "number",
                `value${i+1}`,
                this.node.properties.values[i],
                (v) => {
                    this.updateValue(i, v);
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
            Object.defineProperty(widget, "height", {
                get: function() { return 0; },
                set: function(v) { }
            });
        }

        this.node.onDrawForeground = this.onDrawForeground.bind(this);
    }

    updateValue(index, value) {
        const decimals = this.node.properties.decimals;
        const roundedValue = Number(value.toFixed(decimals));
        
        this.node.properties.values[index] = roundedValue;
        
        if (this.node.widgets[index]) {
            const widget = this.node.widgets[index];
            widget.value = roundedValue;
            
            if (this.node.onWidgetChanged) {
                this.node.onWidgetChanged(widget.name, roundedValue, widget.value, widget);
            }
        }
        
        this.node.setDirtyCanvas(true);
        this.updateOutputs();
    }

    updateOutputs() {
        this.node.properties.values.forEach((value, i) => {
            if (this.node.outputs[i]) {
                const decimals = this.node.properties.decimals;
                const roundedValue = parseFloat(value.toFixed(decimals));
                
                this.node.outputs[i].value = roundedValue;
                this.node.triggerSlot(i, roundedValue);
                
                if (this.node.widgets[i]) {
                    this.node.widgets[i].value = roundedValue;
                }
            }
        });
    }

    onDrawForeground(ctx) {
        if (this.node.flags.collapsed) return;

        this.calculateConstants();

        const { properties } = this.node;

        properties.values.forEach((value, i) => this.drawSlider(ctx, value, i));

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
        const buttonY = this.node.size[1] - this.bottomMargin + 5;
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
        const precisionText = ["1.0", "1.00", "1.000"][this.node.properties.precisionMode];
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
        const buttonY = this.node.size[1] - this.bottomMargin + 5;
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
                    this.updatePrecisionMode();
                    return true;
                }
            }
        }
        return false;
    }

    updatePrecisionMode() {
        this.node.properties.precisionMode = (this.node.properties.precisionMode + 1) % 3;
        const newDecimals = this.node.properties.precisionMode + 1;
        
        this.node.properties.decimals = newDecimals;
        
        if (this.node.onPropertyChanged) {
            this.node.onPropertyChanged("decimals", newDecimals);
        }
        
        this.node.properties.values.forEach((value, index) => {
            const roundedValue = Number(value.toFixed(newDecimals));
            this.node.properties.values[index] = roundedValue;
            
            if (this.node.widgets[index]) {
                this.node.widgets[index].value = roundedValue;
            }
            
            if (this.node.outputs[index]) {
                this.node.outputs[index].value = roundedValue;
                this.node.triggerSlot(index, roundedValue);
            }
        });
        
        if (this.node.graph) {
            this.node.graph.runStep(this.node);
        }
        
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
        this.colors.tooltip = `rgba(${this.hexToRgb(endColor)}, 0.9)`;
        this.node.setDirtyCanvas(true);
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
    }

    updateSliderCount(count) {
        count = Math.round(count);
        count = Math.max(1, Math.min(10, count));

        if (this.node.properties.sliderCount === count) {
            return;
        }

        this.node.properties.sliderCount = count;
        
        while (this.node.outputs.length > count) {
            this.node.removeOutput(this.node.outputs.length - 1);
        }
        while (this.node.outputs.length < count) {
            this.node.addOutput("", "FLOAT");
        }

        this.node.properties.values = this.node.properties.values.slice(0, count);
        while (this.node.properties.values.length < count) {
            this.node.properties.values.push(0);
        }

        while (this.node.widgets.length > count) {
            this.node.widgets.pop();
        }
        while (this.node.widgets.length < count) {
            const i = this.node.widgets.length;
            const widget = this.node.addWidget(
                "number",
                `value${i+1}`,
                this.node.properties.values[i],
                (v) => {
                    this.updateValue(i, v);
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
            Object.defineProperty(widget, "height", {
                get: function() { return 0; },
                set: function(v) { }
            });
        }

        const minHeight = this.topMargin + (count * (this.sliderHeight + this.sliderSpacing)) + this.bottomMargin;
        this.node.size = [240, minHeight];

        this.node.setDirtyCanvas(true, true);
    }

    onResize() {
        this.calculateConstants();
        this.node.setDirtyCanvas(true, true);
    }

    updateAllValues() {
        this.node.properties.values.forEach((value, index) => {
            const roundedValue = Number(value.toFixed(this.node.properties.decimals));
            this.updateValue(index, roundedValue);
        });
        
        this.node.setDirtyCanvas(true, true);
    }
}

app.registerExtension({
    name: "MultiFloat",
    nodeType: "MultiFloat",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "MultiFloat") {
            nodeType.properties = {
                startColor: { type: "color", default: "#000000" },
                slidercolor: { type: "color", default: "#2980b9" },
                sliderCount: { type: "number", default: 3, min: 1, max: 10, step: 1 },
                decimals: { type: "number", default: 1, min: 1, max: 3, step: 1 }
            };

            Object.assign(nodeType.prototype, {
                onNodeCreated() {
                    this.multiFloat = new MultiFloatNode(this);
                },
                onPropertyChanged(property, value) {
                    if (property === "startColor" || property === "slidercolor") {
                        this.multiFloat.updateColors(this.properties.startColor, this.properties.slidercolor);
                    } else if (property === "sliderCount") {
                        this.multiFloat.updateSliderCount(value);
                    } else if (property === "decimals") {
                        this.properties.decimals = value;
                        this.properties.precisionMode = value - 1;
                        this.multiFloat.updateAllValues();
                    }
                },
                onExecuted(message) {
                    this.multiFloat.updateAllValues();
                },
                onMouseDown(e, pos) {
                    return this.multiFloat.onMouseDown(e, pos);
                },
                onMouseMove(e, pos) {
                    return this.multiFloat.onMouseMove(e, pos);
                },
                onMouseUp(e, pos) {
                    return this.multiFloat.onMouseUp(e, pos);
                },
                onMouseLeave(e) {
                    return this.multiFloat.onMouseLeave(e);
                },
                onResize(size) {
                    if (this.multiFloat) {
                        this.multiFloat.onResize();
                    }
                }
            });
        }
    }
});