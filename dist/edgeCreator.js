import { Vertex } from "./graphElements.js";
// a helpful class for creating a bended edge
export class BendedEdgeCreator {
    constructor() {
        this._creatingEdge = false; // will be used to check if a new edge is being drawn
        this._startingVertex = null; // the vertex from which an edge starts
        this._edgeCreated = null; // the new edge that is being created during edge creation
        this.tempCount = 0; // counting temporary vertices
    }
    get creatingEdge() { return this._creatingEdge; }
    get startingVertex() { return this._startingVertex; }
    get edgeCreated() { return this._edgeCreated; }
    set startingVertex(v) { this._startingVertex = v; }
    set creatingEdge(b) { this._creatingEdge = b; }
    set edgeCreated(e) { this._edgeCreated = e; }
    reset() {
        this.edgeCreated = null;
        this.startingVertex = null;
        this.creatingEdge = false;
    }
    // this function is used when the user creates a new edge, starting from a (probably temporary) vertex
    // given a vertex and a point(x,y), extend the edge from vertex to (x,y)
    // return the new vertex and the edge created
    extendEdge(graph, v, x, y) {
        // create a temporary vertex to be able to create the edge
        const temp = new Vertex("t" + this.tempCount.toString(), x, y);
        temp.temporary = true;
        graph.addVertex(temp);
        this.tempCount++;
        // this.extendEdgeToVertex(v,temp);
        // return the vertex
        return { vertex: temp, edge: this.extendEdgeToVertex(graph, v, temp) };
    }
    // extend an unfinished edge (whose start is a real vertex) to meet a newVertex
    extendEdgeToVertex(graph, vertex, newVertex) {
        // check if the vertex is a temporary vertex
        if (vertex.temporary) {
            const neighbor = vertex.neighbors[0]; // if temporary, it has only one neighbor    
            const edge = graph.addEdge(neighbor, newVertex); // create a new edge with the new temporary vertex
            if (!edge)
                return null;
            // update bends
            const prevEdge = graph.getEdgeByVertices(neighbor, vertex);
            edge === null || edge === void 0 ? void 0 : edge.addBends(prevEdge.bends);
            edge === null || edge === void 0 ? void 0 : edge.addBend(vertex.x, vertex.y, false); // the previous temporary vertex now becomes the last bend of the new edge
            // remove temporary vertex from vertices
            graph.deleteVertex(vertex);
            // update crossings
            graph.updateCrossingsByEdge(edge);
            // printPointArray(edge!.bends);
            return edge;
        }
        else
            return graph.addEdge(vertex, newVertex);
    }
    // check again. Maybe there's a better way to implement it
    addEdgeAdvanced(graph, u, v) {
        if (!v.temporary)
            return this.extendEdgeToVertex(graph, u, v);
        else if (!u.temporary)
            return this.extendEdgeToVertex(graph, v, u);
        // both vertices temporary
        const uNeighbor = u.neighbors[0];
        const vNeighbor = v.neighbors[0];
        const edge = graph.addEdge(uNeighbor, vNeighbor); // create a new edge between the two neighbors
        if (!edge)
            return null; // if edge not created, return null;
        // update bends and store them in the right order
        const uEdge = graph.getEdgeByVertices(uNeighbor, u);
        const vEdge = graph.getEdgeByVertices(vNeighbor, v);
        edge === null || edge === void 0 ? void 0 : edge.addBends(uEdge.bends);
        edge === null || edge === void 0 ? void 0 : edge.addBend(u.x, u.y, false); // the previous temporary vertex now becomes bend
        edge === null || edge === void 0 ? void 0 : edge.addBend(v.x, v.y, false); // the previous temporary vertex now becomes bend
        edge === null || edge === void 0 ? void 0 : edge.addBends(vEdge.bends.reverse()); // add them in reversed order
        // remove temporary vertices
        graph.deleteVertex(u);
        graph.deleteVertex(v);
        // update crossings
        graph.updateCrossingsByEdge(edge);
        //printPointArray(edge!.bends);
        return edge;
    }
    // check if an edge can be created between a (probably temporary) starting vertex and an ending vertex
    checkEdgeExtension(graph, starting, ending) {
        if (starting.temporary)
            return graph.checkEdgeId(starting.neighbors[0], ending);
        return graph.checkEdgeId(starting, ending);
    }
}
