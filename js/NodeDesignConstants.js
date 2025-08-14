const svgColor = '#B8B8B8';
const svgHoverColor = '#FFFFFF';

export const SVG = {
    alignBottom: `<svg viewBox="0 0 24 24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21h16M8 4v13M16 10v7"/></svg>`,
    alignCenterHorizontally: `<svg viewBox="0 0 24 24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16M6 10h12M9 14h6"/></svg>`,
    alignCenterVertically: `<svg viewBox="0 0 24 24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16M10 6v12M14 9v6"/></svg>`,
    alignLeft: `<svg viewBox="0 0 24 24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v16M8 8h10M8 16h6"/></svg>`,
    alignRight: `<svg viewBox="0 0 24 24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 4v16M6 8h10M10 16h6"/></svg>`,
    alignTop: `<svg viewBox="0 0 24 24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3h16M8 8v13M16 14v7"/></svg>`,
    horizontalDistribution: `<svg viewBox="0 0 24 24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h3v10H4z M10.5 7h3v10h-3z M17 7h3v10h-3z"/></svg>`,
    verticalDistribution: `<svg viewBox="0 0 24 24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v3H7z M7 10.5h10v3H7z M7 17h10v3H7z"/></svg>`,
    equalWidth: `<svg viewBox="0 0 24 24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="9" width="6" height="6" rx="1"/><rect x="15" y="9" width="6" height="6" rx="1"/><path d="M10 11h4M10 13h4"/></svg>`,
    equalHeight: `<svg viewBox="0 0 24 24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="6" rx="1"/><rect x="9" y="15" width="6" height="6" rx="1"/><path d="M11 10v4M13 10v4"/></svg>`,
    undo: `<svg viewBox="0 0 24 24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M10 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3"/><path d="M10 15l-4 4 4 4"/></svg>`,
    redo: `<svg viewBox="0 0 24 24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 19h5a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"/><path d="M14 15l4 4-4 4"/></svg>`,
    smartAlign: `<svg viewBox="0 0 24 24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16m-8-8h16"/><path d="M12 12l2 2-2 2-2-2 2-2z" fill="${svgColor}"/></svg>`,
    treeView: `<svg viewBox="0 0 24 24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="9" width="6" height="6" rx="1"/><path d="M10 7h4M10 17h4M14 12V7M14 12v5"/></svg>`,
    toggleMode: `<svg viewBox="0 0 24 24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z" class="toggle-normal"/><circle cx="12" cy="12" r="3" class="toggle-hover" style="display: none;"/></svg>`,
    close: `<svg viewBox="0 0 24 24" stroke="${svgColor}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M17 7L7 17M7 7l10 10"/></svg>`,
    placeRight: `<svg viewBox="0 0 24 24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="7" height="12" rx="1"/><rect x="14" y="8" width="7" height="8" rx="1"/><path d="M12 12h2"/></svg>`,
    placeBelow: `<svg viewBox="0 0 24 24" stroke="${svgColor}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="3" width="12" height="7" rx="1"/><rect x="8" y="14" width="8" height="7" rx="1"/><path d="M12 12v2"/></svg>`
};

export const STYLES = `
    #nd-alignment-buttons {
        position: fixed;
        display: flex;
        align-items: center;
        background: rgba(30, 30, 30, 0.9);
        padding: 6px;
        border-radius: 10px;
        z-index: 1000;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        width: fit-content;
        height: 44px;
        user-select: none;
        cursor: move;
        border: 1px solid rgba(255, 255, 255, 0.08);
        transition: background 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
    }
    .nd-button {
        width: 30px;
        height: 30px;
        background-color: transparent;
        border: none;
        cursor: pointer;
        padding: 5px;
        margin: 0 2px;
        border-radius: 8px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .nd-button:hover {
        background-color: rgba(255, 255, 255, 0.12);
    }
    .nd-button:active {
        transform: scale(0.95);
        background-color: rgba(255, 255, 255, 0.18);
    }
    .nd-button svg {
        width: 18px;
        height: 18px;
        stroke: ${svgColor};
        transition: stroke 0.2s ease;
    }
    .nd-button:hover svg {
        stroke: ${svgHoverColor};
    }
    .nd-divider {
        width: 1px;
        height: 22px;
        background-color: rgba(255, 255, 255, 0.15);
        margin: 0 8px;
    }
    #nd-alignment-buttons button {
        opacity: 0.9;
        transition: all 0.2s ease;
    }
    #nd-alignment-buttons button:hover {
        opacity: 1;
    }
    .nd-color-picker-container {
        display: flex;
        align-items: center;
        margin-right: 8px;
        gap: 8px;
    }
    .nd-color-picker {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        width: 26px;
        height: 26px;
        background-color: transparent;
        border: none;
        cursor: pointer;
        padding: 0;
        transition: all 0.2s ease;
        border-radius: 6px;
    }
    .nd-color-picker:hover {
        transform: scale(1.1);
    }
    .nd-color-picker::-webkit-color-swatch-wrapper {
        padding: 0;
    }
    .nd-color-picker::-webkit-color-swatch {
        border: none;
        border-radius: 6px;
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.15);
    }
    .nd-color-picker::-moz-color-swatch {
        border: none;
        border-radius: 6px;
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.15);
    }
    .nd-color-picker:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(80, 130, 220, 0.7);
    }
    #nd-alignment-buttons.minimized {
        height: auto;
        padding: 4px;
    }
`;