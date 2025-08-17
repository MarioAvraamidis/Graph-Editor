export class SettingsOptions
{
    // colors for crossings
    public crossings_colors: {self: string, neighbor: string, multiple: string, legal: string};
    // colors for crossing edges
    public crossing_edges_colors:  {crossing: string, nonCrossing: string}  
    // color for new edges when creating clique
    public cliqueNewEdgesColor: string;
    // label font size
    public defaultLabelFontSize: number;
    // palette settings
    public vertexChars: { color: string, size: number, shape: string }      // palette settings for Vertices
    public edgeChars: {color: string, thickness: number, dashed: boolean}   // palette settings for Edges
    public bendChars: {size: number, color: string}                         // palette settings for Bends

    constructor()
    {
        this.crossings_colors = { self: "#A020F0" /*purple*/, neighbor: "#FF0000"/*red*/, multiple: "#FFA500"/*orange*/, legal: "#008000"/*green*/ };
        this.crossing_edges_colors = {crossing: "#2fee3c", nonCrossing: "#f0f42a"};
        this.cliqueNewEdgesColor = '#0000ff';
        this.defaultLabelFontSize = 18;
        this.vertexChars = { color: "#000000", size: 7, shape: "circle" }
        this.edgeChars = {color: "#898989", thickness: 2, dashed: false}
        this.bendChars = {size: 5, color: "#0000FF"}
    }

    public edit_crossings_colors(input: any)
    {
        this.crossings_colors.self = input[0].value;
        this.crossings_colors.neighbor = input[1].value;
        this.crossings_colors.multiple = input[2].value;
        this.crossings_colors.legal = input[3].value;
        // return this.crossings_colors;
    }

    public edit_crossing_edges_colors(input: any)
    {
        this.crossing_edges_colors.crossing = input[0].value;
        this.crossing_edges_colors.nonCrossing = input[1].value;
        // return this.crossing_edges_colors;
    }

    public edit_cliqueNewEdgesColor(color: string) { this.cliqueNewEdgesColor = color; }

    public edit_defaultLabelFontSize(size: number) { this.defaultLabelFontSize = size; }
}