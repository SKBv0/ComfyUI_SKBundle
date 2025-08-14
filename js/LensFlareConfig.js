export const COLOR_UTILITIES = {
    _rgbToHexCache: new Map(),
    _hexToRgbCache: new Map(),
    
    rgbToHex: (r, g, b) => {
        const cacheKey = `${r},${g},${b}`;
        if (COLOR_UTILITIES._rgbToHexCache.has(cacheKey)) {
            return COLOR_UTILITIES._rgbToHexCache.get(cacheKey);
        }
        
        const result = `#${[r,g,b].map(x => x.toString(16).padStart(2,'0')).join('')}`;
        COLOR_UTILITIES._rgbToHexCache.set(cacheKey, result);
        return result;
    },
    
    hexToRgb: (hex) => {
        if (COLOR_UTILITIES._hexToRgbCache.has(hex)) {
            return COLOR_UTILITIES._hexToRgbCache.get(hex);
        }
        
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        const rgb = result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [255,255,255];
        
        COLOR_UTILITIES._hexToRgbCache.set(hex, rgb);
        return rgb;
    },
    
    rgbToObject: (rgbArray) => ({ r: rgbArray[0], g: rgbArray[1], b: rgbArray[2] })
};

export const FLARE_TYPES = {
    "50MM_PRIME": "50mm Prime",
    "COOL_FLARE": "Cool Flare", 
    "GOBLIN": "Goblin",
    "GOLDEN_SUN": "Golden Sun",
    "GREEN_GRANITE": "Green Granite",
    "GREEN_SPOTLIGHT": "Green Spotlight",
    "LASER": "Laser",
    "MOONS": "Moons",
    "ANAMORPHIC_PRO": "Anamorphic Pro",
    "VINTAGE_85MM": "Vintage 85mm",
    "CYBERPUNK": "Cyberpunk",
    "ETHEREAL": "Ethereal",
    "PRISM": "Prism",
    "SUNSET_GLOW": "Sunset Glow",
    "NEON_NIGHTS": "Neon Nights",
    "DREAMY": "Dreamy",
    "QUANTUM_FLARE": "Quantum Flare",
    "FRACTAL_DREAMS": "Fractal Dreams",
    "TIME_WARP": "Time Warp",
    "NEURAL_NETWORK": "Neural Network",
    "TORCH": "Torch"
};


const BASE_FLARE_SETTINGS = {
    intensity: 0.5,
    size: 1.2,
    size_x: 1.2,
    size_y: 1.0,
    glow_radius: 1.0,
    rays_count: 8,
    chromatic: true,
    blend_mode: 'screen',
    ghost_spacing: 0.8,
    ghost_intensity: 0.4,
    dust_amount: 0.2,
    starburst_intensity: 0.4,
    diffraction_intensity: 0.4,
    chromatic_separation: 0.6,
    color_temperature: 6500,
    lens_coating: 0.7,
    atmospheric_scatter: 0.3,
    inner_glow: 0.5,
    outer_glow: 0.4,
    ray_length: 1.0,
    ray_thickness: 0.5,
    rotation: 0,
    anamorphic_stretch: 1.5,
    starburst_position_x: 0.5,
    starburst_position_y: 0.5
};


const createGhostSettings = (count, spacingPower = 1.5) => {
    // Pre-allocate arrays for better performance
    const ghostSpacing = new Array(count);
    const ghostSizes = new Array(count);
    const ghostOpacities = new Array(count);
    
    for (let i = 0; i < count; i++) {
        ghostSpacing[i] = Math.pow(i/(count-1), spacingPower);
        ghostSizes[i] = 0.9 - (i * 0.07);
        ghostOpacities[i] = 0.5 - (i * 0.03);
    }
    
    return {
        ghostCount: count,
        ghostSpacing,
        ghostSizes,
        ghostOpacities
    };
};

export const DEFAULT_FLARE_CONFIGS = {
    "50MM_PRIME": {
        colors: {
            starburst: [255, 220, 180],
            ghost: [180, 200, 255]
        },
        mainColor: COLOR_UTILITIES.rgbToObject([255, 220, 180]),
        secondaryColor: COLOR_UTILITIES.rgbToObject([180, 200, 255]),
        ...createGhostSettings(9),
        anamorphicStretch: 1.0,
        defaultSettings: {
            ...BASE_FLARE_SETTINGS,
            intensity: 0.8,
            glow_radius: 0.7,
            ghost_intensity: 0.3,
            starburst_intensity: 0.2,
            starburst_color: [255, 220, 180],
            ghost_color: [180, 200, 255],
            starburst_position_x: 0.5,
            starburst_position_y: 0.5
        }
    },
    "COOL_FLARE": {
        colors: {
            starburst: [80, 160, 255],
            ghost: [180, 255, 220]
        },
        mainColor: {r: 80, g: 160, b: 255},
        secondaryColor: {r: 180, g: 255, b: 220},
        ...createGhostSettings(8),
        anamorphicStretch: 2.0,
        defaultSettings: {
            ...BASE_FLARE_SETTINGS,
            glow_radius: 0.6,
            ghost_intensity: 0.25,
            dust_amount: 0.03,
            starburst_intensity: 0.15,
            diffraction_intensity: 0.2,
            color_temperature: 7500,
            lens_coating: 0.4,
            starburst_intensity: 0.0,
            inner_glow: 0.3,
            outer_glow: 0.2,
            rotation: -20,
            anamorphic_stretch: 2.0,
            starburst_position_x: 0.5,
            starburst_position_y: 0.5,
            starburst_color: [180, 200, 255],
            ghost_color: [200, 220, 255]
        }
    },
    "GOBLIN": {
        colors: {
            starburst: [100, 255, 150],
            ghost: [255, 180, 100]
        },
        mainColor: {r: 255, g: 180, b: 100},
        secondaryColor: {r: 100, g: 255, b: 150},
        ...createGhostSettings(7),
        anamorphicStretch: 1.2,
        defaultSettings: {
            ...BASE_FLARE_SETTINGS,
            glow_radius: 0.95,
            rays_count: 6,
            chromatic: true,
            blend_mode: 'screen',
            ghost_spacing: 0.65,
            ghost_intensity: 0.4,
            starburst_intensity: 0.25,
            diffraction_intensity: 0.35,
            color_temperature: 4800,
            lens_coating: 0.7,
            inner_glow: 0.45,
            outer_glow: 0.35,
            ray_length: 0.85,
            ray_thickness: 0.65,
            rotation: 15,
            anamorphic_stretch: 1.2,
            starburst_position_x: 0.55,
            starburst_position_y: 0.48,
            starburst_color: [0, 255, 100],
            ghost_color: [100, 255, 150],
            starburst_position_x: 0.5,
            starburst_position_y: 0.5
        }
    },
    "GOLDEN_SUN": {
        colors: {
            starburst: [255, 200, 50],
            ghost: [255, 150, 50]
        },
        mainColor: {r: 255, g: 200, b: 50},
        secondaryColor: {r: 255, g: 150, b: 50},
        ...createGhostSettings(10),
        anamorphicStretch: 1.0,
        defaultSettings: {
            ...BASE_FLARE_SETTINGS,
            glow_radius: 0.8,
            ghost_intensity: 0.35,
            starburst_intensity: 0.4,
            diffraction_intensity: 0.3,
            color_temperature: 5800,
            lens_coating: 0.7,
            inner_glow: 0.4,
            outer_glow: 0.3,
            ray_length: 1.0,
            starburst_color: [255, 200, 50],
            ghost_color: [255, 180, 0],
            starburst_position_x: 0.5,
            starburst_position_y: 0.5
        }
    },
    "GREEN_GRANITE": {
        mainColor: {r: 150, g: 255, b: 200},
        secondaryColor: {r: 100, g: 200, b: 150},
        ...createGhostSettings(6),
        anamorphicStretch: 1.6,
        defaultSettings: {
            ...BASE_FLARE_SETTINGS,
            glow_radius: 0.8,
            ghost_intensity: 0.3,
            starburst_intensity: 0.2,
            diffraction_intensity: 0.3,
            color_temperature: 6500,
            lens_coating: 0.6,
            inner_glow: 0.35,
            outer_glow: 0.25,
            ray_length: 0.7,
            ray_thickness: 0.5,
            rotation: -15,
            anamorphic_stretch: 1.6,
            starburst_position_x: 0.45,
            starburst_position_y: 0.55,
            starburst_color: [150, 255, 200],
            ghost_color: [100, 200, 150],
            starburst_position_x: 0.5,
            starburst_position_y: 0.5
        }
    },
    "ANAMORPHIC_PRO": {
        mainColor: {r: 180, g: 220, b: 255},
        secondaryColor: {r: 100, g: 150, b: 255},
        ...createGhostSettings(8),
        anamorphicStretch: 2.5,
        defaultSettings: {
            ...BASE_FLARE_SETTINGS,
            glow_radius: 0.8,
            ghost_intensity: 0.35,
            dust_amount: 0.05,
            starburst_intensity: 0.1,
            diffraction_intensity: 0.35,
            color_temperature: 7000,
            lens_coating: 0.65,
            inner_glow: 0.4,
            outer_glow: 0.3,
            ray_length: 1.1,
            ray_thickness: 0.3,
            rotation: 0,
            anamorphic_stretch: 2.5,
            starburst_position_x: 0.5,
            starburst_position_y: 0.5,
            starburst_color: [180, 220, 255],
            ghost_color: [100, 150, 255],
            starburst_position_x: 0.5,
            starburst_position_y: 0.5
        }
    },
    "CYBERPUNK": {
        mainColor: {r: 255, g: 0, b: 255},
        secondaryColor: {r: 0, g: 255, b: 255},
        ...createGhostSettings(12),
        anamorphicStretch: 1.8,
        defaultSettings: {
            ...BASE_FLARE_SETTINGS,
            glow_radius: 1.2,
            ghost_intensity: 0.55,
            starburst_intensity: 0.7,
            diffraction_intensity: 0.6,
            color_temperature: 8500,
            lens_coating: 0.9,
            inner_glow: 0.7,
            outer_glow: 0.6,
            ray_length: 1.4,
            rotation: 45,
            starburst_color: [0, 255, 255],
            ghost_color: [255, 0, 255],
            starburst_position_x: 0.5,
            starburst_position_y: 0.5
        }
    },
    "VINTAGE_85MM": {
        mainColor: {r: 255, g: 220, b: 180},
        secondaryColor: {r: 200, g: 180, b: 160},
        ...createGhostSettings(9),
        anamorphicStretch: 1.1,
        defaultSettings: {
            ...BASE_FLARE_SETTINGS,
            glow_radius: 0.7,
            ghost_intensity: 0.3,
            starburst_intensity: 0.15,
            diffraction_intensity: 0.25,
            color_temperature: 4500,
            lens_coating: 0.5,
            inner_glow: 0.35,
            outer_glow: 0.25,
            ray_length: 0.7,
            ray_thickness: 0.5,
            rotation: 0,
            anamorphic_stretch: 1.1,
            starburst_position_x: 0.5,
            starburst_position_y: 0.5,
            starburst_color: [255, 200, 150],
            ghost_color: [200, 150, 100],
            starburst_position_x: 0.5,
            starburst_position_y: 0.5
        }
    },
    "ETHEREAL": {
        mainColor: {r: 230, g: 230, b: 255},
        secondaryColor: {r: 200, g: 220, b: 255},
        ...createGhostSettings(11),
        anamorphicStretch: 1.3,
        defaultSettings: {
            ...BASE_FLARE_SETTINGS,
            glow_radius: 1.2,
            ghost_intensity: 0.35,
            starburst_intensity: 0.3,
            diffraction_intensity: 0.4,
            color_temperature: 6800,
            lens_coating: 0.7,
            inner_glow: 0.6,
            outer_glow: 0.5,
            ray_length: 1.1,
            rotation: -15,
            starburst_color: [255, 50, 50],
            ghost_color: [255, 100, 100],
            starburst_position_x: 0.5,
            starburst_position_y: 0.5
        }
    },
    "PRISM": {
        mainColor: {r: 255, g: 200, b: 255},
        secondaryColor: {r: 200, g: 255, b: 255},
        ...createGhostSettings(10),
        anamorphicStretch: 1.5,
        defaultSettings: {
            ...BASE_FLARE_SETTINGS,
            glow_radius: 1.1,
            ghost_intensity: 0.45,
            dust_amount: 0.1,
            starburst_intensity: 0.4,
            diffraction_intensity: 0.5,
            color_temperature: 7200,
            lens_coating: 0.8,
            inner_glow: 0.55,
            outer_glow: 0.45,
            ray_length: 1.0,
            rotation: 30,
            starburst_color: [255, 200, 255],
            ghost_color: [200, 255, 255],
            starburst_position_x: 0.5,
            starburst_position_y: 0.5
        }
    },
    "SUNSET_GLOW": {
        mainColor: {r: 255, g: 150, b: 100},
        secondaryColor: {r: 255, g: 200, b: 150},
        ...createGhostSettings(8),
        anamorphicStretch: 1.2,
        defaultSettings: {
            ...BASE_FLARE_SETTINGS,
            glow_radius: 1.0,
            ghost_intensity: 0.4,
            starburst_intensity: 0.45,
            diffraction_intensity: 0.35,
            color_temperature: 4200,
            lens_coating: 0.65,
            inner_glow: 0.5,
            outer_glow: 0.4,
            ray_length: 0.95,
            ray_thickness: 0.65,
            rotation: 0,
            anamorphic_stretch: 1.2,
            starburst_position_x: 0.5,
            starburst_position_y: 0.45,
            starburst_color: [255, 150, 100],
            ghost_color: [255, 200, 150],
            starburst_position_x: 0.5,
            starburst_position_y: 0.5
        }
    },
    "NEON_NIGHTS": {
        mainColor: {r: 0, g: 255, b: 200},
        secondaryColor: {r: 255, g: 0, b: 150},
        ...createGhostSettings(10),
        anamorphicStretch: 2.2,
        defaultSettings: {
            ...BASE_FLARE_SETTINGS,
            glow_radius: 1.15,
            ghost_intensity: 0.5,
            starburst_intensity: 0.35,
            diffraction_intensity: 0.55,
            color_temperature: 8000,
            lens_coating: 0.85,
            inner_glow: 0.65,
            outer_glow: 0.55,
            ray_length: 1.2,
            rotation: -25,
            starburst_color: [0, 255, 200],
            ghost_color: [255, 0, 150],
            starburst_position_x: 0.5,
            starburst_position_y: 0.5
        }
    },
    "DREAMY": {
        mainColor: {r: 255, g: 230, b: 250},
        secondaryColor: {r: 230, g: 250, b: 255},
        ...createGhostSettings(12),
        anamorphicStretch: 1.15,
        defaultSettings: {
            ...BASE_FLARE_SETTINGS,
            glow_radius: 1.25,
            ghost_intensity: 0.32,
            starburst_intensity: 0.28,
            diffraction_intensity: 0.45,
            color_temperature: 6200,
            lens_coating: 0.62,
            inner_glow: 0.58,
            outer_glow: 0.48,
            ray_length: 1.05,
            ray_thickness: 0.48,
            rotation: -10,
            anamorphic_stretch: 1.15,
            starburst_position_x: 0.51,
            starburst_position_y: 0.49,
            starburst_color: [255, 230, 250],
            ghost_color: [230, 250, 255],
            starburst_position_x: 0.5,
            starburst_position_y: 0.5
        }
    },
    "QUANTUM_FLARE": {
        mainColor: {r: 0, g: 255, b: 180},
        secondaryColor: {r: 255, g: 0, b: 255},
        ...createGhostSettings(15),
        anamorphicStretch: 1.9,
        defaultSettings: {
            ...BASE_FLARE_SETTINGS,
            glow_radius: 1.3,
            ghost_intensity: 0.6,
            starburst_intensity: 0.75,
            diffraction_intensity: 0.7,
            color_temperature: 9000,
            lens_coating: 0.95,
            inner_glow: 0.75,
            outer_glow: 0.65,
            ray_length: 1.5,
            rotation: 60,
            starburst_color: [0, 255, 180],
            ghost_color: [255, 0, 255],
            starburst_position_x: 0.5,
            starburst_position_y: 0.5
        }
    },
    "FRACTAL_DREAMS": {
        mainColor: {r: 255, g: 100, b: 255},
        secondaryColor: {r: 100, g: 255, b: 255},
        ...createGhostSettings(13),
        anamorphicStretch: 1.7,
        defaultSettings: {
            ...BASE_FLARE_SETTINGS,
            glow_radius: 1.22,
            ghost_intensity: 0.52,
            starburst_intensity: 0.65,
            diffraction_intensity: 0.62,
            color_temperature: 8200,
            lens_coating: 0.88,
            inner_glow: 0.68,
            outer_glow: 0.58,
            ray_length: 1.35,
            rotation: -35,
            starburst_color: [255, 100, 255],
            ghost_color: [100, 255, 255],
            starburst_position_x: 0.5,
            starburst_position_y: 0.5
        }
    },
    "TIME_WARP": {
        mainColor: {r: 255, g: 255, b: 0},
        secondaryColor: {r: 0, g: 255, b: 255},
        ...createGhostSettings(14),
        anamorphicStretch: 2.1,
        defaultSettings: {
            ...BASE_FLARE_SETTINGS,
            glow_radius: 1.28,
            ghost_intensity: 0.56,
            starburst_intensity: 0.7,
            diffraction_intensity: 0.66,
            color_temperature: 8800,
            lens_coating: 0.92,
            inner_glow: 0.72,
            outer_glow: 0.62,
            ray_length: 1.45,
            rotation: 75,
            starburst_color: [255, 255, 0],
            ghost_color: [0, 255, 255],
            starburst_position_x: 0.5,
            starburst_position_y: 0.5
        }
    },
    "NEURAL_NETWORK": {
        mainColor: {r: 0, g: 255, b: 255},
        secondaryColor: {r: 255, g: 128, b: 0},
        ...createGhostSettings(16),
        anamorphicStretch: 1.8,
        defaultSettings: {
            ...BASE_FLARE_SETTINGS,
            glow_radius: 1.2,
            ghost_intensity: 0.55,
            starburst_intensity: 0.65,
            diffraction_intensity: 0.6,
            color_temperature: 7800,
            lens_coating: 0.85,
            inner_glow: 0.65,
            outer_glow: 0.55,
            ray_length: 1.3,
            rotation: -30,
            starburst_color: [0, 255, 255],
            ghost_color: [255, 128, 0],
            starburst_position_x: 0.5,
            starburst_position_y: 0.5
        }
    },
    "TORCH": {
        mainColor: {r: 255, g: 150, b: 50},
        secondaryColor: {r: 255, g: 200, b: 100},
        ...createGhostSettings(10),
        anamorphicStretch: 1.5,
        defaultSettings: {
            ...BASE_FLARE_SETTINGS,
            glow_radius: 1.1,
            ghost_intensity: 0.45,
            dust_amount: 0.1,
            starburst_intensity: 0.4,
            diffraction_intensity: 0.5,
            color_temperature: 3000,
            lens_coating: 0.8,
            inner_glow: 0.55,
            outer_glow: 0.45,
            ray_length: 1.0,
            ray_thickness: 0.55,
            rotation: 30,
            starburst_color: [255, 150, 50],
            ghost_color: [255, 200, 100],
            starburst_position_x: 0.5,
            starburst_position_y: 0.5
        }
    },
    "GREEN_SPOTLIGHT": {
        mainColor: {r: 100, g: 255, b: 150},
        secondaryColor: {r: 150, g: 255, b: 200},
        ...createGhostSettings(8),
        anamorphicStretch: 1.8,
        defaultSettings: {
            ...BASE_FLARE_SETTINGS,
            glow_radius: 1.1,
            ghost_intensity: 0.45,
            dust_amount: 0.1,
            starburst_intensity: 0.4,
            diffraction_intensity: 0.5,
            color_temperature: 7000,
            lens_coating: 0.8,
            inner_glow: 0.6,
            outer_glow: 0.4,
            ray_length: 1.2,
            ray_thickness: 0.4,
            rotation: 15,
            anamorphic_stretch: 1.8,
            starburst_position_x: 0.5,
            starburst_position_y: 0.5,
            starburst_color: [100, 255, 150],
            ghost_color: [150, 255, 200],
            starburst_position_x: 0.5,
            starburst_position_y: 0.5
        }
    },
    "LASER": {
        mainColor: {r: 255, g: 50, b: 50},
        secondaryColor: {r: 255, g: 100, b: 100},
        ...createGhostSettings(10),
        anamorphicStretch: 2.0,
        defaultSettings: {
            ...BASE_FLARE_SETTINGS,
            size_x: 3.0,
            size_y: 0.2,
            glow_radius: 1.2,
            ghost_intensity: 0.5,
            starburst_intensity: 0.45,
            diffraction_intensity: 0.6,
            color_temperature: 6500,
            lens_coating: 0.85,
            inner_glow: 0.7,
            outer_glow: 0.5,
            ray_length: 1.4,
            rotation: -20,
            starburst_color: [255, 50, 50],
            ghost_color: [255, 100, 100],
            starburst_position_x: 0.5,
            starburst_position_y: 0.5
        }
    },
    "MOONS": {
        mainColor: {r: 200, g: 200, b: 255},
        secondaryColor: {r: 180, g: 180, b: 255},
        ...createGhostSettings(12),
        anamorphicStretch: 1.2,
        defaultSettings: {
            ...BASE_FLARE_SETTINGS,
            glow_radius: 1.15,
            ghost_intensity: 0.4,
            starburst_intensity: 0.35,
            diffraction_intensity: 0.45,
            color_temperature: 7200,
            lens_coating: 0.75,
            inner_glow: 0.55,
            outer_glow: 0.45,
            ray_length: 1.1,
            rotation: 0,
            starburst_color: [200, 200, 255],
            ghost_color: [180, 180, 255],
            starburst_position_x: 0.5,
            starburst_position_y: 0.5
        }
    }
};

export const BLEND_MODES = {
    "Normal": "normal",
    "Screen": "screen",
    "Add": "add",
    "Overlay": "overlay",
    "Soft Light": "soft-light",
    "Hard Light": "hard-light",
    "Color Dodge": "color-dodge",
    "Linear Dodge": "linear-dodge"
};



export const DEFAULT_WIDGET_VALUES = {
    flare_type: "50MM_PRIME",
    intensity: 0.35,
    size: 1.0,
    size_x: 1.0,
    size_y: 1.0,
    position_x: 0.5,
    position_y: 0.5,
    starburst_position_x: 0.5,
    starburst_position_y: 0.5,
    rotation: 0.0,
    glow_radius: 1.0,
    rays_count: 8,
    chromatic: false,
    blend_mode: "screen",
    anamorphic_stretch: 1.4,
    ghost_spacing: 0.7,
    ghost_intensity: 0.35,
    dust_amount: 0.2,
    starburst_intensity: 0.3,
    diffraction_intensity: 0.3,
    chromatic_separation: 0.6,
    color_temperature: 6500,
    lens_coating: 0.7,
    atmospheric_scatter: 0.2,
    inner_glow: 0.4,
    outer_glow: 0.3,
    ray_length: 1.0,
    ray_thickness: 0.7
};

export const SLIDER_RANGES = {
    intensity: { min: 0, max: 2, step: 0.01, precision: 2 },
    size: { min: 0.1, max: 3, step: 0.01, precision: 2 },
    size_x: { min: 0.1, max: 3, step: 0.01, precision: 2 },
    size_y: { min: 0.1, max: 3, step: 0.01, precision: 2 },
    position_x: { min: 0, max: 1, step: 0.01, precision: 2 },
    position_y: { min: 0, max: 1, step: 0.01, precision: 2 },
    starburst_position_x: { min: 0, max: 1, step: 0.01, precision: 2 },
    starburst_position_y: { min: 0, max: 1, step: 0.01, precision: 2 },
    rotation: { min: 0, max: 360, step: 1, precision: 0 },
    glow_radius: { min: 0.1, max: 2, step: 0.01, precision: 2 },
    rays_count: { min: 4, max: 16, step: 1, precision: 0 },
    anamorphic_stretch: { min: 1, max: 5, step: 0.1, precision: 1 },
    bokeh_amount: { min: 0, max: 1, step: 0.01, precision: 2 },
    ghost_spacing: { min: 0.5, max: 2, step: 0.01, precision: 2 },
    ghost_intensity: { min: 0, max: 5, step: 0.01, precision: 2 },
    dust_amount: { min: 0, max: 1, step: 0.01, precision: 2 },
    starburst_intensity: { min: 0, max: 1, step: 0.01, precision: 2 },
    diffraction_intensity: { min: 0, max: 1, step: 0.01, precision: 2 },
    chromatic_separation: { min: 0.5, max: 2, step: 0.01, precision: 2 },
    color_temperature: { min: 3000, max: 10000, step: 100, precision: 0 },
    lens_coating: { min: 0, max: 1, step: 0.01, precision: 2 },
    atmospheric_scatter: { min: 0, max: 1, step: 0.01, precision: 2 },
    inner_glow: { min: 0, max: 1, step: 0.01, precision: 2 },
    outer_glow: { min: 0, max: 1, step: 0.01, precision: 2 },
    ray_length: { min: 0.5, max: 2, step: 0.01, precision: 2 },
    ray_thickness: { min: 0.5, max: 2, step: 0.01, precision: 2 }
};

export const ATMOSPHERIC_CONSTANTS = {
    DEFAULT: {
        humidity: 0.4,
        airDensity: 0.2,
        atmosphericDiffusion: 0.2,
        temperature: 6500,
        turbulence: 0.2
    },
    SCATTER: {
        radius_multiplier: 0.1,
        distance_start: 0.2,
        distance_range: 0.6,
        opacity_multiplier: 0.2
    }
};

export const COLOR_TEMPERATURE = {
    THRESHOLD: 6600,
    RGB: {
        RED: {
            below: 255,
            above: -55
        },
        GREEN: {
            below: -2,
            above: -50
        },
        BLUE: {
            below: -10,
            above: 255
        }
    },
    PRESETS: {
        TUNGSTEN: 2700,
        HALOGEN: 3400,
        FLUORESCENT: 4200,
        DAYLIGHT: 5500,
        FLASH: 6000,
        CLOUDY: 6500,
        SHADE: 7500,
        BLUE_SKY: 10000
    },
    TINT_COMPENSATION: {
        WARM: { r: 1.1, g: 1.0, b: 0.9 },
        COOL: { r: 0.9, g: 1.0, b: 1.1 },
        NEUTRAL: { r: 1.0, g: 1.0, b: 1.0 }
    }
};

export const SLIDER_CATEGORIES = {
    BASIC: {
        name: "Basic",
        sliders: [
            { key: "intensity", label: "Intensity", icon: "⚡" },
            { key: "size", label: "Size", icon: "⭕" },
            { key: "size_x", label: "Size X", icon: "↔️" },
            { key: "size_y", label: "Size Y", icon: "↕️" }
        ]
    },
    RAYS: {
        name: "Rays",
        sliders: [
            { key: "glow_radius", label: "Glow", icon: "✨" },
            { key: "rays_count", label: "Ray Count", icon: "☀️" },
            { key: "ray_length", label: "Ray Length", icon: "📏" },
            { key: "ray_thickness", label: "Ray Thickness", icon: "⬍" }
        ]
    },
    GHOST: {
        name: "Ghost",
        sliders: [
            { key: "ghost_spacing", label: "Ghost Spacing", icon: "↔️" },
            { key: "ghost_intensity", label: "Ghost", icon: "👻" },
            { key: "diffraction_intensity", label: "Diffraction", icon: "🌈" }
        ]
    },
    COLOR: {
        name: "Color",
        sliders: [
            { key: "chromatic_separation", label: "Chromatic", icon: "🎨" },
            { key: "color_temperature", label: "Temperature", icon: "🌡️" },
            { key: "lens_coating", label: "Lens Coating", icon: "🔍" }
        ]
    },
    EFFECTS: {
        name: "Effects",
        sliders: [
            { key: "dust_amount", label: "Dust", icon: "💨" },
            { key: "starburst_intensity", label: "Starburst", icon: "💫" },
            { key: "atmospheric_scatter", label: "Atmosphere", icon: "🌫️" }
        ]
    },
    GLOW: {
        name: "Glow",
        sliders: [
            { key: "inner_glow", label: "Inner Glow", icon: "⭐" },
            { key: "outer_glow", label: "Outer Glow", icon: "🌟" }
        ]
    },
    POSITION: {
        name: "Position",
        sliders: [
            { key: "position_x", label: "Position X", icon: "⬅️" },
            { key: "position_y", label: "Position Y", icon: "⬆️" },
            { key: "starburst_position_x", label: "Starburst X", icon: "◀️" },
            { key: "starburst_position_y", label: "Starburst Y", icon: "🔼" }
        ]
    },
    TRANSFORM: {
        name: "Transform",
        sliders: [
            { key: "rotation", label: "Rotation", icon: "🔄" },
            { key: "anamorphic_stretch", label: "Anamorphic", icon: "⬌" }
        ]
    }
};

export const VALUE_FORMATTERS = {
    COLOR_TEMPERATURE: (value) => `${Math.round(value)}K`,
    ROTATION: (value) => `${Math.round(value)}°`,
    POSITION: (value) => value.toFixed(2),
    DEFAULT: (value) => value.toFixed(2)
};

export const SLIDER_STYLES = {
    CATEGORY: {
        CONTAINER: `
            grid-column: span 2;
            margin-bottom: 16px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding-bottom: 12px;
            background: rgba(0,0,0,0.2);
            border-radius: 8px;
            padding: 16px;
        `,
        HEADER: `
            color: #666;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 6px;
        `,
        GRID: `
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        `
    }
};

export const PERFORMANCE_CONSTANTS = {
    RENDER_THROTTLE: 16,
    SLIDER_UPDATE_THROTTLE: 32,
    CACHE_SIZE: 10,
    DUST_PATTERN_CACHE_SIZE: 20,
    MAX_COLOR_CACHE_SIZE: 500
};

export const UI_STYLES = {
    DIALOG: {
        MAIN: `
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
        `,
        HEADER: `
            padding: 16px 20px;
            background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(255,255,255,0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: move;
        `,
        CONTENT: `
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            max-height: calc(80vh - 120px);
        `,
        CLOSE_BUTTON: `
            cursor: pointer;
            padding: 8px;
            border-radius: 8px;
            transition: all 0.2s ease;
            background: rgba(255,255,255,0.05);
            display: flex;
            align-items: center;
            justify-content: center;
        `,
        BUTTON_CONTAINER: `
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            padding: 16px 20px;
            border-top: 1px solid rgba(255,255,255,0.05);
        `
    },
    SECTION: {
        CONTROL: `
            background: rgba(0,0,0,0.2);
            padding: 16px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.05);
        `,
        HEADER: `
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
        `,
        TITLE: `
            color: #eee;
            font-size: 13px;
            font-weight: 500;
        `
    },
    COLOR: {
        INPUT_CONTAINER: `
            display: flex;
            align-items: center;
            background: rgba(0,0,0,0.2);
            padding: 6px;
            border-radius: 6px;
            border: 1px solid rgba(255,255,255,0.05);
        `,
        INPUT: `
            width: 24px;
            height: 24px;
            border: none;
            background: none;
            cursor: pointer;
        `,
        HEX_DISPLAY: `
            margin-left: 6px;
            font-family: monospace;
            color: #aaa;
            font-size: 10px;
        `,
        LABEL: `
            display: block; 
            color: #888; 
            font-size: 11px; 
            margin-bottom: 4px;
        `
    },
    BUTTON: {
        PRIMARY: `
            background: linear-gradient(45deg, #4a9eff, #2d7ed9);
            color: #fff;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s ease;
        `,
        SECONDARY: `
            background: rgba(255,255,255,0.05);
            color: #ccc;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 6px;
            padding: 8px 16px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s ease;
        `
    },
    GRID: {
        COLUMNS_3: `
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
        `,
        COLUMNS_2: `
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 4px;
        `,
        COLUMNS_7: `
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 4px;
        `,
        COLUMNS_AUTO_FIT: `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 16px;
        `,
        FLEX_COLUMN: `
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 8px;
        `
    },
    SLIDER_GROUP: {
        CONTAINER: `
            /* background: rgba(0,0,0,0.2); */ /* Removed background */
            padding: 6px;
            border-radius: 5px;
        `,
        HEADER: `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
        `,
        HEADER_LABEL: `
            color: #888;
            font-size: 11px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 6px;
        `,
        HEADER_ICON: `
            display: inline-flex;
            align-items: center;
            justify-content: center;
        `,
        HEADER_VALUE: `
            color: #4a9eff;
            font-size: 11px;
            font-weight: 500;
        `,
        SLIDER_CONTAINER: `
            background: rgba(255,255,255,0.03);
            border-radius: 4px;
            padding: 2px;
            position: relative;
        `,
        SLIDER_INPUT: `
            width: 100%;
            -webkit-appearance: none;
            background: linear-gradient(90deg, #4a9eff var(--percent, 50%), rgba(255,255,255,0.1) var(--percent, 50%));
            cursor: pointer;
            height: 4px;
            border-radius: 2px;
        `,
        CATEGORY_CONTAINER: `
            background: rgba(0,0,0,0.2);
            padding: 16px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.05);
        `,
        CATEGORY_HEADER: `
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
        `,
        CATEGORY_HEADER_ICON: `
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: #4a9eff;
        `,
        CATEGORY_HEADER_TEXT: `
            color: #eee;
            font-size: 13px;
            font-weight: 500;
        `,
        CATEGORY_SLIDERS_CONTAINER: `
            display: flex;
            flex-direction: column;
            gap: 10px;
        `
    }
};

export const NODE_UI_CONSTANTS = {
    PADDING: 20,
    SECTION_SPACING: 25,
    PREVIEW_HEIGHT: 320,
    HEADER_HEIGHT: 40,
    CONTROL_HEIGHT: 30,
    SLIDER_WIDTH: 360,
    DIALOG_HEADER_HEIGHT: 40
};

export const SLIDER_CONFIG = {
    DEFAULT: [
        { key: "intensity", label: "Intensity", min: 0, max: 2 }
    ]
};

export const ATMOSPHERIC_EFFECTS = {
    DIFFUSION: {
        GLOW_STOPS: [
            { position: 0, opacity: 0.15, color: 'rgba(255, 255, 255, 0.3)' },
            { position: 0.4, opacity: 0.1, color: 'rgba(255, 255, 255, 0.2)' },
            { position: 0.8, opacity: 0.05, color: 'rgba(255, 255, 255, 0.1)' },
            { position: 1, opacity: 0, color: 'rgba(255, 255, 255, 0)' }
        ],
        RADIUS_MULTIPLIER: 2.0,
        BLUR_AMOUNT: 0.5,
        COLOR_TEMPERATURE: 7000
    },
    DUST_PARTICLES: {
        COUNT_MULTIPLIER: 50,
        // Memoized arrays
        _angles: null,
        _distances: null,
        _sizes: null,
        _opacities: null,
        
        get ANGLES() {
            if (!this._angles) {
                this._angles = Array.from({ length: 12 }, (_, i) => i * 30);
            }
            return this._angles;
        },
        get DISTANCES() {
            if (!this._distances) {
                this._distances = Array.from({ length: 12 }, (_, i) => (i + 3) * 0.1);
            }
            return this._distances;
        },
        get SIZES() {
            if (!this._sizes) {
                this._sizes = Array.from({ length: 12 }, (_, i) => (i + 5) * 0.2);
            }
            return this._sizes;
        },
        get OPACITIES() {
            if (!this._opacities) {
                this._opacities = Array.from({ length: 12 }, (_, i) => (i + 1) * 0.02);
            }
            return this._opacities;
        },
        PATTERN: {
            NOISE_SCALE: 0.8,
            TURBULENCE: 0.4,
            DETAIL_LEVELS: 3,
            BASE_FREQUENCY: 0.1,
            PERSISTENCE: 0.7
        },
        GLOW: {
            STOPS: [
                { position: 0, opacityMultiplier: 1 },
                { position: 0.5, opacityMultiplier: 0.5 },
                { position: 1, opacityMultiplier: 0 }
            ],
            COLOR: [255, 255, 255]
        }
    }
};

export const CINEMATIC_LIGHT = {
    MAIN_LIGHT: {
        STOPS: [
            { position: 0, opacity: 1.0, color: 'rgba(255, 255, 200, 0.9)' },
            { position: 0.3, opacity: 0.8, color: 'rgba(255, 255, 200, 0.7)' },
            { position: 0.6, opacity: 0.6, color: 'rgba(255, 255, 200, 0.5)' },
            { position: 1, opacity: 0, color: 'rgba(255, 255, 200, 0)' }
        ]
    },
    SECONDARY_LIGHT: {
        RADIUS: {
            INNER: 0.9,
            OUTER: 1.5
        },
        STOPS: [
            { position: 0, opacity: 0, color: 'rgba(255, 255, 255, 0)' },
            { position: 0.5, opacity: 0.3, color: 'rgba(255, 255, 255, 0.2)' },
            { position: 1, opacity: 0, color: 'rgba(255, 255, 255, 0)' }
        ]
    }
};

export const STARBURST_STYLES = {
    GRADIENT: {
        STOPS: [
            { position: 0, opacityMultiplier: 1 },
            { position: 0.5, opacityMultiplier: 0.7 },
            { position: 1, opacityMultiplier: 0, color: 'rgba(0,0,0,0)' }
        ]
    },
    DEFAULT_COLOR: [255, 255, 255]
};

export const GRADIENT_HELPERS = {
    TYPES: {
        RADIAL: 'radial',
        LINEAR: 'linear'
    },
    createGradientConfig: (type, stops, radius = 1) => ({
        type,
        stops,
        radius
    })
};

export const GHOST_PRESETS = {
    DEFAULT: { count: 8, spacingPower: 1.5 },
    STRONG: { count: 6, spacingPower: 1.8 },
    SUBTLE: { count: 10, spacingPower: 1.2 }
};

export function createPresetGhostSettings(presetName = 'DEFAULT') {
    const preset = GHOST_PRESETS[presetName] || GHOST_PRESETS.DEFAULT;
    return createGhostSettings(preset.count, preset.spacingPower);
}

// Pre-compute sine and cosine values for common angles
const SIN_CACHE = new Float32Array(361); // 0-360 degrees
const COS_CACHE = new Float32Array(361);

// Initialize cache
for (let i = 0; i <= 360; i++) {
    const rad = i * Math.PI / 180;
    SIN_CACHE[i] = Math.sin(rad);
    COS_CACHE[i] = Math.cos(rad);
}

export const VECTOR_UTILS = {
    // Get cached sine/cosine for integer degrees
    getCachedSin: (degrees) => {
        const intDeg = Math.round(degrees) % 360;
        return SIN_CACHE[intDeg >= 0 ? intDeg : intDeg + 360];
    },
    
    getCachedCos: (degrees) => {
        const intDeg = Math.round(degrees) % 360;
        return COS_CACHE[intDeg >= 0 ? intDeg : intDeg + 360];
    },
    
    // Optimized versions using cached values when possible
    polarToCartesian: (radius, angleDeg) => {
        if (Number.isInteger(angleDeg)) {
            return {
                x: radius * VECTOR_UTILS.getCachedCos(angleDeg),
                y: radius * VECTOR_UTILS.getCachedSin(angleDeg)
            };
        }
        const angle = angleDeg * Math.PI / 180;
        return {
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        };
    },
    
    rotatePoint: (x, y, angleDeg) => {
        if (Number.isInteger(angleDeg)) {
            const cos = VECTOR_UTILS.getCachedCos(angleDeg);
            const sin = VECTOR_UTILS.getCachedSin(angleDeg);
            return {
                x: x * cos - y * sin,
                y: x * sin + y * cos
            };
        }
        const angle = angleDeg * Math.PI / 180;
        return {
            x: x * Math.cos(angle) - y * Math.sin(angle),
            y: x * Math.sin(angle) + y * Math.cos(angle)
        };
    }
};

export const RENDER_CONSTANTS = {
    DIFFRACTION: {
        RING_COUNT: 6,
        RING_SPACING: 0.15,
        BASE_INTENSITY: 0.15,
        INTENSITY_DECAY: 0.12,
        DETAIL_RING_INNER: 0.98,
        DETAIL_RING_OUTER: 1.02
    },
    ATMOSPHERIC: {
        LAYER_COUNT: 4,
        BASE_RADIUS: 1.2,
        RADIUS_INCREMENT: 0.2,
        INTENSITY_DECAY: 0.2,
        GLOW_STOPS: {
            START: 0.1,
            MIDDLE: 0.05,
            END: 0
        }
    },
    COATING: {
        BASE_OPACITY: 0.3,
        SECONDARY_OPACITY: 0.15,
        COLOR_BLEND: {
            PRIMARY: 0.8,
            SECONDARY: 0.2
        }
    },
    MAIN_GLOW: {
        TEMPERATURE_ADJUSTMENT: {
            BASE: 6500,
            SCALE: 4000,
            RED_FACTOR: 50,
            GREEN_FACTOR: 30,
            BLUE_FACTOR: -80
        },
        OPACITY_STOPS: [
            { position: 0, opacity: 1.0 },
            { position: 0.4, opacity: 0.7 },
            { position: 0.7, opacity: 0.4 },
            { position: 1.0, opacity: 0 }
        ]
    }
};


export const LENS_CHARACTERISTICS = {
    SPHERICAL_ABERRATION: {
        MIN: 0,
        MAX: 1,
        DEFAULT: 0.3
    },
    ASTIGMATISM: {
        MIN: 0,
        MAX: 1,
        DEFAULT: 0.2,
        ANGLE_FACTOR: Math.PI
    },
    COATING: {
        MIN: 0,
        MAX: 1,
        DEFAULT: 0.7
    }
};

// Helper functions - moved from LensFlareNode.js
export const FORMAT_HELPERS = {
    _valueCache: new Map(),
    
    formatSliderValue: (key, value) => {
        const cacheKey = `${key}_${value}`;
        if (FORMAT_HELPERS._valueCache.has(cacheKey)) {
            return FORMAT_HELPERS._valueCache.get(cacheKey);
        }
        
        let result;
        switch(key) {
            case "color_temperature": result = `${Math.round(value)}K`; break;
            case "rotation": result = `${Math.round(value)}°`; break;
            case "position_x":
            case "position_y":
            case "starburst_position_x":
            case "starburst_position_y": result = value.toFixed(2); break;
            default: result = value.toFixed(2);
        }
        
        // Only cache if the cache isn't too large
        if (FORMAT_HELPERS._valueCache.size < PERFORMANCE_CONSTANTS.MAX_COLOR_CACHE_SIZE) {
            FORMAT_HELPERS._valueCache.set(cacheKey, result);
        }
        
        return result;
    },
    
    createColorString: (color, opacity = 1) => {
        if (Array.isArray(color)) {
            return `rgba(${color[0]},${color[1]},${color[2]},${opacity})`;
        }
        return color;
    },
    
    // Enhanced gradient creation with minimal object creation
    createGradient: (ctx, config, x = 0, y = 0) => {
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
    }
};

// Create a reusable canvas for conversions
let _conversionCanvas = null;
let _conversionCtx = null;
// Dust pattern cache for expensive generation
const _dustPatternCache = new Map();

// Global helper functions
export const UI_HELPERS = {
    // Convert ImageData to a data URL
    imageDataToUrl: (data) => {
        if (!_conversionCanvas) {
            _conversionCanvas = document.createElement('canvas');
            _conversionCtx = _conversionCanvas.getContext('2d');
        }
        
        // Resize only if needed
        if (_conversionCanvas.width !== data.width || _conversionCanvas.height !== data.height) {
            _conversionCanvas.width = data.width;
            _conversionCanvas.height = data.height;
        }
        
        _conversionCtx.putImageData(data, 0, 0);
        return _conversionCanvas.toDataURL('image/png');
    },
    
    // Check whether a position is inside a given area
    isInBounds: (x, y, area) => {
        return x >= area.x && 
               x <= area.x + area.width && 
               y >= area.y && 
               y <= area.y + area.height;
    },
    
    // Optimized deterministic noise function
    generateNoise: (x, y, freq) => {
        return Math.sin(x * freq) * Math.cos(y * freq) * 
               Math.sin((x + y) * freq * 0.5) * 0.5 + 0.5;
    },
    
    // Optimized dust pattern generation with caching
    generateDustPattern: (ctx, size, params, id) => {
        // Create a cache key based on parameters
        const dust_density = params?.dust_density || 0.3;
        const cacheKey = `${size}_${id || "default"}_${dust_density.toFixed(2)}`;
        
        // Return cached pattern if available
        if (_dustPatternCache.has(cacheKey)) {
            return _dustPatternCache.get(cacheKey);
        }
        
        const { NOISE_SCALE, TURBULENCE, DETAIL_LEVELS, BASE_FREQUENCY, PERSISTENCE } = ATMOSPHERIC_EFFECTS.DUST_PARTICLES.PATTERN;
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = size;
        tempCanvas.height = size;
        const tempCtx = tempCanvas.getContext('2d');

        const imageData = tempCtx.createImageData(size, size);
        const data = imageData.data;

        // Create a hash key for this dust pattern to ensure it's always the same
        const patternKey = `${size}_${id || "default"}`;
        
        // Generate a deterministic seed based on the pattern key
        let seed = 0;
        for (let i = 0; i < patternKey.length; i++) {
            seed += patternKey.charCodeAt(i);
        }

        // Pre-compute sin/cos lookup values for the pattern
        const xSin = new Float32Array(size);
        const yCos = new Float32Array(size);
        for (let i = 0; i < size; i++) {
            xSin[i] = Math.sin((i + seed) / size * Math.PI * 2) * TURBULENCE;
            yCos[i] = Math.cos((i + seed) / size * Math.PI * 2) * TURBULENCE;
        }

        // Calculate threshold once
        const threshold = 1 - dust_density;
        const invThreshold = 1 - threshold > 0 ? 255 / (1 - threshold) : 0;

        for (let y = 0; y < size; y++) {
            const deterministicTurbulenceY = yCos[y];
            
            for (let x = 0; x < size; x++) {
                const index = (y * size + x) * 4;
                let value = 0;
                let amplitude = 1;
                let frequency = BASE_FREQUENCY;
                const deterministicTurbulenceX = xSin[x];
                
                for (let i = 0; i < DETAIL_LEVELS; i++) {
                    value += UI_HELPERS.generateNoise(
                        x * NOISE_SCALE + deterministicTurbulenceX,
                        y * NOISE_SCALE + deterministicTurbulenceY,
                        frequency
                    ) * amplitude;
                    
                    frequency *= 2;
                    amplitude *= PERSISTENCE;
                }

        // Normalize noise value into the [0, 1] range
                value = Math.max(0, Math.min(1, value / DETAIL_LEVELS));
                
        // Optimized threshold filter
                const alpha = value > threshold ? (value - threshold) * invThreshold : 0;
                
                data[index] = 255;     // R
                data[index + 1] = 255; // G
                data[index + 2] = 255; // B
                data[index + 3] = alpha; // Alpha
            }
        }

        tempCtx.putImageData(imageData, 0, 0);
        
        // Cache management - remove oldest entry if cache is full
        if (_dustPatternCache.size >= PERFORMANCE_CONSTANTS.DUST_PATTERN_CACHE_SIZE) {
            const firstKey = _dustPatternCache.keys().next().value;
            _dustPatternCache.delete(firstKey);
        }
        
        _dustPatternCache.set(cacheKey, tempCanvas);
        return tempCanvas;
    }
};

