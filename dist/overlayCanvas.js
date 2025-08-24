import { CanvasHandler } from "./canvasHandler.js";
import { Graph } from "./graph.js";
import { SimpleDrawer } from "./simpleDrawer.js";
import { Scaler } from "./zoomHelpers.js";
export function setOverlayCanvas(graph, settingsOptions) {
    var _a;
    const overlayCanvas = document.getElementById("overlayCanvas");
    const wrapper = document.querySelector(".overlay-wrapper");
    wrapper.style.display = 'inline-block'; // make the wrapper visible
    const overlayCtx = overlayCanvas.getContext("2d");
    const scaler = new Scaler(overlayCanvas);
    const simpleDrawer = new SimpleDrawer(scaler, settingsOptions);
    // btn
    const overlayGraph = new Graph();
    const canvasHandler = new CanvasHandler(overlayCanvas, simpleDrawer, overlayGraph);
    // overlayGraph.replace(graph);
    (_a = document.getElementById("overlayBtn")) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
        overlayGraph.replace(graph);
        canvasHandler.fixView();
        // console.log("overlay vertices:",overlayGraph.vertices.length);
    });
    new ResizeObserver(() => {
        const newWidth = wrapper.clientWidth;
        const newHeight = wrapper.clientHeight;
        // 🔑 prevent infinite loop by only updating when values changed
        if (overlayCanvas.width !== newWidth || overlayCanvas.height !== newHeight) {
            overlayCanvas.width = newWidth;
            overlayCanvas.height = newHeight;
            // console.log("overlayCanvas width:", overlayCanvas.width);
            // console.log("overlayCanvas height:", overlayCanvas.height);
            // console.log("overlayCanvas clientWidth:", overlayCanvas.clientWidth);
            // console.log("overlayCanvas clientHeight:", overlayCanvas.clientHeight);
            // redraw overlay
            // overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            // overlayCtx.fillStyle = "white";
            // overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            // canvasHandler.redraw();
            canvasHandler.fixView();
        }
    }).observe(wrapper);
}
