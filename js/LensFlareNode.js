import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";
import {
    FLARE_TYPES,
    DEFAULT_FLARE_CONFIGS,
    BLEND_MODES,
    DEFAULT_WIDGET_VALUES,
    SLIDER_RANGES,
    SLIDER_CATEGORIES,
    UI_STYLES,
    NODE_UI_CONSTANTS,
    SLIDER_CONFIG,
    ATMOSPHERIC_EFFECTS,
    CINEMATIC_LIGHT,
    STARBURST_STYLES,
    GRADIENT_HELPERS,
    COLOR_UTILITIES,
    GHOST_PRESETS,
    VECTOR_UTILS,
    RENDER_CONSTANTS
} from "./LensFlareConfig.js";

function imageDataToUrl(data) {
    return api.apiURL(`/view?filename=${encodeURIComponent(data.filename)}&type=${data.type}&subfolder=${encodeURIComponent(data.subfolder)}${app.getPreviewFormatParam()}${app.getRandParam()}`);
}

function isInBounds(x, y, area) {
    if (!area) return false;
    return x >= area.x && 
           x <= area.x + area.width && 
           y >= area.y && 
           y <= area.y + area.height;
}

app.registerExtension({
    name: "skb.LensFlare",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name !== "LensFlare") return;

        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function() {
            const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
            
            this._initializeWidgets();
            this._initializeNodeProperties();
            this._initializeUIState();
            this._initializeCanvasState();
            
            this.onConnectionsChange = this._handleConnectionsChange.bind(this);
            
            return r;
        };


        nodeType.prototype._initializeWidgets = function() {
            if (this.widgets) {
                for (const w of this.widgets) {
                    w.hidden = true;
                    if (w.name in DEFAULT_WIDGET_VALUES) {
                        w.value = DEFAULT_WIDGET_VALUES[w.name];
                    }
                }
            }
            this.serialize_widgets = true;
        };


        nodeType.prototype._initializeNodeProperties = function() {
            this.imgs = [];
            
            this.properties = this.properties || {};
            

            Object.assign(this.properties, DEFAULT_WIDGET_VALUES);
            

            this.properties.flare_type = "50MM_PRIME";
            

            const defaultConfig = DEFAULT_FLARE_CONFIGS[this.properties.flare_type];
            if (defaultConfig) {
                Object.assign(this, {
                    mainColor: defaultConfig.mainColor,
                    secondaryColor: defaultConfig.secondaryColor,
                    ghostCount: defaultConfig.ghostCount,
                    ghostSpacing: defaultConfig.ghostSpacing,
                    ghostSizes: defaultConfig.ghostSizes,
                    ghostOpacities: defaultConfig.ghostOpacities,
                    anamorphicStretch: defaultConfig.anamorphicStretch
                });
                

                this.properties.starburst_color = [defaultConfig.mainColor.r, defaultConfig.mainColor.g, defaultConfig.mainColor.b];
                this.properties.ghost_color = defaultConfig.ghostColor 
                    ? [defaultConfig.ghostColor.r, defaultConfig.ghostColor.g, defaultConfig.ghostColor.b]
                    : [255,255,255];
                

                this.properties.secondary_color = [
                    defaultConfig.secondaryColor.r,
                    defaultConfig.secondaryColor.g,
                    defaultConfig.secondaryColor.b
                ];
            }
        };


        nodeType.prototype._initializeUIState = function() {
            this.UI_CONSTANTS = NODE_UI_CONSTANTS;
            this.dialog = {
                isOpen: false,
                position: { x: 0, y: 0 },
                size: { width: 400, height: 500 },
                isDragging: false,
                dragOffset: { x: 0, y: 0 }
            };
            this.sliderBounds = {};
            this.activeSlider = null;
        };


        nodeType.prototype._initializeCanvasState = function() {
            this.isDragging = false;
            this.isPointerOver = false;
            this.offscreenCanvas = document.createElement('canvas');
        };


        nodeType.prototype._handleConnectionsChange = function(type, index, connected, link_info) {
            if (type === 1) {
                if (connected && link_info) {
                    const inputNode = app.graph.getNodeById(link_info.origin_id);
                    if (inputNode) {
                        if (inputNode.imgs && inputNode.imgs.length > 0) {
                            this.imgs = [inputNode.imgs[0]];
                            this.applyFlareTypeSettings("50MM_PRIME");
                            if (this.graph && app.graph?.canvas) {
                            this.setDirtyCanvas(true);
                            }
                        } else if (inputNode.imageData) {
                            const img = new Image();
                            const url = imageDataToUrl(inputNode.imageData);
                            
                            img.onload = () => {
                                this.imgs = [img];
                                this.applyFlareTypeSettings("50MM_PRIME");
                                if (this.graph && app.graph?.canvas) {
                                this.setDirtyCanvas(true);
                                }
                            };
                            
                            img.onerror = () => {
                                console.error("Preview image load error");
                            };
                            
                            img.src = url;
                        }
                    } else {
                        this.imgs = [];
                        if (this.graph && app.graph?.canvas) {
                        this.setDirtyCanvas(true);
                        }
                    }
                }
            }
        };

        this.onPropertyChanged = function(property, value) {
"   "
            if (property === 'ghost_color' || property === 'secondary_color') {
                ;
            }
            if (property in this.properties) {
                this.properties[property] = value;
                
                if (property === 'flare_type') {
                    const config = DEFAULT_FLARE_CONFIGS[value];
                    if (config) {
                        this.mainColor = {...config.mainColor};
                        this.secondaryColor = {...config.secondaryColor};

                        this.properties.main_color = [this.mainColor.r, this.mainColor.g, this.mainColor.b];
                        this.properties.ghost_color = [
                            config.ghostColor.r,
                            config.ghostColor.g,
                            config.ghostColor.b
                        ];

                        this.properties.starburst_color = [this.mainColor.r, this.mainColor.g, this.mainColor.b];

                        this.ghostCount = config.ghostCount;
                        this.ghostSpacing = config.ghostSpacing;
                        this.ghostSizes = config.ghostSizes;
                        this.ghostOpacities = config.ghostOpacities;
                        this.anamorphicStretch = config.anamorphicStretch;

                        if (config.defaultSettings) {
                            Object.entries(config.defaultSettings).forEach(([key, defaultValue]) => {
                                this.properties[key] = defaultValue;
                                this._updateWidgetValue(key, defaultValue);
                                
                                if (this.dialog && this.dialog.isOpen) {
                                    this._updateSliderUI(`${key}Slider`, defaultValue, SLIDER_RANGES[key] || { min: 0, max: 1 });
                                    const valueDisplay = document.querySelector(`#${key}Value`);
                                    if (valueDisplay) {
                                        valueDisplay.textContent = this.formatSliderValue(key, defaultValue);
                                    }
                                }
                            });
                        }
                    }


                }
            };

            this.updateSliderValue = function(x, sliderKey) {
                const bounds = this.sliderBounds[sliderKey];
                if (!bounds) return;

                const progress = Math.max(0, Math.min(1, (x - bounds.x) / bounds.width));
                const range = SLIDER_RANGES[sliderKey.toLowerCase().replace(/\s+/g, '_')];
                
                if (!range) return;

                const value = range.min + (range.max - range.min) * progress;
                const propertyKey = sliderKey.toLowerCase().replace(/\s+/g, '_');
                
                this.properties[propertyKey] = value;
                this._updateSliderUI(`${propertyKey}Slider`, value, range);
                
                const valueDisplay = document.querySelector(`#${propertyKey}Value`);
                if (valueDisplay) {
                    valueDisplay.textContent = this.formatSliderValue(propertyKey, value);
                }

                this.setDirtyCanvas(true);
            };

            this.properties.starburst_color = [255, 255, 255];
            this.properties.ghost_color = [255, 255, 255];

            nodeType.prototype.drawGhost = function(ctx, params) {
                const { x, y, size, opacity, angle } = params;
                
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle);

                const ghostGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
                

                const ghostColor = this.properties.ghost_color || [255, 255, 255];
                ghostGlow.addColorStop(0, `rgba(${ghostColor[0]},${ghostColor[1]},${ghostColor[2]},${opacity})`);
                ghostGlow.addColorStop(0.5, `rgba(${ghostColor[0]},${ghostColor[1]},${ghostColor[2]},${opacity * 0.7})`);
                ghostGlow.addColorStop(1, 'rgba(0,0,0,0)');


                ctx.scale(1.2, 1.0);
                ctx.fillStyle = ghostGlow;
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            };

            nodeType.prototype.updateColorPickers = function(dialog, mainColor, secondaryColor) {
                const mainColorPicker = dialog.querySelector('#mainColorPicker');
                const secondaryColorPicker = dialog.querySelector('#secondaryColorPicker');
                const starburstColorPicker = dialog.querySelector('#starburstColorPicker');
                const ghostColorPicker = dialog.querySelector('#ghostColorPicker');

                if (mainColorPicker) {
                    const mainHex = this.rgbToHex(mainColor);
                    mainColorPicker.value = mainHex;
                    mainColorPicker.nextElementSibling.textContent = mainHex.toUpperCase();
                }
                
                if (secondaryColorPicker) {
                    const secondaryHex = this.rgbToHex(secondaryColor);
                    secondaryColorPicker.value = secondaryHex;
                    secondaryColorPicker.nextElementSibling.textContent = secondaryHex.toUpperCase();
                }


                if (starburstColorPicker && this.properties.starburst_color) {
                    const starburstHex = this.rgbToHex({
                        r: this.properties.starburst_color[0],
                        g: this.properties.starburst_color[1],
                        b: this.properties.starburst_color[2]
                    });
                    starburstColorPicker.value = starburstHex;
                    starburstColorPicker.nextElementSibling.textContent = starburstHex.toUpperCase();
                }
                
                if (ghostColorPicker && this.properties.ghost_color) {
                    const ghostHex = this.rgbToHex({
                        r: this.properties.ghost_color[0],
                        g: this.properties.ghost_color[1],
                        b: this.properties.ghost_color[2]
                    });
                    ghostColorPicker.value = ghostHex;
                    ghostColorPicker.nextElementSibling.textContent = ghostHex.toUpperCase();
                }
            };

            return r;
        };

        nodeType.prototype.onExecuted = function(message) {
            if (message?.image) {
                const img = new Image();
                const url = imageDataToUrl(message.image);
                
                img.onload = () => {
                    this.imgs = [img];
                    this.setDirtyCanvas(true);
                };
                
                img.onerror = () => {
                    console.error("Image load error");
                };
                
                img.src = url;
            }
        };

        nodeType.prototype.onDrawForeground = function(ctx) {
            if (this.flags.collapsed) return;


            this.drawHeader(ctx);
            this.drawPreviewArea(ctx);
            this.drawEditButton(ctx);

            if (this.dialog.isOpen) {
                this.drawDialog(ctx);
            }
        };

        nodeType.prototype.requestPreviewUpdate = function() {
            if (this.graph && app.graph?.canvas) {
                this.setDirtyCanvas(true);
            }
        };

        nodeType.prototype.drawSlider = function(ctx, x, y, slider) {
            const { SLIDER_WIDTH, CONTROL_HEIGHT } = this.UI_CONSTANTS;


            ctx.fillStyle = "#bbb";
            ctx.font = "12px 'Segoe UI', sans-serif";
            ctx.textAlign = "left";
            ctx.fillText(slider.label, x, y - 5);


            ctx.fillStyle = "#2a2a2a";
            ctx.beginPath();
            ctx.roundRect(x, y, SLIDER_WIDTH, CONTROL_HEIGHT, 6);
            ctx.fill();


            const fillWidth = SLIDER_WIDTH * slider.value;
            ctx.fillStyle = "#4a9eff";
            ctx.beginPath();
            ctx.roundRect(x, y, fillWidth, CONTROL_HEIGHT, 6);
            ctx.fill();


            const handleX = x + fillWidth - 8;
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(handleX, y + CONTROL_HEIGHT / 2, 8, 0, Math.PI * 2);
            ctx.fill();
        };

        nodeType.prototype.drawBlendModeSelector = function(ctx, x, y) {
            ctx.fillStyle = "rgba(0,0,0,0.3)";
            ctx.beginPath();
            ctx.roundRect(x, y, 320, 30, 4);
            ctx.fill();

            const modes = Object.entries(BLEND_MODES);
            const buttonWidth = 70;
            const buttonSpacing = 10;
            const startX = x + 15;

            modes.forEach(([key, value], i) => {
                const btnX = startX + (buttonWidth + buttonSpacing) * i;
                const isSelected = this.properties.blend_mode === value;
                
                ctx.fillStyle = isSelected ? "#4a9eff" : "rgba(255,255,255,0.1)";
                ctx.beginPath();
                ctx.roundRect(btnX, y + 5, buttonWidth, 20, 4);
                ctx.fill();

                ctx.fillStyle = isSelected ? "#fff" : "#bbb";
            ctx.textAlign = "center";
                ctx.fillText(key, btnX + buttonWidth/2, y + 19);
            });
        };


        nodeType.prototype.activeCategory = "Basic";


        nodeType.prototype.onMouseDown = function(e, local_pos) {

            if (this.editButtonBounds && isInBounds(local_pos[0], local_pos[1], this.editButtonBounds)) {
                this.openFlareDialog();
                return true;
            }


            if (this.dialog.isOpen) {
                const { position } = this.dialog;
                const startY = position.y + this.UI_CONSTANTS.DIALOG_HEADER_HEIGHT + 20;
                

                const categories = ["Basic", "Effects", "Colors", "Advanced"];
                const categoryX = position.x + 20;
                const categoryWidth = 160;
                const categoryHeight = 40;

                categories.forEach((category, index) => {
                    const categoryY = startY + (index * 50);
                    if (isInBounds(local_pos[0], local_pos[1], {
                        x: categoryX,
                        y: categoryY,
                        width: categoryWidth,
                        height: categoryHeight
                    })) {
                        this.activeCategory = category;
                        this.setDirtyCanvas(true);
                        return true;
                    }
                });



            }


            if (this.refreshButtonBounds) {
                const distance = Math.sqrt(
                    Math.pow(local_pos[0] - this.refreshButtonBounds.centerX, 2) + 
                    Math.pow(local_pos[1] - this.refreshButtonBounds.centerY, 2)
                );

                if (distance <= this.refreshButtonBounds.radius) {
                    this.setDirtyCanvas(true);
                    
                    const inputLink = this.getInputLink(0);
                    if (inputLink) {
                        const inputNode = this.graph.getNodeById(inputLink.origin_id);
                        if (inputNode) {
                            if (inputNode.imgs && inputNode.imgs.length > 0) {
                                this.imgs = [inputNode.imgs[0]];
                                this.applyFlareTypeSettings("50MM_PRIME");
                            } else if (inputNode.imageData) {
                                const img = new Image();
                                const url = imageDataToUrl(inputNode.imageData);
                                
                                img.onload = () => {
                                    this.imgs = [img];
                                    this.applyFlareTypeSettings(this.current_flare_type || "50MM_PRIME");
                                    this.setDirtyCanvas(true);
                                };
                                
                                img.onerror = () => {
                                    console.error("Preview image load error");
                                };
                                
                                img.src = url;
                            }
                        }
                    }
                    return true;
                }
            }


            if (this.dialog.isOpen) {
                const { x, y } = this.dialog.position;
                const { width, height } = this.dialog.size;
                const closeButtonX = x + width - 30;
                const closeButtonY = y + 30;
                const distance = Math.sqrt(
                    Math.pow(local_pos[0] - closeButtonX, 2) +
                    Math.pow(local_pos[1] - closeButtonY, 2)
                );
                if (distance <= 10) {
                    this.dialog.isOpen = false;
                    this.setDirtyCanvas(true);
                    return true;
                }



                const intensitySlider = { x: x + 20, y: y + 60, width: 360, height: 30 };
                if (isInBounds(local_pos[0], local_pos[1], intensitySlider)) {
                    this.activeSlider = "intensity";
                    return true;
                }


            }

            return false;
        };


        nodeType.prototype.onMouseMove = function(e, local_pos) {
            if (this.dialog.isOpen && this.activeSlider) {
                const dialog = this.dialog;
                const slider = this.getSliderByKey(this.activeSlider);
                if (slider) {
                    const progress = (local_pos[0] - (dialog.position.x + 20)) / 360;
                    const value = Math.max(slider.min, Math.min(slider.max, slider.min + (slider.max - slider.min) * progress));
                    this.properties[slider.key] = value;
                    this.setDirtyCanvas(true);
                    return true;
                }
            }

            return false;
        };


        nodeType.prototype.renderLensSmudges = function(ctx, radius, intensity, characteristics) {
            if (!characteristics.dustAmount) return;

            const smudgeConfig = ATMOSPHERIC_EFFECTS.DUST_PARTICLES;
            const angles = smudgeConfig.ANGLES;
            const distances = smudgeConfig.DISTANCES;
            
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            
            angles.forEach((angle, i) => {
                distances.forEach((distance, j) => {
                    const smudgeRadius = radius * distance;
                    const opacity = smudgeConfig.OPACITIES[j] * intensity * characteristics.dustAmount;
                    
                    ctx.translate(
                        Math.cos(angle * Math.PI / 180) * smudgeRadius,
                        Math.sin(angle * Math.PI / 180) * smudgeRadius
                    );
                    
                    this.drawSmudge(ctx, smudgeRadius, opacity);
                    
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                });
            });
            
            ctx.restore();
        };


        nodeType.prototype.drawSmudge = function(ctx, radius, opacity) {
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
            gradient.addColorStop(0, `rgba(255,255,255,${opacity})`);
            gradient.addColorStop(0.5, `rgba(255,255,255,${opacity * 0.5})`);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill();
        };


        nodeType.prototype.renderAdvancedFlare = function(ctx, centerX, centerY, flareSize, intensity, rotation) {
            const { offCtx, scale } = this.prepareOffscreenCanvas(ctx);
            
            const rotationRad = rotation || 0;
            const sizeX = flareSize * (this.properties.size_x || 1.0);
            const sizeY = flareSize * (this.properties.size_y || 1.0);

            const scaledCoords = this.scaleCoordinates(centerX, centerY, {
                sizeX: sizeX,
                sizeY: sizeY
            }, scale);


            this.renderMainEffects(offCtx, scaledCoords, intensity, rotationRad);
            this.renderStarburstEffects(offCtx, scaledCoords, intensity, rotationRad);
            this.compositeToMainCanvas(ctx, offCtx);
        };


        nodeType.prototype.prepareOffscreenCanvas = function(ctx) {
            const scale = 4;
            const offscreen = new OffscreenCanvas(
                ctx.canvas.width * scale, 
                ctx.canvas.height * scale
            );
            const offCtx = offscreen.getContext('2d', {
                alpha: true,
                willReadFrequently: false,
                desynchronized: true
            });
            
            return { offCtx, offscreen, scale };
        };

        nodeType.prototype.scaleCoordinates = function(x, y, size, scale) {
            return {
                x: x * scale,
                y: y * scale,
                sizeX: size.sizeX * scale,
                sizeY: size.sizeY * scale
            };
        };

        nodeType.prototype.renderMainEffects = function(ctx, coords, intensity, rotation) {
            const { x, y, sizeX, sizeY } = coords;
            const config = this.getFlareConfig(this.properties.flare_type);
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.scale(this.properties.size_x || 1.0, this.properties.size_y || 1.0);
            ctx.globalCompositeOperation = 'lighter';

            const glowRadius = Math.max(sizeX, sizeY) * this.properties.glow_radius;

            this.renderCinematicOpticalEffects(
                ctx, 
                config, 
                glowRadius, 
                intensity * this.properties.inner_glow,
                this.getLensCharacteristics()
            );

            this.renderAnamorphicGhosts(
                ctx, 
                config, 
                glowRadius, 
                intensity, 
                this.properties.chromatic,
                this.getLensCharacteristics()
            );
            
            ctx.restore();
        };

        nodeType.prototype.renderStarburstEffects = function(ctx, coords, intensity, rotation) {
            const { x, y, sizeX, sizeY } = coords;
            const config = this.getFlareConfig(this.properties.flare_type);
            const glowRadius = Math.max(sizeX, sizeY) * this.properties.glow_radius;

            const starburstX = this.properties.starburst_position_x * ctx.canvas.width;
            const starburstY = this.properties.starburst_position_y * ctx.canvas.height;
            
            ctx.save();
            ctx.translate(starburstX, starburstY);
            ctx.rotate(rotation);
            ctx.scale(this.properties.size_x || 1.0, this.properties.size_y || 1.0);
            ctx.globalCompositeOperation = 'lighter';

            this.renderCinematicLightBehavior(
                ctx, 
                config, 
                glowRadius, 
                intensity * this.properties.outer_glow
            );
            
            this.renderCinematicRays(
                ctx,
                this.properties.rays_count,
                glowRadius * this.properties.ray_length,
                intensity,
                rotation,
                config
            );

            this.drawStarburst(ctx, {
                x: 0,
                y: 0,
                size: glowRadius * this.properties.starburst_intensity,
                opacity: intensity,
                angle: rotation
            });
            
            ctx.restore();
        };

        nodeType.prototype.compositeToMainCanvas = function(ctx, offCtx) {
            ctx.save();
            ctx.globalCompositeOperation = this.properties.blend_mode;
            ctx.drawImage(
                offCtx.canvas, 
                0, 0, offCtx.canvas.width, offCtx.canvas.height,
                0, 0, ctx.canvas.width, ctx.canvas.height
            );
            ctx.restore();
        };

        nodeType.prototype.getLensCharacteristics = function() {
            return {
                sphericalAberration: 0.2,
                astigmatism: 0.1,
                coatingQuality: this.properties.lens_coating,
                internalReflections: 0.3
            };
        };


        nodeType.prototype.renderAnamorphicGhosts = function(ctx, config, radius, intensity, isChromatic) {
            const settings = this.getGhostSettings();
            const initialPosition = this.calculateInitialGhostPosition(radius);
            const ghostCount = this.getGhostCount(config);
            

            for (let i = 0; i < ghostCount; i++) {
                const ghostParams = this.calculateGhostParameters(i, radius, settings, config);
                
                if (isChromatic) {
                    this.renderChromaticGhost(ctx, ghostParams, initialPosition, settings.chromaticSeparation);
                } else {
                    this.renderSingleGhost(ctx, ghostParams, initialPosition);
                }
                

                if (settings.dustAmount > 0) {
                    this.renderGhostDust(ctx, ghostParams, initialPosition, settings.dustAmount);
                }
            }
        };


        nodeType.prototype.getGhostSettings = function() {
            return {
                spacing: this.properties.ghost_spacing || 1.0,
                intensity: this.properties.ghost_intensity || 1.0,
                dustAmount: this.properties.dust_amount || 0.2,
                chromaticSeparation: this.properties.chromatic_separation || 1.0
            };
        };


        nodeType.prototype.calculateInitialGhostPosition = function(radius) {
            const offsetX = ((this.properties.position_x || 0.5) - 0.5) * radius * 2;
            const offsetY = ((this.properties.position_y || 0.5) - 0.5) * radius * 2;
            const angle = Math.atan2(offsetY, offsetX) || 0;
            
            return { offsetX, offsetY, angle };
        };


        nodeType.prototype.getGhostCount = function(config) {
            return Math.min(config?.ghostCount || 6, 10);
        };


        nodeType.prototype.calculateGhostParameters = function(index, radius, settings, config) {
            const baseDistance = radius * (index + 1) * settings.spacing;
            const size = radius * (config?.ghostSizes?.[index] || 1.0);
            const opacity = (config?.ghostOpacities?.[index] || 0.5) * settings.intensity;
            
            return { baseDistance, size, opacity };
        };


        nodeType.prototype.renderChromaticGhost = function(ctx, params, initialPosition, chromaticSeparation) {
            const channels = [
                { color: 'red', offset: 1 + (0.02 * chromaticSeparation), opacity: 0.8 },
                { color: 'green', offset: 1.0, opacity: 1.0 },
                { color: 'blue', offset: 1 - (0.02 * chromaticSeparation), opacity: 0.9 }
            ];

            channels.forEach(channel => {
                const distance = params.baseDistance * channel.offset;
                const opacity = params.opacity * channel.opacity;
                const ghostPos = this.calculateGhostPosition(distance, initialPosition, params);
                
                if (this.isValidPosition(ghostPos)) {
                    this.drawGhost(ctx, {
                        ...ghostPos,
                        size: params.size,
                        opacity,
                        color: channel.color,
                        angle: initialPosition.angle
                    });
                }
            });
        };


        nodeType.prototype.renderSingleGhost = function(ctx, params, initialPosition) {
            const ghostPos = this.calculateGhostPosition(params.baseDistance, initialPosition, params);
            
            if (this.isValidPosition(ghostPos)) {
                this.drawGhost(ctx, {
                    ...ghostPos,
                    size: params.size,
                    opacity: params.opacity,
                    color: 'white',
                    angle: initialPosition.angle
                });
            }
        };


        nodeType.prototype.calculateGhostPosition = function(distance, initialPosition, params) {
            if (!initialPosition) return { x: 0, y: 0 };
            
            const { offsetX, offsetY, angle } = initialPosition;
            const { x, y } = VECTOR_UTILS.polarToCartesian(distance, angle);
            
            const scale = params.baseDistance ? (params.baseDistance / distance) : 1;
            
            return {
                x: x + (offsetX * scale),
                y: y + (offsetY * scale)
            };
        };


        nodeType.prototype.isValidPosition = function(pos) {
            return isFinite(pos.x) && isFinite(pos.y);
        };


        nodeType.prototype.renderGhostDust = function(ctx, params, initialPosition, dustAmount) {
            const ghostPos = this.calculateGhostPosition(params.baseDistance, initialPosition, params);
            
            if (this.isValidPosition(ghostPos)) {
                this.drawDust(ctx, {
                    centerX: ghostPos.x,
                    centerY: ghostPos.y,
                    radius: params.size,
                    opacity: params.opacity * dustAmount,
                    color: 'white',
                    density: Math.floor(10 * dustAmount)
                });
            }
        };


        nodeType.prototype.drawGhost = function(ctx, params) {
            const { x, y, size, opacity, angle } = params;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);

            const ghostGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
            

            const ghostColor = this.properties.ghost_color || [255, 255, 255];
            ghostGlow.addColorStop(0, `rgba(${ghostColor[0]},${ghostColor[1]},${ghostColor[2]},${opacity})`);
            ghostGlow.addColorStop(0.5, `rgba(${ghostColor[0]},${ghostColor[1]},${ghostColor[2]},${opacity * 0.7})`);
            ghostGlow.addColorStop(1, 'rgba(0,0,0,0)');


            ctx.scale(1.2, 1.0);
            ctx.fillStyle = ghostGlow;
            ctx.beginPath();
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        };


        nodeType.prototype.drawDust = function(ctx, params) {
            const { centerX, centerY, radius, opacity, color, density } = params;
            

            if (!isFinite(centerX) || !isFinite(centerY) || !isFinite(radius)) {
                console.warn('Invalid coordinates for dust effect:', { centerX, centerY, radius });
                return;
            }

            const safeRadius = Math.min(Math.abs(radius), 1000);
            const safeDensity = Math.min(Math.floor(density), 50);
            
            for (let i = 0; i < safeDensity; i++) {
                try {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * safeRadius;
                    const size = Math.random() * safeRadius * 0.2;
                    

                    const x = Math.max(-10000, Math.min(10000, centerX + Math.cos(angle) * distance));
                    const y = Math.max(-10000, Math.min(10000, centerY + Math.sin(angle) * distance));
                    

                    const safeSize = Math.max(0.1, Math.min(100, size));

                    if (!isFinite(x) || !isFinite(y) || !isFinite(safeSize)) {
                        continue;
                    }

                    const dustGlow = ctx.createRadialGradient(x, y, 0, x, y, safeSize);
                    
                    if (color === 'white') {
                        const safeOpacity = Math.min(1, Math.max(0, opacity * (0.3 + Math.random() * 0.7)));
                        dustGlow.addColorStop(0, `rgba(255,255,255,${safeOpacity})`);
                    } else {
                        const colorValues = {
                            red: [255, 50, 50],
                            green: [50, 255, 50],
                            blue: [50, 50, 255]
                        };
                        const [r, g, b] = colorValues[color] || [255, 255, 255];
                        const safeOpacity = Math.min(1, Math.max(0, opacity * (0.3 + Math.random() * 0.7)));
                        dustGlow.addColorStop(0, `rgba(${r},${g},${b},${safeOpacity})`);
                    }
                    
                    dustGlow.addColorStop(1, 'rgba(0,0,0,0)');

                    ctx.fillStyle = dustGlow;
                    ctx.beginPath();
                    ctx.arc(x, y, safeSize, 0, Math.PI * 2);
                    ctx.fill();
                } catch (error) {
                    console.warn('Error drawing dust particle:', error);
                    continue;
                }
            }
        };


        nodeType.prototype.renderCinematicOpticalEffects = function(ctx, config, radius, intensity, characteristics) {

            const sphericalAberration = characteristics.sphericalAberration;
            const astigmatism = characteristics.astigmatism;
            const coatingQuality = characteristics.coatingQuality;
            

            this.renderMainLayers(ctx, config, radius, intensity, {
                sphericalAberration,
                astigmatism,
                coatingQuality
            });


            if (this.properties.diffraction_intensity > 0) {
                this.renderDiffractionRings(ctx, radius, intensity);
            }


            if (this.properties.atmospheric_scatter > 0) {
                this.renderAtmosphericScatter(ctx, radius, intensity);
            }


            const coatingColor = this.properties.secondary_color;
            

            const mainCoating = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.5);
            mainCoating.addColorStop(0, `rgba(${coatingColor[0]},${coatingColor[1]},${coatingColor[2]},${intensity * 0.4})`);
            mainCoating.addColorStop(0.6, `rgba(${coatingColor[0]},${coatingColor[1]},${coatingColor[2]},${intensity * 0.2})`);
            mainCoating.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = mainCoating;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();


            const coreGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.5);
            coreGlow.addColorStop(0, `rgba(255,255,255,${intensity * 0.3})`);
            coreGlow.addColorStop(0.3, `rgba(${coatingColor[0]},${coatingColor[1]},${coatingColor[2]},${intensity * 0.2})`);
            coreGlow.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.save();
            ctx.globalCompositeOperation = 'overlay';
            ctx.fillStyle = coreGlow;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();


            for(let i = 0; i < 3; i++) {
                const reflectionGradient = ctx.createRadialGradient(
                    radius * 0.2 * i,
                    0, 
                    0, 
                    radius * 0.2 * i, 
                    0, 
                    radius * 0.4
                );
                reflectionGradient.addColorStop(0, `rgba(${coatingColor[0]},${coatingColor[1]},${coatingColor[2]},${intensity * 0.15})`);
                reflectionGradient.addColorStop(1, 'rgba(0,0,0,0)');
                
                ctx.save();
                ctx.rotate((i * 120) * Math.PI/180);
                ctx.globalCompositeOperation = 'screen';
                ctx.fillStyle = reflectionGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        };


        nodeType.prototype.renderMainLayers = function(ctx, config, radius, intensity, characteristics) {
            const layers = this.createMainLayers(config, radius, intensity, characteristics);
            

            layers.forEach(layer => {
                ctx.save();
                ctx.globalCompositeOperation = layer.blend;
                

                const distortionAngle = characteristics.astigmatism * Math.PI;
                ctx.rotate(distortionAngle);
                
                const distortionX = 1 + characteristics.sphericalAberration;
                const distortionY = 1 - characteristics.sphericalAberration;
                ctx.scale(distortionX, distortionY);
                

                ctx.fillStyle = layer.render(ctx);
                ctx.beginPath();
                ctx.arc(0, 0, radius * 1.2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            });
        };


        nodeType.prototype.createMainLayers = function(config, radius, intensity, characteristics) {
            const MC = RENDER_CONSTANTS.MAIN_GLOW;
            const CC = RENDER_CONSTANTS.COATING;
            
            return [
                {
                    blend: 'screen',
                    render: (ctx) => this.createMainGlow(ctx, {
                        radius,
                        intensity,
                        config,
                        tempAdjust: (this.properties.color_temperature - MC.TEMPERATURE_ADJUSTMENT.BASE) / MC.TEMPERATURE_ADJUSTMENT.SCALE,
                        stops: MC.OPACITY_STOPS
                    })
                },
                {
                    blend: 'screen',
                    render: (ctx) => this.createInnerRing(ctx, radius, intensity)
                },
                {
                    blend: 'overlay',
                    render: (ctx) => this.createCoatingReflection(ctx, {
                        radius,
                        intensity,
                        config,
                        coatingQuality: characteristics.coatingQuality,
                        colorBlend: CC.COLOR_BLEND
                    })
                }
            ];
        };


        nodeType.prototype.renderCinematicRays = function(ctx, rayCount, radius, intensity, rotation, config) {

            const raySettings = this.getRaySettings(rayCount, intensity);
            

            this.renderCenterStar(ctx, radius, raySettings, rotation, config);
            

            this.renderMainRays(ctx, radius, raySettings, rotation, config);
        };


        nodeType.prototype.getRaySettings = function(rayCount, intensity) {
            return {
                rayGroups: 3,
                raysPerGroup: Math.floor(rayCount / 3),
                baseIntensity: intensity,
                starburstIntensity: this.properties.starburst_intensity,
                rayThickness: this.properties.ray_thickness,
                rayLength: this.properties.ray_length
            };
        };


        nodeType.prototype.renderCenterStar = function(ctx, radius, settings, rotation, config) {
            const centerStarCount = 8;
            const starOpacity = settings.baseIntensity * settings.starburstIntensity * 0.8;
            
            for (let i = 0; i < centerStarCount; i++) {
                const angle = (i / centerStarCount) * Math.PI * 2 + rotation;
                
                ctx.save();
                ctx.rotate(angle);
                

                this.drawCenterStarRay(ctx, radius, starOpacity, config);
                

                this.drawSecondaryRays(ctx, radius, starOpacity, config);
                

                this.drawLightScatter(ctx, radius, starOpacity);
                
                ctx.restore();
            }
        };


        nodeType.prototype.drawCenterStarRay = function(ctx, radius, opacity, config) {
            const starGradient = this.createStarGradient(ctx, radius * 0.8, opacity, config);
            
            ctx.strokeStyle = starGradient;
            ctx.lineWidth = 4 * this.properties.ray_thickness;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(radius * 0.8, 0);
            ctx.stroke();
        };


        nodeType.prototype.drawSecondaryRays = function(ctx, radius, opacity, config) {
            const secondaryRayCount = 3;
            
            for (let j = 0; j < secondaryRayCount; j++) {
                const subAngle = (j - 1) * 0.03;
                ctx.save();
                ctx.rotate(subAngle);
                
                const secondaryGradient = this.createSecondaryRayGradient(ctx, radius * 0.9, opacity, config);
                
                ctx.strokeStyle = secondaryGradient;
                ctx.lineWidth = (1 + j * 0.3) * this.properties.ray_thickness;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(radius * (0.9 - j * 0.1), 0);
                ctx.stroke();
                
                ctx.restore();
            }
        };


        nodeType.prototype.drawLightScatter = function(ctx, radius, opacity) {
            const scatterGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.15);
            scatterGradient.addColorStop(0, `rgba(255,255,255,${opacity * 0.2})`);
            scatterGradient.addColorStop(0.5, `rgba(255,255,255,${opacity * 0.1})`);
            scatterGradient.addColorStop(1, 'rgba(255,255,255,0)');

            ctx.fillStyle = scatterGradient;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.15, 0, Math.PI * 2);
            ctx.fill();
        };


        nodeType.prototype.renderMainRays = function(ctx, radius, settings, rotation, config) {
            for (let group = 0; group < settings.rayGroups; group++) {
                const groupRotation = rotation + (group * Math.PI / settings.rayGroups);
                const groupIntensity = settings.starburstIntensity * (1 - group * 0.15);
                
                this.renderRayGroup(ctx, radius, settings, groupRotation, groupIntensity, config);
            }
        };


        nodeType.prototype.renderRayGroup = function(ctx, radius, settings, rotation, intensity, config) {
            for (let i = 0; i < settings.raysPerGroup; i++) {
                const angle = (i / settings.raysPerGroup) * Math.PI * 2 + rotation;
                const rayOpacity = settings.baseIntensity * intensity * 0.5;
                const rayLength = radius * settings.rayLength * (0.8 + Math.random() * 0.4);
                
                ctx.save();
                ctx.rotate(angle);
                

                this.drawMainRay(ctx, rayLength, rayOpacity, config);
                this.drawDetailRays(ctx, rayLength, rayOpacity, config);
                this.drawGlowLayer(ctx, rayLength, rayOpacity, config);
                
                ctx.restore();
            }
        };


        nodeType.prototype.createStarGradient = function(ctx, length, opacity, config) {
            const gradient = ctx.createLinearGradient(0, 0, length, 0);
            gradient.addColorStop(0, `rgba(${config.mainColor.r},${config.mainColor.g},${config.mainColor.b},${opacity})`);
            gradient.addColorStop(0.2, `rgba(${config.secondaryColor.r},${config.secondaryColor.g},${config.secondaryColor.b},${opacity * 0.8})`);
            gradient.addColorStop(0.5, `rgba(${config.mainColor.r},${config.mainColor.g},${config.mainColor.b},${opacity * 0.6})`);
            gradient.addColorStop(0.8, `rgba(${config.secondaryColor.r},${config.secondaryColor.g},${config.secondaryColor.b},${opacity * 0.3})`);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            return gradient;
        };

        nodeType.prototype.createSecondaryRayGradient = function(ctx, length, opacity, config) {
            const gradient = ctx.createLinearGradient(0, 0, length, 0);
            gradient.addColorStop(0, `rgba(${config.mainColor.r},${config.mainColor.g},${config.mainColor.b},${opacity * 0.6})`);
            gradient.addColorStop(0.3, `rgba(${config.secondaryColor.r},${config.secondaryColor.g},${config.secondaryColor.b},${opacity * 0.4})`);
            gradient.addColorStop(0.7, `rgba(${config.mainColor.r},${config.mainColor.g},${config.mainColor.b},${opacity * 0.2})`);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            return gradient;
        };


        nodeType.prototype.getFlareConfig = function(flareType) {
            return DEFAULT_FLARE_CONFIGS[flareType] || DEFAULT_FLARE_CONFIGS["50mm Prime"];
        };


        nodeType.prototype.drawChromaticToggle = function(ctx, x, y) {
            const width = 150;
            const height = 24;
            

            ctx.fillStyle = "rgba(0,0,0,0.3)";
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, 4);
            ctx.fill();


            const switchWidth = 40;
            const switchHeight = 16;
            const switchX = x + width - switchWidth - 5;
            const switchY = y + (height - switchHeight) / 2;


            ctx.fillStyle = this.properties.chromatic ? "#4a9eff33" : "#ffffff33";
            ctx.beginPath();
            ctx.roundRect(switchX, switchY, switchWidth, switchHeight, switchHeight/2);
            ctx.fill();


            const handleSize = 20;
            const handleX = switchX + (this.properties.chromatic ? switchWidth - handleSize : 0);
            const handleY = y + (height - handleSize) / 2;

            ctx.fillStyle = this.properties.chromatic ? "#4a9eff" : "#888";
            ctx.beginPath();
            ctx.arc(handleX + handleSize/2, handleY + handleSize/2, handleSize/2, 0, Math.PI * 2);
            ctx.fill();


            ctx.fillStyle = "#bbb";
            ctx.textAlign = "left";
            ctx.fillText("Chromatic Aberration", x + 10, y + 16);
        };


        nodeType.prototype.drawHeader = function(ctx) {

        };


        nodeType.prototype.drawPreviewArea = function(ctx) {
            const { PADDING, HEADER_HEIGHT, PREVIEW_HEIGHT } = this.UI_CONSTANTS;
            const previewWidth = this.size[0] - (PADDING * 2);
                const previewArea = {
                    x: PADDING,
                    y: HEADER_HEIGHT + PADDING,
                width: previewWidth,
                    height: PREVIEW_HEIGHT
                };
            

            ctx.fillStyle = "#1a1a1a";
            ctx.beginPath();
            ctx.roundRect(previewArea.x, previewArea.y, previewArea.width, previewArea.height, 8);
            ctx.fill();


            ctx.strokeStyle = "rgba(255,255,255,0.1)";
            ctx.lineWidth = 1;
            ctx.stroke();


            if (this.imgs[0]?.complete) {
                const img = this.imgs[0];
                

                const currentImageKey = img.src + JSON.stringify(this.properties);
                if (this._lastImageKey === currentImageKey && this._cachedPreview) {
                    ctx.drawImage(this._cachedPreview, 
                        previewArea.x, 
                        previewArea.y, 
                        previewArea.width, 
                        previewArea.height);
                    return;
                }


                if (!this.offscreenCanvas) {
                    this.offscreenCanvas = document.createElement('canvas');
                }
                this.offscreenCanvas.width = img.width;
                this.offscreenCanvas.height = img.height;
                const offCtx = this.offscreenCanvas.getContext('2d', {
                    alpha: true,
                    willReadFrequently: true,
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: 'high'
                });
                

                offCtx.drawImage(img, 0, 0);


                const scale = Math.min(
                    (previewArea.width - PADDING * 2) / img.width,
                    (previewArea.height - PADDING * 2) / img.height
                );

                const displayWidth = img.width * scale;
                const displayHeight = img.height * scale;


                const x = previewArea.x + (previewArea.width - displayWidth) / 2;
                const y = previewArea.y + (previewArea.height - displayHeight) / 2;


                const centerX = img.width * this.properties.position_x;
                const centerY = img.height * this.properties.position_y;
                const flareSize = this.properties.size * Math.min(img.width, img.height) * 0.5;
                const intensity = this.properties.intensity;
                const rotation = this.properties.rotation * Math.PI / 180;


                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = img.width;
                tempCanvas.height = img.height;
                const tempCtx = tempCanvas.getContext('2d', {
                    alpha: true,
                    willReadFrequently: true
                });


                tempCtx.save();
                this.renderAdvancedFlare(tempCtx, centerX, centerY, flareSize, intensity, rotation);
                tempCtx.restore();


                offCtx.globalCompositeOperation = this.properties.blend_mode;
                offCtx.drawImage(tempCanvas, 0, 0);
                offCtx.globalCompositeOperation = 'source-over';


                if (!this._cachedPreview) {
                    this._cachedPreview = document.createElement('canvas');
                }
                this._cachedPreview.width = previewArea.width;
                this._cachedPreview.height = previewArea.height;
                const cacheCtx = this._cachedPreview.getContext('2d', {
                    alpha: true,
                    willReadFrequently: true,
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: 'high'
                });


                cacheCtx.fillStyle = "#1a1a1a";
                cacheCtx.fillRect(0, 0, previewArea.width, previewArea.height);
                cacheCtx.drawImage(this.offscreenCanvas, 
                    0, 0, img.width, img.height,
                    x - previewArea.x, y - previewArea.y, displayWidth, displayHeight
                );


                ctx.drawImage(this._cachedPreview, 
                    0, 0, previewArea.width, previewArea.height,
                    previewArea.x, previewArea.y, previewArea.width, previewArea.height
                );

                this._lastImageKey = currentImageKey;
                

                const base64Image = this.offscreenCanvas.toDataURL('image/png');
                if (this.widgets) {
                    const canvasWidget = this.widgets.find(w => w.name === 'canvas_image');
                    if (canvasWidget) {
                        canvasWidget.value = base64Image;
                    }
                }


                tempCanvas.remove();
            }
        };


        nodeType.prototype.drawEditButton = function(ctx) {
            const { PADDING, HEADER_HEIGHT, PREVIEW_HEIGHT } = this.UI_CONSTANTS;
            const buttonWidth = 120;
            const buttonHeight = 34;
            const x = this.size[0] - buttonWidth - PADDING;
            const y = HEADER_HEIGHT + PREVIEW_HEIGHT + PADDING * 1.5;


            const refreshButtonSize = 28;
            const refreshButtonX = x - refreshButtonSize - 10;
            const refreshButtonY = y + (buttonHeight - refreshButtonSize) / 2;
            

            ctx.fillStyle = "rgba(255,255,255,0.05)";
            ctx.beginPath();
            ctx.roundRect(refreshButtonX, refreshButtonY, refreshButtonSize, refreshButtonSize, 6);
            ctx.fill();
            

            ctx.save();
            ctx.strokeStyle = "#ddd";
            ctx.lineWidth = 2;
            

            const centerX = refreshButtonX + refreshButtonSize/2;
            const centerY = refreshButtonY + refreshButtonSize/2;
            

            ctx.beginPath();
            ctx.arc(centerX, centerY, 8, 0, 1.5 * Math.PI);
            ctx.stroke();
            

            ctx.beginPath();
            ctx.moveTo(centerX, centerY - 8);
            ctx.lineTo(centerX - 4, centerY - 8);
            ctx.lineTo(centerX, centerY - 12);
            ctx.closePath();
            ctx.fillStyle = "#ddd";
            ctx.fill();
            
            ctx.restore();
            

            this.refreshButtonBounds = {
                centerX: centerX,
                centerY: centerY,
                radius: refreshButtonSize/2
            };


            ctx.fillStyle = "rgba(0,0,0,0.2)";
            ctx.beginPath();
            ctx.roundRect(x + 2, y + 2, buttonWidth, buttonHeight, 6);
            ctx.fill();


            const gradient = ctx.createLinearGradient(x, y, x, y + buttonHeight);
            gradient.addColorStop(0, "#4a9eff");
            gradient.addColorStop(1, "#45e3ff");
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, y, buttonWidth, buttonHeight, 6);
            ctx.fill();


            ctx.fillStyle = "#fff";
            ctx.font = "13px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Edit Flare", x + buttonWidth/2, y + buttonHeight/2 + 4);


            if (this.isPointerOver) {
                ctx.fillStyle = "rgba(255,255,255,0.1)";
                ctx.fill();
            }


            this.editButtonBounds = {
                x, y, width: buttonWidth, height: buttonHeight
            };
        };


        nodeType.prototype.drawDialog = function(ctx) {
            if (!this.dialog.isOpen) return;

            const { position, size } = this.dialog;
            const { DIALOG_HEADER_HEIGHT } = this.UI_CONSTANTS;


            ctx.save();
            ctx.fillStyle = "rgba(28, 28, 32, 0.95)";
            ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.roundRect(position.x, position.y, size.width, size.height, 12);
            ctx.fill();
            ctx.restore();


            const headerGradient = ctx.createLinearGradient(position.x, position.y, position.x + size.width, position.y);
            headerGradient.addColorStop(0, "#2c2c3d");
            headerGradient.addColorStop(1, "#1f1f2c");
            
            ctx.fillStyle = headerGradient;
            ctx.beginPath();
            ctx.roundRect(position.x, position.y, size.width, DIALOG_HEADER_HEIGHT, [12, 12, 0, 0]);
            ctx.fill();


            ctx.fillStyle = "#fff";
            ctx.font = "600 14px 'Inter', 'Segoe UI', sans-serif";
            ctx.textAlign = "left";
            ctx.fillText("Flare Settings", position.x + 15, position.y + DIALOG_HEADER_HEIGHT/2 + 5);


            this.drawCategories(ctx);
            this.drawContent(ctx);


            const closeSize = 20;
            const closeX = position.x + size.width - closeSize - 10;
            const closeY = position.y + (DIALOG_HEADER_HEIGHT - closeSize)/2;
            
            ctx.fillStyle = "rgba(255,255,255,0.1)";
            ctx.beginPath();
            ctx.arc(closeX + closeSize/2, closeY + closeSize/2, closeSize/2, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(closeX + 6, closeY + 6);
            ctx.lineTo(closeX + closeSize - 6, closeY + closeSize - 6);
            ctx.moveTo(closeX + closeSize - 6, closeY + 6);
            ctx.lineTo(closeX + 6, closeY + closeSize - 6);
            ctx.stroke();


            this.closeButtonBounds = {
                x: closeX,
                y: closeY,
                width: closeSize,
                height: closeSize
            };
        };


        nodeType.prototype.drawCategories = function(ctx) {
            const { position } = this.dialog;
            const startY = position.y + this.UI_CONSTANTS.DIALOG_HEADER_HEIGHT + 20;
            
            const categories = [
                { icon: "⚡", name: "Basic", isActive: true },
                { icon: "✨", name: "Effects" },
                { icon: "🎨", name: "Colors", isActive: true },
                { icon: "🔧", name: "Advanced" }
            ];

            categories.forEach((category, index) => {
                const x = position.x + 20;
                const y = startY + (index * 50);
                

                ctx.fillStyle = category.isActive ? "rgba(74, 158, 255, 0.1)" : "transparent";
                ctx.beginPath();
                ctx.roundRect(x, y, 160, 40, 8);
                ctx.fill();


                ctx.font = "18px 'Segoe UI Emoji'";
                ctx.fillStyle = category.isActive ? "#4a9eff" : "#888";
                ctx.fillText(category.icon, x + 15, y + 25);


                ctx.font = `${category.isActive ? '600' : '400'} 13px 'Inter', 'Segoe UI', sans-serif`;
                ctx.fillStyle = category.isActive ? "#fff" : "#888";
                ctx.fillText(category.name, x + 45, y + 25);

                if (category.isActive) {

                    ctx.fillStyle = "#4a9eff";
                    ctx.beginPath();
                    ctx.roundRect(x + 2, y + 8, 4, 24, 2);
                    ctx.fill();
                }
            });
        };


        nodeType.prototype.drawContent = function(ctx) {
            const { position } = this.dialog;
            const contentX = position.x + 200;
            const contentY = position.y + this.UI_CONSTANTS.DIALOG_HEADER_HEIGHT + 20;


            ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
            ctx.beginPath();
            ctx.roundRect(contentX, contentY, this.dialog.size.width - 220, this.dialog.size.height - contentY - 20, 8);
            ctx.fill();


            this.drawModernFlareTypeSelector(ctx, contentX + 15, contentY + 15);
            

            this.drawModernBlendModeSelector(ctx, contentX + 15, contentY + 80);
            

            this.drawModernSliders(ctx, contentX + 15, contentY + 150);
        };


        nodeType.prototype.drawModernFlareTypeSelector = function(ctx, x, y) {

            const types = Object.entries(FLARE_TYPES);
            const itemSize = 40;
            const gap = 10;
            const columns = 4;

            types.forEach(([key, value], i) => {
                const col = i % columns;
                const row = Math.floor(i / columns);
                const itemX = x + (col * (itemSize + gap));
                const itemY = y + (row * (itemSize + gap));
                
                const isSelected = this.properties.flare_type === key;
                

                ctx.fillStyle = isSelected ? "rgba(74, 158, 255, 0.2)" : "rgba(255, 255, 255, 0.05)";
                ctx.beginPath();
                ctx.roundRect(itemX, itemY, itemSize, itemSize, 8);
                ctx.fill();

                if (isSelected) {

                    ctx.strokeStyle = "#4a9eff";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }


                const config = DEFAULT_FLARE_CONFIGS[key];
                const previewColor = `rgb(${config.mainColor.r},${config.mainColor.g},${config.mainColor.b})`;
                ctx.fillStyle = previewColor;
                ctx.beginPath();
                ctx.arc(itemX + itemSize/2, itemY + itemSize/2 - 5, 8, 0, Math.PI * 2);
                ctx.fill();


                ctx.font = "11px 'Inter', 'Segoe UI', sans-serif";
                ctx.fillStyle = isSelected ? "#fff" : "#888";
                ctx.textAlign = "center";
                ctx.fillText(value, itemX + itemSize/2, itemY + itemSize - 8);
            });
        };


        nodeType.prototype.drawModernBlendModeSelector = function(ctx, x, y) {
            const modes = Object.entries(BLEND_MODES);
            const buttonWidth = 80;
            const buttonHeight = 30;
            const gap = 10;

            modes.forEach(([key, value], i) => {
                const btnX = x + (i * (buttonWidth + gap));
                const isSelected = this.properties.blend_mode === value;
                

                const gradient = ctx.createLinearGradient(btnX, y, btnX, y + buttonHeight);
                if (isSelected) {
                    gradient.addColorStop(0, "#4a9eff");
                    gradient.addColorStop(1, "#45e3ff");
                } else {
                    gradient.addColorStop(0, "rgba(255,255,255,0.05)");
                    gradient.addColorStop(1, "rgba(255,255,255,0.02)");
                }

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.roundRect(btnX, y, buttonWidth, buttonHeight, 6);
                ctx.fill();


                ctx.font = `${isSelected ? '600' : '400'} 12px 'Inter', 'Segoe UI', sans-serif`;
                ctx.fillStyle = isSelected ? "#fff" : "#888";
                ctx.textAlign = "center";
                ctx.fillText(key, btnX + buttonWidth/2, y + buttonHeight/2 + 4);
            });
        };


        nodeType.prototype.drawModernSlider = function(ctx, x, y, slider) {
            const width = 280;
            const height = 40;


            ctx.font = "12px 'Inter', 'Segoe UI', sans-serif";
            ctx.fillStyle = "#bbb";
            ctx.textAlign = "left";
            ctx.fillText(slider.label, x, y + 16);


            ctx.textAlign = "right";
            ctx.fillStyle = "#4a9eff";
            ctx.fillText(this.formatSliderValue(slider.key, slider.value), x + width, y + 16);


            ctx.fillStyle = "rgba(255,255,255,0.1)";
            ctx.beginPath();
            ctx.roundRect(x, y + 24, width, 4, 2);
            ctx.fill();


            const progress = (slider.value - slider.min) / (slider.max - slider.min);
            const progressWidth = width * progress;

            const progressGradient = ctx.createLinearGradient(x, 0, x + progressWidth, 0);
            progressGradient.addColorStop(0, "#4a9eff");
            progressGradient.addColorStop(1, "#45e3ff");

            ctx.fillStyle = progressGradient;
            ctx.beginPath();
            ctx.roundRect(x, y + 24, progressWidth, 4, 2);
            ctx.fill();


            ctx.shadowColor = "rgba(74, 158, 255, 0.2)";
            ctx.shadowBlur = 8;
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(x + progressWidth, y + 26, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        };


        nodeType.prototype.setDirtyCanvas = function(force_redraw) {
            if (!this.graph || !app.graph?.canvas) return;
            
            const currentTime = performance.now();
            

            const THROTTLE_INTERVAL = 32;
            
            if (!force_redraw && 
                this._lastRenderTime && 
                (currentTime - this._lastRenderTime) < THROTTLE_INTERVAL) {
                return;
            }
            

            if (this._pendingRender) {
                cancelAnimationFrame(this._pendingRender);
            }
            

            this._pendingRender = setTimeout(() => {
                this._lastRenderTime = performance.now();
                

                if (force_redraw) {
                    requestAnimationFrame(() => {
                        const canvas = app.graph.canvas;
                    if (canvas) {
                        canvas.setDirty(true, true);
                    }
                    this.graph.setDirtyCanvas(true, true);
                        this._pendingRender = null;
                    });
                } else {

                    const canvas = app.graph.canvas;
                    if (canvas) {
                        canvas.setDirty(true, false);
                    }
                    this.graph.setDirtyCanvas(true, false);
                this._pendingRender = null;
                }
            }, THROTTLE_INTERVAL);
        };


        nodeType.prototype.openFlareDialog = function() {

            if (this.dialog?.element) {
                document.body.removeChild(this.dialog.element);
            }
            
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 800px;
                height: 600px;
                background: #1a1a1a;
                border: 1px solid #333;
                border-radius: 8px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                z-index: 10000;
            `;


            const header = document.createElement('div');
            header.style.cssText = `
                padding: 16px 20px;
                background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
                backdrop-filter: blur(12px);
                border-bottom: 1px solid rgba(255,255,255,0.05);
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: move;
            `;


            header.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="
                        width: 32px;
                        height: 32px;
                        border-radius: 8px;
                        background: rgba(74, 158, 255, 0.1);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color: #4a9eff">
                        <circle cx="12" cy="12" r="4"></circle>
                            <path d="M12 3v2m0 14v2M3 12h2m14 0h2" opacity="0.5"></path>
                            <path d="M5.6 5.6l1.4 1.4m10 10l1.4 1.4M5.6 18.4l1.4-1.4m10-10l1.4-1.4" opacity="0.3"></path>
                    </svg>
                </div>
                    <div>
                        <div style="color: #fff; font-weight: 500; font-size: 14px;">Flare Settings</div>
                        <div class="flare-type-subtitle" style="
                            color: #666;
                            font-size: 12px;
                            margin-top: 2px;
                            transition: all 0.2s ease;
                        ">${FLARE_TYPES[this.properties.flare_type]}</div>
                    </div>
                </div>
                <div class="close-btn" style="
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                    background: rgba(255,255,255,0.05);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color: #888">
                        <path d="M18 6L6 18"></path>
                        <path d="M6 6l12 12"></path>
                    </svg>
                </div>
            `;


            const style = document.createElement('style');
            style.textContent = `
                .close-btn:hover {
                    background: rgba(255,0,0,0.1);
                }
                .close-btn:hover svg {
                    color: #ff4444 !important;
                }
            `;
            document.head.appendChild(style);


            let isDragging = false;
            let currentX;
            let currentY;
            let initialX;
            let initialY;

            header.onmousedown = this.debounce(function(e) {
                if (e.target.closest('.close-btn')) return;
                
                isDragging = true;
                const rect = dialog.getBoundingClientRect();
                

                dialog.style.transform = 'none';
                dialog.style.left = rect.left + 'px';
                dialog.style.top = rect.top + 'px';
                

                initialX = e.clientX - rect.left;
                initialY = e.clientY - rect.top;
                
                dialog.style.position = 'fixed';
                dialog.style.margin = '0';
            }, 16);

            document.addEventListener('mousemove', function(e) {
                if (isDragging) {
                    e.preventDefault();
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                    
                    dialog.style.left = currentX + 'px';
                    dialog.style.top = currentY + 'px';
                }
            });

            document.addEventListener('mouseup', function() {
                isDragging = false;
            });


            const closeBtn = header.querySelector('.close-btn');
            closeBtn.onclick = function() {
                document.body.removeChild(dialog);
            };

            dialog.appendChild(header);


            const content = document.createElement('div');
            content.style.cssText = UI_STYLES.DIALOG.CONTENT + '; max-height: calc(80vh - 120px); overflow-y: auto;';

            content.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 20px; padding: 20px;">
                    <!-- Üst Grid - Ana Kontroller -->
                    <div style="
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 16px;
                    ">
                    <!-- Renk Kontrolleri -->
                        <div class="control-section" style="
                            background: rgba(0,0,0,0.2);
                            padding: 16px;
                            border-radius: 12px;
                            border: 1px solid rgba(255,255,255,0.05);
                        ">
                            <div class="section-header" style="
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                margin-bottom: 16px;
                            ">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color: #4a9eff;">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M12 2v20M2 12h20"/>
                                </svg>
                                <span style="color: #eee; font-size: 13px; font-weight: 500;">Colors</span>
                        </div>
                        
                        <!-- 2x2 Color Grid -->
                        <div style="
                            display: grid;
                            grid-template-columns: repeat(2, 1fr);
                            gap: 12px;
                        ">
                            <!-- Main Color -->
                            <div class="color-input">
                                <label style="display: block; color: #888; font-size: 11px; margin-bottom: 4px;">Main Color</label>
                                <div style="
                                    display: flex;
                                    align-items: center;
                                    background: rgba(0,0,0,0.2);
                                    padding: 6px;
                                    border-radius: 6px;
                                    border: 1px solid rgba(255,255,255,0.05);
                                ">
                                    <input type="color" id="mainColorPicker" 
                                        value="#${this.mainColor.r.toString(16).padStart(2,'0')}${this.mainColor.g.toString(16).padStart(2,'0')}${this.mainColor.b.toString(16).padStart(2,'0')}"
                                        style="width: 24px; height: 24px; border: none; background: none; cursor: pointer;"
                                    />
                                    <div style="margin-left: 6px; font-family: monospace; color: #aaa; font-size: 10px;">
                                        #${this.mainColor.r.toString(16).padStart(2,'0')}${this.mainColor.g.toString(16).padStart(2,'0')}${this.mainColor.b.toString(16).padStart(2,'0')}
                                </div>
                                </div>
                            </div>

                            <!-- Secondary Color -->
                            <div class="color-input">
                                <label style="display: block; color: #888; font-size: 11px; margin-bottom: 4px;">Secondary Color</label>
                                <div style="
                                    display: flex;
                                    align-items: center;
                                    background: rgba(0,0,0,0.2);
                                    padding: 6px;
                                    border-radius: 6px;
                                    border: 1px solid rgba(255,255,255,0.05);
                                ">
                                    <input type="color" id="secondaryColorPicker" 
                                        value="#${this.secondaryColor.r.toString(16).padStart(2,'0')}${this.secondaryColor.g.toString(16).padStart(2,'0')}${this.secondaryColor.b.toString(16).padStart(2,'0')}"
                                        style="width: 24px; height: 24px; border: none; background: none; cursor: pointer;"
                                    />
                                    <div style="margin-left: 6px; font-family: monospace; color: #aaa; font-size: 10px;">
                                        #${this.secondaryColor.r.toString(16).padStart(2,'0')}${this.secondaryColor.g.toString(16).padStart(2,'0')}${this.secondaryColor.b.toString(16).padStart(2,'0')}
                                    </div>
                                </div>
                            </div>

                            <!-- Starburst Color -->
                            <div class="color-input">
                                <label style="display: block; color: #888; font-size: 11px; margin-bottom: 4px;">Starburst Color</label>
                                <div style="
                                    display: flex;
                                    align-items: center;
                                    background: rgba(0,0,0,0.2);
                                    padding: 6px;
                                    border-radius: 6px;
                                    border: 1px solid rgba(255,255,255,0.05);
                                ">
                                    <input type="color" id="starburstColorPicker" 
                                        value="#${this.properties.starburst_color[0].toString(16).padStart(2,'0')}${this.properties.starburst_color[1].toString(16).padStart(2,'0')}${this.properties.starburst_color[2].toString(16).padStart(2,'0')}"
                                        style="width: 24px; height: 24px; border: none; background: none; cursor: pointer;"
                                    />
                                    <div style="margin-left: 6px; font-family: monospace; color: #aaa; font-size: 10px;">
                                        #${this.properties.starburst_color[0].toString(16).padStart(2,'0')}${this.properties.starburst_color[1].toString(16).padStart(2,'0')}${this.properties.starburst_color[2].toString(16).padStart(2,'0')}
                                    </div>
                                </div>
                            </div>

                            <!-- Ghost Color -->
                            <div class="color-input">
                                <label style="display: block; color: #888; font-size: 11px; margin-bottom: 4px;">Ghost Color</label>
                                <div style="
                                    display: flex;
                                    align-items: center;
                                    background: rgba(0,0,0,0.2);
                                    padding: 6px;
                                    border-radius: 6px;
                                    border: 1px solid rgba(255,255,255,0.05);
                                ">
                                    <input type="color" id="ghostColorPicker" 
                                        value="#${this.properties.ghost_color[0].toString(16).padStart(2,'0')}${this.properties.ghost_color[1].toString(16).padStart(2,'0')}${this.properties.ghost_color[2].toString(16).padStart(2,'0')}"
                                        style="width: 24px; height: 24px; border: none; background: none; cursor: pointer;"
                                    />
                                    <div style="margin-left: 6px; font-family: monospace; color: #aaa; font-size: 10px;">
                                        #${this.properties.ghost_color[0].toString(16).padStart(2,'0')}${this.properties.ghost_color[1].toString(16).padStart(2,'0')}${this.properties.ghost_color[2].toString(16).padStart(2,'0')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                        <!-- Flare Type Seçici -->
                        <div class="control-section" style="
                            background: rgba(0,0,0,0.2);
                            padding: 16px;
                            border-radius: 12px;
                            border: 1px solid rgba(255,255,255,0.05);
                        ">
                            <div class="section-header" style="
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                margin-bottom: 16px;
                            ">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color: #4a9eff;">
                                    <circle cx="12" cy="12" r="3"/>
                                    <path d="M12 3v2m0 14v2M3 12h2m14 0h2"/>
                                    <path d="M5.6 5.6l1.4 1.4m10 10l1.4 1.4M5.6 18.4l1.4-1.4m10-10l1.4-1.4" opacity="0.5"/>
                                </svg>
                                    <span style="color: #eee; font-size: 13px; font-weight: 500;">Flare Type</span>
                            </div>
                        </div>
                            <div class="flare-types" style="
                                display: grid;
                                grid-template-columns: repeat(7, 1fr);
                                gap: 4px;
                            ">
                        ${Object.entries(FLARE_TYPES).map(([key, value]) => `
                                <button class="flare-type-btn ${this.properties.flare_type === key ? 'active' : ''}" 
                                    data-type="${key}"
                                    title="${value}"
                                    style="
                                    width: 26px;
                                    height: 26px;
                                    background: ${this.properties.flare_type === key ? 'rgba(74, 158, 255, 0.1)' : 'rgba(0,0,0,0.2)'};
                                    border: 1px solid ${this.properties.flare_type === key ? '#4a9eff' : 'rgba(255,255,255,0.05)'};
                                    border-radius: 6px;
                                    cursor: pointer;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    transition: all 0.2s;
                                ">
                                <div style="
                                    width: 14px;
                                    height: 14px;
                                    border-radius: 50%;
                                    background: rgb(${DEFAULT_FLARE_CONFIGS[key].mainColor.r},${DEFAULT_FLARE_CONFIGS[key].mainColor.g},${DEFAULT_FLARE_CONFIGS[key].mainColor.b});
                                    box-shadow: 0 0 8px rgb(${DEFAULT_FLARE_CONFIGS[key].mainColor.r},${DEFAULT_FLARE_CONFIGS[key].mainColor.g},${DEFAULT_FLARE_CONFIGS[key].mainColor.b});
                                    opacity: 0.8;
                                    transition: opacity 0.2s;
                                "></div>
                            </button>
                        `).join('')}
                    </div>
                </div>

                        <!-- Blend Mode Seçici -->
                        <div class="control-section" style="
                            background: rgba(0,0,0,0.2);
                            padding: 16px;
                            border-radius: 12px;
                            border: 1px solid rgba(255,255,255,0.05);
                        ">
                            <div class="section-header" style="
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                margin-bottom: 16px;
                            ">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color: #4a9eff;">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                                </svg>
                                <span style="color: #eee; font-size: 13px; font-weight: 500;">Blend Mode</span>
                            </div>
                            <div class="blend-modes" style="
                                display: grid;
                                grid-template-columns: repeat(2, 1fr);
                                gap: 6px;
                            ">
                                ${Object.entries(BLEND_MODES).map(([key, value]) => `
                                    <button class="blend-mode-btn ${this.properties.blend_mode === value ? 'active' : ''}" 
                                        data-mode="${value}"
                                        style="
                                            background: ${this.properties.blend_mode === value ? 
                                                'linear-gradient(45deg, #4a9eff22, #4a9eff44)' : 
                                                'rgba(0,0,0,0.2)'};
                                            border: 1px solid ${this.properties.blend_mode === value ? 
                                            '#4a9eff' : 
                                            'rgba(255,255,255,0.05)'};
                                            padding: 8px;
                                        border-radius: 8px;
                                            color: ${this.properties.blend_mode === value ? '#fff' : '#888'};
                                        cursor: pointer;
                                            font-size: 11px;
                                            font-weight: 500;
                                        transition: all 0.2s;
                                            text-align: center;
                                        position: relative;
                                        overflow: hidden;
                                        ">
                                        ${key}
                                        ${this.properties.blend_mode === value ? `
                                        <div style="
                                            position: absolute;
                                                bottom: 0;
                                                left: 0;
                                                width: 100%;
                                                height: 2px;
                                                background: linear-gradient(90deg, #4a9eff, #45e3ff);
                                        "></div>
                                    ` : ''}
                            </button>
                        `).join('')}
                            </div>
                    </div>
                </div>

                    <!-- Slider Kategorileri -->
                    <div style="
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 16px;
                    ">
                            ${this.generateSliderGroups()}
                            </div>
                </div>
            `;


            const buttonContainer = document.createElement('div');
            buttonContainer.style.cssText = UI_STYLES.DIALOG.BUTTON_CONTAINER;

            dialog.appendChild(content);
            dialog.appendChild(buttonContainer);


            const mainColorPicker = content.querySelector('#mainColorPicker');
            const secondaryColorPicker = content.querySelector('#secondaryColorPicker');


            mainColorPicker.addEventListener('input', (e) => {
                const color = e.target.value;
                const r = parseInt(color.substr(1,2), 16);
                const g = parseInt(color.substr(3,2), 16);
                const b = parseInt(color.substr(5,2), 16);
                

                this.mainColor = { r, g, b };
                

                this.properties.main_color = [r, g, b];
                this.properties.starburst_color = [r, g, b];
                

                const currentConfig = DEFAULT_FLARE_CONFIGS[this.properties.flare_type];
                if (currentConfig) {
                    currentConfig.mainColor = { r, g, b };
                }
                

                const hexDisplay = e.target.nextElementSibling;
                if (hexDisplay) {
                    hexDisplay.textContent = color.toUpperCase();
                }
                

                if (this.widgets) {
                    const mainColorWidget = this.widgets.find(w => w.name === 'main_color');
                    if (mainColorWidget) {
                        mainColorWidget.value = [r, g, b];
                    }
                }
                

                this.setDirtyCanvas(true);
                if (this.graph) {
                    this.graph.setDirtyCanvas(true, true);
                    this.graph.runStep();
                    this.graph.change();
                }
            });


            secondaryColorPicker.addEventListener('input', (e) => {
                const color = e.target.value;
                const r = parseInt(color.substr(1,2), 16);
                const g = parseInt(color.substr(3,2), 16);
                const b = parseInt(color.substr(5,2), 16);
                

                this.secondaryColor = { r, g, b };
                

                this.properties.secondary_color = [r, g, b];
                

                if (this.widgets) {
                    const secondaryColorWidget = this.widgets.find(w => w.name === 'secondary_color');
                    if (secondaryColorWidget) {
                        secondaryColorWidget.value = [r, g, b];
                    }
                }
                

                const hexDisplay = e.target.nextElementSibling;
                if (hexDisplay) {
                    hexDisplay.textContent = color.toUpperCase();
                }
                

                this.setDirtyCanvas(true);
                if (this.graph) {
                    this.graph.setDirtyCanvas(true, true);
                    this.graph.runStep();
                    this.graph.change();
                }
            });


            dialog.appendChild(style);


            this.setupDialogEventListeners(dialog);


            document.body.appendChild(dialog);
            

            const rect = dialog.getBoundingClientRect();
            

        };


        nodeType.prototype.setupDialogEventListeners = function(dialog) {

            const mainColorPicker = dialog.querySelector('#mainColorPicker');
            const secondaryColorPicker = dialog.querySelector('#secondaryColorPicker');
            const starburstColorPicker = dialog.querySelector('#starburstColorPicker');
            const ghostColorPicker = dialog.querySelector('#ghostColorPicker');


            if (secondaryColorPicker) {
                secondaryColorPicker.addEventListener('input', (e) => {
                    const color = e.target.value;
                    const r = parseInt(color.substr(1,2), 16);
                    const g = parseInt(color.substr(3,2), 16);
                    const b = parseInt(color.substr(5,2), 16);
                    

                    this.secondaryColor = { r, g, b };
                    

                    this.properties.secondary_color = [r, g, b];
                    

                    if (this.widgets) {
                        const secondaryColorWidget = this.widgets.find(w => w.name === 'secondary_color');
                        if (secondaryColorWidget) {
                            secondaryColorWidget.value = [r, g, b];
                        }
                    }
                    

                    const hexDisplay = e.target.nextElementSibling;
                    if (hexDisplay) {
                        hexDisplay.textContent = color.toUpperCase();
                    }
                    

                    this.setDirtyCanvas(true);
                    if (this.graph) {
                        this.graph.setDirtyCanvas(true, true);
                        this.graph.runStep();
                        this.graph.change();
                    }
                });
            }



        };


        nodeType.prototype.debounce = function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        };


        nodeType.prototype.onMouseMove = nodeType.prototype.debounce(function(e, local_pos) {

        }, 16);


        nodeType.prototype.updateSliderValue = nodeType.prototype.debounce(function(x, sliderKey) {

        }, 32);


        nodeType.prototype.rgbToHex = function(color) {
            return `#${color.r.toString(16).padStart(2,'0')}${color.g.toString(16).padStart(2,'0')}${color.b.toString(16).padStart(2,'0')}`;
        };

        nodeType.prototype.updateColorPickers = function(dialog, mainColor, secondaryColor) {
            const mainColorPicker = dialog.querySelector('#mainColorPicker');
            const secondaryColorPicker = dialog.querySelector('#secondaryColorPicker');
            const starburstColorPicker = dialog.querySelector('#starburstColorPicker');
            const ghostColorPicker = dialog.querySelector('#ghostColorPicker');

            if (mainColorPicker) {
                const mainHex = this.rgbToHex(mainColor);
                mainColorPicker.value = mainHex;
                mainColorPicker.nextElementSibling.textContent = mainHex.toUpperCase();
            }
            
            if (secondaryColorPicker) {
                const secondaryHex = this.rgbToHex(secondaryColor);
                secondaryColorPicker.value = secondaryHex;
                secondaryColorPicker.nextElementSibling.textContent = secondaryHex.toUpperCase();
            }


            if (starburstColorPicker && this.properties.starburst_color) {
                const starburstHex = this.rgbToHex({
                    r: this.properties.starburst_color[0],
                    g: this.properties.starburst_color[1],
                    b: this.properties.starburst_color[2]
                });
                starburstColorPicker.value = starburstHex;
                starburstColorPicker.nextElementSibling.textContent = starburstHex.toUpperCase();
            }
            
            if (ghostColorPicker && this.properties.ghost_color) {
                const ghostHex = this.rgbToHex({
                    r: this.properties.ghost_color[0],
                    g: this.properties.ghost_color[1],
                    b: this.properties.ghost_color[2]
                });
                ghostColorPicker.value = ghostHex;
                ghostColorPicker.nextElementSibling.textContent = ghostHex.toUpperCase();
            }
        };

        nodeType.prototype.updateWidgetColors = function(mainColor, secondaryColor) {
            if (this.widgets) {
                this.widgets.forEach(widget => {
                    if (widget.name === 'main_color') {
                        widget.value = [mainColor.r, mainColor.g, mainColor.b];
                    } else if (widget.name === 'secondary_color') {
                        widget.value = [secondaryColor.r, secondaryColor.g, secondaryColor.b];
                    }
                });
            }
        };


        nodeType.prototype.setupDialogEventListeners = function(dialog) {

            const flareTypeButtons = dialog.querySelectorAll('.flare-type-btn');
            flareTypeButtons.forEach(btn => {
                btn.onclick = () => {
                    const selectedType = btn.dataset.type;
                    

                    this.properties.flare_type = selectedType;
                    

                    const config = DEFAULT_FLARE_CONFIGS[selectedType];
                    if (config) {

                        this.mainColor = {...config.mainColor};
                        this.secondaryColor = {...config.secondaryColor};


                        this.properties.main_color = [this.mainColor.r, this.mainColor.g, this.mainColor.b];
                        this.properties.secondary_color = [this.secondaryColor.r, this.secondaryColor.g, this.secondaryColor.b];


                        if (!this.properties.starburst_color) {
                        this.properties.starburst_color = [this.mainColor.r, this.mainColor.g, this.mainColor.b];
                        }


                        this.updateColorPickers(dialog, this.mainColor, this.secondaryColor);
                        

                        if (this.widgets) {
                            this.widgets.forEach(widget => {
                                if (widget.name === 'main_color') {
                                    widget.value = [this.mainColor.r, this.mainColor.g, this.mainColor.b];
                                } else if (widget.name === 'secondary_color') {
                                    widget.value = [this.secondaryColor.r, this.secondaryColor.g, this.secondaryColor.b];
                                }
                            });
                        }


                        flareTypeButtons.forEach(b => {
                            const isActive = b.dataset.type === selectedType;
                            b.classList.toggle('active', isActive);
                            b.style.borderColor = isActive ? '#4a9eff' : 'rgba(255,255,255,0.05)';
                            b.style.background = isActive ? 'rgba(74, 158, 255, 0.1)' : 'rgba(0,0,0,0.2)';
                        });


                        if (config.defaultSettings) {
                            Object.assign(this.properties, config.defaultSettings);
                        }


                        const sliders = dialog.querySelectorAll('input[type="range"]');
                        sliders.forEach(slider => {
                            const key = slider.id.replace('Slider', '');
                            if (config.defaultSettings[key] !== undefined) {
                                slider.value = config.defaultSettings[key];
                                

                                const valueDisplay = dialog.querySelector(`#${key}Value`);
                                if (valueDisplay) {
                                    valueDisplay.textContent = this.formatSliderValue(key, config.defaultSettings[key]);
                                }
                                

                                const percent = ((config.defaultSettings[key] - slider.min) / (slider.max - slider.min)) * 100;
                                slider.style.background = `linear-gradient(90deg, 
                                    #4a9eff ${percent}%, 
                                    rgba(255,255,255,0.1) ${percent}%
                                )`;
                            }
                        });
                    }


                    const flareTypeSubtitle = dialog.querySelector('.flare-type-subtitle');
                    if (flareTypeSubtitle) {
                        flareTypeSubtitle.textContent = FLARE_TYPES[selectedType];
                    }


                    this.setDirtyCanvas(true);
                    if (this.graph) {
                        this.graph.setDirtyCanvas(true, true);
                        this.graph.runStep();
                        this.graph.change();
                    }
                };
            });


            const blendModeButtons = dialog.querySelectorAll('.blend-mode-btn');
            blendModeButtons.forEach(btn => {
                btn.onclick = () => {
                    const selectedMode = btn.dataset.mode;
                    this.properties.blend_mode = selectedMode;
                    

                    const widget = this.widgets?.find(w => w.name === 'blend_mode');
                    if (widget) {
                        widget.value = selectedMode;
                    }
                    

                    blendModeButtons.forEach(b => {
                        const isActive = b.dataset.mode === selectedMode;
                        b.style.background = isActive ? 
                            'linear-gradient(45deg, #4a9eff, #2d7ed9)' : 
                            'rgba(255,255,255,0.03)';
                        b.style.borderColor = isActive ? '#4a9eff' : 'rgba(255,255,255,0.05)';
                        b.style.color = isActive ? '#fff' : '#888';
                    });
                    

                    this.setDirtyCanvas(true);
                    if (this.graph) {
                        this.graph.setDirtyCanvas(true, true);
                        this.graph.runStep();
                        this.graph.change();
                    }
                };
            });


            const sliders = dialog.querySelectorAll('input[type="range"]');
            sliders.forEach(slider => {
                const updateSlider = () => {
                    const value = parseFloat(slider.value);
                    const key = slider.id.replace('Slider', '');
                    

                    if (this.properties[key] === value) return;
                    

                    this.properties[key] = value;
                    

                    requestAnimationFrame(() => {
                        const valueDisplay = dialog.querySelector(`#${key}Value`);
                        if (valueDisplay) {
                            valueDisplay.textContent = this.formatSliderValue(key, value);
                        }
                        

                        const percent = ((value - slider.min) / (slider.max - slider.min)) * 100;
                        slider.style.background = `linear-gradient(90deg, 
                            #4a9eff ${percent}%, 
                            rgba(255,255,255,0.1) ${percent}%
                        )`;


                        this.setDirtyCanvas(true);
                        if (this.graph) {
                            this.graph.setDirtyCanvas(true, true);
                            this.graph.runStep();
                            this.graph.change();
                        }
                    });
                };


                slider.oninput = updateSlider;
                slider.onchange = updateSlider;
                

                updateSlider();
            });


            const mainColorPicker = dialog.querySelector('#mainColorPicker');
            const starburstColorPicker = dialog.querySelector('#starburstColorPicker');
            const ghostColorPicker = dialog.querySelector('#ghostColorPicker');


            if (starburstColorPicker) {
                starburstColorPicker.addEventListener('input', (e) => {
                    const color = e.target.value;
                    const r = parseInt(color.substr(1,2), 16);
                    const g = parseInt(color.substr(3,2), 16);
                    const b = parseInt(color.substr(5,2), 16);
                    

                    this.properties.starburst_color = [r, g, b];
                    

                    const currentConfig = DEFAULT_FLARE_CONFIGS[this.properties.flare_type];
                    if (currentConfig && currentConfig.colors) {
                        currentConfig.colors.starburst = [r, g, b];
                    }
                    

                    if (this.widgets) {
                        const starburstColorWidget = this.widgets.find(w => w.name === 'starburst_color');
                        if (starburstColorWidget) {
                            starburstColorWidget.value = [r, g, b];
                        }
                    }
                    

                    const hexDisplay = e.target.nextElementSibling;
                    if (hexDisplay) {
                        hexDisplay.textContent = color.toUpperCase();
                    }
                    

                    this.setDirtyCanvas(true);
                    if (this.graph) {
                        this.graph.setDirtyCanvas(true, true);
                    }
                });
            }


            if (ghostColorPicker) {
                ghostColorPicker.addEventListener('input', (e) => {
                    const color = e.target.value;
                    const r = parseInt(color.substr(1,2), 16);
                    const g = parseInt(color.substr(3,2), 16);
                    const b = parseInt(color.substr(5,2), 16);
                    

                    this.properties.ghost_color = [r, g, b];
                    

                    const currentConfig = DEFAULT_FLARE_CONFIGS[this.properties.flare_type];
                    if (currentConfig && currentConfig.colors) {
                        currentConfig.colors.ghost = [r, g, b];
                    }
                    

                    if (this.widgets) {
                        const ghostColorWidget = this.widgets.find(w => w.name === 'ghost_color');
                        if (ghostColorWidget) {
                            ghostColorWidget.value = [r, g, b];
                        }
                    }
                    

                    const hexDisplay = e.target.nextElementSibling;
                    if (hexDisplay) {
                        hexDisplay.textContent = color.toUpperCase();
                    }
                    

                    this.setDirtyCanvas(true);
                    if (this.graph) {
                        this.graph.setDirtyCanvas(true, true);
                    }
                });
            }


            const secondaryColorPicker = dialog.querySelector('#secondaryColorPicker');
            
            if (secondaryColorPicker) {
                secondaryColorPicker.addEventListener('input', (e) => {
                    const color = e.target.value;
                    const r = parseInt(color.substr(1,2), 16);
                    const g = parseInt(color.substr(3,2), 16);
                    const b = parseInt(color.substr(5,2), 16);
                    

                    this.secondaryColor = { r, g, b };
                    this.properties.secondary_color = [r, g, b];
                    

                    if (this.widgets) {
                        const widget = this.widgets.find(w => w.name === 'secondary_color');
                        if (widget) widget.value = [r, g, b];
                    }
                    
                    this.setDirtyCanvas(true);
                });
            }
        };


        nodeType.prototype.applyFlareTypeSettings = function(flareType) {
            const config = DEFAULT_FLARE_CONFIGS[flareType];
            if (!config) return;


            if (config.colors) {

                this.properties.starburst_color = config.colors.starburst || [255, 255, 255];
                this.properties.ghost_color = config.colors.ghost || [255, 255, 255];
            }


            if (config.mainColor) {
                this.mainColor = config.mainColor;
            }
            if (config.secondaryColor) {
                this.secondaryColor = config.secondaryColor;
            }


            const dialog = document.querySelector('.lens-flare-dialog');
            if (dialog) {
                const mainColorPicker = dialog.querySelector('#mainColorPicker');
                const secondaryColorPicker = dialog.querySelector('#secondaryColorPicker');
                const starburstColorPicker = dialog.querySelector('#starburstColorPicker');
                const ghostColorPicker = dialog.querySelector('#ghostColorPicker');


                if (mainColorPicker) {
                    const mainHex = this.rgbToHex(this.mainColor);
                    mainColorPicker.value = mainHex;
                    const mainHexDisplay = mainColorPicker.nextElementSibling;
                    if (mainHexDisplay) {
                        mainHexDisplay.textContent = mainHex.toUpperCase();
                    }
                }


                if (secondaryColorPicker) {
                    const secondaryHex = this.rgbToHex(this.secondaryColor);
                    secondaryColorPicker.value = secondaryHex;
                    const secondaryHexDisplay = secondaryColorPicker.nextElementSibling;
                    if (secondaryHexDisplay) {
                        secondaryHexDisplay.textContent = secondaryHex.toUpperCase();
                    }
                }


                if (starburstColorPicker && config.colors?.starburst) {
                    const starburstHex = this.rgbToHex({
                        r: config.colors.starburst[0],
                        g: config.colors.starburst[1],
                        b: config.colors.starburst[2]
                    });
                    starburstColorPicker.value = starburstHex;
                    const starburstHexDisplay = starburstColorPicker.nextElementSibling;
                    if (starburstHexDisplay) {
                        starburstHexDisplay.textContent = starburstHex.toUpperCase();
                    }
                }


                if (ghostColorPicker && config.colors?.ghost) {
                    const ghostHex = this.rgbToHex({
                        r: config.colors.ghost[0],
                        g: config.colors.ghost[1],
                        b: config.colors.ghost[2]
                    });
                    ghostColorPicker.value = ghostHex;
                    const ghostHexDisplay = ghostColorPicker.nextElementSibling;
                    if (ghostHexDisplay) {
                        ghostHexDisplay.textContent = ghostHex.toUpperCase();
                    }
                }
            }


            if (config.defaultSettings) {
                Object.entries(config.defaultSettings).forEach(([key, value]) => {
                    this.properties[key] = value;
                    
                    const slider = document.querySelector(`#${key}Slider`);
                    const valueDisplay = document.querySelector(`#${key}Value`);
                    

                    
                    if (valueDisplay) {
                        valueDisplay.textContent = this.formatSliderValue(key, value);
                    }
                });
            }

            this.setDirtyCanvas(true);
            if (this.graph) {
                this.graph.setDirtyCanvas(true, true);
            }
        };




        nodeType.prototype.formatSliderValue = function(key, value) {
            switch(key) {
                case "color_temperature": return `${Math.round(value)}K`;
                case "rotation": return `${Math.round(value)}°`;
                case "position_x":
                case "position_y":
                case "starburst_position_x":
                case "starburst_position_y": return value.toFixed(2);
                default: return value.toFixed(2);
            }
        };


        nodeType.prototype.generateSlider = function(slider) {
            const value = this.properties[slider.key] || 0;
            const range = SLIDER_RANGES[slider.key] || { min: 0, max: 1, step: 0.01 };
            const percent = ((value - range.min) / (range.max - range.min)) * 100;

            return `
                <div class="slider-group" style="
                    background: rgba(0,0,0,0.2);
                    padding: 8px;
                    border-radius: 6px;
                ">
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 4px;
                    ">
                        <label style="
                            color: #888;
                            font-size: 11px;
                            font-weight: 500;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                        ">
                            <span>${slider.icon}</span>
                            ${slider.label}
                        </label>
                        <span style="
                            color: #4a9eff;
                            font-size: 11px;
                            font-weight: 500;
                        " id="${slider.key}Value">
                            ${this.formatSliderValue(slider.key, value)}
                        </span>
                    </div>
                    <div class="slider-container" style="
                        background: rgba(255,255,255,0.03);
                        border-radius: 4px;
                        padding: 2px;
                        position: relative;
                    ">
                        <input type="range"
                            id="${slider.key}Slider"
                            value="${value}"
                            min="${range.min}"
                            max="${range.max}"
                            step="${range.step}"
                            style="
                                width: 100%;
                                -webkit-appearance: none;
                                background: linear-gradient(90deg, 
                                    #4a9eff ${percent}%, 
                                    rgba(255,255,255,0.1) ${percent}%
                                );
                                cursor: pointer;
                                height: 4px;
                                border-radius: 2px;
                            "
                        >
                    </div>
                </div>
            `;
        };


        nodeType.prototype.generateSliderGroups = function() {
            const categories = Object.values(SLIDER_CATEGORIES);
            
            return categories.map(category => `
                <div class="slider-category control-section" style="${UI_STYLES.SLIDER_GROUP.CONTAINER}">
                    <div class="section-header" style="${UI_STYLES.SLIDER_GROUP.HEADER}">
                        <span style="${UI_STYLES.SLIDER_GROUP.HEADER_ICON}">${category.icon || ''}</span>
                        <span style="${UI_STYLES.SLIDER_GROUP.HEADER_TEXT}">${category.name}</span>
                    </div>
                    <div style="${UI_STYLES.SLIDER_GROUP.SLIDERS_CONTAINER}">
                        ${category.sliders.map(slider => this.generateSlider(slider)).join('')}
                    </div>
                </div>
            `).join('');
        };


        nodeType.prototype.createGradient = function(ctx, config, x = 0, y = 0) {
            const { type, stops, radius } = config;
            let gradient;

            if (type === GRADIENT_HELPERS.TYPES.RADIAL) {
                gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            } else {
                gradient = ctx.createLinearGradient(x, y, x + radius, y);
            }

            stops.forEach(stop => {
                gradient.addColorStop(stop.position, stop.color);
            });

            return gradient;
        };


        nodeType.prototype.createColorString = function(color, opacity = 1) {
            if (Array.isArray(color)) {
                return `rgba(${color[0]},${color[1]},${color[2]},${opacity})`;
            }
            return color;
        };


        nodeType.prototype.drawStarburst = function(ctx, params) {
            const { x, y, size, opacity, angle } = params;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);

            const starburstColor = this.properties.starburst_color || [255, 255, 255];
            
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
            
            const colorString = `rgba(${starburstColor[0]}, ${starburstColor[1]}, ${starburstColor[2]}`;
            gradient.addColorStop(0, `${colorString}, ${opacity})`);
            gradient.addColorStop(0.5, `${colorString}, ${opacity * 0.5})`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(0, 0, size * (this.properties.size_x || 1.0), size * (this.properties.size_y || 1.0), 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        };


        nodeType.prototype.renderCinematicLightBehavior = function(ctx, config, radius, intensity) {

            const mainLightStops = CINEMATIC_LIGHT.MAIN_LIGHT.STOPS.map(stop => ({
                position: stop.position,
                color: this.createColorString([config.mainColor.r, config.mainColor.g, config.mainColor.b], intensity * stop.opacity)
            }));

            const mainLightConfig = GRADIENT_HELPERS.createGradientConfig(
                GRADIENT_HELPERS.TYPES.RADIAL,
                mainLightStops,
                radius
            );

            ctx.fillStyle = this.createGradient(ctx, mainLightConfig);
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill();


            const { INNER, OUTER } = CINEMATIC_LIGHT.SECONDARY_LIGHT.RADIUS;
            const secondaryLightStops = CINEMATIC_LIGHT.SECONDARY_LIGHT.STOPS.map(stop => ({
                position: stop.position,
                color: this.createColorString([config.secondaryColor.r, config.secondaryColor.g, config.secondaryColor.b], intensity * stop.opacity)
            }));

            const secondaryLightConfig = GRADIENT_HELPERS.createGradientConfig(
                GRADIENT_HELPERS.TYPES.RADIAL,
                secondaryLightStops,
                radius * OUTER
            );

            ctx.fillStyle = this.createGradient(ctx, secondaryLightConfig, 0, 0, radius * INNER, 0, 0, radius * OUTER);
            ctx.beginPath();
            ctx.arc(0, 0, radius * OUTER, 0, Math.PI * 2);
            ctx.fill();
        };


        nodeType.prototype.getSliderByKey = function(key) {
            return SLIDER_CONFIG.DEFAULT.find(slider => slider.key === key);
        };


        nodeType.prototype.generateDustPattern = function(ctx, size, params) {
            const { NOISE_SCALE, TURBULENCE, DETAIL_LEVELS, BASE_FREQUENCY, PERSISTENCE } = ATMOSPHERIC_EFFECTS.DUST_PARTICLES.PATTERN;
            

            const generateNoise = (x, y, freq) => {
                return Math.sin(x * freq) * Math.cos(y * freq) * 
                       Math.sin((x + y) * freq * 0.5) * 0.5 + 0.5;
            };

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = size;
            tempCanvas.height = size;
            const tempCtx = tempCanvas.getContext('2d');

            const imageData = tempCtx.createImageData(size, size);
            const data = imageData.data;

            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const index = (y * size + x) * 4;
                    let value = 0;
                    let amplitude = 1;
                    let frequency = BASE_FREQUENCY;


                    for (let i = 0; i < DETAIL_LEVELS; i++) {
                        value += generateNoise(
                            x * NOISE_SCALE + Math.random() * TURBULENCE,
                            y * NOISE_SCALE + Math.random() * TURBULENCE,
                            frequency
                        ) * amplitude;
                        
                        amplitude *= PERSISTENCE;
                        frequency *= 2;
                    }


                    value = Math.min(1, Math.max(0, value / DETAIL_LEVELS));
                    value = Math.pow(value, 1.5);


                    const dx = x - size / 2;
                    const dy = y - size / 2;
                    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy) / (size / 2);
                    const falloff = Math.max(0, 1 - distanceFromCenter);
                    value *= falloff * falloff;

                    data[index] = 255;
                    data[index + 1] = 255;
                    data[index + 2] = 255;
                    data[index + 3] = value * 255;
                }
            }

            tempCtx.putImageData(imageData, 0, 0);
            return tempCanvas;
        };


        nodeType.prototype.onRemoved = function() {

            if (this._dialogListeners) {
                this._dialogListeners.forEach(({element, type, fn}) => {
                    element.removeEventListener(type, fn);
                });
                this._dialogListeners = [];
            }


        };


        nodeType.prototype.drawMainRay = function(ctx, length, opacity, config) {
            const gradient = ctx.createLinearGradient(0, 0, length, 0);
            gradient.addColorStop(0, `rgba(${config.mainColor.r},${config.mainColor.g},${config.mainColor.b},${opacity})`);
            gradient.addColorStop(0.3, `rgba(${config.secondaryColor.r},${config.secondaryColor.g},${config.secondaryColor.b},${opacity * 0.8})`);
            gradient.addColorStop(0.6, `rgba(${config.mainColor.r},${config.mainColor.g},${config.mainColor.b},${opacity * 0.5})`);
            gradient.addColorStop(0.8, `rgba(${config.secondaryColor.r},${config.secondaryColor.g},${config.secondaryColor.b},${opacity * 0.3})`);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2 * this.properties.ray_thickness;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(length, 0);
            ctx.stroke();
        };


        nodeType.prototype.drawDetailRays = function(ctx, length, opacity, config) {
            const detailRayCount = 4;
            
            for (let j = 0; j < detailRayCount; j++) {
                const subAngle = (j - detailRayCount/2) * 0.02;
                ctx.save();
                ctx.rotate(subAngle);
                
                const gradient = ctx.createLinearGradient(0, 0, length, 0);
                gradient.addColorStop(0, `rgba(${config.mainColor.r},${config.mainColor.g},${config.mainColor.b},${opacity * 0.8})`);
                gradient.addColorStop(0.5, `rgba(${config.secondaryColor.r},${config.secondaryColor.g},${config.secondaryColor.b},${opacity * 0.4})`);
                gradient.addColorStop(1, 'rgba(0,0,0,0)');
                
                ctx.strokeStyle = gradient;
                ctx.lineWidth = (1.2 + j * 0.4) * this.properties.ray_thickness;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(length * (1 - j * 0.08), 0);
                ctx.stroke();


                if (j === Math.floor(detailRayCount/2)) {
                    const scatterGradient = ctx.createLinearGradient(0, -this.properties.ray_thickness * 3, 0, this.properties.ray_thickness * 3);
                    scatterGradient.addColorStop(0, 'rgba(255,255,255,0)');
                    scatterGradient.addColorStop(0.5, `rgba(255,255,255,${opacity * 0.15})`);
                    scatterGradient.addColorStop(1, 'rgba(255,255,255,0)');

                    ctx.strokeStyle = scatterGradient;
                    ctx.lineWidth = length * 0.12;
                    ctx.beginPath();
                    ctx.moveTo(0, -this.properties.ray_thickness * 3);
                    ctx.lineTo(0, this.properties.ray_thickness * 3);
                    ctx.stroke();
                }
                
                ctx.restore();
            }
        };


        nodeType.prototype.drawGlowLayer = function(ctx, length, opacity, config) {
            const glowGradient = ctx.createLinearGradient(0, 0, length * 1.2, 0);
            glowGradient.addColorStop(0, `rgba(${config.mainColor.r},${config.mainColor.g},${config.mainColor.b},${opacity * 0.4})`);
            glowGradient.addColorStop(0.4, `rgba(${config.secondaryColor.r},${config.secondaryColor.g},${config.secondaryColor.b},${opacity * 0.2})`);
            glowGradient.addColorStop(0.7, `rgba(${config.mainColor.r},${config.mainColor.g},${config.mainColor.b},${opacity * 0.1})`);
            glowGradient.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.strokeStyle = glowGradient;
            ctx.lineWidth = 18 * this.properties.ray_thickness;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(length * 0.95, 0);
            ctx.stroke();
        };


        nodeType.prototype.renderDiffractionRings = function(ctx, radius, intensity) {
            const DC = RENDER_CONSTANTS.DIFFRACTION;
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            
            for (let i = 0; i < DC.RING_COUNT; i++) {
                const ringRadius = radius * (1 + i * DC.RING_SPACING);
                const ringIntensity = this.properties.diffraction_intensity * (1 - i * DC.INTENSITY_DECAY);
                

                this.renderDiffractionRing(ctx, {
                    radius: ringRadius,
                    intensity: intensity * DC.BASE_INTENSITY * ringIntensity,
                    ringIndex: i,
                    totalRings: DC.RING_COUNT
                });
                

                this.renderDetailRing(ctx, {
                    radius: ringRadius,
                    intensity: intensity * DC.BASE_INTENSITY * ringIntensity * 1.2,
                    ringIndex: i,
                    totalRings: DC.RING_COUNT
                });
            }
            
            ctx.restore();
        };


        nodeType.prototype.renderAtmosphericScatter = function(ctx, radius, intensity) {
            const AC = RENDER_CONSTANTS.ATMOSPHERIC;
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            
            for (let i = 0; i < AC.LAYER_COUNT; i++) {
                const scatterRadius = radius * (AC.BASE_RADIUS + i * AC.RADIUS_INCREMENT);
                const scatterIntensity = this.properties.atmospheric_scatter * (1 - i * AC.INTENSITY_DECAY);
                
                this.renderAtmosphericLayer(ctx, {
                    radius: scatterRadius,
                    baseIntensity: intensity,
                    scatterIntensity: scatterIntensity,
                    glowStops: AC.GLOW_STOPS
                });
            }
            
            ctx.restore();
        };


        nodeType.prototype.createMainLayers = function(config, radius, intensity, characteristics) {
            const MC = RENDER_CONSTANTS.MAIN_GLOW;
            const CC = RENDER_CONSTANTS.COATING;
            
            return [
                {
                    blend: 'screen',
                    render: (ctx) => this.createMainGlow(ctx, {
                        radius,
                        intensity,
                        config,
                        tempAdjust: (this.properties.color_temperature - MC.TEMPERATURE_ADJUSTMENT.BASE) / MC.TEMPERATURE_ADJUSTMENT.SCALE,
                        stops: MC.OPACITY_STOPS
                    })
                },
                {
                    blend: 'screen',
                    render: (ctx) => this.createInnerRing(ctx, radius, intensity)
                },
                {
                    blend: 'overlay',
                    render: (ctx) => this.createCoatingReflection(ctx, {
                        radius,
                        intensity,
                        config,
                        coatingQuality: characteristics.coatingQuality,
                        colorBlend: CC.COLOR_BLEND
                    })
                }
            ];
        };


        nodeType.prototype.renderDiffractionRing = function(ctx, params) {
            const { radius, intensity, ringIndex, totalRings } = params;
            const hue = (ringIndex / totalRings) * 360;
            
            const ringGlow = this.createSpectralGradient(ctx, {
                innerRadius: radius * 0.95,
                outerRadius: radius,
                hue,
                intensity
            });
            
            this.drawGlow(ctx, ringGlow, radius);
        };


        nodeType.prototype.renderAtmosphericLayer = function(ctx, params) {
            const { radius, baseIntensity, scatterIntensity, glowStops } = params;
            
            const scatterGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
            scatterGlow.addColorStop(0, `rgba(255,255,255,${baseIntensity * glowStops.START * scatterIntensity})`);
            scatterGlow.addColorStop(0.6, `rgba(255,255,255,${baseIntensity * glowStops.MIDDLE * scatterIntensity})`);
            scatterGlow.addColorStop(1, 'rgba(0,0,0,0)');
            
            this.drawGlow(ctx, scatterGlow, radius);
        };


        nodeType.prototype.createMainGlow = function(ctx, params) {
            const { radius, intensity, config, tempAdjust, stops } = params;
            const mainGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
            

            const MC = RENDER_CONSTANTS.MAIN_GLOW;
            const adjustedColor = {
                r: Math.min(255, config.mainColor.r + (tempAdjust * MC.TEMPERATURE_ADJUSTMENT.RED_FACTOR)),
                g: Math.min(255, config.mainColor.g + (tempAdjust * MC.TEMPERATURE_ADJUSTMENT.GREEN_FACTOR)),
                b: Math.min(255, config.mainColor.b + (tempAdjust * MC.TEMPERATURE_ADJUSTMENT.BLUE_FACTOR))
            };
            

            stops.forEach(stop => {
                mainGlow.addColorStop(stop.position, 
                    `rgba(${adjustedColor.r},${adjustedColor.g},${adjustedColor.b},${intensity * stop.opacity})`
                );
            });
            
            return mainGlow;
        };


        nodeType.prototype.createInnerRing = function(ctx, radius, intensity) {
            const innerRing = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius * 0.4);
            
            innerRing.addColorStop(0, `rgba(255,255,255,${intensity * 0.4})`);
            innerRing.addColorStop(0.5, `rgba(255,255,255,${intensity * 0.2})`);
            innerRing.addColorStop(1, 'rgba(0,0,0,0)');
            
            return innerRing;
        };


        nodeType.prototype.createCoatingReflection = function(ctx, params) {
            const { radius, intensity, config, coatingQuality, colorBlend } = params;
            const coatingReflection = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.2);
            

            const coatingColor = {
                r: config.mainColor.r * colorBlend.PRIMARY + config.secondaryColor.r * colorBlend.SECONDARY,
                g: config.mainColor.g * colorBlend.PRIMARY + config.secondaryColor.g * colorBlend.SECONDARY,
                b: config.mainColor.b * colorBlend.PRIMARY + config.secondaryColor.b * colorBlend.SECONDARY
            };
            
            const CC = RENDER_CONSTANTS.COATING;
            coatingReflection.addColorStop(0, `rgba(${coatingColor.r},${coatingColor.g},${coatingColor.b},${intensity * CC.BASE_OPACITY * coatingQuality})`);
            coatingReflection.addColorStop(0.6, `rgba(${coatingColor.r},${coatingColor.g},${coatingColor.b},${intensity * CC.SECONDARY_OPACITY * coatingQuality})`);
            coatingReflection.addColorStop(1, 'rgba(0,0,0,0)');
            
            return coatingReflection;
        };


        nodeType.prototype.createSpectralGradient = function(ctx, params) {
            const { innerRadius, outerRadius, hue, intensity } = params;
            const gradient = ctx.createRadialGradient(0, 0, innerRadius, 0, 0, outerRadius);
            
            gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0)`);
            gradient.addColorStop(0.5, `hsla(${hue}, 100%, 50%, ${intensity})`);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            return gradient;
        };


        nodeType.prototype.renderDetailRing = function(ctx, params) {
            const { radius, intensity, ringIndex, totalRings } = params;
            const DC = RENDER_CONSTANTS.DIFFRACTION;
            const hue = (ringIndex / totalRings) * 360;
            
            const detailRingGlow = ctx.createRadialGradient(
                0, 0, radius * DC.DETAIL_RING_INNER,
                0, 0, radius * DC.DETAIL_RING_OUTER
            );
            
            detailRingGlow.addColorStop(0, `hsla(${hue}, 100%, 50%, 0)`);
            detailRingGlow.addColorStop(0.5, `hsla(${hue}, 100%, 50%, ${intensity})`);
            detailRingGlow.addColorStop(1, 'rgba(0,0,0,0)');
            
            this.drawGlow(ctx, detailRingGlow, radius * DC.DETAIL_RING_OUTER);
        };


        nodeType.prototype.drawGlow = function(ctx, gradient, radius) {
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill();
        };


        nodeType.prototype.onPropertyChanged = function(property, value) {
            if (property === "starburst_color") {

                this.setDirtyCanvas(true);
                if (this.graph) {
                    this.graph.setDirtyCanvas(true, true);
                }
            }
        };

    }
});