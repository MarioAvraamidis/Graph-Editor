var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
// src/app.ts
import { Graph, Vertex, Bend } from "./graph.js";
import { CanvasHandler } from './canvasHandler.js';
// Create a graph instance
let graph = new Graph();
// history stack and redo stack for undo/redo
const historyStack = [];
const redoStack = [];
// mouse
let mouse;
let worldCoords; // graph coordinates of cursor (used when transforming during zoom)
let offsetX = 0; // x-offset between click position and mouse's current position
let offsetY = 0; // y-offset between click position and mouse's current position
// dragging
let draggingPoints = [];
let hasDragged = false; // will be used to distinguish vertex selection from vertex drag
// bends
let bendRadius = 5; // radius of bends
// crossings
let crosRadius = 5; // radius of crossings
// mode
let currentMode = "select"; // | "createEdge"
// hovered objects
let hoveredEdge = null;
let hoveredVertex = null;
let hoveredBend = null;
let hoveredLabelPoint = null;
let hoveredPoint = null;
let hoveredCrossing = null;
let hoveredCrossingEdges;
// selected items
let selectedPoints = [];
let selectedVertices = [];
let selectedBends = [];
let selectedEdges = [];
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
let positionsAtMouseDown = []; // positions of selected objects at mousedown time
// creating a rectangle for selected space
let isSelecting = false;
let selectionStart = { x: 0, y: 0 };
let selectionRect = { x: 0, y: 0, width: 0, height: 0 };
// moving labels
let draggingLabelPoint = null;
// default colors for crossings
let crossings_colors = { self: "#A020F0" /*purple*/, neighbor: "#FF0000" /*red*/, multiple: "#FFA500" /*orange*/, legal: "#008000" /*green*/ };
// default colors for crossing edges
let crossing_edges_colors = { crossing: "#2fee3c", nonCrossing: "#f0f42a" };
// palette settings
let vertexChars = { color: "#000000", size: 7, shape: "circle" }; // default settings of class Vertex
let edgeChars = { color: "#898989", thickness: 2, dashed: false }; // default of class Edge
let bendChars = { size: 5, color: "#0000FF" };
// context menu
let showingContextMenu = false;
// copy selected items
let rightClickPos;
let copySelectedClickedPos;
let copiedSelectedVertices = [];
let copiedSelectedEdges = [];
let menuCopy;
let pasteOffsetX = 0, pasteOffsetY = 0;
// zoom
let myCanvasHandler = null;
let scale = 1; // for all the elements that we want their size to remain the same regardless of the zoom scale, devide the size by scale
const dpr = window.devicePixelRatio || 1;
// settings
let defaultLabelFontSize = 18;
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Instantiate CanvasHandler, passing your renderGraph function as the drawing callback
        myCanvasHandler = new CanvasHandler('graphCanvas', renderGraph);
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
function setMode(mode) {
    var _a;
    currentMode = mode; // update mode
    // Update UI: toggle "active" class
    document.querySelectorAll(".mode-button").forEach(btn => {
        btn.classList.remove("active");
    });
    const buttonId = {
        "select": "mode-select",
        "addBend": "mode-add-bend"
        //,"createEdge": "mode-create-edge"
    }[mode];
    (_a = document.getElementById(buttonId)) === null || _a === void 0 ? void 0 : _a.classList.add("active");
}
// Set up listeners
(_a = document.getElementById("mode-select")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => setMode("select"));
(_b = document.getElementById("mode-add-bend")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", () => setMode("addBend"));
// document.getElementById("mode-create-edge")?.addEventListener("click", () => setMode("createEdge"));
// set up listener for fix view
(_c = document.getElementById('fix-view')) === null || _c === void 0 ? void 0 : _c.addEventListener('click', () => fixView());
// listener for settings button
(_d = document.getElementById('settingsBtn')) === null || _d === void 0 ? void 0 : _d.addEventListener('click', () => showSettingsModal());
//window.addEventListener("DOMContentLoaded", () => {
const canvas = document.getElementById("graphCanvas");
const ctx = canvas.getContext("2d");
// menus
const contextMenu = document.getElementById('contextMenu');
const edgeMenu = document.getElementById("edgeMenu");
const selectedMenu = document.getElementById("selectedMenu");
const pointMenu = document.getElementById("pointMenu");
const labelMenu = document.getElementById("labelMenu");
// edit label modal
const editLabelModal = document.getElementById('editLabelModal');
const editLabelCloseButton = editLabelModal.querySelector('.close-button');
const labelContentInput = document.getElementById('labelContentInput');
const labelFontSizeInput = document.getElementById('labelFontSizeInput');
const saveLabelButton = document.getElementById('saveLabelButton');
// settings modal
const settingsModal = document.getElementById('settingsModal');
// crossings colors settings
const settingsCrossingsColorInput = [];
for (const btn of ['crossings-colors-self', 'crossings-colors-neighbor', 'crossings-colors-multiple', 'crossings-colors-legal'])
    settingsCrossingsColorInput.push(document.getElementById(btn));
// crossing edges colors settings
const settingsCrossingEdgesColorInput = [];
for (const btn of ['crossing-edges-color', 'non-crossing-edges-color'])
    settingsCrossingEdgesColorInput.push(document.getElementById(btn));
// default label font size settings
const settingsLabelDefaultFonstSizeInput = document.getElementById('labelDefaultFontSizeInput');
const settingsCloseButton = settingsModal.querySelector('.close-button');
const settingsSaveButton = document.getElementById('settingsSaveButton');
// don't show the modal when refreshing
//hideEditLabelModal();
//hideSettingsModal();
hideAllModals();
if (!ctx) {
    throw new Error("Could not get canvas rendering context");
}
const output = document.getElementById("output");
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
            if (colorKey && colorKey in crossings_colors) {
                label.style.color = crossings_colors[colorKey];
            }
        });
        // Apply label colors based on data-color-key for crossing edges labels on palette
        const highlightCrossingEdgeLabels = document.getElementById("edge-palette").querySelectorAll('label[data-color-key');
        highlightCrossingEdgeLabels.forEach(label => {
            const colorKey = label.getAttribute('data-color-key');
            if (colorKey && colorKey in crossing_edges_colors) {
                label.style.color = crossing_edges_colors[colorKey];
            }
        });
    }
    if (ctx)
        drawGraph(ctx, graph);
    updatePaletteState();
}
// Attach event listeners to the checkboxes (do this once, perhaps outside renderGraph if the structure is static)
let checkboxes = output === null || output === void 0 ? void 0 : output.querySelectorAll('input[type="checkbox"]');
checkboxes === null || checkboxes === void 0 ? void 0 : checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
        // if(ctx)
        // drawGraph(ctx, graph, true);
    });
});
// event-listener for other highlighting crossing edges checkboxes
for (const id of ["highlight-crossing-edges", "highlight-non-crossing-edges"]) {
    (_e = document.getElementById(id)) === null || _e === void 0 ? void 0 : _e.addEventListener('change', () => {
        if (ctx)
            // drawGraph(ctx, graph, true);
            myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
    });
}
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
// Add Vertex
(_f = document.getElementById("add-vertex")) === null || _f === void 0 ? void 0 : _f.addEventListener("click", () => {
    const input = document.getElementById("vertexIdInput").value.trim();
    saveState();
    if (input) {
        // saveState();
        const vertex = new Vertex(input);
        graph.addVertex(vertex);
        // renderGraph();
    }
    // Add new Vertex and give it a name
    else {
        // saveState();
        const id = graph.maxVertexId();
        //console.log("Max numeric Id:",id);
        const vertex = new Vertex((id + 1).toString(), Math.random() * ctx.canvas.width, Math.random() * ctx.canvas.height);
        graph.addVertex(vertex);
        // renderGraph();
    }
    // renderGraph();
    myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
});
// Delete Vertex
(_g = document.getElementById("delete-vertex")) === null || _g === void 0 ? void 0 : _g.addEventListener("click", () => {
    const input = document.getElementById("vertexIdInput").value.trim();
    if (input) {
        saveState();
        graph.deleteVertexId(input);
        // renderGraph();
        myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
    }
});
// Add Edge
(_h = document.getElementById("add-edge")) === null || _h === void 0 ? void 0 : _h.addEventListener("click", () => {
    const from = document.getElementById("edgeFromInput").value.trim();
    const to = document.getElementById("edgeToInput").value.trim();
    if (from && to) {
        saveState();
        graph.addEdgeId(from, to);
        // renderGraph();
        myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
    }
});
// Delete Edge
(_j = document.getElementById("delete-edge")) === null || _j === void 0 ? void 0 : _j.addEventListener("click", () => {
    const from = document.getElementById("edgeFromInput").value.trim();
    const to = document.getElementById("edgeToInput").value.trim();
    if (from && to) {
        saveState();
        graph.deleteEdgeId(from, to);
        // renderGraph();
        myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
    }
});
// Add bend to an edge
(_k = document.getElementById("add-bend")) === null || _k === void 0 ? void 0 : _k.addEventListener("click", () => {
    const from = document.getElementById("edgeFromInput").value.trim();
    const to = document.getElementById("edgeToInput").value.trim();
    if (from && to) {
        let v = graph.getVertex(from);
        let u = graph.getVertex(to);
        if (v && u) {
            saveState();
            graph.addBend(v, u);
            // renderGraph();
            myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
        }
    }
});
// Remove a bend from an edge
(_l = document.getElementById("remove-bend")) === null || _l === void 0 ? void 0 : _l.addEventListener("click", () => {
    const from = document.getElementById("edgeFromInput").value.trim();
    const to = document.getElementById("edgeToInput").value.trim();
    if (from && to) {
        let v = graph.getVertex(from);
        let u = graph.getVertex(to);
        if (v && u) {
            saveState();
            graph.removeBendd(v, u);
            // renderGraph();
            myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
        }
    }
});
(_m = document.getElementById("undo-button")) === null || _m === void 0 ? void 0 : _m.addEventListener("click", () => {
    undo();
});
// Redo button
(_o = document.getElementById("redo-button")) === null || _o === void 0 ? void 0 : _o.addEventListener("click", () => {
    redo();
});
document.addEventListener('keydown', (e) => {
    // Get the element that triggered the event
    const targetElement = e.target;
    // Don't activate shortcuts if something else is selected
    if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA' || targetElement.tagName === 'SELECT')
        return;
    // undo
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault(); // prevent the browser's default undo behavior
        undo();
    }
    // redo
    else if (e.ctrlKey && e.key === 'y' || e.shiftKey && e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        redo();
    }
    // copy
    else if (e.ctrlKey && e.key == 'c') {
        if (checkCopySelected()) {
            copySelected();
            menuCopy = false;
            pasteOffsetX = 0;
            pasteOffsetY = 0;
        }
        else
            console.log("Select both the vertices of the selected edges");
    }
    // paste
    else if (e.ctrlKey && e.key == 'v') {
        if (copiedSelectedVertices.length > 0) {
            saveState();
            pasteSelected(pasteOffsetX + 50, pasteOffsetY + 50);
            pasteOffsetX = pasteOffsetX + 50;
            pasteOffsetY = pasteOffsetY + 50;
            // renderGraph();
            myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
        }
    }
    // delete
    else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedPoints.length > 0 || selectedEdges.length > 0) {
            saveState();
            deleteSelectedVertices();
            deleteSelectedBends();
            deleteSelectedEdges();
            selectedPointsUpdate();
            checkHovered();
            // renderGraph();
            myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
        }
    }
});
// undo utility
function undo() {
    if (historyStack.length > 0) {
        setNothingSelected();
        const current = graph.clone();
        redoStack.push(current);
        const prev = historyStack.pop();
        graph = prev;
        // renderGraph();
        myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
    }
}
// redo utility
function redo() {
    if (redoStack.length > 0) {
        const current = graph.clone();
        historyStack.push(current);
        const next = redoStack.pop();
        // graph.vertices = next.vertices;
        // graph.edges = next.edges;
        graph = next;
        // renderGraph();
        myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
    }
}
// Place vertices in a circle
(_p = document.getElementById("circle-placement")) === null || _p === void 0 ? void 0 : _p.addEventListener("click", () => {
    saveState();
    graph.makeCircle(0, 0, Math.min(ctx.canvas.height, ctx.canvas.width) / 3, selectedVertices);
    // renderGraph();
    myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
});
// make the graph (or the group of selected vertices) clique
(_q = document.getElementById("make-clique")) === null || _q === void 0 ? void 0 : _q.addEventListener("click", () => {
    saveState();
    graph.addAllEdges(selectedVertices);
    // renderGraph();
    myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
});
// make the graph straight line
(_r = document.getElementById("clear-bends")) === null || _r === void 0 ? void 0 : _r.addEventListener("click", () => {
    saveState();
    graph.removeBends();
    // renderGraph();
    myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
});
// remove all the edges
(_s = document.getElementById("clear-edges")) === null || _s === void 0 ? void 0 : _s.addEventListener("click", () => {
    saveState();
    graph.removeEdges();
    // renderGraph();
    myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
});
document.getElementById("export-json-btn").addEventListener("click", () => {
    exportGraph(graph);
});
document.getElementById("export-image").addEventListener("click", () => {
    drawGraph(ctx, graph, true, false);
    exportCanvasAsImage();
    drawGraph(ctx, graph);
});
document.getElementById("export-pdf").addEventListener("click", () => {
    exportCanvasAsPdf();
});
document.getElementById("import-input").addEventListener("change", (e) => __awaiter(void 0, void 0, void 0, function* () {
    const input = e.target;
    if (!input.files || input.files.length === 0)
        return;
    const file = input.files[0];
    const text = yield file.text();
    try {
        saveState();
        setNothingSelected();
        const data = JSON.parse(text);
        // console.log(data);
        graph = restoreGraphFromJSON(data);
        // renderGraph();
        myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
    }
    catch (err) {
        alert("Failed to load graph: Invalid format");
        console.error(err);
    }
}));
// Palette for vertices
const vertexColor = document.getElementById("vertex-color");
const vertexShapeButtons = document.querySelectorAll(".shape-button");
const vertexSize = document.getElementById("vertex-size");
const deleteVertexBtn = document.getElementById("delete-vertex-palette");
// Palette for bends
const bendColor = document.getElementById("bend-color");
// const bendShape = document.getElementById("bend-shape") as HTMLSelectElement;
const bendSize = document.getElementById("bend-size");
const deleteBendBtn = document.getElementById("delete-bend");
// Palette for Edges
const deleteEdgeBtn = document.getElementById("delete-edge-palette");
const edgeThickness = document.getElementById("edge-thickness");
const edgeColor = document.getElementById("edge-color");
// using palettes
vertexColor.addEventListener("change", () => {
    // update selected vertices' color
    if (selectedVertices.length > 0) {
        saveState();
        selectedVertices.forEach(v => v.color = vertexColor.value);
        // renderGraph();
        myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
    }
    // set the color for new vertices
    else
        vertexChars.color = vertexColor.value;
});
// vertex shape buttons
vertexShapeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        // Remove active class from all buttons
        vertexShapeButtons.forEach(b => b.classList.remove("active"));
        // Add active to the clicked one
        btn.classList.add("active");
        const selectedShape = btn.getAttribute("data-shape");
        if (selectedVertices.length > 0 && btn.classList) // update shape of selected vertices
         {
            saveState();
            selectedVertices.forEach(v => v.shape = selectedShape);
            // renderGraph();
            myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
        }
        // update new vertex shape
        vertexChars.shape = selectedShape;
    });
});
// vertex size
vertexSize.addEventListener("input", () => {
    const size = parseInt(vertexSize.value);
    if (selectedVertices.length > 0) {
        saveState();
        selectedVertices.forEach(v => v.size = size);
        // renderGraph();
        myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
    }
    else
        vertexChars.size = size;
});
// Vertex rename
(_t = document.getElementById("rename-vertex")) === null || _t === void 0 ? void 0 : _t.addEventListener("click", () => {
    const input = document.getElementById("vertexIdInput").value.trim();
    if (input && selectedVertices.length === 1) {
        saveState();
        const selectedVertex = selectedVertices[0];
        graph.renameVertex(selectedVertex, input);
        // renderGraph();
        myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
    }
});
// bend color
bendColor.addEventListener("change", () => {
    if (selectedBends.length > 0) // apply change on selected bends
     {
        saveState();
        selectedBends.forEach(b => b.color = bendColor.value);
        // renderGraph();
        myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
    }
    else // set color for new bends
        bendChars.color = bendColor.value;
});
// bend size
bendSize.addEventListener("input", () => {
    const size = parseInt(bendSize.value);
    if (selectedBends.length > 0) {
        saveState();
        selectedBends.forEach(b => b.size = size);
        // renderGraph();
        myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
    }
    else
        bendChars.size = size;
});
// edge color
edgeColor.addEventListener("change", () => {
    if (selectedEdges.length > 0) {
        saveState();
        selectedEdges.forEach(e => e.color = edgeColor.value);
        // renderGraph();
        myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
    }
    else
        edgeChars.color = edgeColor.value;
});
// edge thickness
edgeThickness.addEventListener("input", () => {
    if (selectedEdges.length > 0) {
        saveState();
        selectedEdges.forEach(e => e.thickness = parseInt(edgeThickness.value));
        // renderGraph();
        myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
    }
    else
        edgeChars.thickness = parseInt(edgeThickness.value);
});
// delete vertex button
deleteVertexBtn.addEventListener("click", () => {
    saveState();
    deleteSelectedVertices();
    selectedPointsUpdate();
    // renderGraph();
    myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
});
// delete bend button
deleteBendBtn.addEventListener("click", () => {
    saveState();
    deleteSelectedBends();
    selectedPointsUpdate();
    // renderGraph();
    myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
});
// delete edge button
deleteEdgeBtn.addEventListener("click", () => {
    saveState();
    deleteSelectedEdges();
    selectedPointsUpdate();
    // renderGraph();
    myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
});
// deletion of selected vertices (and removal of their corresponding edges and bends from selected objects)
function deleteSelectedVertices() {
    selectedVertices.forEach(v => graph.deleteVertex(v));
    // remove the corresponding edges from selectedEdges
    selectedEdges = selectedEdges.filter(e => e.points[0] instanceof Vertex && !selectedVertices.includes(e.points[0]) && e.points[1] instanceof Vertex && !selectedVertices.includes(e.points[1]));
    // remove the corresponding bends from selectedBends
    selectedBends = selectedBends.filter(b => b.edge.points[0] instanceof Vertex && !selectedVertices.includes(b.edge.points[0]) && b.edge.points[1] instanceof Vertex && !selectedVertices.includes(b.edge.points[1]));
    // update selectedVertices
    selectedVertices.length = 0;
}
// deletion of selected bends
function deleteSelectedBends() {
    selectedBends.forEach(b => graph.removeBend(b));
    selectedBends.length = 0;
}
// deletion of selected edges
function deleteSelectedEdges() {
    selectedEdges.forEach(e => graph.deleteEdgee(e));
    selectedEdges.length = 0;
}
// dashed edge button
let toggle_dashed_btn = document.getElementById("toggle-dashed");
toggle_dashed_btn.addEventListener("click", () => {
    if (selectedEdges.length > 0) {
        saveState();
        const dashed = !selectedEdges[0].dashed;
        for (const e of selectedEdges)
            e.dashed = dashed;
        // renderGraph();
        myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
    }
    else {
        edgeChars.dashed = !edgeChars.dashed;
        if (edgeChars.dashed)
            toggle_dashed_btn === null || toggle_dashed_btn === void 0 ? void 0 : toggle_dashed_btn.classList.add("active");
        else
            toggle_dashed_btn === null || toggle_dashed_btn === void 0 ? void 0 : toggle_dashed_btn.classList.remove("active");
    }
});
// Collapse palettes
const vertexPalette = document.getElementById('vertex-palette');
const edgePalette = document.getElementById('edge-palette');
const bendPalette = document.getElementById('bend-palette');
for (const palette of [vertexPalette, edgePalette, bendPalette])
    if (palette) {
        const paletteHeader = palette.querySelector('.palette-header');
        const paletteContent = palette.querySelector('.palette-content');
        if (paletteHeader && paletteContent) {
            paletteHeader.addEventListener('click', () => {
                // Toggle the 'collapsed' class on the main palette div
                palette.classList.toggle('collapsed');
            });
        }
    }
// Initially collapse the bend-palette
if (bendPalette)
    bendPalette.classList.add('collapsed');
// Initial render
// resizeCanvas();
renderGraph();
//if (myCanvasHandler !== null)
//  myCanvasHandler.redraw();
//});
// detect vertex/bend selection
canvas.addEventListener("mousedown", (e) => {
    // set mouse position
    // mouse = getMousePos(canvas, e);
    worldCoords = myCanvasHandler.screenToWorld(e.clientX, e.clientY);
    // hide the menu when clicking anywhere else
    // Check if the click was outside the context menu
    if (contextMenu && !contextMenu.contains(e.target) && showingContextMenu) {
        hideContextMenu();
        showingContextMenu = false;
        canAddVertex = false;
    }
    else
        canAddVertex = true;
    checkHovered();
    // check if the clicked point belongs to the selected ones
    // if yes, set dragging points = selected points and store the positions of selected vertices at the time of mousedown
    // hoveredPoint = graph.getPointAtPosition(mouse.x, mouse.y);
    // hoveredPoint = graph.getPointAtPosition(worldCoords.x, worldCoords.y,scale);
    if (hoveredPoint && selectedPoints.includes(hoveredPoint) || hoveredEdge && selectedEdges.includes(hoveredEdge)) {
        saveState();
        draggingPoints = selectedPoints;
        // also add to dragging points the endpoints and bends of selected edges
        for (const se of selectedEdges) {
            selectedPoints.push(se.points[0]);
            selectedPoints.push(se.points[1]);
            for (const bend of se.bends)
                selectedPoints.push(bend);
        }
        // save positions at mousedown
        positionsAtMouseDown = [];
        for (let i = 0; i < selectedPoints.length; i++)
            positionsAtMouseDown.push({ x: selectedPoints[i].x, y: selectedPoints[i].y });
    }
    // starting vertex for edge creation
    if (selectedPoints.length === 0 && !creatingEdge) // hasDragged for not setting starting vertex a selected vertex
     {
        startingVertex = hoveredVertex;
        /*if (startingVertex)
            console.log("mousedown, startingVertex="+startingVertex.id);
        else
            console.log("mousedown, startingVertex = null");*/
    }
    // label move
    if (!creatingEdge)
        draggingLabelPoint = hoveredLabelPoint;
    hasDragged = false;
    mousedown = true;
    // save mouse position
    // clickedX = mouse.x;
    // clickedY = mouse.y;
    clickedX = worldCoords.x;
    clickedY = worldCoords.y;
    // selection rectangle starting points
    // selectionStart.x = mouse.x;
    // selectionStart.y = mouse.y;
    selectionStart.x = worldCoords.x;
    selectionStart.y = worldCoords.y;
});
// detect vertex or bend moving
canvas.addEventListener("mousemove", e => {
    // update mouse position
    mouse = getMousePos(canvas, e);
    worldCoords = myCanvasHandler.screenToWorld(e.clientX, e.clientY);
    // offsetX = mouse.x - clickedX;
    // offsetY = mouse.y - clickedY;
    offsetX = worldCoords.x - clickedX;
    offsetY = worldCoords.y - clickedY;
    checkHovered();
    // console.log("mousemove:",mouse.x,mouse.y,clickedX,clickedY);
    if (mousedown && Math.hypot(offsetX, offsetY) > 3) {
        hasDragged = true;
        if (startingVertex && selectedPoints.length === 0 && !creatingEdge) // creatingEdge is activated only if we have a starting vertex and no selected points
         {
            creatingEdge = true;
            canClick = false;
            saveState();
        }
        /*else
        {
            // startingVertex = null;
            creatingEdge = false;
        }*/
        // if (selectedPoints.length > 0)
        // saveState();
    }
    for (let i = 0; i < draggingPoints.length; i++) {
        graph.movePoint(draggingPoints[i], positionsAtMouseDown[i].x + offsetX, positionsAtMouseDown[i].y + offsetY);
        // console.log("vertex "+v.id,v.x,v.y);
        // renderGraph();
        myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
    }
    // label move
    if (draggingLabelPoint && hasDragged) {
        // make sure dragging label is not moved far away from the point
        const limit = Math.max(2 * draggingLabelPoint.size + draggingLabelPoint.labelFont, 40);
        draggingLabelPoint.labelOffsetX = inLimits(worldCoords.x - draggingLabelPoint.x, limit / scale) * scale;
        draggingLabelPoint.labelOffsetY = inLimits(-worldCoords.y + draggingLabelPoint.y, limit / scale) * scale;
    }
    // create a rectangle showing selected space
    if (selectedPoints.length === 0 && !creatingEdge && !e.ctrlKey && !draggingLabelPoint && mousedown && hasDragged) {
        isSelecting = true;
        // console.log("creatingEdge=",creatingEdge);
    }
    // rectangle for selected space
    if (isSelecting) {
        // console.log("is selecting = true, creatingEdge=",creatingEdge);
        // selectionRect.x = Math.min(selectionStart.x, mouse.x);
        // selectionRect.y = Math.min(selectionStart.y, mouse.y);
        // selectionRect.width = Math.abs(mouse.x - selectionStart.x);
        // selectionRect.height = Math.abs(mouse.y - selectionStart.y);
        selectionRect.x = Math.min(selectionStart.x, worldCoords.x);
        selectionRect.y = Math.min(selectionStart.y, worldCoords.y);
        selectionRect.width = Math.abs(worldCoords.x - selectionStart.x);
        selectionRect.height = Math.abs(worldCoords.y - selectionStart.y);
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
    worldCoords = myCanvasHandler.screenToWorld(e.clientX, e.clientY);
    // check hovering
    checkHovered();
    if (startingVertex && creatingEdge) {
        const rect = canvas.getBoundingClientRect();
        const binPos = myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.screenToWorld(rect.left + rubbishBinRadius, rect.top + rubbishBinRadius);
        if (hoveredVertex) // add a straight edge
         {
            const edge = graph.addEdgeAdvanced(startingVertex, hoveredVertex);
            if (edge) // check if the edge can be created, based on the restrictions for self loops, simple graph etc
             {
                startingVertex = null;
                creatingEdge = false;
                // set characteristics for the new edge
                edge.assignCharacteristics(edgeChars.color, edgeChars.dashed, edgeChars.thickness);
                edge.assignBendCharacteristics(bendChars.color, bendChars.size);
                // hasDragged = true;  // to not select the hoveredVertex
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
            historyStack.pop(); // don't save state if no edge created
            // hasDragged = true;  // to not create a new edge when rubbish bin is clicked
        }
        else // continue creating a bended edge
         {
            // saveState();
            // let combo = graph.extendEdge(startingVertex,mouse.x,mouse.y);
            let combo = graph.extendEdge(startingVertex, worldCoords.x, worldCoords.y);
            startingVertex = combo.vertex;
            edgeCreated = combo.edge;
            // set characteristics for the new edge
            if (edgeCreated) {
                edgeCreated.assignCharacteristics(edgeChars.color, edgeChars.dashed, edgeChars.thickness);
                edgeCreated.assignBendCharacteristics(bendChars.color, bendChars.size);
            }
        }
    }
    else
        canClick = true;
    /*
    if (!hasDragged) {
        // It's a click, not a drag
        if (selectedVertex && v && selectedVertex !== v) {
            saveState();
            graph.addEdgeAdvanced(selectedVertex, v);
            selectedVertex = null;
        }
        else if (selectedVertex && currentMode === "createEdge")
        {
            saveState();
            graph.extendEdge(selectedVertex,pos.x,pos.y);
            selectedVertex = null;
        }
        else if (!v && !hoveredEdge && !selectedVertex) // if nothing selected, add a new vertex at the point clicked
        {
            const vertex = new Vertex((graph.maxVertexId()+1).toString(),mouse.x,mouse.y);
            graph.addVertex(vertex);
        }
        else {
            selectedVertex = v;
        }
    }*/
    if (isSelecting) {
        selectedPoints = graph.pointsInRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
        // console.log("mouseup",selectedPoints.length);
        selectedVertices = selectedPoints.filter(v => v instanceof Vertex);
        selectedBends = selectedPoints.filter(v => v instanceof Bend);
        selectedEdges = graph.edgesInRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
        // isSelecting = false;
    }
    // save state when moving
    // CHEEEEECK AGAAAAIIIIIIIIINNNNNNN
    //if (hasDragged && draggingPoints.length > 0)
    //  saveState();
    isSelecting = false;
    draggingLabelPoint = null;
    draggingPoints = [];
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
    // console.log("click passed",selectedPoints.length);
    worldCoords = myCanvasHandler.screenToWorld(e.clientX, e.clientY);
    // console.log("Clicked at screen ",e.clientX,e.clientY);
    checkHovered();
    // if nothing hovered or selected, add a new vertex at the clicked position
    if (!hoveredVertex && !hoveredBend && !hoveredEdge && !selectedPoints.length && !selectedEdges.length && !draggingLabelPoint && canAddVertex) {
        saveState();
        // const vertex = graph.addNewVertex(mouse.x,mouse.y);
        const vertex = graph.addNewVertex(worldCoords.x, worldCoords.y);
        // console.log("new vertex at ",worldCoords.x, worldCoords.y);
        vertex.size = vertexChars.size;
        vertex.shape = vertexChars.shape;
        vertex.color = vertexChars.color;
        vertex.labelFont = defaultLabelFontSize;
        // hoveredVertex = vertex;
    }
    // add a new bend in the addBend mode if hovering over an edge
    // IMPORTANT: the following piece of code (in the brackets of if) must remain below the above piece of code
    if (hoveredEdge && currentMode === "addBend") {
        saveState();
        const p1 = hoveredEdge.points[0];
        const p2 = hoveredEdge.points[1];
        if (p1 instanceof Vertex && p2 instanceof Vertex)
            graph.addBend(p1, p2, worldCoords.x, worldCoords.y);
        // graph.addBend(p1,p2,mouse.x,mouse.y);
        // set it free
        hoveredEdge = null;
        canvas.style.cursor = "default";
    }
    // select a vertex/bend/edge and update selected vertices
    if (hoveredVertex)
        select(hoveredVertex, selectedVertices, e);
    else if (hoveredBend)
        select(hoveredBend, selectedBends, e);
    else if (hoveredEdge)
        select(hoveredEdge, selectedEdges, e);
    else {
        selectedVertices.length = 0;
        selectedBends.length = 0;
        selectedEdges.length = 0;
        // console.log("else",selectedVertices.length,selectedBends.length);
    }
    selectedPointsUpdate();
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
// Add event listener for right-click (contextmenu) on the canvas
canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault(); // Prevent the browser's default context menu
    // rightClickPos = {x: mouse.x, y: mouse.y};
    rightClickPos = { x: worldCoords.x, y: worldCoords.y };
    //if (hoveredVertex && selectedVertices.includes(hoveredVertex) || hoveredEdge && selectedEdges.includes(hoveredEdge) || hoveredBend && selectedBends.includes(hoveredBend))
    if (hoveredPoint && selectedPoints.includes(hoveredPoint) || hoveredEdge && selectedEdges.includes(hoveredEdge))
        showContextMenu(event.clientX, event.clientY, selectedMenu);
    else if (hoveredEdge) // show edge menu
        showContextMenu(event.clientX, event.clientY, edgeMenu);
    else if (hoveredPoint) // show point menu
        showContextMenu(event.clientX, event.clientY, pointMenu);
    else if (hoveredLabelPoint)
        showContextMenu(event.clientX, event.clientY, labelMenu);
    else // show general menu
        showContextMenu(event.clientX, event.clientY, contextMenu);
    showingContextMenu = true;
});
// Function to hide the context menu
function hideContextMenu() {
    /*const menus: HTMLDivElement[] = [contextMenu,edgeMenu,selectedMenu,pointMenu,labelMenu];
    for (const menu in menus)
            menu.style.display = 'none';*/
    if (contextMenu) {
        contextMenu.style.display = 'none';
    }
    if (edgeMenu) {
        edgeMenu.style.display = 'none';
    }
    if (selectedMenu) {
        selectedMenu.style.display = 'none';
    }
    if (pointMenu)
        pointMenu.style.display = 'none';
    if (labelMenu)
        labelMenu.style.display = 'none';
}
// Function to show and position the context menu
function showContextMenu(x, y, menu) {
    if (menu) {
        menu.style.display = 'block';
        // Position the menu
        // Ensure menu stays within viewport
        const menuWidth = menu.offsetWidth;
        const menuHeight = menu.offsetHeight;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        let finalX = x;
        let finalY = y;
        if (x + menuWidth > viewportWidth) {
            finalX = viewportWidth - menuWidth - 5; // 5px padding from edge
        }
        if (y + menuHeight > viewportHeight) {
            finalY = viewportHeight - menuHeight - 5; // 5px padding from edge
        }
        menu.style.left = `${finalX}px`;
        menu.style.top = `${finalY}px`;
    }
}
// Add event listener for clicks on the context menu options
contextMenu.addEventListener('click', (event) => {
    const target = event.target;
    // Ensure a menu item was clicked
    if (target.tagName === 'LI' && target.hasAttribute('data-action')) {
        const action = target.getAttribute('data-action');
        hideContextMenu(); // Hide menu after selection
        switch (action) {
            case "clear-canvas":
                saveState();
                graph = new Graph();
                // renderGraph();
                myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
                break;
            // Add more cases for other actions
            case "paste":
                if (copiedSelectedVertices.length > 0) {
                    saveState();
                    if (menuCopy)
                        pasteSelected(rightClickPos.x - copySelectedClickedPos.x, rightClickPos.y - copySelectedClickedPos.y);
                    else {
                        // paste the uppermost selected point at the clicked position
                        let uppermostPoint = uppermostCopiedSelectedVertex();
                        if (uppermostPoint)
                            pasteSelected(rightClickPos.x - uppermostPoint.x, rightClickPos.y - uppermostPoint.y);
                        else
                            console.log("uppermostPoint null");
                    }
                    // renderGraph();
                    myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
                }
                break;
            default:
                console.log(`Action not implemented: ${action}`);
        }
    }
});
// edge menu options
edgeMenu.addEventListener('click', (event) => {
    const target = event.target;
    // Ensure a menu item was clicked
    if (target.tagName === 'LI' && target.hasAttribute('data-action')) {
        const action = target.getAttribute('data-action');
        hideContextMenu(); // Hide menu after selection
        switch (action) {
            case "addBend":
                saveState();
                const p1 = hoveredEdge.points[0]; // edgeMenu appears only when an edge is hovered
                const p2 = hoveredEdge.points[1];
                if (p1 instanceof Vertex && p2 instanceof Vertex)
                    graph.addBend(p1, p2, worldCoords.x, worldCoords.y);
                // graph.addBend(p1,p2,mouse.x,mouse.y);
                // set it free
                hoveredEdge = null;
                // renderGraph();
                myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
                break;
            // Add more cases for other actions
            default:
                console.log(`Action not implemented: ${action}`);
        }
    }
});
// selected menu options
selectedMenu.addEventListener('click', (event) => {
    const target = event.target;
    // Ensure a menu item was clicked
    if (target.tagName === 'LI' && target.hasAttribute('data-action')) {
        const action = target.getAttribute('data-action');
        hideContextMenu(); // Hide menu after selection
        switch (action) {
            case "copySelected":
                if (checkCopySelected()) {
                    copySelectedClickedPos = { x: rightClickPos.x, y: rightClickPos.y };
                    copySelected();
                    menuCopy = true;
                    pasteOffsetX = 0;
                    pasteOffsetY = 0;
                }
                else
                    console.log("Select both the vertices of the selected edges");
                break;
            case "showLabels":
                for (const point of selectedPoints)
                    point.showLabel = true;
                myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
                break;
            case "hideLabels":
                for (const point of selectedPoints)
                    point.showLabel = false;
                myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
                break;
            // Add more cases for other actions
            default:
                console.log(`Action not implemented: ${action}`);
        }
    }
});
// crossing menu options
pointMenu.addEventListener('click', (event) => {
    const target = event.target;
    // Ensure a menu item was clicked
    if (target.tagName === 'LI' && target.hasAttribute('data-action')) {
        const action = target.getAttribute('data-action');
        hideContextMenu(); // Hide menu after selection
        switch (action) {
            case "showLabel":
                if (hoveredPoint) {
                    hoveredPoint.showLabel = true;
                    myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
                }
                break;
            case "hideLabel":
                if (hoveredPoint) {
                    hoveredPoint.showLabel = false;
                    myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
                }
                break;
            // Add more cases for other actions
            default:
                console.log(`Action not implemented: ${action}`);
        }
    }
});
// label menu options
labelMenu.addEventListener('click', (event) => {
    const target = event.target;
    // Ensure a menu item was clicked
    if (target.tagName === 'LI' && target.hasAttribute('data-action')) {
        const action = target.getAttribute('data-action');
        hideContextMenu(); // Hide menu after selection
        //console.log("label-menu");
        switch (action) {
            case "editLabel":
                if (hoveredLabelPoint) {
                    // console.log("hoveredLabelPoint found");
                    showEditLabelModal();
                    // FIX: Display a warning message. No console.log
                    // if (hoveredLabelPoint instanceof Vertex)
                }
                break;
            case "hideLabel":
                if (hoveredLabelPoint) {
                    hoveredLabelPoint.showLabel = false;
                    myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
                }
            // Add more cases for other actions
            default:
                console.log(`Action not implemented: ${action}`);
        }
    }
});
saveLabelButton === null || saveLabelButton === void 0 ? void 0 : saveLabelButton.addEventListener('click', () => {
    if (labelContentInput && labelFontSizeInput && hoveredLabelPoint) {
        saveState();
        hoveredLabelPoint.labelContent = labelContentInput.value;
        hoveredLabelPoint.labelFont = parseInt(labelFontSizeInput.value);
        // checkHovered();
        myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
    }
    // hideEditLabelModal();
    hideAllModals();
});
// activate click to save button when typing enter
for (const input of [labelContentInput, labelFontSizeInput])
    input === null || input === void 0 ? void 0 : input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveLabelButton === null || saveLabelButton === void 0 ? void 0 : saveLabelButton.click(); // trigger save buttton
        }
    });
// display the edit label modal
function showEditLabelModal() {
    if (editLabelModal && hoveredLabelPoint) {
        // console.log("showEditLabelModal");
        labelContentInput.value = hoveredLabelPoint.labelContent;
        labelFontSizeInput.value = hoveredLabelPoint.labelFont.toString();
        // if the hovered label point is a vertex, don't allow rename
        labelContentInput.disabled = hoveredLabelPoint instanceof Vertex;
        editLabelModal.style.display = 'flex'; // Use 'flex' to activate the centering via CSS
        // If the input is not disabled, focus and select its text
        if (!labelContentInput.disabled) {
            labelContentInput.focus();
            labelContentInput.select();
        }
    }
}
function hideAllModals() {
    if (editLabelModal) {
        editLabelModal.style.display = 'none';
    }
    if (settingsModal) {
        settingsModal.style.display = 'none';
    }
}
//  hide the modal
function hideEditLabelModal() {
    if (editLabelModal) {
        editLabelModal.style.display = 'none';
    }
}
// display the edit label modal
function showSettingsModal() {
    if (settingsModal && settingsCrossingsColorInput) {
        settingsCrossingsColorInput[0].value = crossings_colors.self;
        settingsCrossingsColorInput[1].value = crossings_colors.neighbor;
        settingsCrossingsColorInput[2].value = crossings_colors.multiple;
        settingsCrossingsColorInput[3].value = crossings_colors.legal;
        settingsCrossingEdgesColorInput[0].value = crossing_edges_colors.crossing;
        settingsCrossingEdgesColorInput[1].value = crossing_edges_colors.nonCrossing;
        settingsLabelDefaultFonstSizeInput.value = defaultLabelFontSize.toString();
        settingsModal.style.display = 'flex'; // Use 'flex' to activate the centering via CSS
    }
}
//  hide the modal
function hideSettingsModal() {
    if (settingsModal) {
        settingsModal.style.display = 'none';
    }
}
// event listener to the close button
if (editLabelCloseButton) {
    editLabelCloseButton.addEventListener('click', hideAllModals);
}
if (settingsCloseButton) {
    settingsCloseButton.addEventListener('click', hideAllModals /*hideSettingsModal*/);
}
// Allow clicking outside the modal content to close it 
if (editLabelModal) {
    editLabelModal.addEventListener('click', (event) => {
        if (event.target === editLabelModal) { // Check if the click was directly on the modal background
            //hideEditLabelModal();
            hideAllModals();
        }
    });
}
settingsSaveButton === null || settingsSaveButton === void 0 ? void 0 : settingsSaveButton.addEventListener('click', () => {
    if (settingsCrossingsColorInput) {
        // saveState();
        crossings_colors.self = settingsCrossingsColorInput[0].value;
        crossings_colors.neighbor = settingsCrossingsColorInput[1].value;
        crossings_colors.multiple = settingsCrossingsColorInput[2].value;
        crossings_colors.legal = settingsCrossingsColorInput[3].value;
        crossing_edges_colors.crossing = settingsCrossingEdgesColorInput[0].value;
        crossing_edges_colors.nonCrossing = settingsCrossingEdgesColorInput[1].value;
        defaultLabelFontSize = parseInt(settingsLabelDefaultFonstSizeInput.value);
        myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
    }
    //hideSettingsModal();
    hideAllModals();
});
// Allow clicking outside the modal content to close it 
/*if (settingsModal) {
    settingsModal.addEventListener('click', (event) => {
        if (event.target === settingsModal) { // Check if the click was directly on the modal background
            hideSettingsModal();
        }
    });
}*/
// Add the selected object (vertex, bend, edge) to the appropriate array of selected objects
function select(obj, array, e) {
    // saveState();
    if (e.ctrlKey || e.metaKey) {
        const index = array.indexOf(obj);
        if (index > -1) // remove the selected object from selected objects
            array.splice(index, 1);
        else // add the selected object to selected objects
            array.push(obj);
    }
    else // if not control key pushed, remove all the selected objects and then add the selected one
     {
        setNothingSelected();
        array.length = 0; // clear the array in place
        array.push(obj);
    }
}
// set no object of the graph selected
function setNothingSelected() {
    selectedVertices.length = 0;
    selectedBends.length = 0;
    selectedEdges.length = 0;
    selectedPointsUpdate();
}
// check that no one of the main acts is in process
function nothingInProcess() { return !creatingEdge && !draggingLabelPoint && !hasDragged && !isSelecting; }
// selected Points = selected Vertices & selected Bends
function selectedPointsUpdate() {
    selectedPoints.length = 0;
    for (const v of selectedVertices)
        selectedPoints.push(v);
    for (const b of selectedBends)
        selectedPoints.push(b);
    // console.log("called", selectedPoints.length);
}
// find and return the uppermost selected point
function uppermostCopiedSelectedVertex() {
    if (copiedSelectedVertices.length === 0)
        return null;
    let maxYpoint = copiedSelectedVertices[0];
    for (let i = 1; i < copiedSelectedVertices.length; i++)
        if (copiedSelectedVertices[i].y < maxYpoint.y) // positive is down in canvas
            maxYpoint = copiedSelectedVertices[i];
    return maxYpoint;
}
// not sure if necessary
function selectEdge(e) {
    for (const bend of e.bends)
        if (!selectedBends.includes(bend))
            selectedBends.push(bend);
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
// detect the hovering object
function checkHovered() {
    // to go back, replace all worldCoords with mouse
    setHoveredObjectsNull();
    hoveredVertex = graph.getVertexAtPosition(worldCoords.x, worldCoords.y, scale, selectedVertices);
    if (hoveredVertex)
        hoveredPoint = hoveredVertex;
    else {
        hoveredBend = graph.isNearBend(worldCoords.x, worldCoords.y, scale);
        if (hoveredBend)
            hoveredPoint = hoveredBend;
        else {
            hoveredCrossing = graph.isNearCrossing(worldCoords.x, worldCoords.y, (crosRadius + 2) / scale);
            if (hoveredCrossing) {
                hoveredPoint = hoveredCrossing;
                hoveredCrossingEdges = hoveredCrossing.edges;
            }
            else
                hoveredEdge = graph.isNearEdge(worldCoords.x, worldCoords.y, 3 / scale);
        }
    }
    // find hoveredLabelPoint
    if (!hoveredVertex && !hoveredBend && !hoveredEdge) {
        // check vertices first
        for (const v of graph.vertices)
            if (isNearLabel(v, worldCoords.x, worldCoords.y)) {
                hoveredLabelPoint = v;
                break;
            }
        // check crossings
        if (!hoveredLabelPoint)
            for (const cros of graph.crossings)
                if (isNearLabel(cros, worldCoords.x, worldCoords.y)) {
                    hoveredLabelPoint = cros;
                    break;
                }
        // check bends
        if (!hoveredLabelPoint) {
            const bends = graph.getBends();
            for (const bend of bends)
                if (isNearLabel(bend, worldCoords.x, worldCoords.y)) {
                    hoveredLabelPoint = bend;
                    break;
                }
        }
    }
}
function setHoveredObjectsNull() {
    hoveredVertex = null;
    hoveredBend = null;
    hoveredCrossing = null;
    hoveredPoint = null;
    hoveredEdge = null;
    hoveredCrossingEdges = [null, null];
    hoveredLabelPoint = null;
}
// Check if the vertices of the selectedEdges are selected. If not, return false
function checkCopySelected() {
    for (const e of selectedEdges) {
        const v1 = e.points[0];
        const v2 = e.points[1];
        if (v1 instanceof Vertex && !selectedVertices.includes(v1) || v2 instanceof Vertex && !selectedVertices.includes(v2))
            return false; // fail
    }
    return true;
}
// store the selected items
function copySelected() {
    copiedSelectedVertices.length = 0;
    copiedSelectedEdges.length = 0;
    for (const v of selectedVertices)
        copiedSelectedVertices.push(v);
    for (const e of selectedEdges)
        copiedSelectedEdges.push(e);
}
// paste the copied items
function pasteSelected(offsetX = 50, offsetY = 50) {
    // create a map for the new and old vertices
    const map = new Map();
    // set the new vertices and edges as selected
    setNothingSelected();
    // copy vertices
    for (const v of copiedSelectedVertices) {
        let newVertex = graph.addNewVertex(v.x + offsetX, v.y + offsetY);
        newVertex.cloneCharacteristics(v);
        map.set(v, newVertex);
        selectedVertices.push(newVertex);
    }
    // copy edges
    // IMPORTANT: Make sure that checkCopySelected is run before pasting the new edges
    for (const e of copiedSelectedEdges) {
        const v1 = e.points[0];
        const v2 = e.points[1];
        let newEdge = null;
        if (v1 instanceof Vertex && v2 instanceof Vertex)
            newEdge = graph.addEdge(map.get(v1), map.get(v2));
        if (newEdge) {
            newEdge.cloneCharacteristics(e, offsetX, offsetY);
            selectedEdges.push(newEdge);
        }
    }
    // update selected points
    selectedPointsUpdate();
}
function updatePaletteState() {
    /*const vertexPalette = document.getElementById("vertex-palette")!;
    const edgePalette = document.getElementById("edge-palette")!;
    const bendPalette = document.getElementById("bend-palette")!;
    const vertexShape = document.getElementById("vertex-shape")!;*/
    const vertexColorPicker = document.getElementById("vertex-color");
    const edgeColorPicker = document.getElementById("edge-color");
    const bendColorPicker = document.getElementById("bend-color");
    const vertexSelected = selectedVertices.length > 0;
    const edgeSelected = selectedEdges.length > 0;
    const bendSelected = selectedBends.length > 0;
    // disable color pickers
    // vertexColorPicker.disabled = !vertexSelected;
    // edgeColorPicker.disabled = !edgeSelected;
    // bendColorPicker.disabled = !bendSelected;
    // vertexPalette.classList.toggle("disabled", !vertexSelected);
    // bendPalette.classList.toggle("disabled", !bendSelected);
    // edgePalette.classList.toggle("disabled", !edgeSelected);
    if (vertexSelected) {
        const v = selectedVertices[selectedVertices.length - 1]; // use last selected
        vertexColorPicker.value = v.color;
        vertexSize.value = v.size.toString();
        // Enable shape buttons
        vertexShapeButtons.forEach(btn => {
            btn.removeAttribute("disabled");
            btn.classList.remove("active");
            // Highlight the correct shape button
            if (btn.getAttribute("data-shape") === v.shape) {
                btn.classList.add("active");
            }
        });
    }
    else // show default values on palette
     {
        vertexColorPicker.value = vertexChars.color;
        vertexSize.value = vertexChars.size.toString();
        vertexShapeButtons.forEach(btn => {
            btn.removeAttribute("disabled");
            btn.classList.remove("active");
            // Highlight the correct shape button
            if (btn.getAttribute("data-shape") === vertexChars.shape) {
                btn.classList.add("active");
            }
        });
    }
    updateRenameControls(selectedVertices.length === 1);
    if (bendSelected) {
        const b = selectedBends[selectedBends.length - 1]; // use last selected
        bendColorPicker.value = b.color;
        // bendShape.value = b.shape;
        bendSize.value = b.size.toString();
    }
    else {
        bendColorPicker.value = bendChars.color;
        bendSize.value = bendChars.size.toString();
    }
    if (edgeSelected) {
        const e = selectedEdges[selectedEdges.length - 1];
        edgeColorPicker.value = e.color;
        edgeThickness.value = e.thickness.toString();
        // update toggle-dashed button
        if (e.dashed)
            toggle_dashed_btn === null || toggle_dashed_btn === void 0 ? void 0 : toggle_dashed_btn.classList.add("active");
        else
            toggle_dashed_btn === null || toggle_dashed_btn === void 0 ? void 0 : toggle_dashed_btn.classList.remove("active");
    }
    else {
        edgeColorPicker.value = edgeChars.color;
        edgeThickness.value = edgeChars.thickness.toString();
        // update toggle-dashed button
        if (edgeChars.dashed)
            toggle_dashed_btn === null || toggle_dashed_btn === void 0 ? void 0 : toggle_dashed_btn.classList.add("active");
        else
            toggle_dashed_btn === null || toggle_dashed_btn === void 0 ? void 0 : toggle_dashed_btn.classList.remove("active");
    }
}
function updateRenameControls(enabled) {
    const input = document.getElementById("vertexIdInput");
    const button = document.getElementById("rename-vertex");
    input.disabled = !enabled;
    button.disabled = !enabled;
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
            shapeBend(ctx, vertex.x, vertex.y, bendChars.size, bendChars.color); // same color as bend class constructor
        else
            drawVertex(ctx, vertex, labels);
    });
    // show information for the hovering objects
    // checkHovered();
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
        ctx.strokeStyle = edgeChars.color;
        ctx.lineWidth = edgeChars.thickness / scale;
        if (edgeChars.dashed)
            ctx.setLineDash([3, 3]); // dashed line
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
    // if (hoveredEdge && currentMode === "addBend") 
    // shapeBend(ctx,mouse.x,mouse.y,bendChars.size,bendChars.color);
    // draw selection rectangle
    if (isSelecting) {
        ctx.strokeStyle = "rgba(15, 15, 62, 0.86)";
        ctx.lineWidth = 1 / scale;
        ctx.setLineDash([6 / scale]);
        ctx.strokeRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
        ctx.setLineDash([]);
    }
}
// highlight the edges that cross any of the selected edges
function highlightCrossingEdges() {
    for (const cross of graph.crossings) {
        const e0 = cross.edges[0];
        const e1 = cross.edges[1];
        if (ctx && selectedEdges.includes(e0) && !selectedEdges.includes(e1))
            drawEdge(ctx, e1, 1);
        else if (ctx && selectedEdges.includes(e1) && !selectedEdges.includes(e0))
            drawEdge(ctx, e0, 1);
    }
}
// highlight the edges that do not cross any of the selected edges and have no common endpoint with any of them (i.e. can cross them)
function highlightNonCrossingEdges() {
    if (selectedEdges.length === 0)
        return;
    // create a temporary parallel array for selected edges
    for (const edge of graph.edges) {
        let valid = true;
        // first check common endpoints with selected edges
        for (const e of selectedEdges)
            if (e === edge || edge.commonEndpoint(e)) {
                valid = false;
                break;
            }
        if (!valid)
            continue;
        // if OK with selected vertices, check crossings
        for (const cross of graph.crossings)
            if (cross.edges[0] === edge && selectedEdges.includes(cross.edges[1]) || cross.edges[1] === edge && selectedEdges.includes(cross.edges[0])) {
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
        return crossings_colors.self;
    else if (!cross.legal) // neighbor-edge crossings
        return crossings_colors.neighbor;
    else if (cross.more_than_once) // multiple crossings
        return crossings_colors.multiple;
    else // legal crossings
        return crossings_colors.legal;
}
function drawCrossings(ctx, self, neighbor, multiple, legal) {
    for (const cross of graph.crossings) {
        // different colors for different types of crossings
        if (cross.selfCrossing && self) // self-crossings
            drawCrossing(ctx, cross, crossings_colors.self);
        else if (!cross.legal && !cross.selfCrossing && neighbor) // neighbor-edge crossings
            drawCrossing(ctx, cross, crossings_colors.neighbor);
        else if (cross.legal && cross.more_than_once && multiple) // multiple crossings
            drawCrossing(ctx, cross, crossings_colors.multiple);
        else if (cross.legal && !cross.more_than_once && legal) // legal crossings
            drawCrossing(ctx, cross, crossings_colors.legal);
    }
}
function drawCrossing(ctx, cros, color) {
    ctx.beginPath();
    let radius = crosRadius;
    if (cros === hoveredCrossing)
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
    if (hoveredVertex === v)
        size = size + 1;
    drawShape(ctx, v.x, v.y, v.shape, size, v.color, true); // scaling in drawShape function
    // Draw label
    if (labels)
        showPointLabel(ctx, v);
    // add an orange circle around a selected vertex
    if (selectedVertices.includes(v))
        drawShape(ctx, v.x, v.y, v.shape, v.size + 2, "#FFA500", false); // scaling in drawShape function
}
// display the label of the given point
function showPointLabel(ctx, p) {
    if (!p.showLabel)
        return;
    ctx.fillStyle = p.labelColor;
    if (hoveredLabelPoint === p)
        ctx.fillStyle = "red";
    const adjustedFontSize = p.labelFont / scale;
    ctx.font = `${adjustedFontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    // we want the difference between the vertex and the label to remain the same regardless of the zoom scale, so we devide offsets by scale
    ctx.fillText(p.labelContent, p.x + p.labelOffsetX / scale, p.y - labelOffsetY(p) / scale); // positive is down in canvas
    ctx.fillStyle = "#000";
}
function labelOffsetY(point) {
    return (point.size + point.labelOffsetY + point.labelFont);
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
    labelDiv.style.left = `${canvas.offsetLeft + vertex.x + vertex.labelOffsetX}px`; // adjust as needed
    labelDiv.style.top = `${canvas.offsetTop + vertex.y - labelOffsetY(vertex)}px`;
    MathJax.typesetPromise([labelDiv]); // re-render the LaTeX
}
function clearLatexLabels() {
    document.querySelectorAll('[id^="latex-label-"]').forEach(el => el.remove());
}
function showHoveredInfo() {
    if (creatingEdge || draggingPoints.length > 0) {
        hideVertexInfo();
        hideEdgeInfo();
        hideCrossingInfo();
        return;
    }
    // show vertex info of hoveredVertex
    if (hoveredVertex)
        showVertexInfo(hoveredVertex);
    else
        hideVertexInfo();
    // show crossing info of hoveredCrossing
    /*if (hoveredCrossing)
        showCrossingInfo(hoveredCrossing);
    else
        hideCrossingInfo();*/
    // show edge info of hoveredVertex
    if (hoveredEdge)
        showEdgeInfo(hoveredEdge);
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
    if (bend === hoveredBend)
        size = size + 1;
    ctx.arc(bend.x, bend.y, size / scale, 0, 2 * Math.PI); // small green circle
    ctx.fillStyle = bend.color;
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.lineWidth = 2 / scale;
    // add a dashed circle around a selected bend
    if (selectedBends.includes(bend))
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
    //if ( (hoveredVertex === vertex && !draggingVertex) || draggingVertex === vertex) // bold line for hovered vertex or dragging vertex
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
        // increase thickness if edge === hoveredEdge
        if (hoveredEdge === edge)
            ctx.lineWidth = (edge.thickness + 2) / scale;
        // highlight if the edge is one of the edges of a hovering crossing
        if (hoveredCrossing && hoveredCrossingEdges.includes(edge)) {
            ctx.lineWidth = (edge.thickness + 2) / scale; // increase thickness
            ctx.strokeStyle = crossingColor(hoveredCrossing); // highlight the edge with the color of the crossing
            ctx.setLineDash([]); // no dashed line
        }
        else if (highlight === 1) // highlight crossing edges of selected edges
         {
            ctx.lineWidth = (edge.thickness + 2) / scale;
            ctx.strokeStyle = crossing_edges_colors.crossing;
            ctx.setLineDash([]);
        }
        else if (highlight === 2) // highlight non-crossing edges of selected edges
         {
            ctx.lineWidth = (edge.thickness + 2) / scale;
            ctx.strokeStyle = crossing_edges_colors.nonCrossing;
            ctx.setLineDash([]);
        }
        ctx.stroke();
        // if the edge is selected, highlight it with a dashed colored line
        if (selectedEdges.includes(edge)) // can be implemented faster by drawing all the selected edges first and then the others, so there's no need to check all the selectedVertices array for each edge
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
// check that mouse is near a label (in world coordinates)
function isNearLabel(point, x, y) {
    if (!point.showLabel)
        return false; // return false if the point's label is not displayed
    const labelX = point.x + point.labelOffsetX / scale;
    const labelY = point.y - labelOffsetY(point) / scale; // check that label is positioned at these coordinates at drawVertex function
    const width = point.labelContent.length * point.labelFont / scale;
    const height = 1.3 * point.labelFont / scale;
    return x >= labelX - width / 2 && x <= labelX + width / 2 &&
        y >= labelY && y <= labelY + height;
}
// return the pos of the mouse in the canvas
function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}
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
function saveState() {
    historyStack.push(graph.clone());
    redoStack.length = 0; // clear redo stack on new change
}
function fixView() {
    // check if there are selected points
    let points = [];
    if (selectedPoints.length > 0)
        points = selectedPoints;
    else {
        points = points.concat(graph.vertices);
        points = points.concat(graph.getBends());
    }
    myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.fixView(findMaxY(points), findMinY(points), findMinX(points), findMaxX(points));
}
// find the max x-coordinate of the given points
function findMaxX(points) {
    if (points.length === 0)
        return;
    let maxX = points[0].x;
    for (let i = 1; i < points.length; i++)
        if (points[i].x > maxX)
            maxX = points[i].x;
    return maxX;
}
// find the min x-coordinate of the given points
function findMinX(points) {
    if (points.length === 0)
        return null;
    let minX = points[0].x;
    for (let i = 1; i < points.length; i++)
        if (points[i].x < minX)
            minX = points[i].x;
    return minX;
}
// find the max y-coordinate of the given points
function findMaxY(points) {
    if (points.length === 0)
        return null;
    let maxY = points[0].y;
    for (let i = 1; i < points.length; i++)
        if (points[i].y > maxY)
            maxY = points[i].y;
    return maxY;
}
// find the min y-coordinate of the given points
function findMinY(points) {
    if (points.length === 0)
        return null;
    let minY = points[0].y;
    for (let i = 1; i < points.length; i++)
        if (points[i].y < minY)
            minY = points[i].y;
    return minY;
}
// export as JSON
function exportGraph(graph) {
    const exportData = {
        vertices: graph.vertices.map(v => ({
            id: v.id,
            x: v.x,
            y: v.y,
            color: v.color,
            size: v.size,
            shape: v.shape,
            labelOffsetX: v.labelOffsetX,
            labelOffsetY: v.labelOffsetY,
        })),
        edges: graph.edges.map(e => ({
            v1: e.points[0].id,
            v2: e.points[1].id,
            dashed: e.dashed,
            thickness: e.thickness,
            color: e.color,
            bends: e.bends.map(b => ({ x: b.x, y: b.y, size: b.size, color: b.color })),
        })),
    };
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "graph.json";
    a.click();
    URL.revokeObjectURL(url);
}
function restoreGraphFromJSON(data) {
    const newGraph = new Graph();
    // Reconstruct vertices
    for (const v of data.vertices) {
        const vertex = new Vertex(v.id, v.x, v.y);
        // Object.assign(vertex, v); // Copy extra fields like label, color, shape, etc.
        if (v.color)
            vertex.color = v.color;
        if (v.size)
            vertex.size = v.size;
        if (v.shape)
            vertex.shape = v.shape;
        if (v.labelOffsetX)
            vertex.labelOffsetX = v.labelOffsetX;
        if (v.labelOffsetY)
            vertex.labelOffsetY = v.labelOffsetY;
        newGraph.vertices.push(vertex);
    }
    // Reconstruct edges
    for (const e of data.edges) {
        const v1 = newGraph.vertices.find(v => v.id === e.v1);
        const v2 = newGraph.vertices.find(v => v.id === e.v2);
        if (v1 && v2) {
            const edge = newGraph.addEdge(v1, v2);
            // Object.assign(edge, e); // Copy extra fields like bends, color, etc.
            if (e.color)
                edge.color = e.color;
            if (e.thickness)
                edge.thickness = e.thickness;
            if (e.dashed)
                edge.dashed = e.dashed;
            // bends
            for (const b of e.bends) {
                const newBend = newGraph.addBend(v1, v2, b.x, b.y, false, false);
                if (b.size)
                    newBend.size = b.size;
                if (b.color)
                    newBend.color = b.color;
                //newBend?.assignCharacteristics(b.size,b.color);
            }
        }
    }
    newGraph.updateCrossings();
    newGraph.updateCurveComplexity();
    return newGraph;
}
// --- PDF Export Function ---
function exportCanvasAsPdf() {
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }
    // Get the image data from the canvas
    const imgData = canvas.toDataURL('image/png'); // Can also use 'image/jpeg'
    // Initialize jsPDF
    // 'p' for portrait, 'l' for landscape
    // 'mm' for millimeters (default unit), 'pt' for points, 'in' for inches
    // [width, height] can specify custom page size
    const doc = new window.jspdf.jsPDF('l', 'mm', 'a4'); // Use 'window.jspdf' for CDN import
    // Calculate dimensions to fit the image on the PDF page
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    // Calculate aspect ratio to fit the image within the page
    const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;
    // Center the image on the page
    const x = (pageWidth - scaledWidth) / 2;
    const y = (pageHeight - scaledHeight) / 2;
    // Add the image to the PDF
    doc.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
    // Save the PDF
    doc.save('graph.pdf');
}
// function for rendering latex content to image (to add the vertex labels as images to the graph picture)
function renderLatexToImage(latex) {
    return __awaiter(this, void 0, void 0, function* () {
        const tempDiv = document.createElement("div");
        tempDiv.style.position = "absolute";
        tempDiv.style.visibility = "hidden";
        tempDiv.innerHTML = `\\(${latex}\\)`;
        document.body.appendChild(tempDiv);
        yield MathJax.typesetPromise([tempDiv]);
        const svgElement = tempDiv.querySelector("svg");
        if (!svgElement)
            throw new Error("Failed to render LaTeX");
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.src = url;
        yield new Promise((resolve) => {
            img.onload = () => {
                document.body.removeChild(tempDiv);
                URL.revokeObjectURL(url);
                resolve();
            };
        });
        return img;
    });
}
function exportCanvasAsImage() {
    return __awaiter(this, void 0, void 0, function* () {
        // First draw graph normally...
        const canvas = document.getElementById("graphCanvas");
        // Create an off-screen canvas to not affect the visible one
        const exportCanvas = document.createElement("canvas");
        exportCanvas.width = canvas.width;
        exportCanvas.height = canvas.height;
        const exportCtx = exportCanvas.getContext("2d");
        if (!exportCtx)
            return;
        // Fill white background
        exportCtx.fillStyle = "white";
        exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        // Copy original canvas content
        exportCtx.drawImage(canvas, 0, 0);
        // add latex vertex labels
        for (const vertex of graph.vertices) {
            const label = "v_" + vertex.id; // or vertex.label if you use one
            const img = yield renderLatexToImage(label);
            const x = vertex.x + vertex.labelOffsetX;
            const y = vertex.y - labelOffsetY(vertex); // adjust position above the vertex
            const canvasPos = myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.worldToCanvas(x, y);
            if (canvasPos)
                exportCtx.drawImage(img, canvasPos.x * dpr, canvasPos.y * dpr);
        }
        const link = document.createElement("a");
        link.download = "graph.png";
        link.href = exportCanvas.toDataURL();
        link.click();
    });
}
