import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

const NODE_TYPE = "SKB_AnySwitch";
const MAX_INPUTS = 5;
const NODE_DEFAULTS = {
    size: [150, 100],
    style: {
        margin: 5,
        height: 18,
        startY: 5,
        spacing: 2,
        cornerRadius: 2,
        colors: {
            active: "rgba(76, 175, 80, 0.2)",
            inactive: "rgba(41, 128, 185, 0.1)",
            connected: "#4CAF50",
            disconnected: "#B0BEC5",
            text: "#FFFFFF"
        }
    }
};

app.registerExtension({
    name: "SKB.AnySwitch",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name !== NODE_TYPE) return;

        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function() {
            onNodeCreated?.apply(this, arguments);
            this.serialize_widgets = true;
            this.inputs = [];
            this.addInput("input_1", "*");
            this.setSize(NODE_DEFAULTS.size);
        };

        nodeType.prototype.hideLabels = function() {
            this.inputs?.forEach(input => input.label = "");
            this.outputs?.forEach(output => output.label = "");
            if (this.widgets?.[0]) this.widgets[0].label = "";
        };

        nodeType.prototype.onDrawForeground = function(ctx) {
            if (this.flags.collapsed) return;

            const { margin, height, startY, spacing, cornerRadius, colors } = NODE_DEFAULTS.style;
            const width = this.size[0] - margin * 2;

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "bold 8px Roboto";

            this.inputs.forEach((inputInfo, i) => {
                const y = startY + i * (height + spacing);
                const isActive = i === this.widgets[0].value - 1;
                const link = this.graph.links[inputInfo.link];
                const connectedNode = link ? this.graph.getNodeById(link.origin_id) : null;
                const displayText = connectedNode ? connectedNode.title : inputInfo.type || `Input ${i + 1}`;

                // Draw background  
                ctx.fillStyle = isActive ? colors.active : colors.inactive;
                ctx.beginPath();
                ctx.roundRect(margin, y, width, height, cornerRadius);
                ctx.fill();

                // Draw text
                ctx.fillStyle = colors.text;
                ctx.fillText(displayText, margin + width / 2, y + height / 2);

                // Draw connection indicator
                ctx.fillStyle = link ? colors.connected : colors.disconnected;
                ctx.beginPath();
                ctx.arc(margin + height / 2, y + height / 2, 3, 0, Math.PI * 2);
                ctx.fill();
            });
        };

        nodeType.prototype.onExecute = function() {
            const select = this.widgets[0].value;
            const input = this.getInputData(select - 1);

            if (!input) return;

            const outputMap = {
                0: input instanceof Image || (input?.hasOwnProperty('shape')),
                1: typeof input === "string",
                2: Number.isInteger(input)
            };

            Object.entries(outputMap).forEach(([index, condition]) => {
                this.setOutputData(parseInt(index), condition ? input : null);
            });
        };

        nodeType.prototype.onConnectionsChange = function(type, index, connected, link_info) {
            if (type !== LiteGraph.INPUT) return;
            
            if (connected && this.inputs.length < MAX_INPUTS) {
                this.addInput(`input_${this.inputs.length + 1}`, "*");
            } else if (!connected) {
                this.removeInput(index);
                this.inputs.forEach((input, i) => input.name = `input_${i + 1}`);
            }

            this.hideLabels();
            this.setDirtyCanvas(true, true);
        };
    },

    async setup() {
        const eventTypes = ['image', 'text', 'int', 'other'];
        
        const messageHandler = (event) => {
            const node = app.graph._nodes.find(n => n.type === NODE_TYPE);
            const statusWidget = node?.widgets.find(w => w.name === "Status");
            if (statusWidget) statusWidget.value = event.detail.message;
        };

        eventTypes.forEach(type => {
            api.addEventListener(`${NODE_TYPE}.${type}_selected`, messageHandler);
        });
    }
});