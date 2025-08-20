import { showCustomAlert } from "./alert.js";
export class Label {
    constructor(objectId) {
        this._showLabel = false;
        this._offsetX = 0;
        this._offsetY = 15; // remember that positive is down in canvas
        this._color = "#000";
        this._fontSize = 14;
        this._content = objectId;
    }
    get content() { return this._content; }
    get showLabel() { return this._showLabel; }
    get offsetX() { return this._offsetX; }
    get offsetY() { return this._offsetY; }
    get color() { return this._color; }
    get fontSize() { return this._fontSize; }
    set content(content) { this._content = content; }
    set showLabel(show) { this._showLabel = show; }
    set offsetX(offsetX) { this._offsetX = offsetX; }
    set offsetY(offsetY) { this._offsetY = offsetY; }
    set color(color) { this._color = color; }
    set fontSize(fontSize) { this._fontSize = fontSize; }
    // copy the characteristics of the given label to this label
    cloneCharacteristics(lab) {
        // labeling
        // this.labelContent = p.labelContent;
        this.showLabel = lab.showLabel;
        this.offsetX = lab.offsetX;
        this.offsetY = lab.offsetY;
        this.color = lab.color;
        this.fontSize = lab.fontSize;
    }
}
export class Point {
    /*private _labelContent: string;
    private _showLabel: boolean = false;
    labelOffsetX: number = 0;
    labelOffsetY: number = 5;  // remember that positive is down in canvas
    labelColor: string = "#000";
    labelFont: number = 14;*/
    constructor(id, x_pos, y_pos) {
        this._x = 10;
        this._y = 10;
        // desing
        this._size = 5; //  if circle, size = radius, if square, size = side length
        this._color = "#000000";
        this._id = id;
        // this._labelContent = id;
        this.label = new Label(this.id);
        if (x_pos != undefined)
            this._x = x_pos;
        if (y_pos != undefined)
            this._y = y_pos;
    }
    get id() { return this._id; }
    get x() { return this._x; }
    get y() { return this._y; }
    get size() { return this._size; }
    get color() { return this._color; }
    // get labelContent() { return this._labelContent; }
    // get showLabel() { return this._showLabel; }
    set id(id) { this._id = id; }
    set x(x_pos) { this._x = x_pos; }
    set y(y_pos) { this._y = y_pos; }
    set size(s) { this._size = s; }
    set color(c) { this._color = c; }
    // set labelContent(label: string) { this._labelContent = label; }
    // set showLabel(show: boolean) { this._showLabel = show; }
    // print details (name and coordinates)
    print() { console.log(this._id, "x:" + this._x, "y:" + this._y); }
    // move the Vertex to a specified location in the plane
    moveTo(x_pos, y_pos) { this._x = x_pos; this._y = y_pos; }
    // check if the point is in a given rectangle
    isIn(x, y, width, height) { return x <= this._x && this._x <= x + width && y <= this._y && this._y <= y + height; }
}
export class Vertex extends Point {
    // private _shape: "circle" | "square" | "triangle" = "circle";
    constructor(id, x_pos, y_pos, temp) {
        super(id, x_pos, y_pos);
        this._temporary = false; // used when drawing a new edge from a vertex
        this._shape = "circle";
        if (temp !== undefined) // used in cloning
            this._temporary = temp;
        this._neighbors = [];
        this.color = "#000000";
        this.size = 7;
        this.label.showLabel = true;
    }
    get neighbors() { return this._neighbors; }
    get temporary() { return this._temporary; }
    get shape() { return this._shape; }
    set temporary(temp) { this._temporary = temp; }
    set shape(sh) { this._shape = sh; }
    // add a new neighbor
    addNeighbor(newNeighbor) { this._neighbors.push(newNeighbor); }
    // delete a neighbor
    deleteNeighbor(neighbor) { this._neighbors = this._neighbors.filter(v => v != neighbor); }
    // delete all the neighbors
    clearNeighbors() { this._neighbors = []; }
    ;
    // clone utility
    // IMPORTANT: neighbors are not cloned. They will be added when the graph is cloned
    clone() {
        let newVertex = new Vertex(this.id, this.x, this.y, this._temporary);
        newVertex.cloneCharacteristics(this);
        return newVertex;
    }
    // apply the characteristics of the given vertex to this vertex
    cloneCharacteristics(v) {
        this.shape = v.shape;
        this.color = v.color;
        this.size = v.size;
        // clone label characteristics
        this.label.cloneCharacteristics(v.label);
    }
}
export class LineSegment {
    constructor([p1, p2]) {
        this._points = [p1, p2];
        // this._crosses = []
        this._id = this.setId(p1, p2);
    }
    get id() { return this._id; }
    get points() { return this._points; }
    // get crossings() {return this._crosses}
    set points([p1, p2]) { this._points = [p1, p2]; }
    set id(id) { this._id = id; }
    setId(p1, p2) { return p1.id + '-' + p2.id; }
    // add a crossing with a new edge
    // addCrossing(crossingSegment: LineSegment) {this._crosses.push(crossingSegment); }
    // return the coordinates of the points of LineSegment, but make it a little bit shorter by a constant c
    /*pointsCoordinatesExcluded(c: number)
    {
        let x1 = this.points[0].x;    let y1 = this.points[0].y;
        let x2 = this.points[1].x;    let y2 = this.points[1].y;
        let angle: number;
        // compute angle
        if (x1===x2)
        {
            if (y1 < y2) { y1 = y1+c; y2 = y2-c;}
            else if (y2 < y1) {y1 = y1-c; y2 = y2+c;}
        }
        else
        {
            angle = Math.atan((y2-y2)/(x2-x1));
            // fix coordinates
            x1 = x1 + c*Math.cos(angle);
            y1 = y1 + c*Math.sin(angle);
            x2 = x2 - c*Math.cos(angle);
            y2 = y2 - c*Math.sin(angle);
        }
        /*if (x1 < x2) { x1 = x1+c; x2 = x2-c;}
        else if (x2 < x1) {x1 = x1-c; x2 = x2+c;}
        // y coordinates
        if (y1 < y2) { y1 = y1+c; y2 = y2-c;}
        else if (y2 < y1) {y1 = y1-c; y2 = y2+c;}
        return {x1,y1,x2,y2};
    }*/
    // given a point at (px,py), return its projection on the LineSegment (if projection not on the line segment, return the closer endpoint)
    projection(px, py) {
        const x1 = this.points[0].x;
        const y1 = this.points[0].y;
        const x2 = this.points[1].x;
        const y2 = this.points[1].y;
        // const {x1,y1,x2,y2} = this.pointsCoordinatesExcluded(dist);
        const l2 = Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2);
        if (l2 === 0)
            return { x: x1, y: y1 };
        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
        t = Math.max(0, Math.min(1, t)); // if t not in [0,1], choose 0 for t<0 and 1 for t>1
        const projX = x1 + t * (x2 - x1);
        const projY = y1 + t * (y2 - y1);
        return { x: projX, y: projY };
    }
    // return the distance of a point (px,py) from the LineSegment
    distanceFromPoint(px, py) {
        let coord = this.projection(px, py);
        return Math.hypot(coord.x - px, coord.y - py);
    }
    // check if a point at (px,py) is near the line segment (at distance < dist)
    isNear(px, py, dist) { return this.distanceFromPoint(px, py) < dist; }
    commonEndpoint(e) {
        const [v1, v2] = this.points;
        const [v3, v4] = e.points;
        if (v1 === v3 || v1 === v4 || v2 === v3 || v2 === v4)
            return true;
        return false;
    }
}
export class Edge extends LineSegment {
    constructor([v1, v2]) {
        super([v1, v2]);
        // bending points of the edge
        this._bends = [];
        // design characteristics
        this._color = "#898989"; // open gray
        this._dashed = false;
        this._thickness = 2;
        /*private _label: string;
        showLabel: boolean = false;
        labelOffsetX: number = 20;
        labelOffsetY: number = 20;*/
        // position of the label (reference point)
        this.labelPosX = 0;
        this.labelPosY = 0;
        this.label = new Label(this.id);
    }
    // get methods
    get bends() { return this._bends; }
    get color() { return this._color; }
    get dashed() { return this._dashed; }
    get thickness() { return this._thickness; }
    // get label() { return this._label; }
    // set methods
    set color(c) { this._color = c; }
    set dashed(t) { this._dashed = t; }
    set thickness(t) { this._thickness = t; }
    // set label(l) { this._label = l; }
    // add a bend at coordinate (x,y) (at the projection of (x,y) on the edge if onEdge is true)
    addBend(x, y, onEdge = true) {
        let newBend;
        if (!onEdge) {
            newBend = new Bend(this, x, y);
            this._bends.push(newBend);
            return newBend;
        }
        // find the subedge that is more close to the bend and add it there
        const subedges = this.subEdges();
        let minDist = subedges[0].distanceFromPoint(x, y); // initialize the value
        let dist; // distance of each subedge from new bend
        let closest = 0; // index of the closest subedge to (x,y)
        for (let i = 1; i < subedges.length; i++) {
            dist = subedges[i].distanceFromPoint(x, y);
            if (dist < minDist) {
                closest = i;
                minDist = dist;
            }
        }
        // put the new Bend ON the closest subedge
        const coord = subedges[closest].projection(x, y);
        // add bend to the bends
        newBend = new Bend(this, coord.x, coord.y);
        this._bends.splice(closest, 0, newBend);
        return newBend;
    }
    ;
    // remove the last bend of the edge
    removeLastBend() { this._bends.pop(); }
    // add an array of bends (used for cloning and connecting edges)
    // offsetX/Y is used when copying the edge to a different position
    addBends(bends, offsetX = 0, offsetY = 0) {
        for (let i = 0; i < bends.length; i++) {
            let new_bend = new Bend(this, bends[i].x + offsetX, bends[i].y + offsetY);
            new_bend.cloneCharacteristics(bends[i]);
            this._bends.push(new_bend);
        }
    }
    // return the sub-edges of the edge
    subEdges() {
        let subedges = [];
        const len = this._bends.length;
        if (len) {
            // first sub-edge
            subedges.push(new Subedge(this.points[0], this._bends[0], this));
            // intermediate sub-edges
            for (let i = 0; i < len - 1; i++)
                subedges.push(new Subedge(this._bends[i], this._bends[i + 1], this));
            // last sub-edge
            subedges.push(new Subedge(this._bends[len - 1], this.points[1], this));
        }
        else
            subedges.push(new Subedge(this.points[0], this.points[1], this));
        return subedges;
    }
    // check if a given point (px,py) is near (at distance < dist) to any of the subedges of the edge
    isNearPoint(px, py, dist) {
        const subedges = this.subEdges();
        for (const subedge of subedges)
            if (subedge.isNear(px, py, dist))
                return true;
        return false;
    }
    // make the edge straight
    removeBends() { this._bends = []; }
    // clone characteristics from a given edge e
    cloneCharacteristics(e, offsetX = 0, offsetY = 0) {
        this.addBends(e.bends, offsetX, offsetY);
        this._color = e.color;
        this._dashed = e.dashed;
        this._thickness = e.thickness;
        // clone label characteristics
        this.label.cloneCharacteristics(e.label);
    }
    assignCharacteristics(color, dashed, thickness) {
        this._color = color;
        this._dashed = dashed;
        this._thickness = thickness;
    }
    assignBendCharacteristics(color, size) {
        this._bends.forEach(b => {
            b.color = color;
            b.size = size;
        });
    }
    // check if the entire edge is in a rectangle
    isIn(x, y, width, height) {
        if (!this.points[0].isIn(x, y, width, height) || !this.points[1].isIn(x, y, width, height))
            return false;
        for (const bend of this._bends)
            if (!bend.isIn(x, y, width, height))
                return false;
        return true;
    }
    // update the values of labelPosX, labelPosY
    // the new values will be the middle point of the middle sub-edge of the edge
    updateLabelPos() {
        const subEdges = this.subEdges(); // get sub-edges
        const index = Math.floor((subEdges.length - 1) / 2);
        const midSubEdge = subEdges[index]; // find middle sub-edge
        this.labelPosX = (midSubEdge.points[0].x + midSubEdge.points[1].x) / 2; // +this.labelOffsetX;
        this.labelPosY = (midSubEdge.points[0].y + midSubEdge.points[1].y) / 2; // +this.labelOffsetY;
    }
}
export class Subedge extends LineSegment {
    constructor(p1, p2, e) {
        super([p1, p2]);
        this._edge = e;
    }
    get edge() { return this._edge; }
}
export class Crossing extends Point {
    constructor(sub1, sub2, x, y) {
        const id = sub1.id + "." + sub2.id;
        super(id, x, y);
        this._edges = [null, null];
        this._legal = true; // indicates if the crossing is legal (used in the graph class)   
        this._more_than_once = false; // indicates that the edges crossed at this point cross each other more than once (used for drawing)
        this._selfCrossing = false; // the crossing is a self-crossing
        this._subedges = [sub1, sub2];
    }
    get selfCrossing() { return this._selfCrossing; }
    get edges() { return this._edges; }
    get subedges() { return this._subedges; }
    get legal() { return this._legal; }
    get more_than_once() { return this._more_than_once; }
    set edges([e1, e2]) { this._edges = [e1, e2]; }
    set legal(leg) { this._legal = leg; }
    set more_than_once(value) { this._more_than_once = value; }
    // check if a given vertex is one of the vertices of the two crossing edges (i.e. if the crossing is relevant to a given vertex)
    relevantToVertex(vertex) {
        if (this.edges[0] && this.edges[1])
            return (this.edges[0].points[0] === vertex || this.edges[0].points[1] === vertex || this.edges[1].points[0] === vertex || this.edges[1].points[1] === vertex);
        return false;
    }
    // check if a crossing is legal
    checkLegal() {
        // self-crossing case
        if (this._edges[0] === this._edges[1]) {
            this._selfCrossing = true;
            this._legal = false;
            return;
        }
        // not self-crossing case
        const [v1, v2] = this._edges[0].points; // function is called after edges have been assigned
        const [v3, v4] = this._edges[1].points;
        // check if the vertices have a common endpoint
        if (v1 === v3 || v1 == v4 || v2 === v3 || v2 === v4)
            this._legal = false;
        else
            this._legal = true;
    }
    // check if the given crossing cros has the same edges as this crossing
    sameEdges(cros) {
        return (this._edges[0] === cros.edges[0] && this._edges[1] === cros.edges[1] || this._edges[0] === cros.edges[1] && this._edges[1] === cros.edges[0]);
    }
    // clone utility
    clone() {
        let newCrossing = new Crossing(this.subedges[0], this.subedges[1], this.x, this.y);
        newCrossing.legal = this._legal;
        newCrossing.more_than_once = this._more_than_once;
        newCrossing.label.cloneCharacteristics(this.label);
        return newCrossing;
    }
}
export class Bend extends Point {
    constructor(e, x, y) {
        const id = e.id + "/bend";
        super(id, x, y);
        this._edge = e;
        this.color = "#0000FF";
    }
    get edge() { return this._edge; }
    setId() { return this._edge.id + "/bend"; }
    // clone utility
    cloneCharacteristics(b) {
        this.size = b.size;
        this.color = b.color;
        this.label.cloneCharacteristics(b.label);
    }
    assignCharacteristics(size, color) {
        this.size = size;
        this.color = color;
    }
}
// Given an array of objects (e.g. Vertex, Edge) return an array of strings, containing the id's of the objects
function extractIds(items) {
    return items.map(item => item.id);
}
// Print the details of a Point array
function printPointArray(points) {
    for (const point of points)
        point.print();
}
export class Graph {
    get vertices() { return this._vertices; }
    get edges() { return this._edges; }
    get crossings() { return this._crossings; }
    get curve_complexity() { return this._curve_complexity; }
    get effective_crossing_update() { return this._effective_crossing_update; }
    // will be used in the cloning (Undo/Redo)
    set vertices(vert) { this._vertices = vert; }
    set edges(e) { this._edges = e; }
    set effective_crossing_update(update) { this._effective_crossing_update = update; }
    constructor(vertices = [], edges = [], updateCrossings = true) {
        this._vertices = [];
        this._edges = [];
        // characteristics of the graph
        this.directed = false;
        this.self_loops = false;
        this.simple = true;
        // store all the crossing points between edges of the graph
        this._crossings = [];
        // store the curve complexity of the graph
        this._curve_complexity = 0;
        // decide which method will be used for updating crossings
        this._effective_crossing_update = true;
        // counting temporary vertices
        this.tempCount = 0;
        // add the vertices to the graph
        this.addVertices(vertices);
        // add the edges
        for (const e of edges)
            if (this.checkEdgeId(e.points[0], e.points[1]))
                this._edges.push(e);
        if (updateCrossings)
            this.updateCrossings();
        this.updateCurveComplexity();
    }
    // update the curve complexity of the graph
    updateCurveComplexity() {
        let cc = 0;
        let edge_complexity = 0;
        for (const e of this._edges) {
            edge_complexity = e.bends.length;
            if (edge_complexity > cc)
                cc = edge_complexity;
        }
        this._curve_complexity = cc;
    }
    // add a new vertex
    addVertex(vertex) {
        //check that there is no vertex in the graph with the same name
        if (!extractIds(this._vertices).includes(vertex.id))
            this._vertices.push(vertex);
        else
            showCustomAlert("WARNING: Vertex with this name (" + vertex.id + ") already exist");
        // console.log("WARNING: Vertex with this name ("+vertex.id+") already exist")
    }
    // add an array of vertices
    addVertices(vertices) {
        for (const v of vertices)
            this.addVertex(v);
    }
    // add a new vertex to the graph at the specified position with the id of the max numerical ids and return the vertex
    addNewVertex(x = 0, y = 0) {
        let newVertex = new Vertex((this.maxVertexId() + 1).toString(), x, y);
        this.addVertex(newVertex);
        return newVertex;
    }
    // check if there exists a vertex in the graph with the given id
    vertexIdExists(id) { return extractIds(this._vertices).includes(id); }
    // given the id of a vertex, return the vertex
    getVertex(vrt_id) { return this._vertices.find(v => v.id === vrt_id); }
    // delete a vertex and all its corresponding edges
    deleteVertex(vertex) {
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
    deleteVertexId(vrt_id) {
        let vrt = this.getVertex(vrt_id);
        if (vrt)
            this.deleteVertex(vrt);
    }
    // move a vertex to a specified (x,y) location
    moveVertex(v, x, y, update = true) {
        v.moveTo(x, y);
        // update crossings
        if (update) {
            if (this._effective_crossing_update)
                this.updateCrossingsByVertex(v);
            else
                this.updateCrossings();
        }
    }
    // return the vertex near a specified (x,y) location (at distance < dist from (x,y) )
    // first check the array of vertices given
    // scale is used because the zoom scale might not be 1, but the vertices are shown at a fixed size regardless of the zoom
    getVertexAtPosition(x, y, scale = 1, vert = []) {
        // check vertices of the array
        for (const v of vert)
            if (Math.hypot(v.x - x, v.y - y) < (v.size + 3) / scale && !v.temporary)
                return v;
        // check all the vertices
        for (const v of this._vertices)
            if (Math.hypot(v.x - x, v.y - y) < (v.size + 3) / scale && !v.temporary)
                return v;
        return null;
    }
    renameVertex(vertex, newId) {
        if (!this._vertices.includes(vertex)) {
            console.log("vertex not in graph");
            return null;
        }
        if (extractIds(this._vertices).includes(newId)) {
            // console.log("Id already in use");
            showCustomAlert("Vertex Id already in use");
            return null;
        }
        vertex.id = newId;
        vertex.label.content = newId;
        // update the ids of the edges (and their bends) colliding to the vertex
        this._edges.forEach(e => {
            if (e.points[0] === vertex || e.points[1] === vertex) {
                // update edge id
                e.id = e.setId(e.points[0], e.points[1]);
                // update bend ids
                e.bends.forEach(b => { b.id = b.setId(); b.label.content = b.id; });
            }
        });
        // update crossings (so crossings ids are updated)
        if (this.effective_crossing_update)
            this.updateCrossingsByVertex(vertex);
        else
            this.updateCrossings();
        // return the vertex with the newId
        return vertex;
    }
    // given a (x,y) location, return the bend at distance < dist near this location
    getBendAtPosition(x, y, scale = 1, b = []) {
        // first check given bends
        for (const bend of b)
            if (Math.hypot(bend.x - x, bend.y - y) < (bend.size + 3) / scale)
                return bend;
        // check all the bends of the graph
        for (const e of this._edges)
            for (const bend of e.bends)
                if (Math.hypot(bend.x - x, bend.y - y) < (bend.size + 3) / scale)
                    return bend;
        return null;
    }
    // return the point (vertex or bend) at position (x,y)
    // first check the array of given points
    getPointAtPosition(x, y, scale = 1, points = []) {
        const pv = points.filter(p => p instanceof Vertex);
        const pb = points.filter(p => p instanceof Bend);
        const v = this.getVertexAtPosition(x, y, scale, pv);
        if (v)
            return v;
        else
            return this.getBendAtPosition(x, y, scale, pb);
    }
    // given the id of an edge, return the edge
    getEdge(edge_id) { return this._edges.find(e => e.id == edge_id); }
    // given 2 vertices, return the edge that connects them (if exists)
    getEdgeByVertices(v1, v2) { return this._edges.find(e => e.points[0] === v1 && e.points[1] == v2 || e.points[0] === v2 && e.points[1] == v1); }
    getEdgeByVerticesId(id1, id2) {
        const edge = this.getEdge(id1 + "-" + id2);
        if (edge)
            return edge;
        return this.getEdge(id2 + "-" + id1);
    }
    // add a new edge using the Id's of 2 vertices
    addEdgeId(id1, id2) {
        const v1 = this.getVertex(id1);
        const v2 = this.getVertex(id2);
        if (v1 && v2)
            return this.addEdge(v1, v2);
        // else
        //    console.log("WARNING: one or both of the vertices ("+id1+","+id2+") does not exist in the graph")
    }
    // add a new edge between 2 vertices
    addEdge(v1, v2, updateCrossings = true, showWarnings = true) {
        if (this.checkEdgeId(v1, v2, showWarnings)) {
            let edge = new Edge([v1, v2]);
            this._edges.push(edge);
            // update neighbors
            v1.addNeighbor(v2);
            v2.addNeighbor(v1);
            // update crossings
            if (updateCrossings) {
                if (this._effective_crossing_update)
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
    addEdgee(e, updateCrossings = true) {
        const v1 = e.points[0], v2 = e.points[1];
        if (this.checkEdgeId(v1, v2)) {
            this.edges.push(e);
            // update neighbors not necessary as the neighbors are already there
            // v1.addNeighbor(v2);
            // v2.addNeighbor(v1);
            // update crossings
            if (updateCrossings) {
                if (this._effective_crossing_update)
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
    checkEdgeId(v1, v2, showWarnings = true) {
        // first check that the 2 vertices belong to the graph
        if (!this._vertices.includes(v1) || !this._vertices.includes(v2)) {
            // console.log("WARNING: one or both of the vertices ("+v1.id+","+v2.id+") does not exist in the graph");
            if (showWarnings)
                showCustomAlert("WARNING: one or both of the vertices (" + v1.id + "," + v2.id + ") does not exist in the graph");
            return false;
        }
        // if vertices are temporary, check their neighbors
        /*if (v1.temporary)
            return this.checkEdgeId(v1.neighbors[0],v2);
        if (v2.temporary)
            return this.checkEdgeId(v1,v2.neighbors[0]);*/
        // check by id
        let edge_id1 = v1.id + '-' + v2.id;
        // if the graph is undirected, check reversed edge
        let edge_id2 = v2.id + '-' + v1.id;
        if (v1 === v2 && !this.self_loops) {
            // console.log("WARNING: Self loops are not allowed in this graph");
            if (showWarnings)
                showCustomAlert("WARNING: Self loops are not allowed in this graph");
            return false;
        }
        //check that the edge does not already exits
        else if (extractIds(this._edges).includes(edge_id1) && this.simple) {
            // console.log("WARNING: Edge " + edge_id1 + " already exists and the graph is simple");
            if (showWarnings)
                showCustomAlert("WARNING: Edge " + edge_id1 + " already exists and the graph is simple");
            return false;
        }
        // if the graph is undirected and simple, check reversed edge
        else if (!this.directed && this.simple && extractIds(this._edges).includes(edge_id2)) {
            // console.log("WARNING: Edge " + edge_id2 + " already exists");
            if (showWarnings)
                showCustomAlert("WARNING: Edge " + edge_id2 + " already exists and the graph is simple");
            return false;
        }
        return true;
    }
    // delete an edge given the Id's of the vertices
    deleteEdgeId(id1, id2) {
        let v1 = this.getVertex(id1);
        let v2 = this.getVertex(id2);
        if (v1 && v2)
            this.deleteEdge(v1, v2);
        else
            console.log("WARNING: one or both of the vertices (" + id1 + "," + id2 + ") does not exist in the graph");
    }
    // delete an edge between vertices v1 and v2
    deleteEdge(v1, v2, updateCrossings = true) {
        const e = this.getEdgeByVertices(v1, v2);
        if (e)
            this.deleteEdgee(e, updateCrossings);
    }
    // remove an edge from the graph
    deleteEdgee(e, updateCrossings = true) {
        // remove from edges list
        this._edges = this._edges.filter(edge => edge != e);
        // delete neighbors
        const v1 = e.points[0];
        const v2 = e.points[1];
        v1.deleteNeighbor(v2);
        v2.deleteNeighbor(v1);
        // update crossings
        if (updateCrossings) {
            if (this._effective_crossing_update && e)
                this._crossings = this._crossings.filter(cross => cross.edges[0] != e && cross.edges[1] != e);
            else
                this.updateCrossings();
        }
        // update curve complexity
        if (e && e.bends.length === this.curve_complexity)
            this.updateCurveComplexity();
    }
    // check if two STRAIGHT edges cross each other (return the crossing point) or not (return null)
    // source: https://www.youtube.com/watch?v=bvlIYX9cgls&t=155s
    straightCrossingPoint(sub1, sub2) {
        if (sub1 === sub2)
            return null;
        const p1 = sub1.points[0];
        const p2 = sub1.points[1];
        const p3 = sub2.points[0];
        const p4 = sub2.points[1];
        // first check if edges are parallel
        const b = (p4.x - p3.x) * (p2.y - p1.y) - (p4.y - p3.y) * (p2.x - p1.x);
        if (Math.abs(b) < 1e-10)
            return null;
        // compute constants a and c
        const a = (p4.x - p3.x) * (p3.y - p1.y) - (p4.y - p3.y) * (p3.x - p1.x);
        const c = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
        // compute coefficients alpha and beta
        const alpha = a / b;
        const beta = c / b;
        // crossing condition: 0 <= alpha <= 1 && 0 <= beta <= 1
        const accuracy = 1e-5;
        if (accuracy < alpha && alpha < 1 - accuracy && accuracy < beta && beta < 1 - accuracy) {
            const x0 = p1.x + alpha * (p2.x - p1.x);
            const y0 = p1.y + alpha * (p2.y - p1.y);
            return new Crossing(sub1, sub2, x0, y0);
        }
        return null;
    }
    // find all the crossing points between two (bended) edges
    crossingPoints(e1, e2) {
        let crossings = [];
        // if e1=e2, check for self-crossings
        if (e1 === e2) {
            const subEdges = e1.subEdges();
            for (let i = 0; i < subEdges.length - 1; i++)
                for (let j = i + 1; j < subEdges.length; j++) {
                    const crossing = this.straightCrossingPoint(subEdges[i], subEdges[j]);
                    if (crossing) {
                        crossing.edges = [e1, e1];
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
            for (const sub2 of subEdges2) {
                const crossing = this.straightCrossingPoint(sub1, sub2);
                if (crossing) {
                    crossing.edges = [e1, e2];
                    crossing.checkLegal();
                    crossings.push(crossing);
                }
            }
        return crossings;
    }
    // find all the crossings of the graph, examining each pair of edges
    findAllCrossings() {
        let totalCrossings = [];
        for (let i = 0; i < this._edges.length; i++)
            for (let j = i; j < this._edges.length; j++) {
                const crossings = this.crossingPoints(this._edges[i], this._edges[j]);
                totalCrossings = totalCrossings.concat(crossings);
            }
        return totalCrossings;
    }
    // update the crossings of an edge
    updateCrossingsByEdge(e) {
        // find all the crossings of the edge
        const edgeCrossings = this.findAllCrossingsFromEdge(e);
        // check for double or more crossings of the same pair of edges
        const len = edgeCrossings.length;
        for (let i = 0; i < len - 1; i++)
            for (let j = i + 1; j < len; j++)
                if (edgeCrossings[i].sameEdges(edgeCrossings[j])) {
                    edgeCrossings[i].more_than_once = true;
                    edgeCrossings[j].more_than_once = true;
                }
        // remove previous crossings of the edge
        this._crossings = this._crossings.filter(cross => cross.edges[0] != e && cross.edges[1] != e);
        // add the new crossings of the edge to the set of crossings
        this._crossings = this._crossings.concat(edgeCrossings);
    }
    // update crossings when moving a vertex
    updateCrossingsByVertex(v) {
        // find the edges that have vertex v as a point
        const edges = this._edges.filter(e => e.points[0] === v || e.points[1] === v);
        for (const edge of edges)
            this.updateCrossingsByEdge(edge);
    }
    // update crossings when moving a bend
    updateCrossingsByBend(b) { this.updateCrossingsByEdge(b.edge); }
    // move a bend and update the crossings
    moveBend(b, x, y) {
        b.moveTo(x, y);
        // update crossings
        if (this._effective_crossing_update)
            this.updateCrossingsByBend(b);
        else
            this.updateCrossings();
    }
    // move a point (vertex or bend)
    movePoint(p, x, y) {
        if (p instanceof Vertex)
            this.moveVertex(p, x, y);
        else if (p instanceof Bend)
            this.moveBend(p, x, y);
    }
    // update all the crossings of the graph
    updateCrossings() {
        this._crossings = this.findAllCrossings();
        const len = this._crossings.length;
        // check for double or more crossings of the same pair of edges
        for (let i = 0; i < len - 1; i++)
            for (let j = i + 1; j < len; j++)
                if (this._crossings[i].sameEdges(this._crossings[j])) {
                    this._crossings[i].more_than_once = true;
                    this._crossings[j].more_than_once = true;
                }
    }
    // split the crossings into categories
    crossingsCategories() {
        let self_crossings = 0;
        let neighbor_edge_crossings = 0;
        let multiple_crossings = 0;
        let legal_crossings = 0;
        for (const cros of this._crossings) {
            if (cros.selfCrossing) // self crossing
                ++self_crossings;
            else if (!cros.legal) // neighbor edge crossing
                ++neighbor_edge_crossings;
            else if (cros.more_than_once) // multiple crossing
                ++multiple_crossings;
            else // legal crossing
                ++legal_crossings;
        }
        return { self: self_crossings, neighbor: neighbor_edge_crossings, multiple: multiple_crossings, legal: legal_crossings };
    }
    // find all the crossings of a given edge with the other edges
    findAllCrossingsFromEdge(e) {
        let edgeCrossings = [];
        // console.log("findAllCrossingsFromEdge "+e.id);
        for (let i = 0; i < this._edges.length; i++) {
            // const e1 = this._edges[i];
            // console.log("edge:",e1.id);
            const crossings = this.crossingPoints(e, this._edges[i]);
            edgeCrossings = edgeCrossings.concat(crossings);
            //console.log(extractIds(edgeCrossings).toString());
        }
        return edgeCrossings;
    }
    // add a bend to an edge (given the vertices of the edge) to the given coordinates (or to the middlepoint of the vertices if coordinates not given)
    addBend(v, u, x, y, onEdge = true, updateCrossings = true) {
        let edge = this.getEdgeByVertices(v, u);
        let newBend;
        if (edge) {
            if (x !== undefined && y !== undefined)
                newBend = edge.addBend(x, y, onEdge);
            else {
                let midx = (v.x + u.x) / 2;
                let midy = (v.y + u.y) / 2;
                newBend = edge.addBend(midx, midy);
            }
            const edge_complexity = edge.bends.length;
            // update crossings
            if (updateCrossings) {
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
        else {
            console.log("Edge not found.");
            return null;
        }
    }
    // remove a given bend
    removeBend(bend) {
        const edge = bend.edge;
        const index = edge.bends.indexOf(bend);
        edge.bends.splice(index, 1);
        if (this.effective_crossing_update)
            this.updateCrossingsByEdge(edge);
        else
            this.updateCrossings();
        this.updateCurveComplexity();
    }
    // remove a bend from an edge (given the vertices of the edge) - the bend removed is the last one
    /* removeBendd(v: Vertex, u: Vertex)
    {
        let edge = this.getEdgeByVertices(v,u);
        if (edge)
        {
            edge.removeLastBend();
            // update curve complexity
            this.updateCurveComplexity();
            // update crossings
            if (this._effective_crossing_update)
                this.updateCrossingsByEdge(edge);
            else
                this.updateCrossings();
        }
        else
            console.log("Edge not found.")
    }*/
    // compute the thrackle number of the graph
    thrackleNumber() {
        let thrackle = this._edges.length * (this._edges.length + 1);
        for (const vertex of this._vertices) {
            const deg = vertex.neighbors.length;
            thrackle = thrackle - deg * deg;
        }
        return thrackle / 2;
    }
    // make the graph clique (use only non-temporary vertices)
    addAllEdges(vert = [], newEdgesColor = '#000000') {
        let nonTempVertices;
        if (vert.length > 0)
            nonTempVertices = vert;
        else
            nonTempVertices = this._vertices.filter(vertex => !vertex.temporary); // array with the non-temporary vertices
        let edge = null;
        for (const v1 of nonTempVertices)
            for (const v2 of nonTempVertices) {
                edge = this.addEdge(v1, v2, false, false); // don't update crossings and don't show warnings
                if (edge)
                    edge.color = newEdgesColor; // new edges (produced when creating clique) are displayed with a specific color
            }
        this.updateCrossings();
    }
    // place all the non-temporary vertices in a circle with center (x0,y0) and radius r
    makeCircle(x0 = 0, y0 = 0, r = 10, vert = []) {
        // place a selected group of vertices in a circle
        if (vert.length > 0) {
            vert.forEach((vertex, index) => {
                const angle = (index / vert.length) * 2 * Math.PI;
                this.moveVertex(vertex, x0 + Math.cos(angle) * r, y0 + Math.sin(angle) * r);
            });
        }
        else {
            const nonTempVertices = this._vertices.filter(vertex => !vertex.temporary); // array with the non-temporary vertices
            nonTempVertices.forEach((vertex, index) => {
                const angle = (index / nonTempVertices.length) * 2 * Math.PI;
                this.moveVertex(vertex, x0 + Math.cos(angle) * r, y0 + Math.sin(angle) * r, false); // don't update crossings for each vertex movement
            });
            this.updateCrossings();
        }
    }
    // place all the non-temporary vertices in a straightline
    straightLine(xDist = 50, y = 0, vert = []) {
        // place a selected group of vertices in a straight line
        if (vert.length > 0) {
            const half = vert.length / 2;
            vert.forEach((vertex, index) => {
                const xPos = (index - half) * xDist;
                this.moveVertex(vertex, xPos, y, false);
            });
        }
        else {
            const nonTempVertices = this._vertices.filter(vertex => !vertex.temporary); // array with the non-temporary vertices
            const half = this.vertices.length / 2;
            nonTempVertices.forEach((vertex, index) => {
                const xPos = (index - half) * xDist;
                this.moveVertex(vertex, xPos, y, false); // don't update crossings for each vertex movement
            });
        }
        this.updateCrossings();
    }
    // check if a given (x,y) point is near any edge of the graph and return the edge (at distance < dist)
    // if the point is near a bend of the edge, do not return the edge (used for drawing)
    isNearEdge(x, y, dist) {
        for (const edge of this._edges)
            if (edge.isNearPoint(x, y, dist)) {
                for (const bend of edge.bends)
                    if (Math.hypot(bend.x - x, bend.y - y) < 2 * dist)
                        return null;
                return edge;
            }
        return null;
    }
    // check if a given (x,y) point is near any vertex of the graph and return the vertex (at distance < dist)
    isNearVertex(x, y) {
        for (const vertex of this._vertices)
            if (Math.hypot(vertex.x - x, vertex.y - y) < vertex.size + 3)
                return vertex;
        return null;
    }
    // check if a given (x,y) point is near any vertex of a given array of vertices and return the vertex (at distance < dist)
    isNearVertices(x, y, v) {
        for (const vertex of v)
            if (Math.hypot(vertex.x - x, vertex.y - y) < vertex.size + 3)
                return vertex;
        return null;
    }
    // check if a given (x,y) point is near any bends of the graph and return the bend (at distance < dist)
    isNearBend(x, y, scale = 1) {
        for (const e of this._edges)
            for (const bend of e.bends)
                if (Math.hypot(bend.x - x, bend.y - y) < (bend.size + 2) / scale)
                    return bend;
        return null;
    }
    isNearCrossing(x, y, scale) {
        for (const cross of this._crossings)
            if (Math.hypot(cross.x - x, cross.y - y) < (cross.size + 2) / scale)
                return cross;
        return null;
    }
    // this function is used when the user creates a new edge, starting from a (probably temporary) vertex
    // given a vertex and a point(x,y), extend the edge from vertex to (x,y)
    // return the new vertex and the edge created
    extendEdge(v, x, y) {
        // create a temporary vertex to be able to create the edge
        const temp = new Vertex("t" + this.tempCount.toString(), x, y);
        temp.temporary = true;
        this.addVertex(temp);
        this.tempCount++;
        // this.extendEdgeToVertex(v,temp);
        // return the vertex
        return { vertex: temp, edge: this.extendEdgeToVertex(v, temp) };
    }
    // extend an unfinished edge (whose endpoint is vertex) to meet a newVertex
    extendEdgeToVertex(vertex, newVertex) {
        // check if the vertex is a temporary vertex
        if (vertex.temporary) {
            const neighbor = vertex.neighbors[0]; // if temporary, it has only one neighbor    
            const edge = this.addEdge(neighbor, newVertex); // create a new edge with the new temporary vertex
            if (!edge)
                return null;
            // update bends
            const prevEdge = this.getEdgeByVertices(neighbor, vertex);
            edge === null || edge === void 0 ? void 0 : edge.addBends(prevEdge.bends);
            edge === null || edge === void 0 ? void 0 : edge.addBend(vertex.x, vertex.y, false); // the previous temporary vertex now becomes the last bend of the new edge
            // remove temporary vertex from vertices
            this.deleteVertex(vertex);
            // update crossings
            this.updateCrossingsByEdge(edge);
            // printPointArray(edge!.bends);
            return edge;
        }
        else
            return this.addEdge(vertex, newVertex);
    }
    // check again. Maybe there's a better way to implement it
    addEdgeAdvanced(u, v) {
        if (!v.temporary)
            return this.extendEdgeToVertex(u, v);
        else if (!u.temporary)
            return this.extendEdgeToVertex(v, u);
        // both vertices temporary
        const uNeighbor = u.neighbors[0];
        const vNeighbor = v.neighbors[0];
        const edge = this.addEdge(uNeighbor, vNeighbor); // create a new edge between the two neighbors
        if (!edge)
            return null; // if edge not created, return null;
        // update bends and store them in the right order
        const uEdge = this.getEdgeByVertices(uNeighbor, u);
        const vEdge = this.getEdgeByVertices(vNeighbor, v);
        edge === null || edge === void 0 ? void 0 : edge.addBends(uEdge.bends);
        edge === null || edge === void 0 ? void 0 : edge.addBend(u.x, u.y, false); // the previous temporary vertex now becomes bend
        edge === null || edge === void 0 ? void 0 : edge.addBend(v.x, v.y, false); // the previous temporary vertex now becomes bend
        edge === null || edge === void 0 ? void 0 : edge.addBends(vEdge.bends.reverse()); // add them in reversed order
        // remove temporary vertices
        this.deleteVertex(u);
        this.deleteVertex(v);
        // update crossings
        this.updateCrossingsByEdge(edge);
        //printPointArray(edge!.bends);
        return edge;
    }
    // check if an edge can be created between a (probably temporary) starting vertex and an ending vertex
    checkEdgeExtension(starting, ending) {
        if (starting.temporary)
            return this.checkEdgeId(starting.neighbors[0], ending);
        return this.checkEdgeId(starting, ending);
    }
    // remove all the edges from the graph
    removeEdges() {
        this._edges = [];
        for (const v of this._vertices)
            v.clearNeighbors();
        this.updateCrossings();
    }
    // remove all the bends from the graph
    removeBends(updateCrossings = true) {
        for (const e of this._edges)
            e.removeBends();
        if (updateCrossings)
            this.updateCrossings();
    }
    getBends() {
        let bends = [];
        for (const e of this._edges)
            bends = bends.concat(e.bends);
        return bends;
    }
    // find which points of the graph are within a rectangle
    pointsInRect(x, y, width, height) {
        const pointsIn = [];
        // vertices
        for (const v of this._vertices)
            if (v.isIn(x, y, width, height) && !v.temporary)
                pointsIn.push(v);
        // bends
        for (const e of this._edges)
            for (const b of e.bends)
                if (b.isIn(x, y, width, height))
                    pointsIn.push(b);
        return pointsIn;
    }
    // find which edges of the graph are within a rectangle
    edgesInRect(x, y, width, height) {
        const edgesIn = [];
        for (const e of this._edges)
            if (e.isIn(x, y, width, height))
                edgesIn.push(e);
        return edgesIn;
    }
    // find the max Id of the vertices
    maxVertexId() {
        // Filter numeric strings and convert them to numbers
        const numericIds = extractIds(this._vertices).filter(id => /^\d+$/.test(id)).map(Number); // Convert to number
        //const numIds = extractIds(this._vertices).filter(id => Number.isNaN(id));
        //console.log("Numeric Ids:",numericIds);
        if (numericIds.length === 0)
            return 0;
        return Math.max(...numericIds);
    }
    // return the arrays of vertices and edges of the graph
    getGraph() {
        return { vertices: this._vertices, edges: this._edges };
    }
    // print the vertices and edges of the graph
    printGraph() {
        console.log("Graph vertices:", extractIds(this._vertices));
        console.log("Graph edges:", extractIds(this._edges));
    }
    printGraphDetails() {
        console.log("VERTICES:");
        for (const v of this._vertices)
            v.print();
        console.log("EDGES:", extractIds(this._edges));
    }
    // print the crossings of the graph
    printCrossings() {
        console.log("Crossings:", this._crossings.length);
        // printPointArray(this._crossings);
    }
    // Clone utility to store independent copies of graph
    clone() {
        const cloned = new Graph();
        // clone vertices
        for (const v of this._vertices) {
            cloned.addVertex(v.clone());
        }
        // clone edges and their characteristics
        for (const e of this.edges) {
            const newEdge = cloned.addEdgeId(e.points[0].id, e.points[1].id);
            newEdge.cloneCharacteristics(e);
        }
        // update crossings - consider cloning the crossings
        cloned.updateCrossings();
        cloned.updateCurveComplexity();
        return cloned;
    }
    // merge this graph with (a copy of) the given newGraph and return the new subgraph that represents newGraph and is now part of the big graph
    merge(newGraph, offset = { x: 0, y: 0 }) {
        const newSubGraph = new Graph();
        // create a map for the new vertices (of this graph) and vertices of the newGraph (so that the new edges can be created)
        const map = new Map();
        // merge vertices
        for (const v of newGraph.vertices) {
            let newVertex = this.addNewVertex(v.x + offset.x, v.y + offset.y);
            newVertex.cloneCharacteristics(v);
            map.set(v, newVertex);
            newSubGraph.addVertex(newVertex); // 
        }
        // merge edges
        for (const e of newGraph.edges) {
            const v1 = e.points[0];
            const v2 = e.points[1];
            let newEdge = null;
            newEdge = this.addEdge(map.get(v1), map.get(v2));
            if (newEdge) {
                newEdge.cloneCharacteristics(e, offset.x, offset.y);
                newSubGraph.addEdgee(newEdge, false);
            }
        }
        this.updateCrossings();
        this.updateCurveComplexity();
        return newSubGraph;
    }
    replace(newGraph) {
        this._vertices = newGraph.vertices;
        this._edges = newGraph.edges;
        this.directed = newGraph.directed;
        this.self_loops = newGraph.self_loops;
        this.simple = newGraph.simple;
        this._crossings = newGraph.crossings;
        this._curve_complexity = newGraph.curve_complexity;
        this.tempCount = newGraph.tempCount;
    }
}
// a helpful class for creating a bended edge
export class BendedEdgeCreator {
    constructor() {
        this._creatingEdge = false; // will be used to check if a new edge is being drawn
        this._startingVertex = null; // the vertex from which an edge starts
        this._edgeCreated = null; // the new edge that is being created during edge creation
    }
    get creatingEdge() { return this._creatingEdge; }
    get startingVertex() { return this._startingVertex; }
    get edgeCreated() { return this._edgeCreated; }
    set startingVertex(v) { this._startingVertex = v; }
    set creatingEdge(b) { this._creatingEdge = b; }
    set edgeCreated(e) { this._edgeCreated = e; }
}
