// src/app.ts
import { Graph, Vertex, Bend, Edge, Point, Crossing } from "./graph.js";
import { CanvasHandler } from './canvasHandler.js'; 
import { exportGraph, restoreGraphFromJSON, exportCanvasAsPdf, exportCanvasAsImage} from './exporting.js';
import { ModalsHandler } from "./modals.js";
import { StateHandler } from "./stateHandler.js";
import { Selector, Copier } from "./selector.js";
import { BtnHandler } from "./buttons.js";

// Create a graph instance
let graph = new Graph();
// undo/redo utilities
let stateHandler: StateHandler;
// mouse
let mouse: {x: number,y: number};
let worldCoords: {x: number, y: number};    // graph coordinates of cursor (used when transforming during zoom)
let offsetX = 0;    // x-offset between click position and mouse's current position
let offsetY = 0;    // y-offset between click position and mouse's current position
// dragging
let draggingPoints: Point[] = [];
let hasDragged = false;     // will be used to distinguish vertex selection from vertex drag
// hovered objects
let hoveredEdge: Edge | null = null;
let hoveredVertex: Vertex | null = null;
let hoveredBend: Bend | null = null;
let hoveredLabelPoint: Point | null = null;
let hoveredPoint: Point | null = null;
let hoveredCrossing: Crossing | null = null;
let hoveredCrossingEdges: [Edge | null, Edge | null];
// selected items
let selector: Selector;
// creating edge
let creatingEdge: boolean = false;          // will be used to check if a new edge is being drawn
let startingVertex: Vertex | null = null;   // the vertex from which an edge starts
let canClick: boolean = true;               // is activated a click after an edge creation is done
let edgeCreated: Edge | null = null;        // the new edge that is being created during edge creation
const rubbishBinRadius: number = 50;
// new Vertex
let canAddVertex: boolean = true;
// mousedown
let mousedown: boolean = false;
let clickedX: number = 0;                               // mouse x-coordinate at mousedown
let clickedY: number = 0;                               // mouse y-coordinate at mousedown
let positionsAtMouseDown: {x: number,y: number}[] = []; // positions of selected objects (points) at mousedown time
// moving labels
let draggingLabelPoint: Point | null = null;
// default colors for crossings
let modalsHandler: ModalsHandler;
// palette settings
let vertexChars = { color: "#000000", size: 7, shape: "circle" }  // default settings of class Vertex
let edgeChars = {color: "#898989", thickness: 2, dashed: false} // default of class Edge
let bendChars = {size: 5, color: "#0000FF"}
// context menu
let showingContextMenu: boolean = false;
// copy selected items
let copier: Copier;
// buttons handler
let btnHandler: BtnHandler;
// zoom
let myCanvasHandler: CanvasHandler | null = null;
let scale: number = 1;      // for all the elements that we want their size to remain the same regardless of the zoom scale, devide the size by scale
const dpr = window.devicePixelRatio || 1;
// output in report
const output = document.getElementById("output");
// universal variables
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D | null;
// context menus
const contextMenu = document.getElementById('contextMenu') as HTMLDivElement;
const edgeMenu = document.getElementById("edgeMenu") as HTMLDivElement;
const selectedMenu = document.getElementById("selectedMenu") as HTMLDivElement;
const pointMenu = document.getElementById("pointMenu") as HTMLDivElement;
const labelMenu = document.getElementById("labelMenu") as HTMLDivElement;

document.addEventListener('DOMContentLoaded', () => {
    try {
        // Instantiate CanvasHandler, passing your renderGraph function as the drawing callback
        myCanvasHandler = new CanvasHandler('graphCanvas', renderGraph);
        stateHandler = new StateHandler(graph);
        modalsHandler = new ModalsHandler(myCanvasHandler,stateHandler);
        selector = new Selector();
        copier = new Copier();
        btnHandler = new BtnHandler(graph,myCanvasHandler,selector,stateHandler,copier,modalsHandler);
        canvas = document.getElementById("graphCanvas") as HTMLCanvasElement;
        ctx = canvas.getContext("2d");
        if (!ctx)
            throw new Error("Could not get canvas rendering context");
        // don't show the modal when refreshing
        // modalsHandler?.hideAllModals();
        addDashedEdgeEventListeners();
        addMenusEventListeners();
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

    } catch (error) {
        console.error("Error initializing Canvas:", error);
    }
});

//window.addEventListener("DOMContentLoaded", () => {
    /* myCanvasHandler = new CanvasHandler('graphCanvas', renderGraph);
    modalsHandler = new ModalsHandler(myCanvasHandler);
    const canvas = document.getElementById("graphCanvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Could not get canvas rendering context");
    }*/

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

        if (totalCrossingsSpan) totalCrossingsSpan.textContent = `${graph.crossings.length}`;
        if (selfCrossingsSpan) selfCrossingsSpan.textContent = `${crossings_categories.self}`;
        if (neighborCrossingsSpan) neighborCrossingsSpan.textContent = `${crossings_categories.neighbor}`;
        if (multipleCrossingsSpan) multipleCrossingsSpan.textContent = `${crossings_categories.multiple}`;
        if (legalCrossingsSpan) legalCrossingsSpan.textContent = `${crossings_categories.legal}`;
        if (thrackleNumberSpan) thrackleNumberSpan.textContent = `${graph.thrackleNumber()}`;
        if (curveComplexitySpan) curveComplexitySpan.textContent = `${graph.curve_complexity}`;

        // Apply label colors based on data-color-key for crossings
        const labels = output.querySelectorAll<HTMLLabelElement>('label[data-color-key]');
        labels.forEach(label => {
            const colorKey = label.getAttribute('data-color-key');
            if (colorKey && colorKey in modalsHandler.settingsOptions.crossings_colors) {
                label.style.color = modalsHandler.settingsOptions.crossings_colors[colorKey as keyof typeof modalsHandler.settingsOptions.crossings_colors];
            }
        });

        // Apply label colors based on data-color-key for crossing edges labels on palette
        const highlightCrossingEdgeLabels = document.getElementById("edge-palette")!.querySelectorAll<HTMLLabelElement>('label[data-color-key');
        highlightCrossingEdgeLabels.forEach(label => {
            const colorKey = label.getAttribute('data-color-key');
            if (colorKey && colorKey in modalsHandler.settingsOptions.crossing_edges_colors) {
                label.style.color = modalsHandler.settingsOptions.crossing_edges_colors[colorKey as keyof typeof modalsHandler.settingsOptions.crossing_edges_colors];
            }
        });

    }
    if (ctx)
        drawGraph(ctx, graph);
    updatePaletteState();
}

    // Palette for vertices
    const vertexColor = document.getElementById("vertex-color") as HTMLSelectElement
    const vertexShapeButtons = document.querySelectorAll(".shape-button");
    const vertexSize = document.getElementById("vertex-size") as HTMLInputElement;
    const deleteVertexBtn = document.getElementById("delete-vertex-palette") as HTMLButtonElement;
    // Palette for bends
    const bendColor = document.getElementById("bend-color") as HTMLSelectElement
    // const bendShape = document.getElementById("bend-shape") as HTMLSelectElement;
    const bendSize = document.getElementById("bend-size") as HTMLInputElement;
    const deleteBendBtn = document.getElementById("delete-bend") as HTMLButtonElement;
    // Palette for Edges
    const deleteEdgeBtn = document.getElementById("delete-edge-palette") as HTMLButtonElement;
    const edgeThickness = document.getElementById("edge-thickness") as HTMLInputElement;
    const edgeColor = document.getElementById("edge-color") as HTMLSelectElement

    // using palettes
    vertexColor.addEventListener("change", () => {
        // update selected vertices' color
        if (selector.vertices.length > 0)
        {
            stateHandler.saveState();
            selector.vertices.forEach(v => v.color = vertexColor.value);
            // renderGraph();
            myCanvasHandler?.redraw();
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
        
        if (selector.vertices.length > 0 && btn.classList)   // update shape of selected vertices
        {
            stateHandler.saveState();
            selector.vertices.forEach(v => v.shape = selectedShape!)
            // renderGraph();
            myCanvasHandler?.redraw();
        }
        // update new vertex shape
        vertexChars.shape = selectedShape!;
        });
    });

    // vertex size
    vertexSize.addEventListener("input", () => {
        const size = parseInt(vertexSize.value);
        if (selector.vertices.length > 0)
        {
            stateHandler.saveState();
            selector.vertices.forEach(v => v.size = size);
            // renderGraph();
            myCanvasHandler?.redraw();
        }
        else
            vertexChars.size = size;
    });

    // Vertex rename
    document.getElementById("rename-vertex")?.addEventListener("click", () => {
        const input = (document.getElementById("vertexIdInput") as HTMLInputElement).value.trim();
        if (input && selector.vertices.length===1) {
            stateHandler.saveState();
            const selectedVertex = selector.vertices[0];
            graph.renameVertex(selectedVertex,input);
            // renderGraph();
            myCanvasHandler?.redraw();
        }
    });

    // bend color
    bendColor.addEventListener("change", () => {
        if (selector.bends.length > 0)   // apply change on selected bends
        {
            stateHandler.saveState();
            selector.bends.forEach(b => b.color = bendColor.value);
            // renderGraph();
            myCanvasHandler?.redraw();
        }
        else    // set color for new bends
            bendChars.color = bendColor.value;
    });

    // bend size
    bendSize.addEventListener("input", () => {
        const size = parseInt(bendSize.value);
        if (selector.bends.length > 0)
        {
            stateHandler.saveState();
            selector.bends.forEach(b => b.size = size);
            // renderGraph();
            myCanvasHandler?.redraw();
        }
        else
            bendChars.size = size;
    });

    // edge color
    edgeColor.addEventListener("change", () => {
        if (selector.edges.length > 0)
        {
            stateHandler.saveState();
            selector.edges.forEach(e => e.color = edgeColor.value);
            // renderGraph();
            myCanvasHandler?.redraw();
        }
        else
            edgeChars.color = edgeColor.value;
    });

    // edge thickness
    edgeThickness.addEventListener("input", () => {
        if (selector.edges.length > 0)
        {
            stateHandler.saveState();
            selector.edges.forEach(e => e.thickness = parseInt(edgeThickness.value))
            // renderGraph();
            myCanvasHandler?.redraw();
        }
        else
            edgeChars.thickness = parseInt(edgeThickness.value);
    });

    // delete vertex button
    deleteVertexBtn.addEventListener("click", () => {
        stateHandler.saveState();
        selector.deleteSelectedVertices(graph);
        selector.pointsUpdate();
        // renderGraph();
        myCanvasHandler?.redraw();
    });

    // delete bend button
    deleteBendBtn.addEventListener("click", () => {
        stateHandler.saveState();
        selector.deleteSelectedBends(graph);
        selector.pointsUpdate();
        // renderGraph();
        myCanvasHandler?.redraw();
    });

    // delete edge button
    deleteEdgeBtn.addEventListener("click", () => {
        stateHandler.saveState();
        selector.deleteSelectedEdges(graph);
        selector.pointsUpdate();
        // renderGraph();
        myCanvasHandler?.redraw();
    });

    // dashed edge button
    /*let toggle_dashed_btn = document.getElementById("toggle-dashed");
    toggle_dashed_btn!.addEventListener("click", () => {
        if (selector.edges.length > 0)
        {
            stateHandler.saveState();
            const dashed = !selector.edges[0].dashed;
            for (const e of selector.edges)
                e.dashed = dashed;
            // renderGraph();
            myCanvasHandler?.redraw();
        }
        else
        {
            edgeChars.dashed = !edgeChars.dashed;
            if(edgeChars.dashed)
                toggle_dashed_btn?.classList.add("active");
            else
                toggle_dashed_btn?.classList.remove("active");
        }
    });*/

    // Collapse palettes
    const vertexPalette = document.getElementById('vertex-palette');
    const edgePalette = document.getElementById('edge-palette');
    const bendPalette = document.getElementById('bend-palette');

    for (const palette of [vertexPalette, edgePalette, bendPalette])
        if (palette) {
            const paletteHeader = palette.querySelector('.palette-header') as HTMLElement;
            const paletteContent = palette.querySelector('.palette-content') as HTMLElement;

            if (paletteHeader && paletteContent) {
                paletteHeader.addEventListener('click', () => {
                    // Toggle the 'collapsed' class on the main palette div
                    palette.classList.toggle('collapsed');
                });
            }
        }

    // Initially collapse the bend-palette
    if(bendPalette)
        bendPalette.classList.add('collapsed');

    
    // Initial render
    // renderGraph();
    //if (myCanvasHandler !== null)
      //  myCanvasHandler.redraw();
//});

function addMouseEventListeners()
{
    // detect vertex/bend selection
    canvas.addEventListener("mousedown", (e) => {

        // set mouse position
        // mouse = getMousePos(canvas, e);
        worldCoords = myCanvasHandler!.screenToWorld(e.clientX, e.clientY);
        // hide the menu when clicking anywhere else
        // Check if the click was outside the context menu
        if (contextMenu && !contextMenu.contains(e.target as Node) && showingContextMenu) {
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
        if (hoveredPoint && selector.points.includes(hoveredPoint) || hoveredEdge && selector.edges.includes(hoveredEdge))
        {
            stateHandler.saveState();
            draggingPoints = selector.points;
            // also add to dragging points the endpoints and bends of selected edges
            for (const se of selector.edges)
            {
                selector.points.push(se.points[0]);
                selector.points.push(se.points[1]);
                for (const bend of se.bends)
                    selector.points.push(bend);
            }
            // save positions at mousedown
            positionsAtMouseDown = [];
            for (let i=0;i<selector.points.length;i++)
                positionsAtMouseDown.push({x: selector.points[i].x,y: selector.points[i].y});
        }

        // starting vertex for edge creation
        if (selector.points.length === 0 && !creatingEdge)   // hasDragged for not setting starting vertex a selected vertex
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
        // selector.rectStart.x = mouse.x;
        // selector.rectStart.y = mouse.y;
        selector.rectStart.x = worldCoords.x;
        selector.rectStart.y = worldCoords.y;
    });

    // detect vertex or bend moving
    canvas.addEventListener("mousemove", e => {
        // update mouse position
        mouse = getMousePos(canvas, e);
        worldCoords = myCanvasHandler!.screenToWorld(e.clientX, e.clientY);
        // offsetX = mouse.x - clickedX;
        // offsetY = mouse.y - clickedY;
        offsetX = worldCoords.x - clickedX;
        offsetY = worldCoords.y - clickedY;
        checkHovered();
        // console.log("mousemove:",mouse.x,mouse.y,clickedX,clickedY);

        if (mousedown && Math.hypot(offsetX,offsetY) > 3)
        {
            hasDragged = true;
            if (startingVertex && selector.points.length===0 && !creatingEdge)    // creatingEdge is activated only if we have a starting vertex and no selected points
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

        for (let i=0;i<draggingPoints.length;i++)
        {
            graph.movePoint(draggingPoints[i], positionsAtMouseDown[i].x + offsetX, positionsAtMouseDown[i].y + offsetY);
            // console.log("vertex "+v.id,v.x,v.y);
            // renderGraph();
            myCanvasHandler?.redraw();
        }

        // label move
        if (draggingLabelPoint && hasDragged)
        {
            // make sure dragging label is not moved far away from the point
            const limit = Math.max(2*draggingLabelPoint.size+draggingLabelPoint.label.fontSize,40);
            draggingLabelPoint.label.offsetX = inLimits(worldCoords.x - draggingLabelPoint.x,limit/scale)*scale;
            draggingLabelPoint.label.offsetY = inLimits(- worldCoords.y + draggingLabelPoint.y,limit/scale)*scale;
        }

        // create a rectangle showing selected space
        if (selector.points.length === 0 && !creatingEdge && !e.ctrlKey && !e.metaKey && !draggingLabelPoint && mousedown && hasDragged)
        {
            selector.isSelecting = true;
            // console.log("creatingEdge=",creatingEdge);
        }

        // rectangle for selected space
        if (selector.isSelecting)
        {
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
            myCanvasHandler?.redraw();
        }

        // renderGraph();
        myCanvasHandler?.redraw();
    });

    // detect vertex release
    canvas.addEventListener("mouseup", (e) => {

        // set mouse position
        // mouse = getMousePos(canvas, e);
        worldCoords = myCanvasHandler!.screenToWorld(e.clientX,e.clientY);
        // check hovering
        checkHovered();

        if (startingVertex && creatingEdge)
        {
            const rect = canvas.getBoundingClientRect();
            const binPos = myCanvasHandler?.screenToWorld(rect.left+rubbishBinRadius,rect.top+rubbishBinRadius);
            if (hoveredVertex)  // add a straight edge
            {
                const edge = graph.addEdgeAdvanced(startingVertex,hoveredVertex);
                if (edge)   // check if the edge can be created, based on the restrictions for self loops, simple graph etc
                {
                    startingVertex = null;
                    creatingEdge = false;
                    // set characteristics for the new edge
                    edge.assignCharacteristics(edgeChars.color, edgeChars.dashed, edgeChars.thickness);
                    edge.label.fontSize = modalsHandler.settingsOptions.defaultLabelFontSize; // edge's label font size
                    edge.assignBendCharacteristics(bendChars.color, bendChars.size);
                    // hasDragged = true;  // to not select the hoveredVertex
                    // edgeCreated = edge;
                }
            }
            else if (binPos && isMouseNear(binPos.x,binPos.y,rubbishBinRadius/scale)) // stop creating vertex if clicked on the up-left corner (a bin should be drawn to show the option)
            {
                if (edgeCreated !== null)   // delete the edge created
                    graph.deleteEdgee(edgeCreated);
                if (startingVertex !== null && startingVertex.temporary)    // if startingVertex is temporary, delete it
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
                let combo = graph.extendEdge(startingVertex,worldCoords.x,worldCoords.y);
                startingVertex = combo.vertex;
                edgeCreated = combo.edge;
                // set characteristics for the new edge
                if(edgeCreated)
                {
                    edgeCreated.assignCharacteristics(edgeChars.color, edgeChars.dashed, edgeChars.thickness);
                    edgeCreated.label.fontSize = modalsHandler.settingsOptions.defaultLabelFontSize; // edge's label font size
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
            else if (!v && !hoveredEdge && !selectedVertex) // if nothing selected, add a new vertex at the point clicked
            {
                const vertex = new Vertex((graph.maxVertexId()+1).toString(),mouse.x,mouse.y);
                graph.addVertex(vertex);
            }
            else {
                selectedVertex = v;
            }
        }*/

        if(selector.isSelecting)
        {
            selector.points = graph.pointsInRect(selector.rect.x, selector.rect.y, selector.rect.width, selector.rect.height);
            // console.log("mouseup",selector.points.length);
            selector.vertices = selector.points.filter(v => v instanceof Vertex);
            selector.bends = selector.points.filter(v => v instanceof Bend);
            selector.edges = graph.edgesInRect(selector.rect.x, selector.rect.y, selector.rect.width, selector.rect.height);
            // selector.isSelecting = false;
        }

        // save state when moving
        // CHEEEEECK AGAAAAIIIIIIIIINNNNNNN
        //if (hasDragged && draggingPoints.length > 0)
        //  stateHandler.saveState();

        selector.isSelecting = false;
        draggingLabelPoint = null;
        draggingPoints = [];
        // hasDragged = false;
        mousedown = false;
        // renderGraph();
        myCanvasHandler?.redraw();
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

    canvas.addEventListener("click", (e: MouseEvent) => {

        // console.log("click")

        // if dragging cursor, don't consider it a click
        if (hasDragged || !canClick || !myCanvasHandler)
            return;

        // console.log("click passed",selector.points.length);
        
        worldCoords = myCanvasHandler.screenToWorld(e.clientX, e.clientY);
        // console.log("Clicked at screen ",e.clientX,e.clientY);
        checkHovered();

        // if nothing hovered or selected, add a new vertex at the clicked position
        if (!hoveredVertex && !hoveredBend && !hoveredEdge && !selector.points.length && !selector.edges.length && !draggingLabelPoint && canAddVertex)
            {
                stateHandler.saveState();
                // const vertex = graph.addNewVertex(mouse.x,mouse.y);
                const vertex = graph.addNewVertex(worldCoords.x,worldCoords.y);
                // console.log("new vertex at ",worldCoords.x, worldCoords.y);
                vertex.size = vertexChars.size;
                vertex.shape = vertexChars.shape;
                vertex.color = vertexChars.color;
                vertex.label.fontSize = modalsHandler.settingsOptions.defaultLabelFontSize;
                // hoveredVertex = vertex;
            }


        // add a new bend in the addBend mode if hovering over an edge
        // IMPORTANT: the following piece of code (in the brackets of if) must remain below the above piece of code
        /* if (hoveredEdge && currentMode === "addBend") {
            stateHandler.saveState();
            const p1 = hoveredEdge.points[0];
            const p2 = hoveredEdge.points[1];
            if (p1 instanceof Vertex && p2 instanceof Vertex)
                graph.addBend(p1,p2,worldCoords.x,worldCoords.y);
                // graph.addBend(p1,p2,mouse.x,mouse.y);
            // set it free
            hoveredEdge = null;
            canvas.style.cursor = "default";
        }*/

        // select a vertex/bend/edge and update selected vertices
        if (hoveredVertex)
            selector.select(hoveredVertex,selector.vertices,e);
        else if (hoveredBend)
            selector.select(hoveredBend, selector.bends, e);
        else if (hoveredEdge)
            selector.select(hoveredEdge, selector.edges, e);
        else
        {
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
        myCanvasHandler?.redraw();
    });
}

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
function showContextMenu(x: number, y: number, menu: HTMLDivElement) {
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

function addMenusEventListeners()
{
    // Add event listener for right-click (contextmenu) on the canvas
    canvas.addEventListener('contextmenu', (event) => {
        event.preventDefault(); // Prevent the browser's default context menu
        // rightClickPos = {x: mouse.x, y: mouse.y};
        copier.rightClickPos = {x: worldCoords.x, y: worldCoords.y};
        //if (hoveredVertex && selector.vertices.includes(hoveredVertex) || hoveredEdge && selector.edges.includes(hoveredEdge) || hoveredBend && selector.bends.includes(hoveredBend))
        if (hoveredPoint && selector.points.includes(hoveredPoint) || hoveredEdge && selector.edges.includes(hoveredEdge))
            showContextMenu(event.clientX, event.clientY, selectedMenu);
        else if (hoveredEdge)    // show edge menu
            showContextMenu(event.clientX, event.clientY, edgeMenu);
        else if (hoveredPoint)    // show point menu
            showContextMenu(event.clientX, event.clientY, pointMenu);
        else if (hoveredLabelPoint )
            showContextMenu(event.clientX, event.clientY, labelMenu);
        else    // show general menu
            showContextMenu(event.clientX, event.clientY, contextMenu);
        showingContextMenu = true;
    });
    // Add event listener for clicks on the context menu options
    contextMenu.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;

        // Ensure a menu item was clicked
        if (target.tagName === 'LI' && target.hasAttribute('data-action')) {
            const action = target.getAttribute('data-action');
            hideContextMenu(); // Hide menu after selection

            switch (action) {
                case "clear-canvas":
                    stateHandler.saveState();
                    graph = new Graph();
                    // renderGraph();
                    myCanvasHandler?.redraw();
                    break;
                // Add more cases for other actions
                case "paste":
                    if (copier.selectedVertices.length > 0)
                    {
                        stateHandler.saveState();
                        copier.pasteSelected(graph,selector,false);
                        myCanvasHandler?.redraw();
                    }
                    break;
                default:
                    console.log(`Action not implemented: ${action}`);
            }
        }
    });

    // edge menu options
    edgeMenu.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;

        // Ensure a menu item was clicked
        if (target.tagName === 'LI' && target.hasAttribute('data-action')) {
            const action = target.getAttribute('data-action');
            hideContextMenu(); // Hide menu after selection

            switch (action) {
                case "addBend":
                    stateHandler.saveState();
                    const p1 = hoveredEdge!.points[0];  // edgeMenu appears only when an edge is hovered
                    const p2 = hoveredEdge!.points[1];
                    if (p1 instanceof Vertex && p2 instanceof Vertex)
                        graph.addBend(p1,p2,worldCoords.x,worldCoords.y);
                        // graph.addBend(p1,p2,mouse.x,mouse.y);
                    // set it free
                    hoveredEdge = null;
                    // renderGraph();
                    myCanvasHandler?.redraw();
                    break;
                case "deleteEdge":
                    stateHandler.saveState();
                    graph.deleteEdgee(hoveredEdge!);   // edgeMenu appears only when an edge is hovered, so hoveredEdge is not null
                    checkHovered();
                    myCanvasHandler?.redraw(); 
                    break;
                case "showLabel":
                    if (hoveredEdge)
                    {
                        stateHandler.saveState();
                        hoveredEdge.label.showLabel = true;
                        myCanvasHandler?.redraw();
                    }
                    break;
                case "hideLabel":
                    if (hoveredEdge)
                    {
                        stateHandler.saveState();
                        hoveredEdge.label.showLabel = false;
                        myCanvasHandler?.redraw();
                    }
                    break;
                    
                // Add more cases for other actions
                default:
                    console.log(`Action not implemented: ${action}`);
            }
        }
    });

    // selected menu options
    selectedMenu.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;

        // Ensure a menu item was clicked
        if (target.tagName === 'LI' && target.hasAttribute('data-action')) {
            const action = target.getAttribute('data-action');
            hideContextMenu(); // Hide menu after selection

            switch (action) {
                case "copySelected":
                    copier.copySelected(selector,true);
                    break;
                case "deleteSelected":
                    // stateHandler.saveState();
                    selector.deleteSelectedObjects(graph);
                    checkHovered();
                    myCanvasHandler?.redraw();
                    break;
                case "showLabels":
                    // stateHandler.saveState();     if not commented, state is saved twice for some reason. If commented, looks to work fine
                    for (const point of selector.points)
                        point.label.showLabel = true;
                    for (const edge of selector.edges)
                        edge.label.showLabel = true;
                    myCanvasHandler?.redraw();
                    break;
                case "hideLabels":
                    if (selector.points.length > 0)
                    {
                        // stateHandler.saveState(); if not commented, state is saved twice for some reason. If commented, looks to work fine
                        for (const point of selector.points)
                            point.label.showLabel = false;
                        myCanvasHandler?.redraw();
                    }
                    break;
                // Add more cases for other actions
                default:
                    console.log(`Action not implemented: ${action}`);
            }
        }
    });

    // crossing menu options
    pointMenu.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;

        // Ensure a menu item was clicked
        if (target.tagName === 'LI' && target.hasAttribute('data-action')) {
            const action = target.getAttribute('data-action');
            hideContextMenu(); // Hide menu after selection

            switch (action) {
                case "showLabel":
                    if (hoveredPoint)   // no need to check, as pointMenu is triggered only when hoveredPoint is not null
                    {
                        stateHandler.saveState();
                        hoveredPoint.label.showLabel = true;
                        myCanvasHandler?.redraw();
                    }
                    break;
                case "hideLabel":
                    if (hoveredPoint)
                    {
                        stateHandler.saveState();
                        hoveredPoint.label.showLabel = false;
                        myCanvasHandler?.redraw();
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
        const target = event.target as HTMLElement;

        // Ensure a menu item was clicked
        if (target.tagName === 'LI' && target.hasAttribute('data-action')) {
            const action = target.getAttribute('data-action');
            hideContextMenu(); // Hide menu after selection
            //console.log("label-menu");

            switch (action) {
                case "editLabel":
                    if (hoveredLabelPoint)
                    {
                        // console.log("hoveredLabelPoint found");
                        modalsHandler.showEditLabelModal(hoveredLabelPoint);
                        // FIX: Display a warning message. No console.log
                        // if (hoveredLabelPoint instanceof Vertex)
                    }
                    break;
                case "hideLabel":
                    if (hoveredLabelPoint)
                    {
                        stateHandler.saveState();
                        hoveredLabelPoint.label.showLabel = false;
                        myCanvasHandler?.redraw();
                    }
                // Add more cases for other actions
                default:
                    console.log(`Action not implemented: ${action}`);
            }
        }
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
function selectEdge(e: Edge)
{
    for (const bend of e.bends)
        if (!selector.bends.includes(bend))
            selector.bends.push(bend);
}

function isMouseNear(x: number, y: number, dist: number)
{
    // return Math.hypot(mouse.x-x,mouse.y-y)<dist;
    return Math.hypot(worldCoords.x-x,worldCoords.y-y)<dist;
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
    // to go back, replace all worldCoords with mouse
    setHoveredObjectsNull();
    hoveredVertex = graph.getVertexAtPosition(worldCoords.x, worldCoords.y, scale, selector.vertices);
    if (hoveredVertex)
        hoveredPoint = hoveredVertex;
    else
    {
        hoveredBend = graph.isNearBend(worldCoords.x,worldCoords.y,scale);
        if (hoveredBend)
            hoveredPoint = hoveredBend;
        else
        {
            hoveredCrossing = graph.isNearCrossing(worldCoords.x,worldCoords.y,scale);
            if (hoveredCrossing)
            {
                hoveredPoint = hoveredCrossing;
                hoveredCrossingEdges = hoveredCrossing.edges;
            }
            else
                hoveredEdge = graph.isNearEdge(worldCoords.x,worldCoords.y,3/scale);
        }
    }

    // find hoveredLabelPoint
    if (!hoveredVertex && !hoveredBend && !hoveredEdge)
    {
        // check vertices first
        for (const v of graph.vertices)
            if (isNearLabel(v,worldCoords.x,worldCoords.y))
            {
                hoveredLabelPoint = v;
                break;
            }
        // check crossings
        if (!hoveredLabelPoint)
            for (const cros of graph.crossings)
                if (isNearLabel(cros,worldCoords.x,worldCoords.y))
                {
                    hoveredLabelPoint = cros;
                    break;
                }
        // check bends
        if (!hoveredLabelPoint)
        {
            const bends = graph.getBends();
            for (const bend of bends)
                if (isNearLabel(bend,worldCoords.x,worldCoords.y))
                {
                    hoveredLabelPoint = bend;
                    break;
                }
        }
    }
}

function setHoveredObjectsNull()
{
    hoveredVertex = null;
    hoveredBend = null;
    hoveredCrossing = null;
    hoveredPoint = null;
    hoveredEdge = null;
    hoveredCrossingEdges = [null,null];
    hoveredLabelPoint = null;
}

function addDashedEdgeEventListeners(): void {
    // Get references to the specific buttons and their common parent
    const toggleContinuousButton = document.getElementById('toggle-continuous') as HTMLButtonElement;
    const toggleDashedButton = document.getElementById('toggle-dashed') as HTMLButtonElement;
    const edgeStyleButtonsContainer = document.querySelector('.edge-style-buttons'); // Get the wrapper div

    if (edgeStyleButtonsContainer) {
        edgeStyleButtonsContainer.addEventListener('click', (event) => {
            const clickedButton = event.target as HTMLElement;

            // Ensure a button with the 'edge-style-button' class was clicked
            const actualButton = clickedButton.closest('.edge-style-button') as HTMLButtonElement;

            if (actualButton) {
                // Remove 'active' class from all buttons in the group
                const allStyleButtons = edgeStyleButtonsContainer.querySelectorAll('.edge-style-button');
                allStyleButtons.forEach(button => {
                    button.classList.remove('active');
                });

                // Add 'active' class to the clicked button
                actualButton.classList.add('active');

                // --- Your logic for handling the selected style ---
                if (actualButton.id === 'toggle-continuous') {
                    edgeChars.dashed = false;
                } else if (actualButton.id === 'toggle-dashed') {
                    edgeChars.dashed = true;
                }

                // update type of selected edges
                if (selector.edges.length > 0)
                {
                    stateHandler.saveState();
                    selector.edges.forEach(e => e.dashed = edgeChars.dashed);
                }

                // You might want to trigger a redraw of your canvas here to apply the style immediately
                myCanvasHandler?.redraw();
            }
        });
    }
}

function updatePaletteState() {

    /*const vertexPalette = document.getElementById("vertex-palette")!;
    const edgePalette = document.getElementById("edge-palette")!;
    const bendPalette = document.getElementById("bend-palette")!;
    const vertexShape = document.getElementById("vertex-shape")!;*/
    const vertexColorPicker = document.getElementById("vertex-color") as HTMLInputElement;
    const edgeColorPicker = document.getElementById("edge-color") as HTMLInputElement;
    const bendColorPicker = document.getElementById("bend-color") as HTMLInputElement;
    // dashed edge buttons
    const toggleContinuousButton = document.getElementById('toggle-continuous') as HTMLButtonElement;
    const toggleDashedButton = document.getElementById('toggle-dashed') as HTMLButtonElement;
    
    const vertexSelected = selector.vertices.length > 0;
    const edgeSelected = selector.edges.length > 0;
    const bendSelected = selector.bends.length > 0;
    
    // disable color pickers
    // vertexColorPicker.disabled = !vertexSelected;
    // edgeColorPicker.disabled = !edgeSelected;
    // bendColorPicker.disabled = !bendSelected;
    
    // vertexPalette.classList.toggle("disabled", !vertexSelected);
    // bendPalette.classList.toggle("disabled", !bendSelected);
    // edgePalette.classList.toggle("disabled", !edgeSelected);

    if (vertexSelected) {
        const v = selector.vertices[selector.vertices.length - 1]; // use last selected
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
    updateRenameControls(selector.vertices.length === 1);

    if (bendSelected) {
        const b = selector.bends[selector.bends.length - 1]; // use last selected
        bendColorPicker.value = b.color;
        // bendShape.value = b.shape;
        bendSize.value = b.size.toString();
    }
    else{
        bendColorPicker.value = bendChars.color;
        bendSize.value = bendChars.size.toString();
    }
    
    if (edgeSelected) {
        const e = selector.edges[selector.edges.length-1]
        edgeColorPicker.value = e.color;
        edgeThickness.value = e.thickness.toString();
        // update dashed edge buttons
        if (e.dashed)
        {
            toggleContinuousButton?.classList.remove("active");
            toggleDashedButton?.classList.add("active");
        }
        else
        {
            toggleContinuousButton?.classList.add("active");
            toggleDashedButton?.classList.remove("active");
        }
        // update toggle-dashed button
        /*if (e.dashed)
            toggle_dashed_btn?.classList.add("active");
        else
            toggle_dashed_btn?.classList.remove("active");*/
    }
    else
    {
        edgeColorPicker.value = edgeChars.color;
        edgeThickness.value = edgeChars.thickness.toString();
                // update dashed edge buttons
        if (edgeChars.dashed)
        {
            toggleContinuousButton?.classList.remove("active");
            toggleDashedButton?.classList.add("active");
        }
        else
        {
            toggleContinuousButton?.classList.add("active");
            toggleDashedButton?.classList.remove("active");
        }
        // update toggle-dashed button
        /*if (edgeChars.dashed)
            toggle_dashed_btn?.classList.add("active");
        else
            toggle_dashed_btn?.classList.remove("active");*/
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
function drawGraph(ctx: CanvasRenderingContext2D, graph: Graph, localCall: boolean = false, labels: boolean = true) {

    // if (localCall)
       // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // if (latexLabels)
       // clearLatexLabels();

    // Draw edges first
    graph.edges.forEach(edge => { drawEdge(ctx,edge )});

    // Highlight crossing edges of selected edges
    const highlightCrossEdges: boolean = (document.getElementById("highlight-crossing-edges") as HTMLInputElement).checked;
    if (highlightCrossEdges)
        highlightCrossingEdges();

    // Highlight non-crossing edges of selected edges
    const highlightNonCrossEdges: boolean = (document.getElementById("highlight-non-crossing-edges") as HTMLInputElement).checked;
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
        // ctx.lineTo(mouse.x, mouse.y);
        ctx.lineTo(worldCoords.x, worldCoords.y);
        // ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
        // apply characteristics of edgeChars
        ctx.strokeStyle = edgeChars.color;
        ctx.lineWidth = edgeChars.thickness/scale;
        if (edgeChars.dashed)
            ctx.setLineDash([3/scale, 3/scale]); // dashed line
        ctx.stroke();
        // reset
        ctx.setLineDash([]); 
        ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
        ctx.lineWidth = 2/scale;
        // draw a bend at the cursor in the create Edge mode
        // if (!graph.isNearVertex(mouse.x,mouse.y) && currentMode === "createEdge")
           // shapeBend(ctx,mouse.x,mouse.y,bendRadius);
        // draw the rubbish bin
        if (creatingEdge)
        {
            const rect = canvas.getBoundingClientRect();
            const binPos = myCanvasHandler?.screenToWorld(rect.left+rubbishBinRadius,rect.top+rubbishBinRadius);
            if (binPos)
                drawRubbishBin(ctx,binPos.x,binPos.y);
        }
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
    // if (hoveredEdge && currentMode === "addBend") 
       // shapeBend(ctx,mouse.x,mouse.y,bendChars.size,bendChars.color);

    // draw selection rectangle
    if (selector.isSelecting) {
        ctx.strokeStyle = "rgba(15, 15, 62, 0.86)";
        ctx.lineWidth = 1/scale;
        ctx.setLineDash([6/scale]);
        ctx.strokeRect(
          selector.rect.x,
          selector.rect.y,
          selector.rect.width,
          selector.rect.height
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
        if (ctx && selector.edges.includes(e0) && !selector.edges.includes(e1))
            drawEdge(ctx,e1,1);
        else if (ctx && selector.edges.includes(e1) && !selector.edges.includes(e0))
            drawEdge(ctx,e0,1);
    }
}

// highlight the edges that do not cross any of the selected edges and have no common endpoint with any of them (i.e. can cross them)
function highlightNonCrossingEdges()
{
    if (selector.edges.length===0)
        return;
    // create a temporary parallel array for selected edges
    for (const edge of graph.edges)
    {
        let valid = true;
        // first check common endpoints with selected edges
        for (const e of selector.edges)
            if (e===edge || edge.commonEndpoint(e))
            {
                valid = false;
                break;
            }
        if (!valid)
            continue;
        // if OK with selected vertices, check crossings
        for (const cross of graph.crossings)
            if (cross.edges[0]===edge && selector.edges.includes(cross.edges[1]!) || cross.edges[1]===edge && selector.edges.includes(cross.edges[0]!))
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
    if (cross.selfCrossing)                 // self-crossings
        return modalsHandler.settingsOptions.crossings_colors.self;
    else if (!cross.legal)                  // neighbor-edge crossings
        return modalsHandler.settingsOptions.crossings_colors.neighbor;
    else if (cross.more_than_once)          // multiple crossings
        return modalsHandler.settingsOptions.crossings_colors.multiple;
    else                                    // legal crossings
        return modalsHandler.settingsOptions.crossings_colors.legal;
}

function drawCrossings(ctx: CanvasRenderingContext2D, self: boolean, neighbor: boolean, multiple: boolean, legal: boolean)
{
    for (const cross of graph.crossings)
    {
        // different colors for different types of crossings
        if (cross.selfCrossing && self)                             // self-crossings
            drawCrossing(ctx, cross, modalsHandler.settingsOptions.crossings_colors.self);
        else if (!cross.legal && !cross.selfCrossing && neighbor)   // neighbor-edge crossings
            drawCrossing(ctx, cross, modalsHandler.settingsOptions.crossings_colors.neighbor);
        else if (cross.legal && cross.more_than_once && multiple)   // multiple crossings
            drawCrossing(ctx, cross, modalsHandler.settingsOptions.crossings_colors.multiple);
        else if (cross.legal && !cross.more_than_once && legal)     // legal crossings
            drawCrossing(ctx, cross, modalsHandler.settingsOptions.crossings_colors.legal);
    }
}

function drawCrossing(ctx: CanvasRenderingContext2D, cros: Point, color: string)
{
    ctx.beginPath();
    let radius = cros.size;
    if (cros === hoveredCrossing)
        radius = radius+1;
    ctx.lineWidth = 2/scale;
    ctx.arc(cros.x, cros.y, radius/scale, 0 , 2*Math.PI);
    ctx.strokeStyle = color;
    ctx.stroke();
    // label
    showPointLabel(ctx,cros);
}

// function for drawing a vertex
function drawVertex(ctx: CanvasRenderingContext2D, v: Vertex, labels: boolean = true)
{
    let size: number = v.size;
    if (hoveredVertex === v)
        size = size+1;
    drawShape(ctx,v.x,v.y,v.shape,size,v.color,true);   // scaling in drawShape function

    // Draw label
    if (labels)
        showPointLabel(ctx,v);

    // add an orange circle around a selected vertex
    if (selector.vertices.includes(v)) 
        drawShape(ctx, v.x, v.y, v.shape, v.size+2, "#FFA500", false);  // scaling in drawShape function
}

// display the label of the given point
function showPointLabel(ctx: CanvasRenderingContext2D, p: Point)
{
    if (!p.label.showLabel)
        return;
    ctx.fillStyle = p.label.color;
    if (hoveredLabelPoint === p)
        ctx.fillStyle = "red";
    const adjustedFontSize = p.label.fontSize / scale;
    ctx.font = `${adjustedFontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    // we want the difference between the vertex and the label to remain the same regardless of the zoom scale, so we devide offsets by scale
        ctx.fillText(p.label.content, p.x + p.label.offsetX/scale , p.y - labelOffsetY(p)/scale);   // positive is down in canvas
    ctx.fillStyle = "#000";
}

// display the label of the given edge
function showEdgeLabel(ctx: CanvasRenderingContext2D, e: Edge)
{
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
        ctx.fillText(e.label.content, e.labelPosX + e.label.offsetX/scale , e.labelPosY - e.label.offsetY/scale);   // positive is down in canvas
    ctx.fillStyle = "#000";
}

function labelOffsetY(point: Point)
{
    return (point.size + point.label.offsetY + point.label.fontSize);
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
    labelDiv.style.left = `${canvas.offsetLeft + vertex.x + vertex.label.offsetX}px`; // adjust as needed
    labelDiv.style.top = `${canvas.offsetTop + vertex.y - labelOffsetY(vertex)}px`;
  
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
    // infoBox.style.left = `${rect.left + vertex.x - 100}px`;
    // infoBox.style.top = `${rect.top + vertex.y - 50}px`;
    const canvasPos = myCanvasHandler?.worldToCanvas(vertex.x,vertex.y);
    if (canvasPos)
    {
        infoBox.style.left = `${rect.left + canvasPos.x + 10}px`;
        infoBox.style.top = `${rect.top + canvasPos.y + 10}px`;
    }
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
    // infoBox.style.left = `${cross.x + 30 }px`;
    // infoBox.style.top = `${cross.y + 50}px`;
    infoBox.style.left = `${mouse.x + rect.left + 5}px`;
    infoBox.style.top = `${mouse.y + rect.top + 5}px`;
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
    ctx.lineWidth = 1/scale;
    // show bigger bend when mouse near it
    let size = bend.size;
    if (bend === hoveredBend)
        size = size+1;
    ctx.arc(bend.x, bend.y, size/scale , 0, 2 * Math.PI); // small green circle
    ctx.fillStyle = bend.color;
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.lineWidth = 2/scale;

    // add a dashed circle around a selected bend
    if (selector.bends.includes(bend)) 
        showSelectedPoint(ctx, bend);
    // label
    showPointLabel(ctx,bend);
}

// add a dashed circle around a selected point
function showSelectedPoint(ctx: CanvasRenderingContext2D, p: Point)
{
    ctx.beginPath();
    ctx.arc(p.x, p.y, (p.size + 3)/scale, 0, 2 * Math.PI);
    ctx.strokeStyle = "orange"; // or "#f39c12"
    // ctx.lineWidth = 3;
    ctx.setLineDash([5/scale, 3/scale]); // dashed circle
    ctx.stroke();
    // ctx.lineWidth = 2;
    ctx.setLineDash([]); // reset to solid for others
}

function drawShape(ctx: CanvasRenderingContext2D, x: number, y: number, shape: string, size: number, color: string, fill: boolean = true)
{
    ctx.beginPath();
    ctx.lineWidth = 2/scale;
    size = size/scale;
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
    rad = rad/scale!;
    ctx.beginPath();
    ctx.lineWidth = 1/scale;
    // show bigger bend when mouse near it
    ctx.arc(x, y, rad , 0, 2 * Math.PI); // small green circle
    if (color !== undefined)
        ctx.fillStyle = color;
    else
       ctx.fillStyle = "#0000FF";   // same as color in bend class constructor
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.lineWidth = 2/scale;
}

function drawEdge(ctx: CanvasRenderingContext2D, edge: Edge, highlight: number = 0)
{
    const v1 = edge.points[0];
    const v2 = edge.points[1];
    if (v1 && v2) {
        ctx.beginPath();
        ctx.moveTo(v1.x, v1.y);
        if (edge.dashed)
            ctx.setLineDash([5/scale, 5/scale]); // Dash pattern: [dashLength, gapLength]
        ctx.lineWidth = edge.thickness/scale;
        const bends = edge.bends;
        // draw the edge passing through bends
        for (let i=0;i<bends.length;i++)
            ctx.lineTo(bends[i].x,bends[i].y);
        ctx.lineTo(v2.x, v2.y);
        ctx.strokeStyle = edge.color;
        // increase thickness if edge === hoveredEdge
        if (hoveredEdge === edge)
            ctx.lineWidth = (edge.thickness+2)/scale;
        // highlight if the edge is one of the edges of a hovering crossing
        if (hoveredCrossing && hoveredCrossingEdges.includes(edge))
        {
            ctx.lineWidth = (edge.thickness+2)/scale;                   // increase thickness
            ctx.strokeStyle = crossingColor(hoveredCrossing);   // highlight the edge with the color of the crossing
            ctx.setLineDash([]);                                // no dashed line
        }
        else if (highlight === 1)   // highlight crossing edges of selected edges
        {
            ctx.lineWidth = (edge.thickness+2)/scale;
            ctx.strokeStyle = modalsHandler.settingsOptions.crossing_edges_colors.crossing;
            ctx.setLineDash([]);
        }
        else if (highlight === 2)   // highlight non-crossing edges of selected edges
        {
            ctx.lineWidth = (edge.thickness+2)/scale;
            ctx.strokeStyle = modalsHandler.settingsOptions.crossing_edges_colors.nonCrossing;
            ctx.setLineDash([]);
        }
        ctx.stroke();
        // if the edge is selected, highlight it with a dashed colored line
        if (selector.edges.includes(edge))   // can be implemented faster by drawing all the selected edges first and then the others, so there's no need to check all the selector.vertices array for each edge
        {
            ctx.beginPath();
            ctx.moveTo(v1.x, v1.y);
            for (let i=0;i<bends.length;i++)
                ctx.lineTo(bends[i].x,bends[i].y);
            ctx.lineTo(v2.x, v2.y);
            ctx.strokeStyle = "orange";
            ctx.setLineDash([5/scale, 3/scale]); // dashed line
            ctx.lineWidth = (edge.thickness+1)/scale;
            ctx.stroke();
        }
        //reset
        ctx.setLineDash([]);
        ctx.lineWidth = edge.thickness/scale;
        // draw bends
        for (const bend of edge.bends)
            drawBend(ctx,bend);
        showEdgeLabel(ctx,edge);
    }
}

function showEdgeInfo(edge: Edge) {
    const infoBox = document.getElementById("edge-info")!;
    const rect = canvas.getBoundingClientRect();

    const infoText =  ` Edge: ${edge.id}<br>
                        CC: ${edge.bends.length}`;

    infoBox.innerHTML = infoText;
    // infoBox.style.left = `${rect.left + mouse.x + 5}px`;
    // infoBox.style.top = `${rect.top + mouse.y + 5}px`;
    infoBox.style.left = `${rect.left + mouse.x + 10}px`;
    infoBox.style.top = `${rect.top + mouse.y + 10}px`;
    infoBox.style.display = "block";
}

function hideEdgeInfo() {
    const infoBox = document.getElementById("edge-info")!;
    infoBox.style.display = "none";
}

// check that mouse is near a label (in world coordinates)
function isNearLabel(point: Point, x: number, y: number): boolean {
    if (!point.label.showLabel)
        return false;   // return false if the point's label is not displayed
    const labelX = point.x + point.label.offsetX/scale;
    const labelY = point.y - labelOffsetY(point)/scale;    // check that label is positioned at these coordinates at drawVertex function
    const width = point.label.content.length*point.label.fontSize/scale;  
    const height = 1.3*point.label.fontSize/scale;
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

// draw a rubbish bin (when creating a new edge)
function drawRubbishBin(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    if(isMouseNear(x,y,rubbishBinRadius/scale))
        ctx.strokeStyle = "red"
    else
        ctx.strokeStyle = "black";
    ctx.lineWidth = 2/scale;

    // Draw bin body
    ctx.beginPath();
    ctx.rect(x, y, 20/scale!, 30/scale);
    ctx.stroke();

    // Draw bin lid
    ctx.beginPath();
    ctx.moveTo(x - 5/scale, y);
    ctx.lineTo(x + 25/scale, y);
    ctx.stroke();

    // Draw handle
    ctx.beginPath();
    ctx.moveTo(x + 7/scale, y - 5/scale);
    ctx.lineTo(x + 13/scale, y - 5/scale);
    ctx.stroke();

    ctx.restore();
}
