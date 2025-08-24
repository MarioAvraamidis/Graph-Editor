// contextMenu.ts
import { Graph, Vertex } from "./graph.js";
export class Cmenu {
    constructor(graph, worldCoords, canvas, copier, selector, stateHandler, myCanvasHandler, modalsHandler, hover) {
        // context menus
        this.contextMenu = document.getElementById('contextMenu');
        this.edgeMenu = document.getElementById("edgeMenu");
        this.selectedMenu = document.getElementById("selectedMenu");
        this.pointMenu = document.getElementById("pointMenu");
        this.labelMenu = document.getElementById("labelMenu");
        this.showingContextMenu = false;
        this.addMenusEventListeners(graph, worldCoords, canvas, copier, selector, stateHandler, myCanvasHandler, modalsHandler, hover);
    }
    // Function to hide the context menu
    hideContextMenu() {
        /*const menus: HTMLDivElement[] = [contextMenu,this.edgeMenu,this.selectedMenu,this.pointMenu,this.labelMenu];
        for (const menu in menus)
                menu.style.display = 'none';*/
        if (this.contextMenu) {
            this.contextMenu.style.display = 'none';
        }
        if (this.edgeMenu) {
            this.edgeMenu.style.display = 'none';
        }
        if (this.selectedMenu) {
            this.selectedMenu.style.display = 'none';
        }
        if (this.pointMenu)
            this.pointMenu.style.display = 'none';
        if (this.labelMenu)
            this.labelMenu.style.display = 'none';
    }
    // Function to show and position the context menu
    showContextMenu(x, y, menu) {
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
    addMenusEventListeners(graph, worldCoords, canvas, copier, selector, stateHandler, myCanvasHandler, modalsHandler, hover) {
        // Add event listener for right-click (contextmenu) on the canvas
        canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault(); // Prevent the browser's default context menu
            // inform the copier for the right click position
            copier.rightClickPos = { x: worldCoords.x, y: worldCoords.y };
            //if (hoveredVertex && selector.vertices.includes(hoveredVertex) || hover.edge && selector.edges.includes(hover.edge) || hoveredBend && selector.bends.includes(hoveredBend))
            if (hover.point && selector.points.includes(hover.point) || hover.edge && selector.edges.includes(hover.edge))
                this.showContextMenu(event.clientX, event.clientY, this.selectedMenu);
            else if (hover.edge) // show edge menu
                this.showContextMenu(event.clientX, event.clientY, this.edgeMenu);
            else if (hover.point) // show point menu
                this.showContextMenu(event.clientX, event.clientY, this.pointMenu);
            else if (hover.labelPoint)
                this.showContextMenu(event.clientX, event.clientY, this.labelMenu);
            else // show general menu
                this.showContextMenu(event.clientX, event.clientY, this.contextMenu);
            this.showingContextMenu = true;
        });
        // Add event listener for clicks on the context menu options
        this.contextMenu.addEventListener('click', (event) => {
            const target = event.target;
            // Ensure a menu item was clicked
            if (target.tagName === 'LI' && target.hasAttribute('data-action')) {
                const action = target.getAttribute('data-action');
                this.hideContextMenu(); // Hide menu after selection
                switch (action) {
                    case "clear-canvas":
                        stateHandler.saveState();
                        graph.replace(new Graph());
                        hover.check(myCanvasHandler.getScale());
                        // renderGraph();
                        myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.fixView(selector);
                        //myCanvasHandler?.redraw();
                        break;
                    // Add more cases for other actions
                    case "paste":
                        if (copier.canPaste()) {
                            stateHandler.saveState();
                            copier.pasteSelected(graph, selector, false);
                            hover.check(myCanvasHandler.getScale());
                            myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
                        }
                        break;
                    default:
                        console.log(`Action not implemented: ${action}`);
                }
            }
        });
        // edge menu options
        this.edgeMenu.addEventListener('click', (event) => {
            const target = event.target;
            // Ensure a menu item was clicked
            if (target.tagName === 'LI' && target.hasAttribute('data-action')) {
                const action = target.getAttribute('data-action');
                this.hideContextMenu(); // Hide menu after selection
                switch (action) {
                    case "addBend":
                        stateHandler.saveState();
                        const p1 = hover.edge.points[0]; // this.edgeMenu appears only when an edge is hovered
                        const p2 = hover.edge.points[1];
                        if (p1 instanceof Vertex && p2 instanceof Vertex)
                            graph.addBend(p1, p2, worldCoords.x, worldCoords.y);
                        // graph.addBend(p1,p2,mouse.x,mouse.y);
                        // set it free
                        hover.edge = null;
                        // renderGraph();
                        myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
                        break;
                    case "deleteEdge":
                        stateHandler.saveState();
                        graph.deleteEdgee(hover.edge); // this.edgeMenu appears only when an edge is hovered, so hover.edge is not null
                        hover.check(myCanvasHandler.getScale());
                        myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
                        break;
                    case "showLabel":
                        if (hover.edge && !hover.edge.label.showLabel) {
                            stateHandler.saveState();
                            hover.edge.label.showLabel = true;
                            hover.check(myCanvasHandler.getScale());
                            myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
                        }
                        break;
                    case "hideLabel":
                        if (hover.edge && hover.edge.label.showLabel) {
                            stateHandler.saveState();
                            hover.edge.label.showLabel = false;
                            hover.check(myCanvasHandler.getScale());
                            myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
                        }
                        break;
                    // Add more cases for other actions
                    default:
                        console.log(`Action not implemented: ${action}`);
                }
            }
        });
        // selected menu options
        this.selectedMenu.addEventListener('click', (event) => {
            const target = event.target;
            // Ensure a menu item was clicked
            if (target.tagName === 'LI' && target.hasAttribute('data-action')) {
                const action = target.getAttribute('data-action');
                this.hideContextMenu(); // Hide menu after selection
                switch (action) {
                    case "copySelected":
                        copier.copySelected(selector, true);
                        hover.check(myCanvasHandler.getScale());
                        break;
                    case "deleteSelected":
                        // stateHandler.saveState();
                        selector.deleteSelectedObjects(graph);
                        hover.check(myCanvasHandler.getScale());
                        myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
                        break;
                    case "showLabels":
                        // stateHandler.saveState();     if not commented, state is saved twice for some reason. If commented, looks to work fine
                        for (const point of selector.points)
                            point.label.showLabel = true;
                        for (const edge of selector.edges)
                            edge.label.showLabel = true;
                        hover.check(myCanvasHandler.getScale());
                        myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
                        break;
                    case "hideLabels":
                        if (selector.points.length > 0) {
                            // stateHandler.saveState(); if not commented, state is saved twice for some reason. If commented, looks to work fine
                            for (const point of selector.points)
                                point.label.showLabel = false;
                            for (const edge of selector.edges)
                                edge.label.showLabel = false;
                            hover.check(myCanvasHandler.getScale());
                            myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
                        }
                        break;
                    // Add more cases for other actions
                    default:
                        console.log(`Action not implemented: ${action}`);
                }
            }
        });
        // crossing menu options
        this.pointMenu.addEventListener('click', (event) => {
            const target = event.target;
            // Ensure a menu item was clicked
            if (target.tagName === 'LI' && target.hasAttribute('data-action')) {
                const action = target.getAttribute('data-action');
                this.hideContextMenu(); // Hide menu after selection
                switch (action) {
                    case "showLabel":
                        if (hover.point && !hover.point.label.showLabel) // no need to check, as this.pointMenu is triggered only when hover.point is not null
                         {
                            stateHandler.saveState();
                            hover.point.label.showLabel = true;
                            hover.check(myCanvasHandler.getScale());
                            myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
                        }
                        break;
                    case "hideLabel":
                        if (hover.point && hover.point.label.showLabel) {
                            stateHandler.saveState();
                            hover.point.label.showLabel = false;
                            hover.check(myCanvasHandler.getScale());
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
        this.labelMenu.addEventListener('click', (event) => {
            const target = event.target;
            // Ensure a menu item was clicked
            if (target.tagName === 'LI' && target.hasAttribute('data-action')) {
                const action = target.getAttribute('data-action');
                this.hideContextMenu(); // Hide menu after selection
                //console.log("label-menu");
                switch (action) {
                    case "editLabel":
                        if (hover.labelPoint) {
                            // console.log("hover.labelPoint found");
                            modalsHandler.showEditLabelModal(hover.labelPoint);
                            // FIX: Display a warning message. No console.log
                            // if (hover.labelPoint instanceof Vertex)
                        }
                        break;
                    case "hideLabel":
                        if (hover.labelPoint) {
                            stateHandler.saveState();
                            hover.labelPoint.label.showLabel = false;
                            hover.check(myCanvasHandler.getScale());
                            myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
                        }
                    // Add more cases for other actions
                    default:
                        console.log(`Action not implemented: ${action}`);
                }
            }
        });
    }
}
/*
// DOM elements (initialized on DOMContentLoaded)
let customContextMenu: HTMLElement | null = null;
let menuItemAddVertex: HTMLElement | null = null;
let menuItemRenameLabel: HTMLElement | null = null;
let menuItemDeleteSelected: HTMLElement | null = null;
// ... other menu items

// Callbacks will be stored here after initialization
type ContextMenuActions = {
    onAddVertex?: (e: MouseEvent) => void;
    onRenameLabel?: (e: MouseEvent) => void;
    onDeleteSelected?: (e: MouseEvent) => void;
    onSettings?: (e: MouseEvent) => void;
    // ... define types for all other actions
};
let menuActions: ContextMenuActions = {};*/
/**
 * Initializes the context menu and sets up its event listeners.
 * @param actions An object containing callback functions for each menu item.
 */
/*
export function initializeContextMenu(actions: ContextMenuActions): void {
    customContextMenu = document.getElementById('customContextMenu') as HTMLElement;
    menuItemAddVertex = document.getElementById('menuItemAddVertex') as HTMLElement;
    menuItemRenameLabel = document.getElementById('menuItemRenameLabel') as HTMLElement;
    menuItemDeleteSelected = document.getElementById('menuItemDeleteSelected') as HTMLElement;
    // ... get references for other menu items

    menuActions = actions; // Store the provided actions

    if (!customContextMenu) {
        console.error("Context menu element not found. Context menu disabled.");
        return;
    }

    // Attach internal click handlers to menu items
    menuItemAddVertex?.addEventListener('click', (e) => { hideContextMenu(); menuActions.onAddVertex?.(e); });
    menuItemRenameLabel?.addEventListener('click', (e) => { hideContextMenu(); menuActions.onRenameLabel?.(e); });
    menuItemDeleteSelected?.addEventListener('click', (e) => { hideContextMenu(); menuActions.onDeleteSelected?.(e); });
    // ... attach listeners for other items

    // Add the main contextmenu listener to your canvas or document
    // This part might still be in main.ts if it depends on specific canvas state,
    // or you can pass the element to listen on. Let's assume you pass it.
    // However, the logic for *which* options to show depends on the click context,
    // so `showDynamicContextMenu` should also be exported and take context.
}*/
/**
 * Shows the custom context menu with options filtered by the given context.
 * @param e The mouse event that triggered the context menu.
 * @param clickedObjectType The type of object clicked ('vertex' | 'edge' | 'canvas').
 * @param specificData Optional. Any specific data about the clicked object (e.g., the vertex object itself).
 */
/*
export function showDynamicContextMenu(e: MouseEvent, clickedObjectType: 'vertex' | 'edge' | 'canvas', specificData?: any): void {
    e.preventDefault(); // Prevent the browser's default context menu

    hideContextMenu(); // Hide any currently open menu
    hideAllMenuItems(); // Start by hiding all options

    // Show relevant menu items based on the condition
    if (clickedObjectType === 'vertex') {
        menuItemRenameLabel?.classList.remove('hidden');
        menuItemDeleteSelected?.classList.remove('hidden');
        // ... show other vertex-specific options
    } else if (clickedObjectType === 'edge') {
        menuItemDeleteSelected?.classList.remove('hidden'); // For deleting edge
        // ... show other edge-specific options
    } else if (clickedObjectType === 'canvas') {
        menuItemAddVertex?.classList.remove('hidden');
        // ... show other canvas-specific options
    }

    // Position the context menu
    customContextMenu!.style.left = `${e.clientX}px`;
    customContextMenu!.style.top = `${e.clientY}px`;
    customContextMenu!.style.display = 'block';

    // Set up a one-time listener to hide the menu when the user clicks anywhere else
    setTimeout(() => { // Small delay to avoid immediate close
        document.addEventListener('click', hideContextMenu, { once: true });
        document.addEventListener('contextmenu', hideContextMenu, { once: true });
    }, 10);
}

// Helper to hide all items initially
function hideAllMenuItems(): void {
    if (customContextMenu) {
        const allMenuItems = customContextMenu.querySelectorAll('.context-menu-item');
        allMenuItems.forEach(item => item.classList.add('hidden'));
    }
}

// Helper to hide the context menu
function hideContextMenu(): void {
    if (customContextMenu) {
        customContextMenu.style.display = 'none';
    }
}

// Call initializeContextMenu on DOMContentLoaded from main.ts
// The actual event listener for contextmenu will still be in main.ts
// because it needs to know what object was clicked to call showDynamicContextMenu.*/ 
