export class StateHandler {
    constructor(graph) {
        this.historyStack = [];
        this.redoStack = [];
        this.graph = graph;
    }
    // undo utility
    undo() {
        if (this.historyStack.length > 0) {
            // setNothingSelected();
            const current = this.graph.clone();
            this.redoStack.push(current);
            const prev = this.historyStack.pop();
            this.graph = prev;
            // renderGraph();
            // myCanvasHandler?.redraw();
        }
        return this.graph;
    }
    // redo utility
    redo() {
        if (this.redoStack.length > 0) {
            const current = this.graph.clone();
            this.historyStack.push(current);
            const next = this.redoStack.pop();
            // graph.vertices = next.vertices;
            // graph.edges = next.edges;
            this.graph = next;
            // renderGraph();
            // myCanvasHandler?.redraw();
        }
        return this.graph;
    }
    saveState() {
        // console.log("stateHandler.saveState()");
        this.historyStack.push(this.graph.clone());
        this.redoStack.length = 0; // clear redo stack on new change
    }
    pop() { this.historyStack.pop(); }
}
