export class MouseDraggingTool {
    constructor(graph, hover, selector, stateHandler, worldCoords, scaler) {
        // dragging Points
        this.draggingPoints = [];
        // moving labels
        this.draggingLabelPoint = null;
        // positions of selected objects (points) at mousedown time
        this.positionsAtMouseDown = [];
        // offsets
        this.offsetX = 0; // x-offset between click position and mouse's current position
        this.offsetY = 0; // y-offset between click position and mouse's current position
        // clicked positions
        this.clickedX = 0; // mouse x-coordinate at mousedown
        this.clickedY = 0; // mouse y-coordinate at mousedown
        this.graph = graph;
        this.hover = hover;
        this.selector = selector;
        this.stateHandler = stateHandler;
        this.worldCoords = worldCoords;
        this.scaler = scaler;
    }
    ;
    onMouseDown(e) {
        this.clickedX = this.worldCoords.x;
        this.clickedY = this.worldCoords.y;
        this.updateDraggingPoints();
        this.draggingLabelPointUpdate();
    }
    onMouseMove(e, hasDragged) {
        //update offset values
        this.offsetX = this.worldCoords.x - this.clickedX;
        this.offsetY = this.worldCoords.y - this.clickedY;
        this.moveDraggingPoints(this.graph);
        this.dragLabel(this.worldCoords, this.scaler.scale);
    }
    onMouseUp(e) {
        // set dragging element null
        this.draggingLabelPoint = null;
        this.draggingPoints.length = 0;
    }
    // check if the clicked point belongs to the selected ones
    // if yes, set dragging points = selected points and store the positions of selected vertices at the time of mousedown
    updateDraggingPoints() {
        if (this.hover.point && this.selector.points.includes(this.hover.point) || this.hover.edge && this.selector.edges.includes(this.hover.edge)) {
            this.stateHandler.saveState();
            // console.log("draggingPoints saveState()");
            // selector.draggingPoints = selector.points;
            for (const point of this.selector.points)
                this.draggingPoints.push(point);
            // also add to dragging points the endpoints and bends of selected edges
            for (const se of this.selector.edges) {
                this.draggingPoints.push(se.points[0]);
                this.draggingPoints.push(se.points[1]);
                for (const bend of se.bends)
                    this.draggingPoints.push(bend);
            }
            // save positions at mousedown
            this.positionsAtMouseDown = [];
            // for (let i=0;i<selector.points.length;i++)
            //  this.positionsAtMouseDown.push({x: selector.points[i].x,y: selector.points[i].y});
            for (let i = 0; i < this.draggingPoints.length; i++)
                this.positionsAtMouseDown.push({ x: this.draggingPoints[i].x, y: this.draggingPoints[i].y });
        }
    }
    draggingLabelPointUpdate() {
        this.draggingLabelPoint = this.hover.labelPoint;
        if (this.draggingLabelPoint) {
            this.stateHandler.saveState();
            // console.log("draggingLabel saveState()");
        }
    }
    /** Move the dragging points of the graph
     *
     * @param graph
     */
    moveDraggingPoints(graph) {
        for (let i = 0; i < this.draggingPoints.length; i++)
            graph.movePoint(this.draggingPoints[i], this.positionsAtMouseDown[i].x + this.offsetX, this.positionsAtMouseDown[i].y + this.offsetY);
    }
    /**If the necessary conditions hold, drag the hovered label
     * Necessary conditions: a (shown) label is hovered and mouse is dragged
     *
     * @param worldCoords
     * @param scale
     */
    dragLabel(worldCoords, scale) {
        if (this.draggingLabelPoint) {
            // make sure dragging label is not moved far away from the point
            const limit = Math.max(2 * this.draggingLabelPoint.size + this.draggingLabelPoint.label.fontSize, 40);
            this.draggingLabelPoint.label.offsetX = this.inLimits(worldCoords.x - this.draggingLabelPoint.x, limit / scale) * scale;
            this.draggingLabelPoint.label.offsetY = this.inLimits(-worldCoords.y + this.draggingLabelPoint.y, limit / scale) * scale;
        }
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
}
export class SelectionRectangleTool {
    constructor(graph, selector, scaler, worldCoords, canvas) {
        this.graph = graph;
        this.selector = selector;
        this.worldCoords = worldCoords;
        this.canvas = canvas;
        this.scaler = scaler;
    }
    onMouseDown(e) {
        // console.log("onMouseDown");
        this.selector.updateRectStart(this.worldCoords);
    }
    onMouseMove(e, hasDragged) {
        // console.log("onMouseMove");
        this.updateSelectionRect(this.selector, this.worldCoords, e, hasDragged);
    }
    onMouseUp(e) {
        // if(this.selector.isSelecting)
        //    this.selector.selectObjectsInRect(this.graph);
        // show button if selecting rectangle
        if (this.selector.isSelecting) {
            // give the option of exporting image
            const rect = this.selectionRectInCanvasCoords(this.selector, this.scaler);
            this.showExportButton(e, rect.x, rect.y, rect.width, rect.height, this.canvas);
            // select objects
            this.selector.selectObjectsInRect(this.graph);
        }
        // update values
        this.selector.isSelecting = false;
        // console.log("selection onMouseUp");
    }
    updateSelectionRect(selector, worldCoords, e, hasDragged) {
        // check that necessary conditions hold before activating selection rectangle
        if ( /* this.mousedown &&*/hasDragged && !e.ctrlKey && !e.metaKey) {
            // console.log("selecting");
            selector.isSelecting = true;
        }
        // update rectangle position and dimensions
        if (selector.isSelecting)
            selector.updateRectangle(worldCoords);
    }
    /**
     * Show an export button after the selection of a rectangle
     */
    showExportButton(e, x, y, w, h, canvas) {
        const btn = document.createElement("button");
        btn.textContent = "Export selected rectangle as image";
        btn.classList.add("export-btn-selection-rectangle");
        // Position near selection (relative to canvas in DOM)
        const rect = canvas.getBoundingClientRect();
        btn.style.position = "absolute";
        // btn.style.left = rect.left + x + w + 10 + "px"; // 10px offset to the right
        // btn.style.top = rect.top + y + h + "px";
        btn.style.left = e.clientX + 10 + "px";
        btn.style.top = e.clientY + "px";
        document.body.appendChild(btn);
        // Timeout remove
        const timeoutId = setTimeout(() => btn.remove(), 5000);
        // Export on click
        btn.addEventListener("click", () => {
            this.exportSelection(canvas, x, y, w, h);
            clearTimeout(timeoutId);
            btn.remove();
        });
        // Hide if another mouse action starts
        const hide = () => {
            clearTimeout(timeoutId);
            btn.remove();
            canvas.removeEventListener("mousedown", hide);
        };
        canvas.addEventListener("mousedown", hide);
    }
    /** Export the selected part of a canvas as a PNG image
     */
    exportSelection(canvas, x, y, w, h) {
        const dpr = window.devicePixelRatio || 1;
        const scaleX = canvas.width / canvas.clientWidth;
        const scaleY = canvas.height / canvas.clientHeight;
        // Convert CSS → internal pixels
        const px = x * scaleX;
        const py = y * scaleY;
        const pw = w * scaleX;
        const ph = h * scaleY;
        // Create offscreen canvas
        const offCanvas = document.createElement("canvas");
        offCanvas.width = Math.round(pw);
        offCanvas.height = Math.round(ph);
        const offCtx = offCanvas.getContext("2d");
        // Optional: white background
        offCtx.fillStyle = "white";
        offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);
        // Copy selected region
        offCtx.drawImage(canvas, px, py, pw, ph, 0, 0, offCanvas.width, offCanvas.height);
        // Export
        const link = document.createElement("a");
        link.download = "selection.png";
        link.href = offCanvas.toDataURL("image/png");
        link.click();
    }
    selectionRectInCanvasCoords(selector, scaler) {
        const { x, y } = scaler.worldToCanvas(selector.rect.x, selector.rect.y);
        const width = selector.rect.width * scaler.scale;
        const height = selector.rect.height * scaler.scale;
        return { x: x, y: y, width: width, height: height };
    }
}
export class EdgeCreationTool {
    constructor(canvas, graph, bendedEdgeCreator, hover, scaler, stateHandler, settingsOptions, rubbishBin, worldCoords) {
        this.canvas = canvas;
        this.graph = graph;
        this.bendedEdgeCreator = bendedEdgeCreator;
        this.hover = hover;
        this.scaler = scaler;
        this.stateHandler = stateHandler;
        this.settingsOptions = settingsOptions;
        this.rubbishBin = rubbishBin;
        this.worldCoords = worldCoords;
    }
    onMouseDown(e) {
        if (!this.bendedEdgeCreator.creatingEdge) // starting vertex for edge creation
            this.bendedEdgeCreator.startingVertex = this.hover.vertex;
    }
    onMouseMove(e, hasDragged) {
        this.startEdgeCreation(this.bendedEdgeCreator, this.stateHandler, hasDragged); // start edge creation (if necessary conditions hold)
    }
    onMouseUp(e) {
        this.continueEdgeCreation(this.canvas, this.graph, this.bendedEdgeCreator, this.hover, this.scaler, this.settingsOptions, this.stateHandler, this.worldCoords, this.rubbishBin);
    }
    /** Check if a new edge can be created. If yes, start creating it
     *
     * @param bendedEdgeCreator
     * @param selector
     * @param stateHandler
     */
    startEdgeCreation(bendedEdgeCreator, stateHandler, hasDragged) {
        // creatingEdge is activated only if the mouse is dragged, we have a starting vertex and there isn't edge creation in action
        if (hasDragged && bendedEdgeCreator.startingVertex && !bendedEdgeCreator.creatingEdge) {
            bendedEdgeCreator.creatingEdge = true;
            stateHandler.saveState();
            // console.log("edge creation started. state saved()");
            // stateHandler.graph.vertices.forEach(v => console.log(v.id));
        }
    }
    continueEdgeCreation(canvas, graph, bendedEdgeCreator, hover, scaler, settingsOptions, stateHandler, worldCoords, rubbishBin) {
        if (bendedEdgeCreator.startingVertex && bendedEdgeCreator.creatingEdge) {
            // console.log("starting vertex:",bendedEdgeCreator.startingVertex.id);
            rubbishBin.updatePos(canvas, scaler);
            if (hover.vertex) // add a straight edge
             {
                const edge = bendedEdgeCreator.addEdgeAdvanced(graph, bendedEdgeCreator.startingVertex, hover.vertex);
                if (edge) // check if the edge can be created, based on the restrictions for self loops, simple graph etc
                 {
                    bendedEdgeCreator.reset(); // reset bendedEdgeCreator
                    this.updateEdgeCharacteristics(edge, settingsOptions); // set characteristics for the new edge
                }
            }
            else if (this.isMouseNear(worldCoords, rubbishBin.pos, rubbishBin.radius / scaler.scale)) // stop creating vertex if clicked on the up-left corner (a bin should be drawn to show the option)
             {
                if (bendedEdgeCreator.edgeCreated) // delete the edge created
                    graph.deleteEdgee(bendedEdgeCreator.edgeCreated);
                if (bendedEdgeCreator.startingVertex && bendedEdgeCreator.startingVertex.temporary) // if startingVertex is temporary, delete it
                    graph.deleteVertex(bendedEdgeCreator.startingVertex);
                bendedEdgeCreator.reset(); // set bendedEdgeCreator values to none
                stateHandler.pop(); // don't save state if no edge created (state saved when mousedown)
            }
            else // continue creating a bended edge
             {
                // let combo = graph.extendEdge(bendedEdgeCreator.startingVertex,worldCoords.x,worldCoords.y);
                let combo = bendedEdgeCreator.extendEdge(graph, bendedEdgeCreator.startingVertex, worldCoords.x, worldCoords.y);
                bendedEdgeCreator.startingVertex = combo.vertex;
                bendedEdgeCreator.edgeCreated = combo.edge;
                // set characteristics for the new edge
                if (bendedEdgeCreator.edgeCreated)
                    this.updateEdgeCharacteristics(bendedEdgeCreator.edgeCreated, settingsOptions, true);
            }
        }
        // else
        // this.canClick = true;
    }
    isMouseNear(worldCoords, pos, dist) {
        // return Math.hypot(mouse.x-x,mouse.y-y)<dist;
        return Math.hypot(worldCoords.x - pos.x, worldCoords.y - pos.y) < dist;
    }
    /**Assign characteristics to the new edge according to settings
     *
     * @param edge
     * @param settingsOptions
     */
    updateEdgeCharacteristics(edge, settingsOptions, temporaryEdge = false) {
        var _a, _b;
        // edge characteristics
        edge.assignCharacteristics(settingsOptions.edgeChars.color, settingsOptions.edgeChars.dashed, settingsOptions.edgeChars.thickness);
        // bend characteristics
        if (!temporaryEdge)
            edge.assignBendCharacteristics(settingsOptions.bendChars.color, settingsOptions.bendChars.size, (_a = document.getElementById("bend-show-labels")) === null || _a === void 0 ? void 0 : _a.checked);
        else
            edge.assignBendCharacteristics(settingsOptions.bendChars.color, settingsOptions.bendChars.size);
        // label characteristics
        edge.label.fontSize = settingsOptions.defaultLabelFontSize;
        if (!temporaryEdge)
            edge.label.showLabel = (_b = document.getElementById("edge-show-labels")) === null || _b === void 0 ? void 0 : _b.checked;
    }
}
