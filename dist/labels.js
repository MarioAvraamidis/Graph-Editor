export class Label {
    constructor(objectId) {
        this._showLabel = false;
        this._offsetX = 0;
        this._offsetY = 20; // remember that positive is down in canvas
        this._color = "#000";
        this._fontSize = 14;
        this._content = objectId;
    }
    get content() { return this._content; }
    get showLabel() { return this._showLabel; }
    get offsetX() { return this._offsetX; }
    get offsetY() { return this._offsetY; }
    get color() { return this._color; }
    get fontSize() { return this._fontSize; }
    set content(content) { this._content = content; }
    set showLabel(show) { this._showLabel = show; }
    set offsetX(offsetX) { this._offsetX = offsetX; }
    set offsetY(offsetY) { this._offsetY = offsetY; }
    set color(color) { this._color = color; }
    set fontSize(fontSize) { this._fontSize = fontSize; }
    // copy the characteristics of the given label to this label
    cloneCharacteristics(lab) {
        // labeling
        // this.labelContent = p.labelContent;
        this.showLabel = lab.showLabel;
        this.offsetX = lab.offsetX;
        this.offsetY = lab.offsetY;
        this.color = lab.color;
        this.fontSize = lab.fontSize;
    }
}
