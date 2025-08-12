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
        if (!ctx)
            throw new Error("Could not get canvas rendering context");
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
