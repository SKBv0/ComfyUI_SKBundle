import { app } from "../../../scripts/app.js";

app.registerExtension({
    name: "SKB.TitlePlus",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "TitlePlus") {
            const defaultProperties = {
                title: "Modern Title",
                subtitle: "Sleek Subtitle",
                fontFamily: "Poppins",
                titleFontSize: 28,
                subtitleFontSize: 16,
                titleFontWeight: "600",
                subtitleFontWeight: "400",
                titleColor: "#ffffff",
                subtitleColor: "#cccccc",
                textColor: "#ffffff",
                backgroundColor: "#242424",
                accentColor: "#3498db",
                borderRadius: 12,
                padding: 20,
                titleSubtitleGap: 8,
                animation: false,
                animationType: "none",
                animationDuration: 500,
                animationEasing: "linear",
                shadow: true,
                shadowColor: "rgba(0,0,0,0.25)",
                shadowBlur: 15,
                shadowOffsetX: 0,
                shadowOffsetY: 4,
                textAlign: "left",
                gradientBackground: true,
                gradientStartColor: "#2d2d44",
                gradientEndColor: "#1e1e2d",
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
                dividerColor: "#3498db",
                dividerWidth: 2,
                dividerLength: 120,
                dividerOpacity: 0.8,
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
                    { value: "300", label: "Light" },
                    { value: "400", label: "Regular" },
                    { value: "500", label: "Medium" },
                    { value: "600", label: "Semi Bold" },
                    { value: "700", label: "Bold" }
                ],
                titleFontSize: [24, 36, 48, 60, 72],
                titleFontWeight: ["Thin", "Light", "Regular", "Medium", "Bold"],
                subtitleFontSize: [18, 24, 30, 36, 42],
                subtitleFontWeight: ["Thin", "Light", "Regular", "Medium", "Bold"],
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
                
                // Output'u gizle
                this.outputs = [];
                
                // Add properties with appropriate widgets
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
                this.color = "#fff0";
                this.bgcolor = "#fff0";
                this.flags = {
                    allow_interaction: true,
                    resizable: true,
                    draggable: true
                };

                // Initialize animation properties
                this.originalPos = this.pos ? [...this.pos] : [0, 0];
                this.originalSize = this.size ? [...this.size] : [200, 100];
                this.rotation = 0;
                this.fadeProgress = undefined;
                this.animationTimer = null;

                // Animasyon özelliklerini başlat
                this.properties.animation = false;
                this.properties.animationType = "none";
                this.properties.animationDuration = 500;
                this.properties.animationEasing = "linear";
                this.isAnimating = false;
                this.currentAnimationType = "none";

                this.loadFonts();

                // Make sure the node is resizable and has a minimum size
                this.resizable = true;
                this.size = this.computeSize();
                this.setSize(this.size);
            };

            nodeType.prototype.loadFonts = function() {
                const fonts = options.fontFamily.map(font => 
                    `${font.value.replace(' ', '+')}:wght@${font.weight}`
                );

                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${f}`).join('&')}&display=swap`;
                document.head.appendChild(link);
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
                
                // Eğer orijinal pozisyon tanımlı değilse veya node taşınmışsa güncelle
                if (!this.originalPos || this.pos[0] !== this.originalPos[0] || this.pos[1] !== this.originalPos[1]) {
                this.originalPos = [...this.pos];
                }
                
                this.originalSize = [...this.size];
                
                // Performans için değişkenleri önden tanımla
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
                
                // FPS kontrolü için değişkenler
                const targetFPS = 60;
                const frameInterval = 1000 / targetFPS;
                
                const animate = (currentTime) => {
                    if (!node.properties.animation || node.currentAnimationType !== animationType || node.wasPaused) {
                        return;
                    }

                    // FPS kontrolü
                    const deltaTime = currentTime - lastFrameTime;
                    if (deltaTime < frameInterval) {
                        node.animationTimer = requestAnimationFrame(animate);
                        return;
                    }

                    // Progress hesaplama
                    this.progress += (deltaTime / duration) * this.direction;

                    // Yön değiştirme kontrolü
                    if (this.progress >= 1 || this.progress <= 0) {
                        this.progress = 0;  // Her zaman başa dön
                    }

                    // Optimize edilmiş easing
                    const easedProgress = easingFunction(this.progress);
                    
                    // Animasyon fonksiyonunu çağır
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
                
                // Animasyon değişkenlerini temizle
                this.bounceBaseY = null;
                this.shakeBasePos = null;
                this.slideOffset = 0;
                this.isSliding = false;
                this.rotation = 0;
                this.fadeProgress = undefined;
                this.isAnimating = false;
                this.currentAnimationType = "none";
                
                // Son bir kez canvas'ı güncelle
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

            // Node taşındığında base pozisyonları güncelle
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

                ctx.font = `${titleFontWeight} ${titleFontSize}px ${fontFamily}`;
                ctx.fillStyle = this.properties.titleColor;
                ctx.textAlign = textAlign;
                ctx.textBaseline = 'top';
                const titleX = textAlign === 'left' ? padding : (textAlign === 'right' ? width - padding : width / 2);
                ctx.fillText(title, titleX, padding);

                ctx.font = `${subtitleFontWeight} ${subtitleFontSize}px ${fontFamily}`;
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

            nodeType.prototype.animateNode = function(type, duration) {
                if (!this.properties.animation || type === "none") {
                    return;
                }
                
                if (this.isAnimating) {
                    this.stopAnimation();
                }
                
                this.isAnimating = true;
                this.currentAnimationType = type;
                const node = this;
                let startTime = Date.now();
                let direction = 1;
                
                const easingFunctions = {
                    linear: t => t,
                    easeInQuad: t => t * t,
                    easeOutQuad: t => t * (2 - t),
                    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
                    easeInCubic: t => t * t * t,
                    easeOutCubic: t => (--t) * t * t + 1,
                    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
                    easeInElastic: t => (.04 - .04 / t) * Math.sin(25 * t) + 1,
                    easeOutElastic: t => .04 * t / (--t) * Math.sin(25 * t),
                    easeInOutElastic: t => (t -= .5) < 0 
                        ? (.02 + .01 / t) * Math.sin(50 * t) 
                        : (.02 - .01 / t) * Math.sin(50 * t) + 1,
                };

                const animationTypes = {
                    fade: (progress, easing) => {
                        const easedProgress = easingFunctions[easing](progress);
                        node.fadeProgress = direction > 0 ? easedProgress : 1 - easedProgress;
                        node.setDirtyCanvas(true, true);
                    },
                    slide: (progress, easing) => {
                        const easedProgress = easingFunctions[easing](progress);
                        const slideProgress = direction > 0 ? easedProgress : 1 - easedProgress;
                        node.pos[0] = this.originalPos[0] + slideProgress * node.size[0];
                    },
                    bounce: (progress, easing) => {
                        const easedProgress = easingFunctions[easing](progress);
                        const bounceProgress = direction > 0 ? easedProgress : 1 - easedProgress;
                        node.pos[1] = this.originalPos[1] + Math.abs(Math.sin(bounceProgress * Math.PI)) * 20;
                    },
                    rotate: (progress, easing) => {
                        const easedProgress = easingFunctions[easing](progress);
                        const rotateProgress = direction > 0 ? easedProgress : 1 - easedProgress;
                        node.rotation = rotateProgress * Math.PI;
                        node.setDirtyCanvas(true, true);
                    },
                    shake: (progress, easing) => {
                        const easedProgress = easingFunctions[easing](progress);
                        const shakeAmount = 10 * (1 - Math.abs(1 - easedProgress * 2));
                        node.pos[0] = this.originalPos[0] + Math.sin(progress * Math.PI * 20) * shakeAmount;
                        node.pos[1] = this.originalPos[1] + Math.cos(progress * Math.PI * 20) * shakeAmount;
                    },
                };

                const animate = () => {
                    if (!node.properties.animation || node.currentAnimationType !== type) {
                        node.stopAnimation();
                        return;
                    }

                    const currentTime = Date.now();
                    const elapsed = currentTime - startTime;
                    let progress = (elapsed % duration) / duration;

                    if (direction < 0) {
                        progress = 1 - progress;
                    }

                    if (animationTypes[type]) {
                        animationTypes[type](progress, node.properties.animationEasing);
                    }

                    node.animationTimer = setTimeout(() => {
                        node.setDirtyCanvas(true, true);
                        requestAnimationFrame(animate);
                    }, 1000 / 60);

                    if (elapsed >= duration) {
                        direction *= -1;
                        startTime = currentTime;
                    }
                };

                animate();
            };

            nodeType.category = "SKB";

            nodeType.prototype.getTitle = function() {
                return "";
            };

            nodeType.prototype.onBounding = function() {
                return [0, 0, this.size[0], this.size[1]];
            }

            nodeType.prototype.onRemoved = function() {
                if (this.editButton && this.editButton.parentElement) {
                    this.editButton.parentElement.removeChild(this.editButton);
                }
                this.stopAnimation();
            };

            nodeType.prototype.computeSize = function() {
                const { title, subtitle, titleFontSize, subtitleFontSize, padding } = this.properties;
                const width = Math.max(
                    this.measureText(title, titleFontSize),
                    this.measureText(subtitle, subtitleFontSize)
                ) + padding * 2;
                const height = titleFontSize + subtitleFontSize + padding * 3;
                return [Math.max(width, 200), Math.max(height, 100)];
            };

            nodeType.prototype.measureText = function(text, fontSize) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                ctx.font = `${fontSize}px ${this.properties.fontPath}`;
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
                    console.error('Resim yüklenemedi:', imageUrl);
                    that.properties.customBackground = false;
                    that.backgroundImage = null;
                    that.setDirtyCanvas(true, true);
                };
                
                img.src = imageUrl;
            };

            nodeType.prototype.onMouseDown = function(e, local_pos, global_pos) {
                if (!local_pos) return null;

                const editIconSize = 20;
                const editIconX = this.size[0] - editIconSize - 5;
                const editIconY = this.size[1] - editIconSize - 5;

                if (this.mouseOver && local_pos[0] > editIconX && local_pos[0] < editIconX + editIconSize &&
                    local_pos[1] > editIconY && local_pos[1] < editIconY + editIconSize) {
                    this.showEditDialog();
                    return null;
                }

                if (local_pos[1] < 20) {
                    return null;
                }

                return null;
            };

            nodeType.prototype.onResize = function(size) {
                this.size = size;
                this.setDirtyCanvas(true, true);
            };

            nodeType.prototype.getMinSize = function() {
                const minWidth = 360;
                const minHeight = 100;
                
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

            nodeType.prototype.onMouseMove = function(e, local_pos, global_pos) {
                if (!local_pos) return;

                const editIconSize = 20;
                const editIconX = this.size[0] - editIconSize - 5;
                const editIconY = this.size[1] - editIconSize - 5;

                const wasOverEdit = this.mouseOverEdit;
                this.mouseOverEdit = local_pos[0] > editIconX && local_pos[0] < editIconX + editIconSize &&
                                    local_pos[1] > editIconY && local_pos[1] < editIconY + editIconSize;
                
                if (wasOverEdit !== this.mouseOverEdit) {
                    this.setDirtyCanvas(true, true);
                }
            };

            nodeType.prototype.onMouseUp = function(e, pos) {
                this.draggingTitle = false;
                this.draggingSubtitle = false;
            };

            nodeType.prototype.insideRect = function(x, y, rect) {
                return x >= rect.x && x <= rect.x + rect.width &&
                       y >= rect.y && y <= rect.y + rect.height;
            };

            nodeType.prototype.loadCustomFont = function(fontName, fontUrl) {
                const font = new FontFace(fontName, `url(${fontUrl})`);
                font.load().then((loadedFont) => {
                    document.fonts.add(loadedFont);
                    this.properties.fontPath = fontName;
                    this.setDirtyCanvas(true, true);
                }).catch((error) => {
                    console.error('Error loading font:', error);
                });
            };

            nodeType.prototype.getExtraMenuOptions = function(graphCanvas) {
                return [
                    {
                        content: "Randomize Colors",
                        callback: () => {
                            this.properties.textColor = this.getRandomColor();
                            this.properties.accentColor = this.getRandomColor();
                            this.properties.gradientStartColor = this.getRandomColor();
                            this.properties.gradientEndColor = this.getRandomColor();
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
                return '#' + Math.floor(Math.random()*16777215).toString(16);
            };

            nodeType.prototype.showEditDialog = function() {
                const that = this;
                
                const dialog = document.createElement("div");
                dialog.className = "titleplus-dialog";
                dialog.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #1a1a1a;
                    padding: 15px;
                    border-radius: 12px;
                    z-index: 10000;
                    width: 360px;
                    max-height: 85vh;
                    overflow-y: auto;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                    border: 1px solid #333;
                `;

                const styles = `
                    .titleplus-dialog {
                        font-family: 'Inter', system-ui, -apple-system, sans-serif;
                        color: #e0e0e0;
                        scrollbar-width: thin;
                        scrollbar-color: #666 #1a1a1a;
                    }
                    .titleplus-dialog h3 {
                        color: #fff;
                        margin: 0 0 15px 0;
                        text-align: center;
                        font-size: 16px;
                        font-weight: 500;
                        padding: 10px;
                        border-bottom: 1px solid #333;
                        cursor: move;
                        user-select: none;
                        background: #242424;
                        margin: -15px -15px 15px -15px;
                        border-radius: 12px 12px 0 0;
                    }
                    .titleplus-dialog h3:hover {
                        background: #2a2a2a;
                    }
                    .titleplus-dialog h3:active {
                        background: #303030;
                    }
                    .titleplus-dialog .section {
                        background: #242424;
                        border-radius: 8px;
                        padding: 12px;
                        margin: 8px 0;
                        border: 1px solid #333;
                    }
                    .titleplus-dialog .section-title {
                        color: #3498db;
                        font-size: 14px;
                        margin-bottom: 8px;
                        font-weight: 500;
                    }
                    .titleplus-dialog input, .titleplus-dialog select {
                        background: #333;
                        border: 1px solid #444;
                        color: #fff;
                        border-radius: 6px;
                        font-size: 13px;
                        padding: 6px 8px;
                        width: 100%;
                        transition: all 0.2s ease;
                    }
                    .titleplus-dialog input:focus, .titleplus-dialog select:focus {
                        border-color: #3498db;
                        outline: none;
                        box-shadow: 0 0 0 2px rgba(52,152,219,0.2);
                    }
                    .titleplus-dialog input[type="color"] {
                        width: 45px;
                        height: 24px;
                        padding: 0;
                        border: none;
                        cursor: pointer;
                    }
                    .titleplus-dialog input[type="range"] {
                        -webkit-appearance: none;
                        height: 4px;
                        background: #333;
                        border-radius: 2px;
                        width: calc(100% - 50px);
                    }
                    .titleplus-dialog input[type="range"]::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        width: 16px;
                        height: 16px;
                        background: #3498db;
                        border-radius: 50%;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    .titleplus-dialog input[type="range"]::-webkit-slider-thumb:hover {
                        transform: scale(1.1);
                    }
                    .titleplus-dialog input[type="number"] {
                        width: 60px;
                    }
                    .titleplus-dialog input[type="checkbox"] {
                        width: 16px;
                        height: 16px;
                        margin: 0;
                    }
                    .titleplus-dialog label {
                        font-size: 13px;
                        color: #bbb;
                        margin: 6px 0;
                    }
                    .titleplus-dialog .row {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        margin: 6px 0;
                    }
                    .titleplus-dialog .row label {
                        margin: 0;
                        flex: 1;
                    }
                    .titleplus-dialog .color-row {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        margin: 6px 0;
                    }
                    .titleplus-dialog .color-row label {
                        margin: 0;
                        flex: 1;
                    }
                    .titleplus-dialog .buttons {
                        display: flex;
                        justify-content: flex-end;
                        gap: 8px;
                        margin-top: 12px;
                        padding-top: 12px;
                        border-top: 1px solid #333;
                    }
                    .titleplus-dialog button {
                        padding: 6px 12px;
                        border: none;
                        border-radius: 6px;
                        font-size: 13px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        background: #3498db;
                        color: white;
                    }
                    .titleplus-dialog button:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 2px 8px rgba(52,152,219,0.3);
                    }
                    .titleplus-dialog .close-btn {
                        background: #444;
                    }
                    .titleplus-dialog .close-btn:hover {
                        background: #e74c3c;
                    }
                    .titleplus-dialog span {
                        font-size: 12px;
                        color: #999;
                        min-width: 35px;
                        text-align: right;
                    }
                    .titleplus-dialog .gradient-preview {
                        margin: 15px 0;
                        padding: 10px;
                        background: #1a1a1a;
                        border-radius: 8px;
                        border: 1px solid #333;
                    }
                    .titleplus-dialog .gradient-stops {
                        position: relative;
                        height: 20px;
                        margin-bottom: 5px;
                    }
                    .titleplus-dialog .gradient-stop {
                        position: absolute;
                        transform: translateX(-50%);
                        cursor: move;
                    }
                    .titleplus-dialog .gradient-stop input[type="color"] {
                        width: 20px;
                        height: 20px;
                        padding: 0;
                        border: 2px solid #fff;
                        border-radius: 50%;
                        cursor: pointer;
                    }
                    .titleplus-dialog .gradient-bar {
                        height: 30px;
                        border-radius: 4px;
                        margin: 10px 0;
                    }
                    .titleplus-dialog .add-stop {
                        background: #2c3e50;
                        color: #fff;
                        border: none;
                        padding: 5px 10px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        margin-top: 5px;
                    }
                `;

                dialog.innerHTML = `
                    <style>
                        ${styles}
                    </style>
                    <h3 id="dialog-handle">Title Plus Editor</h3>
                    
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
                    return rgba.slice(0, 7);
                }
                
                const parts = rgba.match(/[\d.]+/g);
                if (!parts || parts.length < 3) return "#000000";
                
                const r = parseInt(parts[0]);
                const g = parseInt(parts[1]);
                const b = parseInt(parts[2]);
                
                return '#' + [r, g, b].map(x => {
                    const hex = x.toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                }).join('');
            };

            nodeType.prototype.hexToRgba = function(hex) {
                if (!hex) return "rgba(0,0,0,1)";
                if (hex.startsWith('rgba')) return hex;
                
                hex = hex.replace('#', '').slice(0, 6);
                while (hex.length < 6) hex += '0';
                
                const r = parseInt(hex.slice(0, 2), 16);
                const g = parseInt(hex.slice(2, 4), 16);
                const b = parseInt(hex.slice(4, 6), 16);
                
                return `rgba(${r},${g},${b},1)`;
            };

            nodeType.prototype.onSerialize = function(o) {
                o.properties = {};
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
        }
    }
});

const oldDrawNode = LGraphCanvas.prototype.drawNode;
LGraphCanvas.prototype.drawNode = function(node, ctx) {
    if (node.type === "TitlePlus") {
        const result = oldDrawNode.apply(this, arguments);
        
        if (node.onDrawForeground) {
            node.onDrawForeground(ctx);
        }
        
        if (node.mouseOver) {
            const canvas = this.canvas;
            const rect = canvas.getBoundingClientRect();
            
            const scale = this.ds.scale;
            const offsetX = this.ds.offset[0];
            const offsetY = this.ds.offset[1];
            
            const editIconSize = 24;
            const margin = 8;
            
            const nodeX = (node.pos[0] + offsetX) * scale;
            const nodeY = (node.pos[1] + offsetY) * scale;
            const nodeWidth = node.size[0] * scale;
            const nodeHeight = node.size[1] * scale;
            
            const editIconX = nodeX + nodeWidth - (editIconSize + margin) * scale;
            const editIconY = nodeY + nodeHeight - (editIconSize + margin) * scale;
            
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            
            ctx.beginPath();
            ctx.arc(
                editIconX + editIconSize/2 * scale,
                editIconY + editIconSize/2 * scale,
                editIconSize/2 * scale,
                0,
                Math.PI * 2
            );
            
            if (node.mouseOverEdit) {
                ctx.fillStyle = "rgba(41, 128, 185, 0.95)"; 
            } else {
                ctx.fillStyle = "rgba(52, 152, 219, 0.85)"; 
            }
            
            ctx.shadowColor = "rgba(0,0,0,0.15)";
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 2;
            ctx.fill();
            
            ctx.shadowColor = "transparent";
            
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5 * scale;
            ctx.lineCap = "round";
            
            const iconOffset = editIconSize * 0.3 * scale;
            const centerX = editIconX + editIconSize/2 * scale;
            const centerY = editIconY + editIconSize/2 * scale;
            
            ctx.beginPath();
            ctx.moveTo(centerX - iconOffset, centerY - iconOffset);
            ctx.lineTo(centerX + iconOffset, centerY - iconOffset);
            ctx.lineTo(centerX + iconOffset, centerY + iconOffset);
            ctx.lineTo(centerX - iconOffset, centerY + iconOffset);
            ctx.closePath();
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(centerX + iconOffset, centerY - iconOffset);
            ctx.lineTo(centerX + iconOffset + iconOffset/2, centerY - iconOffset - iconOffset/2);
            ctx.stroke();
            
            ctx.restore();
        }
        
        return result;
    }
    return oldDrawNode.apply(this, arguments);
};