/**
 * Drag Prevention Helper for ComfyUI Custom Nodes
 * 
 * This module provides reusable functions to prevent node dragging
 * when clicking on interactive UI elements while allowing normal
 * dragging when clicking on empty areas.
 */

// Bounds detection helper
export const isInBounds = (x, y, area) => {
    return x >= area.x && 
           x <= area.x + area.width && 
           y >= area.y && 
           y <= area.y + area.height;
};

/**
 * Setup mouse handlers for drag prevention
 * @param {Object} node - The node instance
 * @param {Object} config - Configuration object with interactive areas
 * @param {Function} config.onCanvasClick - Optional callback for canvas clicks
 * @param {Function} config.onToolbarClick - Optional callback for toolbar clicks
 * @param {Function} config.onControlsClick - Optional callback for controls clicks
 */
export const setupMouseHandlers = (node, config = {}) => {
    const originalOnMouseDown = node.onMouseDown;
    
    node.onMouseDown = function(e, pos) {
        // Basic validation
        if (!pos || !pos.length) {
            return false;
        }
        
        // Don't handle if node is collapsed
        if (this.flags.collapsed) {
            return false;
        }
        
        // Update interaction tracking
        this.lastMousePos = pos; 
        if (this._lastInteractionTime !== undefined) {
            this._lastInteractionTime = Date.now();
        }
        
        // Check each interactive area defined in config
        const areas = config.areas || {};
        
        for (const [areaName, getAreaBounds] of Object.entries(areas)) {
            if (typeof getAreaBounds === 'function') {
                const bounds = getAreaBounds.call(this);
                if (bounds && isInBounds(pos[0], pos[1], bounds)) {
                    // Call area-specific handler if provided
                    const handlerName = `on${areaName.charAt(0).toUpperCase() + areaName.slice(1)}Click`;
                    if (config[handlerName] && typeof config[handlerName] === 'function') {
                        const result = config[handlerName].call(this, e, pos);
                        if (result !== false) {
                            return true; // Prevent dragging unless handler explicitly returns false
                        }
                    } else {
                        return true; // Prevent dragging by default for interactive areas
                    }
                }
            }
        }
        
        // If original handler exists and no interactive area was clicked, call it
        if (originalOnMouseDown) {
            const result = originalOnMouseDown.call(this, e, pos);
            if (result !== undefined) {
                return result;
            }
        }
        
        // Default: allow dragging for empty areas
        return false;
    }.bind(node);
};

/**
 * Main convenience function for drag prevention
 * @param {Object} node - The node instance  
 * @param {Object} areas - Object with area names as keys and getter functions as values
 * @param {Object} handlers - Optional custom handlers for each area
 */
export const preventNodeDrag = (node, areas, handlers = {}) => {
    const config = {
        areas: areas,
        ...handlers
    };
    
    setupMouseHandlers(node, config);
};

/**
 * Enhanced drag prevention for complex nodes with canvas drawing
 * @param {Object} node - The node instance
 * @param {Object} config - Configuration object
 */
export const preventNodeDragWithCanvas = (node, config = {}) => {
    const originalOnMouseDown = node.onMouseDown;
    
    node.onMouseDown = function(e, pos) {
        if (!pos || !pos.length) {
            return false;
        }
        
        if (this.flags.collapsed) {
            return false;
        }
        
        this.lastMousePos = pos; 
        if (this._lastInteractionTime !== undefined) {
            this._lastInteractionTime = Date.now();
        }
        
        // Check interactive areas first
        const areas = config.areas || {};
        
        // Check toolbar
        if (areas.toolbar) {
            const toolbarBounds = areas.toolbar.call(this);
            if (toolbarBounds && isInBounds(pos[0], pos[1], toolbarBounds)) {
                if (config.onToolbarClick) {
                    return config.onToolbarClick.call(this, e, pos);
                }
                return true;
            }
        }
        
        // Check controls
        if (areas.controls) {
            const controlsBounds = areas.controls.call(this);
            if (controlsBounds && isInBounds(pos[0], pos[1], controlsBounds)) {
                if (config.onControlsClick) {
                    return config.onControlsClick.call(this, e, pos);
                }
                return true;
            }
        }
        
        // Check refresh button
        if (areas.refresh) {
            const refreshBounds = areas.refresh.call(this);
            if (refreshBounds && isInBounds(pos[0], pos[1], refreshBounds)) {
                if (config.onRefreshClick) {
                    return config.onRefreshClick.call(this, e, pos);
                }
                return true;
            }
        }
        
        // Check fullscreen button
        if (areas.fullscreen) {
            const fullscreenBounds = areas.fullscreen.call(this);
            if (fullscreenBounds && isInBounds(pos[0], pos[1], fullscreenBounds)) {
                if (config.onFullscreenClick) {
                    return config.onFullscreenClick.call(this, e, pos);
                }
                return true;
            }
        }
        
        
        // Check canvas last (for drawing functionality)
        if (areas.canvas) {
            const canvasBounds = areas.canvas.call(this);
            if (canvasBounds && isInBounds(pos[0], pos[1], canvasBounds)) {
                // Prevent event bubbling for canvas interactions
                e.stopImmediatePropagation();
                e.preventDefault();
                e.stopPropagation();
                
                if (config.onCanvasClick) {
                    return config.onCanvasClick.call(this, e, pos);
                }
                return true;
            }
        }
        
        // Call original handler if no interactive area was clicked
        if (originalOnMouseDown) {
            const result = originalOnMouseDown.call(this, e, pos);
            if (result !== undefined) {
                return result;
            }
        }
        
        return false; // Allow dragging for empty areas
    }.bind(node);
};

// Export all functions as default object as well
export default {
    isInBounds,
    setupMouseHandlers,
    preventNodeDrag,
    preventNodeDragWithCanvas
};