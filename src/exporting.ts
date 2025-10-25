import { Graph } from "./graph.js";
import { Vertex } from "./graphElements.js";
import { Label } from "./labels.js";

function serializeLabel(label: Label) {
  return {
    content: label.content,
    showLabel: label.showLabel,
    offsetX: label.offsetX,
    offsetY: label.offsetY,
    color: label.color,
    fontSize: label.fontSize,
  };
}

export function exportJSON(graph: Graph) {
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

export function restoreGraphFromJSON(data: any): Graph {
    const newGraph = new Graph();

    // Reconstruct vertices
    for (const v of data.vertices) {
        const vertex: Vertex = new Vertex(v.id, v.x, v.y);
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
            const edge = newGraph.addEdge(v1,v2);
            // Object.assign(edge, e); // Copy extra fields like bends, color, etc.
            if (e.color)
                edge!.color = e.color;
            if (e.thickness)
                edge!.thickness = e.thickness;
            if (e.dashed)
                edge!.dashed = e.dashed;
            // label
            if (edge && e.label)
                edge.label.cloneCharacteristics(e.label);
            // bends
            for (const b of e.bends)
            {
                const newBend = newGraph.addBend(v1,v2,b.x,b.y,false,false);
                if (b.size)
                    newBend!.size = b.size;
                if (b.color)
                    newBend!.color = b.color;
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
export function exportCanvasAsPdf(canvas: HTMLCanvasElement) {
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
    const doc = new (window as any).jspdf.jsPDF('l', 'mm', 'a4'); // Use 'window.jspdf' for CDN import

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

// function for rendering latex content to image (to add the vertex labels as images to the graph picture)
declare var MathJax: any;
async function renderLatexToImage(latex: string): Promise<HTMLImageElement> {
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.visibility = "hidden";
    tempDiv.innerHTML = `\\(${latex}\\)`;
    document.body.appendChild(tempDiv);

    await MathJax.typesetPromise([tempDiv]);

    const svgElement = tempDiv.querySelector("svg");
    if (!svgElement) throw new Error("Failed to render LaTeX");

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.src = url;

    await new Promise<void>((resolve) => {
        img.onload = () => {
            document.body.removeChild(tempDiv);
            URL.revokeObjectURL(url);
            resolve();
        };
    });

    return img;
}

export async function exportCanvasAsImage(canvas: HTMLCanvasElement) {
    
    // First draw graph normally...
    // const canvas = document.getElementById("graphCanvas") as HTMLCanvasElement;
    // Create an off-screen canvas to not affect the visible one
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
  
    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) return;

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
}

export function exportCanvasWithReportPNG(mainCanvas: HTMLCanvasElement, report: any, colors: any) {
    // const mainCanvas = document.getElementById("graphCanvas") as HTMLCanvasElement;
    // Create final canvas bigger than the main one
    const finalCanvas = document.createElement("canvas");
    const reportHeight = 180; // adjust depending on report content
    finalCanvas.width = mainCanvas.width;
    finalCanvas.height = mainCanvas.height + reportHeight;

    const ctx = finalCanvas.getContext("2d")!;

    // Fill white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    // Draw main canvas content
    ctx.drawImage(mainCanvas, 0, 0);

    // Draw report below
    const margin = 20;
    let y = mainCanvas.height + margin;

    ctx.font = "16px Arial";
    ctx.fillStyle = "black";
    ctx.fillText("Report", 10, y);

    const labelX = 10;
    const valueX = 180; // fixed column for numbers

    y += 25;
    ctx.fillStyle = colors.self;
    ctx.fillText(`Self X-ings:`, labelX, y);
    ctx.fillText(report.self,valueX,y);

    y += 20;
    ctx.fillStyle = colors.neighbor;
    ctx.fillText(`Neighbor-edge X-ings:`, labelX, y);
    ctx.fillText(report.neighbor, valueX, y);

    y += 20;
    ctx.fillStyle = colors.multiple;
    ctx.fillText(`Multiple X-ings:`, labelX, y);
    ctx.fillText(report.multiple,valueX,y);

    y += 20;
    ctx.fillStyle = colors.legal;
    ctx.fillText(`Legal X-ings:`, labelX, y);
    ctx.fillText(report.legal,valueX,y);

    y += 20;
    ctx.fillStyle = "black";
    ctx.fillText(`Total X-ings:`, labelX, y);
    ctx.fillText(report.total,valueX,y);

    y += 20;
    ctx.fillText(`Thrackle:`, labelX, y);
    ctx.fillText(report.thrackleNum,valueX,y);

    y += 20;
    ctx.fillText(`Curve Complexity:`, labelX, y);
    ctx.fillText(report.cc,valueX,y);

    // Export PNG
    const link = document.createElement("a");
    link.download = "graph_with_report.png";
    link.href = finalCanvas.toDataURL("image/png");
    link.click();
}

// --- PDF Export Function (canvas + report) ---
export function exportWithReportPDF(
    canvas: HTMLCanvasElement,
    reportData: any,
    colors: any
) {
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }

    // Get the image data from the canvas
    const imgData = canvas.toDataURL("image/png");

    // Init jsPDF (landscape A4 in mm)
    const doc = new (window as any).jspdf.jsPDF("l", "mm", "a4");

    // Page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Canvas dimensions
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Scale canvas to fit into ~70% of the page height
    const maxCanvasHeight = pageHeight * 0.65;
    const ratio = Math.min(pageWidth / imgWidth, maxCanvasHeight / imgHeight);
    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;

    // Position canvas at top center
    const x = (pageWidth - scaledWidth) / 2;
    let y = 10; // top margin
    doc.addImage(imgData, "PNG", x, y, scaledWidth, scaledHeight);

    // --- Add report below ---
    y += scaledHeight + 15; // spacing below canvas
    const labelX = 20;
    const valueX = 70;
    doc.setFontSize(14);

    doc.setTextColor(0, 0, 0);
    doc.text("Report", labelX, y);
    y += 10;

    doc.setFontSize(12);
    const yStep = 6;

    doc.setTextColor(colors.self);
    doc.text("Self X-ings :", labelX, y);
    doc.text(String(reportData.self), valueX, y);

    y += yStep;
    doc.setTextColor(colors.neighbor);
    doc.text("Neighbor-edge X-ings :", labelX, y);
    doc.text(String(reportData.neighbor), valueX, y);

    y += yStep;
    doc.setTextColor(colors.multiple);
    doc.text("Multiple X-ings :", labelX, y);
    doc.text(String(reportData.multiple), valueX, y);

    y += yStep;
    doc.setTextColor(colors.legal);
    doc.text("Legal X-ings :", labelX, y);
    doc.text(String(reportData.legal), valueX, y);

    y += yStep;
    doc.setTextColor(0, 0, 0);
    doc.text("Total X-ings :", labelX, y);
    doc.text(String(reportData.total), valueX, y);

    y += yStep;
    doc.text("Thrackle :", labelX, y);
    doc.text(String(reportData.thrackleNum), valueX, y);

    y += yStep;
    doc.text("Curve Complexity :", labelX, y);
    doc.text(String(reportData.cc), valueX, y);

    // Save
    doc.save("graph_with_report.pdf");
}
