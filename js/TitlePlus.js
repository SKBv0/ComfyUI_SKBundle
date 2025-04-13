import { app } from "../../../scripts/app.js";
app.registerExtension({
    name: "SKB.TitlePlus",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "TitlePlus") {
            
            const EDIT_ICON_SIZE = 16;
            const EDIT_ICON_MARGIN = 8;
            const EDIT_ICON_DOT_RADIUS = EDIT_ICON_SIZE * 0.1;
            const EDIT_ICON_DOT_SPACING = EDIT_ICON_SIZE * 0.3;
            
            const defaultProperties = {
                title: "Modern Title",
                subtitle: "Sleek Subtitle",
                fontFamily: "Poppins",
                titleFontSize: 28,
                subtitleFontSize: 16,
                titleFontWeight: "bold",
                subtitleFontWeight: "normal",
                titleColor: "#ffffff",
                subtitleColor: "#94A3B8",
                backgroundColor: "#1A1D24",
                borderRadius: 16,
                padding: 24,
                titleSubtitleGap: 10,
                animation: false,
                animationType: "none",
                animationDuration: 500,
                animationEasing: "linear",
                shadow: true,
                shadowColor: "rgba(0,0,0,0.3)",
                shadowBlur: 20,
                shadowOffsetX: 0,
                shadowOffsetY: 8,
                textAlign: "left",
                gradientBackground: true,
                gradientStartColor: "#1E293B",
                gradientEndColor: "#0F172A",
                customBackground: false,
                backgroundUrl: "",
                backgroundOpacity: 0.7,
                backgroundBlur: 0,
                backgroundScale: 1.0,
                backgroundPosition: "center",
                backgroundFit: "cover",
                backgroundOverlay: true,
                backgroundOverlayColor: "rgba(0,0,0,0.4)",
                gradientType: "linear",
                gradientAngle: 145,
                dividerEnabled: true,
                dividerColor: "#ffffff",
                dividerWidth: 1,
                dividerLength: 180,
                dividerOpacity: 0.2,
            };
            const options = {
                textAlign: ["left", "center", "right"],
                fontFamily: [
                    { value: "Inter", label: "Inter", weight: "300,400,500,600,700" },
                    { value: "Roboto", label: "Roboto", weight: "300,400,500,700" },
                    { value: "Poppins", label: "Poppins", weight: "300,400,500,600,700" },
                    { value: "Montserrat", label: "Montserrat", weight: "300,400,500,600,700" },
                    { value: "Open Sans", label: "Open Sans", weight: "300,400,600,700" }
                ],
                fontWeight: [
                    { value: "normal", label: "Normal" },
                    { value: "bold", label: "Bold" }
                ],
                titleFontSize: [24, 36, 48, 60, 72],
                titleFontWeight: ["normal", "bold"],
                subtitleFontSize: [18, 24, 30, 36, 42],
                subtitleFontWeight: ["normal", "bold"],
                textColor: ["#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#00ffff", "#ff00ff"],
                backgroundColor: ["#000000", "#333333", "#666666", "#999999", "rgba(0,0,0,0)"],
                accentColor: ["#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#00ffff", "#ff00ff"],
                borderRadius: [0, 5, 10, 15, 20],
                padding: [0, 5, 10, 15, 20, 25, 30],
                titleSubtitleGap: [0, 5, 10, 15, 20],
                animation: ["none", "fade", "slide", "bounce", "rotate", "shake"],
                animationDuration: [500, 1000, 1500, 2000],
                shadowColor: ["#000000", "#333333", "#666666", "#999999", "rgba(0,0,0,0)"],
                shadowBlur: [0, 5, 10, 15, 20],
                shadowOffsetX: [-10, -5, 0, 5, 10],
                shadowOffsetY: [-10, -5, 0, 5, 10],
                gradientStartColor: ["#000000", "#333333", "#666666", "#999999", "rgba(0,0,0,0)"],
                gradientEndColor: ["#000000", "#333333", "#666666", "#999999", "rgba(0,0,0,0)"],
                animationType: ["none", "fade", "slide", "bounce", "rotate", "shake"],
                animationEasing: ["linear", "easeInQuad", "easeOutQuad", "easeInOutQuad", 
                                 "easeInCubic", "easeOutCubic", "easeInOutCubic",
                                 "easeInElastic", "easeOutElastic", "easeInOutElastic"],
                backgroundPosition: ["center", "top", "bottom", "left", "right"],
                backgroundFit: ["cover", "contain", "stretch"],
                gradientType: ["linear", "radial", "conic"],
                gradientAngle: [0, 45, 90, 135, 180, 225, 270, 315]
            };
            nodeType.prototype.onNodeCreated = function() {
                this.properties = {...defaultProperties};
                this.outputs = [];
                for (let key in this.properties) {
                    if (key in options) {
                        this.addProperty(
                            key, 
                            this.properties[key], 
                            "enum", 
                            { values: options[key] }
                        );
                    } else if (typeof this.properties[key] === "boolean") {
                        this.addProperty(key, this.properties[key], "boolean");
                    } else {
                        this.addProperty(key, this.properties[key], "string");
                    }
                }
                this.serialize_widgets = true;
                this.size = this.computeSize();
                this.color = "#333333";
                this.bgcolor = "#353535";
                this.flags = {
                    allow_interaction: true,
                    resizable: true,
                    draggable: true
                };
                this.originalPos = this.pos ? [...this.pos] : [0, 0];
                this.originalSize = this.size ? [...this.size] : [200, 100];
                this.rotation = 0;
                this.fadeProgress = undefined;
                this.animationTimer = null;
                this.properties.animation = false;
                this.properties.animationType = "none";
                this.properties.animationDuration = 500;
                this.properties.animationEasing = "linear";
                this.isAnimating = false;
                this.currentAnimationType = "none";
                this.loadFonts();
                this.resizable = true;
                this.size = this.computeSize();
                this.setSize(this.size);
            };
            
            const loadedFonts = new Set();
            nodeType.prototype.loadFonts = function() {
                const fontsToLoad = options.fontFamily
                    .filter(font => !loadedFonts.has(font.value));
                
                if (fontsToLoad.length > 0) {
                    const fontQueryString = fontsToLoad.map(font => 
                        `family=${font.value.replace(' ', '+')}:wght@${font.weight}`
                    ).join('&');
                    
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = `https://fonts.googleapis.com/css2?${fontQueryString}&display=swap`;
                    document.head.appendChild(link);
                    
                    fontsToLoad.forEach(font => loadedFonts.add(font.value));
                }
            };
            nodeType.prototype.onPropertyChanged = function(name, value) {
                if (
                    [
                        "titleFontSize", "titleFontWeight", "subtitleFontSize", "subtitleFontWeight",
                        "textColor", "backgroundColor", "accentColor", "borderRadius",
                        "padding", "titleSubtitleGap", "shadow", "shadowColor",
                        "shadowBlur", "shadowOffsetX", "shadowOffsetY", "gradientBackground",
                        "gradientStartColor", "gradientEndColor"
                    ].includes(name)
                ) {
                    this.setDirtyCanvas(true, true);
                }
                if (name === "animation") {
                    if (value) {
                        this.startAnimation();
                    } else {
                        this.stopAnimation();
                    }
                } else if (name === "animationType") {
                    if (this.properties.animation) {
                        this.stopAnimation();
                        this.startAnimation();
                    }
                } else if (["animationDuration", "animationEasing"].includes(name)) {
                    if (this.properties.animation) {
                        this.stopAnimation();
                        this.startAnimation();
                    }
                }
            };
            nodeType.prototype.startAnimation = function() {
                if (!this.properties.animation || !this.properties.animationType || this.properties.animationType === "none") {
                    return;
                }
                if (this.isAnimating) {
                    this.stopAnimation();
                }
                this.isAnimating = true;
                this.wasPaused = false;
                this.currentAnimationType = this.properties.animationType;
                if (!this.originalPos || this.pos[0] !== this.originalPos[0] || this.pos[1] !== this.originalPos[1]) {
                this.originalPos = [...this.pos];
                }
                this.originalSize = [...this.size];
                const node = this;
                const startTime = this.pausedTime || performance.now();
                let lastFrameTime = startTime;
                this.progress = this.progress || 0;
                this.direction = this.direction || 1;
                const duration = this.properties.animationDuration;
                const animationType = this.properties.animationType;
                const easing = this.properties.animationEasing || 'linear';
                const easingFunction = this.easingFunctions[easing];
                const animationFunction = this.animationTypes[animationType];
                const targetFPS = 60;
                const frameInterval = 1000 / targetFPS;
                const animate = (currentTime) => {
                    if (!node.properties.animation || node.currentAnimationType !== animationType || node.wasPaused) {
                        return;
                    }
                    const deltaTime = currentTime - lastFrameTime;
                    if (deltaTime < frameInterval) {
                        node.animationTimer = requestAnimationFrame(animate);
                        return;
                    }
                    this.progress += (deltaTime / duration) * this.direction;
                    if (this.progress >= 1 || this.progress <= 0) {
                        this.progress = 0;  
                    }
                    const easedProgress = easingFunction(this.progress);
                    animationFunction.call(node, easedProgress);
                    lastFrameTime = currentTime;
                    node.animationTimer = requestAnimationFrame(animate);
                };
                this.animationTimer = requestAnimationFrame(animate);
            };
            nodeType.prototype.stopAnimation = function() {
                if (this.animationTimer) {
                    cancelAnimationFrame(this.animationTimer);
                    this.animationTimer = null;
                }
                this.bounceBaseY = null;
                this.shakeBasePos = null;
                this.slideOffset = 0;
                this.isSliding = false;
                this.rotation = 0;
                this.fadeProgress = undefined;
                this.isAnimating = false;
                this.currentAnimationType = "none";
                this.setDirtyCanvas(true, true);
            };
            nodeType.prototype.easingFunctions = {
                linear: t => t,
                easeInQuad: t => t * t,
                easeOutQuad: t => t * (2 - t),
                easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
                easeInCubic: t => t * t * t,
                easeOutCubic: t => (--t) * t * t + 1,
                easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
                easeInElastic: t => {
                    if (t === 0 || t === 1) return t;
                    return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
                },
                easeOutElastic: t => {
                    if (t === 0 || t === 1) return t;
                    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
                },
                easeInOutElastic: t => {
                    if (t === 0 || t === 1) return t;
                    t *= 2;
                    if (t < 1) return -0.5 * Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
                    return 0.5 * Math.pow(2, -10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI) + 1;
                }
            };
            nodeType.prototype.animationTypes = {
                fade: function(progress) {
                    this.fadeProgress = progress;
                    this.setDirtyCanvas(true, false);
                },
                slide: function(progress) {
                    const distance = this.size[0] * 0.5;
                    const offset = Math.sin(progress * Math.PI * 2) * distance;
                    this.pos[0] = this.originalPos[0] + offset;
                    this.setDirtyCanvas(true, false);
                },
                bounce: function(progress) {
                    const amplitude = 20;
                    const offset = amplitude * Math.abs(Math.sin(progress * Math.PI * 2));
                    this.pos[1] = this.originalPos[1] - offset;
                    this.setDirtyCanvas(true, false);
                },
                rotate: function(progress) {
                    const angle = progress * Math.PI * 2;
                    this.rotation = angle;
                    this.setDirtyCanvas(true, false);
                },
                shake: function(progress) {
                    const amplitude = 5;
                    const frequency = 8;
                    const shakeX = Math.sin(progress * Math.PI * frequency * 2) * amplitude;
                    const shakeY = Math.cos(progress * Math.PI * frequency * 2) * amplitude;
                    this.pos[0] = this.originalPos[0] + shakeX;
                    this.pos[1] = this.originalPos[1] + shakeY;
                    this.setDirtyCanvas(true, false);
                }
            };
            nodeType.prototype.onDragMove = function(event) {
                if (this.properties.animation && this.isAnimating) {
                    if (this.properties.animationType === "bounce") {
                        this.bounceBaseY = this.pos[1];
                    } else if (this.properties.animationType === "shake") {
                        this.shakeBasePos = [...this.pos];
                    } else if (this.properties.animationType === "slide") {
                        this.slideOffset = 0;
                        this.isSliding = false;
                    }
                }
            };
            nodeType.prototype.onDrawForeground = function(ctx) {
                if (this.flags.collapsed) return;
                this.outputs = [];
                ctx.save();
                if (this.rotation) {
                    const centerX = this.size[0] / 2;
                    const centerY = this.size[1] / 2;
                    ctx.translate(centerX, centerY);
                    ctx.rotate(this.rotation);
                    ctx.translate(-centerX, -centerY);
                }
                if (this.fadeProgress !== undefined) {
                    ctx.globalAlpha = Math.abs(Math.sin(this.fadeProgress * Math.PI));
                }
                const {
                    title, subtitle, fontFamily, titleFontSize, subtitleFontSize,
                    titleFontWeight, subtitleFontWeight, textColor, backgroundColor,
                    accentColor, borderRadius, padding, titleSubtitleGap,
                    shadow, shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY,
                    textAlign, gradientBackground, gradientStartColor, gradientEndColor,
                    customBackground
                } = this.properties;
                const [width, height] = this.size;
                if (shadow) {
                    ctx.save();
                    ctx.shadowColor = shadowColor;
                    ctx.shadowBlur = shadowBlur;
                    ctx.shadowOffsetX = shadowOffsetX;
                    ctx.shadowOffsetY = shadowOffsetY;
                }
                ctx.beginPath();
                ctx.roundRect(0, 0, width, height, borderRadius);
                if (customBackground && this.backgroundImage) {
                    try {
                        ctx.save();
                        ctx.clip();
                        const imgRatio = this.backgroundImage.width / this.backgroundImage.height;
                        const nodeRatio = width / height;
                        let drawWidth, drawHeight, drawX, drawY;
                        if (this.properties.backgroundFit === "cover") {
                            if (imgRatio > nodeRatio) {
                                drawHeight = height;
                                drawWidth = height * imgRatio;
                                drawX = (width - drawWidth) / 2;
                                drawY = 0;
                            } else {
                                drawWidth = width;
                                drawHeight = width / imgRatio;
                                drawX = 0;
                                drawY = (height - drawHeight) / 2;
                            }
                        } else if (this.properties.backgroundFit === "contain") {
                            if (imgRatio > nodeRatio) {
                                drawWidth = width;
                                drawHeight = width / imgRatio;
                                drawX = 0;
                                drawY = (height - drawHeight) / 2;
                            } else {
                                drawHeight = height;
                                drawWidth = height * imgRatio;
                                drawX = (width - drawWidth) / 2;
                                drawY = 0;
                            }
                        } else {
                            drawWidth = width;
                            drawHeight = height;
                            drawX = 0;
                            drawY = 0;
                        }
                        switch (this.properties.backgroundPosition) {
                            case "top":
                                drawY = 0;
                                break;
                            case "bottom":
                                drawY = height - drawHeight;
                                break;
                            case "left":
                                drawX = 0;
                                break;
                            case "right":
                                drawX = width - drawWidth;
                                break;
                        }
                        const scale = this.properties.backgroundScale;
                        const scaledWidth = drawWidth * scale;
                        const scaledHeight = drawHeight * scale;
                        const scaledX = drawX - (scaledWidth - drawWidth) / 2;
                        const scaledY = drawY - (scaledHeight - drawHeight) / 2;
                        if (this.properties.backgroundBlur > 0) {
                            ctx.filter = `blur(${this.properties.backgroundBlur}px)`;
                        }
                        ctx.globalAlpha = this.properties.backgroundOpacity;
                        ctx.drawImage(this.backgroundImage, scaledX, scaledY, scaledWidth, scaledHeight);
                        if (this.properties.backgroundOverlay) {
                            ctx.globalAlpha = 0.5;
                            ctx.fillStyle = "rgba(0,0,0,1)";
                            ctx.fillRect(0, 0, width, height);
                        }
                        ctx.restore();
                    } catch (error) {
                        console.error('Background drawing error:', error);
                        ctx.fillStyle = backgroundColor;
                        ctx.fill();
                    }
                } else if (gradientBackground) {
                    let gradient;
                    const type = this.properties.gradientType;
                    const angle = this.properties.gradientAngle;
                    if (type === 'linear') {
                        const radian = (angle - 90) * Math.PI / 180;
                        const cos = Math.cos(radian);
                        const sin = Math.sin(radian);
                        const x1 = width/2 - cos * width/2;
                        const y1 = height/2 - sin * height/2;
                        const x2 = width/2 + cos * width/2;
                        const y2 = height/2 + sin * height/2;
                        gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                    } else if (type === 'radial') {
                        gradient = ctx.createRadialGradient(
                            width/2, height/2, 0,
                            width/2, height/2, Math.max(width, height)/2
                        );
                    } else {
                        gradient = ctx.createConicGradient(
                            (angle - 90) * Math.PI / 180,
                            width/2, height/2
                        );
                    }
                    gradient.addColorStop(0, gradientStartColor);
                    gradient.addColorStop(1, gradientEndColor);
                    ctx.fillStyle = gradient;
                    ctx.fill();
                } else {
                    ctx.fillStyle = backgroundColor;
                    ctx.fill();
                }
                if (shadow) {
                    ctx.restore();
                    ctx.shadowColor = 'transparent';
                }
                const titleFontStr = "normal " + (this.properties.titleFontWeight === "bold" ? "bold" : "normal") + " " + 
                                   this.properties.titleFontSize + "px " + this.properties.fontFamily;
                ctx.font = titleFontStr;
                ctx.fillStyle = this.properties.titleColor;
                ctx.textAlign = textAlign;
                ctx.textBaseline = 'top';
                const titleX = textAlign === 'left' ? padding : (textAlign === 'right' ? width - padding : width / 2);
                ctx.fillText(title, titleX, padding);
                const subtitleFontStr = "normal " + (this.properties.subtitleFontWeight === "bold" ? "bold" : "normal") + " " + 
                                      this.properties.subtitleFontSize + "px " + this.properties.fontFamily;
                ctx.font = subtitleFontStr;
                ctx.fillStyle = this.properties.subtitleColor;
                const subtitleY = padding + titleFontSize + titleSubtitleGap;
                ctx.fillText(subtitle, titleX, subtitleY);
                if (this.properties.dividerEnabled) {
                    const dividerY = padding + titleFontSize + titleSubtitleGap / 2;
                    const dividerLength = this.properties.dividerLength;
                    let dividerX;
                    if (textAlign === 'left') {
                        dividerX = padding;
                    } else if (textAlign === 'right') {
                        dividerX = width - padding - dividerLength;
                    } else {
                        dividerX = (width - dividerLength) / 2;
                    }
                    ctx.beginPath();
                    ctx.strokeStyle = this.properties.dividerColor;
                    ctx.lineWidth = this.properties.dividerWidth;
                    ctx.globalAlpha = this.properties.dividerOpacity;
                    ctx.moveTo(dividerX, dividerY);
                    ctx.lineTo(dividerX + dividerLength, dividerY);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
                ctx.restore();
            };
            nodeType.category = "SKB";
            nodeType.prototype.getTitle = function() {
                return "";
            };
            nodeType.prototype.onBounding = function() {
                return [0, 0, this.size[0], this.size[1]];
            }
            nodeType.prototype.onRemoved = function() {
                this.stopAnimation(); 
                if (this.editButton?.parentElement) {
                    this.editButton.parentElement.removeChild(this.editButton);
                }
                
                const existingDialog = document.getElementById(`titleplus-dialog-${this.id}`);
                if(existingDialog) {
                    existingDialog.remove();
                }
            };
            nodeType.prototype.computeSize = function() {
                const { title, subtitle, titleFontSize, subtitleFontSize, padding } = this.properties;
                const width = Math.max(
                    this.measureText(title, titleFontSize),
                    this.measureText(subtitle, subtitleFontSize)
                ) + padding * 2;
                const height = titleFontSize + subtitleFontSize + padding * 3;
                return [Math.max(width, 280), Math.max(height, 120)];
            };
            nodeType.prototype.measureText = function(text, fontSize, fontWeight = 'normal', fontFamily = 'Inter') {
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const weightStr = fontWeight === "bold" ? "bold" : "normal";
                ctx.font = `normal ${weightStr} ${fontSize}px "${fontFamily}"`;
                return ctx.measureText(text).width;
            };
            nodeType.prototype.setCustomBackground = function(imageUrl) {
                const img = new Image();
                const that = this;
                img.onload = () => {
                    that.backgroundImage = img;
                    that.properties.customBackground = true;
                    that.properties.backgroundUrl = imageUrl;
                    that.setDirtyCanvas(true, true);
                };
                img.onerror = () => {
                    console.error('Image could not be loaded:', imageUrl);
                    that.properties.customBackground = false;
                    that.backgroundImage = null;
                    that.setDirtyCanvas(true, true);
                };
                img.src = imageUrl;
            };
            nodeType.prototype.onMouseDown = function(e, local_pos) {
                if (!local_pos) return null;
                
                const iconX = this.size[0] - EDIT_ICON_SIZE - EDIT_ICON_MARGIN;
                const iconY = this.size[1] - EDIT_ICON_SIZE - EDIT_ICON_MARGIN;
                if (this.mouseOver && local_pos[0] > iconX && local_pos[0] < iconX + EDIT_ICON_SIZE &&
                    local_pos[1] > iconY && local_pos[1] < iconY + EDIT_ICON_SIZE) {
                    this.showEditDialog();
                    return true;
                }
                return null;
            };
            nodeType.prototype.onMouseMove = function(e, local_pos) {
                if (!local_pos) return;
                
                const iconX = this.size[0] - EDIT_ICON_SIZE - EDIT_ICON_MARGIN;
                const iconY = this.size[1] - EDIT_ICON_SIZE - EDIT_ICON_MARGIN;
                const wasOverEdit = this.mouseOverEdit;
                this.mouseOverEdit = local_pos[0] > iconX && local_pos[0] < iconX + EDIT_ICON_SIZE &&
                                    local_pos[1] > iconY && local_pos[1] < iconY + EDIT_ICON_SIZE;
                if (wasOverEdit !== this.mouseOverEdit) {
                    this.setDirtyCanvas(true, true);
                }
            };
            nodeType.prototype.onResize = function(size) {
                this.size = size;
                this.setDirtyCanvas(true, true);
            };
            nodeType.prototype.getMinSize = function() {
                const minWidth = 280;  
                const minHeight = 120;  
                const padding = this.properties.padding || 20;
                const gap = this.properties.titleSubtitleGap || 8;
                const titleSize = this.properties.titleFontSize || 28;
                const subtitleSize = this.properties.subtitleFontSize || 16;
                const totalHeight = Math.max(minHeight, titleSize + subtitleSize + gap + (padding * 2));
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                ctx.font = `${this.properties.titleFontWeight} ${titleSize}px ${this.properties.fontFamily}`;
                const titleWidth = ctx.measureText(this.properties.title).width;
                ctx.font = `${this.properties.subtitleFontWeight} ${subtitleSize}px ${this.properties.fontFamily}`;
                const subtitleWidth = ctx.measureText(this.properties.subtitle).width;
                const totalWidth = Math.max(minWidth, Math.max(titleWidth, subtitleWidth) + (padding * 2));
                return [totalWidth, totalHeight];
            };
            nodeType.prototype.onMouseUp = function(e, pos) {
                this.draggingTitle = false;
                this.draggingSubtitle = false;
            };
            nodeType.prototype.onMouseEnter = function() {
                if (this.properties.animation && this.isAnimating) {
                    this.pauseAnimation();
                }
                if (this.editButton) {
                    this.editButton.style.opacity = '1';
                }
            };
            nodeType.prototype.onMouseLeave = function() {
                if (this.properties.animation && this.wasPaused) {
                    this.resumeAnimation();
                }
                if (this.editButton) {
                    this.editButton.style.opacity = '0';
                }
            };
            nodeType.prototype.pauseAnimation = function() {
                if (this.animationTimer) {
                    cancelAnimationFrame(this.animationTimer);
                    this.animationTimer = null;
                    this.wasPaused = true;
                    this.pausedTime = performance.now();
                }
            };
            nodeType.prototype.resumeAnimation = function() {
                if (this.wasPaused) {
                    this.wasPaused = false;
                    this.startAnimation(); 
                }
            };
            nodeType.prototype.getExtraMenuOptions = function(graphCanvas) {
                return [
                    {
                        content: "Randomize Colors",
                        callback: () => {
                            this.properties.titleColor = this.getRandomColor();
                            this.properties.subtitleColor = this.getRandomColor();
                            this.properties.gradientStartColor = this.getRandomColor();
                            this.properties.gradientEndColor = this.getRandomColor();
                            this.properties.backgroundColor = this.getRandomColor();
                            this.properties.shadowColor = this.hexToRgba(this.getRandomColor(), 0.3);
                            this.properties.dividerColor = this.getRandomColor();
                            this.setDirtyCanvas(true, true);
                        }
                    },
                    {
                        content: "Toggle Animation",
                        callback: () => {
                            this.properties.animation = !this.properties.animation;
                            if (this.properties.animation) {
                                this.startAnimation();
                            } else {
                                this.stopAnimation();
                            }
                        }
                    }
                ];
            };
            nodeType.prototype.getRandomColor = function() {
                const color = Math.floor(Math.random()*16777215).toString(16);
                return '#' + ('000000' + color).slice(-6);
            };
            nodeType.prototype.showEditDialog = function() {
                const that = this;
                
                const oldDialog = document.getElementById(`titleplus-dialog-${this.id}`);
                if (oldDialog) oldDialog.remove();

                const dialog = document.createElement("div");
                dialog.id = `titleplus-dialog-${this.id}`; 
                dialog.className = "titleplus-dialog";
                dialog.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #1E1E1E;
                    padding: 0;
                    border-radius: 12px;
                    z-index: 10000;
                    width: 340px;
                    max-height: 85vh;
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                    border: 1px solid rgba(255,255,255,0.08);
                    display: flex;
                    flex-direction: column;
                `;
                const styles = `
                    .titleplus-dialog {
                        font-family: 'Inter', system-ui, -apple-system, sans-serif;
                        color: #E2E8F0;
                        display: flex;
                        flex-direction: column;
                        height: 100%;
                    }
                    .titleplus-dialog .dialog-content {
                        overflow-y: auto;
                        padding: 16px;
                        scrollbar-width: thin;
                        scrollbar-color: #404040 #1E1E1E;
                    }
                    .titleplus-dialog .dialog-content::-webkit-scrollbar {
                        width: 6px;
                    }
                    .titleplus-dialog .dialog-content::-webkit-scrollbar-track {
                        background: #1E1E1E;
                    }
                    .titleplus-dialog .dialog-content::-webkit-scrollbar-thumb {
                        background: #404040;
                        border-radius: 3px;
                    }
                    .titleplus-dialog h3 {
                        color: #FFFFFF;
                        margin: 0;
                        text-align: center;
                        font-size: 14px;
                        font-weight: 600;
                        padding: 16px;
                        border-bottom: 1px solid rgba(255,255,255,0.08);
                        cursor: move;
                        user-select: none;
                        background: #252525;
                        position: sticky;
                        top: 0;
                        z-index: 1;
                    }
                    .titleplus-dialog .section {
                        background: #252525;
                        border-radius: 8px;
                        padding: 14px;
                        margin: 8px 0;
                        border: 1px solid rgba(255,255,255,0.08);
                    }
                    .titleplus-dialog .section-title {
                        color: #60A5FA;
                        font-size: 12px;
                        margin-bottom: 12px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .titleplus-dialog input, .titleplus-dialog select {
                        background: #1E1E1E;
                        border: 1px solid rgba(255,255,255,0.08);
                        color: #FFFFFF;
                        border-radius: 6px;
                        font-size: 13px;
                        padding: 8px 10px;
                        width: 100%;
                        transition: all 0.2s ease;
                    }
                    .titleplus-dialog input:focus, .titleplus-dialog select:focus {
                        border-color: #60A5FA;
                        outline: none;
                        box-shadow: 0 0 0 2px rgba(96,165,250,0.15);
                    }
                    .titleplus-dialog input[type="color"] {
                        width: 36px;
                        height: 22px;
                        padding: 0;
                        border: none;
                        cursor: pointer;
                        border-radius: 4px;
                    }
                    .titleplus-dialog input[type="range"] {
                        -webkit-appearance: none;
                        height: 4px;
                        background: #333333;
                        border-radius: 2px;
                        width: calc(100% - 45px);
                        border: none;
                    }
                    .titleplus-dialog input[type="range"]::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        width: 14px;
                        height: 14px;
                        background: #60A5FA;
                        border-radius: 50%;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        border: 2px solid rgba(255,255,255,0.1);
                    }
                    .titleplus-dialog input[type="range"]::-webkit-slider-thumb:hover {
                        transform: scale(1.1);
                        background: #93C5FD;
                    }
                    .titleplus-dialog input[type="number"] {
                        width: 55px;
                        text-align: center;
                    }
                    .titleplus-dialog input[type="checkbox"] {
                        width: 16px;
                        height: 16px;
                        margin: 0;
                        border-radius: 4px;
                        position: relative;
                        cursor: pointer;
                        background: #1E1E1E;
                        border: 1px solid rgba(255,255,255,0.2);
                        appearance: none;
                        -webkit-appearance: none;
                    }
                    .titleplus-dialog input[type="checkbox"]:checked {
                        background: #60A5FA;
                        border-color: #93C5FD;
                    }
                    .titleplus-dialog input[type="checkbox"]:checked:after {
                        content: '';
                        position: absolute;
                        left: 5px;
                        top: 2px;
                        width: 4px;
                        height: 8px;
                        border: solid white;
                        border-width: 0 2px 2px 0;
                        transform: rotate(45deg);
                    }
                    .titleplus-dialog label {
                        font-size: 13px;
                        color: #D1D5DB;
                        margin: 4px 0;
                        font-weight: 500;
                    }
                    .titleplus-dialog .row {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        margin: 8px 0;
                    }
                    .titleplus-dialog .row label {
                        margin: 0;
                        flex: 1;
                    }
                    .titleplus-dialog .color-row {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        margin: 8px 0;
                    }
                    .titleplus-dialog .color-row label {
                        margin: 0;
                        flex: 1;
                    }
                    .titleplus-dialog .buttons {
                        display: flex;
                        justify-content: flex-end;
                        gap: 8px;
                        margin-top: 0;
                        padding: 16px;
                        border-top: 1px solid rgba(255,255,255,0.08);
                        background: #252525;
                        position: sticky;
                        bottom: 0;
                    }
                    .titleplus-dialog button {
                        padding: 8px 16px;
                        border: none;
                        border-radius: 6px;
                        font-size: 13px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    .titleplus-dialog button:not(.close-btn) {
                        background: #60A5FA;
                        color: white;
                    }
                    .titleplus-dialog button:not(.close-btn):hover {
                        background: #93C5FD;
                        transform: translateY(-1px);
                    }
                    .titleplus-dialog .close-btn {
                        background: #333333;
                        color: #E5E7EB;
                    }
                    .titleplus-dialog .close-btn:hover {
                        background: #404040;
                    }
                    .titleplus-dialog span {
                        font-size: 12px;
                        color: #9CA3AF;
                        min-width: 35px;
                        text-align: right;
                    }
                    .titleplus-dialog .gradient-preview {
                        margin: 12px 0;
                        padding: 12px;
                        background: #1E1E1E;
                        border-radius: 6px;
                        border: 1px solid rgba(255,255,255,0.08);
                    }
                    .titleplus-dialog .gradient-bar {
                        height: 28px;
                        border-radius: 4px;
                        margin: 8px 0;
                    }
                    .titleplus-dialog select {
                        cursor: pointer;
                        padding-right: 28px;
                        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                        background-repeat: no-repeat;
                        background-position: right 8px center;
                        background-size: 16px;
                        -webkit-appearance: none;
                        -moz-appearance: none;
                        appearance: none;
                    }
                `;
                dialog.innerHTML = `
                    <style>${styles}</style>
                    <h3 id="dialog-handle">Title Plus Editor</h3>
                    <div class="dialog-content">
                        <div class="section">
                            <div class="section-title">Text Content</div>
                            <label>Title</label>
                            <input type="text" id="title" value="${that.properties.title}">
                            <label>Subtitle</label>
                            <input type="text" id="subtitle" value="${that.properties.subtitle}">
                        </div>
                        <div class="section">
                            <div class="section-title">Font Settings</div>
                            <div class="row">
                                <label>Font Family</label>
                                <select id="fontFamily" style="font-family: var(--select-value)">
                                    ${options.fontFamily.map(font => 
                                        `<option value="${font.value}" style="font-family: ${font.value}" 
                                            ${font.value === that.properties.fontFamily ? 'selected' : ''}>
                                            ${font.label}
                                        </option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="row">
                                <label>Title Style</label>
                                <select id="titleFontWeight">
                                    ${options.fontWeight.map(weight => 
                                        `<option value="${weight.value}" 
                                            ${weight.value === that.properties.titleFontWeight ? 'selected' : ''}>
                                            ${weight.label}
                                        </option>`
                                    ).join('')}
                                </select>
                                <input type="number" id="titleFontSize" value="${that.properties.titleFontSize}" 
                                    min="12" max="72" style="width: 60px;">
                            </div>
                            <div class="row">
                                <label>Subtitle Style</label>
                                <select id="subtitleFontWeight">
                                    ${options.fontWeight.map(weight => 
                                        `<option value="${weight.value}" 
                                            ${weight.value === that.properties.subtitleFontWeight ? 'selected' : ''}>
                                            ${weight.label}
                                        </option>`
                                    ).join('')}
                                </select>
                                <input type="number" id="subtitleFontSize" value="${that.properties.subtitleFontSize}" 
                                    min="12" max="72" style="width: 60px;">
                            </div>
                        </div>
                        <div class="section">
                            <div class="section-title">Colors & Appearance</div>
                            <div class="color-row">
                                <label>Title Color</label>
                                <input type="color" id="titleColor" value="${this.rgbaToHex(that.properties.titleColor)}">
                            </div>
                            <div class="color-row">
                                <label>Subtitle Color</label>
                                <input type="color" id="subtitleColor" value="${this.rgbaToHex(that.properties.subtitleColor)}">
                            </div>
                            <div class="color-row">
                                <label>Background Color</label>
                                <input type="color" id="backgroundColor" value="${this.rgbaToHex(that.properties.backgroundColor)}">
                            </div>
                            <div class="row">
                                <label>Gradient Background</label>
                                <input type="checkbox" id="gradientBackground" ${that.properties.gradientBackground ? 'checked' : ''}>
                            </div>
                            <div id="gradientControls" style="display: ${that.properties.gradientBackground ? 'block' : 'none'}">
                                <div class="row">
                                    <label>Gradient Type</label>
                                    <select id="gradientType">
                                        <option value="linear" ${that.properties.gradientType === 'linear' ? 'selected' : ''}>Linear</option>
                                        <option value="radial" ${that.properties.gradientType === 'radial' ? 'selected' : ''}>Radial</option>
                                        <option value="conic" ${that.properties.gradientType === 'conic' ? 'selected' : ''}>Conic</option>
                                    </select>
                                </div>
                                <div class="row" id="gradientAngleRow" style="display: ${that.properties.gradientType === 'linear' ? 'flex' : 'none'}">
                                    <label>Gradient Angle</label>
                                    <input type="range" id="gradientAngle" value="${that.properties.gradientAngle}" min="0" max="360" step="1">
                                    <span>${that.properties.gradientAngle}°</span>
                                </div>
                                <div class="color-row">
                                    <label>Start Color</label>
                                    <input type="color" id="gradientStartColor" value="${this.rgbaToHex(that.properties.gradientStartColor)}">
                                </div>
                                <div class="color-row">
                                    <label>End Color</label>
                                    <input type="color" id="gradientEndColor" value="${this.rgbaToHex(that.properties.gradientEndColor)}">
                                </div>
                                <div class="gradient-preview">
                                    <div class="gradient-bar" id="gradientPreview"></div>
                                </div>
                            </div>
                        </div>
                        <div class="section">
                            <div class="section-title">Layout & Spacing</div>
                            <div class="row">
                                <label>Border Radius</label>
                                <input type="range" id="borderRadius" value="${that.properties.borderRadius}" min="0" max="30">
                                <span>${that.properties.borderRadius}px</span>
                            </div>
                            <div class="row">
                                <label>Padding</label>
                                <input type="range" id="padding" value="${that.properties.padding}" min="0" max="50">
                                <span>${that.properties.padding}px</span>
                            </div>
                            <div class="row">
                                <label>Title-Subtitle Gap</label>
                                <input type="range" id="titleSubtitleGap" value="${that.properties.titleSubtitleGap}" min="0" max="50">
                                <span>${that.properties.titleSubtitleGap}px</span>
                            </div>
                            <div class="row">
                                <label>Text Alignment</label>
                                <select id="textAlign">
                                    <option value="left" ${that.properties.textAlign === 'left' ? 'selected' : ''}>Left</option>
                                    <option value="center" ${that.properties.textAlign === 'center' ? 'selected' : ''}>Center</option>
                                    <option value="right" ${that.properties.textAlign === 'right' ? 'selected' : ''}>Right</option>
                                </select>
                            </div>
                        </div>
                        <div class="section">
                            <div class="section-title">Effects</div>
                            <div class="row">
                                <label>Shadow</label>
                                <input type="checkbox" id="shadow" ${that.properties.shadow ? 'checked' : ''}>
                            </div>
                            <div id="shadowControls" style="display: ${that.properties.shadow ? 'block' : 'none'}">
                                <div class="color-row">
                                    <label>Shadow Color</label>
                                    <input type="color" id="shadowColor" value="${this.rgbaToHex(that.properties.shadowColor)}">
                                </div>
                                <div class="row">
                                    <label>Shadow Blur</label>
                                    <input type="range" id="shadowBlur" value="${that.properties.shadowBlur}" min="0" max="30">
                                    <span>${that.properties.shadowBlur}px</span>
                                </div>
                                <div class="row">
                                    <label>Shadow X Position</label>
                                    <input type="range" id="shadowOffsetX" value="${that.properties.shadowOffsetX}" min="-20" max="20">
                                    <span>${that.properties.shadowOffsetX}px</span>
                                </div>
                                <div class="row">
                                    <label>Shadow Y Position</label>
                                    <input type="range" id="shadowOffsetY" value="${that.properties.shadowOffsetY}" min="-20" max="20">
                                    <span>${that.properties.shadowOffsetY}px</span>
                                </div>
                            </div>
                        </div>
                        <div class="section">
                            <div class="section-title">Animation</div>
                            <div class="row">
                                <label>Animation Active</label>
                                <input type="checkbox" id="animation" ${that.properties.animation ? 'checked' : ''}>
                            </div>
                            <div id="animationControls" style="display: ${that.properties.animation ? 'block' : 'none'}">
                                <div class="row">
                                    <label>Animation Type</label>
                                    <select id="animationType">
                                        <option value="none" ${that.properties.animationType === 'none' ? 'selected' : ''}>None</option>
                                        <option value="fade" ${that.properties.animationType === 'fade' ? 'selected' : ''}>Fade</option>
                                        <option value="slide" ${that.properties.animationType === 'slide' ? 'selected' : ''}>Slide</option>
                                        <option value="bounce" ${that.properties.animationType === 'bounce' ? 'selected' : ''}>Bounce</option>
                                        <option value="rotate" ${that.properties.animationType === 'rotate' ? 'selected' : ''}>Rotate</option>
                                        <option value="shake" ${that.properties.animationType === 'shake' ? 'selected' : ''}>Shake</option>
                                    </select>
                                </div>
                                <div class="row">
                                    <label>Animation Duration (ms)</label>
                                    <input type="number" id="animationDuration" value="${that.properties.animationDuration}" min="100" max="5000" step="100">
                                </div>
                                <div class="row">
                                    <label>Animation Easing</label>
                                    <select id="animationEasing">
                                        <option value="linear">Linear</option>
                                        <option value="easeInQuad">Ease In Quad</option>
                                        <option value="easeOutQuad">Ease Out Quad</option>
                                        <option value="easeInOutQuad">Ease InOut Quad</option>
                                        <option value="easeInCubic">Ease In Cubic</option>
                                        <option value="easeOutCubic">Ease Out Cubic</option>
                                        <option value="easeInOutCubic">Ease InOut Cubic</option>
                                        <option value="easeInElastic">Ease In Elastic</option>
                                        <option value="easeOutElastic">Ease Out Elastic</option>
                                        <option value="easeInOutElastic">Ease InOut Elastic</option>
                                    </select>
                                </div>
                                <div class="row">
                                    <label>Looping Animation</label>
                                    <input type="checkbox" id="animationLoop" ${that.properties.animationLoop ? 'checked' : ''}>
                                    <span class="tooltip">Allows the animation to repeat continuously</span>
                                </div>
                            </div>
                        </div>
                        <div class="section">
                            <div class="section-title">Custom Background</div>
                            <div class="row">
                                <label>Use Custom Background</label>
                                <input type="checkbox" id="customBackground" ${that.properties.customBackground ? 'checked' : ''}>
                            </div>
                            <div id="backgroundControls" style="display: ${that.properties.customBackground ? 'block' : 'none'}">
                                <div class="row">
                                    <label>Background URL</label>
                                    <input type="text" id="backgroundUrl" value="${that.properties.backgroundUrl || ''}" placeholder="Enter image URL">
                                    <button onclick="updateBackground(this.previousElementSibling.value)">Apply</button>
                                </div>
                                <div class="row">
                                    <label>Opacity</label>
                                    <input type="range" id="backgroundOpacity" value="${that.properties.backgroundOpacity * 100}" min="0" max="100">
                                    <span>${Math.round(that.properties.backgroundOpacity * 100)}%</span>
                                </div>
                                <div class="row">
                                    <label>Blur</label>
                                    <input type="range" id="backgroundBlur" value="${that.properties.backgroundBlur}" min="0" max="20">
                                    <span>${that.properties.backgroundBlur}px</span>
                                </div>
                                <div class="row">
                                    <label>Scale</label>
                                    <input type="range" id="backgroundScale" value="${that.properties.backgroundScale * 100}" min="50" max="200">
                                    <span>${Math.round(that.properties.backgroundScale * 100)}%</span>
                                </div>
                                <div class="row">
                                    <label>Position</label>
                                    <select id="backgroundPosition">
                                        <option value="center" ${that.properties.backgroundPosition === 'center' ? 'selected' : ''}>Center</option>
                                        <option value="top" ${that.properties.backgroundPosition === 'top' ? 'selected' : ''}>Top</option>
                                        <option value="bottom" ${that.properties.backgroundPosition === 'bottom' ? 'selected' : ''}>Bottom</option>
                                        <option value="left" ${that.properties.backgroundPosition === 'left' ? 'selected' : ''}>Left</option>
                                        <option value="right" ${that.properties.backgroundPosition === 'right' ? 'selected' : ''}>Right</option>
                                    </select>
                                </div>
                                <div class="row">
                                    <label>Fit</label>
                                    <select id="backgroundFit">
                                        <option value="cover" ${that.properties.backgroundFit === 'cover' ? 'selected' : ''}>Cover</option>
                                        <option value="contain" ${that.properties.backgroundFit === 'contain' ? 'selected' : ''}>Contain</option>
                                        <option value="stretch" ${that.properties.backgroundFit === 'stretch' ? 'selected' : ''}>Stretch</option>
                                    </select>
                                </div>
                                <div class="row">
                                    <label>Overlay Effect</label>
                                    <input type="checkbox" id="backgroundOverlay" ${that.properties.backgroundOverlay ? 'checked' : ''}>
                                </div>
                            </div>
                        </div>
                        <div class="section">
                            <div class="section-title">Divider Settings</div>
                            <div class="row">
                                <label>Show Divider</label>
                                <input type="checkbox" id="dividerEnabled" ${that.properties.dividerEnabled ? 'checked' : ''}>
                            </div>
                            <div id="dividerControls" style="display: ${that.properties.dividerEnabled ? 'block' : 'none'}">
                                <div class="color-row">
                                    <label>Divider Color</label>
                                    <input type="color" id="dividerColor" value="${this.rgbaToHex(that.properties.dividerColor)}">
                                </div>
                                <div class="row">
                                    <label>Divider Thickness</label>
                                    <input type="range" id="dividerWidth" value="${that.properties.dividerWidth}" min="1" max="10">
                                    <span>${that.properties.dividerWidth}px</span>
                                </div>
                                <div class="row">
                                    <label>Divider Length</label>
                                    <input type="range" id="dividerLength" value="${that.properties.dividerLength}" min="40" max="300" step="10">
                                    <span>${that.properties.dividerLength}px</span>
                                </div>
                                <div class="row">
                                    <label>Divider Opacity</label>
                                    <input type="range" id="dividerOpacity" value="${that.properties.dividerOpacity * 100}" min="0" max="100">
                                    <span>${Math.round(that.properties.dividerOpacity * 100)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="buttons">
                        <button class="close-btn" onclick="this.parentElement.parentElement.remove()">Cancel</button>
                        <button onclick="updateTitlePlus(this)">Save Changes</button>
                    </div>
                `;
                dialog.querySelector('#gradientBackground').addEventListener('change', function(e) {
                    dialog.querySelector('#gradientControls').style.display = e.target.checked ? 'block' : 'none';
                });
                dialog.querySelector('#shadow').addEventListener('change', function(e) {
                    dialog.querySelector('#shadowControls').style.display = e.target.checked ? 'block' : 'none';
                });
                dialog.querySelector('#animation').addEventListener('change', function(e) {
                    dialog.querySelector('#animationControls').style.display = e.target.checked ? 'block' : 'none';
                    updateProperty('animation', e.target.checked, 'bool');
                    if (e.target.checked) {
                        that.properties.animationType = dialog.querySelector('#animationType').value;
                        that.startAnimation();
                    } else {
                        that.stopAnimation();
                    }
                });
                dialog.querySelector('#animationType').addEventListener('change', function(e) {
                    updateProperty('animationType', e.target.value);
                    if (that.properties.animation) {
                        that.stopAnimation();
                        that.startAnimation();
                    }
                });
                dialog.querySelector('#customBackground').addEventListener('change', function(e) {
                    const controls = dialog.querySelector('#backgroundControls');
                    controls.style.display = e.target.checked ? 'block' : 'none';
                    updateProperty('customBackground', e.target.checked, 'bool');
                    if (!e.target.checked) {
                        that.backgroundImage = null;
                        that.properties.backgroundUrl = '';
                    } else if (that.properties.backgroundUrl) {
                        that.setCustomBackground(that.properties.backgroundUrl);
                    }
                });
                dialog.querySelector('#dividerEnabled').addEventListener('change', function(e) {
                    const controls = dialog.querySelector('#dividerControls');
                    controls.style.display = e.target.checked ? 'block' : 'none';
                    updateProperty('dividerEnabled', e.target.checked, 'bool');
                });
                dialog.querySelector('#dividerColor').addEventListener('input', function(e) {
                    const color = e.target.value;
                    updateProperty('dividerColor', that.hexToRgba(color));
                });
                dialog.querySelector('#dividerWidth').addEventListener('input', function(e) {
                    updateProperty('dividerWidth', parseInt(e.target.value), 'int');
                    this.nextElementSibling.textContent = e.target.value + 'px';
                });
                dialog.querySelector('#dividerLength').addEventListener('input', function(e) {
                    updateProperty('dividerLength', parseInt(e.target.value), 'int');
                    this.nextElementSibling.textContent = e.target.value + 'px';
                });
                dialog.querySelector('#dividerOpacity').addEventListener('input', function(e) {
                    updateProperty('dividerOpacity', e.target.value / 100);
                    this.nextElementSibling.textContent = Math.round(e.target.value) + '%';
                });
                dialog.querySelectorAll('input[type="range"]').forEach(range => {
                    range.addEventListener('input', function() {
                        this.nextElementSibling.textContent = this.value + 'px';
                    });
                });
                dialog.querySelector('#backgroundOpacity').addEventListener('input', function(e) {
                    updateProperty('backgroundOpacity', e.target.value / 100);
                    this.nextElementSibling.textContent = Math.round(e.target.value) + '%';
                });
                dialog.querySelector('#backgroundBlur').addEventListener('input', function(e) {
                    updateProperty('backgroundBlur', parseInt(e.target.value));
                    this.nextElementSibling.textContent = e.target.value + 'px';
                });
                dialog.querySelector('#backgroundScale').addEventListener('input', function(e) {
                    updateProperty('backgroundScale', e.target.value / 100);
                    this.nextElementSibling.textContent = e.target.value + '%';
                });
                dialog.querySelector('#backgroundPosition').addEventListener('change', function(e) {
                    updateProperty('backgroundPosition', e.target.value);
                });
                dialog.querySelector('#backgroundFit').addEventListener('change', function(e) {
                    updateProperty('backgroundFit', e.target.value);
                });
                dialog.querySelector('#backgroundOverlay').addEventListener('change', function(e) {
                    updateProperty('backgroundOverlay', e.target.checked, 'bool');
                });
                dialog.querySelector('#animationLoop').addEventListener('change', function(e) {
                    updateProperty('animationLoop', e.target.checked, 'bool');
                    if (that.properties.animation) {
                        that.stopAnimation();
                        that.startAnimation();
                    }
                });
                document.body.appendChild(dialog);
                const updateProperty = (propertyName, value, type = 'string') => {
                    let processedValue = value;
                    if (type === 'int') {
                        processedValue = parseInt(value);
                    } else if (type === 'bool') {
                        processedValue = value === true || value === 'true' || value === '1';
                    }
                    that.properties[propertyName] = processedValue;
                    that.setDirtyCanvas(true, true);
                };
                ['title', 'subtitle', 'fontFamily', 'titleFontWeight', 'subtitleFontWeight', 'textAlign', 'animationType', 'animationEasing'].forEach(id => {
                    const element = dialog.querySelector(`#${id}`);
                    if (element) {
                        element.addEventListener('input', (e) => updateProperty(id, e.target.value));
                    }
                });
                ['titleFontSize', 'subtitleFontSize', 'borderRadius', 'padding', 'titleSubtitleGap', 
                 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY', 'animationDuration'].forEach(id => {
                    const element = dialog.querySelector(`#${id}`);
                    if (element) {
                        element.addEventListener('input', (e) => updateProperty(id, e.target.value, 'int'));
                    }
                });
                ['titleColor', 'subtitleColor', 'backgroundColor', 'accentColor', 'shadowColor', 
                 'gradientStartColor', 'gradientEndColor'].forEach(id => {
                    const element = dialog.querySelector(`#${id}`);
                    if (element) {
                        element.addEventListener('input', (e) => {
                            const hexColor = e.target.value;
                            const rgbaColor = that.hexToRgba(hexColor);
                            updateProperty(id, rgbaColor);
                            that.setDirtyCanvas(true, true);
                        });
                    }
                });
                ['shadow', 'gradientBackground', 'animation', 'customBackground'].forEach(id => {
                    const element = dialog.querySelector(`#${id}`);
                    if (element) {
                        element.addEventListener('change', (e) => {
                            updateProperty(id, e.target.checked, 'bool');
                            const controlsId = id + 'Controls';
                            const controls = dialog.querySelector(`#${controlsId}`);
                            if (controls) {
                                controls.style.display = e.target.checked ? 'block' : 'none';
                            }
                            if (id === 'animation') {
                                if (e.target.checked) {
                                    that.startAnimation();
                                } else {
                                    that.stopAnimation();
                                }
                            }
                        });
                    }
                });
                window.updateBackground = function(url) {
                    that.setCustomBackground(url);
                };
                window.updateTitlePlus = function(button) {
                    button.parentElement.parentElement.remove();
                };
                const originalProperties = {...that.properties};
                dialog.querySelector('.close-btn').addEventListener('click', () => {
                    Object.assign(that.properties, originalProperties);
                    that.setDirtyCanvas(true, true);
                });
                dialog.querySelector('#fontFamily').addEventListener('change', function(e) {
                    const selectedFont = e.target.value;
                    updateProperty('fontFamily', selectedFont);
                    e.target.style.setProperty('--select-value', selectedFont);
                });
                dialog.querySelector('#titleFontWeight').addEventListener('change', function(e) {
                    updateProperty('titleFontWeight', e.target.value);
                });
                dialog.querySelector('#subtitleFontWeight').addEventListener('change', function(e) {
                    updateProperty('subtitleFontWeight', e.target.value);
                });
                dialog.querySelector('#gradientType').addEventListener('change', function(e) {
                    const type = e.target.value;
                    updateProperty('gradientType', type);
                    dialog.querySelector('#gradientAngleRow').style.display = type === 'linear' ? 'flex' : 'none';
                    updateGradientPreview();
                });
                dialog.querySelector('#gradientAngle').addEventListener('input', function(e) {
                    const angle = parseInt(e.target.value);
                    updateProperty('gradientAngle', angle);
                    this.nextElementSibling.textContent = angle + '°';
                    updateGradientPreview();
                });
                dialog.querySelector('#gradientStartColor').addEventListener('input', function(e) {
                    const color = e.target.value;
                    updateProperty('gradientStartColor', color);
                    updateGradientPreview();
                });
                dialog.querySelector('#gradientEndColor').addEventListener('input', function(e) {
                    const color = e.target.value;
                    updateProperty('gradientEndColor', color);
                    updateGradientPreview();
                });
                function updateGradientPreview() {
                    const preview = dialog.querySelector('#gradientPreview');
                    const type = that.properties.gradientType;
                    const angle = that.properties.gradientAngle;
                    const startColor = that.properties.gradientStartColor;
                    const endColor = that.properties.gradientEndColor;
                    let gradientString;
                    if (type === 'linear') {
                        gradientString = `linear-gradient(${angle}deg, ${startColor} 0%, ${endColor} 100%)`;
                    } else if (type === 'radial') {
                        gradientString = `radial-gradient(circle at center, ${startColor} 0%, ${endColor} 100%)`;
                    } else { 
                        gradientString = `conic-gradient(from ${angle}deg at center, ${startColor} 0%, ${endColor} 100%)`;
                    }
                    preview.style.background = gradientString;
                }
                const handle = dialog.querySelector('#dialog-handle');
                let isDragging = false;
                let currentX;
                let currentY;
                let initialX;
                let initialY;
                let xOffset = 0;
                let yOffset = 0;
                dialog.style.transform = 'translate(-50%, -50%)';
                handle.addEventListener('mousedown', dragStart);
                document.addEventListener('mousemove', drag);
                document.addEventListener('mouseup', dragEnd);
                function dragStart(e) {
                    const rect = dialog.getBoundingClientRect();
                    if (xOffset === 0 && yOffset === 0) {
                        xOffset = rect.left + rect.width / 2 - window.innerWidth / 2;
                        yOffset = rect.top + rect.height / 2 - window.innerHeight / 2;
                    }
                    initialX = e.clientX - xOffset;
                    initialY = e.clientY - yOffset;
                    if (e.target === handle) {
                        isDragging = true;
                        dialog.style.transition = 'none';
                        dialog.style.cursor = 'grabbing';
                    }
                }
                function drag(e) {
                    if (isDragging) {
                        e.preventDefault();
                        currentX = e.clientX - initialX;
                        currentY = e.clientY - initialY;
                        xOffset = currentX;
                        yOffset = currentY;
                        dialog.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px))`;
                    }
                }
                function dragEnd(e) {
                    initialX = currentX;
                    initialY = currentY;
                    isDragging = false;
                    dialog.style.cursor = 'default';
                }
            };
            nodeType.prototype.rgbaToHex = function(rgba) {
                if (!rgba) return "#000000";
                if (rgba.startsWith('#')) {
                    let hex = rgba.replace('#', '');
                    if (hex.length === 3) {
                        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
                    }
                    if (hex.length === 4) {
                        hex = hex.slice(0, 3);  
                        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
                    }
                    if (hex.length === 8) {
                        hex = hex.slice(0, 6);  
                    }
                    if (hex.length !== 6) {
                        return "#000000";
                    }
                    return '#' + hex;
                }
                const parts = rgba.match(/[\d.]+/g);
                if (!parts || parts.length < 3) return "#000000";
                const r = Math.min(255, Math.max(0, parseInt(parts[0])));
                const g = Math.min(255, Math.max(0, parseInt(parts[1])));
                const b = Math.min(255, Math.max(0, parseInt(parts[2])));
                return '#' + [r, g, b].map(x => {
                    const hex = x.toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                }).join('');
            };
            nodeType.prototype.hexToRgba = function(hex, opacity = 1) {
                if (!hex) return "rgba(0,0,0,1)";
                if (hex.startsWith('rgba')) return hex;
                hex = hex.replace('#', '');
                if (hex.length === 3) {
                    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
                }
                if (hex.length === 4) {
                    hex = hex.slice(0, 3);
                    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
                }
                if (hex.length === 8) {
                    hex = hex.slice(0, 6);
                }
                if (hex.length !== 6) {
                    hex = '000000';
                }
                const r = parseInt(hex.slice(0, 2), 16);
                const g = parseInt(hex.slice(2, 4), 16);
                const b = parseInt(hex.slice(4, 6), 16);
                opacity = Math.min(1, Math.max(0, opacity));
                return `rgba(${r},${g},${b},${opacity})`;
            };
            nodeType.prototype.onSerialize = function(o) {
                o.properties = {};
                for (let key in defaultProperties) {
                    o.properties[key] = this.properties[key];
                }
                o.size = [...this.size];
                o.pos = [...this.pos];
                if (this.properties.customBackground && this.properties.backgroundUrl) {
                    o.properties.backgroundUrl = this.properties.backgroundUrl;
                }
                o.properties.animation = this.properties.animation;
                o.properties.animationType = this.properties.animationType;
                o.properties.animationDuration = this.properties.animationDuration;
                o.properties.animationEasing = this.properties.animationEasing;
                o.properties.animationLoop = this.properties.animationLoop;
            };
            nodeType.prototype.onConfigure = function(o) {
                this.properties = {...defaultProperties};
                if (o.properties) {
                    for (let key in o.properties) {
                        this.properties[key] = o.properties[key];
                    }
                }
                if (o.size) {
                    this.size = [...o.size];
                    this.originalSize = [...o.size];
                }
                if (o.pos) {
                    this.pos = [...o.pos];
                    this.originalPos = [...o.pos];
                }
                if (this.properties.customBackground && this.properties.backgroundUrl) {
                    this.setCustomBackground(this.properties.backgroundUrl);
                }
                if (this.properties.animation) {
                    this.isAnimating = false;
                    this.currentAnimationType = this.properties.animationType;
                    this.rotation = 0;
                    this.fadeProgress = undefined;
                    this.animationTimer = null;
                    setTimeout(() => {
                        if (this.properties.animation) {
                            this.startAnimation();
                        }
                    }, 1000);
                }
                this.loadFonts();
                return true;
            };
        }
    }
});
const oldDrawNode = LGraphCanvas.prototype.drawNode;
LGraphCanvas.prototype.drawNode = function(node, ctx) {
    if (node.type === "TitlePlus") {
        const originalColor = node.color;
        const originalBgColor = node.bgcolor;
        node.color = "rgba(0,0,0,0)";
        node.bgcolor = "rgba(0,0,0,0)";
        const result = oldDrawNode.apply(this, arguments);
        node.color = originalColor;
        node.bgcolor = originalBgColor;
        if (node.onDrawForeground) {
            node.onDrawForeground(ctx);
        }
        if (node.mouseOver) {
            
            
            
            const EDIT_ICON_SIZE = 16; 
            const EDIT_ICON_MARGIN = 8;
            const EDIT_ICON_DOT_RADIUS = EDIT_ICON_SIZE * 0.1;
            const EDIT_ICON_DOT_SPACING = EDIT_ICON_SIZE * 0.3;

            const iconX = node.size[0] - EDIT_ICON_SIZE - EDIT_ICON_MARGIN;
            const iconY = node.size[1] - EDIT_ICON_SIZE - EDIT_ICON_MARGIN;
            const centerX = iconX + EDIT_ICON_SIZE / 2;
            const centerY = iconY + EDIT_ICON_SIZE / 2;
            
            ctx.save();
            ctx.translate(centerX, centerY);
            if (node.mouseOverEdit) {
                ctx.fillStyle = "#FFFFFF"; 
            } else {
                ctx.fillStyle = "#AAAAAA"; 
            }
            ctx.beginPath();
            ctx.arc(-EDIT_ICON_DOT_SPACING, 0, EDIT_ICON_DOT_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(0, 0, EDIT_ICON_DOT_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(EDIT_ICON_DOT_SPACING, 0, EDIT_ICON_DOT_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore(); 
        }
        return result;
    }
    return oldDrawNode.apply(this, arguments);
};
