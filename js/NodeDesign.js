import { SVG, STYLES } from './NodeDesignConstants.js';

const ButtonManager = {
    isInitialized: false,
    buttonContainer: null,
    contextMenu: null,
    isPermanent: true,
    initialX: 0,
    initialY: 0,
    dragStartX: 0,
    dragStartY: 0,
    isDragging: false,
    hasShownTooltip: false,
    boundOnDragging: null,
    boundOnDragEnd: null,
    undoStack: [],
    redoStack: [],
    maxUndoStackSize: 50,
    colorPicker: null,
    bgColorPicker: null,
    isUpdatingPickers: false,

    init() {
        if (this.isInitialized) {
            return;
        }

        const style = document.createElement('style');
        style.textContent = STYLES;
        document.head.appendChild(style);

        this.buttonContainer = document.createElement('div');
        this.buttonContainer.id = 'alignment-buttons';
        this.buttonContainer.style.position = 'fixed';
        this.buttonContainer.style.zIndex = '9999';

        this.restorePosition();

        document.body.appendChild(this.buttonContainer);

        this.boundOnDragging = this.onDragging.bind(this);
        this.boundOnDragEnd = this.onDragEnd.bind(this);

        this.buttonContainer.addEventListener('mousedown', this.onDragStart.bind(this));
        document.addEventListener('mousemove', this.boundOnDragging);
        document.addEventListener('mouseup', this.boundOnDragEnd);

        this.createButtons();

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

    undo() {
        if (this.undoStack.length > 0) {
            const action = this.undoStack.pop();
            try {
                action.undo();
                this.redoStack.push(action);
                this.updateCanvas();
            } catch (error) {
                this.undoStack.push(action);
            } finally {
                this.updateUndoRedoButtons();
            }
        }
    },

    redo() {
        if (this.redoStack.length > 0) {
            const action = this.redoStack.pop();
            try {
                action.redo();
                this.undoStack.push(action);
                this.updateCanvas();
            } catch (error) {
                this.redoStack.push(action);
            } finally {
                this.updateUndoRedoButtons();
            }
        }
    },

    updateUndoRedoButtons() {
        const undoButton = document.getElementById('undo');
        const redoButton = document.getElementById('redo');
        if (undoButton) undoButton.disabled = this.undoStack.length === 0;
        if (redoButton) redoButton.disabled = this.redoStack.length === 0;
    },

    createButtons() {
        const colorPickerContainer = document.createElement('div');
        colorPickerContainer.classList.add('color-picker-container');
        
        this.createColorPickers(colorPickerContainer);
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
        divider.classList.add('divider');
        divider.addEventListener('mousedown', this.onDragStart.bind(this));
        this.buttonContainer.appendChild(divider);
    },

    createButton(btn) {
        const button = document.createElement('button');
        button.id = btn.id;
        button.classList.add('custom-button');
        button.innerHTML = SVG[btn.id] || '';
        button.title = this.getButtonTitle(btn.id);
        button.addEventListener('click', (e) => {
            btn.action.call(this, e);
            this.updateCanvas();
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
            { id: 'alignLeft', action: this.alignLeft },
            { id: 'alignCenterHorizontally', action: this.alignCenterHorizontally },
            { id: 'alignRight', action: this.alignRight },
            { id: 'alignTop', action: this.alignTop },
            { id: 'alignCenterVertically', action: this.alignCenterVertically },
            { id: 'alignBottom', action: this.alignBottom },
            { id: 'horizontalDistribution', action: this.horizontalDistribution },
            { id: 'verticalDistribution', action: this.verticalDistribution },
            { id: 'equalWidth', action: this.equalWidth },
            { id: 'equalHeight', action: this.equalHeight },
            { id: 'undo', action: this.undo },
            { id: 'redo', action: this.redo },
            { id: 'smartAlign', action: this.smartAlign },
            { id: 'treeView', action: this.treeView },
            { id: 'toggleMode', action: this.toggleMode }
        ];
    },

    toggleMode() {
        this.isPermanent = !this.isPermanent;
        localStorage.setItem('NodeAlignerIsPermanent', this.isPermanent ? '1' : '0');
        this.updateToggleButton();
        if (!this.isPermanent) {
            this.hide();
        }
    },

    updateToggleButton() {
        const toggleButton = document.getElementById('toggleMode');
        if (toggleButton) {
            toggleButton.classList.toggle('active', this.isPermanent);
            toggleButton.title = this.isPermanent ? 'Show on selection' : 'Show permanently';
        }
    },

    createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.id = 'tooltip';
        this.buttonContainer.appendChild(tooltip);

        if (!this.hasShownTooltip) {
            this.buttonContainer.addEventListener('mouseenter', () => {
                if (!this.hasShownTooltip) {
                    setTimeout(() => {
                        tooltip.style.display = 'block';
                        this.hasShownTooltip = true;
                    }, 1000);
                }
            });

            this.buttonContainer.addEventListener('mouseleave', () => {
                tooltip.remove();
            });
        }
    },

    setInitialVisibility() {
        let isPermanent = localStorage.getItem('NodeAlignerIsPermanent');
        if (isPermanent !== null) {
            this.isPermanent = isPermanent === '1';
        }
        this.isPermanent ? this.show() : this.hide();
        this.updateToggleButton();
    },

    show() {
        this.buttonContainer.style.display = 'flex';
    },

    hide() {
        this.buttonContainer.style.display = 'none';
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
            top: this.buttonContainer.style.top
        };
        localStorage.setItem('NodeAlignerButtonPosition', JSON.stringify(buttonPosition));
    },

    restorePosition() {
        const savedButtonPosition = JSON.parse(localStorage.getItem('NodeAlignerButtonPosition'));
        if (savedButtonPosition) {
            this.buttonContainer.style.left = savedButtonPosition.left;
            this.buttonContainer.style.top = savedButtonPosition.top;
        } else {
            this.buttonContainer.style.left = '20px';
            this.buttonContainer.style.top = '20px';
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

    groupNodesByCoordinate(nodes, axis, tolerance = 100) {
        const groups = [];

        nodes.forEach(node => {
            let foundGroup = groups.find(group => Math.abs(group[0].pos[axis] - node.pos[axis]) <= tolerance);
            if (foundGroup) {
                foundGroup.push(node);
            } else {
                groups.push([node]);
            }
        });

        return groups;
    },

    alignLeft() {
        const selectedNodes = this.getSelectedNodes();
        if (selectedNodes.length > 0) {
            const leftMost = Math.min(...selectedNodes.map(node => node.pos[0]));
            const action = {
                undo: () => {
                    selectedNodes.forEach(node => {
                        node.pos[0] = node.originalX;
                    });
                },
                redo: () => {
                    selectedNodes.forEach(node => {
                        node.originalX = node.pos[0];
                        node.pos[0] = leftMost;
                    });
                }
            };
            action.redo();
            this.addToUndoStack(action);
            this.updateCanvas();
        }
    },

    alignRight() {
        const selectedNodes = this.getSelectedNodes();
        if (selectedNodes.length > 0) {
            const rightMost = Math.max(...selectedNodes.map(node => node.pos[0] + node.size[0]));
            const action = {
                undo: () => {
                    selectedNodes.forEach(node => {
                        node.pos[0] = node.originalX;
                    });
                },
                redo: () => {
                    selectedNodes.forEach(node => {
                        node.originalX = node.pos[0];
                        node.pos[0] = rightMost - node.size[0];
                    });
                }
            };
            action.redo();
            this.addToUndoStack(action);
            this.updateCanvas();
        }
    },

    alignTop() {
        const selectedNodes = this.getSelectedNodes();
        if (selectedNodes.length > 0) {
            const topMost = Math.min(...selectedNodes.map(node => node.pos[1]));
            const action = {
                undo: () => {
                    selectedNodes.forEach(node => {
                        node.pos[1] = node.originalY;
                    });
                },
                redo: () => {
                    selectedNodes.forEach(node => {
                        node.originalY = node.pos[1];
                        node.pos[1] = topMost;
                    });
                }
            };
            action.redo();
            this.addToUndoStack(action);
            this.updateCanvas();
        }
    },

    alignBottom() {
        const selectedNodes = this.getSelectedNodes();
        if (selectedNodes.length > 0) {
            const bottomMost = Math.max(...selectedNodes.map(node => node.pos[1] + node.size[1]));
            const action = {
                undo: () => {
                    selectedNodes.forEach(node => {
                        node.pos[1] = node.originalY;
                    });
                },
                redo: () => {
                    selectedNodes.forEach(node => {
                        node.originalY = node.pos[1];
                        node.pos[1] = bottomMost - node.size[1];
                    });
                }
            };
            action.redo();
            this.addToUndoStack(action);
            this.updateCanvas();
        }
    },

    alignCenterHorizontally() {
        const selectedNodes = this.getSelectedNodes();
        if (selectedNodes.length > 0) {
            const centerY = this.calculateCenterInGroup(selectedNodes, 1);
            const action = {
                undo: () => {
                    selectedNodes.forEach(node => {
                        node.pos[1] = node.originalY;
                    });
                },
                redo: () => {
                    selectedNodes.forEach(node => {
                        node.originalY = node.pos[1];
                        node.pos[1] = centerY - node.size[1] / 2;
                    });
                }
            };
            action.redo();
            this.addToUndoStack(action);
            this.updateCanvas();
        }
    },

    alignCenterVertically() {
        const selectedNodes = this.getSelectedNodes();
        if (selectedNodes.length > 0) {
            const centerX = this.calculateCenterInGroup(selectedNodes, 0);
            const action = {
                undo: () => {
                    selectedNodes.forEach(node => {
                        node.pos[0] = node.originalX;
                    });
                },
                redo: () => {
                    selectedNodes.forEach(node => {
                        node.originalX = node.pos[0];
                        node.pos[0] = centerX - node.size[0] / 2;
                    });
                }
            };
            action.redo();
            this.addToUndoStack(action);
            this.updateCanvas();
        }
    },

    calculateCenterInGroup(group, axis) {
        const minCoord = Math.min(...group.map(node => node.pos[axis]));
        const maxCoord = Math.max(...group.map(node => node.pos[axis] + node.size[axis]));
        return (minCoord + maxCoord) / 2;
    },

    horizontalDistribution() {
        const nodes = this.getSelectedNodes();
        const axis = 0;
        if (nodes.length > 1) {
            nodes.sort((a, b) => a.pos[axis] - b.pos[axis]);
    
            const min = Math.min(...nodes.map(node => node.pos[axis]));
            const max = Math.max(...nodes.map(node => node.pos[axis] + node.size[axis]));
    
            const totalSize = nodes.reduce((sum, node) => sum + node.size[axis], 0);
            const spacing = (max - min - totalSize) / (nodes.length - 1);
    
            const action = {
                undo: () => {
                    nodes.forEach(node => {
                        node.pos[axis] = node.originalPos;
                    });
                },
                redo: () => {
                    let current = min;
                    nodes.forEach(node => {
                        node.originalPos = node.pos[axis];
                        node.pos[axis] = current;
                        current += node.size[axis] + spacing;
                    });
                }
            };
            action.redo();
            this.addToUndoStack(action);
            this.updateCanvas();
        }
    },

    verticalDistribution() {
        const nodes = this.getSelectedNodes();
    
        if (nodes.length > 1) {
            const axis = 1;
            const otherAxis = 0;
            const tolerance = 100;
            const minSpacing = 20;
    
            const columns = [];
    
            nodes.forEach(node => {
                let foundColumn = null;
    
                for (let column of columns) {
                    const columnX = column[0].pos[otherAxis];
    
                    if (Math.abs(columnX - node.pos[otherAxis]) <= tolerance) {
                        foundColumn = column;
                        break;
                    }
                }
    
                if (foundColumn) {
                    foundColumn.push(node);
                } else {
                    columns.push([node]);
                }
            });
    
            const columnHeights = columns.map(column => {
                const minY = Math.min(...column.map(node => node.pos[axis]));
                const maxY = Math.max(...column.map(node => node.pos[axis] + node.size[axis]));
                return maxY - minY;
            });
    
            const maxColumnHeight = Math.max(...columnHeights);
            const minFirstNodeY = Math.min(...columns.map(column => column[0].pos[axis]));
    
            const action = {
                undo: () => {
                    nodes.forEach(node => {
                        node.pos[axis] = node.originalPos;
                        node.pos[otherAxis] = node.originalOtherPos;
                    });
                },
                redo: () => {
                    columns.forEach((column, columnIndex) => {
                        if (column.length > 1) {
                            column.sort((a, b) => a.pos[axis] - b.pos[axis]);
        
                            const totalSize = column.reduce((sum, node) => sum + node.size[axis], 0);
        
                            let spacing = (maxColumnHeight - totalSize) / (column.length - 1);
                            spacing = Math.max(spacing, minSpacing);
        
                            let currentY = minFirstNodeY;
        
                            column.forEach((node, idx) => {
                                node.originalPos = node.pos[axis];
                                node.originalOtherPos = node.pos[otherAxis];
                                node.pos[axis] = currentY;
                                currentY += node.size[axis] + spacing;
                                node.pos[otherAxis] = column[0].pos[otherAxis];
                            });
                        } else if (column.length === 1) {
                            const node = column[0];
                            node.originalPos = node.pos[axis];
                            node.pos[axis] = minFirstNodeY;
                        }
                    });
                }
            };
            action.redo();
            this.addToUndoStack(action);
            this.updateCanvas();
        }
    },

    equalWidth() {
        this.equalSize(0);
    },

    equalHeight() {
        this.equalSize(1);
    },

    equalSize(axis) {
        const nodes = this.getSelectedNodes();
        if (nodes.length > 0) {
            const maxSize = Math.max(...nodes.map(node => node.size[axis]));
            const action = {
                undo: () => {
                    nodes.forEach(node => {
                        node.size[axis] = node.originalSize;
                    });
                },
                redo: () => {
                    nodes.forEach(node => {
                        node.originalSize = node.size[axis];
                        node.size[axis] = maxSize;
                    });
                }
            };
            action.redo();
            this.addToUndoStack(action);
            this.updateCanvas();
        }
    },

    showTooltip() {
        if (this.hasShownTooltip) return;
        const tooltip = document.getElementById('tooltip');
        tooltip.style.display = 'block';
        setTimeout(() => {
            tooltip.style.opacity = '1';
        }, 10);
        this.hasShownTooltip = true;
    },

    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        tooltip.style.opacity = '0';
        setTimeout(() => {
            tooltip.style.display = 'none';
        }, 300);
    },

    smartAlign() {
        const selectedNodes = this.getSelectedNodes();
        if (selectedNodes.length < 2) return;

        const action = {
            undo: () => selectedNodes.forEach(node => {
                [node.pos[0], node.pos[1]] = [node.originalX, node.originalY];
            }),
            redo: () => {
                const bounds = this.getNodesBounds(selectedNodes);
                const [hSpacing, vSpacing] = [50, 50];
                const maxWidth = Math.min(2000, bounds.width * 1.5);

                const leftNodes = selectedNodes.filter(node => !node.inputs || node.inputs.length === 0);
                const rightNodes = selectedNodes.filter(node => !node.outputs || node.outputs.length === 0);
                let middleNodes = selectedNodes.filter(node => 
                    (node.inputs && node.inputs.length > 0) && (node.outputs && node.outputs.length > 0)
                );

                const doubleLinkNodes = this.detectDoubleLinkNodes(middleNodes, leftNodes, rightNodes);
                middleNodes = middleNodes.filter(node => !doubleLinkNodes.includes(node));

                const nodeOrder = this.analyzeConnections([...middleNodes, ...doubleLinkNodes]);
                middleNodes.sort((a, b) => nodeOrder.indexOf(a) - nodeOrder.indexOf(b));

                [leftNodes, middleNodes, rightNodes, doubleLinkNodes].forEach(category => 
                    category.sort((a, b) => a.pos[1] - b.pos[1])
                );

                let currentY = bounds.top;
                leftNodes.forEach(node => {
                    [node.originalX, node.originalY] = node.pos;
                    node.pos[0] = bounds.left;
                    node.pos[1] = currentY;
                    currentY += node.size[1] + vSpacing;
                });

                let [currentX, rowHeight] = [bounds.left + this.getMaxWidth(leftNodes) + hSpacing, 0];
                currentY = bounds.top;
                middleNodes.forEach(node => {
                    [node.originalX, node.originalY] = node.pos;
                    if (currentX + node.size[0] > bounds.left + maxWidth) {
                        currentX = bounds.left + this.getMaxWidth(leftNodes) + hSpacing;
                        currentY += rowHeight + vSpacing;
                        rowHeight = 0;
                    }
                    node.pos[0] = currentX;
                    node.pos[1] = currentY;
                    currentX += node.size[0] + hSpacing;
                    rowHeight = Math.max(rowHeight, node.size[1]);
                });

                const rightmostMiddleX = currentX;
                doubleLinkNodes.forEach(node => {
                    [node.originalX, node.originalY] = node.pos;
                    node.pos[0] = rightmostMiddleX;
                    node.pos[1] = currentY;
                    currentY += node.size[1] + vSpacing;
                });

                currentY = bounds.top;
                const rightmostX = bounds.left + maxWidth;
                rightNodes.forEach(node => {
                    [node.originalX, node.originalY] = node.pos;
                    node.pos[0] = rightmostX - node.size[0];
                    node.pos[1] = currentY;
                    currentY += node.size[1] + vSpacing;
                });
            }
        };

        action.redo();
        this.addToUndoStack(action);
        this.updateCanvas();
    },

    detectDoubleLinkNodes(middleNodes, leftNodes, rightNodes) {
        return middleNodes.filter(node => {
            const hasLeftInput = node.inputs.some(input => 
                input.link !== null && leftNodes.some(leftNode => 
                    leftNode.outputs && leftNode.outputs.some(output => 
                        output.links && output.links.includes(input.link)
                    )
                )
            );
            const hasRightInput = node.inputs.some(input => 
                input.link !== null && rightNodes.some(rightNode => 
                    rightNode.outputs && rightNode.outputs.some(output => 
                        output.links && output.links.includes(input.link)
                    )
                )
            );
            return hasLeftInput && hasRightInput;
        });
    },

    analyzeConnections(nodes) {
        const graph = {};
        nodes.forEach(node => {
            graph[node.id] = { node, inputs: [], outputs: [] };
        });

        nodes.forEach(node => {
            if (node.inputs) {
                node.inputs.forEach(input => {
                    if (input.link !== null) {
                        const sourceNode = nodes.find(n => n.outputs && n.outputs.some(o => o.links && o.links.includes(input.link)));
                        if (sourceNode) {
                            graph[node.id].inputs.push(sourceNode.id);
                            graph[sourceNode.id].outputs.push(node.id);
                        }
                    }
                });
            }
        });

        const visited = new Set();
        const result = [];

        function dfs(nodeId) {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);
            graph[nodeId].inputs.forEach(dfs);
            result.push(graph[nodeId].node);
        }

        Object.keys(graph).forEach(dfs);

        return result;
    },

    getMaxWidth(nodes) {
        return nodes.length > 0 ? Math.max(...nodes.map(node => node.size[0])) : 0;
    },

    getNodesBounds(nodes) {
        const xs = nodes.map(n => n.pos[0]);
        const ys = nodes.map(n => n.pos[1]);
        const rights = nodes.map(n => n.pos[0] + n.size[0]);
        const bottoms = nodes.map(n => n.pos[1] + n.size[1]);
        return {
            left: Math.min(...xs),
            top: Math.min(...ys),
            right: Math.max(...rights),
            bottom: Math.max(...bottoms),
            width: Math.max(...rights) - Math.min(...xs),
            height: Math.max(...bottoms) - Math.min(...ys)
        };
    },

    distributeEvenly() {
        const selectedNodes = this.getSelectedNodes();
        if (selectedNodes.length < 3) return;

        const bounds = this.getNodesBounds(selectedNodes);
        const totalWidth = selectedNodes.reduce((sum, node) => sum + node.size[0], 0);
        const spacing = (bounds.width - totalWidth) / (selectedNodes.length - 1);

        const action = {
            undo: () => {
                selectedNodes.forEach(node => {
                    node.pos[0] = node.originalX;
                });
            },
            redo: () => {
                let currentX = bounds.left;
                selectedNodes.forEach(node => {
                    node.originalX = node.pos[0];
                    node.pos[0] = currentX;
                    currentX += node.size[0] + spacing;
                });
            }
        };

        action.redo();
        this.addToUndoStack(action);
        LGraphCanvas.active_canvas.setDirty(true, true);
    },

    updateCanvas() {
        if (LGraphCanvas.active_canvas) {
            const canvas = LGraphCanvas.active_canvas;
            const currentOffset = canvas.ds ? {...canvas.ds.offset} : null;
            const currentScale = canvas.ds ? canvas.ds.scale : null;
            
            canvas.setDirty(true, true);
            const selectedNodes = this.getSelectedNodes();
            canvas.selectNodes(selectedNodes);
            if (currentOffset && currentScale) {
                canvas.ds.offset = currentOffset;
                canvas.ds.scale = currentScale;
            }
        }
    },

    groupNodesByCoordinate(nodes, axis, tolerance = 50) {
        const groups = [];
        nodes.forEach(node => {
            let foundGroup = groups.find(group => 
                Math.abs(group[0].pos[axis] - node.pos[axis]) <= tolerance
            );
            if (foundGroup) {
                foundGroup.push(node);
            } else {
                groups.push([node]);
            }
        });
        return groups;
    },

    adjustSpacingBetweenGroups(groups, axis) {
        const otherAxis = axis === 0 ? 1 : 0;
        groups.sort((a, b) => a[0].pos[axis] - b[0].pos[axis]);

        for (let i = 1; i < groups.length; i++) {
            const prevGroup = groups[i - 1];
            const currentGroup = groups[i];
            const prevGroupMax = Math.max(...prevGroup.map(n => n.pos[axis] + n.size[axis]));
            const currentGroupMin = Math.min(...currentGroup.map(n => n.pos[axis]));
            const desiredSpacing = 50;

            const adjustment = prevGroupMax + desiredSpacing - currentGroupMin;
            currentGroup.forEach(node => {
                node.pos[axis] += adjustment;
            });
        }
    },

    treeView() {
        const selectedNodes = this.getSelectedNodes();
        if (selectedNodes.length < 2) return;

        const action = {
            undo: () => selectedNodes.forEach(node => {
                [node.pos[0], node.pos[1]] = [node.originalX, node.originalY];
            }),
            redo: () => {
                const rootNode = this.findRootNode(selectedNodes);
                if (!rootNode) return;

                const levels = this.buildSimpleHierarchy(rootNode, selectedNodes);
                const nodeWidth = Math.max(...selectedNodes.map(node => node.size[0]));
                const nodeHeight = Math.max(...selectedNodes.map(node => node.size[1]));
                const horizontalSpacing = nodeWidth * 1.5;
                const verticalSpacing = nodeHeight * 2;

                levels.forEach((level, levelIndex) => {
                    const levelWidth = (level.length - 1) * horizontalSpacing;
                    const startX = rootNode.pos[0] - levelWidth / 2;

                    level.forEach((node, nodeIndex) => {
                        [node.originalX, node.originalY] = node.pos;
                        node.pos[0] = startX + nodeIndex * horizontalSpacing;
                        node.pos[1] = rootNode.pos[1] + levelIndex * verticalSpacing;
                    });
                });
            }
        };

        action.redo();
        this.addToUndoStack(action);
        this.updateCanvas();
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

    createColorPickers() {
        const colorPickerContainer = document.createElement('div');
        colorPickerContainer.classList.add('color-picker-container');
        this.colorPicker = this.createSingleColorPicker('node-color-picker', 'Select Node Color', this.onNodeColorChange.bind(this));

        this.bgColorPicker = this.createSingleColorPicker('node-bg-color-picker', 'Select Node Background Color', this.onNodeBgColorChange.bind(this));

        colorPickerContainer.appendChild(this.colorPicker);
        colorPickerContainer.appendChild(this.bgColorPicker);
        this.buttonContainer.appendChild(colorPickerContainer);
    },

    createSingleColorPicker(id, title, changeHandler) {
        const picker = document.createElement('input');
        picker.type = 'color';
        picker.id = id;
        picker.classList.add('color-picker');
        picker.title = title;
        
        picker.addEventListener('input', changeHandler);
        picker.addEventListener('change', changeHandler);
        
        return picker;
    },

    onNodeColorChange(event) {
        if (this.isUpdatingPickers) return;
        
        const color = event.target.value;
        const selectedNodes = this.getSelectedNodes();
        if (selectedNodes.length > 0) {
            selectedNodes.forEach(node => {
                node.color = color;
            });
            if (LGraphCanvas.active_canvas) {
                LGraphCanvas.active_canvas.setDirty(true, true);
            }
        }
    },

    onNodeBgColorChange(event) {
        if (this.isUpdatingPickers) return;
        
        const color = event.target.value;
        const selectedNodes = this.getSelectedNodes();
        if (selectedNodes.length > 0) {
            selectedNodes.forEach(node => {
                node.bgcolor = color;
            });
            if (LGraphCanvas.active_canvas) {
                LGraphCanvas.active_canvas.setDirty(true, true);
            }
        }
    },

    pollForCanvas() {
        const canvas = document.querySelector('canvas#graph-canvas');
        if (canvas) {
            ButtonManager.init();
            
            canvas.addEventListener('click', (event) => {
                if (!ButtonManager.isPermanent) {
                    const selectedNodes = ButtonManager.getSelectedNodes();
                    
                    if (selectedNodes.length >= 2) {
                        const rect = canvas.getBoundingClientRect();
                        const x = event.clientX - rect.left;
                        const y = event.clientY - rect.top;
                        
                        ButtonManager.show();
                        ButtonManager.setPosition(x, Math.max(y - 40, 0));
                    } else {
                        ButtonManager.hide();
                    }
                }
            });
        } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(pollForCanvas, 1000);
        }
    },
};

let attempts = 0;
const maxAttempts = 10;

function pollForCanvas() {
    const canvas = document.querySelector('canvas#graph-canvas');
    if (canvas) {
        ButtonManager.init();
        canvas.addEventListener('click', function (event) {
            if (!ButtonManager.isPermanent) {
                const selectedNodes = ButtonManager.getSelectedNodes();
                if (selectedNodes.length >= 2) {
                    ButtonManager.show();
                    ButtonManager.setPosition(event.layerX, event.layerY - 40);
                } else {
                    ButtonManager.hide();
                }
            }
        });
    } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(pollForCanvas, 1000);
    }
}

pollForCanvas();