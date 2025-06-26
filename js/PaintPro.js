import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";
import { 
    PAINT_TOOLS, 
    DRAWING_DEFAULTS, 
    BRUSH_SIZES, 
    UI_CONFIG, 
    TOOL_SETTINGS,
    BRUSH_PRESETS,
    PERFORMANCE_CONFIG,
    CANVAS_CONFIG,
    CANVAS_PADDING,
    TOOLBAR_LIMITS,
    QUICK_CONTROLS,
    PERFORMANCE_LIMITS,
    COLOR_PICKER,
    TEXT_CONFIG,
    INTERACTION_CONFIG
} from "./paintConstants.js";
import { 
    AdvancedBrush, 
    SmartEraser, 
    LineTool, 
    RectangleTool, 
    CircleTool, 
    EyedropperTool, 
    GradientTool,
    FillTool, 
    ColorUtils 
} from "./paintTools.js";
import { SettingsManager } from "./paintSettings.js";


if (!document.getElementById('paint-pro-styles')) {
    const style = document.createElement('style');
    style.id = 'paint-pro-styles';
    style.textContent = `
.paint-pro-settings-popup {
    z-index: 99999 !important;
    background: #1a1a1a !important;
    border: 1px solid #333 !important;
    border-radius: 6px !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important;
}
.paint-pro-settings-popup input[type="range"] {
    -webkit-appearance: none !important;
    background: #444 !important;
    height: 2px !important;
    border-radius: 1px !important;
}
.paint-pro-settings-popup input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none !important;
    width: 10px !important;
    height: 10px !important;
    border-radius: 50% !important;
    background: #4A9EFF !important;
    border: none !important;
    cursor: pointer !important;
    margin-top: -4px !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.3) !important;
    transition: all 0.1s ease-out !important;
}
.paint-pro-settings-popup input[type="range"]::-webkit-slider-thumb:hover {
    background: #5AAFFF !important;
    transform: scale(1.1) !important;
}
.paint-pro-settings-popup input[type="range"]::-webkit-slider-thumb:active {
    background: #3A8EFF !important;
    transform: scale(0.95) !important;
}
`;
    document.head.appendChild(style);
}

const DEVICE_PIXEL_RATIO = CANVAS_CONFIG.DEVICE_PIXEL_RATIO;

function imageDataToUrl(data) {
    try {
        if (!data || !data.image) return null;
        if (data?.image?.filename) {
            return api.apiURL(
                `/view?filename=${encodeURIComponent(data.image.filename)}` + 
                `&type=${data.image.type}&subfolder=${encodeURIComponent(data.image.subfolder || "")}` +
                `&preview=1&rand=${Date.now()}`
            );
        }
        if (data.filename && data.type) {
            return api.apiURL(
                `/view?filename=${encodeURIComponent(data.filename)}` +
                `&type=${data.type}&subfolder=${encodeURIComponent(data.subfolder || "")}` +
                `&preview=1&rand=${Date.now()}`
            );
        }
        console.error("Unsupported image data format:", data);
        return null;
    } catch (e) {
        console.error("Critical error in imageDataToUrl:", e);
        return null;
    }
}

app.registerExtension({
    name: "Comfy.PaintPro",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name !== "PaintPro") return;
        nodeData.output = ["IMAGE", "MASK"];
        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function() {
            const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
            this._initializeNode();
            this._initializeWidgets();
            this.internalCanvasImageWidget = this.widgets ? this.widgets.find(w => w.name === 'canvas_image') : null;
            this.onConnectionsChange = this._handleConnectionsChange.bind(this);
            this.preloadToolIcons();
            return r;
        };
        nodeType.prototype._initializeWidgets = function() {
            if (this.widgets) {
                for (const w of this.widgets) {
                    w.hidden = true;
                }
            }
            this.serialize_widgets = true; 
        };
        nodeType.prototype.updateCanvasWidget = function() {
            const finalDataString = "data:application/json;base64," + btoa(JSON.stringify(dataToSend)); 
            if(this.internalCanvasImageWidget) {
                this.internalCanvasImageWidget.value = finalDataString;
            } else {
                console.error("[PaintPro updateCanvasWidget] internalCanvasImageWidget reference not found!");
            }
        };
        nodeType.prototype._initializeNode = function() { 
            this.canvasImageWidget = this.addWidget("string", "canvas_image", "", null, { 
                property: "canvas_image",
                hidden: true 
            });
            this.inputImage = this.inputImage || { image: null };
            this.canvasState = {
                isDrawing: false,
                isDirty: false,
                lastX: 0,
                lastY: 0,
                tool: PAINT_TOOLS.BRUSH,
                color: "#ffffff",
                brushSize: BRUSH_SIZES.MEDIUM,
                opacity: 0.8,
                pressureSensitivity: 0.5,
                lastPoints: [],
                fillTolerance: TOOL_SETTINGS.FILL.DEFAULT_TOLERANCE,
                brushSpacing: TOOL_SETTINGS.BRUSH.DEFAULT_SPACING,
                brushHardness: TOOL_SETTINGS.BRUSH.DEFAULT_HARDNESS,
                brushFlow: TOOL_SETTINGS.BRUSH.DEFAULT_FLOW,
                scattering: TOOL_SETTINGS.BRUSH.DEFAULT_SCATTERING,
                shapeDynamics: TOOL_SETTINGS.BRUSH.DEFAULT_SHAPE_DYNAMICS,
                texture: "none",
                dualBrush: "none",
                maskOpacity: 0.5,
                gradientEndColor: '#000000',
                rectangleFillStyle: TOOL_SETTINGS.RECTANGLE.DEFAULT_FILL_STYLE,
                rectangleFillColor: TOOL_SETTINGS.RECTANGLE.DEFAULT_FILL_COLOR,
                rectangleFillEndColor: TOOL_SETTINGS.RECTANGLE.DEFAULT_FILL_END_COLOR,
                rectangleBorderRadius: TOOL_SETTINGS.RECTANGLE.DEFAULT_BORDER_RADIUS,
                rectangleRotation: TOOL_SETTINGS.RECTANGLE.DEFAULT_ROTATION,
                circleFillStyle: TOOL_SETTINGS.CIRCLE.DEFAULT_FILL_STYLE,
                circleFillColor: TOOL_SETTINGS.CIRCLE.DEFAULT_FILL_COLOR,
                circleFillEndColor: TOOL_SETTINGS.CIRCLE.DEFAULT_FILL_END_COLOR,
                circleStartAngle: TOOL_SETTINGS.CIRCLE.DEFAULT_START_ANGLE,
                circleEndAngle: TOOL_SETTINGS.CIRCLE.DEFAULT_END_ANGLE,
                distanceSinceLastStamp: 0,
                brushPreset: "DEFAULT",
                
                maskColor: '#ffffff',
                maskHardness: TOOL_SETTINGS.MASK.DEFAULT_HARDNESS,
                maskFeather: TOOL_SETTINGS.MASK.DEFAULT_FEATHER,
                maskMode: TOOL_SETTINGS.MASK.DEFAULT_MODE
            };
            const { canvas: drawingCanvas, ctx: drawingCtx } = this._createCanvas();
            this.drawingCanvas = drawingCanvas;
            this.drawingCtx = drawingCtx;
            const { canvas: maskCanvas, ctx: maskCtx } = this._createCanvas(
                this.drawingCanvas.width,
                this.drawingCanvas.height,
                '#000000'
            );
            this.maskCanvas = maskCanvas;
            this.maskCtx = maskCtx;
            const { canvas: strokeShapeCanvas, ctx: strokeShapeCtx } = this._createCanvas(
                this.drawingCanvas.width,
                this.drawingCanvas.height
            );
            this.strokeShapeCanvas = strokeShapeCanvas;
            this.strokeShapeCtx = strokeShapeCtx;
            if (this.strokeShapeCtx) {
                this.strokeShapeCtx.clearRect(0, 0, this.strokeShapeCanvas.width, this.strokeShapeCanvas.height);
            }
            this.isDrawingContinuousStroke = false;
            this._lastRedrawTime = 0;
            this.currentImage = null;
            this.properties = {
                showMask: false
            };
            this.history = [];
            this.historyIndex = -1;
            this.quickControlsBarHeight = 0;
            this.addWidget("toggle", "Show Mask", false, (v) => {
                this.properties.showMask = v;
                this.setDirtyCanvas(true);
            }, {property: "showMask"}); 
            this.toolComboWidget = this.addWidget(
                "combo",
                "Tool",
                this.canvasState.tool,
                (v) => this._handleToolChange(v),
                { values: this._getToolValues() }
            );
            this.addWidget("number", "Brush Size", this.canvasState.brushSize, (v) => {
                const scaledValue = v / this.getCanvasScaleFactor();
                this.canvasState.brushSize = Math.min(100, Math.max(1, scaledValue));
            }, { min: 1, max: 100, step: 1 });
            this.toolInfoLabel = this.addWidget("label", "Tool Info", "Brush tool: Draw with brush color.", () => {});
            this.toolbarHeight = UI_CONFIG.TOOLBAR.HEIGHT;
            const defaultSize = CANVAS_CONFIG.DEFAULT_SIZE;
            this.drawingCanvas.width = defaultSize;
            this.drawingCanvas.height = defaultSize;
            this.maskCanvas.width = defaultSize;
            this.maskCanvas.height = defaultSize;
            this.settingsManager = new SettingsManager(this, {
                [PAINT_TOOLS.BRUSH]: {
                },
                [PAINT_TOOLS.ERASER]: {
                },
                [PAINT_TOOLS.LINE]: {
                    lineStyle: {
                        type: "combo",
                        label: "Line Style",
                        options: [
                            { label: "Solid", value: TOOL_SETTINGS.LINE.LINE_STYLES.SOLID },
                            { label: "Dashed", value: TOOL_SETTINGS.LINE.LINE_STYLES.DASHED },
                            { label: "Dotted", value: TOOL_SETTINGS.LINE.LINE_STYLES.DOTTED }
                        ],
                        defaultValue: TOOL_SETTINGS.LINE.DEFAULT_LINE_STYLE
                    },
                    lineCap: {
                        type: "combo",
                        label: "Line Cap",
                        options: [
                            { label: "Round", value: TOOL_SETTINGS.LINE.LINE_CAPS.ROUND },
                            { label: "Square", value: TOOL_SETTINGS.LINE.LINE_CAPS.SQUARE },
                            { label: "Butt", value: TOOL_SETTINGS.LINE.LINE_CAPS.BUTT }
                        ],
                        defaultValue: TOOL_SETTINGS.LINE.DEFAULT_LINE_CAP
                    },
                    startArrow: {
                        type: "toggle",
                        label: "Start Arrow",
                        defaultValue: TOOL_SETTINGS.LINE.DEFAULT_START_ARROW
                    },
                    endArrow: {
                        type: "toggle",
                        label: "End Arrow",
                        defaultValue: TOOL_SETTINGS.LINE.DEFAULT_END_ARROW
                    },
                    arrowSize: {
                        type: "slider",
                        label: "Arrow Size",
                        min: TOOL_SETTINGS.LINE.MIN_ARROW_SIZE,
                        max: TOOL_SETTINGS.LINE.MAX_ARROW_SIZE,
                        defaultValue: TOOL_SETTINGS.LINE.DEFAULT_ARROW_SIZE,
                        step: 1
                    }
                },
            });
            this.settingsManager.createSettingsDialog();
            this.settingsManager.setCallbacks({
                onSettingChange: (toolType, setting, value) => {
                    if (toolType === PAINT_TOOLS.ERASER && !["opacity", "brushSize", "size", "width"].includes(setting)) {
                        return;
                    }
                    const prevOpacity = this.canvasState.opacity;
                    const prevSpacing = this.canvasState.brushSpacing;
                    switch(setting) {
                        case "opacity":
                            this.canvasState.opacity = value;
                            break;
                        case "brushSize":
                            this.canvasState.brushSize = value;
                            break;
                        case "color":
                            this.canvasState.color = value;
                            break;
                        case "tolerance":
                        case "fillTolerance":
                            this.canvasState.fillTolerance = value;
                            break;
                        case "pressure":
                            this.canvasState.pressureSensitivity = value;
                            break;
                        case "spacing":
                            this.canvasState.brushSpacing = value;
                            break;
                        case "hardness":
                            this.canvasState.brushHardness = value;
                            break;
                        case "brushflow":
                        case "flow":
                            this.canvasState.brushFlow = value;
                            break;
                        case "scattering":
                            this.canvasState.scattering = value;
                            break;
                        case "shapeDynamics":
                            this.canvasState.shapeDynamics = value;
                            break;
                        case "texture":
                            this.canvasState.texture = value;
                            break;
                        case "dualBrush":
                            this.canvasState.dualBrush = value;
                            break;
                        case "maskOpacity":
                            this.canvasState.maskOpacity = value;
                            break;
                        case "size":
                        case "width":
                            this.canvasState.brushSize = value;
                            break;
                        
                        case "fillStyle":
                            if (toolType === PAINT_TOOLS.RECTANGLE) {
                                this.canvasState.rectangleFillStyle = value;
                            } else if (toolType === PAINT_TOOLS.CIRCLE) {
                                this.canvasState.circleFillStyle = value;
                            }
                            break;
                        case "fillColor":
                            if (toolType === PAINT_TOOLS.RECTANGLE) {
                                this.canvasState.rectangleFillColor = value;
                            } else if (toolType === PAINT_TOOLS.CIRCLE) {
                                this.canvasState.circleFillColor = value;
                            }
                            break;
                        case "fillEndColor":
                            if (toolType === PAINT_TOOLS.RECTANGLE) {
                                this.canvasState.rectangleFillEndColor = value;
                            } else if (toolType === PAINT_TOOLS.CIRCLE) {
                                this.canvasState.circleFillEndColor = value;
                            }
                            break;
                        case "borderRadius":
                            this.canvasState.rectangleBorderRadius = value;
                            break;
                        case "rotation":
                            this.canvasState.rectangleRotation = value;
                            break;
                        case "startAngle":
                            this.canvasState.circleStartAngle = value;
                            break;
                        case "endAngle":
                            this.canvasState.circleEndAngle = value;
                            break;
                        
                        case "maskColor":
                            this.canvasState.maskColor = value;
                            break;
                        case "maskHardness":
                            this.canvasState.maskHardness = value;
                            break;
                        case "maskFeather":
                            this.canvasState.maskFeather = value;
                            break;
                        case "maskMode":
                            this.canvasState.maskMode = value;
                            break;
                    }
                    const opacityChanged = prevOpacity !== this.canvasState.opacity;
                    const spacingChanged = prevSpacing !== this.canvasState.brushSpacing;
                    if (opacityChanged || spacingChanged) {
                        if (spacingChanged) {
                            this.canvasState.distanceSinceLastStamp = 0;
                        }
                        requestAnimationFrame(() => {
                            this.setDirtyCanvas(true, true);
                        });
                    } else {
                        this.setDirtyCanvas(true, true);
                    }
                },
                onPresetChange: this.applyToolPreset.bind(this),
                onClose: () => {
                    this.showSettings = false;
                }
            });
            this.addWidget("slider", "Opacity", this.canvasState.opacity, (v) => {
                            this.canvasState.opacity = v;
            }, { min: 0, max: 1, step: 0.01 });
            this._resizeCanvases(512, 512); 
            this.originalImageCanvas = document.createElement('canvas');
            this.originalImageCtx = this.originalImageCanvas.getContext('2d');
            this.loadInputImage();
            this.imageLoading = false;
            this.imageLoadPromise = null;
            this.cleanupInterval = setInterval(() => {
                if (this.history && this.history.length > PERFORMANCE_CONFIG.HISTORY_LIMIT) {
                    this.history = this.history.slice(-PERFORMANCE_CONFIG.HISTORY_LIMIT);
                    this.historyIndex = Math.min(this.historyIndex, this.history.length - 1);
                }
            }, PERFORMANCE_CONFIG.CLEANUP_INTERVAL);
            this._tooltipToDraw = null;
            this.livePreviewCanvas = document.createElement('canvas');
            this.livePreviewCtx = this.livePreviewCanvas.getContext('2d', {
                willReadFrequently: false, 
                alpha: true
            });
            this.isDrawingContinuousStroke = false;
        };
        nodeType.prototype._resizeCanvases = function(width, height) {
            if (width <= 0 || height <= 0 || width > 4096 || height > 4096) {
                console.error("Invalid canvas dimensions:", width, height);
                width = 512;
                height = 512;
            }
            this.logicalWidth = width;
            this.logicalHeight = height;
            const canvasConfigs = [
                { canvas: this.drawingCanvas, name: 'drawing' },
                { canvas: this.maskCanvas, name: 'mask' },
                { canvas: this.strokeShapeCanvas, name: 'shape' },
                { canvas: this.livePreviewCanvas, name: 'preview' }
            ];
            canvasConfigs.forEach(({ canvas, name }) => {
                if (!canvas) {
                    console.error(`${name} canvas element missing during resize!`);
                    return;
                }
                canvas.width = width;
                canvas.height = height;
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                const ctx = canvas.getContext('2d', {
                    willReadFrequently: true,
                    alpha: true,
                    antialias: true
                });
                if (ctx) {
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                } else {
                    console.error(`Failed to get ${name} context during resize!`);
                }
            });
        };
        const originalOnDrawForeground = nodeType.prototype.onDrawForeground;
        const STYLES = {
            CANVAS_BG: {
                FILL: "#222",
                STROKE: "#383838",
                SHADOW: {
                    COLOR: "rgba(0, 0, 0, 0.2)",
                    BLUR: 6
                }
            },
            TOOLBAR_BG: {
                FILL: "#282828",
                STROKE: "#404040",
                SHADOW: {
                    COLOR: "rgba(0, 0, 0, 0.2)",
                    BLUR: 6,
                    OFFSET_Y: 1
                }
            }
        };
        nodeType.prototype._drawPanelBackground = function(ctx, x, y, width, height, radius, style) {
            ctx.save();
            ctx.shadowColor = style.SHADOW.COLOR;
            ctx.shadowBlur = style.SHADOW.BLUR;
            if (style.SHADOW.OFFSET_Y) {
                ctx.shadowOffsetY = style.SHADOW.OFFSET_Y;
            }
            ctx.fillStyle = style.FILL;
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, radius);
            ctx.fill();
            ctx.strokeStyle = style.STROKE;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        };
        nodeType.prototype._drawCanvasContent = function(ctx, canvasArea, metrics) {
            const { offsetX, offsetY, displayWidth, displayHeight } = metrics;
            ctx.save();
            ctx.beginPath();
            ctx.rect(canvasArea.x, canvasArea.y, canvasArea.width, canvasArea.height);
            ctx.clip();
            if (this.currentImage) {
                ctx.drawImage(this.currentImage, offsetX, offsetY, displayWidth, displayHeight);
            }
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(this.drawingCanvas, offsetX, offsetY, displayWidth, displayHeight);
            if (this.properties.showMask) {
                ctx.globalAlpha = 0.4;
                ctx.drawImage(this.maskCanvas, offsetX, offsetY, displayWidth, displayHeight);
                ctx.globalAlpha = 1.0;
            }
            ctx.restore();
        };
        nodeType.prototype._drawCanvasGrid = function(ctx, canvasArea, metrics) {
            const { offsetX, offsetY, displayWidth, displayHeight, scale } = metrics;
            
            ctx.save();
            ctx.beginPath();
            ctx.rect(canvasArea.x, canvasArea.y, canvasArea.width, canvasArea.height);
            ctx.clip();
            
            
            const checkerSize = 16; 
            const displayCheckerSize = checkerSize * scale;
            
            
            if (displayCheckerSize > 4) {
                const lightColor = 'rgba(80, 80, 80, 0.2)';
                const darkColor = 'rgba(60, 60, 60, 0.2)';
                
                
                const startX = Math.floor((canvasArea.x - offsetX) / displayCheckerSize) * displayCheckerSize + offsetX;
                const startY = Math.floor((canvasArea.y - offsetY) / displayCheckerSize) * displayCheckerSize + offsetY;
                
                
                for (let x = startX; x < offsetX + displayWidth; x += displayCheckerSize) {
                    for (let y = startY; y < offsetY + displayHeight; y += displayCheckerSize) {
                        
                        if (x >= offsetX && x < offsetX + displayWidth && 
                            y >= offsetY && y < offsetY + displayHeight) {
                            
                            const checkerX = Math.floor((x - offsetX) / displayCheckerSize);
                            const checkerY = Math.floor((y - offsetY) / displayCheckerSize);
                            const isLightSquare = (checkerX + checkerY) % 2 === 0;
                            
                            ctx.fillStyle = isLightSquare ? lightColor : darkColor;
                            
                            
                            const drawX = Math.max(x, offsetX);
                            const drawY = Math.max(y, offsetY);
                            const drawWidth = Math.min(displayCheckerSize, offsetX + displayWidth - drawX);
                            const drawHeight = Math.min(displayCheckerSize, offsetY + displayHeight - drawY);
                            
                            if (drawWidth > 0 && drawHeight > 0) {
                                ctx.fillRect(drawX, drawY, drawWidth, drawHeight);
                            }
                        }
                    }
                }
            }
            
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; 
            ctx.lineWidth = 1; 
            ctx.setLineDash([2, 4]); 
            ctx.beginPath();
            ctx.rect(offsetX, offsetY, displayWidth, displayHeight);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.restore();
        };
        nodeType.prototype._drawBrushCursorPreview = function(ctx, metrics, lastMousePos) {
            if (!lastMousePos || !this.canvasState || this.canvasState.isDrawing || 
                ![PAINT_TOOLS.BRUSH, PAINT_TOOLS.ERASER].includes(this.canvasState.tool)) {
                return;
            }
            const { offsetX, offsetY, displayWidth, displayHeight, scale } = metrics;
            const [mouseX, mouseY] = lastMousePos;
            if (mouseX >= offsetX && mouseX <= offsetX + displayWidth &&
                mouseY >= offsetY && mouseY <= offsetY + displayHeight) {
                ctx.save();
                ctx.translate(offsetX, offsetY);
                ctx.scale(scale, scale);
                const [logicalX, logicalY] = this.getLocalMousePosition(lastMousePos);
                this._drawBrushCursorLogical(ctx, logicalX, logicalY);
                ctx.restore();
            }
        };
        nodeType.prototype.onDrawForeground = function(ctx) {
            this.drawToolbar(ctx);
            this.optimizeCanvas();
            this.cleanupMemory();
            if (this.canvasState?.isDrawing && this.canvas && !this.canvas.pointer_is_down) {
                this.canvasState.isDrawing = false;
                this.isDrawingContinuousStroke = false;
                this.lastMousePos = null;
                this.setDirtyCanvas(true);
            }
            const canvasArea = this.getCanvasArea();
            const metrics = this.getDisplayMetrics();
            this._drawPanelBackground(
                ctx,
                canvasArea.x,
                canvasArea.y,
                canvasArea.width,
                canvasArea.height,
                6,
                STYLES.CANVAS_BG
            );
            this._drawCanvasContent(ctx, canvasArea, metrics);
            this._drawCanvasGrid(ctx, canvasArea, metrics);
            this._drawCanvasContent(ctx, canvasArea, metrics);

            this._drawBrushCursorPreview(ctx, metrics, this.lastMousePos);
            this._drawMaskingModeIndicator(ctx, canvasArea);
            this._drawActiveToolTooltip(ctx);
            if (this.quickControlsBarHeight > 0 && this.settingsManager?.drawQuickControlsBar) {
                const controlsY = canvasArea.y + canvasArea.height + 15;
                const bottomBounds = {
                    x: canvasArea.x,
                    y: controlsY,
                    width: canvasArea.width,
                    height: this.quickControlsBarHeight
                };
                this.settingsManager.drawQuickControlsBar(ctx, bottomBounds, this.canvasState);
                this._drawPaletteOverlay(ctx, bottomBounds);
            }
            this._drawShapePreview(ctx, metrics);
            if (!this.canvasState?.isDrawing && this.lastMousePos) {
                this.updateCanvasCursor();
            }
        };
        nodeType.prototype._drawPaletteOverlay = function(ctx, bottomBounds) {
            const graphCanvas = this.graph?.canvas;
            const swatchSize = Math.min(bottomBounds.height - 10, 24);
            if (this.settingsManager?.quickControlsState?.isPaletteOpen && 
                this.settingsManager.drawQuickPaletteOverlay && 
                this.pos && Array.isArray(this.pos) && this.pos.length >= 2 && 
                graphCanvas && graphCanvas.ctx && graphCanvas.offset && 
                typeof graphCanvas.scale !== 'undefined') {
                const padding = 5;
                const colorControlX = padding + 2;
                const colorControlY = this.size[1] - this.quickControlsBarHeight + padding;
                const nodeAbsX = this.pos[0];
                const nodeAbsY = this.pos[1];
                const scale = graphCanvas.scale;
                const paletteAbsX = (nodeAbsX + colorControlX) * scale + graphCanvas.offset[0];
                const paletteAbsY = (nodeAbsY + colorControlY) * scale + graphCanvas.offset[1];
                const mainCtx = graphCanvas.ctx;
                mainCtx.save();
                mainCtx.resetTransform();
                this.settingsManager.drawQuickPaletteOverlay(mainCtx, paletteAbsX, paletteAbsY, swatchSize * scale);
                mainCtx.restore();
            }
        };
        nodeType.prototype._drawShapePreview = function(ctx, metrics) {
            if (this.canvasState?.isDrawing && 
                [PAINT_TOOLS.LINE, PAINT_TOOLS.RECTANGLE, PAINT_TOOLS.CIRCLE, PAINT_TOOLS.GRADIENT].includes(this.canvasState.tool) && 
                this.lastMousePos) {
                const [logicalX, logicalY] = this.getLocalMousePosition(this.lastMousePos);
                ctx.save();
                ctx.translate(metrics.offsetX, metrics.offsetY);
                ctx.scale(metrics.scale, metrics.scale);
                this.drawShapePreview(ctx, logicalX, logicalY);
                ctx.restore();
            }
        };
        nodeType.prototype._updateTooltipVisibility = function() {
            const metrics = this._getScaledToolbarMetrics();
            const toolbarBounds = {
                x: metrics.padding,
                y: Math.max(metrics.minimumMargin, (this.size[1] - metrics.toolbarHeight) / 2),
                width: metrics.toolbarWidth,
                height: metrics.toolbarHeight
            };
            let mouseOverToolbar = false;
            if (this.lastMousePos) {
                mouseOverToolbar = 
                    this.lastMousePos[0] >= toolbarBounds.x && 
                    this.lastMousePos[0] <= toolbarBounds.x + toolbarBounds.width &&
                    this.lastMousePos[1] >= toolbarBounds.y && 
                    this.lastMousePos[1] <= toolbarBounds.y + toolbarBounds.height;
            }
            if (!mouseOverToolbar) {
                this._tooltipToDraw = null;
            }
        };
        nodeType.prototype._getScaledToolbarMetrics = function() {
            const { TOOLBAR } = UI_CONFIG;
            const totalTools = Object.values(PAINT_TOOLS).length + 1; 
            const nodeHeight = this.size[1];
            const minimumMargin = TOOLBAR_LIMITS.MINIMUM_MARGIN; 
            const minToolSize = TOOLBAR_LIMITS.MIN_TOOL_SIZE; 
            const minIconSize = TOOLBAR_LIMITS.MIN_ICON_SIZE;  
            const minSpacing = TOOLBAR_LIMITS.MIN_SPACING;   
            const minPadding = TOOLBAR_LIMITS.MIN_PADDING;   
            const idealHeight = totalTools * TOOLBAR.TOOL_SIZE + (totalTools - 1) * TOOLBAR.SPACING + TOOLBAR.PADDING * 2;
            const availableHeight = Math.max(0, nodeHeight - (minimumMargin * 2));
            let overallScaleFactor = 1;
            if (availableHeight < idealHeight) {
                overallScaleFactor = availableHeight / idealHeight;
            }
            overallScaleFactor = Math.max(TOOLBAR_LIMITS.MIN_SCALE_FACTOR, overallScaleFactor); 
            const toolSize = Math.max(minToolSize, Math.floor(TOOLBAR.TOOL_SIZE * overallScaleFactor));
            const iconSize = Math.max(minIconSize, Math.floor(TOOLBAR.ICON_SIZE * overallScaleFactor)); 
            const spacing = Math.max(minSpacing, Math.floor(TOOLBAR.SPACING * overallScaleFactor));
            const padding = Math.max(minPadding, Math.floor(TOOLBAR.PADDING * overallScaleFactor));
            const toolbarHeight = totalTools * toolSize + (totalTools - 1) * spacing + padding * 2;
            const toolbarWidth = toolSize + padding * 2; 
            return {
                toolSize,
                iconSize,
                spacing,
                padding,
                toolbarHeight,
                toolbarWidth,
                totalTools,
                minimumMargin 
            };
        };
        nodeType.prototype.drawToolbar = function(ctx) {
            if (!this.canvasState) this._initializeNode();
            const metrics = this._getScaledToolbarMetrics();
            const { toolSize, iconSize, spacing, padding, toolbarHeight, toolbarWidth, totalTools, minimumMargin } = metrics;
            const startY = Math.max(minimumMargin, (this.size[1] - toolbarHeight) / 2);
            const startX = padding;
            this._drawPanelBackground(
                ctx,
                startX,
                startY,
                toolbarWidth,
                toolbarHeight,
                8,
                STYLES.TOOLBAR_BG
            );
            this._drawToolbarButtons(ctx, {
                startX,
                startY,
                padding,
                toolSize,
                iconSize,
                spacing,
                hideTooltips: toolSize < 15
            });
        };
        nodeType.prototype._drawToolbarButtons = function(ctx, config) {
            const { startX, startY, padding, toolSize, iconSize, spacing, hideTooltips } = config;
            let currentY = startY + padding;
            Object.values(PAINT_TOOLS).forEach((tool, index) => {
                const isActive = this.canvasState.tool === tool;
                const isHovered = this.hoveredTool === tool;
                const buttonRect = {
                    x: startX + padding,
                    y: currentY,
                    width: toolSize,
                    height: toolSize
                };
                this._drawToolButton(ctx, {
                    tool,
                    rect: buttonRect,
                    isActive,
                    isHovered,
                    iconSize,
                    hideTooltips
                });
                currentY += toolSize + spacing;
            });
            const isSettingsHovered = this.hoveredTool === 'settings';
            const settingsRect = {
                x: startX + padding,
                y: currentY,
                width: toolSize,
                height: toolSize
            };
            this._drawToolButton(ctx, {
                tool: 'settings',
                rect: settingsRect,
                isActive: false,
                isHovered: isSettingsHovered,
                iconSize,
                hideTooltips
            });
        };
        nodeType.prototype._drawToolButton = function(ctx, config) {
            const { tool, rect, isActive, isHovered, iconSize, hideTooltips } = config;
            const { x, y, width, height } = rect;
            ctx.save();
            if (isActive) {
                ctx.fillStyle = "#404040";
            } else if (isHovered) {
                ctx.fillStyle = "#343434";
            } else {
                ctx.fillStyle = "transparent";
            }
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, 4);
            ctx.fill();
            const iconX = x + width / 2;
            const iconY = y + height / 2;
            ctx.save();
            ctx.translate(iconX, iconY);
            this.drawToolIcon(ctx, tool, isActive, iconSize);
            ctx.restore();
            if (!hideTooltips && isHovered && !this._tooltipToDraw) {
                this._tooltipToDraw = {
                    text: this.getTooltipText(tool),
                    x: x + width + 5,
                    y: y + height / 2
                };
            }
            ctx.restore();
        };
        nodeType.prototype._drawTooltips = function(ctx) {
            if (this._tooltipToDraw) {
                const { text, x, y } = this._tooltipToDraw;
                const { TOOLTIPS } = UI_CONFIG;
                ctx.save(); 
                ctx.font = "11px Arial"; 
                const metrics = ctx.measureText(text);
                const padding = TOOLTIPS.PADDING;
                const rectWidth = metrics.width + padding * 2;
                const rectHeight = 22;
                const rectX = x; 
                const rectY = y - rectHeight / 2; 
                const nodeWidth = this.size[0];
                let adjustedX = rectX;
                if (rectX + rectWidth > nodeWidth - 5) { 
                    adjustedX = x - rectWidth - 10; 
                }
                ctx.fillStyle = TOOLTIPS.BACKGROUND;
                ctx.beginPath();
                ctx.roundRect(adjustedX, rectY, rectWidth, rectHeight, TOOLTIPS.BORDER_RADIUS);
                ctx.fill();
                ctx.fillStyle = TOOLTIPS.TEXT;
                ctx.textAlign = "left"; 
                ctx.textBaseline = "middle";
                ctx.fillText(text, adjustedX + padding, rectY + rectHeight / 2);
                ctx.restore(); 
            }
        };
        nodeType.prototype.drawToolIcon = function(ctx, tool, isActive, iconSize) {
            const { TOOLBAR } = UI_CONFIG;
            ctx.save();
            ctx.filter = isActive ? "brightness(1.2)" : "brightness(1)"; 
            if (this._iconCache?.[tool]) {
                ctx.drawImage(
                    this._iconCache[tool],
                    -iconSize / 2, -iconSize / 2,
                    iconSize, iconSize
                );
            } else {
                ctx.fillStyle = isActive ? TOOLBAR.COLORS.ICON_ACTIVE : TOOLBAR.COLORS_NORMAL; 
                ctx.beginPath();
                ctx.arc(0, 0, iconSize / 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        };
        nodeType.prototype.getToolbarItemBounds = function(index) {
            const metrics = this._getScaledToolbarMetrics();
            const { toolSize, iconSize, spacing, padding, toolbarHeight, toolbarWidth, totalTools } = metrics;
            const startY = (this.size[1] - toolbarHeight) / 2;
            const minTouchSize = Math.max(toolSize, TOOLBAR_LIMITS.MIN_TOUCH_SIZE); 
            const visualX = padding;
            const visualY = startY + padding + index * (toolSize + spacing);
            const touchX = Math.max(0, visualX - (minTouchSize - toolSize) / 2);
            const touchY = Math.max(0, visualY - (minTouchSize - toolSize) / 4); 
            const touchWidth = Math.max(toolbarWidth, minTouchSize);
            const touchHeight = Math.max(toolSize, minTouchSize);
            return {
                visualX: visualX,
                visualY: visualY,
                visualWidth: toolSize,
                visualHeight: toolSize,
                x: touchX,
                y: touchY,
                width: touchWidth,
                height: touchHeight
            };
        };
        nodeType.prototype.getToolbarBackgroundY = function() {
            const { TOOLBAR } = UI_CONFIG;
            const totalTools = Object.values(PAINT_TOOLS).length + 1;
            const toolbarHeight = totalTools * TOOLBAR.TOOL_SIZE + (totalTools - 1) * TOOLBAR.SPACING + TOOLBAR.PADDING * 2;
            return (this.size[1] - toolbarHeight) / 2;
        };
        nodeType.prototype.onMouseMove = function(e, pos) {
            if (!pos || !pos.length) return;
            this.lastMousePos = pos; 
            if (!this.canvasState?.isDrawing) {
                this.updateToolbarHover(pos[0], pos[1]);
                this.updateCanvasCursor();
                this.setDirtyCanvas(true); 
                return;
            }
            this._hasMovedSinceDown = true;
            const [x, y] = this.getLocalMousePosition(pos);
            
            
            let rawPressure = 0.5; 
            if (e && typeof e.pressure === 'number' && e.pressure >= 0 && e.pressure <= 1) {
                rawPressure = e.pressure;
            } else if (e && e.pointerType === 'pen' && typeof e.pressure === 'number') {
                rawPressure = e.pressure;
            } else if (e && e.originalEvent && typeof e.originalEvent.pressure === 'number') {
                rawPressure = e.originalEvent.pressure;
            }
            
            const pressure = this.calculatePressure(rawPressure);
            switch (this.canvasState.tool) {
                case PAINT_TOOLS.BRUSH:
                case PAINT_TOOLS.ERASER:
                case PAINT_TOOLS.MASK:
                    const isMaskTool = this.canvasState.tool === PAINT_TOOLS.MASK;
                    const targetCtx = isMaskTool ? this.maskCtx : this.drawingCtx;
                    if (this.canvasState.tool === PAINT_TOOLS.ERASER) {
                        targetCtx.globalCompositeOperation = DRAWING_DEFAULTS.ERASER_COMPOSITE_OP;
                    } else {
                        targetCtx.globalCompositeOperation = DRAWING_DEFAULTS.BRUSH_COMPOSITE_OP;
                    }
                    const newPoint = { 
                        x, 
                        y, 
                        pressure, 
                        time: performance.now() 
                    };
                    this.canvasState.lastPoints.push(newPoint);
                    if (!this.canvasState.strokePoints) {
                        this.canvasState.strokePoints = [];
                    }
                    this.canvasState.strokePoints.push(newPoint);
                    if (this.canvasState.lastPoints.length > 500) {
                        this.canvasState.lastPoints.shift();
                    }
                    
                    
                    const points = this.canvasState.lastPoints.slice(-2);
                    if (points.length < 2) break;
                    const prev = points[0];
                    if (this.canvasState.tool === PAINT_TOOLS.BRUSH) {
                        if (this.drawingCtx) {
                            this.canvasState.distanceSinceLastStamp = AdvancedBrush.drawSegment(
                                this.drawingCtx,
                                prev,
                                newPoint,
                                this.canvasState.color,
                                this.canvasState.brushSize,
                                this.canvasState.opacity,
                                this.canvasState.brushSpacing,
                                this.canvasState.distanceSinceLastStamp || 0,
                                this.canvasState.pressureSensitivity,
                                this.canvasState.brushHardness,
                                this.canvasState.brushFlow,
                                this.canvasState.brushPreset,
                                this.canvasState.scattering,
                                this.canvasState.shapeDynamics,
                                this.canvasState.texture,
                                this.canvasState.dualBrush
                            );
                        }
                    } else if (this.canvasState.tool === PAINT_TOOLS.ERASER) {
                        SmartEraser.erase(targetCtx, points, 
                            this.canvasState.brushSize * (pressure || 1),
                            this.canvasState.opacity,
                            this.canvasState.brushHardness ?? TOOL_SETTINGS.ERASER.DEFAULT_HARDNESS,
                            pressure || AdvancedBrush.currentPressure
                        );
                    } else if (this.canvasState.tool === PAINT_TOOLS.MASK) {
                        AdvancedBrush.drawSegment(
                            targetCtx, 
                            prev,
                            newPoint,
                            '#FFFFFF', 
                            this.canvasState.brushSize,
                            1.0, 
                            this.canvasState.brushSpacing,
                            0, 
                            this.canvasState.pressureSensitivity,
                            this.canvasState.maskHardness, 
                            1.0, 
                            this.canvasState.brushPreset,
                            0, 0, 'none', 'none' 
                        );
                    }
                    this.canvasState.lastX = x;
                    this.canvasState.lastY = y;
                    break;
                case PAINT_TOOLS.LINE:
                case PAINT_TOOLS.RECTANGLE:
                case PAINT_TOOLS.CIRCLE:
                case PAINT_TOOLS.GRADIENT:
                    this.canvasState.lastX = x;
                    this.canvasState.lastY = y;
                    break;
                default:
                    break;
            }
            this.setDirtyCanvas(true);
            this.canvasState.isDirty = true;
        };
        nodeType.prototype.onMouseUp = function(e, pos) {
            if (!this.canvasState?.isDrawing) return;
            if (this._clickReleaseTimeout) {
                clearTimeout(this._clickReleaseTimeout);
                this._clickReleaseTimeout = null;
            }
            const [x, y] = this.getLocalMousePosition(pos || this.lastMousePos);
            switch(this.canvasState.tool) {
                case PAINT_TOOLS.BRUSH:
                    this.canvasState.distanceSinceLastStamp = 0;
                    this.canvasState.lastPoints = []; 
                    this.canvasState.strokePoints = []; 
                    this._preStrokeCanvasData = null; 
                    break;
                case PAINT_TOOLS.ERASER:
                case PAINT_TOOLS.MASK:
                    this.canvasState.lastPoints = [];
                    break;
                case PAINT_TOOLS.LINE:
                    this.drawingCtx.globalCompositeOperation = DRAWING_DEFAULTS.BRUSH_COMPOSITE_OP;
                    this.drawingCtx.strokeStyle = this.canvasState.color;
                    this.drawingCtx.lineWidth = this.canvasState.brushSize;
                    const lineSettings = this.settingsManager.getToolSettings(PAINT_TOOLS.LINE);
                    LineTool.draw(
                        this.drawingCtx,
                        this.canvasState.startX,
                        this.canvasState.startY,
                        x,
                        y,
                        this.canvasState.color,
                        this.canvasState.brushSize,
                        lineSettings
                    );
                    break;
                case PAINT_TOOLS.RECTANGLE:
                    this.drawingCtx.globalCompositeOperation = DRAWING_DEFAULTS.BRUSH_COMPOSITE_OP;
                    this.drawingCtx.strokeStyle = this.canvasState.color;
                    this.drawingCtx.lineWidth = this.canvasState.brushSize;
                    const rectangleSettings = this.settingsManager.getToolSettings(PAINT_TOOLS.RECTANGLE);
                    rectangleSettings.fillStyle = this.canvasState.rectangleFillStyle;
                    rectangleSettings.fillColor = this.canvasState.rectangleFillColor;
                    rectangleSettings.fillEndColor = this.canvasState.rectangleFillEndColor;
                    rectangleSettings.borderRadius = this.canvasState.rectangleBorderRadius;
                    rectangleSettings.rotation = this.canvasState.rectangleRotation;
                    RectangleTool.draw(
                        this.drawingCtx,
                        this.canvasState.startX,
                        this.canvasState.startY,
                        x,
                        y,
                        this.canvasState.color,
                        this.canvasState.brushSize,
                        rectangleSettings
                    );
                    break;
                case PAINT_TOOLS.CIRCLE:
                    this.drawingCtx.globalCompositeOperation = DRAWING_DEFAULTS.BRUSH_COMPOSITE_OP;
                    this.drawingCtx.strokeStyle = this.canvasState.color;
                    this.drawingCtx.lineWidth = this.canvasState.brushSize;
                    const circleSettings = this.settingsManager.getToolSettings(PAINT_TOOLS.CIRCLE);
                    circleSettings.fillStyle = this.canvasState.circleFillStyle;
                    circleSettings.fillColor = this.canvasState.circleFillColor;
                    circleSettings.fillEndColor = this.canvasState.circleFillEndColor;
                    circleSettings.startAngle = this.canvasState.circleStartAngle;
                    circleSettings.endAngle = this.canvasState.circleEndAngle;
                    CircleTool.draw(
                        this.drawingCtx,
                        this.canvasState.startX,
                        this.canvasState.startY,
                        x,
                        y,
                        this.canvasState.color,
                        this.canvasState.brushSize,
                        circleSettings
                    );
                    break;
                case PAINT_TOOLS.GRADIENT:
                    GradientTool.draw(
                        this.drawingCtx,
                        this.canvasState.startX,
                        this.canvasState.startY,
                        x,
                        y,
                        this.canvasState.color,
                        this.canvasState.gradientEndColor || '#000000',
                        this.canvasState.gradientType || 'linear',
                        this.canvasState.gradientSmoothness || 0.5,
                        this.canvasState.opacity || 1.0
                    );
                    break;
            }
            if (this.canvasState.isDirty) {
                this.updateCanvasWidget();
                this.canvasState.isDirty = false;
                this.saveToHistory();
            }
            this.canvasState.isDrawing = false;
            this.setDirtyCanvas(true);
        };
        nodeType.prototype.redrawFinalBrushStroke = function() {
            if (!this.drawingCtx || !this.canvasState.strokePoints || this.canvasState.strokePoints.length < 2) {
                return;
            }
            const ctx_draw = this.drawingCtx;
            ctx_draw.save();
            ctx_draw.globalAlpha = this.canvasState.opacity;
            ctx_draw.globalCompositeOperation = 'source-over';
            AdvancedBrush.beginStroke();
            let distance = 0;
            for (let i = 1; i < this.canvasState.strokePoints.length; i++) {
                const p1 = this.canvasState.strokePoints[i-1];
                const p2 = this.canvasState.strokePoints[i];
                distance = AdvancedBrush.drawSegment(
                    ctx_draw, 
                    p1, 
                    p2,
                    this.canvasState.color,
                    this.canvasState.brushSize,
                    this.canvasState.opacity, 
                    this.canvasState.brushSpacing,
                    distance, 
                    this.canvasState.pressureSensitivity,
                    this.canvasState.brushHardness,
                    this.canvasState.brushFlow,
                    this.canvasState.brushPreset,
                    this.canvasState.scattering,
                    this.canvasState.shapeDynamics,
                    this.canvasState.texture,
                    this.canvasState.dualBrush
                );
            }
            ctx_draw.restore();
        };
        nodeType.prototype.drawShapePreview = function(ctx, currentX, currentY) {
            ctx.save();
            ctx.globalAlpha = 0.6; 
            ctx.lineWidth = this.canvasState.brushSize;
            ctx.strokeStyle = this.canvasState.color;
            ctx.globalCompositeOperation = DRAWING_DEFAULTS.BRUSH_COMPOSITE_OP;
            if(this.canvasState.tool === PAINT_TOOLS.MASK) {
                ctx.strokeStyle = '#ffffff';
            }
            switch(this.canvasState.tool) {
                 case PAINT_TOOLS.LINE:
                    const linePreviewSettings = this.settingsManager.getToolSettings(PAINT_TOOLS.LINE);
                    LineTool.draw(ctx, this.canvasState.startX, this.canvasState.startY, currentX, currentY, ctx.strokeStyle, ctx.lineWidth, linePreviewSettings);
                    break;
                                 case PAINT_TOOLS.RECTANGLE:
                    const rectanglePreviewSettings = this.settingsManager.getToolSettings(PAINT_TOOLS.RECTANGLE);
                    rectanglePreviewSettings.fillEndColor = this.canvasState.rectangleFillEndColor;
                    RectangleTool.draw(ctx, this.canvasState.startX, this.canvasState.startY, currentX, currentY, ctx.strokeStyle, ctx.lineWidth, rectanglePreviewSettings);
                    break;
                                 case PAINT_TOOLS.CIRCLE:
                    const circlePreviewSettings = this.settingsManager.getToolSettings(PAINT_TOOLS.CIRCLE);
                    circlePreviewSettings.fillEndColor = this.canvasState.circleFillEndColor;
                    CircleTool.draw(ctx, this.canvasState.startX, this.canvasState.startY, currentX, currentY, ctx.strokeStyle, ctx.lineWidth, circlePreviewSettings);
                    break;
            }
            ctx.restore();
        };
        nodeType.prototype.startToolAction = function(x, y) {
            if (this.canvasState.tool === PAINT_TOOLS.BRUSH) {
                if (this.strokeShapeCtx) {
                    this.strokeShapeCtx.clearRect(0, 0, this.strokeShapeCanvas.width, this.strokeShapeCanvas.height);
                }
                AdvancedBrush.beginStroke();
                this.canvasState.lastPoints = [{ 
                    x, 
                    y, 
                    time: performance.now(), 
                    pressure: this.calculatePressure(0),
                    taper: true 
                }];
                this.canvasState.strokePoints = [{ 
                    x, y, time: performance.now(), 
                    pressure: this.calculatePressure(0) 
                }];
                const ctx = this.drawingCtx;
                ctx.save();
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.restore();
            } else if (this.canvasState.tool === PAINT_TOOLS.ERASER) {
                const ctx = this.drawingCtx;
                ctx.save();
                ctx.globalCompositeOperation = DRAWING_DEFAULTS.ERASER_COMPOSITE_OP;
                ctx.restore();
            } else if (this.canvasState.tool === PAINT_TOOLS.MASK) {
                const ctx = this.maskCtx;
                ctx.save();
                ctx.restore();
            }
            this.saveToHistory();
        };
        nodeType.prototype.saveToHistory = function() {
            if (!this.history) {
                this.history = [];
                this.historyIndex = -1;
            }
            if (this.history.length >= PERFORMANCE_CONFIG.HISTORY_LIMIT) {
                this.history.shift(); 
                this.historyIndex = Math.max(0, this.historyIndex - 1);
            }
            const state = {
                drawing: this.drawingCtx.getImageData(0, 0, this.drawingCanvas.width, this.drawingCanvas.height),
                mask: this.maskCtx.getImageData(0, 0, this.maskCanvas.width, this.maskCanvas.height)
            };
            this.history.push(state);
            this.historyIndex = this.history.length - 1;
        };
        nodeType.prototype.undo = function() {
            if (this.historyIndex > 0) {
                this.historyIndex--;
                const state = this.history[this.historyIndex];
                this.drawingCtx.putImageData(state.drawing, 0, 0);
                this.maskCtx.putImageData(state.mask, 0, 0);
                this.setDirtyCanvas(true);
                this.updateCanvasWidget(); 
            }
        };
        nodeType.prototype.redo = function() {
            if (this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
                const state = this.history[this.historyIndex];
                this.drawingCtx.putImageData(state.drawing, 0, 0);
                this.maskCtx.putImageData(state.mask, 0, 0);
                this.setDirtyCanvas(true);
                this.updateCanvasWidget(); 
            }
        };
        nodeType.prototype.onExecuted = function(message) {
            if (!this.isInputConnected(0)) {
                if (!this.currentImage) {
                    this.currentImage = this.createFallbackImage(512, 512);
                    this._resizeCanvases(512, 512);
                    this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
                    this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
                    this.maskCtx.fillStyle = '#000000';
                    this.maskCtx.fillRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
                }
                return;
            }
            this.inputImage = this.getInputData(0);
            this._initializeNode();
        };
        nodeType.prototype.clearMaskCanvas = function() {
            this.maskCtx.fillStyle = 'rgba(0,0,0,0)';
            this.maskCtx.fillRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
        };
        nodeType.prototype.getOutputData = async function() {
            const targetWidth = this.logicalWidth || this.drawingCanvas.width; 
            const targetHeight = this.logicalHeight || this.drawingCanvas.height;
            let imageTensor = null;
            if (this.outputs && this.outputs[0] && this.outputs[0].links && this.outputs[0].links.length > 0) {
                const ctx = this.drawingCtx; 
                const imageData = ctx.getImageData(0, 0, this.drawingCanvas.width, this.drawingCanvas.height); 
                const data = imageData.data;
                const imageArray = new Float32Array(targetHeight * targetWidth * 3);
                for (let y = 0; y < targetHeight; y++) {
                    for (let x = 0; x < targetWidth; x++) {
                        const originalX = Math.floor(x * (this.drawingCanvas.width / targetWidth));
                        const originalY = Math.floor(y * (this.drawingCanvas.height / targetHeight));
                        const originalIndex = (originalY * this.drawingCanvas.width + originalX) * 4;
                        const outputBaseIndex = (y * targetWidth + x) * 3;
                        if (!this.isInputConnected(0)) {
                            const alpha = data[originalIndex + 3] / 255.0;
                            imageArray[outputBaseIndex + 0] = (data[originalIndex + 0] / 255.0) * alpha;
                            imageArray[outputBaseIndex + 1] = (data[originalIndex + 1] / 255.0) * alpha;
                            imageArray[outputBaseIndex + 2] = (data[originalIndex + 2] / 255.0) * alpha;
                        } else {
                            imageArray[outputBaseIndex + 0] = data[originalIndex + 0] / 255.0;
                            imageArray[outputBaseIndex + 1] = data[originalIndex + 1] / 255.0;
                            imageArray[outputBaseIndex + 2] = data[originalIndex + 2] / 255.0;
                        }
                    }
                }
                imageTensor = { shape: [1, targetHeight, targetWidth, 3], data: imageArray };
            } else {
                imageTensor = { shape: [1, targetHeight, targetWidth, 3], data: null };
            }
            let maskTensor = null;
            if (this.outputs && this.outputs[1] && this.outputs[1].links && this.outputs[1].links.length > 0) {
                const maskTargetWidth = targetWidth; 
                const maskTargetHeight = targetHeight;
                const maskCtxLocal = this.maskCtx;
                const maskData = maskCtxLocal.getImageData(0, 0, this.maskCanvas.width, this.maskCanvas.height);
                const data = maskData.data;
                const maskArray = new Float32Array(maskTargetWidth * maskTargetHeight);
                for (let y = 0; y < maskTargetHeight; y++) {
                    for (let x = 0; x < maskTargetWidth; x++) {
                        const originalX = Math.floor(x * (this.maskCanvas.width / maskTargetWidth));
                        const originalY = Math.floor(y * (this.maskCanvas.height / maskTargetHeight));
                        const originalIndex = (originalY * this.maskCanvas.width + originalX) * 4;
                        const outputIndex = y * maskTargetWidth + x;
                        maskArray[outputIndex] = data[originalIndex] / 255.0; 
                    }
                }
                maskTensor = { shape: [1, maskTargetHeight, maskTargetWidth], data: maskArray };
            } else {
                const maskTargetWidth = targetWidth;
                const maskTargetHeight = targetHeight;
                const emptyMask = new Float32Array(maskTargetWidth * maskTargetHeight).fill(0.0);
                maskTensor = { shape: [1, maskTargetHeight, maskTargetWidth], data: emptyMask };
            }
            return [imageTensor, maskTensor];
        };
        nodeType.prototype.onExecute = async function() { 
        };
        nodeType.prototype.getExtraMenuOptions = function(_, options) {
            options.push(
                {
                    content: "Toggle Mask View",
                    callback: () => {
                        this.properties.showMask = !this.properties.showMask;
                        this.setDirtyCanvas(true);
                    }
                },
                {
                    content: "Undo",
                    callback: () => this.undo()
                },
                {
                    content: "Redo",
                    callback: () => this.redo()
                },
                {
                    content: "Clear Canvas",
                    callback: () => {
                        this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
                        this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
                        if (this.originalImage) {
                            this.drawingCtx.drawImage(this.originalImage, 0, 0);
                        }
                        this.saveToHistory();
                        this.setDirtyCanvas(true);
                        this.updateCanvasWidget(); 
                    }
                }
            );
        };
        nodeType.prototype._initializeWidgets = function() {
            if (this.widgets) {
                for (const w of this.widgets) {
                    w.hidden = true;
                }
            }
            this.serialize_widgets = true;
        };
        nodeType.prototype.getLocalMousePosition = function(pos) {
            const { scale, offsetX, offsetY } = this.getDisplayMetrics();
            const [mouseX, mouseY] = pos;
            const canvasX = (mouseX - offsetX) / scale;
            const canvasY = (mouseY - offsetY) / scale;
            return [canvasX, canvasY];
        };
        nodeType.prototype._handleConnectionsChange = function(type, index, connected, link_info) {
            if (type === LiteGraph.INPUT && index === 0) { 
                if (connected && link_info) {
                    const inputNode = app.graph.getNodeById(link_info.origin_id);
                    if (inputNode) {
                        if (inputNode.imgs && inputNode.imgs.length > 0) {
                            this.originalImage = inputNode.imgs[0];
                            this.currentImage = inputNode.imgs[0];
                            this.updateCanvasWithImage(this.currentImage);
                        } else if (inputNode.imageData) {
                            const img = new Image();
                            const url = imageDataToUrl(inputNode.imageData);
                            img.onload = () => {
                                this.originalImage = img;
                                this.currentImage = img;
                                this.updateCanvasWithImage(img);
                            };
                            img.onerror = () => {
                                console.error("Failed to load image from input node");
                            };
                            img.src = url;
                        }
                    }
                } else {
                    this.originalImage = null;
                    this.currentImage = null;
                    this.clearCanvas();
                }
            }
        };
        nodeType.prototype.updateCanvasWithImage = function(img) {
            if (!img || img.naturalWidth === 0 || img.naturalHeight === 0) {
                console.warn("Invalid image provided to updateCanvasWithImage, skipping update.");
                return;
            }
            this.logicalWidth = img.naturalWidth;
            this.logicalHeight = img.naturalHeight;
            this._resizeCanvases(img.naturalWidth, img.naturalHeight);
            this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
            this.maskCtx.fillStyle = '#000000';
            this.maskCtx.fillRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
            this.originalImage = img;
            this.currentImage = img;
            this.saveToHistory();
            this.setDirtyCanvas(true, true);
        };
        nodeType.prototype.clearCanvas = function() {
            if (this.drawingCanvas) {
                this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
            }
            if (this.maskCanvas) {
                this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
            }
            this.setDirtyCanvas(true);
        };
        nodeType.prototype.drawTooltip = function(ctx, text, x, y) {
            const { TOOLTIPS } = UI_CONFIG;
            ctx.font = "11px Arial"; 
            const metrics = ctx.measureText(text);
            const padding = TOOLTIPS.PADDING;
            ctx.fillStyle = TOOLTIPS.BACKGROUND;
            ctx.beginPath();
            ctx.roundRect(x - metrics.width / 2 - padding, y,
                         metrics.width + padding * 2, 22, 
                         TOOLTIPS.BORDER_RADIUS);
            ctx.fill();
            ctx.fillStyle = TOOLTIPS.TEXT;
            ctx.textAlign = "center";
            ctx.fillText(text, x, y + 15); 
        };
        nodeType.prototype.getCanvasArea = function() {
            const { TOOLBAR } = UI_CONFIG;
            const metrics = this._getScaledToolbarMetrics();
            const toolbarWidth = metrics.toolbarWidth;
            const leftPadding = CANVAS_PADDING.LEFT;  
            const rightPadding = CANVAS_PADDING.RIGHT;  
            const topPadding = CANVAS_PADDING.TOP;    
            const bottomPadding = CANVAS_PADDING.BOTTOM; 
            return {
                x: toolbarWidth + leftPadding,  
                y: topPadding,                  
                width: this.size[0] - toolbarWidth - leftPadding - rightPadding, 
                height: this.size[1] - this.quickControlsBarHeight - topPadding - bottomPadding 
            };
        };
        nodeType.prototype.updateCanvasCursor = function() {
            if (!this.canvasState) return;
            const canvasArea = this.getCanvasArea();
            const isOverCanvas = this.lastMousePos &&
                this.lastMousePos[0] >= canvasArea.x &&
                this.lastMousePos[0] <= canvasArea.x + canvasArea.width &&
                this.lastMousePos[1] >= canvasArea.y &&
                this.lastMousePos[1] <= canvasArea.y + canvasArea.height;
            const graphCanvas = this.graph?.canvas;
            if (!graphCanvas) return;
            if (!isOverCanvas) {
                graphCanvas.canvas.style.cursor = 'default';
                return;
            }
            switch (this.canvasState.tool) {
                case PAINT_TOOLS.BRUSH:
                case PAINT_TOOLS.ERASER:
                    graphCanvas.canvas.style.cursor = 'none';
                    break;
                case PAINT_TOOLS.EYEDROPPER:
                    graphCanvas.canvas.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"white\" stroke-width=\"2\"><path d=\"M15.5355 2.80744C17.0976 1.24534 19.6303 1.24534 21.1924 2.80744C22.7545 4.36953 22.7545 6.90219 21.1924 8.46429L18.3638 11.2929L18.7175 11.6466C19.108 12.0371 19.108 12.6703 18.7175 13.0608C18.327 13.4513 17.6938 13.4513 17.3033 13.0608L16.9498 12.7073L10.7351 18.922C10.1767 19.4804 9.46547 19.861 8.6911 20.0159L6.93694 20.3667C6.54976 20.4442 6.19416 20.6345 5.91496 20.9137L4.92894 21.8997C4.53841 22.2902 3.90525 22.2902 3.51472 21.8997L2.10051 20.4855C1.70999 20.095 1.70999 19.4618 2.10051 19.0713L3.08653 18.0852C3.36574 17.806 3.55605 17.4504 3.63348 17.0633L3.98431 15.3091C4.13919 14.5347 4.51981 13.8235 5.07821 13.2651L11.2929 7.05045L10.9393 6.69686C10.5488 6.30634 10.5488 5.67317 10.9393 5.28265C11.3299 4.89212 11.963 4.89212 12.3535 5.28265L12.7069 5.63604L15.5355 2.80744Z\"/></svg>') 0 24, auto";
                    break;
                case PAINT_TOOLS.ERASER:
                     graphCanvas.canvas.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"white\" stroke-width=\"2\"><path d=\"M8.58564 8.85449L3.63589 13.8042L8.83021 18.9985L9.99985 18.9978V18.9966H11.1714L14.9496 15.2184L8.58564 8.85449ZM9.99985 7.44027L16.3638 13.8042L19.1922 10.9758L12.8283 4.61185L9.99985 7.44027Z\"/></svg>') 0 24, auto";
                    break;
                case PAINT_TOOLS.MASK:
                    graphCanvas.canvas.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><circle cx=\'12\' cy=\'12\' r=\'10\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-dasharray=\'3,3\'/><circle cx=\'12\' cy=\'12\' r=\'6\' fill=\'white\'/></svg>") 12 12, crosshair';
                    break;
                case PAINT_TOOLS.FILL:
                    graphCanvas.canvas.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"white\" stroke-width=\"2\"><path d=\"M10.9999 6.02946L3.92886 13.1005H18.071L10.9999 6.02946Z\"/></svg>') 0 24, auto";
                    break;
                case PAINT_TOOLS.GRADIENT:
                    graphCanvas.canvas.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><defs><linearGradient id=\'grad\' x1=\'0%\' y1=\'0%\' x2=\'100%\' y2=\'100%\'><stop offset=\'0%\' style=\'stop-color:rgb(255,0,0);stop-opacity:1\' /><stop offset=\'100%\' style=\'stop-color:rgb(0,0,255);stop-opacity:1\' /></linearGradient></defs><rect x=\'4\' y=\'4\' width=\'16\' height=\'16\' fill=\'url(%23grad)\' stroke=\'white\' stroke-width=\'1\'/></svg>") 12 12, crosshair';
                    break;
                case PAINT_TOOLS.LINE:
                case PAINT_TOOLS.RECTANGLE:
                case PAINT_TOOLS.CIRCLE:
                    graphCanvas.canvas.style.cursor = 'crosshair';
                    break;
                default:
                    graphCanvas.canvas.style.cursor = 'default';
                    break;
            }
        };
        nodeType.prototype.optimizeCanvas = function() {
            if ((window.devicePixelRatio > 1.5 || 
                (this.drawingCanvas && this.drawingCanvas.width > 2048) || 
                (this.drawingCanvas && this.drawingCanvas.height > 2048)) && 
                !this._canvasOptimized) {
                if (this.drawingCtx) {
                    this.drawingCtx.imageSmoothingEnabled = true;
                    this.drawingCtx.imageSmoothingQuality = 'medium'; 
                }
                if (this.maskCtx) {
                    this.maskCtx.imageSmoothingEnabled = true;
                    this.maskCtx.imageSmoothingQuality = 'medium';
                }
                if (this.strokeShapeCtx) {
                    this.strokeShapeCtx.imageSmoothingEnabled = true;
                    this.strokeShapeCtx.imageSmoothingQuality = 'medium';
                }
                if (this.livePreviewCtx) {
                    this.livePreviewCtx.imageSmoothingEnabled = true;
                    this.livePreviewCtx.imageSmoothingQuality = 'medium';
                }
                this._canvasOptimized = Date.now();
            }
        };
        nodeType.prototype.cleanupMemory = function() {
            const now = Date.now();
            if (!this._lastInteractionTime) {
                this._lastInteractionTime = now;
                return;
            }
            if (now - this._lastInteractionTime > 60000) {
                if (this.history && this.history.length > 5) {
                    this.history = this.history.slice(-5);
                    this.historyIndex = Math.min(this.historyIndex, this.history.length - 1);
                }
            }
        };
        nodeType.prototype.onMouseDown = function(e, pos) {
            if (!pos || !pos.length) return;
            this.lastMousePos = pos; 
            this._lastInteractionTime = Date.now();
            const canvasArea = this.getCanvasArea();
            const isOverCanvas = (
                pos[0] >= canvasArea.x &&
                pos[0] <= canvasArea.x + canvasArea.width &&
                pos[1] >= canvasArea.y &&
                pos[1] <= canvasArea.y + canvasArea.height
            );
            if (this._handleQuickControlsMouseDown(e, pos)) {
                return; 
            }
            if (this._handleToolbarMouseDown(pos)) {
                return; 
            }
            if (isOverCanvas) {
                e.stopImmediatePropagation();
                e.preventDefault();
                e.stopPropagation();
                const [x, y] = this.getLocalMousePosition(pos);
                switch(this.canvasState.tool) {
                    case PAINT_TOOLS.EYEDROPPER:
                        const combined = this.createCombinedContext(x, y, this.canvasState.eyedropperSampleSize || 5);
                        if (combined && combined.ctx) {
                            const pickX = combined.size / 2;
                            const pickY = combined.size / 2;
                            const pickedColor = EyedropperTool.pick(combined.ctx, pickX, pickY, this.canvasState);
                            this.canvasState.color = pickedColor;
                            if (this.showSettings && this.settingsManager) {
                                this.settingsManager.updateSettings(this.canvasState.tool);
                            }
                            this.setDirtyCanvas(true, true);
                            this.canvasState.tool = this.canvasState.previousTool || PAINT_TOOLS.BRUSH;
                            if (this.showSettings && this.settingsManager) {
                                this.settingsManager.updateSettings(this.canvasState.tool);
                            }
                        }
                        break;
                    case PAINT_TOOLS.FILL:
                        const ctxFill = (this.canvasState.tool === PAINT_TOOLS.MASK || 
                            (this.properties.showMask && this.canvasState.tool === PAINT_TOOLS.ERASER))
                            ? this.maskCtx
                            : this.drawingCtx;
                        const fillColor = ColorUtils.hexToRgb(this.canvasState.color);
                        const targetColor = [fillColor.r, fillColor.g, fillColor.b, 255];
                        FillTool.fill(ctxFill, Math.floor(x), Math.floor(y), targetColor, 
                            this.canvasState.fillTolerance || TOOL_SETTINGS.FILL.DEFAULT_TOLERANCE);
                        this.saveToHistory();
                        this.updateCanvasWidget();
                        this.setDirtyCanvas(true);
                        break;
                    case PAINT_TOOLS.LINE:
                    case PAINT_TOOLS.RECTANGLE:
                    case PAINT_TOOLS.CIRCLE:
                    case PAINT_TOOLS.GRADIENT:
                        this.canvasState.isDrawing = true;
                        this.canvasState.startX = x;
                        this.canvasState.startY = y;
                        this.canvasState.lastX = x;
                        this.canvasState.lastY = y;
                        this.setDirtyCanvas(true);
                        break;
                    case PAINT_TOOLS.BRUSH:
                    case PAINT_TOOLS.ERASER:
                    case PAINT_TOOLS.MASK:
                        this.canvasState.isDrawing = true;
                        this.canvasState.startX = x;
                        this.canvasState.startY = y;
                        this.canvasState.lastX = x;
                        this.canvasState.lastY = y;
                        
                        let rawPressure = 0.5; 
                        if (e && typeof e.pressure === 'number' && e.pressure >= 0 && e.pressure <= 1) {
                            rawPressure = e.pressure;
                        } else if (e && e.pointerType === 'pen' && typeof e.pressure === 'number') {
                            rawPressure = e.pressure;
                        } else if (e && e.originalEvent && typeof e.originalEvent.pressure === 'number') {
                            rawPressure = e.originalEvent.pressure;
                        }
                        const initialPressure = this.calculatePressure(rawPressure);
                        this.canvasState.lastPoints = [{ 
                            x, y, time: performance.now(), 
                            pressure: initialPressure 
                        }];
                        this.canvasState.strokePoints = [{ 
                            x, y, time: performance.now(), 
                            pressure: initialPressure 
                        }];
                        this.startToolAction(x, y);
                        this.setDirtyCanvas(true);
                        this._hasMovedSinceDown = false;
                        if (this._clickReleaseTimeout) clearTimeout(this._clickReleaseTimeout);
                        this._clickReleaseTimeout = setTimeout(() => {
                            if (this.canvasState && this.canvasState.isDrawing && !this._hasMovedSinceDown) {
                                this.onMouseUp(e, pos);
                            }
                        }, 50);
                        break;
                }
                return true; 
            }
        };
        nodeType.prototype._handleToolbarMouseDown = function(pos) {
            const metrics = this._getScaledToolbarMetrics();
            const toolbarWidth = metrics.toolbarWidth;
            if (pos[0] < toolbarWidth * 1.2) {
                return this.handleToolbarClick(pos[0], pos[1]);
            }
            return false; 
        };
        nodeType.prototype._handleQuickControlsMouseDown = function(e, pos) {
            const quickControlsBounds = this.getQuickControlsBarBounds();
            const isOverQuickControls = (
                pos[0] >= quickControlsBounds.x &&
                pos[0] <= quickControlsBounds.x + quickControlsBounds.width &&
                pos[1] >= quickControlsBounds.y &&
                pos[1] <= quickControlsBounds.y + quickControlsBounds.height
            );
            if (isOverQuickControls && this.settingsManager && this.settingsManager.handleQuickControlsInteraction) {
                const localPos = { x: pos[0], y: pos[1], event: e };
                const result = this.settingsManager.handleQuickControlsInteraction('pointerdown', localPos, this.canvasState);
                if (result.redraw) {
                    this.setDirtyCanvas(true);
                }
                if (result.handled) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    e.stopPropagation();
                    return true; 
                }
            }
            return false; 
        };
        nodeType.prototype.handleToolbarClick = function(x, y) {
            const { TOOLBAR } = UI_CONFIG;
            if (!this.canvasState) { 
                this._initializeNode(); 
            }
            const toolCount = Object.values(PAINT_TOOLS).length;
            for (let i = 0; i < toolCount; i++) {
                const bounds = this.getToolbarItemBounds(i);
                if (x >= bounds.x && x <= bounds.x + bounds.width && 
                    y >= bounds.y && y <= bounds.y + bounds.height) {
                    const tool = Object.values(PAINT_TOOLS)[i];
                    this._handleToolChange(tool);
                    
                    if (this.showSettings && this.settingsManager) {
                        this.settingsManager.updateSettings(tool);
                    }
                    this.updateCanvasCursor();
                    return true;
                }
            }
            const settingsBounds = this.getToolbarItemBounds(toolCount);
            if (x >= settingsBounds.x && x <= settingsBounds.x + settingsBounds.width && 
                y >= settingsBounds.y && y <= settingsBounds.y + settingsBounds.height) {
                
                
                this.hoveredTool = 'settings';

                if (this.settingsManager) {
                if (this.showSettings) {
                        this.settingsManager.setVisible(false);
                        this.showSettings = false;
                } else {
                        this.settingsManager.updateSettings(this.canvasState.tool); 
                        this.settingsManager.setVisible(true);
                        this.showSettings = true;
                    }
                }
                return true;
            }
            return false;
        };
        nodeType.prototype.isOverCanvas = function(pos) {
            if (!pos || !Array.isArray(pos)) return false;
            const canvasArea = this.getCanvasArea();
            return pos[0] > canvasArea.x && 
                   pos[0] < canvasArea.x + canvasArea.width &&
                   pos[1] > canvasArea.y && 
                   pos[1] < canvasArea.y + canvasArea.height;
        };
        nodeType.prototype.getMinSize = function() {
            return [250, 300];
        };
        nodeType.prototype.onResize = function(size) {
            if (size[0] < 250) size[0] = 250;
            if (size[1] < 300) size[1] = 300;
            this.size = size;
            this.setDirtyCanvas(true, true);
        };
        nodeType.prototype.preloadToolIcons = function() {
                this._iconCache = {}; 
            const PAINT_TOOL_ICONS = {
                [PAINT_TOOLS.BRUSH]: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff"><path d="M15.4565 9.67503L15.3144 9.53297C14.6661 8.90796 13.8549 8.43369 12.9235 8.18412C10.0168 7.40527 7.22541 9.05273 6.43185 12.0143C6.38901 12.1742 6.36574 12.3537 6.3285 12.8051C6.17423 14.6752 5.73449 16.0697 4.5286 17.4842C6.78847 18.3727 9.46572 18.9986 11.5016 18.9986C13.9702 18.9986 16.1644 17.3394 16.8126 14.9202C17.3306 12.9869 16.7513 11.0181 15.4565 9.67503ZM13.2886 6.21301L18.2278 2.37142C18.6259 2.0618 19.1922 2.09706 19.5488 2.45367L22.543 5.44787C22.8997 5.80448 22.9349 6.37082 22.6253 6.76891L18.7847 11.7068C19.0778 12.8951 19.0836 14.1721 18.7444 15.4379C17.8463 18.7897 14.8142 20.9986 11.5016 20.9986C8 20.9986 3.5 19.4967 1 17.9967C4.97978 14.9967 4.04722 13.1865 4.5 11.4967C5.55843 7.54658 9.34224 5.23935 13.2886 6.21301ZM16.7015 8.09161C16.7673 8.15506 16.8319 8.21964 16.8952 8.28533L18.0297 9.41984L20.5046 6.23786L18.7589 4.4921L15.5769 6.96698L16.7015 8.09161Z"/></svg>')}`,
                [PAINT_TOOLS.ERASER]: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff"><path d="M8.58564 8.85449L3.63589 13.8042L8.83021 18.9985L9.99985 18.9978V18.9966H11.1714L14.9496 15.2184L8.58564 8.85449ZM9.99985 7.44027L16.3638 13.8042L19.1922 10.9758L12.8283 4.61185L9.99985 7.44027ZM13.9999 18.9966H20.9999V20.9966H11.9999L8.00229 20.9991L1.51457 14.5113C1.12405 14.1208 1.12405 13.4877 1.51457 13.0971L12.1212 2.49053C12.5117 2.1 13.1449 2.1 13.5354 2.49053L21.3136 10.2687C21.7041 10.6592 21.7041 11.2924 21.3136 11.6829L13.9999 18.9966Z"/></svg>')}`,
                [PAINT_TOOLS.FILL]: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff"><path d="M19.2277 18.7323L20.9955 16.9645L22.7632 18.7323C23.7395 19.7086 23.7395 21.2915 22.7632 22.2678C21.7869 23.2441 20.204 23.2441 19.2277 22.2678C18.2514 21.2915 18.2514 19.7086 19.2277 18.7323ZM8.87861 1.07971L20.1923 12.3934C20.5828 12.7839 20.5828 13.4171 20.1923 13.8076L11.707 22.2929C11.3165 22.6834 10.6833 22.6834 10.2928 22.2929L1.80754 13.8076C1.41702 13.4171 1.41702 12.7839 1.80754 12.3934L9.58572 4.61525L7.4644 2.49393L8.87861 1.07971ZM10.9999 6.02946L3.92886 13.1005H18.071L10.9999 6.02946Z"/></svg>')}`,
                [PAINT_TOOLS.LINE]: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff"><path d="M4.5 18.5L19.5 5.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/></svg>')}`,
                [PAINT_TOOLS.RECTANGLE]: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff"><path d="M3 4H21C21.5523 4 22 4.44772 22 5V19C22 19.5523 21.5523 20 21 20H3C2.44772 20 2 19.5523 2 19V5C2 4.44772 2.44772 4 3 4ZM4 6V18H20V6H4Z"/></svg>')}`,
                [PAINT_TOOLS.CIRCLE]: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z"/></svg>')}`,
                [PAINT_TOOLS.GRADIENT]: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff7e5f"/><stop offset="100%" stop-color="#feb47b"/></linearGradient></defs><path d="M4 4h16v16H4z" fill="url(#g1)" /></svg>')}`,
                [PAINT_TOOLS.EYEDROPPER]: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff"><path d="M15.5355 2.80744C17.0976 1.24534 19.6303 1.24534 21.1924 2.80744C22.7545 4.36953 22.7545 6.90219 21.1924 8.46429L18.3638 11.2929L18.7175 11.6466C19.108 12.0371 19.108 12.6703 18.7175 13.0608C18.327 13.4513 17.6938 13.4513 17.3033 13.0608L16.9498 12.7073L10.7351 18.922C10.1767 19.4804 9.46547 19.861 8.6911 20.0159L6.93694 20.3667C6.54976 20.4442 6.19416 20.6345 5.91496 20.9137L4.92894 21.8997C4.53841 22.2902 3.90525 22.2902 3.51472 21.8997L2.10051 20.4855C1.70999 20.095 1.70999 19.4618 2.10051 19.0713L3.08653 18.0852C3.36574 17.806 3.55605 17.4504 3.63348 17.0633L3.98431 15.3091C4.13919 14.5347 4.51981 13.8235 5.07821 13.2651L11.2929 7.05045L10.9393 6.69686C10.5488 6.30634 10.5488 5.67317 10.9393 5.28265C11.3299 4.89212 11.963 4.89212 12.3535 5.28265L12.7069 5.63604L15.5355 2.80744ZM12.7071 8.46466L6.49242 14.6794C6.21322 14.9586 6.02291 15.3142 5.94548 15.7013L5.59464 17.4555C5.43977 18.2299 5.05915 18.9411 4.50075 19.4995C5.05915 18.9411 5.77035 18.5604 6.54471 18.4056L8.29887 18.0547C8.68605 17.9773 9.04165 17.787 9.32085 17.5078L15.5355 11.2931L12.7071 8.46466Z"/></svg>')}`,
                [PAINT_TOOLS.MASK]: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff"><path d="M12 2C17.52 2 22 6.48 22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2ZM12 4C7.59 4 4 7.59 4 12C4 16.41 7.59 20 12 20C16.41 20 20 16.41 20 12C20 7.59 16.41 4 12 4ZM15 9L12 12L9 9H15ZM9 15L12 12L15 15H9Z"/></svg>')}`,
                'settings': `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff"><path d="M12 1l9.5 5.5v11L12 23l-9.5-5.5v-11L12 1zm0 2.311L4.5 7.653v8.694l7.5 4.342 7.5-4.342V7.653L12 3.311zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>')}`
            };
            const toolColors = {
                [PAINT_TOOLS.BRUSH]: '#4285F4',
                [PAINT_TOOLS.ERASER]: '#FBBC05', 
                [PAINT_TOOLS.FILL]: '#34A853',
                [PAINT_TOOLS.LINE]: '#EA4335',
                [PAINT_TOOLS.RECTANGLE]: '#FF6D01',
                [PAINT_TOOLS.CIRCLE]: '#46BDC6',
                [PAINT_TOOLS.GRADIENT]: '#9C27B0',
                [PAINT_TOOLS.EYEDROPPER]: '#8BC34A',
                [PAINT_TOOLS.MASK]: '#607D8B',
                'settings': '#F06292'
            };
            Object.keys(PAINT_TOOL_ICONS).forEach(tool => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = 24;
                    canvas.height = 24;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = toolColors[tool] || '#888888';
                    ctx.fillRect(0, 0, 24, 24);
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(0.5, 0.5, 23, 23);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = 'bold 14px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(tool.charAt(0).toUpperCase(), 12, 12);
                    this._iconCache[tool] = canvas;
                    const img = new Image();
                    img.onload = () => {
                        this._iconCache[tool] = img;
                            this.setDirtyCanvas(true);
                    };
                    img.onerror = () => {
                    };
                    img.src = PAINT_TOOL_ICONS[tool];
                } catch (e) {
                }
            });
        };
        nodeType.prototype.updateCanvasWidget = function() {
            const tempCanvas = document.createElement('canvas');
            let width = this.drawingCanvas.width;
            let height = this.drawingCanvas.height;
            const maxDimension = CANVAS_CONFIG.MAX_DIMENSION; 
            if (width > maxDimension || height > maxDimension) {
                const scale = Math.min(maxDimension / width, maxDimension / height);
                width = Math.floor(width * scale);
                height = Math.floor(height * scale);
            }
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d', {
                willReadFrequently: true,
                alpha: true
            });
            tempCtx.drawImage(this.drawingCanvas, 0, 0, width, height);
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = width;
            maskCanvas.height = height;
            const maskCtx = maskCanvas.getContext('2d', {
                willReadFrequently: true,
                alpha: true
            });
            maskCtx.drawImage(this.maskCanvas, 0, 0, width, height);
            const dataToSend = {
                image: tempCanvas.toDataURL("image/png"), 
                mask: maskCanvas.toDataURL("image/png")   
            };
            const jsonString = JSON.stringify(dataToSend);
            const dataSizeMB = (jsonString.length * 2) / (1024 * 1024);
            if (dataSizeMB > 1) {
                if (dataSizeMB > 5) {
                    const reducedWidth = Math.floor(width * 0.5);
                    const reducedHeight = Math.floor(height * 0.5);
                    tempCtx.clearRect(0, 0, width, height);
                    maskCtx.clearRect(0, 0, width, height);
                    tempCanvas.width = reducedWidth;
                    tempCanvas.height = reducedHeight;
                    maskCanvas.width = reducedWidth;
                    maskCanvas.height = reducedHeight;
                    tempCtx.drawImage(this.drawingCanvas, 0, 0, reducedWidth, reducedHeight);
                    maskCtx.drawImage(this.maskCanvas, 0, 0, reducedWidth, reducedHeight);
                    dataToSend.image = tempCanvas.toDataURL("image/jpeg", 0.3);
                    dataToSend.mask = maskCanvas.toDataURL("image/jpeg", 0.3);
                }
            }
            const finalDataString = "data:application/json;base64," + btoa(JSON.stringify(dataToSend));
            if(this.internalCanvasImageWidget) {
                this.internalCanvasImageWidget.value = finalDataString;
            } else {
                console.error("[PaintPro updateCanvasWidget] internalCanvasImageWidget reference not found!");
            }
            tempCanvas.remove();
            maskCanvas.remove();
        };
        nodeType.prototype.getTooltipText = function(toolValue) {
            const toolName = Object.keys(PAINT_TOOLS).find(key => PAINT_TOOLS[key] === toolValue);
            return toolName ? toolName.charAt(0).toUpperCase() + toolName.slice(1).toLowerCase() : "";
        };
        nodeType.prototype.calculatePressure = function(rawPressure) {
            
            
            if (typeof rawPressure !== 'number' || rawPressure < 0 || rawPressure > 1) {
                rawPressure = 0.5; 
            }
            
            
            const sensitivity = this.canvasState?.pressureSensitivity || 0.5;
            
            
            
            
            const minPressure = sensitivity > 0.7 ? 0.02 : 0.1; 
            const maxPressure = 1.0; 
            
            
            let adjustedPressure;
            if (sensitivity < 0.5) {
                
                adjustedPressure = minPressure + (rawPressure * (1 - minPressure) * (sensitivity * 2));
            } else {
                
                const factor = (sensitivity - 0.5) * 2; 
                
                
                const curve = sensitivity > 0.8 ? 2.0 : (1.5 - factor * 0.5);
                adjustedPressure = minPressure + (Math.pow(rawPressure, curve) * (1 - minPressure));
            }
            
            return Math.max(minPressure, Math.min(maxPressure, adjustedPressure));
        };
        nodeType.prototype.getDisplayMetrics = function() {
            const canvasArea = this.getCanvasArea();
            const imageRatio = this.logicalWidth / this.logicalHeight;
            const areaRatio = canvasArea.width / canvasArea.height;
            let displayWidth, displayHeight;
            if (imageRatio > areaRatio) {
                displayWidth = canvasArea.width;
                displayHeight = displayWidth / imageRatio;
            } else {
                displayHeight = canvasArea.height;
                displayWidth = displayHeight * imageRatio;
            }
            const scale = displayWidth / this.logicalWidth;
            const offsetX = canvasArea.x + (canvasArea.width - displayWidth) / 2;
            const offsetY = canvasArea.y + (canvasArea.height - displayHeight) / 2;
            return { scale, displayWidth, displayHeight, offsetX, offsetY };
        };
        nodeType.prototype.createFallbackImage = function(width, height) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, width, height);
            const img = new Image();
            img.src = canvas.toDataURL();
            img.crossOrigin = "anonymous"; 
            return img;
        };
        nodeType.prototype.isInputConnected = function(index) {
            return this.inputs && 
                   this.inputs[index] && 
                   this.inputs[index].link !== undefined &&
                   this.inputs[index].link !== null;
        };
        nodeType.prototype.loadImage = function(url) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => resolve(img);
                img.onerror = (e) => {
                    console.error("Image load error:", url, e);
                    reject(e);
                };
                img.src = url;
            });
        };
        nodeType.prototype.loadInputImage = async function() {
            if (this.imageLoadPromise) return this.imageLoadPromise;
            if (!this.inputImage?.image) {
                if (!this.currentImage) {
                    this.currentImage = this.createFallbackImage(512, 512);
                    this._resizeCanvases(512, 512);
                    this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
                    this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
                    this.maskCtx.fillStyle = '#000000';
                    this.maskCtx.fillRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
                }
                return;
            }
            try {
                this.imageLoading = true;
                const imageUrl = imageDataToUrl(this.inputImage);
                if (!imageUrl) {
                    throw new Error("Invalid image URL");
                }
                this.currentImage = new Image();
                this.currentImage.crossOrigin = "anonymous";
                this.imageLoadPromise = new Promise((resolve, reject) => {
                    this.currentImage.onload = () => {
                        this.imageLoading = false;
                        this._resizeCanvases(this.currentImage.naturalWidth, this.currentImage.naturalHeight);
                        this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
                        this.maskCtx.fillStyle = '#000000';
                        this.maskCtx.fillRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
                        resolve();
                    };
                    this.currentImage.onerror = (e) => {
                        console.error("Image load error:", e);
                        this.imageLoading = false;
                        reject(e);
                    };
                    this.currentImage.src = imageUrl;
                });
                await this.imageLoadPromise;
            } catch (e) {
                console.error("Image loading failed, using blank canvas:", e);
                this.currentImage = this.createFallbackImage(512, 512);
                this._resizeCanvases(512, 512);
                this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
                this.imageLoading = false;
            }
        };
        nodeType.prototype.onRemoved = function() {
            if (this.cleanupInterval) {
                clearInterval(this.cleanupInterval);
                this.cleanupInterval = null;
            }
            if (this.settingsManager) {
                this.settingsManager.cleanup();
                this.settingsManager = null;
            }
            this.history = [];
            this.historyIndex = -1;
            if (this.drawingCanvas) {
                this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
                this.drawingCanvas.width = 1;
                this.drawingCanvas.height = 1;
            }
            if (this.maskCanvas) {
                this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
                this.maskCanvas.width = 1;
                this.maskCanvas.height = 1;
            }
            if (this._iconCache) {
                Object.values(this._iconCache).forEach(img => {
                    if (img instanceof Image) {
                        img.src = '';
                    }
                });
                this._iconCache = null;
            }
            this.currentImage = null;
            this.originalImage = null;
            this.inputImage = null;
        };
        nodeType.prototype.getToolIcon = function(toolName) {
            if (this._iconCache && this._iconCache[toolName]) {
                if (this._iconCache[toolName] instanceof HTMLCanvasElement) {
                    return this._iconCache[toolName].toDataURL();
                } else if (this._iconCache[toolName] instanceof Image) {
                    return this._iconCache[toolName].src;
                }
            }
            return null;
        };
        nodeType.prototype.applyToolPreset = function(preset) {
            let settings;
            switch(preset) {
                default:
                case 'default':
                    settings = {
                        opacity: 0.8,
                        brushSize: BRUSH_SIZES.MEDIUM,
                        pressureSensitivity: 0.5,
                        toolPreset: 'default'
                    };
                    break;
                case 'precise':
                     settings = {
                        opacity: 1.0,
                        brushSize: BRUSH_SIZES.SMALL,
                        pressureSensitivity: 0.8,
                        toolPreset: 'precise'
                    };
                    break;
                 case 'soft':
                     settings = {
                        opacity: 0.6,
                        brushSize: BRUSH_SIZES.LARGE,
                        pressureSensitivity: 0.3,
                        toolPreset: 'soft'
                    };
                    break;
                case 'custom':
                    settings = {
                        toolPreset: 'custom',
                        opacity: this.canvasState.opacity,
                        brushSize: this.canvasState.brushSize,
                        pressureSensitivity: this.canvasState.pressureSensitivity
                    };
                    break;
            }
            if (settings.brushSpacing === undefined) settings.brushSpacing = this.canvasState.brushSpacing; 
            Object.keys(settings).forEach(key => {
                this.canvasState[key] = settings[key];
            });
            if (this.showSettings && this.settingsManager) {
                this.settingsManager.updateSettings(this.canvasState.tool);
            }
            this.setDirtyCanvas(true, true); 
        };
        nodeType.prototype.getQuickControlsBarBounds = function() {
                        const bottomGap = QUICK_CONTROLS.BOTTOM_GAP;
            const barHeight = this.quickControlsBarHeight || QUICK_CONTROLS.BAR_HEIGHT;
            const canvasArea = this.getCanvasArea();
            const canvasBottomY = canvasArea.y + canvasArea.height;
            const controlsY = canvasBottomY + bottomGap;
            return {
                x: canvasArea.x,
                y: controlsY,
                width: canvasArea.width,
                height: barHeight
            };
        };
        nodeType.prototype.updateToolbarHover = function(mouseX, mouseY) {
            const toolCount = Object.values(PAINT_TOOLS).length;
            let newHoveredTool = null;

            
            const settingsBounds = this.getToolbarItemBounds(toolCount);
            if (mouseX >= settingsBounds.x && mouseX <= settingsBounds.x + settingsBounds.width &&
                mouseY >= settingsBounds.y && mouseY <= settingsBounds.y + settingsBounds.height) {
                newHoveredTool = 'settings';
            } else {
                
                for (let i = 0; i < toolCount; i++) {
                    const bounds = this.getToolbarItemBounds(i);
                    if (mouseX >= bounds.x && mouseX <= bounds.x + bounds.width &&
                        mouseY >= bounds.y && mouseY <= bounds.y + bounds.height) {
                        newHoveredTool = Object.values(PAINT_TOOLS)[i];
                        break;
                    }
                }
            }

            if (this.hoveredTool !== newHoveredTool) {
                this.hoveredTool = newHoveredTool;
                this.setDirtyCanvas(true);
            }
        };
        nodeType.prototype._drawBrushCursorLogical = function(ctx, logicalX, logicalY) { 
            const { scale } = this.getDisplayMetrics(); 
            const size = this.canvasState.brushSize; 
            const hardness = this.canvasState.brushHardness ?? TOOL_SETTINGS.BRUSH.DEFAULT_HARDNESS;
            const logicalRadius = size / 2; 
            let r, g, b;
            if (this.canvasState.tool === PAINT_TOOLS.ERASER) {
                r = 255;
                g = 255;
                b = 255;
            } else {
                const color = this.canvasState.color;
                r = 255;
                g = 255;
                b = 255; 
                if (color.startsWith('#')) {
                    const rgb = ColorUtils.hexToRgb(color);
                    r = rgb.r;
                    g = rgb.g;
                    b = rgb.b;
                } else if (color.startsWith('rgb')) {
                    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
                    if (rgbMatch) {
                        r = parseInt(rgbMatch[1]);
                        g = parseInt(rgbMatch[2]);
                        b = parseInt(rgbMatch[3]);
                    }
                }
            }
            ctx.save();
            const gradient = ctx.createRadialGradient(
                logicalX, logicalY, 0, 
                logicalX, logicalY, logicalRadius 
            );
            if (hardness >= 0.95) {
                gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`);
                gradient.addColorStop(0.9, `rgba(${r}, ${g}, ${b}, 0.3)`);
                gradient.addColorStop(0.95, `rgba(${r}, ${g}, ${b}, 0.2)`);
                gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            } else if (hardness >= 0.8) {
                gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`);
                gradient.addColorStop(hardness - 0.1, `rgba(${r}, ${g}, ${b}, 0.3)`);
                gradient.addColorStop(hardness, `rgba(${r}, ${g}, ${b}, 0.15)`);
                gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            } else if (hardness >= 0.5) {
                gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`);
                gradient.addColorStop(hardness * 0.7, `rgba(${r}, ${g}, ${b}, 0.3)`);
                gradient.addColorStop(hardness, `rgba(${r}, ${g}, ${b}, 0.15)`);
                gradient.addColorStop(Math.min(1, hardness + 0.2), `rgba(${r}, ${g}, ${b}, 0.1)`);
                gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            } else if (hardness >= 0.2) {
                gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`);
                gradient.addColorStop(hardness * 0.5, `rgba(${r}, ${g}, ${b}, 0.25)`);
                gradient.addColorStop(hardness, `rgba(${r}, ${g}, ${b}, 0.15)`);
                gradient.addColorStop(Math.min(1, hardness + 0.3), `rgba(${r}, ${g}, ${b}, 0.05)`);
                gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            } else {
                gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`);
                gradient.addColorStop(0.1, `rgba(${r}, ${g}, ${b}, 0.25)`);
                gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.15)`);
                gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.05)`);
                gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            }
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(logicalX, logicalY, logicalRadius, 0, Math.PI * 2); 
            ctx.fill();
            ctx.strokeStyle = this.canvasState.tool === PAINT_TOOLS.ERASER ? '#ffffff' : this.canvasState.color;
            ctx.lineWidth = scale > 0 ? 1 / scale : 1; 
            ctx.beginPath();
            ctx.arc(logicalX, logicalY, logicalRadius, 0, Math.PI * 2); 
            ctx.stroke();
            ctx.restore();
        };
        nodeType.prototype.onMouseLeave = function(e) {
            if (this.hoveredTool) {
                this.hoveredTool = null;
                this._tooltipToDraw = null;
                this.setDirtyCanvas(true, false); 
            }
            if (this.canvasState && this.canvasState.isDrawing) {
                this.onMouseUp(e, this.lastMousePos);
                this.canvasState.isDrawing = false;
                this.isDrawingContinuousStroke = false;
                this.strokeStartIndex = -1;
                if (this.canvas) {
                    this.canvas.pointer_is_down = false;
                    this.canvas.dragging = false;
                }
                this.lastMousePos = null;
                this.setDirtyCanvas(true, true);
            }
        };
        nodeType.prototype.onDrawBackground = function(ctx) {
            if (this.canvasState && this.canvas) {
                if (!this.canvas.pointer_is_down && this.canvasState.isDrawing) {
                    if (this.lastMousePos) {
                        this.onMouseUp(null, this.lastMousePos);
                    } else {
                        this.canvasState.isDrawing = false;
                        this.isDrawingContinuousStroke = false;
                        this.setDirtyCanvas(true);
                    }
                }
            }
        };
        nodeType.prototype.createCombinedContext = function(x, y, radius) {
            const tempCanvas = document.createElement('canvas');
            const size = radius * 4;
            tempCanvas.width = size;
            tempCanvas.height = size;
            const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true, alpha: true });
            if (!tempCtx) {
                console.error("[createCombinedContext] Failed to create temporary context");
                return null;
            }
            const startX = Math.max(0, Math.floor(x - size/2));
            const startY = Math.max(0, Math.floor(y - size/2));
            if (this.currentImage) {
                tempCtx.drawImage(
                    this.currentImage, 
                    startX, startY, size, size,
                    0, 0, size, size
                );
            }
            tempCtx.drawImage(
                this.drawingCanvas,
                startX, startY, size, size,
                0, 0, size, size
            );
            return { 
                canvas: tempCanvas, 
                ctx: tempCtx, 
                startX: startX, 
                startY: startY, 
                size: size 
            }; 
        }
        nodeType.prototype.redrawBackCanvas = function(force = false) {
             if (!this.back_canvas) return;
             if (this.nodeStateDirty || force) {
                 this.back_ctx.clearRect(0, 0, this.back_canvas.width, this.back_canvas.height);
                 this.back_ctx.drawImage(this.canvas, 0, 0);
                 if (this.isDrawing) {
                     this.back_ctx.save();
                     this.back_ctx.globalAlpha = this.canvasState.opacity;
                     this.back_ctx.drawImage(this.drawingCanvas, 0, 0);
                     this.back_ctx.restore();
                 }
                 if (this.maskCanvas) {
                     this.back_ctx.save();
                     this.back_ctx.globalAlpha = this.canvasState.maskOpacity;
                     this.back_ctx.drawImage(this.maskCanvas, 0, 0);
                     this.back_ctx.restore();
                 }
                 this.nodeStateDirty = false;
             }
         };
        nodeType.prototype._handleLineToolDrawing = function(ctx, x, y) {
            if (!this.canvasState.isDrawing) {
                this.canvasState.lastX = x;
                this.canvasState.lastY = y;
                return;
            }
            const settings = this.settingsManager.getToolSettings(PAINT_TOOLS.LINE);
            LineTool.draw(
                ctx,
                this.canvasState.lastX,
                this.canvasState.lastY,
                x,
                y,
                this.canvasState.color,
                this.canvasState.brushSize,
                settings
            );
        };
        nodeType.prototype._createCanvas = function(width = 1, height = 1, fillStyle = null) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', {
                willReadFrequently: true,
                alpha: true
            });
            if (!ctx) {
                console.error("[PaintPro] Failed to get canvas context!");
                return { canvas, ctx: null };
            }
            if (fillStyle !== null) {
                ctx.fillStyle = fillStyle;
                ctx.fillRect(0, 0, width, height);
            }
            return { canvas, ctx };
        };
        nodeType.prototype._getToolText = function(tool) {
            const toolText = {
                [PAINT_TOOLS.BRUSH]: "Brush",
                [PAINT_TOOLS.ERASER]: "Eraser",
                [PAINT_TOOLS.FILL]: "Fill",
                [PAINT_TOOLS.LINE]: "Line",
                [PAINT_TOOLS.RECTANGLE]: "Rectangle",
                [PAINT_TOOLS.CIRCLE]: "Circle",
                [PAINT_TOOLS.GRADIENT]: "Gradient",
                [PAINT_TOOLS.EYEDROPPER]: "Eyedropper",
                [PAINT_TOOLS.MASK]: "Mask"
            };
            return toolText[tool] || "";
        };
        nodeType.prototype._getToolValues = function() {
            return [
                { label: "Brush", value: PAINT_TOOLS.BRUSH },
                { label: "Eraser", value: PAINT_TOOLS.ERASER },
                { label: "Fill", value: PAINT_TOOLS.FILL },
                { label: "Line", value: PAINT_TOOLS.LINE },
                { label: "Rectangle", value: PAINT_TOOLS.RECTANGLE },
                { label: "Circle", value: PAINT_TOOLS.CIRCLE },
                { label: "Gradient", value: PAINT_TOOLS.GRADIENT },
                { label: "Eyedropper", value: PAINT_TOOLS.EYEDROPPER },
                { label: "Mask (Draw mask strokes)", value: PAINT_TOOLS.MASK }
            ];
        };
        nodeType.prototype._handleToolChange = function(tool) {
            this.canvasState.tool = tool;
            if (this.toolInfoLabel) {
                this.toolInfoLabel.text = this._getToolText(tool);
            }

            const showMaskWidget = this.widgets.find(w => w.name === "Show Mask");
            if (showMaskWidget) {
                const isMaskActive = tool === PAINT_TOOLS.MASK;
                if (showMaskWidget.value !== isMaskActive) {
                    showMaskWidget.value = isMaskActive;
                    
                    if (showMaskWidget.callback) {
                        showMaskWidget.callback(isMaskActive);
                    } else {
                        
                        this.properties.showMask = isMaskActive;
                    }
                }
            }
            this.setDirtyCanvas(true);
        };
        nodeType.prototype.getTooltipText = function(tool) {
            const tooltips = {
                [PAINT_TOOLS.BRUSH]: "Brush: Paint with various textures and dynamics",
                [PAINT_TOOLS.ERASER]: "Eraser: Remove painted content",
                [PAINT_TOOLS.FILL]: "Fill: Fill areas with color based on tolerance",
                [PAINT_TOOLS.LINE]: "Line: Draw straight lines with arrows",
                [PAINT_TOOLS.RECTANGLE]: "Rectangle: Draw rectangles with fill options",
                [PAINT_TOOLS.CIRCLE]: "Circle: Draw circles and arcs with fill options",
                [PAINT_TOOLS.GRADIENT]: "Gradient: Create linear and radial gradients",
                [PAINT_TOOLS.EYEDROPPER]: "Eyedropper: Pick colors from the canvas",
                [PAINT_TOOLS.MASK]: "Mask: Create and edit mask areas",
                'settings': "Settings: Open tool settings dialog"
            };
            return tooltips[tool] || "";
        };

        nodeType.prototype._initializeToolTooltips = function() {
            
            if (this.tooltipContainer) {
                this.tooltipContainer.remove();
                this.tooltipContainer = null;
            }
        };

        nodeType.prototype.setTool = function(tool) {
            if (this.canvasState.tool === tool) return;
            this.canvasState.isDrawing = false;
            this.canvasState.lastPoints = [];
            if (this.canvasState.tool === PAINT_TOOLS.ERASER) {
                this.drawingCtx.globalCompositeOperation = DRAWING_DEFAULTS.BRUSH_COMPOSITE_OP;
            }
            this.canvasState.tool = tool;
            if (this.settingsManager) {
                this.settingsManager.updateTool(tool);
            }
            this.setDirtyCanvas(true, true);
        };
        
        
        nodeType.prototype.testPressureSensitivity = function() {
            console.log("[PaintPro] Testing pressure sensitivity...");
            console.log(`Current sensitivity: ${this.canvasState.pressureSensitivity}`);
            
            
            const testPressures = [0.1, 0.3, 0.5, 0.7, 0.9];
            testPressures.forEach(testPressure => {
                const result = this.calculatePressure(testPressure);
                console.log(`Raw: ${testPressure} -> Calculated: ${result.toFixed(3)}`);
            });
            
            console.log("Note: Press with tablet pen and watch console for real pressure values.");
        };

        nodeType.prototype._drawActiveToolTooltip = function(ctx) {
            if (this.hoveredTool && this.lastMousePos) {
                const tooltipText = this.getTooltipText(this.hoveredTool);
                if (!tooltipText) return;

                const x = this.lastMousePos[0] + 18;
                const y = this.lastMousePos[1] + 12;

                ctx.save();
                ctx.font = "11px sans-serif";
                ctx.textBaseline = "middle";

                const textMetrics = ctx.measureText(tooltipText);
                const textWidth = textMetrics.width;
                
                const paddingX = 8;
                const paddingY = 6;
                const rectWidth = textWidth + paddingX * 2;
                const rectHeight = 11 + paddingY * 2;

                
                ctx.fillStyle = "rgba(35, 35, 35, 0.9)";
                ctx.strokeStyle = "rgba(120, 120, 120, 0.5)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(x, y, rectWidth, rectHeight, 5);
                ctx.fill();
                ctx.stroke();

                
                ctx.fillStyle = "#DADADA";
                ctx.fillText(tooltipText, x + paddingX, y + rectHeight / 2 + 1);
                ctx.restore();
            }
        };

        nodeType.prototype._drawMaskingModeIndicator = function(ctx, canvasArea) {
            if (this.canvasState.tool !== PAINT_TOOLS.MASK) return;

            const text = "MASKING";
            ctx.save();
            ctx.font = "bold 10px Arial";
            ctx.fillStyle = "rgba(255, 100, 100, 0.7)";
            
            const textMetrics = ctx.measureText(text);
            const textWidth = textMetrics.width;
            const x = canvasArea.x + canvasArea.width - textWidth - 8;
            const y = canvasArea.y + canvasArea.height - 8;

            ctx.fillText(text, x, y);
            ctx.restore();
        }
    }
});

(function() {
    if (!app) {
        console.error("[PaintPro Patch] ComfyUI app not found, cannot patch graphToPrompt.");
        return;
    }
    if (!app.originalGraphToPrompt) {
        app.originalGraphToPrompt = app.graphToPrompt;
    }
    app.graphToPrompt = async function () {
        const prompt = await app.originalGraphToPrompt.apply(this, arguments);
        if (prompt && prompt.output) {
            for (const nodeId in prompt.output) {
                const nodeData = prompt.output[nodeId];
                if (nodeData.class_type === "PaintPro") { 
                    const graphNode = app.graph.getNodeById(Number(nodeId)); 
                    if (graphNode && graphNode.internalCanvasImageWidget) {
                        const canvasData = graphNode.internalCanvasImageWidget.value || "";
                        if (!nodeData.inputs) {
                            nodeData.inputs = {};
                        }
                        nodeData.inputs.canvas_image = canvasData;
                    } else {
                        console.warn(`[PaintPro graphToPrompt wrapper] Could not find graph node or internalCanvasImageWidget for node ID ${nodeId}. Setting canvas_image to empty.`);
                        if (!nodeData.inputs) {
                             nodeData.inputs = {};
                        }
                        nodeData.inputs.canvas_image = ""; 
                    }
                }
            }
        } else {
             console.warn("[PaintPro graphToPrompt wrapper] Prompt or prompt.output is undefined.");
        }
        return prompt;
    };
})();
function _throttle(fn, wait) {
  let last = 0;
  return function(...args) {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn.apply(this, args);
    }
  };
}
