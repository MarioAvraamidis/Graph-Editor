export class StateHandler {
    get graph() { return this._graph; }
    constructor(graph) {
        this.historyStack = [];
        this.redoStack = [];
        this._graph = graph;
    }
    // undo utility
    undo() {
        // console.log("undo");
        if (this.historyStack.length > 0) {
            // console.log("undo INSIDE");
            const current = this.graph.clone();
            this.redoStack.push(current);
            console.log("PUSH in redoStack:", current);
            current.vertices.forEach(v => console.log(v.id));
            const prev = this.historyStack.pop();
            this._graph = prev;
        }
        return this.graph;
    }
    // redo utility
    redo() {
        // console.log("redo");
        if (this.redoStack.length > 0) {
            // console.log(this.redoStack);
            const current = this.graph.clone();
            this.historyStack.push(current);
            const next = this.redoStack.pop();
            console.log("POP from redoStack:", next);
            next.vertices.forEach(v => console.log(v.id));
            this._graph = next;
        }
        return this.graph;
    }
    saveState() {
        // console.log("stateHandler.saveState()");
        this.historyStack.push(this.graph.clone());
        this.redoStack.length = 0; // clear redo stack on new change
    }
    pop() {
        // if (this.historyStack.length > 0)
        // this._graph = this.historyStack[this.historyStack.length-1];
        this.historyStack.pop();
    }
}
