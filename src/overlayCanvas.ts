export function setOverlayCanvas()
{
    const overlayCanvas = document.getElementById("overlayCanvas") as HTMLCanvasElement;
    const wrapper = document.querySelector(".overlay-wrapper") as HTMLDivElement;
    const overlayCtx = overlayCanvas.getContext("2d")!;

    new ResizeObserver(() => {

        const newWidth = wrapper.clientWidth;
        const newHeight = wrapper.clientHeight;

        // 🔑 prevent infinite loop by only updating when values changed
        if (overlayCanvas.width !== newWidth || overlayCanvas.height !== newHeight) {
            overlayCanvas.width = newWidth;
            overlayCanvas.height = newHeight;

            // redraw overlay
            overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        }

    }).observe(wrapper);
}