import { app } from "../../../scripts/app.js";
import { PAINT_TOOLS, BRUSH_SIZES, UI_CONFIG, TOOL_SETTINGS, BRUSH_PRESETS, BRUSH_TEXTURES, DUAL_BRUSH_TYPES, COLOR_PICKER, TEXT_CONFIG, INTERACTION_CONFIG, PERFORMANCE_LIMITS } from "./paintConstants.js";
import { ColorUtils } from "./paintTools.js";
export class SettingsManager {
    constructor(parentNode) {
        this.node = parentNode;
        this.popup = null;
        this.content = null;
        this.settingsTitle = null;
        this.settingsIcon = null;
        this.currentTool = null;
        this.visible = false;
        this.callbacks = {
            onSettingChange: null,
            onPresetChange: null,
            onClose: null
        };
        this.activeColorPickerPopup = null;
        this.toolSettings = {};
    }
    getToolSettings(tool) {
        if (!this.toolSettings[tool]) {
            this.toolSettings[tool] = {};
        }
        const settings = { ...this.toolSettings[tool] };
        if (tool === PAINT_TOOLS.LINE) {
            settings.lineStyle = settings.lineStyle || TOOL_SETTINGS.LINE.DEFAULT_LINE_STYLE;
            settings.lineCap = settings.lineCap || TOOL_SETTINGS.LINE.DEFAULT_LINE_CAP;
            settings.startArrow = settings.startArrow !== undefined ? settings.startArrow : TOOL_SETTINGS.LINE.DEFAULT_START_ARROW;
            settings.endArrow = settings.endArrow !== undefined ? settings.endArrow : TOOL_SETTINGS.LINE.DEFAULT_END_ARROW;
            settings.arrowSize = settings.arrowSize || TOOL_SETTINGS.LINE.DEFAULT_ARROW_SIZE;
        }
        return settings;
    }
    createSettingsDialog() {
        if (this.popup && this.popup.parentNode) {
             this.popup.parentNode.removeChild(this.popup);
        }
        this.popup = document.createElement("div");
        this.popup.className = "paint-settings-popup";
        this.popup.style.cssText = `
            position: absolute; 
            top: 60px; 
            right: 15px;
            width: 300px; 
            background: #2A2A2A;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            font-family: 'Inter', sans-serif;
            z-index: 1000003;
            color: #EFEFEF;
            padding: 5px; 
        `;
        const targetContainer = document.querySelector('.litegraph') || document.body;
        targetContainer.appendChild(this.popup);
        const header = document.createElement("div");
        header.className = "settings-header";
        header.style.cssText = `
            padding: 8px 12px; 
            background: #282828; 
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: grab;
            border-bottom: 1px solid #383838; 
            user-select: none;
        `;
        this.popup.appendChild(header);
        const titleContainer = document.createElement("div");
        titleContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        header.appendChild(titleContainer);
        this.settingsIcon = document.createElement("div");
        this.settingsIcon.className = "settings-tool-icon";
        this.settingsIcon.style.cssText = `
            width: 18px;
            height: 18px;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            filter: brightness(0) invert(1);
            opacity: 0.9;
        `;
        titleContainer.appendChild(this.settingsIcon);
        this.settingsTitle = document.createElement("div");
        this.settingsTitle.textContent = "Tool Settings";
        this.settingsTitle.style.cssText = `
            font-size: 13px; 
            font-weight: 400; 
            color: #bbb; 
        `;
        titleContainer.appendChild(this.settingsTitle);
        const controls = document.createElement("div");
        controls.style.cssText = `
            display: flex;
            gap: 4px; 
        `;
        header.appendChild(controls);
        const toggleButton = document.createElement("button");
        toggleButton.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 12H19" stroke="#888" stroke-width="2" stroke-linecap="round"/></svg>'; 
        toggleButton.style.cssText = `
            background: none;
            border: none;
            width: 20px; 
            height: 20px;
            cursor: pointer;
            color: #888; 
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            border-radius: 4px;
            transition: background 0.2s, color 0.2s;
        `;
        toggleButton.title = "Minimize";
        controls.appendChild(toggleButton);
        const closeButton = document.createElement("button");
        closeButton.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18" stroke="#888" stroke-width="2" stroke-linecap="round"/><path d="M6 6L18 18" stroke="#888" stroke-width="2" stroke-linecap="round"/></svg>'; 
        closeButton.style.cssText = `
            background: none;
            border: none;
            width: 20px; 
            height: 20px;
            cursor: pointer;
            color: #888; 
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            border-radius: 4px;
            transition: background 0.2s, color 0.2s;
        `;
        closeButton.title = "Close";
        controls.appendChild(closeButton);
        [toggleButton, closeButton].forEach(btn => {
            btn.addEventListener("mouseover", () => {
                btn.style.background = "rgba(255,255,255,0.1)";
                btn.style.color = "#ccc"; 
            });
            btn.addEventListener("mouseout", () => {
                btn.style.background = "none";
                btn.style.color = "#888"; 
            });
        });
        const content = document.createElement("div");
        content.className = "settings-content";
        content.style.cssText = `
            padding: 10px;
            max-height: 80vh;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
        `;
        this.popup.appendChild(content);
        this.content = content;
        const footer = document.createElement("div");
        footer.className = "settings-footer";
        footer.style.cssText = `
            padding: 8px 12px;
            background: #333;
            display: flex;
            justify-content: space-between;
            border-top: 1px solid #444;
            font-size: 12px;
        `;
        this.popup.appendChild(footer);
        this._addCompactStyles();
        const presetContainer = document.createElement("div");
        presetContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
        `;
        footer.appendChild(presetContainer);
        const presetLabel = document.createElement("span");
        presetLabel.textContent = "Preset:";
        presetLabel.style.opacity = "0.7";
        presetContainer.appendChild(presetLabel);
        const presetSelect = document.createElement("select");
        presetSelect.style.cssText = `
            background: #444;
            border: none;
            color: #FFF;
            padding: 2px 4px;
            border-radius: 3px;
            font-size: 11px;
        `;
        ["Default", "Precise", "Soft", "Custom"].forEach(preset => {
            const option = document.createElement("option");
            option.value = preset.toLowerCase();
            option.textContent = preset;
            presetSelect.appendChild(option);
        });
        presetContainer.appendChild(presetSelect);
        const helpButton = document.createElement("button");
        helpButton.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 16V14M12 12V8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
        helpButton.style.cssText = `
            background: none;
            border: none;
            display: flex;
            align-items: center;
            color: #AAA;
            font-size: 12px;
            cursor: pointer;
            padding: 0;
        `;
        helpButton.title = "Show help";
        footer.appendChild(helpButton);
        let isDragging = false;
        let offsetX, offsetY;
        let isRAFScheduled = false;
        let latestMouseEvent = null;
        if (header) {
            header.addEventListener("pointerdown", (e) => {
                isDragging = true;
                header.style.cursor = "grabbing";
                offsetX = e.clientX - this.popup.getBoundingClientRect().left;
                offsetY = e.clientY - this.popup.getBoundingClientRect().top;
                latestMouseEvent = e; 
                e.preventDefault();
                e.stopPropagation();
            });
        }
        const handleMove = (e) => {
            if (!isDragging) return;
            latestMouseEvent = e; 
            if (!isRAFScheduled) {
                isRAFScheduled = true;
                requestAnimationFrame(() => {
                    if (!isDragging || !latestMouseEvent) {
                        isRAFScheduled = false;
                        return; 
                    }
                    const eventToProcess = latestMouseEvent;
            const nodeContainerElement = this.node.rootEl || document.querySelector('.comfy-graph-container') || targetContainer;
            const nodeRect = nodeContainerElement.getBoundingClientRect(); 
            const popupRect = this.popup.getBoundingClientRect();
                    let left = eventToProcess.clientX - offsetX;
                    let top = eventToProcess.clientY - offsetY;
            left = Math.max(nodeRect.left, Math.min(left, nodeRect.right - popupRect.width));
            top = Math.max(nodeRect.top, Math.min(top, nodeRect.bottom - popupRect.height));
                    this.popup.style.position = 'fixed'; 
            this.popup.style.left = `${left}px`;
            this.popup.style.top = `${top}px`;
            this.popup.style.right = "auto";
                    isRAFScheduled = false;
                });
            }
        };
        const handleUp = () => {
            if (isDragging) {
                isDragging = false;
                latestMouseEvent = null; 
                if (header) header.style.cursor = "grab";
            }
        };
        window.addEventListener("pointermove", handleMove);
        window.addEventListener("pointerup", handleUp);
        let isMinimized = false;
        toggleButton.addEventListener("click", () => {
            isMinimized = !isMinimized;
            if (isMinimized) {
                content.style.display = "none";
                footer.style.display = "none";
                toggleButton.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 5L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
                toggleButton.title = "Maximize";
            } else {
                content.style.display = "flex";
                footer.style.display = "flex";
                toggleButton.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
                toggleButton.title = "Minimize";
            }
        });
        closeButton.addEventListener("click", () => {
            this.popup.style.display = "none";
            this.visible = false;
            if (this.callbacks.onClose) {
                this.callbacks.onClose();
            }
        });
        helpButton.addEventListener("click", () => {
            if (this.node && this.node.showToolHelp) {
                this.node.showToolHelp(this.currentTool);
            }
        });
        presetSelect.addEventListener("change", () => {
            if (this.callbacks.onPresetChange) {
                this.callbacks.onPresetChange(presetSelect.value);
            }
        });
        this.cleanupSettingsPopup = () => {
            window.removeEventListener("pointermove", handleMove);
            window.removeEventListener("pointerup", handleUp);
        };
        this.popup.style.display = "none";
        this.visible = false;
        return this.popup;
    }
    updateSettings(tool) {
        if (!this.popup) this.createSettingsDialog(); 
        this.currentTool = tool;
        this._updateSettingsContent(tool);
    }
    setVisible(visible) {
        if (!this.popup) {
            if (visible) this.createSettingsDialog(); 
            else return; 
        }
        if (visible && !this._isAppended) {
            const targetContainer = document.querySelector('.litegraph') || document.body;
            if (!targetContainer.contains(this.popup)) {
                 targetContainer.appendChild(this.popup);
            }
            this._isAppended = true;
        }
        this.visible = visible;
        requestAnimationFrame(() => { 
            this.popup.style.display = visible ? "block" : "none"; 
            this.popup.style.opacity = visible ? "1" : "0";
            this.popup.style.transform = visible ? "translateY(0)" : "translateY(-10px)";
        });
    }
    setCallbacks(callbacks) {
        this.callbacks = {...this.callbacks, ...callbacks};
        this._debouncedUpdate = this._debounce(() => {
            if (this.node && this.node.setDirtyCanvas) {
                this.node.setDirtyCanvas(true, true);
            }
        }, 16); 
    }
    _debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    _handleSettingChange(toolType, setting, value) {
        if (!this.node?.canvasState) return;
        if (!this.toolSettings[toolType]) {
            this.toolSettings[toolType] = {};
        }
        this.toolSettings[toolType][setting] = value;
        const prevOpacity = this.node.canvasState.opacity;
        const prevSpacing = this.node.canvasState.brushSpacing;
        this.node.canvasState[setting] = value;
        if (setting === 'fillEndColor') {
            if (toolType === PAINT_TOOLS.RECTANGLE) {
                this.node.canvasState.rectangleFillEndColor = value;
            } else if (toolType === PAINT_TOOLS.CIRCLE) {
                this.node.canvasState.circleFillEndColor = value;
            }
        }
        if (setting === 'opacity' || setting === 'brushspacing') {
            requestAnimationFrame(() => {
                if (this.node.setDirtyCanvas) {
                    this.node.setDirtyCanvas(true, true);
                }
            });
            if (setting === 'brushspacing' && prevSpacing !== value) {
                this.node.canvasState.distanceSinceLastStamp = 0;
            }
            if (setting === 'opacity' && prevOpacity !== value) {
                if (this.node.drawingCtx) {
                    this.node.drawingCtx.globalAlpha = value;
                }
            }
        }
        if (this.callbacks.onSettingChange) {
            this.callbacks.onSettingChange(toolType, setting, value);
        }
    }
    cleanup() {
        if (this.cleanupSettingsPopup) {
            this.cleanupSettingsPopup();
        }
        if (this._handleGlobalPointerUp) {
            window.removeEventListener('pointerup', this._handleGlobalPointerUp, { capture: true });
            this._handleGlobalPointerUp = null;
        }
        if (this.quickControlsState && this.quickControlsState.htmlDropdownElement) {
        }
        if (this.popup && this.popup.parentNode) {
            this.popup.parentNode.removeChild(this.popup);
            this.popup = null;
            this._isAppended = false;
        }
    }
    _updateSettingsContent(tool) {
        if (!this.content) return;
        this.content.innerHTML = '';
        this.content.className = 'settings-content compact-settings';
        switch (tool) {
            case PAINT_TOOLS.BRUSH:
                this._createBrushSettings();
                break;
            case PAINT_TOOLS.ERASER:
                this._createEraserSettings();
                break;
            case PAINT_TOOLS.FILL:
                this._createFillSettings();
                break;
                    case PAINT_TOOLS.LINE:
            this._createLineSettings();
            break;
        case PAINT_TOOLS.RECTANGLE:
            this._createRectangleSettings();
            break;
        case PAINT_TOOLS.CIRCLE:
            this._createCircleSettings();
            break;
        case PAINT_TOOLS.GRADIENT:
                this._createGradientSettings();
                break;
            case PAINT_TOOLS.EYEDROPPER:
                this._createEyedropperSettings();
                break;
            case PAINT_TOOLS.MASK:
                this._createMaskSettings();
                break;
            default:
                this._createGeneralSettings();
                break;
        }
    }
    _createSettingsSection(title) {
        const section = document.createElement("div");
        section.className = "settings-section";
        section.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        if (title) {
            const header = document.createElement("div");
            header.className = "section-header";
            header.style.cssText = `
                font-size: 12px;
                font-weight: 500;
                color: #AAA;
                margin-bottom: 4px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            `;
            const titleSpan = document.createElement("span");
            titleSpan.textContent = title;
            header.appendChild(titleSpan);
            if (["Brush", "Size & Opacity"].includes(title)) {
                const resetBtn = document.createElement("button");
                resetBtn.textContent = "Reset";
                resetBtn.style.cssText = `
                    background: none;
                    border: none;
                    color: #777;
                    font-size: 11px;
                    cursor: pointer;
                    padding: 0;
                `;
                resetBtn.addEventListener("mouseover", () => resetBtn.style.color = "#FFF");
                resetBtn.addEventListener("mouseout", () => resetBtn.style.color = "#777");
                resetBtn.addEventListener("click", () => {
                    if (this.callbacks.onSettingChange) {
                        let settingsToReset = {};
                         if (title === "Brush") {
                            settingsToReset = { 
                                pressure: 0.5, 
                                smoothness: 0.5 
                            };
                        } else if (title === "Size & Opacity") {
                           settingsToReset = {
                               size: this.currentTool === PAINT_TOOLS.ERASER ? BRUSH_SIZES.MEDIUM : BRUSH_SIZES.MEDIUM, 
                               opacity: this.currentTool === PAINT_TOOLS.ERASER ? 1.0 : 1.0 
                           };
                        }
                        Object.entries(settingsToReset).forEach(([key, value]) => {
                            this.callbacks.onSettingChange(this.currentTool, key, value);
                        });
                         this._updateSettingsContent(this.currentTool);
                    }
                });
                header.appendChild(resetBtn);
            }
            section.appendChild(header);
        }
        this.content.appendChild(section);
        return section;
    }
    _createModernSlider(name, min, max, value, step) { 
        const container = document.createElement("div");
        container.className = "slider-container";
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 6px;
        `;
        const labelRow = document.createElement("div");
        labelRow.style.cssText = `
            display: flex;
            justify-content: space-between;
            font-size: 12px;
        `;
        const label = document.createElement("label");
        label.textContent = name;
        label.style.cssText = `color: #DDD;`;
        labelRow.appendChild(label);
        const valueDisplay = document.createElement("span");
        const numericValue = typeof value === 'number' ? value : 0;
        valueDisplay.textContent = numericValue.toFixed(step < 1 ? 2 : 0);
        valueDisplay.style.cssText = `color: #AAA;`;
        labelRow.appendChild(valueDisplay);
        container.appendChild(labelRow);
        const controlRow = document.createElement("div");
        controlRow.style.cssText = `
            display: flex;
            gap: 8px;
            align-items: center;
        `;
        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = value;
        slider.style.cssText = `
            flex: 1;
            height: 6px;
            -webkit-appearance: none;
            appearance: none;
            background: #555;
            border-radius: 3px;
            outline: none;
        `;
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            .slider-container input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #39f; cursor: pointer; border: 2px solid rgba(255,255,255,0.8); box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            }
            .slider-container input[type="range"]::-moz-range-thumb {
                width: 14px; height: 14px; border-radius: 50%; background: #39f; cursor: pointer; border: 2px solid rgba(255,255,255,0.8); box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            }
        `;
        if (!document.head.contains(styleEl)) {
             document.head.appendChild(styleEl);
        }
        controlRow.appendChild(slider);
        const input = document.createElement("input");
        input.type = "number";
        input.min = min;
        input.max = max;
        input.step = step;
        input.value = value;
        input.style.cssText = `
            width: 45px;
            background: #444;
            border: 1px solid #555;
            color: #EEE;
            border-radius: 3px;
            padding: 2px 5px;
            font-size: 12px;
            text-align: right;
        `;
        controlRow.appendChild(input);
        container.appendChild(controlRow);
        const settingKey = name.toLowerCase().replace(/\s+/g, ''); 
        const handleChange = (newValue) => {
            const val = parseFloat(newValue);
            valueDisplay.textContent = val.toFixed(step < 1 ? 2 : 0);
            if (this.callbacks.onSettingChange) {
                this.callbacks.onSettingChange(this.currentTool, settingKey, val);
            }
        };
        slider.addEventListener("input", () => {
            input.value = slider.value;
            handleChange(slider.value);
        });
        input.addEventListener("change", () => {
            let val = parseFloat(input.value);
            val = Math.max(min, Math.min(max, val)); 
            input.value = val;
            slider.value = val;
            handleChange(val);
        });
        return container;
    }
    _createUnifiedColorPicker(labelContent, initialColor, onColorChange, options = {}) {
        const container = document.createElement("div");
        container.className = "unified-color-picker-container";
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 12px;
            background: #333;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        const label = document.createElement("div");
        label.innerHTML = labelContent;
        label.style.cssText = `
            font-size: 13px;
            color: #EEE;
            margin-bottom: 5px;
        `;
        container.appendChild(label);
        const currentColorDisplay = document.createElement("div");
        currentColorDisplay.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        const colorPreview = document.createElement("div");
        colorPreview.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 6px; 
            background-color: ${initialColor};
            border: 2px solid #555;
            cursor: pointer;
            transition: border-color 0.2s, transform 0.2s;
        `;
        colorPreview.title = "Click to copy color";
        const hexInput = document.createElement("input");
        hexInput.type = "text";
        hexInput.value = initialColor;
        hexInput.style.cssText = `
            flex: 1;
            background: #444;
            border: 1px solid #555;
            color: #EEE;
            border-radius: 4px; 
            padding: 8px 12px;
            font-size: 13px;
            font-family: monospace;
        `;
        hexInput.placeholder = "#RRGGBB";
        currentColorDisplay.appendChild(colorPreview);
        currentColorDisplay.appendChild(hexInput);
        container.appendChild(currentColorDisplay);
        const hsvContainer = document.createElement("div");
        hsvContainer.style.cssText = `
                display: flex;
            flex-direction: column;
                gap: 10px;
            `;
            const svCanvas = document.createElement("canvas");
        svCanvas.width = options.svWidth || 200;
        svCanvas.height = options.svHeight || 150;
        svCanvas.style.cssText = `
            width: 100%;
            height: ${options.svHeight || 150}px;
            border-radius: 4px;
            cursor: crosshair;
            border: 1px solid #555;
            background: linear-gradient(to right, #fff, #000), linear-gradient(to bottom, transparent, #000);
            background-blend-mode: multiply;
        `;
            const hueCanvas = document.createElement("canvas");
        hueCanvas.width = options.hueWidth || 200;
        hueCanvas.height = options.hueHeight || 20;
        hueCanvas.style.cssText = `
            width: 100%;
            height: ${options.hueHeight || 20}px;
            border-radius: 4px;
            cursor: crosshair;
            border: 1px solid #555;
        `;
        hsvContainer.appendChild(svCanvas);
        hsvContainer.appendChild(hueCanvas);
        container.appendChild(hsvContainer);
        const rgb = ColorUtils.hexToRgb(initialColor);
        let currentHsv = ColorUtils.rgbToHsv(rgb.r, rgb.g, rgb.b);
            const drawSVCanvas = (hue) => {
            const ctx = svCanvas.getContext('2d');
            const width = svCanvas.width;
            const height = svCanvas.height;
            const imageData = ctx.createImageData(width, height);
            const data = imageData.data;
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const saturation = x / width;
                    const value = 1 - (y / height);
                    const rgb = ColorUtils.hsvToRgb(hue, saturation, value);
                    const index = (y * width + x) * 4;
                    data[index] = rgb.r;
                    data[index + 1] = rgb.g;
                    data[index + 2] = rgb.b;
                    data[index + 3] = 255;
                }
            }
            ctx.putImageData(imageData, 0, 0);
            const x = currentHsv.s * width;
            const y = (1 - currentHsv.v) * height;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.stroke();
            };
        var drawHueCanvas = function() {
            var ctx = hueCanvas.getContext('2d');
            var width = hueCanvas.width;
            var height = hueCanvas.height;
            const gradient = ctx.createLinearGradient(0, 0, width, 0);
            for (let i = 0; i <= 360; i += 60) {
                const rgb = ColorUtils.hsvToRgb(i / 360, 1, 1);
                gradient.addColorStop(i / 360, `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
            }
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            const x = currentHsv.h * width;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        };
        const updateColor = () => {
            const rgb = ColorUtils.hsvToRgb(currentHsv.h, currentHsv.s, currentHsv.v);
            const hexColor = ColorUtils.rgbToHex(rgb.r, rgb.g, rgb.b);
            colorPreview.style.backgroundColor = hexColor;
            hexInput.value = hexColor;
            if (onColorChange) {
                onColorChange(hexColor);
            }
            drawSVCanvas(currentHsv.h);
            drawHueCanvas();
        };
        let isDraggingSV = false;
            const handleSVMove = (e) => {
            if (!isDraggingSV) return;
                const rect = svCanvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            currentHsv.s = Math.max(0, Math.min(1, x));
            currentHsv.v = Math.max(0, Math.min(1, 1 - y));
            updateColor();
            };
            svCanvas.addEventListener('mousedown', (e) => {
            isDraggingSV = true;
                handleSVMove(e);
        });
        let isDraggingHue = false;
        const handleHueMove = (e) => {
            if (!isDraggingHue) return;
            const rect = hueCanvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            currentHsv.h = Math.max(0, Math.min(1, x));
            updateColor();
        };
        hueCanvas.addEventListener('mousedown', (e) => {
            isDraggingHue = true;
            handleHueMove(e);
        });
        const handleMouseMove = (e) => {
            if (isDraggingSV) handleSVMove(e);
            if (isDraggingHue) handleHueMove(e);
        };
        const handleMouseUp = () => {
            isDraggingSV = false;
            isDraggingHue = false;
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        hexInput.addEventListener('change', () => {
            const newColor = hexInput.value.trim();
            if (ColorUtils.isValidHexColor(newColor)) {
                const rgb = ColorUtils.hexToRgb(newColor);
                currentHsv = ColorUtils.rgbToHsv(rgb.r, rgb.g, rgb.b);
                updateColor();
            } else {
                hexInput.value = initialColor;
            }
        });
        colorPreview.addEventListener('click', () => {
            navigator.clipboard.writeText(hexInput.value).then(() => {
                colorPreview.style.borderColor = '#4CAF50';
                setTimeout(() => {
                    colorPreview.style.borderColor = '#555';
                }, 1000);
            }).catch(() => {
                colorPreview.style.borderColor = '#F44336';
                setTimeout(() => {
                    colorPreview.style.borderColor = '#555';
                }, 1000);
            });
        });
        drawSVCanvas(currentHsv.h);
        drawHueCanvas();
        return container;
    }
    _createBrushSettings() {
        this.content.innerHTML = '';
        if (!document.getElementById('refined-brush-settings-style')) {
            const style = document.createElement('style');
            style.id = 'refined-brush-settings-style';
            style.textContent = `
                .refined-settings-content {
                   display: flex;
                   flex-direction: column;
                   gap: 12px;
                   padding: 12px;
                   background-color: #222;
                   border-radius: 6px;
                 }
                 .refined-settings-content .color-picker-area { 
                     display: flex; flex-direction: column; gap: 5px;
                 }
                 .refined-settings-content .color-swatch {
                    width: 100%; height: 60px; border-radius: 4px; cursor: pointer; border: 1px solid #555;
                    background-image: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%);
                    background-size: 10px 10px;
                    background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
                }
                 .refined-settings-content .color-swatch-overlay {
                     width: 100%; height: 100%; border-radius: 4px;
                 }
                .refined-settings-content .hex-input {
                    width: 100%; background: #333; border: 1px solid #555; color: #eee; border-radius: 3px; padding: 5px; font-size: 12px; text-align: center; box-sizing: border-box;
                }
                 .refined-settings-content .slider-row {
                    display: grid; grid-template-columns: 60px auto 40px; gap: 8px; align-items: center;
                    margin-bottom: 8px;
                 }
                 .refined-settings-content label {
                   color: #ccc; font-size: 12px; font-family: 'Inter', sans-serif; white-space: nowrap;
                 }
                 .refined-settings-content input[type=range] {
                   -webkit-appearance: none; appearance: none;
                   width: 100%; height: 6px; border-radius: 3px;
                   background: #444;
                   outline: none; cursor: pointer;
                   background-image: linear-gradient(#6fa8dc, #6fa8dc);
                   background-size: 0% 100%;
                   background-repeat: no-repeat;
                   transition: background-size 0.1s ease;
                 }
                 .refined-settings-content input[type=range]::-webkit-slider-thumb {
                   -webkit-appearance: none; appearance: none;
                   width: 16px; height: 16px; border-radius: 50%;
                   background: linear-gradient(135deg, #6fa8dc, #5a8fc7);
                   box-shadow: 0 2px 6px rgba(0,0,0,0.3), 0 0 0 2px rgba(255,255,255,0.1);
            cursor: pointer;
                   margin-top: -5px; 
                   transition: all 0.2s ease;
                   border: 2px solid #fff;
                 }
                 .refined-settings-content input[type=range]:hover::-webkit-slider-thumb {
                     background: linear-gradient(135deg, #7fb8e6, #6a9fd1);
                     transform: scale(1.1);
                     box-shadow: 0 3px 8px rgba(0,0,0,0.4), 0 0 0 3px rgba(255,255,255,0.2);
                 }
                  .refined-settings-content input[type=range]:active::-webkit-slider-thumb {
                      background: linear-gradient(135deg, #5a8fc7, #4a7fb7);
                      transform: scale(0.95);
                      box-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 0 0 2px rgba(255,255,255,0.15);
                  }
                 .refined-settings-content .slider-value {
                     color: #aaa; font-size: 11px; text-align: right;
                 }
                 .brush-preset-section {
            border: 1px solid #444; 
            border-radius: 4px; 
                    overflow: hidden;
                    margin-bottom: 8px;
                 }
                 .brush-preset-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #333;
                    padding: 8px 10px;
                    cursor: pointer;
                 }
                 .brush-preset-header label {
                    font-weight: bold;
                    color: #ddd;
                    user-select: none;
                 }
                 .brush-preset-header:hover {
                    background: #3a3a3a;
                 }
                 .brush-preset-content {
                    height: 0;
                    overflow: hidden;
                    transition: height 0.3s ease;
                 }
                 .brush-preset-content.expanded {
                    height: auto;
                    padding: 10px;
                    background: #2a2a2a;
                 }
                 .brush-preset-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 5px;
                 }
                 .brush-preset-item {
                    background: #333;
                    border: 1px solid #555;
                    border-radius: 4px;
                    padding: 5px 2px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                 }
                 .brush-preset-item:hover {
                    background: #444;
                 }
                 .brush-preset-item.active {
                    background: #445577;
                    border-color: #7799cc;
                 }
                 .brush-preset-icon {
                    width: 24px;
                    height: 24px;
                    margin-bottom: 2px;
                    opacity: 0.9;
                 }
                 .brush-preset-name {
                    font-size: 9px;
            color: #ccc;
            text-align: center;
                 }
                 .brush-preset-description {
                    margin-top: 8px;
                    font-size: 10px;
                    color: #aaa;
                    text-align: center;
                    font-style: italic;
                    padding: 0 5px;
                 }
                 .toggle-icon {
                    width: 12px;
                    height: 12px;
                    border-top: 2px solid #999;
                    border-right: 2px solid #999;
                    transform: rotate(135deg);
                    transition: transform 0.3s ease;
                 }
                 .toggle-icon.expanded {
                    transform: rotate(-45deg);
                 }
             `;
             document.head.appendChild(style);
        }
        const wrapper = document.createElement('div');
        wrapper.className = 'refined-settings-content';
        const presetSection = document.createElement('div');
        presetSection.className = 'brush-preset-section';
        const presetHeader = document.createElement('div');
        presetHeader.className = 'brush-preset-header';
        const presetLabel = document.createElement('label');
        presetLabel.textContent = 'Brush Presets';
        presetHeader.appendChild(presetLabel);
        const toggleIcon = document.createElement('div');
        toggleIcon.className = 'toggle-icon';
        presetHeader.appendChild(toggleIcon);
        presetSection.appendChild(presetHeader);
        const presetContent = document.createElement('div');
        presetContent.className = 'brush-preset-content';
        const presetGrid = document.createElement('div');
        presetGrid.className = 'brush-preset-grid';
        const presetDescription = document.createElement('div');
        presetDescription.className = 'brush-preset-description';
        let activePreset = 'DEFAULT';
        const currentSettings = {
            spacing: this.node.canvasState.brushSpacing,
            flow: this.node.canvasState.brushFlow,
            hardness: this.node.canvasState.brushHardness,
            pressureSensitivity: this.node.canvasState.pressureSensitivity
        };
        Object.keys(BRUSH_PRESETS).forEach(presetKey => {
            const preset = BRUSH_PRESETS[presetKey];
            const presetItem = document.createElement('div');
            presetItem.className = 'brush-preset-item';
            const settingsMatch = 
                Math.abs(currentSettings.spacing - preset.spacing) < 0.02 &&
                Math.abs(currentSettings.flow - preset.flow) < 0.02 &&
                Math.abs(currentSettings.hardness - preset.hardness) < 0.02 &&
                Math.abs(currentSettings.pressureSensitivity - preset.pressureSensitivity) < 0.02;
            if (settingsMatch) {
                presetItem.classList.add('active');
                activePreset = presetKey;
                presetDescription.textContent = preset.description;
            }
            const iconCanvas = document.createElement('canvas');
            iconCanvas.width = 24;
            iconCanvas.height = 24;
            iconCanvas.className = 'brush-preset-icon';
            const ctx = iconCanvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, 24, 24);
                if (preset.name === 'Pencil') {
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(7, 20);
                    ctx.lineTo(15, 10);
                    ctx.lineTo(18, 14);
                    ctx.stroke();
                } else if (preset.name === 'Marker') {
                    ctx.fillStyle = 'rgba(255,255,255,0.9)';
                    ctx.fillRect(5, 5, 14, 14);
                } else {
                    const hardness = preset.hardness;
                    const gradient = ctx.createRadialGradient(12, 12, 0, 12, 12, 12);
                    gradient.addColorStop(0, 'rgba(255,255,255,1)');
                    gradient.addColorStop(hardness, 'rgba(255,255,255,1)');
                    gradient.addColorStop(1, 'rgba(255,255,255,0)');
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(12, 12, 12, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            presetItem.appendChild(iconCanvas);
            const nameSpan = document.createElement('span');
            nameSpan.className = 'brush-preset-name';
            nameSpan.textContent = preset.name;
            presetItem.appendChild(nameSpan);
            presetItem.addEventListener('click', () => {
                document.querySelectorAll('.brush-preset-item').forEach(item => {
                    item.classList.remove('active');
                });
                presetItem.classList.add('active');
                presetDescription.textContent = preset.description;
                this._updateBrushPreset(presetKey);
            });
            presetGrid.appendChild(presetItem);
        });
        presetContent.appendChild(presetGrid);
        presetContent.appendChild(presetDescription);
        presetSection.appendChild(presetContent);
        presetHeader.addEventListener('click', () => {
            toggleIcon.classList.toggle('expanded');
            presetContent.classList.toggle('expanded');
        });
        wrapper.appendChild(presetSection);
        const colorPickerElement = this._createUnifiedColorPicker(
            'Color',
            this.node.canvasState.color,
            (newColor) => {
                this.node.canvasState.color = newColor;
                if (this.callbacks.onSettingChange) {
                    this.callbacks.onSettingChange(this.currentTool, 'color', newColor);
                }
            }
        );
        wrapper.appendChild(colorPickerElement);
        const props = [
            { label: 'Size', key: 'brushSize', min: 1, max: 100, step: 1, format: (v) => `${v}px` },
            { label: 'Opacity', key: 'opacity', min: 0, max: 1, step: 0.01, format: (v) => `${(v*100).toFixed(0)}%` },
            { label: 'Hardness', key: 'brushHardness', min: 0, max: 1, step: 0.01, format: (v) => `${(v*100).toFixed(0)}%` },
            { label: 'Flow', key: 'brushFlow', min: TOOL_SETTINGS.BRUSH.MIN_FLOW, max: TOOL_SETTINGS.BRUSH.MAX_FLOW, step: 0.01, format: (v) => `${(v*100).toFixed(0)}%` }, 
            { label: 'Spacing', key: 'brushSpacing', min: TOOL_SETTINGS.BRUSH.MIN_SPACING, max: TOOL_SETTINGS.BRUSH.MAX_SPACING, step: 0.01, format: (v) => `${(v*100).toFixed(0)}%` },
            { label: 'Pressure', key: 'pressureSensitivity', min: 0, max: 1, step: 0.01, format: (v) => `${(v*100).toFixed(0)}%` }, 
            { 
                label: 'Scattering', 
                key: 'scattering', 
                min: TOOL_SETTINGS.BRUSH.MIN_SCATTERING, 
                max: TOOL_SETTINGS.BRUSH.MAX_SCATTERING, 
                step: 0.01, 
                format: (v) => v.toFixed(2) 
            },
            { 
                label: 'Shape Dynamics', 
                key: 'shapeDynamics', 
                min: TOOL_SETTINGS.BRUSH.MIN_SHAPE_DYNAMICS, 
                max: TOOL_SETTINGS.BRUSH.MAX_SHAPE_DYNAMICS, 
                step: 0.01, 
                format: (v) => v.toFixed(2) 
            },
        ];
        props.forEach(({ label, key, min, max, step, format }) => {
            const value = this.node.canvasState[key] ?? min;
            const row = document.createElement('div');
            row.className = 'slider-row';
            const lab = document.createElement('label'); lab.textContent = label;
            const slider = document.createElement('input'); slider.type = 'range';
            slider.min = min; slider.max = max; slider.step = step;
            slider.value = value;
            slider.dataset.key = key; 
            const valDisplay = document.createElement('span'); valDisplay.className = 'slider-value';
            valDisplay.textContent = format(value);
            this._updateSliderBackground(slider, value, min, max);
            slider.addEventListener('input', e => {
                const v = parseFloat(e.target.value);
                this.node.canvasState[key] = v;
                valDisplay.textContent = format(v);
                this._updateSliderBackground(slider, v, min, max);
                if (this.callbacks.onSettingChange) this.callbacks.onSettingChange(this.currentTool, key, v);
            });
            row.append(lab, slider, valDisplay);
            wrapper.appendChild(row); 
        });
        this.content.appendChild(wrapper);
        const textureRow = document.createElement('div');
        textureRow.className = 'slider-row'; 
        const textureLabel = document.createElement('label');
        textureLabel.textContent = 'Texture Type';
        const textureDropdown = document.createElement('select');
        textureDropdown.className = 'paint-select'; 
        textureDropdown.style.flexGrow = '1'; 
        textureDropdown.style.maxWidth = '150px'; 
        textureDropdown.style.marginLeft = 'auto'; 
        Object.entries(BRUSH_TEXTURES).forEach(([key, value]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ');
            if (this.node.canvasState?.texture === value) {
                option.selected = true;
            }
            textureDropdown.appendChild(option);
        });
        textureDropdown.addEventListener('change', () => {
            this._handleSettingChange(PAINT_TOOLS.BRUSH, 'texture', textureDropdown.value);
        });
        const textureDummySpan = document.createElement('span');
        textureDummySpan.style.minWidth = '40px'; 
        textureDummySpan.style.textAlign = 'right';
        textureRow.appendChild(textureLabel);
        textureRow.appendChild(textureDropdown);
        wrapper.appendChild(textureRow); 
        const dualBrushRow = document.createElement('div');
        dualBrushRow.className = 'slider-row'; 
        const dualBrushLabel = document.createElement('label');
        dualBrushLabel.textContent = 'Dual Brush Mode';
        const dualBrushDropdown = document.createElement('select');
        dualBrushDropdown.className = 'paint-select'; 
        dualBrushDropdown.style.flexGrow = '1';
        dualBrushDropdown.style.maxWidth = '150px';
        dualBrushDropdown.style.marginLeft = 'auto';
        Object.entries(DUAL_BRUSH_TYPES).forEach(([key, value]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ');
            if (this.node.canvasState?.dualBrush === value) {
                option.selected = true;
            }
            dualBrushDropdown.appendChild(option);
        });
        dualBrushDropdown.addEventListener('change', () => {
            this._handleSettingChange(PAINT_TOOLS.BRUSH, 'dualBrush', dualBrushDropdown.value);
        });
        const dualBrushDummySpan = document.createElement('span');
        dualBrushDummySpan.style.minWidth = '40px';
        dualBrushDummySpan.style.textAlign = 'right';
        dualBrushRow.appendChild(dualBrushLabel);
        dualBrushRow.appendChild(dualBrushDropdown);
        wrapper.appendChild(dualBrushRow); 
    }
    _createEraserSettings() {
        this.content.innerHTML = '';
        var wrapper = document.createElement('div');
        wrapper.className = 'refined-settings-content';
        wrapper.appendChild(this._createSliderRow({
            label: 'Size',
            key: 'size',
            min: 1,
            max: 100,
            step: 1,
            format: (v) => `${v}px`,
            defaultValue: this.node.canvasState?.size || 20
        }));
        wrapper.appendChild(this._createSliderRow({
            label: 'Opacity',
            key: 'opacity',
            min: 0,
            max: 1,
            step: 0.01,
            format: (v) => `${(v*100).toFixed(0)}%`,
            defaultValue: this.node.canvasState?.opacity || 1.0
        }));
        wrapper.appendChild(this._createSliderRow({
            label: 'Softness',
            key: 'softness',
            min: 0,
            max: 1,
            step: 0.01,
            format: (v) => `${(v*100).toFixed(0)}%`,
            defaultValue: this.node.canvasState?.softness || 0.5
        }));
        this.content.appendChild(wrapper);
    }
    _createFillSettings() {
        this.content.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'refined-settings-content';
        const colorPickerElement = this._createUnifiedColorPicker(
            'Fill Color',
            this.node.canvasState.color,
            (newColor) => {
                this._handleSettingChange(this.currentTool, 'color', newColor);
            }
        );
        wrapper.appendChild(colorPickerElement);
        wrapper.appendChild(this._createSliderRow({
            label: 'Tolerance', key: 'fillTolerance', min: 0, max: TOOL_SETTINGS.FILL.MAX_TOLERANCE, step: 1, format: (v) => `${v}`, defaultValue: TOOL_SETTINGS.FILL.DEFAULT_TOLERANCE
        }));
        wrapper.appendChild(this._createSliderRow({
            label: 'Opacity', key: 'opacity', min: 0, max: 1, step: 0.01, format: (v) => `${(v*100).toFixed(0)}%`, defaultValue: 1.0
        }));
        this.content.appendChild(wrapper);
    }
    _createGeneralSettings() {
        var infoSection = this._createSettingsSection();
        var infoText = document.createElement('p');
        infoText.textContent = `No specific settings for ${this.currentTool} tool.`;
        infoText.style.cssText = 'font-size: 12px; color: #aaa; padding: 10px; text-align: center;';
        infoSection.appendChild(infoText);
        this.content.appendChild(infoSection);
    }
    _drawModernDivider(ctx, x, y, height) {
        ctx.save();
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
        gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.03)");
        gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.08)");
        gradient.addColorStop(0.8, "rgba(255, 255, 255, 0.03)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + height);
        ctx.lineWidth = 1;
        ctx.strokeStyle = gradient;
        ctx.stroke();
        ctx.restore();
    }
    _drawVerticalDivider(ctx, x, y, height) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + height);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.stroke();
        ctx.restore();
    }
    _getRightPrimaryControlContext(nodeState) {
        if (!nodeState) {
            console.error('Missing nodeState in _getRightPrimaryControlContext');
            return null;
        }
        switch (nodeState.tool) {
            case PAINT_TOOLS.BRUSH:
                return {
                    controlType: 'slider',
                    label: 'Size',
                    value: nodeState.brushSize,
                    min: 1,
                    max: 100,
                    stateKey: 'brushSize',
                    formatValue: (v) => `${Math.round(v)}px`
                };
            case PAINT_TOOLS.ERASER:
                return {
                    controlType: 'slider',
                    label: 'Size',
                    value: nodeState.brushSize,
                    min: 1,
                    max: 100,
                    stateKey: 'brushSize',
                    formatValue: (v) => `${Math.round(v)}px`
                };
            case PAINT_TOOLS.FILL:
                return {
                    controlType: 'slider',
                    label: 'Tolerance',
                    value: nodeState.fillTolerance,
                    min: TOOL_SETTINGS.FILL.MIN_TOLERANCE,
                    max: TOOL_SETTINGS.FILL.MAX_TOLERANCE,
                    stateKey: 'fillTolerance',
                    formatValue: (v) => `${Math.round(v)}`
                };
            case PAINT_TOOLS.LINE:
            case PAINT_TOOLS.RECTANGLE:
            case PAINT_TOOLS.CIRCLE:
                return {
                    controlType: 'slider',
                    label: 'Size',
                    value: nodeState.brushSize,
                    min: 1,
                    max: 100,
                    stateKey: 'brushSize',
                    formatValue: (v) => `${Math.round(v)}px`
                };
            case PAINT_TOOLS.GRADIENT:
                return {
                    controlType: 'color',
                    label: 'Start',
                    value: nodeState.color,
                    stateKey: 'color'
                };
            case PAINT_TOOLS.MASK:
                return {
                    controlType: 'slider',
                    label: 'Size',
                    value: nodeState.brushSize,
                    min: 1,
                    max: 100,
                    stateKey: 'brushSize',
                    formatValue: (v) => `${Math.round(v)}px`
                };
            default:
                return null; 
        }
    }
    _getRightSecondaryControlContext(nodeState) {
        if (!nodeState) {
            return null;
        }
        switch (nodeState.tool) {
            case PAINT_TOOLS.BRUSH:
                return {
                    controlType: 'slider',
                    label: 'Opacity',
                    value: nodeState.opacity,
                    min: 0.01,
                    max: 1.0,
                    stateKey: 'opacity',
                    formatValue: (v) => `${Math.round(v * 100)}%`
                };
            case PAINT_TOOLS.ERASER:
                return {
                    controlType: 'slider',
                    label: 'Opacity',
                    value: nodeState.opacity,
                    min: 0.01,
                    max: 1.0,
                    stateKey: 'opacity',
                    formatValue: (v) => `${Math.round(v * 100)}%`
                };
            case PAINT_TOOLS.GRADIENT:
                return {
                    controlType: 'color',
                    label: 'End',
                    value: nodeState.gradientEndColor || '#000000',
                    stateKey: 'gradientEndColor',
                    isEndColor: true
                };
            case PAINT_TOOLS.MASK:
                return {
                    controlType: 'slider',
                    label: 'Opacity',
                    value: nodeState.opacity,
                    min: 0.01,
                    max: 1.0,
                    stateKey: 'opacity',
                    formatValue: (v) => `${Math.round(v * 100)}%`
                };
            default:
                return null;
        }
    }
    _drawCheckerboardPattern(ctx, x, y, width, height, radius = 0) {
        const cellSize = 5;
        ctx.save();
            ctx.beginPath();
        if (radius > 0) {
            ctx.roundRect(x, y, width, height, radius);
            ctx.clip();
        }
        ctx.fillStyle = "#fff";
        for (let i = 0; i < width; i += cellSize * 2) {
            for (let j = 0; j < height; j += cellSize * 2) {
                ctx.fillRect(x + i, y + j, cellSize, cellSize);
                ctx.fillRect(x + i + cellSize, y + j + cellSize, cellSize, cellSize);
            }
        }
        ctx.fillStyle = "#ddd";
        for (let i = 0; i < width; i += cellSize * 2) {
            for (let j = 0; j < height; j += cellSize * 2) {
                ctx.fillRect(x + i + cellSize, y + j, cellSize, cellSize);
                ctx.fillRect(x + i, y + j + cellSize, cellSize, cellSize);
            }
        }
        ctx.restore();
    }
    _drawToolPresetSelector(ctx, x, y, width, height, nodeState) {
        const presets = ['Default', 'Soft', 'Precise', 'Custom'];
        let currentPresetDisplayName = presets[0];
        if (nodeState && nodeState.toolPreset) {
            const foundPreset = presets.find(p => p.toLowerCase() === nodeState.toolPreset);
            if (foundPreset) {
                currentPresetDisplayName = foundPreset;
            }
        }
        const isHovered = this.quickControlsState?.hoveredPresetSelector;
        ctx.save();
        const baseBg = "rgba(60, 60, 60, 0.85)";
        const hoverBg = "rgba(75, 75, 75, 0.9)";
        ctx.fillStyle = isHovered ? hoverBg : baseBg;
        if (isHovered) {
             ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
             ctx.shadowBlur = 6;
             ctx.shadowOffsetY = 2;
        } else {
             ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
             ctx.shadowBlur = 4;
             ctx.shadowOffsetY = 1;
        }
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 5);
        ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.strokeStyle = isHovered ? "rgba(100, 160, 230, 0.7)" : "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = isHovered ? "#FFFFFF" : "#D0D0D0";
        ctx.font = "5px Inter, Arial, sans-serif"; 
        const textMetrics = ctx.measureText(currentPresetDisplayName);
        const textWidth = textMetrics.width;
        const textX = x + width / 2;
        const textY = y + height / 2;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center"; 
        ctx.fillText(currentPresetDisplayName, textX, textY);
        ctx.restore();
    }
    _calculateQuickControlsLayout(nodeState) {
        const bounds = this.node.getQuickControlsBarBounds();
        if (!bounds) return null;
        const padding = 8;
        const controlHeight = bounds.height - padding * 2;
        const swatchSize = controlHeight - 6;
        const valueControlWidth = 60;
        const barWidth = bounds.width - (padding * 2);
        const minControlSpacing = 2;
        let hitboxes = {};
        if (nodeState.tool === PAINT_TOOLS.BRUSH) {
            const totalControlWidth = barWidth - (minControlSpacing * 2); 
            const idealSwatchWidth = swatchSize + 4; 
            const idealValueControlWidth = (totalControlWidth - idealSwatchWidth) / 2; 
            let currentX = bounds.x + padding;
            const sizeLeftWidth = Math.max(valueControlWidth, idealValueControlWidth);
            const colorWidth = idealSwatchWidth;
            const opacityRightWidth = Math.max(valueControlWidth, idealValueControlWidth);
            const sizeLeftPos = { x: currentX, width: sizeLeftWidth };
            currentX += sizeLeftWidth + minControlSpacing;
            const colorPos = { x: currentX, width: colorWidth };
            currentX += colorWidth + minControlSpacing;
            const opacityRightPos = { x: currentX, width: opacityRightWidth };
            const controlY = bounds.y + padding;
            hitboxes = {
                size_left: {
                    x: sizeLeftPos.x - 2, y: controlY - 2, width: sizeLeftPos.width + 4, height: controlHeight + 4,
                    context: { type: 'value', tool: PAINT_TOOLS.BRUSH, label: 'Size', value: nodeState.brushSize, min: 1, max: 100, key: 'brushSize' },
                    controlId: 'size_left'
                },
                color: {
                    x: colorPos.x - 2, y: (controlY + (controlHeight - swatchSize) / 2) - 2, width: colorPos.width + 4, height: swatchSize + 4,
                    context: { type: 'color', tool: PAINT_TOOLS.BRUSH },
                    controlId: 'color'
                },
                opacity_right: { 
                    x: opacityRightPos.x - 2, y: controlY - 2, width: opacityRightPos.width + 4, height: controlHeight + 4,
                    context: { type: 'value', tool: PAINT_TOOLS.BRUSH, label: 'Opacity', value: nodeState.opacity, min: 0.01, max: 1.0, step: 0.01, key: 'opacity' },
                    controlId: 'opacity_right'
                }
            };
        } else {
        let hasColorSwatch = false;
        switch (nodeState.tool) {
            case PAINT_TOOLS.FILL:
            case PAINT_TOOLS.LINE:
            case PAINT_TOOLS.RECTANGLE:
            case PAINT_TOOLS.CIRCLE:
            case PAINT_TOOLS.GRADIENT:
                hasColorSwatch = true;
                break;
        }
        const leftSectionX = bounds.x + padding;
        const colorSwatchX = leftSectionX + 5;
        const colorSwatchY = bounds.y + padding + 1;
            const controlY = bounds.y + padding;
        const primaryControlX = bounds.x + bounds.width - padding - valueControlWidth;
        const secondaryControlX = primaryControlX - valueControlWidth - minControlSpacing;
        const primaryContext = this._getRightPrimaryControlContext(nodeState);
        const secondaryContext = this._getRightSecondaryControlContext(nodeState);
            hitboxes = {
            color: hasColorSwatch ? {
                x: colorSwatchX - 2, y: colorSwatchY - 2, width: swatchSize + 4, height: swatchSize + 4,
                    context: { type: 'color', tool: nodeState.tool }, controlId: 'color'
            } : null,
            endColor: (hasColorSwatch && nodeState.tool === PAINT_TOOLS.GRADIENT) ? {
                x: colorSwatchX + swatchSize + 5 - 2, y: colorSwatchY - 2, width: swatchSize + 4, height: swatchSize + 4,
                    context: { type: 'endColor', tool: nodeState.tool }, controlId: 'endColor'
            } : null,
                primary: primaryContext ? {
                x: primaryControlX - 2, y: controlY - 2, width: valueControlWidth + 4, height: controlHeight + 4,
                    context: primaryContext, controlId: primaryContext.label ? primaryContext.label.toLowerCase() : 'primary'
                } : null,
            secondary: secondaryContext ? {
                x: secondaryControlX - 2, y: controlY - 2, width: valueControlWidth + 4, height: controlHeight + 4,
                    context: secondaryContext, controlId: secondaryContext.label ? secondaryContext.label.toLowerCase() : 'secondary'
                } : null,
                eyedropper: (nodeState.tool === PAINT_TOOLS.EYEDROPPER && primaryContext && primaryContext.type === 'mode') ? { 
                    x: primaryControlX - 2, y: controlY - 2, width: valueControlWidth + 4, height: controlHeight + 4,
                    context: primaryContext, 
                    controlId: 'eyedropper_mode'
            } : null
        };
    }
        const validHitboxes = {};
        for (const key in hitboxes) {
            if (hitboxes[key]) {
                validHitboxes[key] = hitboxes[key];
            }
        }
        return { bounds, hitboxes: validHitboxes };
    }
    _pointInHitbox(point, hitbox) {
        return point.x >= hitbox.x && 
               point.x <= hitbox.x + hitbox.width &&
               point.y >= hitbox.y && 
               point.y <= hitbox.y + hitbox.height;
    }
    handleGlobalValuePointerUp(e) {
        if (this.quickControlsState.isDraggingLeftValue || this.quickControlsState.isDraggingRightValue) {
            this.stopValueDragging();
            e.preventDefault();
            e.stopPropagation();
        }
    }
    handleGlobalValuePointerMove(e) {
         if (this.quickControlsState.isDraggingLeftValue || this.quickControlsState.isDraggingRightValue) {
            e.preventDefault();
            e.stopPropagation();
            const position = { x: e.clientX, y: e.clientY }; 
            let currentX = position.x;
            if (this.node.graph && this.node.graph.canvas) {
                 const rect = this.node.graph.canvas.canvas.getBoundingClientRect();
                 currentX = (position.x - rect.left) / this.node.graph.scale - this.node.graph.offset[0]; 
             }
            const dragStartX = this.quickControlsState.valueDragStartX; 
            const dragDeltaX = currentX - dragStartX; 
            const DRAG_THRESHOLD = 3; 
            if (!this.quickControlsState.valueDragThresholdMet) {
                if (Math.abs(dragDeltaX) < DRAG_THRESHOLD) {
                    return; 
                } else {
                    this.quickControlsState.valueDragStartX = currentX - (DRAG_THRESHOLD * Math.sign(dragDeltaX));
                    this.quickControlsState.valueDragThresholdMet = true;
                }
            }
            const adjustedDeltaX = currentX - this.quickControlsState.valueDragStartX;
            const range = this.quickControlsState.valueDragMax - this.quickControlsState.valueDragMin;
            const baseSensitivity = 0.01;
            const sensitivityFactor = range > 0 ? Math.min(5, Math.max(0.1, 1 / Math.sqrt(range + 1))) : 1;
            const sensitivity = baseSensitivity * (range > 0 ? range : 1) * sensitivityFactor;
            let newValue = this.quickControlsState.valueDragStartValue + adjustedDeltaX * sensitivity; 
            newValue = Math.max(this.quickControlsState.valueDragMin, Math.min(this.quickControlsState.valueDragMax, newValue));
            const settingKey = this.quickControlsState.valueDragKey;
            let step = 0;
            if (['opacity', 'blurIntensity', 'maskOpacity'].includes(settingKey)) {
                step = 0.01;
            } else if (['brushSize', 'blurRadius', 'fillTolerance', 'eyedropperSampleSize'].includes(settingKey)) {
                step = 1;
            } else if (['smoothingFactor'].includes(settingKey)) {
                step = 0.1;
            } else if (['brushspacing'].includes(settingKey)) { 
                step = 0.01;
            }
            if (step > 0) {
                newValue = Math.round(newValue / step) * step;
            }
             const currentNodeState = this.node?.canvasState;
             if (currentNodeState && currentNodeState[settingKey] !== newValue) {            
                 if (this.callbacks.onSettingChange) {
                    const toolType = this.quickControlsState.currentControlContext?.tool || currentNodeState.tool;
                     this.callbacks.onSettingChange(toolType, settingKey, newValue);
                 }
             }
         } else {
            this.stopValueDragging(); 
         }
    }
    stopValueDragging() {
        if (this.node && this.node.graph) {
            this.node.graph.block_mouse = false;
        }
        window.removeEventListener('pointerup', this.handleGlobalValuePointerUp, { capture: true });
        window.removeEventListener('pointermove', this.handleGlobalValuePointerMove, { capture: true });
    }
    _updateSliderBackground(slider, value, min, max) {
        if (!slider || !slider.style) {
            console.error("Invalid slider element passed to _updateSliderBackground");
            return;
        }
        const percentage = max === min ? 0 : ((value - min) / (max - min)) * 100;
        slider.style.backgroundSize = `${Math.max(0, Math.min(100, percentage))}% 100%`;
    }
    _createSettingsFactory() {
        return {
            createSlider: (config) => {
                const { 
                    id, label, value, min, max, step = 0.01, 
                    toolType, settingName, showValue = true,
                    valueSuffix = '', valueMultiplier = 1,
                    containerClass = 'setting-item'
                } = config;
                const container = document.createElement('div');
                container.className = containerClass;
                const labelEl = document.createElement('label');
                labelEl.textContent = label + (showValue ? `: ${(value * valueMultiplier).toFixed(2)}${valueSuffix}` : '');
                labelEl.style.cssText = 'display: block; margin-bottom: 5px; color: #ddd; font-size: 12px;';
                const slider = document.createElement('input');
                slider.type = 'range';
                slider.id = id;
                slider.min = min;
                slider.max = max;
                slider.step = step;
                slider.value = value;
                slider.style.cssText = 'width: 100%; margin-bottom: 10px;';
                this._updateSliderBackground(slider, value, min, max);
                slider.addEventListener('input', (e) => {
                    const newValue = parseFloat(e.target.value);
                    this._handleSettingChange(toolType, settingName, newValue);
                    if (showValue) {
                        labelEl.textContent = label + `: ${(newValue * valueMultiplier).toFixed(2)}${valueSuffix}`;
                    }
                    this._updateSliderBackground(slider, newValue, min, max);
                });
                container.appendChild(labelEl);
                container.appendChild(slider);
                return container;
            },
            createColorPicker: (config) => {
                const { 
                    id, label, value, toolType, settingName,
                    showLabel = true, containerClass = 'setting-item',
                    pickerType = 'hsv' 
                } = config;
                const container = document.createElement('div');
                container.className = containerClass;
                if (showLabel) {
                    const labelEl = document.createElement('label');
                    labelEl.textContent = label;
                    labelEl.style.cssText = 'display: block; margin-bottom: 5px; color: #ddd; font-size: 12px;';
                    container.appendChild(labelEl);
                }
                let picker;
                if (pickerType === 'hsv') {
                    picker = this._createUnifiedColorPicker(
                        label,
                        value,
                        (newColor) => {
                            this._handleSettingChange(toolType, settingName, newColor);
                        }
                    );
                } else if (pickerType === 'native') {
                    picker = document.createElement('input');
                    picker.type = 'color';
                    picker.value = value;
                    picker.addEventListener('change', (e) => {
                        this._handleSettingChange(toolType, settingName, e.target.value);
                    });
                } else { 
                    picker = this._createUnifiedColorPicker(
                        label,
                        value,
                        (newColor) => {
                            this._handleSettingChange(toolType, settingName, newColor);
                        }
                    );
                }
                container.appendChild(picker);
                return container;
            },
            createSelect: (config) => {
                const { 
                    id, label, value, options, toolType, settingName,
                    containerClass = 'setting-item'
                } = config;
                const container = document.createElement('div');
                container.className = containerClass;
                const labelEl = document.createElement('label');
                labelEl.textContent = label;
                labelEl.style.cssText = 'display: block; margin-bottom: 5px; color: #ddd; font-size: 12px;';
                const select = document.createElement('select');
                select.id = id;
                select.style.cssText = 'width: 100%; padding: 5px; margin-bottom: 10px; background: #333; color: #ddd; border: 1px solid #555;';
                options.forEach(option => {
                    const optionEl = document.createElement('option');
                    optionEl.value = option.value;
                    optionEl.textContent = option.text;
                    if (option.value === value) {
                        optionEl.selected = true;
                    }
                    select.appendChild(optionEl);
                });
                select.addEventListener('change', (e) => {
                    this._handleSettingChange(toolType, settingName, e.target.value);
                });
                container.appendChild(labelEl);
                container.appendChild(select);
                return container;
            },
            createCheckbox: (config) => {
                const { 
                    id, label, value, toolType, settingName,
                    containerClass = 'setting-item'
                } = config;
                const container = document.createElement('div');
                container.className = containerClass;
                const checkboxContainer = document.createElement('label');
                checkboxContainer.style.cssText = 'display: flex; align-items: center; color: #ddd; font-size: 12px; cursor: pointer;';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = id;
                checkbox.checked = value;
                checkbox.style.cssText = 'margin-right: 8px;';
                checkbox.addEventListener('change', (e) => {
                    this._handleSettingChange(toolType, settingName, e.target.checked);
                });
                const labelEl = document.createElement('span');
                labelEl.textContent = label;
                checkboxContainer.appendChild(checkbox);
                checkboxContainer.appendChild(labelEl);
                container.appendChild(checkboxContainer);
                return container;
            }
        };
    }
    _createColorPickerPopup() {
        const popup = document.createElement("div");
        popup.className = "paint-quick-color-picker-popup";
        popup.style.cssText = `
            position: fixed; 
            background: #2A2A2A;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            padding: 10px;
            z-index: 10002; 
            border: 1px solid #444;
            user-select: none;
        `;
        return popup;
    }
    _createBrushPresetSelect(dialogContent) {
        const brushPresetContainer = document.createElement('div');
        brushPresetContainer.className = 'sk-paint-settings-group';
        brushPresetContainer.innerHTML = `
            <div class="sk-paint-settings-row">
                <label class="sk-paint-settings-label">Brush Preset</label>
                <select class="sk-paint-brush-preset-dropdown"></select>
            </div>
            <div class="sk-paint-brush-description"></div>
        `;
        dialogContent.appendChild(brushPresetContainer);
        const presetDropdown = brushPresetContainer.querySelector('.sk-paint-brush-preset-dropdown');
        const descriptionEl = brushPresetContainer.querySelector('.sk-paint-brush-description');
        presetDropdown.style.flex = '1';
        presetDropdown.style.backgroundColor = '#333';
        presetDropdown.style.color = '#ddd';
        presetDropdown.style.border = '1px solid #555';
        presetDropdown.style.borderRadius = '4px';
        presetDropdown.style.padding = '5px';
        presetDropdown.style.outline = 'none';
        presetDropdown.style.cursor = 'pointer';
        descriptionEl.style.marginTop = '5px';
        descriptionEl.style.fontSize = '11px';
        descriptionEl.style.color = '#aaa';
        descriptionEl.style.minHeight = '30px';
        descriptionEl.style.fontStyle = 'italic';
        const updateDescription = (presetKey) => {
            const preset = BRUSH_PRESETS[presetKey];
            if (preset && preset.description) {
                descriptionEl.textContent = preset.description;
            } else {
                descriptionEl.textContent = '';
            }
        };
        Object.keys(BRUSH_PRESETS).forEach(presetKey => {
            const preset = BRUSH_PRESETS[presetKey];
            const option = document.createElement('option');
            option.value = presetKey;
            option.textContent = preset.name;
            presetDropdown.appendChild(option);
            if (presetKey === this.canvasState.brushPreset) {
                option.selected = true;
                updateDescription(presetKey);
            }
        });
        presetDropdown.addEventListener('change', () => {
            const selectedPreset = presetDropdown.value;
            updateDescription(selectedPreset);
            this._updateBrushPreset(selectedPreset);
        });
    }
    _updateBrushPreset(presetKey) {
        if (!BRUSH_PRESETS[presetKey]) return;
        const preset = BRUSH_PRESETS[presetKey];
        this.node.canvasState.brushPreset = presetKey;
        this.node.canvasState.brushSpacing = preset.spacing;
        this.node.canvasState.brushFlow = preset.flow;
        this.node.canvasState.brushHardness = preset.hardness;
        this.node.canvasState.pressureSensitivity = preset.pressureSensitivity;
        this.node.canvasState.scattering = preset.scattering ?? TOOL_SETTINGS.BRUSH.DEFAULT_SCATTERING;
        this.node.canvasState.shapeDynamics = preset.shapeDynamics ?? TOOL_SETTINGS.BRUSH.DEFAULT_SHAPE_DYNAMICS;
        this.node.canvasState.texture = preset.texture ?? "none";
        this.node.canvasState.dualBrush = preset.dualBrush ?? "none";
        const sliders = document.querySelectorAll('input[type=range]');
        sliders.forEach(slider => {
            const key = slider.dataset.key;
            if (key && this.node.canvasState[key] !== undefined) {
                slider.value = this.node.canvasState[key];
                const valDisplay = slider.nextElementSibling;
                if (valDisplay && valDisplay.className === 'slider-value') {
                    if (key === 'brushSize') {
                        valDisplay.textContent = `${this.node.canvasState[key]}px`;
                    } else {
                        valDisplay.textContent = `${(this.node.canvasState[key] * 100).toFixed(0)}%`;
                    }
                }
                if (this._updateSliderBackground) {
                    this._updateSliderBackground(slider, this.node.canvasState[key], slider.min, slider.max);
                }
            }
        });
        if (this.callbacks.onSettingChange) {
            this.callbacks.onSettingChange(this.node.canvasState.tool, 'brushPreset', presetKey);
            Object.entries(preset).forEach(([key, value]) => {
                if (key !== 'name' && key !== 'description') {
                    const canvasStateKey = key === 'spacing' ? 'brushSpacing' : 
                                        key === 'flow' ? 'brushFlow' : 
                                        key === 'hardness' ? 'brushHardness' : 
                                        key;
                    this.callbacks.onSettingChange(this.node.canvasState.tool, canvasStateKey, value);
                }
            });
        }
    }
    _handleQuickControlsPointerDown(position, layout, nodeState) {
        let needsRedraw = false;
        let eventHandled = false;
        for (const key in layout.hitboxes) {
            const hitbox = layout.hitboxes[key];
            if (this._pointInHitbox(position, hitbox)) {
                eventHandled = true;
                this.quickControlsState.activeControl = hitbox.controlId;
                this.quickControlsState.currentControlContext = hitbox.context; 
                if (hitbox.context.type === 'color' || hitbox.context.type === 'endColor') {
                    const isEndColor = hitbox.context.type === 'endColor';
                    const initialColor = isEndColor ? nodeState.gradientEndColor : nodeState.color;
                    position.event.forceEyeDropper = false;
                    this.showQuickColorPicker(position.event, initialColor || '#000000', isEndColor);
                    needsRedraw = true;
                } else if (hitbox.context.type === 'value') {
                    this.quickControlsState.isDraggingValue = true; 
                    if (nodeState.tool === PAINT_TOOLS.BRUSH) {
                        this.quickControlsState.isDraggingLeftValue = (hitbox.controlId === 'size_left');
                        this.quickControlsState.isDraggingRightValue = (hitbox.controlId === 'size_right' || hitbox.controlId === 'opacity_right');
                    } else { 
                        this.quickControlsState.isDraggingLeftValue = (hitbox.controlId === 'secondary');
                        this.quickControlsState.isDraggingRightValue = (hitbox.controlId === 'primary');
                    }
                    this.quickControlsState.valueDragStartValue = hitbox.context.value;
                    this.quickControlsState.valueDragStartX = position.x; 
                    this.quickControlsState.valueDragMin = hitbox.context.min;
                    this.quickControlsState.valueDragMax = hitbox.context.max;
                    this.quickControlsState.valueDragKey = hitbox.context.key;
                    this.quickControlsState.valueDragThresholdMet = false;
                    if (this.node && this.node.graph) {
                        this.node.graph.block_mouse = true;
                    }
                    window.addEventListener('pointermove', this.handleGlobalValuePointerMove.bind(this), { capture: true });
                    window.addEventListener('pointerup', this.handleGlobalValuePointerUp.bind(this), { capture: true });
                    needsRedraw = true;
                } else if (hitbox.context.type === 'mode' && nodeState.tool === PAINT_TOOLS.EYEDROPPER) {
                    const newMode = nodeState.eyedropperSampleMode === 'pixel' ? 'average' : 'pixel';
                    if (this.callbacks.onSettingChange) {
                        this.callbacks.onSettingChange(PAINT_TOOLS.EYEDROPPER, 'eyedropperSampleMode', newMode);
                    }
                    needsRedraw = true;
                }
                break; 
            }
        }
        return { needsRedraw, eventHandled };
    }
    _createEyedropperSettings() {
        this.content.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'refined-settings-content';
        const header = document.createElement('div');
        header.className = 'settings-section-header';
        header.innerHTML = '<h3>Eyedropper Settings</h3>';
        wrapper.appendChild(header);
        const modeSection = document.createElement('div');
        modeSection.className = 'settings-row';
        const modeLabel = document.createElement('label');
        modeLabel.textContent = 'Sample Mode:';
        modeSection.appendChild(modeLabel);
        const modeSelect = document.createElement('select');
        modeSelect.className = 'settings-select';
        const pixelOption = document.createElement('option');
        pixelOption.value = 'pixel';
        pixelOption.textContent = 'Pixel (Exact Color)';
        const averageOption = document.createElement('option');
        averageOption.value = 'average';
        averageOption.textContent = 'Average (Nearby Colors)';
        modeSelect.appendChild(pixelOption);
        modeSelect.appendChild(averageOption);
        if (this.node.canvasState.eyedropperSampleMode) {
            modeSelect.value = this.node.canvasState.eyedropperSampleMode;
        } else {
            modeSelect.value = 'pixel';
            this.node.canvasState.eyedropperSampleMode = 'pixel';
        }
        modeSelect.addEventListener('change', () => {
            this.node.canvasState.eyedropperSampleMode = modeSelect.value;
            if (this.callbacks.onSettingChange) {
                this.callbacks.onSettingChange(PAINT_TOOLS.EYEDROPPER, 'eyedropperSampleMode', modeSelect.value);
            }
        });
        modeSection.appendChild(modeSelect);
        wrapper.appendChild(modeSection);
        const sizeSection = document.createElement('div');
        sizeSection.className = 'slider-row';
        const sizeLabel = document.createElement('label');
        sizeLabel.textContent = 'Sample Size:';
        sizeSection.appendChild(sizeLabel);
        const sizeSlider = document.createElement('input');
        sizeSlider.type = 'range';
        sizeSlider.min = 1;
        sizeSlider.max = 10;
        sizeSlider.step = 1;
        if (this.node.canvasState.eyedropperSampleSize) {
            sizeSlider.value = this.node.canvasState.eyedropperSampleSize;
        } else {
            sizeSlider.value = 3; 
            this.node.canvasState.eyedropperSampleSize = 3;
        }
        const sizeValueDisplay = document.createElement('span');
        sizeValueDisplay.className = 'slider-value';
        sizeValueDisplay.textContent = `${sizeSlider.value}px`;
        this._updateSliderBackground(sizeSlider, sizeSlider.value, sizeSlider.min, sizeSlider.max);
        sizeSlider.addEventListener('input', e => {
            const value = parseInt(e.target.value);
            this.node.canvasState.eyedropperSampleSize = value;
            sizeValueDisplay.textContent = `${value}px`;
            this._updateSliderBackground(sizeSlider, value, sizeSlider.min, sizeSlider.max);
            if (this.callbacks.onSettingChange) {
                this.callbacks.onSettingChange(PAINT_TOOLS.EYEDROPPER, 'eyedropperSampleSize', value);
            }
        });
        sizeSection.appendChild(sizeSlider);
        sizeSection.appendChild(sizeValueDisplay);
        wrapper.appendChild(sizeSection);
        const descriptionDiv = document.createElement('div');
        descriptionDiv.className = 'settings-description';
        descriptionDiv.innerHTML = `
            <p><strong>Pixel mode:</strong> Picks the exact color of the pixel under cursor.</p>
            <p><strong>Average mode:</strong> Samples multiple pixels around cursor and averages their colors.</p>
        `;
        wrapper.appendChild(descriptionDiv);
        this.content.appendChild(wrapper);
    }
    _createGradientSettings() {
        this.content.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'refined-settings-content';
        const typeRow = document.createElement('div');
        typeRow.className = 'slider-row';
        const typeLabel = document.createElement('label');
        typeLabel.textContent = 'Type';
        const typeSelect = document.createElement('select');
        typeSelect.className = 'paint-select';
        typeSelect.style.flexGrow = '1';
        typeSelect.style.maxWidth = '180px';
        typeSelect.style.marginLeft = 'auto';
        const types = [
            { value: 'linear', label: 'Linear' },
            { value: 'radial', label: 'Radial' },
            { value: 'conical', label: 'Conical' }
        ];
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type.value;
            option.textContent = type.label;
            if ((this.node.canvasState.gradientType || 'linear') === type.value) {
                option.selected = true;
            }
            typeSelect.appendChild(option);
        });
        typeSelect.addEventListener('change', () => {
            this._handleSettingChange(this.currentTool, 'gradientType', typeSelect.value);
            updatePreview();
        });
        typeRow.append(typeLabel, typeSelect);
        wrapper.appendChild(typeRow);
        const startColorPicker = this._createUnifiedColorPicker(
            'Start Color',
            this.node.canvasState.color,
            (newColor) => {
                this._handleSettingChange(this.currentTool, 'color', newColor);
                updatePreview();
            }
        );
        wrapper.appendChild(startColorPicker);
        const endColorPicker = this._createUnifiedColorPicker(
            'End Color',
            this.node.canvasState.gradientEndColor || '#000000',
            (newColor) => {
                this._handleSettingChange(this.currentTool, 'gradientEndColor', newColor);
                updatePreview();
            }
        );
        wrapper.appendChild(endColorPicker);
        wrapper.appendChild(this._createSliderRow({
            label: 'Opacity', key: 'opacity', min: 0, max: 1, step: 0.01, format: (v) => `${(v * 100).toFixed(0)}%`, defaultValue: 1.0
        }));
        wrapper.appendChild(this._createSliderRow({
            label: 'Smoothness', key: 'gradientSmoothness', min: 0, max: 1, step: 0.01, format: (v) => `${(v * 100).toFixed(0)}%`, defaultValue: 0.5
        }));
        const previewSection = document.createElement('div');
        previewSection.style.cssText = `margin-top: 10px; padding: 0 8px;`;
        const previewLabel = document.createElement('label');
        previewLabel.textContent = 'Preview';
        previewLabel.style.cssText = `display: block; font-size: 12px; color: #ccc; margin-bottom: 4px;`;
        previewSection.appendChild(previewLabel);
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = 260; 
        previewCanvas.height = 30;
        previewCanvas.style.cssText = `width: 100%; height: 30px; border-radius: 4px; border: 1px solid #555;`;
        previewSection.appendChild(previewCanvas);
        const updatePreview = () => {
            const ctx = previewCanvas.getContext('2d');
            const startColor = this.node.canvasState.color || '#ffffff';
            const endColor = this.node.canvasState.gradientEndColor || '#000000';
            const gradientType = this.node.canvasState.gradientType || 'linear';
            let gradient;
            if (gradientType === 'linear') {
                gradient = ctx.createLinearGradient(0, 0, previewCanvas.width, 0);
            } else if (gradientType === 'radial') {
                gradient = ctx.createRadialGradient(
                    previewCanvas.width / 2, previewCanvas.height / 2, 0,
                    previewCanvas.width / 2, previewCanvas.height / 2, previewCanvas.width / 2
                );
            } else { 
                gradient = ctx.createConicGradient(Math.PI, previewCanvas.width / 2, previewCanvas.height / 2);
            }
            gradient.addColorStop(0, startColor);
            gradient.addColorStop(1, endColor);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
        };
        this.content.appendChild(wrapper);
        wrapper.appendChild(previewSection);
        updatePreview();
    }
    _createCompactContainer(className = '') {
        const container = document.createElement("div");
        container.className = className;
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 8px;
        `;
        return container;
    }
    _createCompactLabel(text, fontSize = 12) {
        const label = document.createElement("label");
        label.textContent = text;
        label.style.cssText = `
            font-size: ${fontSize}px;
            color: #CCC;
            margin-bottom: 2px;
        `;
        return label;
    }
    _createLineSettings() {
        this.content.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'refined-settings-content';
        const colorPicker = this._createUnifiedColorPicker(
            'Line Color',
            this.node.canvasState.color || '#ffffff',
            (newColor) => {
                this._handleSettingChange(this.currentTool, 'color', newColor);
            }
        );
        wrapper.appendChild(colorPicker);
        wrapper.appendChild(this._createSliderRow({
            label: 'Width', key: 'brushSize', min: 1, max: 50, step: 1, format: (v) => `${v}px`, defaultValue: 5
        }));
        wrapper.appendChild(this._createSliderRow({
            label: 'Opacity', key: 'opacity', min: 0, max: 1, step: 0.01, format: (v) => `${(v*100).toFixed(0)}%`, defaultValue: 1.0
        }));
        wrapper.appendChild(this._createSliderRow({
            label: 'Arrow Size', key: 'arrowSize', min: TOOL_SETTINGS.LINE.MIN_ARROW_SIZE, max: TOOL_SETTINGS.LINE.MAX_ARROW_SIZE, step: 1, format: (v) => `${v}px`, defaultValue: TOOL_SETTINGS.LINE.DEFAULT_ARROW_SIZE
        }));
        const createSelect = (label, key, options, defaultValue) => {
            const row = document.createElement('div');
            row.className = 'slider-row'; 
            row.style.justifyContent = 'space-between';
            const lab = document.createElement('label');
            lab.textContent = label;
            const select = document.createElement('select');
            select.className = 'paint-select';
            select.style.maxWidth = '160px'; 
            Object.entries(options).forEach(([name, value]) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = name.charAt(0) + name.slice(1).toLowerCase().replace(/_/g, ' ');
                if ((this.node.canvasState[key] || defaultValue) === value) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
            select.addEventListener('change', (e) => this._handleSettingChange(this.currentTool, key, e.target.value));
            row.append(lab, select);
            wrapper.appendChild(row);
        };
        createSelect('Line Style', 'lineStyle', TOOL_SETTINGS.LINE.LINE_STYLES, TOOL_SETTINGS.LINE.DEFAULT_LINE_STYLE);
        createSelect('Line Cap', 'lineCap', TOOL_SETTINGS.LINE.LINE_CAPS, TOOL_SETTINGS.LINE.DEFAULT_LINE_CAP);
        const createCheckbox = (label, key, defaultValue) => {
            const row = document.createElement('div');
            row.className = 'slider-row';
            row.style.justifyContent = 'space-between';
            const lab = document.createElement('label');
            lab.textContent = label;
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = this.node.canvasState[key] !== undefined ? this.node.canvasState[key] : defaultValue;
            checkbox.style.marginLeft = 'auto';
            checkbox.addEventListener('change', (e) => {
                this._handleSettingChange(this.currentTool, key, e.target.checked);
            });
            row.append(lab, checkbox);
            wrapper.appendChild(row);
        };
        createCheckbox('Start Arrow', 'startArrow', TOOL_SETTINGS.LINE.DEFAULT_START_ARROW);
        createCheckbox('End Arrow', 'endArrow', TOOL_SETTINGS.LINE.DEFAULT_END_ARROW);
        this.content.appendChild(wrapper);
    }
    _createRectangleSettings() {
        this.content.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'refined-settings-content';
        const borderColorPicker = this._createUnifiedColorPicker(
            'Border Color',
            this.node.canvasState.color || '#ffffff',
            (newColor) => this._handleSettingChange(PAINT_TOOLS.RECTANGLE, 'color', newColor)
        );
        wrapper.appendChild(borderColorPicker);
        wrapper.appendChild(this._createSliderRow({
            label: 'Border Width',
            key: 'brushSize',
            min: 0, max: 50, step: 1,
            format: (v) => `${v}px`,
            defaultValue: 5
        }));
        wrapper.appendChild(this._createSliderRow({
            label: 'Opacity',
            key: 'opacity',
            min: 0, max: 1, step: 0.01,
            format: (v) => `${(v*100).toFixed(0)}%`,
            defaultValue: 1.0
        }));
        const fillStyleRow = document.createElement('div');
        fillStyleRow.className = 'slider-row';
        const fillStyleLabel = document.createElement('label');
        fillStyleLabel.textContent = 'Fill Style';
        const fillStyleSelect = document.createElement('select');
        fillStyleSelect.className = 'paint-select';
        fillStyleSelect.style.flexGrow = '1';
        fillStyleSelect.style.maxWidth = '180px';
        fillStyleSelect.style.marginLeft = 'auto';
        Object.entries(TOOL_SETTINGS.RECTANGLE.FILL_STYLES).forEach(([name, value]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = name.charAt(0) + name.slice(1).toLowerCase();
            
            if ((this.node.canvasState.rectangleFillStyle || TOOL_SETTINGS.RECTANGLE.DEFAULT_FILL_STYLE) === value) {
                option.selected = true;
            }
            fillStyleSelect.appendChild(option);
        });
        fillStyleRow.append(fillStyleLabel, fillStyleSelect);
        wrapper.appendChild(fillStyleRow);
        const fillColorPicker = this._createUnifiedColorPicker(
            'Fill Color',
            this.node.canvasState.rectangleFillColor || TOOL_SETTINGS.RECTANGLE.DEFAULT_FILL_COLOR,
            (newColor) => this._handleSettingChange(PAINT_TOOLS.RECTANGLE, 'fillColor', newColor)
        );
        wrapper.appendChild(fillColorPicker);
        const fillEndColorPicker = this._createUnifiedColorPicker(
            'Gradient End',
            this.node.canvasState.rectangleFillEndColor || TOOL_SETTINGS.RECTANGLE.DEFAULT_FILL_END_COLOR,
            (newColor) => this._handleSettingChange(PAINT_TOOLS.RECTANGLE, 'fillEndColor', newColor)
        );
        wrapper.appendChild(fillEndColorPicker);
        const updateFillPickersVisibility = () => {
            const style = fillStyleSelect.value;
            fillColorPicker.style.display = (style === 'solid' || style === 'gradient') ? '' : 'none';
            fillEndColorPicker.style.display = style === 'gradient' ? '' : 'none';
        };
        fillStyleSelect.addEventListener('change', () => {
            this._handleSettingChange(PAINT_TOOLS.RECTANGLE, 'fillStyle', fillStyleSelect.value);
            updateFillPickersVisibility();
        });
        updateFillPickersVisibility();
        wrapper.appendChild(this._createSliderRow({
            label: 'Radius',
            key: 'borderRadius',
            min: TOOL_SETTINGS.RECTANGLE.MIN_BORDER_RADIUS, max: TOOL_SETTINGS.RECTANGLE.MAX_BORDER_RADIUS, step: 1,
            format: (v) => `${v}px`,
            defaultValue: TOOL_SETTINGS.RECTANGLE.DEFAULT_BORDER_RADIUS
        }));
        wrapper.appendChild(this._createSliderRow({
            label: 'Rotation',
            key: 'rotation',
            min: TOOL_SETTINGS.RECTANGLE.MIN_ROTATION, max: TOOL_SETTINGS.RECTANGLE.MAX_ROTATION, step: 1,
            format: (v) => `${v}°`,
            defaultValue: TOOL_SETTINGS.RECTANGLE.DEFAULT_ROTATION
        }));
        this.content.appendChild(wrapper);
    }
    _createCircleSettings() {
        this.content.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'refined-settings-content';
        const borderColorPicker = this._createUnifiedColorPicker(
            'Border Color',
            this.node.canvasState.color || '#ffffff',
            (newColor) => this._handleSettingChange(PAINT_TOOLS.CIRCLE, 'color', newColor)
        );
        wrapper.appendChild(borderColorPicker);
        wrapper.appendChild(this._createSliderRow({
            label: 'Border Width',
            key: 'brushSize',
            min: 0, max: 50, step: 1,
            format: (v) => `${v}px`,
            defaultValue: 5
        }));
        wrapper.appendChild(this._createSliderRow({
            label: 'Opacity',
            key: 'opacity',
            min: 0, max: 1, step: 0.01,
            format: (v) => `${(v*100).toFixed(0)}%`,
            defaultValue: 1.0
        }));
        const fillStyleRow = document.createElement('div');
        fillStyleRow.className = 'slider-row';
        const fillStyleLabel = document.createElement('label');
        fillStyleLabel.textContent = 'Fill Style';
        const fillStyleSelect = document.createElement('select');
        fillStyleSelect.className = 'paint-select';
        fillStyleSelect.style.flexGrow = '1';
        fillStyleSelect.style.maxWidth = '180px';
        fillStyleSelect.style.marginLeft = 'auto';
        Object.entries(TOOL_SETTINGS.CIRCLE.FILL_STYLES).forEach(([name, value]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = name.charAt(0) + name.slice(1).toLowerCase();
            
            if ((this.node.canvasState.circleFillStyle || TOOL_SETTINGS.CIRCLE.DEFAULT_FILL_STYLE) === value) {
                option.selected = true;
            }
            fillStyleSelect.appendChild(option);
        });
        fillStyleRow.append(fillStyleLabel, fillStyleSelect);
        wrapper.appendChild(fillStyleRow);
        const fillColorPicker = this._createUnifiedColorPicker(
            'Fill Color',
            this.node.canvasState.circleFillColor || TOOL_SETTINGS.CIRCLE.DEFAULT_FILL_COLOR,
            (newColor) => this._handleSettingChange(PAINT_TOOLS.CIRCLE, 'fillColor', newColor)
        );
        wrapper.appendChild(fillColorPicker);
        const fillEndColorPicker = this._createUnifiedColorPicker(
            'Gradient End',
            this.node.canvasState.circleFillEndColor || TOOL_SETTINGS.CIRCLE.DEFAULT_FILL_END_COLOR,
            (newColor) => this._handleSettingChange(PAINT_TOOLS.CIRCLE, 'fillEndColor', newColor)
        );
        wrapper.appendChild(fillEndColorPicker);
        const updateFillPickersVisibility = () => {
            const style = fillStyleSelect.value;
            fillColorPicker.style.display = (style === 'solid' || style === 'gradient') ? '' : 'none';
            fillEndColorPicker.style.display = style === 'gradient' ? '' : 'none';
        };
        fillStyleSelect.addEventListener('change', () => {
            this._handleSettingChange(PAINT_TOOLS.CIRCLE, 'fillStyle', fillStyleSelect.value);
            updateFillPickersVisibility();
        });
        updateFillPickersVisibility();
        wrapper.appendChild(this._createSliderRow({
            label: 'Start Angle',
            key: 'startAngle',
            min: TOOL_SETTINGS.CIRCLE.MIN_START_ANGLE, max: TOOL_SETTINGS.CIRCLE.MAX_START_ANGLE, step: 1,
            format: (v) => `${v}°`,
            defaultValue: TOOL_SETTINGS.CIRCLE.DEFAULT_START_ANGLE
        }));
        wrapper.appendChild(this._createSliderRow({
            label: 'End Angle',
            key: 'endAngle',
            min: TOOL_SETTINGS.CIRCLE.MIN_END_ANGLE, max: TOOL_SETTINGS.CIRCLE.MAX_END_ANGLE, step: 1,
            format: (v) => `${v}°`,
            defaultValue: TOOL_SETTINGS.CIRCLE.DEFAULT_END_ANGLE
        }));
        this.content.appendChild(wrapper);
    }
    _addCompactStyles() {
        const styleId = 'paint-node-compact-styles';
        if (document.getElementById(styleId)) return;
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .compact-settings .slider-row,
            .compact-settings .settings-row {
                margin-bottom: 6px !important;
            }
            .compact-settings .settings-section-header {
                margin-bottom: 6px !important;
            }
            .compact-settings .color-picker-container {
                margin-bottom: 6px !important;
                padding: 6px !important;
            }
            .compact-settings .settings-section {
                gap: 6px !important;
            }
        `;
        document.head.appendChild(style);
    }
    _createSliderRow({ label, key, min, max, step, format, defaultValue }) {
        const value = this.node.canvasState[key] ?? defaultValue;
        const row = document.createElement('div');
        row.className = 'slider-row';
        const lab = document.createElement('label');
        lab.textContent = label;
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min; slider.max = max; slider.step = step;
        slider.value = value;
        const valDisplay = document.createElement('span');
        valDisplay.className = 'slider-value';
        valDisplay.textContent = format(value);
        this._updateSliderBackground(slider, value, min, max);
        slider.addEventListener('input', e => {
            const v = parseFloat(e.target.value);
            this._handleSettingChange(this.currentTool, key, v);
            valDisplay.textContent = format(v);
            this._updateSliderBackground(slider, v, min, max);
        });
        row.append(lab, slider, valDisplay);
        return row;
    }

    _createMaskSettings() {
        this.content.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'refined-settings-content';

        
        wrapper.appendChild(this._createSliderRow({
            label: 'Brush Size',
            key: 'brushSize',
            min: 1, max: 200, step: 1,
            format: (v) => `${v}px`,
            defaultValue: 40
        }));

        
        wrapper.appendChild(this._createSliderRow({
            label: 'Hardness',
            key: 'maskHardness',
            min: TOOL_SETTINGS.MASK.MIN_HARDNESS, 
            max: TOOL_SETTINGS.MASK.MAX_HARDNESS, 
            step: 0.01,
            format: (v) => `${(v*100).toFixed(0)}%`,
            defaultValue: TOOL_SETTINGS.MASK.DEFAULT_HARDNESS
        }));

        this.content.appendChild(wrapper);
    }
}
