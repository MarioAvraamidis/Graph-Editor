// src/app.ts
import { Graph, BendedEdgeCreator } from "./graph.js";
import { CanvasHandler } from './canvasHandler.js';
import { Coords, Scaler } from "./zoomHelpers.js";
import { ModalsHandler } from "./modals.js";
import { StateHandler } from "./stateHandler.js";
import { Selector, Copier, Hover } from "./selector.js";
import { BtnHandler } from "./buttons.js";
import { PaletteHandler } from "./paletteHandler.js";
import { Cmenu } from "./contextMenu.js";
import { MouseHandler } from "./mouse.js";
import { Drawer } from "./draw.js";
import { SettingsOptions } from "./settings.js";
// Create a graph instance
let graph = new Graph();
// undo/redo utilities
let stateHandler;
// hovered objects
let hover;
// selected items
let selector;
// settings/default options
let settingsOptions;
// default colors for crossings
let modalsHandler;
// palette handler
let paletteHandler;
// copy selected items
let copier;
// buttons handler
let btnHandler;
// context menus
let cmenu;
// drawing
let drawer;
// creating bended edges
let bendedEdgeCreator;
// zoom
let scaler;
let myCanvasHandler = null;
let scale = 1; // for all the elements that we want their size to remain the same regardless of the zoom scale, devide the size by scale
// let worldCoords: {x: number, y: number};    // graph coordinates of cursor (used when transforming during zoom)
let worldCoords; // graph coordinates of cursor (used when transforming during zoom)
let mouseHandler; // handle mouse events (mousedown, mouseup, mousemove, click)
// output in report
const output = document.getElementById("output");
// universal variables
let canvas;
let ctx;
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Instantiate CanvasHandler, passing your renderGraph function as the drawing callback
        canvas = document.getElementById("graphCanvas");
        ctx = canvas.getContext("2d");
        scaler = new Scaler(canvas);
        // myCanvasHandler = new CanvasHandler('graphCanvas', renderGraph,scaler);
        worldCoords = new Coords();
        stateHandler = new StateHandler(graph);
        selector = new Selector();
        hover = new Hover(graph, worldCoords, selector);
        settingsOptions = new SettingsOptions(); // save settings options and palette options
        copier = new Copier();
        bendedEdgeCreator = new BendedEdgeCreator();
        drawer = new Drawer(selector, settingsOptions, hover, worldCoords, scaler, bendedEdgeCreator);
        myCanvasHandler = new CanvasHandler('graphCanvas', drawer, graph);
        paletteHandler = new PaletteHandler(selector, myCanvasHandler, stateHandler, graph, settingsOptions);
        modalsHandler = new ModalsHandler(myCanvasHandler, stateHandler, hover, settingsOptions);
        btnHandler = new BtnHandler(graph, myCanvasHandler, selector, stateHandler, copier, settingsOptions);
        cmenu = new Cmenu(graph, worldCoords, canvas, copier, selector, stateHandler, myCanvasHandler, modalsHandler, hover);
        mouseHandler = new MouseHandler(graph, canvas, worldCoords, cmenu, hover, selector, stateHandler, paletteHandler, settingsOptions, scaler, myCanvasHandler, bendedEdgeCreator);
        if (!ctx)
            throw new Error("Could not get canvas rendering context");
        // don't show the modal when refreshing
        // modalsHandler?.hideAllModals();
        // addDashedEdgeEventListeners();
        // addMouseEventListeners();
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
// Allow clicking outside the modal content to close it 
/*if (settingsModal) {
    settingsModal.addEventListener('click', (event) => {
        if (event.target === settingsModal) { // Check if the click was directly on the modal background
            hideSettingsModal();
        }
    });
}*/
// check that no one of the main acts is in process
// function nothingInProcess() { return !mouseHandler.creatingEdge && !draggingLabelPoint && !hasDragged && !selector.isSelecting; }
function isMouseNear(x, y, dist) {
    // return Math.hypot(mouse.x-x,mouse.y-y)<dist;
    return Math.hypot(worldCoords.x - x, worldCoords.y - y) < dist;
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
            shapeBend(ctx, vertex.x, vertex.y, settingsOptions.bendChars.size, settingsOptions.bendChars.color); // same color as bend class constructor
        else
            drawVertex(ctx, vertex, labels);
    });
    // show information for the hovering objects
    // hover.check(scale);
    showHoveredInfo();
    // Draw a temporary edge from starting vertex to mouse position and a rubbish bin to discard the new edge if necessary
    if (bendedEdgeCreator.creatingEdge && bendedEdgeCreator.startingVertex) {
        // console.log("startingVertex:", startingVertex.id);
        ctx.beginPath();
        ctx.moveTo(bendedEdgeCreator.startingVertex.x, bendedEdgeCreator.startingVertex.y);
        // ctx.lineTo(mouse.x, mouse.y);
        ctx.lineTo(worldCoords.x, worldCoords.y);
        // ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
        // apply characteristics of edgeChars
        ctx.strokeStyle = settingsOptions.edgeChars.color;
        ctx.lineWidth = settingsOptions.edgeChars.thickness / scale;
        if (settingsOptions.edgeChars.dashed)
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
        if (bendedEdgeCreator.creatingEdge) {
            const rect = canvas.getBoundingClientRect();
            const binPos = scaler.screenToWorld(rect.left + mouseHandler.rubbishBinRadius, rect.top + mouseHandler.rubbishBinRadius);
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
    if (bendedEdgeCreator.creatingEdge || selector.draggingPoints.length > 0) {
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
    if (hover.crossing)
        showCrossingInfo(hover.crossing);
    else
        hideCrossingInfo();
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
    const canvasPos = scaler.worldToCanvas(vertex.x, vertex.y);
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
        infoText = `Self-crossing (edge ${cross.edges[0].id})`;
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
    infoBox.style.left = `${mouseHandler.mouse.x + rect.left + 5}px`;
    infoBox.style.top = `${mouseHandler.mouse.y + rect.top + 5}px`;
    infoBox.style.display = "block";
}
function hideCrossingInfo() {
    const infoBox = document.getElementById("crossing-info");
    infoBox.style.display = "none";
}
function showEdgeInfo(edge) {
    const infoBox = document.getElementById("edge-info");
    const rect = canvas.getBoundingClientRect();
    const infoText = ` Edge: ${edge.id}<br>
                        CC: ${edge.bends.length}`;
    infoBox.innerHTML = infoText;
    // infoBox.style.left = `${rect.left + mouse.x + 5}px`;
    // infoBox.style.top = `${rect.top + mouse.y + 5}px`;
    infoBox.style.left = `${rect.left + mouseHandler.mouse.x + 10}px`;
    infoBox.style.top = `${rect.top + mouseHandler.mouse.y + 10}px`;
    infoBox.style.display = "block";
}
function hideEdgeInfo() {
    const infoBox = document.getElementById("edge-info");
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
    if (isMouseNear(x, y, mouseHandler.rubbishBinRadius / scale))
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
