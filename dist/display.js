export class Displayer {
    constructor(settingsOptions, paletteHandler, infoBoxHandler, drawer) {
        this.output = document.getElementById("output");
        this.settingsOptions = settingsOptions;
        this.paletteHandler = paletteHandler;
        this.infoBoxHandler = infoBoxHandler;
        this.drawer = drawer;
    }
    renderGraph(graph, canvas) {
        if (this.output) {
            // update scale
            //      if (myCanvasHandler)
            //                scale = this.scaler.scale;
            // const vertexList = graph.vertices.map(v => v.id).join(", ");
            // const edgeList = graph.edges.map(e => `(${e.points[0].id}-${e.points[1].id})`).join(", ");
            const crossings_categories = graph.crossingsCategories();
            const totalCrossingsSpan = document.getElementById("total-crossings");
            const selfCrossingsSpan = document.getElementById("self-crossings");
            const neighborCrossingsSpan = document.getElementById("neighbor-crossings");
            const multipleCrossingsSpan = document.getElementById("multiple-crossings");
            const legalCrossingsSpan = document.getElementById("legal-crossings");
            const thrackleNumberSpan = document.getElementById("thrackle-number");
            const curveComplexitySpan = document.getElementById("curve-complexity");
            if (totalCrossingsSpan)
                totalCrossingsSpan.textContent = `${graph.crossings.length}`;
            if (selfCrossingsSpan)
                selfCrossingsSpan.textContent = `${crossings_categories.self}`;
            if (neighborCrossingsSpan)
                neighborCrossingsSpan.textContent = `${crossings_categories.neighbor}`;
            if (multipleCrossingsSpan)
                multipleCrossingsSpan.textContent = `${crossings_categories.multiple}`;
            if (legalCrossingsSpan)
                legalCrossingsSpan.textContent = `${crossings_categories.legal}`;
            if (thrackleNumberSpan)
                thrackleNumberSpan.textContent = `${graph.thrackleNumber()}`;
            if (curveComplexitySpan)
                curveComplexitySpan.textContent = `${graph.curve_complexity}`;
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
        this.drawer.drawGraph(canvas, graph);
        // show information for the hovering objects
        this.infoBoxHandler.showHoveredInfo(canvas);
        this.paletteHandler.updatePaletteState();
    }
}
