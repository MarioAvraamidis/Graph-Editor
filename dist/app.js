// src/app.ts
import { Graph } from "./graph.js";
import { CanvasHandler } from './canvasHandler.js';
import { Coords, Scaler } from "./zoomHelpers.js";
import { ModalsHandler } from "./modals.js";
import { StateHandler } from "./stateHandler.js";
import { Selector, Copier, Hover } from "./selector.js";
import { BtnHandler } from "./buttons.js";
import { PaletteHandler } from "./paletteHandler.js";
import { MouseHandler } from "./mouse.js";
import { Drawer } from "./draw.js";
import { SettingsOptions } from "./settings.js";
import { setOverlayCanvas } from "./overlayCanvas.js";
import { RubbishBin } from "./rubbishBin.js";
import { BendedEdgeCreator } from "./edgeCreator.js";
import { ContMenu } from "./contextMenu.js";
let graph = new Graph(); // Create a graph instance
let stateHandler; // undo/redo utilities
let hover; // hovered objects
let selector; // selected items
let copier; // copy selected items
let btnHandler; // buttons handler
// let cmenu: Cmenu;               // context menus
let contMenu; // context menu
let drawer; // drawing
let scaler; // zoom
let rubbishBin; // rubbish bin when creating bended edge
let worldCoords; // graph coordinates of cursor (used when transforming during zoom)
let mouseHandler; // handle mouse events (mousedown, mouseup, mousemove, click)
let settingsOptions; // settings/default options
let modalsHandler; // handle settings and label modals
let paletteHandler; // palette handler
let bendedEdgeCreator; // creating bended edges
let canvas; // canvas
let ctx; // canvas context
let myCanvasHandler = null; // handle zoom in canvas
// let scale: number = 1;      // for all the elements that we want their size to remain the same regardless of the zoom scale, devide the size by scale
document.addEventListener('DOMContentLoaded', () => {
    try {
        canvas = document.getElementById("graphCanvas");
        if (!canvas) {
            throw new Error(`Canvas not found.`);
        }
        ctx = canvas.getContext("2d");
        if (!ctx)
            throw new Error("Could not get canvas rendering context");
        worldCoords = new Coords();
        stateHandler = new StateHandler(graph);
        selector = new Selector();
        hover = new Hover(graph, worldCoords, selector);
        settingsOptions = new SettingsOptions();
        copier = new Copier();
        bendedEdgeCreator = new BendedEdgeCreator();
        scaler = new Scaler(canvas);
        rubbishBin = new RubbishBin(50, { x: 0, y: 0 }); // initial pos is not valid. It's updated when drawing
        drawer = new Drawer(selector, settingsOptions, hover, worldCoords, scaler, bendedEdgeCreator, rubbishBin);
        myCanvasHandler = new CanvasHandler(canvas, drawer, graph);
        setOverlayCanvas(graph, settingsOptions, myCanvasHandler, selector);
        modalsHandler = new ModalsHandler(graph, myCanvasHandler, stateHandler, hover, settingsOptions, selector);
        paletteHandler = new PaletteHandler(selector, myCanvasHandler, stateHandler, graph, settingsOptions, modalsHandler);
        btnHandler = new BtnHandler(canvas, graph, myCanvasHandler, selector, stateHandler, copier, settingsOptions);
        // cmenu = new Cmenu(graph,worldCoords,canvas,copier,selector,stateHandler,myCanvasHandler,modalsHandler,hover);
        contMenu = new ContMenu(graph, worldCoords, canvas, copier, selector, stateHandler, myCanvasHandler, modalsHandler, hover, scaler);
        // mouseHandler = new MouseHandler(graph,canvas,worldCoords,cmenu,hover,selector,stateHandler,paletteHandler,settingsOptions,scaler,myCanvasHandler,bendedEdgeCreator, rubbishBin);
        mouseHandler = new MouseHandler(graph, canvas, worldCoords, contMenu, hover, selector, stateHandler, paletteHandler, settingsOptions, scaler, myCanvasHandler, bendedEdgeCreator, rubbishBin);
        myCanvasHandler.redraw();
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
