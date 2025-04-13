import { app } from "../../scripts/app.js";
import { ComfyWidgets } from "../../scripts/widgets.js";

app.registerExtension({
    name: "SKB.DisplayEverything",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name !== "DisplayEverything") return;

        const prototype = nodeType.prototype;
        
        prototype.onNodeCreated = function() {
            console.log("Node created");
            this.size = [320, 180];
            this.originalText = "";
            this.fonts = ['Arial', 'Verdana', 'Georgia', 'Tahoma', 'Helvetica', 'Open Sans', 'Roboto', 'Lato', 'Merriweather', 'PT Sans'];
            this.selectedFontIndex = 0;
            
            this.createWidget();
        };

        prototype.createWidget = function() {
            const widget = ComfyWidgets.STRING(this, "output", ["STRING", { multiline: true, readonly: true }], app);
            this.showValueWidget = widget.widget;
            
            const self = this;
            if (this.showValueWidget) {
                this.showValueWidget.callback = function(value) {
                    self.onWidgetChanged("output", value);
                };
            }
            
            this.setupWidget();
        };

        prototype.setupWidget = function() {
            if (!this.showValueWidget || !this.showValueWidget.inputEl || !this.fonts) return;

            const inputEl = this.showValueWidget.inputEl;
            inputEl.id = inputEl.id || `inputEl-${this.id}`;
            const currentFont = this.fonts[this.selectedFontIndex] || 'Arial';
            
            const toolbarHeight = 10;
            const padding = 1;
            
            const currentStyle = {
                fontSize: inputEl.style.fontSize || '14px',
                fontWeight: inputEl.style.fontWeight || 'normal',
                fontStyle: inputEl.style.fontStyle || 'normal',
                color: inputEl.style.color || '#ffffff',
                backgroundColor: this.backgroundColor || 'rgba(0, 0, 0, 0.7)'
            };

            inputEl.readOnly = true;
            inputEl.spellcheck = false;
            
            inputEl.style.fontFamily = `'${currentFont}', sans-serif`;
            
            inputEl.style.cssText = `
                color: ${currentStyle.color};
                border: none;
                border-radius: 8px;
                padding: 8px;
                font-family: '${currentFont}', sans-serif !important;
                font-size: ${currentStyle.fontSize};
                font-weight: ${currentStyle.fontWeight};
                font-style: ${currentStyle.fontStyle};
                line-height: 1.6;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                position: absolute;
                left: ${padding}px;
                right: ${padding}px;
                top: ${toolbarHeight + padding}px;
                height: calc(100% - ${toolbarHeight + padding + 10}px);
                width: calc(100% - ${padding * 2}px);
                overflow-y: auto;
                overflow-x: hidden;
                z-index: 1;
                white-space: pre-wrap;
                word-wrap: break-word;
                background-color: ${currentStyle.backgroundColor};
                box-sizing: border-box;
                resize: none;
                user-select: text;
                cursor: default;
            `;
            
            this.setDirtyCanvas(true, true);
        };

        prototype.onDrawForeground = function(ctx) {
            if (this.flags.collapsed) return;
            this.drawIconPanel(ctx);
        };

        prototype.drawIconPanel = function(ctx) {
            ctx.fillStyle = "rgba(45, 45, 45, 0.9)";
            ctx.fillRect(0, 0, this.size[0], 40);

            const icons = [
                { color: '#000000', icon: '⬤', fontSize: '14px' },
                { color: '#cccccc', icon: '⬤', fontSize: '14px' },
                { color: '#ffffff', icon: '⬤', fontSize: '14px' },
                { icon: '⚙️', fontSize: '14px' },
                { icon: 'I', fontSize: '14px' },
                { icon: 'B', fontSize: '14px' },
                { icon: '+', fontSize: '14px' },
                { icon: '-', fontSize: '14px' },
                { icon: '❏', fontSize: '14px' }
            ];

            this.drawIcons(ctx, icons);
        };

        prototype.drawIcons = function(ctx, icons) {
            const iconWidth = 20;
            const iconSpacing = 4;
            const rightMargin = 25;
            let xPosition = this.size[0] - iconWidth - rightMargin;

            icons.forEach(icon => {
                ctx.fillStyle = icon.color || '#ffffff';
                ctx.font = (icon.fontSize || '16px') + ' Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(icon.icon, xPosition + iconWidth / 2, 20);
                xPosition -= (iconWidth + iconSpacing);
            });
        };

        prototype.openFontDialog = function() {
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #252525;
                padding: 20px;
                border-radius: 8px;
                z-index: 10000;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                width: 300px;
                max-height: 400px;
                display: flex;
                flex-direction: column;
            `;

            const title = document.createElement('div');
            title.textContent = 'Font Selection';
            title.style.cssText = `
                color: white;
                font-size: 16px;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #444;
            `;
            dialog.appendChild(title);

            const fontList = document.createElement('div');
            fontList.style.cssText = `
                overflow-y: auto;
                margin-bottom: 15px;
                max-height: 250px;
            `;

            const self = this;
            this.fonts.forEach((font, index) => {
                const fontOption = document.createElement('div');
                fontOption.textContent = font;
                fontOption.style.cssText = `
                    color: white;
                    padding: 8px 12px;
                    margin: 4px 0;
                    cursor: pointer;
                    border-radius: 4px;
                    font-family: '${font}', sans-serif;
                    background: ${this.selectedFontIndex === index ? '#444' : 'transparent'};
                `;

                fontOption.onmouseover = () => {
                    if (this.selectedFontIndex !== index) {
                        fontOption.style.background = '#333';
                    }
                };

                fontOption.onmouseout = () => {
                    if (this.selectedFontIndex !== index) {
                        fontOption.style.background = 'transparent';
                    }
                };

                fontOption.onclick = () => {
                    self.selectedFontIndex = index;
                    
                    if (self.showValueWidget && self.showValueWidget.inputEl) {
                        const inputEl = self.showValueWidget.inputEl;
                        
                        inputEl.style.fontFamily = `'${font}', sans-serif`;
                        
                        self.setupWidget();
                        
                        self.setDirtyCanvas(true, true);
                    }
                    
                    document.body.removeChild(dialog);
                };

                fontList.appendChild(fontOption);
            });

            dialog.appendChild(fontList);

            const buttonContainer = document.createElement('div');
            buttonContainer.style.cssText = `
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 10px;
            `;

            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'İptal';
            cancelButton.style.cssText = `
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                background: #444;
                color: white;
                cursor: pointer;
                transition: background 0.2s;
            `;
            cancelButton.onmouseover = () => {
                cancelButton.style.background = '#555';
            };
            cancelButton.onmouseout = () => {
                cancelButton.style.background = '#444';
            };
            cancelButton.onclick = () => document.body.removeChild(dialog);

            buttonContainer.appendChild(cancelButton);
            dialog.appendChild(buttonContainer);

            document.body.appendChild(dialog);
        };

        prototype.onMouseDown = function(event) {
            const localY = event.canvasY - this.pos[1];
            const localX = event.canvasX - this.pos[0];

            if (localY >= 40) return;

            const iconWidth = 20;
            const iconSpacing = 4;
            const rightMargin = 25;
            let xPosition = this.size[0] - iconWidth - rightMargin;

            const actions = [
                () => this.setColor('#000000'),
                () => this.setColor('#cccccc'),
                () => this.setColor('#ffffff'),
                () => this.openFontDialog(),
                this.toggleItalic,
                this.toggleBold,
                this.increaseFontSize,
                this.decreaseFontSize,
                () => this.openBackgroundColorDialog()
            ];

            const iconPositions = actions.map((_, index) => {
                const x = xPosition - (index * (iconWidth + iconSpacing));
                return {
                    x: x,
                    y: 0,
                    width: iconWidth,
                    height: 40,
                    action: actions[index]
                };
            });

            for (const pos of iconPositions) {
                if (localX >= pos.x && localX < pos.x + pos.width &&
                    localY >= pos.y && localY < pos.y + pos.height) {
                    pos.action.call(this);
                    this.setDirtyCanvas(true);
                    break;
                }
            }
        };

        prototype.decreaseFontSize = function() {
            const currentSize = parseFloat(this.showValueWidget.inputEl.style.fontSize) || 14;
            this.showValueWidget.inputEl.style.fontSize = `${Math.max(12, currentSize - 1)}px`;
        };

        prototype.increaseFontSize = function() {
            const currentSize = parseFloat(this.showValueWidget.inputEl.style.fontSize) || 14;
            this.showValueWidget.inputEl.style.fontSize = `${Math.min(24, currentSize + 1)}px`;
        };

        prototype.toggleBold = function() {
            this.showValueWidget.inputEl.style.fontWeight = 
                this.showValueWidget.inputEl.style.fontWeight === 'bold' ? 'normal' : 'bold';
        };

        prototype.toggleItalic = function() {
            this.showValueWidget.inputEl.style.fontStyle = 
                this.showValueWidget.inputEl.style.fontStyle === 'italic' ? 'normal' : 'italic';
        };

        prototype.setColor = function(color) {
            this.showValueWidget.inputEl.style.color = color;
        };

        prototype.onRemoved = function() {
            if (this.wrapper && this.wrapper.parentNode) {
                this.wrapper.parentNode.removeChild(this.wrapper);
            }
        };

        prototype.onExecuted = function(message) {
            if (message && message.text !== undefined) {
                const text = Array.isArray(message.text) ? message.text[0] : message.text;
                this.originalText = text.replace(/\\u([0-9a-fA-F]{4})/g, (_, grp) => String.fromCharCode(parseInt(grp, 16)))
                                     .replace(/^["']|["']$/g, '');
                this.showValueWidget.value = this.originalText;
                this.setupWidget();
            }
        };

        prototype.onWidgetChanged = function(name, value) {
            if (name === "output" && this.outputs && this.outputs[0]) {
                this.outputs[0].value = value;
                this.originalText = value;
                this.triggerSlot(0, value);
            }
        };

        prototype.setupNode = function() {
            this.size = [320, 240];
            this.fonts = ['Arial', 'Verdana', 'Georgia', 'Tahoma', 'Helvetica', 'Open Sans', 'Roboto', 'Lato', 'Merriweather', 'PT Sans'];
            this.selectedFontIndex = 0;
            this.originalText = "";
            this.fontSelectVisible = false;
        };

        prototype.onSerialize = function(o) {
            o.selectedFontIndex = this.selectedFontIndex;
            o.fontSize = this.showValueWidget?.inputEl?.style.fontSize;
            o.fontWeight = this.showValueWidget?.inputEl?.style.fontWeight;
            o.fontStyle = this.showValueWidget?.inputEl?.style.fontStyle;
            o.textColor = this.showValueWidget?.inputEl?.style.color;
            o.backgroundColor = this.backgroundColor || 'rgba(0, 0, 0, 0.7)';
        };

        prototype.onConfigure = function(o) {
            if (o.selectedFontIndex !== undefined) {
                this.selectedFontIndex = o.selectedFontIndex;
            }
            
            if (this.showValueWidget && this.showValueWidget.inputEl) {
                if (o.fontSize) this.showValueWidget.inputEl.style.fontSize = o.fontSize;
                if (o.fontWeight) this.showValueWidget.inputEl.style.fontWeight = o.fontWeight;
                if (o.fontStyle) this.showValueWidget.inputEl.style.fontStyle = o.fontStyle;
                if (o.textColor) this.showValueWidget.inputEl.style.color = o.textColor;
                if (o.backgroundColor) {
                    this.backgroundColor = o.backgroundColor;
                    this.showValueWidget.inputEl.style.backgroundColor = o.backgroundColor;
                }
                
                this.setupWidget();
            }
        };

        prototype.openBackgroundColorDialog = function() {
            const colorPicker = document.createElement('input');
            colorPicker.type = 'color';
            colorPicker.value = '#000000';
            
            const self = this;
            colorPicker.addEventListener('change', function() {
                if (self.showValueWidget && self.showValueWidget.inputEl) {
                    const hex = this.value;
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    const backgroundColor = `rgba(${r}, ${g}, ${b}, 0.7)`;
                    
                    self.showValueWidget.inputEl.style.backgroundColor = backgroundColor;
                    self.backgroundColor = backgroundColor;
                    self.setDirtyCanvas(true);
                }
                document.body.removeChild(colorPicker);
            });
            
            colorPicker.addEventListener('cancel', function() {
                document.body.removeChild(colorPicker);
            });

            document.body.appendChild(colorPicker);
            colorPicker.click();
        };
    }
});