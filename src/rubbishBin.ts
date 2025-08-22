import { Scaler } from "./zoomHelpers";

export class RubbishBin
{
    private _radius: number;
    private _pos: {x: number, y: number};

    constructor(rad: number, pos: {x: number, y: number})
    {
        this._radius = rad;
        this._pos = pos;
    }

    get radius() { return this._radius}
    get pos() { return this._pos}

    public updatePos(canvas: HTMLCanvasElement, scaler: Scaler)
    {
        const rect = canvas.getBoundingClientRect();
        this._pos = scaler.screenToWorld(rect.right-this.radius,rect.top+this.radius);
    }

    // set radius(rad: number) { this._radius = rad; }
    // set pos(pos: {x: number, y: number}) { this._pos = pos }
}