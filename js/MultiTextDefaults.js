export const defaultPresets = {
    quality: {
        icon: "✨",
        presets: [
            { value: "masterpiece", label: "Masterpiece" },
            { value: "best quality", label: "Best Quality" },
            { value: "ultra detailed", label: "Ultra Detailed" },
            { value: "high resolution", label: "High Resolution" },
            { value: "8k uhd", label: "8K UHD" },
            { value: "professional", label: "Professional" },
            { value: "vibrant colors", label: "Vibrant Colors" },
            { value: "high contrast", label: "High Contrast" },
            { value: "soft focus", label: "Soft Focus" }
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
            { value: "photorealistic", label: "Photorealistic" },
            { value: "sketch", label: "Sketch" },
            { value: "impressionism", label: "Impressionism" },
            { value: "surrealism", label: "Surrealism" },
            { value: "abstract", label: "Abstract" },
            { value: "pixel art", label: "Pixel Art" }
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
            { value: "neon lighting", label: "Neon" },
            { value: "backlighting", label: "Backlighting" },
            { value: "high key", label: "High Key" },
            { value: "low key", label: "Low Key" },
            { value: "natural light", label: "Natural Light" },
            { value: "flash lighting", label: "Flash Lighting" }
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
            { value: "macro shot", label: "Macro" },
            { value: "fisheye", label: "Fisheye" },
            { value: "long exposure", label: "Long Exposure" },
            { value: "night shot", label: "Night Shot" },
            { value: "overhead shot", label: "Overhead Shot" },
            { value: "tilt-shift", label: "Tilt-Shift" }
        ]
    },
    composition: {
        icon: "📐",
        presets: [
            { value: "joyful", label: "Joyful" },
            { value: "gloomy", label: "Gloomy" },
            { value: "serene", label: "Serene" },
            { value: "enigmatic", label: "Enigmatic" },
            { value: "grand", label: "Grand" },
            { value: "whimsical", label: "Whimsical" },
            { value: "futuristic", label: "Futuristic" },
            { value: "mysterious", label: "Mysterious" },
            { value: "nostalgic", label: "Nostalgic" },
            { value: "playful", label: "Playful" },
            { value: "dramatic", label: "Dramatic" }
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
            { value: "space scene", label: "Space" },
            { value: "medieval village", label: "Medieval" },
            { value: "desert oasis", label: "Desert" },
            { value: "frozen tundra", label: "Frozen" },
            { value: "enchanted forest", label: "Enchanted" }
        ]
    }
};

export const defaultTemplates = {
    character: {
        icon: "👤",
        label: "Character",
        templates: [
            { 
                name: "Portrait",
                prompt: "portrait photo, centered composition, professional lighting, detailed face, natural expression",
                weight: 1.2
            },
            { 
                name: "Full Body",
                prompt: "full body photo, rule of thirds, studio lighting, detailed clothing, natural pose",
                weight: 1.0
            },
            {
                name: "Action",
                prompt: "dynamic action shot, motion composition, dramatic lighting, detailed movement",
                weight: 1.1
            },
            {
                name: "Fantasy Character",
                prompt: "fantasy character portrait, intricate costume, magical lighting, expressive features",
                weight: 1.3
            },
            {
                name: "Villain",
                prompt: "dramatic villain shot, dark lighting, intense expression, detailed costume",
                weight: 1.4
            },
            {
                name: "Heroic Pose",
                prompt: "heroic character pose, strong silhouette, epic lighting, detailed armor",
                weight: 1.5
            }
        ]
    },
    scene: {
        icon: "🌅",
        label: "Scene",
        templates: [
            {
                name: "Indoor",
                prompt: "indoor scene, natural lighting, detailed room, cozy atmosphere, interior design",
                weight: 1.0
            },
            {
                name: "Outdoor",
                prompt: "outdoor scene, natural lighting, detailed environment, scenic view, landscape composition",
                weight: 1.1
            },
            {
                name: "Urban",
                prompt: "urban scene, street photography, architectural details, dynamic composition",
                weight: 1.0
            },
            {
                name: "Beach",
                prompt: "beach scene, sunset lighting, gentle waves, sandy shore, relaxing atmosphere",
                weight: 1.2
            },
            {
                name: "Mountain",
                prompt: "mountain scene, dramatic lighting, rugged terrain, expansive view, adventurous spirit",
                weight: 1.3
            },
            {
                name: "Forest",
                prompt: "forest scene, dappled sunlight, lush greenery, tranquil setting, nature exploration",
                weight: 1.1
            },
            {
                name: "Waterfall",
                prompt: "waterfall scene, mist-covered falls, serene atmosphere, natural beauty, cascading water",
                weight: 1.2
            },
            {
                name: "Desert",
                prompt: "desert scene, golden hour lighting, sand dunes, arid landscape, desert wildlife",
                weight: 1.0
            },
            {
                name: "Space",  
                prompt: "space scene, cosmic backdrop, starlit composition, futuristic elements, interstellar exploration",
                weight: 1.3
            },
            {
                name: "Medieval",
                prompt: "medieval scene, medieval architecture, detailed details, historical atmosphere, medieval fantasy",
                weight: 1.1
            },
            {
                name: "Cyberpunk",
                prompt: "cyberpunk city, neon lights, futuristic architecture, urban landscape, cybernetic enhancements",
                weight: 1.2
            }
        ]
    },
    style: {
        icon: "🎨",
        label: "Style",
        templates: [
            {
                name: "Line Art",
                prompt: "line art style, clean lines, detailed illustration, minimalist composition",
                weight: 1.0
            },
            {
                name: "Watercolor",
                prompt: "watercolor painting, soft colors, artistic composition, detailed brushwork",
                weight: 1.1
            },
            {
                name: "Digital Art",
                prompt: "digital art style, vibrant colors, detailed illustration, dynamic composition",
                weight: 1.0
            },
            {
                name: "3D Art",
                prompt: "3d render, realistic materials, studio lighting, detailed textures",
                weight: 1.2
            },
            {
                name: "Sketch",
                prompt: "sketch style, rough lines, artistic expression, spontaneous composition",
                weight: 1.0
            },
            {
                name: "Pixel Art",
                prompt: "pixel art style, retro graphics, blocky shapes, nostalgic feel",
                weight: 1.1
            },
            {
                name: "Abstract",
                prompt: "abstract art, vibrant colors, non-representational forms, emotional expression",
                weight: 1.3
            },
            {
                name: "Surrealism",
                prompt: "surreal art, dreamlike scenes, unexpected juxtapositions, imaginative concepts",
                weight: 1.4
            }
        ]
    }
}; 

export const defaultThemeConfig = {
    colors: {
        bg: "#18181B",
        bgHover: "#27272A",
        bgActive: "#3F3F46",
        accent: "#8B5CF6",
        accentLight: "#A78BFA",
        text: "#F4F4F5",
        textDim: "#A1A1AA",
        border: "#27272A",
        bgDarker: "#1E1E2E"
    },
    sizes: {
        borderRadius: 8,
        fontSize: {
            small: 10,
            normal: 11,
            title: 13,
            large: 14
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
        hover: "0 2px 4px rgba(0, 0, 0, 0.1)",
        pressed: "0 1px 2px rgba(0, 0, 0, 0.05)"
    },
    layout: {
        promptRow: {
            height: 32,
            padding: 8,
            margin: 1,
            strokeWidth: 1,
            defaultLabelPrefix: "Prompt "
        },
        minNodeWidth: 280 
    },
    promptTools: {
        quickActions: [
            { icon: "📝", action: "history", title: "History" },
            { icon: "🔄", action: "default", title: "Restore Defaults" },
            { icon: "🗑️", action: "clear", title: "Clear" }
        ]
    },
}; 


export const injectDialogCSS = (THEME) => {
    const styleId = 'multitext-dialog-styles';
    if (document.getElementById(styleId)) return; 
    const dialogStyles = document.createElement('style');
    dialogStyles.id = styleId;
    dialogStyles.textContent = `
        .multitext-dialog {
            position: fixed;
            z-index: 10000;
            background: #1b1b1b;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #2c2c2c;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            color: #ccc;
            font-family: ${THEME.typography.fonts.primary};
            width: 360px;
            transition: opacity 0.2s, transform 0.2s;
            display: flex;
            flex-direction: column;
            max-height: 85vh;
        }
        .multitext-dialog-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin: -16px -16px 12px -16px;
            padding: 12px 16px;
            background: #0f0f0f;
            border-bottom: 1px solid #2c2c2c;
            border-radius: 8px 8px 0 0;
            cursor: move;
        }
        .multitext-dialog-title {
            color: #fff;
            font-size: 13px;
            font-weight: 500;
            margin: 0;
            user-select: none;
        }
        .multitext-dialog-header-buttons {
            display: flex;
            gap: 8px;
        }
        .multitext-dialog-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 28px;
            height: 28px;
            padding: 0;
            border: 1px solid #2c2c2c;
            border-radius: 4px;
            background: #1b1b1b;
            color: #999;
            font-size: 14px;
            font-family: ${THEME.typography.fonts.primary};
            cursor: pointer;
            transition: all 0.15s ease;
        }
        .multitext-dialog-button:hover {
            background: #2a2a2a;
            border-color: #363636;
            color: #fff;
        }
        .multitext-dialog-button:active {
            background: #232323;
            transform: translateY(1px);
        }
        .multitext-dialog-button-savetpl {
            background: #1b1b1b;
            border-color: #2c2c2c;
            color: #999;
        }
        .multitext-dialog-button-savetpl:hover {
            background: #2a2a2a;
            border-color: #00b341;
            color: #00b341;
        }
        .multitext-dialog-button-save {
            background: #1b1b1b;
            border-color: #2c2c2c;
            color: #999;
        }
         .multitext-dialog-button-save:hover {
            background: #2a2a2a;
            border-color: #00b341;
            color: #00b341;
        }
        .multitext-dialog-button-close {
            min-width: 28px;
            height: 28px;
            padding: 0;
            border: 1px solid #2c2c2c;
            background: #1b1b1b;
            color: #999;
            font-size: 16px;
            line-height: 1;
            border-radius: 4px;
        }
         .multitext-dialog-button-close:hover {
            background: #2a2a2a;
            border-color: #ff3333;
            color: #ff3333;
        }
        .multitext-dialog-button-close:active {
            background: #232323;
            transform: translateY(1px);
        }
        .multitext-dialog-content {
            flex-grow: 1;
            overflow-y: auto;
            padding: 12px;
            margin: 0;
            scrollbar-width: thin;
            scrollbar-color: #2c2c2c #1b1b1b;
        }
        .multitext-dialog-content::-webkit-scrollbar {
            width: 6px;
        }
        .multitext-dialog-content::-webkit-scrollbar-track {
            background: #1b1b1b;
        }
        .multitext-dialog-content::-webkit-scrollbar-thumb {
            background-color: #2c2c2c;
            border-radius: 3px;
        }
        .multitext-dialog-form-group {
            display: flex;
            flex-direction: column;
            margin-bottom: 12px;
        }
        .multitext-dialog-label {
            color: #999;
            font-size: 11px;
            font-weight: 500;
            margin-bottom: 4px;
            text-transform: uppercase;
        }
        .multitext-dialog-input {
            width: 100%;
            background: #232323;
            border: 1px solid #2c2c2c;
            border-radius: 6px;
            padding: 8px;
            color: #ccc;
            font-family: ${THEME.typography.fonts.primary};
            font-size: 12px;
            box-sizing: border-box;
        }
        .multitext-dialog-input:focus {
            border-color: #8B5CF6;
            outline: none;
            box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.25);
        }
        .multitext-dialog-textarea {
            width: 100%;
            min-height: 100px;
            max-height: 250px;
            background: #232323;
            border: 1px solid #2c2c2c;
            border-radius: 6px;
            padding: 8px;
            color: #ccc;
            font-size: 12px;
            font-family: ${THEME.typography.fonts.primary};
            line-height: 1.5;
            resize: vertical;
            margin-bottom: 8px;
            box-sizing: border-box;
        }
        .multitext-dialog-textarea:focus {
            border-color: #8B5CF6;
            outline: none;
            box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.25);
        }
        .multitext-dialog-preset-container {
            display: flex;
            gap: ${THEME.sizes.spacing.sm}px;
            margin-bottom: ${THEME.sizes.spacing.md}px;
            overflow-x: auto;
            white-space: nowrap;
            padding-bottom: ${THEME.sizes.spacing.sm}px;
            scrollbar-width: thin;
            scrollbar-color: ${THEME.colors.border} transparent;
        }
        .multitext-dialog-preset-container::-webkit-scrollbar {
            height: 6px;
        }
        .multitext-dialog-preset-container::-webkit-scrollbar-track {
            background: transparent;
        }
        .multitext-dialog-preset-container::-webkit-scrollbar-thumb {
            background-color: ${THEME.colors.border};
            border-radius: 3px;
        }
        .multitext-dialog-preset-select {
            background: ${THEME.colors.bgHover};
            border: 1px solid ${THEME.colors.border};
            color: ${THEME.colors.textDim};
            padding: ${THEME.sizes.spacing.xs}px ${THEME.sizes.spacing.sm}px;
            border-radius: ${THEME.sizes.borderRadius}px;
            font-size: ${THEME.sizes.fontSize.small}px;             min-width: 90px;             height: 28px;             cursor: pointer;
            outline: none;
            flex-shrink: 0;
            appearance: none;             background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23${THEME.colors.textDim.substring(1)}%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
            background-repeat: no-repeat;
            background-position: right ${THEME.sizes.spacing.sm}px top 50%;
            background-size: .65em auto;
            padding-right: ${THEME.sizes.spacing.lg + THEME.sizes.spacing.sm}px;
            transition: border-color 0.2s;
        }
        .multitext-dialog-preset-select:hover {
            border-color: ${THEME.colors.accent};
        }
        .multitext-dialog-preset-select option {
            background: ${THEME.colors.bg};
            color: ${THEME.colors.text};
        }
        .multitext-dialog-weight-group {
            display: flex;
            align-items: center;
            gap: ${THEME.sizes.spacing.sm}px;
            margin-top: ${THEME.sizes.spacing.xs}px;
            margin-bottom: ${THEME.sizes.spacing.md}px;
            justify-content: space-between;
        }
        .multitext-dialog-weight-container {
            display: flex;
            align-items: center;
            gap: ${THEME.sizes.spacing.sm}px;
        }
        .multitext-dialog-weight-label {
            color: ${THEME.colors.textDim};
            font-size: ${THEME.sizes.fontSize.normal}px;
            font-weight: ${THEME.typography.weights.medium};
        }
        .multitext-dialog-weight-input {
            width: 55px;
            background: ${THEME.colors.bg};
            border: 1px solid ${THEME.colors.border};
            border-radius: ${THEME.sizes.borderRadius}px;
            padding: ${THEME.sizes.spacing.xs}px;
            color: ${THEME.colors.text};
            text-align: center;
            font-family: ${THEME.typography.fonts.primary};
            font-size: ${THEME.sizes.fontSize.normal}px;
            appearance: textfield;
        }
        .multitext-dialog-toolbar {
            display: flex;
            align-items: center;             
            gap: ${THEME.sizes.spacing.sm}px;
        }
        .multitext-dialog-history-dropdown {
            display: none;
            position: absolute;
            top: 32px;
            left: 0;
            width: 100%;
            max-height: 200px;
            overflow-y: auto;
            background: ${THEME.colors.bg};
            border: 1px solid ${THEME.colors.border};
            border-radius: ${THEME.sizes.borderRadius}px;
            margin-top: ${THEME.sizes.spacing.xs}px;
            z-index: 1000;
            box-shadow: ${THEME.effects.hover};
            scrollbar-width: thin;             scrollbar-color: ${THEME.colors.border} ${THEME.colors.bg};
        }
        .multitext-dialog-toolbar-button {
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${THEME.colors.bgHover};
            border: 1px solid ${THEME.colors.border};
            border-radius: ${THEME.sizes.borderRadius}px;
            color: ${THEME.colors.textDim};             cursor: pointer;
            transition: all 0.2s;
            padding: 0;
            font-size: 14px;
        }
        .multitext-dialog-toolbar-button:hover {
            background: ${THEME.colors.bgActive};
            border-color: ${THEME.colors.accent};
            color: ${THEME.colors.text};
        }
        .multitext-dialog-toolbar-button:active {
            transform: translateY(1px);
        }
        .multitext-dialog-history-item {
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid ${THEME.colors.border};
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
        }
        .multitext-dialog-history-item:hover {
            background: ${THEME.colors.bgHover};
        }
        .multitext-dialog-history-item:last-child {
            border-bottom: none;
        }
        .multitext-dialog-history-text {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .multitext-dialog-history-delete {
            background: none;
            border: none;
            color: ${THEME.colors.textDim};
            font-size: 12px;
            padding: 4px;
            cursor: pointer;
            opacity: 0.6;
            transition: all 0.2s;
            display: none;         }
        .multitext-dialog-history-delete:hover {
            opacity: 1;
            color: ${THEME.colors.error || '#ff4444'};
        }
        .multitext-dialog-history-empty {
            padding: 8px 12px;
            color: ${THEME.colors.textDim};
            text-align: center;
        }
        .multitext-dialog-template-section {
            margin-top: ${THEME.sizes.spacing.sm}px;             margin-bottom: ${THEME.sizes.spacing.sm}px;             border-radius: ${THEME.sizes.borderRadius}px;
            background: ${THEME.colors.bgHover}40;             border: 1px solid ${THEME.colors.border};             padding: ${THEME.sizes.spacing.sm}px ${THEME.sizes.spacing.md}px;         }
        .multitext-dialog-template-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: ${THEME.sizes.spacing.sm}px;             cursor: pointer;
            user-select: none;
        }
        .multitext-dialog-template-title {
            font-size: ${THEME.sizes.fontSize.normal}px;             font-weight: ${THEME.typography.weights.medium};
            color: ${THEME.colors.textDim};
        }
        .multitext-dialog-template-toggle {
            font-size: 12px;
            color: ${THEME.colors.textDim};
            transition: transform 0.2s;
        }
        .multitext-dialog-template-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));             gap: ${THEME.sizes.spacing.sm}px;
            overflow-y: auto;
            max-height: 0px;             transition: max-height 0.3s ease-out, margin-top 0.3s ease-out;             padding-right: ${THEME.sizes.spacing.sm}px;
            margin-right: -${THEME.sizes.spacing.sm}px;
            scrollbar-width: thin;
            scrollbar-color: ${THEME.colors.border} transparent;
             margin-top: 0; 
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
        }
        .multitext-dialog-template-grid.visible {              max-height: 250px;              margin-top: ${THEME.sizes.spacing.sm}px;
        }
        .multitext-dialog-template-button {
            background: ${THEME.colors.bg};
            border: 1px solid ${THEME.colors.border};
            border-radius: ${THEME.sizes.borderRadius}px;
            padding: ${THEME.sizes.spacing.sm}px;
            color: ${THEME.colors.text};
            font-size: ${THEME.sizes.fontSize.small}px;             cursor: pointer;
            text-align: left;
            width: 100%;
            transition: all 0.2s;
            display: flex;             flex-direction: column;             justify-content: space-between;             min-height: 50px;             
            &:hover {
                background: ${THEME.colors.bgHover};
                border-color: ${THEME.colors.accent};
                transform: translateY(-1px);                 box-shadow: ${THEME.effects.hover};
            }
             &:active {
                transform: translateY(0px);
                box-shadow: none;
            }
        }
        .multitext-dialog-template-button-header {
            display: flex;
            align-items: center;
            gap: ${THEME.sizes.spacing.xs}px;
            margin-bottom: ${THEME.sizes.spacing.xs}px;
            font-weight: ${THEME.typography.weights.medium};
            font-size: ${THEME.sizes.fontSize.normal}px;         }
        .multitext-dialog-template-button-info {
            font-size: 11px;
            color: ${THEME.colors.textDim};
            display: flex;
            justify-content: space-between;
            margin-top: 4px;
        }
                .multitext-separator-menu {
            position: fixed;
            z-index: 10000;
            background: ${THEME.colors.bg};
            border: 1px solid ${THEME.colors.border};
            border-radius: ${THEME.sizes.borderRadius}px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            padding: ${THEME.sizes.spacing.sm}px;
            min-width: 180px;
            font-family: ${THEME.typography.fonts.primary};
            color: ${THEME.colors.text};
        }
        .multitext-separator-title {
            padding: ${THEME.sizes.spacing.sm}px ${THEME.sizes.spacing.md}px;
            color: ${THEME.colors.textDim};
            font-size: ${THEME.sizes.fontSize.title}px;
            font-weight: ${THEME.typography.weights.medium};
            border-bottom: 1px solid ${THEME.colors.border};
            margin-bottom: ${THEME.sizes.spacing.xs}px;
        }
        .multitext-separator-item {
            padding: ${THEME.sizes.spacing.sm}px ${THEME.sizes.spacing.md}px;
            margin: 2px 0;
            cursor: pointer;
            border-radius: ${THEME.sizes.borderRadius - 2}px;
            display: flex;
            align-items: center;
            gap: ${THEME.sizes.spacing.sm}px;
            font-size: ${THEME.sizes.fontSize.normal}px;
            transition: all 0.1s ease;
        }
        .multitext-separator-item:hover {
            background: ${THEME.colors.bgHover};
        }
        .multitext-separator-item:active {
            background: ${THEME.colors.bgActive};
            transform: translateY(1px);
        }
        .multitext-separator-item.selected {
             background: ${THEME.colors.bgActive};
        }
        .multitext-separator-item.selected .multitext-separator-icon {
            background: ${THEME.colors.accent};
            color: ${THEME.colors.text};
        }
        .multitext-separator-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            background: ${THEME.colors.bgActive};
            border-radius: 4px;
            font-size: 14px;
            color: ${THEME.colors.accent};
            flex-shrink: 0;
        }
        .multitext-separator-label {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .multitext-separator-custom-input {
            width: calc(100% - ${THEME.sizes.spacing.md * 2}px);             margin: ${THEME.sizes.spacing.sm}px ${THEME.sizes.spacing.md}px;
            padding: ${THEME.sizes.spacing.xs}px ${THEME.sizes.spacing.sm}px;
            border: 1px solid ${THEME.colors.border};
            border-radius: ${THEME.sizes.borderRadius - 2}px;
            background: ${THEME.colors.bg};             color: ${THEME.colors.text};
            font-size: ${THEME.sizes.fontSize.normal}px;
            font-family: ${THEME.typography.fonts.primary};
            box-sizing: border-box;
        }
         .multitext-separator-custom-input:focus {
            border-color: ${THEME.colors.accent};
            outline: none;
        }
        .multitext-separator-confirm-button {
            margin: ${THEME.sizes.spacing.sm}px ${THEME.sizes.spacing.md}px ${THEME.sizes.spacing.xs}px;
            padding: ${THEME.sizes.spacing.xs}px ${THEME.sizes.spacing.md}px;
            text-align: center;
            background: ${THEME.colors.accent};
            color: white;             border-radius: ${THEME.sizes.borderRadius - 2}px;
            cursor: pointer;
            font-weight: ${THEME.typography.weights.medium};
            transition: background 0.15s;
        }
        .multitext-separator-confirm-button:hover {
            background: ${THEME.colors.accentLight};
        }
                .multitext-dialog-template-toggle.rotated {
             transform: rotate(180deg);
        }
                .multitext-preset-menu {
            position: fixed;
            z-index: 10000;
            background: ${THEME.colors.bg};
            border: 1px solid ${THEME.colors.border};
            border-radius: ${THEME.sizes.borderRadius}px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            padding: ${THEME.sizes.spacing.sm}px;
            min-width: 200px;
            max-height: 400px;
            overflow-y: auto;
            font-family: ${THEME.typography.fonts.primary};
            scrollbar-width: thin;
            scrollbar-color: ${THEME.colors.border} ${THEME.colors.bg};
        }
        .multitext-preset-menu::-webkit-scrollbar {
            width: 6px;
        }
        .multitext-preset-menu::-webkit-scrollbar-track {
            background: ${THEME.colors.bg};
        }
        .multitext-preset-menu::-webkit-scrollbar-thumb {
            background-color: ${THEME.colors.border};
            border-radius: 3px;
        }
        .multitext-preset-category-title {
            padding: ${THEME.sizes.spacing.sm}px ${THEME.sizes.spacing.md}px;
            color: ${THEME.colors.textDim};
            font-size: ${THEME.sizes.fontSize.title}px;
            font-weight: ${THEME.typography.weights.medium};
            display: flex;
            align-items: center;
            gap: ${THEME.sizes.spacing.sm}px;
            border-bottom: 1px solid ${THEME.colors.border};
            margin-bottom: ${THEME.sizes.spacing.xs}px;
        }
        .multitext-preset-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: ${THEME.sizes.spacing.xs}px ${THEME.sizes.spacing.md}px;             cursor: pointer;
            border-radius: ${THEME.sizes.borderRadius - 2}px;
            transition: background 0.1s;
            color: ${THEME.colors.text};
            font-size: ${THEME.sizes.fontSize.normal}px;
            position: relative;
        }
        .multitext-preset-item:hover {
            background: ${THEME.colors.bgHover};
        }
        .multitext-preset-item:hover .multitext-preset-item-delete {
             opacity: 1;
             visibility: visible;
        }
        .multitext-preset-item-label {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-right: ${THEME.sizes.spacing.sm}px;         }
        .multitext-preset-item-delete {
            display: inline-block;
            color: ${THEME.colors.error || '#ff4444'};             font-size: 14px;             cursor: pointer;
            padding: 2px 6px;
            border-radius: 4px;
            background: transparent;
            transition: all 0.2s;
            opacity: 0;             visibility: hidden;
            line-height: 1;
        }
        .multitext-preset-item-delete:hover {
            background: rgba(255, 68, 68, 0.2);
            color: ${THEME.colors.error || '#ff4444'}; 
        }
                .multitext-save-preset-dialog {
            position: fixed;
            z-index: 10000;
            background: ${THEME.colors.bg};
            border: 1px solid ${THEME.colors.border};
            border-radius: ${THEME.sizes.borderRadius}px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            padding: ${THEME.sizes.spacing.lg}px;
            min-width: 300px;
            font-family: ${THEME.typography.fonts.primary};
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            color: ${THEME.colors.text};         }
        .multitext-save-preset-title {
            font-size: ${THEME.sizes.fontSize.large}px;             font-weight: ${THEME.typography.weights.semibold};
            margin-bottom: ${THEME.sizes.spacing.lg}px;             padding-bottom: ${THEME.sizes.spacing.sm}px;             border-bottom: 1px solid ${THEME.colors.border};
            color: ${THEME.colors.text};
        }
        .multitext-save-preset-input,
        .multitext-save-preset-select {
            width: 100%;
            padding: ${THEME.sizes.spacing.sm}px;
            margin-bottom: ${THEME.sizes.spacing.md}px;             border: 1px solid ${THEME.colors.border};
            border-radius: ${THEME.sizes.borderRadius}px;             background: ${THEME.colors.bg};
            color: ${THEME.colors.text};
            font-size: ${THEME.sizes.fontSize.normal}px;             box-sizing: border-box;
        }
        .multitext-save-preset-input:focus,
        .multitext-save-preset-select:focus {
             border-color: ${THEME.colors.accent};
             outline: none;
             box-shadow: 0 0 0 2px ${THEME.colors.accent}40;
        }
        .multitext-save-preset-select {
            appearance: none;             background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23${THEME.colors.textDim.substring(1)}%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
            background-repeat: no-repeat;
            background-position: right ${THEME.sizes.spacing.sm}px top 50%;
            background-size: .65em auto;
            padding-right: ${THEME.sizes.spacing.lg + THEME.sizes.spacing.sm}px;
            cursor: pointer;         }
         .multitext-save-preset-select option {
            background: ${THEME.colors.bg};
            color: ${THEME.colors.text};
         }
        .multitext-save-preset-buttons {
            display: flex;
            gap: ${THEME.sizes.spacing.sm}px;
            justify-content: flex-end;
            margin-top: ${THEME.sizes.spacing.md}px;         }
        .multitext-save-preset-button {             padding: ${THEME.sizes.spacing.sm}px ${THEME.sizes.spacing.lg}px;             border-radius: ${THEME.sizes.borderRadius}px;
            cursor: pointer;
            font-weight: ${THEME.typography.weights.medium};
            font-size: ${THEME.sizes.fontSize.normal}px;
            transition: all 0.2s;
        }
        .multitext-save-preset-button-cancel {
            border: 1px solid ${THEME.colors.border};
            background: ${THEME.colors.bg};
            color: ${THEME.colors.text};
        }
        .multitext-save-preset-button-cancel:hover {
            background: ${THEME.colors.bgHover};
            border-color: ${THEME.colors.border};         }
        .multitext-save-preset-button-save {
            border: none;
            background: ${THEME.colors.accent};
            color: white;
            box-shadow: ${THEME.effects.pressed};
        }
        .multitext-save-preset-button-save:hover {
            background: ${THEME.colors.accentLight};
            box-shadow: ${THEME.effects.hover};
        }
        .multitext-save-preset-button-save:active {
             transform: translateY(1px);
             box-shadow: none;
        }
    `;
    
    dialogStyles.textContent += `
        .multitext-save-choice-dialog {
            position: fixed;
            z-index: 10001; 
            background: ${THEME.colors.bgHover};
            border: 1px solid ${THEME.colors.border};
            border-radius: ${THEME.sizes.borderRadius}px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.3);
            padding: ${THEME.sizes.spacing.md}px;
            font-family: ${THEME.typography.fonts.primary};
            color: ${THEME.colors.text};
            min-width: 200px;
        }
        .multitext-save-choice-title {
            font-size: ${THEME.sizes.fontSize.normal}px;
            font-weight: ${THEME.typography.weights.medium};
            margin-bottom: ${THEME.sizes.spacing.md}px;
            color: ${THEME.colors.textDim};
            text-align: center;
        }
        .multitext-save-choice-buttons {
            display: flex;
            flex-direction: column;
            gap: ${THEME.sizes.spacing.sm}px;
        }
        .multitext-save-choice-button {
            padding: ${THEME.sizes.spacing.sm}px ${THEME.sizes.spacing.lg}px;
            border-radius: ${THEME.sizes.borderRadius}px;
            cursor: pointer;
            font-weight: ${THEME.typography.weights.medium};
            font-size: ${THEME.sizes.fontSize.normal}px;
            transition: all 0.2s;
            border: 1px solid ${THEME.colors.border};
            background: ${THEME.colors.bgActive};
            color: ${THEME.colors.text};
            text-align: center;
        }
        .multitext-save-choice-button:hover {
            background: ${THEME.colors.accent}40;
            border-color: ${THEME.colors.accent};
        }
        
        
        .multitext-dialog-template-button {
            position: relative;
        }
        .multitext-template-edit-icon {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 20px;
            height: 20px;
            background: ${THEME.colors.bgDarker};
            border-radius: 3px;
            display: none;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            color: ${THEME.colors.text};
            font-size: 14px;
            transition: all 0.2s;
            z-index: 10;
        }
        .multitext-dialog-template-button:hover .multitext-template-edit-icon {
            display: flex;
        }
        .multitext-template-edit-icon:hover {
            background: ${THEME.colors.accent};
        }

        
        .multitext-manage-presets-dialog .multitext-dialog-content {
            
            padding: 8px;
        }
        .multitext-manage-presets-category-section {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-bottom: 8px; 
        }
        .multitext-manage-presets-category-header {
            display: flex;
            align-items: center;
            gap: 6px;
            padding-bottom: 4px; 
            border-bottom: 1px solid ${THEME.colors.border}; 
        }
        .multitext-manage-presets-category-title {
            margin: 0;
            font-size: 13px;
            font-weight: normal;
            color: ${THEME.colors.text};
            flex: 1;
        }
        
        .multitext-manage-presets-add-button {
             padding: 2px 6px !important; 
             font-size: 12px !important; 
             min-width: 20px !important; 
             height: 20px !important; 
             line-height: 1 !important; 
        }
         .multitext-manage-presets-list {
            display: flex;
            flex-direction: column;
            gap: 2px;
            margin-top: 4px; 
        }
        .multitext-manage-presets-item {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 4px 6px;
            background: ${THEME.colors.bgDarker}; 
            border-radius: 4px;
            border: 1px solid ${THEME.colors.border};
            font-size: 12px;
        }
        .multitext-manage-presets-item-label {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: ${THEME.colors.textDim};
        }
        .multitext-manage-presets-item-buttons {
            display: flex;
            gap: 2px;
            align-items: center;
        }
        
        .multitext-manage-presets-action-button {
            background: none !important;
            border: none !important;
            padding: 2px !important;
            opacity: 0.7;
            font-size: 11px !important;
            line-height: 1 !important;
            min-width: auto !important; 
            height: auto !important; 
            color: ${THEME.colors.textDim} !important; 
        }
        .multitext-manage-presets-action-button:hover {
            opacity: 1;
            background: none !important; 
            color: ${THEME.colors.text} !important; 
        }
        .multitext-manage-presets-action-button.delete:hover {
             color: ${THEME.colors.error || '#ff4444'} !important; 
        }

        
    `;
    document.head.appendChild(dialogStyles);
};


export const DialogUtils = {
    createDialog(THEME, options = {}) {
        const dialog = document.createElement('div');
        dialog.classList.add('multitext-dialog');
        
        
        Object.assign(dialog.style, {
            position: 'fixed',
            zIndex: '10000',
            background: THEME.colors.bg,
            border: `1px solid ${THEME.colors.border}`,
            borderRadius: `${THEME.sizes.borderRadius}px`,
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            color: THEME.colors.text,
            fontFamily: THEME.typography.fonts.primary,
            width: options.width || '360px',
            maxHeight: options.maxHeight || '85vh',
            display: 'flex',
            flexDirection: 'column'
        });

        return dialog;
    },

    createHeader(THEME, title, buttons = []) {
        const header = document.createElement('div');
        header.classList.add('multitext-dialog-header');
        
        const titleElement = document.createElement('div');
        titleElement.classList.add('multitext-dialog-title');
        titleElement.textContent = title;
        
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('multitext-dialog-header-buttons');
        buttons.forEach(button => buttonContainer.appendChild(button));
        
        header.appendChild(titleElement);
        header.appendChild(buttonContainer);
        
        return header;
    },

    createButton(THEME, options = {}) {
        const button = document.createElement('button');
        button.classList.add('multitext-dialog-button');
        if (options.className) {
            options.className.split(' ').forEach(cls => {
                if (cls) button.classList.add(cls);
            });
        }
        
        Object.assign(button.style, {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '28px',
            height: '28px',
            padding: '0',
            border: `1px solid ${THEME.colors.border}`,
            borderRadius: '4px',
            background: THEME.colors.bg,
            color: THEME.colors.textDim,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
        });
        
        
        if (options.innerHTML) {
            button.innerHTML = options.innerHTML;
        } else if (options.icon) {
            button.innerHTML = options.icon;
        }

        if (options.title) button.title = options.title;
        if (options.onclick) button.onclick = options.onclick;
        
        return button;
    },

    createInput(THEME, options = {}) {
        const input = document.createElement('input');
        input.type = options.type || 'text';
        input.placeholder = options.placeholder || '';
        input.value = options.value || '';
        input.classList.add('multitext-dialog-input');
        if (options.className) {
            input.classList.add(options.className);
        }
        return input;
    },

    createTextarea(THEME, options = {}) {
        const textarea = document.createElement('textarea');
        textarea.value = options.value || '';
        textarea.placeholder = options.placeholder || '';
        textarea.classList.add('multitext-dialog-textarea');
        if (options.className) {
            textarea.classList.add(options.className);
        }
        return textarea;
    },

    createSelect(THEME, options = {}) {
        const select = document.createElement('select');
        select.classList.add('multitext-dialog-select');
        if (options.className) {
            select.classList.add(options.className);
        }
        
        if (options.options) {
            options.options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                if (opt.selected) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        }
        
        return select;
    },

    createFormGroup(THEME, label, element) {
        const group = document.createElement('div');
        group.classList.add('multitext-dialog-form-group');
        
        if (label) {
            const labelEl = document.createElement('label');
            labelEl.textContent = label;
            group.appendChild(labelEl);
        }
        
        group.appendChild(element);
        return group;
    }
}; 