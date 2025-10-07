import { CanvasHandler } from "./canvasHandler.js";
import { Coords, Scaler } from "./zoomHelpers.js";
import { Cmenu } from "./contextMenu.js";
import { Graph } from "./graph.js";
import { Point, Vertex } from "./graphElements.js";
import { PaletteHandler } from "./paletteHandler.js";
import { Hover, Selector } from "./selector.js";
import { StateHandler } from "./stateHandler.js";
import { SettingsOptions } from "./settings.js";
import { RubbishBin } from "./rubbishBin.js";
import { MouseTool, EdgeCreationTool, MouseDraggingTool, SelectionRectangleTool } from "./mouseTools.js";
import { BendedEdgeCreator } from "./edgeCreator.js";
import { ContMenu } from "./contMenu.js";

export class MouseHandler
{
    // mouse
    private _mouse: {x: number,y: number} = {x:0, y:0 };
    // dragging
    private hasDragged = false;                     // will be used to distinguish vertex selection from vertex drag
    private canClick: boolean = true;               // is activated a click after an edge creation is done
    // new Vertex
    // private canAddVertex: boolean = true;
    private showingCtxMenu: boolean = false;
    // mousedown
    private mousedown: boolean = false;
    private clickedX: number = 0;                               // mouse x-coordinate at mousedown
    private clickedY: number = 0;                               // mouse y-coordinate at mousedown
    private positionsAtMouseDown: {x: number,y: number}[] = []; // positions of selected objects (points) at mousedown time
    // dragging Points
    private draggingPoints: Point[] = [];
    // moving labels
    private draggingLabelPoint: Point | null = null;
    // offsets
    private offsetX = 0;    // x-offset between click position and mouse's current position
    private offsetY = 0;    // y-offset between click position and mouse's current position

    get mouse() { return this._mouse; }

    constructor(graph: Graph,canvas: HTMLCanvasElement, worldCoords: Coords, cmenu: ContMenu, hover: Hover, selector: Selector, stateHandler: StateHandler, paletteHandler: PaletteHandler, settingsOptions: SettingsOptions, scaler: Scaler, myCanvasHandler: CanvasHandler, bendedEdgeCreator: BendedEdgeCreator, rubbishBin: RubbishBin)
    {
        // this.addEventListeners(graph, canvas, worldCoords, cmenu, hover, selector, stateHandler, paletteHandler, settingsOptions, scaler, myCanvasHandler, bendedEdgeCreator, rubbishBin);
        this.addEventListeners2(graph, canvas, worldCoords, cmenu, hover, selector, stateHandler, paletteHandler, settingsOptions, scaler, myCanvasHandler, bendedEdgeCreator, rubbishBin);
    }

    private addEventListeners(graph: Graph,canvas: HTMLCanvasElement, worldCoords: Coords, cmenu: Cmenu, hover: Hover, selector: Selector, stateHandler: StateHandler, paletteHandler: PaletteHandler, settingsOptions: SettingsOptions, scaler: Scaler, myCanvasHandler: CanvasHandler, bendedEdgeCreator: BendedEdgeCreator, rubbishBin: RubbishBin)
    {
        // mousedown
        canvas.addEventListener("mousedown", (e) => {

            // first updates
            canvas.focus(); // on click → ensures when you interact with the graph area, the canvas grabs focus again.
            worldCoords.update(scaler.screenToWorld(e.clientX, e.clientY));         // update worldCoords
            hover.check(scaler.scale);                                              // update hovered objects

            this.updateDraggingPoints(hover,selector,stateHandler);                 // update dragging points
            this.draggingLabelPointUpdate(bendedEdgeCreator,hover,stateHandler);    // label move detection
            if (selector.nothingSelected() && !bendedEdgeCreator.creatingEdge)      // starting vertex for edge creation
                bendedEdgeCreator.startingVertex = hover.vertex;

            this.showingCtxMenu = cmenu.clickOutsideActiveMenu(e);                  // update showingCtxMenu value here. If updated somewhere else, cmenu.showingContextMenu will get false and we will not be able to know if it was true before
            this.hasDragged = false;
            this.mousedown = true;
            this.clickedX = worldCoords.x;
            this.clickedY = worldCoords.y;
            // selection rectangle starting points
            selector.updateRectStart(worldCoords);
            // update palette state
            paletteHandler.updatePaletteState();
        });

        // detect vertex or bend moving
        canvas.addEventListener("mousemove", e => {

            canvas.focus(); // on click → ensures when you interact with the graph area, the canvas grabs focus again.
            // worldCoords = myCanvasHandler!.screenToWorld(e.clientX, e.clientY);
            worldCoords.update(scaler.screenToWorld(e.clientX, e.clientY));
            hover.check(scaler.scale);
            // update mouse position
            this._mouse = this.getMousePos(canvas, e);
            //update offset values
            this.offsetX = worldCoords.x - this.clickedX;
            this.offsetY = worldCoords.y - this.clickedY;
            // update hasDragged value
            if (this.mousedown && Math.hypot(this.offsetX,this.offsetY) > 3)
                this.hasDragged = true;

            this.startEdgeCreation(bendedEdgeCreator,selector,stateHandler);    // start edge creation (if necessary conditions hold)
            this.moveDraggingPoints(graph);                                     // move dragging points
            this.dragLabel(worldCoords,scaler.scale);                           // move dragging label
            this.updateSelectionRect(bendedEdgeCreator,selector,worldCoords,e); // update selection rectangle. THIS COMMAND MUST STAY LAST
            myCanvasHandler?.redraw();                                          // redraw
        });

        // detect vertex release
        canvas.addEventListener("mouseup", (e) => {

            worldCoords.update(scaler.screenToWorld(e.clientX, e.clientY));     // update worldCoords
            hover.check(scaler.scale);                                          // update hovered objects
            // continue or finish edge creation
            this.continueEdgeCreation(canvas,graph,bendedEdgeCreator,hover,scaler,settingsOptions,stateHandler,worldCoords,rubbishBin);
            // select objects in selection rectangle
            if(selector.isSelecting)
                selector.selectObjectsInRect(graph);
            // update values
            selector.isSelecting = false;
            this.draggingLabelPoint = null;
            this.draggingPoints.length = 0;
            // this.hasDragged = false;
            this.mousedown = false;
            myCanvasHandler?.redraw();
            // update palette state
            paletteHandler.updatePaletteState();
        });

        canvas.addEventListener("click", (e: MouseEvent) => {

            // if dragging cursor, don't consider it a click
            if (this.hasDragged || !this.canClick)
                return;
        
            // worldCoords = myCanvasHandler.screenToWorld(e.clientX, e.clientY);
            worldCoords.update(scaler.screenToWorld(e.clientX, e.clientY));
            // console.log("Clicked at screen ",e.clientX,e.clientY);
            hover.check(scaler.scale);

            // if nothing hovered or selected, add a new vertex at the clicked position
            this.createNewVertex(graph,hover,selector,stateHandler,settingsOptions,worldCoords);
            // select the hovered object
            selector.selectHovered(hover,e);

            myCanvasHandler?.redraw();              // redraw content
            paletteHandler.updatePaletteState();    // update palette state
        });
    }

    private addEventListeners2(graph: Graph,canvas: HTMLCanvasElement, worldCoords: Coords, cmenu: ContMenu, hover: Hover, selector: Selector, stateHandler: StateHandler, paletteHandler: PaletteHandler, settingsOptions: SettingsOptions, scaler: Scaler, myCanvasHandler: CanvasHandler, bendedEdgeCreator: BendedEdgeCreator, rubbishBin: RubbishBin)
    {
        const mouseDragger = new MouseDraggingTool(graph,hover,selector,stateHandler,worldCoords,scaler);
        const rectangleSelector = new SelectionRectangleTool(graph,selector,scaler,worldCoords,canvas);
        const edgeCreator = new EdgeCreationTool(canvas,graph,bendedEdgeCreator,hover,scaler,stateHandler,settingsOptions,rubbishBin,worldCoords);
        let currentTool: MouseTool = rectangleSelector;     // set as currentTool = rectangleSelector first, as the graph is empty

        // mousedown
        canvas.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // only left click (ignore right click and wheel click)
            this.mainUpdates(canvas,hover,worldCoords,scaler,e);
            // this.hasDragged = false;
            this.mousedown = true;
            this.showingCtxMenu = cmenu.clickOutsideActiveMenu(e);                  // update showingCtxMenu value here. If updated somewhere else, cmenu.showingContextMenu will get false and we will not be able to know if it was true before
            // check cases to select currentTool
            if (bendedEdgeCreator.creatingEdge || this.checkEdgeCreation(hover,selector,bendedEdgeCreator))
                currentTool = edgeCreator;
            else if (this.checkDragging(hover,selector))
                currentTool = mouseDragger;
            else
                currentTool = rectangleSelector;
            currentTool.onMouseDown(e);
            // update palette state
            paletteHandler.updatePaletteState();
            // redraw
            myCanvasHandler?.redraw();
        });
        // mousemove
        canvas.addEventListener('mousemove', (e) => {
            // don't consider mouse move when context menu is active
            if (cmenu.showingContextMenu)
                return;
            this.mainUpdates(canvas,hover,worldCoords,scaler,e);
            // update mouse position
            this._mouse = this.getMousePos(canvas, e);
            //update offset values
            this.offsetX = worldCoords.x - this.clickedX;
            this.offsetY = worldCoords.y - this.clickedY;
            // update hasDragged value
            if (this.mousedown && Math.hypot(this.offsetX,this.offsetY) > 3)
                this.hasDragged = true;
            currentTool.onMouseMove(e,this.hasDragged);
            // redraw
            myCanvasHandler?.redraw();
        })
        // mouseup
        canvas.addEventListener('mouseup', (e) => {
            if (e.button !== 0) return; // only left click (ignore right click and wheel click)
            this.mainUpdates(canvas,hover,worldCoords,scaler,e);    // main updates (update hover, worldCoords etc)
            if (!this.hasDragged && !bendedEdgeCreator.creatingEdge)   // it's a click
                this.onClick(graph,hover,selector,stateHandler,settingsOptions,worldCoords,e);
            currentTool.onMouseUp(e);                               // activate listner for mouseup in the current tool
            this.mousedown = false;                                 // update mousedown value
            this.hasDragged = false;                                // update hasDragged value
            myCanvasHandler?.redraw();                              // redraw
            paletteHandler.updatePaletteState();                    // update palette state
        })
    }

    private mainUpdates(canvas: HTMLCanvasElement, hover: Hover, worldCoords: Coords, scaler: Scaler, e: MouseEvent)
    {
        canvas.focus(); // on click → ensures when you interact with the graph area, the canvas grabs focus again.
        worldCoords.update(scaler.screenToWorld(e.clientX, e.clientY));         // update worldCoords
        hover.check(scaler.scale);                                              // update hovered objects
    }

    private onClick(graph: Graph, hover: Hover, selector: Selector, stateHandler: StateHandler, settingsOptions: SettingsOptions, worldCoords: Coords, e: MouseEvent)
    {
        // if nothing hovered or selected, add a new vertex at the clicked position
        this.createNewVertex(graph,hover,selector,stateHandler,settingsOptions,worldCoords);
        // select the hovered object
        selector.selectHovered(hover,e);
    }

    private checkDragging(hover: Hover, selector: Selector)
    {
        if (hover.point && selector.points.includes(hover.point) || hover.edge && selector.edges.includes(hover.edge) || hover.labelPoint)
            return true;
        return false;
    }

    private checkEdgeCreation(hover: Hover, selector: Selector, bendedEdgeCreator: BendedEdgeCreator)
    {
        if (selector.nothingSelected() && hover.vertex && !bendedEdgeCreator.creatingEdge)
            return true;
        return false;
    }

    // check if the clicked point belongs to the selected ones
    // if yes, set dragging points = selected points and store the positions of selected vertices at the time of mousedown
    private updateDraggingPoints(hover: Hover, selector: Selector, stateHandler: StateHandler)
    {
        if (hover.point && selector.points.includes(hover.point) || hover.edge && selector.edges.includes(hover.edge))
        {
            stateHandler.saveState();
            // selector.draggingPoints = selector.points;
            for (const point of selector.points)
                this.draggingPoints.push(point);
            // also add to dragging points the endpoints and bends of selected edges
            for (const se of selector.edges)
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

    /** Move the dragging points of the graph
     * 
     * @param graph 
     */
    private moveDraggingPoints(graph: Graph)
    {
    for (let i=0;i< this.draggingPoints.length;i++)
            graph.movePoint(this.draggingPoints[i], this.positionsAtMouseDown[i].x + this.offsetX, this.positionsAtMouseDown[i].y + this.offsetY);
    }

    private draggingLabelPointUpdate(bendedEdgeCreator: BendedEdgeCreator, hover: Hover, stateHandler: StateHandler)
    {
        if (!bendedEdgeCreator.creatingEdge)
            this.draggingLabelPoint = hover.labelPoint;
        if (this.draggingLabelPoint)
            stateHandler.saveState();
    }

    /**If the necessary conditions hold, drag the hovered label
     * Necessary conditions: a (shown) label is hovered and mouse is dragged
     * 
     * @param worldCoords 
     * @param scale 
     */
    private dragLabel(worldCoords: Coords, scale: number)
    {
        if (this.draggingLabelPoint /* && this.hasDragged*/ )
        {
            // make sure dragging label is not moved far away from the point
            const limit = Math.max(2*this.draggingLabelPoint.size+this.draggingLabelPoint.label.fontSize,40);
            this.draggingLabelPoint.label.offsetX = this.inLimits(worldCoords.x - this.draggingLabelPoint.x,limit/scale)*scale;
            this.draggingLabelPoint.label.offsetY = this.inLimits(- worldCoords.y + this.draggingLabelPoint.y,limit/scale)*scale;
        }
    }

    /** Update the selection rectangle's position and dimensions
     * Before updating, check that the necessary conditions hold.
     * Necessary conditions are the following:
     * --- mouse down and dragging
     * --- no dragging items (points or label)
     * --- no edge creating
     * 
     * @param bendedEdgeCreator 
     * @param selector 
     * @param worldCoords 
     * @param e 
     */
    private updateSelectionRect(bendedEdgeCreator: BendedEdgeCreator, selector: Selector, worldCoords: Coords, e: MouseEvent)
    {
        // check that necessary conditions hold before activating selection rectangle
        if (this.mousedown && this.hasDragged && !this.draggingItems() && !bendedEdgeCreator.creatingEdge && !e.ctrlKey && !e.metaKey)
            selector.isSelecting = true;
        // update rectangle position and dimensions
        if (selector.isSelecting)
            selector.updateRectangle(worldCoords);
    }

    /**
     * @returns true if there are dragging items in the canvas. Otherwise false
     */
    private draggingItems()
    {
        return (this.draggingPoints.length > 0 || this.draggingLabelPoint);
    }

    /** Check if a new edge can be created. If yes, start creating it
     * 
     * @param bendedEdgeCreator 
     * @param selector 
     * @param stateHandler 
     */
    private startEdgeCreation(bendedEdgeCreator: BendedEdgeCreator, selector: Selector, stateHandler: StateHandler)
    {
        if (this.mousedown && this.hasDragged && bendedEdgeCreator.startingVertex && selector.nothingSelected() && !bendedEdgeCreator.creatingEdge)    // creatingEdge is activated only if we have a starting vertex and no selected points
        {
            bendedEdgeCreator.creatingEdge = true;
            this.canClick = false;
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
                // const edge = graph.addEdgeAdvanced(bendedEdgeCreator.startingVertex,hover.vertex);
                const edge = bendedEdgeCreator.addEdgeAdvanced(graph,bendedEdgeCreator.startingVertex,hover.vertex);
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
                // let combo = graph.extendEdge(bendedEdgeCreator.startingVertex,worldCoords.x,worldCoords.y);
                let combo = bendedEdgeCreator.extendEdge(graph,bendedEdgeCreator.startingVertex,worldCoords.x,worldCoords.y);
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
        else
            this.canClick = true;
    }

    /**If the necessary condition hold, add a new vertex
     * Necessary conditions are the following:
     * --- click, no mousedown or drag
     * --- no hovered object (hovered label is accepted)
     * --- nothing selected
     * --- no context menu shown
     * 
     * @param graph 
     * @param hover 
     * @param selector 
     * @param stateHandler 
     * @param settingsOptions 
     * @param worldCoords 
     */
    private createNewVertex(graph: Graph, hover: Hover, selector: Selector, stateHandler: StateHandler, settingsOptions: SettingsOptions, worldCoords: Coords)
    {
        if (!hover.vertex && !hover.bend && !hover.edge && selector.nothingSelected() && !this.showingCtxMenu /*&& !this.draggingLabelPoint*/)
        {
            stateHandler.saveState();
            const vertex = graph.addNewVertex(worldCoords.x,worldCoords.y);
            this.updateVertexCharacteristics(vertex,settingsOptions);
        }
    }

    private updateVertexCharacteristics(vertex: Vertex, settingsOptions: SettingsOptions)
    {
        vertex.size = settingsOptions.vertexChars.size;
        vertex.shape = settingsOptions.vertexChars.shape;
        vertex.color = settingsOptions.vertexChars.color;
        vertex.label.fontSize = settingsOptions.defaultLabelFontSize;
        vertex.label.showLabel = (document.getElementById("vertex-show-labels") as HTMLInputElement)?.checked;
    }

    private isMouseNear(worldCoords: Coords, pos: {x: number, y: number}, dist: number)
    {
        // return Math.hypot(mouse.x-x,mouse.y-y)<dist;
        return Math.hypot(worldCoords.x-pos.x,worldCoords.y-pos.y)<dist;
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

    // return the pos of the mouse in the canvas
    private getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }
}