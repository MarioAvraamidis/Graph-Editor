import { showCustomAlert } from "./alert.js";
import { Vertex } from "./graphElements.js";
/**
 * Create a straight line drawing of the path with the desired number of crossings. The vertices are place around a circle
 * The vertices are first placed in linear order and produce a drawing with the given number of crossings.
 * After that they are placed around the circle.
 *
 * @param graph
 * @param crossings
 */
export function circularPathDrawing(graph, crossings) {
    const xDist = linearPathDrawing(graph, crossings);
    let newVertex = new Vertex("");
    if (xDist === -1)
        return;
    // create a x-sorted array of the vertices in the linear drawing
    const sorted = [];
    graph.vertices.forEach(v => sorted.push(v));
    const len = graph.vertices.length;
    // handle even n case (add a temporary vertex so that the circle placement looks like an odd circle drawing)
    if (len % 2 === 0) {
        newVertex = new Vertex("NEWVerTeX", len * xDist, 0);
        graph.addVertex(newVertex);
        sorted.push(newVertex);
    }
    // sort the vertices
    graph.vertices.forEach(v => sorted[v.x / xDist] = v);
    // circle placement
    graph.makeCircle(0, 0, 300, sorted);
    graph.removeBends();
    // remove the temporary vertex
    if (len % 2 === 0)
        graph.deleteVertex(newVertex);
}
/**
 * Place the vertices and edges of the graph (if it's path) so that the number of crossings in the drawing is the given.
 * Also check if the given graph is a path and that the given number of crossings is between 0 and thrackleBound(path)
 *
 * @param graph
 * @param crossings
 */
export function linearPathDrawing(graph, crossings) {
    const xDist = 100;
    // console.log("pathDrawing. crossings = ",crossings);
    const checkP = checkPath(graph);
    if (!checkP.isPath) {
        showCustomAlert("The graph is not path.");
        return -1;
    }
    else if (crossings > graph.thrackleNumber()) {
        showCustomAlert("The number you entered is greater than the path's thrackle.");
        return -1;
    }
    else if (crossings === 0) {
        graph.moveVertex(checkP.orderedVertices[0], 0, 0, false);
        addRemainingVertices(graph, 1, checkP.orderedVertices, xDist);
        graph.updateCrossings();
        return xDist;
    }
    else {
        drawPathWithCrossings(graph, checkP.orderedVertices, crossings, xDist);
        return xDist;
    }
}
/**
 * Given a graph (path), the vertices in order of their appearance on the path, a number of crossings and a x-distance value,
 * produce a linear drawing of the path with the given number of crossings.
 * The x-distance between consecutive vertices is xDist.
 *
 * @param graph
 * @param orderedVertices
 * @param crossings
 * @param xDist
 */
function drawPathWithCrossings(graph, orderedVertices, crossings, xDist) {
    const nn = Math.ceil((5 + Math.sqrt(25 - 4 * (6 - 2 * crossings))) / 2);
    // select the vertices that will be used in the drawing of the path P_n'
    const usedVertices = [];
    for (let i = 0; i < nn; i++)
        usedVertices.push(orderedVertices[i]);
    // place the vertices
    drawBetweenThrackles(graph, usedVertices, crossings, xDist);
    // add the remaining vertices
    addRemainingVertices(graph, nn, orderedVertices, xDist);
    // add bends
    addBends(graph, usedVertices, xDist);
    graph.updateCrossings();
}
/**
 * Produce a thrackle of the given graph (path)
 *
 * @param graph
 * @param orderedVertices
 * @param xDist
 */
function pathThrackle(graph, orderedVertices, xDist) {
    graph.removeBends(); // remove bends from the graph
    verticesInitialPlacement(graph, orderedVertices, xDist); // vertex placement
    addBends(graph, orderedVertices, xDist); // add bends to the edges
    graph.updateCrossings(); // update crossings
}
/**
 * Place the remaining vertices at the right side of the last used vertex. Move to the right the other used vertices if needed.
 */
function addRemainingVertices(graph, nn, orderedVertices, xDist) {
    graph.removeBends(false);
    const diff = orderedVertices.length - nn;
    // first move the vertices at the right of the last used vertex more to the right
    for (let i = 0; i < nn - 1; i++)
        if (orderedVertices[i].x > orderedVertices[nn - 1].x)
            graph.moveVertex(orderedVertices[i], orderedVertices[i].x + diff * xDist, orderedVertices[i].y, false);
    // place the remaining vertices at the right of the last used vertex
    for (let i = nn; i < orderedVertices.length; i++)
        graph.moveVertex(orderedVertices[i], orderedVertices[nn - 1].x + (i - nn + 1) * xDist, orderedVertices[nn - 1].y, false);
}
/**
 * Given a graph (path) and a subset of its vertices, produce a drawing with these vertices with the given number of crossings.
 * If the subset has n vertices, the number of crossings should belong between the thrackle bounds of P_{n-1} and P_n
 */
function drawBetweenThrackles(graph, usedVertices, crossings, xDist) {
    const n = usedVertices.length;
    const thrackleBound = (n - 2) * (n - 3) / 2;
    // check that number of desired crossings is greater that the thrackle bound of the path with n-1 vertices
    if (crossings <= (n - 3) * (n - 4) / 2 || crossings > thrackleBound)
        return;
    const dx = thrackleBound - crossings;
    // graph.removeBends();
    verticesInitialPlacement(graph, usedVertices, xDist); // initial vertices' placement
    swapVertices(graph, usedVertices, dx); // make the necessary swaps
}
/**
 * Place firstly the odd vertices of the given graph (path) in increasing order and then the even vertices in increasing order
 */
function verticesInitialPlacement(graph, orderedVertices, xDist) {
    let x = 0;
    let y = 0;
    // place vertices
    for (let i = 0; i < orderedVertices.length; i += 2) {
        graph.moveVertex(orderedVertices[i], x, y);
        x += xDist;
    }
    for (let i = 1; i < orderedVertices.length; i += 2) {
        graph.moveVertex(orderedVertices[i], x, y);
        x += xDist;
    }
}
/**
 * Given a graph (path), a subset of its vertices and a number dx, perform the necessary swaps between the vertices so that
 * the number of crossings is reduced by dx.
 * We assume that the initial drawing of the graph was a thrackle
 */
function swapVertices(graph, usedVertices, dx) {
    const n = usedVertices.length;
    if (dx % 2 == 1) {
        const k = (dx - 1) / 2;
        for (let i = 1; i <= k + 1; i++)
            graph.swapVertices(usedVertices[0], usedVertices[2 * i], false);
    }
    else if (dx >= 2) {
        const k = dx / 2;
        for (let i = 1; i <= k; i++)
            graph.swapVertices(usedVertices[0], usedVertices[2 * i], false);
        graph.swapVertices(usedVertices[n - 1], usedVertices[n - 3], false);
    }
}
/**
 * Add bends to the edges of the graph (path) so that they take (somehow) the shape of a semi-circle
 */
function addBends(graph, usedVertices, xDist) {
    var _a, _b;
    let x, y;
    let v0, v1, v2;
    let dx1, dx2;
    let bend;
    // add bends
    for (let i = 0; i < usedVertices.length - 1; i++) {
        v1 = usedVertices[i];
        v2 = usedVertices[i + 1];
        x = (v1.x + v2.x) / 2;
        y = -Math.abs(v1.x - v2.x) / 2; ///(i%2+2);
        graph.addBend(v1, v2, x, y, false, false);
    }
    // adjust bends so that no edge parts overlap
    const reduce = xDist / Math.exp(0.8);
    let sign; // variable which helps moving the bends on the x-axis for a more clear drawing
    for (let i = 1; i < usedVertices.length - 1; i++) {
        v0 = usedVertices[i - 1];
        v1 = usedVertices[i];
        v2 = usedVertices[i + 1];
        // compute dx's
        dx1 = Math.abs(v1.x - v0.x);
        dx2 = Math.abs(v2.x - v1.x);
        sign = 1;
        // move the bend of the smallest edge a little bit lower
        if (dx1 < dx2) // edge v0-v1 is smaller
         {
            bend = (_a = graph.getEdgeByVertices(v0, v1)) === null || _a === void 0 ? void 0 : _a.bends[0];
            if (v0.x < v1.x)
                sign = -1;
        }
        else // edge v1-v2 is smaller
         {
            bend = (_b = graph.getEdgeByVertices(v1, v2)) === null || _b === void 0 ? void 0 : _b.bends[0];
            if (v2.x < v1.x)
                sign = -1;
        }
        graph.moveBend(bend, bend.x + sign * reduce, Math.min(bend.y + reduce / 2, 0));
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
            break;
        }
        else if (v.neighbors.length === 1) {
            current = v;
            break;
        }
    }
    if (isPath && current) {
        orderedVertices.push(current);
        prev = current;
        current = current.neighbors[0];
        while (current.neighbors.length === 2) {
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
        if (orderedVertices.length !== vertices.length - 1)
            isPath = false;
        else
            orderedVertices.push(current);
    }
    else
        isPath = false;
    return { isPath: isPath, orderedVertices: orderedVertices };
}
