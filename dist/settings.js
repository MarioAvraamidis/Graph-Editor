export class SettingsOptions {
    constructor() {
        this.crossings_colors = { self: "#A020F0" /*purple*/, neighbor: "#FF0000" /*red*/, multiple: "#FFA500" /*orange*/, legal: "#008000" /*green*/ };
        this.crossing_edges_colors = { crossing: "#2fee3c", nonCrossing: "#f0f42a" };
        this.cliqueNewEdgesColor = '#0000ff';
        this.defaultLabelFontSize = 18;
        this.vertexChars = { color: "#000000", size: 7, shape: "circle" };
        this.edgeChars = { color: "#898989", thickness: 2, dashed: false };
        this.bendChars = { size: 5, color: "#0000FF" };
        this.showInfoBoxes = true;
    }
    edit_crossings_colors(input) {
        this.crossings_colors.self = input[0].value;
        this.crossings_colors.neighbor = input[1].value;
        this.crossings_colors.multiple = input[2].value;
        this.crossings_colors.legal = input[3].value;
        // return this.crossings_colors;
    }
    edit_crossing_edges_colors(input) {
        this.crossing_edges_colors.crossing = input[0].value;
        this.crossing_edges_colors.nonCrossing = input[1].value;
        // return this.crossing_edges_colors;
    }
    edit_cliqueNewEdgesColor(color) { this.cliqueNewEdgesColor = color; }
    edit_defaultLabelFontSize(size) { this.defaultLabelFontSize = size; }
}
