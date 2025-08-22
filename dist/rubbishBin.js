export class RubbishBin {
    constructor(rad, pos) {
        this._radius = rad;
        this._pos = pos;
    }
    get radius() { return this._radius; }
    get pos() { return this._pos; }
    updatePos(canvas, scaler) {
        const rect = canvas.getBoundingClientRect();
        this._pos = scaler.screenToWorld(rect.right - this.radius, rect.top + this.radius);
    }
}
