import { EdgeCreationTool, MouseDraggingTool, SelectionRectangleTool } from "./mouseTools.js";
export class MouseHandler {
    get mouse() { return this._mouse; }
    constructor(graph, canvas, worldCoords, cmenu, hover, selector, stateHandler, paletteHandler, settingsOptions, scaler, myCanvasHandler, bendedEdgeCreator, rubbishBin) {
        // mouse
        this._mouse = { x: 0, y: 0 };
        // dragging
        this.hasDragged = false; // will be used to distinguish vertex selection from vertex drag
        // new Vertex
        // private canAddVertex: boolean = true;
        this.showingCtxMenu = false;
        // mousedown
        this.mousedown = false;
        this.clickedX = 0; // mouse x-coordinate at mousedown
        this.clickedY = 0; // mouse y-coordinate at mousedown
        // offsets
        this.offsetX = 0; // x-offset between click position and mouse's current position
        this.offsetY = 0; // y-offset between click position and mouse's current position
        this.addEventListeners2(graph, canvas, worldCoords, cmenu, hover, selector, stateHandler, paletteHandler, settingsOptions, scaler, myCanvasHandler, bendedEdgeCreator, rubbishBin);
    }
    addEventListeners2(graph, canvas, worldCoords, cmenu, hover, selector, stateHandler, paletteHandler, settingsOptions, scaler, myCanvasHandler, bendedEdgeCreator, rubbishBin) {
        const mouseDragger = new MouseDraggingTool(graph, hover, selector, stateHandler, worldCoords, scaler);
        const rectangleSelector = new SelectionRectangleTool(graph, selector, scaler, worldCoords, canvas);
        const edgeCreator = new EdgeCreationTool(canvas, graph, bendedEdgeCreator, hover, scaler, stateHandler, settingsOptions, rubbishBin, worldCoords);
        let currentTool = rectangleSelector; // set as currentTool = rectangleSelector first, as the graph is empty
        // mousedown
        canvas.addEventListener('mousedown', (e) => {
            if (e.button !== 0)
                return; // only left click (ignore right click and wheel click)
            this.mainUpdates(canvas, hover, worldCoords, scaler, e);
            // this.hasDragged = false;
            this.mousedown = true;
            this.showingCtxMenu = cmenu.clickOutsideActiveMenu(e); // update showingCtxMenu value here. If updated somewhere else, cmenu.showingContextMenu will get false and we will not be able to know if it was true before
            // check cases to select currentTool
            if (bendedEdgeCreator.creatingEdge || this.checkEdgeCreation(hover, selector, bendedEdgeCreator))
                currentTool = edgeCreator;
            else if (this.checkDragging(hover, selector))
                currentTool = mouseDragger;
            else
                currentTool = rectangleSelector;
            currentTool.onMouseDown(e);
            // update palette state
            paletteHandler.updatePaletteState();
            // redraw
            myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
        });
        // mousemove
        canvas.addEventListener('mousemove', (e) => {
            // don't consider mouse move when context menu is active
            if (cmenu.showingContextMenu)
                return;
            this.mainUpdates(canvas, hover, worldCoords, scaler, e);
            // update mouse position
            this._mouse = this.getMousePos(canvas, e);
            //update offset values
            this.offsetX = worldCoords.x - this.clickedX;
            this.offsetY = worldCoords.y - this.clickedY;
            // update hasDragged value
            if (this.mousedown && Math.hypot(this.offsetX, this.offsetY) > 3)
                this.hasDragged = true;
            currentTool.onMouseMove(e, this.hasDragged);
            // redraw
            myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
        });
        // mouseup
        canvas.addEventListener('mouseup', (e) => {
            if (e.button !== 0)
                return; // only left click (ignore right click and wheel click)
            this.mainUpdates(canvas, hover, worldCoords, scaler, e); // main updates (update hover, worldCoords etc)
            if (!this.hasDragged && !bendedEdgeCreator.creatingEdge) // it's a click
                this.onClick(graph, hover, selector, stateHandler, settingsOptions, worldCoords, e);
            currentTool.onMouseUp(e); // activate listner for mouseup in the current tool
            this.mousedown = false; // update mousedown value
            this.hasDragged = false; // update hasDragged value
            myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw(); // redraw
            paletteHandler.updatePaletteState(); // update palette state
        });
    }
    mainUpdates(canvas, hover, worldCoords, scaler, e) {
        canvas.focus(); // on click → ensures when you interact with the graph area, the canvas grabs focus again.
        worldCoords.update(scaler.screenToWorld(e.clientX, e.clientY)); // update worldCoords
        hover.check(scaler.scale); // update hovered objects
    }
    onClick(graph, hover, selector, stateHandler, settingsOptions, worldCoords, e) {
        // if nothing hovered or selected, add a new vertex at the clicked position
        this.createNewVertex(graph, hover, selector, stateHandler, settingsOptions, worldCoords);
        // select the hovered object
        selector.selectHovered(hover, e);
    }
    checkDragging(hover, selector) {
        if (hover.point && selector.points.includes(hover.point) || hover.edge && selector.edges.includes(hover.edge) || hover.labelPoint)
            return true;
        return false;
    }
    checkEdgeCreation(hover, selector, bendedEdgeCreator) {
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
    createNewVertex(graph, hover, selector, stateHandler, settingsOptions, worldCoords) {
        if (!hover.vertex && !hover.bend && !hover.edge && selector.nothingSelected() && !this.showingCtxMenu /*&& !this.draggingLabelPoint*/) {
            stateHandler.saveState();
            const vertex = graph.addNewVertex(worldCoords.x, worldCoords.y);
            this.updateVertexCharacteristics(vertex, settingsOptions);
        }
    }
    updateVertexCharacteristics(vertex, settingsOptions) {
        var _a;
        vertex.size = settingsOptions.vertexChars.size;
        vertex.shape = settingsOptions.vertexChars.shape;
        vertex.color = settingsOptions.vertexChars.color;
        vertex.label.fontSize = settingsOptions.defaultLabelFontSize;
        vertex.label.showLabel = (_a = document.getElementById("vertex-show-labels")) === null || _a === void 0 ? void 0 : _a.checked;
    }
    // return the pos of the mouse in the canvas
    getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }
}
