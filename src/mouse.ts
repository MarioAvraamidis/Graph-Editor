import { CanvasHandler } from "./canvasHandler.js";
import { Coords, Scaler } from "./zoomHelpers.js";
import { Graph } from "./graph.js";
import { Vertex } from "./graphElements.js";
import { PaletteHandler } from "./paletteHandler.js";
import { Hover, Selector } from "./selector.js";
import { StateHandler } from "./stateHandler.js";
import { SettingsOptions } from "./settings.js";
import { RubbishBin } from "./rubbishBin.js";
import { MouseTool, EdgeCreationTool, MouseDraggingTool, SelectionRectangleTool } from "./mouseTools.js";
import { BendedEdgeCreator } from "./edgeCreator.js";
import { ContMenu } from "./contextMenu.js";

export class MouseHandler
{
    // mouse
    private _mouse: {x: number,y: number} = {x:0, y:0 };
    // dragging
    private hasDragged = false;                     // will be used to distinguish vertex selection from vertex drag
    // new Vertex
    // private canAddVertex: boolean = true;
    private showingCtxMenu: boolean = false;
    // mousedown
    private mousedown: boolean = false;
    private clickedX: number = 0;                               // mouse x-coordinate at mousedown
    private clickedY: number = 0;                               // mouse y-coordinate at mousedown
    // offsets
    private offsetX = 0;    // x-offset between click position and mouse's current position
    private offsetY = 0;    // y-offset between click position and mouse's current position

    get mouse() { return this._mouse; }

    constructor(graph: Graph,canvas: HTMLCanvasElement, worldCoords: Coords, cmenu: ContMenu, hover: Hover, selector: Selector, stateHandler: StateHandler, paletteHandler: PaletteHandler, settingsOptions: SettingsOptions, scaler: Scaler, myCanvasHandler: CanvasHandler, bendedEdgeCreator: BendedEdgeCreator, rubbishBin: RubbishBin)
    {
        this.addEventListeners2(graph, canvas, worldCoords, cmenu, hover, selector, stateHandler, paletteHandler, settingsOptions, scaler, myCanvasHandler, bendedEdgeCreator, rubbishBin);
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

    // return the pos of the mouse in the canvas
    private getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }
}