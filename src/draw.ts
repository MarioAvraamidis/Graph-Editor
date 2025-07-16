export class SettingsOptions
{
    // default colors for crossings
    public crossings_colors: any //= { self: "#A020F0" /*purple*/, neighbor: "#FF0000"/*red*/, multiple: "#FFA500"/*orange*/, legal: "#008000"/*green*/ };
    // default colors for crossing edges
    public crossing_edges_colors: any /* = {crossing: "#2fee3c", nonCrossing: "#f0f42a"} */
    // default color for new edges when creating clique
    public cliqueNewEdgesColor: string;
    // default label font size
    public defaultLabelFontSize: number;

    constructor()
    {
        this.crossings_colors = { self: "#A020F0" /*purple*/, neighbor: "#FF0000"/*red*/, multiple: "#FFA500"/*orange*/, legal: "#008000"/*green*/ };
        this.crossing_edges_colors = {crossing: "#2fee3c", nonCrossing: "#f0f42a"};
        this.cliqueNewEdgesColor = '#0000ff';
        this.defaultLabelFontSize = 18;
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

/*export function get_crossings_colors()
{
    return crossings_colors;
}

export function edit_crossings_colors(input: any)
{
    crossings_colors.self = self;
    crossings_colors.neighbor = neighbor;
    crossings_colors.multiple = multiple;
    crossings_colors.legal = legal;
    crossings_colors.self = input[0].value;
    crossings_colors.neighbor = input[1].value;
    crossings_colors.multiple = input[2].value;
    crossings_colors.legal = input[3].value;
    return crossings_colors;
}

export function get_crossing_edges_colors() { return crossing_edges_colors; }

export function set_crossing_edges_colors(crossing: string, nonCrossing: string)
{
    crossing_edges_colors.crossing = crossing;
    crossing_edges_colors.nonCrossing = nonCrossing;
}*/