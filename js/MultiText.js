import { app } from "../../../scripts/app.js";
import { ComfyWidgets } from "../../../scripts/widgets.js";

const THEME = {
    colors: {
        bg: "#18181B",
        bgHover: "#27272A",
        bgActive: "#3F3F46",
        accent: "#8B5CF6",
        accentLight: "#A78BFA",
        text: "#F4F4F5",
        textDim: "#A1A1AA",
        border: "#27272A",
        surface: {
            base: "#18181B",
            hover: "#27272A",
            active: "#3F3F46"
        }
    },
    sizes: {
        margin: 12,
        textHeight: 42,
        borderRadius: 8,
        fontSize: {
            small: 12,
            normal: 14,
            title: 16,
            large: 18
        },
        spacing: {
            xs: 4,
            sm: 8,
            md: 12,
            lg: 16
        }
    },
    typography: {
        fonts: {
            primary: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif"
        },
        weights: {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700
        }
    },
    promptPresets: {
        quality: {
            icon: "✨",
            presets: [
                { value: "masterpiece", label: "Masterpiece" },
                { value: "best quality", label: "Best Quality" },
                { value: "ultra detailed", label: "Ultra Detailed" },
                { value: "high resolution", label: "High Resolution" },
                { value: "8k uhd", label: "8K UHD" },
                { value: "professional", label: "Professional" }
            ]
        },
        style: {
            icon: "🎨", 
            presets: [
                { value: "anime", label: "Anime" },
                { value: "realistic", label: "Realistic" },
                { value: "watercolor", label: "Watercolor" },
                { value: "oil painting", label: "Oil Painting" },
                { value: "digital art", label: "Digital Art" },
                { value: "concept art", label: "Concept Art" },
                { value: "3d render", label: "3D Render" },
                { value: "photorealistic", label: "Photorealistic" }
            ]
        },
        lighting: {
            icon: "💡",
            presets: [
                { value: "dramatic lighting", label: "Dramatic Lighting" },
                { value: "soft light", label: "Soft Light" },
                { value: "cinematic", label: "Cinematic" },
                { value: "volumetric lighting", label: "Volumetric" },
                { value: "studio lighting", label: "Studio" },
                { value: "golden hour", label: "Golden Hour" },
                { value: "neon lighting", label: "Neon" }
            ]
        },
        camera: {
            icon: "📷",
            presets: [
                { value: "close-up shot", label: "Close-up Shot" },
                { value: "wide angle", label: "Wide Angle" },
                { value: "bokeh", label: "Bokeh" },
                { value: "depth of field", label: "Depth of Field" },
                { value: "portrait shot", label: "Portrait" },
                { value: "aerial view", label: "Aerial View" },
                { value: "macro shot", label: "Macro" }
            ]
        },
        mood: {
            icon: "🎭",
            presets: [
                { value: "happy", label: "Happy" },
                { value: "dark", label: "Dark" },
                { value: "peaceful", label: "Peaceful" },
                { value: "mysterious", label: "Mysterious" },
                { value: "epic", label: "Epic" },
                { value: "dreamy", label: "Dreamy" },
                { value: "cyberpunk", label: "Cyberpunk" }
            ]
        },
        environment: {
            icon: "🌍",
            presets: [
                { value: "fantasy landscape", label: "Fantasy" },
                { value: "sci-fi environment", label: "Sci-Fi" },
                { value: "post-apocalyptic", label: "Post-Apocalyptic" },
                { value: "steampunk world", label: "Steampunk" },
                { value: "underwater scene", label: "Underwater" },
                { value: "space scene", label: "Space" }
            ]
        }
    },
    promptTools: {
        quickActions: [
            { icon: "📜", action: "history", title: "History" },
            { icon: "🗑️", action: "clear", title: "Clear" }
        ]
    },
    promptTemplates: {
        character: {
            icon: "👤",
            label: "Character",
            templates: [
                { 
                    name: "Portrait",
                    prompt: "1girl, portrait, detailed face, looking at viewer, soft lighting, professional photography",
                    weight: 1.2
                },
                { 
                    name: "Full Body",
                    prompt: "1girl, full body, standing pose, detailed clothes, professional studio lighting",
                    weight: 1.0
                },
                {
                    name: "Action",
                    prompt: "dynamic pose, action shot, detailed movement, dramatic lighting",
                    weight: 1.1
                }
            ]
        },
        scene: {
            icon: "🌅",
            label: "Scene",
            templates: [
                {
                    name: "Indoor",
                    prompt: "indoors, detailed room, soft ambient lighting, cozy atmosphere, interior design",
                    weight: 1.0
                },
                {
                    name: "Outdoor",
                    prompt: "outdoors, natural lighting, detailed background, scenic view, landscape photography",
                    weight: 1.1
                },
                {
                    name: "Urban",
                    prompt: "city street, urban environment, architectural details, street photography",
                    weight: 1.0
                }
            ]
        },
        style: {
            icon: "🎨",
            label: "Style",
            templates: [
                {
                    name: "Anime",
                    prompt: "anime style, cel shading, vibrant colors, detailed linework",
                    weight: 1.0
                },
                {
                    name: "Realistic",
                    prompt: "realistic, detailed, photorealistic, hyperrealistic, professional photography",
                    weight: 1.2
                },
                {
                    name: "Fantasy",
                    prompt: "fantasy art style, magical atmosphere, ethereal lighting, detailed environment",
                    weight: 1.1
                },
                {
                    name: "Sci-Fi",
                    prompt: "science fiction, futuristic, high tech, neon lighting, cyberpunk elements",
                    weight: 1.1
                }
            ]
        }
    },
    controls: {
        button: {
            size: 20,
            padding: 4,
            margin: 4,
            borderRadius: 4,
            colors: {
                bg: "#2D2D3F",
                bgHover: "#313244",
                bgDisabled: "#1E1E2E",
                text: "#CDD6F4",
                textDisabled: "#45475A",
                border: "#45475A"
            }
        }
    },
    effects: {
        glow: "0 0 10px rgba(139, 92, 246, 0.1)",
        hover: "0 2px 4px rgba(0, 0, 0, 0.1)",
        pressed: "0 1px 2px rgba(0, 0, 0, 0.05)"
    }
};

const fontStyles = document.createElement('style');
fontStyles.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    .multitext-node {
        font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }
`;
document.head.appendChild(fontStyles);

const Utils = {
    drawRoundedRect(ctx, x, y, w, h, r) {
        if (!ctx) return;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.fill();
    },
    truncateText(ctx, text, maxWidth) {
        const words = text.split(' ');
        let truncatedText = '';
        let currentWidth = 0;
        for (const word of words) {
            const wordWidth = ctx.measureText(word).width;
            if (currentWidth + wordWidth > maxWidth) {
                truncatedText += '...';
                break;
            }
            truncatedText += word + ' ';
            currentWidth += wordWidth + ctx.measureText(' ').width;
        }
        return truncatedText.trim();
    },
    textWidthCache: new Map(),
    
    measureTextCached(ctx, text) {
        if (!this.textWidthCache.has(text)) {
            this.textWidthCache.set(text, ctx.measureText(text).width);
        }
        return this.textWidthCache.get(text);
    },

    truncateTextEfficient(ctx, text, maxWidth) {
        if (!text) return '';
        const cached = this.measureTextCached(ctx, text);
        if (cached <= maxWidth) return text;

        const ellipsis = '...';
        const ellipsisWidth = this.measureTextCached(ctx, ellipsis);
        let low = 0;
        let high = text.length;
        let best = 0;

        while (low <= high) {
            const mid = (low + high) >>> 1;
            const slice = text.slice(0, mid);
            const width = this.measureTextCached(ctx, slice) + ellipsisWidth;
            
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
    createRipple(ctx, x, y, progress) {
        const maxRadius = THEME.interactions.ripple.size;
        const radius = maxRadius * progress;
        const alpha = 1 - progress;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = THEME.interactions.ripple.color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    drawHoverEffect(ctx, x, y, width, height, progress) {
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = THEME.colors.bgHover;
        Utils.drawRoundedRect(ctx, x, y, width, height, 4);
        ctx.restore();
    },

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

        let tooltipX = x;
        let tooltipY = y - tooltipHeight - 8;

        if (tooltipX + tooltipWidth > ctx.canvas.width - 8) {
            tooltipX = ctx.canvas.width - tooltipWidth - 8;
        }

        if (tooltipX < 8) {
            tooltipX = 8;
        }

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

const STYLES = {
    row: {
        height: 32,
        padding: 8,
        margin: 1,
        colors: {
            bg: {
                empty: "rgba(40, 44, 52, 0.4)",
                filled: "rgba(40, 44, 52, 0.6)"
            },
            text: {
                empty: "rgba(255, 255, 255, 0.5)",
                filled: "rgba(255, 255, 255, 0.9)"
            }
        }
    },
    weight: {
        width: 160,
        line: {
            width: 40,
            height: 2,
            colors: {
                bg: "rgba(255, 255, 255, 0.1)",
                fill: "#89b4fa"
            }
        }
    },
    button: {
        size: 20,
        margin: 4,
        colors: {
            active: "#2D2D3F",
            disabled: "#1E1E2E",
            text: "#CDD6F4",
            textDisabled: "#45475A"
        }
    }
};

const Renderer = {
    drawPromptRow(ctx, x, y, text, weight, rowWidth, rowHeight, radius) {
        ctx.save();
        ctx.fillStyle = THEME.colors.surface.base;
        ctx.shadowColor = "rgba(0,0,0,0.06)";
        ctx.shadowBlur = 2;
        ctx.shadowOffsetY = 1;
        Utils.drawRoundedRect(ctx, x, y, rowWidth, rowHeight, radius);
        ctx.restore();

        ctx.strokeStyle = THEME.colors.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        this.roundedRect(ctx, x, y, rowWidth, rowHeight, radius);
        ctx.stroke();

        ctx.fillStyle = THEME.colors.text;
        ctx.font = `400 13px ${THEME.typography.fonts.primary}`;
        const truncatedText = Utils.truncateTextEfficient(ctx, text, rowWidth - 100);
        // in Renderer.drawPromptRow or similar:
        const toggleWidth = 30;  // or whatever the checkbox+margin is
        ctx.fillText(truncatedText, x + toggleWidth + 10, y + rowHeight/2 + 4);

        const weightX = x + rowWidth - 90;
        const weightY = y + rowHeight/2;
        
        ctx.fillStyle = THEME.colors.border;
        ctx.fillRect(weightX, weightY - 1, 32, 1);
        
        const weightValue = parseFloat(weight) || 1.0;
        ctx.fillStyle = THEME.colors.accent;
        ctx.fillRect(weightX, weightY - 1, 32 * (weightValue/2), 1);

        ctx.fillStyle = THEME.colors.textDim;
        ctx.font = `500 11px ${THEME.typography.fonts.primary}`;
        ctx.textAlign = "right";
        ctx.fillText(weightValue.toFixed(1), weightX + 45, weightY + 4);
        ctx.textAlign = "left";
    },

    drawControlButtons(ctx, x, y, buttonSize, isAddEnabled, isRemoveEnabled) {
        const radius = 4;
        const iconSize = 10;

        ctx.save();
        ctx.fillStyle = THEME.colors.surface.base;
        ctx.strokeStyle = THEME.colors.border;
        ctx.lineWidth = 1;
        Utils.drawRoundedRect(ctx, x, y, buttonSize * 2 + 1, buttonSize, radius);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + buttonSize, y);
        ctx.lineTo(x + buttonSize, y + buttonSize);
        ctx.stroke();

        ctx.strokeStyle = isRemoveEnabled ? THEME.colors.accent : THEME.colors.textDim;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + (buttonSize - iconSize)/2, y + buttonSize/2);
        ctx.lineTo(x + (buttonSize + iconSize)/2, y + buttonSize/2);
        ctx.stroke();

        ctx.strokeStyle = isAddEnabled ? THEME.colors.accent : THEME.colors.textDim;
        ctx.beginPath();
        const centerX = x + buttonSize * 1.5;
        ctx.moveTo(centerX - iconSize/2, y + buttonSize/2);
        ctx.lineTo(centerX + iconSize/2, y + buttonSize/2);
        ctx.moveTo(centerX, y + buttonSize/2 - iconSize/2);
        ctx.lineTo(centerX, y + buttonSize/2 + iconSize/2);
        ctx.stroke();
        
        ctx.restore();
    },

    roundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    },

    drawWeight(ctx, weight, x, y) {
        const { line } = STYLES.weight;
        
        ctx.font = `500 12px ${THEME.typography.fonts.primary}`;
        ctx.textAlign = "right";
        ctx.fillStyle = STYLES.row.colors.text.filled;
        ctx.fillText(weight.toFixed(1), x - 4, y);

        const barWidth = 24;
        const barHeight = 3;
        const barY = y + 6;

        ctx.fillStyle = THEME.colors.border;
        ctx.fillRect(x - barWidth - 28, barY, barWidth, barHeight);
        
        const fillWidth = barWidth * (weight / 2);
        ctx.fillStyle = THEME.colors.accent;
        ctx.fillRect(x - barWidth - 28, barY, fillWidth, barHeight);
    }
};

const MultiTextNode = {
    onNodeCreated() {
        if (this.htmlElement) {
            this.htmlElement.classList.add('multitext-node');
        }
        
        this.setupWidgets();
        
        const savedPromptCount = localStorage.getItem('multitext_prompt_count');
        this.activePrompts = savedPromptCount ? parseInt(savedPromptCount) : 2;
        this.maxPrompts = 20;

            // **NEW: Load Single/Multi mode from storage**
        const savedMode = localStorage.getItem('multitext_single_prompt');
        this.isSinglePromptMode = savedMode === "true";  // Convert from string to boolean

        this.applyPromptMode(); // Apply correct mode on startup 
        this.updateNodeSize();
        
        this.hoverStates = new Map();
        this.ripples = [];
        
        this.tooltipState = {
            visible: false,
            text: '',
            x: 0,
            y: 0
        };

        this.currentHoverIndex = -1;

        this.visualWidgets = Array(20).fill(null).map((_, i) => ({
            index: i,
            isHovered: false
        }));
        
        this.loadFonts();
    },
    setupWidgets() {
        for (let i = 1; i <= 20; i++) {
            const textWidget = ComfyWidgets["STRING"](this, `text${i}`, ["STRING", { 
                multiline: true,
                visible: false
            }], app);
            const weightWidget = ComfyWidgets["FLOAT"](this, `weight${i}`, ["FLOAT", {
                default: 1.0,
                min: 0.0,
                max: 2.0,
                step: 0.1,
                visible: false
            }], app);

             // NEW: label{i} widget
            const labelWidget = ComfyWidgets["STRING"](
                this,
                `label${i}`,
                ["STRING", { multiline: false, visible: false }],
                app
            );

              // NEW: enabled{i} widget
            const enabledWidget = ComfyWidgets["BOOLEAN"](
                this,
                `enabled${i}`, // name it uniquely
                ["BOOLEAN", { default: true, visible: false }],
                app
            );
            

            if (textWidget?.widget) {
                textWidget.widget.computeSize = () => [0, -4];
                textWidget.widget.hidden = true;
            }
            if (weightWidget?.widget) {
                weightWidget.widget.computeSize = () => [0, -4];
                weightWidget.widget.hidden = true;
            }
            if (labelWidget?.widget) {
                labelWidget.widget.computeSize = () => [0, -4];
                labelWidget.widget.hidden = true;
            }
            if (enabledWidget?.widget) {
                enabledWidget.widget.computeSize = () => [0, -4];
                enabledWidget.widget.hidden = true; // so it doesn't appear by default
              }
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
        this.quickActions = THEME.promptTools.quickActions;
    },

    setupVisualWidgets() {
        this.visualWidgets = [];
        for (let i = 1; i <= 20; i++) {
            this.visualWidgets.push({
                index: i,
                isHovered: false
            });
        }
    },
    applyPromptMode() {
        if (this.isSinglePromptMode) {
            // **Disable all rows except the first**
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
            } else if (controls.toggle) { // Handle toggle switch click
                this.isSinglePromptMode = !this.isSinglePromptMode;
                localStorage.setItem('multitext_single_prompt', this.isSinglePromptMode); // **Save state**
                this.applyPromptMode(); // Apply the new mode
                this.setDirtyCanvas(true);
                return true;
                return true;
            } else if (controls.separator) {
                const separatorMenu = document.createElement('div');
                separatorMenu.style.cssText = `
                    position: fixed;
                    z-index: 10000;
                    background: ${THEME.colors.bg};
                    border: 1px solid ${THEME.colors.border};
                    border-radius: 8px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
                    padding: 8px;
                    min-width: 180px;
                    font-family: ${THEME.typography.fonts.primary};
                `;

                const title = document.createElement('div');
                title.textContent = 'Select Separator';
                title.style.cssText = `
                    padding: 8px 12px;
                    color: ${THEME.colors.textDim};
                    font-size: 13px;
                    font-weight: 500;
                    border-bottom: 1px solid ${THEME.colors.border};
                    margin-bottom: 4px;
                `;
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
                    menuItem.style.cssText = `
                        padding: 8px 12px;
                        margin: 2px 0;
                        cursor: pointer;
                        border-radius: 6px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        color: ${THEME.colors.text};
                        font-size: 13px;
                        transition: all 0.1s ease;

                        &:hover {
                            background: ${THEME.colors.bgHover};
                        }

                        &:active {
                            background: ${THEME.colors.bgActive};
                            transform: translateY(1px);
                        }
                    `;

                    const icon = document.createElement('span');
                    icon.textContent = item.icon;
                    icon.style.cssText = `
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        width: 24px;
                        height: 24px;
                        background: ${THEME.colors.bgActive};
                        border-radius: 4px;
                        font-size: 14px;
                        color: ${THEME.colors.accent};
                    `;

                    const label = document.createElement('span');
                    label.textContent = item.label;
                    label.style.flex = '1';

                    menuItem.appendChild(icon);
                    menuItem.appendChild(label);

                    if (this.separator?.widget?.value === item.value) {
                        menuItem.style.background = THEME.colors.bgActive;
                        icon.style.background = THEME.colors.accent;
                        icon.style.color = THEME.colors.text;
                    }

                    menuItem.onclick = () => {
                        if (item.value === 'custom') {
                            const customInput = document.createElement('input');
                            customInput.type = 'text';
                            customInput.style.cssText = `
                                width: calc(100% - 24px);
                                margin: 8px 12px;
                                padding: 6px 8px;
                                border: 1px solid ${THEME.colors.border};
                                border-radius: 4px;
                                background: ${THEME.colors.bgInput};
                                color: ${THEME.colors.text};
                                font-size: 13px;
                                font-family: ${THEME.typography.fonts.primary};
                            `;
                            customInput.placeholder = 'Enter custom separator...';
                            customInput.maxLength = 10;

                            while (separatorMenu.firstChild) {
                                separatorMenu.firstChild.remove();
                            }

                            const title = document.createElement('div');
                            title.textContent = 'Custom Separator';
                            title.style.cssText = `
                                padding: 8px 12px;
                                color: ${THEME.colors.textDim};
                                font-size: 13px;
                                font-weight: 500;
                                border-bottom: 1px solid ${THEME.colors.border};
                                margin-bottom: 4px;
                            `;
                            separatorMenu.appendChild(title);
                            separatorMenu.appendChild(customInput);

                            const confirmButton = document.createElement('div');
                            confirmButton.textContent = 'OK';
                            confirmButton.style.cssText = `
                                margin: 8px 12px;
                                padding: 6px 12px;
                                text-align: center;
                                background: ${THEME.colors.accent};
                                color: ${THEME.colors.text};
                                border-radius: 4px;
                                cursor: pointer;
                                font-weight: 500;
                                
                                &:hover {
                                    background: ${THEME.colors.accentHover};
                                }
                            `;
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
            
                  // check if user clicked a row
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
            const margin = STYLES.row.padding;
            const rowHeight = STYLES.row.height;
            const rowMargin = STYLES.row.margin;
        
            const y = margin + rowIndex * (rowHeight + rowMargin);
            const toggleWidth = 30;
            const toggleHeight = 14;
            const togglePadding = 6;  // Extra padding to reduce accidental blocking
        
            // Adjusted toggle positioning
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
                // **Disable all other rows, enable only the clicked row**
                for (let i = 0; i < this.activePrompts; i++) {
                    const widget = this.widgets.find(w => w.name === `enabled${i+1}`);
                    if (widget) widget.value = (i === index); // Enable only the clicked one
                }
            } else {
                // **Multi mode: Allow toggling freely**
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

            const dialog = document.createElement('div');
            dialog.style.cssText = `
            position: fixed;
            z-index: 10000;
            background: ${THEME.colors.bg};
            padding: ${THEME.sizes.spacing.lg}px;
            border-radius: ${THEME.sizes.borderRadius * 2}px;
            border: 1px solid ${THEME.colors.border};
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            color: ${THEME.colors.text};
            font-family: ${THEME.typography.fonts.primary};
            width: 320px;
            transition: all 0.2s;
            /* ADDED: a max-height  */
            max-height: 80vh;       /* 80% of viewport height */s
        `;

            const content = document.createDocumentFragment();
            
            const header = document.createElement('div');
            header.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin: -${THEME.sizes.spacing.lg}px -${THEME.sizes.spacing.lg}px ${THEME.sizes.spacing.md}px;
                padding: ${THEME.sizes.spacing.md}px;
                background: ${THEME.colors.bgActive};
                border-bottom: 1px solid ${THEME.colors.border};
                cursor: move;
                user-select: none;
                border-radius: ${THEME.sizes.borderRadius * 2}px ${THEME.sizes.borderRadius * 2}px 0 0;
            `;

            let isDragging = false;
            let currentX;
            let currentY;
            let initialX;
            let initialY;
            let xOffset = 0;
            let yOffset = 0;

            header.addEventListener('mousedown', dragStart);
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', dragEnd);

            function dragStart(e) {
                if (e.target === header || e.target === title) {
                    isDragging = true;
                    dialog.style.transition = 'none';
                    header.style.cursor = 'grabbing';

                    const rect = dialog.getBoundingClientRect();
                    xOffset = e.clientX - rect.left;
                    yOffset = e.clientY - rect.top;
                }
            }

            function drag(e) {
                if (isDragging) {
                    e.preventDefault();
                    
                    const x = e.clientX - xOffset;
                    const y = e.clientY - yOffset;
                    
                    dialog.style.left = `${x}px`;
                    dialog.style.top = `${y}px`;
                    dialog.style.transform = 'none';
                }
            }

            function dragEnd(e) {
                isDragging = false;
                header.style.cursor = 'move';
            }
            

            // Title (Left-aligned)
            const title = document.createElement('div');
            title.textContent = `Prompt ${index}`;
            title.style.cssText = `
                font-size: ${THEME.sizes.fontSize.title}px;
                font-weight: ${THEME.typography.weights.semibold};
                color: ${THEME.colors.text};
                flex-grow: 1; /* Allows it to take up available space */
            `;

            // Right-side button container (Save + Close)
            const buttonContainer = document.createElement('div');
            buttonContainer.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                margin-left: auto; /* Pushes it to the right */
            `;

            // Save Button
            const saveButton = document.createElement('button');
            saveButton.textContent = 'Save';
            saveButton.style.cssText = `
                max-width: 100px;
                padding: 8px 16px;
                background: ${THEME.colors.accent};
                border: none;
                border-radius: 8px;
                color: white;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;

                &:hover {
                    background: ${THEME.colors.accentLight};
                }
            `;

            saveButton.onclick = () => {
                labelWidget.value = labelInput.value;
                textWidget.value = textarea.value;
                weightWidget.value = parseFloat(weightInput.value);
                this.saveToHistory(textarea.value);
                dialog.remove();
                this.setDirtyCanvas(true);
            };

            // Close Button (X)
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '×';
            closeBtn.style.cssText = `
                background: none;
                border: none;
                color: ${THEME.colors.textDim};
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                transition: color 0.2s;

                &:hover {
                    color: ${THEME.colors.text};
                }
            `;

            closeBtn.onclick = () => dialog.remove();

            // Append Save + Close inside buttonContainer
            buttonContainer.appendChild(saveButton);
            buttonContainer.appendChild(closeBtn);

            // Append elements to header
            header.appendChild(title);
            header.appendChild(buttonContainer);

            // Append header to the content
            content.appendChild(header);

            // **NEW: Scrollable Content Wrapper**
            const contentWrapper = document.createElement('div');
            contentWrapper.style.cssText = `
                flex-grow: 1;
                overflow-y: auto;
                padding: 0px;
                margin: -${THEME.sizes.spacing.sm}px;
                scrollbar-width: thin;
                scrollbar-color: ${THEME.colors.border} transparent;
                max-height: calc(80vh - 60px); /* Adjust based on header height */
            `;
            content.appendChild(contentWrapper);      
            
            const labelGroup = document.createElement('div');
            labelGroup.style.cssText = `
              display: flex;
              flex-direction: column;
              margin-bottom: 8px;
            `;
        
            const labelLabel = document.createElement('label');
            labelLabel.textContent = 'Prompt Name:';
            labelLabel.style.cssText = `
              color: ${THEME.colors.textDim};
              font-size: ${THEME.sizes.fontSize.normal}px;
              margin-bottom: 4px;
            `;
        
            const labelInput = document.createElement('input');
            labelInput.type = 'text';
            labelInput.value = labelWidget.value || '';  // existing label or empty
            labelInput.style.cssText = `
              width: 100%;
              background: ${THEME.colors.surface.base};
              border: 1px solid ${THEME.colors.border};
              border-radius: 4px;
              padding: 6px;
              color: ${THEME.colors.text};
              font-family: ${THEME.typography.fonts.primary};
            `;
        
            labelGroup.appendChild(labelLabel);
            labelGroup.appendChild(labelInput);
            contentWrapper.appendChild(labelGroup);

            const textarea = document.createElement('textarea');
            textarea.value = textWidget.value || '';
            textarea.style.cssText = `
                width: 100%;
                height: 120px;
                background: ${THEME.colors.surface.base};
                border: 1px solid ${THEME.colors.border};
                border-radius: ${THEME.sizes.borderRadius}px;
                padding: ${THEME.sizes.spacing.md}px;
                color: ${THEME.colors.text};
                font-size: ${THEME.sizes.fontSize.normal}px;
                font-family: ${THEME.typography.fonts.primary};
                line-height: 1.5;
                resize: vertical;
                margin-bottom: ${THEME.sizes.spacing.md}px;
            `;
            contentWrapper.appendChild(textarea);

            //Append pre-set container after text area
            const presetContainer = document.createElement('div');
            presetContainer.style.cssText = `
                display: flex;
                gap: 8px;
                margin-bottom: 8px;
                overflow-x: auto;
                white-space: nowrap;
                padding-bottom: 4px;
                scrollbar-width: thin;
                scrollbar-color: ${THEME.colors.border} transparent;
                &::-webkit-scrollbar {
                    height: 6px;
                }
                &::-webkit-scrollbar-track {
                    background: transparent;
                }
                &::-webkit-scrollbar-thumb {
                    background-color: ${THEME.colors.border};
                    border-radius: 3px;
                }
            `;
            
            Object.entries(THEME.promptPresets).forEach(([category, categoryData]) => {
                if (!categoryData || !categoryData.presets) return;

                const select = document.createElement('select');
                select.style.cssText = `
                    background: ${THEME.colors.bgActive};
                    border: 1px solid ${THEME.colors.border};
                    color: ${THEME.colors.text};
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    min-width: 100px;
                    cursor: pointer;
                    outline: none;
                    flex-shrink: 0;
                    &:hover {
                        border-color: ${THEME.colors.accent};
                    }
                `;
                
                const defaultOption = document.createElement('option');
                defaultOption.text = `${categoryData.icon || ''} ${category.charAt(0).toUpperCase() + category.slice(1)}`;
                defaultOption.value = '';
                select.appendChild(defaultOption);
                
                categoryData.presets.forEach(preset => {
                    const option = document.createElement('option');
                    option.text = preset.label;
                    option.value = preset.value;
                    select.appendChild(option);
                });
                
                select.addEventListener('change', () => {
                    if (select.value) {
                        const currentText = textarea.value.trim();
                        textarea.value = currentText 
                            ? `${currentText}, ${select.value}` 
                            : select.value;
                        
                        textarea.dispatchEvent(new Event('input'));
                        setTimeout(() => {
                            select.value = '';
                        }, 100);
                    }
                });
                
                presetContainer.appendChild(select);
            });
            
            contentWrapper.appendChild(presetContainer);

            const weightGroup = document.createElement('div');
            weightGroup.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 4px;
            `;

            const weightLabel = document.createElement('label');
            weightLabel.textContent = 'Weight';
            weightLabel.style.cssText = `
                color: ${THEME.colors.textDim};
                font-size: ${THEME.sizes.fontSize.normal}px;
            `;

            const weightInput = document.createElement('input');
            weightInput.type = 'number';
            weightInput.value = weightWidget.value;
            weightInput.step = '0.1';
            weightInput.min = '0';
            weightInput.max = '2';
            weightInput.style.cssText = `
                width: 60px;
                background: ${THEME.colors.surface.base};
                border: 1px solid ${THEME.colors.border};
                border-radius: 4px;
                padding: 4px;
                color: ${THEME.colors.text};
                text-align: center;
                font-family: ${THEME.typography.fonts.primary};
            `;

            weightGroup.appendChild(weightLabel);
            weightGroup.appendChild(weightInput);
            contentWrapper.appendChild(weightGroup);

            const toolbar = document.createElement('div');
            toolbar.style.cssText = `
                display: flex;
                gap: 4px;
                margin-bottom: 12px;
                position: relative;
            `;

            const historyDropdown = document.createElement('div');
            historyDropdown.className = 'history-dropdown';
            historyDropdown.style.cssText = `
                display: none;
                position: absolute;
                top: 32px;
                left: 0;
                width: 100%;
                max-height: 200px;
                overflow-y: auto;
                background: ${THEME.colors.surface.base};
                border: 1px solid ${THEME.colors.border};
                border-radius: 4px;
                margin-top: 4px;
                z-index: 1000;
                box-shadow: ${THEME.effects.hover};
            `;

            THEME.promptTools.quickActions.forEach(action => {
                const btn = document.createElement('button');
                btn.innerHTML = action.icon;
                btn.title = action.title;
                btn.style.cssText = `
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: ${THEME.colors.surface.base};
                    border: 1px solid ${THEME.colors.border};
                    border-radius: 4px;
                    color: ${THEME.colors.text};
                    cursor: pointer;
                    transition: all 0.2s;
                    padding: 0;
                    font-size: 14px;

                    &:hover {
                        background: ${THEME.colors.surface.hover};
                        border-color: ${THEME.colors.accent};
                    }

                    &:active {
                        transform: translateY(1px);
                    }
                `;

                btn.onclick = () => {
                    if (action.action === 'history') {
                        historyDropdown.style.display = 
                            historyDropdown.style.display === 'none' ? 'block' : 'none';
                    } else {
                        this.handleQuickAction(action.action, textarea);
                    }
                };

                weightGroup.appendChild(btn);
            });

            const history = this.loadPromptHistory();
            if (history.length > 0) {
                history.forEach(item => {
                    const historyItem = document.createElement('div');
                    historyItem.style.cssText = `
                        padding: 8px 12px;
                        cursor: pointer;
                        border-bottom: 1px solid ${THEME.colors.border};
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 8px;
                        &:hover {
                            background: ${THEME.colors.surface.hover};
                        }
                        &:last-child {
                            border-bottom: none;
                        }
                    `;

                    const textContent = document.createElement('div');
                    textContent.style.cssText = `
                        flex: 1;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    `;
                    textContent.textContent = item.text;

                    const deleteBtn = document.createElement('button');
                    deleteBtn.innerHTML = '🗑️';
                    deleteBtn.title = 'Delete from history';
                    deleteBtn.style.cssText = `
                        background: none;
                        border: none;
                        color: ${THEME.colors.textDim};
                        font-size: 12px;
                        padding: 4px;
                        cursor: pointer;
                        opacity: 0.6;
                        transition: all 0.2s;
                        display: none;

                        &:hover {
                            opacity: 1;
                            color: ${THEME.colors.error || '#ff4444'};
                        }
                    `;

                    historyItem.onmouseenter = () => {
                        deleteBtn.style.display = 'block';
                    };
                    historyItem.onmouseleave = () => {
                        deleteBtn.style.display = 'none';
                    };

                    deleteBtn.onclick = (e) => {
                        e.stopPropagation();
                        const history = this.loadPromptHistory();
                        const updatedHistory = history.filter(h => h.text !== item.text);
                        localStorage.setItem('multitext_history', JSON.stringify(updatedHistory));
                        historyItem.remove();

                        if (updatedHistory.length === 0) {
                            const emptyMessage = document.createElement('div');
                            emptyMessage.style.cssText = `
                                padding: 8px 12px;
                                color: ${THEME.colors.textDim};
                                text-align: center;
                            `;
                            emptyMessage.textContent = 'History is empty';
                            historyDropdown.appendChild(emptyMessage);
                        }
                    };

                    textContent.onclick = () => {
                        this._lastValues.push(textarea.value);
                        textarea.value = item.text;
                        textarea.dispatchEvent(new Event('input'));
                        historyDropdown.style.display = 'none';
                    };

                    historyItem.appendChild(textContent);
                    historyItem.appendChild(deleteBtn);
                    historyDropdown.appendChild(historyItem);
                });
            } else {
                const emptyMessage = document.createElement('div');
                emptyMessage.style.cssText = `
                    padding: 8px 12px;
                    color: ${THEME.colors.textDim};
                    text-align: center;
                `;
                emptyMessage.textContent = 'History is empty';
                historyDropdown.appendChild(emptyMessage);
            }

            weightGroup.appendChild(historyDropdown);
            contentWrapper.appendChild(toolbar);

            const templateSection = document.createElement('div');
            templateSection.style.cssText = `
                margin-bottom: 16px;
                border-radius: 8px;
                background: ${THEME.colors.bgActive}20;
                padding: 12px;
            `;

            const templateHeader = document.createElement('div');
            templateHeader.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 12px;
                cursor: pointer;
                user-select: none;
            `;

            const templateTitle = document.createElement('div');
            templateTitle.innerHTML = '📝 Ready Templates ';
            templateTitle.style.cssText = `
                font-size: 13px;
                font-weight: 500;
                color: ${THEME.colors.textDim};
            `;

            const toggleIcon = document.createElement('div');
            toggleIcon.textContent = '▼';
            toggleIcon.style.cssText = `
                font-size: 12px;
                color: ${THEME.colors.textDim};
                transition: transform 0.2s;
            `;

            templateHeader.appendChild(templateTitle);
            templateHeader.appendChild(toggleIcon);
            templateSection.appendChild(templateHeader);

            const templateGrid = document.createElement('div');
            templateGrid.style.cssText = `
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                gap: 8px;
                overflow-y: auto;
                max-height: 0px;
                transition: max-height 0.3s ease-out;
                padding-right: 8px;
                margin-right: -8px;
                scrollbar-width: thin;
                scrollbar-color: ${THEME.colors.border} transparent;

                &::-webkit-scrollbar {
                    width: 6px;
                }
                &::-webkit-scrollbar-track {
                    background: transparent;
                }
                &::-webkit-scrollbar-thumb {
                    background-color: ${THEME.colors.border};
                    border-radius: 3px;
                }
            `;

            let isTemplatesVisible = false;
            const toggleTemplates = () => {
                isTemplatesVisible = !isTemplatesVisible;
                toggleIcon.style.transform = isTemplatesVisible ? 'rotate(180deg)' : 'rotate(0)';
                templateGrid.style.maxHeight = isTemplatesVisible ? '500px' : '0';
                templateGrid.style.marginTop = isTemplatesVisible ? '12px' : '0';
            };

            templateHeader.onclick = toggleTemplates;

            Object.entries(THEME.promptTemplates).forEach(([category, { icon, label, templates }]) => {
                templates.forEach(template => {
                    const templateBtn = document.createElement('button');
                    templateBtn.style.cssText = `
                        background: ${THEME.colors.bgActive};
                        border: 1px solid ${THEME.colors.border};
                        border-radius: 6px;
                        padding: 8px;
                        color: ${THEME.colors.text};
                        font-size: 12px;
                        cursor: pointer;
                        text-align: left;
                        width: 100%;
                        transition: all 0.2s;
                        &:hover {
                            background: ${THEME.colors.bgHover};
                            border-color: ${THEME.colors.accent};
                        }
                    `;

                    const templateHeader = document.createElement('div');
                    templateHeader.style.cssText = `
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        margin-bottom: 4px;
                        font-weight: 500;
                    `;
                    templateHeader.innerHTML = `${icon} ${template.name}`;
                    
                    const templateInfo = document.createElement('div');
                    templateInfo.style.cssText = `
                        font-size: 11px;
                        color: ${THEME.colors.textDim};
                        display: flex;
                        justify-content: space-between;
                        margin-top: 4px;
                    `;
                    templateInfo.innerHTML = `
                        <span>${label}</span>
                        <span>${template.weight.toFixed(1)}</span>
                    `;

                    templateBtn.appendChild(templateHeader);
                    templateBtn.appendChild(templateInfo);

                    templateBtn.onclick = () => {
                        textarea.value = template.prompt;
                        weightInput.value = template.weight;
                        textarea.dispatchEvent(new Event('input'));
                    };

                    templateGrid.appendChild(templateBtn);
                });
            });

            templateSection.appendChild(templateGrid);
            contentWrapper.appendChild(templateSection);



            dialog.appendChild(content);
            document.body.appendChild(dialog);
            // 1) Get the graph container’s bounding box
            const container = document.querySelector('.graph-canvas-container');
            const containerRect = container.getBoundingClientRect();

            // 2) Position the dialog (desiredLeft, desiredTop = where you'd like it to go)
            const dialogRect = dialog.getBoundingClientRect();
            let desiredLeft = (window.innerWidth - dialogRect.width) / 2;
            let desiredTop  = (window.innerHeight - dialogRect.height) / 2;

            // 3) Clamp so the dialog stays fully within containerRect
            //    (left/right, top/bottom)
            const clampedLeft = Math.max(
            containerRect.left,
            Math.min(containerRect.right - dialogRect.width, desiredLeft)
            );

            const clampedTop = Math.max(
            containerRect.top,
            Math.min(containerRect.bottom - dialogRect.height, desiredTop)
            );

            // 4) Apply the clamped coords
            dialog.style.left = clampedLeft + 'px';
            dialog.style.top  = clampedTop + 'px';
            dialog.style.transform = 'none';

            textarea.focus();

        } catch (error) {
            console.error('Dialog oluşturma hatası:', error);
        }
    },

    onDrawForeground(ctx) {
        if (!ctx || this.flags.collapsed) return;

        const margin = STYLES.row.padding;
        const rowHeight = STYLES.row.height;
        const rowMargin = STYLES.row.margin;
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

                // Draw a small toggle box on the left side:
                this.drawToggle(
                    ctx,
                    margin + 4,      // x offset
                    y + rowHeight/2, // center y
                    enabledWidget.value // true/false
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
        const width = 30;  // Width of the switch
        const height = 14;  // Height of the switch
        const radius = height / 2;  // Rounded corners
        const toggleX = x;
        const toggleY = centerY - height / 2;
    
        // Background color (track)
        ctx.save();
        ctx.fillStyle = isEnabled ? THEME.colors.accent : THEME.colors.border;
        ctx.beginPath();
        ctx.roundRect(toggleX, toggleY, width, height, radius);
        ctx.fill();
    
        // Handle (circle inside)
        const handleRadius = radius - 2;
        const handleX = isEnabled ? toggleX + width - handleRadius * 2 - 2 : toggleX + 2;
        const handleY = toggleY + 2;
    
        ctx.fillStyle = THEME.colors.text;
        ctx.beginPath();
        ctx.arc(handleX + handleRadius, handleY + handleRadius, handleRadius, 0, Math.PI * 2);
        ctx.fill();
    
        ctx.restore();
    },    

    drawPromptRow(ctx, x, y, index, text, weight) {
        const rowWidth = this.size[0] - (STYLES.row.padding * 2);
        const centerY = y + (STYLES.row.height/2) + 4;
        
        const maxTextWidth = rowWidth - STYLES.weight.width;
        
        const displayText = text || `Prompt ${index + 1}`;
        Renderer.drawPromptRow(ctx, x, y, displayText, weight, rowWidth);
    },

    updateCache() {
        const canvas = document.createElement('canvas');
        canvas.width = this.size[0];
        canvas.height = this.size[1];
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;
        
        this.drawNodeContents(ctx);
        this.cachedCanvas = canvas;
        this.lastUpdate = Date.now();
    },

    drawFromCache(ctx) {
        if (!ctx || this.flags.collapsed) return;
        
        if (this.cachedCanvas) {
            ctx.drawImage(this.cachedCanvas, 0, 0);
        }
    },

    drawWeightValue(ctx, x, y, weight) {
        const width = 32;
        const height = 3;
        ctx.fillStyle = THEME.colors.bgActive;
        ctx.fillRect(x, y + 28, width, height);
        ctx.fillStyle = THEME.colors.accent;
        ctx.fillRect(x, y + 28, width * (weight / 2), height);
    },

    requestDraw() {
        if (this._drawRequested) return;
        this._drawRequested = true;
        requestAnimationFrame(() => {
            this._drawRequested = false;
            this.setDirtyCanvas(true);
        });
    },

    getHoveredWidgetIndex(pos) {
        const margin = STYLES.row.padding;
        const rowHeight = STYLES.row.height;
        const rowMargin = STYLES.row.margin;
        
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

    updateAnimations() {
        this.hoverStates.forEach(state => {
            if (state.isHovered && state.progress < 1) {
                state.progress = Math.min(1, state.progress + 0.1);
            } else if (!state.isHovered && state.progress > 0) {
                state.progress = Math.max(0, state.progress - 0.1);
            }
        });

        if (this.hoverStates.some(state => state.progress > 0 && state.progress < 1) ||
            this.ripples.length > 0) {
            this.requestDraw();
        }
    },

    loadPromptHistory() {
        return JSON.parse(localStorage.getItem('multitext_history') || '[]');
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
            
            localStorage.setItem('multitext_history', JSON.stringify(history.slice(0, 20)));
        } catch (error) {
            console.error('Error saving history:', error);
        }
    },

    handleQuickAction(action, textarea) {
        switch (action) {
            case 'clear':
                if (textarea.value) {
                    textarea.value = '';
                    textarea.dispatchEvent(new Event('input'));
                }
                break;
        }
    },

    addPrompt() {
        if (this.activePrompts < this.maxPrompts) {
            this.activePrompts++;
    
            // **Find the new enabledX widget and disable it by default**
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
        const margin = STYLES.row.padding;
        const buttonSize = THEME.controls.button.size;
        const buttonMargin = THEME.controls.button.margin;
        
        const controlsY = margin + (this.activePrompts * (STYLES.row.height + STYLES.row.margin)) + buttonMargin;
        const addX = this.size[0] - margin - buttonSize;
        const removeX = addX - buttonSize - buttonMargin;
        const separatorX = margin;
        const toggleX = margin + buttonSize + buttonMargin + 10; // Toggle position
        const toggleWidth = 40;
        const toggleHeight = 20;

        return {
            add: x >= addX && x <= addX + buttonSize && 
                 y >= controlsY && y <= controlsY + buttonSize,
            remove: x >= removeX && x <= removeX + buttonSize && 
                   y >= controlsY && y <= controlsY + buttonSize,
            separator: x >= separatorX && x <= separatorX + buttonSize && 
                      y >= controlsY && y <= controlsY + buttonSize,
            toggle: x >= toggleX && x <= toggleX + toggleWidth && 
                    y >= controlsY && y <= controlsY + toggleHeight 
        };
    },

    drawControlButtons(ctx) {
        const margin = STYLES.row.padding;
        const buttonSize = THEME.controls.button.size;
        const buttonMargin = THEME.controls.button.margin;
        const toggleX = margin + buttonSize + buttonMargin + 20; // Position right of separator

        const y = margin + (this.activePrompts * (STYLES.row.height + STYLES.row.margin)) + buttonMargin;
        const addX = this.size[0] - margin - buttonSize;
        const removeX = addX - buttonSize - buttonMargin;

        const separatorX = margin;
        ctx.fillStyle = THEME.controls.button.colors.bg;
        Utils.drawRoundedRect(ctx, separatorX, y, buttonSize, buttonSize, THEME.controls.button.borderRadius);
        
        ctx.fillStyle = THEME.controls.button.colors.text;
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⋮', separatorX + buttonSize/2, y + buttonSize/2);

         // **Toggle Switch for Single/Multi-Prompt Mode**
        this.drawToggleSwitch(ctx, toggleX, y, buttonSize, this.isSinglePromptMode);

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
    },

    drawToggleSwitch(ctx, x, y, size, isSingleMode) {
        const width = 40; // Toggle width
        const height = 20; // Toggle height
        const radius = height / 2;
        const offset = 15; // Shift to the right by 10px
        const toggleX = x + offset; // Shifted toggle position
        const toggleY = y + (size - height) / 2;
    
        // Labels
        ctx.fillStyle = THEME.colors.textDim;
        ctx.font = `12px ${THEME.typography.fonts.primary}`;
        ctx.textAlign = "right";
        ctx.fillText("Multi", toggleX - 5, toggleY + height / 1.5); // Left Label
    
        ctx.textAlign = "left";
        ctx.fillText("Single", toggleX + width + 4, toggleY + height / 1.5); // Right Label
    
        // Background (track)
        ctx.fillStyle = isSingleMode ? THEME.colors.accent : THEME.colors.border;
        ctx.beginPath();
        ctx.roundRect(toggleX, toggleY, width, height, radius);
        ctx.fill();
    
        // Handle (circle)
        const handleRadius = radius - 3;
        const handleX = isSingleMode ? toggleX + width - handleRadius * 2 - 4 : toggleX + 4;
        const handleY = toggleY + 4;
    
        ctx.fillStyle = THEME.colors.text;
        ctx.beginPath();
        ctx.arc(handleX + handleRadius, handleY + handleRadius, handleRadius, 0, Math.PI * 2);
        ctx.fill();
    },    

    updateNodeSize() {
        const margin = STYLES.row.padding;
        const rowHeight = STYLES.row.height;
        const rowMargin = STYLES.row.margin;
        const buttonSize = THEME.controls.button.size;
        const buttonMargin = THEME.controls.button.margin;

        const totalHeight = margin + 
                           (this.activePrompts * (rowHeight + rowMargin)) + 
                           buttonMargin + 
                           buttonSize + 
                           margin;

        this.size[0] = Math.max(280, this.size[0]);
        this.size[1] = totalHeight;
        this.setDirtyCanvas(true);
    },

    onResize(size) {
        const margin = STYLES.row.padding;
        const rowHeight = STYLES.row.height;
        const rowMargin = STYLES.row.margin;
        const buttonSize = THEME.controls.button.size;
        const buttonMargin = THEME.controls.button.margin;

        const minHeight = margin + 
                         (this.activePrompts * (rowHeight + rowMargin)) + 
                         buttonMargin + 
                         buttonSize + 
                         margin;

        size[0] = Math.max(280, size[0]);
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

    onMouseMove(event, pos) {
        const index = this.getHoveredWidgetIndex(pos);
        if(app.ui.settings.getSettingValue("SKB.ShowTooltips", false)){
        if (this.currentHoverIndex === index) {
            if (this.tooltipState.visible) {
                this.tooltipState.x = pos[0];
                this.tooltipState.y = pos[1];
                this.setDirtyCanvas(true);
            }
            return;
        }
        
        this.currentHoverIndex = index;

        this.visualWidgets.forEach((widget, i) => {
            widget.isHovered = i === index;
        });

        if (index !== -1) {
            const textWidget = this.widgets.find(w => w.name === `text${index + 1}`);
            if (textWidget?.value) {
                this.tooltipState = {
                    visible: true,
                    text: textWidget.value,
                    x: pos[0],
                    y: pos[1]
                };
            } else {
                this.tooltipState.visible = false;
            }
        } else {
            this.tooltipState.visible = false;
        }

        this.setDirtyCanvas(true);
        } else {
            this.tooltipState.visible = false;
            this.setDirtyCanvas(true);
        }

        
    },

    combine_text(separator=" ", active=true, kwargs) {
        if (!active) {
            return [""];
        }
    
        const texts = [];
    
        for (let i = 1; i <= 20; i++) {
            // Check if the prompt is enabled
            const isEnabled = kwargs[`enabled${i}`];
            if (isEnabled === false) {
                // skip if disabled
                continue;
            }
    
            // parse weight safely (with fallback=1.0)
            let weightRaw = kwargs[`weight${i}`];
            if (weightRaw == null || isNaN(parseFloat(weightRaw))) {
                weightRaw = 1.0;
            }
            const weight = parseFloat(weightRaw);
    
            const text = (kwargs[`text${i}`] || "").trim();
            if (text) {
                if (weight === 1.0) {
                    texts.push(text);
                } else {
                    texts.push(`(${text}:${weight.toFixed(1)})`);
                }
            }
        }
    
        return [texts.join(separator)];
    },
    

    loadPresets() {
        try {
            const savedPresets = localStorage.getItem(this.PRESETS_KEY);
            this.presets = savedPresets ? JSON.parse(savedPresets) : {};
        } catch (error) {
            console.error('Presetler yüklenemedi:', error);
            this.presets = {};
        }
    },

    deletePreset(name) {
        delete this.presets[name];
        try {
            localStorage.setItem(this.PRESETS_KEY, JSON.stringify(this.presets));
        } catch (error) {
            console.error('Preset silinemedi:', error);
        }
    },

    showPresetMenu(pos, ctx) {
        const menu = document.createElement('div');
        menu.style.cssText = `
            position: fixed;
            z-index: 10000;
            background: ${THEME.colors.bg};
            border: 1px solid ${THEME.colors.border};
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            padding: 8px;
            min-width: 200px;
            max-height: 400px;
            overflow-y: auto;
            font-family: ${THEME.typography.fonts.primary};
        `;

        Object.entries(THEME.promptPresets).forEach(([category, { icon, presets }]) => {
            if (presets && presets.length > 0) {
                const categoryTitle = document.createElement('div');
                categoryTitle.style.cssText = `
                    padding: 8px 12px;
                    color: ${THEME.colors.textDim};
                    font-size: 13px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                `;
                categoryTitle.innerHTML = `${icon} ${category.charAt(0).toUpperCase() + category.slice(1)}`;
                menu.appendChild(categoryTitle);

                presets.forEach(preset => {
                    const item = document.createElement('div');
                    item.style.cssText = `
                        display: flex;
                        align-items: center;
                        padding: 6px 12px;
                        cursor: pointer;
                        border-radius: 4px;
                        transition: background 0.1s;
                        color: ${THEME.colors.text};
                        font-size: 13px;
                        position: relative;
                    `;

                    item.addEventListener('mouseenter', () => {
                        item.style.background = THEME.colors.bgHover;
                    });
                    item.addEventListener('mouseleave', () => {
                        item.style.background = 'transparent';
                    });

                    const label = document.createElement('span');
                    label.textContent = preset.label;
                    label.style.flex = '1';
                    item.appendChild(label);

                    const deleteBtn = document.createElement('span');
                    deleteBtn.innerHTML = '✕';
                    deleteBtn.style.cssText = `
                        display: inline-block;
                        margin-left: 8px;
                        color: #ff4444;
                        font-size: 14px;
                        cursor: pointer;
                        padding: 2px 6px;
                    `;

                    deleteBtn.onclick = (e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete the preset "${preset.label}"?`)) {
                            THEME.promptPresets[category].presets = THEME.promptPresets[category].presets.filter(p => 
                                p.value !== preset.value || p.label !== preset.label
                            );
                            try {
                                localStorage.setItem('multitext_category_presets', JSON.stringify(THEME.promptPresets));
                                item.remove();
                            } catch (error) {
                                console.error('Preset silme hatası:', error);
                            }
                        }
                    };

                    item.onclick = () => {
                        const textWidget = this.widgets.find(w => w.name === 'text1');
                        if (textWidget) {
                            textWidget.value = preset.value;
                            if (textWidget.callback) textWidget.callback(preset.value);
                        }
                        menu.remove();
                    };

                    item.appendChild(deleteBtn);
                    menu.appendChild(item);
                });
            }
        });

        const rect = ctx.canvas.getBoundingClientRect();
        const [nodeX, nodeY] = this.pos;
        const width = this.size[0];
        
        menu.style.left = `${rect.left + nodeX + width - 30}px`;
        menu.style.top = `${rect.top + nodeY + 30}px`;

        document.body.appendChild(menu);

        const menuRect = menu.getBoundingClientRect();
        if (menuRect.right > window.innerWidth) {
            menu.style.left = `${window.innerWidth - menuRect.width - 10}px`;
        }
        if (menuRect.bottom > window.innerHeight) {
            menu.style.top = `${window.innerHeight - menuRect.height - 10}px`;
        }

        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('mousedown', closeMenu);
            }
        };
        document.addEventListener('mousedown', closeMenu);
    },

    isInsidePresetButton(x, y) {
        const [nodeX, nodeY] = this.pos;
        const width = this.size[0];
        const height = this.size[1];
        
        const buttonX = nodeX + width - 30;
        const buttonY = nodeY + 5;
        
        const buttonWidth = 24;
        const buttonHeight = 24;
        
        const isInside = x >= buttonX && x <= buttonX + buttonWidth && 
                        y >= buttonY && y <= buttonY + buttonHeight;
        
        console.log("Preset buton kontrolü:", {
            mouseX: x,
            mouseY: y,
            buttonX,
            buttonY,
            isInside
        });
        
        return isInside;
    },

    showSavePresetDialog(text) {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            z-index: 10000;
            background: ${THEME.colors.bg};
            border: 1px solid ${THEME.colors.border};
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            padding: 16px;
            min-width: 300px;
            font-family: ${THEME.typography.fonts.primary};
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
        `;

        const title = document.createElement('div');
        title.textContent = 'Preset Kaydet';
        title.style.cssText = `
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid ${THEME.colors.border};
            color: ${THEME.colors.text};
        `;
        dialog.appendChild(title);

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Preset adı';
        nameInput.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-bottom: 12px;
            border: 1px solid ${THEME.colors.border};
            border-radius: 4px;
            background: ${THEME.colors.surface.base};
            color: ${THEME.colors.text};
            font-size: 14px;
        `;
        dialog.appendChild(nameInput);

        const categorySelect = document.createElement('select');
        categorySelect.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-bottom: 16px;
            border: 1px solid ${THEME.colors.border};
            border-radius: 4px;
            background: ${THEME.colors.surface.base};
            color: ${THEME.colors.text};
            font-size: 14px;
        `;

        const categories = [
            { value: 'quality', label: '✨ Quality' },
            { value: 'style', label: '🎨 Style' },
            { value: 'lighting', label: '💡 Lighting' },
            { value: 'camera', label: '📷 Camera' },
            { value: 'mood', label: '🎭 Mood' },
            { value: 'environment', label: '🌍 Environment' }
        ];

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.value;
            option.textContent = category.label;
            categorySelect.appendChild(option);
        });

        dialog.appendChild(categorySelect);

        const buttons = document.createElement('div');
        buttons.style.cssText = `
            display: flex;
                gap: 8px;
            justify-content: flex-end;
        `;

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'İptal';
        cancelBtn.style.cssText = `
            padding: 8px 16px;
            border: 1px solid ${THEME.colors.border};
            border-radius: 4px;
            background: ${THEME.colors.surface.base};
            color: ${THEME.colors.text};
            cursor: pointer;
                &:hover {
                background: ${THEME.colors.surface.hover};
            }
        `;
        cancelBtn.onclick = () => dialog.remove();

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Kaydet';
        saveBtn.style.cssText = `
            padding: 8px 16px;
            border: none;
                border-radius: 4px;
            background: ${THEME.colors.accent};
            color: white;
            cursor: pointer;
                &:hover {
                background: ${THEME.colors.accentLight};
            }
        `;
        
        saveBtn.onclick = () => {
            const name = nameInput.value.trim();
            const category = categorySelect.value;
            
            if (name) {
                if (!THEME.promptPresets[category].presets) {
                    THEME.promptPresets[category].presets = [];
                }
                
                THEME.promptPresets[category].presets = THEME.promptPresets[category].presets.filter(preset => 
                    preset.value !== text && preset.label !== name
                );
                
                THEME.promptPresets[category].presets.push({
                    value: text,
                    label: name
                });

                try {
                    localStorage.setItem('multitext_category_presets', JSON.stringify(THEME.promptPresets));
                    console.log(`Preset "${name}" başarıyla ${category} kategorisine kaydedildi`);
                } catch (error) {
                    console.error('Preset kaydetme hatası:', error);
                }

                dialog.remove();
                this.setDirtyCanvas(true);
            }
        };

        buttons.appendChild(cancelBtn);
        buttons.appendChild(saveBtn);
        dialog.appendChild(buttons);

        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveBtn.click();
            }
        });

        document.body.appendChild(dialog);
        nameInput.focus();
    },

    createPresetItem(preset, category, menu) {
        const item = document.createElement('div');
        item.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 12px;
            cursor: pointer;
            color: ${THEME.colors.text};
            font-size: 13px;
        `;

        const label = document.createElement('span');
        label.textContent = preset.label;
        label.style.flex = '1';
        item.appendChild(label);

        const deleteBtn = document.createElement('div');
        deleteBtn.textContent = '✕';
        deleteBtn.style.cssText = `
            display: inline-block;
            color: red;
            font-size: 16px;
            cursor: pointer;
            padding: 0 8px;
            margin-left: 8px;
        `;

        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete the preset "${preset.label}"?`)) {
                const categoryPresets = THEME.promptPresets[category].presets;
                const index = categoryPresets.findIndex(p => p.label === preset.label);
                if (index > -1) {
                    categoryPresets.splice(index, 1);
                    localStorage.setItem('multitext_category_presets', JSON.stringify(THEME.promptPresets));
                    item.remove();
                }
            }
        };

        item.onclick = () => {
            const textWidget = this.widgets.find(w => w.name === 'text1');
            if (textWidget) {
                textWidget.value = preset.value;
                textWidget.callback?.(preset.value);
            }
            menu.remove();
        };

        item.appendChild(deleteBtn);
        return item;
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

    drawNodeContents(ctx) {
        const margin = THEME.sizes.margin;
        let y = margin;

        for (let i = 0; i < this.activePrompts; i++) {
            const textWidget = this.widgets.find(w => w.name === `text${i + 1}`);
            const weightWidget = this.widgets.find(w => w.name === `weight${i + 1}`);
            
            if (textWidget && weightWidget) {
                if (i === this.currentHoverIndex) {
                    ctx.fillStyle = THEME.colors.bgHover;
                } else {
                    ctx.fillStyle = THEME.colors.bg;
                }
                
                Utils.drawRoundedRect(
                    ctx, 
                    margin, 
                    y, 
                    this.size[0] - margin * 2, 
                    STYLES.row.height,
                    THEME.sizes.borderRadius
                );

                ctx.fillStyle = THEME.colors.text;
                ctx.font = `13px ${THEME.typography.fonts.primary}`;
                ctx.textBaseline = 'middle';
                const text = textWidget.value || `Prompt ${i + 1}`;
                const truncatedText = Utils.truncateTextEfficient(
                    ctx, 
                    text, 
                    this.size[0] - margin * 4 - STYLES.weight.width
                );
                ctx.fillText(truncatedText, margin + 12, y + STYLES.row.height/2);

                this.drawWeight(
                    ctx,
                    weightWidget.value,
                    this.size[0] - margin - STYLES.weight.width,
                    y + STYLES.row.height/2 - 8
                );

                y += STYLES.row.height + STYLES.row.margin;
            }
        }

        this.drawControlButtons(ctx);
    },

    createHistoryItem(item, textarea, historyDropdown) {
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            &:hover {
                background: ${THEME.colors.bgHover};
            }
        `;

        const text = document.createElement('div');
        text.textContent = item.text.substring(0, 40) + (item.text.length > 40 ? '...' : '');
        text.style.flex = 1;

        const date = document.createElement('div');
        date.textContent = formatDate(item.timestamp);
        date.style.cssText = `
            font-size: 11px;
            color: ${THEME.colors.textDim};
        `;

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = 'Delete from history';
        deleteBtn.style.cssText = `
            background: none;
            border: none;
            color: ${THEME.colors.textDim};
            font-size: 12px;
            padding: 4px;
            cursor: pointer;
            opacity: 0.6;
            transition: all 0.2s;
            display: none;

            &:hover {
                opacity: 1;
                color: ${THEME.colors.error || '#ff4444'};
            }
        `;

        container.onmouseenter = () => {
            deleteBtn.style.display = 'block';
        };
        container.onmouseleave = () => {
            deleteBtn.style.display = 'none';
        };

        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            const history = JSON.parse(localStorage.getItem('multitext_history') || '[]');
            const updatedHistory = history.filter(h => h.text !== item.text);
            localStorage.setItem('multitext_history', JSON.stringify(updatedHistory));
            container.remove();

            if (updatedHistory.length === 0) {
                historyDropdown.innerHTML = `
                    <div style="padding: 8px 12px; color: ${THEME.colors.textDim}; text-align: center;">
                        History is empty
                    </div>
                `;
            }
        };

        text.onclick = () => {
            textarea.value = item.text;
            textarea.dispatchEvent(new Event('input'));
            historyDropdown.style.display = 'none';
        };

        container.appendChild(text);
        container.appendChild(date);
        container.appendChild(deleteBtn);

        return container;
    }
};

const createWeightControls = (weightInput) => {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        align-items: center;
        gap: 4px;
    `;

    const decreaseBtn = document.createElement('button');
    decreaseBtn.textContent = '-';
    const increaseBtn = document.createElement('button');
    [decreaseBtn, increaseBtn].forEach(btn => {
        btn.style.cssText = `
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${THEME.colors.bgActive};
            border: 1px solid ${THEME.colors.border};
            border-radius: 4px;
            color: ${THEME.colors.text};
            cursor: pointer;
            user-select: none;
            &:hover {
                background: ${THEME.colors.bgHover};
            }
        `;
    });

    decreaseBtn.onclick = () => {
        const newValue = Math.max(0, parseFloat(weightInput.value) - 0.1);
        weightInput.value = newValue.toFixed(1);
    };

    increaseBtn.onclick = () => {
        const newValue = Math.min(2, parseFloat(weightInput.value) + 0.1);
        weightInput.value = newValue.toFixed(1);
    };

    container.appendChild(decreaseBtn);
    container.appendChild(weightInput);
    container.appendChild(increaseBtn);

    return container;
};

const setupTextarea = (textarea) => {
    const container = document.createElement('div');
    container.style.cssText = `
        position: relative;
        width: 100%;
        margin-bottom: ${THEME.sizes.spacing.md}px;
    `;

    const counter = document.createElement('div');
    counter.style.cssText = `
        position: absolute;
        bottom: -18px;
        right: 0;
        font-size: 11px;
        color: ${THEME.colors.textDim};
    `;

    const updateCounter = () => {
        const count = textarea.value.length;
        counter.textContent = `${count} characters`;
        counter.style.color = count > 500 ? THEME.colors.warning : THEME.colors.textDim;
    };

    textarea.addEventListener('input', () => {
        updateCounter();
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(300, textarea.scrollHeight) + 'px';
    });

    container.appendChild(textarea);
    container.appendChild(counter);
    updateCounter();

    return container;
};

const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff/60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)} hr ago`;
    return date.toLocaleDateString('en-US');
};

app.registerExtension({
    name: "SKB.MultiText",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name !== "MultiTextNode") return;
        
        Object.assign(nodeType.prototype, MultiTextNode);
        
        nodeType.prototype.loadFonts();
    }
});

app.ui.settings.addSetting({
    id: "SKB.ShowTooltips",
    name: "Show Multi-Text tooltips on hover?",
    type: "boolean",
    defaultValue: false,
});