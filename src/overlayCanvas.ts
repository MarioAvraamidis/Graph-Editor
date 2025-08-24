import { CanvasHandler } from "./canvasHandler.js";
import { Graph } from "./graph.js";
import { SettingsOptions } from "./settings.js";
import { SimpleDrawer } from "./simpleDrawer.js";
import { Scaler } from "./zoomHelpers.js";

export function setOverlayCanvas(graph: Graph, settingsOptions: SettingsOptions)
{
    const overlayCanvas = document.getElementById("overlayCanvas") as HTMLCanvasElement;
    const wrapper = document.querySelector(".overlay-wrapper") as HTMLDivElement;
    wrapper.style.display = 'inline-block'; // make the wrapper visible
    const overlayCtx = overlayCanvas.getContext("2d")!;
    const scaler = new Scaler(overlayCanvas);
    const simpleDrawer = new SimpleDrawer(scaler,settingsOptions);

    // btn
    const overlayGraph: Graph = new Graph();
    const canvasHandler: CanvasHandler = new CanvasHandler(overlayCanvas,simpleDrawer,overlayGraph);
    // overlayGraph.replace(graph);
    document.getElementById("overlayBtn")?.addEventListener('click', () => { 
        overlayGraph.replace(graph);
        canvasHandler.fixView();
        // console.log("overlay vertices:",overlayGraph.vertices.length);
    })


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