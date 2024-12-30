import { app } from "../../scripts/app.js";
import { ComfyWidgets } from "../../scripts/widgets.js";
import { SVG, STYLES } from "./TextBoxConstants.js";

function drawToolbarButton(ctx, x, y, width, height, svgString, node, isActive = false, isHovered = false, tooltip = "") {
    const bgColor = isActive ? '#4a4a4a' : isHovered ? '#3a3a3a' : '#2a2a2a';
    
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 3);
    ctx.fillStyle = bgColor;
    ctx.fill();

    if (isActive || isHovered) {
        ctx.shadowColor = "rgba(80, 100, 255, 0.2)";
        ctx.shadowBlur = 4;
        ctx.strokeStyle = "rgba(80, 100, 255, 0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
    }

    const padding = 4;
    const iconSize = 14;
    const iconX = x + (width - iconSize) / 2;
    const iconY = y + (height - iconSize) / 2;

    try {
        const img = new Image();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);

        if (img.complete) {
            ctx.drawImage(img, iconX, iconY, iconSize, iconSize);
        } else {
            img.onload = () => {
                ctx.drawImage(img, iconX, iconY, iconSize, iconSize);
                if (node) node.setDirtyCanvas(true);
            };
        }
    } catch (error) {
        console.error('SVG çizim hatası:', error);
    }

    if (isHovered && tooltip) {
        const tooltipPadding = 4;
        const tooltipHeight = 16;
        
        ctx.font = "10px Inter, Arial";
        const tooltipWidth = ctx.measureText(tooltip).width + (tooltipPadding * 2);
        
        const tooltipX = x + (width - tooltipWidth) / 2;
        const tooltipY = y + height + 4;
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.beginPath();
        ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 2);
        ctx.fill();
        
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tooltip, tooltipX + tooltipWidth/2, tooltipY + tooltipHeight/2);
    }
}

const textMetricsCache = new Map();
let tempCanvas = null;
let tempCtx = null;

function getTextMetrics(text, font) {
    const cacheKey = `${text}_${font}`;
    if (textMetricsCache.has(cacheKey)) {
        return textMetricsCache.get(cacheKey);
    }

    if (!tempCanvas) {
        tempCanvas = document.createElement('canvas');
        tempCtx = tempCanvas.getContext('2d');
    }

    tempCtx.font = font;
    const metrics = tempCtx.measureText(text);
    textMetricsCache.set(cacheKey, metrics);
    return metrics;
}

function drawHorizontalSlider(ctx, x, y, width, value, min, max, label) {
    const height = 48;
    const trackHeight = 4;
    const handleSize = 12;
    const labelSize = 12;
    const valueSize = labelSize;
    
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.roundRect(x, y, width, 24, 4);
    ctx.fill();
    
    ctx.fillStyle = "#bbb";
    ctx.font = `${labelSize}px Inter, Arial`;
    ctx.textAlign = "left";
    ctx.fillText(label, x + 4, y + 16);

    ctx.textAlign = "right";
    ctx.fillStyle = "#4a9eff";
    ctx.font = `${valueSize}px Inter, Arial`;
    ctx.fillText(Math.round(value), x + width - 4, y + 16);
    
    const trackY = y + 32;
    ctx.beginPath();
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.roundRect(x, trackY - trackHeight/2, width, trackHeight, 3);
    ctx.fill();
    
    const progress = (value - min) / (max - min);
    const gradient = ctx.createLinearGradient(x, trackY, x + width * progress, trackY);
    gradient.addColorStop(0, "#4a9eff");
    gradient.addColorStop(1, "#0066cc");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, trackY - trackHeight/2, width * progress, trackHeight, 3);
    ctx.fill();
    
    const handleX = x + (width * progress);
    const handleY = trackY;
    
    if (this?.uiState?.hoveredSlider === label || this?.isDraggingSlider === "x") {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(74, 158, 255, 0.2)";
        ctx.lineWidth = handleSize + 8;
        ctx.arc(handleX, handleY, handleSize/4, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    ctx.beginPath();
    ctx.fillStyle = "#fff";
    ctx.arc(handleX, handleY, handleSize/2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.strokeStyle = "#4a9eff";
    ctx.lineWidth = 2;
    ctx.arc(handleX, handleY, handleSize/2, 0, Math.PI * 2);
    ctx.stroke();
}

function drawVerticalSlider(ctx, x, y, height, value, min, max, label) {
    const width = 24;
    const trackWidth = 4;
    const handleSize = 12;
    const labelSize = 12;
    
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.roundRect(x, y - 24, width, 20, 4);
    ctx.fill();
    
    ctx.save();
    ctx.fillStyle = "#bbb";
    ctx.font = `${labelSize}px Inter, Arial`;
    ctx.textAlign = "center";
    ctx.fillText(label, x + width/2, y - 8);
    ctx.restore();
    
    const trackX = x + width/2;
    ctx.beginPath();
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.roundRect(trackX - trackWidth/2, y, trackWidth, height, 3);
    ctx.fill();
    
    const progress = (value - min) / (max - min);
    const progressHeight = height * (1 - progress);
    const gradient = ctx.createLinearGradient(trackX, y + height, trackX, y + progressHeight);
    gradient.addColorStop(0, "#4a9eff");
    gradient.addColorStop(1, "#0066cc");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(trackX - trackWidth/2, y + progressHeight, trackWidth, height - progressHeight, 3);
    ctx.fill();
    
    const handleX = trackX;
    const handleY = y + progressHeight;
    
    if (this?.uiState?.hoveredSlider === label || this?.isDraggingSlider === "y") {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(74, 158, 255, 0.2)";
        ctx.lineWidth = handleSize + 8;
        ctx.arc(handleX, handleY, handleSize/4, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    ctx.beginPath();
    ctx.fillStyle = "#fff";
    ctx.arc(handleX, handleY, handleSize/2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.strokeStyle = "#4a9eff";
    ctx.lineWidth = 2;
    ctx.arc(handleX, handleY, handleSize/2, 0, Math.PI * 2);
    ctx.stroke();
}

app.registerExtension({
    name: "SKB.TextBox",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeType.comfyClass === "TextBox") {
            // Sadece bir kere style ekle
            if (!document.getElementById('skb-textbox-styles')) {
                const style = document.createElement('style');
                style.id = 'skb-textbox-styles';
                style.textContent = STYLES;
                document.head.appendChild(style);
            }

            Object.assign(nodeType.prototype, {
                onNodeCreated() {
                    const buttonSize = 20;
                    const buttonPadding = 3;
                    const buttonSpacing = 2;
                    
                    const lastButtonX = 350;
                    
                    const minWidth = lastButtonX + buttonSize + 8;

                    this.size = [Math.max(400, minWidth), 300];

                    const config = {
                        text: ["STRING", { multiline: true, default: "", hidden: true }],
                        font_size: ["INT", { default: 32, min: 8, max: 128, hidden: true }],
                        text_color: ["STRING", { default: "#FFFFFF", hidden: true }],
                        text_gradient_start: ["STRING", { default: "", hidden: true }],
                        text_gradient_end: ["STRING", { default: "", hidden: true }],
                        text_gradient_angle: ["INT", { default: 0, min: 0, max: 360, hidden: true }],
                        background_color: ["STRING", { default: "#000000", hidden: true }],
                        width: ["INT", { default: 512, min: 64, max: 2048, hidden: true }],
                        height: ["INT", { default: 512, min: 64, max: 2048, hidden: true }],
                        position_x: ["FLOAT", { default: 256, min: 0, max: 512, step: 1, precision: 0, label: "X Position", hidden: true }],
                        position_y: ["FLOAT", { default: 256, min: 0, max: 512, step: 1, precision: 0, label: "Y Position", hidden: true }],
                        rotation: ["FLOAT", { default: 0.0, min: -360.0, max: 360.0, hidden: true }],
                        is_bold: ["BOOLEAN", { default: false, hidden: true }],
                        is_italic: ["BOOLEAN", { default: false, hidden: true }],
                        text_align: ["STRING", { default: "center", hidden: true }],
                        font_family: ["STRING", { default: "Arial", hidden: true }],
                        text_shadow: ["BOOLEAN", { default: false, hidden: true }],
                        text_outline: ["BOOLEAN", { default: false, hidden: true }],
                        outline_color: ["STRING", { default: "#000000", hidden: true }],
                        outline_width: ["INT", { default: 3, min: 1, max: 20, hidden: true }],
                        opacity: ["FLOAT", { default: 1.0, min: 0.0, max: 1.0, hidden: true }],
                        background_visible: ["BOOLEAN", { default: true, hidden: true }],
                        reflect_x: ["BOOLEAN", { default: false, hidden: true }],
                        reflect_y: ["BOOLEAN", { default: false, hidden: true }],
                        canvas_image: ["STRING", { default: "", hidden: true }]
                    };

                    this.widgets_by_name = {};
                    for (const [name, [type, options]] of Object.entries(config)) {
                        const widget = ComfyWidgets[type](this, name, [type, options], app);
                        this.widgets_by_name[name] = widget.widget;
                        if (options.hidden) {
                            widget.widget.type = "hidden";
                        }
                    }

                    this.uiState = {
                        text: "Enter Text",
                        position: { 
                            x: this.widgets_by_name.position_x.value,
                            y: this.widgets_by_name.position_y.value
                        },
                        rotation: 0,
                        scale: { x: 1, y: 1 },
                        isSelected: false,
                        isDragging: false,
                        dragStart: null,
                        hoveredButton: null,
                        bold: false,
                        italic: false,
                        align: "center",
                        fontSize: 32,
                        textColor: "#FFFFFF",
                        backgroundColor: "#000000",
                        backgroundVisible: true,
                        canvasWidth: 512,
                        canvasHeight: 512,
                        fontFamily: "Arial",
                        fontStyle: "normal",
                        textShadow: false,
                        textOutline: false,
                        outlineColor: "#000000",
                        outlineWidth: 3,
                        borderRadius: 0,
                        reflectX: false,
                        reflectY: false,
                        isCompact: false
                    };

                    this.updateWidgets = () => {
                        if (this.widgets_by_name.text) {
                            Object.entries({
                                text: this.uiState.text,
                                position_x: Math.round(this.uiState.position.x),
                                position_y: Math.round(this.uiState.position.y),
                                rotation: this.uiState.rotation,
                                is_bold: this.uiState.bold,
                                is_italic: this.uiState.italic,
                                text_align: this.uiState.align,
                                font_size: this.uiState.fontSize,
                                text_color: this.uiState.textColor,
                                background_color: this.uiState.backgroundColor,
                                text_outline: this.uiState.textOutline,
                                outline_color: this.uiState.outlineColor,
                                outline_width: this.uiState.outlineWidth,
                                reflect_x: this.uiState.reflectX,
                                reflect_y: this.uiState.reflectY
                            }).forEach(([key, value]) => {
                                if (this.widgets_by_name[key]) {
                                    this.widgets_by_name[key].value = value;
                                }
                            });
                            this.serialize_widgets();
                        }
                    };

                    this.openOutlineDialog = () => {
                        const dialog = document.createElement("div");
                        dialog.style.cssText = `
                            position: fixed;
                            left: 50%;
                            top: 50%;
                            transform: translate(-50%, -50%);
                            background: #1e1e1e;
                            border: 1px solid #4a9eff;
                            padding: 20px;
                            border-radius: 4px;
                            z-index: 10000;
                            min-width: 300px;
                        `;

                        const currentColor = this.uiState.outlineColor || "#000000";
                        const currentWidth = this.uiState.outlineWidth || 3;

                        dialog.innerHTML = `
                            <div style="margin-bottom: 20px;">
                                <h3 style="color: #fff; margin: 0 0 15px 0; font-size: 16px;">Outline Settings</h3>
                                
                                <div style="margin-bottom: 15px;">
                                    <label style="color: #ccc; display: block; margin-bottom: 5px;">Outline Color:</label>
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <input type="color" id="outlineColor" value="${currentColor}"
                                               style="width: 50px; height: 30px; padding: 0; border: none; background: none;">
                                        <input type="text" id="outlineColorText" value="${currentColor}"
                                               style="width: 80px; background: #2a2a2a; color: #fff; border: 1px solid #666; padding: 4px; border-radius: 3px;">
                                    </div>
                                </div>

                                <div style="margin-bottom: 15px;">
                                    <label style="color: #ccc; display: block; margin-bottom: 5px;">Outline Width:</label>
                                    <input type="range" id="outlineWidth" value="${currentWidth}" min="1" max="10" step="1"
                                           style="width: 100%; background: #2a2a2a;">
                                    <span id="outlineWidthValue" style="color: #fff; margin-left: 10px;">${currentWidth}px</span>
                                </div>

                                <div style="margin-bottom: 15px;">
                                    <label style="display: flex; align-items: center; gap: 8px; color: #ccc; cursor: pointer;">
                                        <input type="checkbox" id="outlineEnabled" ${this.uiState.textOutline ? 'checked' : ''}>
                                        <span>Enable Outline</span>
                                    </label>
                                </div>

                                <div style="display: flex; justify-content: flex-end; gap: 10px;">
                                    <button id="cancelBtn" style="padding: 6px 12px; border-radius: 4px; border: none; background: #333; color: #fff; cursor: pointer;">Cancel</button>
                                    <button id="okBtn" style="padding: 6px 12px; border-radius: 4px; border: none; background: #4a9eff; color: #fff; cursor: pointer;">OK</button>
                                </div>
                            </div>
                        `;

                        document.body.appendChild(dialog);

                        const outlineColorInput = dialog.querySelector("#outlineColor");
                        const outlineColorText = dialog.querySelector("#outlineColorText");
                        const outlineWidthInput = dialog.querySelector("#outlineWidth");
                        const outlineWidthValue = dialog.querySelector("#outlineWidthValue");
                        const outlineEnabledInput = dialog.querySelector("#outlineEnabled");
                        const okButton = dialog.querySelector("#okBtn");
                        const cancelButton = dialog.querySelector("#cancelBtn");

                        outlineColorInput.oninput = () => {
                            outlineColorText.value = outlineColorInput.value;
                        };
                        outlineColorText.oninput = () => {
                            if (/^#[0-9A-F]{6}$/i.test(outlineColorText.value)) {
                                outlineColorInput.value = outlineColorText.value;
                            }
                        };

                        outlineWidthInput.oninput = () => {
                            outlineWidthValue.textContent = `${outlineWidthInput.value}px`;
                        };

                        okButton.onclick = () => {
                            this.uiState.textOutline = outlineEnabledInput.checked;
                            this.uiState.outlineColor = outlineColorInput.value;
                            this.uiState.outlineWidth = parseInt(outlineWidthInput.value);
                            
                            if (this.widgets_by_name) {
                                if (this.widgets_by_name.text_outline) {
                                    this.widgets_by_name.text_outline.value = outlineEnabledInput.checked;
                                }
                                if (this.widgets_by_name.outline_color) {
                                    this.widgets_by_name.outline_color.value = outlineColorInput.value;
                                }
                                if (this.widgets_by_name.outline_width) {
                                    this.widgets_by_name.outline_width.value = parseInt(outlineWidthInput.value);
                                }
                            }
                            
                            this.setDirtyCanvas(true);
                            this.serialize_widgets();
                            document.body.removeChild(dialog);
                        };

                        cancelButton.onclick = () => {
                            document.body.removeChild(dialog);
                        };
                    };

                    this.serialize_widgets = () => {
                        if (this.widgets_by_name.reflect_x) {
                            this.widgets_by_name.reflect_x.value = this.uiState.reflectX;
                        }
                        if (this.widgets_by_name.reflect_y) {
                            this.widgets_by_name.reflect_y.value = this.uiState.reflectY;
                        }

                        const base64Image = this.getCanvasImage();
                        if (this.widgets_by_name.canvas_image && base64Image) {
                            this.widgets_by_name.canvas_image.value = base64Image;
                        }

                        if (this.onExecuted) {
                            app.graph.runStep(this);
                        }
                    };

                    this.updateWidgets();

                    this.tools = [
                        { 
                            icon: SVG.edit, 
                            x: 4,
                            tooltip: "Edit Text",
                            action: () => {
                                const currentText = this.widgets_by_name.text?.value || this.uiState.text || "";
                                const newText = prompt("Enter text:", currentText);
                                if (newText !== null) {
                                    if (this.widgets_by_name.text) {
                                        this.widgets_by_name.text.value = newText;
                                        this.uiState.text = newText;
                                    }
                                    this.setDirtyCanvas(true);
                                    this.serialize_widgets();
                                }
                            }
                        },
                        { type: 'divider', x: 28 },
                        {
                            icon: SVG.move,
                            x: 32,
                            tooltip: "Set Position",
                            action: () => {
                                this.openMoveDialog();
                            }
                        },
                        { type: 'divider', x: 56 },
                        { 
                            icon: SVG.alignLeft, 
                            x: 60,
                            tooltip: "Align Left",
                            action: () => {
                                this.updateToolbarButton('align', 'left');
                            }
                        },
                        { 
                            icon: SVG.alignCenter, 
                            x: 84,
                            tooltip: "Center",
                            action: () => {
                                this.updateToolbarButton('align', 'center');
                            }
                        },
                        { 
                            icon: SVG.alignRight, 
                            x: 108,
                            tooltip: "Align Right",
                            action: () => {
                                this.updateToolbarButton('align', 'right');
                            }
                        },
                        { type: 'divider', x: 132 },
                        { 
                            icon: SVG.bold, 
                            x: 136,
                            tooltip: "Bold",
                            action: () => {
                                this.updateToolbarButton('bold', !this.uiState.bold);
                            }
                        },
                        { 
                            icon: SVG.italic, 
                            x: 160,
                            tooltip: "Italic",
                            action: () => {
                                this.updateToolbarButton('italic', !this.uiState.italic);
                            }
                        },
                        { type: 'divider', x: 184 },
                        { 
                            icon: SVG.fontSize, 
                            x: 188,
                            tooltip: "Font Size",
                            action: () => {
                                this.openFontSizeDialog();
                            }
                        },
                        { 
                            icon: SVG.font, 
                            x: 212,
                            tooltip: "Font Type",
                            action: () => {
                                this.openFontDialog();
                            }
                        },
                        { type: 'divider', x: 236 },
                        { 
                            icon: SVG.color, 
                            x: 240,
                            tooltip: "Text Color",
                            action: () => {
                                this.openColorDialog();
                            }
                        },
                        { 
                            icon: SVG.shadow, 
                            x: 264,
                            tooltip: "Shadow",
                            action: () => {
                                this.openShadowDialog();
                            }
                        },
                        { 
                            icon: SVG.outline, 
                            x: 288,
                            tooltip: "Outline",
                            action: () => {
                                this.openOutlineDialog();
                            }
                        },
                        { type: 'divider', x: 312 },
                        { 
                            icon: SVG.rotate, 
                            x: 316,
                            tooltip: "Rotate",
                            action: () => {
                                this.openRotationDialog();
                            }
                        },
                        { 
                            icon: SVG.reflectX, 
                            x: 340,
                            tooltip: "Reflect Horizontally",
                            action: () => {
                                this.uiState.reflectX = !this.uiState.reflectX;
                                this.uiState.scale.x *= -1;
                                if (this.widgets_by_name && this.widgets_by_name.reflect_x) {
                                    this.widgets_by_name.reflect_x.value = this.uiState.reflectX;
                                }
                                this.setDirtyCanvas(true);
                                this.serialize_widgets();
                            }
                        },
                        { 
                            icon: SVG.reflectY, 
                            x: 364,
                            tooltip: "Reflect Vertically",
                            action: () => {
                                this.uiState.reflectY = !this.uiState.reflectY;
                                this.uiState.scale.y *= -1;
                                if (this.widgets_by_name && this.widgets_by_name.reflect_y) {
                                    this.widgets_by_name.reflect_y.value = this.uiState.reflectY;
                                }
                                this.setDirtyCanvas(true);
                                this.serialize_widgets();
                            }
                        },
                        { type: 'divider', x: 388 },
                        { 
                            icon: SVG.frame, 
                            x: 392,
                            tooltip: "Frame Settings",
                            action: () => {
                                this.openFrameSizeDialog();
                            }
                        },
                        { type: 'divider', x: 416 },
                        { 
                            icon: SVG.layout, 
                            x: 420,
                            tooltip: "Full Size",
                            action: () => {
                                this.uiState.isCompact = false;
                                this.size[1] = 600;
                                this.setDirtyCanvas(true);
                            }
                        },
                        { 
                            icon: SVG.compact, 
                            x: 444,
                            tooltip: "Compact Mode",
                            action: () => {
                                this.uiState.isCompact = true;
                                this.size[1] = 300;
                                this.setDirtyCanvas(true);
                            }
                        }
                    ];

                    this.isDragging = false;
                    this.startX = 0;
                    this.startY = 0;
                    this.startPosX = 0;
                    this.startPosY = 0;

                    const handleGlobalMouseUp = () => {
                        if (this.isDragging) {
                            this.isDragging = false;
                            this.widgets_by_name.position_x.value = Math.round(this.uiState.position.x);
                            this.widgets_by_name.position_y.value = Math.round(this.uiState.position.y);
                            this.serialize_widgets();
                            this.setDirtyCanvas(true);
                        }
                    };

                    document.addEventListener('mouseup', handleGlobalMouseUp);
                    
                    const oldOnRemoved = this.onRemoved;
                    this.onRemoved = () => {
                        document.removeEventListener('mouseup', handleGlobalMouseUp);
                        if (oldOnRemoved) oldOnRemoved.call(this);
                    };
                },

                onDrawForeground(ctx) {
                    if (!this.flags.collapsed) {
                        try {
                            const nodeWidth = this.size[0] || 400;
                            const nodeHeight = this.size[1] || 300;
                            const toolbarHeight = 40;
                            const cornerRadius = 10;

                            ctx.save();
                            
                            ctx.fillStyle = "#151515";
                            ctx.beginPath();
                            ctx.roundRect(0, 0, nodeWidth, nodeHeight, cornerRadius);
                            ctx.fill();

                            const canvasX = 10;
                            const canvasY = toolbarHeight + 10;
                            const canvasWidth = nodeWidth - 20;
                            const canvasHeight = nodeHeight - toolbarHeight - 20;

                            if (this.uiState.backgroundVisible) {
                                ctx.fillStyle = this.uiState.backgroundColor;
                                ctx.fillRect(canvasX, canvasY, canvasWidth, canvasHeight);
                            }

                            const realWidth = this.widgets_by_name.width.value;
                            const realHeight = this.widgets_by_name.height.value;
                            const scale = Math.min(canvasWidth / realWidth, canvasHeight / realHeight);
                            const scaledWidth = realWidth * scale;
                            const scaledHeight = realHeight * scale;
                            const offsetX = canvasX + (canvasWidth - scaledWidth) / 2;
                            const offsetY = canvasY + (canvasHeight - scaledHeight) / 2;

                            ctx.strokeStyle = "rgba(80, 100, 255, 0.8)";
                            ctx.lineWidth = 2;
                            ctx.strokeRect(canvasX, canvasY, canvasWidth, canvasHeight);

                            ctx.strokeStyle = "rgba(255, 100, 100, 0.8)";
                            ctx.lineWidth = 2;
                            ctx.setLineDash([5, 5]);
                            ctx.strokeRect(offsetX, offsetY, scaledWidth, scaledHeight);
                            ctx.setLineDash([]);

                            ctx.strokeStyle = "rgba(80, 100, 255, 0.2)";
                            ctx.lineWidth = 1;
                            const gridSize = Math.max(20 * scale, 10);
                            
                            for(let y = offsetY; y <= offsetY + scaledHeight; y += gridSize) {
                                ctx.beginPath();
                                ctx.moveTo(offsetX, y);
                                ctx.lineTo(offsetX + scaledWidth, y);
                                ctx.stroke();
                            }
                            
                            for(let x = offsetX; x <= offsetX + scaledWidth; x += gridSize) {
                                ctx.beginPath();
                                ctx.moveTo(x, offsetY);
                                ctx.lineTo(x, offsetY + scaledHeight);
                                ctx.stroke();
                            }

                            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
                            ctx.lineWidth = 1;
                            ctx.setLineDash([5, 5]);
                            ctx.beginPath();
                            ctx.moveTo(offsetX + scaledWidth/2, offsetY);
                            ctx.lineTo(offsetX + scaledWidth/2, offsetY + scaledHeight);
                            ctx.moveTo(offsetX, offsetY + scaledHeight/2);
                            ctx.lineTo(offsetX + scaledWidth, offsetY + scaledHeight/2);
                            ctx.stroke();
                            ctx.setLineDash([]);

                            ctx.font = "bold 14px Arial";
                            ctx.fillStyle = "#fff";
                            ctx.textAlign = "left";
                            ctx.fillText(`Canvas: ${realWidth}x${realHeight}`, offsetX + 10, offsetY + 25);
                            ctx.fillText(`Scale: ${Math.round(scale * 100)}%`, offsetX + 10, offsetY + 45);

                            this.drawToolbar(ctx, nodeWidth, toolbarHeight, cornerRadius);

                            const text = this.widgets_by_name.text?.value || this.uiState.text || "Enter Text";
                            if (text) {
                                ctx.save();
                                
                                ctx.translate(offsetX, offsetY);

                                let fontStyle = "";
                                if (this.uiState.bold) fontStyle += "bold ";
                                if (this.uiState.italic) fontStyle += "italic ";
                                ctx.font = `${fontStyle}${this.uiState.fontSize}px ${this.uiState.fontFamily}`;
                                ctx.fillStyle = this.uiState.textColor;
                                
                                const lines = text.split('\n');
                                const lineHeight = this.uiState.fontSize + 4;
                                const totalHeight = lines.length * lineHeight;
                                let maxWidth = 0;

                                lines.forEach(line => {
                                    const metrics = ctx.measureText(line);
                                    maxWidth = Math.max(maxWidth, metrics.width);
                                });

                                const textX = (this.uiState.position.x / realWidth) * scaledWidth;
                                const textY = (this.uiState.position.y / realHeight) * scaledHeight;

                                ctx.scale(scale, scale);

                                ctx.translate(textX / scale, textY / scale);
                                ctx.rotate(this.uiState.rotation * Math.PI / 180);
                                ctx.scale(this.uiState.scale.x, this.uiState.scale.y);

                                ctx.textAlign = this.uiState.align;
                                ctx.textBaseline = "middle";
                                
                                let alignOffsetX = 0;
                                const padding = 20;
                                switch(this.uiState.align) {
                                    case "left":
                                        alignOffsetX = -maxWidth/2 + padding;
                                        break;
                                    case "right":
                                        alignOffsetX = maxWidth/2 - padding;
                                        break;
                                    default:
                                        alignOffsetX = 0;
                                }
                                
                                lines.forEach((line, i) => {
                                    const y = -totalHeight/2 + i * lineHeight + lineHeight/2;
                                    
                                    if (this.uiState.textShadow) {
                                        ctx.save();
                                        ctx.shadowColor = this.uiState.shadowColor || "rgba(0, 0, 0, 0.5)";
                                        ctx.shadowBlur = this.uiState.shadowBlur || 4;
                                        ctx.shadowOffsetX = (this.uiState.shadowOffsetX || 2) * this.uiState.scale.x;
                                        ctx.shadowOffsetY = (this.uiState.shadowOffsetY || 2) * this.uiState.scale.y;
                                        ctx.fillStyle = this.uiState.textColor;
                                        ctx.fillText(line, alignOffsetX, y);
                                        ctx.restore();
                                    }
                                    
                                    if (this.uiState.textOutline) {
                                        ctx.save();
                                        ctx.strokeStyle = this.uiState.outlineColor;
                                        ctx.lineWidth = this.uiState.outlineWidth;
                                        ctx.lineJoin = "round";
                                        
                                        const steps = 16;
                                        for (let j = 0; j < steps; j++) {
                                            const angle = (j / steps) * Math.PI * 2;
                                            const dx = Math.cos(angle) * this.uiState.outlineWidth * 0.5;
                                            const dy = Math.sin(angle) * this.uiState.outlineWidth * 0.5;
                                            ctx.strokeText(line, alignOffsetX + dx, y + dy);
                                        }
                                        ctx.restore();
                                    }
                                    
                                    if (this.uiState.textGradient) {
                                        ctx.save();
                                        const gradientWidth = maxWidth;
                                        const gradientHeight = totalHeight;
                                        const centerX = alignOffsetX;
                                        const centerY = y;
                                        
                                        const angle = ((this.uiState.textGradient.angle - 90) % 360) * (Math.PI / 180);
                                        
                                        const dx = Math.cos(angle);
                                        const dy = Math.sin(angle);
                                        
                                        const length = Math.sqrt(gradientWidth * gradientWidth + gradientHeight * gradientHeight);
                                        
                                        const startX = centerX - dx * length / 2;
                                        const startY = centerY - dy * length / 2;
                                        const endX = centerX + dx * length / 2;
                                        const endY = centerY + dy * length / 2;
                                        
                                        const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
                                        gradient.addColorStop(0, this.uiState.textGradient.start);
                                        gradient.addColorStop(1, this.uiState.textGradient.end);
                                        
                                        ctx.fillStyle = gradient;
                                        ctx.fillText(line, alignOffsetX, y);
                                        ctx.restore();
                                    } else {
                                    ctx.fillStyle = this.uiState.textColor;
                                    ctx.fillText(line, alignOffsetX, y);
                                    }
                                });
                                
                                ctx.restore();
                            }

                            ctx.restore();

                        } catch (error) {
                            console.error("onDrawForeground error:", error);
                            ctx.fillStyle = "#151515";
                            ctx.fillRect(0, 0, this.size[0] || 400, this.size[1] || 300);
                        }
                    }
                },

                drawToolbar(ctx, nodeWidth, toolbarHeight, cornerRadius) {
                    const toolbarGradient = ctx.createLinearGradient(0, 0, 0, toolbarHeight);
                    toolbarGradient.addColorStop(0, "#1d1d1d");
                    toolbarGradient.addColorStop(1, "#1a1a1a");
                    ctx.fillStyle = toolbarGradient;
                    ctx.beginPath();
                    ctx.roundRect(0, 0, nodeWidth, toolbarHeight, [cornerRadius, cornerRadius, 0, 0]);
                    ctx.fill();

                    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
                    ctx.shadowBlur = 3;
                    ctx.shadowOffsetY = 1;
                    ctx.beginPath();
                    ctx.moveTo(0, toolbarHeight);
                    ctx.lineTo(nodeWidth, toolbarHeight);
                    ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    ctx.shadowColor = "transparent";
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetY = 0;

                    this.tools.forEach(tool => {
                        if (tool.type === 'divider') {
                            const divGradient = ctx.createLinearGradient(0, 6, 0, 24);
                            divGradient.addColorStop(0, "rgba(80, 100, 255, 0.1)");
                            divGradient.addColorStop(0.5, "rgba(80, 100, 255, 0.2)");
                            divGradient.addColorStop(1, "rgba(80, 100, 255, 0.1)");
                            ctx.fillStyle = divGradient;
                            ctx.fillRect(tool.x, 6, 1, 18);
                        } else {
                            const isHovered = this.uiState.hoveredButton === tool.icon;
                            const isActive = this.isToolActive(tool);
                            drawToolbarButton(ctx, tool.x, 3, 20, 20, tool.icon, this, isActive, isHovered, tool.tooltip);
                        }
                    });
                },

                isToolActive(tool) {
                    return (tool.icon === SVG.alignLeft && this.uiState.align === 'left') ||
                           (tool.icon === SVG.alignCenter && this.uiState.align === 'center') ||
                           (tool.icon === SVG.alignRight && this.uiState.align === 'right') ||
                           (tool.icon === SVG.bold && this.uiState.bold) ||
                           (tool.icon === SVG.italic && this.uiState.italic) ||
                           (tool.icon === SVG.shadow && this.uiState.textShadow) ||
                           (tool.icon === SVG.outline && this.uiState.textOutline) ||
                           (tool.icon === SVG.reflectX && this.uiState.reflectX) ||
                           (tool.icon === SVG.reflectY && this.uiState.reflectY);
                },

                onMouseDown(e) {
                    const localX = e.canvasX - this.pos[0];
                    const localY = e.canvasY - this.pos[1];
                    const toolbarHeight = 26;

                    if (localY <= toolbarHeight) {
                        for (const tool of this.tools) {
                            if (tool.type === 'divider') continue;
                            
                            if (localX >= tool.x && localX <= tool.x + 20 &&
                                localY >= 3 && localY <= 23) {
                                if (tool.action) {
                                    tool.action.call(this);
                                    this.setDirtyCanvas(true);
                                    return true;
                                }
                            }
                        }
                        return false;
                    }

                    return false;
                },

                onMouseMove(e) {
                    const localX = e.canvasX - this.pos[0];
                    const localY = e.canvasY - this.pos[1];
                    const toolbarHeight = 26;

                    if (localY <= toolbarHeight) {
                        for (const tool of this.tools) {
                            if (tool.type === 'divider') continue;
                            
                            if (localX >= tool.x && localX <= tool.x + 20 &&
                                localY >= 3 && localY <= 23) {
                                if (this.uiState.hoveredButton !== tool.icon) {
                                    this.uiState.hoveredButton = tool.icon;
                                    this.setDirtyCanvas(true);
                                }
                                return true;
                            }
                        }
                        
                        if (this.uiState.hoveredButton) {
                            this.uiState.hoveredButton = null;
                            this.setDirtyCanvas(true);
                        }
                    }

                    return false;
                },

                onMouseUp(e) {
                    return false;
                },

                onMouseLeave(e) {
                    if (this.isDraggingSlider) {
                        this.isDraggingSlider = null;
                        this.dragStartX = null;
                        this.dragStartY = null;
                        this.dragStartValue = null;
                        
                        this.serialize_widgets();
                        this.setDirtyCanvas(true);
                    } else {
                        this.uiState.isSelected = false;
                        this.uiState.hoveredSlider = null;
                        this.uiState.hoveredButton = null;
                        this.setDirtyCanvas(true);
                    }
                },

                onDblClick(e) {
                    if (this.uiState.isSelected) {
                        const input = document.createElement("input");
                        input.value = this.widgets_by_name.text?.value || this.uiState.text;
                        input.style.position = "fixed";
                        
                        let x, y;
                        if (e && e.clientX && e.clientY) {
                            x = e.clientX;
                            y = e.clientY;
                        } else if (this.graph && this.graph.canvas) {
                            const rect = this.graph.canvas.getBoundingClientRect();
                            const scale = this.graph.canvas.ds?.scale || 1;
                            x = rect.left + (this.pos?.[0] || 0) * scale;
                            y = rect.top + (this.pos?.[1] || 0) * scale;
                        } else {
                            x = window.innerWidth/2;
                            y = window.innerHeight/2;
                        }
                        
                        input.style.left = (x - 50) + "px";
                        input.style.top = (y - 10) + "px";
                        input.style.width = "100px";
                        input.style.background = "#1e1e1e";
                        input.style.color = "#ffffff";
                        input.style.border = "1px solid #4a9eff";
                        input.style.outline = "none";
                        input.style.padding = "4px";
                        input.style.zIndex = "10000";
                        
                        document.body.appendChild(input);
                        input.focus();
                        input.select();
                        
                        const onBlur = () => {
                            if (this.widgets_by_name.text) {
                                this.widgets_by_name.text.value = input.value;
                                this.uiState.text = input.value;
                            }
                            document.body.removeChild(input);
                            this.setDirtyCanvas(true);
                            this.serialize_widgets();
                        };
                        
                        input.addEventListener("blur", onBlur);
                        input.addEventListener("keydown", (e) => {
                            if (e.key === "Enter") {
                                onBlur();
                            }
                        });
                    }
                },

                updateWidgets() {
                    if (this.widgets_by_name.text) {
                        const realWidth = this.widgets_by_name.width.value;
                        const realHeight = this.widgets_by_name.height.value;

                        this.uiState.position.x = Math.max(0, Math.min(realWidth, this.uiState.position.x));
                        this.uiState.position.y = Math.max(0, Math.min(realHeight, this.uiState.position.y));

                        const minDimension = Math.min(realWidth, realHeight);
                        const maxFontSize = Math.round(minDimension * 0.2);
                        this.uiState.fontSize = Math.min(this.uiState.fontSize, maxFontSize);

                        Object.entries({
                            text: this.uiState.text,
                            position_x: Math.round(this.uiState.position.x),
                            position_y: Math.round(this.uiState.position.y),
                            rotation: this.uiState.rotation,
                            is_bold: this.uiState.bold,
                            is_italic: this.uiState.italic,
                            text_align: this.uiState.align,
                            font_size: this.uiState.fontSize,
                            text_color: this.uiState.textColor,
                            background_color: this.uiState.backgroundColor,
                            text_outline: this.uiState.textOutline,
                            outline_color: this.uiState.outlineColor,
                            outline_width: this.uiState.outlineWidth,
                            reflect_x: this.uiState.reflectX,
                            reflect_y: this.uiState.reflectY
                        }).forEach(([key, value]) => {
                            if (this.widgets_by_name[key]) {
                                this.widgets_by_name[key].value = value;
                            }
                        });

                        const base64Image = this.getCanvasImage();
                        if (this.widgets_by_name.canvas_image && base64Image) {
                            this.widgets_by_name.canvas_image.value = base64Image;
                        }

                        if (this.onExecuted) {
                            app.graph.runStep(this);
                        }
                    }
                },

                updateToolbarButton(type, value) {
                    switch(type) {
                        case 'bold':
                            this.uiState.bold = value;
                            this.widgets_by_name.is_bold.value = value;
                            break;
                        case 'italic':
                            this.uiState.italic = value;
                            this.widgets_by_name.is_italic.value = value;
                            break;
                        case 'align':
                            this.uiState.align = value;
                            
                            const realWidth = this.widgets_by_name.width.value;
                            const realHeight = this.widgets_by_name.height.value;
                            
                            switch(value) {
                                case "left":
                                    this.uiState.position.x = realWidth * 0.25;
                                    break;
                                case "right":
                                    this.uiState.position.x = realWidth * 0.75;
                                    break;
                                default:
                                    this.uiState.position.x = realWidth * 0.5;
                            }
                            
                            this.uiState.position.y = realHeight * 0.5;
                            
                            this.widgets_by_name.position_x.value = Math.round(this.uiState.position.x);
                            this.widgets_by_name.position_y.value = Math.round(this.uiState.position.y);
                            break;
                    }
                    this.serialize_widgets();
                    this.setDirtyCanvas(true);
                },

                calculateDialogPosition(baseX, baseY, dialogWidth, dialogHeight) {
                    const screenPadding = 10;
                    const screenWidth = window.innerWidth;
                    const screenHeight = window.innerHeight;

                    let x = Math.max(screenPadding, baseX);
                    x = Math.min(x, screenWidth - dialogWidth - screenPadding);

                    let y = Math.max(screenPadding, baseY);
                    y = Math.min(y, screenHeight - dialogHeight - screenPadding);

                    return { x, y };
                },

                openFontSizeDialog() {
                    const dialog = document.createElement("div");
                    dialog.style.cssText = `
                        position: fixed;
                        left: 50%;
                        top: 50%;
                        transform: translate(-50%, -50%);
                        background: #1e1e1e;
                        border: 1px solid #4a9eff;
                        padding: 20px;
                        border-radius: 4px;
                        z-index: 10000;
                        min-width: 300px;
                    `;

                    dialog.innerHTML = `
                        <div style="margin-bottom: 15px;">
                            <label style="color: #ccc; display: block; margin-bottom: 5px;">Font Size:</label>
                            <input type="range" id="fontSize" value="${this.uiState.fontSize}" min="8" max="128" step="1"
                                   style="width: 200px; margin-right: 10px;">
                            <span id="fontSizeValue" style="color: #fff;">${this.uiState.fontSize}px</span>
                        </div>
                        <div style="text-align: right;">
                            <button id="cancel" style="margin-right: 10px; padding: 5px 15px; background: #333; color: #fff; border: none; border-radius: 3px;">Cancel</button>
                            <button id="ok" style="padding: 5px 15px; background: #4a9eff; color: #fff; border: none; border-radius: 3px;">OK</button>
                        </div>
                    `;

                    document.body.appendChild(dialog);

                    const slider = dialog.querySelector("#fontSize");
                    const valueDisplay = dialog.querySelector("#fontSizeValue");
                    const okButton = dialog.querySelector("#ok");
                    const cancelButton = dialog.querySelector("#cancel");

                    slider.oninput = () => {
                        valueDisplay.textContent = `${slider.value}px`;
                    };

                    okButton.onclick = () => {
                        this.uiState.fontSize = parseInt(slider.value);
                        this.widgets_by_name.font_size.value = parseInt(slider.value);
                        this.setDirtyCanvas(true);
                        this.serialize_widgets();
                        document.body.removeChild(dialog);
                    };

                    cancelButton.onclick = () => {
                        document.body.removeChild(dialog);
                    };
                },

                openRotationDialog() {
                    const dialog = document.createElement("div");
                    dialog.style.cssText = `
                        position: fixed;
                        left: 50%;
                        top: 50%;
                        transform: translate(-50%, -50%);
                        background: #1e1e1e;
                        border: 1px solid #4a9eff;
                        padding: 20px;
                        border-radius: 4px;
                        z-index: 10000;
                        min-width: 300px;
                    `;

                    dialog.innerHTML = `
                        <div style="margin-bottom: 15px;">
                            <label style="color: #ccc; display: block; margin-bottom: 5px;">Rotation:</label>
                            <input type="range" id="rotation" value="${this.uiState.rotation}" min="-180" max="180" step="1"
                                   style="width: 200px; margin-right: 10px;">
                            <span id="rotationValue" style="color: #fff;">${this.uiState.rotation}°</span>
                        </div>
                        <div style="text-align: right;">
                            <button id="cancel" style="margin-right: 10px; padding: 5px 15px; background: #333; color: #fff; border: none; border-radius: 3px;">Cancel</button>
                            <button id="ok" style="padding: 5px 15px; background: #4a9eff; color: #fff; border: none; border-radius: 3px;">OK</button>
                        </div>
                    `;

                    document.body.appendChild(dialog);

                    const slider = dialog.querySelector("#rotation");
                    const valueDisplay = dialog.querySelector("#rotationValue");
                    const okButton = dialog.querySelector("#ok");
                    const cancelButton = dialog.querySelector("#cancel");

                    slider.oninput = () => {
                        valueDisplay.textContent = `${slider.value}°`;
                    };

                    okButton.onclick = () => {
                        this.uiState.rotation = parseInt(slider.value);
                        this.widgets_by_name.rotation.value = parseInt(slider.value);
                        this.setDirtyCanvas(true);
                        this.serialize_widgets();
                        document.body.removeChild(dialog);
                    };

                    cancelButton.onclick = () => {
                        document.body.removeChild(dialog);
                    };
                },

                drawSelectionBox(ctx, text, x, y, maxWidth, totalHeight, align) {
                    const padding = 10;
                    
                    let boxX = x;
                    switch(align) {
                        case "left":
                            boxX = x + maxWidth/2;
                            break;
                        case "right":
                            boxX = x - maxWidth/2;
                            break;
                    }

                    ctx.strokeStyle = "rgba(80, 100, 255, 0.5)";
                    ctx.lineWidth = 1;
                    ctx.setLineDash([4, 4]);
                    ctx.beginPath();
                    ctx.roundRect(boxX - maxWidth/2 - padding, y - totalHeight/2 - padding, 
                                maxWidth + padding*2, totalHeight + padding*2, 4);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    const points = [
                        [boxX - maxWidth/2 - padding, y - totalHeight/2 - padding],
                        [boxX + maxWidth/2 + padding, y - totalHeight/2 - padding],
                        [boxX - maxWidth/2 - padding, y + totalHeight/2 + padding],
                        [boxX + maxWidth/2 + padding, y + totalHeight/2 + padding]
                    ];

                    points.forEach(([px, py]) => {
                        ctx.fillStyle = "#ffffff";
                        ctx.beginPath();
                        ctx.arc(px, py, 4, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.strokeStyle = "rgba(80, 100, 255, 0.5)";
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                    });

                    return points;
                },

                isPointInRotatedRect(px, py, rectX, rectY, rectWidth, rectHeight, angle) {
                    const s = Math.sin(-angle);
                    const c = Math.cos(-angle);
                    
                    const dx = px - rectX;
                    const dy = py - rectY;
                    
                    const rotatedX = dx * c - dy * s;
                    const rotatedY = dx * s + dy * c;

                    const halfWidth = rectWidth / 2;
                    const halfHeight = rectHeight / 2;
                    
                    const tolerance = 10;
                    
                    const inXBounds = Math.abs(rotatedX) <= (halfWidth + tolerance);
                    const inYBounds = Math.abs(rotatedY) <= (halfHeight + tolerance);
                    
                    const cornerTolerance = 15;
                    const isInCorner = (Math.abs(rotatedX) > halfWidth - cornerTolerance && 
                                       Math.abs(rotatedY) > halfHeight - cornerTolerance);
                    
                    return (inXBounds && inYBounds) || 
                           (isInCorner && Math.abs(rotatedX) <= halfWidth + cornerTolerance && 
                                         Math.abs(rotatedY) <= halfHeight + cornerTolerance);
                },

                onResize(size) {
                    this.size[0] = Math.max(400, size[0]);
                    this.size[1] = Math.max(300, size[1]);
                    this.setDirtyCanvas(true);
                },

                onDragEnd() {
                    this.setDirtyCanvas(true);
                },

                getBoundingRect() {
                    const canvas = this.graph?.canvas;
                    if (!canvas) {
                        return {
                            x: window.innerWidth/2,
                            y: window.innerHeight/2,
                            width: this.size?.[0] || 400,
                            height: this.size?.[1] || 300
                        };
                    }

                    const transform = canvas.ds ? canvas.ds.scale : 1;
                    const nodePos = this.pos || [window.innerWidth/2, window.innerHeight/2];
                    const nodeSize = this.size || [400, 300];

                    return {
                        x: nodePos[0],
                        y: nodePos[1],
                        width: nodeSize[0] * transform,
                        height: nodeSize[1] * transform
                    };
                },

                onMouseLeave(e) {
                    if (!this.isDragging) {
                        this.uiState.isSelected = false;
                        this.setDirtyCanvas(true);
                    }
                },

                onPropertyChanged(property, value) {
                    if (property === "position_x") {
                        this.uiState.position.x = value;
                        this.setDirtyCanvas(true);
                    }
                    else if (property === "position_y") {
                        this.uiState.position.y = value;
                        this.setDirtyCanvas(true);
                    }
                },

                openFrameSizeDialog() {
                    const currentWidth = this.widgets_by_name.width.value;
                    const currentHeight = this.widgets_by_name.height.value;
                    const currentBgColor = this.widgets_by_name.background_color.value;
                    const currentBgVisible = this.widgets_by_name.background_visible.value;

                    const dialog = document.createElement("div");
                    dialog.style.cssText = `
                        position: fixed;
                        left: 50%;
                        top: 50%;
                        transform: translate(-50%, -50%);
                        background: #1e1e1e;
                        border: 1px solid #4a9eff;
                        padding: 20px;
                        border-radius: 4px;
                        z-index: 10000;
                        min-width: 300px;
                    `;

                    dialog.innerHTML = `
                        <div style="margin-bottom: 20px;">
                            <h3 style="color: #fff; margin: 0 0 15px 0; font-size: 16px;">Frame Settings</h3>
                            
                        <div style="margin-bottom: 15px;">
                            <label style="color: #ccc; display: block; margin-bottom: 5px;">Width:</label>
                            <input type="number" id="width" value="${currentWidth}" min="64" max="2048" 
                                       style="width: 100px; background: #2a2a2a; color: #fff; border: 1px solid #666; padding: 4px; border-radius: 3px;">
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="color: #ccc; display: block; margin-bottom: 5px;">Height:</label>
                            <input type="number" id="height" value="${currentHeight}" min="64" max="2048"
                                       style="width: 100px; background: #2a2a2a; color: #fff; border: 1px solid #666; padding: 4px; border-radius: 3px;">
                        </div>

                            <div style="margin-bottom: 15px;">
                                <label style="color: #ccc; display: block; margin-bottom: 5px;">Background Color:</label>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <input type="color" id="bgColor" value="${currentBgColor}"
                                           style="width: 50px; height: 30px; padding: 0; border: none; background: none;">
                                    <input type="text" id="bgColorText" value="${currentBgColor}"
                                           style="width: 80px; background: #2a2a2a; color: #fff; border: 1px solid #666; padding: 4px; border-radius: 3px;">
                                </div>
                            </div>

                            <div style="margin-bottom: 15px;">
                                <label style="display: flex; align-items: center; gap: 8px; color: #ccc; cursor: pointer;">
                                    <input type="checkbox" id="bgVisible" ${currentBgVisible ? 'checked' : ''}
                                           style="width: 16px; height: 16px;">
                                    Show Background
                                </label>
                            </div>
                        </div>
                        
                        <div style="text-align: right; border-top: 1px solid #333; padding-top: 15px;">
                            <button id="cancel" style="margin-right: 10px; padding: 6px 15px; background: #333; color: #fff; border: none; border-radius: 3px; cursor: pointer;">Cancel</button>
                            <button id="ok" style="padding: 6px 15px; background: #4a9eff; color: #fff; border: none; border-radius: 3px; cursor: pointer;">OK</button>
                        </div>
                    `;

                    document.body.appendChild(dialog);

                    const okButton = dialog.querySelector("#ok");
                    const cancelButton = dialog.querySelector("#cancel");
                    const widthInput = dialog.querySelector("#width");
                    const heightInput = dialog.querySelector("#height");
                    const bgColorInput = dialog.querySelector("#bgColor");
                    const bgColorText = dialog.querySelector("#bgColorText");
                    const bgVisibleInput = dialog.querySelector("#bgVisible");

                    bgColorInput.oninput = () => {
                        bgColorText.value = bgColorInput.value;
                    };
                    bgColorText.oninput = () => {
                        if (/^#[0-9A-F]{6}$/i.test(bgColorText.value)) {
                            bgColorInput.value = bgColorText.value;
                        }
                    };

                    [okButton, cancelButton].forEach(button => {
                        button.onmouseover = () => {
                            button.style.opacity = "0.8";
                        };
                        button.onmouseout = () => {
                            button.style.opacity = "1";
                        };
                    });

                    okButton.onclick = () => {
                        const oldWidth = this.widgets_by_name.width.value;
                        const oldHeight = this.widgets_by_name.height.value;
                        
                        const newWidth = parseInt(widthInput.value);
                        const newHeight = parseInt(heightInput.value);
                        
                        const widthRatio = newWidth / oldWidth;
                        const heightRatio = newHeight / oldHeight;
                        
                        const currentX = this.uiState.position.x;
                        const currentY = this.uiState.position.y;
                        
                        const newX = Math.round(currentX * widthRatio);
                        const newY = Math.round(currentY * heightRatio);
                        
                        this.widgets_by_name.width.value = newWidth;
                        this.widgets_by_name.height.value = newHeight;
                        this.widgets_by_name.background_color.value = bgColorInput.value;
                        this.widgets_by_name.background_visible.value = bgVisibleInput.checked;
                        this.widgets_by_name.position_x.value = newX;
                        this.widgets_by_name.position_y.value = newY;
                        
                        this.uiState.canvasWidth = newWidth;
                        this.uiState.canvasHeight = newHeight;
                        this.uiState.backgroundColor = bgColorInput.value;
                        this.uiState.backgroundVisible = bgVisibleInput.checked;
                        this.uiState.position.x = newX;
                        this.uiState.position.y = newY;
                        
                        this.setDirtyCanvas(true);
                        this.serialize_widgets();
                        
                        document.body.removeChild(dialog);
                    };

                    cancelButton.onclick = () => {
                        document.body.removeChild(dialog);
                    };
                },

                openFontDialog() {
                    const fonts = [
                        "Roboto",
                        "Montserrat", 
                        "Open Sans",
                        "Lato",
                        "Poppins",
                        "Source Sans Pro",
                        "Ubuntu",
                        "Playfair Display",
                        "Arial",
                        "Times New Roman"
                    ];
                    
                    const dialog = document.createElement("div");
                    dialog.style.cssText = `
                        position: fixed;
                        left: 50%;
                        top: 50%;
                        transform: translate(-50%, -50%);
                        background: #1e1e1e;
                        border: 1px solid #4a9eff;
                        padding: 20px;
                        border-radius: 4px;
                        z-index: 10000;
                        min-width: 300px;
                        max-height: 80vh;
                        overflow-y: auto;
                    `;

                    const fontList = fonts.map(font => `
                        <div class="font-item" style="
                            padding: 12px;
                            cursor: pointer;
                            border-radius: 4px;
                            margin-bottom: 4px;
                            font-family: ${font};
                            color: #fff;
                            font-size: 16px;
                            background: ${this.uiState.fontFamily === font ? '#4a9eff' : '#2a2a2a'};
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            transition: all 0.2s ease;
                        ">
                            <span style="flex: 1;">${font}</span>
                            <span style="
                                font-family: ${font};
                                margin-left: 10px;
                                color: #aaa;
                                font-size: 20px;
                            ">AaBbCc</span>
                        </div>
                    `).join('');

                    dialog.innerHTML = `
                        <div style="margin-bottom: 15px;">
                            <h3 style="color: #fff; margin: 0 0 15px 0; font-size: 16px; display: flex; justify-content: space-between; align-items: center;">
                                <span>Select Font</span>
                                <span style="color: #aaa; font-size: 12px;">Current: ${this.uiState.fontFamily}</span>
                            </h3>
                            <div style="max-height: 400px; overflow-y: auto; margin: 0 -10px; padding: 0 10px;">
                                ${fontList}
                            </div>
                        </div>
                        <div style="text-align: right; margin-top: 15px; border-top: 1px solid #333; padding-top: 15px;">
                            <button id="cancel" style="
                                margin-right: 10px;
                                padding: 8px 16px;
                                background: #333;
                                color: #fff;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                transition: all 0.2s ease;
                            ">Cancel</button>
                        </div>
                    `;

                    document.body.appendChild(dialog);

                    const fontItems = dialog.querySelectorAll('.font-item');
                    fontItems.forEach(item => {
                        item.onmouseover = () => {
                            if (this.uiState.fontFamily !== item.querySelector('span').textContent) {
                                item.style.background = '#3a3a3a';
                            }
                        };
                        item.onmouseout = () => {
                            if (this.uiState.fontFamily !== item.querySelector('span').textContent) {
                                item.style.background = '#2a2a2a';
                            }
                        };
                        
                        item.onclick = () => {
                            const selectedFont = item.querySelector('span').textContent;
                            const currentBold = this.uiState.bold;
                            const currentItalic = this.uiState.italic;
                            
                            this.uiState.fontFamily = selectedFont;
                            this.widgets_by_name.font_family.value = selectedFont;
                            
                            this.uiState.bold = currentBold;
                            this.uiState.italic = currentItalic;
                            this.widgets_by_name.is_bold.value = currentBold;
                            this.widgets_by_name.is_italic.value = currentItalic;
                            
                            this.setDirtyCanvas(true);
                            this.serialize_widgets();
                            document.body.removeChild(dialog);
                        };
                    });

                    const cancelButton = dialog.querySelector("#cancel");
                    cancelButton.onmouseover = () => {
                        cancelButton.style.background = '#444';
                    };
                    cancelButton.onmouseout = () => {
                        cancelButton.style.background = '#333';
                    };
                    cancelButton.onclick = () => {
                        document.body.removeChild(dialog);
                    };
                },

                openShadowDialog() {
                    const dialog = document.createElement("div");
                    dialog.style.cssText = `
                        position: fixed;
                        left: 50%;
                        top: 50%;
                        transform: translate(-50%, -50%);
                        background: #1e1e1e;
                        border: 1px solid #4a9eff;
                        padding: 20px;
                        border-radius: 4px;
                        z-index: 10000;
                        min-width: 300px;
                    `;

                    const currentColor = this.uiState.shadowColor || "#000000";
                    const currentBlur = this.uiState.shadowBlur || 4;
                    const currentOffsetX = this.uiState.shadowOffsetX || 2;
                    const currentOffsetY = this.uiState.shadowOffsetY || 2;

                    dialog.innerHTML = `
                        <div style="margin-bottom: 20px;">
                            <h3 style="color: #fff; margin: 0 0 15px 0; font-size: 16px;">Gölge Ayarları</h3>
                            
                            <div style="margin-bottom: 15px;">
                                <label style="color: #ccc; display: block; margin-bottom: 5px;">Gölge Rengi:</label>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <input type="color" id="shadowColor" value="${currentColor}"
                                           style="width: 50px; height: 30px; padding: 0; border: none; background: none;">
                                    <input type="text" id="shadowColorText" value="${currentColor}"
                                           style="width: 80px; background: #2a2a2a; color: #fff; border: 1px solid #666; padding: 4px; border-radius: 3px;">
                                </div>
                            </div>

                            <div style="margin-bottom: 15px;">
                                <label style="color: #ccc; display: block; margin-bottom: 5px;">Bulanıklık:</label>
                                <input type="range" id="shadowBlur" value="${currentBlur}" min="0" max="20" step="1"
                                       style="width: 100%; background: #2a2a2a;">
                                <span id="shadowBlurValue" style="color: #fff; margin-left: 10px;">${currentBlur}px</span>
                            </div>

                            <div style="margin-bottom: 15px;">
                                <label style="color: #ccc; display: block; margin-bottom: 5px;">X Offset:</label>
                                <input type="range" id="shadowOffsetX" value="${currentOffsetX}" min="-20" max="20" step="1"
                                       style="width: 100%; background: #2a2a2a;">
                                <span id="shadowOffsetXValue" style="color: #fff; margin-left: 10px;">${currentOffsetX}px</span>
                            </div>

                            <div style="margin-bottom: 15px;">
                                <label style="color: #ccc; display: block; margin-bottom: 5px;">Y Offset:</label>
                                <input type="range" id="shadowOffsetY" value="${currentOffsetY}" min="-20" max="20" step="1"
                                       style="width: 100%; background: #2a2a2a;">
                                <span id="shadowOffsetYValue" style="color: #fff; margin-left: 10px;">${currentOffsetY}px</span>
                            </div>

                            <div style="margin-bottom: 15px;">
                                <label style="display: flex; align-items: center; gap: 8px; color: #ccc; cursor: pointer;">
                                    <input type="checkbox" id="shadowEnabled" ${this.uiState.textShadow ? 'checked' : ''}>
                                    <span>Enable Shadow</span>
                                </label>
                            </div>
                        </div>
                        
                        <div style="text-align: right; border-top: 1px solid #333; padding-top: 15px;">
                            <button id="cancel" style="margin-right: 10px; padding: 6px 15px; background: #333; color: #fff; border: none; border-radius: 3px; cursor: pointer;">Cancel</button>
                            <button id="ok" style="padding: 6px 15px; background: #4a9eff; color: #fff; border: none; border-radius: 3px; cursor: pointer;">OK</button>
                        </div>
                    `;

                    document.body.appendChild(dialog);

                    const okButton = dialog.querySelector("#ok");
                    const cancelButton = dialog.querySelector("#cancel");
                    const shadowColorInput = dialog.querySelector("#shadowColor");
                    const shadowColorText = dialog.querySelector("#shadowColorText");
                    const shadowBlurInput = dialog.querySelector("#shadowBlur");
                    const shadowBlurValue = dialog.querySelector("#shadowBlurValue");
                    const shadowOffsetXInput = dialog.querySelector("#shadowOffsetX");
                    const shadowOffsetXValue = dialog.querySelector("#shadowOffsetXValue");
                    const shadowOffsetYInput = dialog.querySelector("#shadowOffsetY");
                    const shadowOffsetYValue = dialog.querySelector("#shadowOffsetYValue");
                    const shadowEnabledInput = dialog.querySelector("#shadowEnabled");

                    shadowColorInput.oninput = () => {
                        shadowColorText.value = shadowColorInput.value;
                    };
                    shadowColorText.oninput = () => {
                        if (/^#[0-9A-F]{6}$/i.test(shadowColorText.value)) {
                            shadowColorInput.value = shadowColorText.value;
                        }
                    };

                    shadowBlurInput.oninput = () => {
                        shadowBlurValue.textContent = `${shadowBlurInput.value}px`;
                    };
                    shadowOffsetXInput.oninput = () => {
                        shadowOffsetXValue.textContent = `${shadowOffsetXInput.value}px`;
                    };
                    shadowOffsetYInput.oninput = () => {
                        shadowOffsetYValue.textContent = `${shadowOffsetYInput.value}px`;
                    };

                    okButton.onclick = () => {
                        this.uiState.textShadow = shadowEnabledInput.checked;
                        this.uiState.shadowColor = shadowColorInput.value;
                        this.uiState.shadowBlur = parseInt(shadowBlurInput.value);
                        this.uiState.shadowOffsetX = parseInt(shadowOffsetXInput.value);
                        this.uiState.shadowOffsetY = parseInt(shadowOffsetYInput.value);
                        
                        this.widgets_by_name.text_shadow.value = shadowEnabledInput.checked;
                        this.setDirtyCanvas(true);
                        this.serialize_widgets();
                        document.body.removeChild(dialog);
                    };

                    cancelButton.onclick = () => {
                        document.body.removeChild(dialog);
                    };
                },

                onSerialize(o) {
                    o.uiState = {
                        text: this.uiState.text,
                        position: this.uiState.position,
                        rotation: this.uiState.rotation,
                        scale: this.uiState.scale,
                        bold: this.uiState.bold,
                        italic: this.uiState.italic,
                        align: this.uiState.align,
                        fontSize: this.uiState.fontSize,
                        textColor: this.uiState.textColor,
                        backgroundColor: this.uiState.backgroundColor,
                        backgroundVisible: this.uiState.backgroundVisible,
                        canvasWidth: this.uiState.canvasWidth,
                        canvasHeight: this.uiState.canvasHeight,
                        fontFamily: this.uiState.fontFamily,
                        fontStyle: this.uiState.fontStyle,
                        textShadow: this.uiState.textShadow,
                        shadowColor: this.uiState.shadowColor,
                        shadowBlur: this.uiState.shadowBlur,
                        shadowOffsetX: this.uiState.shadowOffsetX,
                        shadowOffsetY: this.uiState.shadowOffsetY,
                        textOutline: this.uiState.textOutline,
                        outlineColor: this.uiState.outlineColor,
                        outlineWidth: this.uiState.outlineWidth,
                        reflectX: this.uiState.reflectX,
                        reflectY: this.uiState.reflectY,
                        isCompact: this.uiState.isCompact
                    };
                },

                onConfigure(o) {
                    if (o.uiState) {
                        this.uiState = {
                            text: o.uiState.text || "",
                            position: o.uiState.position || { x: 256, y: 256 },
                            rotation: o.uiState.rotation || 0,
                            scale: o.uiState.scale || { x: 1, y: 1 },
                            bold: o.uiState.bold || false,
                            italic: o.uiState.italic || false,
                            align: o.uiState.align || 'center',
                            fontSize: o.uiState.fontSize || 48,
                            textColor: o.uiState.textColor || '#ffffff',
                            backgroundColor: o.uiState.backgroundColor || '#000000',
                            backgroundVisible: o.uiState.backgroundVisible !== undefined ? o.uiState.backgroundVisible : true,
                            canvasWidth: o.uiState.canvasWidth || 512,
                            canvasHeight: o.uiState.canvasHeight || 512,
                            fontFamily: o.uiState.fontFamily || 'Arial',
                            fontStyle: o.uiState.fontStyle || 'normal',
                            textShadow: o.uiState.textShadow || false,
                            shadowColor: o.uiState.shadowColor || 'rgba(0, 0, 0, 0.5)',
                            shadowBlur: o.uiState.shadowBlur || 4,
                            shadowOffsetX: o.uiState.shadowOffsetX || 2,
                            shadowOffsetY: o.uiState.shadowOffsetY || 2,
                            textOutline: o.uiState.textOutline || false,
                            outlineColor: o.uiState.outlineColor || '#000000',
                            outlineWidth: o.uiState.outlineWidth || 3,
                            reflectX: o.uiState.reflectX || false,
                            reflectY: o.uiState.reflectY || false,
                            isCompact: o.uiState.isCompact || false,
                            hoveredButton: null
                        };
                        
                        if (this.uiState.isCompact) {
                            this.size[1] = 300;
                        } else {
                            this.size[1] = 600;
                        }
                    }
                },

                getCanvasImage() {
                    try {
                        const tempCanvas = document.createElement('canvas');
                        const width = this.widgets_by_name.width.value;
                        const height = this.widgets_by_name.height.value;
                        tempCanvas.width = width;
                        tempCanvas.height = height;
                        const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
                        
                        ctx.clearRect(0, 0, width, height);
                        
                        if (this.widgets_by_name.background_visible.value) {
                            ctx.fillStyle = this.uiState.backgroundColor;
                            ctx.fillRect(0, 0, width, height);
                        }

                        let fontStyle = "";
                        if (this.uiState.bold) fontStyle += "bold ";
                        if (this.uiState.italic) fontStyle += "italic ";
                        ctx.font = `${fontStyle}${this.uiState.fontSize}px ${this.uiState.fontFamily}`;
                        
                        const text = this.uiState.text;
                        const lines = text.split('\n');
                        const lineHeight = this.uiState.fontSize + 4;
                        const totalHeight = lines.length * lineHeight;
                        let maxWidth = 0;

                        lines.forEach(line => {
                            const metrics = ctx.measureText(line);
                            maxWidth = Math.max(maxWidth, metrics.width);
                        });

                        ctx.save();
                        
                        ctx.translate(this.uiState.position.x, this.uiState.position.y);
                        ctx.rotate(this.uiState.rotation * Math.PI / 180);
                        ctx.scale(this.uiState.scale.x, this.uiState.scale.y);
                        
                        ctx.textAlign = this.uiState.align;
                        ctx.textBaseline = "middle";
                        
                        let alignOffsetX = 0;
                        const padding = 20;
                        switch(this.uiState.align) {
                            case "left":
                                alignOffsetX = -maxWidth/2 + padding;
                                break;
                            case "right":
                                alignOffsetX = maxWidth/2 - padding;
                                break;
                            default:
                                alignOffsetX = 0;
                        }
                        
                        lines.forEach((line, i) => {
                            const y = -totalHeight/2 + i * lineHeight + lineHeight/2;
                            
                            if (this.uiState.textShadow) {
                                ctx.save();
                                ctx.shadowColor = this.uiState.shadowColor || "rgba(0, 0, 0, 0.5)";
                                ctx.shadowBlur = this.uiState.shadowBlur || 4;
                                ctx.shadowOffsetX = (this.uiState.shadowOffsetX || 2) * this.uiState.scale.x;
                                ctx.shadowOffsetY = (this.uiState.shadowOffsetY || 2) * this.uiState.scale.y;
                                ctx.fillStyle = this.uiState.textColor;
                                ctx.fillText(line, alignOffsetX, y);
                                ctx.restore();
                            }
                            
                            if (this.uiState.textOutline) {
                                ctx.save();
                                ctx.strokeStyle = this.uiState.outlineColor;
                                ctx.lineWidth = this.uiState.outlineWidth;
                                ctx.lineJoin = "round";
                                
                                const steps = 16;
                                for (let j = 0; j < steps; j++) {
                                    const angle = (j / steps) * Math.PI * 2;
                                    const dx = Math.cos(angle) * this.uiState.outlineWidth * 0.5;
                                    const dy = Math.sin(angle) * this.uiState.outlineWidth * 0.5;
                                    ctx.strokeText(line, alignOffsetX + dx, y + dy);
                                }
                                ctx.restore();
                            }
                            
                            if (this.uiState.textGradient) {
                                ctx.save();
                                const gradientWidth = maxWidth;
                                const gradientHeight = totalHeight;
                                const centerX = alignOffsetX;
                                const centerY = y;
                                
                                const angle = ((this.uiState.textGradient.angle - 90) % 360) * (Math.PI / 180);
                                
                                const dx = Math.cos(angle);
                                const dy = Math.sin(angle);
                                
                                const length = Math.sqrt(gradientWidth * gradientWidth + gradientHeight * gradientHeight);
                                
                                const startX = centerX - dx * length / 2;
                                const startY = centerY - dy * length / 2;
                                const endX = centerX + dx * length / 2;
                                const endY = centerY + dy * length / 2;
                                
                                const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
                                gradient.addColorStop(0, this.uiState.textGradient.start);
                                gradient.addColorStop(1, this.uiState.textGradient.end);
                                
                                ctx.fillStyle = gradient;
                                ctx.fillText(line, alignOffsetX, y);
                                ctx.restore();
                            } else {
                            ctx.fillStyle = this.uiState.textColor;
                            ctx.fillText(line, alignOffsetX, y);
                            }
                        });
                        
                        ctx.restore();
                        
                        return tempCanvas.toDataURL('image/png');
                    } catch (error) {
                        console.error("Error creating canvas image:", error);
                        return null;
                    }
                },

                updateWidgets() {
                    if (this.widgets_by_name.text) {
                        const base64Image = this.getCanvasImage();
                        this.widgets_by_name.canvas_image = { value: base64Image };
                        
                        this.serialize_widgets();
                    }
                },

                openMoveDialog() {
                    const dialog = document.createElement("div");
                    dialog.id = `textbox-dialog-${this.id}`;
                    dialog.className = "skb-textbox-dialog";
                    
                    const canvasWidth = this.widgets_by_name.width.value;
                    const canvasHeight = this.widgets_by_name.height.value;
                    const currentX = this.uiState.position.x;
                    const currentY = this.uiState.position.y;

                    dialog.innerHTML = `
                        <h3 style="color: #fff; margin: 0 0 15px 0; font-size: 16px;">Position Settings</h3>
                        <div class="skb-textbox-position-canvas">
                            <canvas id="positionCanvas" width="360" height="360"></canvas>
                            <div id="positionHandle" class="skb-textbox-handle">
                                <div class="skb-textbox-handle-center"></div>
                            </div>
                        </div>
                        <div class="skb-textbox-inputs">
                            <div>
                                <label>X Position:</label>
                                <input type="number" id="posX" value="${currentX}">
                            </div>
                            <div>
                                <label>Y Position:</label>
                                <input type="number" id="posY" value="${currentY}">
                            </div>
                        </div>
                        <div class="skb-textbox-buttons">
                            <button id="centerPos">Center</button>
                            <button id="resetPos">Reset</button>
                        </div>
                        <div class="skb-textbox-button-group">
                            <button id="cancel" class="secondary">Cancel</button>
                            <button id="ok" class="primary">OK</button>
                        </div>
                    `;

                    document.body.appendChild(dialog);

                    const canvas = dialog.querySelector("#positionCanvas");
                    const ctx = canvas.getContext("2d");
                    const handle = dialog.querySelector("#positionHandle");
                    const posXInput = dialog.querySelector("#posX");
                    const posYInput = dialog.querySelector("#posY");

                    function drawGrid() {
                        ctx.clearRect(0, 0, 360, 360);
                        
                        ctx.strokeStyle = "rgba(255,255,255,0.1)";
                        ctx.lineWidth = 1;
                        
                        for(let i = 0; i <= 360; i += 36) {
                            ctx.beginPath();
                            ctx.moveTo(i, 0);
                            ctx.lineTo(i, 360);
                            ctx.moveTo(0, i);
                            ctx.lineTo(360, i);
                            ctx.stroke();
                        }

                        ctx.strokeStyle = "rgba(255,255,255,0.3)";
                        ctx.setLineDash([5, 5]);
                        ctx.beginPath();
                        ctx.moveTo(180, 0);
                        ctx.lineTo(180, 360);
                        ctx.moveTo(0, 180);
                        ctx.lineTo(360, 180);
                        ctx.stroke();
                        ctx.setLineDash([]);
                    }

                    function updateHandlePosition(x, y) {
                        const scaleX = 360 / canvasWidth;
                        const scaleY = 360 / canvasHeight;
                        
                        const padding = 20;
                        const minX = padding;
                        const minY = padding;
                        const maxX = canvasWidth - padding;
                        const maxY = canvasHeight - padding;
                        
                        const clampedX = Math.max(minX, Math.min(maxX, x));
                        const clampedY = Math.max(minY, Math.min(maxY, y));
                        
                        handle.style.left = `${clampedX * scaleX}px`;
                        handle.style.top = `${clampedY * scaleY}px`;
                        posXInput.value = Math.round(clampedX);
                        posYInput.value = Math.round(clampedY);
                        
                        drawGrid();
                    }

                    drawGrid();
                    updateHandlePosition(currentX, currentY);

                    let isDragging = false;
                    
                    handle.addEventListener("mousedown", () => isDragging = true);
                    
                    document.addEventListener("mousemove", (e) => {
                        if (!isDragging) return;
                        
                        const rect = canvas.getBoundingClientRect();
                        const scaleX = canvasWidth / 360;
                        const scaleY = canvasHeight / 360;
                        
                        const x = (e.clientX - rect.left) * scaleX;
                        const y = (e.clientY - rect.top) * scaleY;
                        
                        updateHandlePosition(x, y);
                    });
                    
                    document.addEventListener("mouseup", () => isDragging = false);

                    posXInput.addEventListener("change", () => {
                        const x = Math.max(0, Math.min(canvasWidth, parseInt(posXInput.value) || 0));
                        const y = parseInt(posYInput.value) || 0;
                        updateHandlePosition(x, y);
                    });

                    posYInput.addEventListener("change", () => {
                        const x = parseInt(posXInput.value) || 0;
                        const y = Math.max(0, Math.min(canvasHeight, parseInt(posYInput.value) || 0));
                        updateHandlePosition(x, y);
                    });

                    dialog.querySelector("#centerPos").onclick = () => updateHandlePosition(canvasWidth/2, canvasHeight/2);
                    dialog.querySelector("#resetPos").onclick = () => updateHandlePosition(0, 0);
                    
                    dialog.querySelector("#ok").onclick = () => {
                        const x = parseInt(posXInput.value) || 0;
                        const y = parseInt(posYInput.value) || 0;
                        
                        this.uiState.position.x = x;
                        this.uiState.position.y = y;
                        this.widgets_by_name.position_x.value = x;
                        this.widgets_by_name.position_y.value = y;
                        
                        this.setDirtyCanvas(true);
                        this.serialize_widgets();
                        document.body.removeChild(dialog);
                    };

                    dialog.querySelector("#cancel").onclick = () => document.body.removeChild(dialog);
                },

                openColorDialog() {
                    const dialog = document.createElement("div");
                    dialog.style.cssText = `
                        position: fixed;
                        left: 50%;
                        top: 50%;
                        transform: translate(-50%, -50%);
                        background: #1e1e1e;
                        border: 1px solid #4a9eff;
                        padding: 20px;
                        border-radius: 4px;
                        z-index: 10000;
                        min-width: 300px;
                    `;

                    const presetColors = [
                        "#FFFFFF", "#000000", "#FF0000", "#00FF00", "#0000FF",
                        "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080"
                    ];

                    dialog.innerHTML = `
                        <div style="margin-bottom: 20px;">
                            <h3 style="color: #fff; margin: 0 0 15px 0; font-size: 16px;">Text Color Settings</h3>
                            
                            <div style="margin-bottom: 15px;">
                                <label style="color: #ccc; display: block; margin-bottom: 5px;">Solid Color:</label>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <input type="color" id="textColor" value="${this.uiState.textColor}"
                                           style="width: 50px; height: 30px; padding: 0; border: none; background: none;">
                                    <input type="text" id="textColorText" value="${this.uiState.textColor}"
                                           style="width: 80px; background: #2a2a2a; color: #fff; border: 1px solid #666; padding: 4px; border-radius: 3px;">
                                </div>
                            </div>

                            <div style="margin-bottom: 15px;">
                                <label style="color: #ccc; display: block; margin-bottom: 5px;">Preset Colors:</label>
                                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px;">
                                    ${presetColors.map(color => `
                                        <div class="color-preset" data-color="${color}" style="
                                            width: 100%;
                                            padding-bottom: 100%;
                                            background: ${color};
                                            border: 1px solid #666;
                                            border-radius: 3px;
                                            cursor: pointer;
                                            position: relative;
                                            overflow: hidden;
                                        ">
                                            ${color === this.uiState.textColor ? `
                                                <div style="
                                                    position: absolute;
                                                    top: 50%;
                                                    left: 50%;
                                                    transform: translate(-50%, -50%);
                                                    width: 16px;
                                                    height: 16px;
                                                    border: 2px solid ${color === '#FFFFFF' ? '#000' : '#fff'};
                                                    border-radius: 50%;
                                                "></div>
                                            ` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <div style="margin: 20px 0; border-top: 1px solid #333; padding-top: 20px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                    <label style="color: #ccc; font-weight: bold;">Gradient Mode</label>
                                    <label class="switch" style="
                                        position: relative;
                                        display: inline-block;
                                        width: 46px;
                                        height: 24px;
                                    ">
                                        <input type="checkbox" id="gradientToggle" ${this.uiState.textGradient ? 'checked' : ''} style="
                                            opacity: 0;
                                            width: 0;
                                            height: 0;
                                        ">
                                        <span style="
                                            position: absolute;
                                            cursor: pointer;
                                            top: 0;
                                            left: 0;
                                            right: 0;
                                            bottom: 0;
                                            background-color: #2a2a2a;
                                            transition: .4s;
                                            border-radius: 24px;
                                        ">
                                            <span style="
                                                position: absolute;
                                                content: '';
                                                height: 18px;
                                                width: 18px;
                                                left: 3px;
                                                bottom: 3px;
                                                background-color: white;
                                                transition: .4s;
                                                border-radius: 50%;
                                                transform: ${this.uiState.textGradient ? 'translateX(22px)' : 'translateX(0)'};
                                            "></span>
                                        </span>
                                    </label>
                                </div>

                                <div id="gradientControls" style="
                                    opacity: ${this.uiState.textGradient ? '1' : '0.5'};
                                    pointer-events: ${this.uiState.textGradient ? 'all' : 'none'};
                                    transition: opacity 0.3s;
                                ">
                                    <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                                        <div style="flex: 1;">
                                            <label style="color: #aaa; font-size: 12px; display: block; margin-bottom: 4px;">Start Color</label>
                                            <div style="display: flex; gap: 5px;">
                                                <input type="color" id="gradientStart" 
                                                       value="${this.uiState.textGradient?.start || '#FF0000'}"
                                                       style="width: 40px; height: 30px; padding: 0; border: none; background: none;">
                                                <input type="text" id="gradientStartText" 
                                                       value="${this.uiState.textGradient?.start || '#FF0000'}"
                                                       style="flex: 1; background: #2a2a2a; color: #fff; border: 1px solid #666; padding: 4px; border-radius: 3px;">
                                            </div>
                                        </div>
                                        <div style="flex: 1;">
                                            <label style="color: #aaa; font-size: 12px; display: block; margin-bottom: 4px;">End Color</label>
                                            <div style="display: flex; gap: 5px;">
                                                <input type="color" id="gradientEnd" 
                                                       value="${this.uiState.textGradient?.end || '#00FF00'}"
                                                       style="width: 40px; height: 30px; padding: 0; border: none; background: none;">
                                                <input type="text" id="gradientEndText" 
                                                       value="${this.uiState.textGradient?.end || '#00FF00'}"
                                                       style="flex: 1; background: #2a2a2a; color: #fff; border: 1px solid #666; padding: 4px; border-radius: 3px;">
                                            </div>
                                        </div>
                                    </div>

                                    <div style="margin: 15px 0;">
                                        <label style="color: #aaa; font-size: 12px; display: block; margin-bottom: 4px;">Gradient Angle</label>
                                        <div style="display: flex; gap: 10px; align-items: center;">
                                            <input type="range" id="gradientAngle" 
                                                   value="${this.uiState.textGradient?.angle || 0}" 
                                                   min="0" max="360" step="1"
                                                   style="flex: 1; background: #2a2a2a;">
                                            <input type="number" id="gradientAngleText" 
                                                   value="${this.uiState.textGradient?.angle || 0}" 
                                                   min="0" max="360"
                                                   style="width: 60px; background: #2a2a2a; color: #fff; border: 1px solid #666; padding: 4px; border-radius: 3px;">
                                            <span style="color: #aaa;">°</span>
                                        </div>
                                    </div>

                                    <div style="margin: 15px 0;">
                                        <label style="color: #ccc; display: block; margin-bottom: 5px;">Preview:</label>
                                        <div id="gradientPreview" style="
                                            width: 100%;
                                            height: 30px;
                                            border-radius: 4px;
                                            border: 1px solid #666;
                                            background: linear-gradient(${this.uiState.textGradient?.angle || 0}deg, 
                                                ${this.uiState.textGradient?.start || '#FF0000'}, 
                                                ${this.uiState.textGradient?.end || '#00FF00'}
                                            );
                                        "></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div style="text-align: right; border-top: 1px solid #333; padding-top: 15px;">
                            <button id="cancel" style="margin-right: 10px; padding: 6px 15px; background: #333; color: #fff; border: none; border-radius: 3px; cursor: pointer;">Cancel</button>
                            <button id="ok" style="padding: 6px 15px; background: #4a9eff; color: #fff; border: none; border-radius: 3px; cursor: pointer;">OK</button>
                        </div>
                    `;

                    document.body.appendChild(dialog);

                    const textColorInput = dialog.querySelector("#textColor");
                    const textColorText = dialog.querySelector("#textColorText");
                    const gradientToggle = dialog.querySelector("#gradientToggle");
                    const gradientControls = dialog.querySelector("#gradientControls");
                    const gradientStartInput = dialog.querySelector("#gradientStart");
                    const gradientStartText = dialog.querySelector("#gradientStartText");
                    const gradientEndInput = dialog.querySelector("#gradientEnd");
                    const gradientEndText = dialog.querySelector("#gradientEndText");
                    const gradientAngle = dialog.querySelector("#gradientAngle");
                    const gradientAngleText = dialog.querySelector("#gradientAngleText");
                    const gradientPreview = dialog.querySelector("#gradientPreview");
                    const okButton = dialog.querySelector("#ok");
                    const cancelButton = dialog.querySelector("#cancel");

                    function updatePreview() {
                        if (gradientToggle.checked) {
                            this.uiState.textGradient = {
                                start: gradientStartInput.value,
                                end: gradientEndInput.value,
                                angle: parseInt(gradientAngle.value)
                            };
                            this.widgets_by_name.text_gradient_start.value = gradientStartInput.value;
                            this.widgets_by_name.text_gradient_end.value = gradientEndInput.value;
                            this.widgets_by_name.text_gradient_angle.value = parseInt(gradientAngle.value);
                        } else {
                            this.uiState.textGradient = null;
                            this.widgets_by_name.text_gradient_start.value = "";
                            this.widgets_by_name.text_gradient_end.value = "";
                            this.widgets_by_name.text_gradient_angle.value = 0;
                            this.uiState.textColor = textColorInput.value;
                            this.widgets_by_name.text_color.value = textColorInput.value;
                        }
                        this.setDirtyCanvas(true);
                    }

                    function updateGradientPreview() {
                        gradientPreview.style.background = `linear-gradient(${gradientAngle.value}deg, ${gradientStartInput.value}, ${gradientEndInput.value})`;
                        updatePreview.call(this);
                    }

                    dialog.querySelectorAll('.color-preset').forEach(preset => {
                        preset.onclick = () => {
                            const color = preset.dataset.color;
                            textColorInput.value = color;
                            textColorText.value = color;
                            dialog.querySelectorAll('.color-preset').forEach(p => p.innerHTML = '');
                            preset.innerHTML = `
                                <div style="
                                    position: absolute;
                                    top: 50%;
                                    left: 50%;
                                    transform: translate(-50%, -50%);
                                    width: 16px;
                                    height: 16px;
                                    border: 2px solid ${color === '#FFFFFF' ? '#000' : '#fff'};
                                    border-radius: 50%;
                                "></div>
                            `;
                            updatePreview.call(this);
                        };
                    });

                    gradientToggle.onchange = () => {
                        gradientControls.style.opacity = gradientToggle.checked ? '1' : '0.5';
                        gradientControls.style.pointerEvents = gradientToggle.checked ? 'all' : 'none';
                        gradientToggle.nextElementSibling.lastElementChild.style.transform = 
                            gradientToggle.checked ? 'translateX(22px)' : 'translateX(0)';
                        updatePreview.call(this);
                    };

                    const updateColorInput = (input, text) => {
                        text.value = input.value;
                        updatePreview.call(this);
                    };

                    const updateColorText = (text, input) => {
                        if (/^#[0-9A-F]{6}$/i.test(text.value)) {
                            input.value = text.value;
                            updatePreview.call(this);
                        }
                    };

                    textColorInput.oninput = () => updateColorInput(textColorInput, textColorText);
                    textColorText.oninput = () => updateColorText(textColorText, textColorInput);
                    gradientStartInput.oninput = () => updateColorInput(gradientStartInput, gradientStartText);
                    gradientStartText.oninput = () => updateColorText(gradientStartText, gradientStartInput);
                    gradientEndInput.oninput = () => updateColorInput(gradientEndInput, gradientEndText);
                    gradientEndText.oninput = () => updateColorText(gradientEndText, gradientEndInput);

                    gradientAngle.oninput = () => {
                        gradientAngleText.value = gradientAngle.value;
                        updateGradientPreview.call(this);
                    };

                    gradientAngleText.onchange = () => {
                        let value = parseInt(gradientAngleText.value) || 0;
                        value = Math.max(0, Math.min(360, value));
                        gradientAngleText.value = value;
                        gradientAngle.value = value;
                        updateGradientPreview.call(this);
                    };

                    okButton.onclick = () => {
                        updatePreview.call(this);
                        this.serialize_widgets();
                        document.body.removeChild(dialog);
                    };

                    cancelButton.onclick = () => {
                        document.body.removeChild(dialog);
                    };
                }
            });
        }
    }
});