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
    const overlayGraph: Graph = new Graph();
    const canvasHandler: CanvasHandler = new CanvasHandler(overlayCanvas,simpleDrawer,overlayGraph);

    // btn
    // overlayGraph.replace(graph);
    document.getElementById("overlayBtn")?.addEventListener('click', () => { 
        overlayGraph.replace(graph.clone());
        resizeOverlayCanvas(overlayCanvas);
        canvasHandler.fixView();
        // console.log("overlay vertices:",overlayGraph.vertices.length);
    })


    new ResizeObserver(() => {

        const newWidth = wrapper.clientWidth;
        const newHeight = wrapper.clientHeight;

        // 🔑 prevent infinite loop by only updating when values changed
        if (overlayCanvas.width !== newWidth || overlayCanvas.height !== newHeight) {
            // overlayCanvas.width = newWidth;
            // overlayCanvas.height = newHeight;

            // console.log("overlayCanvas width:", overlayCanvas.width);
            // console.log("overlayCanvas height:", overlayCanvas.height);
            // console.log("wrapper clientWidth:", wrapper.clientWidth);
            // console.log("wrapper clientHeight:", wrapper.clientHeight);

            // redraw overlay
            // overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            // overlayCtx.fillStyle = "white";
            // overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            // canvasHandler.redraw();
            resizeOverlayCanvas(overlayCanvas);
            canvasHandler.fixView();
        }

    }).observe(wrapper);
}

function resizeOverlayCanvas(canvas: HTMLCanvasElement) {
  const scale = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * scale;
  canvas.height = canvas.clientHeight * scale;
  const ctx = canvas.getContext("2d");
  if (ctx)
    ctx.setTransform(scale, 0, 0, scale, 0, 0); // reset transform for scaling
}