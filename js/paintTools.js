import { TOOL_SETTINGS, BRUSH_SIZES, BRUSH_TEXTURES } from './paintConstants.js';
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const clamp01 = (value) => Math.max(0, Math.min(1, value));
const clampRGB = (value) => Math.max(0, Math.min(255, value));

// Canvas utility helper class - reduces repeated code
class CanvasUtils {
    static createCanvas(width, height, fillStyle = null) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', {
            willReadFrequently: true,
            alpha: true
        });
        
        if (fillStyle && ctx) {
            ctx.fillStyle = fillStyle;
            ctx.fillRect(0, 0, width, height);
        }
        
        return { canvas, ctx };
    }
}
const MathCache = {
  _sqrtCache: new Map(),
  _powCache: new Map(),
  _sinCache: new Float32Array(3600), 
  _cosCache: new Float32Array(3600),
  init() {
    if (this._sinCache[0] === 0 && this._cosCache[0] !== 1) return; 
    for (let i = 0; i < 3600; i++) {
      const angle = (i * Math.PI) / 1800; 
      this._sinCache[i] = Math.sin(angle);
      this._cosCache[i] = Math.cos(angle);
    }
  },
  sqrt(value) {
    if (this._sqrtCache.has(value)) return this._sqrtCache.get(value);
    const result = Math.sqrt(value);
    if (this._sqrtCache.size < 1000) this._sqrtCache.set(value, result);
    return result;
  },
  pow(base, exp) {
    const key = `${base}_${exp}`;
    if (this._powCache.has(key)) return this._powCache.get(key);
    const result = Math.pow(base, exp);
    if (this._powCache.size < 1000) this._powCache.set(key, result);
    return result;
  },
  sin(degrees) {
    this.init();
    const index = Math.round((degrees % 360) * 10);
    const positiveIndex = index >= 0 ? index : index + 3600;
    return this._sinCache[positiveIndex % 3600];
  },
  cos(degrees) {
    this.init();
    const index = Math.round((degrees % 360) * 10);
    const positiveIndex = index >= 0 ? index : index + 3600;
    return this._cosCache[positiveIndex % 3600];
  },
  distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return this.sqrt(dx * dx + dy * dy);
  },
  lerp(a, b, t) {
    return a + t * (b - a);
  },
  smoothstep(edge0, edge1, x) {
    const t = clamp01((x - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
  },
  cubicBezier(t, p0, p1, p2, p3) {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    return uuu * p0 + 3 * uu * t * p1 + 3 * u * tt * p2 + ttt * p3;
  }
};
const _hexColorCache = new Map();
const CanvasContextManager = {
    withContext(ctx, operations, options = {}) {
        ctx.save();
        if (options.alpha !== undefined) ctx.globalAlpha = options.alpha;
        if (options.fillStyle) ctx.fillStyle = options.fillStyle;
        if (options.strokeStyle) ctx.strokeStyle = options.strokeStyle;
        if (options.lineWidth !== undefined) ctx.lineWidth = options.lineWidth;
        if (options.lineCap) ctx.lineCap = options.lineCap;
        if (options.lineJoin) ctx.lineJoin = options.lineJoin;
        if (options.globalCompositeOperation) ctx.globalCompositeOperation = options.globalCompositeOperation;
        if (options.filter) ctx.filter = options.filter;
        if (options.imageSmoothingEnabled !== undefined) ctx.imageSmoothingEnabled = options.imageSmoothingEnabled;
        if (options.translate) ctx.translate(options.translate.x, options.translate.y);
        if (options.rotate) ctx.rotate(options.rotate);
        if (options.scale) ctx.scale(options.scale.x, options.scale.y);
        try {
            operations(ctx);
        } finally {
            ctx.restore();
        }
    },
    createRadialGradient(ctx, centerX, centerY, radius, colorStops) {
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        colorStops.forEach(({ stop, color }) => gradient.addColorStop(stop, color));
        return gradient;
    },
    createLinearGradient(ctx, x1, y1, x2, y2, colorStops) {
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        colorStops.forEach(({ stop, color }) => gradient.addColorStop(stop, color));
        return gradient;
    },
    drawCircle(ctx, x, y, radius, fillStyle, strokeStyle = null, lineWidth = 1) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        if (fillStyle) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }
        if (strokeStyle) {
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
        }
    },
    applyTexture(ctx, texturePattern, bounds, options = {}) {
        this.withContext(ctx, () => {
            if (bounds.clip) {
                ctx.beginPath();
                if (bounds.type === 'circle') {
                    ctx.arc(bounds.x, bounds.y, bounds.radius, 0, Math.PI * 2);
                } else {
                    ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
                }
                ctx.clip();
            }
            ctx.fillStyle = texturePattern;
            ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        }, {
            alpha: options.alpha || 0.5,
            globalCompositeOperation: options.blendMode || 'multiply'
        });
    }
};
class AdvancedRandom {
  static _seed = 12345; 
  static _perlinSeed = 54321;
  static _permutation = []; 
  static _gradients = []; 
  static lcg() {
    this._seed = (this._seed * 1664525 + 1013904223) % Math.pow(2, 32);
    return this._seed / Math.pow(2, 32);
  }
  static seeded(seed = null) {
    if (seed !== null) this._seed = seed;
    return this.lcg();
  }
  static gaussian(mean = 0, stdDev = 1) {
    if (!this._nextGaussian) {
      const u = this.lcg();
      const v = this.lcg();
      const z0 = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      const z1 = Math.sqrt(-2.0 * Math.log(u)) * Math.sin(2.0 * Math.PI * v);
      this._nextGaussian = z1 * stdDev + mean;
      return z0 * stdDev + mean;
    } else {
      const result = this._nextGaussian;
      this._nextGaussian = null;
      return result;
    }
  }
  static range(min, max) {
    return min + (max - min) * this.lcg();
  }
  static int(min, max) {
    return Math.floor(this.range(min, max + 1));
  }
  static initPerlin() {
    if (this._permutation.length === 0) {
      for (let i = 0; i < 256; i++) this._permutation[i] = i;
      for (let i = 255; i > 0; i--) {
        const j = Math.floor(this.lcg() * (i + 1));
        [this._permutation[i], this._permutation[j]] = [this._permutation[j], this._permutation[i]];
      }
      for (let i = 0; i < 256; i++) this._permutation[256 + i] = this._permutation[i];
      this._gradients = [
        [1,1], [-1,1], [1,-1], [-1,-1],
        [1,0], [-1,0], [0,1], [0,-1]
      ];
    }
  }
  static perlin(x, y) {
    this.initPerlin();
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
    const u = fade(x);
    const v = fade(y);
    const grad = (hash, x, y) => {
      const g = this._gradients[hash & 7];
      return g[0] * x + g[1] * y;
    };
    const a = this._permutation[X] + Y;
    const aa = this._permutation[a];
    const ab = this._permutation[a + 1];
    const b = this._permutation[X + 1] + Y;
    const ba = this._permutation[b];
    const bb = this._permutation[b + 1];
    return MathCache.lerp(
      MathCache.lerp(grad(aa, x, y), grad(ba, x - 1, y), u),
      MathCache.lerp(grad(ab, x, y - 1), grad(bb, x - 1, y - 1), u),
      v
    );
  }
  static noise(x, y, octaves = 4, persistence = 0.5) {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      value += this.perlin(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    return value / maxValue;
  }
  static turbulence(x, y, size) {
    let value = 0;
    let initialSize = size;
    while (size >= 1) {
      value += Math.abs(this.perlin(x / size, y / size)) * size;
      size /= 2;
    }
    return value / initialSize;
  }
}
class AdvancedDistribution {
  static scatter(center = 0, spread = 1) {
            return AdvancedRandom.gaussian(center, spread);
  }
  static radial(maxRadius = 1) {
    const angle = AdvancedRandom.range(0, Math.PI * 2);
    const radius = Math.sqrt(AdvancedRandom.lcg()) * maxRadius; 
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      angle: angle,
      radius: radius
    };
  }
  static particle(bounds, density = 1.0) {
    const count = Math.floor(bounds.width * bounds.height * density / 1000);
    const particles = [];
    for (let i = 0; i < count; i++) {
      let attempts = 0;
      let validPosition = false;
      let x, y;
      while (!validPosition && attempts < 10) {
        x = AdvancedRandom.range(bounds.x, bounds.x + bounds.width);
        y = AdvancedRandom.range(bounds.y, bounds.y + bounds.height);
        validPosition = true;
        const minDistance = Math.sqrt(1000 / density) * 0.8;
        for (const particle of particles) {
          const dx = x - particle.x;
          const dy = y - particle.y;
          if (Math.sqrt(dx * dx + dy * dy) < minDistance) {
            validPosition = false;
            break;
          }
        }
        attempts++;
      }
      if (validPosition || attempts >= 10) {
        particles.push({
          x: x || AdvancedRandom.range(bounds.x, bounds.x + bounds.width),
          y: y || AdvancedRandom.range(bounds.y, bounds.y + bounds.height),
          size: AdvancedRandom.range(0.3, 1.5),
          opacity: AdvancedRandom.range(0.1, 0.8)
        });
      }
    }
    return particles;
  }
}
const ADVANCED_CONSTANTS = {
  TEXTURE: {
    NOISE_INTENSITY: 0.15,        
    GRAIN_DENSITY: 0.8,           
    FIBER_LENGTH: { MIN: 2, MAX: 8 }, 
    PARTICLE_SIZE: { MIN: 0.3, MAX: 1.5 }, 
    OPACITY_RANGE: { MIN: 0.1, MAX: 0.8 } 
  },
  WATERCOLOR: {
    GRANULATION_DENSITY: 1.2,     
    BLOOM_COUNT: { MIN: 1, MAX: 4 }, 
    TENDRIL_COUNT: { MIN: 4, MAX: 10 }, 
    BACKRUN_PROBABILITY: 0.6,     
    COLOR_SHIFT_RANGE: 30         
  },
  AIRBRUSH: {
    PARTICLE_DENSITY: 0.6,        
    DISTRIBUTION_POWER: 2,        
    SPREAD_FACTOR: { MIN: 0.8, MAX: 1.5 }, 
    OPACITY_VARIATION: { MIN: 0.3, MAX: 0.7 } 
  },
  PENCIL: {
    GRAIN_COUNT_MULTIPLIER: 0.7,  
    WIDTH_RATIO: 0.45,            
    OVERLAY_INTENSITY: 0.15       
  }
};
const PatternGenerator = {
    _patternCache: new Map(),
    createPattern(type, size = 32, options = {}) {
        const cacheKey = `${type}_${size}_${JSON.stringify(options)}`;
        if (this._patternCache.has(cacheKey)) {
            return this._patternCache.get(cacheKey);
        }
        const pattern = this._generatePattern(type, size, options);
        this._patternCache.set(cacheKey, pattern);
        return pattern;
    },
    _generatePattern(type, size, options) {
        switch (type) {
            case 'noise': return this._createNoisePattern(size, options);
            case 'dots': return this._createDotsPattern(size, options);
            case 'lines': return this._createLinesPattern(size, options);
            case 'canvas': return this._createCanvasPattern(size, options);
            case 'crosshatch': return this._createCrosshatchPattern(size, options);
            case 'paper_rough': return this._createRoughPaperPattern(size, options);
            case 'paper_smooth': return this._createSmoothPaperPattern(size, options);
            case 'pencil_grain': return this._createPencilGrainPattern(size, options);
            case 'watercolor_texture': return this._createWatercolorTexturePattern(size, options);
            default: return this._createNoisePattern(size, options);
        }
    },
    _createNoisePattern(size, options = {}) {
        const { intensity = 0.15, density = 0.8 } = options;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noiseValue = AdvancedRandom.noise(i % size / 10, Math.floor(i / size) / 10);
            const value = 255 - Math.floor(Math.pow(Math.abs(noiseValue), 0.5) * 100 * intensity);
            data[i] = data[i + 1] = data[i + 2] = value;
            data[i + 3] = Math.floor(AdvancedRandom.range(20, 80) * density);
        }
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    },
    _createDotsPattern(size, options = {}) {
        const { dotSize = 1.5, density = 0.8 } = options;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        const particles = AdvancedDistribution.particle(
            { x: 0, y: 0, width: size, height: size }, density
        );
        particles.forEach(particle => {
            CanvasContextManager.drawCircle(
                ctx, particle.x, particle.y, 
                Math.max(0.1, particle.size * dotSize),
                `rgba(255,255,255,${particle.opacity * 0.4})`
            );
        });
        return canvas;
    },
    _createLinesPattern(size, options = {}) {
        const { spacing = 4, opacity = 0.5 } = options;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        CanvasContextManager.withContext(ctx, () => {
            for (let y = 0; y < size; y += spacing) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                for (let x = 0; x < size; x += spacing) {
                    const noiseOffset = AdvancedRandom.perlin(x * 0.1, y * 0.1) * 1.5;
                    ctx.lineTo(x, y + noiseOffset);
                }
                ctx.stroke();
            }
        }, {
            strokeStyle: `rgba(255,255,255,${opacity})`,
            lineWidth: 1
        });
        return canvas;
    },
    _createCanvasPattern(size, options = {}) {
        const { gridSize = 5, opacity = 0.3 } = options;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        CanvasContextManager.withContext(ctx, () => {
            for (let y = 0; y < size; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(size, y);
                ctx.stroke();
            }
            for (let x = 0; x < size; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, size);
                ctx.stroke();
            }
        }, {
            strokeStyle: `rgba(255,255,255,${opacity})`,
            lineWidth: 1
        });
        return canvas;
    },
    _createCrosshatchPattern(size, options = {}) {
        const { spacing = 8, opacity = 0.4 } = options;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        CanvasContextManager.withContext(ctx, () => {
            for (let i = -size; i < size * 2; i += spacing) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i + size, size);
                ctx.stroke();
            }
            for (let i = -size; i < size * 2; i += spacing) {
                ctx.beginPath();
                ctx.moveTo(i, size);
                ctx.lineTo(i + size, 0);
                ctx.stroke();
            }
        }, {
            strokeStyle: `rgba(255,255,255,${opacity})`,
            lineWidth: 1
        });
        return canvas;
    },
    _createRoughPaperPattern(size, options = {}) {
        const { grainIntensity = 20, fiberDensity = 0.8 } = options;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const grainValue = AdvancedRandom.noise(i % size / 15, Math.floor(i / size) / 15) * grainIntensity;
            data[i] = clampRGB(235 + grainValue);
            data[i + 1] = clampRGB(235 + grainValue);
            data[i + 2] = clampRGB(230 + grainValue);
            data[i + 3] = 255;
        }
        ctx.putImageData(imageData, 0, 0);
        CanvasContextManager.withContext(ctx, () => {
            const fibers = AdvancedDistribution.particle(
                { x: 0, y: 0, width: size, height: size }, fiberDensity
            );
            fibers.forEach(fiber => {
                const length = AdvancedRandom.range(4, 12);
                const angle = AdvancedRandom.range(0, Math.PI);
                ctx.beginPath();
                ctx.moveTo(fiber.x, fiber.y);
                ctx.lineTo(
                    fiber.x + Math.cos(angle) * length,
                    fiber.y + Math.sin(angle) * length
                );
                ctx.stroke();
            });
        }, {
            globalCompositeOperation: 'multiply',
            strokeStyle: `rgba(200, 200, 195, 0.3)`,
            lineWidth: 0.5
        });
        return canvas;
    },
    _createSmoothPaperPattern(size, options = {}) {
        const { grainSubtle = 8 } = options;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const grainValue = AdvancedRandom.noise(i % size / 10, Math.floor(i / size) / 10) * grainSubtle;
            data[i] = clampRGB(data[i] + grainValue);
            data[i + 1] = clampRGB(data[i + 1] + grainValue);
            data[i + 2] = clampRGB(data[i + 2] + grainValue);
        }
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    },
    clearCache() {
        this._patternCache.clear();
    }
};
export class AdvancedBrush {
  static distanceSinceLastStamp = 0;
  static lastVelocity = 0;
  static velocitySamples = [];
  static lastDirection = 0;
  static isNewStroke = true;
  static strokeLength = 0;
  static _gaussianCache = [];
  static _gaussianCacheSize = 100;
  static _gaussianCacheIndex = 0;
  static _textureCache = null;
  constructor() {
    this.lastX = null;
    this.lastY = null;
    this.initialSpacing = 0;
    this.pressureSensitivity = 0.7; 
    this.currentPreset = 'DEFAULT'; 
    this.currentPattern = null; 
    this.dualBrushPattern = null; 
    AdvancedBrush._initializeGaussianCache();
    AdvancedBrush._initializeTextureCache();
  }
  static _initializeTextureCache() {
    if (this._textureCache) return;
    this._textureCache = {
      texturePatterns: {},
      AdvancedTextures: {},
      paperTextures: {}
    };
  }
  static _getTexturePattern(type, size = 32) {
    this._initializeTextureCache();
    const key = `${type}_${size}`;
    if (!this._textureCache.texturePatterns[key]) {
      switch(type) {
        case 'noise': this._textureCache.texturePatterns[key] = this._createNoisePattern(size); break;
        case 'dots': this._textureCache.texturePatterns[key] = this._createDotsPattern(size); break;
        case 'lines': this._textureCache.texturePatterns[key] = this._createLinesPattern(size); break;
        case 'canvas': this._textureCache.texturePatterns[key] = this._createCanvasPattern(size); break;
        case 'crosshatch': this._textureCache.texturePatterns[key] = this._createCrosshatchPattern(size); break;
      }
    }
    return this._textureCache.texturePatterns[key];
  }
  static _createNoisePattern(size) {
    const { canvas, ctx } = CanvasUtils.createCanvas(size, size);
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noiseValue = AdvancedRandom.noise(i % size / 10, Math.floor(i / size) / 10);
      const value = 255 - Math.floor(Math.pow(Math.abs(noiseValue), 0.5) * 100);
      data[i] = data[i + 1] = data[i + 2] = value;
      data[i + 3] = Math.floor(AdvancedRandom.range(20, 80)); 
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
  static _createDotsPattern(size) {
    const { canvas, ctx } = CanvasUtils.createCanvas(size, size);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    const dotSize = 1.5;
    const spacing = 6;
    const particles = AdvancedDistribution.particle(
      { x: 0, y: 0, width: size, height: size }, 
      0.8 
    );
    particles.forEach(particle => {
        ctx.beginPath();
      ctx.arc(particle.x, particle.y, Math.max(0.1, particle.size * dotSize), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${particle.opacity * 0.4})`;
        ctx.fill();
    });
    return canvas;
  }
  static _createLinesPattern(size) {
    const { canvas, ctx } = CanvasUtils.createCanvas(size, size);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    for (let y = 0; y < size; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < size; x += 4) {
        const noiseOffset = AdvancedRandom.perlin(x * 0.1, y * 0.1) * 1.5;
        ctx.lineTo(x, y + noiseOffset);
      }
      ctx.stroke();
    }
    return canvas;
  }
  static _createCanvasPattern(size) {
    const { canvas, ctx } = CanvasUtils.createCanvas(size, size);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    for (let y = 0; y < size; y += 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
    for (let x = 0; x < size; x += 5) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    return canvas;
  }
  static _createCrosshatchPattern(size) {
    const { canvas, ctx } = CanvasUtils.createCanvas(size, size);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    for (let i = -size; i < size * 2; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + size, size);
      ctx.stroke();
    }
    for (let i = -size; i < size * 2; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, size);
      ctx.lineTo(i + size, 0);
      ctx.stroke();
    }
    return canvas;
  }
  _createAdvancedPencilTexture(size) {
    const { canvas, ctx } = CanvasUtils.createCanvas(size, size);
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const noiseValue = AdvancedRandom.noise(x / 20, y / 20, 3, 0.4); 
        const baseColor = 240 + noiseValue * 15;
        data[i] = data[i+1] = data[i+2] = baseColor;
        data[i+3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    ctx.globalCompositeOperation = 'multiply';
    const particles = AdvancedDistribution.particle({x:0, y:0, width:size, height:size}, 1.5);
    particles.forEach(p => {
        ctx.fillStyle = `rgba(40, 40, 40, ${p.opacity * 0.2})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.lineWidth = 0.7;
    for(let i = 0; i < size * 1.5; i += 4) {
      ctx.beginPath();
        ctx.moveTo(0, i);
        for(let j=0; j < size; j+=10) {
            const noise = AdvancedRandom.perlin(j*0.1, i*0.1) * 10;
            ctx.lineTo(j, i + noise);
        }
      ctx.stroke();
    }
    return canvas;
  }
  _createAdvancedInkTexture(size) {
    const { canvas, ctx } = CanvasUtils.createCanvas(size, size);
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, size, size);
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const noise1 = AdvancedRandom.noise(x / 30, y / 30, 2, 0.6);
        const noise2 = AdvancedRandom.noise(x / 10, y / 10, 3, 0.4);
        const bleedValue = Math.pow(noise1, 2) * 0.7 + Math.pow(noise2, 3) * 0.3;
        const bleedAmount = clampRGB(30 * bleedValue);
        data[i] = clampRGB(data[i] - bleedAmount);
        data[i+1] = clampRGB(data[i+1] - bleedAmount);
        data[i+2] = clampRGB(data[i+2] - bleedAmount * 1.2); 
        data[i+3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    ctx.globalCompositeOperation = 'multiply';
    const particles = AdvancedDistribution.particle({x:0, y:0, width:size, height:size}, 0.5);
    particles.forEach(p => {
        ctx.fillStyle = `rgba(10, 10, 15, ${p.opacity * 0.1})`;
        ctx.beginPath();
        const poolRadius = p.size * AdvancedRandom.range(1, 3);
        ctx.arc(p.x, p.y, poolRadius, 0, Math.PI * 2);
        ctx.fill();
    });
    return canvas;
  }
  _createAdvancedMarkerTexture(size) {
    const { canvas, ctx } = CanvasUtils.createCanvas(size, size);
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = AdvancedRandom.range(235, 255);
        data[i] = data[i+1] = data[i+2] = noise;
        data[i+3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
    ctx.globalCompositeOperation = 'multiply';
    for (let y = 0; y < size; y += 3) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      const strokeOpacity = AdvancedRandom.range(0.02, 0.08);
      ctx.strokeStyle = `rgba(50, 50, 50, ${strokeOpacity})`;
      ctx.lineWidth = AdvancedRandom.range(1.5, 2.5);
      for (let x = 0; x < size; x++) {
        const noise = AdvancedRandom.perlin(x / 15, y / 15) * 1.5;
        ctx.lineTo(x, y + noise);
      }
      ctx.stroke();
    }
    return canvas;
  }
  _createAdvancedWatercolorTexture(size) {
    const { canvas, ctx } = CanvasUtils.createCanvas(size, size);
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    for(let i=0; i < data.length; i+=4) {
        const noise = AdvancedRandom.noise(i % size / 30, Math.floor(i/size)/30) * 15;
        data[i] = 245 + noise;
        data[i+1] = 245 + noise;
        data[i+2] = 240 + noise;
        data[i+3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
      ctx.globalCompositeOperation = 'multiply';
    const stains = AdvancedDistribution.particle({x:0, y:0, width:size, height:size}, 0.1);
    stains.forEach(stain => {
        const radius = stain.size * AdvancedRandom.range(5, 15);
        const gradient = ctx.createRadialGradient(stain.x, stain.y, 0, stain.x, stain.y, radius);
        const r = AdvancedRandom.range(180, 220);
        const g = AdvancedRandom.range(180, 220);
        const b = AdvancedRandom.range(200, 230);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${stain.opacity * 0.1})`);
        gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${stain.opacity * 0.05})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(stain.x, stain.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
    return canvas;
  }
  _createAdvancedAirbrushTexture(size) {
    const { canvas, ctx } = CanvasUtils.createCanvas(size, size);
    ctx.clearRect(0, 0, size, size);
    ctx.globalCompositeOperation = 'source-over';
    const particleCount = Math.floor(size * size * 0.15); 
    for (let i = 0; i < particleCount; i++) {
        const pos = AdvancedDistribution.radial(size / 2);
        const adjustedRadius = Math.pow(pos.radius / (size/2), 1.5) * (size/2);
        const particleSize = AdvancedRandom.range(0.2, 1.5) * (1 - adjustedRadius / (size/2));
        const opacity = AdvancedRandom.range(0.1, 0.6) * Math.pow((1 - adjustedRadius / (size/2)), 2);
        ctx.fillStyle = `rgba(0,0,0,${opacity})`;
      ctx.beginPath();
        ctx.arc(size/2 + pos.x, size/2 + pos.y, Math.max(0.1, particleSize), 0, Math.PI * 2);
      ctx.fill();
    }
    return canvas;
  }
  _createAdvancedPixelTexture(size) {
    const { canvas, ctx } = CanvasUtils.createCanvas(size, size);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 0.5;
    for (let x = 1; x < size; x++) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = 1; y < size; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
    return canvas;
  }
  _createAdvancedBlenderTexture(size) {
    const { canvas, ctx } = CanvasUtils.createCanvas(size, size);
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    for(let i=0; i < data.length; i+=4) {
        const noise = AdvancedRandom.noise(i%size/20, Math.floor(i/size)/20) * 10;
        data[i] = data[i+1] = data[i+2] = 245 + noise;
        data[i+3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
    ctx.globalCompositeOperation = 'overlay';
    ctx.lineWidth = AdvancedRandom.range(2, 4);
    for (let i = 0; i < 20; i++) {
        const startX = AdvancedRandom.range(0, size);
        const startY = AdvancedRandom.range(0, size);
        ctx.strokeStyle = `rgba(255, 255, 255, ${AdvancedRandom.range(0.1, 0.3)})`;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
        for (let j = 0; j < 20; j++) {
            const turbulence = AdvancedRandom.turbulence(startX + j * 5, startY + j * 5, 10);
            ctx.lineTo(startX + j * 5, startY + turbulence * 20);
        }
      ctx.stroke();
    }
    return canvas;
  }
  _createRoughPaperTexture(size) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const grainValue = AdvancedRandom.noise(i%size/15, Math.floor(i/size)/15) * 20;
      data[i] = clampRGB(235 + grainValue);
      data[i+1] = clampRGB(235 + grainValue);
      data[i+2] = clampRGB(230 + grainValue);
      data[i+3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
    ctx.globalCompositeOperation = 'multiply';
    const fibers = AdvancedDistribution.particle({x:0,y:0,width:size,height:size}, 0.8);
    fibers.forEach(fiber => {
        ctx.strokeStyle = `rgba(200, 200, 195, ${fiber.opacity * 0.3})`;
        ctx.lineWidth = fiber.size * 0.5;
        ctx.beginPath();
        ctx.moveTo(fiber.x, fiber.y);
        const length = AdvancedRandom.range(4, 12);
        const angle = AdvancedRandom.range(0, Math.PI);
        ctx.lineTo(fiber.x + Math.cos(angle) * length, fiber.y + Math.sin(angle) * length);
        ctx.stroke();
    });
    return canvas;
  }
  _createSmoothPaperTexture(size) {
    const { canvas, ctx } = CanvasUtils.createCanvas(size, size);
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, size, size);
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const grainValue = AdvancedRandom.noise(i%size/10, Math.floor(i/size)/10) * 8;
      data[i] = clampRGB(data[i] + grainValue);
      data[i+1] = clampRGB(data[i+1] + grainValue);
      data[i+2] = clampRGB(data[i+2] + grainValue);
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
  static _initializeGaussianCache() {
    if (this._gaussianCache.length === 0) {
      for (let i = 0; i < this._gaussianCacheSize; i++) {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        const z0 = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        const z1 = Math.sqrt(-2.0 * Math.log(u)) * Math.sin(2.0 * Math.PI * v);
        this._gaussianCache.push({ x: z0, y: z1 });
      }
    }
  }
  static _getAdvancedScatter() {
    if (this._gaussianCache.length === 0) this._initializeGaussianCache();
    const scatter = this._gaussianCache[this._gaussianCacheIndex];
    this._gaussianCacheIndex = (this._gaussianCacheIndex + 1) % this._gaussianCacheSize;
    return scatter;
  }
  applyBrushDab(ctx, x, y, size, flow, color, hardness, pressure, blendMode = 'source-over', presetName = null, 
                scattering = 0, shapeDynamics = 0, texture = 'none', dualBrush = 'none') {
    if (ctx.globalAlpha < 0.001 && blendMode !== 'destination-out') {
      return false; 
    }
    const originalAlpha = ctx.globalAlpha;
    const originalComposite = ctx.globalCompositeOperation;
    let finalX = x;
    let finalY = y;
    if (scattering > 0) {
      const scatter = AdvancedBrush._getAdvancedScatter();
      const baseScatterRadius = size * scattering * 0.3; 
      finalX += scatter.x * baseScatterRadius;
      finalY += scatter.y * baseScatterRadius;
    }
    ctx.globalCompositeOperation = blendMode;
    const { r, g, b } = ColorUtils.hexToRgb(color);
    ctx.globalAlpha = originalAlpha * flow;
    if (presetName === "PENCIL") {
      AdvancedBrush._drawPencilStamp(ctx, finalX, finalY, size, 1.0, r, g, b, hardness, shapeDynamics);
    } else if (presetName === "MARKER") {
      AdvancedBrush._drawMarkerStamp(ctx, finalX, finalY, size, 1.0, r, g, b, hardness, shapeDynamics);
    } else if (presetName === "INK") {
      AdvancedBrush._drawInkStamp(ctx, finalX, finalY, size, 1.0, r, g, b, hardness, shapeDynamics);
    } else if (presetName === "WATERCOLOR") {
      AdvancedBrush._drawWatercolorStamp(ctx, finalX, finalY, size, 1.0, r, g, b, hardness, shapeDynamics);
    } else if (presetName === "AIRBRUSH") {
      AdvancedBrush._drawAirbrushStamp(ctx, finalX, finalY, size, 1.0, r, g, b, hardness, shapeDynamics);
    } else if (presetName === "PIXEL") {
      AdvancedBrush._drawPixelStamp(ctx, finalX, finalY, size, 1.0, r, g, b, hardness, shapeDynamics);
    } else if (presetName === "BLENDER") {
      AdvancedBrush._drawBlenderStamp(ctx, finalX, finalY, size, 1.0, r, g, b, hardness, shapeDynamics);
    } else {
      AdvancedBrush._drawStandardStamp(ctx, finalX, finalY, size, 1.0, r, g, b, hardness, shapeDynamics, texture, dualBrush);
    }
    ctx.globalCompositeOperation = originalComposite;
    ctx.globalAlpha = originalAlpha;
    return true; 
  }
  static drawSegment(ctx, p1, p2, color, baseSize, baseOpacity, brushSpacing, 
                   currentDistanceSinceLastStamp, pressureSensitivityFactor, 
                   hardness = 0.5, flow = 1.0, presetName = null, 
                   scattering = 0, 
                   shapeDynamics = 0, texture = 'none', dualBrush = 'none') {
    if (!p1 || !p2) return currentDistanceSinceLastStamp;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const segmentDistance = Math.sqrt(dx * dx + dy * dy);
    const direction = Math.atan2(dy, dx);
    if (this.isNewStroke) {
      this.strokeLength = 0;
      this.lastDirection = direction;
      this.isNewStroke = false;
      this.velocitySamples = [];
    }
    this.strokeLength += segmentDistance;
    let velocity = 0;
    if (p1.time && p2.time) {
      const timeDelta = Math.max(1, p2.time - p1.time);
      velocity = segmentDistance / timeDelta;
      this.velocitySamples.push(velocity);
      if (this.velocitySamples.length > 5) this.velocitySamples.shift();
      velocity = this.velocitySamples.reduce((a, b) => a + b, 0) / this.velocitySamples.length;
    } else {
      velocity = segmentDistance;
    }
    this.lastVelocity = velocity;
    const directionChange = Math.abs(this.lastDirection - direction);
    this.lastDirection = direction;
    let dynamicBaseSize = baseSize;
    if (shapeDynamics > 0) {
        const normalizedVelocity = clamp(velocity / 50, 0, 1); 
        const normalizedDirectionChange = clamp(directionChange / Math.PI, 0, 1);
        const velocityCurve = Math.pow(normalizedVelocity, 1.5); 
        const directionCurve = Math.sin(normalizedDirectionChange * Math.PI) * 0.5; 
        const velocityFactor = velocityCurve * shapeDynamics * 0.4; 
        const directionFactor = directionCurve * shapeDynamics * 0.3; 
        const strokeLengthFactor = Math.sin(this.strokeLength * 0.01) * shapeDynamics * 0.1; 
        const controlledRandomness = (Math.random() - 0.5) * shapeDynamics * 0.15; 
        let dynamicSizeFactor = 1.0 + velocityFactor + directionFactor + strokeLengthFactor + controlledRandomness;
        dynamicSizeFactor = clamp(dynamicSizeFactor, 0.5, 1.8); 
        dynamicBaseSize *= dynamicSizeFactor;
    }
    return this._unifiedDrawSegment(
        ctx, p1, p2, color, 
        dynamicBaseSize, 
        baseOpacity, 
        brushSpacing, currentDistanceSinceLastStamp,
        pressureSensitivityFactor, hardness, 
        flow, 
        velocity, direction, presetName,
        scattering, 
        shapeDynamics, texture, dualBrush
    );
  }
  static _unifiedDrawSegment(ctx, p1, p2, color, 
                           baseSize, 
                           baseOpacity, 
                           brushSpacing, currentDistanceSinceLastStamp, 
                           pressureSensitivityFactor, hardness, 
                           flow, 
                           velocity = 0, direction = 0, presetName = null,
                           scattering = 0, 
                           shapeDynamics = 0, texture = 'none', dualBrush = 'none') { 
    if (!this.brushInstance) {
      this.brushInstance = new AdvancedBrush();
    }
    const originalGlobalAlpha = ctx.globalAlpha;
    const originalCompositeOp = ctx.globalCompositeOperation;
    ctx.save();
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const segmentDistance = Math.sqrt(dx * dx + dy * dy);
    let effectiveSpacing = brushSpacing;
    if (presetName === 'PENCIL') {
        effectiveSpacing = clamp(effectiveSpacing, 0.04, 0.12);
    } else if (presetName === 'WATERCOLOR') {
        effectiveSpacing = clamp(effectiveSpacing, 0.02, 0.08);
    }
    effectiveSpacing = clamp(effectiveSpacing, 0.05, 5.0);
    if (baseSize < 5) {
        effectiveSpacing = Math.max(effectiveSpacing, 0.15);
    }
    const actualPixelSpacing = Math.max(1, baseSize * effectiveSpacing);
    let distAlongSegment = 0;
    let accumulatedDistance = currentDistanceSinceLastStamp;
    const currentTime = performance.now();
    if (accumulatedDistance === 0) {
        const pressure = p1.pressure ?? 0.5;
        const taperFactor = 1.0; 
        const size = this.getDynamicSize(baseSize, pressure, pressureSensitivityFactor) * taperFactor;
        const pressureOpacity = this.getDynamicOpacity(baseOpacity, pressure, pressureSensitivityFactor);
        const finalOpacity = pressureOpacity * taperFactor;
        const flowThreshold = 0.05;
        let effectiveFlow;
        if (flow < flowThreshold) {
            effectiveFlow = flow; 
        } else {
            const normalizedFlow = (flow - flowThreshold) / (1 - flowThreshold);
            effectiveFlow = flowThreshold + (1 - flowThreshold) * (normalizedFlow * (1 + normalizedFlow * 0.2));
        }
        ctx.globalAlpha = finalOpacity * effectiveFlow;
        this.brushInstance.applyBrushDab(ctx, p1.x, p1.y, size, 1.0, color, hardness, pressure, 
                                     'source-over', presetName, scattering, 
                                     shapeDynamics, texture, dualBrush);
        if (accumulatedDistance === 0) accumulatedDistance = 0.0001; 
    }
    const avgPressure = ((p1.pressure ?? 0.5) + (p2.pressure ?? 0.5)) / 2;
    const avgSize = this.getDynamicSize(baseSize, avgPressure, pressureSensitivityFactor);
    const requiredPixelSpacing = actualPixelSpacing;
    while (distAlongSegment < segmentDistance) {
        const distanceToNextStamp = requiredPixelSpacing - accumulatedDistance;
        const distanceLeftInSegment = segmentDistance - distAlongSegment;
        if (distanceToNextStamp <= distanceLeftInSegment) {
            distAlongSegment += distanceToNextStamp;
            const t_stamp = segmentDistance === 0 ? 0 : distAlongSegment / segmentDistance;
            const stampX = MathCache.lerp(p1.x, p2.x, t_stamp);
            const stampY = MathCache.lerp(p1.y, p2.y, t_stamp);
            const stampPressure = MathCache.lerp(p1.pressure ?? 0.5, p2.pressure ?? 0.5, t_stamp);
            const taperFactor = 1.0; 
            const stampSize = this.getDynamicSize(baseSize, stampPressure, pressureSensitivityFactor) * taperFactor;
            const pressureOpacity = this.getDynamicOpacity(baseOpacity, stampPressure, pressureSensitivityFactor);
            const finalOpacity = pressureOpacity * taperFactor;
            const flowThreshold = 0.05;
            let effectiveFlow;
            if (flow < flowThreshold) {
                effectiveFlow = flow; 
            } else {
                const normalizedFlow = (flow - flowThreshold) / (1 - flowThreshold);
                effectiveFlow = flowThreshold + (1 - flowThreshold) * (normalizedFlow * (1 + normalizedFlow * 0.2));
            }
            ctx.globalAlpha = finalOpacity * effectiveFlow;
            this.brushInstance.applyBrushDab(ctx, stampX, stampY, stampSize, 1.0, color, hardness, stampPressure,
                                        'source-over', presetName, scattering, 
                                        shapeDynamics, texture, dualBrush);
            accumulatedDistance = 0;
        } else {
            accumulatedDistance += distanceLeftInSegment;
            distAlongSegment = segmentDistance;
        }
    }
    ctx.globalCompositeOperation = originalCompositeOp;
    ctx.globalAlpha = originalGlobalAlpha;
    ctx.restore();
    return accumulatedDistance;
  }
  static drawStamp(ctx, x, y, size, opacity, color = '#000000', hardness = 0.5, flow = 1.0, rotation = 0, presetName = null, texture = 'none', dualBrush = 'none') {
    if (size < 1) return;
      const { r, g, b } = ColorUtils.hexToRgb(color);
    if (texture === 'none' && presetName) {
        if (presetName === "PENCIL") {
            texture = 'pencil';
        } else if (presetName === "AIRBRUSH") {
            texture = 'airbrush';
        } else if (presetName === "MARKER") {
            texture = 'canvas';
        } else if (presetName === "WATERCOLOR") {
            texture = 'rough_paper';
        }
    }
    if (presetName === "PIXEL") {
      this._drawPixelStamp(ctx, x, y, size, opacity, r, g, b, hardness, rotation); 
      return;
    } else if (presetName === "PENCIL") {
      this._drawPencilStamp(ctx, x, y, size, opacity, r, g, b, hardness, rotation); 
      return;
    } else if (presetName === "INK_PEN") {
      this._drawInkStamp(ctx, x, y, size, opacity, r, g, b, hardness, rotation); 
      return;
    } else if (presetName === "MARKER") {
      this._drawMarkerStamp(ctx, x, y, size, opacity, r, g, b, hardness, rotation); 
      return;
    } else if (presetName === "WATERCOLOR") {
      this._drawWatercolorStamp(ctx, x, y, size, opacity, r, g, b, hardness, rotation); 
      return;
    } else if (presetName === "AIRBRUSH") { 
      this._drawAirbrushStamp(ctx, x, y, size, opacity, r, g, b, hardness, rotation); 
      return;
    } else if (presetName === "BLENDER") { 
      this._drawBlenderStamp(ctx, x, y, size, opacity, r, g, b, hardness, rotation); 
      return;
    }
    this._drawStandardStamp(ctx, x, y, size, opacity, r, g, b, hardness, rotation, texture, dualBrush);
  }
  static _drawStandardStamp(ctx, x, y, size, opacity, r, g, b, hardness, rotation, texture = 'none', dualBrush = 'none') {
    const minQualityHardness = TOOL_SETTINGS.BRUSH.MIN_STAMP_HARDNESS; 
    const effectiveHardness = Math.max(minQualityHardness, hardness);
    if (!this.brushInstance) {
      this.brushInstance = new AdvancedBrush();
    }
    if (rotation !== 0) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      const aspectRatio = 0.4; 
      const width = size;
      const height = size * aspectRatio;
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, width/2);
      gradient.addColorStop(0, `rgb(${r},${g},${b})`);
      gradient.addColorStop(effectiveHardness * 0.8, `rgb(${r},${g},${b})`);
      gradient.addColorStop(0.9, `rgb(${r},${g},${b})`);
      gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.ellipse(0, 0, width/2, height/2, 0, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      if (texture && texture !== 'none') {
        ctx.beginPath();
        ctx.ellipse(0, 0, width/2, height/2, 0, 0, Math.PI * 2);
        this._applyTexture(ctx, 0, 0, width, height, texture);
      }
      if (dualBrush && dualBrush !== 'none') {
        ctx.beginPath();
        ctx.ellipse(0, 0, width/2, height/2, 0, 0, Math.PI * 2);
        this._applyDualBrush(ctx, 0, 0, width, height, dualBrush);
      }
      ctx.restore();
    } else {
      const radius = size / 2;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      if (effectiveHardness >= 0.9) { 
          gradient.addColorStop(0, `rgb(${r},${g},${b})`);
          gradient.addColorStop(0.9, `rgb(${r},${g},${b})`);
          gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
      } else if (effectiveHardness >= 0.5) { 
          gradient.addColorStop(0, `rgb(${r},${g},${b})`);
          gradient.addColorStop(effectiveHardness * 0.8, `rgb(${r},${g},${b})`);
          gradient.addColorStop(0.95, `rgb(${r},${g},${b})`);
          gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
      } else { 
          const coreSize = Math.max(0.1, effectiveHardness * 0.6);
          const midPoint = coreSize + (1 - coreSize) * 0.5;
          gradient.addColorStop(0, `rgb(${r},${g},${b})`);
          gradient.addColorStop(coreSize, `rgb(${r},${g},${b})`);
          gradient.addColorStop(midPoint, `rgb(${r},${g},${b})`);
          gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
      }
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      if (texture && texture !== 'none') {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        this._applyTexture(ctx, x - radius, y - radius, size, size, texture);
      }
      if (dualBrush && dualBrush !== 'none') {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        this._applyDualBrush(ctx, x - radius, y - radius, size, size, dualBrush);
      }
    }
  }
  static _applyDualBrush(ctx, x, y, width, height, dualBrushType) {
    CanvasContextManager.withContext(ctx, () => {
    try {
      ctx.clip();
      if (dualBrushType === 'scatter') {
        this._applyAdvancedScatterBrush(ctx, x, y, width, height);
      } else if (dualBrushType === 'texture') {
        this._applyAdvancedTextureBrush(ctx, x, y, width, height);
      } else if (dualBrushType === 'crosshatch') {
        this._applyAdvancedCrosshatchBrush(ctx, x, y, width, height);
      }
    } catch (e) {
    }
    });
  }
  static _applyAdvancedScatterBrush(ctx, x, y, width, height) {
    const brushArea = width * height;
    const brushRadius = Math.sqrt(brushArea / Math.PI);
    const baseDensity = clamp(brushRadius * 0.8, 10, 100);
    const dotCount = Math.floor(baseDensity);
    CanvasContextManager.withContext(ctx, () => {
        for (let i = 0; i < dotCount; i++) {
      const scatter = this._getAdvancedScatter();
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const maxRadius = Math.min(width, height) / 2;
      const normalizedDistance = clamp(Math.abs(scatter.x) * 0.7, 0, 1);
      const actualDistance = normalizedDistance * maxRadius;
      const angle = scatter.y * Math.PI; 
      const dotX = centerX + Math.cos(angle) * actualDistance;
      const dotY = centerY + Math.sin(angle) * actualDistance;
      const distanceRatio = normalizedDistance;
      const dotRadius = (0.3 + Math.random() * 1.2) * (1 - distanceRatio * 0.5);
      const opacityVariation = (1 - distanceRatio * 0.6) * (0.4 + Math.random() * 0.4);
        CanvasContextManager.drawCircle(ctx, dotX, dotY, Math.max(0.1, dotRadius), 
                                      `rgba(0,0,0,${opacityVariation})`);
      }
    }, { globalCompositeOperation: 'source-atop' });
  }
  static _applyAdvancedTextureBrush(ctx, x, y, width, height) {
    if (!this.brushInstance) {
      this.brushInstance = new AdvancedBrush();
    }
    const patternCanvas = this.brushInstance.paperTextures.rough;
    if (!patternCanvas) return;
    CanvasContextManager.withContext(ctx, () => {
    const pattern = ctx.createPattern(patternCanvas, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(x, y, width, height);
    }, { 
      globalCompositeOperation: 'overlay',
      alpha: 0.3
    });
  }
  static _applyAdvancedCrosshatchBrush(ctx, x, y, width, height) {
    const brushSize = Math.min(width, height);
    const baseSpacing = clamp(brushSize * 0.08, 2, 8);
    const lineWidth = clamp(brushSize * 0.02, 0.5, 2);
    CanvasContextManager.withContext(ctx, () => {
    const angles = [45, 135, 90, 0]; 
    const opacities = [0.4, 0.3, 0.2, 0.15]; 
    angles.forEach((angle, index) => {
      const opacity = opacities[index];
      const spacing = baseSpacing * (1 + index * 0.3); 
      const angleRad = (angle * Math.PI) / 180;
      const lineLength = Math.sqrt(width * width + height * height);
      const perpAngle = angleRad + Math.PI / 2;
      const perpDx = Math.cos(perpAngle) * spacing;
      const perpDy = Math.sin(perpAngle) * spacing;
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const maxOffset = lineLength / 2;
      const lineCount = Math.floor(maxOffset / spacing) * 2 + 1;
      for (let i = -Math.floor(lineCount / 2); i <= Math.floor(lineCount / 2); i++) {
        const offsetX = perpDx * i;
        const offsetY = perpDy * i;
        const startX = centerX + offsetX - Math.cos(angleRad) * lineLength / 2;
        const startY = centerY + offsetY - Math.sin(angleRad) * lineLength / 2;
        const endX = centerX + offsetX + Math.cos(angleRad) * lineLength / 2;
        const endY = centerY + offsetY + Math.sin(angleRad) * lineLength / 2;
          ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      });
    }, { 
      globalCompositeOperation: 'multiply',
      lineWidth: lineWidth,
      strokeStyle: 'rgba(0,0,0,0.4)' 
    });
  }
  static _applyTexture(ctx, x, y, width, height, textureType) {
    if (!this.brushInstance) {
      this.brushInstance = new AdvancedBrush();
    }
    let texturePattern = null;
    if (textureType === 'pencil' && this.brushInstance.AdvancedTextures.pencil) {
      texturePattern = this.brushInstance.AdvancedTextures.pencil;
    } else if (textureType === 'airbrush' && this.brushInstance.AdvancedTextures.airbrush) {
      texturePattern = this.brushInstance.AdvancedTextures.airbrush;
    } else if (textureType === 'canvas' && this.brushInstance.texturePatterns.canvas) {
      texturePattern = this.brushInstance.texturePatterns.canvas;
    } else if (textureType === 'rough_paper' && this.brushInstance.paperTextures.rough) {
      texturePattern = this.brushInstance.paperTextures.rough;
    } else if (textureType === 'noise' && this.brushInstance.texturePatterns.noise) {
      texturePattern = this.brushInstance.texturePatterns.noise;
    }
    if (texturePattern) {
      ctx.save();
      ctx.clip();
      ctx.globalCompositeOperation = 'multiply';  
      ctx.globalAlpha = 0.5;  
      const pattern = ctx.createPattern(texturePattern, 'repeat');
      ctx.fillStyle = pattern;
      ctx.translate(x, y);
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }
  static _drawPencilStamp(ctx, x, y, size, opacity, r, g, b, hardness, rotation) {
    ctx.save();  
    ctx.translate(x, y);
    if (rotation !== 0) {
      ctx.rotate(rotation);
    }
    const opaqueColorStr = `rgba(${r},${g},${b},${opacity})`;
    ctx.fillStyle = opaqueColorStr;
    ctx.beginPath();
    const widthRatio = ADVANCED_CONSTANTS.PENCIL.WIDTH_RATIO;  
    ctx.ellipse(0, 0, size/2, size/2 * widthRatio, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-atop'; 
    ctx.globalAlpha = ADVANCED_CONSTANTS.PENCIL.OVERLAY_INTENSITY * opacity;
    const grainCount = Math.ceil(size * ADVANCED_CONSTANTS.PENCIL.GRAIN_COUNT_MULTIPLIER);
    const grainBounds = {
      x: -size * 0.35, y: -size * 0.35 * ADVANCED_CONSTANTS.PENCIL.WIDTH_RATIO,
      width: size * 0.7, height: size * 0.7 * ADVANCED_CONSTANTS.PENCIL.WIDTH_RATIO
    };
    const grains = AdvancedDistribution.particle(grainBounds, 1.2);
    grains.slice(0, grainCount).forEach((grain, i) => {
      ctx.beginPath();
      const isLight = (i + Math.floor(grain.x) + Math.floor(grain.y)) % 2 === 0;
      const grainOpacity = ADVANCED_CONSTANTS.PENCIL.OVERLAY_INTENSITY * (0.8 + grain.opacity * 0.4);
      ctx.fillStyle = isLight ? `rgba(255,255,255,${grainOpacity})` : `rgba(0,0,0,${grainOpacity})`;
      ctx.arc(grain.x, grain.y, Math.max(0.1, grain.size * 0.8), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore(); 
  }
  static _drawMarkerStamp(ctx, x, y, size, opacity, r, g, b, hardness, rotation) {
    ctx.save();
    ctx.translate(x, y);
    if (rotation !== 0) {
      ctx.rotate(rotation);
    }
    const width = size * 0.8;
    const height = size * 1.2;
    ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`;
    const radius = width * 0.4; 
    ctx.beginPath();
    ctx.moveTo(-width/2 + radius, -height/2);
    ctx.lineTo(width/2 - radius, -height/2);
    ctx.arc(width/2 - radius, -height/2 + radius, radius, 3 * Math.PI / 2, 0);
    ctx.lineTo(width/2, height/2 - radius);
    ctx.arc(width/2 - radius, height/2 - radius, radius, 0, Math.PI / 2);
    ctx.lineTo(-width/2 + radius, height/2);
    ctx.arc(-width/2 + radius, height/2 - radius, radius, Math.PI / 2, Math.PI);
    ctx.lineTo(-width/2, -height/2 + radius);
    ctx.arc(-width/2 + radius, -height/2 + radius, radius, Math.PI, 3 * Math.PI / 2);
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = `rgba(${Math.max(0, r-30)},${Math.max(0, g-30)},${Math.max(0, b-30)},${opacity * 0.5})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalCompositeOperation = 'multiply';
    const streakCount = Math.max(3, Math.floor(width / 4));
    for (let i = 0; i < streakCount; i++) {
      const streakPos = ((i / (streakCount - 1)) - 0.5) * width * 0.7;
      const streakGradient = ctx.createLinearGradient(
        streakPos, -height/2 * 0.7, 
        streakPos, height/2 * 0.7
      );
      streakGradient.addColorStop(0, `rgba(${Math.max(0, r-50)},${Math.max(0, g-50)},${Math.max(0, b-50)},${opacity * 0.4})`);
      streakGradient.addColorStop(0.2, `rgba(${Math.max(0, r-20)},${Math.max(0, g-20)},${Math.max(0, b-20)},${opacity * 0.15})`);
      streakGradient.addColorStop(0.8, `rgba(${Math.max(0, r-20)},${Math.max(0, g-20)},${Math.max(0, b-20)},${opacity * 0.15})`);
      streakGradient.addColorStop(1, `rgba(${Math.max(0, r-50)},${Math.max(0, g-50)},${Math.max(0, b-50)},${opacity * 0.4})`);
      ctx.fillStyle = streakGradient;
      ctx.fillRect(streakPos - 0.5, -height/2 * 0.7, 1, height * 0.7);
    }
    ctx.restore();
  }
  static _drawInkStamp(ctx, x, y, size, opacity, r, g, b, hardness, rotation) {
    ctx.save();
      const validX = Number.isFinite(x) ? x : 0;
      const validY = Number.isFinite(y) ? y : 0;
      let validSize = Number.isFinite(size) && size > 0 ? size : 10;
      const validOpacity = Number.isFinite(opacity) && opacity >= 0 && opacity <= 1 ? opacity : 1;
      const validR = Number.isFinite(r) && r >= 0 && r <= 255 ? r : 0;
      const validG = Number.isFinite(g) && g >= 0 && g <= 255 ? g : 0;
      const validB = Number.isFinite(b) && b >= 0 && b <= 255 ? b : 0;
      let validRotation = Number.isFinite(rotation) ? rotation : Math.PI / 4;
    const pressure = this.currentPressure || 0.7; 
    validSize *= (0.5 + pressure * 0.8);
    const dynamicOpacity = validOpacity * (0.6 + pressure * 0.4);
    const speedFactor = 0.8 + Math.random() * 0.4;
    validSize = Math.max(1, validSize * speedFactor);
      ctx.translate(validX, validY);
      ctx.rotate(validRotation);
      const nibWidth = validSize;
    const nibHeight = validSize * (0.15 + (1 - hardness) * 0.1);
      ctx.globalAlpha = dynamicOpacity;
      ctx.fillStyle = `rgb(${validR}, ${validG}, ${validB})`;
      ctx.beginPath();
      ctx.moveTo(-nibWidth / 2, -nibHeight / 2);
      ctx.lineTo(nibWidth / 2, -nibHeight / 2);
      ctx.quadraticCurveTo(nibWidth / 2 * 1.1, 0, nibWidth / 2, nibHeight / 2);
      ctx.lineTo(-nibWidth / 2, nibHeight / 2);
      ctx.quadraticCurveTo(-nibWidth / 2 * 1.1, 0, -nibWidth / 2, -nibHeight / 2);
      ctx.closePath();
      ctx.fill();
      if (hardness < 0.9) {
        ctx.globalAlpha = dynamicOpacity * 0.2 * (1 - hardness);
        const featherAmount = nibHeight * 0.5 * (1 - hardness);
        ctx.beginPath();
        ctx.moveTo(-nibWidth / 2 - featherAmount, -nibHeight / 2 - featherAmount);
        ctx.lineTo(nibWidth / 2 + featherAmount, -nibHeight / 2 - featherAmount);
        ctx.quadraticCurveTo(nibWidth / 2 * 1.1 + featherAmount, 0, nibWidth / 2 + featherAmount, nibHeight / 2 + featherAmount);
        ctx.lineTo(-nibWidth / 2 - featherAmount, nibHeight / 2 + featherAmount);
        ctx.quadraticCurveTo(-nibWidth / 2 * 1.1 - featherAmount, 0, -nibWidth / 2 - featherAmount, -nibHeight / 2 - featherAmount);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
  }
  static _drawWatercolorStamp(ctx, x, y, size, opacity, r, g, b, hardness, rotation) {
    ctx.save();
    ctx.translate(x, y);
    if (rotation !== 0) {
      ctx.rotate(rotation);
    }
    const radius = size / 2;
    const baseOpacity = opacity * 0.8; 
    const wetness = this._getWetness(hardness); 
    const flowRate = this._getFlowRate(opacity); 
    const pigmentDensity = this._getPigmentDensity(r, g, b); 
    this._drawPaperInteraction(ctx, radius, baseOpacity, wetness);
    this._drawMainWash(ctx, radius, r, g, b, baseOpacity, pigmentDensity, wetness);
    this._drawAdvancedGranulation(ctx, radius, r, g, b, baseOpacity, pigmentDensity);
    this._drawWaterBlooms(ctx, radius, r, g, b, baseOpacity, wetness, flowRate);
    this._drawEdgeBleeding(ctx, radius, r, g, b, baseOpacity, wetness);
    this._drawBackruns(ctx, radius, r, g, b, baseOpacity, wetness);
    this._drawFinalDiffusion(ctx, radius, r, g, b, baseOpacity);
    ctx.restore();
  }
  static _getWetness(hardness) {
    return 1.0 - (hardness * 0.6);
  }
  static _getFlowRate(opacity) {
    return 1.0 - (opacity * 0.4);
  }
  static _getPigmentDensity(r, g, b) {
    const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    return 0.3 + (1 - luminance) * 0.7; 
  }
  static _drawPaperInteraction(ctx, radius, baseOpacity, wetness) {
    const paperGrainSize = radius * (0.8 + wetness * 0.4);
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.15 * wetness;
    const fiberCount = Math.floor(radius * 0.5);
    for (let i = 0; i < fiberCount; i++) {
      const scatter = this._getAdvancedScatter();
      const fiberX = scatter.x * paperGrainSize * 0.8;
      const fiberY = scatter.y * paperGrainSize * 0.8;
      const fiberSize = 0.5 + Math.random() * 1.5;
      ctx.beginPath();
      ctx.arc(fiberX, fiberY, Math.max(0.1, fiberSize), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,200,200,${0.3 + Math.random() * 0.4})`;
      ctx.fill();
    }
  }
  static _drawMainWash(ctx, radius, r, g, b, baseOpacity, pigmentDensity, wetness) {
    const irregularityPoints = 12 + Math.floor(wetness * 6); 
    const angleStep = (Math.PI * 2) / irregularityPoints;
    ctx.beginPath();
    const shapePoints = [];
    for (let i = 0; i <= irregularityPoints; i++) {
      const angle = i * angleStep;
      const radiusVariation = 0.7 + (Math.random() * 0.6 * wetness);
      const organicNoise = (Math.sin(angle * 3) + Math.cos(angle * 5)) * 0.1 * wetness;
      const finalRadius = radius * (radiusVariation + organicNoise);
      const px = Math.cos(angle) * finalRadius;
      const py = Math.sin(angle) * finalRadius;
      shapePoints.push({ x: px, y: py });
    }
    ctx.moveTo(shapePoints[0].x, shapePoints[0].y);
    for (let i = 0; i < irregularityPoints; i++) {
      const p1 = shapePoints[i];
      const p2 = shapePoints[(i + 1) % irregularityPoints];
      const p3 = shapePoints[(i + 2) % irregularityPoints];
      const controlStrength = 0.3 + wetness * 0.2;
      const cp1x = p1.x + (p2.x - shapePoints[(i - 1 + irregularityPoints) % irregularityPoints].x) * controlStrength;
      const cp1y = p1.y + (p2.y - shapePoints[(i - 1 + irregularityPoints) % irregularityPoints].y) * controlStrength;
      const cp2x = p2.x - (p3.x - p1.x) * controlStrength;
      const cp2y = p2.y - (p3.y - p1.y) * controlStrength;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    ctx.closePath();
    const washRadius = radius * (1.1 + wetness * 0.3);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, washRadius);
    const coreOpacity = baseOpacity * (0.6 + pigmentDensity * 0.3);
    const midOpacity = baseOpacity * (0.7 + pigmentDensity * 0.2);
    const edgeOpacity = baseOpacity * (0.8 + pigmentDensity * 0.2);
    gradient.addColorStop(0, `rgba(${r},${g},${b},${coreOpacity})`);
    gradient.addColorStop(0.4, `rgba(${r},${g},${b},${midOpacity})`);
    gradient.addColorStop(0.8, `rgba(${r},${g},${b},${edgeOpacity})`);
    gradient.addColorStop(1, `rgba(${r},${g},${b},${baseOpacity * 0.3})`);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = gradient;
    ctx.fill();
  }
  static _drawAdvancedGranulation(ctx, radius, r, g, b, baseOpacity, pigmentDensity) {
    ctx.globalCompositeOperation = 'multiply';
    const granulationIntensity = pigmentDensity * 1.2;
    const particleCount = Math.floor(radius * granulationIntensity * 2);
    for (let i = 0; i < particleCount; i++) {
      const scatter = this._getAdvancedScatter();
      const particleDistance = Math.abs(scatter.x) * radius * 0.9;
      const particleAngle = scatter.y * Math.PI * 2;
      const dotX = Math.cos(particleAngle) * particleDistance;
      const dotY = Math.sin(particleAngle) * particleDistance;
      const sizeVariation = 1 - (particleDistance / (radius * 0.9)) * 0.6;
      const dotSize = Math.max(0.1, (0.3 + Math.random() * 1.0) * sizeVariation * pigmentDensity); 
      const clumpingFactor = Math.pow(Math.random(), 0.3); 
      const dotOpacity = baseOpacity * granulationIntensity * clumpingFactor * 0.15;
      const colorShift = Math.random() * 30 - 15;
      const dotR = clamp(r + colorShift * pigmentDensity, 0, 255);
      const dotG = clamp(g + colorShift * pigmentDensity, 0, 255);
      const dotB = clamp(b + colorShift * pigmentDensity, 0, 255);
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${dotR},${dotG},${dotB},${dotOpacity})`;
      ctx.fill();
    }
  }
  static _drawWaterBlooms(ctx, radius, r, g, b, baseOpacity, wetness, flowRate) {
    const bloomCount = Math.floor(1 + wetness * 3); 
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < bloomCount; i++) {
      const bloomAngle = Math.random() * Math.PI * 2;
      const bloomDistance = Math.random() * radius * 0.4;
      const bloomX = Math.cos(bloomAngle) * bloomDistance;
      const bloomY = Math.sin(bloomAngle) * bloomDistance;
      const bloomRadius = radius * (0.2 + Math.random() * 0.4) * (1 + wetness * 0.5);
      const bloomOpacity = baseOpacity * wetness * flowRate * (0.08 + Math.random() * 0.12);
      const bloomGradient = ctx.createRadialGradient(
        bloomX, bloomY, 0, 
        bloomX, bloomY, bloomRadius
      );
      const bloomR = Math.min(255, r + 10);
      const bloomG = Math.min(255, g + 8);
      const bloomB = Math.min(255, b + 5);
      bloomGradient.addColorStop(0, `rgba(${bloomR},${bloomG},${bloomB},${bloomOpacity})`);
      bloomGradient.addColorStop(0.6, `rgba(${bloomR},${bloomG},${bloomB},${bloomOpacity * 0.5})`);
      bloomGradient.addColorStop(1, `rgba(${bloomR},${bloomG},${bloomB},0)`);
      ctx.fillStyle = bloomGradient;
      ctx.beginPath();
      ctx.arc(bloomX, bloomY, Math.max(0.1, bloomRadius), 0, Math.PI * 2);
      ctx.fill();
    }
    }
  static _drawEdgeBleeding(ctx, radius, r, g, b, baseOpacity, wetness) {
    if (wetness < 0.3) return; 
    ctx.globalCompositeOperation = 'source-over';
    const bleedIntensity = (wetness - 0.3) / 0.7; 
    const tendrilCount = Math.floor(4 + bleedIntensity * 6);
    for (let i = 0; i < tendrilCount; i++) {
      const tendrilAngle = (Math.PI * 2 * i) / tendrilCount + Math.random() * 0.5;
      const tendrilLength = radius * (0.3 + Math.random() * 0.4) * bleedIntensity;
    ctx.beginPath();
      const startX = Math.cos(tendrilAngle) * radius * 0.8;
      const startY = Math.sin(tendrilAngle) * radius * 0.8;
      ctx.moveTo(startX, startY);
      const segments = 3 + Math.floor(Math.random() * 3);
      let currentX = startX;
      let currentY = startY;
      for (let seg = 0; seg < segments; seg++) {
        const segmentRatio = (seg + 1) / segments;
        const deviation = (Math.random() - 0.5) * tendrilLength * 0.3;
        const targetX = Math.cos(tendrilAngle) * radius * (0.8 + segmentRatio * 0.6) + deviation;
        const targetY = Math.sin(tendrilAngle) * radius * (0.8 + segmentRatio * 0.6) + deviation;
        const cp1x = currentX + (targetX - currentX) * 0.3 + deviation * 0.5;
        const cp1y = currentY + (targetY - currentY) * 0.3 + deviation * 0.5;
        const cp2x = targetX - (targetX - currentX) * 0.3 + deviation * 0.5;
        const cp2y = targetY - (targetY - currentY) * 0.3 + deviation * 0.5;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, targetX, targetY);
        currentX = targetX;
        currentY = targetY;
      }
      const tendrilOpacity = baseOpacity * bleedIntensity * (0.1 + Math.random() * 0.15);
      ctx.strokeStyle = `rgba(${r},${g},${b},${tendrilOpacity})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.stroke();
    }
  }
  static _drawBackruns(ctx, radius, r, g, b, baseOpacity, wetness) {
    if (wetness < 0.5 || Math.random() > 0.6) return; 
    ctx.globalCompositeOperation = 'destination-out';
    const backrunCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < backrunCount; i++) {
      const backrunAngle = Math.random() * Math.PI * 2;
      const backrunDistance = Math.random() * radius * 0.5;
      const backrunX = Math.cos(backrunAngle) * backrunDistance;
      const backrunY = Math.sin(backrunAngle) * backrunDistance;
      const backrunRadius = radius * (0.15 + Math.random() * 0.25);
      ctx.beginPath();
      const backrunPoints = 8;
      const backrunAngleStep = (Math.PI * 2) / backrunPoints;
      for (let j = 0; j <= backrunPoints; j++) {
        const angle = j * backrunAngleStep;
        const variation = 0.7 + Math.random() * 0.6;
        const px = backrunX + Math.cos(angle) * backrunRadius * variation;
        const py = backrunY + Math.sin(angle) * backrunRadius * variation;
        if (j === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
      const backrunOpacity = 0.3 + Math.random() * 0.4;
      ctx.fillStyle = `rgba(0,0,0,${backrunOpacity})`;
    ctx.fill();
    }
  }
  static _drawFinalDiffusion(ctx, radius, r, g, b, baseOpacity) {
    ctx.globalCompositeOperation = 'source-over';
    const diffusionRadius = radius * 1.6;
    const diffusionGradient = ctx.createRadialGradient(0, 0, radius * 0.9, 0, 0, diffusionRadius);
    const diffusionR = Math.min(255, r + 5);
    const diffusionG = Math.min(255, g + 3);
    const diffusionB = Math.min(255, b + 8);
    diffusionGradient.addColorStop(0, `rgba(${diffusionR},${diffusionG},${diffusionB},0)`);
    diffusionGradient.addColorStop(0.6, `rgba(${diffusionR},${diffusionG},${diffusionB},${baseOpacity * 0.08})`);
    diffusionGradient.addColorStop(0.9, `rgba(${diffusionR},${diffusionG},${diffusionB},${baseOpacity * 0.05})`);
    diffusionGradient.addColorStop(1, `rgba(${diffusionR},${diffusionG},${diffusionB},0)`);
    ctx.fillStyle = diffusionGradient;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0.1, diffusionRadius), 0, Math.PI * 2);
    ctx.fill();
  }
  static _drawAirbrushStamp(ctx, x, y, size, opacity, r, g, b, hardness, rotation) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(0.1, size/2));
    const coreStop = Math.max(0.01, Math.min(0.9, 0.1 + (1 - hardness) * 0.4)); 
    const midStop = Math.max(coreStop + 0.05, Math.min(0.95, 0.3 + (1 - hardness) * 0.5)); 
    const edgeStop = Math.max(midStop + 0.05, 0.98); 
    gradient.addColorStop(0, `rgba(${r},${g},${b},${opacity * (0.4 + hardness * 0.3)})`); 
    gradient.addColorStop(coreStop, `rgba(${r},${g},${b},${opacity * (0.2 + hardness * 0.2)})`);
    gradient.addColorStop(midStop, `rgba(${r},${g},${b},${opacity * (0.05 + hardness * 0.1)})`);
    gradient.addColorStop(edgeStop, `rgba(${r},${g},${b},${opacity * 0.02})`);
    gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.1, size/2), 0, Math.PI * 2);
    ctx.fill();
    const particleCount = Math.floor(size * ADVANCED_CONSTANTS.AIRBRUSH.PARTICLE_DENSITY * (1 + (1 - hardness) * 0.4));
    for (let i = 0; i < particleCount; i++) {
      const radialPos = AdvancedDistribution.radial(size/2 * (0.8 + (1-hardness) * 0.7));
      const adjustedRadius = Math.pow(radialPos.radius / (size/2), 1/ADVANCED_CONSTANTS.AIRBRUSH.DISTRIBUTION_POWER) * (size/2);
      const px = x + Math.cos(radialPos.angle) * adjustedRadius;
      const py = y + Math.sin(radialPos.angle) * adjustedRadius;
      const distanceRatio = adjustedRadius / (size/2);
      const maxParticleSizeFactor = 1 - distanceRatio * (0.6 + hardness * 0.2);
      const particleSize = Math.max(0.3, 0.5 * maxParticleSizeFactor * (1 + (1-hardness)*0.5));
      const opacityVariation = AdvancedRandom.range(
        ADVANCED_CONSTANTS.AIRBRUSH.OPACITY_VARIATION.MIN, 
        ADVANCED_CONSTANTS.AIRBRUSH.OPACITY_VARIATION.MAX
      );
      const particleOpacity = opacity * maxParticleSizeFactor * opacityVariation * (1 + (1-hardness) * 0.4);
      ctx.fillStyle = `rgba(${r},${g},${b},${particleOpacity})`;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(0.1, particleSize), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  static _drawPixelStamp(ctx, x, y, size, opacity, r, g, b, hardness, rotation) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    const pixelSize = Math.max(1, Math.floor(size / 6));
    const centerX = Math.round(x);
    const centerY = Math.round(y);
    const halfSize = Math.floor(size / 2);
    const startX = Math.floor(centerX - halfSize);
    const startY = Math.floor(centerY - halfSize);
    const endX = startX + size;
    const endY = startY + size;
    ctx.globalAlpha = opacity;
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    for (let py = startY; py < endY; py += pixelSize) {
      for (let px = startX; px < endX; px += pixelSize) {
        const alignedX = Math.floor(px / pixelSize) * pixelSize;
        const alignedY = Math.floor(py / pixelSize) * pixelSize;
        ctx.fillRect(alignedX, alignedY, pixelSize, pixelSize);
      }
    }
    ctx.imageSmoothingEnabled = true;
    ctx.restore();
  }
  static _drawBlenderStamp(ctx, x, y, size, opacity, r, g, b, hardness, rotation) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(0.1, size/2));
    const coreOpacityFactor = 0.05 + hardness * 0.1; 
    const midOpacityFactor = 0.02 + hardness * 0.03; 
    const coreStop = 0.2 + hardness * 0.3; 
    const midStop = Math.min(0.95, 0.6 + hardness * 0.3); 
    gradient.addColorStop(0, `rgba(${r},${g},${b},${opacity * coreOpacityFactor})`);
    gradient.addColorStop(coreStop, `rgba(${r},${g},${b},${opacity * midOpacityFactor})`);
    gradient.addColorStop(midStop, `rgba(${r},${g},${b},${opacity * 0.01})`); 
    gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.1, size/2), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-atop'; 
    ctx.globalAlpha = Math.max(0.01, 0.03 + (1-hardness) * 0.07); 
    const smudgeCount = Math.floor(3 + (1-hardness) * 5); 
    for (let i = 0; i < smudgeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * size/3 * (0.5 + (1-hardness)*0.5);
      ctx.strokeStyle = `rgba(200,200,200,${0.1 + (1-hardness)*0.2})`; 
      ctx.lineWidth = 1 + (1-hardness) * 2; 
      ctx.beginPath();
      ctx.moveTo(x + (Math.random()-0.5) * size/4, y + (Math.random()-0.5) * size/4); 
      ctx.lineTo(
        x + Math.cos(angle) * dist,
        y + Math.sin(angle) * dist
      );
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0; 
    ctx.globalCompositeOperation = 'source-over'; 
  }
  static midPointBtw(p1, p2) {
    if (!p2) return p1; 
    return {
      x: p1.x + (p2.x - p1.x) / 2,
      y: p1.y + (p2.y - p1.y) / 2,
    };
  }
  static getDynamicSize(baseSize, pressure, pressureSensitivityFactor = 0.7) {
    if (pressureSensitivityFactor <= 0) {
        return Math.max(1, baseSize);
    }
    const cubicResponse = (t, sensitivity) => {
        const s = clamp(sensitivity, 0.1, 0.9);
        const p0 = 0;
        const p1 = s * 0.5;
        const p2 = 0.5 + s * 0.3;
        const p3 = 1;
        return p0 * Math.pow(1-t, 3) + 
               3 * p1 * Math.pow(1-t, 2) * t + 
               3 * p2 * (1-t) * Math.pow(t, 2) + 
               p3 * Math.pow(t, 3);
    };
    const minPressureMultiplier = 0.05 + (1 - pressureSensitivityFactor) * 0.25;
    const pressureCurve = cubicResponse(pressure, pressureSensitivityFactor);
    const pressureMultiplier = minPressureMultiplier + (1 - minPressureMultiplier) * pressureCurve;
    const modulatedSize = baseSize * pressureMultiplier;
    return Math.max(1, modulatedSize);
  }
  static getDynamicOpacity(baseOpacity, pressure, pressureSensitivityFactor = 0.5) {
    if (baseOpacity >= 0.999) {
        return 1.0;
    }
    const pressureFactor = Math.max(0.1, Math.min(1.0, pressure * pressureSensitivityFactor));
    const x = baseOpacity;
    let adjustedOpacity;
    if (x <= 0.3) {
        adjustedOpacity = x * 0.8; 
    } else if (x <= 0.7) {
        const t = (x - 0.3) / 0.4; 
        const smoothStep = t * t * (3 - 2 * t); 
        adjustedOpacity = 0.24 + (smoothStep * 0.46); 
    } else {
        const t = (x - 0.7) / 0.3; 
        const smoothStep = t * t * (3 - 2 * t); 
        adjustedOpacity = 0.7 + (smoothStep * 0.3); 
    }
    return Math.min(1.0, adjustedOpacity * pressureFactor);
  }
  static beginStroke() {
    this.isNewStroke = true;
    this.strokeLength = 0;
    this.velocitySamples = [];
    this.lastVelocity = 0;
    this.distanceSinceLastStamp = 0;
    this.lastDirection = 0;
  }
  static currentPressure = 0.7;
}
export const SmartEraser = {
    lastPoint: null,
    erase(ctx, points, size, opacity = 1.0, hardness = 0.8, pressure = 0.7) {
        if (!points || points.length < 2) return;
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        for (let i = 1; i < points.length; i++) {
            const p1 = points[i - 1];
            const p2 = points[i];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const baseSpacing = size * 0.15; 
            const speedFactor = Math.min(1, distance / 50); 
            const spacing = baseSpacing * (1 - speedFactor * 0.5); 
            const numStamps = Math.max(1, Math.ceil(distance / spacing));
            for (let j = 0; j <= numStamps; j++) {
                const t = j / numStamps;
                const x = p1.x + dx * t;
                const y = p1.y + dy * t;
                const gradient = ctx.createRadialGradient(
                    x, y, 0,
                    x, y, size / 2
                );
                const innerRadius = (1 - hardness) * (size / 2);
                gradient.addColorStop(0, `rgba(0,0,0,${opacity})`);
                gradient.addColorStop(innerRadius / (size / 2), `rgba(0,0,0,${opacity})`);
                gradient.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.beginPath();
                ctx.fillStyle = gradient;
                ctx.arc(x, y, size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }
};
export const LineTool = {
    draw(ctx, startX, startY, endX, endY, color, size, settings = {}) {
        const {
            lineStyle = TOOL_SETTINGS.LINE.DEFAULT_LINE_STYLE,
            lineCap = TOOL_SETTINGS.LINE.DEFAULT_LINE_CAP,
            startArrow = TOOL_SETTINGS.LINE.DEFAULT_START_ARROW,
            endArrow = TOOL_SETTINGS.LINE.DEFAULT_END_ARROW,
            arrowSize = TOOL_SETTINGS.LINE.DEFAULT_ARROW_SIZE
        } = settings;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = size;
        ctx.lineCap = lineCap;
        ctx.lineJoin = 'round';
        if (lineStyle === TOOL_SETTINGS.LINE.LINE_STYLES.DASHED) {
            ctx.setLineDash([size * 4, size * 2]);
        } else if (lineStyle === TOOL_SETTINGS.LINE.LINE_STYLES.DOTTED) {
            ctx.setLineDash([size * 0.1, size * 1.5]);
        } else {
            ctx.setLineDash([]); 
        }
        const dx = endX - startX;
        const dy = endY - startY;
        const lineLength = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        let adjustedStartX = startX;
        let adjustedStartY = startY;
        let adjustedEndX = endX;
        let adjustedEndY = endY;
        if (startArrow && lineLength > arrowSize) {
            const offset = arrowSize * 0.8; 
            adjustedStartX = startX + (dx / lineLength) * offset;
            adjustedStartY = startY + (dy / lineLength) * offset;
        }
        if (endArrow && lineLength > arrowSize) {
            const offset = arrowSize * 0.8;
            adjustedEndX = endX - (dx / lineLength) * offset;
            adjustedEndY = endY - (dy / lineLength) * offset;
        }
        ctx.beginPath();
        ctx.moveTo(adjustedStartX, adjustedStartY);
        ctx.lineTo(adjustedEndX, adjustedEndY);
        ctx.stroke();
        ctx.setLineDash([]);
        if (startArrow && lineLength > arrowSize * 0.5) {
            this._drawArrow(ctx, startX, startY, angle + Math.PI, arrowSize, color, size);
        }
        if (endArrow && lineLength > arrowSize * 0.5) {
            this._drawArrow(ctx, endX, endY, angle, arrowSize, color, size);
        }
        ctx.restore();
    },
    _drawArrow(ctx, x, y, angle, size, color, lineSize) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, lineSize * 0.5);
        ctx.translate(x, y);
        ctx.rotate(angle);
        const arrowWidth = size * 0.6;
        const arrowLength = size;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-arrowLength, arrowWidth);
        ctx.lineTo(-arrowLength * 0.7, 0);
        ctx.lineTo(-arrowLength, -arrowWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
};
export const RectangleTool = {
    draw(ctx, startX, startY, endX, endY, color, size, settings = {}) {
        const {
            fillStyle = TOOL_SETTINGS.RECTANGLE.DEFAULT_FILL_STYLE,
            fillColor = TOOL_SETTINGS.RECTANGLE.DEFAULT_FILL_COLOR,
            fillEndColor = TOOL_SETTINGS.RECTANGLE.DEFAULT_FILL_END_COLOR,
            borderRadius = TOOL_SETTINGS.RECTANGLE.DEFAULT_BORDER_RADIUS,
            rotation = TOOL_SETTINGS.RECTANGLE.DEFAULT_ROTATION
        } = settings;
        ctx.save();
        const width = endX - startX;
        const height = endY - startY;
        const centerX = startX + width / 2;
        const centerY = startY + height / 2;
        if (rotation !== 0) {
            ctx.translate(centerX, centerY);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.translate(-centerX, -centerY);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        if (borderRadius > 0) {
            this._drawRoundedRect(ctx, startX, startY, width, height, borderRadius);
        } else {
            ctx.rect(startX, startY, width, height);
        }
        if (fillStyle !== 'none') {
            this._applyFill(ctx, startX, startY, width, height, fillStyle, fillColor, fillEndColor);
            ctx.fill();
        }
        ctx.stroke();
        ctx.restore();
    },
    _drawRoundedRect(ctx, x, y, width, height, radius) {
        const maxRadius = Math.min(Math.abs(width) / 2, Math.abs(height) / 2);
        const r = Math.min(radius, maxRadius);
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
    },
    _applyFill(ctx, x, y, width, height, fillStyle, fillColor, fillEndColor = null) {
        switch (fillStyle) {
            case 'solid':
                ctx.fillStyle = fillColor;
                break;
            case 'gradient':
                const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
                gradient.addColorStop(0, fillColor);
                gradient.addColorStop(1, fillEndColor || ColorUtils.adjustColorBrightness(fillColor, -0.3));
                ctx.fillStyle = gradient;
                break;
            case 'pattern':
                ctx.fillStyle = this._createPatternFill(ctx, fillColor);
                break;
            default:
                ctx.fillStyle = 'transparent';
        }
    },
    _createPatternFill(ctx, color) {
        const { canvas: patternCanvas, ctx: patternCtx } = CanvasUtils.createCanvas(10, 10);
        patternCtx.strokeStyle = color;
        patternCtx.lineWidth = 1;
        patternCtx.beginPath();
        patternCtx.moveTo(0, 0);
        patternCtx.lineTo(10, 10);
        patternCtx.moveTo(-2, 8);
        patternCtx.lineTo(2, 12);
        patternCtx.moveTo(8, -2);
        patternCtx.lineTo(12, 2);
        patternCtx.stroke();
        return ctx.createPattern(patternCanvas, 'repeat');
    }
};
export const CircleTool = {
    draw(ctx, startX, startY, endX, endY, color, size, settings = {}) {
        const {
            fillStyle = TOOL_SETTINGS.CIRCLE.DEFAULT_FILL_STYLE,
            fillColor = TOOL_SETTINGS.CIRCLE.DEFAULT_FILL_COLOR,
            fillEndColor = TOOL_SETTINGS.CIRCLE.DEFAULT_FILL_END_COLOR,
            startAngle = TOOL_SETTINGS.CIRCLE.DEFAULT_START_ANGLE,
            endAngle = TOOL_SETTINGS.CIRCLE.DEFAULT_END_ANGLE
        } = settings;
        ctx.save();
        const radius = Math.sqrt(
            Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
        );
        const finalRadius = Math.max(0.1, radius);
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (startAngle === 0 && endAngle === 360) {
            ctx.arc(startX, startY, finalRadius, 0, Math.PI * 2);
        } else {
            ctx.arc(startX, startY, finalRadius, startRad, endRad);
            if (Math.abs(endAngle - startAngle) < 360 && fillStyle !== 'none') {
                ctx.lineTo(startX, startY);
                ctx.closePath();
            }
        }
        if (fillStyle !== 'none') {
            this._applyFill(ctx, startX, startY, finalRadius, fillStyle, fillColor, fillEndColor);
            ctx.fill();
        }
        ctx.stroke();
        ctx.restore();
    },
    _applyFill(ctx, centerX, centerY, radius, fillStyle, fillColor, fillEndColor = null) {
        switch (fillStyle) {
            case 'solid':
                ctx.fillStyle = fillColor;
                break;
            case 'gradient':
                const gradient = ctx.createRadialGradient(
                    centerX, centerY, 0,
                    centerX, centerY, radius
                );
                gradient.addColorStop(0, fillColor);
                gradient.addColorStop(1, fillEndColor || ColorUtils.adjustColorBrightness(fillColor, -0.3));
                ctx.fillStyle = gradient;
                break;
            case 'pattern':
                ctx.fillStyle = this._createPatternFill(ctx, fillColor);
                break;
            default:
                ctx.fillStyle = 'transparent';
        }
    },
    _createPatternFill(ctx, color) {
        const { canvas: patternCanvas, ctx: patternCtx } = CanvasUtils.createCanvas(12, 12);
        patternCtx.fillStyle = color;
        patternCtx.beginPath();
        patternCtx.arc(3, 3, 1.5, 0, Math.PI * 2);
        patternCtx.arc(9, 9, 1.5, 0, Math.PI * 2);
        patternCtx.arc(9, 3, 1, 0, Math.PI * 2);
        patternCtx.arc(3, 9, 1, 0, Math.PI * 2);
        patternCtx.fill();
        return ctx.createPattern(patternCanvas, 'repeat');
    }
};
export const EyedropperTool = {
    pick(ctx, x, y, nodeState = {}) {
        try {
            const sampleMode = nodeState.eyedropperSampleMode || 'pixel';
            const sampleSize = nodeState.eyedropperSampleSize || 3;
            x = Math.round(x);
            y = Math.round(y);
                    x = clamp(x, 0, ctx.canvas.width - 1);
        y = clamp(y, 0, ctx.canvas.height - 1);
            if (sampleMode === 'pixel') {
                const pixel = ctx.getImageData(x, y, 1, 1).data;
                return ColorUtils.rgbToHex(pixel[0], pixel[1], pixel[2]);
            } else if (sampleMode === 'average') {
                const halfSize = Math.floor(sampleSize / 2);
                const startX = Math.max(0, x - halfSize);
                const startY = Math.max(0, y - halfSize);
                const width = Math.min(sampleSize, ctx.canvas.width - startX);
                const height = Math.min(sampleSize, ctx.canvas.height - startY);
                if (width <= 0 || height <= 0) {
                    const pixel = ctx.getImageData(x, y, 1, 1).data;
                    return ColorUtils.rgbToHex(pixel[0], pixel[1], pixel[2]);
                }
                const imageData = ctx.getImageData(startX, startY, width, height);
                const data = imageData.data;
                let r = 0, g = 0, b = 0, count = 0;
                for (let i = 0; i < data.length; i += 4) {
                    if (data[i + 3] > 0) {
                        r += data[i];
                        g += data[i + 1];
                        b += data[i + 2];
                        count++;
                    }
                }
                if (count > 0) {
                    r = Math.round(r / count);
                    g = Math.round(g / count);
                    b = Math.round(b / count);
                    return ColorUtils.rgbToHex(r, g, b);
                } else {
                    const pixel = ctx.getImageData(x, y, 1, 1).data;
                    return ColorUtils.rgbToHex(pixel[0], pixel[1], pixel[2]);
                }
            }
            const pixel = ctx.getImageData(x, y, 1, 1).data;
            return ColorUtils.rgbToHex(pixel[0], pixel[1], pixel[2]);
        } catch (e) {
            console.error("Error in EyedropperTool.pick:", e);
            return "#ffffff"; 
        }
    }
};
export const GradientTool = {
    _colorCache: new Map(),
    _parseColorCached(color) {
        if (this._colorCache.has(color)) return this._colorCache.get(color);
        const rgb = ColorUtils.hexToRgb(color);
        this._colorCache.set(color, rgb);
        return rgb;
    },
    _interpolateColor(color1, color2, t, colorSpace = 'rgb') {
        const c1 = this._parseColorCached(color1);
        const c2 = this._parseColorCached(color2);
        if (colorSpace === 'hsv') {
            const hsv1 = ColorUtils.rgbToHsv(c1.r, c1.g, c1.b);
            const hsv2 = ColorUtils.rgbToHsv(c2.r, c2.g, c2.b);
            let hueDiff = hsv2.h - hsv1.h;
            if (hueDiff > 0.5) hueDiff -= 1;
            if (hueDiff < -0.5) hueDiff += 1;
            const h = (hsv1.h + hueDiff * t) % 1;
            const s = hsv1.s + (hsv2.s - hsv1.s) * t;
            const v = hsv1.v + (hsv2.v - hsv1.v) * t;
            const rgb = ColorUtils.hsvToRgb(h, s, v);
            return ColorUtils.rgbToHex(rgb.r, rgb.g, rgb.b);
        } else {
            const gamma = 2.2;
            const r1 = Math.pow(c1.r / 255, gamma);
            const g1 = Math.pow(c1.g / 255, gamma);
            const b1 = Math.pow(c1.b / 255, gamma);
            const r2 = Math.pow(c2.r / 255, gamma);
            const g2 = Math.pow(c2.g / 255, gamma);
            const b2 = Math.pow(c2.b / 255, gamma);
            const r = Math.pow(r1 + (r2 - r1) * t, 1/gamma) * 255;
            const g = Math.pow(g1 + (g2 - g1) * t, 1/gamma) * 255;
            const b = Math.pow(b1 + (b2 - b1) * t, 1/gamma) * 255;
            return ColorUtils.rgbToHex(Math.round(r), Math.round(g), Math.round(b));
        }
    },
    _createConicalGradient(ctx, centerX, centerY, startColor, endColor, startAngle = 0) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                let angle = Math.atan2(dy, dx) + Math.PI; 
                angle = (angle + startAngle) % (Math.PI * 2); 
                const t = angle / (Math.PI * 2); 
                const color = this._interpolateColor(startColor, endColor, t, 'hsv');
                const rgb = this._parseColorCached(color);
                const index = (y * width + x) * 4;
                data[index] = rgb.r;
                data[index + 1] = rgb.g;
                data[index + 2] = rgb.b;
                data[index + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    },
    draw(ctx, startX, startY, endX, endY, startColor, endColor, gradientType = 'linear', smoothness = 0.5, opacity = 1.0) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
            ctx.save();
            if (opacity !== undefined && opacity !== 1.0) {
                ctx.globalAlpha = opacity;
            }
        if (gradientType === 'conical') {
            const angle = Math.atan2(endY - startY, endX - startX);
            this._createConicalGradient(ctx, startX, startY, startColor, endColor, angle);
        } else {
            let gradient;
            if (gradientType === 'radial') {
                const dx = endX - startX;
                const dy = endY - startY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                gradient = ctx.createRadialGradient(
                    startX, startY, 0,
                    startX, startY, distance
                );
            } else if (gradientType === 'diamond') {
                const dx = Math.abs(endX - startX);
                const dy = Math.abs(endY - startY);
                const distance = Math.max(dx, dy);
                gradient = ctx.createRadialGradient(
                    startX, startY, 0,
                    startX, startY, distance
                );
        } else {
            gradient = ctx.createLinearGradient(startX, startY, endX, endY);
        }
            const steps = Math.max(5, Math.floor(smoothness * 20)); 
            const useHSV = gradientType === 'radial' || gradientType === 'diamond'; 
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                let easedT = t;
                if (smoothness > 0.7) {
                    easedT = t * t * (3 - 2 * t);
                } else if (smoothness > 0.3) {
                    easedT = t * t * t * (t * (t * 6 - 15) + 10);
                }
                const color = this._interpolateColor(startColor, endColor, easedT, useHSV ? 'hsv' : 'rgb');
                gradient.addColorStop(t, color);
            }
            if (gradientType === 'diamond') {
                ctx.save();
                ctx.translate(startX, startY);
                ctx.scale(1, Math.abs(endY - startY) / Math.abs(endX - startX) || 1);
                ctx.translate(-startX, -startY);
            }
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            if (gradientType === 'diamond') {
                ctx.restore();
            }
        }
        ctx.restore();
    }
};
export const FillTool = {
    fill(ctx, startX, startY, fillColor, tolerance = 32) {
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const pixels = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        startX = Math.floor(clamp(startX, 0, width - 1));
        startY = Math.floor(clamp(startY, 0, height - 1));
        const startPos = (startY * width + startX) * 4;
        const startColor = {
            r: pixels[startPos],
            g: pixels[startPos + 1],
            b: pixels[startPos + 2],
            a: pixels[startPos + 3]
        };
        const targetColor = Array.isArray(fillColor) ? fillColor : this._parseColorArray(fillColor);
        if (this._colorsEqual(startColor, targetColor, 0)) {
            return;
        }
        const visited = new Uint8Array(width * height); 
        const stack = [[startX, startY]];
        while (stack.length > 0) {
            const [x, y] = stack.pop();
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            const index = y * width + x;
            if (visited[index]) continue;
            const pixelPos = index * 4;
            const currentColor = {
                r: pixels[pixelPos],
                g: pixels[pixelPos + 1],
                b: pixels[pixelPos + 2],
                a: pixels[pixelPos + 3]
            };
            if (!this._AdvancedColorMatch(currentColor, startColor, tolerance)) {
                continue;
            }
            let leftX = x;
            let rightX = x;
            while (leftX > 0) {
                const leftIndex = y * width + (leftX - 1);
                if (visited[leftIndex]) break;
                const leftPixelPos = leftIndex * 4;
                const leftColor = {
                    r: pixels[leftPixelPos],
                    g: pixels[leftPixelPos + 1],
                    b: pixels[leftPixelPos + 2],
                    a: pixels[leftPixelPos + 3]
                };
                if (!this._AdvancedColorMatch(leftColor, startColor, tolerance)) break;
                leftX--;
            }
            while (rightX < width - 1) {
                const rightIndex = y * width + (rightX + 1);
                if (visited[rightIndex]) break;
                const rightPixelPos = rightIndex * 4;
                const rightColor = {
                    r: pixels[rightPixelPos],
                    g: pixels[rightPixelPos + 1],
                    b: pixels[rightPixelPos + 2],
                    a: pixels[rightPixelPos + 3]
                };
                if (!this._AdvancedColorMatch(rightColor, startColor, tolerance)) break;
                rightX++;
            }
            for (let scanX = leftX; scanX <= rightX; scanX++) {
                const scanIndex = y * width + scanX;
                const scanPixelPos = scanIndex * 4;
                visited[scanIndex] = 1;
                pixels[scanPixelPos] = targetColor[0];
                pixels[scanPixelPos + 1] = targetColor[1];
                pixels[scanPixelPos + 2] = targetColor[2];
                pixels[scanPixelPos + 3] = targetColor[3];
            }
            for (let scanX = leftX; scanX <= rightX; scanX++) {
                if (y > 0) stack.push([scanX, y - 1]);
                if (y < height - 1) stack.push([scanX, y + 1]);
            }
        }
        ctx.putImageData(imageData, 0, 0);
    },
    _AdvancedColorMatch(color1, color2, tolerance) {
        if (tolerance === 0) {
            return this._colorsEqual(color1, color2, 0);
        }
        const deltaR = color1.r - color2.r;
        const deltaG = color1.g - color2.g;
        const deltaB = color1.b - color2.b;
        const deltaA = color1.a - color2.a;
        const weightedDelta = Math.sqrt(
            0.299 * deltaR * deltaR +
            0.587 * deltaG * deltaG +
            0.114 * deltaB * deltaB +
            0.1 * deltaA * deltaA
        );
        return weightedDelta <= tolerance;
    },
    _colorsEqual(color1, color2, tolerance = 0) {
        return Math.abs(color1.r - color2.r) <= tolerance &&
               Math.abs(color1.g - color2.g) <= tolerance &&
               Math.abs(color1.b - color2.b) <= tolerance &&
               Math.abs(color1.a - color2.a) <= tolerance;
    },
    _parseColorArray(color) {
        if (Array.isArray(color)) return color;
        const rgb = ColorUtils.hexToRgb(color);
        return [rgb.r, rgb.g, rgb.b, 255];
    }
};
export const ColorUtils = {
    isValidHexColor(hex) {
        if (!hex || typeof hex !== 'string') return false;
        const cleanHex = hex.replace('#', '');
        return /^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(cleanHex);
    },
    hexToRgb(hex) {
        if (!hex || typeof hex !== 'string') {
            console.warn('ColorUtils.hexToRgb: Invalid hex input, defaulting to black');
            return { r: 0, g: 0, b: 0 };
        }
        if (_hexColorCache.has(hex)) return _hexColorCache.get(hex);
        const cleanHex = hex.replace('#', '').toLowerCase();
        let r = 0, g = 0, b = 0;
        try {
            if (cleanHex.length === 3) {
                r = parseInt(cleanHex[0] + cleanHex[0], 16);
                g = parseInt(cleanHex[1] + cleanHex[1], 16);
                b = parseInt(cleanHex[2] + cleanHex[2], 16);
            } else if (cleanHex.length === 6) {
                r = parseInt(cleanHex.substring(0, 2), 16);
                g = parseInt(cleanHex.substring(2, 4), 16);
                b = parseInt(cleanHex.substring(4, 6), 16);
            } else {
                throw new Error(`Invalid hex length: ${cleanHex.length}`);
            }
            if (isNaN(r) || isNaN(g) || isNaN(b)) {
                throw new Error('Invalid hex characters');
            }
        } catch (error) {
            console.warn(`ColorUtils.hexToRgb: Parse error for "${hex}": ${error.message}, defaulting to black`);
            return { r: 0, g: 0, b: 0 };
        }
        const result = { r: clampRGB(r), g: clampRGB(g), b: clampRGB(b) };
        if (_hexColorCache.size < 1000) {
            _hexColorCache.set(hex, result);
        }
        return result;
    },
    rgbToHex(r, g, b) {
        if (typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number') {
            console.warn('ColorUtils.rgbToHex: Invalid RGB input types, defaulting to #000000');
            return '#000000';
        }
        r = Math.round(clampRGB(r));
        g = Math.round(clampRGB(g));
        b = Math.round(clampRGB(b));
        const toHex = (value) => {
            const hex = value.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
    },
    rgbToHsv(r, g, b) {
        if (typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number') {
            console.warn('ColorUtils.rgbToHsv: Invalid input types, defaulting to black');
            return { h: 0, s: 0, v: 0 };
        }
        r = clampRGB(r) / 255;
        g = clampRGB(g) / 255;
        b = clampRGB(b) / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        let h = 0;
        let s = 0;
        const v = max;
        if (max !== 0) {
            s = delta / max;
        }
        if (delta !== 0) {
            if (max === r) {
                h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
            } else if (max === g) {
                h = ((b - r) / delta + 2) / 6;
            } else {
                h = ((r - g) / delta + 4) / 6;
            }
        }
        return { h: clamp01(h), s: clamp01(s), v: clamp01(v) };
    },
    hsvToRgb(h, s, v) {
        if (typeof h !== 'number' || typeof s !== 'number' || typeof v !== 'number') {
            console.warn('ColorUtils.hsvToRgb: Invalid input types, defaulting to black');
            return { r: 0, g: 0, b: 0 };
        }
        h = clamp01(h);
        s = clamp01(s);
        v = clamp01(v);
        const c = v * s;
        const x = c * (1 - Math.abs((h * 6) % 2 - 1));
        const m = v - c;
        let r = 0, g = 0, b = 0;
        const sector = Math.floor(h * 6);
        switch (sector) {
            case 0: r = c; g = x; b = 0; break;
            case 1: r = x; g = c; b = 0; break;
            case 2: r = 0; g = c; b = x; break;
            case 3: r = 0; g = x; b = c; break;
            case 4: r = x; g = 0; b = c; break;
            case 5: r = c; g = 0; b = x; break;
            default: r = c; g = x; b = 0; break;
        }
        return { 
            r: Math.round(clampRGB((r + m) * 255)), 
            g: Math.round(clampRGB((g + m) * 255)), 
            b: Math.round(clampRGB((b + m) * 255)) 
        };
    },
    adjustColorBrightness(color, amount) {
        const usePound = color.startsWith('#');
        if (!usePound && !color.match(/^([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/)) {
             console.warn('Invalid color format for brightness adjustment:', color);
             return color;
        }
        const col = usePound ? color.slice(1) : color;
        const num = parseInt(col, 16);
        if (isNaN(num)) {
            console.warn('Could not parse color:', color);
            return color;
        }
        let r = (num >> 16) + amount * 255;
        let g = ((num >> 8) & 0x00FF) + amount * 255;
        let b = (num & 0x0000FF) + amount * 255;
        r = Math.round(Math.max(0, Math.min(255, r)));
        g = Math.round(Math.max(0, Math.min(255, g)));
        b = Math.round(Math.max(0, Math.min(255, b)));
        const hex = (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
        return (usePound ? '#' : '') + hex;
    },
    rgbaToHex(r, g, b, a = 255) {
        if (typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number' || typeof a !== 'number') {
            console.warn('ColorUtils.rgbaToHex: Invalid input types, defaulting to #000000');
            return '#000000';
        }
        r = Math.round(clampRGB(r));
        g = Math.round(clampRGB(g));
        b = Math.round(clampRGB(b));
        a = Math.round(clampRGB(a));
        const toHex = (value) => {
            const hex = value.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        if (a < 255) {
            return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`.toUpperCase();
        }
        return this.rgbToHex(r, g, b);
    },
    hexToHsv(hex) {
        try {
        const { r, g, b } = this.hexToRgb(hex);
        return this.rgbToHsv(r, g, b);
        } catch (error) {
            console.warn(`ColorUtils.hexToHsv: Conversion error for "${hex}": ${error.message}, defaulting to black`);
            return { h: 0, s: 0, v: 0 };
        }
    },
    deltaE(color1, color2) {
        const lab1 = this._rgbToLab(color1.r, color1.g, color1.b);
        const lab2 = this._rgbToLab(color2.r, color2.g, color2.b);
        const deltaL = lab1.l - lab2.l;
        const deltaA = lab1.a - lab2.a;
        const deltaB = lab1.b - lab2.b;
        return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
    },
    _rgbToLab(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
        g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
        b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
        const x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047;
        const y = (r * 0.2126729 + g * 0.7151522 + b * 0.0721750) / 1.00000;
        const z = (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) / 1.08883;
        const fx = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
        const fy = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
        const fz = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);
        return {
            l: 116 * fy - 16,
            a: 500 * (fx - fy),
            b: 200 * (fy - fz)
        };
    }
}; 
