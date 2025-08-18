import { Graph, Point, Vertex, Edge, Bend, Crossing} from "./graph.js"
import { showCustomAlert } from "./alert.js";
import { Coords } from "./zoomHelpers.js";

// class Selector is responsible for handling the objects (vertices, edges, bends) that the user selects
// It uses an array for each kind of objects and stores the selected items of that kind in the array
// The class is also responsible for selection of objects inside a selection rectangle (the class stores the position and dimensions of the selection rectangle)
export class Selector
{
    // selected objects
    public points: Point[];
    public vertices: Vertex[];
    public edges: Edge[];
    public bends: Bend[];
    // selection rectangle
    public rect: {x: number, y: number, width: number, height: number};
    public rectStart: {x: number, y: number};
    public isSelecting: boolean;
    // dragging points
    // public draggingPoints: Point[];

    constructor()
    {
        // selected objects
        this.points = [];
        this.vertices = [];
        this.edges= [];
        this.bends = [];
        // selection rectangle
        this.rect = { x: 0, y: 0, width: 0, height: 0 };
        this.rectStart = {x: 0, y: 0};
        this.isSelecting = false;
        // dragging points
        // this.draggingPoints = [];
    }

    // selected Points = selected Vertices & selected Bends
    public pointsUpdate()
    {
        this.points.length = 0;
        for (const v of this.vertices)
            this.points.push(v);
        for (const b of this.bends)
            this.points.push(b);
        // console.log("called", selectedPoints.length);
    }

    // set no object of the graph selected
    public setNothingSelected()
    {
        this.vertices.length = 0;
        this.bends.length = 0;
        this.edges.length = 0;
        this.pointsUpdate();
    }

    // select all the objects
    public selectAll(graph: Graph)
    {
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
        this.pointsUpdate();
    }

    // deletion of selected vertices (and removal of their corresponding edges and bends from selected objects)
    public deleteSelectedVertices(graph: Graph)
    {
        this.vertices.forEach(v => graph.deleteVertex(v));
        // remove the corresponding edges from selectedEdges
        this.edges = this.edges.filter(e => e.points[0] instanceof Vertex && !this.vertices.includes(e.points[0]) && e.points[1] instanceof Vertex && !this.vertices.includes(e.points[1]));
        // remove the corresponding bends from selectedBends
        this.bends = this.bends.filter(b => b.edge.points[0] instanceof Vertex && !this.vertices.includes(b.edge.points[0]) && b.edge.points[1] instanceof Vertex && !this.vertices.includes(b.edge.points[1]));
        // update selectedVertices
        this.vertices.length = 0;
    }

    // deletion of selected bends
    public deleteSelectedBends(graph: Graph)
    {
        this.bends.forEach(b => graph.removeBend(b));
        this.bends.length = 0;
    }

    // deletion of selected edges
    public deleteSelectedEdges(graph: Graph)
    {
        this.edges.forEach(e => graph.deleteEdgee(e));
        this.edges.length = 0;
    }

    public deleteSelectedObjects(graph: Graph)
    {
        this.deleteSelectedVertices(graph);
        this.deleteSelectedBends(graph);
        this.deleteSelectedEdges(graph);
        this.pointsUpdate();
        // checkHovered();
    }

    // Add the selected object (vertex, bend, edge) to the appropriate array of selected objects
    public select(obj: Object, array: Object[], e:MouseEvent)
    {
        // stateHandler.saveState();
        if (e.ctrlKey || e.metaKey)
        {
            const index = array.indexOf(obj);
            if (index > -1)     // remove the selected object from selected objects
                array.splice(index,1);
            else        // add the selected object to selected objects
            {
                array.push(obj);
                // if (obj instanceof Edge)
                // selectPointsOfSelectedEdge(obj);
            }
        }
        else    // if not control key pushed, remove all the selected objects and then add the selected one
        {
            this.setNothingSelected();
            array.push(obj);
            // if (obj instanceof Edge)
            // selectPointsOfSelectedEdge(obj);
        }
    }

    // not sure if necessary
    // when selecting an edge to delete it, its vertices will also be selected so they'll be deleted too (unless the user uses the delete button on the edge palette)
    public selectPointsOfSelectedEdge(edge: Edge)
    {
        if (edge.points[0] instanceof Vertex && edge.points[1] instanceof Vertex)
        {
            if (!this.vertices.includes(edge.points[0]))
                this.vertices.push(edge.points[0]);
            if (!this.vertices.includes(edge.points[1]))
                this.vertices.push(edge.points[1]);
        }
        for (const bend of edge.bends)
            if (!this.bends.includes(bend))
                this.bends.push(bend);
    }

    // select the vertices and edges of the given graph
    public selectGraph(graph: Graph)
    {
        this.setNothingSelected();
        this.vertices = graph.vertices;
        this.edges = graph.edges;
        this.bends = graph.getBends();
        this.pointsUpdate();
    }
}

export class Copier
{
    // copy selected items
    private _rightClickPos: {x: number, y: number};       // coordinates of right click (will be used when copy/paste using context menu)
    private selectedClickedPos: {x: number, y: number};  // coordinates of the clicked object when copy from context menu
    private menuCopy: boolean;                   // true if the user chooses copy from a context menu, false when the user uses shortcuts (ctrl+c) for copy
    private pasteOffset: {x:number, y: number};  // offset for pasting copied objects (necessary during consecutive ctrl+z's)
    private copiedGraph: Graph;                 // consider the copied items as a subgraph and store them as a graph

    get rightClickPos() { return this._rightClickPos; }
    set rightClickPos({x,y}: {x: number, y: number}) { this._rightClickPos = {x,y}; }

    constructor()
    {
        this._rightClickPos = {x: 0, y: 0};
        this.selectedClickedPos = {x: 0, y: 0};
        this.pasteOffset = {x: 0, y: 0};
        this.menuCopy = false;
        this.copiedGraph = new Graph();
    }

    // Check if the 2 vertices of the selector.edges are selected. If not, return false
    private checkSelected(selector: Selector)
    {
        for (const e of selector.edges)
        {
            const v1 = e.points[0];
            const v2 = e.points[1];
            if (v1 instanceof Vertex && !selector.vertices.includes(v1) || v2 instanceof Vertex && !selector.vertices.includes(v2))
                return false;   // fail
        }
        return true;
    }

    /** Store the selected items (as a new graph)
     * 
     * @param selector contains the selected vertices and edges to be copied
     * @param menuCopy indicates whether the user chose copy from a context menu or from keyboard shortcut (ctrl+z)
     * @returns 
     */
    public copySelected(selector: Selector, menuCopy: boolean)
    {
        // check if both vertices of the selected edges are selected
        // if not, inform the user to select the vertices of the selected edges in order to copy an edge
        if (!this.checkSelected(selector))
        {
            showCustomAlert("Select both vertices of the selected edges");
            return;
        }
        // if the user chose copy from the context menu, save the position of the click
        if (menuCopy)
            this.selectedClickedPos = {x: this.rightClickPos.x, y: this.rightClickPos.y};
        this.menuCopy = menuCopy;           // menuCopy update
        this.pasteOffset = {x: 0, y: 0};    // update value of pasteOffset to {0,0}
        // crete a subgraph using the selected vertices and edges
        this.copiedGraph = new Graph(selector.vertices,selector.edges,false);
    }

    /**find and return the uppermost selected vertex
     * 
     * @param vert 
     * @returns 
     */
    private uppermost(vert: Vertex[])
    {
        if (vert.length === 0)
            return null;
        let maxYpoint = vert[0];
        for (let i=1; i<vert.length; i++)
            if (vert[i].y < maxYpoint.y)  // positive is down in canvas
                maxYpoint = vert[i];
        return maxYpoint;
    }

    /** Add the copied items (already stored in copiedGraph) to the given graph
     * Also update the selector to select the new pasted items
     * If the user used keyboard shortcut for paste (ctrl+z), compute the position of the new pasted items
     * 
     * @param graph the main graph
     * @param selector for update of the selected items
     * @param pasteShortcut indicates if the user used keyboard shortcut (ctrl+Y) for paste
     */
    public pasteSelected(graph: Graph, selector: Selector, pasteShortcut: boolean)
    {
        // compute the offset between the copied objects and the new objects
        let offset = {x: 0, y: 0};
        if (pasteShortcut)
        {
            offset = {x: this.pasteOffset.x+50, y: this.pasteOffset.y+50}
            this.pasteOffset.x += 50; this.pasteOffset.y += 50;
        }
        else
        {
            if (this.menuCopy)
                offset = { x: this.rightClickPos.x-this.selectedClickedPos.x, y: this.rightClickPos.y - this.selectedClickedPos.y};
            else
            {
                // paste the uppermost selected point at the clicked position
                let uppermostPoint = this.uppermost(this.copiedGraph.vertices);
                if (uppermostPoint)
                    offset = {x: this.rightClickPos.x-uppermostPoint.x, y: this.rightClickPos.y - uppermostPoint.y};
            }
        }
        const subGraph = graph.merge(this.copiedGraph,offset);  // merge the new subgraph (of copied items) with the existing graph
        selector.selectGraph(subGraph);                         // update selected points
    }

    /** Return true if there exist at least one vertex in the copiedGraph
     * 
     * @returns true if there exist at least one vertex in the copiedGraph
     */
    //
    public canPaste() { return this.copiedGraph.vertices.length > 0; }
}

export class Hover
{
    // hovered objects
    public edge: Edge | null = null;
    public vertex: Vertex | null = null;
    public bend: Bend | null = null;
    public labelPoint: Point | null = null;
    public point: Point | null = null;
    public crossing: Crossing | null = null;
    public crossingEdges: [Edge | null, Edge | null] = [null,null];
    // instances of supportive classes
    private graph: Graph;
    private worldCoords: Coords;
    private selector: Selector;

    constructor(graph: Graph, worldCoords: Coords, selector: Selector)
    {
        this.graph = graph;
        this.worldCoords = worldCoords;
        this.selector = selector;
        this.setAllNull(); 
    }

    /**
     * Set all the objects null
     */
    private setAllNull()
    {
        this.vertex = null;
        this.bend = null;
        this.crossing = null;
        this.point = null;
        this.edge = null;
        this.crossingEdges = [null,null];
        this.labelPoint = null;
    }

    /** Detect the hovering object
     * 
     * @param scale 
     */
    public check(scale: number)
    {
        this.setAllNull();
        this.vertex = this.graph.getVertexAtPosition(this.worldCoords.x, this.worldCoords.y, scale, this.selector.vertices);
        if (this.vertex)
            this.point = this.vertex;
        else
        {
            this.bend = this.graph.isNearBend(this.worldCoords.x,this.worldCoords.y,scale);
            if (this.bend)
                this.point = this.bend;
            else
            {
                this.crossing = this.graph.isNearCrossing(this.worldCoords.x,this.worldCoords.y,scale);
                if (this.crossing)
                {
                    this.point = this.crossing;
                    this.crossingEdges = this.crossing.edges;
                }
                else
                    this.edge = this.graph.isNearEdge(this.worldCoords.x,this.worldCoords.y,3/scale);
            }
        }

        // find hoveredLabelPoint
        if (!this.vertex && !this.bend && !this.edge)
        {
            // check vertices first
            for (const v of this.graph.vertices)
                if (this.isNearLabel(v,this.worldCoords.x,this.worldCoords.y,scale))
                {
                    this.labelPoint = v;
                    break;
                }
            // check crossings
            if (!this.labelPoint)
                for (const cros of this.graph.crossings)
                    if (this.isNearLabel(cros,this.worldCoords.x,this.worldCoords.y,scale))
                    {
                        this.labelPoint = cros;
                        break;
                    }
            // check bends
            if (!this.labelPoint)
            {
                const bends = this.graph.getBends();
                for (const bend of bends)
                    if (this.isNearLabel(bend,this.worldCoords.x,this.worldCoords.y,scale))
                    {
                        this.labelPoint = bend;
                        break;
                    }
            }
        }
    }

    // check that mouse is near a label (in world coordinates)
    private isNearLabel(point: Point, x: number, y: number, scale: number): boolean {
        if (!point.label.showLabel)
            return false;   // return false if the point's label is not displayed
        const labelX = point.x + point.label.offsetX/scale;
        const labelY = point.y - this.labelOffsetY(point)/scale;    // check that label is positioned at these coordinates at drawVertex function
        const width = point.label.content.length*point.label.fontSize/scale;  
        const height = 1.3*point.label.fontSize/scale;
        return x >= labelX - width/2 && x <= labelX + width/2 &&
               y >= labelY && y <= labelY + height;
    }

    private labelOffsetY(point: Point)
    {
        return (point.size + point.label.offsetY /* + point.label.fontSize*/ );
    }
}