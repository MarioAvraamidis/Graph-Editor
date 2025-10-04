import { showCustomAlert } from "./alert.js";
export function pathDrawing(graph, crossings) {
    // console.log("pathDrawing. crossings = ",crossings);
    const checkP = checkPath(graph);
    if (!checkP.isPath)
        showCustomAlert("The graph is not path");
    else {
        pathThrackle(graph, checkP.orderedVertices);
    }
}
/**
 * Check if the given graph is a path. The graph must be simple, i.e. no parallel edges, loops and not directed
 *
 * @param graph
 * @returns
 */
function checkPath(graph) {
    const vertices = graph.vertices;
    let isPath = true;
    let current = null;
    let prev = null;
    let orderedVertices = [];
    for (const v of vertices) {
        if (v.neighbors.length > 2 || v.neighbors.length === 0) {
            isPath = false;
            // console.log("vertex "+v.id+" not vertex of a path");
            break;
        }
        else if (v.neighbors.length === 1) {
            current = v;
            // console.log("found first vertex "+v.id);
            break;
        }
    }
    if (isPath && current) {
        orderedVertices.push(current);
        prev = current;
        current = current.neighbors[0];
        while (current.neighbors.length === 2) {
            // console.log("current: "+current.id);
            // push current in the array
            orderedVertices.push(current);
            // check which of the neighbors is the previous
            if (prev === current.neighbors[0]) {
                prev = current; // update prev
                current = current === null || current === void 0 ? void 0 : current.neighbors[1]; // update current
            }
            else {
                prev = current; // update prev
                current = current === null || current === void 0 ? void 0 : current.neighbors[0]; // update current
            }
        }
        // console.log("Process stopped. Current = "+current.id);
        if (orderedVertices.length !== vertices.length - 1)
            isPath = false;
        else
            orderedVertices.push(current);
        /* else
        {
            if (current.neighbors.length === 1)
                orderedVertices.push(current);
            else
                isPath = false;
        } */
    }
    return { isPath: isPath, orderedVertices: orderedVertices };
}
function pathThrackle(graph, orderedVertices) {
    // remove bends from the graph
    graph.removeBends();
    // variables
    const len = orderedVertices.length;
    const xDist = 50;
    let x = 0;
    let y = 0;
    // place vertices
    for (let i = 0; i < orderedVertices.length; i += 2) {
        graph.moveVertex(orderedVertices[i], x, y);
        x += xDist;
    }
    for (let i = 1; i < len; i += 2) {
        graph.moveVertex(orderedVertices[i], x, y);
        x += xDist;
    }
    // add bends to the edges
    for (let i = 0; i < len - 1; i++) {
        const v1 = orderedVertices[i];
        const v2 = orderedVertices[i + 1];
        x = (v1.x + v2.x) / 2;
        y = -Math.abs(v1.x - v2.x) / (i % 2 + 2);
        graph.addBend(v1, v2, x, y, false, false);
    }
    graph.updateCrossings();
}
