import {Graph} from "./graph.js";
import { Edge, Vertex } from "./graphElements.js";

// a helpful class for creating a bended edge
export class BendedEdgeCreator
{
    private _creatingEdge: boolean = false;         // will be used to check if a new edge is being drawn
    private _startingVertex: Vertex | null = null;  // the vertex from which an edge starts
    private _edgeCreated: Edge | null = null;       // the new edge that is being created during edge creation
    private tempCount: number = 0;                  // counting temporary vertices

    get creatingEdge() {return this._creatingEdge; }
    get startingVertex() { return this._startingVertex; }
    get edgeCreated() { return this._edgeCreated}

    set startingVertex(v: Vertex | null ) { this._startingVertex = v; }
    set creatingEdge( b: boolean) { this._creatingEdge = b; }
    set edgeCreated( e: Edge| null) { this._edgeCreated = e; }

    public reset()
    {
        this.edgeCreated = null;
        this.startingVertex = null;
        this.creatingEdge = false;
    }

    // this function is used when the user creates a new edge, starting from a (probably temporary) vertex
    // given the graph, a vertex and a point(x,y), extend the edge from vertex to (x,y)
    // return the new vertex and the edge created
    public extendEdge(graph: Graph, v: Vertex, x: number, y: number)
    {
        // create a temporary vertex to be able to create the edge
        const temp = new Vertex("t"+this.tempCount.toString(),x,y);
        temp.temporary = true;
        // console.log("new temporary vertex:",temp.id);
        graph.addVertex(temp);
        this.tempCount++;
        // this.extendEdgeToVertex(v,temp);
        // return the vertex
        return {vertex: temp, edge: this.extendEdgeToVertex(graph,v,temp)};
    }

    // extend an unfinished edge (whose start is a real vertex and whose end may be temporary) to meet a newVertex
    private extendEdgeToVertex(graph: Graph, vertex: Vertex, newVertex: Vertex)
    {
        // check if the starting vertex is a temporary vertex
        if (vertex.temporary)
        {
            const neighbor = vertex.neighbors[0];           // if temporary, it has only one neighbor, a real vertex  
            const edge = graph.addEdge(neighbor,newVertex); // create a new edge with the new temporary vertex
            if (!edge)
                return null;
            // update bends
            const prevEdge = graph.getEdgeByVertices(neighbor,vertex) as Edge;
            edge.addBends(prevEdge.bends);
            edge.addBend(vertex.x,vertex.y,false);   // the previous temporary vertex now becomes the last bend of the new edge
            // remove temporary vertex from vertices
            graph.deleteVertex(vertex);             // console.log("vertex",vertex.id,"deleted");
            // remove prevEdge from the graph
            graph.deleteEdgee(prevEdge,false);      // console.log("edge",prevEdge.id,"deleted")
            // update crossings
            graph.updateCrossingsByEdge(edge);
            return edge;
        }
        else
            return graph.addEdge(vertex,newVertex);
    }

    // check again. Maybe there's a better way to implement it
    public addEdgeAdvanced(graph: Graph, u: Vertex, v: Vertex)
    {
        if (!v.temporary)
            return this.extendEdgeToVertex(graph,u,v);
        else if (!u.temporary)
            return this.extendEdgeToVertex(graph,v,u);
        // both vertices temporary
        const uNeighbor = u.neighbors[0];
        const vNeighbor = v.neighbors[0];
        const edge = graph.addEdge(uNeighbor,vNeighbor);   // create a new edge between the two neighbors
        if (!edge)  
            return null;     // if edge not created, return null;
        // update bends and store them in the right order
        const uEdge = graph.getEdgeByVertices(uNeighbor,u);
        const vEdge = graph.getEdgeByVertices(vNeighbor,v);
        edge?.addBends(uEdge!.bends);
        edge?.addBend(u.x,u.y,false);   // the previous temporary vertex now becomes bend
        edge?.addBend(v.x,v.y,false);   // the previous temporary vertex now becomes bend
        edge?.addBends(vEdge!.bends.reverse()); // add them in reversed order
        // remove temporary vertices
        graph.deleteVertex(u);
        graph.deleteVertex(v);
        // update crossings
        graph.updateCrossingsByEdge(edge!);
        //printPointArray(edge!.bends);
        return edge;
    }

    // check if an edge can be created between a (probably temporary) starting vertex and an ending vertex
    private checkEdgeExtension(graph: Graph, starting: Vertex, ending: Vertex)
    {
        if (starting.temporary)
            return graph.checkEdgeId(starting.neighbors[0],ending);
        return graph.checkEdgeId(starting,ending);
    }
}