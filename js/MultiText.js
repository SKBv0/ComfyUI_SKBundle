import { app } from "../../../scripts/app.js";
import { ComfyWidgets } from "../../../scripts/widgets.js";
import {
    defaultPresets,
    defaultTemplates,
    defaultThemeConfig,
    injectDialogCSS,
    DialogUtils
} from "./MultiTextDefaults.js";

const THEME = {
    ...defaultThemeConfig, 
    promptPresets: defaultPresets, 
    promptTemplates: defaultTemplates, 
};


injectDialogCSS(THEME);

const fontStyles = document.createElement('style');
fontStyles.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    .multitext-node {
        font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }
`;
document.head.appendChild(fontStyles);

const Utils = {
    drawRoundedRect(ctx, x, y, w, h, r = 4, options = { fill: true, stroke: false, lineWidth: 1 }) {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        if (options.fill) ctx.fill();
        if (options.stroke) {
            ctx.lineWidth = options.lineWidth;
            ctx.stroke();
        }
    },
    truncateTextEfficient(ctx, text, maxWidth) {
        if (!text) return '';
        const width = ctx.measureText(text).width;
        if (width <= maxWidth) return text;
        
        const ellipsis = '...';
        const ellipsisWidth = ctx.measureText(ellipsis).width;
        let low = 0;
        let high = text.length;
        let best = 0;
        
        while (low <= high) {
            const mid = (low + high) >>> 1;
            const slice = text.slice(0, mid);
            const width = ctx.measureText(slice).width + ellipsisWidth;
            
            if (width <= maxWidth) {
                best = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return text.slice(0, best) + ellipsis;
    }
};
const UXUtils = {
    drawTooltip(ctx, text, x, y) {
        if (!text) return;
        
        const padding = 8;
        const fontSize = 12;
        ctx.save();
        
        
        ctx.font = `${fontSize}px ${THEME.typography.fonts.primary}`;
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        
        
        const metrics = ctx.measureText(text);
        const tooltipWidth = metrics.width + (padding * 2);
        const tooltipHeight = fontSize + (padding * 2);
        
        
        let tooltipX = Math.max(8, Math.min(x, ctx.canvas.width - tooltipWidth - 8));
        let tooltipY = y - tooltipHeight - 8;
        if (tooltipY < 8) {
            tooltipY = y + 24;
        }
        
        
        ctx.fillStyle = THEME.colors.bgActive;
        ctx.shadowColor = "rgba(0,0,0,0.2)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;
        Utils.drawRoundedRect(ctx, tooltipX, tooltipY, tooltipWidth, tooltipHeight, 4);
        
        
        ctx.shadowColor = "transparent";
        ctx.fillStyle = THEME.colors.text;
        ctx.fillText(text, tooltipX + padding, tooltipY + (tooltipHeight / 2));
        
        ctx.restore();
    }
};
const Renderer = {
    drawPromptRow(ctx, x, y, text, weight, rowWidth, rowHeight, radius) {
        ctx.save();
        ctx.fillStyle = THEME.colors.bg;
        ctx.shadowColor = "rgba(0,0,0,0.06)";
        ctx.shadowBlur = 2;
        ctx.shadowOffsetY = 1;
        Utils.drawRoundedRect(ctx, x, y, rowWidth, rowHeight, radius);
        ctx.restore();
        ctx.strokeStyle = THEME.colors.border;
        Utils.drawRoundedRect(ctx, x, y, rowWidth, rowHeight, radius, { 
            fill: false, 
            stroke: true, 
            lineWidth: THEME.layout.promptRow.strokeWidth 
        }); 
        ctx.fillStyle = THEME.colors.text;
        ctx.font = `400 11px ${THEME.typography.fonts.primary}`; 
        const truncatedText = Utils.truncateTextEfficient(ctx, text, rowWidth - 100);
        const toggleWidth = 15;
        ctx.fillText(truncatedText, x + toggleWidth + 2, y + rowHeight/2 + 4); 
        const weightX = x + rowWidth - 55;
        const weightY = Math.floor(y + (rowHeight / 2));
        ctx.fillStyle = THEME.colors.border;
        ctx.fillRect(weightX, weightY, 32, 1);
        const weightValue = parseFloat(weight) || 1.0;
        ctx.fillStyle = THEME.colors.accent;
        ctx.fillRect(weightX, weightY, 32 * (weightValue/2), 1);
        ctx.fillStyle = THEME.colors.textDim;
        ctx.font = `500 8px ${THEME.typography.fonts.primary}`;
        ctx.textAlign = "right";
        ctx.fillText(weightValue.toFixed(1), weightX + 50, weightY + 3);
        ctx.textAlign = "left";
    },


};
const MultiTextNode = {
    onNodeCreated() {
        if (this.htmlElement) {
            this.htmlElement.classList.add('multitext-node');
        }
        this.setupWidgets();
        
        
        this.activePrompts = parseInt(localStorage.getItem('multitext_prompt_count')) || 2;
        this.maxPrompts = 20;
        this.isSinglePromptMode = localStorage.getItem('multitext_single_prompt') === "true";
        this.tooltipState = { visible: false, text: '', x: 0, y: 0 };
        this.currentHoverIndex = -1;
        
        
        this.applyPromptMode();
        this.updateNodeSize();
        this.loadFonts();
        this.loadSavedTemplates();
        this.loadSavedPresets();
    },
    
    loadSavedTemplates() {
        try {
            const savedTemplates = localStorage.getItem('multitext_templates');
            if (savedTemplates) {
                const parsedTemplates = JSON.parse(savedTemplates);
                
                
                Object.entries(parsedTemplates).forEach(([category, categoryData]) => {
                    if (THEME.promptTemplates[category]) {
                        
                        THEME.promptTemplates[category].icon = categoryData.icon || THEME.promptTemplates[category].icon;
                        THEME.promptTemplates[category].label = categoryData.label || THEME.promptTemplates[category].label;
                        
                        
                        if (Array.isArray(categoryData.templates)) {
                            
                            const defaultTemplates = THEME.promptTemplates[category].templates || [];
                            const defaultTemplateNames = defaultTemplates.map(t => t.name);
                            
                            
                            const filteredDefaults = defaultTemplates.filter(template => 
                                !categoryData.templates.some(t => t.name === template.name)
                            );
                            
                            
                            const customTemplates = categoryData.templates.map(template => ({
                                ...template,
                                isCustom: true
                            }));
                            
                            
                            THEME.promptTemplates[category].templates = [
                                ...filteredDefaults,
                                ...customTemplates
                            ];
                        }
                    } else {
                        
                        THEME.promptTemplates[category] = {
                            ...categoryData,
                            templates: Array.isArray(categoryData.templates) 
                                ? categoryData.templates.map(template => ({
                                    ...template,
                                    isCustom: true
                                }))
                                : []
                        };
                    }
                });
                
                console.log('Custom templates loaded successfully');
            }
        } catch (error) {
            console.error('Error loading saved templates:', error);
        }
    },
    
    loadSavedPresets() {
        try {
            const savedPresets = localStorage.getItem('multitext_category_presets');
            if (savedPresets) {
                const parsedPresets = JSON.parse(savedPresets);
                
                Object.entries(parsedPresets).forEach(([category, categoryData]) => {
                    if (THEME.promptPresets[category] && Array.isArray(categoryData.presets)) {
                        
                        const defaultCategoryPresets = THEME.promptPresets[category].presets || [];
                        const defaultPresetLabels = defaultCategoryPresets.map(p => p.label);

                        
                        const customPresets = categoryData.presets.filter(
                            saved => !defaultPresetLabels.includes(saved.label)
                        ).map(p => ({ ...p, isCustom: true }));

                        
                        THEME.promptPresets[category].presets = [
                            ...defaultCategoryPresets,
                            ...customPresets
                        ];
                    }
                });
                console.log('Custom presets loaded successfully');
            }
        } catch (error) {
            console.error('Error loading saved presets:', error);
        }
    },
    
    _createPromptWidgets(index) {
        const textWidget = ComfyWidgets["STRING"](this, `text${index}`, ["STRING", { 
            multiline: true,
            visible: false
        }], app);
        const weightWidget = ComfyWidgets["FLOAT"](this, `weight${index}`, ["FLOAT", {
            default: 1.0,
            min: 0.0,
            max: 2.0,
            step: 0.1,
            visible: false
        }], app);
        const labelWidget = ComfyWidgets["STRING"](
            this,
            `label${index}`,
            ["STRING", { multiline: false, visible: false }],
            app
        );
        const enabledWidget = ComfyWidgets["BOOLEAN"](
            this,
            `enabled${index}`, 
            ["BOOLEAN", { default: true, visible: false }],
            app
        );

        [textWidget, weightWidget, labelWidget, enabledWidget].forEach(widgetData => {
            if (widgetData?.widget) {
                widgetData.widget.computeSize = () => [0, -4];
                widgetData.widget.hidden = true;
            }
        });

        
        
    },
    setupWidgets() {
        for (let i = 1; i <= 20; i++) {
            this._createPromptWidgets(i);
        }
        const separator = ComfyWidgets["STRING"](this, "separator", ["STRING", { 
            default: " ",
            visible: false,
            forceInput: true
        }], app);
        const active = ComfyWidgets["BOOLEAN"](this, "active", ["BOOLEAN", { 
            default: true,
            visible: false 
        }], app);
        if (separator?.widget) {
            separator.widget.computeSize = () => [0, -4];
            separator.widget.hidden = true;
            this.separator = separator;
        }
        if (active?.widget) {
            active.widget.computeSize = () => [0, -4];
            active.widget.hidden = true;
        }
        this.serialize_widgets = true;
    },
    applyPromptMode() {
        if (this.isSinglePromptMode) {
            for (let i = 1; i < this.activePrompts; i++) {
                const enabledWidget = this.widgets.find(w => w.name === `enabled${i+1}`);
                if (enabledWidget) enabledWidget.value = false;
            }
        }
        this.setDirtyCanvas(true);
    },    
    onMouseDown(event, pos, ctx) {
        if (event.button === 0) {
            const controls = this.isInsideControlButtons(pos[0], pos[1]);
            if (controls.add) {
                this.addPrompt();
                return true;
            } else if (controls.remove) {
                this.removePrompt();
                return true;
            } else if (controls.toggle) { 
                this.isSinglePromptMode = !this.isSinglePromptMode;
                localStorage.setItem('multitext_single_prompt', this.isSinglePromptMode); 
                this.applyPromptMode(); 
                this.setDirtyCanvas(true);
                return true;
            } else if (controls.separator) {
                const separatorMenu = document.createElement('div');
                separatorMenu.classList.add('multitext-separator-menu');
                const title = document.createElement('div');
                title.textContent = 'Select Separator';
                title.classList.add('multitext-separator-title');
                separatorMenu.appendChild(title);
                const menuItems = [
                    { label: 'Space', value: ' ', icon: '⎵' },
                    { label: 'Comma', value: ',', icon: ',' }, 
                    { label: 'Comma + Space', value: ', ', icon: ', ' },
                    { label: 'New Line', value: '\\n', icon: '↵' },
                    { label: 'Custom...', value: 'custom', icon: '✏️' }
                ];
                menuItems.forEach(item => {
                    const menuItem = document.createElement('div');
                    menuItem.classList.add('multitext-separator-item');
                    const icon = document.createElement('span');
                    icon.textContent = item.icon;
                    icon.classList.add('multitext-separator-icon');
                    const label = document.createElement('span');
                    label.textContent = item.label;
                    label.classList.add('multitext-separator-label');
                    menuItem.appendChild(icon);
                    menuItem.appendChild(label);
                    if (this.separator?.widget?.value === item.value) {
                        menuItem.classList.add('selected');
                    }
                    menuItem.onclick = () => {
                        if (item.value === 'custom') {
                            const customInput = document.createElement('input');
                            customInput.type = 'text';
                            customInput.classList.add('multitext-separator-custom-input');
                            customInput.placeholder = 'Enter custom separator...';
                            customInput.maxLength = 10;
                            while (separatorMenu.firstChild) {
                                separatorMenu.firstChild.remove();
                            }
                            const title = document.createElement('div');
                            title.textContent = 'Custom Separator';
                            title.classList.add('multitext-separator-title');
                            separatorMenu.appendChild(title);
                            separatorMenu.appendChild(customInput);
                            const confirmButton = document.createElement('div');
                            confirmButton.textContent = 'OK';
                            confirmButton.classList.add('multitext-separator-confirm-button');
                            separatorMenu.appendChild(confirmButton);
                            customInput.focus();
                            const applyCustomSeparator = () => {
                                const customValue = customInput.value;
                                if (customValue && this.separator?.widget) {
                                    this.separator.widget.value = customValue;
                                    if (this.separator.widget.callback) {
                                        this.separator.widget.callback(customValue);
                                    }
                                    this.setDirtyCanvas(true);
                                    if (app.graph) {
                                        app.graph.change();
                                        app.graph.setDirtyCanvas(true);
                                    }
                                }
                                separatorMenu.remove();
                            };
                            confirmButton.onclick = applyCustomSeparator;
                            customInput.onkeydown = (e) => {
                                if (e.key === 'Enter') {
                                    applyCustomSeparator();
                                } else if (e.key === 'Escape') {
                                    separatorMenu.remove();
                                }
                            };
                        } else {
                            if (this.separator?.widget) {
                                this.separator.widget.value = item.value === '\\n' ? '\n' : item.value;
                                if (this.separator.widget.callback) {
                                    this.separator.widget.callback(this.separator.widget.value);
                                }
                                this.setDirtyCanvas(true);
                                if (app.graph) {
                                    app.graph.change();
                                    app.graph.setDirtyCanvas(true);
                                }
                            }
                            separatorMenu.remove();
                        }
                    };
                    separatorMenu.appendChild(menuItem);
                });
                const rect = ctx.canvas.getBoundingClientRect();
                separatorMenu.style.left = `${rect.left + pos[0]}px`;
                separatorMenu.style.top = `${rect.top + pos[1]}px`;
                const closeMenu = (e) => {
                    if (!separatorMenu.contains(e.target)) {
                        separatorMenu.remove();
                        document.removeEventListener('mousedown', closeMenu);
                    }
                };
                document.addEventListener('mousedown', closeMenu);
                document.body.appendChild(separatorMenu);
                const menuRect = separatorMenu.getBoundingClientRect();
                if (menuRect.right > window.innerWidth) {
                    separatorMenu.style.left = `${window.innerWidth - menuRect.width - 10}px`;
                }
                if (menuRect.bottom > window.innerHeight) {
                    separatorMenu.style.top = `${window.innerHeight - menuRect.height - 10}px`;
                }
                return true;
            }
                  const index = this.getHoveredWidgetIndex(pos);
                  if (index !== -1 && index < this.activePrompts) {
                    if (this.isInsideToggle(pos, index)) {
                        this.togglePromptRow(index);
                        return true;
                    }            
                    this.showEditDialog(index + 1);
                }
            }
            return false;              
          },
          isInsideToggle(pos, rowIndex) {
            const margin = THEME.layout.promptRow.padding;
            const rowHeight = THEME.layout.promptRow.height;
            const rowMargin = THEME.layout.promptRow.margin;
            const y = margin + rowIndex * (rowHeight + rowMargin);
            const toggleWidth = 30;
            const toggleHeight = 14;
            const togglePadding = 6;  
            const x1 = margin + togglePadding;
            const y1 = y + rowHeight / 2 - toggleHeight / 2;
            return (
                pos[0] >= x1 &&
                pos[0] <= x1 + toggleWidth &&
                pos[1] >= y1 &&
                pos[1] <= y1 + toggleHeight
            );
        },
        togglePromptRow(index) {
            const enabledWidget = this.widgets.find(w => w.name === `enabled${index+1}`);
            if (this.isSinglePromptMode) {
                for (let i = 0; i < this.activePrompts; i++) {
                    const widget = this.widgets.find(w => w.name === `enabled${i+1}`);
                    if (widget) widget.value = (i === index); 
                }
            } else {
                if (enabledWidget) {
                    enabledWidget.value = !enabledWidget.value;
                }
            }
            this.setDirtyCanvas(true);
        },        
    showEditDialog(index) {
        try {
            const textWidget = this.widgets.find(w => w.name === `text${index}`);
            const weightWidget = this.widgets.find(w => w.name === `weight${index}`);
            const labelWidget  = this.widgets.find(w => w.name === `label${index}`);
            if (!textWidget || !weightWidget || !labelWidget) return;

            
            const dialog = DialogUtils.createDialog(THEME, {});
            dialog.dataset.promptIndex = index.toString();
            
            const content = document.createDocumentFragment();

            
            const saveTemplateButton = DialogUtils.createButton(THEME, {
                innerHTML: '✚',
                title: 'Save as Template',
                className: 'multitext-dialog-button-savetpl',
                onclick: (event) => {
                    this.showSaveChoiceDialog(event, dialog.textarea.value, parseFloat(dialog.weightInput.value), dialog);
                }
            });

            const saveButton = DialogUtils.createButton(THEME, {
                innerHTML: '✔️',
                className: 'multitext-dialog-button-save',
                onclick: () => {
                    labelWidget.value = labelInput.value;
                    textWidget.value = textarea.value;
                    weightWidget.value = parseFloat(weightInput.value);
                    this.saveToHistory(textarea.value);
                    this.updateHistoryDropdown(historyDropdown);
                    removeDragListeners(); 
                    dialog.closest('.multitext-dialog')?.remove(); 
                    this.setDirtyCanvas(true);
                }
            });

            const closeBtn = DialogUtils.createButton(THEME, {
                innerHTML: '×',
                className: 'multitext-dialog-button-close',
                onclick: () => dialog.remove()
            });

            
            const header = DialogUtils.createHeader(THEME, `Edit Prompt ${index}`, [saveTemplateButton, saveButton, closeBtn]);

            let isDragging = false;
            let xOffset = 0;
            let yOffset = 0;
            const removeDragListeners = () => {
                document.removeEventListener('mousemove', drag);
                document.removeEventListener('mouseup', dragEnd);
            };
            function dragStart(e) {
                if (e.target === header || e.target.classList.contains('multitext-dialog-title')) { 
                    const popupElement = dialog.closest('.multitext-dialog'); 
                    if (!popupElement) return; 
                    isDragging = true;
                    popupElement.style.transition = 'none'; 
                    header.style.cursor = 'grabbing';
                    const rect = popupElement.getBoundingClientRect();
                    xOffset = e.clientX - rect.left;
                    yOffset = e.clientY - rect.top;
                    e.preventDefault(); 
                }
            }
            function drag(e) {
                if (isDragging) {
                    const popupElement = dialog.closest('.multitext-dialog');
                    if (!popupElement) return;
                    e.preventDefault();
                    const x = e.clientX - xOffset;
                    const y = e.clientY - yOffset;
                    popupElement.style.left = `${x}px`;
                    popupElement.style.top = `${y}px`;
                    popupElement.style.transform = 'none';
                }
            }
            function dragEnd(e) {
                if (isDragging) {
                    const popupElement = dialog.closest('.multitext-dialog');
                    isDragging = false;
                    header.style.cursor = 'move';
                    if (popupElement) {
                    }
                }
            }
            header.addEventListener('mousedown', dragStart);
            document.addEventListener('mousemove', drag); 
            document.addEventListener('mouseup', dragEnd);
            const cleanupDragMain = this._makeDialogDraggable(dialog, header); 

            content.appendChild(header);
            const contentWrapper = document.createElement('div');
            contentWrapper.classList.add('multitext-dialog-content');
            content.appendChild(contentWrapper);

            
            const labelInput = DialogUtils.createInput(THEME, {
                value: labelWidget.value || '',
                placeholder: 'Optional name...',
            });
            dialog.labelInput = labelInput; 
            labelInput.style.marginBottom = '12px';
            contentWrapper.appendChild(labelInput);

            
            const textarea = DialogUtils.createTextarea(THEME, {
                value: textWidget.value || '',
                placeholder: 'Enter prompt text here...',
            });
            dialog.textarea = textarea;
            contentWrapper.appendChild(textarea);

            
            const toolbar = document.createElement('div');
            toolbar.classList.add('multitext-dialog-toolbar');
            const historyDropdown = document.createElement('div');
            historyDropdown.className = 'history-dropdown'; 
            historyDropdown.classList.add('multitext-dialog-history-dropdown'); 
            historyDropdown.style.display = 'none';
            THEME.promptTools.quickActions.forEach(action => {
                
                const btn = DialogUtils.createButton(THEME, {
                    innerHTML: action.icon,
                    title: action.title,
                    className: 'multitext-dialog-toolbar-button',
                    onclick: () => {
                        if (action.action === 'history') {
                            const newDisplay = historyDropdown.style.display === 'none' ? 'block' : 'none';
                            historyDropdown.style.display = newDisplay;
                            if (newDisplay === 'block') {
                                this.updateHistoryDropdown(historyDropdown);
                            }
                        } else {
                            this.handleQuickAction(action.action, textarea);
                        }
                    }
                });
                toolbar.appendChild(btn);
            });
            toolbar.appendChild(historyDropdown);
            
            const weightGroup = document.createElement('div');
            weightGroup.classList.add('multitext-dialog-weight-group');
            const weightContainer = document.createElement('div');
            weightContainer.classList.add('multitext-dialog-weight-container');
            const weightLabel = document.createElement('label');
            weightLabel.textContent = 'Weight:';
            weightLabel.classList.add('multitext-dialog-weight-label');
            const weightInput = document.createElement('input');
            weightInput.type = 'number';
            weightInput.value = weightWidget.value;
            weightInput.step = '0.1';
            weightInput.min = '0';
            weightInput.max = '2';
            weightInput.classList.add('multitext-dialog-weight-input');
            dialog.weightInput = weightInput;
            weightContainer.appendChild(weightLabel);
            weightContainer.appendChild(weightInput);
            weightGroup.appendChild(weightContainer);
            weightGroup.appendChild(toolbar); 
            contentWrapper.appendChild(weightGroup);

            
            const presetContainer = document.createElement('div');
            presetContainer.classList.add('multitext-dialog-preset-container');
            presetContainer.style.display = 'flex';
            presetContainer.style.flexDirection = 'column';
            presetContainer.style.gap = '8px';
            presetContainer.style.background = '#1b1b1b';
            presetContainer.style.borderRadius = '8px';
            presetContainer.style.padding = '8px';
            presetContainer.style.margin = '4px 0';
            const categoryContainer = document.createElement('div');
            categoryContainer.style.display = 'flex';
            categoryContainer.style.flexWrap = 'wrap';
            categoryContainer.style.gap = '4px';
            categoryContainer.style.alignItems = 'center';
            const presetsContainer = document.createElement('div');
            presetsContainer.style.display = 'none';
            presetsContainer.style.flexWrap = 'wrap';
            presetsContainer.style.gap = '4px';
            presetsContainer.style.marginTop = '6px';
            presetsContainer.style.paddingTop = '6px';
            presetsContainer.style.borderTop = '1px solid #2a2a2a';
            let activeCategory = null;
            Object.entries(THEME.promptPresets).forEach(([category, categoryData]) => {
                if (!categoryData || !categoryData.presets) return;
                const categoryTag = document.createElement('button');
                categoryTag.classList.add('multitext-dialog-category-tag');
                categoryTag.style.background = '#232323';
                categoryTag.style.border = '1px solid #2c2c2c';
                categoryTag.style.borderRadius = '4px';
                categoryTag.style.color = '#999';
                categoryTag.style.padding = '4px 8px';
                categoryTag.style.cursor = 'pointer';
                categoryTag.style.fontSize = '12px';
                categoryTag.style.transition = 'all 0.15s ease';
                categoryTag.style.display = 'flex';
                categoryTag.style.alignItems = 'center';
                categoryTag.style.gap = '4px';
                categoryTag.style.minWidth = 'fit-content';
                categoryTag.style.whiteSpace = 'nowrap';
                categoryTag.title = category.charAt(0).toUpperCase() + category.slice(1);
                const icon = categoryData.icon || '';
                categoryTag.innerHTML = `<span style="opacity: 0.9">${icon}</span>`;
                categoryTag.onmouseover = () => {
                    categoryTag.style.background = '#2a2a2a';
                    categoryTag.style.borderColor = '#363636';
                    categoryTag.style.color = '#ccc';
                };
                categoryTag.onmouseout = () => {
                    if (category !== activeCategory) {
                        categoryTag.style.background = '#232323';
                        categoryTag.style.borderColor = '#2c2c2c';
                        categoryTag.style.color = '#999';
                    }
                };
                categoryTag.onclick = () => {
                    if (activeCategory === category) {
                        presetsContainer.style.display = 'none';
                        categoryTag.style.background = '#232323';
                        categoryTag.style.borderColor = '#2c2c2c';
                        categoryTag.style.color = '#999';
                        activeCategory = null;
                    } else {
                        presetsContainer.innerHTML = '';
                        presetsContainer.style.display = 'flex';
                        categoryContainer.querySelectorAll('button').forEach(btn => {
                            btn.style.background = '#232323';
                            btn.style.borderColor = '#2c2c2c';
                            btn.style.color = '#999';
                        });
                        categoryTag.style.background = '#2a2a2a';
                        categoryTag.style.borderColor = '#363636';
                        categoryTag.style.color = '#ccc';
                        activeCategory = category;
                        categoryData.presets.forEach(preset => {
                            const presetBtn = document.createElement('button');
                            presetBtn.classList.add('multitext-dialog-preset-tag');
                            presetBtn.style.background = '#1e1e1e';
                            presetBtn.style.border = '1px solid #2c2c2c';
                            presetBtn.style.borderRadius = '4px';
                            presetBtn.style.color = '#999';
                            presetBtn.style.padding = '3px 8px';
                            presetBtn.style.cursor = 'pointer';
                            presetBtn.style.fontSize = '12px';
                            presetBtn.style.transition = 'all 0.15s ease';
                            presetBtn.style.display = 'flex';
                            presetBtn.style.alignItems = 'center';
                            presetBtn.style.gap = '4px';
                            presetBtn.innerHTML = preset.label;
                            presetBtn.oncontextmenu = (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const menu = document.createElement('div');
                                menu.style.position = 'fixed';
                                menu.style.left = e.clientX + 'px';
                                menu.style.top = e.clientY + 'px';
                                menu.style.background = '#1b1b1b';
                                menu.style.border = '1px solid #2c2c2c';
                                menu.style.borderRadius = '4px';
                                menu.style.padding = '4px';
                                menu.style.zIndex = '10000';
                                const editBtn = document.createElement('button');
                                editBtn.style.display = 'block';
                                editBtn.style.width = '100%';
                                editBtn.style.padding = '4px 8px';
                                editBtn.style.background = 'none';
                                editBtn.style.border = 'none';
                                editBtn.style.color = '#999';
                                editBtn.style.cursor = 'pointer';
                                editBtn.style.textAlign = 'left';
                                editBtn.innerHTML = '✏️ Edit';
                                editBtn.onmouseover = () => editBtn.style.background = '#252525';
                                editBtn.onmouseout = () => editBtn.style.background = 'none';
                                editBtn.onclick = () => {
                                    this._showEditPresetDialog(preset);
                                    menu.remove();
                                };
                                menu.appendChild(editBtn);
                                const deleteBtn = document.createElement('button');
                                deleteBtn.style.display = 'block'; 
                                deleteBtn.style.width = '100%';
                                deleteBtn.style.padding = '4px 8px';
                                deleteBtn.style.background = 'none';
                                deleteBtn.style.border = 'none';
                                deleteBtn.style.color = '#999';
                                deleteBtn.style.cursor = 'pointer';
                                deleteBtn.style.textAlign = 'left';
                                deleteBtn.innerHTML = '🗑️ Delete';
                                deleteBtn.onmouseover = () => deleteBtn.style.background = '#252525';
                                deleteBtn.onmouseout = () => deleteBtn.style.background = 'none';
                                deleteBtn.onclick = () => {
                                    this._showDeletePresetDialog(preset);
                                    menu.remove();
                                };
                                menu.appendChild(deleteBtn);
                                document.body.appendChild(menu);
                                const closeMenu = (e) => {
                                    if (!menu.contains(e.target)) {
                                        menu.remove();
                                        document.removeEventListener('click', closeMenu);
                                    }
                                };
                                document.addEventListener('click', closeMenu);
                            };
                            presetBtn.onmouseover = () => {
                                presetBtn.style.background = '#252525';
                                presetBtn.style.borderColor = '#363636';
                                presetBtn.style.color = '#ccc';
                            };
                            presetBtn.onmouseout = () => {
                                presetBtn.style.background = '#1e1e1e';
                                presetBtn.style.borderColor = '#2c2c2c';
                                presetBtn.style.color = '#999';
                            };
                            presetBtn.onclick = (e) => {
                                e.stopPropagation();
                                if (!preset.value) return; 
                                
                                const textarea = dialog.textarea;
                                if (textarea) {
                                    const currentText = textarea.value;
                                    const newText = preset.value;
                                    textarea.value = currentText ? `${currentText}, ${newText}` : newText;
                                    textarea.dispatchEvent(new Event('input')); 
                                    
                                    
                                    const textWidget = this.widgets.find(w => w.name === `text${dialog.dataset.promptIndex}`);
                                    if (textWidget) {
                                        textWidget.value = textarea.value;
                                    }
                                    

                                    
                                    presetBtn.style.background = '#2d2d2d';
                                    setTimeout(() => {
                                        presetBtn.style.background = '#1e1e1e';
                                    }, 150);
                                }
                            };
                            presetsContainer.appendChild(presetBtn);
                        });
                    }
                };
                categoryContainer.appendChild(categoryTag);
            });
            const editButton = document.createElement('button');
            editButton.classList.add('multitext-dialog-category-tag');
            editButton.style.background = '#232323';
            editButton.style.border = '1px solid #2c2c2c';
            editButton.style.borderRadius = '4px';
            editButton.style.color = '#999';
            editButton.style.padding = '4px 8px';
            editButton.style.cursor = 'pointer';
            editButton.style.fontSize = '12px';
            editButton.style.transition = 'all 0.15s ease';
            editButton.style.display = 'flex';
            editButton.style.alignItems = 'center';
            editButton.style.marginLeft = 'auto';
            editButton.title = 'Manage Presets';
            editButton.innerHTML = '⚙️';
            editButton.onmouseover = () => {
                editButton.style.background = '#2a2a2a';
                editButton.style.borderColor = '#363636';
                editButton.style.color = '#ccc';
            };
            editButton.onmouseout = () => {
                editButton.style.background = '#232323';
                editButton.style.borderColor = '#2c2c2c';
                editButton.style.color = '#999';
            };
            editButton.onclick = () => {
                const managementDialog = DialogUtils.createDialog(THEME, {
                    width: '320px',
                    maxHeight: '60vh',
                    
                    className: 'multitext-manage-presets-dialog' 
                });

                const closeManageDialog = () => {
                    managementDialog.remove();
                    document.removeEventListener('mousedown', closeDialogOnClickOutside);
                };
                const closeDialogButton = DialogUtils.createButton(THEME, {
                    innerHTML: '✕',
                    className: 'multitext-dialog-button-close', 
                    onclick: closeManageDialog
                });
                const header = DialogUtils.createHeader(THEME, 'Manage Presets', [closeDialogButton]);
                managementDialog.appendChild(header);

                const contentContainer = document.createElement('div');
                contentContainer.style.overflowY = 'auto';
                contentContainer.style.overflowX = 'hidden';
                contentContainer.style.paddingRight = '8px';
                contentContainer.style.marginRight = '-8px';
                contentContainer.style.display = 'flex';
                contentContainer.style.flexDirection = 'column';
                contentContainer.style.gap = '8px';
                
                contentContainer.classList.add('multitext-dialog-content'); 

                Object.entries(THEME.promptPresets).forEach(([category, categoryData]) => {
                    if (!categoryData || !categoryData.presets) return;
                    const categorySection = document.createElement('div');
                    categorySection.style.display = 'flex';
                    categorySection.style.flexDirection = 'column';
                    categorySection.style.gap = '4px';
                    categorySection.classList.add('multitext-manage-presets-category-section');

                    const categoryHeader = document.createElement('div');
                    categoryHeader.style.display = 'flex';
                    categoryHeader.style.alignItems = 'center';
                    categoryHeader.style.gap = '6px';
                    categoryHeader.classList.add('multitext-manage-presets-category-header');

                    const categoryTitle = document.createElement('h4');
                    categoryTitle.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                    categoryTitle.style.margin = '0';
                    categoryTitle.style.fontSize = '13px';
                    categoryTitle.style.fontWeight = 'normal';
                    categoryTitle.style.color = '#ccc';
                    categoryTitle.style.flex = '1';
                    categoryTitle.classList.add('multitext-manage-presets-category-title');

                    const addPresetBtn = DialogUtils.createButton(THEME, {
                        innerHTML: '+',
                        title: 'Add new preset',
                        
                        className: 'multitext-manage-presets-add-button',
                        onclick: (e) => {
                            e.stopPropagation();
                            this.showSavePresetDialog('', 1.0, managementDialog); 
                        }
                    });
                    
                    addPresetBtn.style.padding = '2px 6px'; 
                    addPresetBtn.style.fontSize = '12px';
                    addPresetBtn.style.minWidth = '20px';
                    

                    const presetsList = document.createElement('div');
                    presetsList.style.display = 'flex';
                    presetsList.style.flexDirection = 'column';
                    presetsList.style.gap = '2px';
                    presetsList.classList.add('multitext-manage-presets-list');

                    categoryData.presets.forEach(preset => {
                        const presetItem = document.createElement('div');
                        presetItem.style.display = 'flex';
                        presetItem.style.alignItems = 'center';
                        presetItem.style.gap = '6px';
                        presetItem.style.padding = '4px 6px';
                        presetItem.style.background = '#1e1e1e';
                        presetItem.style.borderRadius = '4px';
                        presetItem.style.border = '1px solid #2c2c2c';
                        presetItem.style.fontSize = '12px';
                        presetItem.classList.add('multitext-manage-presets-item');

                        const presetLabel = document.createElement('span');
                        presetLabel.textContent = preset.label;
                        presetLabel.style.flex = '1';
                        presetLabel.style.overflow = 'hidden';
                        presetLabel.style.textOverflow = 'ellipsis';
                        presetLabel.style.whiteSpace = 'nowrap';
                        presetLabel.style.color = '#999';
                        presetLabel.classList.add('multitext-manage-presets-item-label');

                        const buttonsContainer = document.createElement('div');
                        buttonsContainer.style.display = 'flex';
                        buttonsContainer.style.gap = '2px';
                        buttonsContainer.style.alignItems = 'center';
                        buttonsContainer.classList.add('multitext-manage-presets-item-buttons');

                        const editPresetBtn = DialogUtils.createButton(THEME, {
                            innerHTML: '✏️',
                            title: 'Edit preset',
                            className: 'multitext-manage-presets-action-button', 
                            onclick: (e) => {
                                e.stopPropagation();
                                
                                const showEditPresetDialog = (preset, presetLabelElement, categorySectionElement, categoryDataObject, presetsListElement) => {
                                     const editDialog = DialogUtils.createDialog(THEME, {
                                        className: 'multitext-save-preset-dialog',
                                        
                                    });
                                    editDialog.style.zIndex = '10002'; 

                                    
                                    let isDraggingEdit = false;
                                    let xOffsetEdit = 0;
                                    let yOffsetEdit = 0;

                                    const removeDragListenersEdit = () => {
                                        document.removeEventListener('mousemove', dragEdit);
                                        document.removeEventListener('mouseup', dragEndEdit);
                                    };

                                    function dragStartEdit(e) {
                                        
                                        if (e.target === editHeader || editHeader.contains(e.target)) { 
                                            const popupElement = editDialog; 
                                            if (!popupElement) return; 
                                            isDraggingEdit = true;
                                            popupElement.style.transition = 'none'; 
                                            editHeader.style.cursor = 'grabbing';
                                            const rect = popupElement.getBoundingClientRect();
                                            xOffsetEdit = e.clientX - rect.left;
                                            yOffsetEdit = e.clientY - rect.top;
                                            e.preventDefault(); 
                                            
                                            document.addEventListener('mousemove', dragEdit); 
                                            document.addEventListener('mouseup', dragEndEdit);
                                        }
                                    }

                                    function dragEdit(e) {
                                        if (isDraggingEdit) {
                                            const popupElement = editDialog;
                                            if (!popupElement) return;
                                            e.preventDefault();
                                            const x = e.clientX - xOffsetEdit;
                                            const y = e.clientY - yOffsetEdit;
                                            popupElement.style.left = `${x}px`;
                                            popupElement.style.top = `${y}px`;
                                            popupElement.style.transform = 'none'; 
                                        }
                                    }

                                    function dragEndEdit(e) {
                                        if (isDraggingEdit) {
                                            isDraggingEdit = false;
                                            editHeader.style.cursor = 'move';
                                            removeDragListenersEdit(); 
                                        }
                                    }
                                    

                                    const editHeader = DialogUtils.createHeader(THEME, 'Edit Preset', [
                                        DialogUtils.createButton(THEME, {
                                            innerHTML: '✕',
                                            className: 'multitext-dialog-button-close',
                                            onclick: () => editDialog.remove()
                                        })
                                    ]);
                                    editDialog.appendChild(editHeader); 
                                    editHeader.addEventListener('mousedown', dragStartEdit); 
                                    const cleanupDragEdit = this._makeDialogDraggable(editDialog, editHeader); 

                                    const nameInput = DialogUtils.createInput(THEME, {
                                        value: preset.label,
                                        placeholder: 'Preset name',
                                        className: 'multitext-save-preset-input' 
                                    });
                                    editDialog.appendChild(nameInput);
                                     const valueInput = DialogUtils.createTextarea(THEME, {
                                        value: preset.value,
                                        placeholder: 'Preset value',
                                        className: 'multitext-dialog-textarea' 
                                    });
                                    editDialog.appendChild(valueInput);
                                     const buttons = document.createElement('div');
                                    buttons.classList.add('multitext-save-preset-buttons');
                                    const cancelBtn = DialogUtils.createButton(THEME, {
                                        innerHTML: 'Cancel',
                                        className: 'multitext-save-preset-button multitext-save-preset-button-cancel',
                                        onclick: (e) => {
                                            e.stopPropagation();
                                            editDialog.remove();
                                        }
                                    });
                                    const saveBtn = DialogUtils.createButton(THEME, {
                                        innerHTML: 'Save',
                                        className: 'multitext-save-preset-button multitext-save-preset-button-save',
                                        onclick: (e) => {
                                            e.stopPropagation();
                                            const newName = nameInput.value.trim();
                                            const newValue = valueInput.value.trim();
                                            if (newName && newValue) {
                                                preset.label = newName;
                                                preset.value = newValue;
                                                presetLabelElement.textContent = newName;
                                                this.saveToHistory(newValue); 
                                                localStorage.setItem('multitext_category_presets', JSON.stringify(THEME.promptPresets));
                                                editDialog.remove();
                                            }
                                        }
                                    });
                                    buttons.appendChild(cancelBtn);
                                    buttons.appendChild(saveBtn);
                                    editDialog.appendChild(buttons);
                                     editDialog.addEventListener('mousedown', (e) => {
                                        e.stopPropagation(); 
                                    });
                                     document.body.appendChild(editDialog);
                                    nameInput.focus();
                                    nameInput.select();

                                    
                                    requestAnimationFrame(() => { 
                                        const container = document.querySelector('.graph-canvas-container') || document.body;
                                        const containerRect = container.getBoundingClientRect();
                                        const dialogRect = editDialog.getBoundingClientRect();
                                        let desiredLeft = (containerRect.width - dialogRect.width) / 2 + containerRect.left;
                                        let desiredTop = (containerRect.height - dialogRect.height) / 2 + containerRect.top;
                                        
                                        const clampedLeft = Math.max(
                                            containerRect.left + 10, 
                                            Math.min(containerRect.right - dialogRect.width - 10, desiredLeft)
                                        );
                                        const clampedTop = Math.max(
                                            containerRect.top + 10, 
                                            Math.min(containerRect.bottom - dialogRect.height - 10, desiredTop)
                                        );
                                        editDialog.style.left = clampedLeft + 'px';
                                        editDialog.style.top = clampedTop + 'px';
                                        editDialog.style.transform = 'none'; 
                                    });
                                    
                                };
                                showEditPresetDialog(preset, presetLabel, categorySection, categoryData, presetsList);
                            }
                        });
                        
                        editPresetBtn.style.background = 'none';
                        editPresetBtn.style.border = 'none';
                        editPresetBtn.style.padding = '2px';
                        editPresetBtn.style.opacity = '0.7';
                        editPresetBtn.style.fontSize = '11px';
                         

                        const deletePresetBtn = DialogUtils.createButton(THEME, {
                            innerHTML: '🗑️',
                            title: 'Delete preset',
                            className: 'multitext-manage-presets-action-button delete', 
                            onclick: (e) => {
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to delete the preset \"${preset.label}\"?`)) {
                                    const presetIndex = categoryData.presets.indexOf(preset);
                                    if (presetIndex > -1) {
                                        categoryData.presets.splice(presetIndex, 1);
                                        localStorage.setItem('multitext_category_presets', JSON.stringify(THEME.promptPresets));
                                        presetItem.remove();
                                        if (categoryData.presets.length === 0) {
                                            categorySection.remove();
                                        }
                                    }
                                }
                                this._showDeletePresetDialog(preset);
                                const presetItemElement = deleteBtn.closest('.multitext-manage-presets-item');
                                if (presetItemElement) presetItemElement.remove();
                                if (categoryData.presets.length === 0) {
                                    const categorySectionElement = deleteBtn.closest('.multitext-manage-presets-category-section');
                                     if (categorySectionElement) categorySectionElement.remove();
                                }
                            }
                        });
                        
                        deletePresetBtn.style.background = 'none';
                        deletePresetBtn.style.border = 'none';
                        deletePresetBtn.style.padding = '2px';
                        deletePresetBtn.style.opacity = '0.7';
                        deletePresetBtn.style.fontSize = '11px';
                        

                        [editPresetBtn, deletePresetBtn].forEach(btn => {
                            btn.onmouseover = () => btn.style.opacity = '1';
                            btn.onmouseout = () => btn.style.opacity = '0.7';
                        }); 

                        buttonsContainer.appendChild(editPresetBtn);
                        buttonsContainer.appendChild(deletePresetBtn);
                        presetItem.appendChild(presetLabel);
                        presetItem.appendChild(buttonsContainer);
                        presetsList.appendChild(presetItem);
                    });
                    categoryHeader.appendChild(categoryTitle);
                    categoryHeader.appendChild(addPresetBtn);
                    categorySection.appendChild(categoryHeader);
                    categorySection.appendChild(presetsList);
                    contentContainer.appendChild(categorySection);
                });
                managementDialog.appendChild(contentContainer);
                document.body.appendChild(managementDialog);

                
                requestAnimationFrame(() => { 
                    const container = document.querySelector('.graph-canvas-container') || document.body;
                    const containerRect = container.getBoundingClientRect();
                    const dialogRect = managementDialog.getBoundingClientRect();
                    let desiredLeft = (containerRect.width - dialogRect.width) / 2 + containerRect.left;
                    let desiredTop = (containerRect.height - dialogRect.height) / 2 + containerRect.top;
                    
                    const clampedLeft = Math.max(
                        containerRect.left,
                        Math.min(containerRect.right - dialogRect.width, desiredLeft)
                    );
                    const clampedTop = Math.max(
                        containerRect.top,
                        Math.min(containerRect.bottom - dialogRect.height, desiredTop)
                    );
                    managementDialog.style.left = clampedLeft + 'px';
                    managementDialog.style.top = clampedTop + 'px';
                    managementDialog.style.transform = 'none'; 
                });

                const closeDialogOnClickOutside = (e) => {
                    if (!managementDialog.contains(e.target)) {
                       closeManageDialog();
                    }
                };
                document.addEventListener('mousedown', closeDialogOnClickOutside);
            };
            categoryContainer.appendChild(editButton);
            presetContainer.appendChild(categoryContainer);
            presetContainer.appendChild(presetsContainer);
            contentWrapper.appendChild(presetContainer);

            
            const templateSection = document.createElement('div');
            templateSection.classList.add('multitext-dialog-template-section');
            const templateHeader = document.createElement('div');
            templateHeader.classList.add('multitext-dialog-template-header');
            const templateTitle = document.createElement('div');
            templateTitle.innerHTML = '📝 Ready Templates';             templateTitle.classList.add('multitext-dialog-template-title'); 
            const toggleIcon = document.createElement('div');
            toggleIcon.textContent = '▼';
            toggleIcon.classList.add('multitext-dialog-template-toggle');
            templateHeader.appendChild(templateTitle);
            templateHeader.appendChild(toggleIcon);
            templateSection.appendChild(templateHeader);
            const templateGrid = document.createElement('div');
            templateGrid.classList.add('multitext-dialog-template-grid');
            let isTemplatesVisible = false;
            const toggleTemplates = () => {
                isTemplatesVisible = !isTemplatesVisible;
                toggleIcon.classList.toggle('rotated', isTemplatesVisible); 
                templateGrid.classList.toggle('visible', isTemplatesVisible); 
            };
            templateHeader.onclick = toggleTemplates;
            Object.entries(THEME.promptTemplates).forEach(([category, { icon, label, templates }]) => {
                if (!Array.isArray(templates)) {
                     console.warn(`Templates for category '${category}' is not an array. Skipping.`);
                     return; 
                 }
                templates.forEach(template => {
                    const templateBtn = document.createElement('button');
                    templateBtn.classList.add('multitext-dialog-template-button'); 
                    const templateBtnHeader = document.createElement('div');
                    templateBtnHeader.classList.add('multitext-dialog-template-button-header'); 
                    templateBtnHeader.innerHTML = `${icon || '📝'} ${template.name}`;
                    const templateInfo = document.createElement('div');
                    templateInfo.classList.add('multitext-dialog-template-button-info'); 
                    templateInfo.innerHTML = `
                        <span>${label || category}</span>
                        <span>${template.weight ? template.weight.toFixed(1) : '-'}</span>
                    `;
                    const editIcon = document.createElement('div');
                    editIcon.classList.add('multitext-template-edit-icon');
                    editIcon.innerHTML = '⋮';
                    editIcon.title = 'Edit template';
                    editIcon.onclick = (e) => {
                        e.stopPropagation(); 
                        
                        this.showSaveTemplateDialog(
                            template.prompt, 
                            template.weight, 
                            dialog,
                            template.name,
                            category
                        );
                    };
                    templateBtn.appendChild(editIcon);
                    templateBtn.appendChild(templateBtnHeader); 
                    templateBtn.appendChild(templateInfo);
                    templateBtn.onclick = () => {
                        textarea.value = template.prompt;
                        if (template.weight !== undefined) { 
                            weightInput.value = template.weight;
                        }
                        textarea.dispatchEvent(new Event('input'));

                        
                        const textWidget = this.widgets.find(w => w.name === `text${dialog.dataset.promptIndex}`);
                        const weightWidget = this.widgets.find(w => w.name === `weight${dialog.dataset.promptIndex}`);
                        if (textWidget) {
                            textWidget.value = textarea.value;
                        }
                        if (weightWidget && template.weight !== undefined) {
                            weightWidget.value = parseFloat(weightInput.value);
                        }
                        
                    };
                    templateGrid.appendChild(templateBtn);
                });
            });
            templateSection.appendChild(templateGrid);
            contentWrapper.appendChild(templateSection);
            dialog.appendChild(content); 
            document.body.appendChild(dialog);

            
            const container = document.querySelector('.graph-canvas-container');
            const containerRect = container ? container.getBoundingClientRect() : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
            const dialogRect = dialog.getBoundingClientRect();
            let desiredLeft = (window.innerWidth - dialogRect.width) / 2;
            let desiredTop  = (window.innerHeight - dialogRect.height) / 2;
            const clampedLeft = Math.max(
                containerRect.left,
                Math.min(containerRect.right - dialogRect.width, desiredLeft)
            );
            const clampedTop = Math.max(
                containerRect.top,
                Math.min(containerRect.bottom - dialogRect.height, desiredTop)
            );
            dialog.style.left = clampedLeft + 'px';
            dialog.style.top  = clampedTop + 'px';
            dialog.style.transform = 'none';
            textarea.focus();

            
            dialog.textarea = textarea;
            dialog.weightInput = weightInput;
        } catch (error) {
            console.error('Dialog creation error:', error);
        }
    },
    onDrawForeground(ctx) {
        if (!ctx || this.flags.collapsed) return;
        const prLayout = THEME.layout.promptRow; 
        const margin = prLayout.padding;
        const rowHeight = prLayout.height;
        const rowMargin = prLayout.margin;
        const rowWidth = this.size[0] - (margin * 2);
        let y = margin;
        for (let i = 0; i < this.activePrompts; i++) {
            const labelWidget  = this.widgets.find(w => w.name === `label${i+1}`);
            const textWidget = this.widgets.find(w => w.name === `text${i + 1}`);
            const weightWidget = this.widgets.find(w => w.name === `weight${i + 1}`);
                const enabledWidget = this.widgets.find(w => w.name === `enabled${i+1}`);
            if (labelWidget && textWidget && weightWidget) {
                if (i === this.currentHoverIndex) {
                    UXUtils.drawHoverEffect(
                        ctx,
                        margin,
                        y,
                        this.size[0] - (margin * 2),
                        rowHeight,
                        1
                    );
                }
                Renderer.drawPromptRow(
                    ctx, 
                    margin, 
                    y, 
                    labelWidget.value || textWidget.value || `Prompt ${i + 1}`,
                    weightWidget.value,
                    rowWidth,
                    rowHeight,
                    4
                );
                this.drawToggle(
                    ctx,
                    margin + 4,      
                    y + rowHeight/2, 
                    enabledWidget.value 
                );
                y += rowHeight + rowMargin;
            }
        }
        this.drawControlButtons(ctx);
        if (this.tooltipState.visible) {
            UXUtils.drawTooltip(
                ctx,
                this.tooltipState.text,
                this.tooltipState.x,
                this.tooltipState.y
            );
        }
    },
    drawToggle(ctx, x, centerY, isEnabled) {
        const size = 10;
        const toggleX = x;
        const toggleY = centerY - size/2;
        ctx.save();
        ctx.fillStyle = isEnabled ? THEME.colors.accent : THEME.colors.bg;
        ctx.strokeStyle = isEnabled ? THEME.colors.accent : THEME.colors.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(toggleX, toggleY, size, size, 2);
        ctx.fill();
        if (!isEnabled) ctx.stroke();
        if (isEnabled) {
            ctx.fillStyle = THEME.colors.text;
            ctx.beginPath();
            ctx.arc(
                toggleX + size/2,
                toggleY + size/2,
                size/4,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        ctx.restore();
    },    
    getHoveredWidgetIndex(pos) {
        const prLayout = THEME.layout.promptRow; 
        const margin = prLayout.padding;
        const rowHeight = prLayout.height;
        const rowMargin = prLayout.margin;
        const relativeY = pos[1] - margin;
        const rowIndex = Math.floor(relativeY / (rowHeight + rowMargin));
        if (rowIndex >= 0 && 
            rowIndex < this.activePrompts && 
            pos[0] >= margin && 
            pos[0] <= this.size[0] - margin && 
            relativeY >= 0 && 
            relativeY <= this.activePrompts * (rowHeight + rowMargin)) {
            return rowIndex;
        }
        return -1;
    },

    loadPromptHistory() {
        try {
            const history = localStorage.getItem('multitext_history');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Error loading history:', error);
            return [];
        }
    },
    saveToHistory(text) {
        if (!text?.trim()) return;
        try {
            const history = this.loadPromptHistory();
            const newItem = { text, timestamp: Date.now() };
            const existingIndex = history.findIndex(item => item.text === text);
            
            if (existingIndex !== -1) {
                
                history[existingIndex] = newItem;
                        } else {
                
                history.unshift(newItem);
            }
            
            
            const trimmedHistory = history.slice(0, 20);
            localStorage.setItem('multitext_history', JSON.stringify(trimmedHistory));
            
        } catch (error) {
            console.error('Error saving to history:', error);
        }
    },
    handleQuickAction(action, textarea) {
        switch (action) {
            case 'weight':
                const weightInput = document.querySelector('.multitext-dialog-weight-input');
                if (weightInput) {
                    weightInput.focus();
                    weightInput.select();
                }
                break;
            case 'clear':
                if (textarea.value) {
                    textarea.value = '';
                    textarea.dispatchEvent(new Event('input'));
                }
                break;
            case 'default':
                
                if (confirm("This will remove all custom presets and templates and restore defaults. Are you sure?")) {
                    localStorage.removeItem('multitext_category_presets');
                    localStorage.removeItem('multitext_templates');
                    alert("Custom presets and templates cleared. Please reload the UI or node for changes to take full effect.");
                    
                    const dialog = document.querySelector(`.multitext-dialog[data-prompt-index="${textarea.closest('.multitext-dialog')?.dataset.promptIndex}"]`);
                    dialog?.remove();
                }
                break;
        }
    },
    addPrompt() {
        if (this.activePrompts < this.maxPrompts) {
            this.activePrompts++;
            const newEnabledWidget = this.widgets.find(w => w.name === `enabled${this.activePrompts}`);
            if (newEnabledWidget) {
                newEnabledWidget.value = false;
            }
            localStorage.setItem('multitext_prompt_count', this.activePrompts.toString());
            this.updateNodeSize();
                    this.setDirtyCanvas(true);
                }
    },    
    removePrompt() {
        if (this.activePrompts > 1) {
            const index = this.activePrompts;
            const textWidget = this.widgets.find(w => w.name === `text${index}`);
            const weightWidget = this.widgets.find(w => w.name === `weight${index}`);
            if (textWidget) textWidget.value = "";
            if (weightWidget) weightWidget.value = 1.0;
            this.activePrompts--;
            localStorage.setItem('multitext_prompt_count', this.activePrompts.toString());
        this.updateNodeSize();
            this.setDirtyCanvas(true);
        }
    },
    isInsideControlButtons(x, y) {
        const prLayout = THEME.layout.promptRow; 
        const margin = prLayout.padding;
        const buttonSize = THEME.controls.button.size;
        const buttonMargin = THEME.controls.button.margin;
        const controlsY = margin + (this.activePrompts * (prLayout.height + prLayout.margin)) + buttonMargin;
        const removeX = margin; 
        const addX = removeX + buttonSize + 4; 
        const separatorX = addX + buttonSize + 4; 
        const toggleX = this.size[0] - margin - 80;
        const toggleWidth = 80; 
        const toggleHeight = 20; 
        const toggleY = controlsY - 2; 
        return {
            remove: x >= removeX && x <= removeX + buttonSize && 
                   y >= controlsY && y <= controlsY + buttonSize,
            add: x >= addX && x <= addX + buttonSize && 
                 y >= controlsY && y <= controlsY + buttonSize,
            separator: x >= separatorX && x <= separatorX + buttonSize && 
                      y >= controlsY && y <= controlsY + buttonSize,
            toggle: x >= toggleX && x <= toggleX + toggleWidth && 
                   y >= toggleY && y <= toggleY + toggleHeight
        };
    },    
    drawControlButtons(ctx) {
        const prLayout = THEME.layout.promptRow; 
        const margin = prLayout.padding;
        const buttonSize = THEME.controls.button.size;
        const buttonMargin = THEME.controls.button.margin;
        const y = margin + (this.activePrompts * (prLayout.height + prLayout.margin)) + buttonMargin;
        const removeX = margin; 
        const addX = removeX + buttonSize + 4; 
        const separatorX = addX + buttonSize + 4; 
        const toggleX = this.size[0] - margin - 60; 
        ctx.fillStyle = this.activePrompts > 1 ? THEME.controls.button.colors.bg : THEME.controls.button.colors.bgDisabled;
        Utils.drawRoundedRect(ctx, removeX, y, buttonSize, buttonSize, THEME.controls.button.borderRadius);
        ctx.strokeStyle = this.activePrompts > 1 ? THEME.controls.button.colors.text : THEME.controls.button.colors.textDisabled;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(removeX + 6, y + buttonSize/2);
        ctx.lineTo(removeX + buttonSize - 6, y + buttonSize/2);
        ctx.stroke();
        ctx.fillStyle = this.activePrompts < this.maxPrompts ? THEME.controls.button.colors.bg : THEME.controls.button.colors.bgDisabled;
        Utils.drawRoundedRect(ctx, addX, y, buttonSize, buttonSize, THEME.controls.button.borderRadius);
        ctx.strokeStyle = this.activePrompts < this.maxPrompts ? THEME.controls.button.colors.text : THEME.controls.button.colors.textDisabled;
        ctx.beginPath();
        ctx.moveTo(addX + 6, y + buttonSize/2);
        ctx.lineTo(addX + buttonSize - 6, y + buttonSize/2);
        ctx.moveTo(addX + buttonSize/2, y + 6);
        ctx.lineTo(addX + buttonSize/2, y + buttonSize - 6);
        ctx.stroke();
        ctx.fillStyle = THEME.controls.button.colors.bg;
        Utils.drawRoundedRect(ctx, separatorX, y, buttonSize, buttonSize, THEME.controls.button.borderRadius);
        ctx.fillStyle = THEME.controls.button.colors.text;
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⋮', separatorX + buttonSize/2, y + buttonSize/2);
        this.drawToggleSwitch(ctx, toggleX, y, buttonSize, this.isSinglePromptMode);
    },
    drawToggleSwitch(ctx, x, y, size, isSingleMode) {
        const width = 28;
        const height = 16;
        const radius = height / 2;
        const offset = 30;
        const toggleX = x + offset;
        const toggleY = y + (size - height) / 2;
        ctx.save();
        ctx.font = `600 6px ${THEME.typography.fonts.primary}`;
        ctx.textBaseline = "middle";
        ctx.textAlign = "right";
        ctx.fillStyle = THEME.colors.text;
        ctx.fillText(isSingleMode ? "Single" : "Multi", toggleX - 4, toggleY + height/2);
        ctx.beginPath();
        ctx.fillStyle = isSingleMode ? 
            `rgba(${parseInt(THEME.colors.accent.slice(1,3),16)}, ${parseInt(THEME.colors.accent.slice(3,5),16)}, ${parseInt(THEME.colors.accent.slice(5,7),16)}, 0.15)` : 
            'rgba(45, 45, 45, 0.2)';
        ctx.roundRect(toggleX, toggleY, width, height, radius);
        ctx.fill();
        ctx.strokeStyle = isSingleMode ? THEME.colors.accent : THEME.colors.border;
        ctx.lineWidth = 1;
        ctx.stroke();
        const handleRadius = height / 2 - 3;
        const handleX = isSingleMode ? toggleX + width - (handleRadius * 2) - 3 : toggleX + 3;
        const handleY = toggleY + 3;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetY = 1;
        const handleGradient = ctx.createLinearGradient(handleX, handleY, handleX, handleY + handleRadius * 2);
        handleGradient.addColorStop(0, isSingleMode ? THEME.colors.accent : '#FFFFFF');
        handleGradient.addColorStop(1, isSingleMode ? THEME.colors.accentLight : '#F0F0F0');
        ctx.beginPath();
        ctx.fillStyle = handleGradient;
        ctx.arc(handleX + handleRadius, handleY + handleRadius, handleRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isSingleMode ? THEME.colors.accentLight : THEME.colors.border;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
    },    
    updateNodeSize() {
        const prLayout = THEME.layout.promptRow; 
        const margin = prLayout.padding;
        const rowHeight = prLayout.height;
        const rowMargin = prLayout.margin;
        const buttonSize = THEME.controls.button.size;
        const buttonMargin = THEME.controls.button.margin;
        const totalHeight = margin + 
                           (this.activePrompts * (rowHeight + rowMargin)) + 
                           buttonMargin + 
                           buttonSize + 
                           margin;
        this.size[0] = Math.max(THEME.layout.minNodeWidth, this.size[0]); 
        this.size[1] = totalHeight;
        this.setDirtyCanvas(true);
    },
    onResize(size) {
        const prLayout = THEME.layout.promptRow; 
        const margin = prLayout.padding;
        const rowHeight = prLayout.height;
        const rowMargin = prLayout.margin;
        const buttonSize = THEME.controls.button.size;
        const buttonMargin = THEME.controls.button.margin;
        const minHeight = margin + 
                         (this.activePrompts * (rowHeight + rowMargin)) + 
                         buttonMargin + 
                         buttonSize + 
                         margin;
        size[0] = Math.max(THEME.layout.minNodeWidth, size[0]); 
        size[1] = minHeight;
        return size;
    },
    onSerialize(o) {
        if (!o.widgets_values) {
            o.widgets_values = [];
        }
        o.active_prompts = this.activePrompts;
    },
    onConfigure(o) {
        if (o.active_prompts !== undefined) {
            this.activePrompts = o.active_prompts;
            localStorage.setItem('multitext_prompt_count', this.activePrompts.toString());
        }
        this.updateNodeSize();
    },
    onMouseMove(event, pos, ctx) {
        const index = this.getHoveredWidgetIndex(pos);
        if (!app.ui.settings.getSettingValue("SKB.ShowTooltips")) {
            this.tooltipState.visible = false;
            this.setDirtyCanvas(true);
            return;
        }

        if (this.currentHoverIndex === index) {
            if (this.tooltipState.visible) {
                const canvasRect = ctx.canvas.getBoundingClientRect();
                this.tooltipState.x = event.clientX - canvasRect.left;
                this.tooltipState.y = event.clientY - canvasRect.top;
                this.setDirtyCanvas(true);
            }
            return;
        }

        this.currentHoverIndex = index;
        const textWidget = index !== -1 ? this.widgets.find(w => w.name === `text${index + 1}`) : null;
        
        this.tooltipState = {
            visible: textWidget?.value ? true : false,
            text: textWidget?.value || '',
            x: event.clientX - ctx.canvas.getBoundingClientRect().left,
            y: event.clientY - ctx.canvas.getBoundingClientRect().top
        };
        
            this.setDirtyCanvas(true);
        },        
    showSavePresetDialog(text, weight, dialogToUpdate) {
        
        const dialog = DialogUtils.createDialog(THEME, {
            width: '400px',
            maxHeight: '500px'
        });

        
        const closeButton = DialogUtils.createButton(THEME, {
            icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
            title: 'Close',
            onclick: () => dialog.remove()
        });

        
        const header = DialogUtils.createHeader(THEME, 'Save Preset', [closeButton]);
        dialog.appendChild(header);

        const content = document.createElement('div');
        content.classList.add('multitext-dialog-content');
        content.style.padding = '16px';

        
        const nameInput = DialogUtils.createInput(THEME, {
            placeholder: 'Optional preset name',
            className: 'multitext-save-preset-input'
        });
        nameInput.style.marginBottom = '12px';

        
        const valueTextarea = DialogUtils.createTextarea(THEME, {
            placeholder: 'Preset value (required)',
            value: text || '',
            className: 'multitext-dialog-textarea'
        });
        valueTextarea.style.marginBottom = '12px';

        
        valueTextarea.addEventListener('input', () => {
            if (!nameInput.value.trim()) {
                const firstLine = valueTextarea.value.split('\n')[0].trim();
                const truncated = firstLine.length > 40 ? firstLine.substring(0, 37) + '...' : firstLine;
                nameInput.placeholder = truncated || 'Optional preset name';
            }
        });

        
        const categorySelect = DialogUtils.createSelect(THEME, {
            className: 'multitext-save-preset-select',
            options: [
                { value: 'quality', label: '✨ Quality' },
                { value: 'style', label: '🎨 Style' },
                { value: 'lighting', label: '💡 Lighting' },
                { value: 'camera', label: '📷 Camera' },
                { value: 'mood', label: '🎭 Mood' },
                { value: 'environment', label: '🌍 Environment' }
            ]
        });

        content.appendChild(nameInput);
        content.appendChild(valueTextarea);
        content.appendChild(categorySelect);

        const buttons = document.createElement('div');
        buttons.classList.add('multitext-save-preset-buttons'); 

        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.classList.add('multitext-save-preset-button', 'multitext-save-preset-button-cancel');
        cancelBtn.onclick = () => dialog.remove();

        
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.classList.add('multitext-save-preset-button', 'multitext-save-preset-button-save');
        saveBtn.onclick = async () => {
            const value = valueTextarea.value.trim();
            if (!value) {
                alert("Please enter a preset value.");
                return;
            }

            const name = nameInput.value.trim() || value.split('\n')[0].trim();
            const category = categorySelect.value;

            if (!category) {
                alert("Please select a category.");
                return;
            }

            try {
                
                if (!THEME.promptPresets[category]) {
                    THEME.promptPresets[category] = { presets: [] };
                } else if (!Array.isArray(THEME.promptPresets[category].presets)) {
                    THEME.promptPresets[category].presets = [];
                }

                THEME.promptPresets[category].presets = THEME.promptPresets[category].presets.filter(preset => 
                    preset.label !== name
                );

                
                THEME.promptPresets[category].presets.push({
                    value: valueTextarea.value.trim(), 
                    label: name,
                    weight: 1.0 
                });

                try {
                    localStorage.setItem('multitext_category_presets', JSON.stringify(THEME.promptPresets));
                    console.log(`Preset \"${name}\" successfully saved to ${category} category`);

                    dialog.remove();

                    
                    
                    
                    
                } catch (error) {
                    console.error('Error saving preset:', error);
                    alert('Failed to save preset. Please try again.');
                    dialog.remove(); 
                }
            } catch (error) {
                console.error('Error saving preset:', error);
                alert('Failed to save preset. Please try again.');
                dialog.remove(); 
            }
        };

        buttons.appendChild(cancelBtn);
        buttons.appendChild(saveBtn);
        content.appendChild(buttons);

        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveBtn.click();
            }
        });

        dialog.appendChild(content);

        document.body.appendChild(dialog);

        
        const cleanupDragSavePreset = this._makeDialogDraggable(dialog, header);
        requestAnimationFrame(() => { 
            const container = document.querySelector('.graph-canvas-container') || document.body;
            const containerRect = container.getBoundingClientRect();
            const dialogRect = dialog.getBoundingClientRect();
            let desiredLeft = (containerRect.width - dialogRect.width) / 2 + containerRect.left;
            let desiredTop = (containerRect.height - dialogRect.height) / 2 + containerRect.top;
            
            const clampedLeft = Math.max(
                containerRect.left + 10, 
                Math.min(containerRect.right - dialogRect.width - 10, desiredLeft)
            );
            const clampedTop = Math.max(
                containerRect.top + 10, 
                Math.min(containerRect.bottom - dialogRect.height - 10, desiredTop)
            );
            dialog.style.left = clampedLeft + 'px';
            dialog.style.top = clampedTop + 'px';
            dialog.style.transform = 'none'; 
        });
        

        nameInput.focus();
    },
    showSaveTemplateDialog(promptText, promptWeight, dialogToUpdate, existingName = '', existingCategory = '') {
        
        const dialog = DialogUtils.createDialog(THEME, {}); 
        dialog.classList.remove('multitext-dialog'); 
        dialog.classList.add('multitext-save-preset-dialog'); 

        const title = document.createElement('div');
        title.textContent = existingName ? 'Edit Template' : 'Save Template';
        title.classList.add('multitext-save-preset-title');
        dialog.appendChild(title);

        
        const nameInput = DialogUtils.createInput(THEME, {
            placeholder: 'Template name',
            value: existingName,
            className: 'multitext-save-preset-input'
        });
        dialog.appendChild(nameInput);

        
        const promptTextarea = DialogUtils.createTextarea(THEME, {
            value: promptText || '',
            placeholder: 'Enter prompt text...',
            className: 'multitext-dialog-textarea'
        });
        dialog.appendChild(promptTextarea);

        
        const categorySelect = DialogUtils.createSelect(THEME, {
            className: 'multitext-save-preset-select',
            options: Object.entries(THEME.promptTemplates).map(([key, cat]) => ({
                value: key,
                label: `${cat.icon} ${cat.label || key}`,
                selected: existingCategory === key
            }))
        });
        dialog.appendChild(categorySelect);

        const buttons = document.createElement('div');
        buttons.classList.add('multitext-save-preset-buttons');

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.classList.add('multitext-save-preset-button', 'multitext-save-preset-button-cancel');
        cancelBtn.onclick = () => dialog.remove();

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.classList.add('multitext-save-preset-button', 'multitext-save-preset-button-save');
        saveBtn.onclick = async () => {
            const name = nameInput.value.trim();
            const category = categorySelect.value;
            const finalPromptText = promptTextarea.value.trim();
            
            if (!name || !finalPromptText || !category) {
                alert("Please fill in all fields.");
                return;
            }
            try {
                if (!THEME.promptTemplates[category].templates) {
                    THEME.promptTemplates[category].templates = [];
                }
                if (existingName && existingCategory) {
                    if (existingCategory !== category && THEME.promptTemplates[existingCategory]?.templates) {
                        THEME.promptTemplates[existingCategory].templates = 
                            THEME.promptTemplates[existingCategory].templates.filter(template => 
                                template.name !== existingName
                            );
                    }
                    THEME.promptTemplates[category].templates = 
                        THEME.promptTemplates[category].templates.filter(template => 
                            !(template.name === existingName && 
                              (existingCategory !== category || template.name === name))
                        );
                } else {
                    THEME.promptTemplates[category].templates = 
                        THEME.promptTemplates[category].templates.filter(template => 
                            template.name !== name
                        );
                }
                THEME.promptTemplates[category].templates.push({
                    name: name,
                    prompt: finalPromptText,
                    weight: promptWeight,
                    isCustom: true
                });
                localStorage.setItem('multitext_templates', JSON.stringify(THEME.promptTemplates));
                console.log(`Template \"${name}\" successfully ${existingName ? 'updated' : 'saved'} to ${category} category`);
                dialog.remove(); 
                if (dialogToUpdate) {
                    setTimeout(() => {
                        this.updateTemplateGrid(dialogToUpdate);
                    }, 100);
                }
            } catch (error) {
                console.error('Error saving template:', error);
                alert('Failed to save template. Please try again.');
                dialog.remove();
            }
        };

        if (existingName && existingCategory) {
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '✖';
            deleteBtn.title = 'Delete template';
            deleteBtn.classList.add('multitext-save-preset-button', 'multitext-save-preset-button-delete');
            deleteBtn.style.backgroundColor = '#EF4444';
            deleteBtn.style.color = 'white';
            deleteBtn.style.borderColor = '#B91C1C';
            deleteBtn.style.minWidth = '40px';
            deleteBtn.style.fontSize = '16px';
            deleteBtn.style.padding = '5px 10px';
            deleteBtn.onclick = () => {
                if (confirm(`Are you sure you want to delete the template \"${existingName}\"?`)) {
                    if (THEME.promptTemplates[existingCategory]?.templates) {
                        THEME.promptTemplates[existingCategory].templates = 
                            THEME.promptTemplates[existingCategory].templates.filter(template => 
                                template.name !== existingName
                            );
                        localStorage.setItem('multitext_templates', JSON.stringify(THEME.promptTemplates));
                        console.log(`Template \"${existingName}\" successfully deleted from ${existingCategory} category`);
                        if (dialogToUpdate) {
                            this.updateTemplateGrid(dialogToUpdate);
                        }
                        dialog.remove();
                    }
                }
            };
            cancelBtn.style.backgroundColor = 'transparent';
            cancelBtn.style.color = THEME.colors.text;
            cancelBtn.style.borderColor = THEME.colors.border;
            cancelBtn.style.borderRadius = '6px';
            cancelBtn.style.padding = '10px 16px';
            cancelBtn.style.fontSize = '14px';
            cancelBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            cancelBtn.style.fontWeight = '500';
            saveBtn.style.backgroundColor = '#8B5CF6';
            saveBtn.style.color = 'white';
            saveBtn.style.borderColor = 'transparent';
            saveBtn.style.borderRadius = '6px';
            saveBtn.style.padding = '10px 16px';
            saveBtn.style.fontSize = '14px';
            saveBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            saveBtn.style.fontWeight = '500';
            buttons.style.display = 'flex';
            buttons.style.gap = '12px';
            buttons.style.paddingTop = '20px';
            const rightButtons = document.createElement('div');
            rightButtons.style.display = 'flex';
            rightButtons.style.gap = '12px';
            rightButtons.style.marginLeft = 'auto';
            buttons.appendChild(deleteBtn);
            rightButtons.appendChild(cancelBtn);
            rightButtons.appendChild(saveBtn);
            buttons.appendChild(rightButtons);
            dialog.appendChild(buttons);
        } else {
            cancelBtn.style.backgroundColor = 'transparent';
            cancelBtn.style.color = THEME.colors.text;
            cancelBtn.style.borderColor = THEME.colors.border;
            cancelBtn.style.borderRadius = '6px';
            cancelBtn.style.padding = '10px 16px';
            cancelBtn.style.fontSize = '14px';
            cancelBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            cancelBtn.style.fontWeight = '500';
            saveBtn.style.backgroundColor = '#8B5CF6';
            saveBtn.style.color = 'white';
            saveBtn.style.borderColor = 'transparent';
            saveBtn.style.borderRadius = '6px';
            saveBtn.style.padding = '10px 16px';
            saveBtn.style.fontSize = '14px';
            saveBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            saveBtn.style.fontWeight = '500';
            buttons.style.display = 'flex';
            buttons.style.justifyContent = 'flex-end';
            buttons.style.gap = '12px';
            buttons.style.paddingTop = '20px';
            buttons.appendChild(cancelBtn);
            buttons.appendChild(saveBtn);
            dialog.appendChild(buttons);
        }

        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveBtn.click();
            }
        });

        document.body.appendChild(dialog);
        nameInput.focus();

        
        dialog.style.left = `calc(50% - ${dialog.offsetWidth / 2}px)`;
        dialog.style.top = `calc(50% - ${dialog.offsetHeight / 2}px)`;
    },
    showSaveChoiceDialog(event, textToSave, weightToSave, mainDialog) {
        
        const choiceDialog = DialogUtils.createDialog(THEME, { minWidth: '200px' }); 
        choiceDialog.className = 'multitext-save-choice-dialog'; 

        const title = document.createElement('div');
        title.className = 'multitext-save-choice-title';
        title.textContent = 'Save As...';
        choiceDialog.appendChild(title);

        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'multitext-save-choice-buttons';

        const savePresetBtn = document.createElement('button');
        savePresetBtn.textContent = 'Save as Preset';
        savePresetBtn.className = 'multitext-save-choice-button';
        savePresetBtn.onclick = () => {
            choiceDialog.remove();
            
            this.showSavePresetDialog(textToSave, weightToSave, mainDialog);
        };
        buttonsDiv.appendChild(savePresetBtn);

        const saveTemplateBtn = document.createElement('button');
        saveTemplateBtn.textContent = 'Save as Template';
        saveTemplateBtn.className = 'multitext-save-choice-button';
        saveTemplateBtn.onclick = () => {
            choiceDialog.remove();
            
            this.showSaveTemplateDialog(textToSave, weightToSave, mainDialog);
        };
        buttonsDiv.appendChild(saveTemplateBtn);

        choiceDialog.appendChild(buttonsDiv);

        document.body.appendChild(choiceDialog);
        const rect = event.target.getBoundingClientRect();
        const choiceRect = choiceDialog.getBoundingClientRect();
        let top = rect.bottom + 5;
        let left = rect.left + (rect.width / 2) - (choiceRect.width / 2);
        if (left < 5) left = 5;
        if (left + choiceRect.width > window.innerWidth - 5) {
            left = window.innerWidth - choiceRect.width - 5;
        }
        if (top + choiceRect.height > window.innerHeight - 5) {
            top = rect.top - choiceRect.height - 5;
        }
        choiceDialog.style.left = `${left}px`;
        choiceDialog.style.top = `${top}px`;

        const closeListener = (e) => {
            if (!choiceDialog.contains(e.target) && e.target !== event.target) {
                choiceDialog.remove();
                document.removeEventListener('mousedown', closeListener, true);
            }
        };
        document.addEventListener('mousedown', closeListener, true);
    },
    updateTemplateGrid(dialog) {
        const templateGrid = dialog.querySelector('.multitext-dialog-template-grid');
        if (!templateGrid) return;

        
        templateGrid.innerHTML = '';

        
        Object.entries(THEME.promptTemplates).forEach(([category, { icon, label, templates }]) => {
            if (!Array.isArray(templates)) {
                console.warn(`Templates for category '${category}' is not an array. Skipping.`);
                return;
            }
            templates.forEach(template => {
                const templateBtn = document.createElement('button');
                templateBtn.classList.add('multitext-dialog-template-button');

                const templateBtnHeader = document.createElement('div');
                templateBtnHeader.classList.add('multitext-dialog-template-button-header');
                templateBtnHeader.innerHTML = `${icon || '📝'} ${template.name}`;

                const templateInfo = document.createElement('div');
                templateInfo.classList.add('multitext-dialog-template-button-info');
                templateInfo.innerHTML = `
                    <span>${label || category}</span>
                    <span>${template.weight ? template.weight.toFixed(1) : '-'}</span>
                `;

                
                const editIcon = document.createElement('div');
                editIcon.classList.add('multitext-template-edit-icon');
                editIcon.innerHTML = '⋮';
                editIcon.title = 'Edit template';

                
                editIcon.onclick = (e) => {
                    e.stopPropagation();
                    this.showSaveTemplateDialog(
                        template.prompt,
                        template.weight,
                        dialog,
                        template.name,
                        category
                    );
                };

                templateBtn.appendChild(editIcon);
                templateBtn.appendChild(templateBtnHeader);
                templateBtn.appendChild(templateInfo);

                templateBtn.onclick = () => {
                    const textarea = dialog.textarea;
                    const weightInput = dialog.weightInput;
                    if (textarea) {
                        textarea.value = template.prompt;
                        if (template.weight !== undefined && weightInput) {
                        weightInput.value = template.weight;
                        }
                        textarea.dispatchEvent(new Event('input'));
                    }
                };

                templateGrid.appendChild(templateBtn);
            });
        });
    },
    updateHistoryDropdown(dropdown) {
        if (!dropdown) return;
        
        
        dropdown.innerHTML = '';
        
        
        const history = this.loadPromptHistory();
        
        if (history.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.classList.add('multitext-dialog-history-empty');
            emptyMessage.textContent = 'No history items';
            dropdown.appendChild(emptyMessage);
            return;
        }
        
        
        history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('multitext-dialog-history-item');
            
            const textSpan = document.createElement('span');
            textSpan.classList.add('multitext-dialog-history-text');
            textSpan.textContent = item.text;
            historyItem.appendChild(textSpan);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('multitext-dialog-history-delete');
            deleteBtn.innerHTML = '✕';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                
                history.splice(index, 1);
                
                localStorage.setItem('multitext_history', JSON.stringify(history));
                
                historyItem.remove();
                
                if (history.length === 0) {
                    const emptyMessage = document.createElement('div');
                    emptyMessage.classList.add('multitext-dialog-history-empty');
                    emptyMessage.textContent = 'No history items';
                    dropdown.appendChild(emptyMessage);
                }
                
                this.updateHistoryDropdown(dropdown);
            };
            historyItem.appendChild(deleteBtn);
            
            historyItem.onclick = () => {
                const textarea = dropdown.closest('.multitext-dialog')?.querySelector('.multitext-dialog-textarea');
                if (textarea) {
                    textarea.value = item.text;
                    textarea.dispatchEvent(new Event('input'));
                }
                dropdown.style.display = 'none';
            };
            
            historyItem.onmouseover = () => {
                deleteBtn.style.display = 'block';
            };
            
            historyItem.onmouseout = () => {
                deleteBtn.style.display = 'none';
            };
            
            dropdown.appendChild(historyItem);
        });
    },
    
    loadFonts() {
        if (document.getElementById('multitext-fonts')) return;
        const head = document.head;
        const fontElements = `
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap">
            <style id="multitext-fonts">
                .multitext-node * {
                    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 
                               Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                }
            </style>
        `;
        head.insertAdjacentHTML('beforeend', fontElements);
    },
    
    _makeDialogDraggable(dialogElement, headerElement) {
        let isDragging = false;
        let xOffset = 0;
        let yOffset = 0;

        const removeListeners = () => {
            document.removeEventListener('mousemove', dragMove);
            document.removeEventListener('mouseup', dragEnd);
            if (headerElement) headerElement.style.cursor = 'move'; 
        };

        const dragStart = (e) => {
            
            
            if (headerElement && (e.target === headerElement || headerElement.contains(e.target)) && !e.target.closest('button')) {
                isDragging = true;
                dialogElement.style.transition = 'none'; 
                headerElement.style.cursor = 'grabbing';
                const rect = dialogElement.getBoundingClientRect();
                xOffset = e.clientX - rect.left;
                yOffset = e.clientY - rect.top;
                e.preventDefault(); 
                document.addEventListener('mousemove', dragMove);
                document.addEventListener('mouseup', dragEnd);
            }
        };

        const dragMove = (e) => {
            if (isDragging) {
                e.preventDefault();
                const x = e.clientX - xOffset;
                const y = e.clientY - yOffset;
                dialogElement.style.left = `${x}px`;
                dialogElement.style.top = `${y}px`;
                dialogElement.style.transform = 'none'; 
            }
        };

        const dragEnd = (e) => {
            if (isDragging) {
                isDragging = false;
                removeListeners(); 
                 
                
            }
        };
        
        if (headerElement) {
           headerElement.style.cursor = 'move'; 
           headerElement.addEventListener('mousedown', dragStart);
        } else {
            console.warn("Draggable dialog called without a valid header element.");
        }

        
        
        
        
        return () => {
            if (headerElement) {
               headerElement.removeEventListener('mousedown', dragStart);
            }
            removeListeners(); 
        };
    },
    
    _showDeletePresetDialog(preset) {
        if (!preset) return;
        if (confirm(`Are you sure you want to delete the preset \"${preset.label}\"?`)) {
            let categoryFound = null;
            let presetIndex = -1;

            
            for (const category in THEME.promptPresets) {
                if (THEME.promptPresets[category]?.presets) {
                    presetIndex = THEME.promptPresets[category].presets.findIndex(p => p.label === preset.label && p.value === preset.value);
                    if (presetIndex > -1) {
                        categoryFound = category;
                        break;
                    }
                }
            }

            if (categoryFound !== null && presetIndex > -1) {
                THEME.promptPresets[categoryFound].presets.splice(presetIndex, 1);
                localStorage.setItem('multitext_category_presets', JSON.stringify(THEME.promptPresets));
                console.log(`Preset \"${preset.label}\" successfully deleted from ${categoryFound} category`);
                
                
                
            } else {
                console.warn("Could not find preset to delete in THEME structure:", preset);
            }
        }
    },
    

    
    _showEditPresetDialog(preset, labelElementToUpdate = null) {
        if (!preset) return;

        const editDialog = DialogUtils.createDialog(THEME, {
            className: 'multitext-save-preset-dialog',
        });
        editDialog.style.zIndex = '10002'; 

        const editHeader = DialogUtils.createHeader(THEME, 'Edit Preset', [
            DialogUtils.createButton(THEME, {
                innerHTML: '✕',
                className: 'multitext-dialog-button-close',
                onclick: () => editDialog.remove()
            })
        ]);
        editDialog.appendChild(editHeader); 
        const cleanupDragEdit = this._makeDialogDraggable(editDialog, editHeader); 

        const nameInput = DialogUtils.createInput(THEME, {
            value: preset.label,
            placeholder: 'Preset name',
            className: 'multitext-save-preset-input' 
        });
        editDialog.appendChild(nameInput);
         const valueInput = DialogUtils.createTextarea(THEME, {
            value: preset.value,
            placeholder: 'Preset value',
            className: 'multitext-dialog-textarea' 
        });
        editDialog.appendChild(valueInput);
         const buttons = document.createElement('div');
        buttons.classList.add('multitext-save-preset-buttons');
        const cancelBtn = DialogUtils.createButton(THEME, {
            innerHTML: 'Cancel',
            className: 'multitext-save-preset-button multitext-save-preset-button-cancel',
            onclick: (e) => {
                e.stopPropagation();
                editDialog.remove();
            }
        });
        const saveBtn = DialogUtils.createButton(THEME, {
            innerHTML: 'Save',
            className: 'multitext-save-preset-button multitext-save-preset-button-save',
            onclick: (e) => {
                e.stopPropagation();
                const newName = nameInput.value.trim();
                const newValue = valueInput.value.trim();
                if (newName && newValue) {
                    
                    let originalCategory = null;
                    for (const cat in THEME.promptPresets) {
                        if (THEME.promptPresets[cat]?.presets?.some(p => p.label === preset.label && p.value === preset.value)) {
                            originalCategory = cat;
                            break;
                        }
                    }

                    if (originalCategory) {
                        const presetIndex = THEME.promptPresets[originalCategory].presets.findIndex(p => p.label === preset.label && p.value === preset.value);
                        if (presetIndex > -1) {
                            THEME.promptPresets[originalCategory].presets[presetIndex].label = newName;
                            THEME.promptPresets[originalCategory].presets[presetIndex].value = newValue;
                            
                            preset.label = newName; 
                            preset.value = newValue;
                            
                            
                            if (labelElementToUpdate) {
                                labelElementToUpdate.textContent = newName;
                            }
                            this.saveToHistory(newValue); 
                            localStorage.setItem('multitext_category_presets', JSON.stringify(THEME.promptPresets));
                        }
                    } else {
                         console.warn("Could not find original category for preset:", preset);
                    }
                    editDialog.remove();
                }
            }
        });
        buttons.appendChild(cancelBtn);
        buttons.appendChild(saveBtn);
        editDialog.appendChild(buttons);
         editDialog.addEventListener('mousedown', (e) => {
            e.stopPropagation(); 
        });
         document.body.appendChild(editDialog);
        nameInput.focus();
        nameInput.select();

        requestAnimationFrame(() => { 
            const container = document.querySelector('.graph-canvas-container') || document.body;
            const containerRect = container.getBoundingClientRect();
            const dialogRect = editDialog.getBoundingClientRect();
            let desiredLeft = (containerRect.width - dialogRect.width) / 2 + containerRect.left;
            let desiredTop = (containerRect.height - dialogRect.height) / 2 + containerRect.top;
            
            const clampedLeft = Math.max(
                containerRect.left + 10, 
                Math.min(containerRect.right - dialogRect.width - 10, desiredLeft)
            );
            const clampedTop = Math.max(
                containerRect.top + 10, 
                Math.min(containerRect.bottom - dialogRect.height - 10, desiredTop)
            );
            editDialog.style.left = clampedLeft + 'px';
            editDialog.style.top = clampedTop + 'px';
            editDialog.style.transform = 'none'; 
        });
    },
};

app.registerExtension({
    name: "SKB.MultiText",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name !== "MultiTextNode") return;
        Object.assign(nodeType.prototype, MultiTextNode);
    }
});
app.ui.settings.addSetting({
    id: "SKB.ShowTooltips",
    name: "Show Multi-Text tooltips on hover?",
    type: "boolean",
    defaultValue: false,
});
