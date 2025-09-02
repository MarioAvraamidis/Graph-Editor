import { CanvasHandler } from "./canvasHandler.js";
import { Graph } from "./graph.js";
import { SimpleDrawer } from "./simpleDrawer.js";
import { Scaler } from "./zoomHelpers.js";
const overlayCanvas = document.getElementById("overlayCanvas");
export function setOverlayCanvas(graph, settingsOptions) {
    var _a;
    const wrapper = document.querySelector(".overlay-wrapper");
    wrapper.style.display = 'inline-block'; // make the wrapper visible
    const overlayCtx = overlayCanvas.getContext("2d");
    const scaler = new Scaler(overlayCanvas);
    const simpleDrawer = new SimpleDrawer(scaler, settingsOptions);
    const overlayGraph = new Graph();
    const canvasHandler = new CanvasHandler(overlayCanvas, simpleDrawer, overlayGraph);
    // Initial setup: ensure the canvas resolution matches its initial size
    setOverlayResolution(overlayCanvas, canvasHandler /*, 1 */);
    // initOverlayCanvasHiDPI(canvasHandler);
    // btn
    // overlayGraph.replace(graph);
    (_a = document.getElementById("overlayBtn")) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
        overlayGraph.replace(graph.clone());
        // resizeOverlayCanvas(overlayCanvas);
        // initOverlayCanvasHiDPI(overlayCanvas,canvasHandler,overlayCanvas.clientWidth,overlayCanvas.clientHeight);
        canvasHandler.fixView();
        // console.log("overlay vertices:",overlayGraph.vertices.length);
    });
    /*wrapper.addEventListener('mouseenter', () => {
        setOverlayResolution(overlayCanvas, canvasHandler, 3);
    });

    wrapper.addEventListener('mouseleave', () => {
        setOverlayResolution(overlayCanvas, canvasHandler, 1);
    });*/
    // initOverlayCanvasHiDPI(overlayCanvas,canvasHandler,overlayCanvas.clientWidth,overlayCanvas.clientHeight);
    /* new ResizeObserver(() => {

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

    }).observe(wrapper);*/
}
// Modify setOverlayResolution to handle initial DPR scaling
function setOverlayResolution(canvas, canvasHandler) {
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    // Use CSS for the actual dimensions
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    // Initial draw
    canvasHandler.fixView();
}
/* function setOverlayResolution(canvas: HTMLCanvasElement, canvasHandler: CanvasHandler, factor: number) {
  const cssW = canvas.clientWidth;   // rendered width in CSS px
  const cssH = canvas.clientHeight;  // rendered height in CSS px
  const dpr = window.devicePixelRatio || 1;

  // Increase backing store
  canvas.width  = Math.floor(cssW * factor * dpr);
  canvas.height = Math.floor(cssH * factor * dpr);

  // Keep CSS size unchanged
  canvas.style.width  = cssW + "px";
  canvas.style.height = cssH + "px";

  const ctx = canvas.getContext("2d")!;
  
   // Reset transform
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  
  // Scale drawing space (so drawings map correctly to CSS pixels)
  ctx.scale(factor * dpr, factor * dpr);

  // now re-draw your overlay content
  canvasHandler.fixView()
} /* */
function resizeOverlayCanvas(canvas) {
    const scale = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * scale;
    canvas.height = canvas.clientHeight * scale;
    const ctx = canvas.getContext("2d");
    if (ctx)
        ctx.setTransform(scale, 0, 0, scale, 0, 0); // reset transform for scaling
}
// Call this once after you know the CSS size (300x200 here).
function initOverlayCanvasHiDPI(canvasHandler, superScale = 3) {
    const cssW = overlayCanvas.clientWidth; // rendered width in CSS px
    const cssH = overlayCanvas.clientHeight; // rendered height in CSS px
    const dpr = window.devicePixelRatio || 1;
    // Backing store is 3× (or whatever factor you want)
    overlayCanvas.width = Math.floor(cssW * superScale * dpr);
    overlayCanvas.height = Math.floor(cssH * superScale * dpr);
    // canvas.width = cssW * dpr;
    // canvas.height = cssH * dpr;
    // Keep CSS size the small one
    overlayCanvas.style.width = cssW + 'px';
    overlayCanvas.style.height = cssH + 'px';
    const ctx = overlayCanvas.getContext('2d');
    //ctx.setTransform(superScale * dpr, 0, 0, superScale * dpr, 0, 0);
    ctx.setTransform(superScale * dpr, 0, 0, superScale * dpr, 0, 0);
    console.log("--- initOverlayCanvasHiDPI ---");
    console.log("CSS Dimensions:", cssW, "x", cssH);
    console.log("DPR:", dpr);
    console.log("SuperScale:", superScale);
    console.log("Calculated Canvas Width:", overlayCanvas.width);
    console.log("Calculated Canvas Height:", overlayCanvas.height);
    console.log("----------------------------");
    // draw your overlay content here at logical units
    canvasHandler.fixView();
}
