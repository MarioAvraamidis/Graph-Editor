import { Label } from "./labels.js";
export class Point {
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
    assignBendCharacteristics(color, size, showLabels = false) {
        this.bends.forEach(b => {
            b.color = color;
            b.size = size;
            b.label.showLabel = showLabels;
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
