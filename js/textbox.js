import { app } from "../../../scripts/app.js";
import { ComfyWidgets } from "../../../scripts/widgets.js";
import { SVG, STYLES, WIDGET_CONFIG, TOOLBAR_TOOLS } from "./TextBoxConstants.js";

app.registerExtension({
    name: "SKB.TextBox",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeType.comfyClass === "TextBox") {

            if (!document.getElementById('skb-textbox-styles')) {
                const style = document.createElement('style');
                style.id = 'skb-textbox-styles';
                style.textContent = STYLES;
                document.head.appendChild(style);
            }


            Object.assign(nodeType.prototype, {
                onNodeCreated() {

                this.size = [320, 200];

                this.widgets_by_name = {};
                for (const [name, [type, options]] of Object.entries(WIDGET_CONFIG)) {
                    const widget = ComfyWidgets[type](this, name, [type, options], app);
                    this.widgets_by_name[name] = widget.widget;

                    
                    if (widget.widget) {
                        widget.widget.origType = widget.widget.type;
                        widget.widget.type = "hidden";
                        widget.widget.origComputeSize = widget.widget.computeSize;
                        widget.widget.computeSize = () => [0, -4];
                        const origDraw = widget.widget.draw;
                        widget.widget.draw = function(ctx, node, width, y) {
                            
                            this.type = this.origType;
                            const size = this.origComputeSize ? this.origComputeSize() : [0, 0];
                            this.type = "hidden";
                            return size;
                        };
                    }
                }

                if (this.widgets) {
                    for (const widget of this.widgets) {
                        widget.origType = widget.type;
                        widget.type = "hidden";
                        widget.origComputeSize = widget.computeSize;
                        widget.computeSize = () => [0, -4];
                        const origDraw = widget.draw;
                        widget.draw = function(ctx, node, width, y) {
                            
                            this.type = this.origType;
                            const size = this.origComputeSize ? this.origComputeSize() : [0, 0];
                            this.type = "hidden";
                            return size;
                        };
                    }
                }

                this.widgets_height = 0;



                this.min_height = 20;
                this.max_height = 20;






                    const defaultPositionX = 256;
                    const defaultPositionY = 256;
                    const defaultWidth = 512;
                    const defaultHeight = 512;


                    const positionX = this.widgets_by_name.position_x &&
                                     typeof this.widgets_by_name.position_x.value !== 'undefined' ?
                                     this.widgets_by_name.position_x.value : defaultPositionX;

                    const positionY = this.widgets_by_name.position_y &&
                                     typeof this.widgets_by_name.position_y.value !== 'undefined' ?
                                     this.widgets_by_name.position_y.value : defaultPositionY;

                    const canvasWidth = this.widgets_by_name.width &&
                                     typeof this.widgets_by_name.width.value !== 'undefined' ?
                                     this.widgets_by_name.width.value : defaultWidth;

                    const canvasHeight = this.widgets_by_name.height &&
                                      typeof this.widgets_by_name.height.value !== 'undefined' ?
                                      this.widgets_by_name.height.value : defaultHeight;

                    this.uiState = {
                        text: "Enter Text",
                        position: {
                            x: positionX,
                            y: positionY
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
                        canvasWidth: canvasWidth,
                        canvasHeight: canvasHeight,
                        fontFamily: "Arial",
                        textShadow: false,
                        textOutline: false,
                        outlineColor: "#000000",
                        outlineWidth: 3,
                        reflectX: false,
                        reflectY: false
                    };


                    this._createDialog = (title, contentHTML, onSetup, onOk) => {
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
                            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
                        `;

                        dialog.innerHTML = `
                            <div style="margin-bottom: 20px;">
                                <h3 style="color: #fff; margin: 0 0 15px 0; font-size: 16px;">${title}</h3>
                                ${contentHTML}
                            </div>
                            <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #333; padding-top: 15px;">
                                <button class="skb-dialog-cancel" style="padding: 6px 12px; border-radius: 4px; border: none; background: #333; color: #fff; cursor: pointer;">Cancel</button>
                                <button class="skb-dialog-ok" style="padding: 6px 12px; border-radius: 4px; border: none; background: #4a9eff; color: #fff; cursor: pointer;">OK</button>
                            </div>
                        `;

                        document.body.appendChild(dialog);

                        const okButton = dialog.querySelector(".skb-dialog-ok");
                        const cancelButton = dialog.querySelector(".skb-dialog-cancel");


                        if (onSetup) {
                            onSetup(dialog);
                        }

                        okButton.onclick = () => {
                            if (onOk) {
                                onOk(dialog);
                            }
                            document.body.removeChild(dialog);
                        };

                        cancelButton.onclick = () => {
                            document.body.removeChild(dialog);
                        };


                        [okButton, cancelButton].forEach(button => {
                            const originalBg = button.style.background;
                            button.onmouseover = () => button.style.opacity = "0.8";
                            button.onmouseout = () => button.style.opacity = "1";
                        });

                        return dialog;
                    };

                    this.openOutlineDialog = () => {
                        const currentColor = this.uiState.outlineColor || "#000000";
                        const currentWidth = this.uiState.outlineWidth || 3;
                        const currentEnabled = this.uiState.textOutline || false;

                        const contentHTML = `
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
                                    <input type="checkbox" id="outlineEnabled" ${currentEnabled ? 'checked' : ''}>
                                    <span>Enable Outline</span>
                                </label>
                            </div>
                        `;

                        const onSetup = (dialog) => {
                            const outlineColorInput = dialog.querySelector("#outlineColor");
                            const outlineColorText = dialog.querySelector("#outlineColorText");
                            const outlineWidthInput = dialog.querySelector("#outlineWidth");
                            const outlineWidthValue = dialog.querySelector("#outlineWidthValue");

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
                        };

                        const onOk = (dialog) => {
                            const outlineEnabledInput = dialog.querySelector("#outlineEnabled");
                            const outlineColorInput = dialog.querySelector("#outlineColor");
                            const outlineWidthInput = dialog.querySelector("#outlineWidth");

                            this.uiState.textOutline = outlineEnabledInput.checked;
                            this.uiState.outlineColor = outlineColorInput.value;
                            this.uiState.outlineWidth = parseInt(outlineWidthInput.value);

                            if (this.widgets_by_name) {
                                if (this.widgets_by_name.text_outline) {
                                    this.widgets_by_name.text_outline.value = this.uiState.textOutline;
                                }
                                if (this.widgets_by_name.outline_color) {
                                    this.widgets_by_name.outline_color.value = this.uiState.outlineColor;
                                }
                                if (this.widgets_by_name.outline_width) {
                                    this.widgets_by_name.outline_width.value = this.uiState.outlineWidth;
                                }
                            }

                            this.setDirtyCanvas(true);
                            this.serialize_widgets();
                        };

                        this._createDialog("Outline Settings", contentHTML, onSetup, onOk);
                    };

                    this.serialize_widgets = () => {
                        if (!this.widgets_by_name) return;


                        Object.entries({
                            text: this.uiState.text,
                            position_x: Math.round(this.uiState.position?.x || 0),
                            position_y: Math.round(this.uiState.position?.y || 0),
                            rotation: this.uiState.rotation || 0,
                            is_bold: this.uiState.bold || false,
                            is_italic: this.uiState.italic || false,
                            text_align: this.uiState.align || 'center',
                            font_size: this.uiState.fontSize || 32,
                            text_color: this.uiState.textColor || "#FFFFFF",
                            background_color: this.uiState.backgroundColor || "#000000",
                            background_visible: this.uiState.backgroundVisible !== undefined ? this.uiState.backgroundVisible : true,
                            text_outline: this.uiState.textOutline || false,
                            outline_color: this.uiState.outlineColor || "#000000",
                            outline_width: this.uiState.outlineWidth || 3,
                            text_shadow: this.uiState.textShadow || false,
                            font_family: this.uiState.fontFamily || "Arial",
                            reflect_x: this.uiState.reflectX || false,
                            reflect_y: this.uiState.reflectY || false,
                            width: this.uiState.canvasWidth || 512,
                            height: this.uiState.canvasHeight || 512,
                            opacity: this.uiState.opacity !== undefined ? this.uiState.opacity : 1.0


                        }).forEach(([key, value]) => {
                            if (this.widgets_by_name[key]) {
                                this.widgets_by_name[key].value = value;
                            }
                        });


                        if (this.uiState.textGradient) {
                            const startColor = this.uiState.textGradient.start || this.uiState.textColor || "#FFFFFF";
                            const endColor = this.uiState.textGradient.end || this.uiState.textColor || "#FFFFFF";
                            const angle = this.uiState.textGradient.angle || 0;
                            if (this.widgets_by_name.text_gradient_start) this.widgets_by_name.text_gradient_start.value = startColor;
                            if (this.widgets_by_name.text_gradient_end) this.widgets_by_name.text_gradient_end.value = endColor;
                            if (this.widgets_by_name.text_gradient_angle) this.widgets_by_name.text_gradient_angle.value = angle;
                        } else {
                            if (this.widgets_by_name.text_gradient_start) this.widgets_by_name.text_gradient_start.value = "";
                            if (this.widgets_by_name.text_gradient_end) this.widgets_by_name.text_gradient_end.value = "";
                            if (this.widgets_by_name.text_gradient_angle) this.widgets_by_name.text_gradient_angle.value = 0;
                        }


                        const base64Image = this.getCanvasImage();
                        if (this.widgets_by_name.canvas_image) {
                           this.widgets_by_name.canvas_image.value = base64Image || "";
                        }


                         if (!this._initializing && this.onExecuted) {
                             app.graph.runStep(this);
                         }
                    };



                    this.serialize_widgets();


                    this.tools = JSON.parse(JSON.stringify(TOOLBAR_TOOLS));

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
                            const nodeHeight = this.size[1] || 600;


                            const toolbarHeight = 30;
                            const cornerRadius = 8;

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


                            let realWidth = 512;
                            let realHeight = 512;


                            if (this.widgets_by_name && this.widgets_by_name.width && typeof this.widgets_by_name.width.value !== 'undefined') {
                                realWidth = this.widgets_by_name.width.value;
                            }

                            if (this.widgets_by_name && this.widgets_by_name.height && typeof this.widgets_by_name.height.value !== 'undefined') {
                                realHeight = this.widgets_by_name.height.value;
                            }


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


                            const baseFontSize = 14;
                            const minFontSize = 8;
                            const fontSizeFactor = Math.min(canvasWidth, canvasHeight) / 400;
                            const fontSize = Math.max(minFontSize, Math.floor(baseFontSize * fontSizeFactor));

                            ctx.font = `bold ${fontSize}px Arial`;
                            ctx.fillStyle = "#fff";
                            ctx.textAlign = "left";


                            const textPadding = Math.max(5, Math.floor(10 * fontSizeFactor));


                            if (canvasWidth < 150) {
                                ctx.fillText(`${realWidth}×${realHeight}`, offsetX + textPadding, offsetY + fontSize + textPadding);
                                ctx.fillText(`${Math.round(scale * 100)}%`, offsetX + textPadding, offsetY + (fontSize * 2) + textPadding * 1.5);
                            } else {
                                ctx.fillText(`Canvas: ${realWidth}×${realHeight}`, offsetX + textPadding, offsetY + fontSize + textPadding);
                                ctx.fillText(`Scale: ${Math.round(scale * 100)}%`, offsetX + textPadding, offsetY + (fontSize * 2) + textPadding * 1.5);
                            }


                            this.drawToolbar(ctx, nodeWidth, toolbarHeight, cornerRadius);


                            const text = this.widgets_by_name.text?.value || this.uiState.text || "Enter Text";
                            if (text) {
                                ctx.save();


                                ctx.save();
                                ctx.beginPath();
                                ctx.rect(offsetX, offsetY, scaledWidth, scaledHeight);
                                ctx.clip();


                                ctx.translate(offsetX, offsetY);

                                let fontStyle = "";
                                if (this.uiState.bold) fontStyle += "bold ";
                                if (this.uiState.italic) fontStyle += "italic ";

                                const fontFamily = this.uiState.fontFamily || "Montserrat";
                                ctx.font = `${fontStyle}${this.uiState.fontSize}px "${fontFamily}", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
                                ctx.fillStyle = this.uiState.textColor;

                                const lines = text.split('\\n');
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


                                        const startColor = this.uiState.textGradient.start || this.uiState.textColor;
                                        const endColor = this.uiState.textGradient.end || this.uiState.textColor;

                                        gradient.addColorStop(0, startColor);
                                        gradient.addColorStop(1, endColor);

                                        ctx.fillStyle = gradient;
                                        ctx.fillText(line, alignOffsetX, y);
                                        ctx.restore();
                                    } else {
                                        ctx.fillStyle = this.uiState.textColor;
                                        ctx.fillText(line, alignOffsetX, y);
                                    }
                                });

                                ctx.restore();
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

                    if (!this.toolbar) {
                        this.toolbar = TOOLBAR_TOOLS;
                    }


                    const buttonSize = 14;
                    const buttonSpacing = 0;
                    const leftMargin = 3;


                    ctx.fillStyle = "#222";
                    ctx.beginPath();
                    ctx.roundRect(0, 0, nodeWidth, toolbarHeight, [cornerRadius, cornerRadius, 0, 0]);
                    ctx.fill();


                    ctx.strokeStyle = "#444";
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(0, toolbarHeight);
                    ctx.lineTo(nodeWidth, toolbarHeight);
                    ctx.stroke();





                    const availableWidth = nodeWidth - 2 * leftMargin + 22;
                    const buttonsPerRow = Math.floor(availableWidth / (buttonSize + buttonSpacing));

                    if (buttonsPerRow < 1) {

                        return;
                    }


                    const maxButtons = Math.min(this.toolbar.length, buttonsPerRow);


                    let x = leftMargin;
                    let y = (toolbarHeight - buttonSize) / 2;

                    for (let i = 0; i < maxButtons; i++) {
                        const tool = this.toolbar[i];

                        if (tool.type === 'divider') {

                            if (x + 1 <= nodeWidth - leftMargin) {
                                ctx.strokeStyle = "#444";
                                ctx.lineWidth = 1;
                                ctx.beginPath();
                                ctx.moveTo(x + 1, y);
                                ctx.lineTo(x + 1, y + buttonSize);
                                ctx.stroke();
                                x += 2;
                            }
                        } else {

                            let isActive = false;
                            if (tool.action === 'toggleBold') isActive = this.uiState.bold;
                            else if (tool.action === 'toggleItalic') isActive = this.uiState.italic;
                            else if (tool.action === 'alignLeft') isActive = this.uiState.align === 'left';
                            else if (tool.action === 'alignCenter') isActive = this.uiState.align === 'center';
                            else if (tool.action === 'alignRight') isActive = this.uiState.align === 'right';
                            else if (tool.action === 'reflectX') isActive = this.uiState.reflectX;
                            else if (tool.action === 'reflectY') isActive = this.uiState.reflectY;

                            const indicatorY = y + buttonSize + 1; 
                            if (isActive) {
                                ctx.fillStyle = "#6750A4"; 
                                ctx.fillRect(x, indicatorY, buttonSize, 2); 
                            } else if (this.hoveredButton === i) {
                                ctx.fillStyle = "#49454F"; 
                                ctx.fillRect(x, indicatorY, buttonSize, 1); 
                            }

                            ctx.save(); 
                            const svgString = tool.icon;
                            if (svgString) {
                                const iconSize = buttonSize; 
                                const iconX = x;
                                const iconY = y;

                                const iconColor = isActive ? "#6750A4" : (this.hoveredButton === i ? "#E8DEF8" : "#bbbbbb");
                                
                                const coloredSvgString = svgString.replace(/currentColor/g, iconColor);
                                const img = new Image();
                                img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(coloredSvgString);

                                try {
                                    if (img.complete && img.naturalWidth > 0) {
                                        if (!this._iconCanvas) { 
                                            this._iconCanvas = document.createElement('canvas');
                                            this._iconCanvas.width = 24; 
                                            this._iconCanvas.height = 24;
                                        }
                                        const iconCtx = this._iconCanvas.getContext('2d');
                                        iconCtx.clearRect(0, 0, 24, 24); 
                                        iconCtx.drawImage(img, 0, 0, 24, 24); 
                                        ctx.drawImage(this._iconCanvas, iconX, iconY, iconSize, iconSize); 
                                    } else {
                                        
                                        img.onerror = () => { 
                                             console.warn(`Failed to load SVG icon for action: ${tool.action}`);
                                             this.renderFallbackIcon(ctx, tool, iconX, iconY, iconSize, iconColor);
                                             this.setDirtyCanvas(true); 
                                        };
                                        img.onload = () => { 
                                             this.setDirtyCanvas(true); 
                                        };
                                        
                                        if (!img.complete) {
                                            this.renderFallbackIcon(ctx, tool, iconX, iconY, iconSize, iconColor);
                                        }
                                    }
                                } catch (error) {
                                    console.error("Icon rendering error:", error);
                                    
                                    ctx.fillStyle = iconColor;
                                    ctx.beginPath();
                                    ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, 3, 0, Math.PI * 2);
                                    ctx.fill();
                                }
                            }
                            ctx.restore(); 

                            
                            if (this.hoveredButton === i && tool.tooltip) {
                                const tooltipPadding = 6;
                                const tooltipHeight = 20;

                                ctx.font = "11px 'Roboto', Inter, Arial"; 
                                ctx.textAlign = "center";
                                ctx.textBaseline = "middle";
                                
                                const tooltipWidth = ctx.measureText(tool.tooltip).width + (tooltipPadding * 2);

                                let tooltipX = x + (buttonSize / 2) - (tooltipWidth / 2); 
                                const tooltipY = y + buttonSize + 6; 

                                const nodeWidth = this.size[0];
                                if (tooltipX < 5) tooltipX = 5;
                                if (tooltipX + tooltipWidth > nodeWidth - 5) tooltipX = nodeWidth - 5 - tooltipWidth;

                                ctx.fillStyle = "rgba(33, 33, 33, 0.9)"; 
                                ctx.beginPath();
                                ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 4); 
                                ctx.fill();

                                ctx.fillStyle = "#ffffff"; 
                                ctx.fillText(tool.tooltip, tooltipX + tooltipWidth / 2, tooltipY + tooltipHeight / 2);
                            } 

                            x += buttonSize + buttonSpacing;
                        }
                    }
                },

                onMouseDown(e) {
                    const x = e.canvasX - this.pos[0];
                    const y = e.canvasY - this.pos[1];

                    if (!this.toolbar) {
                        this.toolbar = TOOLBAR_TOOLS;
                    }

                    const toolbarHeight = 30;
                    const buttonSize = 14;
                    const buttonSpacing = 0;
                    const leftMargin = 3;

                    if (y < toolbarHeight) {
                        let currentX = leftMargin;
                        let buttonY = (toolbarHeight - buttonSize) / 2;

                        for (let i = 0; i < this.toolbar.length; i++) {
                            const tool = this.toolbar[i];

                            if (tool.type === 'divider') {
                                if (currentX + 2 > this.size[0] - leftMargin) {
                                    break;
                                }
                                currentX += 2;
                                continue;
                            }

                            if (currentX + buttonSize > this.size[0] - leftMargin) {
                                break;
                            }

                            if (x >= currentX && x <= currentX + buttonSize &&
                                y >= buttonY && y <= buttonY + buttonSize) {

                                if (tool.action) {
                                    this.executeToolAction(tool.action);
                                }
                                return true;
                            }

                            currentX += buttonSize + buttonSpacing;
                        }

                        return false;
                    }

                    const canvasX = 10;
                    const canvasY = toolbarHeight + 10;
                    const canvasWidth = this.size[0] - 20;
                    const canvasHeight = this.size[1] - toolbarHeight - 20;


                    if (x >= canvasX + 2 && x <= canvasX + canvasWidth - 2 &&
                        y >= canvasY + 2 && y <= canvasY + canvasHeight - 2) {

                        this.uiState.isSelected = true;
                        this.uiState.isDragging = true;
                        this.uiState.dragStart = { x, y };

                        this.setDirtyCanvas(true);
                        return true;
                    }

                    return false;
                },

                onMouseMove(e) {
                    const x = e.canvasX - this.pos[0];
                    const y = e.canvasY - this.pos[1];
                    
                    let handled = false;
                    
                    
                    if (!this.toolbar) {
                        this.toolbar = TOOLBAR_TOOLS;
                    }

                    
                    const toolbarHeight = 30;
                    const buttonSize = 14;
                    const buttonSpacing = 0;
                    const leftMargin = 3;

                    
                    if (y < toolbarHeight) {
                        let currentX = leftMargin;
                        let buttonY = (toolbarHeight - buttonSize) / 2;
                        let hoveredIndex = -1;
                        
                        for (let i = 0; i < this.toolbar.length; i++) {
                            const tool = this.toolbar[i];
                            
                            if (tool.type === 'divider') {
                                
                                if (currentX + 2 > this.size[0] - leftMargin) {
                                    break; 
                                }
                                currentX += 2;
                                continue;
                            }
                            
                            
                            if (currentX + buttonSize > this.size[0] - leftMargin) {
                                break; 
                            }
                            
                            
                            if (x >= currentX && x <= currentX + buttonSize && 
                                y >= buttonY && y <= buttonY + buttonSize) {
                                hoveredIndex = i;
                                break;
                            }
                            
                            currentX += buttonSize + buttonSpacing;
                        }
                        
                        
                        if (this.hoveredButton !== hoveredIndex) {
                            this.hoveredButton = hoveredIndex;
                            this.setDirtyCanvas(true);
                            handled = true;
                        }
                    } else if (this.hoveredButton !== -1) {
                        
                        this.hoveredButton = -1;
                        this.setDirtyCanvas(true);
                        handled = true;
                    }
                        
                    
                    if (this.uiState.isDragging && this.uiState.dragStart) {
                        const dragOffsetX = x - this.uiState.dragStart.x;
                        const dragOffsetY = y - this.uiState.dragStart.y;
                        
                        
                        const canvasX = 10;
                        const canvasY = toolbarHeight + 10;
                        const canvasWidth = this.size[0] - 20;
                        const canvasHeight = this.size[1] - toolbarHeight - 20;
                        
                        
                        let realWidth = 512;
                        let realHeight = 512;
                        
                        if (this.widgets_by_name && this.widgets_by_name.width && typeof this.widgets_by_name.width.value !== 'undefined') {
                            realWidth = this.widgets_by_name.width.value;
                        }
                        
                        if (this.widgets_by_name && this.widgets_by_name.height && typeof this.widgets_by_name.height.value !== 'undefined') {
                            realHeight = this.widgets_by_name.height.value;
                        }
                        
                        const scale = Math.min(canvasWidth / realWidth, canvasHeight / realHeight);
                        
                        
                        const scaledDragX = dragOffsetX / scale;
                        const scaledDragY = dragOffsetY / scale;
                        
                        
                        this.uiState.dragStart = { x, y };
                        
                        if (this.widgets_by_name.position_x && this.widgets_by_name.position_y) {
                            const newX = Math.max(0, Math.min(realWidth, this.uiState.position.x + scaledDragX));
                            const newY = Math.max(0, Math.min(realHeight, this.uiState.position.y + scaledDragY));
                            
                            this.widgets_by_name.position_x.value = Math.round(newX);
                            this.widgets_by_name.position_y.value = Math.round(newY);
                            
                            this.uiState.position.x = newX;
                            this.uiState.position.y = newY;
                            
                            this.setDirtyCanvas(true);
                            handled = true;
                        }
                    }

                    return handled; 
                },

                onMouseUp(e) {
                    
                    if (this.uiState.isDragging) {
                        this.uiState.isDragging = false;
                        this.uiState.dragStart = null;
                        
                        
                        this.serialize_widgets();
                        
                        this.setDirtyCanvas(true);
                        return true; 
                    }
                    return false; 
                },

                onMouseLeave(e) {
                    let handled = false;
                    
                    if (this.uiState.isSelected || this.uiState.hoveredSlider || this.uiState.hoveredButton) {
                        this.uiState.isSelected = false;
                        this.uiState.hoveredSlider = null;
                        this.uiState.hoveredButton = null;
                        this.setDirtyCanvas(true);
                        handled = true;
                    }
                    
                    return handled;
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

                
                _createSimpleSliderDialog(title, propertyName, rangeMin, rangeMax, rangeStep, valueSuffix = '') {
                    const currentValue = this.uiState[propertyName];

                    const contentHTML = `
                        <div style="margin-bottom: 15px;">
                            <label style="color: #ccc; display: block; margin-bottom: 5px;">${title}:</label>
                            <input type="range" id="sliderInput" value="${currentValue}" min="${rangeMin}" max="${rangeMax}" step="${rangeStep}"
                                   style="width: 200px; margin-right: 10px;">
                            <span id="sliderValue" style="color: #fff;">${currentValue}${valueSuffix}</span>
                        </div>
                    `;

                    const onSetup = (dialog) => {
                        const slider = dialog.querySelector("#sliderInput");
                        const valueDisplay = dialog.querySelector("#sliderValue");
                        slider.oninput = () => {
                            valueDisplay.textContent = `${slider.value}${valueSuffix}`;
                        };
                    };

                    const onOk = (dialog) => {
                        const slider = dialog.querySelector("#sliderInput");
                        const newValue = propertyName === 'rotation' ? parseInt(slider.value) : parseFloat(slider.value); 
                        this.uiState[propertyName] = newValue;
                        if (this.widgets_by_name[propertyName]) {
                            this.widgets_by_name[propertyName].value = newValue;
                        }
                        this.setDirtyCanvas(true);
                        this.serialize_widgets();
                    };

                    this._createDialog(title, contentHTML, onSetup, onOk);
                },
                
                openFontSizeDialog() {
                    this._createSimpleSliderDialog("Font Size", "fontSize", 8, 128, 1, "px");
                },

                openRotationDialog() {
                    this._createSimpleSliderDialog("Rotation", "rotation", -180, 180, 1, "°");
                },

                onResize(size) {
                    
                    if (!this.uiState) {
                        this.uiState = {
                            text: "Enter Text",
                            position: { x: 256, y: 256 },
                            isCompact: true, 
                            fontSize: 32,
                            fontFamily: "Arial",
                            textColor: "#ffffff",
                            backgroundColor: "#000000",
                            backgroundVisible: true,
                            bold: false,
                            italic: false,
                            align: "center",
                            rotation: 0,
                            scale: { x: 1, y: 1 }
                        };
                    }

                    
                    this.size[0] = size[0];
                    this.size[1] = size[1];
                    
                    
                    this.uiState.customWidth = size[0];
                    this.uiState.customHeight = size[1];
                    
                    this.uiState.hasCustomSize = true;
                    
                    
                    this.setDirtyCanvas(true);
                },

                onDragEnd() {
                    this.setDirtyCanvas(true);
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
                        
                        const oldWidth = this.widgets_by_name.width?.value || 512;
                        const oldHeight = this.widgets_by_name.height?.value || 512;
                        
                        const newWidth = parseInt(widthInput.value);
                        const newHeight = parseInt(heightInput.value);
                        
                        const widthRatio = newWidth / oldWidth;
                        const heightRatio = newHeight / oldHeight;
                        
                        const currentX = this.uiState.position.x;
                        const currentY = this.uiState.position.y;
                        
                        const newX = Math.round(currentX * widthRatio);
                        const newY = Math.round(currentY * heightRatio);
                        
                        
                        if (this.widgets_by_name.width) {
                            this.widgets_by_name.width.value = newWidth;
                        }
                        
                        if (this.widgets_by_name.height) {
                            this.widgets_by_name.height.value = newHeight;
                        }
                        
                        if (this.widgets_by_name.background_color) {
                            this.widgets_by_name.background_color.value = bgColorInput.value;
                        }
                        
                        if (this.widgets_by_name.background_visible) {
                            this.widgets_by_name.background_visible.value = bgVisibleInput.checked;
                        }
                        
                        if (this.widgets_by_name.position_x) {
                            this.widgets_by_name.position_x.value = newX;
                        }
                        
                        if (this.widgets_by_name.position_y) {
                            this.widgets_by_name.position_y.value = newY;
                        }
                        
                        
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
                            
                            
                            this.uiState.fontFamily = selectedFont;
                            
                            
                            if (this.widgets_by_name.font_family) {
                                const widget = this.widgets_by_name.font_family;
                                widget.value = selectedFont;
                                if (widget.callback) {
                                    widget.callback(selectedFont);
                                }
                            }
                            
                            
                            const currentBold = this.uiState.bold;
                            const currentItalic = this.uiState.italic;
                            this.uiState.bold = currentBold;
                            this.uiState.italic = currentItalic;
                            this.widgets_by_name.is_bold.value = currentBold;
                            this.widgets_by_name.is_italic.value = currentItalic;
                            
                            
                            this.serialize_widgets();
                            if (this.onExecuted) {
                                app.graph.runStep(this);
                            }
                            
                            this.setDirtyCanvas(true);
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
                            <h3 style="color: #fff; margin: 0 0 15px 0; font-size: 16px;">Shadow Settings</h3>
                            
                            <div style="margin-bottom: 15px;">
                                <label style="color: #ccc; display: block; margin-bottom: 5px;">Shadow Color:</label>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <input type="color" id="shadowColor" value="${currentColor}"
                                           style="width: 50px; height: 30px; padding: 0; border: none; background: none;">
                                    <input type="text" id="shadowColorText" value="${currentColor}"
                                           style="width: 80px; background: #2a2a2a; color: #fff; border: 1px solid #666; padding: 4px; border-radius: 3px;">
                                </div>
                            </div>

                            <div style="margin-bottom: 15px;">
                                <label style="color: #ccc; display: block; margin-bottom: 5px;">Blur:</label>
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
                        reflectY: this.uiState.reflectY
                    };
                },


                onConfigure(o) {
                    
                    if (!this.uiState) {
                        this.uiState = {
                            text: "Enter Text",
                            position: { x: 256, y: 256 },
                            isCompact: false,
                            fontSize: 32,
                            fontFamily: "Arial",
                            textColor: "#ffffff",
                            backgroundColor: "#000000",
                            backgroundVisible: true,
                            bold: false,
                            italic: false,
                            align: "center",
                            rotation: 0,
                            scale: { x: 1, y: 1 }
                        };
                    }
                
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
                            hoveredButton: null
                        };
                    }
                    
                    
                    if (o.size && Array.isArray(o.size) && o.size.length === 2) {
                        this.size[0] = o.size[0];
                        this.size[1] = o.size[1];
                    }
                    
                    
                    this.size[0] = Math.max(150, this.size[0]);
                    
                    
                    this.setDirtyCanvas(true, true);
                    
                    this.serialize_widgets();
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
                                
                                
                                const startColor = this.uiState.textGradient.start || this.uiState.textColor;
                                const endColor = this.uiState.textGradient.end || this.uiState.textColor;

                                gradient.addColorStop(0, startColor);
                                gradient.addColorStop(1, endColor);
                                
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

                executeToolAction(actionName) {
                    switch(actionName) {
                        case 'editText':
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
                            break;
                        case 'openMoveDialog': this.openMoveDialog(); break;
                        case 'alignLeft': this.updateToolbarButton('align', 'left'); break;
                        case 'alignCenter': this.updateToolbarButton('align', 'center'); break;
                        case 'alignRight': this.updateToolbarButton('align', 'right'); break;
                        case 'toggleBold': this.updateToolbarButton('bold', !this.uiState.bold); break;
                        case 'toggleItalic': this.updateToolbarButton('italic', !this.uiState.italic); break;
                        case 'openFontSizeDialog': this.openFontSizeDialog(); break;
                        case 'openFontDialog': this.openFontDialog(); break;
                        case 'openColorDialog': this.openColorDialog(); break;
                        case 'openShadowDialog': this.openShadowDialog(); break;
                        case 'openOutlineDialog': this.openOutlineDialog(); break;
                        case 'openRotationDialog': this.openRotationDialog(); break;
                        case 'reflectX':
                            this.uiState.reflectX = !this.uiState.reflectX;
                            this.uiState.scale.x *= -1;
                            if (this.widgets_by_name && this.widgets_by_name.reflect_x) {
                                this.widgets_by_name.reflect_x.value = this.uiState.reflectX;
                            }
                            this.setDirtyCanvas(true);
                            this.serialize_widgets();
                            break;
                        case 'reflectY':
                            this.uiState.reflectY = !this.uiState.reflectY;
                            this.uiState.scale.y *= -1;
                            if (this.widgets_by_name && this.widgets_by_name.reflect_y) {
                                this.widgets_by_name.reflect_y.value = this.uiState.reflectY;
                            }
                            this.setDirtyCanvas(true);
                            this.serialize_widgets();
                            break;
                        case 'openFrameSizeDialog': this.openFrameSizeDialog(); break;
                        default:
                            console.warn("Unknown tool action:", actionName);
                    }
                },

                getExtraMenuOptions(_, options) {
                    options.unshift({
                        content: "Swap width/height",
                        callback: () => {
                            const oldWidth = this.widgets_by_name.width?.value || 512;
                            const oldHeight = this.widgets_by_name.height?.value || 512;
                            
                            if (this.widgets_by_name.width) {
                                this.widgets_by_name.width.value = oldHeight;
                            }
                            
                            if (this.widgets_by_name.height) {
                                this.widgets_by_name.height.value = oldWidth;
                            }
                            
                            const currentX = this.uiState.position.x;
                            const currentY = this.uiState.position.y;
                            
                            const widthRatio = oldHeight / oldWidth;
                            const heightRatio = oldWidth / oldHeight;
                            
                            if (this.widgets_by_name.position_x) {
                                this.widgets_by_name.position_x.value = Math.round(currentX * widthRatio);
                            }
                            
                            if (this.widgets_by_name.position_y) {
                                this.widgets_by_name.position_y.value = Math.round(currentY * heightRatio);
                            }
                            
                            this.uiState.canvasWidth = oldHeight;
                            this.uiState.canvasHeight = oldWidth;
                            this.uiState.position.x = Math.round(currentX * widthRatio);
                            this.uiState.position.y = Math.round(currentY * heightRatio);
                            
                            this.setDirtyCanvas(true);
                            this.serialize_widgets();
                        }
                    });
                    return options;
                },

                openMoveDialog() {
                    const canvasWidth = this.widgets_by_name.width.value;
                    const canvasHeight = this.widgets_by_name.height.value;
                    const currentX = this.uiState.position.x;
                    const currentY = this.uiState.position.y;

                    const contentHTML = `
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
                        
                    `;

                    const onSetup = (dialog) => {
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
                                ctx.moveTo(i, 0); ctx.lineTo(i, 360);
                                ctx.moveTo(0, i); ctx.lineTo(360, i);
                                ctx.stroke();
                            }
                            ctx.strokeStyle = "rgba(255,255,255,0.3)";
                            ctx.setLineDash([5, 5]);
                            ctx.beginPath();
                            ctx.moveTo(180, 0); ctx.lineTo(180, 360);
                            ctx.moveTo(0, 180); ctx.lineTo(360, 180);
                            ctx.stroke();
                            ctx.setLineDash([]);
                        }

                        function updateHandlePosition(x, y) {
                            const scaleX = 360 / canvasWidth;
                            const scaleY = 360 / canvasHeight;
                            const clampedX = Math.max(0, Math.min(canvasWidth, x));
                            const clampedY = Math.max(0, Math.min(canvasHeight, y));
                            handle.style.left = `${clampedX * scaleX}px`;
                            handle.style.top = `${clampedY * scaleY}px`;
                            posXInput.value = Math.round(clampedX);
                            posYInput.value = Math.round(clampedY);
                            
                        }

                        drawGrid();
                        updateHandlePosition(currentX, currentY);

                        let isDragging = false;
                        let mouseMoveHandler, mouseUpHandler;

                        handle.addEventListener("mousedown", () => {
                           isDragging = true;
                           handle.style.cursor = 'grabbing';
                           document.addEventListener("mousemove", mouseMoveHandler = (e) => {
                               if (!isDragging) return;
                               const rect = canvas.getBoundingClientRect();
                               const scaleX = canvasWidth / 360;
                               const scaleY = canvasHeight / 360;
                               const x = (e.clientX - rect.left) * scaleX;
                               const y = (e.clientY - rect.top) * scaleY;
                               updateHandlePosition(x, y);
                           });
                           document.addEventListener("mouseup", mouseUpHandler = () => {
                               isDragging = false;
                               handle.style.cursor = 'grab';
                               document.removeEventListener("mousemove", mouseMoveHandler);
                               document.removeEventListener("mouseup", mouseUpHandler);
                           });
                        });

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

                        dialog.querySelector("#centerPos").onclick = () => updateHandlePosition(canvasWidth / 2, canvasHeight / 2);
                        dialog.querySelector("#resetPos").onclick = () => updateHandlePosition(canvasWidth * 0.5, canvasHeight * 0.5); 

                        
                        const originalOkOnclick = dialog.querySelector(".skb-dialog-ok").onclick;
                        dialog.querySelector(".skb-dialog-ok").onclick = (...args) => {
                            document.removeEventListener("mousemove", mouseMoveHandler);
                            document.removeEventListener("mouseup", mouseUpHandler);
                            if(originalOkOnclick) originalOkOnclick(...args);
                        };
                         const originalCancelOnclick = dialog.querySelector(".skb-dialog-cancel").onclick;
                         dialog.querySelector(".skb-dialog-cancel").onclick = (...args) => {
                             document.removeEventListener("mousemove", mouseMoveHandler);
                             document.removeEventListener("mouseup", mouseUpHandler);
                             if(originalCancelOnclick) originalCancelOnclick(...args);
                         };
                    };

                    const onOk = (dialog) => {
                        const posXInput = dialog.querySelector("#posX");
                        const posYInput = dialog.querySelector("#posY");
                        const x = parseInt(posXInput.value) || 0;
                        const y = parseInt(posYInput.value) || 0;
                        this.uiState.position.x = x;
                        this.uiState.position.y = y;
                        if (this.widgets_by_name.position_x) this.widgets_by_name.position_x.value = x;
                        if (this.widgets_by_name.position_y) this.widgets_by_name.position_y.value = y;
                        this.setDirtyCanvas(true);
                        this.serialize_widgets();
                    };

                    this._createDialog("Position Settings", contentHTML, onSetup, onOk);
                },

                openColorDialog() {
                    const presetColors = [
                        "#FFFFFF", "#000000", "#FF0000", "#00FF00", "#0000FF",
                        "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080"
                    ];

                    
                    const contentHTML = `
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
                    `;
                    
                    
                    const onSetup = (dialog) => {
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

                        function updatePreview() {
                            if (gradientToggle.checked) {
                                this.uiState.textGradient = {
                                    start: gradientStartInput.value,
                                    end: gradientEndInput.value,
                                    angle: parseInt(gradientAngle.value)
                                };
                                if (this.widgets_by_name.text_gradient_start) this.widgets_by_name.text_gradient_start.value = gradientStartInput.value;
                                if (this.widgets_by_name.text_gradient_end) this.widgets_by_name.text_gradient_end.value = gradientEndInput.value;
                                if (this.widgets_by_name.text_gradient_angle) this.widgets_by_name.text_gradient_angle.value = parseInt(gradientAngle.value);
                            } else {
                                this.uiState.textGradient = null;
                                if (this.widgets_by_name.text_gradient_start) this.widgets_by_name.text_gradient_start.value = "";
                                if (this.widgets_by_name.text_gradient_end) this.widgets_by_name.text_gradient_end.value = "";
                                if (this.widgets_by_name.text_gradient_angle) this.widgets_by_name.text_gradient_angle.value = 0;
                                
                                this.uiState.textColor = textColorInput.value;
                                if (this.widgets_by_name.text_color) this.widgets_by_name.text_color.value = textColorInput.value;
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
                                
                                gradientToggle.checked = false;
                                gradientToggle.dispatchEvent(new Event('change')); 
                                updatePreview.call(this);
                            };
                        });

                        gradientToggle.onchange = () => {
                            const isChecked = gradientToggle.checked;
                            gradientControls.style.opacity = isChecked ? '1' : '0.5';
                            gradientControls.style.pointerEvents = isChecked ? 'all' : 'none';
                            gradientToggle.nextElementSibling.lastElementChild.style.transform = 
                                isChecked ? 'translateX(22px)' : 'translateX(0)';
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
                        
                        
                        gradientControls.style.opacity = gradientToggle.checked ? '1' : '0.5';
                        gradientControls.style.pointerEvents = gradientToggle.checked ? 'all' : 'none';
                        gradientToggle.nextElementSibling.lastElementChild.style.transform = 
                            gradientToggle.checked ? 'translateX(22px)' : 'translateX(0)';
                    };

                    
                    const onOk = (dialog) => {
                        
                        this.serialize_widgets(); 
                    };

                    
                    this._createDialog("Color Settings", contentHTML, onSetup, onOk);
                },

                
                renderFallbackIcon(ctx, tool, x, y, size, color) {
                    ctx.fillStyle = color;
                    ctx.font = `bold ${size * 0.8}px Arial`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    let fallbackChar = "?";
                    if (tool.action === 'editText') fallbackChar = "T";
                    else if (tool.action === 'toggleBold') fallbackChar = "B";
                    else if (tool.action === 'toggleItalic') fallbackChar = "I";
                    else if (tool.action.includes('align')) fallbackChar = "A";
                    else if (tool.action.includes('Color')) fallbackChar = "C";
                    else if (tool.action.includes('Font')) fallbackChar = "F";
                    else if (tool.action === 'openMoveDialog') fallbackChar = "+";
                    else if (tool.action === 'openFrameSizeDialog') fallbackChar = "□";

                    ctx.fillText(fallbackChar, x + size / 2, y + size / 2);
                }
            });
        }
    }
});



