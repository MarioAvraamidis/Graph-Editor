// src/app.ts
import { Graph, Vertex, Bend, Crossing } from "./graph.js";

// Create a graph instance
let graph = new Graph();
const historyStack: Graph[] = [];
const redoStack: Graph[] = [];

let draggingVertex: Vertex | null = null;
let offsetX = 0;
let offsetY = 0;
let draggingBend: Bend | null = null;
let selectedVertex: Vertex | null = null;
let hasDragged = false;     // will be used to distinguish vertex selection from vertex drag
let mouse: {x: number,y: number};
let vertexRadius : number  =20;

//window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("graphCanvas") as HTMLCanvasElement;
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
        if(ctx)
            drawGraph(ctx, graph,false);
    }  

    // Add Vertex
    document.getElementById("add-vertex")?.addEventListener("click", () => {
        const input = (document.getElementById("vertexIdInput") as HTMLInputElement).value.trim();
        saveState();
        if (input) {
            // saveState();
            const vertex = new Vertex(input)
            graph.addVertex(vertex);
            // renderGraph();
        }
        // Add new Vertex and give it a name
        else{
            // saveState();
            const id = graph.maxVertexId();
            //console.log("Max numeric Id:",id);
            const vertex = new Vertex((id+1).toString(),Math.random()*ctx.canvas.width,Math.random()*ctx.canvas.height);
            graph.addVertex(vertex);
            // renderGraph();
        }
        renderGraph();
    });

    /*
    // Add new Vertex and give it a name
    document.getElementById("add-new-vertex")?.addEventListener("click", () => {
        saveState();
        const id = graph.maxVertexId();
        //console.log("Max numeric Id:",id);
        const vertex = new Vertex((id+1).toString(),Math.random()*ctx.canvas.width,Math.random()*ctx.canvas.height);
        graph.addVertex(vertex);
        renderGraph();
    });*/

    // Delete Vertex
    document.getElementById("delete-vertex")?.addEventListener("click", () => {
        const input = (document.getElementById("vertexIdInput") as HTMLInputElement).value.trim();
        if (input) {
        saveState();
        graph.deleteVertexId(input);
        renderGraph();
        }
    });

    // Add Edge
    document.getElementById("add-edge")?.addEventListener("click", () => {
        const from = (document.getElementById("edgeFromInput") as HTMLInputElement).value.trim();
        const to = (document.getElementById("edgeToInput") as HTMLInputElement).value.trim();
        if (from && to) {
        saveState();
        graph.addEdgeId(from, to);
        renderGraph();
        }
    });

    // Delete Edge
    document.getElementById("delete-edge")?.addEventListener("click", () => {
        const from = (document.getElementById("edgeFromInput") as HTMLInputElement).value.trim();
        const to = (document.getElementById("edgeToInput") as HTMLInputElement).value.trim();
        if (from && to) {
        saveState();
        graph.deleteEdgeId(from, to);
        renderGraph();
        }
    });

    // Add bend to an edge
    document.getElementById("add-bend")?.addEventListener("click", () => {
        const from = (document.getElementById("edgeFromInput") as HTMLInputElement).value.trim();
        const to = (document.getElementById("edgeToInput") as HTMLInputElement).value.trim();
        if (from && to)
        {
            let v = graph.getVertex(from);
            let u = graph.getVertex(to);
            if (v && u)
            {
                saveState();
                graph.addBend(v,u);
                renderGraph();
            }
        }
    });

    // Remove a bend from an edge
    document.getElementById("remove-bend")?.addEventListener("click", () => {
        const from = (document.getElementById("edgeFromInput") as HTMLInputElement).value.trim();
        const to = (document.getElementById("edgeToInput") as HTMLInputElement).value.trim();
        if (from && to)
        {
            let v = graph.getVertex(from);
            let u = graph.getVertex(to);
            if (v && u)
            {
                saveState();
                graph.removeBend(v,u);
                renderGraph();
            }
        }
    });

    // Undo button
    document.getElementById("undo-button")?.addEventListener("click", () => {
        if (historyStack.length > 0) {
            const current = cloneGraph(graph);
            redoStack.push(current);
            const prev = historyStack.pop()!;
            // graph.vertices = prev.vertices;
            // graph.edges = prev.edges;
            graph = prev;
            renderGraph();
        }
    });

    // Redo button
    document.getElementById("redo-button")?.addEventListener("click", () => {
        if (redoStack.length > 0) {
            const current = cloneGraph(graph);
            historyStack.push(current);
            const next = redoStack.pop()!;
            // graph.vertices = next.vertices;
            // graph.edges = next.edges;
            graph = next;
            renderGraph();
        }
    });

    // Place vertices in a circle
    document.getElementById("circle-placement")?.addEventListener("click", () => {
        saveState();
        graph.makeCircle(ctx.canvas.width/2,ctx.canvas.height/2,Math.min(ctx.canvas.height,ctx.canvas.width)/3);
        renderGraph();
    })

    // make the graph clique
    document.getElementById("make-clique")?.addEventListener("click", () => {
        saveState();
        graph.addAllEdges();
        renderGraph();
    })
    
    // Initial render
    renderGraph();
//});

// detect vertex selection
canvas.addEventListener("mousedown", e => {
    const mouse = getMousePos(canvas, e);

    // Try selecting a vertex
    for (const v of graph.vertices) {
        if (distance(mouse, { x: v.x, y: v.y }) < vertexRadius) {
            saveState();
            draggingVertex = v;
            hasDragged = false;  // Reset when mouse goes down
            offsetX = mouse.x - v.x;
            offsetY = mouse.y - v.y;
            //console.log("vertex "+v.id+" selected");
            return;
        }
    }

    // Try selecting a bend
    for (const e of graph.edges)
        for (const bend of e.bends)
            if (distance(mouse, {x: bend.x, y: bend.y}) < vertexRadius/4)
            {
                saveState();
                draggingBend = bend;
                offsetX = mouse.x - bend.x;
                offsetY = mouse.y - bend.y;
                return;
            }
});

// detect vertex moving
canvas.addEventListener("mousemove", e => {
    mouse = getMousePos(canvas, e);

    if (draggingVertex) {
        graph.moveVertex(draggingVertex,mouse.x - offsetX,mouse.y - offsetY);
        hasDragged = true;  // If the mouse moves, set flag
        renderGraph();
        // graph.printCrossings();
    }
    else if (draggingBend)
    {
        graph.moveBend(draggingBend, mouse.x - offsetX, mouse.y - offsetY);
        renderGraph();
        // graph.printCrossings();
    }
    else if (selectedVertex) 
        drawGraph(ctx, graph, false);
    // renderGraph();
});

// detect vertex release
canvas.addEventListener("mouseup", (e) => {
    
    const pos = getMousePos(canvas, e);
    const v = graph.getVertexAtPosition(pos.x, pos.y, vertexRadius);

    if (!hasDragged) {
        // It's a click, not a drag
        if (selectedVertex && v && selectedVertex !== v) {
            graph.addEdge(selectedVertex, v);
            selectedVertex = null;
        } else {
            selectedVertex = v;
        }
    }

    draggingVertex = null;
    draggingBend = null;
    hasDragged = false;
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
function drawGraph(ctx: CanvasRenderingContext2D, graph: Graph, circle: boolean = true) {

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

    const positions = new Map<string, { x: number; y: number }>();

    graph.vertices.forEach((vertex, index) => {
        const angle = (index / graph.vertices.length) * 2 * Math.PI;
        let x = ctx.canvas.width / 2 + Math.cos(angle) * 150;
        let y = ctx.canvas.height / 2 + Math.sin(angle) * 150;
        // not circular graph
        if(!circle)
        {
            x = vertex.x;
            y = vertex.y;
        }
        positions.set(vertex.id, { x, y })
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
            for (let i=0;i<bends.length;i++)
                ctx.lineTo(bends[i].x,bends[i].y);
            ctx.lineTo(v2.x, v2.y);
            ctx.strokeStyle = "#aaa";
            ctx.stroke();
            // draw bends
            for (let i=0;i<bends.length;i++)
                {
                    ctx.beginPath();
                    ctx.arc(bends[i].x, bends[i].y, vertexRadius/4 , 0, 2 * Math.PI); // small green circle
                    ctx.fillStyle = "yellow";
                    ctx.fill();
                    ctx.strokeStyle = "black";
                    ctx.stroke();
                }
        }
    });

    // Draw vertices
    graph.vertices.forEach(vertex => {
        const pos = positions.get(vertex.id);
        if (pos) {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, vertexRadius, 0, 2 * Math.PI);
            ctx.fillStyle = "#3498db";
            ctx.fill();
            ctx.strokeStyle = "#2980b9";
            ctx.stroke();

            // Draw label
            ctx.fillStyle = "#fff";
            ctx.font = "14px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(vertex.id, pos.x, pos.y);
        }

    // Draw a temporary edge from selected vertex to mouse position
    if (selectedVertex) {
        ctx.beginPath();
        ctx.moveTo(selectedVertex.x, selectedVertex.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
        ctx.setLineDash([5, 5]); // dashed line
        ctx.stroke();
        ctx.setLineDash([]); // reset
    }
    });

    // Draw crossings
    // graph.updateCrossings();
    for (const cross of graph.crossings)
    {
        ctx.beginPath();
        ctx.arc(cross.x, cross.y, vertexRadius/5 , 0, 2 * Math.PI); // small green circle
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
}



// return the pos of the mouse in the canvas
function getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

// euclidean distance
function distance(p1: { x: number, y: number }, p2: { x: number, y: number }) {
    return Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
}

// Clone utility to store independent copies of graph
function cloneGraph(original: Graph): Graph {
    const cloned = new Graph();
    // clone vertices
    for (const v of original.vertices) {
        cloned.addVertex(new Vertex(v.id,v.x,v.y ));
    }
    // clone edges
    for (const e of original.edges) {
        cloned.addEdgeId(e.points[0].id, e.points[1].id);
        let bends = e.bends;
        let edge = cloned.getEdgeByVerticesId(e.points[0].id,e.points[1].id);
        edge?.addBends(bends);
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