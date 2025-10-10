// import { MouseHandler } from "./mouse.js";
import { InfoBoxHandler } from "./infoBoxes.js";
export class Drawer {
    getScaler() { return this.scaler; }
    constructor(/* paletteHandler: PaletteHandler,*/ selector, settingsOptions, hover, worldCoords, scaler, bendedEdgeCreator, rubbishBin) {
        this.output = document.getElementById("output");
        // this.paletteHandler = paletteHandler;
        this.selector = selector;
        this.settingsOptions = settingsOptions;
        this.hover = hover;
        this.worldCoords = worldCoords;
        this.rubbishBin = rubbishBin;
        // this.mouseHandler = mouseHandler;
        this.scaler = scaler;
        this.bendedEdgeCreator = bendedEdgeCreator;
        // rubbish bin radius
        // this.rubbishBinRadius = 50;
        // infoBoxes
        this.infoBoxHandler = new InfoBoxHandler(/*this.selector,*/ this.hover, this.scaler, this.bendedEdgeCreator, this.worldCoords);
    }
    renderGraph(graph, canvas) {
        if (this.output) {
            // const crossings_categories = graph.crossingsCategories();
            const report = graph.report();
            const totalCrossingsSpan = document.getElementById("total-crossings");
            const selfCrossingsSpan = document.getElementById("self-crossings");
            const neighborCrossingsSpan = document.getElementById("neighbor-crossings");
            const multipleCrossingsSpan = document.getElementById("multiple-crossings");
            const legalCrossingsSpan = document.getElementById("legal-crossings");
            const thrackleNumberSpan = document.getElementById("thrackle-number");
            const curveComplexitySpan = document.getElementById("curve-complexity");
            if (totalCrossingsSpan)
                totalCrossingsSpan.textContent = `${report.total}`; //  `${graph.crossings.length}`;
            if (selfCrossingsSpan)
                selfCrossingsSpan.textContent = `${report.self}`; // `${crossings_categories.self}`;
            if (neighborCrossingsSpan)
                neighborCrossingsSpan.textContent = `${report.neighbor}`; // `${crossings_categories.neighbor}`;
            if (multipleCrossingsSpan)
                multipleCrossingsSpan.textContent = `${report.multiple}`; // `${crossings_categories.multiple}`;
            if (legalCrossingsSpan)
                legalCrossingsSpan.textContent = `${report.legal}`; // `${crossings_categories.legal}`;
            if (thrackleNumberSpan)
                thrackleNumberSpan.textContent = `${report.thrackleNum}`; // `${graph.thrackleNumber()}`;
            if (curveComplexitySpan)
                curveComplexitySpan.textContent = `${report.cc}`; // `${graph.curve_complexity}`;
            // Apply label colors based on data-color-key for crossings
            const labels = this.output.querySelectorAll('label[data-color-key]');
            labels.forEach(label => {
                const colorKey = label.getAttribute('data-color-key');
                if (colorKey && colorKey in this.settingsOptions.crossings_colors) {
                    label.style.color = this.settingsOptions.crossings_colors[colorKey];
                }
            });
            // Apply label colors based on data-color-key for crossing edges labels on palette
            const highlightCrossingEdgeLabels = document.getElementById("edge-palette").querySelectorAll('label[data-color-key');
            highlightCrossingEdgeLabels.forEach(label => {
                const colorKey = label.getAttribute('data-color-key');
                if (colorKey && colorKey in this.settingsOptions.crossing_edges_colors) {
                    label.style.color = this.settingsOptions.crossing_edges_colors[colorKey];
                }
            });
        }
        this.drawGraph(canvas, graph); // draw the graph on canvas
        this.infoBoxHandler.showHoveredInfo(canvas); // show information for the hovering objects
        // this.paletteHandler.updatePaletteState();       // update palettes state
    }
    // draw the graph
    drawGraph(canvas, graph, labels = true) {
        var _a, _b, _c, _d;
        // if (localCall)
        // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        // if (latexLabels)
        // clearLatexLabels();
        const ctx = canvas.getContext("2d");
        if (!ctx)
            throw new Error("Could not get canvas rendering context");
        // Draw edges first
        graph.edges.forEach(edge => { this.drawEdge(ctx, edge); });
        this.highlightSelectedEdges(ctx);
        // Highlight crossing edges of selected edges
        const highlightCrossEdges = document.getElementById("highlight-crossing-edges").checked;
        if (highlightCrossEdges)
            this.highlightCrossingEdges(graph, ctx);
        // Highlight non-crossing edges of selected edges
        const highlightNonCrossEdges = document.getElementById("highlight-non-crossing-edges").checked;
        if (highlightNonCrossEdges)
            this.highlightNonCrossingEdges(graph, ctx);
        // Draw vertices
        graph.vertices.forEach(vertex => {
            if (vertex.temporary)
                this.shapeBend(ctx, vertex.x, vertex.y, this.settingsOptions.bendChars.size, this.settingsOptions.bendChars.color); // same color as bend class constructor
            else
                this.drawVertex(ctx, vertex, labels);
        });
        // draw bends
        for (const edge of graph.edges)
            for (const bend of edge.bends)
                this.drawBend(ctx, bend);
        // highlight selected points
        this.highlightSelectedPoints(ctx);
        // Draw a temporary edge from starting vertex to mouse position and a rubbish bin to discard the new edge if necessary
        if (this.bendedEdgeCreator.creatingEdge && this.bendedEdgeCreator.startingVertex) {
            // console.log("startingVertex:", startingVertex.id);
            ctx.beginPath();
            ctx.moveTo(this.bendedEdgeCreator.startingVertex.x, this.bendedEdgeCreator.startingVertex.y);
            // ctx.lineTo(mouse.x, mouse.y);
            ctx.lineTo(this.worldCoords.x, this.worldCoords.y);
            // ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
            // apply characteristics of edgeChars
            ctx.strokeStyle = this.settingsOptions.edgeChars.color;
            ctx.lineWidth = this.settingsOptions.edgeChars.thickness / this.scaler.scale;
            if (this.settingsOptions.edgeChars.dashed)
                ctx.setLineDash([3 / this.scaler.scale, 3 / this.scaler.scale]); // dashed line
            ctx.stroke();
            // reset
            ctx.setLineDash([]);
            ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
            ctx.lineWidth = 2 / this.scaler.scale;
            // draw the rubbish bin
            if (this.bendedEdgeCreator.creatingEdge) {
                this.rubbishBin.updatePos(canvas, this.scaler);
                this.drawRubbishBin(ctx, this.rubbishBin.pos.x, this.rubbishBin.pos.y);
            }
        }
        // Draw crossings
        const output = document.getElementById("output");
        if (output) {
            const selfChecked = (_a = output.querySelector('#show-self')) === null || _a === void 0 ? void 0 : _a.checked;
            const neighborChecked = (_b = output.querySelector('#show-neighbor')) === null || _b === void 0 ? void 0 : _b.checked;
            const multipleChecked = (_c = output.querySelector('#show-multiple')) === null || _c === void 0 ? void 0 : _c.checked;
            const legalChecked = (_d = output.querySelector('#show-legal')) === null || _d === void 0 ? void 0 : _d.checked;
            this.drawCrossings(graph, ctx, selfChecked, neighborChecked, multipleChecked, legalChecked);
        }
        // draw selection rectangle
        if (this.selector.isSelecting) {
            ctx.strokeStyle = "rgba(15, 15, 62, 0.86)";
            ctx.lineWidth = 1 / this.scaler.scale;
            ctx.setLineDash([6 / this.scaler.scale]);
            ctx.strokeRect(this.selector.rect.x, this.selector.rect.y, this.selector.rect.width, this.selector.rect.height);
            ctx.setLineDash([]);
        }
    }
    // highlight the edges that cross any of the selected edges
    highlightCrossingEdges(graph, ctx) {
        for (const cross of graph.crossings) {
            const e0 = cross.edges[0];
            const e1 = cross.edges[1];
            if (ctx && this.selector.edges.includes(e0) && !this.selector.edges.includes(e1))
                this.drawEdge(ctx, e1, 1);
            else if (ctx && this.selector.edges.includes(e1) && !this.selector.edges.includes(e0))
                this.drawEdge(ctx, e0, 1);
        }
    }
    // highlight the edges that do not cross any of the selected edges and have no common endpoint with any of them (i.e. can cross them)
    highlightNonCrossingEdges(graph, ctx) {
        if (this.selector.edges.length === 0)
            return;
        // create a temporary parallel array for selected edges
        for (const edge of graph.edges) {
            let valid = true;
            // first check common endpoints with selected edges
            for (const e of this.selector.edges)
                if (e === edge || edge.commonEndpoint(e)) {
                    valid = false;
                    break;
                }
            if (!valid)
                continue;
            // if OK with selected vertices, check crossings
            for (const cross of graph.crossings)
                if (cross.edges[0] === edge && this.selector.edges.includes(cross.edges[1]) || cross.edges[1] === edge && this.selector.edges.includes(cross.edges[0])) {
                    valid = false;
                    break;
                }
            if (ctx && valid)
                this.drawEdge(ctx, edge, 2);
        }
    }
    // given a crossing, decide what its type is and return the appropriate color as a string
    crossingColor(cross) {
        if (cross.selfCrossing) // self-crossings
            return this.settingsOptions.crossings_colors.self;
        else if (!cross.legal) // neighbor-edge crossings
            return this.settingsOptions.crossings_colors.neighbor;
        else if (cross.more_than_once) // multiple crossings
            return this.settingsOptions.crossings_colors.multiple;
        else // legal crossings
            return this.settingsOptions.crossings_colors.legal;
    }
    drawCrossings(graph, ctx, self, neighbor, multiple, legal) {
        for (const cross of graph.crossings) {
            // different colors for different types of crossings
            if (cross.selfCrossing && self) // self-crossings
                this.drawCrossing(ctx, cross, this.settingsOptions.crossings_colors.self);
            else if (!cross.legal && !cross.selfCrossing && neighbor) // neighbor-edge crossings
                this.drawCrossing(ctx, cross, this.settingsOptions.crossings_colors.neighbor);
            else if (cross.legal && cross.more_than_once && multiple) // multiple crossings
                this.drawCrossing(ctx, cross, this.settingsOptions.crossings_colors.multiple);
            else if (cross.legal && !cross.more_than_once && legal) // legal crossings
                this.drawCrossing(ctx, cross, this.settingsOptions.crossings_colors.legal);
        }
    }
    drawCrossing(ctx, cros, color) {
        ctx.beginPath();
        let radius = cros.size;
        if (cros === this.hover.crossing)
            radius = radius + 1;
        ctx.lineWidth = 2 / this.scaler.scale;
        ctx.arc(cros.x, cros.y, radius / this.scaler.scale, 0, 2 * Math.PI);
        ctx.strokeStyle = color;
        ctx.stroke();
        // label
        this.showPointLabel(ctx, cros);
    }
    // function for drawing a vertex
    drawVertex(ctx, v, labels = true) {
        let size = v.size;
        if (this.hover.vertex === v)
            size = size + 1;
        this.drawShape(ctx, v.x, v.y, v.shape, size, v.color, true); // scaling in drawShape function
        // Draw label
        if (labels)
            this.showPointLabel(ctx, v);
    }
    // display the label of the given point
    showPointLabel(ctx, p) {
        if (!p.label.showLabel)
            return;
        ctx.fillStyle = p.label.color;
        if (this.hover.labelPoint === p)
            ctx.fillStyle = "red";
        const adjustedFontSize = p.label.fontSize / this.scaler.scale;
        ctx.font = `${adjustedFontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        // we want the difference between the vertex and the label to remain the same regardless of the zoom scale, so we devide offsets by scale
        ctx.fillText(p.label.content, p.x + p.label.offsetX / this.scaler.scale, p.y - this.labelOffsetY(p) / this.scaler.scale); // positive is down in canvas
        ctx.fillStyle = "#000";
    }
    // display the label of the given edge
    showEdgeLabel(ctx, e) {
        if (!e.label.showLabel)
            return;
        ctx.fillStyle = e.label.color;
        //if (hoveredLabelEdge === e)
        //ctx.fillStyle = "red";
        const adjustedFontSize = e.label.fontSize / this.scaler.scale;
        ctx.font = `${adjustedFontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        e.updateLabelPos();
        // we want the difference between the vertex and the label to remain the same regardless of the zoom scale, so we devide offsets by scale
        ctx.fillText(e.label.content, e.labelPosX + e.label.offsetX / this.scaler.scale, e.labelPosY - e.label.offsetY / this.scaler.scale); // positive is down in canvas
        ctx.fillStyle = "#000";
    }
    labelOffsetY(point) {
        return (point.size + point.label.offsetY /*  + point.label.fontSize*/);
    }
    /*private renderLatexLabel(vertex: Vertex) {
        declare var MathJax: any;
        let labelDiv = document.getElementById(`latex-label-${vertex.id}`);
        if (!labelDiv) {
        labelDiv = document.createElement("div");
        labelDiv.id = `latex-label-${vertex.id}`;
        labelDiv.style.position = "absolute";
        labelDiv.style.pointerEvents = "none"; // Make sure it doesn't block mouse events
        document.body.appendChild(labelDiv);
        }
    
        labelDiv.innerHTML = `\\(v_{${vertex.id}}\\)`; // LaTeX format
        labelDiv.style.left = `${canvas.offsetLeft + vertex.x + vertex.label.offsetX}px`; // adjust as needed
        labelDiv.style.top = `${canvas.offsetTop + vertex.y - this.labelOffsetY(vertex)}px`;
    
        MathJax.typesetPromise([labelDiv]); // re-render the LaTeX
    }*/
    clearLatexLabels() {
        document.querySelectorAll('[id^="latex-label-"]').forEach(el => el.remove());
    }
    // function for drawing a bend at position x,y
    drawBend(ctx, bend) {
        ctx.beginPath();
        ctx.lineWidth = 1 / this.scaler.scale;
        // show bigger bend when mouse near it
        let size = bend.size;
        if (bend === this.hover.bend)
            size = size + 1;
        ctx.arc(bend.x, bend.y, size / this.scaler.scale, 0, 2 * Math.PI); // small green circle
        ctx.fillStyle = bend.color;
        ctx.fill();
        ctx.strokeStyle = "black";
        ctx.stroke();
        ctx.lineWidth = 2 / this.scaler.scale;
        this.showPointLabel(ctx, bend);
    }
    // add an orange circle around a selected point
    showSelectedPoint(ctx, p) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, (p.size + 3) / this.scaler.scale, 0, 2 * Math.PI);
        ctx.strokeStyle = "orange"; // or "#f39c12"
        // ctx.lineWidth = 3;
        ctx.setLineDash([5 / this.scaler.scale, 3 / this.scaler.scale]); // dashed circle
        ctx.stroke();
        // ctx.lineWidth = 2;
        ctx.setLineDash([]); // reset to solid for others
    }
    drawShape(ctx, x, y, shape, size, color, fill = true) {
        ctx.beginPath();
        ctx.lineWidth = 2 / this.scaler.scale;
        size = size / this.scaler.scale;
        if (shape === "square")
            ctx.rect(x - size, y - size, size * 2, size * 2);
        else if (shape === "triangle") {
            ctx.moveTo(x, y - size);
            ctx.lineTo(x - size, y + size);
            ctx.lineTo(x + size, y + size);
            ctx.closePath();
        }
        else if (shape === "rhombus") {
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
    shapeBend(ctx, x, y, rad, color) {
        rad = rad / this.scaler.scale;
        ctx.beginPath();
        ctx.lineWidth = 1 / this.scaler.scale;
        // show bigger bend when mouse near it
        ctx.arc(x, y, rad, 0, 2 * Math.PI); // small green circle
        if (color !== undefined)
            ctx.fillStyle = color;
        else
            ctx.fillStyle = "#0000FF"; // same as color in bend class constructor
        ctx.fill();
        ctx.strokeStyle = "black";
        ctx.stroke();
        ctx.lineWidth = 2 / this.scaler.scale;
    }
    drawEdge(ctx, edge, highlight = 0) {
        const v1 = edge.points[0];
        const v2 = edge.points[1];
        if (v1 && v2) {
            ctx.beginPath();
            ctx.moveTo(v1.x, v1.y);
            if (edge.dashed)
                ctx.setLineDash([5 / this.scaler.scale, 5 / this.scaler.scale]); // Dash pattern: [dashLength, gapLength]
            ctx.lineWidth = edge.thickness / this.scaler.scale;
            const bends = edge.bends;
            // draw the edge passing through bends
            for (let i = 0; i < bends.length; i++)
                ctx.lineTo(bends[i].x, bends[i].y);
            ctx.lineTo(v2.x, v2.y);
            ctx.strokeStyle = edge.color;
            // increase thickness if edge === hover.edge
            if (this.hover.edge === edge)
                ctx.lineWidth = (edge.thickness + 2) / this.scaler.scale;
            // highlight if the edge is one of the edges of a hovering crossing
            if (this.hover.crossing && this.hover.crossingEdges.includes(edge)) {
                ctx.lineWidth = (edge.thickness + 2) / this.scaler.scale; // increase thickness
                ctx.strokeStyle = this.crossingColor(this.hover.crossing); // highlight the edge with the color of the crossing
                ctx.setLineDash([]); // no dashed line
            }
            else if (highlight === 1) // highlight crossing edges of selected edges
             {
                ctx.lineWidth = (edge.thickness + 2) / this.scaler.scale;
                ctx.strokeStyle = this.settingsOptions.crossing_edges_colors.crossing;
                ctx.setLineDash([]);
            }
            else if (highlight === 2) // highlight non-crossing edges of selected edges
             {
                ctx.lineWidth = (edge.thickness + 2) / this.scaler.scale;
                ctx.strokeStyle = this.settingsOptions.crossing_edges_colors.nonCrossing;
                ctx.setLineDash([]);
            }
            ctx.stroke();
            //reset
            ctx.setLineDash([]);
            ctx.lineWidth = edge.thickness / this.scaler.scale;
            this.showEdgeLabel(ctx, edge);
        }
    }
    highlightSelectedPoints(ctx) {
        this.selector.vertices.forEach(v => this.drawShape(ctx, v.x, v.y, v.shape, v.size + 2, "#FFA500", false)); // scaling in drawShape function)
        this.selector.bends.forEach(b => this.showSelectedPoint(ctx, b));
    }
    highlightSelectedEdges(ctx) {
        this.selector.edges.forEach(e => {
            const v1 = e.points[0];
            const v2 = e.points[1];
            const bends = e.bends;
            ctx.beginPath();
            ctx.moveTo(v1.x, v1.y);
            for (let i = 0; i < bends.length; i++)
                ctx.lineTo(bends[i].x, bends[i].y);
            ctx.lineTo(v2.x, v2.y);
            ctx.strokeStyle = "orange";
            ctx.setLineDash([5 / this.scaler.scale, 3 / this.scaler.scale]); // dashed line
            ctx.lineWidth = (e.thickness + 1) / this.scaler.scale;
            ctx.stroke();
            //reset
            ctx.setLineDash([]);
            ctx.lineWidth = e.thickness / this.scaler.scale;
        });
    }
    // draw a rubbish bin (when creating a new edge)
    drawRubbishBin(ctx, x, y) {
        ctx.save();
        if (this.isMouseNear(x, y, this.rubbishBin.radius / this.scaler.scale))
            ctx.strokeStyle = "red";
        else
            ctx.strokeStyle = "black";
        ctx.lineWidth = 2 / this.scaler.scale;
        // Draw bin body
        ctx.beginPath();
        ctx.rect(x, y, 20 / this.scaler.scale, 30 / this.scaler.scale);
        ctx.stroke();
        // Draw bin lid
        ctx.beginPath();
        ctx.moveTo(x - 5 / this.scaler.scale, y);
        ctx.lineTo(x + 25 / this.scaler.scale, y);
        ctx.stroke();
        // Draw handle
        ctx.beginPath();
        ctx.moveTo(x + 7 / this.scaler.scale, y - 5 / this.scaler.scale);
        ctx.lineTo(x + 13 / this.scaler.scale, y - 5 / this.scaler.scale);
        ctx.stroke();
        ctx.restore();
    }
    isMouseNear(x, y, dist) {
        // return Math.hypot(mouse.x-x,mouse.y-y)<dist;
        return Math.hypot(this.worldCoords.x - x, this.worldCoords.y - y) < dist;
    }
}
