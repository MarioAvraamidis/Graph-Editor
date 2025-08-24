import { Graph, Vertex, Edge, Bend, Point} from "graph.js";
import { SettingsOptions } from "./settings.js";
import { Scaler } from "./zoomHelpers.js";

export class SimpleDrawer
{
    private scaler: Scaler;
    private settingsOptions: SettingsOptions;

    constructor(scaler: Scaler, settingsOptions: SettingsOptions) 
    { 
        this.scaler = scaler; 
        this.settingsOptions = settingsOptions;
    }

    public getScaler()
    {
        return this.scaler;
    }

    public renderGraph(graph: Graph, canvas: HTMLCanvasElement)
    {
        this.drawGraph(canvas,graph,true,this.scaler.scale);
    }

    /** Draw the given graph on the given canvas with the given scale.
     * If labels===true, also draw labels.
     * For crossing colors, use settings
     * 
     * @param canvas 
     * @param graph 
     * @param labels 
     * @param scale 
     * @param settingsOptions 
     */
    public drawGraph(canvas: HTMLCanvasElement, graph: Graph, labels: boolean = true, scale: number) {

        const ctx = canvas.getContext("2d");
        if (!ctx)
            throw new Error("Could not get canvas rendering context");
        // Draw edges first
        graph.edges.forEach(edge => { this.drawEdge(ctx,edge,labels,scale )});

        // Draw vertices
        graph.vertices.forEach(vertex => this.drawVertex(ctx,vertex,labels,scale) );

        // Draw crossings
        const output = document.getElementById("output");
        if (output) {
            const selfChecked = (output.querySelector('#show-self') as HTMLInputElement)?.checked;
            const neighborChecked = (output.querySelector('#show-neighbor') as HTMLInputElement)?.checked;
            const multipleChecked = (output.querySelector('#show-multiple') as HTMLInputElement)?.checked;
            const legalChecked = (output.querySelector('#show-legal') as HTMLInputElement)?.checked;
            this.drawCrossings(graph,ctx,selfChecked,neighborChecked,multipleChecked,legalChecked,labels,scale);
        }
    }

    private drawEdge(ctx: CanvasRenderingContext2D, edge: Edge, labels: boolean, scale: number)
    {
        const v1 = edge.points[0];
        const v2 = edge.points[1];
        if (v1 && v2) {
            ctx.beginPath();
            ctx.moveTo(v1.x, v1.y);
            if (edge.dashed)
                ctx.setLineDash([5/scale, 5/scale]); // Dash pattern: [dashLength, gapLength]
            ctx.lineWidth = edge.thickness/scale;
            const bends = edge.bends;
            // draw the edge passing through bends
            for (let i=0;i<bends.length;i++)
                ctx.lineTo(bends[i].x,bends[i].y);
            ctx.lineTo(v2.x, v2.y);
            ctx.strokeStyle = edge.color;
            ctx.stroke();
            //reset
            ctx.setLineDash([]);
            ctx.lineWidth = edge.thickness/scale;
            // draw bends
            for (const bend of edge.bends)
                this.drawBend(ctx,bend,labels,scale);
            if (labels)
                this.showEdgeLabel(ctx,edge,scale);
        }
    }

    // function for drawing a vertex
    private drawVertex(ctx: CanvasRenderingContext2D, v: Vertex, labels: boolean = true, scale: number)
    {
        this.drawShape(ctx,v.x,v.y,v.shape,v.size,v.color,true,scale);   // scaling in drawShape function

        // Draw label
        if (labels)
            this.showPointLabel(ctx,v,scale);
    }

    private drawShape(ctx: CanvasRenderingContext2D, x: number, y: number, shape: string, size: number, color: string, fill: boolean = true, scale: number)
    {
        ctx.beginPath();
        ctx.lineWidth = 2/scale;
        size = size/scale;
        if (shape === "square")
            ctx. rect(x-size, y-size, size*2, size*2);
        else if (shape === "triangle")
        {
            ctx.moveTo(x,y-size);
            ctx.lineTo(x-size,y+size);
            ctx.lineTo(x+size, y+size);
            ctx.closePath();
        }
        else if (shape === "rhombus")
        {
            ctx.moveTo(x, y - size); // top
            ctx.lineTo(x + size, y); // right
            ctx.lineTo(x, y + size); // bottom
            ctx.lineTo(x - size, y); // left
            ctx.closePath();
        }
        else if (shape === "circle")
            ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        if (fill)
            ctx.fill();
        ctx.stroke();
    }

    // function for drawing a bend at position x,y
    private drawBend(ctx: CanvasRenderingContext2D, bend: Bend, labels: boolean, scale: number)
    {
        ctx.beginPath();
        ctx.lineWidth = 1/scale;
        // show bigger bend when mouse near it
        ctx.arc(bend.x, bend.y, bend.size/scale , 0, 2 * Math.PI); // small green circle
        ctx.fillStyle = bend.color;
        ctx.fill();
        ctx.strokeStyle = "black";
        ctx.stroke();
        ctx.lineWidth = 2/scale;

        // label
        if (labels)
            this.showPointLabel(ctx,bend,scale);
    }

    private drawCrossings(graph: Graph, ctx: CanvasRenderingContext2D, self: boolean, neighbor: boolean, multiple: boolean, legal: boolean, labels: boolean, scale: number)
    {
        for (const cross of graph.crossings)
        {
            // different colors for different types of crossings
            if (cross.selfCrossing && self)                             // self-crossings
                this.drawCrossing(ctx, cross, this.settingsOptions.crossings_colors.self, labels, scale);
            else if (!cross.legal && !cross.selfCrossing && neighbor)   // neighbor-edge crossings
                this.drawCrossing(ctx, cross, this.settingsOptions.crossings_colors.neighbor, labels, scale);
            else if (cross.legal && cross.more_than_once && multiple)   // multiple crossings
                this.drawCrossing(ctx, cross, this.settingsOptions.crossings_colors.multiple, labels, scale);
            else if (cross.legal && !cross.more_than_once && legal)     // legal crossings
                this.drawCrossing(ctx, cross, this.settingsOptions.crossings_colors.legal, labels, scale);
        }
    }

    private drawCrossing(ctx: CanvasRenderingContext2D, cros: Point, color: string, labels: boolean, scale: number)
    {
        ctx.beginPath();
        ctx.lineWidth = 2/scale;
        ctx.arc(cros.x, cros.y, cros.size/scale, 0 , 2*Math.PI);
        ctx.strokeStyle = color;
        ctx.stroke();
        // label
        if (labels)
            this.showPointLabel(ctx,cros,scale);
    }

    // display the label of the given edge
    private showEdgeLabel(ctx: CanvasRenderingContext2D, e: Edge, scale: number)
    {
        if (!e.label.showLabel)
            return;
        ctx.fillStyle = e.label.color;
        //if (hoveredLabelEdge === e)
            //ctx.fillStyle = "red";
        const adjustedFontSize = e.label.fontSize / scale;
        ctx.font = `${adjustedFontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        e.updateLabelPos();
        // we want the difference between the vertex and the label to remain the same regardless of the zoom scale, so we devide offsets by scale
            ctx.fillText(e.label.content, e.labelPosX + e.label.offsetX/scale , e.labelPosY - e.label.offsetY/scale);   // positive is down in canvas
        ctx.fillStyle = "#000";
    }

    // display the label of the given point
    private showPointLabel(ctx: CanvasRenderingContext2D, p: Point, scale: number)
    {
        if (!p.label.showLabel)
            return;
        ctx.fillStyle = p.label.color;
        const adjustedFontSize = p.label.fontSize / scale;
        ctx.font = `${adjustedFontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        // we want the difference between the vertex and the label to remain the same regardless of the zoom scale, so we devide offsets by scale
            ctx.fillText(p.label.content, p.x + p.label.offsetX/scale , p.y - this.labelOffsetY(p)/scale);   // positive is down in canvas
        ctx.fillStyle = "#000";
    }

    private labelOffsetY(point: Point)
    {
        return (point.size + point.label.offsetY/*  + point.label.fontSize*/ );
    }
}