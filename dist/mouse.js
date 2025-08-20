import { Bend, Vertex } from "./graph.js";
export class MouseHandler {
    // get creatingEdge() {return this._creatingEdge; }
    // get startingVertex() { return this._startingVertex; }
    get mouse() { return this._mouse; }
    get rubbishBinRadius() { return this._rubbishBinRadius; }
    constructor(graph, canvas, worldCoords, cmenu, hover, selector, stateHandler, paletteHandler, settingsOptions, scaler, myCanvasHandler, bendedEdgeCreator) {
        // mouse
        this._mouse = { x: 0, y: 0 };
        // dragging
        this.hasDragged = false; // will be used to distinguish vertex selection from vertex drag
        // creating edge
        // private bendedEdgeCreator: BendedEdgeCreator;
        // private _creatingEdge: boolean = false;          // will be used to check if a new edge is being drawn
        // private _startingVertex: Vertex | null = null;   // the vertex from which an edge starts
        this.canClick = true; // is activated a click after an edge creation is done
        // private edgeCreated: Edge | null = null;        // the new edge that is being created during edge creation
        this._rubbishBinRadius = 50;
        // new Vertex
        this.canAddVertex = true;
        // mousedown
        this.mousedown = false;
        this.clickedX = 0; // mouse x-coordinate at mousedown
        this.clickedY = 0; // mouse y-coordinate at mousedown
        this.positionsAtMouseDown = []; // positions of selected objects (points) at mousedown time
        // moving labels
        this.draggingLabelPoint = null;
        // offsets
        this.offsetX = 0; // x-offset between click position and mouse's current position
        this.offsetY = 0; // y-offset between click position and mouse's current position
        // showing labels
        this.showVertexLabel = document.getElementById("vertex-show-labels");
        this.showEdgeLabel = document.getElementById("edge-show-labels");
        this.showBendLabel = document.getElementById("bend-show-label");
        this.addEventListeners(graph, canvas, worldCoords, cmenu, hover, selector, stateHandler, paletteHandler, settingsOptions, scaler, myCanvasHandler, bendedEdgeCreator);
    }
    addEventListeners(graph, canvas, worldCoords, cmenu, hover, selector, stateHandler, paletteHandler, settingsOptions, scaler, myCanvasHandler, bendedEdgeCreator) {
        const draggingPoints = [];
        // detect vertex/bend selection
        canvas.addEventListener("mousedown", (e) => {
            // set mouse position
            // mouse = getMousePos(canvas, e);
            // worldCoords = myCanvasHandler!.screenToWorld(e.clientX, e.clientY);
            worldCoords.update(scaler.screenToWorld(e.clientX, e.clientY));
            // hide the menu when clicking anywhere else
            // Check if the click was outside the context menu
            if (cmenu.contextMenu && !cmenu.contextMenu.contains(e.target) && cmenu.showingContextMenu) {
                cmenu.hideContextMenu();
                cmenu.showingContextMenu = false;
                this.canAddVertex = false;
            }
            else
                this.canAddVertex = true;
            hover.check(scaler.scale);
            // check if the clicked point belongs to the selected ones
            // if yes, set dragging points = selected points and store the positions of selected vertices at the time of mousedown
            // hover.point = graph.getPointAtPosition(mouse.x, mouse.y);
            // hover.point = graph.getPointAtPosition(worldCoords.x, worldCoords.y,scaler.scale);
            if (hover.point && selector.points.includes(hover.point) || hover.edge && selector.edges.includes(hover.edge)) {
                stateHandler.saveState();
                // selector.draggingPoints = selector.points;
                for (const point of selector.points)
                    draggingPoints.push(point);
                // also add to dragging points the endpoints and bends of selected edges
                for (const se of selector.edges) {
                    draggingPoints.push(se.points[0]);
                    draggingPoints.push(se.points[1]);
                    for (const bend of se.bends)
                        draggingPoints.push(bend);
                }
                // save positions at mousedown
                this.positionsAtMouseDown = [];
                // for (let i=0;i<selector.points.length;i++)
                //  this.positionsAtMouseDown.push({x: selector.points[i].x,y: selector.points[i].y});
                for (let i = 0; i < draggingPoints.length; i++)
                    this.positionsAtMouseDown.push({ x: draggingPoints[i].x, y: draggingPoints[i].y });
            }
            // starting vertex for edge creation
            if (selector.points.length === 0 && !bendedEdgeCreator.creatingEdge) // hasDragged for not setting starting vertex a selected vertex
             {
                bendedEdgeCreator.startingVertex = hover.vertex;
                /*if (startingVertex)
                    console.log("mousedown, startingVertex="+startingVertex.id);
                else
                    console.log("mousedown, startingVertex = null");*/
            }
            // label move
            if (!bendedEdgeCreator.creatingEdge)
                this.draggingLabelPoint = hover.labelPoint;
            if (this.draggingLabelPoint)
                stateHandler.saveState();
            this.hasDragged = false;
            this.mousedown = true;
            // save mouse position
            // clickedX = mouse.x;
            // clickedY = mouse.y;
            this.clickedX = worldCoords.x;
            this.clickedY = worldCoords.y;
            // selection rectangle starting points
            // selector.rectStart.x = mouse.x;
            // selector.rectStart.y = mouse.y;
            selector.rectStart.x = worldCoords.x;
            selector.rectStart.y = worldCoords.y;
            // update palette state
            paletteHandler.updatePaletteState();
        });
        // detect vertex or bend moving
        canvas.addEventListener("mousemove", e => {
            // update mouse position
            this._mouse = this.getMousePos(canvas, e);
            // worldCoords = myCanvasHandler!.screenToWorld(e.clientX, e.clientY);
            worldCoords.update(scaler.screenToWorld(e.clientX, e.clientY));
            // offsetX = mouse.x - clickedX;
            // offsetY = mouse.y - clickedY;
            this.offsetX = worldCoords.x - this.clickedX;
            this.offsetY = worldCoords.y - this.clickedY;
            hover.check(scaler.scale);
            // console.log("mousemove:",mouse.x,mouse.y,clickedX,clickedY);
            if (this.mousedown && Math.hypot(this.offsetX, this.offsetY) > 3) {
                this.hasDragged = true;
                if (bendedEdgeCreator.startingVertex && selector.points.length === 0 && !bendedEdgeCreator.creatingEdge) // creatingEdge is activated only if we have a starting vertex and no selected points
                 {
                    bendedEdgeCreator.creatingEdge = true;
                    this.canClick = false;
                    stateHandler.saveState();
                }
                /*else
                {
                    // startingVertex = null;
                    creatingEdge = false;
                }*/
                // if (selector.points.length > 0)
                // stateHandler.saveState();
            }
            for (let i = 0; i < draggingPoints.length; i++) {
                graph.movePoint(draggingPoints[i], this.positionsAtMouseDown[i].x + this.offsetX, this.positionsAtMouseDown[i].y + this.offsetY);
                // console.log("vertex "+v.id,v.x,v.y);
                // renderGraph();
                // myCanvasHandler?.redraw();
            }
            // label move
            if (this.draggingLabelPoint && this.hasDragged) {
                // make sure dragging label is not moved far away from the point
                const limit = Math.max(2 * this.draggingLabelPoint.size + this.draggingLabelPoint.label.fontSize, 40);
                this.draggingLabelPoint.label.offsetX = this.inLimits(worldCoords.x - this.draggingLabelPoint.x, limit / scaler.scale) * scaler.scale;
                this.draggingLabelPoint.label.offsetY = this.inLimits(-worldCoords.y + this.draggingLabelPoint.y, limit / scaler.scale) * scaler.scale;
            }
            // create a rectangle showing selected space
            if (draggingPoints.length === 0 && !bendedEdgeCreator.creatingEdge && !e.ctrlKey && !e.metaKey && !this.draggingLabelPoint && this.mousedown && this.hasDragged) {
                selector.isSelecting = true;
                // console.log("creatingEdge=",creatingEdge);
            }
            // rectangle for selected space
            if (selector.isSelecting) {
                // console.log("is selecting = true, creatingEdge=",creatingEdge);
                // selector.rect.x = Math.min(selector.rectStart.x, mouse.x);
                // selector.rect.y = Math.min(selector.rectStart.y, mouse.y);
                // selector.rect.width = Math.abs(mouse.x - selector.rectStart.x);
                // selector.rect.height = Math.abs(mouse.y - selector.rectStart.y);
                selector.rect.x = Math.min(selector.rectStart.x, worldCoords.x);
                selector.rect.y = Math.min(selector.rectStart.y, worldCoords.y);
                selector.rect.width = Math.abs(worldCoords.x - selector.rectStart.x);
                selector.rect.height = Math.abs(worldCoords.y - selector.rectStart.y);
                // drawGraph(ctx, graph); // Redraw with selection box
                // myCanvasHandler?.redraw();
            }
            // renderGraph();
            myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
        });
        // detect vertex release
        canvas.addEventListener("mouseup", (e) => {
            // set mouse position
            // mouse = getMousePos(canvas, e);
            // worldCoords = myCanvasHandler!.screenToWorld(e.clientX,e.clientY);
            worldCoords.update(scaler.screenToWorld(e.clientX, e.clientY));
            // check hovering
            hover.check(scaler.scale);
            if (bendedEdgeCreator.startingVertex && bendedEdgeCreator.creatingEdge) {
                const rect = canvas.getBoundingClientRect();
                const binPos = scaler.screenToWorld(rect.left + this.rubbishBinRadius, rect.top + this.rubbishBinRadius);
                if (hover.vertex) // add a straight edge
                 {
                    const edge = graph.addEdgeAdvanced(bendedEdgeCreator.startingVertex, hover.vertex);
                    if (edge) // check if the edge can be created, based on the restrictions for self loops, simple graph etc
                     {
                        bendedEdgeCreator.startingVertex = null;
                        bendedEdgeCreator.creatingEdge = false;
                        // set characteristics for the new edge
                        edge.assignCharacteristics(settingsOptions.edgeChars.color, settingsOptions.edgeChars.dashed, settingsOptions.edgeChars.thickness);
                        edge.label.fontSize = settingsOptions.defaultLabelFontSize; // edge's label font size
                        edge.label.showLabel = this.showEdgeLabel.checked;
                        edge.assignBendCharacteristics(settingsOptions.bendChars.color, settingsOptions.bendChars.size /*, this.showBendLabel.checked*/);
                        // hasDragged = true;  // to not select the hover.vertex
                        // edgeCreated = edge;
                    }
                }
                else if (binPos && this.isMouseNear(worldCoords, binPos.x, binPos.y, this.rubbishBinRadius / scaler.scale)) // stop creating vertex if clicked on the up-left corner (a bin should be drawn to show the option)
                 {
                    if (bendedEdgeCreator.edgeCreated !== null) // delete the edge created
                        graph.deleteEdgee(bendedEdgeCreator.edgeCreated);
                    if (bendedEdgeCreator.startingVertex !== null && bendedEdgeCreator.startingVertex.temporary) // if startingVertex is temporary, delete it
                        graph.deleteVertex(bendedEdgeCreator.startingVertex);
                    bendedEdgeCreator.edgeCreated = null;
                    bendedEdgeCreator.startingVertex = null;
                    bendedEdgeCreator.creatingEdge = false;
                    stateHandler.pop(); // historyStack.pop();     // don't save state if no edge created (state saved when mousedown)
                    // hasDragged = true;  // to not create a new edge when rubbish bin is clicked
                }
                else // continue creating a bended edge
                 {
                    // stateHandler.saveState();
                    // let combo = graph.extendEdge(startingVertex,mouse.x,mouse.y);
                    let combo = graph.extendEdge(bendedEdgeCreator.startingVertex, worldCoords.x, worldCoords.y);
                    bendedEdgeCreator.startingVertex = combo.vertex;
                    bendedEdgeCreator.edgeCreated = combo.edge;
                    // set characteristics for the new edge
                    if (bendedEdgeCreator.edgeCreated) {
                        bendedEdgeCreator.edgeCreated.assignCharacteristics(settingsOptions.edgeChars.color, settingsOptions.edgeChars.dashed, settingsOptions.edgeChars.thickness);
                        bendedEdgeCreator.edgeCreated.label.fontSize = settingsOptions.defaultLabelFontSize; // edge's label font size
                        bendedEdgeCreator.edgeCreated.assignBendCharacteristics(settingsOptions.bendChars.color, settingsOptions.bendChars.size);
                    }
                }
            }
            else
                this.canClick = true;
            /*
            if (!hasDragged) {
                // It's a click, not a drag
                if (selectedVertex && v && selectedVertex !== v) {
                    stateHandler.saveState();
                    graph.addEdgeAdvanced(selectedVertex, v);
                    selectedVertex = null;
                }
                else if (selectedVertex && currentMode === "createEdge")
                {
                    stateHandler.saveState();
                    graph.extendEdge(selectedVertex,pos.x,pos.y);
                    selectedVertex = null;
                }
                else if (!v && !hover.edge && !selectedVertex) // if nothing selected, add a new vertex at the point clicked
                {
                    const vertex = new Vertex((graph.maxVertexId()+1).toString(),mouse.x,mouse.y);
                    graph.addVertex(vertex);
                }
                else {
                    selectedVertex = v;
                }
            }*/
            if (selector.isSelecting) {
                selector.points = graph.pointsInRect(selector.rect.x, selector.rect.y, selector.rect.width, selector.rect.height);
                // console.log("mouseup",selector.points.length);
                selector.vertices = selector.points.filter(v => v instanceof Vertex);
                selector.bends = selector.points.filter(v => v instanceof Bend);
                selector.edges = graph.edgesInRect(selector.rect.x, selector.rect.y, selector.rect.width, selector.rect.height);
                // selector.isSelecting = false;
            }
            // save state when moving
            // CHEEEEECK AGAAAAIIIIIIIIINNNNNNN
            //if (hasDragged && selector.draggingPoints.length > 0)
            //  stateHandler.saveState();
            selector.isSelecting = false;
            this.draggingLabelPoint = null;
            draggingPoints.length = 0;
            // hasDragged = false;
            this.mousedown = false;
            // renderGraph();
            myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
            // update palette state
            paletteHandler.updatePaletteState();
        });
        /* canvas.addEventListener("dblclick", (e) => {
            // const { x, y } = getMousePos(canvas, e);
            for (const v of graph.vertices) {
            if (isNearLabel(v, mouse.x, mouse.y)) {
                const newLabel = prompt("Enter new label:", v.id);
                if (newLabel !== null && !graph.vertexIdExists(newLabel)) {
                v.id = newLabel;  // changing the name needs a lot more changes (id changes of edges, bends etc)
                renderGraph();
                }
                break;
            }
            }
        });*/
        canvas.addEventListener("click", (e) => {
            // console.log("click")
            // if dragging cursor, don't consider it a click
            if (this.hasDragged || !this.canClick || !myCanvasHandler)
                return;
            // console.log("click passed",selector.points.length);
            // worldCoords = myCanvasHandler.screenToWorld(e.clientX, e.clientY);
            worldCoords.update(scaler.screenToWorld(e.clientX, e.clientY));
            // console.log("Clicked at screen ",e.clientX,e.clientY);
            hover.check(scaler.scale);
            // if nothing hovered or selected, add a new vertex at the clicked position
            if (!hover.vertex && !hover.bend && !hover.edge && !selector.points.length && !selector.edges.length && !this.draggingLabelPoint && this.canAddVertex) {
                stateHandler.saveState();
                // const vertex = graph.addNewVertex(mouse.x,mouse.y);
                const vertex = graph.addNewVertex(worldCoords.x, worldCoords.y);
                // console.log("new vertex at ",worldCoords.x, worldCoords.y);
                vertex.size = settingsOptions.vertexChars.size;
                vertex.shape = settingsOptions.vertexChars.shape;
                vertex.color = settingsOptions.vertexChars.color;
                vertex.label.fontSize = settingsOptions.defaultLabelFontSize;
                vertex.label.showLabel = this.showVertexLabel.checked;
                // hover.vertex = vertex;
            }
            // add a new bend in the addBend mode if hovering over an edge
            // IMPORTANT: the following piece of code (in the brackets of if) must remain below the above piece of code
            /* if (hover.edge && currentMode === "addBend") {
                stateHandler.saveState();
                const p1 = hover.edge.points[0];
                const p2 = hover.edge.points[1];
                if (p1 instanceof Vertex && p2 instanceof Vertex)
                    graph.addBend(p1,p2,worldCoords.x,worldCoords.y);
                    // graph.addBend(p1,p2,mouse.x,mouse.y);
                // set it free
                hover.edge = null;
                canvas.style.cursor = "default";
            }*/
            // select a vertex/bend/edge and update selected vertices
            if (hover.vertex)
                selector.select(hover.vertex, selector.vertices, e);
            else if (hover.bend)
                selector.select(hover.bend, selector.bends, e);
            else if (hover.edge)
                selector.select(hover.edge, selector.edges, e);
            else {
                selector.vertices.length = 0;
                selector.bends.length = 0;
                selector.edges.length = 0;
                // console.log("else",selector.vertices.length,selector.bends.length);
            }
            selector.pointsUpdate();
            // select a vertex label
            /*for (const v of graph.vertices) {
                if (isNearLabel(v, mouse.x, mouse.y)) {
                draggingLabelVertex = v;
                e.preventDefault();
                // return;
                }
            }*/
            // updatePaletteState();
            // renderGraph();
            myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
            // update palette state
            paletteHandler.updatePaletteState();
        });
    }
    isMouseNear(worldCoords, x, y, dist) {
        // return Math.hypot(mouse.x-x,mouse.y-y)<dist;
        return Math.hypot(worldCoords.x - x, worldCoords.y - y) < dist;
    }
    // check if the given number is in [-limit, limit]. If not, return the nearest endpoint
    // limit must be non negative
    inLimits(x, limit) {
        if (x < -limit)
            return -limit;
        if (x > limit)
            return limit;
        return x;
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
