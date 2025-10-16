import { showCustomAlert } from "./alert.js";
import { Point, Vertex, Bend, Crossing, LineSegment, Edge } from "./graphElements.js";


// Given an array of objects (e.g. Vertex, Edge) return an array of strings, containing the id's of the objects
function extractIds<T extends { id: string }>(items: T[]): string[] {
    return items.map(item => item.id);
}

export class Graph {
    private _vertices: Vertex[] = [];
    private _edges: Edge[] = [];
    // characteristics of the graph
    private directed: boolean = false;
    private _self_loops: boolean = false;
    private _parallel_edges: boolean = false;
    // store all the crossing points between edges of the graph
    private _crossings: Crossing[] = [];
    // store the curve complexity of the graph
    private _curve_complexity: number = 0;
    // decide which method will be used for updating crossings
    private _effective_crossing_update: boolean = true;

    get vertices() {return this._vertices;}
    get edges() {return this._edges;}
    get crossings() {return this._crossings;}
    get curve_complexity() {return this._curve_complexity;}
    get effective_crossing_update() {return this._effective_crossing_update; }
    get selfLoops() { return this._self_loops;}
    get parallelEdges() { return this._parallel_edges; }

    // will be used in the cloning (Undo/Redo)
    set vertices(vert: Vertex[]) {this._vertices = vert}
    set edges(e: Edge[]) {this._edges = e}
    set effective_crossing_update(update: boolean) { this._effective_crossing_update = update; }
    set selfLoops(self_loops: boolean) { this._self_loops = self_loops; }
    set parallelEdges(parallel: boolean) { this._parallel_edges = parallel; }

    constructor(vertices: Vertex[] = [], edges: Edge[] = [], updateCrossings: boolean = true)
    {
        // add the vertices to the graph
        this.addVertices(vertices);
        // add the edges
        for (const e of edges)
            if ( this.checkEdgeId(e.points[0] as Vertex,e.points[1] as Vertex))
                this._edges.push(e);
        if (updateCrossings)
            this.updateCrossings();
        this.updateCurveComplexity();
    }

    // update the curve complexity of the graph
    updateCurveComplexity()
    {
        let cc = 0;
        let edge_complexity = 0;
        for (const e of this._edges)
        {
            edge_complexity = e.bends.length;
            if (edge_complexity > cc)
                cc = edge_complexity;
        }
        this._curve_complexity = cc;
    }

    // add a new vertex
    addVertex(vertex: Vertex) {
        //check that there is no vertex in the graph with the same name
        if (!extractIds(this._vertices).includes(vertex.id)) 
            this._vertices.push(vertex);
        else
            showCustomAlert("WARNING: Vertex with this name ("+vertex.id+") already exist");
            // console.log("WARNING: Vertex with this name ("+vertex.id+") already exist")
    }

    // add an array of vertices
    addVertices(vertices: Vertex[])
    {
        for (const v of vertices)
            this.addVertex(v);
    }

    // add a new vertex to the graph at the specified position with the id of the max numerical ids and return the vertex
    addNewVertex(x: number = 0, y: number = 0)
    {
        let newVertex = new Vertex((this.maxVertexId()+1).toString(),x,y);
        this.addVertex(newVertex);
        return newVertex;
    }

    // check if there exists a vertex in the graph with the given id
    vertexIdExists(id: string)  { return extractIds(this._vertices).includes(id); }

    // given the id of a vertex, return the vertex
    getVertex(vrt_id: string)   {   return this._vertices.find(v => v.id === vrt_id)   }

    // delete a vertex and all its corresponding edges
    deleteVertex(vertex: Vertex) {  // consider showing WARNING if the vertex does not belong to the graph
        this._vertices = this._vertices.filter(v => v !== vertex);
        // update neighbors
        for (const neighbor of vertex.neighbors)
            neighbor.deleteNeighbor(vertex);
        // delete corresponding edges
        this._edges = this._edges.filter(edge => edge.points[0] !== vertex && edge.points[1] !== vertex);
        // update curve complexity
        this.updateCurveComplexity();
        // update crossings
        if (this._effective_crossing_update)
            this._crossings = this._crossings.filter(cross => !cross.relevantToVertex(vertex));
        else
            this.updateCrossings();
    }

    // delete a vertex when its id is given
    deleteVertexId(vrt_id: string)
    {
        let vrt = this.getVertex(vrt_id)
        if (vrt)
            this.deleteVertex(vrt)
    }

    /**
     * Move the given vertex to the specified (x,y) location
     */
    moveVertex(v: Vertex,x: number,y: number, update: boolean = true)
    {
        v.moveTo(x,y);
        // update crossings
        if (update)
        {
            if (this._effective_crossing_update)
                this.updateCrossingsByVertex(v);
            else
                this.updateCrossings();
        }
    }

    // swap the coordinates of the 2 given vertices
    swapVertices(v1: Vertex, v2: Vertex, update: boolean = true)
    {
        const x1 = v1.x;
        const y1 = v1.y;
        this.moveVertex(v1,v2.x,v2.y,update);
        this.moveVertex(v2,x1,y1,update);
    }

    // swap the coordinates of the 2 given points
    swapPoints(p1: Point, p2: Point, update: boolean = true)
    {
        const x1 = p1.x;
        const y1 = p1.y;
        // move p1
        if (p1 instanceof Vertex)
            this.moveVertex(p1,p2.x,p2.y,update);
        else if (p1 instanceof Bend)
            this.moveBend(p1,p2.x,p2.y,update)
        // move p2
        if (p2 instanceof Vertex)
            this.moveVertex(p2,x1,y1,update);
        else if (p2 instanceof Bend)
            this.moveBend(p2,x1,y1,update);
    }

    // return the vertex near a specified (x,y) location (at distance < dist from (x,y) )
    // first check the array of vertices given
    // scale is used because the zoom scale might not be 1, but the vertices are shown at a fixed size regardless of the zoom
    getVertexAtPosition(x: number, y: number, scale: number = 1, vert: Vertex[] = [])
    {
        // check vertices of the array
        for (const v of vert)
            if (Math.hypot(v.x-x,v.y-y) < (v.size+3)/scale && !v.temporary)
                return v;
        // check all the vertices
        for (const v of this._vertices)
            if (Math.hypot(v.x-x,v.y-y) < (v.size+3)/scale && !v.temporary)
                return v;
        return null;
    }

    renameVertex(vertex: Vertex, newId: string)
    {
        if (!this._vertices.includes(vertex))
        {
            console.log("vertex not in graph");
            return null;
        }
        if (extractIds(this._vertices).includes(newId))
        {
            // console.log("Id already in use");
            showCustomAlert("Vertex Id already in use");
            return null;
        }
        vertex.id = newId;
        vertex.label.content = newId;
        // update the ids of the edges (and their bends) colliding to the vertex
        this._edges.forEach(e => {
            if(e.points[0]===vertex || e.points[1]===vertex)
            {
                // update edge id
                e.id = e.setId(e.points[0],e.points[1]);
                // update bend ids
                e.bends.forEach(b => {b.id = b.setId(); b.label.content=b.id; });
            }
        })
        // update crossings (so crossings ids are updated)
        if (this.effective_crossing_update)
            this.updateCrossingsByVertex(vertex);
        else
            this.updateCrossings();
        // return the vertex with the newId
        return vertex;
    }

    // given a (x,y) location, return the bend at distance < dist near this location
    getBendAtPosition(x: number, y: number,scale: number = 1, b: Bend[] = [])
    {
        // first check given bends
        for (const bend of b)
            if (Math.hypot(bend.x-x, bend.y-y) < (bend.size+3)/scale)
                return bend;
        // check all the bends of the graph
        for (const e of this._edges)
            for (const bend of e.bends)
                if (Math.hypot(bend.x-x, bend.y-y) < (bend.size + 3)/scale)
                    return bend;
        return null;
    }

    // return the point (vertex or bend) at position (x,y)
    // first check the array of given points
    getPointAtPosition(x: number, y: number, scale:number = 1, points: Point[] = [])
    {
        const pv = points.filter(p => p instanceof Vertex);
        const pb = points.filter(p => p instanceof Bend);
        const v = this.getVertexAtPosition(x,y,scale,pv);
        if (v)
            return v;
        else
            return this.getBendAtPosition(x,y,scale,pb);
    }

    // given the id of an edge, return the edge
    getEdge(edge_id: string) {return this._edges.find(e => e.id == edge_id)}

    // given 2 vertices, return the edge that connects them (if exists)
    getEdgeByVertices(v1: Vertex, v2: Vertex) 
    { return this._edges.find(e => e.points[0]===v1 && e.points[1]==v2 || e.points[0]===v2 && e.points[1]==v1); }

    getEdgeByVerticesId(id1: string, id2: string)
    {
        const edge = this.getEdge(id1+"-"+id2);
        if (edge)
            return edge;
        return this.getEdge(id2+"-"+id1);
    }

    // add a new edge using the Id's of 2 vertices
    addEdgeId(id1: string, id2: string)
    {
        const v1 = this.getVertex(id1);
        const v2 = this.getVertex(id2);
        if (v1 && v2)
            return this.addEdge(v1,v2)
        // else
        //    console.log("WARNING: one or both of the vertices ("+id1+","+id2+") does not exist in the graph")
    }

    // add a new edge between 2 vertices
    addEdge(v1: Vertex, v2: Vertex, updateCrossings: boolean = true, showWarnings: boolean = true) {
        if (this.checkEdgeId(v1,v2, showWarnings))
        {
            let edge = new Edge([v1,v2])
            this._edges.push(edge);
            // update neighbors
            v1.addNeighbor(v2);
            v2.addNeighbor(v1);
            // update crossings
            if (updateCrossings)
            {
                if(this._effective_crossing_update)
                    this.updateCrossingsByEdge(edge);
                else
                    this.updateCrossings();
            }
            return edge;
        }
        else
            return null;
    }

    // used for cloning
    addEdgee(e: Edge, updateCrossings: boolean = true)
    {
        const v1 = e.points[0] as Vertex, v2 = e.points[1] as Vertex;
        if (this.checkEdgeId(v1,v2))
        {
            this.edges.push(e);
            // update neighbors not necessary as the neighbors are already there
            // v1.addNeighbor(v2);
            // v2.addNeighbor(v1);
            // update crossings
            if (updateCrossings)
            {
                if(this._effective_crossing_update)
                    this.updateCrossingsByEdge(e);
                else
                    this.updateCrossings();
            }
            return e;
        }
        else
            return null;
    }

    // check if an edge can be created between 2 given vertices
    checkEdgeId(v1: Vertex, v2: Vertex, showWarnings: boolean = true): boolean
    {
        // first check that the 2 vertices belong to the graph
        if (!this._vertices.includes(v1) || !this._vertices.includes(v2) )
        {
            // console.log("WARNING: one or both of the vertices ("+v1.id+","+v2.id+") does not exist in the graph");
            if (showWarnings)
                showCustomAlert("WARNING: one or both of the vertices ("+v1.id+","+v2.id+") does not exist in the graph");
            return false;
        }

        // if vertices are temporary, check their neighbors
        /*if (v1.temporary)
            return this.checkEdgeId(v1.neighbors[0],v2);
        if (v2.temporary)
            return this.checkEdgeId(v1,v2.neighbors[0]);*/

        // check by id
        let edge_id1 = v1.id + '-' + v2.id
        // if the graph is undirected, check reversed edge
        let edge_id2 = v2.id + '-' + v1.id

        if (v1===v2 && !this.selfLoops)
        {
            // console.log("WARNING: Self loops are not allowed in this graph");
            if (showWarnings)
                showCustomAlert("WARNING: Self loops are not allowed in this graph");
            return false;
        }
        //check that the edge does not already exits
        else if  (extractIds(this._edges).includes(edge_id1) && !this.parallelEdges)
        {
            // console.log("WARNING: Edge " + edge_id1 + " already exists and the graph is simple");
            if (showWarnings)
                showCustomAlert("WARNING: Edge " + edge_id1 + " already exists" /* and the graph is simple"*/ );
            return false;
        }
        // if the graph is undirected and simple, check reversed edge
        else if (!this.directed && !this.parallelEdges && extractIds(this._edges).includes(edge_id2))
        {
            // console.log("WARNING: Edge " + edge_id2 + " already exists");
            if (showWarnings)
                showCustomAlert("WARNING: Edge " + edge_id2 + " already exists" /*and the graph is simple"*/);
            return false;
        }
        return true;
    }

    // delete an edge given the Id's of the vertices
    deleteEdgeId(id1: string, id2: string)
    {
        let v1 = this.getVertex(id1)
        let v2 = this.getVertex(id2)
        if (v1 && v2)
            this.deleteEdge(v1,v2)
        else
            console.log("WARNING: one or both of the vertices ("+id1+","+id2+") does not exist in the graph")
    }

    // delete an edge between vertices v1 and v2
    deleteEdge(v1: Vertex, v2: Vertex, updateCrossings: boolean = true) {
        const e = this.getEdgeByVertices(v1,v2);
        if (e)
            this.deleteEdgee(e,updateCrossings);
    }

    // remove an edge from the graph
    deleteEdgee(e: Edge, updateCrossings: boolean = true)
    {
        // remove from edges list
        this._edges = this._edges.filter(edge => edge != e);
        // delete neighbors
        const v1 = e.points[0] as Vertex;
        const v2 = e.points[1] as Vertex;
        v1.deleteNeighbor(v2);
        v2.deleteNeighbor(v1);
        // update crossings
        if (updateCrossings)
        {
            if(this._effective_crossing_update && e)
                this._crossings = this._crossings.filter(cross => cross.edges[0] != e && cross.edges[1] != e);
            else
                this.updateCrossings();
        }
        // update curve complexity
        if (e && e.bends.length === this.curve_complexity)
            this.updateCurveComplexity();
    }

    /**Check if the graph contains self-loops
     * 
     * @returns a point on which there's self-loop. If there are not self-loops in the graph, return null
     */
    checkSelfLoops()
    {
        this.edges.forEach(e => {if(e.points[0]===e.points[1]) return e.points[0];} )
        return null;
    }

    /**Check if the graph contains parallel edges
     * 
     * @returns one of a set of parallel edges, or null if the graph does not contain parallel edges
     */
    checkParallelEdges()
    {
        for (const e1 of this.edges)
            for (const e2 of this.edges)
            {
                if (e1===e2)
                    break;
                if (e1.points[0]===e2.points[0] && e1.points[1]===e2.points[1] || e1.points[0]===e2.points[1] && e1.points[1]===e2.points[0])
                    return e1;
            }
        return null;
    }

    // check if two STRAIGHT edges cross each other (return the crossing point) or not (return null)
    // source: https://www.youtube.com/watch?v=bvlIYX9cgls&t=155s
    straightCrossingPoint(sub1: LineSegment, sub2: LineSegment)
    {
        if (sub1 === sub2)
            return null;
        const p1: Point = sub1.points[0]
        const p2: Point = sub1.points[1]
        const p3: Point = sub2.points[0]
        const p4: Point = sub2.points[1]
        // first check if edges are parallel
        const b = (p4.x-p3.x)*(p2.y-p1.y) - (p4.y-p3.y)*(p2.x-p1.x);
        if (Math.abs(b) < 1e-10)
            return null;
        // compute constants a and c
        const a = (p4.x-p3.x)*(p3.y-p1.y) - (p4.y-p3.y)*(p3.x-p1.x);
        const c = (p2.x-p1.x)*(p3.y-p1.y) - (p2.y-p1.y)*(p3.x-p1.x);
        // compute coefficients alpha and beta
        const alpha = a/b;
        const beta = c/b;
        // crossing condition: 0 <= alpha <= 1 && 0 <= beta <= 1
        const accuracy = 1e-5
        if (accuracy<alpha && alpha<1-accuracy && accuracy<beta && beta<1-accuracy)
        {
            const x0 = p1.x + alpha*(p2.x-p1.x);
            const y0 = p1.y + alpha*(p2.y-p1.y);
            return new Crossing(sub1,sub2,x0,y0);
        }
        return null;
    }

    // find all the crossing points between two (bended) edges
    crossingPoints(e1: Edge, e2: Edge)
    {
        let crossings: Crossing[] = [];

        // if e1=e2, check for self-crossings
        if (e1===e2)
        {
            const subEdges = e1.subEdges();
            for (let i=0;i<subEdges.length-1;i++)
                for (let j=i+1;j<subEdges.length;j++)
                {
                    const crossing = this.straightCrossingPoint(subEdges[i],subEdges[j]);
                    if (crossing)
                    {
                        crossing.edges = [e1,e1];
                        crossing.checkLegal();
                        crossings.push(crossing);
                    }
                }
            return crossings;
        }

        // e1 != e2 case
        const subEdges1 = e1.subEdges();
        const subEdges2 = e2.subEdges();
        // console.log("crossingPoints of edges "+e1.id+"/"+e2.id);
        // console.log("Subedges:\n"+extractIds(subEdges1).toString()+"\n"+extractIds(subEdges2).toString())

        for (const sub1 of subEdges1)
            for (const sub2 of subEdges2)
            {
                const crossing = this.straightCrossingPoint(sub1,sub2);
                if (crossing)
                {
                    crossing.edges = [e1,e2];
                    crossing.checkLegal();
                    crossings.push(crossing);
                }
            }

        return crossings;
    }

    
    // find all the crossings of the graph, examining each pair of edges
    findAllCrossings()
    {
        let totalCrossings: Crossing[] = [];
        for (let i=0;i<this._edges.length;i++)
            for (let j=i;j<this._edges.length;j++)
            {
                const crossings = this.crossingPoints(this._edges[i],this._edges[j]);
                totalCrossings = totalCrossings.concat(crossings);
            }
        return totalCrossings;
    }

    // update the crossings of an edge
    updateCrossingsByEdge(e: Edge)
    {
        // find all the crossings of the edge
        const edgeCrossings = this.findAllCrossingsFromEdge(e);
        // check for double or more crossings of the same pair of edges
        const len = edgeCrossings.length;
        for (let i=0;i<len-1;i++)
            for (let j=i+1;j<len;j++)
                if (edgeCrossings[i].sameEdges(edgeCrossings[j]))
                {
                    edgeCrossings[i].more_than_once = true;
                    edgeCrossings[j].more_than_once = true;
                }
        // remove previous crossings of the edge
        this._crossings = this._crossings.filter(cross => cross.edges[0] != e && cross.edges[1] != e);
        // add the new crossings of the edge to the set of crossings
        this._crossings = this._crossings.concat(edgeCrossings);
    }

    // update crossings when moving a vertex
    updateCrossingsByVertex(v: Vertex)
    {
        // find the edges that have vertex v as a point
        const edges = this._edges.filter(e => e.points[0] === v || e.points[1] === v);
        for (const edge of edges)
            this.updateCrossingsByEdge(edge!);
    }

    // update crossings when moving a bend
    updateCrossingsByBend(b: Bend)  { this.updateCrossingsByEdge(b.edge); }

    /**
     * Move the given bend to the given position and update the crossings
     */
    moveBend(b: Bend, x: number, y: number, updateCrossings: boolean = true) 
    {
        b.moveTo(x,y);
        // update crossings
        if (updateCrossings)
        {
            if(this._effective_crossing_update)
                this.updateCrossingsByBend(b);
            else
                this.updateCrossings();
        }
    }

    // move a point (vertex or bend)
    movePoint(p: Point, x: number, y: number)
    {
        if (p instanceof Vertex)
            this.moveVertex(p,x,y);
        else if (p instanceof Bend)
            this.moveBend(p,x,y);
    }
    

    // update all the crossings of the graph
    updateCrossings()
    {
        this._crossings = this.findAllCrossings();
        const len = this._crossings.length;
        // check for double or more crossings of the same pair of edges
        for (let i=0;i<len-1;i++)
            for (let j=i+1;j<len;j++)
                if (this._crossings[i].sameEdges(this._crossings[j]))
                {
                    this._crossings[i].more_than_once = true;
                    this._crossings[j].more_than_once = true;
                }
    }

    // split the crossings into categories
    crossingsCategories()
    {
        let self_crossings: number = 0;
        let neighbor_edge_crossings: number = 0;
        let multiple_crossings: number = 0;
        let legal_crossings: number = 0;
        for (const cros of this._crossings)
        {
            if (cros.selfCrossing)          // self crossing
                ++self_crossings;
            else if (!cros.legal)           // neighbor edge crossing
                ++neighbor_edge_crossings;
            else if (cros.more_than_once)   // multiple crossing
                ++multiple_crossings;
            else                            // legal crossing
                ++legal_crossings;
        }
        return {self: self_crossings, neighbor: neighbor_edge_crossings, multiple: multiple_crossings, legal: legal_crossings}
    }

    // find all the crossings of a given edge with the other edges
    findAllCrossingsFromEdge(e: Edge)
    {
        let edgeCrossings: Crossing[] = [];
        // console.log("findAllCrossingsFromEdge "+e.id);
        for (let i=0;i<this._edges.length;i++)
        {
            // const e1 = this._edges[i];
            // console.log("edge:",e1.id);
            const crossings = this.crossingPoints(e,this._edges[i]);
            edgeCrossings = edgeCrossings.concat(crossings);
            //console.log(extractIds(edgeCrossings).toString());
        }
        return edgeCrossings;
    }

    /**
     * Add a bend to an edge (given the vertices of the edge)
     * to the given coordinates (or to the middlepoint of the vertices if coordinates not given)
     * Also, if onEdge === true, place the bend on the edge, on the point of the edge that is closer to (x,y).
     * If not, place it on the (x,y) coordinates
     */
    addBend(v: Vertex, u: Vertex, x?: number, y?:number, onEdge: boolean = true, updateCrossings: boolean = true)
    {
        let edge = this.getEdgeByVertices(v,u);
        let newBend: Bend;
        if (edge)
        {
            if(x !== undefined && y !== undefined)
                newBend = edge.addBend(x,y,onEdge);
            else{
                let midx = (v.x+u.x)/2;
                let midy = (v.y+u.y)/2;
                newBend = edge.addBend(midx,midy);
            }
            const edge_complexity = edge.bends.length;
            // update crossings
            if (updateCrossings)
            {
                if (this._effective_crossing_update)
                    this.updateCrossingsByEdge(edge);
                else
                    this.updateCrossings();
            }
            // update curve complexity
            if (edge_complexity > this._curve_complexity)
                this._curve_complexity = edge_complexity;
            return newBend;
        }
        else
        {
            console.log("Edge not found.");
            return null;
        }
    }

    /**
     * Remove τηε given bend from the graph
     */
    removeBend(bend: Bend)
    {
        const edge = bend.edge;
        const index = edge.bends.indexOf(bend);
        edge.bends.splice(index,1);
        if (this.effective_crossing_update)
            this.updateCrossingsByEdge(edge);
        else
            this.updateCrossings();
        this.updateCurveComplexity();
    }

    // compute the thrackle number of the graph
    thrackleNumber()
    {
        let thrackle = this._edges.length*(this._edges.length+1);
        for (const vertex of this._vertices)
        {
            const deg = vertex.neighbors.length;
            thrackle = thrackle - deg*deg;
        }
        return thrackle/2;
    }

    // make the graph clique (use only non-temporary vertices)
    addAllEdges(vert: Vertex[] = [], newEdgesColor: string = '#000000')
    {
        let nonTempVertices: Vertex[];
        if (vert.length > 0)
            nonTempVertices = vert;
        else
            nonTempVertices = this._vertices.filter(vertex => !vertex.temporary); // array with the non-temporary vertices

        let edge: Edge | null = null;
        for (const v1 of nonTempVertices)
            for (const v2 of nonTempVertices)
            {
                edge = this.addEdge(v1,v2,false,false); // don't update crossings and don't show warnings
                if (edge)
                    edge.color = newEdgesColor;     // new edges (produced when creating clique) are displayed with a specific color
            }
        this.updateCrossings();
    }

    // place all the non-temporary vertices in a circle with center (x0,y0) and radius r
    makeCircle(x0=0,y0=0,r=10,vert: Vertex[]=[])
    {
        // place a selected group of vertices in a circle
        if (vert.length === 0)
            vert = this._vertices.filter(vertex => !vertex.temporary);
        const labelOffset: number = 20;
        vert.forEach((vertex,index) => {
            const angle = (index/ vert.length)*2*Math.PI;
            this.moveVertex(vertex, x0-Math.cos(angle)*r, y0 - Math.sin(angle)*r,false);
            vertex.label.offsetX = -labelOffset*Math.cos(angle);
            vertex.label.offsetY = labelOffset*Math.sin(angle);
        });
        this.updateCrossings();
    }

    // place all the non-temporary vertices in a straightline
    straightLine(xDist:number = 50, y: number = 0, vert: Vertex[]=[])
    {
        // place a selected group of vertices in a straight line
        if (vert.length > 0)
        {
            const half = vert.length/2;
            vert.forEach((vertex,index) => {
                const xPos = (index-half)*xDist;
                this.moveVertex(vertex, xPos, y, false);
            })
        }
        else
        {
            const nonTempVertices = this._vertices.filter(vertex => !vertex.temporary); // array with the non-temporary vertices
            const half = this.vertices.length/2;
            nonTempVertices.forEach((vertex, index) => {
                const xPos = (index-half)*xDist;
                this.moveVertex(vertex, xPos, y, false);    // don't update crossings for each vertex movement
            });
        }
        this.updateCrossings();
    }

    // check if a given (x,y) point is near any edge of the graph and return the edge (at distance < dist)
    // if the point is near a bend of the edge, do not return the edge (used for drawing)
    isNearEdge(x: number, y: number, dist: number)
    {
        for (const edge of this._edges)
            if (edge.isNearPoint(x,y,dist))
            {
                for (const bend of edge.bends)
                    if (Math.hypot(bend.x-x,bend.y-y)<2*dist)
                        return null;
                return edge;
            }
        return null;
    }

    /**
     * Check if a given (x,y) point is near to any vertex of the graph and return the vertex. Else return null
     * (near means at distance < vertex.size)
     */
    isNearVertex(x: number, y: number)
    {
        for (const vertex of this._vertices)
            if (Math.hypot(vertex.x-x,vertex.y-y)<vertex.size+3)
                return vertex;
        return null;
    }

    /**
     * Check if a given (x,y) point is near to any vertex of the given vertices and return the vertex. Else return null
     * (near means at distance < vertex.size)
     */
    isNearVertices(x: number, y: number, v: Vertex[])
    {
        for (const vertex of v)
            if (Math.hypot(vertex.x-x,vertex.y-y)<vertex.size+3)
                return vertex;
        return null;
    }

    /**
     * Check if a given (x,y) point is near to any bend of the graph and return the bend. Else return null
     * (near means at distance < bend.size)
     */
    isNearBend(x: number, y: number, scale: number = 1)
    {
        for (const e of this._edges)
            for (const bend of e.bends)
                if (Math.hypot(bend.x-x, bend.y-y,)< (bend.size+2)/scale)
                    return bend;
        return null;
    }

    /**
     * Check if a given (x,y) point is near to any crossing of the graph and return the graph. Else return null
     * (near means at distance < crossing.size)
     */
    isNearCrossing(x: number, y: number, scale: number)
    {
        for (const cross of this._crossings)
            if (Math.hypot(cross.x-x,cross.y-y) < (cross.size+2)/scale )
                return cross;
        return null;
    }

    // remove all the edges from the graph
    removeEdges()
    {
        this._edges = [];
        for (const v of this._vertices)
            v.clearNeighbors();
        this.updateCrossings();
    }

    // remove all the bends from the graph
    removeBends(updateCrossings: boolean = true)
    {
        for (const e of this._edges)
            e.removeBends();
        if (updateCrossings)
            this.updateCrossings();
    }

    getBends()
    {
        let bends: Bend[] = [];
        for (const e of this._edges)
            bends = bends.concat(e.bends)
        return bends;
    }

    // find which points of the graph are within a rectangle
    pointsInRect(x: number, y: number, width: number, height: number)
    {
        const pointsIn: Point[] = [];
        // vertices
        for (const v of this._vertices)
            if (v.isIn(x,y,width,height) && !v.temporary)
                pointsIn.push(v);
        // bends
        for (const e of this._edges)
            for (const b of e.bends)
                if (b.isIn(x,y,width,height))
                    pointsIn.push(b);
        return pointsIn;
    }

    // find which edges of the graph are within a rectangle
    edgesInRect(x: number, y: number, width: number, height: number)
    {
        const edgesIn: Edge[] = [];
        for (const e of this._edges)
            if (e.isIn(x,y,width,height))
                edgesIn.push(e);
        return edgesIn;
    }

    // find the max Id of the vertices
    maxVertexId()
    {
        // Filter numeric strings and convert them to numbers
        const numericIds = extractIds(this._vertices).filter(id => /^\d+$/.test(id)).map(Number);   // Convert to number

        //const numIds = extractIds(this._vertices).filter(id => Number.isNaN(id));
        //console.log("Numeric Ids:",numericIds);
        if (numericIds.length === 0)
            return 0;
        return Math.max(...numericIds)
    }

    // return the arrays of vertices and edges of the graph
    getGraph() {
        return { vertices: this._vertices, edges: this._edges };
    }

    // print the vertices and edges of the graph
    printGraph()
    {
        console.log("Graph vertices:",extractIds(this._vertices))
        console.log("Graph edges:",extractIds(this._edges))
    }

    printGraphDetails()
    {
        console.log("VERTICES:");
        for (const v of this._vertices)
            v.print();
        console.log("EDGES:",extractIds(this._edges));
    }

    // print the crossings of the graph
    printCrossings()  
    {
        console.log("Crossings:",this._crossings.length)
        // printPointArray(this._crossings);
    }

    // Clone utility to store independent copies of graph
    clone() {
        const cloned = new Graph();
        // clone vertices
        for (const v of this._vertices) {
            cloned.addVertex(v.clone());
            // console.log("cloned vertex id:",v.id);
        }
        // clone edges and their characteristics
        for (const e of this.edges)
        {
            const newEdge = cloned.addEdgeId(e.points[0].id,e.points[1].id);
            if (newEdge)
                newEdge.cloneCharacteristics(e);
        }
        // update crossings - consider cloning the crossings
        cloned.updateCrossings();
        cloned.updateCurveComplexity();
        return cloned;
    }

    // merge this graph with (a copy of) the given newGraph and return the new subgraph that represents newGraph and is now part of the big graph
    merge(newGraph: Graph, offset = {x: 0, y: 0} )
    {
        const newSubGraph: Graph = new Graph();
        // create a map for the new vertices (of this graph) and vertices of the newGraph (so that the new edges can be created)
        const map = new Map<Vertex, Vertex>();
        // merge vertices
        for (const v of newGraph.vertices)
        {
            let newVertex = this.addNewVertex(v.x+offset.x, v.y+offset.y);
            newVertex.cloneCharacteristics(v);
            map.set(v,newVertex);
            newSubGraph.addVertex(newVertex);   // 
        }
        // merge edges
        for (const e of newGraph.edges)
        {
            const v1 = e.points[0] as Vertex;
            const v2 = e.points[1] as Vertex;
            let newEdge: Edge | null = null;
            newEdge = this.addEdge(map.get(v1)!,map.get(v2)!)!;
            if (newEdge){
                newEdge.cloneCharacteristics(e,offset.x,offset.y);
                newSubGraph.addEdgee(newEdge,false);
            }
        }
        this.updateCrossings();
        this.updateCurveComplexity();
        return newSubGraph;
    }

    /** Replace this graph with the given graph, i.e. copy the characteristics of the given graph to this one
     * 
     * @param newGraph 
     */
    replace(newGraph: Graph)
    {
        this._vertices = newGraph.vertices;
        this._edges = newGraph.edges;
        this.directed = newGraph.directed;
        this._self_loops = newGraph.selfLoops;
        this._parallel_edges = newGraph.parallelEdges;
        this._crossings = newGraph.crossings;
        this._curve_complexity = newGraph.curve_complexity;
    }

    /** Clear the graph (make it empty)
     */
    public clear()
    {
        this._vertices.length = 0;
        this._edges.length = 0;
        this._crossings.length = 0;
        this._curve_complexity = 0;
    }

    /**
     * Report of the graph.
     * Contains population of all kinds of crossings, the thrackle bound and the curve complexity of the graph
     */
    public report()
    {
        const crossings_categories = this.crossingsCategories();
        const totalCrossings = this.crossings.length;
        const selfCrossings = crossings_categories.self;
        const neighborCrossings = crossings_categories.neighbor;
        const multipleCrossings = crossings_categories.multiple;
        const legalCrossings = crossings_categories.legal;
        const thrackleNumber = this.thrackleNumber();
        const cc = this.curve_complexity;
        return {total: totalCrossings, self: selfCrossings, neighbor: neighborCrossings, multiple: multipleCrossings, legal: legalCrossings, thrackleNum: thrackleNumber, cc: cc};
    }

    /**
     * @returns true if the graph is empty (i.e. there are no vertices)
     */
    public isEmpty() { return this.vertices.length === 0 }
}