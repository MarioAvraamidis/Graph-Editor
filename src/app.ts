// src/app.ts
import { Graph, Vertex, Bend, Edge, Point, Crossing, BendedEdgeCreator } from "./graph.js";
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

let graph = new Graph();        // Create a graph instance
let stateHandler: StateHandler; // undo/redo utilities
let hover: Hover;               // hovered objects
let selector: Selector;         // selected items
let copier: Copier;             // copy selected items
let btnHandler: BtnHandler;     // buttons handler
let cmenu: Cmenu;               // context menus
let drawer: Drawer;             // drawing
let scaler: Scaler;             // zoom
let worldCoords: Coords         // graph coordinates of cursor (used when transforming during zoom)
let mouseHandler: MouseHandler; // handle mouse events (mousedown, mouseup, mousemove, click)
let settingsOptions: SettingsOptions;       // settings/default options
let modalsHandler: ModalsHandler;           // handle settings and label modals
let paletteHandler: PaletteHandler;         // palette handler
let bendedEdgeCreator: BendedEdgeCreator;   // creating bended edges
let canvas: HTMLCanvasElement;              // canvas
let ctx: CanvasRenderingContext2D | null;   // canvas context
let myCanvasHandler: CanvasHandler | null = null;   // handle zoom in canvas
// let scale: number = 1;      // for all the elements that we want their size to remain the same regardless of the zoom scale, devide the size by scale

document.addEventListener('DOMContentLoaded', () => {
    try {
        canvas = document.getElementById("graphCanvas") as HTMLCanvasElement;
        ctx = canvas.getContext("2d");
        if (!ctx)
            throw new Error("Could not get canvas rendering context");
        scaler = new Scaler(canvas);
        worldCoords = new Coords();
        stateHandler = new StateHandler(graph);
        selector = new Selector();
        hover = new Hover(graph,worldCoords,selector);
        settingsOptions = new SettingsOptions();
        copier = new Copier();
        bendedEdgeCreator = new BendedEdgeCreator();
        drawer = new Drawer(selector,settingsOptions,hover,worldCoords,scaler,bendedEdgeCreator);
        myCanvasHandler = new CanvasHandler('graphCanvas',drawer,graph);
        paletteHandler = new PaletteHandler(selector,myCanvasHandler,stateHandler,graph,settingsOptions);
        modalsHandler = new ModalsHandler(myCanvasHandler,stateHandler,hover,settingsOptions);
        btnHandler = new BtnHandler(graph,myCanvasHandler,selector,stateHandler,copier,settingsOptions);
        cmenu = new Cmenu(graph,worldCoords,canvas,copier,selector,stateHandler,myCanvasHandler,modalsHandler,hover);
        mouseHandler = new MouseHandler(graph,canvas,worldCoords,cmenu,hover,selector,stateHandler,paletteHandler,settingsOptions,scaler,myCanvasHandler,bendedEdgeCreator);
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

    } catch (error) {
        console.error("Error initializing Canvas:", error);
    }
});

