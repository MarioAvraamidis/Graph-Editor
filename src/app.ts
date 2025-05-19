// src/app.ts
import { Graph, Vertex, Bend, Edge, Point, Crossing } from "./graph.js";

// Create a graph instance
let graph = new Graph();
// history stack and redo stack for undo/redo
const historyStack: Graph[] = [];
const redoStack: Graph[] = [];
// mouse
let mouse: {x: number,y: number};
let offsetX = 0;    // x-offset between click position and mouse's current position
let offsetY = 0;    // y-offset between click position and mouse's current position
// dragging
let draggingPoints: Point[] = [];
let hasDragged = false;     // will be used to distinguish vertex selection from vertex drag
// bends
let bendRadius: number = 5; // radius of bends
// crossings
let crosRadius: number = 5; // radius of crossings
// mode
let currentMode: "select" | "addBend" = "select";   // | "createEdge"
// hovered objects
let hoveredEdge: Edge | null = null;
let hoveredVertex: Vertex | null = null;
let hoveredBend: Bend | null = null;
let hoveredLabelVertex: Vertex | null = null;
let hoveredPoint: Point | null = null;
let hoveredCrossing: Crossing | null = null;
let hoveredCrossingEdges: [Edge | null, Edge | null];
// selected items
let selectedPoints: Point[] = [];
let selectedVertices: Vertex[] = [];
let selectedBends: Bend[] = [];
let selectedEdges: Edge[] = [];
// creating edge
let creatingEdge: boolean = false;          // will be used to check if a new edge is being drawn
let startingVertex: Vertex | null = null;   // the vertex from which an edge starts
let canClick: boolean = true;               // is activated a click after an edge creation is done
let edgeCreated: Edge | null = null;        // the new edge that is being created during edge creation
// mousedown
let mousedown: boolean = false;
let clickedX: number = 0;                               // mouse x-coordinate at mousedown
let clickedY: number = 0;                               // mouse y-coordinate at mousedown
let positionsAtMouseDown: {x: number,y: number}[] = []; // positions of selected objects at mousedown time
// creating a rectangle for selected space
let isSelecting = false;
let selectionStart = { x: 0, y: 0 };
let selectionRect = { x: 0, y: 0, width: 0, height: 0 };
// moving labels
let draggingLabelVertex: Vertex | null = null;
// default colors for crossings
let crossings_colors = { self: "purple", neighbor: "red", multiple: "orange", legal: "green" };
// palette settings
let vertexChars = { color: "#000000", size: 7, shape: "circle" }  // default settings of class Vertex
let edgeChars = {color: "#898989", thickness: 2, dashed: false} // default of class Edge
let bendChars = {size: 5, color: "#0000FF"}

function setMode(mode: typeof currentMode) {
    currentMode = mode;     // update mode

    // Update UI: toggle "active" class
    document.querySelectorAll(".mode-button").forEach(btn => {
        btn.classList.remove("active");
    });

    const buttonId = {
        "select": "mode-select",
        "addBend": "mode-add-bend"
        //,"createEdge": "mode-create-edge"
    }[mode];

    document.getElementById(buttonId)?.classList.add("active");
}

// Set up listeners
document.getElementById("mode-select")?.addEventListener("click", () => setMode("select"));
document.getElementById("mode-add-bend")?.addEventListener("click", () => setMode("addBend"));
// document.getElementById("mode-create-edge")?.addEventListener("click", () => setMode("createEdge"));

//window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("graphCanvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Could not get canvas rendering context");
    }

function renderGraph() {
    const output = document.getElementById("output");
    if (output) {
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

        if (totalCrossingsSpan) totalCrossingsSpan.textContent = `${graph.crossings.length}`;
        if (selfCrossingsSpan) selfCrossingsSpan.textContent = `${crossings_categories.self}`;
        if (neighborCrossingsSpan) neighborCrossingsSpan.textContent = `${crossings_categories.neighbor}`;
        if (multipleCrossingsSpan) multipleCrossingsSpan.textContent = `${crossings_categories.multiple}`;
        if (legalCrossingsSpan) legalCrossingsSpan.textContent = `${crossings_categories.legal}`;
        if (thrackleNumberSpan) thrackleNumberSpan.textContent = `${graph.thrackleNumber()}`;
        if (curveComplexitySpan) curveComplexitySpan.textContent = `${graph.curve_complexity}`;

        // Apply label colors based on data-color-key
        const labels = output.querySelectorAll<HTMLLabelElement>('label[data-color-key]');
        labels.forEach(label => {
            const colorKey = label.getAttribute('data-color-key');
            if (colorKey && colorKey in crossings_colors) {
                label.style.color = crossings_colors[colorKey as keyof typeof crossings_colors];
            }
        });

        // Attach event listeners to the checkboxes (do this once, perhaps outside renderGraph if the structure is static)

        let checkboxes = output.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                if(ctx)
                    drawGraph(ctx, graph);
            });
        });
        // event-listener for other highlighting crossing edges checkboxes
        for (const id of ["highlight-crossing-edges","highlight-non-crossing-edges"])
        {
            document.getElementById(id)?.addEventListener('change', () => {
                if (ctx)
                    drawGraph(ctx, graph);
            })
        }
    }
    if (ctx)
        drawGraph(ctx, graph);
    updatePaletteState();
}

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
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
                graph.removeBendd(v,u);
                renderGraph();
            }
        }
    });

    document.getElementById("undo-button")?.addEventListener("click", () => {
        undo();
    });

    // Redo button
    document.getElementById("redo-button")?.addEventListener("click", () => {
        redo();
    });

    document.addEventListener('keydown', (e) => {
        // undo
        if (e.ctrlKey && e.key==='z')
        {
            e.preventDefault(); // prevent the browser's default undo behavior
            undo();
        }
        // redo
        else if (e.ctrlKey && e.key==='y' || e.shiftKey && e.ctrlKey && e.key==='z')
        {
            e.preventDefault();
            redo();
        }
        else if(e.key==='Delete' || e.key==='Backspace')
        {
            e.preventDefault();
            if (selectedPoints.length > 0 || selectedEdges.length > 0)
            {
                saveState();
                deleteSelectedVertices();
                deleteSelectedBends();
                deleteSelectedEdges();
                checkHovered();
                renderGraph();
            }
        }
    });

    // undo utility
    function undo()
    {
        if (historyStack.length > 0) {
            setNothingSelected();
            const current = graph.clone();
            redoStack.push(current);
            const prev = historyStack.pop()!;
            graph = prev;
            renderGraph();
        }
    }

    // redo utility
    function redo()
    {
        if (redoStack.length > 0) {
            const current = graph.clone();
            historyStack.push(current);
            const next = redoStack.pop()!;
            // graph.vertices = next.vertices;
            // graph.edges = next.edges;
            graph = next;
            renderGraph();
        }
    }

    // Place vertices in a circle
    document.getElementById("circle-placement")?.addEventListener("click", () => {
        saveState();
        graph.makeCircle(ctx.canvas.width/2,ctx.canvas.height/2,Math.min(ctx.canvas.height,ctx.canvas.width)/3,selectedVertices);
        renderGraph();
    })

    // make the graph (or the group of selected vertices) clique
    document.getElementById("make-clique")?.addEventListener("click", () => {
        saveState();
        graph.addAllEdges(selectedVertices);
        renderGraph();
    })

    // make the graph straight line
    document.getElementById("clear-bends")?.addEventListener("click", () => {
        saveState();
        graph.removeBends();
        renderGraph();
    })

    // remove all the edges
    document.getElementById("clear-edges")?.addEventListener("click", () => {
        saveState();
        graph.removeEdges();
        renderGraph();
    });

    document.getElementById("export-json-btn")!.addEventListener("click", () => {
        exportGraph(graph);
    });

    document.getElementById("export-image")!.addEventListener("click", () => {
        drawGraph(ctx,graph,false);
        exportCanvasAsImage();
        drawGraph(ctx,graph);
    } )

    document.getElementById("import-input")!.addEventListener("change", async (e) => {
        const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;
    
        const file = input.files[0];
        const text = await file.text();
    
        try {
            saveState();
            setNothingSelected();
            const data = JSON.parse(text);
            // console.log(data);
            graph = restoreGraphFromJSON(data);
            renderGraph();
        } catch (err) {
            alert("Failed to load graph: Invalid format");
            console.error(err);
        }
    });
    

    // Palette for vertices
    const vertexColor = document.getElementById("vertex-color") as HTMLSelectElement
    const vertexShapeButtons = document.querySelectorAll(".shape-button");
    const vertexSize = document.getElementById("vertex-size") as HTMLInputElement;
    const deleteVertexBtn = document.getElementById("delete-vertex-palette")!;
    // Palette for bends
    const bendColor = document.getElementById("bend-color") as HTMLSelectElement
    // const bendShape = document.getElementById("bend-shape") as HTMLSelectElement;
    const bendSize = document.getElementById("bend-size") as HTMLInputElement;
    const deleteBendBtn = document.getElementById("delete-bend")!;
    // Palette for Edges
    const deleteEdgeBtn = document.getElementById("delete-edge-palette")!;
    const edgeThickness = document.getElementById("edge-thickness") as HTMLInputElement;
    const edgeColor = document.getElementById("edge-color") as HTMLSelectElement

    // using palettes
    vertexColor.addEventListener("change", () => {
        // update selected vertices' color
        if (selectedVertices.length > 0)
        {
            saveState();
            selectedVertices.forEach(v => v.color = vertexColor.value);
            renderGraph();
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
        
        if (selectedVertices.length > 0 && btn.classList)   // update shape of selected vertices
        {
            saveState();
            selectedVertices.forEach(v => v.shape = selectedShape!)
            renderGraph();
        }
        // update new vertex shape
        vertexChars.shape = selectedShape!;
    });
      });

    // vertex size
    vertexSize.addEventListener("input", () => {
        const size = parseInt(vertexSize.value);
        if (selectedVertices.length > 0)
        {
            saveState();
            selectedVertices.forEach(v => v.size = size);
            renderGraph();
        }
        else
            vertexChars.size = size;
    });

    // Vertex rename
    document.getElementById("rename-vertex")?.addEventListener("click", () => {
        const input = (document.getElementById("vertexIdInput") as HTMLInputElement).value.trim();
        if (input && selectedVertices.length===1) {
            saveState();
            const selectedVertex = selectedVertices[0];
            graph.renameVertex(selectedVertex,input);
            renderGraph();
        }
    });

    // bend color
    bendColor.addEventListener("change", () => {
        if (selectedBends.length > 0)   // apply change on selected bends
        {
            saveState();
            selectedBends.forEach(b => b.color = bendColor.value);
            renderGraph();
        }
        else    // set color for new bends
            bendChars.color = bendColor.value;
    });

    // bend size
    bendSize.addEventListener("input", () => {
        const size = parseInt(bendSize.value);
        if (selectedBends.length > 0)
        {
            saveState();
            selectedBends.forEach(b => b.size = size);
            renderGraph();
        }
        else
            bendChars.size = size;
    });

    // edge color
    edgeColor.addEventListener("change", () => {
        if (selectedEdges.length > 0)
        {
            saveState();
            selectedEdges.forEach(e => e.color = edgeColor.value);
            renderGraph();
        }
        else
            edgeChars.color = edgeColor.value;
    });

    // edge thickness
    edgeThickness.addEventListener("input", () => {
        if (selectedEdges.length > 0)
        {
            saveState();
            selectedEdges.forEach(e => e.thickness = parseInt(edgeThickness.value))
            renderGraph();
        }
        else
            edgeChars.thickness = parseInt(edgeThickness.value);
    });

    // delete vertex button
    deleteVertexBtn.addEventListener("click", () => {
        saveState();
        deleteSelectedVertices();
        renderGraph();
    });

    // delete bend button
    deleteBendBtn.addEventListener("click", () => {
        saveState();
        deleteSelectedBends();
        renderGraph();
    });

    // delete edge button
    deleteEdgeBtn.addEventListener("click", () => {
        saveState();
        deleteSelectedEdges();
        renderGraph();
    });

    // deletion of selected vertices (and removal of their corresponding edges and bends from selected objects)
    function deleteSelectedVertices()
    {
        selectedVertices.forEach(v => graph.deleteVertex(v));
        // remove the corresponding edges from selectedEdges
        selectedEdges = selectedEdges.filter(e => e.points[0] instanceof Vertex && !selectedVertices.includes(e.points[0]) && e.points[1] instanceof Vertex && !selectedVertices.includes(e.points[1]));
        // remove the corresponding bends from selectedBends
        selectedBends = selectedBends.filter(b => b.edge.points[0] instanceof Vertex && !selectedVertices.includes(b.edge.points[0]) && b.edge.points[1] instanceof Vertex && !selectedVertices.includes(b.edge.points[1]));
        // update selectedVertices
        selectedVertices.length = 0;
    }

    // deletion of selected bends
    function deleteSelectedBends()
    {
        selectedBends.forEach(b => graph.removeBend(b));
        selectedBends.length = 0;
    }

    // deletion of selected edges
    function deleteSelectedEdges()
    {
        selectedEdges.forEach(e => graph.deleteEdgee(e));
        selectedEdges.length = 0;
    }

    // dashed edge button
    let toggle_dashed_btn = document.getElementById("toggle-dashed");
    toggle_dashed_btn!.addEventListener("click", () => {
        if (selectedEdges.length > 0)
        {
            saveState();
            const dashed = !selectedEdges[0].dashed;
            for (const e of selectedEdges)
                e.dashed = dashed;
            renderGraph();
        }
        else
        {
            edgeChars.dashed = !edgeChars.dashed;
            if(edgeChars.dashed)
                toggle_dashed_btn?.classList.add("active");
            else
                toggle_dashed_btn?.classList.remove("active");
        }
    });
    
    // Initial render
    // resizeCanvas();
    renderGraph();
//});

// detect vertex/bend selection
canvas.addEventListener("mousedown", (e) => {

    checkHovered();

    // check if the clicked point belongs to the selected ones
    // if yes, set dragging points = selected points and store the positions of selected vertices at the time of mousedown
    hoveredPoint = graph.getPointAtPosition(mouse.x, mouse.y);
    if (hoveredPoint && selectedPoints.includes(hoveredPoint) || hoveredEdge && selectedEdges.includes(hoveredEdge))
    {
        saveState();
        draggingPoints = selectedPoints;
        // also add to dragging points the endpoints and bends of selected edges
        for (const se of selectedEdges)
        {
            selectedPoints.push(se.points[0]);
            selectedPoints.push(se.points[1]);
            for (const bend of se.bends)
                selectedPoints.push(bend);
        }
        // save positions at mousedown
        positionsAtMouseDown = [];
        for (let i=0;i<selectedPoints.length;i++)
            positionsAtMouseDown.push({x: selectedPoints[i].x,y: selectedPoints[i].y});
    }

    // starting vertex for edge creation
    if (selectedPoints.length === 0 && !creatingEdge)   // hasDragged for not setting starting vertex a selected vertex
    {
        startingVertex = hoveredVertex;
        /*if (startingVertex)
            console.log("mousedown, startingVertex="+startingVertex.id);
        else
            console.log("mousedown, startingVertex = null");*/
    }

    // label move
    if (!creatingEdge)
        draggingLabelVertex = hoveredLabelVertex;  

    hasDragged = false;
    mousedown = true;
    // save mouse position
    clickedX = mouse.x;
    clickedY = mouse.y;
    // console.log("mousedown:",clickedX,clickedY);
    // selection rectangle starting points
    selectionStart.x = mouse.x;
    selectionStart.y = mouse.y;
});

// detect vertex or bend moving
canvas.addEventListener("mousemove", e => {
    // update mouse position
    mouse = getMousePos(canvas, e);
    offsetX = mouse.x - clickedX;
    offsetY = mouse.y - clickedY;
    checkHovered();
    // console.log("mousemove:",mouse.x,mouse.y,clickedX,clickedY);

    if (mousedown && Math.hypot(offsetX,offsetY) > 3)
    {
        hasDragged = true;
        if (startingVertex && selectedPoints.length===0 && !creatingEdge)    // creatingEdge is activated only if we have a starting vertex and no selected points
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

    for (let i=0;i<draggingPoints.length;i++)
    {
        graph.movePoint(draggingPoints[i], positionsAtMouseDown[i].x + offsetX, positionsAtMouseDown[i].y + offsetY);
        // console.log("vertex "+v.id,v.x,v.y);
        renderGraph();
    }

    // cursor style for add bend mode
    if (currentMode === "addBend")
    {
        // don't select an edge when cursor is over a vertex or a dragging vertex/bend or when a vertex is selected
        /*if(hoveredVertex || hasDragged || selectedVertex)
        {
            canvas.style.cursor = "default"; // Show default cursor
            hoveredEdge = null;
        }
        // console.log("Hovered edge", hoveredEdge?.id);
        else */ if (hoveredEdge) {
            canvas.style.cursor = "pointer"; // Show hand cursor
        }else {
            canvas.style.cursor = "default";
        }
        drawGraph(ctx,graph);
    }

    // label move
    if (draggingLabelVertex && hasDragged)
    {
        draggingLabelVertex.labelOffsetX = inLimits(mouse.x - draggingLabelVertex.x,40);
        draggingLabelVertex.labelOffsetY = inLimits(- mouse.y + draggingLabelVertex.y,40);
    }

    // create a rectangle showing selected space
    if (selectedPoints.length === 0 && !creatingEdge && !e.ctrlKey && !draggingLabelVertex && mousedown && hasDragged)
    {
        isSelecting = true;
        // console.log("creatingEdge=",creatingEdge);
    }

    // rectangle for selected space
    if (isSelecting)
    {
        // console.log("is selecting = true, creatingEdge=",creatingEdge);
        selectionRect.x = Math.min(selectionStart.x, mouse.x);
        selectionRect.y = Math.min(selectionStart.y, mouse.y);
        selectionRect.width = Math.abs(mouse.x - selectionStart.x);
        selectionRect.height = Math.abs(mouse.y - selectionStart.y);
        drawGraph(ctx, graph); // Redraw with selection box
    }

    renderGraph();
});

// detect vertex release
canvas.addEventListener("mouseup", (e) => {

    checkHovered();

    if (startingVertex && creatingEdge)
    {
        if (hoveredVertex)  // add a straight edge
        {
            const edge = graph.addEdgeAdvanced(startingVertex,hoveredVertex);
            if (edge)   // check if the edge can be created, based on the restrictions for self loops, simple graph etc
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
        else if (isMouseNear(50,50,50)) // stop creating vertex if clicked on the up-left corner (a bin should be drawn to show the option)
        {
            if (edgeCreated !== null)   // delete the edge created
                graph.deleteEdgee(edgeCreated);
            if (startingVertex !== null && startingVertex.temporary)    // if startingVertex is temporary, delete it
                graph.deleteVertex(startingVertex);
            edgeCreated = null;
            startingVertex = null;
            creatingEdge = false;
            historyStack.pop();     // don't save state if no edge created
            // hasDragged = true;  // to not create a new edge when rubbish bin is clicked
        }
        else // continue creating a bended edge
        {
            // saveState();
            let combo = graph.extendEdge(startingVertex,mouse.x,mouse.y);
            startingVertex = combo.vertex;
            edgeCreated = combo.edge;
            // set characteristics for the new edge
            if(edgeCreated)
            {
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

    if(isSelecting)
    {
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
    draggingLabelVertex = null;
    draggingPoints = [];
    // hasDragged = false;
    mousedown = false;
    renderGraph();
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
    if (hasDragged || !canClick)
        return;

    // console.log("click passed",selectedPoints.length);
    

    checkHovered();

    // if nothing hovered or selected, add a new vertex at the clicked position
    if (!hoveredVertex && !hoveredBend && !hoveredEdge && !selectedPoints.length && !selectedEdges.length && !draggingLabelVertex)
        {
            saveState();
            const vertex = new Vertex((graph.maxVertexId()+1).toString(),mouse.x,mouse.y);
            vertex.size = vertexChars.size;
            vertex.shape = vertexChars.shape;
            vertex.color = vertexChars.color;
            graph.addVertex(vertex);
            // hoveredVertex = vertex;
        }


    // add a new bend in the addBend mode if hovering over an edge
    // IMPORTANT: the following piece of code (in the brackets of if) must remain below the above piece of code
    if (hoveredEdge && currentMode === "addBend") {
        saveState();
        const p1 = hoveredEdge.points[0];
        const p2 = hoveredEdge.points[1];
        if (p1 instanceof Vertex && p2 instanceof Vertex)
            graph.addBend(p1,p2,mouse.x,mouse.y);
        // set it free
        hoveredEdge = null;
        canvas.style.cursor = "default";
    }

    // select a vertex/bend/edge and update selected vertices
    if (hoveredVertex)
        select(hoveredVertex,selectedVertices,e);
    else if (hoveredBend)
        select(hoveredBend, selectedBends, e);
    else if (hoveredEdge)
        select(hoveredEdge, selectedEdges, e);
    else
    {
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
    renderGraph();
});
  

// Add the selected object (vertex, bend, edge) to the appropriate array of selected objects
function select(obj: Object, array: Object[], e:MouseEvent)
{
    // saveState();
    if (e.ctrlKey)
    {
        const index = array.indexOf(obj);
        if (index > -1)     // remove the selected object from selected objects
            array.splice(index,1);
        else        // add the selected object to selected objects
            array.push(obj);
    }
    else    // if not control key pushed, remove all the selected objects and then add the selected one
    {
        setNothingSelected();
        array.length = 0;   // clear the array in place
        array.push(obj);
    }
}

// set no object of the graph selected
function setNothingSelected()
{
    selectedVertices.length = 0;
    selectedBends.length = 0;
    selectedEdges.length = 0;
}

// check that no one of the main acts is in process
function nothingInProcess() { return !creatingEdge && !draggingLabelVertex && !hasDragged && !isSelecting; }

// selected Points = selected Vertices & selected Bends
function selectedPointsUpdate()
{
    selectedPoints.length = 0;
    for (const v of selectedVertices)
        selectedPoints.push(v);
    for (const b of selectedBends)
        selectedPoints.push(b);
    // console.log("called", selectedPoints.length);
}

// not sure if necessary
function selectEdge(e: Edge)
{
    for (const bend of e.bends)
        if (!selectedBends.includes(bend))
            selectedBends.push(bend);
}

function isMouseNear(x: number, y: number, dist: number)
{
    return Math.hypot(mouse.x-x,mouse.y-y)<dist;
}

// check if the given number is in [-limit, limit]. If not, return the nearest endpoint
// limit must be non negative
function inLimits(x: number, limit: number)
{
    if (x < -limit)
        return -limit;
    if (x > limit)
        return limit;
    return x;
}

// detect the hovering object
function checkHovered()
{
    // detect hovering over vertex
    // first check selected vertices
    /*hoveredVertex = graph.getVertexAtPosition(mouse.x, mouse.y, selectedVertices);
    //if (!hoveredVertex)
      //  hoveredVertex = graph.isNearVertex(mouse.x,mouse.y);
    if (hoveredVertex)
    {
        hoveredEdge = null;
        hoveredBend = null;
    }
    else{   // detect hovering over bend (if not hoveredVertex)
        hoveredBend = graph.isNearBend(mouse.x,mouse.y);
        if (hoveredBend)
            hoveredEdge = null;
        else    // detect hovering over edge (if not hoveredBend)
            hoveredEdge = graph.isNearEdge(mouse.x,mouse.y,3);
    }*/

    setHoveredObjectsNull();
    hoveredVertex = graph.getVertexAtPosition(mouse.x, mouse.y, selectedVertices);
    if (!hoveredVertex)
    {
        hoveredBend = graph.isNearBend(mouse.x,mouse.y);
        if (! hoveredBend)
        {
            hoveredCrossing = graph.isNearCrossing(mouse.x,mouse.y,crosRadius+2);
            if (hoveredCrossing)
                hoveredCrossingEdges = hoveredCrossing.edges;
            else
                hoveredEdge = graph.isNearEdge(mouse.x,mouse.y,3);
        }
    }

    if (!hoveredVertex && !hoveredBend && !hoveredEdge)
    {
        for (const v of graph.vertices)
            if (isNearLabel(v,mouse.x,mouse.y))
            {
                hoveredLabelVertex = v;
                break;
            }
    }
}

function setHoveredObjectsNull()
{
    hoveredVertex = null;
    hoveredBend = null;
    hoveredCrossing = null;
    hoveredEdge = null;
    hoveredCrossingEdges = [null,null];
    hoveredLabelVertex = null;
}

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

function updatePaletteState() {

    /*const vertexPalette = document.getElementById("vertex-palette")!;
    const edgePalette = document.getElementById("edge-palette")!;
    const bendPalette = document.getElementById("bend-palette")!;
    const vertexShape = document.getElementById("vertex-shape")!;*/
    const vertexColorPicker = document.getElementById("vertex-color") as HTMLInputElement;
    const edgeColorPicker = document.getElementById("edge-color") as HTMLInputElement;
    const bendColorPicker = document.getElementById("bend-color") as HTMLInputElement;
    
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
    else    // show default values on palette
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
    else{
        bendColorPicker.value = bendChars.color;
        bendSize.value = bendChars.size.toString();
    }
    
    if (edgeSelected) {
        const e = selectedEdges[selectedEdges.length-1]
        edgeColorPicker.value = e.color;
        edgeThickness.value = e.thickness.toString();
        // update toggle-dashed button
        if (e.dashed)
            toggle_dashed_btn?.classList.add("active");
        else
            toggle_dashed_btn?.classList.remove("active");
    }
    else
    {
        edgeColorPicker.value = edgeChars.color;
        edgeThickness.value = edgeChars.thickness.toString();
        // update toggle-dashed button
        if (edgeChars.dashed)
            toggle_dashed_btn?.classList.add("active");
        else
            toggle_dashed_btn?.classList.remove("active");
    }
}

function updateRenameControls(enabled: boolean) 
{
    const input = document.getElementById("vertexIdInput") as HTMLInputElement;
    const button = document.getElementById("rename-vertex") as HTMLButtonElement;
  
    input.disabled = !enabled;
    button.disabled = !enabled;
}  
      

// draw the graph
function drawGraph(ctx: CanvasRenderingContext2D, graph: Graph, labels: boolean = true) {

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // if (latexLabels)
       // clearLatexLabels();

    // Draw edges first
    graph.edges.forEach(edge => { drawEdge(ctx,edge )});

    // Highlight crossing edges of selected edges
    const highlightCrossEdges = (document.getElementById("highlight-crossing-edges") as HTMLInputElement).checked;
    if (highlightCrossEdges)
        highlightCrossingEdges();

    // Highlight non-crossing edges of selected edges
    const highlightNonCrossEdges = (document.getElementById("highlight-non-crossing-edges") as HTMLInputElement).checked;
    if (highlightNonCrossEdges)
        highlightNonCrossingEdges();

    // Draw vertices
    graph.vertices.forEach(vertex => 
    {
        if (vertex.temporary)
            shapeBend(ctx,vertex.x,vertex.y,bendChars.size,bendChars.color);  // same color as bend class constructor
        else
            drawVertex(ctx,vertex,labels);
    });
    
    // show information for the hovering objects
    // checkHovered();
    showHoveredInfo();

    // Draw a temporary edge from starting vertex to mouse position and a rubbish bin to discard the new edge if necessary
    if (creatingEdge && startingVertex) {
        // console.log("startingVertex:", startingVertex.id);
        ctx.beginPath();
        ctx.moveTo(startingVertex.x, startingVertex.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
        if (edgeChars.dashed)
            ctx.setLineDash([3, 3]); // dashed line
        ctx.stroke();
        ctx.setLineDash([]); // reset
        // draw a bend at the cursor in the create Edge mode
        // if (!graph.isNearVertex(mouse.x,mouse.y) && currentMode === "createEdge")
           // shapeBend(ctx,mouse.x,mouse.y,bendRadius);
        // draw the rubbish bin
        if (creatingEdge)
            drawRubbishBin(ctx,50,50);
    }

    // Draw crossings
    const output = document.getElementById("output");
    if (output) {
        const selfChecked = (output.querySelector('#show-self') as HTMLInputElement)?.checked;
        const neighborChecked = (output.querySelector('#show-neighbor') as HTMLInputElement)?.checked;
        const multipleChecked = (output.querySelector('#show-multiple') as HTMLInputElement)?.checked;
        const legalChecked = (output.querySelector('#show-legal') as HTMLInputElement)?.checked;
        drawCrossings(ctx,selfChecked,neighborChecked,multipleChecked,legalChecked);
    }

    // If hovering over an edge on add bend mode, show a bend (to add)
    if (hoveredEdge && currentMode === "addBend") 
        shapeBend(ctx,mouse.x,mouse.y,bendChars.size,bendChars.color);

    // draw selection rectangle
    if (isSelecting) {
        ctx.strokeStyle = "rgba(15, 15, 62, 0.86)";
        ctx.lineWidth = 1;
        ctx.setLineDash([6]);
        ctx.strokeRect(
          selectionRect.x,
          selectionRect.y,
          selectionRect.width,
          selectionRect.height
        );
        ctx.setLineDash([]);
      }

}

// highlight the edges that cross any of the selected edges
function highlightCrossingEdges()
{
    for (const cross of graph.crossings)
    {
        const e0: Edge = cross.edges[0]!;
        const e1: Edge = cross.edges[1]!;
        if (ctx && selectedEdges.includes(e0) && !selectedEdges.includes(e1))
            drawEdge(ctx,e1,1);
        else if (ctx && selectedEdges.includes(e1) && !selectedEdges.includes(e0))
            drawEdge(ctx,e0,1);
    }
}

// highlight the edges that do not cross any of the selected edges and have no common endpoint with any of them (i.e. can cross them)
function highlightNonCrossingEdges()
{
    // create a temporary parallel array for selected edges
    for (const edge of graph.edges)
    {
        let valid = true;
        // first check common endpoints with selected edges
        for (const e of selectedEdges)
            if (e===edge || edge.commonEndpoint(e))
            {
                valid = false;
                break;
            }
        if (!valid)
            continue;
        // if OK with selected vertices, check crossings
        for (const cross of graph.crossings)
            if (cross.edges[0]===edge && selectedEdges.includes(cross.edges[1]!) || cross.edges[1]===edge && selectedEdges.includes(cross.edges[0]!))
            {
                valid = false;
                break;
            }
        if (ctx && valid)
            drawEdge(ctx,edge,2);
    }
}

// given a crossing, decide what its type is and return the appropriate color as a string
function crossingColor(cross: Crossing)
{
    if (cross.selfCrossing)                             // self-crossings
        return crossings_colors.self;
    else if (!cross.legal)   // neighbor-edge crossings
        return crossings_colors.neighbor;
    else if (cross.more_than_once)   // multiple crossings
        return crossings_colors.multiple;
    else    // legal crossings
        return crossings_colors.legal;
}

function drawCrossings(ctx: CanvasRenderingContext2D, self: boolean, neighbor: boolean, multiple: boolean, legal: boolean)
{
    for (const cross of graph.crossings)
    {
        // different colors for different types of crossings
        if (cross.selfCrossing && self)                             // self-crossings
            drawCrossing(ctx, cross, crossings_colors.self);
        else if (!cross.legal && !cross.selfCrossing && neighbor)   // neighbor-edge crossings
            drawCrossing(ctx, cross, crossings_colors.neighbor);
        else if (cross.legal && cross.more_than_once && multiple)   // multiple crossings
            drawCrossing(ctx, cross, crossings_colors.multiple);
        else if (cross.legal && !cross.more_than_once && legal)     // legal crossings
            drawCrossing(ctx, cross, crossings_colors.legal);
    }
}

function drawCrossing(ctx: CanvasRenderingContext2D, cros: Point, color: string)
{
    ctx.beginPath();
    let radius = crosRadius;
    if (cros === hoveredCrossing)
        radius = radius+1;
    ctx.arc(cros.x, cros.y, radius, 0 , 2*Math.PI);
    ctx.strokeStyle = color;
    ctx.stroke();
}

// function for drawing a vertex
function drawVertex(ctx: CanvasRenderingContext2D, v: Vertex, labels: boolean = true)
{
    let size: number = v.size;
    if (hoveredVertex === v)
        size = size+0.5;
    drawShape(ctx,v.x,v.y,v.shape,size,v.color,true);

    // Draw label
    if (labels)
    {
        ctx.fillStyle = "#000";
        if (hoveredLabelVertex === v)
            ctx.fillStyle = "red";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(v.id, v.x + v.labelOffsetX , v.y - v.size - v.labelOffsetY);   // positive is down in canvas
        ctx.fillStyle = "#000";
    }

    // add an orange circle around a selected vertex
    if (selectedVertices.includes(v)) 
        drawShape(ctx, v.x, v.y, v.shape, v.size+2, "#FFA500", false);
}

declare var MathJax: any;
function renderLatexLabel(vertex: Vertex) {
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
    labelDiv.style.top = `${canvas.offsetTop + vertex.y - vertex.size - vertex.labelOffsetY}px`;
  
    MathJax.typesetPromise([labelDiv]); // re-render the LaTeX
  }

function clearLatexLabels() {
    document.querySelectorAll('[id^="latex-label-"]').forEach(el => el.remove());
}
  
function showHoveredInfo()
{
    if (creatingEdge || draggingPoints.length>0)
    {
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
function showVertexInfo(vertex: Vertex) {
    const infoBox = document.getElementById("vertex-info")!;
    const rect = canvas.getBoundingClientRect();
    const neighborsList = vertex.neighbors.map(v => v.id).join(", ");

    const infoText =  ` Vertex ID: ${vertex.id}<br>
                        Degree: ${vertex.neighbors.length}<br>
                        Neighbor(s): ${neighborsList}`;

    infoBox.innerHTML = infoText;
    infoBox.style.left = `${rect.left + vertex.x - 100}px`;
    infoBox.style.top = `${rect.top + vertex.y - 50}px`;
    infoBox.style.display = "block";
}

function hideVertexInfo() {
    const infoBox = document.getElementById("vertex-info")!;
    infoBox.style.display = "none";
}

// show a box with information about the hovered crossing
function showCrossingInfo(cross: Crossing) {
    const infoBox = document.getElementById("crossing-info")!;
    const rect = canvas.getBoundingClientRect();
    let infoText: string;

    if (cross.selfCrossing)     // self-crossing
        infoText = `Self-crossing`;
    else if (!cross.legal)      // illegal crossing
        infoText = `Illegal crossing <br>
                    Edges: ${cross.edges[0]!.id} and ${cross.edges[1]!.id}`;
    else if (cross.more_than_once)  // multiple crossing
        infoText = `Multiple crossing <br>
                    Edges: ${cross.edges[0]!.id} and ${cross.edges[1]!.id}`;
    else    // legal crossing
        infoText = `Legal crossing <br>
                    Edges: ${cross.edges[0]!.id} and ${cross.edges[1]!.id}`;

    infoBox.innerHTML = infoText;
    infoBox.style.left = `${cross.x + 30 }px`;
    infoBox.style.top = `${cross.y + 50}px`;
    infoBox.style.display = "block";
}

function hideCrossingInfo() {
    const infoBox = document.getElementById("crossing-info")!;
    infoBox.style.display = "none";
}


// function for drawing a bend at position x,y
function drawBend(ctx: CanvasRenderingContext2D, bend: Bend)
{
    ctx.beginPath();
    ctx.lineWidth = 1;
    // show bigger bend when mouse near it
    let size = bend.size;
    if (bend === hoveredBend)
        size = size+0.5;
    ctx.arc(bend.x, bend.y, size , 0, 2 * Math.PI); // small green circle
    ctx.fillStyle = bend.color;
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.lineWidth = 2;

    // add a dashed circle around a selected bend
    if (selectedBends.includes(bend)) 
        showSelectedPoint(ctx, bend);
}

// add a dashed circle around a selected point
function showSelectedPoint(ctx: CanvasRenderingContext2D, p: Point)
{
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size + 3, 0, 2 * Math.PI);
    ctx.strokeStyle = "orange"; // or "#f39c12"
    // ctx.lineWidth = 3;
    ctx.setLineDash([5, 3]); // dashed circle
    ctx.stroke();
    // ctx.lineWidth = 2;
    ctx.setLineDash([]); // reset to solid for others
}

function drawShape(ctx: CanvasRenderingContext2D, x: number, y: number, shape: string, size: number, color: string, fill: boolean = true)
{
    ctx.beginPath();
    ctx.lineWidth = 2;
    if (shape === "square")
        ctx. rect(x-size, y-size, size*2, size*2);
    else if (shape === "triangle")
    {
        ctx.moveTo(x,y-size);
        ctx.lineTo(x-size,y+size);
        ctx.lineTo(x+size, y+size);
        ctx.closePath();
    }
    else if (shape === "rhombus")
    {
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

function shapeBend(ctx: CanvasRenderingContext2D, x:number, y: number, rad: number, color?: string)
{
    ctx.beginPath();
    ctx.lineWidth = 1;
    // show bigger bend when mouse near it
    ctx.arc(x, y, rad , 0, 2 * Math.PI); // small green circle
    if (color !== undefined)
        ctx.fillStyle = color;
    else
       ctx.fillStyle = "#0000FF";   // same as color in bend class constructor
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.lineWidth = 2;
}

function drawEdge(ctx: CanvasRenderingContext2D, edge: Edge, highlight: number = 0)
{
    const v1 = edge.points[0];
    const v2 = edge.points[1];
    if (v1 && v2) {
        ctx.beginPath();
        ctx.moveTo(v1.x, v1.y);
        if (edge.dashed)
            ctx.setLineDash([5, 5]); // Dash pattern: [dashLength, gapLength]
        ctx.lineWidth = edge.thickness;
        const bends = edge.bends;
        // draw the edge passing through bends
        for (let i=0;i<bends.length;i++)
            ctx.lineTo(bends[i].x,bends[i].y);
        ctx.lineTo(v2.x, v2.y);
        ctx.strokeStyle = edge.color;
        // increase thickness if edge === hoveredEdge
        if (hoveredEdge === edge)
            ctx.lineWidth = edge.thickness+2;
        // highlight if the edge is one of the edges of a hovering crossing
        if (hoveredCrossing && hoveredCrossingEdges.includes(edge))
        {
            ctx.lineWidth = edge.thickness+2;                   // increase thickness
            ctx.strokeStyle = crossingColor(hoveredCrossing);   // highlight the edge with the color of the crossing
        }
        else if (highlight === 1)   // highlight crossing edges of selected edges
        {
            ctx.lineWidth = edge.thickness+2;
            ctx.strokeStyle = "#2fee3c";
        }
        else if (highlight === 2)   // highlight non-crossing edges of selected edges
        {
            ctx.lineWidth = edge.thickness+2;
            ctx.strokeStyle = "yellow";
        }
        ctx.stroke();
        // if the edge is selected, highlight it with a dashed colored line
        if (selectedEdges.includes(edge))   // can be implemented faster by drawing all the selected edges first and then the others, so there's no need to check all the selectedVertices array for each edge
        {
            ctx.beginPath();
            ctx.moveTo(v1.x, v1.y);
            for (let i=0;i<bends.length;i++)
                ctx.lineTo(bends[i].x,bends[i].y);
            ctx.lineTo(v2.x, v2.y);
            ctx.strokeStyle = "orange";
            ctx.setLineDash([5, 3]); // dashed line
            ctx.lineWidth = edge.thickness+1;
            ctx.stroke();
        }
        //reset
        ctx.setLineDash([]);
        ctx.lineWidth = edge.thickness;
        // draw bends
        for (const bend of edge.bends)
            drawBend(ctx,bend);
    }
}

function showEdgeInfo(edge: Edge) {
    const infoBox = document.getElementById("edge-info")!;
    const rect = canvas.getBoundingClientRect();

    const infoText =  ` Edge: ${edge.id}<br>
                        CC: ${edge.bends.length}`;

    infoBox.innerHTML = infoText;
    infoBox.style.left = `${rect.left + mouse.x + 5}px`;
    infoBox.style.top = `${rect.top + mouse.y + 5}px`;
    infoBox.style.display = "block";
}

function hideEdgeInfo() {
    const infoBox = document.getElementById("edge-info")!;
    infoBox.style.display = "none";
}

function isNearLabel(vertex: Vertex, x: number, y: number): boolean {
    const labelX = vertex.x + vertex.labelOffsetX;
    const labelY = vertex.y - vertex.size - vertex.labelOffsetY;    // check that label is positioned at these coordinates
    const width = 20;
    const height = 20;
    return x >= labelX - width/2 && x <= labelX + width/2 &&
           y >= labelY && y <= labelY + height;
}
  


// return the pos of the mouse in the canvas
function getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function drawRubbishBin(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    if(isMouseNear(x,y,50))
        ctx.strokeStyle = "red"
    else
        ctx.strokeStyle = "black";
    ctx.lineWidth = 2;

    // Draw bin body
    ctx.beginPath();
    ctx.rect(x, y, 20, 30);
    ctx.stroke();

    // Draw bin lid
    ctx.beginPath();
    ctx.moveTo(x - 5, y);
    ctx.lineTo(x + 25, y);
    ctx.stroke();

    // Draw handle
    ctx.beginPath();
    ctx.moveTo(x + 7, y - 5);
    ctx.lineTo(x + 13, y - 5);
    ctx.stroke();

    ctx.restore();
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
        cloned.addVertex(new Vertex(v.id,v.x,v.y,v.temporary ));
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
    historyStack.push(graph.clone());
    redoStack.length = 0; // clear redo stack on new change
}

function exportGraph(graph: Graph) {
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

  function restoreGraphFromJSON(data: any): Graph {
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
            const edge = newGraph.addEdge(v1,v2);
            // Object.assign(edge, e); // Copy extra fields like bends, color, etc.
            if (e.color)
                edge!.color = e.color;
            if (e.thickness)
                edge!.thickness = e.thickness;
            if (e.dashed)
                edge!.dashed = e.dashed;
            // bends
            for (const b of e.bends)
            {
                const newBend = newGraph.addBend(v1,v2,b.x,b.y,false,false);
                if (b.size)
                    newBend!.size = b.size;
                if (b.color)
                    newBend!.color = b.color;
                //newBend?.assignCharacteristics(b.size,b.color);
            }
        }
    }

    newGraph.updateCrossings();
    newGraph.updateCurveComplexity();

    return newGraph;
}

// function for rendering latex content to image (to add the vertex labels as images to the graph picture)
async function renderLatexToImage(latex: string): Promise<HTMLImageElement> {
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.visibility = "hidden";
    tempDiv.innerHTML = `\\(${latex}\\)`;
    document.body.appendChild(tempDiv);

    await MathJax.typesetPromise([tempDiv]);

    const svgElement = tempDiv.querySelector("svg");
    if (!svgElement) throw new Error("Failed to render LaTeX");

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.src = url;

    await new Promise<void>((resolve) => {
        img.onload = () => {
            document.body.removeChild(tempDiv);
            URL.revokeObjectURL(url);
            resolve();
        };
    });

    return img;
}

async function exportCanvasAsImage() {
    
    // First draw graph normally...
    const canvas = document.getElementById("graphCanvas") as HTMLCanvasElement;
    // Create an off-screen canvas to not affect the visible one
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
  
    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) return;
  
    // Fill white background
    exportCtx.fillStyle = "white";
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  
    // Copy original canvas content
    exportCtx.drawImage(canvas, 0, 0);

    // add latex vertex labels
    for (const vertex of graph.vertices) {
        const label = "v_"+vertex.id; // or vertex.label if you use one
        const img = await renderLatexToImage(label);
        const x = vertex.x + vertex.labelOffsetX;
        const y = vertex.y - vertex.size - vertex.labelOffsetY; // adjust position above the vertex
        exportCtx.drawImage(img, x, y);
    }

    const link = document.createElement("a");
    link.download = "graph.png";
    link.href = exportCanvas.toDataURL();
    link.click();
}