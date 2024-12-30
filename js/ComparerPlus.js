import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

function imageDataToUrl(data) {
    return api.apiURL(`/view?filename=${encodeURIComponent(data.filename)}&type=${data.type}&subfolder=${encodeURIComponent(data.subfolder)}${app.getPreviewFormatParam()}${app.getRandParam()}`);
}

const COMPARE_MODES = {
    SLIDE: "Slide",
    FADE: "Fade",
    SIDE_BY_SIDE: "Side by Side",
    GRID: "Grid"
};

const SHORTCUTS = {
    "1": COMPARE_MODES.SLIDE,
    "2": COMPARE_MODES.FADE,
    "3": COMPARE_MODES.SIDE_BY_SIDE,
    "4": COMPARE_MODES.GRID,
    "r": "reset",
    "i": "info"
};

function isInBounds(x, y, area) {
    if (!area) return false;
    return x >= area.x && 
           x <= area.x + area.width && 
           y >= area.y && 
           y <= area.y + area.height;
}

function drawGradientBox(ctx, x, y, width, height, isHovered = false) {
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    if (isHovered) {
        gradient.addColorStop(0, "rgba(70,70,70,0.95)");
        gradient.addColorStop(1, "rgba(50,50,50,0.95)");
    } else {
        gradient.addColorStop(0, "rgba(40,40,40,0.9)");
        gradient.addColorStop(1, "rgba(20,20,20,0.9)");
    }
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 6);
    ctx.fill();
    
    ctx.strokeStyle = isHovered ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.stroke();
}

app.registerExtension({
    name: "SKB.ImageComparer",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "ImageComparer") {
            nodeType["@compare_mode"] = {
                type: "combo",
                values: Object.values(COMPARE_MODES),
                default: COMPARE_MODES.SLIDE
            };

            const hiddenProperties = ["zoom", "panX", "panY"];
            hiddenProperties.forEach(prop => {
                nodeType[prop] = nodeType[prop] || { hidden: true };
            });

            nodeType.prototype.onNodeCreated = function() {
                this.serialize_widgets = true;
                this.isPointerDown = false;
                this.isPointerOver = false;
                this.imgs = [];
                this.properties = this.properties || {}; 
                this.properties.compare_mode = this.properties.compare_mode || COMPARE_MODES.SLIDE;
                this.properties.dividerPosition = this.properties.dividerPosition || 0.5;
                this.properties.fadeOpacity = this.properties.fadeOpacity || 0.5;
                this.properties.showInfo = true;
                this.properties.gridSize = this.properties.gridSize || 4;
                this.size = this.size || [350, 250];
                
                this.size[0] = Math.max(this.size[0], 200);
                this.size[1] = Math.max(this.size[1], 150);
                
                if (this.widgets) {
                    this.widgets.length = 0;
                }

                this.addContextMenu();
                this.bindKeyboardEvents();
            };

            nodeType.prototype.bindKeyboardEvents = function() {
                window.addEventListener('keydown', (e) => {
                    if (!this.isPointerOver) return;
                    
                    const key = e.key.toLowerCase();
                    if (SHORTCUTS[key]) {
                        if (SHORTCUTS[key] === "reset") {
                            this.resetView();
                        } else if (SHORTCUTS[key] === "info") {
                            this.properties.showInfo = !this.properties.showInfo;
                        } else {
                            this.properties.compare_mode = SHORTCUTS[key];
                        }
                        this.setDirtyCanvas(true);
                        e.preventDefault();
                        e.stopPropagation();
                    }
                });
            };

            nodeType.prototype.resetView = function() {
                this.setDirtyCanvas(true);
            };

            nodeType.prototype.addContextMenu = function() {
                this.context_menu = [
                    {
                        content: "Reset View",
                        callback: () => this.resetView()
                    },
                    null,
                    {
                        content: "Mode: Slide",
                        callback: () => {
                            this.properties.compare_mode = COMPARE_MODES.SLIDE;
                            this.setDirtyCanvas(true);
                        }
                    },
                    {
                        content: "Mode: Fade",
                        callback: () => {
                            this.properties.compare_mode = COMPARE_MODES.FADE;
                            this.setDirtyCanvas(true);
                        }
                    },
                    {
                        content: "Mode: Side by Side",
                        callback: () => {
                            this.properties.compare_mode = COMPARE_MODES.SIDE_BY_SIDE;
                            this.setDirtyCanvas(true);
                        }
                    },
                    {
                        content: "Mode: Grid",
                        callback: () => {
                            this.properties.compare_mode = COMPARE_MODES.GRID;
                            this.setDirtyCanvas(true);
                        }
                    }
                ];
            };

            nodeType.prototype.onExecuted = function(message) {
                const images = message?.images || message?.ui?.images;
                if (images && Array.isArray(images)) {
                    const imageObjects = [];
                    
                    if (images.length > 0) {
                        const img1 = new Image();
                        const url1 = imageDataToUrl(images[0]);
                        img1.src = url1;
                        img1.onload = () => {
                            this.setDirtyCanvas(true);
                        };
                        imageObjects.push(img1);
                    }
                    
                    if (images.length > 1) {
                        const img2 = new Image();
                        const url2 = imageDataToUrl(images[1]);
                        img2.src = url2;
                        img2.onload = () => {
                            this.setDirtyCanvas(true);
                        };
                        imageObjects.push(img2);
                    }
                    
                    this.imgs = imageObjects;
                }
            };

            nodeType.prototype.drawSlideMode = function(ctx, width, height) {
                if (!this.imgs[0]?.complete || !this.imgs[1]?.complete) return;

                const dividerX = width * this.properties.dividerPosition;
                
                ctx.save();
                
                const img1 = this.imgs[0];
                const img1Ratio = img1.width / img1.height;
                this.drawImageFitted(ctx, img1, 0, 0, width, height);

                ctx.save();
                ctx.beginPath();
                ctx.rect(0, 0, dividerX, height);
                ctx.clip();
                
                const img2 = this.imgs[1];
                this.drawImageFitted(ctx, img2, 0, 0, width, height, img1Ratio);
                ctx.restore();

                this.drawDivider(ctx, dividerX, height);
                
                ctx.restore();
            };

            nodeType.prototype.drawImageFitted = function(ctx, img, x, y, width, height, forceAspectRatio = null) {
                const imgRatio = forceAspectRatio || (img.width / img.height);
                const targetRatio = width / height;
                
                let drawWidth, drawHeight;
                
                if (imgRatio > targetRatio) {
                    drawWidth = width;
                    drawHeight = width / imgRatio;
                    const yOffset = (height - drawHeight) / 2;
                    ctx.drawImage(img, x, y + yOffset, drawWidth, drawHeight);
                } else {
                    drawHeight = height;
                    drawWidth = height * imgRatio;
                    const xOffset = (width - drawWidth) / 2;
                    ctx.drawImage(img, x + xOffset, y, drawWidth, drawHeight);
                }
            };

            nodeType.prototype.drawFadeMode = function(ctx, width, height) {
                if (!this.imgs[0]?.complete || !this.imgs[1]?.complete) return;

                const opacity = this.properties.fadeOpacity;
                
                ctx.save();
                
                this.drawImageFitted(ctx, this.imgs[0], 0, 0, width, height);
                
                ctx.globalAlpha = opacity;
                this.drawImageFitted(ctx, this.imgs[1], 0, 0, width, height);
                
                ctx.restore();

                this.drawOpacitySlider(ctx, width, height);
            };

            nodeType.prototype.drawOpacitySlider = function(ctx, width, height) {
                if (this.properties.compare_mode !== COMPARE_MODES.FADE) return;

                const sliderWidth = 20;
                const sliderHeight = Math.min(height * 0.6, 200);
                const padding = 10;
                const x = width - sliderWidth - padding;
                const y = (height - sliderHeight) / 2;

                this.opacitySliderArea = {
                    x: x,
                    y: y,
                    width: sliderWidth,
                    height: sliderHeight
                };

                ctx.fillStyle = "rgba(0,0,0,0.7)";
                ctx.beginPath();
                ctx.roundRect(x, y, sliderWidth, sliderHeight, 4);
                ctx.fill();

                const fillHeight = sliderHeight * this.properties.fadeOpacity;
                ctx.fillStyle = "rgba(255,255,255,0.8)";
                ctx.beginPath();
                ctx.roundRect(x, y + sliderHeight - fillHeight, sliderWidth, fillHeight, 4);
                ctx.fill();

                const handleY = y + sliderHeight - (sliderHeight * this.properties.fadeOpacity);
                const handleHeight = 4;
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.roundRect(x - 2, handleY - handleHeight/2, sliderWidth + 4, handleHeight, 2);
                ctx.fill();

                const opacity = Math.round(this.properties.fadeOpacity * 100);
                ctx.fillStyle = "#ffffff";
                ctx.font = "12px Arial";
                ctx.textAlign = "center";
                ctx.fillText(`${opacity}%`, x + sliderWidth/2, y - 5);
            };

            nodeType.prototype.drawSideBySideMode = function(ctx, width, height) {
                if (!this.imgs[0]?.complete || !this.imgs[1]?.complete) return;

                const dividerX = width * this.properties.dividerPosition;
                
                ctx.save();
                
                ctx.beginPath();
                ctx.rect(0, 0, width/2, height);
                ctx.clip();
                this.drawImage(ctx, this.imgs[0], width/2, height);
                ctx.restore();
                
                ctx.save();
                ctx.beginPath();
                ctx.rect(width/2, 0, width/2, height);
                ctx.clip();
                this.drawImage(ctx, this.imgs[1], width/2, height, width/2);
                ctx.restore();

                this.drawDivider(ctx, width/2, height);
            };

            nodeType.prototype.drawGridMode = function(ctx, width, height) {
                if (!this.imgs[0]?.complete || !this.imgs[1]?.complete) return;

                const gridSize = this.properties.gridSize;
                const cellWidth = width / gridSize;
                const cellHeight = height / gridSize;

                ctx.save();

                this.drawImageFitted(ctx, this.imgs[0], 0, 0, width, height);

                for (let y = 0; y < gridSize; y++) {
                    for (let x = 0; x < gridSize; x++) {
                        if ((x + y) % 2 === 1) {
                            ctx.save();
                            ctx.beginPath();
                            ctx.rect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
                            ctx.clip();
                            this.drawImageFitted(ctx, this.imgs[1], 0, 0, width, height);
                            ctx.restore();
                        }
                    }
                }

                ctx.strokeStyle = "rgba(255,255,255,0.5)";
                ctx.lineWidth = 1;
                
                for (let y = 1; y < gridSize; y++) {
                    ctx.beginPath();
                    ctx.moveTo(0, y * cellHeight);
                    ctx.lineTo(width, y * cellHeight);
                    ctx.stroke();
                }
                
                for (let x = 1; x < gridSize; x++) {
                    ctx.beginPath();
                    ctx.moveTo(x * cellWidth, 0);
                    ctx.lineTo(x * cellWidth, height);
                    ctx.stroke();
                }

                ctx.restore();

                this.drawGridSizeControl(ctx, width, height);
            };

            nodeType.prototype.drawGridSizeControl = function(ctx, width, height) {
                const controlWidth = 120;
                const controlHeight = 24;
                const padding = 5;
                const x = width - controlWidth - padding;
                const y = this.modeButtonArea.y + this.modeButtonArea.height + padding;

                this.gridControlArea = {
                    x: x,
                    y: y,
                    width: controlWidth,
                    height: controlHeight
                };

                const gradient = ctx.createLinearGradient(x, y, x, y + controlHeight);
                gradient.addColorStop(0, "rgba(0,0,0,0.8)");
                gradient.addColorStop(1, "rgba(0,0,0,0.9)");

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.roundRect(x, y, controlWidth, controlHeight, 6);
                ctx.fill();

                ctx.strokeStyle = "rgba(255,255,255,0.1)";
                ctx.lineWidth = 1;
                ctx.stroke();

                const buttonWidth = 24;
                this.gridMinusButton = {x, y, width: buttonWidth, height: controlHeight};
                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 16px Arial";
                ctx.textAlign = "center";
                ctx.fillText("-", x + buttonWidth/2, y + controlHeight - 7);

                this.gridPlusButton = {
                    x: x + controlWidth - buttonWidth,
                    y,
                    width: buttonWidth,
                    height: controlHeight
                };
                ctx.fillText("+", x + controlWidth - buttonWidth/2, y + controlHeight - 7);

                ctx.font = "12px Arial";
                ctx.fillText(`Grid: ${this.properties.gridSize}x${this.properties.gridSize}`, x + controlWidth/2, y + controlHeight - 7);
            };

            nodeType.prototype.drawImage = function(ctx, img, width, height, offsetX = 0) {
                const imgAspect = img.width / img.height;
                const nodeAspect = width / height;
                
                let w, h;
                if (imgAspect > nodeAspect) {
                    w = width;
                    h = width / imgAspect;
                } else {
                    h = height;
                    w = height * imgAspect;
                }
                
                const x = offsetX + (width - w) / 2;
                const y = (height - h) / 2;
                ctx.drawImage(img, x, y, w, h);
            };

            nodeType.prototype.drawDivider = function(ctx, x, height) {
                const img = this.imgs[0];
                if (!img?.complete) return;

                const imgAspect = img.width / img.height;
                const nodeAspect = this.size[0] / this.size[1];
                
                let imageArea = {x: 0, y: 0, width: this.size[0], height: this.size[1]};
                
                if (imgAspect > nodeAspect) {
                    const h = this.size[0] / imgAspect;
                    imageArea.y = (this.size[1] - h) / 2;
                    imageArea.height = h;
                } else {
                    const w = this.size[1] * imgAspect;
                    imageArea.x = (this.size[0] - w) / 2;
                    imageArea.width = w;
                }

                const handleRadius = Math.min(12, imageArea.width * 0.03);
                const hitArea = handleRadius * 3;
                
                x = Math.max(imageArea.x, Math.min(x, imageArea.x + imageArea.width));
                
                this.dividerHitArea = {
                    x: x - hitArea/2,
                    y: imageArea.y,
                    width: hitArea,
                    height: imageArea.height
                };

                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, imageArea.y);
                ctx.lineTo(x, imageArea.y + imageArea.height);
                ctx.stroke();

                if (this.properties.compare_mode === COMPARE_MODES.SIDE_BY_SIDE) {
                    return;
                }

                const handleY = imageArea.y + imageArea.height/2;
                
                ctx.fillStyle = "rgba(255,255,255,0.8)";
                ctx.beginPath();
                ctx.arc(x, handleY, handleRadius, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = "rgba(0,0,0,0.3)";
                ctx.lineWidth = 1;
                ctx.stroke();

                const arrowSize = handleRadius / 2;
                ctx.fillStyle = "rgba(0,0,0,0.5)";
                
                ctx.beginPath();
                ctx.moveTo(x - arrowSize, handleY);
                ctx.lineTo(x - arrowSize/2, handleY - arrowSize/2);
                ctx.lineTo(x - arrowSize/2, handleY + arrowSize/2);
                ctx.closePath();
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(x + arrowSize, handleY);
                ctx.lineTo(x + arrowSize/2, handleY - arrowSize/2);
                ctx.lineTo(x + arrowSize/2, handleY + arrowSize/2);
                ctx.closePath();
                ctx.fill();
            };

            nodeType.prototype.drawImageInfo = function(ctx, img, x, y, label) {
                if (!img?.complete || !this.properties.showInfo) return;
                
                const padding = 8;
                const height = 28;
                const minWidth = 140;
                
                const info = `${img.width}x${img.height}`;
                const ratio = (img.width / img.height).toFixed(2);
                const infoText = `${info} (${ratio})`;
                
                ctx.font = "12px Arial";
                const infoWidth = ctx.measureText(infoText).width;
                const labelWidth = ctx.measureText(label).width;
                const boxWidth = Math.max(minWidth, labelWidth + infoWidth + padding * 3);
                
                let finalX = x;
                let finalY = this.size[1] - height - padding;
                
                if (x > this.size[0] / 2) {
                    finalX = this.size[0] - boxWidth - padding;
                } else {
                    finalX = padding;
                }
                
                const gradient = ctx.createLinearGradient(finalX, finalY, finalX, finalY + height);
                gradient.addColorStop(0, "rgba(0,0,0,0.8)");
                gradient.addColorStop(1, "rgba(0,0,0,0.9)");
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.roundRect(finalX, finalY, boxWidth, height, 6);
                ctx.fill();
                
                ctx.strokeStyle = "rgba(255,255,255,0.1)";
                ctx.lineWidth = 1;
                ctx.stroke();
                
                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 12px Arial";
                ctx.fillText(label, finalX + padding, finalY + height - padding - 2);
                
                ctx.font = "12px Arial";
                ctx.fillStyle = "rgba(255,255,255,0.8)";
                ctx.fillText(infoText, finalX + boxWidth - infoWidth - padding, finalY + height - padding - 2);
            };

            nodeType.prototype.drawModeButton = function(ctx, x, y, width, height, text, isHovered) {
                drawGradientBox(ctx, x, y, width, height, isHovered);
                
                ctx.fillStyle = isHovered ? "#ffffff" : "rgba(255,255,255,0.9)";
                ctx.font = "12px Arial";
                ctx.textAlign = "center";
                ctx.fillText(text, x + width/2, y + height/2 + 4);
            };

            nodeType.prototype.updateCursor = function(x, y) {
                let cursor = 'default';
                
                if (this.properties.compare_mode === COMPARE_MODES.FADE && 
                    isInBounds(x, y, this.opacitySliderArea)) {
                    cursor = 'ns-resize';
                }
                else if (isInBounds(x, y, this.modeButtonArea)) {
                    cursor = 'pointer';
                }
                else if (isInBounds(x, y, this.dividerHitArea)) {
                    cursor = 'ew-resize';
                }
                
                if (document.body.style.cursor !== cursor) {
                    document.body.style.cursor = cursor;
                }
            };

            nodeType.prototype.onMouseMove = function(event) {
                const [x, y] = this.getLocalMousePos(event);
                
                this.updateCursor(x, y);

                if (event.buttons === 1) {
                    if (this.isOpacitySliderDragging) {
                        const relativeY = (y - this.opacitySliderArea.y) / this.opacitySliderArea.height;
                        this.properties.fadeOpacity = 1 - Math.max(0, Math.min(1, relativeY));
                        this.setDirtyCanvas(true);
                        return true;
                    }

                    if (this.isPointerDown) {
                        this.properties.dividerPosition = Math.max(0, Math.min(1, x / this.size[0]));
                        this.setDirtyCanvas(true);
                        return true;
                    }
                }
                
                this.isMouseOverMode = isInBounds(x, y, this.modeButtonArea);
                if (this.isMouseOverMode) {
                    this.setDirtyCanvas(true);
                }
                
                return false;
            };

            nodeType.prototype.onMouseUp = function(event) {
                this.isPointerDown = false;
                this.isOpacitySliderDragging = false;
                document.body.style.cursor = 'default';
                return false;
            };

            nodeType.prototype.onMouseWheel = function(event) {
                return false;
            };

            nodeType.prototype.getLocalMousePos = function(event) {
                if (!event || !app.canvas?.canvas) return [0, 0];
                
                const rect = app.canvas.canvas.getBoundingClientRect();
                const scale = app.canvas.ds.scale;
                const offset = app.canvas.ds.offset;
                
                return [
                    (event.clientX - rect.left) / scale - offset[0] - this.pos[0],
                    (event.clientY - rect.top) / scale - offset[1] - this.pos[1]
                ];
            };

            nodeType.prototype.onPropertyChanged = function(property) {
                if (property === "compare_mode") {
                    this.setDirtyCanvas(true);
                }
            };

            nodeType.prototype.onDrawBackground = function(ctx) {
                if (this.flags.collapsed || !this.imgs.length) return;

                const [width, height] = this.size;

                ctx.save();
                
                ctx.fillStyle = "#333";
                ctx.fillRect(0, 0, width, height);
                
                switch(this.properties.compare_mode) {
                    case COMPARE_MODES.SLIDE:
                        this.drawSlideMode(ctx, width, height);
                        break;
                    case COMPARE_MODES.FADE:
                        this.drawFadeMode(ctx, width, height);
                        break;
                    case COMPARE_MODES.SIDE_BY_SIDE:
                        this.drawSideBySideMode(ctx, width, height);
                        break;
                    case COMPARE_MODES.GRID:
                        this.drawGridMode(ctx, width, height);
                        break;
                }
                
                ctx.restore();
                
                ctx.save();
                
                if (this.imgs[0]?.complete) {
                    this.drawImageInfo(ctx, this.imgs[0], 5, height - 25, "Image A");
                }
                if (this.imgs[1]?.complete) {
                    this.drawImageInfo(ctx, this.imgs[1], width - 105, height - 25, "Image B");
                }

                const padding = 5;
                const topBarHeight = 25;
                let rightOffset = padding;

                ctx.font = "12px Arial";
                const modeText = this.properties.compare_mode;
                const modeWidth = ctx.measureText(modeText).width + padding * 2;
                
                this.modeButtonArea = {
                    x: width - rightOffset - modeWidth,
                    y: padding,
                    width: modeWidth,
                    height: topBarHeight
                };
                
                this.drawModeButton(ctx, this.modeButtonArea.x, this.modeButtonArea.y, modeWidth, topBarHeight, modeText, this.isMouseOverMode);

                if (this.properties.compare_mode === COMPARE_MODES.GRID) {
                    this.drawGridSizeControl(ctx, width, height);
                }
                
                ctx.restore();
            };

            nodeType.prototype.onMouseEnter = function(event) {
                this.isPointerOver = true;
            };

            nodeType.prototype.onMouseLeave = function(event) {
                this.isPointerOver = false;
                this.isPointerDown = false;
                this.isOpacitySliderDragging = false;
                document.body.style.cursor = 'default';
            };

            nodeType.prototype.onMouseDown = function(event) {
                const [x, y] = this.getLocalMousePos(event);
                
                if (this.properties.compare_mode === COMPARE_MODES.GRID) {
                    if (this.gridMinusButton &&
                        x >= this.gridMinusButton.x &&
                        x <= this.gridMinusButton.x + this.gridMinusButton.width &&
                        y >= this.gridMinusButton.y &&
                        y <= this.gridMinusButton.y + this.gridMinusButton.height) {
                        
                        this.properties.gridSize = Math.max(2, this.properties.gridSize - 1);
                        this.setDirtyCanvas(true);
                        return true;
                    }
                    
                    if (this.gridPlusButton &&
                        x >= this.gridPlusButton.x &&
                        x <= this.gridPlusButton.x + this.gridPlusButton.width &&
                        y >= this.gridPlusButton.y &&
                        y <= this.gridPlusButton.y + this.gridPlusButton.height) {
                        
                        this.properties.gridSize = Math.min(8, this.properties.gridSize + 1);
                        this.setDirtyCanvas(true);
                        return true;
                    }
                }

                if (this.properties.compare_mode === COMPARE_MODES.FADE &&
                    this.opacitySliderArea &&
                    x >= this.opacitySliderArea.x &&
                    x <= this.opacitySliderArea.x + this.opacitySliderArea.width &&
                    y >= this.opacitySliderArea.y &&
                    y <= this.opacitySliderArea.y + this.opacitySliderArea.height) {
                    
                    this.isOpacitySliderDragging = true;
                    const relativeY = (y - this.opacitySliderArea.y) / this.opacitySliderArea.height;
                    this.properties.fadeOpacity = 1 - Math.max(0, Math.min(1, relativeY));
                    this.setDirtyCanvas(true);
                    return true;
                }
                
                if (this.modeButtonArea && 
                    x >= this.modeButtonArea.x && 
                    x <= this.modeButtonArea.x + this.modeButtonArea.width &&
                    y >= this.modeButtonArea.y && 
                    y <= this.modeButtonArea.y + this.modeButtonArea.height) {
                    
                    const modes = Object.values(COMPARE_MODES);
                    const currentIndex = modes.indexOf(this.properties.compare_mode);
                    const nextIndex = (currentIndex + 1) % modes.length;
                    this.properties.compare_mode = modes[nextIndex];
                    this.setDirtyCanvas(true);
                    return true;
                }
                
                if (this.dividerHitArea && 
                    x >= this.dividerHitArea.x && 
                    x <= this.dividerHitArea.x + this.dividerHitArea.width &&
                    y >= this.dividerHitArea.y && 
                    y <= this.dividerHitArea.y + this.dividerHitArea.height) {
                    
                    this.isPointerDown = true;
                    this.properties.dividerPosition = Math.max(0, Math.min(1, x / this.size[0]));
                    this.setDirtyCanvas(true);
                    return true;
                }
                return false;
            };
        }
    }
});