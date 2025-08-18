var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Graph, Vertex } from "./graph.js";
function serializeLabel(label) {
    return {
        showLabel: label.showLabel,
        offsetX: label.offsetX,
        offsetY: label.offsetY,
        color: label.color,
        fontSize: label.fontSize,
    };
}
export function exportJSON(graph) {
    const exportData = {
        vertices: graph.vertices.map(v => ({
            id: v.id,
            x: v.x,
            y: v.y,
            color: v.color,
            size: v.size,
            shape: v.shape,
            label: serializeLabel(v.label),
        })),
        edges: graph.edges.map(e => ({
            v1: e.points[0].id,
            v2: e.points[1].id,
            dashed: e.dashed,
            thickness: e.thickness,
            color: e.color,
            label: serializeLabel(e.label),
            bends: e.bends.map(b => ({
                x: b.x,
                y: b.y,
                size: b.size,
                color: b.color,
                label: serializeLabel(b.label),
            })),
        })),
    };
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "graph.json";
    a.click();
    URL.revokeObjectURL(url);
}
export function restoreGraphFromJSON(data) {
    const newGraph = new Graph();
    // Reconstruct vertices
    for (const v of data.vertices) {
        const vertex = new Vertex(v.id, v.x, v.y);
        // Object.assign(vertex, v); // Copy extra fields like label, color, shape, etc.
        if (v.color)
            vertex.color = v.color;
        if (v.size)
            vertex.size = v.size;
        if (v.shape)
            vertex.shape = v.shape;
        // label
        if (v.label)
            vertex.label.cloneCharacteristics(v.label);
        newGraph.vertices.push(vertex);
    }
    // Reconstruct edges
    for (const e of data.edges) {
        const v1 = newGraph.vertices.find(v => v.id === e.v1);
        const v2 = newGraph.vertices.find(v => v.id === e.v2);
        if (v1 && v2) {
            const edge = newGraph.addEdge(v1, v2);
            // Object.assign(edge, e); // Copy extra fields like bends, color, etc.
            if (e.color)
                edge.color = e.color;
            if (e.thickness)
                edge.thickness = e.thickness;
            if (e.dashed)
                edge.dashed = e.dashed;
            // label
            if (edge && e.label)
                edge.label.cloneCharacteristics(e.label);
            // bends
            for (const b of e.bends) {
                const newBend = newGraph.addBend(v1, v2, b.x, b.y, false, false);
                if (b.size)
                    newBend.size = b.size;
                if (b.color)
                    newBend.color = b.color;
                if (newBend && b.label)
                    newBend.label.cloneCharacteristics(b.label);
                //newBend?.assignCharacteristics(b.size,b.color);
            }
        }
    }
    newGraph.updateCrossings();
    newGraph.updateCurveComplexity();
    return newGraph;
}
// --- PDF Export Function ---
export function exportCanvasAsPdf(canvas) {
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }
    // Get the image data from the canvas
    const imgData = canvas.toDataURL('image/png'); // Can also use 'image/jpeg'
    // Initialize jsPDF
    // 'p' for portrait, 'l' for landscape
    // 'mm' for millimeters (default unit), 'pt' for points, 'in' for inches
    // [width, height] can specify custom page size
    const doc = new window.jspdf.jsPDF('l', 'mm', 'a4'); // Use 'window.jspdf' for CDN import
    // Calculate dimensions to fit the image on the PDF page
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    // Calculate aspect ratio to fit the image within the page
    const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;
    // Center the image on the page
    const x = (pageWidth - scaledWidth) / 2;
    const y = (pageHeight - scaledHeight) / 2;
    // Add the image to the PDF
    doc.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
    // Save the PDF
    doc.save('graph.pdf');
}
function renderLatexToImage(latex) {
    return __awaiter(this, void 0, void 0, function* () {
        const tempDiv = document.createElement("div");
        tempDiv.style.position = "absolute";
        tempDiv.style.visibility = "hidden";
        tempDiv.innerHTML = `\\(${latex}\\)`;
        document.body.appendChild(tempDiv);
        yield MathJax.typesetPromise([tempDiv]);
        const svgElement = tempDiv.querySelector("svg");
        if (!svgElement)
            throw new Error("Failed to render LaTeX");
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.src = url;
        yield new Promise((resolve) => {
            img.onload = () => {
                document.body.removeChild(tempDiv);
                URL.revokeObjectURL(url);
                resolve();
            };
        });
        return img;
    });
}
export function exportCanvasAsImage() {
    return __awaiter(this, void 0, void 0, function* () {
        // First draw graph normally...
        const canvas = document.getElementById("graphCanvas");
        // Create an off-screen canvas to not affect the visible one
        const exportCanvas = document.createElement("canvas");
        exportCanvas.width = canvas.width;
        exportCanvas.height = canvas.height;
        const exportCtx = exportCanvas.getContext("2d");
        if (!exportCtx)
            return;
        // Fill white background
        exportCtx.fillStyle = "white";
        exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        // Copy original canvas content
        exportCtx.drawImage(canvas, 0, 0);
        // add latex vertex labels
        /*for (const vertex of graph.vertices) {
            const label = "v_"+vertex.id; // or vertex.label if you use one
            const img = await renderLatexToImage(label);
            const x = vertex.x + vertex.label.offsetX;
            const y = vertex.y - labelOffsetY(vertex); // adjust position above the vertex
            const canvasPos = myCanvasHandler?.worldToCanvas(x,y);
            if (canvasPos)
                exportCtx.drawImage(img, canvasPos.x*dpr, canvasPos.y*dpr);
        }*/
        const link = document.createElement("a");
        link.download = "graph.png";
        link.href = exportCanvas.toDataURL();
        link.click();
    });
}
