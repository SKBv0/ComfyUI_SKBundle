export const PAINT_TOOLS = {
    BRUSH: "brush",
    ERASER: "eraser",
    FILL: "fill",
    LINE: "line",
    RECTANGLE: "rectangle",
    CIRCLE: "circle",
    GRADIENT: "gradient",
    EYEDROPPER: "eyedropper",
    MASK: "mask"
};


export const DRAWING_DEFAULTS = {
    MASK_COLOR: '#ffffff',
    ERASER_COMPOSITE_OP: 'destination-out',
    BRUSH_COMPOSITE_OP: 'source-over'
};


export const CANVAS_CONFIG = {
    DEFAULT_SIZE: 256,
    MAX_DIMENSION: 512,
    MIN_WIDTH: 250,
    MIN_HEIGHT: 300,
    DEVICE_PIXEL_RATIO: typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1
};


export const CANVAS_PADDING = {
    LEFT: 12,
    RIGHT: 8,
    TOP: 22,
    BOTTOM: 25
};


export const TOOLBAR_LIMITS = {
    MINIMUM_MARGIN: 15,
    MIN_TOOL_SIZE: 12,
    MIN_ICON_SIZE: 8,
    MIN_SPACING: 0,
    MIN_PADDING: 1,
    MIN_SCALE_FACTOR: 0.3,
    MIN_TOUCH_SIZE: 28
};


export const QUICK_CONTROLS = {
    BAR_HEIGHT: 30,
    BOTTOM_GAP: 10,
    PADDING: 8,
    CONTROL_HEIGHT_OFFSET: 6,
    SWATCH_SIZE_OFFSET: 6,
    VALUE_CONTROL_WIDTH: 60,
    MIN_CONTROL_SPACING: 2,
    COMPACT_WIDTH_THRESHOLD: 200
};


export const PERFORMANCE_LIMITS = {
    MAX_HISTORY_SIZE: 5,
    MEMORY_CLEANUP_INTERVAL: 60000, 
    CANVAS_SIZE_THRESHOLD: 2048,
    DEVICE_PIXEL_RATIO_THRESHOLD: 1.5,
    MAX_SPEED: 20,
    DRAG_THRESHOLD: 3
};


export const COLOR_PICKER = {
    SV_WIDTH: 200,
    SV_HEIGHT: 150,
    HUE_WIDTH: 200,
    HUE_HEIGHT: 20,
    CORNER_RADIUS: 5,
    HOVER_SCALE: 1.05,
    CELL_SIZE: 5,
    LIGHT_COLOR: "#3D3D3D",
    DARK_COLOR: "#2E2E2E"
};


export const TEXT_CONFIG = {
    VALUE_FONT_SIZE: 20,
    UNIT_FONT_SIZE: 3,
    LABEL_FONT_SIZE: 4,
    TOOLTIP_RECT_HEIGHT: 22,
    DYNAMIC_SLIDER_MIN_WIDTH: 36,
    SLIDER_HEIGHT: 3,
    SLIDER_GAP: -1
};


export const INTERACTION_CONFIG = {
    BASE_SENSITIVITY: 0.01,
    MIN_SENSITIVITY_FACTOR: 0.1,
    MAX_SENSITIVITY_FACTOR: 5,
    UNIT_LABEL_VERTICAL_SPACING: 1,
    GROUP_WIDTH_MULTIPLIER: 0.7
};

export const BRUSH_SIZES = {
    SMALL: 5,
    MEDIUM: 15,
    LARGE: 30
};


export const BRUSH_PRESETS = {
    DEFAULT:   { name: "Default",   spacing: 0.05,   flow: 0.8, hardness: 0.8, pressureSensitivity: 0.5, scattering: 0.0, buildUp: 0.0, shapeDynamics: 0.0, texture: "none",        description: "General purpose, balanced brush" },
    PENCIL:    { name: "Pencil",    spacing: 0.04,   flow: 0.5, hardness: 0.9, pressureSensitivity: 0.9, scattering: 0.1, buildUp: 0.0, shapeDynamics: 0.2, texture: "ROUGH_PAPER", description: "Realistic graphite pencil with texture and dynamics" },
    MARKER:    { name: "Marker",    spacing: 0.01,   flow: 1.0, hardness: 1.0, pressureSensitivity: 0.0, scattering: 0.0, buildUp: 0.0, shapeDynamics: 0.0, texture: "canvas",      description: "Sharp and opaque marker with horizontal texture" },
    AIRBRUSH:  { name: "Airbrush",  spacing: 0.01,   flow: 0.2, hardness: 0.2, pressureSensitivity: 0.5, scattering: 0.8, buildUp: 0.0, shapeDynamics: 0.0, texture: "airbrush",    description: "Light and soft spray effect" },
    WATERCOLOR:{ name: "Watercolor",spacing: 0.2,    flow: 0.4, hardness: 0.3, pressureSensitivity: 0.8, scattering: 0.6, buildUp: 0.0, shapeDynamics: 0.3, texture: "noise",       description: "Fluid, layered watercolor with heavy granulation" },
    INK_PEN:   { name: "Ink Pen",   spacing: 0.005,  flow: 1.0, hardness: 0.98, pressureSensitivity: 0.9, scattering: 0.0, buildUp: 0.0, shapeDynamics: 0.1, texture: "none",        description: "Sharp, responsive ink line with pressure sensitivity" },
    PIXEL:     { name: "Pixel",     spacing: 1.0,    flow: 1.0, hardness: 1.0, pressureSensitivity: 0.0, scattering: 0.0, buildUp: 0.0, shapeDynamics: 0.0, texture: "none",        description: "Sharp pixels for pixel art" },
    BLENDER:   { name: "Blender",   spacing: 0.02,   flow: 0.4, hardness: 0.2, pressureSensitivity: 0.5, scattering: 0.2, buildUp: 0.0, shapeDynamics: 0.0, texture: "noise",       description: "Softly blends colors together" }
};

export const DEFAULT_VALUES = {
    OPACITY: 0.8
};
export const UI_CONFIG = {
    TOOLBAR: {
        HEIGHT: 40,
        PADDING: 6,
        TOOL_SIZE: 32,
        SPACING: 6,
        ICON_SIZE: 18,
        COLORS: {
            BACKGROUND: "#2C2C2C",
            BUTTON_HOVER: "#3D3D3D",
            BUTTON_ACTIVE: "#1E1E1E",
            ACTIVE_BORDER: "#0D99FF",
            ICON_NORMAL: "#BBBBBB",
            ICON_ACTIVE: "#FFFFFF",
            TEXT: "#EEEEEE",
            MASK_OVERLAY: "rgba(0, 150, 255, 0.4)",
            HISTORY_STEP: 50
        }
    },
    TOOLTIPS: {
        BACKGROUND: "rgba(0,0,0,0.7)",
        TEXT: "#eee",
        PADDING: 8,
        BORDER_RADIUS: 6
    },
    NODE: {
        MIN_WIDTH: 250,
        MIN_HEIGHT: 300,
        CANVAS_PADDING: 12
    }
};
export const TOOL_SETTINGS = {
    BRUSH: {
        MIN_SPACING: 0.0001,
        MAX_SPACING: 2.0,
        DEFAULT_SPACING: 0.01,
        MIN_FLOW: 0.1,
        MAX_FLOW: 1.0,
        DEFAULT_FLOW: 0.8,
        MIN_HARDNESS: 0.0,
        MAX_HARDNESS: 1.0,
        DEFAULT_HARDNESS: 1.0,
        MIN_STAMP_HARDNESS: 0.001,
        MIN_SCATTERING: 0.0,
        MAX_SCATTERING: 1.0,
        DEFAULT_SCATTERING: 0.0,
        MIN_SHAPE_DYNAMICS: 0.0,
        MAX_SHAPE_DYNAMICS: 1.0,
        DEFAULT_SHAPE_DYNAMICS: 0.0
    },
    ERASER: {
        MIN_HARDNESS: 0.0,
        MAX_HARDNESS: 1.0,
        DEFAULT_HARDNESS: 0.8,
        MIN_OPACITY: 0.1,
        MAX_OPACITY: 1.0,
        DEFAULT_OPACITY: 1.0
    },
    FILL: {
        DEFAULT_TOLERANCE: 32,
        MIN_TOLERANCE: 0,
        MAX_TOLERANCE: 100
    },
    LINE: {
        LINE_STYLES: {
            SOLID: "solid",
            DASHED: "dashed",
            DOTTED: "dotted"
        },
        LINE_CAPS: {
            ROUND: "round",
            SQUARE: "square",
            BUTT: "butt"
        },
        DEFAULT_LINE_STYLE: "solid",
        DEFAULT_LINE_CAP: "round",
        DEFAULT_START_ARROW: false,
        DEFAULT_END_ARROW: false,
        DEFAULT_ARROW_SIZE: 10,
        MIN_ARROW_SIZE: 5,
        MAX_ARROW_SIZE: 50
    },
    RECTANGLE: {
        FILL_STYLES: {
            NONE: 'none',
            SOLID: 'solid',
            GRADIENT: 'gradient',
            PATTERN: 'pattern'
        },
        DEFAULT_FILL_STYLE: 'none',
        DEFAULT_FILL_COLOR: '#ffffff',
        DEFAULT_FILL_END_COLOR: '#000000',
        DEFAULT_BORDER_RADIUS: 0,
        MIN_BORDER_RADIUS: 0,
        MAX_BORDER_RADIUS: 50,
        DEFAULT_ROTATION: 0,
        MIN_ROTATION: 0,
        MAX_ROTATION: 360
    },
    CIRCLE: {
        FILL_STYLES: {
            NONE: 'none',
            SOLID: 'solid',
            GRADIENT: 'gradient',
            PATTERN: 'pattern'
        },
        DEFAULT_FILL_STYLE: 'none',
        DEFAULT_FILL_COLOR: '#ffffff',
        DEFAULT_FILL_END_COLOR: '#000000',
        DEFAULT_START_ANGLE: 0,
        MIN_START_ANGLE: 0,
        MAX_START_ANGLE: 360,
        DEFAULT_END_ANGLE: 360,
        MIN_END_ANGLE: 0,
        MAX_END_ANGLE: 360
    },
    GRADIENT: {
        MIN_OPACITY: 0.1,
        MAX_OPACITY: 1.0
    },
    EYEDROPPER: {
        DEFAULT_SAMPLE_MODE: 'pixel',
        DEFAULT_SAMPLE_SIZE: 3,
        MIN_SAMPLE_SIZE: 1,
        MAX_SAMPLE_SIZE: 10
    },
    MASK: {
        DEFAULT_OPACITY: 0.7,
        MIN_OPACITY: 0.1,
        MAX_OPACITY: 1.0,
        DEFAULT_HARDNESS: 0.8,
        MIN_HARDNESS: 0.0,
        MAX_HARDNESS: 1.0,
        DEFAULT_FEATHER: 0,
        MIN_FEATHER: 0,
        MAX_FEATHER: 50,
        MODES: {
            ADD: 'add',
            SUBTRACT: 'subtract',
            INTERSECT: 'intersect'
        },
        DEFAULT_MODE: 'add'
    }
};


export const BRUSH_TEXTURES = {
    NONE: "none",
    PENCIL: "pencil",
    CANVAS: "canvas",
    ROUGH_PAPER: "rough_paper", 
    NOISE: "noise",
    AIRBRUSH: "airbrush"
};


export const DUAL_BRUSH_TYPES = {
    NONE: "none",
    SCATTER: "scatter",
    TEXTURE: "texture",
    CROSSHATCH: "crosshatch"
};

export const PERFORMANCE_CONFIG = {
    HISTORY_LIMIT: 10,       
    CLEANUP_INTERVAL: 30000  
};
