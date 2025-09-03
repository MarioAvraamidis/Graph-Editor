import { BendedEdgeCreator, Graph, Point } from "./graph.js";
import { RubbishBin } from "./rubbishBin.js";
import { Hover, Selector } from "./selector.js";
import { SettingsOptions } from "./settings.js";
import { StateHandler } from "./stateHandler.js";
import { Coords, Scaler } from "./zoomHelpers.js";

// Tool.ts
export interface MouseTool {
  onMouseDown(e: MouseEvent): void;
  onMouseMove(e: MouseEvent, hasDragged: boolean): void;
  onMouseUp(e: MouseEvent): void;
  // onClick(e: MouseEvent): void;
}

export class MouseDragger implements MouseTool
{
    // dragging Points
    private draggingPoints: Point[] = [];
    // moving labels
    private draggingLabelPoint: Point | null = null;
    // positions of selected objects (points) at mousedown time
    private positionsAtMouseDown: {x: number,y: number}[] = [];
    // offsets
    private offsetX = 0;    // x-offset between click position and mouse's current position
    private offsetY = 0;    // y-offset between click position and mouse's current position
    // clicked positions
    private clickedX: number = 0;                               // mouse x-coordinate at mousedown
    private clickedY: number = 0;                               // mouse y-coordinate at mousedown

    // instances from other classes
    private graph: Graph;
    private hover: Hover;
    private selector: Selector;
    private stateHandler: StateHandler;
    private scaler: Scaler;
    private worldCoords: Coords;

    constructor(graph: Graph, hover: Hover, selector: Selector, stateHandler: StateHandler, worldCoords: Coords, scaler: Scaler) 
    {
        this.graph = graph; this.hover = hover; this.selector = selector; this.stateHandler = stateHandler;
        this.worldCoords = worldCoords; this.scaler = scaler;
    };

    onMouseDown(e: MouseEvent): void {
        this.clickedX = this.worldCoords.x;
        this.clickedY = this.worldCoords.y;
        this.updateDraggingPoints(); 
        this.draggingLabelPointUpdate(); 
    }
    onMouseMove(e: MouseEvent, hasDragged: boolean): void {
        //update offset values
        this.offsetX = this.worldCoords.x - this.clickedX;
        this.offsetY = this.worldCoords.y - this.clickedY;
        this.moveDraggingPoints(this.graph);
        this.dragLabel(this.worldCoords,this.scaler.scale);
    }
    onMouseUp(e: MouseEvent): void {
        // set dragging element null
        this.draggingLabelPoint = null;
        this.draggingPoints.length = 0;
    }

    // check if the clicked point belongs to the selected ones
    // if yes, set dragging points = selected points and store the positions of selected vertices at the time of mousedown
    private updateDraggingPoints()
    {
        if (this.hover.point && this.selector.points.includes(this.hover.point) || this.hover.edge && this.selector.edges.includes(this.hover.edge))
        {
            this.stateHandler.saveState();
            // selector.draggingPoints = selector.points;
            for (const point of this.selector.points)
                this.draggingPoints.push(point);
            // also add to dragging points the endpoints and bends of selected edges
            for (const se of this.selector.edges)
            {
                this.draggingPoints.push(se.points[0]);
                this.draggingPoints.push(se.points[1]);
                for (const bend of se.bends)
                    this.draggingPoints.push(bend);
            }
            // save positions at mousedown
            this.positionsAtMouseDown = [];
            // for (let i=0;i<selector.points.length;i++)
                //  this.positionsAtMouseDown.push({x: selector.points[i].x,y: selector.points[i].y});
            for (let i=0;i<this.draggingPoints.length;i++)
                this.positionsAtMouseDown.push({x: this.draggingPoints[i].x,y: this.draggingPoints[i].y});
        }
    }

    private draggingLabelPointUpdate()
    {
        this.draggingLabelPoint = this.hover.labelPoint;
        if (this.draggingLabelPoint)
            this.stateHandler.saveState();
    }

    /** Move the dragging points of the graph
     * 
     * @param graph 
     */
    private moveDraggingPoints(graph: Graph)
    {
    for (let i=0;i< this.draggingPoints.length;i++)
            graph.movePoint(this.draggingPoints[i], this.positionsAtMouseDown[i].x + this.offsetX, this.positionsAtMouseDown[i].y + this.offsetY);
    }

    /**If the necessary conditions hold, drag the hovered label
     * Necessary conditions: a (shown) label is hovered and mouse is dragged
     * 
     * @param worldCoords 
     * @param scale 
     */
    private dragLabel(worldCoords: Coords, scale: number)
    {
        if (this.draggingLabelPoint)
        {
            // make sure dragging label is not moved far away from the point
            const limit = Math.max(2*this.draggingLabelPoint.size+this.draggingLabelPoint.label.fontSize,40);
            this.draggingLabelPoint.label.offsetX = this.inLimits(worldCoords.x - this.draggingLabelPoint.x,limit/scale)*scale;
            this.draggingLabelPoint.label.offsetY = this.inLimits(- worldCoords.y + this.draggingLabelPoint.y,limit/scale)*scale;
        }
    }

    // check if the given number is in [-limit, limit]. If not, return the nearest endpoint
    // limit must be non negative
    private inLimits(x: number, limit: number)
    {
        if (x < -limit)
            return -limit;
        if (x > limit)
            return limit;
        return x;
    }
}

export class RectangleSelector implements MouseTool
{
    private graph: Graph;
    private selector: Selector;
    private worldCoords: Coords;

    constructor(graph: Graph, selector: Selector, worldCoords: Coords)
    {
        this.graph = graph; this.selector = selector; this.worldCoords = worldCoords;
    }

    onMouseDown(e: MouseEvent): void {
        this.selector.updateRectStart(this.worldCoords);
    }
    onMouseMove(e: MouseEvent, hasDragged: boolean): void {
        this.updateSelectionRect(this.selector,this.worldCoords,e,hasDragged)
    }
    onMouseUp(e: MouseEvent): void {
        if(this.selector.isSelecting)
            this.selector.selectObjectsInRect(this.graph);
        // update values
        this.selector.isSelecting = false;
    }

    private updateSelectionRect(selector: Selector, worldCoords: Coords, e: MouseEvent, hasDragged: boolean)
    {
        // check that necessary conditions hold before activating selection rectangle
        if (/* this.mousedown &&*/ hasDragged && !e.ctrlKey && !e.metaKey)
            selector.isSelecting = true;
        // update rectangle position and dimensions
        if (selector.isSelecting)
            selector.updateRectangle(worldCoords);
    }
}

export class EdgeCreator implements MouseTool
{
    private canvas: HTMLCanvasElement;
    private graph: Graph;
    private bendedEdgeCreator: BendedEdgeCreator;
    private selector: Selector;
    private hover: Hover;
    private scaler: Scaler;
    private stateHandler: StateHandler;
    private settingsOptions: SettingsOptions;
    private rubbishBin: RubbishBin;
    private worldCoords: Coords;

    constructor(canvas: HTMLCanvasElement, graph: Graph, bendedEdgeCreator: BendedEdgeCreator, selector: Selector, hover: Hover, scaler: Scaler, stateHandler: StateHandler, settingsOptions: SettingsOptions, rubbishBin: RubbishBin, worldCoords: Coords)
    {
        this.canvas = canvas; this.graph = graph; this.bendedEdgeCreator = bendedEdgeCreator; this.selector = selector; this.hover = hover;
        this.scaler = scaler; this.stateHandler = stateHandler; this.settingsOptions = settingsOptions; this.rubbishBin = rubbishBin;
        this.worldCoords = worldCoords;
    }

    onMouseDown(e: MouseEvent): void {
        if (this.selector.nothingSelected() && !this.bendedEdgeCreator.creatingEdge)      // starting vertex for edge creation
                this.bendedEdgeCreator.startingVertex = this.hover.vertex;
    }
    onMouseMove(e: MouseEvent, hasDragged: boolean): void {
        this.startEdgeCreation(this.bendedEdgeCreator,this.selector,this.stateHandler,hasDragged);    // start edge creation (if necessary conditions hold)
    }
    onMouseUp(e: MouseEvent): void {
        this.continueEdgeCreation(this.canvas,this.graph,this.bendedEdgeCreator,this.hover,this.scaler,this.settingsOptions,this.stateHandler,this.worldCoords,this.rubbishBin)
    }

    /** Check if a new edge can be created. If yes, start creating it
     * 
     * @param bendedEdgeCreator 
     * @param selector 
     * @param stateHandler 
     */
    private startEdgeCreation(bendedEdgeCreator: BendedEdgeCreator, selector: Selector, stateHandler: StateHandler, hasDragged: boolean)
    {
        if (/*this.mousedown && */hasDragged && bendedEdgeCreator.startingVertex && selector.nothingSelected() && !bendedEdgeCreator.creatingEdge)    // creatingEdge is activated only if we have a starting vertex and no selected points
        {
            bendedEdgeCreator.creatingEdge = true;
            // this.canClick = false;
            stateHandler.saveState();
        }
    }

    private continueEdgeCreation(canvas: HTMLCanvasElement, graph: Graph, bendedEdgeCreator: BendedEdgeCreator, hover: Hover, scaler: Scaler, settingsOptions: SettingsOptions, stateHandler: StateHandler, worldCoords: Coords, rubbishBin: RubbishBin)
        {
        if (bendedEdgeCreator.startingVertex && bendedEdgeCreator.creatingEdge)
        {
            rubbishBin.updatePos(canvas,scaler);
            if (hover.vertex)  // add a straight edge
            {
                const edge = graph.addEdgeAdvanced(bendedEdgeCreator.startingVertex,hover.vertex);
                if (edge)   // check if the edge can be created, based on the restrictions for self loops, simple graph etc
                {
                    bendedEdgeCreator.startingVertex = null;
                    bendedEdgeCreator.creatingEdge = false;
                    // set characteristics for the new edge
                    edge.assignCharacteristics(settingsOptions.edgeChars.color, settingsOptions.edgeChars.dashed, settingsOptions.edgeChars.thickness);
                    edge.label.fontSize = settingsOptions.defaultLabelFontSize; // edge's label font size
                    edge.label.showLabel = (document.getElementById("edge-show-labels") as HTMLInputElement)?.checked;
                    edge.assignBendCharacteristics(settingsOptions.bendChars.color, settingsOptions.bendChars.size, (document.getElementById("bend-show-labels") as HTMLInputElement)?.checked );
                    // hasDragged = true;  // to not select the hover.vertex
                    // edgeCreated = edge;
                }
            }
            else if (this.isMouseNear(worldCoords, rubbishBin.pos,rubbishBin.radius/scaler.scale)) // stop creating vertex if clicked on the up-left corner (a bin should be drawn to show the option)
            {
                if (bendedEdgeCreator.edgeCreated !== null)   // delete the edge created
                    graph.deleteEdgee(bendedEdgeCreator.edgeCreated);
                if (bendedEdgeCreator.startingVertex !== null && bendedEdgeCreator.startingVertex.temporary)    // if startingVertex is temporary, delete it
                    graph.deleteVertex(bendedEdgeCreator.startingVertex);
                bendedEdgeCreator.edgeCreated = null;
                bendedEdgeCreator.startingVertex = null;
                bendedEdgeCreator.creatingEdge = false;
                stateHandler.pop();     // don't save state if no edge created (state saved when mousedown)
                // hasDragged = true;  // to not create a new edge when rubbish bin is clicked
            }
            else // continue creating a bended edge
            {
                // stateHandler.saveState();
                // let combo = graph.extendEdge(startingVertex,mouse.x,mouse.y);
                let combo = graph.extendEdge(bendedEdgeCreator.startingVertex,worldCoords.x,worldCoords.y);
                bendedEdgeCreator.startingVertex = combo.vertex;
                bendedEdgeCreator.edgeCreated = combo.edge;
                // set characteristics for the new edge
                if(bendedEdgeCreator.edgeCreated)
                {
                    bendedEdgeCreator.edgeCreated.assignCharacteristics(settingsOptions.edgeChars.color, settingsOptions.edgeChars.dashed, settingsOptions.edgeChars.thickness);
                    bendedEdgeCreator.edgeCreated.label.fontSize = settingsOptions.defaultLabelFontSize; // edge's label font size
                    bendedEdgeCreator.edgeCreated.assignBendCharacteristics(settingsOptions.bendChars.color, settingsOptions.bendChars.size /*, this.showBendLabel.checked*/ );
                }
            }
        }
        // else
           // this.canClick = true;
    }

    private isMouseNear(worldCoords: Coords, pos: {x: number, y: number}, dist: number)
    {
        // return Math.hypot(mouse.x-x,mouse.y-y)<dist;
        return Math.hypot(worldCoords.x-pos.x,worldCoords.y-pos.y)<dist;
    }
}