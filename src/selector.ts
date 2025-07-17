import { Graph, Point, Vertex, Edge, Bend, Crossing} from "./graph.js"
import { showCustomAlert } from "./alert.js";

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
            // array.length = 0;   // clear the array in place
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
}

export class Copier
{
    // copy selected items
    public rightClickPos: {x: number, y: number};       // coordinates of right click (will be used when copy/paste using context menu)
    public selectedClickedPos: {x: number, y: number};  // coordinates of the clicked object when copy from context menu
    public selectedVertices: Vertex[];
    public selectedEdges: Edge[];
    public menuCopy: boolean;
    public pasteOffset: {x:number, y: number};
    private copiedGraph: Graph;

    constructor()
    {
        this.rightClickPos = {x: 0, y: 0};
        this.selectedClickedPos = {x: 0, y: 0};
        this.selectedVertices = [];
        this.selectedEdges = [];
        this.pasteOffset = {x: 0, y: 0};
        this.menuCopy = false;
        this.copiedGraph = new Graph();
    }

    // Check if the vertices of the selector.edges are selected. If not, return false
    public checkSelected(selector: Selector)
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

    // store the selected items
    public copySelected(selector: Selector, menuCopy: boolean)
    {
        if (!this.checkSelected(selector))
        {
            showCustomAlert("Select both the vertices of the selected edges");
            return;
        }
        if (menuCopy)
            this.selectedClickedPos = {x: this.rightClickPos.x, y: this.rightClickPos.y};
        this.menuCopy = menuCopy;
        this.selectedVertices.length = 0;
        this.selectedEdges.length = 0;
        // IMPORTAAAAANTTTT Consider pushing a clone
        for (const v of selector.vertices)
            this.selectedVertices.push(v);
        for (const e of selector.edges)
            this.selectedEdges.push(e);
        // set pasteOffset to {0,0}
        this.pasteOffset = {x: 0, y: 0};
        this.copiedGraph = new Graph(selector.vertices,selector.edges,false);
    }

    // find and return the uppermost selected point
    public uppermostCopiedSelectedVertex()
    {
        if (this.selectedVertices.length === 0)
            return null;
        let maxYpoint = this.selectedVertices[0];
        for (let i=1; i<this.selectedVertices.length; i++)
            if (this.selectedVertices[i].y < maxYpoint.y)  // positive is down in canvas
                maxYpoint = this.selectedVertices[i];
        return maxYpoint;
    }

    // paste the copied items
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
                let uppermostPoint = this.uppermostCopiedSelectedVertex();
                if (uppermostPoint)
                    offset = {x: this.rightClickPos.x-uppermostPoint.x, y: this.rightClickPos.y - uppermostPoint.y};
            }
        }
        /*
        // create a map for the new and old vertices
        const map = new Map<Vertex, Vertex>();
        // set the new vertices and edges as selected
        selector.setNothingSelected();
        // copy vertices
        for (const v of this.selectedVertices)
        {
            let newVertex = graph.addNewVertex(v.x+offset.x, v.y+offset.y);
            newVertex.cloneCharacteristics(v);
            map.set(v,newVertex);
            selector.vertices.push(newVertex);
        }
        // copy edges
        // IMPORTANT: Make sure that checkSelected is run before pasting the new edges
        for (const e of this.selectedEdges)
        {
            const v1 = e.points[0];
            const v2 = e.points[1];
            let newEdge: Edge | null = null;
            if (v1 instanceof Vertex && v2 instanceof Vertex)
                newEdge = graph.addEdge(map.get(v1)!,map.get(v2)!)!;
            if (newEdge)
            {
                newEdge.cloneCharacteristics(e,offset.x,offset.y);
                selector.edges.push(newEdge);
            }
        }*/
        const subGraph = graph.merge(this.copiedGraph,offset);
        // update selected points
        selector.setNothingSelected();
        selector.vertices = subGraph.vertices;
        selector.edges = subGraph.edges;
        selector.pointsUpdate();
    }
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

    constructor() {this.setAllNull(); }

    public setAllNull()
    {
        this.vertex = null;
        this.bend = null;
        this.crossing = null;
        this.point = null;
        this.edge = null;
        this.crossingEdges = [null,null];
        this.labelPoint = null;
    }

    // detect the hovering object
    public check(graph: Graph, worldCoords: {x: number, y: number}, scale: number, vertices: Vertex[] )
    {
        this.setAllNull();
        this.vertex = graph.getVertexAtPosition(worldCoords.x, worldCoords.y, scale, vertices);
        if (this.vertex)
            this.point = this.vertex;
        else
        {
            this.bend = graph.isNearBend(worldCoords.x,worldCoords.y,scale);
            if (this.bend)
                this.point = this.bend;
            else
            {
                this.crossing = graph.isNearCrossing(worldCoords.x,worldCoords.y,scale);
                if (this.crossing)
                {
                    this.point = this.crossing;
                    this.crossingEdges = this.crossing.edges;
                }
                else
                    this.edge = graph.isNearEdge(worldCoords.x,worldCoords.y,3/scale);
            }
        }

        // find hoveredLabelPoint
        if (!this.vertex && !this.bend && !this.edge)
        {
            // check vertices first
            for (const v of graph.vertices)
                if (this.isNearLabel(v,worldCoords.x,worldCoords.y,scale))
                {
                    this.labelPoint = v;
                    break;
                }
            // check crossings
            if (!this.labelPoint)
                for (const cros of graph.crossings)
                    if (this.isNearLabel(cros,worldCoords.x,worldCoords.y,scale))
                    {
                        this.labelPoint = cros;
                        break;
                    }
            // check bends
            if (!this.labelPoint)
            {
                const bends = graph.getBends();
                for (const bend of bends)
                    if (this.isNearLabel(bend,worldCoords.x,worldCoords.y,scale))
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
        return (point.size + point.label.offsetY + point.label.fontSize);
    }
}