/**
 * A class for storing coordinates
 */
export class Coords {
    get x() { return this._x; }
    get y() { return this._y; }
    constructor(x = 0, y = 0) { this._x = x; this._y = y; }
    update({ x, y }) { this._x = x; this._y = y; }
}
/**
 * A class which handles zoom settings
 */
export class Scaler {
    get ZOOM_FACTOR() { return this._ZOOM_FACTOR; }
    get MIN_SCALE() { return this._MIN_SCALE; }
    get MAX_SCALE() { return this._MAX_SCALE; }
    get PAN_STEP() { return this._PAN_STEP; }
    constructor(canvas) {
        this.scale = 1.0;
        this.translateX = 0;
        this.translateY = 0;
        this._ZOOM_FACTOR = 1.1;
        this._MIN_SCALE = 0.1;
        this._MAX_SCALE = 10.0;
        this._PAN_STEP = 20;
        this.canvas = canvas;
    }
    // Converts screen/client coordinates (from mouse event) to world coordinates.
    // This is the inverse of the transformations applied in drawContent for the drawing logic.
    screenToWorld(clientX, clientY) {
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
    worldToCanvas(worldX, worldY) {
        // const dpr = window.devicePixelRatio || 1; // Not needed as it cancels out, and translateX/Y are in CSS pixels
        // Apply zoom (scale), then pan (translate)
        const canvasX_css = (worldX * this.scale) + this.translateX;
        const canvasY_css = (worldY * this.scale) + this.translateY;
        return { x: canvasX_css, y: canvasY_css };
    }
}
