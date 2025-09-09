import { Graph } from "./graph.js";

export class StateHandler
{
    // history stack and redo stack for undo/redo
    private historyStack: Graph[];
    private redoStack: Graph[];
    private _graph: Graph;

    private get graph() { return this._graph; }

    constructor(graph: Graph) {
        this.historyStack = [];
        this.redoStack = [];
        this._graph = graph;
    }
    
    // undo utility
    public undo()
    {
        // console.log("undo");
        if (this.historyStack.length > 0) {
            // console.log("undo INSIDE");
            const current = this.graph.clone();
            this.redoStack.push(current);
            // console.log("PUSH in redoStack:",current);
            // current.vertices.forEach(v => console.log(v.id));
            const prev = this.historyStack.pop()!;
            // this._graph = prev;
            this.graph.replace(prev);
        }
        return this.graph;
    }
    
    // redo utility
    public redo()
    {
        // console.log("redo");
        if (this.redoStack.length > 0) {
            // console.log(this.redoStack);
            const current = this.graph.clone();
            this.historyStack.push(current);
            const next = this.redoStack.pop()!;
            // console.log("POP from redoStack:",next);
            // next.vertices.forEach(v => console.log(v.id));
            // this._graph = next;
            this.graph.replace(next);
        }
        return this.graph;
    }

    public saveState() {
        // console.log("stateHandler.saveState()");
        this.historyStack.push(this.graph.clone());
        this.redoStack.length = 0; // clear redo stack on new change
    }

    public pop() { 
        // if (this.historyStack.length > 0)
           // this._graph = this.historyStack[this.historyStack.length-1];
        this.historyStack.pop(); 
    }
}