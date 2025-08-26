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

    /* wrapper.addEventListener('mouseenter', () => {
        setOverlayResolution(overlayCanvas, overlayCanvas.clientWidth, overlayCanvas.clientHeight, 3);
    });

    wrapper.addEventListener('mouseleave', () => {
        setOverlayResolution(overlayCanvas, overlayCanvas.clientWidth, overlayCanvas.clientHeight, 1);
    });*/

    // initOverlayCanvasHiDPI(overlayCanvas,overlayCanvas.clientWidth,overlayCanvas.clientHeight);


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

function setOverlayResolution(canvas: HTMLCanvasElement, cssW: number, cssH: number, factor: number) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.floor(cssW * factor * dpr);
  canvas.height = Math.floor(cssH * factor * dpr);
  canvas.style.width  = cssW + 'px';
  canvas.style.height = cssH + 'px';
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(factor * dpr, 0, 0, factor * dpr, 0, 0);
  // redraw overlay
  // drawOverlay(ctx);
}

function resizeOverlayCanvas(canvas: HTMLCanvasElement) {
  const scale = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * scale;
  canvas.height = canvas.clientHeight * scale;
  const ctx = canvas.getContext("2d");
  if (ctx)
    ctx.setTransform(scale, 0, 0, scale, 0, 0); // reset transform for scaling
}

// Call this once after you know the CSS size (300x200 here).
function initOverlayCanvasHiDPI(canvas: HTMLCanvasElement, cssW = 300, cssH = 200, superScale = 3) {
  const dpr = window.devicePixelRatio || 1;
  // Backing store is 3× (or whatever factor you want)
  canvas.width  = Math.floor(cssW * superScale * dpr);
  canvas.height = Math.floor(cssH * superScale * dpr);

  // Keep CSS size the small one
  canvas.style.width  = cssW + 'px';
  canvas.style.height = cssH + 'px';

  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(superScale * dpr, 0, 0, superScale * dpr, 0, 0);

  // draw your overlay content here at logical units
  // e.g., drawOverlay(ctx);
}