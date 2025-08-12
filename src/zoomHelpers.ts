
export class Coords
{
    public x: number;
    public y: number;

    constructor(x: number = 0, y: number = 0) { this.x = x; this.y = y; }

    update( {x,y}: {x: number, y: number }) {this.x = x; this.y = y; }
}

export class Scaler
{
    public scale: number = 1.0;
    public translateX: number = 0;
    public translateY: number = 0;
    private canvas: HTMLCanvasElement;
    private readonly _ZOOM_FACTOR: number = 1.1;
    private readonly _MIN_SCALE: number = 0.1;
    private readonly _MAX_SCALE: number = 10.0;
    private readonly _PAN_STEP: number = 20;

    get ZOOM_FACTOR() { return this._ZOOM_FACTOR; }
    get MIN_SCALE() { return this._MIN_SCALE; }
    get MAX_SCALE() { return this._MAX_SCALE; }
    get PAN_STEP() { return this._PAN_STEP; }

    constructor(canvas: HTMLCanvasElement) { this.canvas = canvas; }

    // Converts screen/client coordinates (from mouse event) to world coordinates.
    // This is the inverse of the transformations applied in drawContent for the drawing logic.
    public screenToWorld(clientX: number, clientY: number) {
        const canvasRect = this.canvas.getBoundingClientRect();
        // const dpr = window.devicePixelRatio || 1; // Not needed here, as it cancels out in the formula

        // 1. Get mouse position relative to the canvas element (in CSS pixels)
        const canvasX_css = clientX - canvasRect.left;
        const canvasY_css = clientY - canvasRect.top;

        // 2. Invert the combined transformations (Translate then Zoom, then DPR scaling for output)
        // The simplified formula based on the derivation above is:
        const worldX = (canvasX_css - this.translateX) / this.scale;
        const worldY = (canvasY_css - this.translateY) / this.scale;

        return { x: worldX, y: worldY };
    }

    public worldToCanvas(worldX: number, worldY: number): { x: number, y: number } {
        // const dpr = window.devicePixelRatio || 1; // Not needed as it cancels out, and translateX/Y are in CSS pixels

        // Apply zoom (scale), then pan (translate)
        const canvasX_css = (worldX * this.scale) + this.translateX;
        const canvasY_css = (worldY * this.scale) + this.translateY;

        return { x: canvasX_css, y: canvasY_css };
    }
}
