export class InfoBoxHandler {
    constructor(selector, hover, scaler, bendedEdgeCreator, worldCoords) {
        this.selector = selector;
        this.hover = hover;
        this.scaler = scaler;
        this.bendedEdgeCreator = bendedEdgeCreator;
        this.worldCoords = worldCoords;
    }
    showHoveredInfo(canvas) {
        if (this.bendedEdgeCreator.creatingEdge || this.selector.draggingPoints.length > 0) {
            this.hideVertexInfo();
            this.hideEdgeInfo();
            this.hideCrossingInfo();
            return;
        }
        // show vertex info of hover.vertex
        if (this.hover.vertex)
            this.showVertexInfo(canvas, this.hover.vertex);
        else
            this.hideVertexInfo();
        // show crossing info of hover.crossing
        if (this.hover.crossing)
            this.showCrossingInfo(canvas, this.hover.crossing);
        else
            this.hideCrossingInfo();
        // show edge info of hover.vertex
        if (this.hover.edge)
            this.showEdgeInfo(canvas, this.hover.edge);
        else
            this.hideEdgeInfo();
    }
    // show a box with information about the hovered verted
    showVertexInfo(canvas, vertex) {
        // const canvas = document.getElementById("graphCanvas") as HTMLCanvasElement;
        const infoBox = document.getElementById("vertex-info");
        const rect = canvas.getBoundingClientRect();
        const neighborsList = vertex.neighbors.map(v => v.id).join(", ");
        const infoText = ` Vertex ID: ${vertex.id}<br>
                            Degree: ${vertex.neighbors.length}<br>
                            Neighbor(s): ${neighborsList}`;
        infoBox.innerHTML = infoText;
        // infoBox.style.left = `${rect.left + vertex.x - 100}px`;
        // infoBox.style.top = `${rect.top + vertex.y - 50}px`;
        const canvasPos = this.scaler.worldToCanvas(vertex.x, vertex.y);
        if (canvasPos) {
            infoBox.style.left = `${rect.left + canvasPos.x + 10}px`;
            infoBox.style.top = `${rect.top + canvasPos.y + 10}px`;
        }
        // infoBox.style.left = `${this.mouseHandler.mouse.x + rect.left + 5}px`;
        // infoBox.style.top = `${this.mouseHandler.mouse.y + rect.top + 5}px`;
        infoBox.style.display = "block";
    }
    hideVertexInfo() {
        const infoBox = document.getElementById("vertex-info");
        infoBox.style.display = "none";
    }
    // show a box with information about the hovered crossing
    showCrossingInfo(canvas, cross) {
        // const canvas = document.getElementById("graphCanvas") as HTMLCanvasElement;
        const infoBox = document.getElementById("crossing-info");
        const rect = canvas.getBoundingClientRect();
        let infoText;
        if (cross.selfCrossing) // self-crossing
            infoText = `Self-crossing`;
        else if (!cross.legal) // illegal crossing
            infoText = `Illegal crossing <br>
                        Edges: ${cross.edges[0].id} and ${cross.edges[1].id}`;
        else if (cross.more_than_once) // multiple crossing
            infoText = `Multiple crossing <br>
                        Edges: ${cross.edges[0].id} and ${cross.edges[1].id}`;
        else // legal crossing
            infoText = `Legal crossing <br>
                        Edges: ${cross.edges[0].id} and ${cross.edges[1].id}`;
        infoBox.innerHTML = infoText;
        // infoBox.style.left = `${cross.x + 30 }px`;
        // infoBox.style.top = `${cross.y + 50}px`;
        // infoBox.style.left = `${this.mouseHandler.mouse.x + rect.left + 5}px`;
        // infoBox.style.top = `${this.mouseHandler.mouse.y + rect.top + 5}px`;
        const canvasPos = this.scaler.worldToCanvas(this.worldCoords.x, this.worldCoords.y);
        infoBox.style.left = `${canvasPos.x /* + rect.left*/ + 5}px`;
        infoBox.style.top = `${canvasPos.y + /* rect.top */ +5}px`;
        infoBox.style.display = "block";
    }
    hideCrossingInfo() {
        const infoBox = document.getElementById("crossing-info");
        infoBox.style.display = "none";
    }
    showEdgeInfo(canvas, edge) {
        const infoBox = document.getElementById("edge-info");
        const rect = canvas.getBoundingClientRect();
        const infoText = ` Edge: ${edge.id}<br>
                            CC: ${edge.bends.length}`;
        infoBox.innerHTML = infoText;
        // infoBox.style.left = `${rect.left + mouse.x + 5}px`;
        // infoBox.style.top = `${rect.top + mouse.y + 5}px`;
        // infoBox.style.left = `${rect.left + this.mouseHandler.mouse.x + 10}px`;
        // infoBox.style.top = `${rect.top + this.mouseHandler.mouse.y + 10}px`;
        const canvasPos = this.scaler.worldToCanvas(this.worldCoords.x, this.worldCoords.y);
        infoBox.style.left = `${canvasPos.x /* + rect.left*/ + 5}px`;
        infoBox.style.top = `${canvasPos.y + /* rect.top */ +5}px`;
        infoBox.style.display = "block";
    }
    hideEdgeInfo() {
        const infoBox = document.getElementById("edge-info");
        infoBox.style.display = "none";
    }
}
