var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
// src/app.ts
import { Graph, Vertex } from "./graph.js";
// Create a graph instance
let graph = new Graph();
const historyStack = [];
const redoStack = [];
let offsetX = 0;
let offsetY = 0;
let draggingVertex = null;
let draggingBend = null;
let selectedVertex = null;
let hasDragged = false; // will be used to distinguish vertex selection from vertex drag
let mouse;
let vertexRadius = 20;
let hoveredEdge = null;
let hoveredVertex = null;
//window.addEventListener("DOMContentLoaded", () => {
const canvas = document.getElementById("graphCanvas");
const ctx = canvas.getContext("2d");
if (!ctx) {
    throw new Error("Could not get canvas rendering context");
}
// Helper to display the graph
function renderGraph() {
    const output = document.getElementById("output");
    if (output) {
        const vertexList = graph.vertices.map(v => v.id).join(", ");
        const edgeList = graph.edges.map(e => `(${e.points[0].id}-${e.points[1].id})`).join(", ");
        output.textContent = `Crossings: ${graph.crossings.length} (Thrackle: ${graph.thrackleNumber()}) \nCurve Complexity: ${graph.curve_complexity}`;
        // output.textContent = `Vertices: ${vertexList}\nEdges: ${edgeList}`;
    }
    // draw the graph
    if (ctx)
        drawGraph(ctx, graph, false);
}
// Add Vertex
(_a = document.getElementById("add-vertex")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
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
    renderGraph();
});
// Delete Vertex
(_b = document.getElementById("delete-vertex")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", () => {
    const input = document.getElementById("vertexIdInput").value.trim();
    if (input) {
        saveState();
        graph.deleteVertexId(input);
        renderGraph();
    }
});
// Add Edge
(_c = document.getElementById("add-edge")) === null || _c === void 0 ? void 0 : _c.addEventListener("click", () => {
    const from = document.getElementById("edgeFromInput").value.trim();
    const to = document.getElementById("edgeToInput").value.trim();
    if (from && to) {
        saveState();
        graph.addEdgeId(from, to);
        renderGraph();
    }
});
// Delete Edge
(_d = document.getElementById("delete-edge")) === null || _d === void 0 ? void 0 : _d.addEventListener("click", () => {
    const from = document.getElementById("edgeFromInput").value.trim();
    const to = document.getElementById("edgeToInput").value.trim();
    if (from && to) {
        saveState();
        graph.deleteEdgeId(from, to);
        renderGraph();
    }
});
// Add bend to an edge
(_e = document.getElementById("add-bend")) === null || _e === void 0 ? void 0 : _e.addEventListener("click", () => {
    const from = document.getElementById("edgeFromInput").value.trim();
    const to = document.getElementById("edgeToInput").value.trim();
    if (from && to) {
        let v = graph.getVertex(from);
        let u = graph.getVertex(to);
        if (v && u) {
            saveState();
            graph.addBend(v, u);
            renderGraph();
        }
    }
});
// Remove a bend from an edge
(_f = document.getElementById("remove-bend")) === null || _f === void 0 ? void 0 : _f.addEventListener("click", () => {
    const from = document.getElementById("edgeFromInput").value.trim();
    const to = document.getElementById("edgeToInput").value.trim();
    if (from && to) {
        let v = graph.getVertex(from);
        let u = graph.getVertex(to);
        if (v && u) {
            saveState();
            graph.removeBend(v, u);
            renderGraph();
        }
    }
});
// Undo button
(_g = document.getElementById("undo-button")) === null || _g === void 0 ? void 0 : _g.addEventListener("click", () => {
    if (historyStack.length > 0) {
        const current = cloneGraph(graph);
        redoStack.push(current);
        const prev = historyStack.pop();
        // graph.vertices = prev.vertices;
        // graph.edges = prev.edges;
        graph = prev;
        renderGraph();
    }
});
// Redo button
(_h = document.getElementById("redo-button")) === null || _h === void 0 ? void 0 : _h.addEventListener("click", () => {
    if (redoStack.length > 0) {
        const current = cloneGraph(graph);
        historyStack.push(current);
        const next = redoStack.pop();
        // graph.vertices = next.vertices;
        // graph.edges = next.edges;
        graph = next;
        renderGraph();
    }
});
// Place vertices in a circle
(_j = document.getElementById("circle-placement")) === null || _j === void 0 ? void 0 : _j.addEventListener("click", () => {
    saveState();
    graph.makeCircle(ctx.canvas.width / 2, ctx.canvas.height / 2, Math.min(ctx.canvas.height, ctx.canvas.width) / 3);
    renderGraph();
});
// make the graph clique
(_k = document.getElementById("make-clique")) === null || _k === void 0 ? void 0 : _k.addEventListener("click", () => {
    saveState();
    graph.addAllEdges();
    renderGraph();
});
// make the graph straight line
(_l = document.getElementById("clear-bends")) === null || _l === void 0 ? void 0 : _l.addEventListener("click", () => {
    saveState();
    graph.removeBends();
    renderGraph();
});
// remove all the edges
(_m = document.getElementById("clear-edges")) === null || _m === void 0 ? void 0 : _m.addEventListener("click", () => {
    saveState();
    graph.removeEdges();
    renderGraph();
});
// Initial render
renderGraph();
//});
// detect vertex selection
canvas.addEventListener("mousedown", e => {
    const mouse = getMousePos(canvas, e);
    // Try selecting a vertex
    for (const v of graph.vertices) {
        if (distance(mouse, { x: v.x, y: v.y }) < vertexRadius) {
            if (!selectedVertex) // don't save when no changes made
                saveState();
            // console.log("mousedown"); // click is considered as mousedown
            draggingVertex = v;
            hasDragged = false; // Reset when mouse goes down
            offsetX = mouse.x - v.x;
            offsetY = mouse.y - v.y;
            //console.log("vertex "+v.id+" selected");
            return;
        }
    }
    // Try selecting a bend
    for (const e of graph.edges)
        for (const bend of e.bends)
            if (distance(mouse, { x: bend.x, y: bend.y }) < vertexRadius / 3) {
                saveState();
                draggingBend = bend;
                hasDragged = false;
                offsetX = mouse.x - bend.x;
                offsetY = mouse.y - bend.y;
                return;
            }
});
// detect vertex or bend moving
canvas.addEventListener("mousemove", e => {
    mouse = getMousePos(canvas, e);
    if (draggingVertex) {
        graph.moveVertex(draggingVertex, mouse.x - offsetX, mouse.y - offsetY);
        hasDragged = true; // If the mouse moves, set flag
        renderGraph();
        // graph.printCrossings();
    }
    else if (draggingBend) {
        graph.moveBend(draggingBend, mouse.x - offsetX, mouse.y - offsetY);
        hasDragged = true;
        renderGraph();
        // graph.printCrossings();
    }
    else if (selectedVertex) {
        // consider moving the vertex to show crossings live
        drawGraph(ctx, graph, false);
    }
    // detect hovering over edge
    hoveredEdge = graph.isNearEdge(mouse.x, mouse.y, 3);
    hoveredVertex = graph.isNearVertex(mouse.x, mouse.y, vertexRadius);
    // don't select an edge when mouse is over a vertex or a dragging vertex/bend
    if (hoveredVertex || hasDragged || selectedVertex) {
        canvas.style.cursor = "default"; // Show default cursor
        hoveredEdge = null;
    }
    // console.log("Hovered edge", hoveredEdge?.id);
    else if (hoveredEdge) {
        canvas.style.cursor = "pointer"; // Show hand cursor
    }
    else {
        canvas.style.cursor = "default";
    }
    drawGraph(ctx, graph, false);
    // renderGraph();
});
// detect vertex release
canvas.addEventListener("mouseup", (e) => {
    const pos = getMousePos(canvas, e);
    const v = graph.getVertexAtPosition(pos.x, pos.y, vertexRadius);
    // const b = graph.getLastBendAtPosition(pos.x, pos.y, vertexRadius/4);
    if (!hasDragged) {
        // It's a click, not a drag
        if (selectedVertex && v && selectedVertex !== v) {
            saveState();
            graph.addEdgeAdvanced(selectedVertex, v);
            selectedVertex = null;
        }
        else if (selectedVertex) {
            saveState();
            graph.extendEdge(selectedVertex, pos.x, pos.y);
            selectedVertex = null;
        }
        else {
            selectedVertex = v;
            // if nothing selected, add a new vertex at the point clicked
            if (!v && !hoveredEdge) {
                const vertex = new Vertex((graph.maxVertexId() + 1).toString(), mouse.x, mouse.y);
                graph.addVertex(vertex);
            }
        }
    }
    draggingVertex = null;
    draggingBend = null;
    hasDragged = false;
    renderGraph();
});
canvas.addEventListener("click", () => {
    if (hoveredEdge) {
        saveState();
        const p1 = hoveredEdge.points[0];
        const p2 = hoveredEdge.points[1];
        if (p1 instanceof Vertex && p2 instanceof Vertex)
            graph.addBend(p1, p2, mouse.x, mouse.y);
        // set it free
        hoveredEdge = null;
        canvas.style.cursor = "default";
    }
    renderGraph();
});
/*
canvas.addEventListener("click", (e) => {

    // if (draggingVertex) return;

    // console.log("click");
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedVertex = graph.vertices.find(v => {
        const dx = v.x - x;
        const dy = v.y - y;
        return Math.sqrt(dx * dx + dy * dy) < vertexRadius;
    });

    if (!clickedVertex) {
        // Cancel selection
        selectedVertex = null;
        drawGraph(ctx, graph, false);
        return;
    }

    if (!selectedVertex) {
        selectedVertex = clickedVertex;
        drawGraph(ctx, graph, false);
    } else if (selectedVertex !== clickedVertex) {
        graph.addEdge(selectedVertex, clickedVertex);
        selectedVertex = null;
        renderGraph();
    }

});*/
// draw the graph
function drawGraph(ctx, graph, circle = true) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // compute vertexRadius
    if (graph.vertices.length <= 20)
        vertexRadius = 20;
    else if (graph.vertices.length < 50)
        vertexRadius = 10;
    else
        vertexRadius = 5;
    // const radius = 20;
    const spacing = 100;
    const positions = new Map();
    graph.vertices.forEach((vertex, index) => {
        const angle = (index / graph.vertices.length) * 2 * Math.PI;
        let x = ctx.canvas.width / 2 + Math.cos(angle) * 150;
        let y = ctx.canvas.height / 2 + Math.sin(angle) * 150;
        // not circular graph
        if (!circle) {
            x = vertex.x;
            y = vertex.y;
        }
        positions.set(vertex.id, { x, y });
    });
    // Draw edges first
    graph.edges.forEach(edge => {
        const v1 = positions.get(edge.points[0].id);
        const v2 = positions.get(edge.points[1].id);
        if (v1 && v2) {
            ctx.beginPath();
            ctx.moveTo(v1.x, v1.y);
            const bends = edge.bends;
            // draw the edge passing through bends
            for (let i = 0; i < bends.length; i++)
                ctx.lineTo(bends[i].x, bends[i].y);
            ctx.lineTo(v2.x, v2.y);
            ctx.strokeStyle = "#aaa";
            if (hoveredEdge === edge)
                ctx.lineWidth = 4;
            else
                ctx.lineWidth = 2;
            ctx.stroke();
            // draw bends
            for (let i = 0; i < bends.length; i++) {
                // show bigger bend when mouse near it
                let rad;
                if (distance(mouse, { x: bends[i].x, y: bends[i].y }) < vertexRadius / 3)
                    drawBend(ctx, bends[i].x, bends[i].y, vertexRadius / 3.5);
                else
                    drawBend(ctx, bends[i].x, bends[i].y, vertexRadius / 4);
            }
        }
    });
    // Draw vertices
    graph.vertices.forEach(vertex => {
        if (vertex.temporary)
            drawBend(ctx, vertex.x, vertex.y, vertexRadius / 3.5, true);
        else
            drawVertex(ctx, vertex);
    });
    // Draw a temporary edge from selected vertex to mouse position
    if (selectedVertex) {
        ctx.beginPath();
        ctx.moveTo(selectedVertex.x, selectedVertex.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
        ctx.setLineDash([3, 3]); // dashed line
        ctx.stroke();
        ctx.setLineDash([]); // reset
        // draw a bend at the cursor
        if (!graph.isNearVertex(mouse.x, mouse.y, vertexRadius))
            drawBend(ctx, mouse.x, mouse.y, vertexRadius / 4);
    }
    // Draw crossings
    // graph.updateCrossings();
    for (const cross of graph.crossings) {
        ctx.beginPath();
        ctx.arc(cross.x, cross.y, vertexRadius / 5, 0, 2 * Math.PI); // small green circle
        // ctx.fillStyle = "yellow";
        // ctx.fill();
        if (!cross.legal)
            ctx.strokeStyle = "red";
        else if (cross.more_than_once)
            ctx.strokeStyle = "orange";
        else
            ctx.strokeStyle = "green";
        ctx.stroke();
    }
    // If hovering over an edge, show a tooltip
    if (hoveredEdge) {
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, vertexRadius / 4, 0, 2 * Math.PI); // small yellow circle
        ctx.fillStyle = "yellow";
        ctx.fill();
        ctx.strokeStyle = "black";
        ctx.stroke();
    }
}
// function for drawing a vertex
function drawVertex(ctx, vertex) {
    ctx.beginPath();
    ctx.arc(vertex.x, vertex.y, vertexRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "#3498db";
    ctx.fill();
    ctx.strokeStyle = "#2980b9";
    if (hoveredVertex === vertex)
        ctx.lineWidth = 4;
    ctx.stroke();
    ctx.lineWidth = 2;
    // Draw label
    ctx.fillStyle = "#fff";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(vertex.id, vertex.x, vertex.y);
}
// function for drawing a bend
function drawBend(ctx, x, y, rad, orange = false) {
    ctx.beginPath();
    // show bigger bend when mouse near it
    ctx.arc(x, y, rad, 0, 2 * Math.PI); // small green circle
    ctx.fillStyle = "yellow";
    if (orange)
        ctx.fillStyle = "orange";
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.stroke();
}
// return the pos of the mouse in the canvas
function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}
// euclidean distance
function distance(p1, p2) {
    return Math.sqrt(Math.pow((p1.x - p2.x), 2) + Math.pow((p1.y - p2.y), 2));
}
// Clone utility to store independent copies of graph
function cloneGraph(original) {
    const cloned = new Graph();
    // clone vertices
    for (const v of original.vertices) {
        cloned.addVertex(new Vertex(v.id, v.x, v.y, v.temporary));
    }
    // clone edges
    for (const e of original.edges) {
        cloned.addEdgeId(e.points[0].id, e.points[1].id);
        let bends = e.bends;
        let edge = cloned.getEdgeByVerticesId(e.points[0].id, e.points[1].id);
        edge === null || edge === void 0 ? void 0 : edge.addBends(bends);
    }
    // update crossings - consider cloning the crossings
    /* for (const cros of original.crossings)
    {
        const [sub1,sub2] = cros.subedges;
        let newCros = new Crossing(sub1,sub2,cros.x,cros.y);
        newCros.edges = cros.edges;
        cloned.crossings.push(newCros);
    }*/
    cloned.updateCrossings();
    cloned.updateCurveComplexity();
    return cloned;
}
function saveState() {
    historyStack.push(cloneGraph(graph));
    redoStack.length = 0; // clear redo stack on new change
}
