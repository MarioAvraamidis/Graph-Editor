import { CanvasHandler } from "./canvasHandler.js";
import { Graph } from "./graph.js";
import { Selector } from "./selector.js";
import { SettingsOptions } from "./settings.js";
import { SimpleDrawer } from "./simpleDrawer.js";
import { Scaler } from "./zoomHelpers.js";

export function setOverlayCanvas(graph: Graph, settingsOptions: SettingsOptions, mainCanvasHandler: CanvasHandler, selector: Selector)
{
    const overlayCanvas = document.getElementById("overlayCanvas") as HTMLCanvasElement;
    const wrapper = document.querySelector(".overlay-wrapper") as HTMLDivElement;
    const grow = document.getElementById("grow-secondary-canvas") as HTMLInputElement
    wrapper.style.display = 'inline-block'; // make the wrapper visible
    const scaler = new Scaler(overlayCanvas);
    const simpleDrawer = new SimpleDrawer(scaler,settingsOptions);
    const overlayGraph: Graph = new Graph();
    const canvasHandler: CanvasHandler = new CanvasHandler(overlayCanvas,simpleDrawer,overlayGraph);

    // btns
    document.getElementById("overlayUpdateBtn")?.addEventListener('click', () => { 
        overlayGraph.replace(graph.clone());
        canvasHandler.fixView();
    })
    document.getElementById("overlaySwitchBtn")?.addEventListener('click', () => {
        const initial = overlayGraph.clone();
        overlayGraph.replace(graph.clone());
        graph.replace(initial);
        selector.setNothingSelected();
        canvasHandler.fixView();
        mainCanvasHandler.fixView();
    })

    overlayCanvas.addEventListener("mouseenter", () => {
        if (!grow.checked)
            return;
        wrapper.classList.add("grow");
        resizeCanvasToWrapper(overlayCanvas,wrapper);
        setOverlayResolution(overlayCanvas, canvasHandler); // redraw at new CSS size
    });

    overlayCanvas.addEventListener("mouseleave", () => {
        if (!grow.checked)
            return;
        wrapper.classList.remove("grow");
        resizeCanvasToWrapper(overlayCanvas,wrapper);
        setOverlayResolution(overlayCanvas, canvasHandler); // redraw at normal CSS size
    });
}

// Modify setOverlayResolution to handle initial DPR scaling
function setOverlayResolution(canvas: HTMLCanvasElement, canvasHandler: CanvasHandler) {
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);

    // Use CSS for the actual dimensions
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";

    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // Initial draw
    canvasHandler.fixView();
}

function resizeCanvasToWrapper(canvas: HTMLCanvasElement, wrapper: HTMLElement) {
    const wfactor: number = 0.98, hfactor: number = 0.83;
    const cssW = wrapper.clientWidth*wfactor;
    const cssH = wrapper.clientHeight*hfactor;

    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = cssW * dpr * wfactor;
    canvas.height = cssH * dpr * hfactor;

    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
}

function showCanvasDimensions(canvas: HTMLElement | HTMLElement)
{
    if (canvas instanceof HTMLCanvasElement)
    {
        console.log("------ CANVAS DIMENSIONS ------")
        console.log("width:",canvas.width);
        console.log("clientWidth:",canvas.clientWidth);
        console.log("height:",canvas.height);
        console.log("clientHeight:",canvas.clientHeight);
    }
    else
    {
        console.log("----- WRAPPER DIMENSIONS -----");
        console.log("clientWidth:",canvas.clientWidth);
        console.log("clientHeight:",canvas.clientHeight);
    }
}