/* Project Structure:

graph-drawing-app/
├── index.html
├── styles.css
├── src/
│   ├── app.ts
│   └── graph.ts
├── tsconfig.json
└── package.json
*/

// index.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <link rel="stylesheet" href="styles.css">
    <title>Graph Editor</title>
</head>
<body>
    <h1>Graph Editor</h1>
    <div id="graph-container"></div>
    <div id="controls">
        <button id="add-vertex">Add Vertex</button>
        <button id="add-edge">Add Edge</button>
        <button id="delete-vertex">Delete Vertex</button>
        <button id="delete-edge">Delete Edge</button>
    </div>
    <script src="dist/app.js" defer></script>
</body>
</html>

// styles.css
body {
    font-family: Arial, sans-serif;
    margin: 20px;
}
#graph-container {
    width: 100%;
    height: 400px;
    border: 1px solid #000;
    margin-bottom: 20px;
}
#controls button {
    margin-right: 10px;
}

// tsconfig.json
{
    "compilerOptions": {
        "target": "es6",
        "module": "commonjs",
        "outDir": "dist",
        "strict": true
    },
    "include": ["src/**/*"]
}

// package.json
{
    "name": "graph-drawing-app",
    "version": "1.0.0",
    "scripts": {
        "build": "tsc",
        "start": "npx http-server"
    },
    "devDependencies": {
        "typescript": "^5.0.0",
        "http-server": "^14.1.0"
    }
}

// src/graph.ts
export class Graph {
    private vertices: string[] = [];
    private edges: [string, string][] = [];

    addVertex(vertex: string) {
        if (!this.vertices.includes(vertex)) {
            this.vertices.push(vertex);
        }
    }

    deleteVertex(vertex: string) {
        this.vertices = this.vertices.filter(v => v !== vertex);
        this.edges = this.edges.filter(([v1, v2]) => v1 !== vertex && v2 !== vertex);
    }

    addEdge(v1: string, v2: string) {
        if (this.vertices.includes(v1) && this.vertices.includes(v2)) {
            this.edges.push([v1, v2]);
        }
    }

    deleteEdge(v1: string, v2: string) {
        this.edges = this.edges.filter(([a, b]) => !(a === v1 && b === v2) && !(a === v2 && b === v1));
    }

    getGraph() {
        return { vertices: this.vertices, edges: this.edges };
    }
}

// src/app.ts
import { Graph } from "./graph";

const graph = new Graph();
const container = document.getElementById("graph-container")!;

function renderGraph() {
    container.innerHTML = "";
    const { vertices, edges } = graph.getGraph();

    vertices.forEach(v => {
        const vertex = document.createElement("div");
        vertex.textContent = v;
        vertex.className = "vertex";
        container.appendChild(vertex);
    });
}

document.getElementById("add-vertex")?.addEventListener("click", () => {
    const vertex = prompt("Enter vertex name:");
    if (vertex) graph.addVertex(vertex);
    renderGraph();
});

document.getElementById("delete-vertex")?.addEventListener("click", () => {
    const vertex = prompt("Enter vertex to delete:");
    if (vertex) graph.deleteVertex(vertex);
    renderGraph();
});

renderGraph();