import { CanvasHandler } from "./canvasHandler.js";
import { Coords, Scaler } from "./zoomHelpers.js";
import { Graph } from "./graph.js";
import { ModalsHandler } from "./modals.js";
import { Copier, Hover, Selector } from "./selector.js";
import { StateHandler } from "./stateHandler.js";
import { Edge, Point, Vertex } from "./graphElements.js";

export class ContMenu
{
    private graph: Graph;
    private worldCoords: Coords;
    private canvas: HTMLCanvasElement;
    private copier: Copier;
    private selector: Selector;
    private stateHandler: StateHandler;
    private myCanvasHandler: CanvasHandler;
    private modalsHandler: ModalsHandler;
    private hover: Hover;
    private scaler: Scaler;

    private _showingContextMenu: boolean = false;
    get showingContextMenu() { return this._showingContextMenu; }
    private contextMenu: HTMLUListElement = document.getElementById("contMenu") as HTMLUListElement;
    private menuOptions = 
    {
        point: [
            { label: "Show Label", action: "showPointLabel" },
            { label: "Hide Label", action: "hidePointLabel" },
            { label: "Edit Label", action: "editPointLabel"},
            // { label: "Delete Point", action: "deletePoint" },
        ],
        edge: [
            { label: "Add Bend", action: "addBend" },
            { label: "Show Label", action: "showEdgeLabel" },
            { label: "Hide Label", action: "hideEdgeLabel" },
            { label: "Edit Label", action: "editEdgeLabel"},
            { label: "Delete Edge", action: "deleteEdge"},
        ],
        selected: [
            { label: "Copy Selected", action: "copySelected" },
            { label: "Show Labels", action: "showSelectedLabels"},
            { label: "Hide Labels", action: "hideSelectedLabels"},
            { label: "Edit Labels", action: "editSelectedLabels"},
            { label: "Delete Selected", action: "deleteSelected"},
        ],
        labels: [
            { label: "Hide Label", action: "hideLabel"},
            { label: "Edit Label", action: "editLabel"},
        ],
        void: [
            { label: "Paste", action: "paste"},
            { label: "Select All", action: "selectAll"},
            { label: "Clear Canvas", action: "clear-canvas"},
        ]
    };

    constructor(graph: Graph, worldCoords: Coords, canvas: HTMLCanvasElement, copier: Copier, 
        selector: Selector, stateHandler: StateHandler, myCanvasHandler: CanvasHandler,
        modalsHandler: ModalsHandler, hover: Hover, scaler: Scaler)
    {
        this.graph = graph; this.worldCoords = worldCoords; this.canvas = canvas;
        this.copier = copier; this.selector = selector; this.stateHandler = stateHandler;
        this.myCanvasHandler = myCanvasHandler; this.modalsHandler = modalsHandler; this.hover = hover; this.scaler = scaler;
        this.addEventListeners();
    }

    // Show the context menu dynamically
    private showContextMenu(e: MouseEvent, type: "point" | "edge" | "selected" | "labels" | "void") {
        e.preventDefault();

        // Clear old menu
        this.contextMenu.innerHTML = "";

        // Add relevant items (shared + type-specific)
        const items = [...this.menuOptions[type]];
        for (const item of items) {
            const li = document.createElement("li");
            li.textContent = item.label;
            li.dataset.action = item.action;
            this.contextMenu.appendChild(li);
        }

        // Position the menu
        this.contextMenu.style.left = e.pageX + "px";
        this.contextMenu.style.top = e.pageY + "px";
        this.contextMenu.style.display = "block";

        // showing context menu
        this._showingContextMenu = true;
    }


    private addEventListeners()
    {
        // Hide menu on click
        window.addEventListener("click", () => {
            this.contextMenu.style.display = "none";
            this._showingContextMenu = false;
        });

        // Handle menu clicks
        this.contextMenu.addEventListener("click", (e) => {
            const target = e.target as HTMLLIElement;
            const action = target.dataset.action;

            if (!action) return;
            this.handleContextAction(action);
            this.contextMenu.style.display = "none";
            this._showingContextMenu = false;
            this.worldCoords.update(this.scaler.screenToWorld(e.clientX, e.clientY));
            this.hover.check(this.myCanvasHandler.getScale());
        });

        this.canvas.addEventListener("contextmenu", (e) => {
            const clicked = this.detectClickedElement(e); // e.g. 'vertex' or 'edge'
            this.showContextMenu(e, clicked);
        });
    }
 
    private detectClickedElement(e: MouseEvent): "point" | "edge" | "selected" | "labels" | "void" 
    {
        this.copier.rightClickPos = {x: this.worldCoords.x, y: this.worldCoords.y};
        
        if (this.hover.point && this.selector.points.includes(this.hover.point) || this.hover.edge && this.selector.edges.includes(this.hover.edge))
            return "selected";
        else if (this.hover.edge)           // edge
            return "edge";
        else if (this.hover.point)          // point
            return "point";
        else if (this.hover.labelPoint )    // label
            return "labels";
        else                                // show general menu
            return "void";
    }

    private handleContextAction(action: string) {
        switch (action) {
            // void options
            case "clear-canvas":
                if (!this.graph.isEmpty())
                {
                    this.stateHandler.saveState();
                    this.graph.clear();
                    this.selector.selectAll(this.graph);
                    // this.hover.check(this.myCanvasHandler.getScale());
                    // this.myCanvasHandler?.fixView(this.selector);
                }
                this.myCanvasHandler.resetView();
                break;
            case "paste":
                if ( this.copier.canPaste() )
                {
                    this.stateHandler.saveState();
                    this.copier.pasteSelected(this.graph,this.selector,false);
                    // this.hover.check(this.myCanvasHandler.getScale());
                    this.myCanvasHandler?.redraw();
                }
                break;
            case "selectAll":
                this.selector.selectAll(this.graph);
                this.myCanvasHandler?.redraw();
                break;
            // edge options
            case "addBend":
                this.stateHandler.saveState();
                const p1 = this.hover.edge!.points[0];  // edge options appear only when an edge is hovered
                const p2 = this.hover.edge!.points[1];
                if (p1 instanceof Vertex && p2 instanceof Vertex)
                    this.graph.addBend(p1,p2,this.worldCoords.x,this.worldCoords.y);
                    // graph.addBend(p1,p2,mouse.x,mouse.y);
                // set it free
                this.hover.edge = null;
                // renderGraph();
                this.myCanvasHandler?.redraw();
                break;
            case "deleteEdge":
                this.stateHandler.saveState();
                this.graph.deleteEdgee(this.hover.edge!);   // this.edgeMenu appears only when an edge is hovered, so hover.edge is not null
                // this.hover.check(this.myCanvasHandler.getScale());
                this.myCanvasHandler?.redraw(); 
                break;
            case "showEdgeLabel":
                if (this.hover.edge && !this.hover.edge.label.showLabel)
                {
                    this.stateHandler.saveState();
                    this.hover.edge.label.showLabel = true;
                    // this.hover.check(this.myCanvasHandler.getScale());
                    this.myCanvasHandler?.redraw();
                }
                break;
            case "hideEdgeLabel":
                if (this.hover.edge && this.hover.edge.label.showLabel)
                {
                    this.stateHandler.saveState();
                    this.hover.edge.label.showLabel = false;
                    // this.hover.check(this.myCanvasHandler.getScale());
                    this.myCanvasHandler?.redraw();
                }
                break;
            case "editEdgeLabel":
                if (this.hover.edge)
                    this.modalsHandler.showEditLabelModal([this.hover.edge]);
            // selected options
            case "copySelected":
                this.copier.copySelected(this.selector,true);
                // this.hover.check(this.myCanvasHandler.getScale());
                break;
            case "deleteSelected":
                // stateHandler.saveState();
                this.selector.deleteSelectedObjects(this.graph);
                // this.hover.check(this.myCanvasHandler.getScale());
                this.myCanvasHandler?.redraw();
                break;
            case "showSelectedLabels":
                // stateHandler.saveState();     if not commented, state is saved twice for some reason. If commented, looks to work fine
                for (const point of this.selector.points)
                    point.label.showLabel = true;
                for (const edge of this.selector.edges)
                    edge.label.showLabel = true;
                // this.hover.check(this.myCanvasHandler.getScale());
                this.myCanvasHandler?.redraw();
                break;
            case "hideSelectedLabels":
                    // stateHandler.saveState(); if not commented, state is saved twice for some reason. If commented, looks to work fine
                    for (const point of this.selector.points)
                        point.label.showLabel = false;
                    for (const edge of this.selector.edges)
                        edge.label.showLabel = false;
                    // this.hover.check(this.myCanvasHandler.getScale());
                    this.myCanvasHandler?.redraw();
                break;
            case "editSelectedLabels":
                const elements: (Point|Edge)[] = [];
                this.selector.points.forEach(p => elements.push(p));
                this.selector.edges.forEach(e => elements.push(e));
                this.modalsHandler.showEditLabelModal(elements);
                break;
            // point options
            case "showPointLabel":
                if (this.hover.point && !this.hover.point.label.showLabel)   // no need to check, as this.pointMenu is triggered only when hover.point is not null
                {
                    this.stateHandler.saveState();
                    this.hover.point.label.showLabel = true;
                    // this.hover.check(this.myCanvasHandler.getScale());
                    this.myCanvasHandler?.redraw();
                }
                break;
            case "hidePointLabel":
                if (this.hover.point && this.hover.point.label.showLabel)
                {
                    this.stateHandler.saveState();
                    this.hover.point.label.showLabel = false;
                    // this.hover.check(this.myCanvasHandler.getScale());
                    this.myCanvasHandler?.redraw();
                }
                break;
            case "editPointLabel":
                if (this.hover.point)
                    this.modalsHandler.showEditLabelModal([this.hover.point]);
                break;
            // label options
            case "editLabel":
                if (this.hover.labelPoint)
                    this.modalsHandler.showEditLabelModal([this.hover.labelPoint]);
                break;
            case "hideLabel":
                if (this.hover.labelPoint)
                {
                    this.stateHandler.saveState();
                    this.hover.labelPoint.label.showLabel = false;
                    // this.hover.check(this.myCanvasHandler.getScale());
                    this.myCanvasHandler?.redraw();
                }
            default:
                console.warn("Unknown action:", action);
        }
    }

    public clickOutsideActiveMenu(e: MouseEvent)
    {
        if (this.contextMenu && !this.contextMenu.contains(e.target as Node) && this.showingContextMenu) {
            this.contextMenu.style.display = "none";
            this._showingContextMenu = false;
            return true;
        }
        return false;
    }
}