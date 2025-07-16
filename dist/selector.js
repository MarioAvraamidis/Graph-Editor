import { Vertex } from "./graph.js";
export class Selector {
    constructor() {
        // selected objects
        this.points = [];
        this.vertices = [];
        this.edges = [];
        this.bends = [];
        // selection rectangle
        this.rect = { x: 0, y: 0, width: 0, height: 0 };
        this.rectStart = { x: 0, y: 0 };
        this.isSelecting = false;
    }
    // selected Points = selected Vertices & selected Bends
    pointsUpdate() {
        this.points.length = 0;
        for (const v of this.vertices)
            this.points.push(v);
        for (const b of this.bends)
            this.points.push(b);
        // console.log("called", selectedPoints.length);
    }
    // set no object of the graph selected
    setNothingSelected() {
        this.vertices.length = 0;
        this.bends.length = 0;
        this.edges.length = 0;
        this.pointsUpdate();
    }
    // select all the objects
    selectAll(graph) {
        this.setNothingSelected();
        // select all vertices
        for (const v of graph.vertices)
            this.vertices.push(v);
        // select all bends
        const bends = graph.getBends();
        for (const b of bends)
            this.bends.push(b);
        // selecte all edges
        for (const e of graph.edges)
            this.edges.push(e);
    }
    // deletion of selected vertices (and removal of their corresponding edges and bends from selected objects)
    deleteSelectedVertices(graph) {
        this.vertices.forEach(v => graph.deleteVertex(v));
        // remove the corresponding edges from selectedEdges
        this.edges = this.edges.filter(e => e.points[0] instanceof Vertex && !this.vertices.includes(e.points[0]) && e.points[1] instanceof Vertex && !this.vertices.includes(e.points[1]));
        // remove the corresponding bends from selectedBends
        this.bends = this.bends.filter(b => b.edge.points[0] instanceof Vertex && !this.vertices.includes(b.edge.points[0]) && b.edge.points[1] instanceof Vertex && !this.vertices.includes(b.edge.points[1]));
        // update selectedVertices
        this.vertices.length = 0;
    }
    // deletion of selected bends
    deleteSelectedBends(graph) {
        this.bends.forEach(b => graph.removeBend(b));
        this.bends.length = 0;
    }
    // deletion of selected edges
    deleteSelectedEdges(graph) {
        this.edges.forEach(e => graph.deleteEdgee(e));
        this.edges.length = 0;
    }
    deleteSelectedObjects(graph) {
        this.deleteSelectedVertices(graph);
        this.deleteSelectedBends(graph);
        this.deleteSelectedEdges(graph);
        this.pointsUpdate();
        // checkHovered();
    }
    // Add the selected object (vertex, bend, edge) to the appropriate array of selected objects
    select(obj, array, e) {
        // stateHandler.saveState();
        if (e.ctrlKey || e.metaKey) {
            const index = array.indexOf(obj);
            if (index > -1) // remove the selected object from selected objects
                array.splice(index, 1);
            else // add the selected object to selected objects
             {
                array.push(obj);
                // if (obj instanceof Edge)
                // selectPointsOfSelectedEdge(obj);
            }
        }
        else // if not control key pushed, remove all the selected objects and then add the selected one
         {
            this.setNothingSelected();
            // array.length = 0;   // clear the array in place
            array.push(obj);
            // if (obj instanceof Edge)
            // selectPointsOfSelectedEdge(obj);
        }
    }
    // not sure if necessary
    // when selecting an edge to delete it, its vertices will also be selected so they'll be deleted too (unless the user uses the delete button on the edge palette)
    selectPointsOfSelectedEdge(edge) {
        if (edge.points[0] instanceof Vertex && edge.points[1] instanceof Vertex) {
            if (!this.vertices.includes(edge.points[0]))
                this.vertices.push(edge.points[0]);
            if (!this.vertices.includes(edge.points[1]))
                this.vertices.push(edge.points[1]);
        }
        for (const bend of edge.bends)
            if (!this.bends.includes(bend))
                this.bends.push(bend);
    }
}
