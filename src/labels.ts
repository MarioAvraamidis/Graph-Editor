export class Label
{
    private _content: string;
    private _showLabel: boolean = false;
    private _offsetX: number = 0;
    private _offsetY: number = 20;  // remember that positive is down in canvas
    private _color: string = "#000";
    private _fontSize: number = 14;

    constructor(objectId: string)
    {
        this._content = objectId;
    }

    get content() { return this._content; }
    get showLabel() {return this._showLabel; }
    get offsetX() { return this._offsetX; }
    get offsetY() { return this._offsetY; }
    get color() { return this._color; }
    get fontSize() { return this._fontSize; }

    set content(content: string) { this._content = content; }
    set showLabel(show: boolean) { this._showLabel = show; }
    set offsetX(offsetX: number) { this._offsetX = offsetX; }
    set offsetY(offsetY: number) { this._offsetY = offsetY; }
    set color(color: string) { this._color = color;}
    set fontSize(fontSize: number) { this._fontSize = fontSize; }

    // copy the characteristics of the given label to this label
    cloneCharacteristics(lab: Label | any)
    {
        // labeling
        // this.labelContent = p.labelContent;
        this.showLabel = lab.showLabel;
        this.offsetX = lab.offsetX;
        this.offsetY = lab.offsetY;
        this.color = lab.color;
        this.fontSize = lab.fontSize;
    }
}