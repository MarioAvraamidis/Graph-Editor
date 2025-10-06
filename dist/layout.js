import { showCustomAlert } from "./alert.js";
export function pathDrawing(graph, crossings) {
    const xDist = 50;
    // console.log("pathDrawing. crossings = ",crossings);
    const checkP = checkPath(graph);
    if (!checkP.isPath)
        showCustomAlert("The graph is not path.");
    else if (crossings > graph.thrackleNumber())
        showCustomAlert("The number you entered is greater than the path's thrackle.");
    else if (crossings === 0)
        addRemainingVertices(graph, 1, checkP.orderedVertices, xDist);
    else
        drawPathWithCrossings(graph, checkP.orderedVertices, crossings, xDist);
}
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
    else
        isPath = false;
    return { isPath: isPath, orderedVertices: orderedVertices };
}
function pathThrackle(graph, orderedVertices, xDist) {
    graph.removeBends(); // remove bends from the graph
    verticesInitialPlacement(graph, orderedVertices, xDist); // vertex placement
    addBends(graph, orderedVertices, xDist); // add bends to the edges
    graph.updateCrossings(); // update crossings
}
function addRemainingVertices(graph, nn, orderedVertices, xDist) {
    const diff = orderedVertices.length - nn;
    // first move the vertices at the right of the last used vertex more to the right
    for (let i = 0; i < nn - 1; i++)
        if (orderedVertices[i].x > orderedVertices[nn - 1].x)
            graph.moveVertex(orderedVertices[i], orderedVertices[i].x + diff * xDist, orderedVertices[i].y, false);
    // place the remaining vertices at the right of the last used vertex
    for (let i = nn; i < orderedVertices.length; i++)
        graph.moveVertex(orderedVertices[i], orderedVertices[nn - 1].x + (i - nn + 1) * xDist, orderedVertices[i].y);
}
function drawBetweenThrackles(graph, usedVertices, crossings, xDist) {
    const n = usedVertices.length;
    const thrackleBound = (n - 2) * (n - 3) / 2;
    // check that number of desired crossings is greater that the thrackle bound of the path with n-1 vertices
    if (crossings <= (n - 3) * (n - 4) / 2 || crossings > thrackleBound)
        return;
    const dx = thrackleBound - crossings;
    graph.removeBends();
    verticesInitialPlacement(graph, usedVertices, xDist); // initial vertices' placement
    swapVertices(graph, usedVertices, dx); // make the necessary swaps
    // addBends(graph,orderedVertices,xDist);                  // add bends
    // graph.updateCrossings();                                // update crossings
}
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
    for (let i = 1; i < usedVertices.length - 1; i++) {
        v0 = usedVertices[i - 1];
        v1 = usedVertices[i];
        v2 = usedVertices[i + 1];
        // compute dx's
        dx1 = Math.abs(v1.x - v0.x);
        dx2 = Math.abs(v2.x - v1.x);
        // move the bend of the smallest edge a little bit lower
        if (dx1 < dx2) // edge v0-v1 is smaller
            bend = (_a = graph.getEdgeByVertices(v0, v1)) === null || _a === void 0 ? void 0 : _a.bends[0];
        else // edge v1-v2 is smaller
            bend = (_b = graph.getEdgeByVertices(v1, v2)) === null || _b === void 0 ? void 0 : _b.bends[0];
        graph.moveBend(bend, bend.x, Math.min(bend.y + reduce, 0));
    }
}
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
