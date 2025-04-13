import { SVG, STYLES } from './NodeDesignConstants.js';
const ButtonManager = {
    isInitialized: false,
    buttonContainer: null,
    isPermanent: true,
    dragStartX: 0,
    dragStartY: 0,
    isDragging: false,
    boundOnDragging: null,
    boundOnDragEnd: null,
    undoStack: [],
    redoStack: [],
    maxUndoStackSize: 50,
    colorPicker: null,
    bgColorPicker: null,
    isUpdatingPickers: false,
    isVisible: false,
    isClosedByUser: false,
    init() {
        if (this.isInitialized) {
            return;
        }
        const style = document.createElement('style');
        style.textContent = STYLES;
        document.head.appendChild(style);
        this.buttonContainer = document.createElement('div');
        this.buttonContainer.id = 'nd-alignment-buttons';
        this.buttonContainer.style.position = 'fixed';
        this.buttonContainer.style.zIndex = '9999';
        this.buttonContainer.style.left = '0px';
        this.buttonContainer.style.top = '0px';
        this.buttonContainer.style.visibility = 'hidden';
        document.body.appendChild(this.buttonContainer);
        this.boundOnDragging = this.onDragging.bind(this);
        this.boundOnDragEnd = this.onDragEnd.bind(this);
        this.buttonContainer.addEventListener('mousedown', this.onDragStart.bind(this));
        document.addEventListener('mousemove', this.boundOnDragging);
        document.addEventListener('mouseup', this.boundOnDragEnd);
        this.createButtons();
        this.setupContextMenu();
        this.isInitialized = true;
        this.setInitialVisibility();
        this.initUndoRedo();
        this.updateToggleButton();
    },
    initUndoRedo() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') {
                    e.preventDefault();
                    this.undo();
                } else if (e.key === 'y' || (e.shiftKey && e.key === 'Z')) {
                    e.preventDefault();
                    this.redo();
                }
            }
        });
    },
    addToUndoStack(action) {
        this.undoStack.push(action);
        if (this.undoStack.length > this.maxUndoStackSize) {
            this.undoStack.shift();
        }
        this.redoStack = [];
        this.updateUndoRedoButtons();
    },
    executeAction(fromStack, toStack, actionMethod) {
        if (fromStack.length === 0) return;
        const action = fromStack.pop();
        try {
            if (action && typeof action[actionMethod] === 'function') {
                action[actionMethod]();
                toStack.push(action);
            } else {
                console.warn(`Invalid action or missing ${actionMethod} method`);
                return;
            }
            try {
                this.updateCanvas();
            } catch (canvasError) {
                console.warn(`Error updating canvas after ${actionMethod}:`, canvasError);
            }
        } catch (error) {
            console.warn(`Error during ${actionMethod} operation:`, error);
            fromStack.push(action);
        } finally {
            this.updateUndoRedoButtons();
        }
    },
    undo() {
        this.executeAction(this.undoStack, this.redoStack, 'undo');
    },
    redo() {
        this.executeAction(this.redoStack, this.undoStack, 'redo');
    },
    updateUndoRedoButtons() {
        const undoButton = document.getElementById('undo');
        const redoButton = document.getElementById('redo');
        if (undoButton) undoButton.disabled = this.undoStack.length === 0;
        if (redoButton) redoButton.disabled = this.redoStack.length === 0;
    },
    createButtons() {
        const colorPickerContainer = document.createElement('div');
        colorPickerContainer.classList.add('nd-color-picker-container');
        this.colorPicker = this.createSingleColorPicker('node-color-picker', 'Select Node Color', this.onNodeColorChange.bind(this));
        this.bgColorPicker = this.createSingleColorPicker('node-bg-color-picker', 'Select Node Background Color', this.onNodeBgColorChange.bind(this));
        colorPickerContainer.appendChild(this.colorPicker);
        colorPickerContainer.appendChild(this.bgColorPicker);
        this.buttonContainer.appendChild(colorPickerContainer);
        const buttons = this.getButtons();
        buttons.forEach(btn => {
            if (btn.type === 'divider') {
                this.createDivider();
            } else {
                this.createButton(btn);
            }
        });
    },
    createDivider() {
        const divider = document.createElement('div');
        divider.classList.add('nd-divider');
        divider.addEventListener('mousedown', this.onDragStart.bind(this));
        this.buttonContainer.appendChild(divider);
    },
    createButton(btn) {
        const button = document.createElement('button');
        button.id = btn.id;
        button.classList.add('nd-button');
        button.innerHTML = SVG[btn.id] || '';
        button.title = this.getButtonTitle(btn.id);
        button.addEventListener('click', (e) => {
            try {
                if (typeof btn.action === 'function') {
                    btn.action.call(this, e);
                }
                try {
                    this.updateCanvas();
                } catch (canvasError) {
                    console.warn(`Error updating canvas after button click:`, canvasError);
                }
            } catch (error) {
                console.warn(`Error executing action for button ${btn.id}:`, error);
            }
        });
        this.buttonContainer.appendChild(button);
    },
    getButtonTitle(buttonId) {
        const titles = {
            alignLeft: 'Align Left',
            alignCenterHorizontally: 'Center Horizontally',
            alignRight: 'Align Right',
            alignTop: 'Align Top',
            alignCenterVertically: 'Center Vertically',
            alignBottom: 'Align Bottom',
            horizontalDistribution: 'Distribute Horizontally',
            verticalDistribution: 'Distribute Vertically',
            equalWidth: 'Equal Width',
            equalHeight: 'Equal Height',
            undo: 'Undo',
            redo: 'Redo',
            smartAlign: 'Smart Align',
            treeView: 'Tree View',
            toggleMode: 'Toggle Mode'
        };
        return titles[buttonId] || '';
    },
    getButtons() {
        return [
            { id: 'alignLeft', action: () => this._handleAlignmentAction('alignLeft') },
            { id: 'alignCenterHorizontally', action: () => this._handleAlignmentAction('alignCenterHorizontally') },
            { id: 'alignRight', action: () => this._handleAlignmentAction('alignRight') },
            { id: 'alignTop', action: () => this._handleAlignmentAction('alignTop') },
            { id: 'alignCenterVertically', action: () => this._handleAlignmentAction('alignCenterVertically') },
            { id: 'alignBottom', action: () => this._handleAlignmentAction('alignBottom') },
            { id: 'equalWidth', action: () => this._handleAlignmentAction('equalWidth') },
            { id: 'equalHeight', action: () => this._handleAlignmentAction('equalHeight') },
            { id: 'horizontalDistribution', action: this.horizontalDistribution },
            { id: 'verticalDistribution', action: this.verticalDistribution },
            { id: 'undo', action: this.undo },
            { id: 'redo', action: this.redo },
            { id: 'smartAlign', action: this.smartAlign },
            { id: 'treeView', action: this.treeView },
            { id: 'toggleMode', action: this.toggleMode },
            { type: 'divider' },
            { id: 'close', action: this.close }
        ];
    },
    toggleMode() {
        this.isPermanent = !this.isPermanent;
        localStorage.setItem('NodeAlignerIsPermanent', this.isPermanent ? '1' : '0');
        if (!this.isPermanent) {
            const selectedNodes = this.getSelectedNodes();
            if (selectedNodes.length < 2) {
                this.hide();
            }
        }
        this.updateToggleButton();
    },
    updateToggleButton() {
        const toggleButton = document.getElementById('toggleMode');
        if (toggleButton) {
            toggleButton.classList.toggle('active', this.isPermanent);
            toggleButton.title = this.isPermanent ? 'Show on selection' : 'Show permanently';
        }
    },
    setInitialVisibility() {
        const isVisible = localStorage.getItem('NodeDesignVisible') === 'true';
        const isPermanent = localStorage.getItem('NodeAlignerIsPermanent') === '1';
        this.isVisible = false;
        this.isPermanent = isPermanent;
        if (isVisible && isPermanent) {
            setTimeout(() => { 
                this.show(); 
            }, 0);
        } else {
            this.buttonContainer.style.visibility = 'hidden';
            this.buttonContainer.style.display = 'none';
            this.isVisible = false;
        }
        this.updateToggleButton();
    },
    show() {
        if (!this.isVisible) {
            this.isClosedByUser = false;
            this.restorePosition();
            this.buttonContainer.style.display = 'flex';
            this.buttonContainer.style.visibility = 'visible';
            this.isVisible = true;
            localStorage.setItem('NodeDesignVisible', 'true');
            this.updateToggleButton();
        }
    },
    hide() {
        if (!this.isPermanent) {
            this.buttonContainer.style.display = 'none';
            this.buttonContainer.style.visibility = 'hidden';
            this.isVisible = false;
        }
    },
    setPosition(x, y) {
        const containerRect = this.buttonContainer.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        if (x + containerRect.width > windowWidth) {
            x = windowWidth - containerRect.width;
        }
        if (x < 0) {
            x = 0;
        }
        if (y + containerRect.height > windowHeight) {
            y = windowHeight - containerRect.height;
        }
        if (y < 0) {
            y = 0;
        }
        this.buttonContainer.style.left = `${x}px`;
        this.buttonContainer.style.top = `${y}px`;
    },
    onDragStart(e) {
        if (e.button !== 0) return;
        e.stopPropagation();
        this.isDragging = true;
        this.dragStartX = e.clientX - this.buttonContainer.offsetLeft;
        this.dragStartY = e.clientY - this.buttonContainer.offsetTop;
    },
    onDragging(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        e.stopPropagation();
        const newX = e.clientX - this.dragStartX;
        const newY = e.clientY - this.dragStartY;
        this.buttonContainer.style.left = `${newX}px`;
        this.buttonContainer.style.top = `${newY}px`;
    },
    onDragEnd(e) {
        if (!this.isDragging) return;
        if (e.button !== 0) return;
        e.stopPropagation();
        this.isDragging = false;
        const buttonPosition = {
            left: this.buttonContainer.style.left,
            top: this.buttonContainer.style.top,
            userPositioned: true
        };
        localStorage.setItem('NodeAlignerButtonPosition', JSON.stringify(buttonPosition));
    },
    restorePosition() {
        const savedButtonPosition = JSON.parse(localStorage.getItem('NodeAlignerButtonPosition'));
        if (savedButtonPosition && savedButtonPosition.userPositioned) {
            this.buttonContainer.style.left = savedButtonPosition.left;
            this.buttonContainer.style.top = savedButtonPosition.top;
        } else {
            const windowWidth = window.innerWidth;
            const containerWidth = this.buttonContainer.offsetWidth || 400;
            const containerHeight = this.buttonContainer.offsetHeight || 44;
            const left = Math.max(0, (windowWidth - containerWidth) / 2);
            const top = window.innerHeight - containerHeight - 20; 
            this.buttonContainer.style.left = `${left}px`;
            this.buttonContainer.style.top = `${top}px`;
        }
    },
    getSelectedNodes() {
        if (!LGraphCanvas.active_canvas) {
            return [];
        }
        const selectedNodesObj = LGraphCanvas.active_canvas.selected_nodes;
        return selectedNodesObj ? Object.values(selectedNodesObj) : [];
    },
    updateColorPickers(selectedNodes) {
        if (!selectedNodes || selectedNodes.length === 0) return;
        const firstNode = selectedNodes[0];
        if (!firstNode) return;
        this.isUpdatingPickers = true;
        try {
            if (this.colorPicker) {
                const currentColor = firstNode.color || '#ffffff';
                if (this.colorPicker.value !== currentColor) {
                    this.colorPicker.value = currentColor;
                }
            }
            if (this.bgColorPicker) {
                const currentBgColor = firstNode.bgcolor || '#333333';
                if (this.bgColorPicker.value !== currentBgColor) {
                    this.bgColorPicker.value = currentBgColor;
                }
            }
        } finally {
            this.isUpdatingPickers = false;
        }
    },
    createAlignmentAction(nodes, property, getValue, setValue) {
        if (nodes.length === 0) return null;
        const originalStates = {};
        nodes.forEach(node => {
            originalStates[node.id] = {
                pos: [...node.pos], 
                size: [...node.size]  
            };
        });
        const targetValue = getValue(nodes);
        return {
            undo: () => {
                nodes.forEach(node => {
                    const originalState = originalStates[node.id];
                    if (originalState) {
                        node.pos = [...originalState.pos];
                        node.size = [...originalState.size];
                    }
                });
            },
            redo: () => {
                nodes.forEach(node => {
                    const currentPos = [...node.pos];
                    const currentSize = [...node.size];
                    const originalState = originalStates[node.id]; 
                    if (property === 'pos') {
                        const newValue = setValue.func ? setValue.func(node, targetValue) : targetValue;
                        const newPos = [...currentPos]; 
                        newPos[setValue.axis] = newValue;
                        node.pos = newPos; 
                    } else if (property === 'size') {
                        const newSize = [...currentSize]; 
                        newSize[setValue.axis] = targetValue;
                        node.size = newSize; 
                    }
                });
            }
        };
    },
    applyAction(action) {
        if (!action) return false;
        try {
            if (typeof action.redo !== 'function') {
                console.warn('Action missing redo method');
                return false;
            }
            action.redo();
            this.addToUndoStack(action);
            try {
                this.updateCanvas();
            } catch (canvasError) {
                console.warn('Error updating canvas after applying action:', canvasError);
            }
            return true;
        } catch (error) {
            console.warn('Error applying action:', error);
            return false;
        }
    },
    _handleAlignmentAction(actionName) {
        const config = this.ALIGNMENT_CONFIG[actionName];
        if (!config) {
            console.warn("Unknown alignment/equalize action:", actionName);
            return false;
        }

        const selectedNodes = this.getSelectedNodes();
        if (selectedNodes.length === 0) return false;

        const boundValueFunc = typeof config.valueFunc === 'function' ? config.valueFunc.bind(this) : config.valueFunc;

        const action = this.createAlignmentAction(
            selectedNodes,
            config.type,
            boundValueFunc,
            { axis: config.axis, func: config.transformFunc } 
        );
        return this.applyAction(action);
    },
    horizontalDistribution() {
        const selectedNodes = this.getSelectedNodes();
        const calcResult = this._calculateDistributedPositions(selectedNodes, 0);
        if (!calcResult) return false;

        const { targetPositions, originalStates } = calcResult;
        
        const action = {
            undo: () => {
                selectedNodes.forEach(node => {
                    const originalState = originalStates[node.id];
                    if (originalState) {
                        node.pos = [...originalState.pos];
                        node.size = [...originalState.size];
                    }
                });
            },
            redo: () => {
                selectedNodes.forEach(node => {
                    const targetPos = targetPositions[node.id];
                    if (targetPos) {
                        node.pos[0] = Number(targetPos[0]) || 0;
                        node.pos[1] = Number(targetPos[1]) || 0;
                    }
                    const originalState = originalStates[node.id];
                    if (originalState && (node.size[0] !== originalState.size[0] || node.size[1] !== originalState.size[1])) {
                        node.size = [...originalState.size];
                    }
                });
            }
        };

        return this.applyAction(action);
    },
    verticalDistribution() {
        const selectedNodes = this.getSelectedNodes();
        const calcResult = this._calculateDistributedPositions(selectedNodes, 1);
        if (!calcResult) return false;

        const { targetPositions, originalStates } = calcResult;
        
        const action = {
            undo: () => {
                selectedNodes.forEach(node => {
                    const originalState = originalStates[node.id];
                    if (originalState) {
                        node.pos = [...originalState.pos];
                        node.size = [...originalState.size];
                    }
                });
            },
            redo: () => {
                selectedNodes.forEach(node => {
                    const targetPos = targetPositions[node.id];
                    if (targetPos) {
                        node.pos[0] = Number(targetPos[0]) || 0;
                        node.pos[1] = Number(targetPos[1]) || 0;
                    }
                    const originalState = originalStates[node.id];
                    if (originalState && (node.size[0] !== originalState.size[0] || node.size[1] !== originalState.size[1])) {
                        node.size = [...originalState.size];
                    }
                });
            }
        };

        return this.applyAction(action);
    },
    smartAlign() {
        const selectedNodes = this.getSelectedNodes();
        if (selectedNodes.length < 2) return false;
        const originalStates = {};
        selectedNodes.forEach(node => {
            originalStates[node.id] = {
                pos: [...node.pos],
                size: [...node.size]
            };
        });
        const analysisResult = this.analyzeConnectionsBFS(selectedNodes);
        const levels = analysisResult.levels;
        if (!levels || levels.length === 0) {
            console.warn("Smart Align: Could not determine node levels.");
            return false; 
        }
        const targetPositions = {};
        const horizontalSpacing = 100; 
        const verticalSpacing = 30;   
        let currentX = originalStates[levels[0][0].id].pos[0]; 
        let maxColumnHeight = 0;
        const columnWidths = [];
        levels.forEach((level, levelIndex) => {
            let currentColumnWidth = 0;
            let currentColumnHeight = 0;
            level.forEach((node, nodeIndex) => {
                const originalSize = originalStates[node.id].size;
                currentColumnWidth = Math.max(currentColumnWidth, originalSize[0]);
                currentColumnHeight += originalSize[1] + (nodeIndex > 0 ? verticalSpacing : 0);
            });
            columnWidths[levelIndex] = currentColumnWidth;
            maxColumnHeight = Math.max(maxColumnHeight, currentColumnHeight);
        });
        levels.forEach((level, levelIndex) => {
            level.sort((a, b) => originalStates[a.id].pos[1] - originalStates[b.id].pos[1]);
            const levelHeight = level.reduce((sum, node, idx) => sum + originalStates[node.id].size[1] + (idx > 0 ? verticalSpacing : 0), 0);
            let currentY = originalStates[levels[0][0].id].pos[1] + (maxColumnHeight - levelHeight) / 2;
            level.forEach(node => {
                const originalSize = originalStates[node.id].size;
                const nodeX = currentX + (columnWidths[levelIndex] - originalSize[0]) / 2; 
                targetPositions[node.id] = [nodeX, currentY];
                currentY += originalSize[1] + verticalSpacing;
            });
            currentX += columnWidths[levelIndex] + horizontalSpacing; 
        });
        const action = {
            undo: () => {
                selectedNodes.forEach(node => {
                    const originalState = originalStates[node.id];
                    if (originalState) {
                        node.pos = [...originalState.pos];
                        node.size = [...originalState.size];
                    }
                });
            },
            redo: () => {
                selectedNodes.forEach(node => {
                    const targetPos = targetPositions[node.id];
                    if (targetPos) {
                        node.pos = [Number(targetPos[0]) || 0, Number(targetPos[1]) || 0];
                    }
                     const originalState = originalStates[node.id];
                     if (originalState && (node.size[0] !== originalState.size[0] || node.size[1] !== originalState.size[1])) {
                         node.size = [...originalState.size];
                     }
                });
            }
        };
        return this.applyAction(action);
    },
    analyzeConnectionsBFS(nodes) {
        const graph = {}; 
        const inDegree = {}; 
        const nodeMap = {}; 
        nodes.forEach(node => {
            const nodeId = node.id;
            graph[nodeId] = { node, outputs: [] };
            inDegree[nodeId] = 0;
            nodeMap[nodeId] = node;
        });
        nodes.forEach(node => {
            if (node.inputs) {
                node.inputs.forEach(input => {
                    if (input.link !== null) {
                        const sourceNode = nodes.find(n => n.outputs && n.outputs.some(o => o.links && o.links.includes(input.link)));
                        if (sourceNode) {
                            const sourceId = sourceNode.id;
                            const destId = node.id;
                            if (!graph[sourceId].outputs.includes(destId)) {
                                graph[sourceId].outputs.push(destId);
                                inDegree[destId]++;
                            }
                        }
                    }
                });
            }
        });
        const queue = [];
        for (const nodeId in inDegree) {
            if (inDegree[nodeId] === 0) {
                queue.push(nodeId); 
            }
        }
        const result = []; 
        const levels = []; 
        let levelIndex = 0;
        while (queue.length > 0) {
            const levelSize = queue.length;
            const currentLevelNodes = [];
            for (let i = 0; i < levelSize; i++) {
                 const u = queue.shift();
                 const nodeObj = nodeMap[u];
                 result.push(nodeObj);
                 currentLevelNodes.push(nodeObj);
                 if(graph[u]){ 
                    graph[u].outputs.forEach(v => {
                         if (inDegree.hasOwnProperty(v)) {
                             inDegree[v]--;
                             if (inDegree[v] === 0) {
                                 queue.push(v); 
                             }
                         }
                     });
                 }
            }
            if (currentLevelNodes.length > 0) {
                 levels[levelIndex] = currentLevelNodes;
                 levelIndex++;
            }
        }
        if (result.length !== nodes.length) {
            console.warn("Cycle detected or disconnected nodes within selection. Layout might be incomplete.");
            return { sortedNodes: nodes, levels: null }; 
        }
        return { sortedNodes: result, levels: levels };
    },
    getNodesBoundsInScreenCoords(nodes) {
        if (!nodes || nodes.length === 0 || !LGraphCanvas.active_canvas) {
            console.warn("getNodesBoundsInScreenCoords: No nodes or active canvas found.");
            return { left: 10, top: 10, right: 110, bottom: 110, width: 100, height: 100 };
        }
        const canvas = LGraphCanvas.active_canvas;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodes.forEach(node => {
            const nodeGraphX = node.pos[0];
            const nodeGraphY = node.pos[1];
            const nodeWidth = node.size[0];
            const nodeHeight = node.size[1];
            try {
                const topLeft = canvas.convertOffsetToCanvas([nodeGraphX, nodeGraphY]);
                const bottomRight = canvas.convertOffsetToCanvas([nodeGraphX + nodeWidth, nodeGraphY + nodeHeight]);
                minX = Math.min(minX, topLeft[0]);
                minY = Math.min(minY, topLeft[1]);
                maxX = Math.max(maxX, bottomRight[0]);
                maxY = Math.max(maxY, bottomRight[1]);
            } catch (e) {
                console.error("Error converting node coordinates:", e, node);
            }
        });
        if (minX === Infinity) {
            console.warn("getNodesBoundsInScreenCoords: Could not calculate valid screen coordinates.");
            return { left: 10, top: 10, right: 110, bottom: 110, width: 100, height: 100 };
        }
        return {
            left: minX,
            top: minY,
            right: maxX,
            bottom: maxY,
            width: maxX - minX,
            height: maxY - minY
        };
    },
    updateCanvas() {
        if (!LGraphCanvas.active_canvas) return;
        try {
            const canvas = LGraphCanvas.active_canvas;
            canvas.setDirty(true, true);
        } catch (e) {
            console.warn("Error marking canvas dirty: ", e);
        }
    },
    treeView() {
        const selectedNodes = this.getSelectedNodes();
        if (selectedNodes.length < 2) return false; 
        const originalStates = {};
        selectedNodes.forEach(node => {
            originalStates[node.id] = {
                pos: [...node.pos],
                size: [...node.size]
            };
        });
        const rootNode = this.findRootNode(selectedNodes);
        if (!rootNode) {
            console.warn("Tree View: Could not find a root node.");
            return false; 
        }
        const targetPositions = {};
        const levels = this.buildSimpleHierarchy(rootNode, selectedNodes);
        const nodeWidth = Math.max(...selectedNodes.map(node => originalStates[node.id].size[0]));
        const nodeHeight = Math.max(...selectedNodes.map(node => originalStates[node.id].size[1]));
        const horizontalSpacing = nodeWidth * 1.5;
        const verticalSpacing = nodeHeight * 1.5; 
        const rootOriginalPos = originalStates[rootNode.id].pos;
        levels.forEach((level, levelIndex) => {
            const levelWidth = (level.length - 1) * horizontalSpacing;
            const startX = rootOriginalPos[0]; 
            level.forEach((node, nodeIndex) => {
                const targetX = startX + (nodeIndex - (level.length - 1) / 2) * horizontalSpacing;
                const targetY = rootOriginalPos[1] + levelIndex * verticalSpacing;
                targetPositions[node.id] = [targetX, targetY];
            });
        });
        const action = {
            undo: () => selectedNodes.forEach(node => {
                 const originalState = originalStates[node.id];
                 if (originalState) {
                     node.pos = [...originalState.pos];
                     node.size = [...originalState.size];
                 }
            }),
            redo: () => {
                selectedNodes.forEach(node => {
                    const targetPos = targetPositions[node.id];
                    if (targetPos) {
                        node.pos = [Number(targetPos[0]) || 0, Number(targetPos[1]) || 0];
                    }
                });
            }
        };
        return this.applyAction(action);
    },
    findRootNode(nodes) {
        return nodes.find(node => !node.inputs || node.inputs.every(input => input.link === null));
    },
    buildSimpleHierarchy(rootNode, allNodes) {
        const levels = [[rootNode]];
        const visited = new Set([rootNode.id]);
        let currentLevel = [rootNode];
        while (currentLevel.length > 0) {
            const nextLevel = [];
            for (const node of currentLevel) {
                const children = allNodes.filter(n => 
                    !visited.has(n.id) && n.inputs && n.inputs.some(input => 
                        input.link !== null && node.outputs && node.outputs.some(output => 
                            output.links && output.links.includes(input.link)
                        )
                    )
                );
                children.forEach(child => visited.add(child.id));
                nextLevel.push(...children);
            }
            if (nextLevel.length > 0) {
                levels.push(nextLevel);
            }
            currentLevel = nextLevel;
        }
        return levels;
    },
    createSingleColorPicker(id, title, changeHandler) {
        const picker = document.createElement('input');
        picker.type = 'color';
        picker.id = id;
        picker.classList.add('nd-color-picker');
        picker.title = title;
        picker.addEventListener('input', changeHandler);
        picker.addEventListener('change', changeHandler);
        return picker;
    },
    applyNodeColorChange(property, color) {
        if (this.isUpdatingPickers) return;
        const selectedNodes = this.getSelectedNodes();
        if (selectedNodes.length > 0) {
            selectedNodes.forEach(node => {
                node[property] = color;
            });
            if (LGraphCanvas.active_canvas) {
                LGraphCanvas.active_canvas.setDirty(true, true);
            }
        }
    },
    onNodeColorChange(event) {
        const color = event.target.value;
        
        const validColor = color.length === 4 ? 
            `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}` : 
            color;
        this.applyNodeColorChange('color', validColor);
    },
    onNodeBgColorChange(event) {
        const color = event.target.value;
        
        const validColor = color.length === 4 ? 
            `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}` : 
            color;
        this.applyNodeColorChange('bgcolor', validColor);
    },
    pollForCanvas() {
        const canvas = document.querySelector('canvas#graph-canvas');
        if (canvas) {
            ButtonManager.init();
            canvas.addEventListener('click', (event) => {
                const selectedNodes = this.getSelectedNodes();
                if (!this.isPermanent) {
                    if (!this.isClosedByUser && selectedNodes.length >= 2) {
                        this.show();
                        const nodesBounds = this.getNodesBoundsInScreenCoords(selectedNodes);
                        const containerWidth = this.buttonContainer.offsetWidth || 400;
                        const containerHeight = this.buttonContainer.offsetHeight || 44;
                        
                        let left = nodesBounds.left + (nodesBounds.width / 2) - (containerWidth / 2);
                        let top = nodesBounds.bottom + 50;
                        
                        this.setPosition(left, top);
                        
                    } else {
                        this.hide();
                    }
                } else {
                    if (!this.isClosedByUser && !this.isVisible) {
                        this.show();
                    }
                }
                this.updateColorPickers(selectedNodes);
            });
        } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(this.pollForCanvas.bind(this), 1000);
        }
    },
    setupContextMenu() {
        const onContextMenu = LGraphCanvas.prototype.getCanvasMenuOptions;
        LGraphCanvas.prototype.getCanvasMenuOptions = function() {
            const options = onContextMenu.call(this);
            options.push(null);
            options.push({
                content: ButtonManager.isVisible ? "Hide Node Design Tool" : "Show Node Design Tool",
                callback: () => {
                    if (ButtonManager.isVisible) {
                        ButtonManager.close();
                    } else {
                        ButtonManager.show(); 
                        ButtonManager.isPermanent = true;
                        localStorage.setItem('NodeAlignerIsPermanent', '1');
                        ButtonManager.updateToggleButton();
                    }
                }
            });
            return options;
        };
    },
    close() {
        this.buttonContainer.style.display = 'none';
        this.buttonContainer.style.visibility = 'hidden';
        this.isVisible = false;
        localStorage.setItem('NodeDesignVisible', 'false');
        localStorage.removeItem('NodeAlignerButtonPosition');
        this.isClosedByUser = true;
        this.isPermanent = false;
        this.updateToggleButton();
    },
    
    ALIGNMENT_CONFIG: {
        alignLeft: { type: 'pos', axis: 0, valueFunc: nodes => Math.min(...nodes.map(n => n.pos[0])), transformFunc: (n, v) => v },
        alignRight: { type: 'pos', axis: 0, valueFunc: nodes => Math.max(...nodes.map(n => n.pos[0] + n.size[0])), transformFunc: (n, v) => v - n.size[0] },
        alignTop: { type: 'pos', axis: 1, valueFunc: nodes => Math.min(...nodes.map(n => n.pos[1])), transformFunc: (n, v) => v },
        alignBottom: { type: 'pos', axis: 1, valueFunc: nodes => Math.max(...nodes.map(n => n.pos[1] + n.size[1])), transformFunc: (n, v) => v - n.size[1] },
        alignCenterHorizontally: { type: 'pos', axis: 1, valueFunc: function(nodes) { return this.calculateCenterInGroup(nodes, 1); }, transformFunc: (n, v) => v - n.size[1] / 2 },
        alignCenterVertically: { type: 'pos', axis: 0, valueFunc: function(nodes) { return this.calculateCenterInGroup(nodes, 0); }, transformFunc: (n, v) => v - n.size[0] / 2 },
        equalWidth: { type: 'size', axis: 0, valueFunc: nodes => Math.max(...nodes.map(n => n.size[0])) },
        equalHeight: { type: 'size', axis: 1, valueFunc: nodes => Math.max(...nodes.map(n => n.size[1])) }
    },
    calculateCenterInGroup(group, axis) {
        const minCoord = Math.min(...group.map(node => node.pos[axis]));
        const maxCoord = Math.max(...group.map(node => node.pos[axis] + node.size[axis]));
        return (minCoord + maxCoord) / 2;
    },
    _calculateDistributedPositions(nodes, axis) {
        if (nodes.length < 2) return null;

        const originalStates = {};
        nodes.forEach(node => {
            originalStates[node.id] = {
                pos: [...node.pos],
                size: [...node.size]
            };
        });

        const analysisResult = this.analyzeConnectionsBFS(nodes);
        let flowSortedNodes = analysisResult.sortedNodes;
        const otherAxis = axis === 0 ? 1 : 0;

        if (!flowSortedNodes || flowSortedNodes.length !== nodes.length) {
            console.warn(`Distribution axis ${axis}: Could not determine flow order. Falling back to position-based sorting.`);
            flowSortedNodes = [...nodes].sort((a, b) => a.pos[axis] - b.pos[axis]);
        }

        const minCoord = Math.min(...flowSortedNodes.map(node => originalStates[node.id].pos[axis]));
        const maxCoord = Math.max(...flowSortedNodes.map(node => originalStates[node.id].pos[axis] + originalStates[node.id].size[axis]));
        const totalAvailableSpace = maxCoord - minCoord;
        const totalNodesSize = flowSortedNodes.reduce((sum, node) => sum + originalStates[node.id].size[axis], 0);

        const nodeCount = flowSortedNodes.length;
        const totalGaps = nodeCount - 1;
        const equalGap = totalGaps > 0 
            ? Math.max(0, (totalAvailableSpace - totalNodesSize) / totalGaps)
            : 0;

        const targetPositions = {};
        let currentCoord = minCoord;
        
        flowSortedNodes.forEach(node => {
            const originalPos = originalStates[node.id].pos;
            const targetPos = [...originalPos]; 
            targetPos[axis] = currentCoord;
            targetPositions[node.id] = targetPos;
            currentCoord += originalStates[node.id].size[axis] + equalGap;
        });

        return { targetPositions, originalStates, flowSortedNodes };
    },
};let attempts = 0;
const maxAttempts = 10;
ButtonManager.pollForCanvas();
