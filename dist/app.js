// src/app.ts
import { Graph, Vertex, Bend } from "./graph.js";
import { CanvasHandler, Coords } from './canvasHandler.js';
import { ModalsHandler } from "./modals.js";
import { StateHandler } from "./stateHandler.js";
import { Selector, Copier, Hover } from "./selector.js";
import { BtnHandler } from "./buttons.js";
import { PaletteHandler } from "./paletteHandler.js";
import { Cmenu } from "./contextMenu.js";
// Create a graph instance
let graph = new Graph();
// undo/redo utilities
let stateHandler;
// mouse
let mouse;
// let worldCoords: {x: number, y: number};    // graph coordinates of cursor (used when transforming during zoom)
let worldCoords; // graph coordinates of cursor (used when transforming during zoom)
let offsetX = 0; // x-offset between click position and mouse's current position
let offsetY = 0; // y-offset between click position and mouse's current position
// dragging
let hasDragged = false; // will be used to distinguish vertex selection from vertex drag
// hovered objects
let hover;
// selected items
let selector;
// creating edge
let creatingEdge = false; // will be used to check if a new edge is being drawn
let startingVertex = null; // the vertex from which an edge starts
let canClick = true; // is activated a click after an edge creation is done
let edgeCreated = null; // the new edge that is being created during edge creation
const rubbishBinRadius = 50;
// new Vertex
let canAddVertex = true;
// mousedown
let mousedown = false;
let clickedX = 0; // mouse x-coordinate at mousedown
let clickedY = 0; // mouse y-coordinate at mousedown
let positionsAtMouseDown = []; // positions of selected objects (points) at mousedown time
// moving labels
let draggingLabelPoint = null;
// default colors for crossings
let modalsHandler;
// palette handler
let paletteHandler;
// context menu
let showingContextMenu = false;
// copy selected items
let copier;
// buttons handler
let btnHandler;
// context menu
let cmenu;
// zoom
let myCanvasHandler = null;
let scale = 1; // for all the elements that we want their size to remain the same regardless of the zoom scale, devide the size by scale
const dpr = window.devicePixelRatio || 1;
// output in report
const output = document.getElementById("output");
// universal variables
let canvas;
let ctx;
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Instantiate CanvasHandler, passing your renderGraph function as the drawing callback
        myCanvasHandler = new CanvasHandler('graphCanvas', renderGraph);
        worldCoords = new Coords();
        stateHandler = new StateHandler(graph);
        selector = new Selector();
        hover = new Hover(graph, worldCoords, selector);
        modalsHandler = new ModalsHandler(myCanvasHandler, stateHandler, hover);
        copier = new Copier();
        btnHandler = new BtnHandler(graph, myCanvasHandler, selector, stateHandler, copier, modalsHandler);
        paletteHandler = new PaletteHandler(selector, myCanvasHandler, stateHandler, graph);
        cmenu = new Cmenu(graph, worldCoords, canvas, copier, selector, stateHandler, myCanvasHandler, modalsHandler, hover);
        canvas = document.getElementById("graphCanvas");
        ctx = canvas.getContext("2d");
        if (!ctx)
            throw new Error("Could not get canvas rendering context");
        // don't show the modal when refreshing
        // modalsHandler?.hideAllModals();
        // addDashedEdgeEventListeners();
        addMouseEventListeners();
        renderGraph();
        // Example: If your graph data changes later (not due to zoom/pan),
        // and you need to force a redraw, you can call it like this:
        // const updateGraphDataButton = document.getElementById('updateGraphDataButton');
        // if (updateGraphDataButton) {
        //     updateGraphDataButton.addEventListener('click', () => {
        //         // ... logic to update your graph data ...
        //         myCanvasHandler?.redraw(); // Trigger a redraw
        //     });
        // }
    }
    catch (error) {
        console.error("Error initializing Canvas:", error);
    }
});
function renderGraph() {
    if (output) {
        // update scale
        if (myCanvasHandler)
            scale = myCanvasHandler.getScale();
        // const vertexList = graph.vertices.map(v => v.id).join(", ");
        // const edgeList = graph.edges.map(e => `(${e.points[0].id}-${e.points[1].id})`).join(", ");
        const crossings_categories = graph.crossingsCategories();
        const totalCrossingsSpan = document.getElementById("total-crossings");
        const selfCrossingsSpan = document.getElementById("self-crossings");
        const neighborCrossingsSpan = document.getElementById("neighbor-crossings");
        const multipleCrossingsSpan = document.getElementById("multiple-crossings");
        const legalCrossingsSpan = document.getElementById("legal-crossings");
        const thrackleNumberSpan = document.getElementById("thrackle-number");
        const curveComplexitySpan = document.getElementById("curve-complexity");
        if (totalCrossingsSpan)
            totalCrossingsSpan.textContent = `${graph.crossings.length}`;
        if (selfCrossingsSpan)
            selfCrossingsSpan.textContent = `${crossings_categories.self}`;
        if (neighborCrossingsSpan)
            neighborCrossingsSpan.textContent = `${crossings_categories.neighbor}`;
        if (multipleCrossingsSpan)
            multipleCrossingsSpan.textContent = `${crossings_categories.multiple}`;
        if (legalCrossingsSpan)
            legalCrossingsSpan.textContent = `${crossings_categories.legal}`;
        if (thrackleNumberSpan)
            thrackleNumberSpan.textContent = `${graph.thrackleNumber()}`;
        if (curveComplexitySpan)
            curveComplexitySpan.textContent = `${graph.curve_complexity}`;
        // Apply label colors based on data-color-key for crossings
        const labels = output.querySelectorAll('label[data-color-key]');
        labels.forEach(label => {
            const colorKey = label.getAttribute('data-color-key');
            if (colorKey && colorKey in modalsHandler.settingsOptions.crossings_colors) {
                label.style.color = modalsHandler.settingsOptions.crossings_colors[colorKey];
            }
        });
        // Apply label colors based on data-color-key for crossing edges labels on palette
        const highlightCrossingEdgeLabels = document.getElementById("edge-palette").querySelectorAll('label[data-color-key');
        highlightCrossingEdgeLabels.forEach(label => {
            const colorKey = label.getAttribute('data-color-key');
            if (colorKey && colorKey in modalsHandler.settingsOptions.crossing_edges_colors) {
                label.style.color = modalsHandler.settingsOptions.crossing_edges_colors[colorKey];
            }
        });
    }
    if (ctx)
        drawGraph(ctx, graph);
    paletteHandler.updatePaletteState();
}
function addMouseEventListeners() {
    // detect vertex/bend selection
    canvas.addEventListener("mousedown", (e) => {
        // set mouse position
        // mouse = getMousePos(canvas, e);
        // worldCoords = myCanvasHandler!.screenToWorld(e.clientX, e.clientY);
        worldCoords.update(myCanvasHandler.screenToWorld(e.clientX, e.clientY));
        // hide the menu when clicking anywhere else
        // Check if the click was outside the context menu
        if (cmenu.contextMenu && !cmenu.contextMenu.contains(e.target) && showingContextMenu) {
            cmenu.hideContextMenu();
            showingContextMenu = false;
            canAddVertex = false;
        }
        else
            canAddVertex = true;
        hover.check(scale);
        // check if the clicked point belongs to the selected ones
        // if yes, set dragging points = selected points and store the positions of selected vertices at the time of mousedown
        // hover.point = graph.getPointAtPosition(mouse.x, mouse.y);
        // hover.point = graph.getPointAtPosition(worldCoords.x, worldCoords.y,scale);
        if (hover.point && selector.points.includes(hover.point) || hover.edge && selector.edges.includes(hover.edge)) {
            stateHandler.saveState();
            selector.draggingPoints = selector.points;
            // also add to dragging points the endpoints and bends of selected edges
            for (const se of selector.edges) {
                selector.points.push(se.points[0]);
                selector.points.push(se.points[1]);
                for (const bend of se.bends)
                    selector.points.push(bend);
            }
            // save positions at mousedown
            positionsAtMouseDown = [];
            for (let i = 0; i < selector.points.length; i++)
                positionsAtMouseDown.push({ x: selector.points[i].x, y: selector.points[i].y });
        }
        // starting vertex for edge creation
        if (selector.points.length === 0 && !creatingEdge) // hasDragged for not setting starting vertex a selected vertex
         {
            startingVertex = hover.vertex;
            /*if (startingVertex)
                console.log("mousedown, startingVertex="+startingVertex.id);
            else
                console.log("mousedown, startingVertex = null");*/
        }
        // label move
        if (!creatingEdge)
            draggingLabelPoint = hover.labelPoint;
        hasDragged = false;
        mousedown = true;
        // save mouse position
        // clickedX = mouse.x;
        // clickedY = mouse.y;
        clickedX = worldCoords.x;
        clickedY = worldCoords.y;
        // selection rectangle starting points
        // selector.rectStart.x = mouse.x;
        // selector.rectStart.y = mouse.y;
        selector.rectStart.x = worldCoords.x;
        selector.rectStart.y = worldCoords.y;
    });
    // detect vertex or bend moving
    canvas.addEventListener("mousemove", e => {
        // update mouse position
        mouse = getMousePos(canvas, e);
        // worldCoords = myCanvasHandler!.screenToWorld(e.clientX, e.clientY);
        worldCoords.update(myCanvasHandler.screenToWorld(e.clientX, e.clientY));
        // offsetX = mouse.x - clickedX;
        // offsetY = mouse.y - clickedY;
        offsetX = worldCoords.x - clickedX;
        offsetY = worldCoords.y - clickedY;
        hover.check(scale);
        // console.log("mousemove:",mouse.x,mouse.y,clickedX,clickedY);
        if (mousedown && Math.hypot(offsetX, offsetY) > 3) {
            hasDragged = true;
            if (startingVertex && selector.points.length === 0 && !creatingEdge) // creatingEdge is activated only if we have a starting vertex and no selected points
             {
                creatingEdge = true;
                canClick = false;
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
        for (let i = 0; i < selector.draggingPoints.length; i++) {
            graph.movePoint(selector.draggingPoints[i], positionsAtMouseDown[i].x + offsetX, positionsAtMouseDown[i].y + offsetY);
            // console.log("vertex "+v.id,v.x,v.y);
            // renderGraph();
            myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
        }
        // label move
        if (draggingLabelPoint && hasDragged) {
            // make sure dragging label is not moved far away from the point
            const limit = Math.max(2 * draggingLabelPoint.size + draggingLabelPoint.label.fontSize, 40);
            draggingLabelPoint.label.offsetX = inLimits(worldCoords.x - draggingLabelPoint.x, limit / scale) * scale;
            draggingLabelPoint.label.offsetY = inLimits(-worldCoords.y + draggingLabelPoint.y, limit / scale) * scale;
        }
        // create a rectangle showing selected space
        if (selector.points.length === 0 && !creatingEdge && !e.ctrlKey && !e.metaKey && !draggingLabelPoint && mousedown && hasDragged) {
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
            myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
        }
        // renderGraph();
        myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
    });
    // detect vertex release
    canvas.addEventListener("mouseup", (e) => {
        // set mouse position
        // mouse = getMousePos(canvas, e);
        // worldCoords = myCanvasHandler!.screenToWorld(e.clientX,e.clientY);
        worldCoords.update(myCanvasHandler.screenToWorld(e.clientX, e.clientY));
        // check hovering
        hover.check(scale);
        if (startingVertex && creatingEdge) {
            const rect = canvas.getBoundingClientRect();
            const binPos = myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.screenToWorld(rect.left + rubbishBinRadius, rect.top + rubbishBinRadius);
            if (hover.vertex) // add a straight edge
             {
                const edge = graph.addEdgeAdvanced(startingVertex, hover.vertex);
                if (edge) // check if the edge can be created, based on the restrictions for self loops, simple graph etc
                 {
                    startingVertex = null;
                    creatingEdge = false;
                    // set characteristics for the new edge
                    edge.assignCharacteristics(paletteHandler.edgeChars.color, paletteHandler.edgeChars.dashed, paletteHandler.edgeChars.thickness);
                    edge.label.fontSize = modalsHandler.settingsOptions.defaultLabelFontSize; // edge's label font size
                    edge.assignBendCharacteristics(paletteHandler.bendChars.color, paletteHandler.bendChars.size);
                    // hasDragged = true;  // to not select the hover.vertex
                    // edgeCreated = edge;
                }
            }
            else if (binPos && isMouseNear(binPos.x, binPos.y, rubbishBinRadius / scale)) // stop creating vertex if clicked on the up-left corner (a bin should be drawn to show the option)
             {
                if (edgeCreated !== null) // delete the edge created
                    graph.deleteEdgee(edgeCreated);
                if (startingVertex !== null && startingVertex.temporary) // if startingVertex is temporary, delete it
                    graph.deleteVertex(startingVertex);
                edgeCreated = null;
                startingVertex = null;
                creatingEdge = false;
                stateHandler.pop(); // historyStack.pop();     // don't save state if no edge created (state saved when mousedown)
                // hasDragged = true;  // to not create a new edge when rubbish bin is clicked
            }
            else // continue creating a bended edge
             {
                // stateHandler.saveState();
                // let combo = graph.extendEdge(startingVertex,mouse.x,mouse.y);
                let combo = graph.extendEdge(startingVertex, worldCoords.x, worldCoords.y);
                startingVertex = combo.vertex;
                edgeCreated = combo.edge;
                // set characteristics for the new edge
                if (edgeCreated) {
                    edgeCreated.assignCharacteristics(paletteHandler.edgeChars.color, paletteHandler.edgeChars.dashed, paletteHandler.edgeChars.thickness);
                    edgeCreated.label.fontSize = modalsHandler.settingsOptions.defaultLabelFontSize; // edge's label font size
                    edgeCreated.assignBendCharacteristics(paletteHandler.bendChars.color, paletteHandler.bendChars.size);
                }
            }
        }
        else
            canClick = true;
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
        draggingLabelPoint = null;
        selector.draggingPoints = [];
        // hasDragged = false;
        mousedown = false;
        // renderGraph();
        myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
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
        if (hasDragged || !canClick || !myCanvasHandler)
            return;
        // console.log("click passed",selector.points.length);
        // worldCoords = myCanvasHandler.screenToWorld(e.clientX, e.clientY);
        worldCoords.update(myCanvasHandler.screenToWorld(e.clientX, e.clientY));
        // console.log("Clicked at screen ",e.clientX,e.clientY);
        hover.check(scale);
        // if nothing hovered or selected, add a new vertex at the clicked position
        if (!hover.vertex && !hover.bend && !hover.edge && !selector.points.length && !selector.edges.length && !draggingLabelPoint && canAddVertex) {
            stateHandler.saveState();
            // const vertex = graph.addNewVertex(mouse.x,mouse.y);
            const vertex = graph.addNewVertex(worldCoords.x, worldCoords.y);
            // console.log("new vertex at ",worldCoords.x, worldCoords.y);
            vertex.size = paletteHandler.vertexChars.size;
            vertex.shape = paletteHandler.vertexChars.shape;
            vertex.color = paletteHandler.vertexChars.color;
            vertex.label.fontSize = modalsHandler.settingsOptions.defaultLabelFontSize;
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
    });
}
// Allow clicking outside the modal content to close it 
/*if (settingsModal) {
    settingsModal.addEventListener('click', (event) => {
        if (event.target === settingsModal) { // Check if the click was directly on the modal background
            hideSettingsModal();
        }
    });
}*/
// check that no one of the main acts is in process
function nothingInProcess() { return !creatingEdge && !draggingLabelPoint && !hasDragged && !selector.isSelecting; }
// not sure if necessary
function selectEdge(e) {
    for (const bend of e.bends)
        if (!selector.bends.includes(bend))
            selector.bends.push(bend);
}
function isMouseNear(x, y, dist) {
    // return Math.hypot(mouse.x-x,mouse.y-y)<dist;
    return Math.hypot(worldCoords.x - x, worldCoords.y - y) < dist;
}
// check if the given number is in [-limit, limit]. If not, return the nearest endpoint
// limit must be non negative
function inLimits(x, limit) {
    if (x < -limit)
        return -limit;
    if (x > limit)
        return limit;
    return x;
}
// draw the graph
function drawGraph(ctx, graph, localCall = false, labels = true) {
    // if (localCall)
    // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // if (latexLabels)
    // clearLatexLabels();
    var _a, _b, _c, _d;
    // Draw edges first
    graph.edges.forEach(edge => { drawEdge(ctx, edge); });
    // Highlight crossing edges of selected edges
    const highlightCrossEdges = document.getElementById("highlight-crossing-edges").checked;
    if (highlightCrossEdges)
        highlightCrossingEdges();
    // Highlight non-crossing edges of selected edges
    const highlightNonCrossEdges = document.getElementById("highlight-non-crossing-edges").checked;
    if (highlightNonCrossEdges)
        highlightNonCrossingEdges();
    // Draw vertices
    graph.vertices.forEach(vertex => {
        if (vertex.temporary)
            shapeBend(ctx, vertex.x, vertex.y, paletteHandler.bendChars.size, paletteHandler.bendChars.color); // same color as bend class constructor
        else
            drawVertex(ctx, vertex, labels);
    });
    // show information for the hovering objects
    // hover.check(scale);
    showHoveredInfo();
    // Draw a temporary edge from starting vertex to mouse position and a rubbish bin to discard the new edge if necessary
    if (creatingEdge && startingVertex) {
        // console.log("startingVertex:", startingVertex.id);
        ctx.beginPath();
        ctx.moveTo(startingVertex.x, startingVertex.y);
        // ctx.lineTo(mouse.x, mouse.y);
        ctx.lineTo(worldCoords.x, worldCoords.y);
        // ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
        // apply characteristics of edgeChars
        ctx.strokeStyle = paletteHandler.edgeChars.color;
        ctx.lineWidth = paletteHandler.edgeChars.thickness / scale;
        if (paletteHandler.edgeChars.dashed)
            ctx.setLineDash([3 / scale, 3 / scale]); // dashed line
        ctx.stroke();
        // reset
        ctx.setLineDash([]);
        ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
        ctx.lineWidth = 2 / scale;
        // draw a bend at the cursor in the create Edge mode
        // if (!graph.isNearVertex(mouse.x,mouse.y) && currentMode === "createEdge")
        // shapeBend(ctx,mouse.x,mouse.y,bendRadius);
        // draw the rubbish bin
        if (creatingEdge) {
            const rect = canvas.getBoundingClientRect();
            const binPos = myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.screenToWorld(rect.left + rubbishBinRadius, rect.top + rubbishBinRadius);
            if (binPos)
                drawRubbishBin(ctx, binPos.x, binPos.y);
        }
    }
    // Draw crossings
    const output = document.getElementById("output");
    if (output) {
        const selfChecked = (_a = output.querySelector('#show-self')) === null || _a === void 0 ? void 0 : _a.checked;
        const neighborChecked = (_b = output.querySelector('#show-neighbor')) === null || _b === void 0 ? void 0 : _b.checked;
        const multipleChecked = (_c = output.querySelector('#show-multiple')) === null || _c === void 0 ? void 0 : _c.checked;
        const legalChecked = (_d = output.querySelector('#show-legal')) === null || _d === void 0 ? void 0 : _d.checked;
        drawCrossings(ctx, selfChecked, neighborChecked, multipleChecked, legalChecked);
    }
    // If hovering over an edge on add bend mode, show a bend (to add)
    // if (hover.edge && currentMode === "addBend") 
    // shapeBend(ctx,mouse.x,mouse.y,bendChars.size,bendChars.color);
    // draw selection rectangle
    if (selector.isSelecting) {
        ctx.strokeStyle = "rgba(15, 15, 62, 0.86)";
        ctx.lineWidth = 1 / scale;
        ctx.setLineDash([6 / scale]);
        ctx.strokeRect(selector.rect.x, selector.rect.y, selector.rect.width, selector.rect.height);
        ctx.setLineDash([]);
    }
}
// highlight the edges that cross any of the selected edges
function highlightCrossingEdges() {
    for (const cross of graph.crossings) {
        const e0 = cross.edges[0];
        const e1 = cross.edges[1];
        if (ctx && selector.edges.includes(e0) && !selector.edges.includes(e1))
            drawEdge(ctx, e1, 1);
        else if (ctx && selector.edges.includes(e1) && !selector.edges.includes(e0))
            drawEdge(ctx, e0, 1);
    }
}
// highlight the edges that do not cross any of the selected edges and have no common endpoint with any of them (i.e. can cross them)
function highlightNonCrossingEdges() {
    if (selector.edges.length === 0)
        return;
    // create a temporary parallel array for selected edges
    for (const edge of graph.edges) {
        let valid = true;
        // first check common endpoints with selected edges
        for (const e of selector.edges)
            if (e === edge || edge.commonEndpoint(e)) {
                valid = false;
                break;
            }
        if (!valid)
            continue;
        // if OK with selected vertices, check crossings
        for (const cross of graph.crossings)
            if (cross.edges[0] === edge && selector.edges.includes(cross.edges[1]) || cross.edges[1] === edge && selector.edges.includes(cross.edges[0])) {
                valid = false;
                break;
            }
        if (ctx && valid)
            drawEdge(ctx, edge, 2);
    }
}
// given a crossing, decide what its type is and return the appropriate color as a string
function crossingColor(cross) {
    if (cross.selfCrossing) // self-crossings
        return modalsHandler.settingsOptions.crossings_colors.self;
    else if (!cross.legal) // neighbor-edge crossings
        return modalsHandler.settingsOptions.crossings_colors.neighbor;
    else if (cross.more_than_once) // multiple crossings
        return modalsHandler.settingsOptions.crossings_colors.multiple;
    else // legal crossings
        return modalsHandler.settingsOptions.crossings_colors.legal;
}
function drawCrossings(ctx, self, neighbor, multiple, legal) {
    for (const cross of graph.crossings) {
        // different colors for different types of crossings
        if (cross.selfCrossing && self) // self-crossings
            drawCrossing(ctx, cross, modalsHandler.settingsOptions.crossings_colors.self);
        else if (!cross.legal && !cross.selfCrossing && neighbor) // neighbor-edge crossings
            drawCrossing(ctx, cross, modalsHandler.settingsOptions.crossings_colors.neighbor);
        else if (cross.legal && cross.more_than_once && multiple) // multiple crossings
            drawCrossing(ctx, cross, modalsHandler.settingsOptions.crossings_colors.multiple);
        else if (cross.legal && !cross.more_than_once && legal) // legal crossings
            drawCrossing(ctx, cross, modalsHandler.settingsOptions.crossings_colors.legal);
    }
}
function drawCrossing(ctx, cros, color) {
    ctx.beginPath();
    let radius = cros.size;
    if (cros === hover.crossing)
        radius = radius + 1;
    ctx.lineWidth = 2 / scale;
    ctx.arc(cros.x, cros.y, radius / scale, 0, 2 * Math.PI);
    ctx.strokeStyle = color;
    ctx.stroke();
    // label
    showPointLabel(ctx, cros);
}
// function for drawing a vertex
function drawVertex(ctx, v, labels = true) {
    let size = v.size;
    if (hover.vertex === v)
        size = size + 1;
    drawShape(ctx, v.x, v.y, v.shape, size, v.color, true); // scaling in drawShape function
    // Draw label
    if (labels)
        showPointLabel(ctx, v);
    // add an orange circle around a selected vertex
    if (selector.vertices.includes(v))
        drawShape(ctx, v.x, v.y, v.shape, v.size + 2, "#FFA500", false); // scaling in drawShape function
}
// display the label of the given point
function showPointLabel(ctx, p) {
    if (!p.label.showLabel)
        return;
    ctx.fillStyle = p.label.color;
    if (hover.labelPoint === p)
        ctx.fillStyle = "red";
    const adjustedFontSize = p.label.fontSize / scale;
    ctx.font = `${adjustedFontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    // we want the difference between the vertex and the label to remain the same regardless of the zoom scale, so we devide offsets by scale
    ctx.fillText(p.label.content, p.x + p.label.offsetX / scale, p.y - labelOffsetY(p) / scale); // positive is down in canvas
    ctx.fillStyle = "#000";
}
// display the label of the given edge
function showEdgeLabel(ctx, e) {
    if (!e.label.showLabel)
        return;
    ctx.fillStyle = e.label.color;
    //if (hoveredLabelEdge === e)
    //ctx.fillStyle = "red";
    const adjustedFontSize = e.label.fontSize / scale;
    ctx.font = `${adjustedFontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    e.updateLabelPos();
    // we want the difference between the vertex and the label to remain the same regardless of the zoom scale, so we devide offsets by scale
    ctx.fillText(e.label.content, e.labelPosX + e.label.offsetX / scale, e.labelPosY - e.label.offsetY / scale); // positive is down in canvas
    ctx.fillStyle = "#000";
}
function labelOffsetY(point) {
    return (point.size + point.label.offsetY + point.label.fontSize);
}
function renderLatexLabel(vertex) {
    let labelDiv = document.getElementById(`latex-label-${vertex.id}`);
    if (!labelDiv) {
        labelDiv = document.createElement("div");
        labelDiv.id = `latex-label-${vertex.id}`;
        labelDiv.style.position = "absolute";
        labelDiv.style.pointerEvents = "none"; // Make sure it doesn't block mouse events
        document.body.appendChild(labelDiv);
    }
    labelDiv.innerHTML = `\\(v_{${vertex.id}}\\)`; // LaTeX format
    labelDiv.style.left = `${canvas.offsetLeft + vertex.x + vertex.label.offsetX}px`; // adjust as needed
    labelDiv.style.top = `${canvas.offsetTop + vertex.y - labelOffsetY(vertex)}px`;
    MathJax.typesetPromise([labelDiv]); // re-render the LaTeX
}
function clearLatexLabels() {
    document.querySelectorAll('[id^="latex-label-"]').forEach(el => el.remove());
}
function showHoveredInfo() {
    if (creatingEdge || selector.draggingPoints.length > 0) {
        hideVertexInfo();
        hideEdgeInfo();
        hideCrossingInfo();
        return;
    }
    // show vertex info of hover.vertex
    if (hover.vertex)
        showVertexInfo(hover.vertex);
    else
        hideVertexInfo();
    // show crossing info of hover.crossing
    /*if (hover.crossing)
        showCrossingInfo(hover.crossing);
    else
        hideCrossingInfo();*/
    // show edge info of hover.vertex
    if (hover.edge)
        showEdgeInfo(hover.edge);
    else
        hideEdgeInfo();
}
// show a box with information about the hovered verted
function showVertexInfo(vertex) {
    const infoBox = document.getElementById("vertex-info");
    const rect = canvas.getBoundingClientRect();
    const neighborsList = vertex.neighbors.map(v => v.id).join(", ");
    const infoText = ` Vertex ID: ${vertex.id}<br>
                        Degree: ${vertex.neighbors.length}<br>
                        Neighbor(s): ${neighborsList}`;
    infoBox.innerHTML = infoText;
    // infoBox.style.left = `${rect.left + vertex.x - 100}px`;
    // infoBox.style.top = `${rect.top + vertex.y - 50}px`;
    const canvasPos = myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.worldToCanvas(vertex.x, vertex.y);
    if (canvasPos) {
        infoBox.style.left = `${rect.left + canvasPos.x + 10}px`;
        infoBox.style.top = `${rect.top + canvasPos.y + 10}px`;
    }
    infoBox.style.display = "block";
}
function hideVertexInfo() {
    const infoBox = document.getElementById("vertex-info");
    infoBox.style.display = "none";
}
// show a box with information about the hovered crossing
function showCrossingInfo(cross) {
    const infoBox = document.getElementById("crossing-info");
    const rect = canvas.getBoundingClientRect();
    let infoText;
    if (cross.selfCrossing) // self-crossing
        infoText = `Self-crossing`;
    else if (!cross.legal) // illegal crossing
        infoText = `Illegal crossing <br>
                    Edges: ${cross.edges[0].id} and ${cross.edges[1].id}`;
    else if (cross.more_than_once) // multiple crossing
        infoText = `Multiple crossing <br>
                    Edges: ${cross.edges[0].id} and ${cross.edges[1].id}`;
    else // legal crossing
        infoText = `Legal crossing <br>
                    Edges: ${cross.edges[0].id} and ${cross.edges[1].id}`;
    infoBox.innerHTML = infoText;
    // infoBox.style.left = `${cross.x + 30 }px`;
    // infoBox.style.top = `${cross.y + 50}px`;
    infoBox.style.left = `${mouse.x + rect.left + 5}px`;
    infoBox.style.top = `${mouse.y + rect.top + 5}px`;
    infoBox.style.display = "block";
}
function hideCrossingInfo() {
    const infoBox = document.getElementById("crossing-info");
    infoBox.style.display = "none";
}
// function for drawing a bend at position x,y
function drawBend(ctx, bend) {
    ctx.beginPath();
    ctx.lineWidth = 1 / scale;
    // show bigger bend when mouse near it
    let size = bend.size;
    if (bend === hover.bend)
        size = size + 1;
    ctx.arc(bend.x, bend.y, size / scale, 0, 2 * Math.PI); // small green circle
    ctx.fillStyle = bend.color;
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.lineWidth = 2 / scale;
    // add a dashed circle around a selected bend
    if (selector.bends.includes(bend))
        showSelectedPoint(ctx, bend);
    // label
    showPointLabel(ctx, bend);
}
// add a dashed circle around a selected point
function showSelectedPoint(ctx, p) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, (p.size + 3) / scale, 0, 2 * Math.PI);
    ctx.strokeStyle = "orange"; // or "#f39c12"
    // ctx.lineWidth = 3;
    ctx.setLineDash([5 / scale, 3 / scale]); // dashed circle
    ctx.stroke();
    // ctx.lineWidth = 2;
    ctx.setLineDash([]); // reset to solid for others
}
function drawShape(ctx, x, y, shape, size, color, fill = true) {
    ctx.beginPath();
    ctx.lineWidth = 2 / scale;
    size = size / scale;
    if (shape === "square")
        ctx.rect(x - size, y - size, size * 2, size * 2);
    else if (shape === "triangle") {
        ctx.moveTo(x, y - size);
        ctx.lineTo(x - size, y + size);
        ctx.lineTo(x + size, y + size);
        ctx.closePath();
    }
    else if (shape === "rhombus") {
        ctx.moveTo(x, y - size); // top
        ctx.lineTo(x + size, y); // right
        ctx.lineTo(x, y + size); // bottom
        ctx.lineTo(x - size, y); // left
        ctx.closePath();
    }
    else if (shape === "circle")
        ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    if (fill)
        ctx.fill();
    // ctx.strokeStyle = "#2980b9";
    //if ( (hover.vertex === vertex && !draggingVertex) || draggingVertex === vertex) // bold line for hovered vertex or dragging vertex
    //  ctx.lineWidth = 4;
    ctx.stroke();
}
function shapeBend(ctx, x, y, rad, color) {
    rad = rad / scale;
    ctx.beginPath();
    ctx.lineWidth = 1 / scale;
    // show bigger bend when mouse near it
    ctx.arc(x, y, rad, 0, 2 * Math.PI); // small green circle
    if (color !== undefined)
        ctx.fillStyle = color;
    else
        ctx.fillStyle = "#0000FF"; // same as color in bend class constructor
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.lineWidth = 2 / scale;
}
function drawEdge(ctx, edge, highlight = 0) {
    const v1 = edge.points[0];
    const v2 = edge.points[1];
    if (v1 && v2) {
        ctx.beginPath();
        ctx.moveTo(v1.x, v1.y);
        if (edge.dashed)
            ctx.setLineDash([5 / scale, 5 / scale]); // Dash pattern: [dashLength, gapLength]
        ctx.lineWidth = edge.thickness / scale;
        const bends = edge.bends;
        // draw the edge passing through bends
        for (let i = 0; i < bends.length; i++)
            ctx.lineTo(bends[i].x, bends[i].y);
        ctx.lineTo(v2.x, v2.y);
        ctx.strokeStyle = edge.color;
        // increase thickness if edge === hover.edge
        if (hover.edge === edge)
            ctx.lineWidth = (edge.thickness + 2) / scale;
        // highlight if the edge is one of the edges of a hovering crossing
        if (hover.crossing && hover.crossingEdges.includes(edge)) {
            ctx.lineWidth = (edge.thickness + 2) / scale; // increase thickness
            ctx.strokeStyle = crossingColor(hover.crossing); // highlight the edge with the color of the crossing
            ctx.setLineDash([]); // no dashed line
        }
        else if (highlight === 1) // highlight crossing edges of selected edges
         {
            ctx.lineWidth = (edge.thickness + 2) / scale;
            ctx.strokeStyle = modalsHandler.settingsOptions.crossing_edges_colors.crossing;
            ctx.setLineDash([]);
        }
        else if (highlight === 2) // highlight non-crossing edges of selected edges
         {
            ctx.lineWidth = (edge.thickness + 2) / scale;
            ctx.strokeStyle = modalsHandler.settingsOptions.crossing_edges_colors.nonCrossing;
            ctx.setLineDash([]);
        }
        ctx.stroke();
        // if the edge is selected, highlight it with a dashed colored line
        if (selector.edges.includes(edge)) // can be implemented faster by drawing all the selected edges first and then the others, so there's no need to check all the selector.vertices array for each edge
         {
            ctx.beginPath();
            ctx.moveTo(v1.x, v1.y);
            for (let i = 0; i < bends.length; i++)
                ctx.lineTo(bends[i].x, bends[i].y);
            ctx.lineTo(v2.x, v2.y);
            ctx.strokeStyle = "orange";
            ctx.setLineDash([5 / scale, 3 / scale]); // dashed line
            ctx.lineWidth = (edge.thickness + 1) / scale;
            ctx.stroke();
        }
        //reset
        ctx.setLineDash([]);
        ctx.lineWidth = edge.thickness / scale;
        // draw bends
        for (const bend of edge.bends)
            drawBend(ctx, bend);
        showEdgeLabel(ctx, edge);
    }
}
function showEdgeInfo(edge) {
    const infoBox = document.getElementById("edge-info");
    const rect = canvas.getBoundingClientRect();
    const infoText = ` Edge: ${edge.id}<br>
                        CC: ${edge.bends.length}`;
    infoBox.innerHTML = infoText;
    // infoBox.style.left = `${rect.left + mouse.x + 5}px`;
    // infoBox.style.top = `${rect.top + mouse.y + 5}px`;
    infoBox.style.left = `${rect.left + mouse.x + 10}px`;
    infoBox.style.top = `${rect.top + mouse.y + 10}px`;
    infoBox.style.display = "block";
}
function hideEdgeInfo() {
    const infoBox = document.getElementById("edge-info");
    infoBox.style.display = "none";
}
// return the pos of the mouse in the canvas
function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}
// draw a rubbish bin (when creating a new edge)
function drawRubbishBin(ctx, x, y) {
    ctx.save();
    if (isMouseNear(x, y, rubbishBinRadius / scale))
        ctx.strokeStyle = "red";
    else
        ctx.strokeStyle = "black";
    ctx.lineWidth = 2 / scale;
    // Draw bin body
    ctx.beginPath();
    ctx.rect(x, y, 20 / scale, 30 / scale);
    ctx.stroke();
    // Draw bin lid
    ctx.beginPath();
    ctx.moveTo(x - 5 / scale, y);
    ctx.lineTo(x + 25 / scale, y);
    ctx.stroke();
    // Draw handle
    ctx.beginPath();
    ctx.moveTo(x + 7 / scale, y - 5 / scale);
    ctx.lineTo(x + 13 / scale, y - 5 / scale);
    ctx.stroke();
    ctx.restore();
}
