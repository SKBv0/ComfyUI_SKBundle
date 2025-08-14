import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";
import {
    FLARE_TYPES,
    DEFAULT_FLARE_CONFIGS,
    BLEND_MODES,
    DEFAULT_WIDGET_VALUES,
    SLIDER_RANGES,
    SLIDER_CATEGORIES,
    NODE_UI_CONSTANTS,
    SLIDER_CONFIG,
    ATMOSPHERIC_EFFECTS,
    CINEMATIC_LIGHT,
    STARBURST_STYLES,
    GRADIENT_HELPERS,
    COLOR_UTILITIES,
    GHOST_PRESETS,
    VECTOR_UTILS,
    RENDER_CONSTANTS,
    FORMAT_HELPERS,
    UI_HELPERS,
    UI_STYLES
} from "./LensFlareConfig.js";

app.registerExtension({
    name: "ComfyUI.SKBundle.LensFlare",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name !== "LensFlare") return;

        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function() {
            const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
            
            
            this.UI_CONSTANTS = {
                PADDING: 20,
                SECTION_SPACING: 25,
                PREVIEW_HEIGHT: 320,
                HEADER_HEIGHT: 40,
                CONTROL_HEIGHT: 30,
                SLIDER_WIDTH: 360,
                DIALOG_HEADER_HEIGHT: 40
            };

            
            this.dialog = {
                isOpen: false,
                position: { x: 0, y: 0 },
                size: { width: 400, height: 500 },
                isDragging: false,
                dragOffset: { x: 0, y: 0 }
            };

            
            this.isDragging = false;
            this.isPointerOver = false;
            this.offscreenCanvas = document.createElement('canvas');
            
            
            if (!this.widgets || !this.widgets.length) {
                this.addWidget("combo", "flare_type", this.properties.flare_type || "50MM_PRIME", function(v) { this.properties.flare_type = v; }, { values: Object.keys(FLARE_TYPES) });
                this.addWidget("combo", "blend_mode", this.properties.blend_mode || "screen", function(v) { this.properties.blend_mode = v; }, { values: Object.keys(BLEND_MODES) });
                this.addWidget("string", "canvas_image", "", function(v) { this.properties.canvas_image = v; }, { hidden: true });
                
                
                Object.entries(DEFAULT_WIDGET_VALUES).forEach(([key, defaultValue]) => {
                    if (key !== 'flare_type' && key !== 'blend_mode' && key !== 'canvas_image') {
                        const range = SLIDER_RANGES[key] || { min: 0, max: 1, step: 0.01 };
                        this.addWidget("number", key, defaultValue, function(v) { this.properties[key] = v; }, range);
                    }
                });
            }

            
            this.widgets.forEach(w => {
                w.hidden = true;
            });

            
            this.properties = this.properties || {};
            Object.assign(this.properties, DEFAULT_WIDGET_VALUES);
            this.properties.flare_type = this.properties.flare_type || "50MM_PRIME";

            
            const defaultConfig = DEFAULT_FLARE_CONFIGS[this.properties.flare_type];
            if (defaultConfig) {
                const initialMainColor = defaultConfig.mainColor || { r: 255, g: 255, b: 255 };
                const initialSecondaryColor = defaultConfig.secondaryColor || { r: 255, g: 255, b: 255 };
                const initialGhostColor = defaultConfig.ghostColor || { r: 255, g: 255, b: 255 };

                this.properties.main_color = [initialMainColor.r, initialMainColor.g, initialMainColor.b];
                this.properties.secondary_color = [initialSecondaryColor.r, initialSecondaryColor.g, initialSecondaryColor.b];
                this.properties.starburst_color = [initialMainColor.r, initialMainColor.g, initialMainColor.b];
                this.properties.ghost_color = [initialGhostColor.r, initialGhostColor.g, initialGhostColor.b];

                this.ghostCount = defaultConfig.ghostCount;
                this.ghostSpacing = defaultConfig.ghostSpacing;
                this.ghostSizes = defaultConfig.ghostSizes;
                this.ghostOpacities = defaultConfig.ghostOpacities;
                this.anamorphicStretch = defaultConfig.anamorphicStretch;
            }

            
            this._staticDustParticles = {};

            this.serialize_widgets = true;
            this.onConnectionsChange = this._handleConnectionsChange.bind(this);
            
            // Instance-level onMouseDown for edit/refresh controls and dialog
            this.onMouseDown = function(e, local_pos) {
                if (!local_pos) return false;
                
                // Edit button
                if (this.editButtonBounds && UI_HELPERS.isInBounds(local_pos[0], local_pos[1], this.editButtonBounds)) {
                    this.openFlareDialog();
                    return true;
                }
                
                // Dialog interactions
                if (this.dialog && this.dialog.isOpen) {
                    return true; // Prevent dragging in dialog area
                }
                
                // Refresh button
                if (this.refreshButtonBounds) {
                    const distance = Math.sqrt(
                        Math.pow(local_pos[0] - this.refreshButtonBounds.centerX, 2) + 
                        Math.pow(local_pos[1] - this.refreshButtonBounds.centerY, 2)
                    );
                    if (distance <= this.refreshButtonBounds.radius) {
                        const inputLink = this.getInputLink(0);
                        if (inputLink) {
                            const inputNode = this.graph.getNodeById(inputLink.origin_id);
                            if (inputNode) {
                                if (inputNode.imgs && inputNode.imgs.length > 0) {
                                    this.currentImage = inputNode.imgs[0];
                                    this._initializeDefaultSettingsIfNeeded();
                                    this.setDirtyCanvas(true);
                                } else if (inputNode.imageData) {
                                    const img = new Image();
                                    img.onload = () => {
                                        this.currentImage = img;
                                        this._initializeDefaultSettingsIfNeeded();
                                        this.setDirtyCanvas(true);
                                    };
                                    img.onerror = () => console.error("Preview image load error");
                                    img.src = inputNode.imageData;
                                }
                            }
                        }
                        return true;
                    }
                }
                
                return false; // Allow dragging in empty areas
            }.bind(this);
            
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
                
                const initialMainColor = defaultConfig.mainColor || { r: 255, g: 255, b: 255 };
                const initialSecondaryColor = defaultConfig.secondaryColor || { r: 255, g: 255, b: 255 };
                const initialGhostColor = defaultConfig.ghostColor || { r: 255, g: 255, b: 255 };

                this.properties.main_color = [initialMainColor.r, initialMainColor.g, initialMainColor.b];
                this.properties.secondary_color = [initialSecondaryColor.r, initialSecondaryColor.g, initialSecondaryColor.b];
                this.properties.starburst_color = [initialMainColor.r, initialMainColor.g, initialMainColor.b]; 
                this.properties.ghost_color = [initialGhostColor.r, initialGhostColor.g, initialGhostColor.b];

                
                this.ghostCount = defaultConfig.ghostCount;
                this.ghostSpacing = defaultConfig.ghostSpacing;
                this.ghostSizes = defaultConfig.ghostSizes;
                this.ghostOpacities = defaultConfig.ghostOpacities;
                this.anamorphicStretch = defaultConfig.anamorphicStretch;
            }
            
            
            this._staticDustParticles = {}; 
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


        nodeType.prototype._handleConnectionsChange = function() {
            if (!this.graph) {
                return;
            }
            const inputLink = this.getInputLink(0);
            if (inputLink) {
                const inputNode = this.graph ? this.graph.getNodeById(inputLink.origin_id) : null;
                if (inputNode) {
                    if (inputNode.imgs && inputNode.imgs.length > 0) {
                        this.currentImage = inputNode.imgs[0];
                        this._initializeDefaultSettingsIfNeeded();
                        if (this.graph) this.setDirtyCanvas(true);
                    } else if (inputNode.imageData) {
                        const img = new Image();
                        img.onload = () => {
                            this.currentImage = img;
                            this._initializeDefaultSettingsIfNeeded();
                            if (this.graph) this.setDirtyCanvas(true);
                        };
                        img.onerror = () => console.error("Preview image load error");
                        img.src = UI_HELPERS.imageDataToUrl(inputNode.imageData);
                    }
                }
            } else {
                this.currentImage = null;
                this.imgs = [];
                if (this.graph) this.setDirtyCanvas(true);
            }
        };

        
        nodeType.prototype._initializeDefaultSettingsIfNeeded = function() {
            if (!this.properties.position_x) {
                this.properties.position_x = 0.5;
                this.properties.position_y = 0.5;
                this.properties.size = 1.0;
                this.properties.intensity = 1.0;
                this.properties.rotation = 0;
                this.properties.blend_mode = 'screen';
            }
        };

        this.onPropertyChanged = function(property, value) {
            
            this.properties[property] = value;
            
            
            if (this.widgets) {
                const widget = this.widgets.find(w => w.name === property);
                if (widget) {
                    widget.value = value;
                }
            }
            
            
            if (property.endsWith('_color')) {
                this._cachedCanvas = null;
                this._lastRenderConfig = null;
            }
            
            
            this.setDirtyCanvas(true);
            if (this.graph) {
                this.graph.setDirtyCanvas(true, true);
                requestAnimationFrame(() => {
                    this.graph.runStep();
                    this.graph.change();
                });
            }
        };

        nodeType.prototype.setupColorPicker = function(dialog, pickerType, defaultColor) {
            const colorPicker = dialog.querySelector(`#${pickerType}ColorPicker`);
            if (colorPicker) {
                
                const rgbArray = this.properties[pickerType + '_color'] || defaultColor;
                const hexColor = '#' + rgbArray.map(c => {
                    const hex = Math.round(c).toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                }).join('');
                
                colorPicker.value = hexColor;
                
                colorPicker.addEventListener('input', (e) => {
                    const color = e.target.value;
                    const r = parseInt(color.substr(1,2), 16);
                    const g = parseInt(color.substr(3,2), 16);
                    const b = parseInt(color.substr(5,2), 16);
                    
                    
                    this.properties[pickerType + '_color'] = [r, g, b];
                    
                    
                    const widget = this.widgets?.find(w => w.name === pickerType + '_color');
                    if (widget) {
                        widget.value = [r, g, b];
                    }
                    
                    
                    const hexDisplay = e.target.nextElementSibling;
                    if (hexDisplay) {
                        hexDisplay.textContent = color.toUpperCase();
                    }
                    
                    
                    this._cachedCanvas = null;
                    this._lastRenderConfig = null;
                    this.setDirtyCanvas(true);
                    
                    
                    if (this.graph) {
                        this.graph.setDirtyCanvas(true, true);
                        requestAnimationFrame(() => {
                            this.graph.runStep();
                            this.graph.change();
                        });
                    }
                });
            }
        };

        nodeType.prototype.onExecuted = function(message) {
            if (message?.imgs && message.imgs.length > 0) {
                this.currentImage = message.imgs[0];
                
                this._cachedCanvas = null;
                this._lastRenderConfig = null;
                this.setDirtyCanvas(true);
                
                
                if (this.widgets) {
                    this.widgets.forEach(w => {
                        if (w.name in this.properties) {
                            w.value = this.properties[w.name];
                        }
                    });
                }

                
                requestAnimationFrame(() => {
                    if (this.graph) {
                        this.graph.setDirtyCanvas(true, true);
                        this.graph.runStep();
                        this.graph.change();
                    }
                });
            }
        };

        nodeType.prototype.onDrawForeground = function(ctx) {
            if (this.flags.collapsed) return;

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

            if (this.editButtonBounds && UI_HELPERS.isInBounds(local_pos[0], local_pos[1], this.editButtonBounds)) {
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
                    if (UI_HELPERS.isInBounds(local_pos[0], local_pos[1], {
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
                    const inputLink = this.getInputLink(0);
                    if (inputLink) {
                        const inputNode = this.graph.getNodeById(inputLink.origin_id);
                        if (inputNode) {
                            if (inputNode.imgs && inputNode.imgs.length > 0) {
                                this.currentImage = inputNode.imgs[0];
                                this._initializeDefaultSettingsIfNeeded();
                                this.setDirtyCanvas(true);
                            } else if (inputNode.imageData) {
                                const img = new Image();
                                img.onload = () => {
                                    this.currentImage = img;
                                    this._initializeDefaultSettingsIfNeeded();
                                    this.setDirtyCanvas(true);
                                };
                                img.onerror = () => console.error("Preview image load error");
                                img.src = UI_HELPERS.imageDataToUrl(inputNode.imageData);
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
                if (UI_HELPERS.isInBounds(local_pos[0], local_pos[1], intensitySlider)) {
                    this.activeSlider = "intensity";
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
            
            const offscreen = document.createElement('canvas');
            offscreen.width = ctx.canvas.width * scale;
            offscreen.height = ctx.canvas.height * scale;
            const offCtx = offscreen.getContext('2d', {
                alpha: true,
                willReadFrequently: false
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
            
            ghostGlow.addColorStop(0, FORMAT_HELPERS.createColorString(ghostColor, opacity));
            ghostGlow.addColorStop(0.5, FORMAT_HELPERS.createColorString(ghostColor, opacity * 0.7));
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
                return;
            }

            const safeRadius = Math.min(Math.abs(radius), 1000);
            const safeDensity = Math.min(Math.floor(density), 50);
            
            
            const dustKey = `${Math.round(centerX)}_${Math.round(centerY)}_${Math.round(safeRadius)}_${safeDensity}`;
            
            
            if (!this._staticDustParticles[dustKey]) {
                this._staticDustParticles[dustKey] = [];
                
                for (let i = 0; i < safeDensity; i++) {
                    
                    const seed = i / safeDensity; 
                    const angleInDegrees = seed * 360; 
                    
                    
                    const { x: offsetX, y: offsetY } = VECTOR_UTILS.polarToCartesian(
                        (seed * 0.8 + 0.2) * safeRadius, 
                        angleInDegrees
                    );
                    
                    const x = Math.max(-10000, Math.min(10000, centerX + offsetX));
                    const y = Math.max(-10000, Math.min(10000, centerY + offsetY));
                    const safeSize = Math.max(0.1, Math.min(100, (seed * 0.5 + 0.5) * safeRadius * 0.2)); 
                    
                    if (isFinite(x) && isFinite(y) && isFinite(safeSize)) {
                        
                        this._staticDustParticles[dustKey].push({
                            x, y, size: safeSize, 
                            opacityFactor: 0.3 + (seed * 0.7) 
                        });
                    }
                }
            }
            
            
            this._staticDustParticles[dustKey].forEach(particle => {
                try {
                    const dustGlow = ctx.createRadialGradient(
                        particle.x, particle.y, 0, 
                        particle.x, particle.y, particle.size
                    );
                    
                    if (color === 'white') {
                        const safeOpacity = Math.min(1, Math.max(0, opacity * particle.opacityFactor));
                        dustGlow.addColorStop(0, `rgba(255,255,255,${safeOpacity})`);
                    } else {
                        const colorValues = {
                            red: [255, 50, 50],
                            green: [50, 255, 50],
                            blue: [50, 50, 255]
                        };
                        const [r, g, b] = colorValues[color] || [255, 255, 255];
                        const safeOpacity = Math.min(1, Math.max(0, opacity * particle.opacityFactor));
                        dustGlow.addColorStop(0, FORMAT_HELPERS.createColorString([r, g, b], safeOpacity));
                    }
                    
                    dustGlow.addColorStop(1, 'rgba(0,0,0,0)');

                    ctx.fillStyle = dustGlow;
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fill();
                } catch (error) {
                    
                }
            });
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
            const { inner_glow, outer_glow } = this.properties;
            const mainColor = this.properties.main_color || [255, 255, 255];
            
            
            const layers = [];
            
            
            const innerCore = {
                    blend: 'screen',
                render: (ctx) => {
                    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.8);
                    gradient.addColorStop(0, FORMAT_HELPERS.createColorString(mainColor, intensity));
                    gradient.addColorStop(0.6, FORMAT_HELPERS.createColorString(mainColor, intensity * 0.7));
                    gradient.addColorStop(1, 'rgba(0,0,0,0)');
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
                    ctx.fill();
                }
            };
            
            layers.push(innerCore);
            
            
            if (outer_glow > 0) {
                const outerGlow = {
                    blend: 'screen',
                    render: (ctx) => {
                        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.5);
                        gradient.addColorStop(0, FORMAT_HELPERS.createColorString(mainColor, intensity * 0.8 * outer_glow));
                        gradient.addColorStop(0.5, FORMAT_HELPERS.createColorString(mainColor, intensity * 0.4 * outer_glow));
                        gradient.addColorStop(1, 'rgba(0,0,0,0)');
                        
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                };
                
                layers.push(outerGlow);
            }
            
            
            if (inner_glow > 0) {
                const innerHighlight = {
                    blend: 'screen',
                    render: (ctx) => {
                        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.5);
                        gradient.addColorStop(0, FORMAT_HELPERS.createColorString(mainColor, intensity * inner_glow));
                        gradient.addColorStop(1, 'rgba(0,0,0,0)');
                        
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                };
                
                layers.push(innerHighlight);
            }
            
            return layers;
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
                
                
                const variationFactor = 0.8 + ((i % 5) / 5) * 0.4; 
                const rayLength = radius * settings.rayLength * variationFactor;
                
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
            if (!this.size || this.size[1] <= 0) return;

            const { PADDING, HEADER_HEIGHT } = this.UI_CONSTANTS;
            const buttonHeight = 40; 
            
            const previewArea = {
                x: PADDING,
                y: HEADER_HEIGHT + PADDING,
                width: this.size[0] - 2 * PADDING,
                height: this.size[1] - HEADER_HEIGHT - (3 * PADDING) - buttonHeight
            };

            if (previewArea.height <= 0) return;

            
            if (!this.currentImage) {
                this.drawEmptyStatePlaceholder(ctx, previewArea);
                return;
            }

            const imageAspect = this.currentImage.width / this.currentImage.height;
            const previewAspect = previewArea.width / previewArea.height;
            
            let drawWidth, drawHeight, offsetX, offsetY;

            if (imageAspect > previewAspect) {
                drawWidth = previewArea.width;
                drawHeight = previewArea.width / imageAspect;
                offsetX = previewArea.x;
                offsetY = previewArea.y + (previewArea.height - drawHeight) / 2;
            } else {
                drawHeight = previewArea.height;
                drawWidth = previewArea.height * imageAspect;
                offsetX = previewArea.x + (previewArea.width - drawWidth) / 2;
                offsetY = previewArea.y;
            }

            const currentConfig = {
                width: drawWidth,
                height: drawHeight,
                position_x: this.properties.position_x,
                position_y: this.properties.position_y,
                size: this.properties.size,
                intensity: this.properties.intensity,
                rotation: this.properties.rotation,
                blend_mode: this.properties.blend_mode
            };

            if (this._cachedCanvas && this._lastRenderConfig && 
                JSON.stringify(currentConfig) === JSON.stringify(this._lastRenderConfig)) {
                ctx.drawImage(this._cachedCanvas, offsetX, offsetY, drawWidth, drawHeight);
                return;
            }

            if (!this._cachedCanvas) {
                this._cachedCanvas = document.createElement('canvas');
            }
            
            this._cachedCanvas.width = this.currentImage.width;
            this._cachedCanvas.height = this.currentImage.height;
            
            const offCtx = this._cachedCanvas.getContext('2d', {
                alpha: true,
                willReadFrequently: false,
                desynchronized: true
            });

            this.renderToContext(offCtx, {
                ...currentConfig,
                width: this.currentImage.width,
                height: this.currentImage.height
            });

            this._lastRenderConfig = currentConfig;

            ctx.save();
            ctx.beginPath();
            ctx.rect(previewArea.x, previewArea.y, previewArea.width, previewArea.height);
            ctx.clip();
            ctx.drawImage(this._cachedCanvas, offsetX, offsetY, drawWidth, drawHeight);
            ctx.restore();

            
            if (this.widgets) {
                const canvasImageWidget = this.widgets.find(w => w.name === 'canvas_image');
                if (canvasImageWidget) {
                    const base64Image = this.optimizeBase64Image(this._cachedCanvas);
                    if (base64Image) {
                        canvasImageWidget.value = base64Image;
                    }
                }

                
                this.widgets.forEach(w => {
                    if (w.name !== 'canvas_image' && w.name in this.properties) {
                        w.value = this.properties[w.name];
                    }
                });

                if (this.graph) {
                    this.graph.change();
                }
            }
        };

        
        nodeType.prototype.drawEmptyStatePlaceholder = function(ctx, previewArea) {
            ctx.save();
            
            ctx.beginPath();
            ctx.roundRect(previewArea.x, previewArea.y, previewArea.width, previewArea.height, 8);
            ctx.fillStyle = "rgba(255,255,255,0.02)";
            ctx.fill();

            ctx.strokeStyle = "rgba(255,255,255,0.08)";
            ctx.setLineDash([6, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            const cx = previewArea.x + previewArea.width / 2;
            const cy = previewArea.y + previewArea.height / 2;
            const r = Math.min(previewArea.width, previewArea.height) * 0.12;

            ctx.strokeStyle = "rgba(130, 170, 255, 0.7)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();

            for (let i = 0; i < 6; i++) {
                const angle = i * Math.PI / 3;
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(angle) * (r + 2), cy + Math.sin(angle) * (r + 2));
                ctx.lineTo(cx + Math.cos(angle) * (r + 10), cy + Math.sin(angle) * (r + 10));
                ctx.stroke();
            }

            

            ctx.restore();
        };

        
        nodeType.prototype.renderToContext = function(ctx, config) {
            if (!this.currentImage) return;

            
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            
            
            ctx.drawImage(this.currentImage, 0, 0, ctx.canvas.width, ctx.canvas.height);

            
            const imageWidth = ctx.canvas.width;
            const imageHeight = ctx.canvas.height;
            const maxDimension = Math.max(imageWidth, imageHeight);

            
            const centerX = imageWidth * config.position_x;
            const centerY = imageHeight * config.position_y;
            
            
            const flareSize = config.size * (maxDimension * 0.5);
            const rotation = config.rotation * Math.PI / 180;

            
            const tempCanvas = document.createElement('canvas');
            const scale = Math.min(1, Math.max(0.5, 2048 / maxDimension));
            tempCanvas.width = imageWidth * scale;
            tempCanvas.height = imageHeight * scale;
            
            const tempCtx = tempCanvas.getContext('2d', {
                alpha: true,
                willReadFrequently: false,
                desynchronized: true
            });

            
            tempCtx.save();
            tempCtx.scale(scale, scale);
            this.renderAdvancedFlare(
                tempCtx, 
                centerX * scale,
                centerY * scale,
                flareSize * scale,
                config.intensity,
                rotation
            );
            tempCtx.restore();

            
            ctx.globalCompositeOperation = config.blend_mode || 'screen';
            ctx.drawImage(tempCanvas, 0, 0, imageWidth, imageHeight);
            ctx.globalCompositeOperation = 'source-over';

            
            tempCanvas.remove();
        };

        
        nodeType.prototype.updateCanvasAndGraph = function() {
            
            this._cachedCanvas = null;
            this._lastRenderConfig = null;

            
            this.setDirtyCanvas(true);
            
            if (this.graph) {
                this.graph.setDirtyCanvas(true, true);
                
                
                if (this.widgets) {
                    this.widgets.forEach(w => {
                        if (w.name in this.properties) {
                            w.value = this.properties[w.name];
                        }
                    });
                }
                
                
                requestAnimationFrame(() => {
                    this.graph.runStep();
                    this.graph.change();
                });
            }
        };

        nodeType.prototype.drawEditButton = function(ctx) {
            const { PADDING, HEADER_HEIGHT } = this.UI_CONSTANTS;
            
            
            
            const editButtonWidth = 80;
            const buttonHeight = 30;
            const buttonSpacing = 10;
            const iconSize = 16;
            
            
            const bottomPadding = 12;
            const y = this.size[1] - buttonHeight - bottomPadding;
            
            
            
            const refreshX = PADDING + 8;
            const refreshY = y;
            
            
            ctx.save();
            
            
            ctx.fillStyle = "rgba(255,255,255,0.03)";
            ctx.beginPath();
            ctx.arc(refreshX + iconSize/2, refreshY + buttonHeight/2, iconSize/2 + 4, 0, Math.PI * 2);
            ctx.fill();
            
            
            ctx.strokeStyle = "rgba(255,255,255,0.5)";
            ctx.lineWidth = 1.5;
            
            
            ctx.beginPath();
            ctx.arc(refreshX + iconSize/2, refreshY + buttonHeight/2, iconSize/3, 0.3 * Math.PI, 1.8 * Math.PI);
            ctx.stroke();
            
            
            const arrowX = refreshX + iconSize/2 + Math.cos(0.3 * Math.PI) * (iconSize/3);
            const arrowY = refreshY + buttonHeight/2 + Math.sin(0.3 * Math.PI) * (iconSize/3);
            
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(arrowX - 3, arrowY - 2);
            ctx.lineTo(arrowX - 1, arrowY + 3);
            ctx.closePath();
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.fill();
            
            ctx.restore();
            
            
            this.refreshButtonBounds = {
                x: refreshX - iconSize/2,
                y: refreshY,
                width: iconSize + 8,
                height: buttonHeight,
                centerX: refreshX + iconSize/2,
                centerY: refreshY + buttonHeight/2,
                radius: iconSize/2 + 4
            };
            
            
            
            const editX = this.size[0] - editButtonWidth - PADDING;
            
            ctx.save();
            
            
            const isHovering = this.isPointerOver && 
                              this.editButtonBounds && 
                              UI_HELPERS.isInBounds(
                                  this.graph.canvas.last_mouse[0], 
                                  this.graph.canvas.last_mouse[1], 
                                  this.editButtonBounds
                              );
            
            
            const normalColor = "rgba(255,255,255,0.06)";
            const hoverColor = "rgba(255,255,255,0.12)";
            ctx.fillStyle = isHovering ? hoverColor : normalColor;
            
            
            ctx.beginPath();
            ctx.roundRect(editX, y, editButtonWidth, buttonHeight, 4);
            ctx.fill();
            
            
            const accentGradient = ctx.createLinearGradient(editX, y + buttonHeight - 1, editX + editButtonWidth, y + buttonHeight - 1);
            accentGradient.addColorStop(0, "rgba(130, 170, 255, 0.2)");
            accentGradient.addColorStop(0.5, "rgba(130, 170, 255, 0.5)");
            accentGradient.addColorStop(1, "rgba(130, 170, 255, 0.2)");
            
            ctx.fillStyle = accentGradient;
            ctx.fillRect(editX, y + buttonHeight - 1, editButtonWidth, 1);
            
            
            ctx.fillStyle = "rgba(255,255,255,0.8)";
            ctx.font = "400 11px Inter, system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("Edit Flare", editX + editButtonWidth/2, y + buttonHeight/2);
            
            ctx.restore();
            
            
            this.editButtonBounds = {
                x: editX,
                y: y,
                width: editButtonWidth,
                height: buttonHeight
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
            if (this.graph && app?.graph?.canvas) {
                app.graph.canvas.setDirty(true, true);
            }
        };



        nodeType.prototype.openFlareDialog = function() {

            if (this.dialog?.element) {
                document.body.removeChild(this.dialog.element);
            }
            
            const dialog = document.createElement('div');
            dialog.style.cssText = UI_STYLES.DIALOG.MAIN;

            const header = document.createElement('div');
            header.style.cssText = UI_STYLES.DIALOG.HEADER;

            header.innerHTML = `
                <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="
                        width: 24px;
                        height: 24px;
                        border-radius: 5px;
                        background: rgba(74, 158, 255, 0.08);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color: #4a9eff">
                        <circle cx="12" cy="12" r="4"></circle>
                            <path d="M12 3v2m0 14v2M3 12h2m14 0h2" opacity="0.5"></path>
                            <path d="M5.6 5.6l1.4 1.4m10 10l1.4 1.4M5.6 18.4l1.4-1.4m10-10l1.4-1.4" opacity="0.3"></path>
                    </svg>
                </div>
                    <div>
                        <div style="color: #fff; font-weight: 500; font-size: 12px;">Flare Settings</div>
                        <div class="flare-type-subtitle" style="
                            color: #777;
                            font-size: 10px;
                            margin-top: 0;
                            transition: all 0.2s ease;
                        ">${FLARE_TYPES[this.properties.flare_type]}</div>
                    </div>
                </div>
                <div class="close-btn" style="${UI_STYLES.DIALOG.CLOSE_BUTTON}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color: #999">
                        <path d="M18 6L6 18"></path>
                        <path d="M6 6l12 12"></path>
                    </svg>
                </div>
            `;


            const style = document.createElement('style');
            style.textContent = `
                .close-btn:hover {
                    background: rgba(255, 80, 80, 0.1);
                }
                .close-btn:hover svg {
                    color: #ff6666 !important;
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
            content.style.cssText = UI_STYLES.DIALOG.CONTENT;

            content.innerHTML = `
                <div style="${UI_STYLES.GRID.FLEX_COLUMN}">
                    <!-- Top Controls - Restore 3-column grid -->
                    <div style="${UI_STYLES.GRID.COLUMNS_3}">
                        <!-- Color Controls -->
                        <div style="${UI_STYLES.SECTION.CONTROL}">
                            <div class="section-header" style="${UI_STYLES.SECTION.HEADER}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color: #4a9eff;">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M12 2v20M2 12h20"/>
                                </svg>
                                <span style="${UI_STYLES.SECTION.TITLE}">Colors</span>
                            </div>
                            
                            <!-- Color Grid -->
                            <div style="${UI_STYLES.GRID.COLUMNS_2}">
                                <!-- Main Color -->
                                <div class="color-input">
                                    <label style="${UI_STYLES.COLOR.LABEL}">Main Color</label>
                                    <div style="${UI_STYLES.COLOR.INPUT_CONTAINER}">
                                        <input type="color" id="mainColorPicker"
                                            value="${this.rgbToHex({ r: this.properties.main_color[0], g: this.properties.main_color[1], b: this.properties.main_color[2] })}"
                                            style="${UI_STYLES.COLOR.INPUT}"
                                        />
                                        <div style="${UI_STYLES.COLOR.HEX_DISPLAY}">
                                            ${this.rgbToHex({ r: this.properties.main_color[0], g: this.properties.main_color[1], b: this.properties.main_color[2] }).toUpperCase()}
                                        </div>
                                    </div>
                                </div>

                                <!-- Secondary Color -->
                                <div class="color-input">
                                    <label style="${UI_STYLES.COLOR.LABEL}">Secondary Color</label>
                                    <div style="${UI_STYLES.COLOR.INPUT_CONTAINER}">
                                        <input type="color" id="secondaryColorPicker"
                                            value="${this.rgbToHex({ r: this.properties.secondary_color[0], g: this.properties.secondary_color[1], b: this.properties.secondary_color[2] })}"
                                            style="${UI_STYLES.COLOR.INPUT}"
                                        />
                                        <div style="${UI_STYLES.COLOR.HEX_DISPLAY}">
                                            ${this.rgbToHex({ r: this.properties.secondary_color[0], g: this.properties.secondary_color[1], b: this.properties.secondary_color[2] }).toUpperCase()}
                                        </div>
                                    </div>
                                </div>

                                <!-- Starburst Color -->
                                <div class="color-input">
                                    <label style="${UI_STYLES.COLOR.LABEL}">Starburst Color</label>
                                    <div style="${UI_STYLES.COLOR.INPUT_CONTAINER}">
                                        <input type="color" id="starburstColorPicker" 
                                            value="#${this.properties.starburst_color[0].toString(16).padStart(2,'0')}${this.properties.starburst_color[1].toString(16).padStart(2,'0')}${this.properties.starburst_color[2].toString(16).padStart(2,'0')}"
                                            style="${UI_STYLES.COLOR.INPUT}"
                                        />
                                        <div style="${UI_STYLES.COLOR.HEX_DISPLAY}">
                                            #${this.properties.starburst_color[0].toString(16).padStart(2,'0')}${this.properties.starburst_color[1].toString(16).padStart(2,'0')}${this.properties.starburst_color[2].toString(16).padStart(2,'0')}
                                        </div>
                                    </div>
                                </div>

                                <!-- Ghost Color -->
                                <div class="color-input">
                                    <label style="${UI_STYLES.COLOR.LABEL}">Ghost Color</label>
                                    <div style="${UI_STYLES.COLOR.INPUT_CONTAINER}">
                                        <input type="color" id="ghostColorPicker" 
                                            value="#${this.properties.ghost_color[0].toString(16).padStart(2,'0')}${this.properties.ghost_color[1].toString(16).padStart(2,'0')}${this.properties.ghost_color[2].toString(16).padStart(2,'0')}"
                                            style="${UI_STYLES.COLOR.INPUT}"
                                        />
                                        <div style="${UI_STYLES.COLOR.HEX_DISPLAY}">
                                            #${this.properties.ghost_color[0].toString(16).padStart(2,'0')}${this.properties.ghost_color[1].toString(16).padStart(2,'0')}${this.properties.ghost_color[2].toString(16).padStart(2,'0')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Flare Type Selector (Second Column) -->
                        <div style="${UI_STYLES.SECTION.CONTROL}">
                            <div class="section-header" style="${UI_STYLES.SECTION.HEADER}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color: #4a9eff;">
                                    <circle cx="12" cy="12" r="3"/>
                                    <path d="M12 3v2m0 14v2M3 12h2m14 0h2"/>
                                    <path d="M5.6 5.6l1.4 1.4m10 10l1.4 1.4M5.6 18.4l1.4-1.4m10-10l1.4-1.4" opacity="0.5"/>
                                </svg>
                                <span style="${UI_STYLES.SECTION.TITLE}">Flare Type</span>
                            </div>
                            <div class="flare-types" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(30px, 1fr)); gap: 4px;">
                                ${Object.entries(FLARE_TYPES).map(([key, value]) => `
                                    <button class="flare-type-btn ${this.properties.flare_type === key ? 'active' : ''}" 
                                        data-type="${key}"
                                        title="${value}"
                                        style="
                                            width: 24px;
                                            height: 24px;
                                            background: ${this.properties.flare_type === key ? 'rgba(74, 158, 255, 0.1)' : 'rgba(0,0,0,0.2)'};
                                            border: 1px solid ${this.properties.flare_type === key ? '#4a9eff' : 'rgba(255,255,255,0.05)'};
                                            border-radius: 4px;
                                            cursor: pointer;
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            transition: all 0.2s;
                                            padding: 0;
                                        ">
                                        <div style="
                                            width: 12px;
                                            height: 12px;
                                            border-radius: 50%;
                                            background: rgb(${DEFAULT_FLARE_CONFIGS[key].mainColor.r},${DEFAULT_FLARE_CONFIGS[key].mainColor.g},${DEFAULT_FLARE_CONFIGS[key].mainColor.b});
                                            box-shadow: 0 0 6px rgb(${DEFAULT_FLARE_CONFIGS[key].mainColor.r},${DEFAULT_FLARE_CONFIGS[key].mainColor.g},${DEFAULT_FLARE_CONFIGS[key].mainColor.b});
                                            opacity: 0.8;
                                            transition: opacity 0.2s;
                                        "></div>
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                        
                        <!-- Blend Mode Selector (Third Column) -->
                        <div style="${UI_STYLES.SECTION.CONTROL}">
                            <div class="section-header" style="${UI_STYLES.SECTION.HEADER}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color: #4a9eff;">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                                </svg>
                                <span style="${UI_STYLES.SECTION.TITLE}">Blend Mode</span>
                            </div>
                            <div class="blend-modes" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px;">
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
                                            padding: 3px;
                                            border-radius: 4px;
                                            color: ${this.properties.blend_mode === value ? '#fff' : '#888'};
                                            cursor: pointer;
                                            font-size: 10px;
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

                    <!-- Slider Categories -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
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
                

                this.properties.main_color = [r, g, b];
                

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
                

                this.updateCanvasAndGraph();
            });


            secondaryColorPicker.addEventListener('input', (e) => {
                const color = e.target.value;
                const r = parseInt(color.substr(1,2), 16);
                const g = parseInt(color.substr(3,2), 16);
                const b = parseInt(color.substr(5,2), 16);
                

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
                

                this.updateCanvasAndGraph();
            });


            dialog.appendChild(style);


            this.setupDialogEventListeners(dialog);


            document.body.appendChild(dialog);
            

            const rect = dialog.getBoundingClientRect();
            

            
            this.setupColorPicker(dialog, 'main', [255, 255, 255]);
            this.setupColorPicker(dialog, 'secondary', [255, 255, 255]);
            this.setupColorPicker(dialog, 'starburst', [255, 255, 255]);
            this.setupColorPicker(dialog, 'ghost', [255, 255, 255]);
        };


        nodeType.prototype.setupDialogEventListeners = function(dialog) {
            
            const mainColorPicker = dialog.querySelector('#mainColorPicker');
            const secondaryColorPicker = dialog.querySelector('#secondaryColorPicker');
            const starburstColorPicker = dialog.querySelector('#starburstColorPicker');
            const ghostColorPicker = dialog.querySelector('#ghostColorPicker');

            
            const flareTypeButtons = dialog.querySelectorAll('.flare-type-btn');
            flareTypeButtons.forEach(btn => {
                btn.onclick = () => {
                    const selectedType = btn.dataset.type;
                    this.properties.flare_type = selectedType;

                    const config = DEFAULT_FLARE_CONFIGS[selectedType];
                    if (config) {
                        
                        const mainColor = config.mainColor || { r: 255, g: 255, b: 255 };
                        const secondaryColor = config.secondaryColor || { r: 255, g: 255, b: 255 };
                        const ghostColor = config.ghostColor || { r: 255, g: 255, b: 255 };

                        
                        this.properties.main_color = [mainColor.r, mainColor.g, mainColor.b];
                        this.properties.secondary_color = [secondaryColor.r, secondaryColor.g, secondaryColor.b];
                        this.properties.ghost_color = [ghostColor.r, ghostColor.g, ghostColor.b];
                        this.properties.starburst_color = [mainColor.r, mainColor.g, mainColor.b];

                        
                        this.ghostCount = config.ghostCount;
                        this.ghostSpacing = config.ghostSpacing;
                        this.ghostSizes = config.ghostSizes;
                        this.ghostOpacities = config.ghostOpacities;
                        this.anamorphicStretch = config.anamorphicStretch;

                        
                        const mainColorPicker = dialog.querySelector('#mainColorPicker');
                        const secondaryColorPicker = dialog.querySelector('#secondaryColorPicker');
                        const starburstColorPicker = dialog.querySelector('#starburstColorPicker');
                        const ghostColorPicker = dialog.querySelector('#ghostColorPicker');

                        if (mainColorPicker) {
                            const mainHex = this.rgbToHex(mainColor);
                            mainColorPicker.value = mainHex;
                            const hexDisplay = mainColorPicker.nextElementSibling;
                            if (hexDisplay) hexDisplay.textContent = mainHex.toUpperCase();
                        }
                        if (secondaryColorPicker) {
                            const secondaryHex = this.rgbToHex(secondaryColor);
                            secondaryColorPicker.value = secondaryHex;
                            const hexDisplay = secondaryColorPicker.nextElementSibling;
                            if (hexDisplay) hexDisplay.textContent = secondaryHex.toUpperCase();
                        }
                        if (starburstColorPicker) {
                            const starburstHex = this.rgbToHex({ r: this.properties.starburst_color[0], g: this.properties.starburst_color[1], b: this.properties.starburst_color[2] });
                            starburstColorPicker.value = starburstHex;
                            const hexDisplay = starburstColorPicker.nextElementSibling;
                            if (hexDisplay) hexDisplay.textContent = starburstHex.toUpperCase();
                        }
                        if (ghostColorPicker) {
                            const ghostHex = this.rgbToHex({ r: this.properties.ghost_color[0], g: this.properties.ghost_color[1], b: this.properties.ghost_color[2] });
                            ghostColorPicker.value = ghostHex;
                            const hexDisplay = ghostColorPicker.nextElementSibling;
                            if (hexDisplay) hexDisplay.textContent = ghostHex.toUpperCase();
                        }

                        
                        if (config.defaultSettings) {
                            Object.entries(config.defaultSettings).forEach(([key, defaultValue]) => {
                                this.properties[key] = defaultValue;
                                
                                
                                const widget = this.widgets?.find(w => w.name === key);
                                if (widget) {
                                    widget.value = defaultValue;
                                }

                                
                                const slider = dialog.querySelector(`#${key}Slider`);
                                const valueDisplay = dialog.querySelector(`#${key}Value`);
                                if (slider && valueDisplay) {
                                    slider.value = defaultValue;
                                    valueDisplay.textContent = this.formatSliderValue(key, defaultValue);
                                    const range = SLIDER_RANGES[key] || { min: 0, max: 1 };
                                    const percent = ((defaultValue - range.min) / (range.max - range.min)) * 100;
                                    slider.style.background = `linear-gradient(90deg, #4a9eff ${percent}%, rgba(255,255,255,0.1) ${percent}%)`;
                                }
                            });
                        }
                    }

                    
                    flareTypeButtons.forEach(b => {
                        const isActive = b.dataset.type === selectedType;
                        b.classList.toggle('active', isActive);
                        b.style.borderColor = isActive ? '#4a9eff' : 'rgba(255,255,255,0.05)';
                        b.style.background = isActive ? 'rgba(74, 158, 255, 0.1)' : 'rgba(0,0,0,0.2)';
                    });

                    
                    this._cachedCanvas = null;
                    this._lastRenderConfig = null;
                    this.setDirtyCanvas(true);

                    
                    if (this.graph) {
                        this.graph.setDirtyCanvas(true, true);
                        this.graph.runStep();
                        this.graph.change();
                    }

                    const flareTypeSubtitle = dialog.querySelector('.flare-type-subtitle');
                    if (flareTypeSubtitle) {
                        flareTypeSubtitle.textContent = FLARE_TYPES[selectedType];
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
                    
                    this.updateCanvasAndGraph();
                };
            });

            
            const sliders = dialog.querySelectorAll('input[type="range"]');
            sliders.forEach(slider => {
                const updateSliderUI = () => {
                    const value = parseFloat(slider.value);
                    const key = slider.id.replace('Slider', '');
                    
                    
                    const valueDisplay = dialog.querySelector(`#${key}Value`);
                    if (valueDisplay) {
                        valueDisplay.textContent = this.formatSliderValue(key, value);
                    }
                    
                    const percent = ((value - slider.min) / (slider.max - slider.min)) * 100;
                    slider.style.background = `linear-gradient(90deg, 
                        #4a9eff ${percent}%, 
                        rgba(255,255,255,0.1) ${percent}%
                    )`;

                    
                    this.properties[key] = value;

                    
                    if (this.widgets) {
                        const widget = this.widgets.find(w => w.name === key);
                        if (widget) {
                            widget.value = value;
                        }
                    }

                    
                    this._cachedCanvas = null;
                    this._lastRenderConfig = null;
                    this.setDirtyCanvas(true);
                    if (this.graph) {
                        this.graph.setDirtyCanvas(true, true);
                    }
                };

                
                slider.oninput = updateSliderUI;
                slider.onchange = updateSliderUI;
                
                
                updateSliderUI();
            });

            
            if (mainColorPicker) {
                mainColorPicker.addEventListener('input', (e) => {
                    const color = e.target.value;
                    const r = parseInt(color.substr(1,2), 16);
                    const g = parseInt(color.substr(3,2), 16);
                    const b = parseInt(color.substr(5,2), 16);
                    
                    this.properties.main_color = [r, g, b];
                    
                    if (this.widgets) {
                        const mainColorWidget = this.widgets.find(w => w.name === 'main_color');
                        if (mainColorWidget) {
                            mainColorWidget.value = [r, g, b];
                        }
                    }
                    
                    const hexDisplay = e.target.nextElementSibling;
                    if (hexDisplay) {
                        hexDisplay.textContent = color.toUpperCase();
                    }
                    
                    this.updateCanvasAndGraph();
                });
            }

            
            if (secondaryColorPicker) {
                secondaryColorPicker.addEventListener('input', (e) => {
                    const color = e.target.value;
                    const r = parseInt(color.substr(1,2), 16);
                    const g = parseInt(color.substr(3,2), 16);
                    const b = parseInt(color.substr(5,2), 16);
                    
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
                    
                    this.updateCanvasAndGraph();
                });
            }

            
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
                    
                    this.updateCanvasAndGraph();
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
                    
                    this.updateCanvasAndGraph();
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


        nodeType.prototype.rgbToHex = function(color) {
            if (!color) return '#FFFFFF';
            
            try {
                if (Array.isArray(color)) {
                    return '#' + color.map(c => {
                        const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
                        return hex.length === 1 ? '0' + hex : hex;
                    }).join('');
                } else if (typeof color === 'string' && color.startsWith('hsla')) {
                    
                    const matches = color.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%,?\s*(?:\d*\.?\d+)?\)/);
                    if (matches) {
                        const [_, h, s, l] = matches.map(Number);
                        
                        const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100;
                        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
                        const m = l / 100 - c / 2;
                        let [r, g, b] = [0, 0, 0];
                        
                        if (h < 60) [r, g, b] = [c, x, 0];
                        else if (h < 120) [r, g, b] = [x, c, 0];
                        else if (h < 180) [r, g, b] = [0, c, x];
                        else if (h < 240) [r, g, b] = [0, x, c];
                        else if (h < 300) [r, g, b] = [x, 0, c];
                        else [r, g, b] = [c, 0, x];
                        
                        return '#' + [(r + m), (g + m), (b + m)].map(v => {
                            const hex = Math.round(v * 255).toString(16);
                            return hex.length === 1 ? '0' + hex : hex;
                        }).join('');
                    }
                    return '#FFFFFF';
                } else if (typeof color === 'object') {
                    return '#' + [color.r, color.g, color.b].map(c => {
                        const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
                        return hex.length === 1 ? '0' + hex : hex;
                    }).join('');
                }
            } catch (e) {
                console.warn('Color conversion error:', e);
                return '#FFFFFF';
            }
            return '#FFFFFF';
        };

        
        nodeType.prototype.updateCanvasAndGraph = function() {
            this.setDirtyCanvas(true);
            if (this.graph) {
                this.graph.setDirtyCanvas(true, true);
                this.graph.runStep();
                this.graph.change();
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
            return FORMAT_HELPERS.formatSliderValue(key, value);
        };


        nodeType.prototype.generateSlider = function(slider) {
            const value = this.properties[slider.key] || 0;
            const range = SLIDER_RANGES[slider.key] || { min: 0, max: 1, step: 0.01 };
            const percent = ((value - range.min) / (range.max - range.min)) * 100;

            return `
                <div class="slider-group" style="${UI_STYLES.SLIDER_GROUP.CONTAINER}">
                    <div style="${UI_STYLES.SLIDER_GROUP.HEADER}">
                        <label style="${UI_STYLES.SLIDER_GROUP.HEADER_LABEL}">
                            <span style="${UI_STYLES.SLIDER_GROUP.HEADER_ICON}">${slider.icon}</span>
                            ${slider.label}
                        </label>
                        <span style="${UI_STYLES.SLIDER_GROUP.HEADER_VALUE}" id="${slider.key}Value">
                            ${this.formatSliderValue(slider.key, value)}
                        </span>
                    </div>
                    <div class="slider-container" style="${UI_STYLES.SLIDER_GROUP.SLIDER_CONTAINER}">
                        <input type="range"
                            id="${slider.key}Slider"
                            value="${value}"
                            min="${range.min}"
                            max="${range.max}"
                            step="${range.step}"
                            style="${UI_STYLES.SLIDER_GROUP.SLIDER_INPUT}"
                        >
                    </div>
                </div>
            `;
        };


        nodeType.prototype.generateSliderGroups = function() {
            const categories = Object.values(SLIDER_CATEGORIES);
            
            return categories.map(category => `
                <div class="slider-category control-section" style="${UI_STYLES.SLIDER_GROUP.CATEGORY_CONTAINER}">
                    <div class="section-header" style="${UI_STYLES.SLIDER_GROUP.CATEGORY_HEADER}">
                        <span style="${UI_STYLES.SLIDER_GROUP.CATEGORY_HEADER_ICON}">${category.icon || ''}</span>
                        <span style="${UI_STYLES.SLIDER_GROUP.CATEGORY_HEADER_TEXT}">${category.name}</span>
                    </div>
                    <div style="${UI_STYLES.SLIDER_GROUP.CATEGORY_SLIDERS_CONTAINER}">
                        ${category.sliders.map(slider => this.generateSlider(slider)).join('')}
                    </div>
                </div>
            `).join('');
        };


        nodeType.prototype.createGradient = function(ctx, config, x = 0, y = 0) {
            return FORMAT_HELPERS.createGradient(ctx, config, x, y);
        };


        nodeType.prototype.createColorString = function(color, opacity = 1) {
            return FORMAT_HELPERS.createColorString(color, opacity);
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
            return UI_HELPERS.generateDustPattern(ctx, size, params, this.id);
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
            const { RING_COUNT, RING_SPACING, BASE_INTENSITY, INTENSITY_DECAY } = RENDER_CONSTANTS.DIFFRACTION;
            const diffraction_intensity = this.properties.diffraction_intensity;
            
            if (diffraction_intensity <= 0) return;
            
            
            const mainColorRgb = this.properties.main_color || [255, 255, 255];
            
            for (let i = 0; i < RING_COUNT; i++) {
                const ringRadius = radius * (1 + (i * RING_SPACING));
                const intensity_factor = BASE_INTENSITY - (i * INTENSITY_DECAY);
                const opacity = diffraction_intensity * intensity * intensity_factor;
                
                if (opacity <= 0.01) continue;
                
                ctx.beginPath();
                ctx.strokeStyle = FORMAT_HELPERS.createColorString(mainColorRgb, opacity);
                ctx.lineWidth = radius * 0.02;
                ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            
            const innerRingColor = FORMAT_HELPERS.createColorString(mainColorRgb, diffraction_intensity * intensity * 0.3);
            const outerRingColor = FORMAT_HELPERS.createColorString(mainColorRgb, diffraction_intensity * intensity * 0.15);
            
            ctx.lineWidth = radius * 0.005;
            
            
            ctx.beginPath();
            ctx.strokeStyle = innerRingColor;
            ctx.arc(0, 0, radius * RENDER_CONSTANTS.DIFFRACTION.DETAIL_RING_INNER, 0, Math.PI * 2);
            ctx.stroke();
            
            
            ctx.beginPath();
            ctx.strokeStyle = outerRingColor;
            ctx.arc(0, 0, radius * RENDER_CONSTANTS.DIFFRACTION.DETAIL_RING_OUTER, 0, Math.PI * 2);
            ctx.stroke();
        };


        nodeType.prototype.renderAtmosphericScatter = function(ctx, radius, intensity) {
            const scatter_amount = this.properties.atmospheric_scatter;
            
            if (scatter_amount <= 0) return;
            
            const { LAYER_COUNT, BASE_RADIUS, RADIUS_INCREMENT, INTENSITY_DECAY } = RENDER_CONSTANTS.ATMOSPHERIC;
            const mainColorRgb = this.properties.main_color || [255, 255, 255];
            
            for (let i = 0; i < LAYER_COUNT; i++) {
                const layerRadius = radius * (BASE_RADIUS + (i * RADIUS_INCREMENT));
                const layerIntensity = intensity * scatter_amount * (1 - (i * INTENSITY_DECAY));
                
                if (layerIntensity <= 0.01) continue;
                
                const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, layerRadius);
                
                
                glow.addColorStop(0, FORMAT_HELPERS.createColorString(mainColorRgb, layerIntensity * RENDER_CONSTANTS.ATMOSPHERIC.GLOW_STOPS.START));
                glow.addColorStop(0.5, FORMAT_HELPERS.createColorString(mainColorRgb, layerIntensity * RENDER_CONSTANTS.ATMOSPHERIC.GLOW_STOPS.MIDDLE));
                glow.addColorStop(1, FORMAT_HELPERS.createColorString(mainColorRgb, 0)); 
                
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(0, 0, layerRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        };


        nodeType.prototype.renderStarburst = function(ctx, radius, intensity) {
            const rays_count = this.properties.rays_count;
            const ray_length = this.properties.ray_length;
            const ray_thickness = this.properties.ray_thickness;
            const starburst_intensity = this.properties.starburst_intensity;
            
            if (starburst_intensity <= 0 || rays_count <= 0) return;
            
            const starburstColor = this.properties.starburst_color || this.properties.main_color || [255, 255, 255];
            const opacity = starburst_intensity * intensity;
            const angleStep = 360 / rays_count;
            
            const { position_x, position_y, starburst_position_x, starburst_position_y } = this.properties;
            
            
            const starburstCenterX = (starburst_position_x - position_x) * radius * 2;
            const starburstCenterY = (starburst_position_y - position_y) * radius * 2;
            
            ctx.save();
            ctx.translate(starburstCenterX, starburstCenterY);
            
            for (let i = 0; i < rays_count; i++) {
                const angle = i * angleStep;
                
                
                const { x: rayEndX, y: rayEndY } = VECTOR_UTILS.polarToCartesian(
                    radius * ray_length * 2, 
                    angle
                );
                
                
                const ray = ctx.createLinearGradient(0, 0, rayEndX, rayEndY);
                
                
                ray.addColorStop(0, FORMAT_HELPERS.createColorString(starburstColor, opacity));
                ray.addColorStop(0.5, FORMAT_HELPERS.createColorString(starburstColor, opacity * 0.5));
                ray.addColorStop(1, 'rgba(0,0,0,0)');
                
                ctx.strokeStyle = ray;
                ctx.lineWidth = radius * 0.1 * ray_thickness;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(rayEndX, rayEndY);
                ctx.stroke();
            }
            
            ctx.restore();
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

        
        
        nodeType.prototype.computeSize = function() {
            
            let size = LiteGraph.LGraphNode.prototype.computeSize.apply(this, arguments);

            
            const minWidth = 200; 
            const minHeight = 200; 
            size[0] = Math.max(minWidth, size[0]);
            size[1] = Math.max(minHeight, size[1]);

            return size;
        };

        
        nodeType.prototype._cachedCanvas = null;
        nodeType.prototype._lastRenderConfig = null;

        
        nodeType.prototype.optimizeBase64Image = function(canvas) {
            try {
                
                return canvas.toDataURL('image/png');
            } catch (e) {
                console.warn('Base64 optimization error:', e);
                return null;
            }
        };

        
        nodeType.prototype.updateWidgetValues = function() {
            if (!this.widgets) return;

            const updates = {};
            this.widgets.forEach(w => {
                if (w.name in this.properties) {
                    if (w.name === 'canvas_image') {
                        
                        if (this._cachedCanvas) {
                            const optimizedBase64 = this.optimizeBase64Image(this._cachedCanvas);
                            if (optimizedBase64) {
                                updates[w.name] = optimizedBase64;
                            }
                        }
                    } else {
                        updates[w.name] = this.properties[w.name];
                    }
                }
            });

            
            requestAnimationFrame(() => {
                Object.entries(updates).forEach(([name, value]) => {
                    const widget = this.widgets.find(w => w.name === name);
                    if (widget) {
                        widget.value = value;
                    }
                });

                if (this.graph) {
                    this.graph.change();
                }
            });
        };

        
        const originalDrawPreviewArea = nodeType.prototype.drawPreviewArea;
        nodeType.prototype.drawPreviewArea = function(ctx) {
            if (!this._updateThrottleTimeout) {
                this._updateThrottleTimeout = setTimeout(() => {
                    this._updateThrottleTimeout = null;
                    this.updateWidgetValues();
                }, 500);
            }
            
            return originalDrawPreviewArea.call(this, ctx);
        };

        
        const colorCache = new Map();
        const maxCacheSize = 100;

        nodeType.prototype.getCachedColor = function(color, format = 'hex') {
            const key = `${color}_${format}`;
            if (colorCache.has(key)) {
                return colorCache.get(key);
            }

            let result;
            if (format === 'hex') {
                result = this.rgbToHex(color);
            } else {
                
                result = color;
            }

            if (colorCache.size >= maxCacheSize) {
                const firstKey = colorCache.keys().next().value;
                colorCache.delete(firstKey);
            }
            colorCache.set(key, result);
            return result;
        };

        nodeType.prototype.serialize = function() {
            const serialized = LiteGraph.LGraphNode.prototype.serialize.call(this);
            
            
            const essentialProperties = {
                flare_type: this.properties.flare_type || "50MM_PRIME",
                position_x: this.properties.position_x || 0.5,
                position_y: this.properties.position_y || 0.5,
                size: this.properties.size || 1.0,
                size_x: this.properties.size_x || 1.0,
                size_y: this.properties.size_y || 1.0,
                intensity: this.properties.intensity || 1.0,
                rotation: this.properties.rotation || 0,
                blend_mode: this.properties.blend_mode || "screen",
                main_color: this.properties.main_color,
                secondary_color: this.properties.secondary_color,
                ghost_color: this.properties.ghost_color,
                starburst_color: this.properties.starburst_color
            };

            serialized.properties = essentialProperties;

            
            if (serialized.widgets_values) {
                serialized.widgets_values = serialized.widgets_values.filter((value, index) => {
                    const widget = this.widgets[index];
                    return widget && widget.name !== 'canvas_image';
                });
            }

            return serialized;
        };

        
        nodeType.prototype.configure = function(info) {
            
            if (!LiteGraph.LGraphNode.prototype.configure.call(this, info)) {
                return false;
            }
            
            
            Object.entries(DEFAULT_WIDGET_VALUES).forEach(([key, defaultValue]) => {
                if (!(key in this.properties)) {
                    this.properties[key] = defaultValue;
                }
            });

            
            if (!this._cachedCanvas) {
                this._cachedCanvas = document.createElement('canvas');
            }

            
            if (this.widgets) {
                this.widgets.forEach(w => {
                    if (w.name in this.properties) {
                        w.value = this.properties[w.name];
                    }
                });
            }

            return true;
        };

        
        nodeType.prototype.beforeQueued = function(queue) {
            
            if (!this.widgets || !this.properties) {
                return false;
            }

            
            const canvasImageWidget = this.widgets.find(w => w.name === 'canvas_image');
            if (canvasImageWidget && this._cachedCanvas) {
                const base64Image = this.optimizeBase64Image(this._cachedCanvas);
                if (base64Image) {
                    canvasImageWidget.value = base64Image;
                }
            }

            
            for (const widget of this.widgets) {
                if (widget.name in this.properties && widget.value === undefined) {
                    console.warn(`Widget ${widget.name} value is not ready`);
                    return false;
                }
            }

            return true;
        };
    }
});
