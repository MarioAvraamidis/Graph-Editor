import { CanvasHandler } from "./canvasHandler.js";
import { Graph } from "./graph.js";
import { SimpleDrawer } from "./simpleDrawer.js";
import { Scaler } from "./zoomHelpers.js";
export function setOverlayCanvas(graph, settingsOptions, mainCanvasHandler) {
    var _a, _b;
    const overlayCanvas = document.getElementById("overlayCanvas");
    const wrapper = document.querySelector(".overlay-wrapper");
    wrapper.style.display = 'inline-block'; // make the wrapper visible
    const scaler = new Scaler(overlayCanvas);
    const simpleDrawer = new SimpleDrawer(scaler, settingsOptions);
    const overlayGraph = new Graph();
    const canvasHandler = new CanvasHandler(overlayCanvas, simpleDrawer, overlayGraph);
    // btns
    (_a = document.getElementById("overlayUpdateBtn")) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
        overlayGraph.replace(graph.clone());
        canvasHandler.fixView();
    });
    (_b = document.getElementById("overlaySwitchBtn")) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => {
        const initial = overlayGraph.clone();
        overlayGraph.replace(graph.clone());
        graph.replace(initial);
        canvasHandler.fixView();
        mainCanvasHandler.fixView();
    });
    overlayCanvas.addEventListener("mouseenter", () => {
        wrapper.classList.add("grow");
        resizeCanvasToWrapper(overlayCanvas, wrapper);
        setOverlayResolution(overlayCanvas, canvasHandler); // redraw at new CSS size
    });
    overlayCanvas.addEventListener("mouseleave", () => {
        wrapper.classList.remove("grow");
        resizeCanvasToWrapper(overlayCanvas, wrapper);
        setOverlayResolution(overlayCanvas, canvasHandler); // redraw at normal CSS size
    });
}
// Modify setOverlayResolution to handle initial DPR scaling
function setOverlayResolution(canvas, canvasHandler) {
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    // Use CSS for the actual dimensions
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    // Initial draw
    canvasHandler.fixView();
}
function resizeCanvasToWrapper(canvas, wrapper) {
    const wfactor = 0.98, hfactor = 0.83;
    const cssW = wrapper.clientWidth * wfactor;
    const cssH = wrapper.clientHeight * hfactor;
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cssW * dpr * wfactor;
    canvas.height = cssH * dpr * hfactor;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
}
function showCanvasDimensions(canvas) {
    if (canvas instanceof HTMLCanvasElement) {
        console.log("------ CANVAS DIMENSIONS ------");
        console.log("width:", canvas.width);
        console.log("clientWidth:", canvas.clientWidth);
        console.log("height:", canvas.height);
        console.log("clientHeight:", canvas.clientHeight);
    }
    else {
        console.log("----- WRAPPER DIMENSIONS -----");
        console.log("clientWidth:", canvas.clientWidth);
        console.log("clientHeight:", canvas.clientHeight);
    }
}
