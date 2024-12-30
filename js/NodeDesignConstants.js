const svgColor = '#4A4A4A';
const svgHoverColor = '#000000';

export const SVG = {
    alignBottom: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18M9 4v12M15 8v8"/></svg>`,
    alignCenterHorizontally: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M8 8h8M6 12h12M8 16h8"/></svg>`,
    alignCenterVertically: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M8 8v8M12 6v12M16 8v8"/></svg>`,
    alignLeft: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3v18M9 8h11M9 12h7M9 16h11"/></svg>`,
    alignRight: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 3v18M4 8h11M8 12h7M4 16h11"/></svg>`,
    alignTop: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h18M9 8v12M15 8v8"/></svg>`,
    horizontalDistribution: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3v18M20 3v18M9 8v8M15 8v8"/></svg>`,
    verticalDistribution: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h18M3 20h18M8 9h8M8 15h8"/></svg>`,
    equalWidth: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="8" width="12" height="8" rx="1"/><path d="M3 6v12M21 6v12"/></svg>`,
    equalHeight: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="6" width="8" height="12" rx="1"/><path d="M4 3h16M4 21h16"/></svg>`,
    undo: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10h10a5 5 0 0 1 5 5v2"/><path d="M3 10l6-6M3 10l6 6"/></svg>`,
    redo: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10H11a5 5 0 0 0-5 5v2"/><path d="M21 10l-6-6M21 10l-6 6"/></svg>`,
    smartAlign: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h18M9 3v18M15 3v18"/></svg>`,
    treeView: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M5 8h14M8 14h8"/></svg>`,
    toggleMode: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="${svgColor}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="4" ry="4" class="toggle-normal"/>
        <path d="M12 6v12M6 12h12" class="toggle-normal"/>
        <circle cx="12" cy="12" r="6" class="toggle-hover" style="display: none;"/>
        <path d="M12 9v6M9 12h6" class="toggle-hover" style="display: none;"/>
    </svg>`
};

export const STYLES = `
    #alignment-buttons {
        position: fixed;
        display: flex;
        align-items: center;
        background: rgba(255, 255, 255, 0.9);
        padding: 8px;
        border-radius: 12px;
        z-index: 1000;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        width: fit-content;
        height: 52px;
        user-select: none;
        cursor: move;
    }
    .custom-button {
        width: 36px;
        height: 36px;
        background-color: transparent;
        border: none;
        cursor: pointer;
        padding: 6px;
        margin: 0 2px;
        border-radius: 8px;
        transition: all 0.2s ease;
    }
    .custom-button:hover {
        background-color: rgba(0, 0, 0, 0.05);
    }
    .custom-button:active {
        transform: scale(0.95);
    }
    .divider {
        width: 1px;
        height: 24px;
        background-color: rgba(0, 0, 0, 0.1);
        margin: 0 8px;
    }
    #alignment-buttons button {
        opacity: 0.7;
        transition: opacity 0.2s ease;
    }
    #alignment-buttons button:hover {
        opacity: 1;
    }
    .color-picker-container {
        display: flex;
        align-items: center;
        margin-right: 8px;
        gap: 8px;
    }
    .color-picker {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        width: 32px;
        height: 32px;
        background-color: transparent;
        border: none;
        cursor: pointer;
        padding: 0;
        transition: transform 0.2s ease;
    }
    .color-picker:hover {
        transform: scale(1.1);
    }
    .color-picker::-webkit-color-swatch-wrapper {
        padding: 0;
    }
    .color-picker::-webkit-color-swatch {
        border: none;
        border-radius: 50%;
        box-shadow: 0 0 0 2px #ffffff, 0 0 0 3px rgba(0, 0, 0, 0.2);
    }
    .color-picker::-moz-color-swatch {
        border: none;
        border-radius: 50%;
        box-shadow: 0 0 0 2px #ffffff, 0 0 0 3px rgba(0, 0, 0, 0.2);
    }
    .color-picker:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.5);
    }
`;