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
    graph.makeCircle(0, 0, 250, sorted);
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
function checkCircle(graph) {
    const vertices = graph.vertices;
    let isCircle = true;
    let orderedVertices = [];
    if (vertices.length < 3)
        isCircle = false;
    vertices.forEach(v => { if (v.neighbors.length !== 2)
        isCircle = false; });
    if (isCircle) {
        const first = vertices[0];
        orderedVertices.push(first);
        let prev = first;
        let current = first.neighbors[0];
        while (current !== first) {
            // push current in the array
            orderedVertices.push(current);
            // check which of the neighbors is the previous
            if (prev === current.neighbors[0]) {
                prev = current; // update prev
                current = current.neighbors[1]; // update current
            }
            else {
                prev = current; // update prev
                current = current.neighbors[0]; // update current
            }
        }
        if (orderedVertices.length !== vertices.length)
            isCircle = false;
    }
    return { isCircle: isCircle, orderedVertices: orderedVertices };
}
function checkCircle2(graph) {
    if (graph.vertices.length <= 3)
        return false;
    const clone = graph.clone();
    const deleted = clone.vertices[0];
    if (deleted.neighbors.length !== 2)
        return false;
    clone.deleteVertex(deleted);
    const path = checkPath(clone);
    if (!path.isPath)
        return false;
    const first = path.orderedVertices[0];
    const last = path.orderedVertices[graph.vertices.length - 2];
    return (deleted.neighbors[0].id === first.id && deleted.neighbors[1].id === last.id
        || deleted.neighbors[0].id === last.id && deleted.neighbors[1].id === first.id);
}
export function starDrawing(graph) {
    const circle = checkCircle(graph);
    if (!circle.isCircle)
        showCustomAlert("The graph is not circle.");
    else if (graph.vertices.length % 2 === 0)
        showCustomAlert("The circle is not odd.");
    else {
        graph.removeBends(false);
        const len = graph.vertices.length;
        // create an array with the vertices in their circular order on the star graph
        let position = 0;
        const circularOrdered = [];
        for (let i = 0; i < len; i++) {
            circularOrdered.push(circle.orderedVertices[position]);
            position = (position + 2) % len;
        }
        graph.makeCircle(0, 0, 250, circularOrdered);
    }
}
function oddCircleBetweenThrackles(graph, orderedVertices, ntone) {
    graph.removeBends(false);
    const len = graph.vertices.length;
    let temp = orderedVertices[0]; // temp vertex
    const circularOrdered = [];
    if (len % 2 === 0) {
        temp = graph.addNewVertex();
        circularOrdered.push(temp);
    }
    // create an array with the vertices in their circular order on the star graph
    let position = 2;
    // add vertices 1,n,n-1,...,ntone+1
    circularOrdered.push(orderedVertices[0]);
    for (let i = len; i >= ntone + 1; i--)
        circularOrdered.push(orderedVertices[i - 1]);
    for (let i = 1; i < ntone; i++) {
        circularOrdered.push(orderedVertices[position]);
        position = (position + 2) % ntone;
    }
    graph.makeCircle(0, 0, 250, circularOrdered);
    if (len % 2 === 0)
        graph.deleteVertex(temp);
}
export function maxRectilinearCircle(graph) {
    const circle = checkCircle(graph);
    if (!circle.isCircle)
        showCustomAlert("The graph is not circle.");
    else if (graph.vertices.length % 2 === 1)
        showCustomAlert("The circle is not even.");
    else {
        graph.removeBends(false);
        const len = graph.vertices.length;
        // create an array with the vertices in their circular order on the star graph
        let position = 1;
        const circularOrdered = [];
        const temp = graph.addNewVertex(0, 0);
        circularOrdered.push(temp);
        // odd vertices
        while (position < len / 2) {
            circularOrdered.push(circle.orderedVertices[position - 1]);
            circularOrdered.push(circle.orderedVertices[len - position - 1]);
            position += 2;
        }
        if (len % 4 === 2)
            circularOrdered.push(circle.orderedVertices[len / 2 - 1]);
        // even vertices
        circularOrdered.push(circle.orderedVertices[len - 1]); // last vertex
        position = 2;
        while (position < len / 2) {
            circularOrdered.push(circle.orderedVertices[position - 1]);
            circularOrdered.push(circle.orderedVertices[len - position - 1]);
            position += 2;
        }
        if (len % 4 === 0)
            circularOrdered.push(circle.orderedVertices[len / 2 - 1]);
        graph.makeCircle(0, 0, 250, circularOrdered);
        graph.deleteVertex(temp);
    }
}
export function circleDrawing(graph, crossings) {
    const circle = checkCircle(graph);
    if (!circle.isCircle)
        showCustomAlert("The graph is not circle.");
    else if (crossings < 0 || crossings > graph.thrackleNumber())
        showCustomAlert("Desired number of crossings out of bounds.");
    else {
        const ntone = Math.ceil((3 + Math.sqrt(9 + 8 * crossings)) / 2);
        // console.log("ntone:",ntone);
        if (ntone % 2 === 0)
            betweenEvenCircleThrackles(graph, circle.orderedVertices, ntone);
        else
            oddCircleBetweenThrackles(graph, circle.orderedVertices, ntone);
    }
}
function betweenEvenCircleThrackles(graph, orderedVertices, ntone = graph.vertices.length) {
    graph.removeBends(false);
    const len = graph.vertices.length;
    const vert = orderedVertices;
    let temp = vert[0]; // temporary vertex
    // create an array with the vertices in their circular order on the thrackle
    const circularOrdered = [];
    // add a temp vertex to create an odd circle
    if (len % 2 === 0) {
        temp = graph.addNewVertex();
        circularOrdered.push(temp);
    }
    // vertex 2
    circularOrdered.push(vert[1]);
    // vertices 5,7,9, ... , n-1
    for (let i = 5; i < ntone - 1; i += 2)
        circularOrdered.push(vert[i - 1]);
    // if (ntone < len)
    circularOrdered.push(vert[len - 2]);
    // extra vertices (vertices middle, middle-1, ... , ntone+1)
    const middle = Math.floor((len + ntone) / 2);
    for (let i = len - 2; i >= middle - 1; i--)
        circularOrdered.push(vert[i - 1]);
    // vertex n
    circularOrdered.push(vert[len - 1]);
    // vertices 3 and 4
    circularOrdered.push(vert[2]);
    if (ntone > 6)
        circularOrdered.push(vert[3]);
    // vertices 6,8, ... , n-2
    for (let i = 6; i < ntone - 2; i += 2)
        circularOrdered.push(vert[i - 1]);
    // extra vertices (vertices len,len-1,...,middle+1)
    for (let i = middle - 2; i > ntone - 2; i--)
        circularOrdered.push(vert[i - 1]);
    // vertex ntone-2
    circularOrdered.push(vert[ntone - 3]);
    // vertex 1
    circularOrdered.push(vert[0]);
    const radius = 250;
    graph.makeCircle(0, 0, radius, circularOrdered);
    // delete extra vertex if needed
    if (len % 2 === 0) {
        graph.deleteVertex(temp);
        circularOrdered.shift();
    }
    // add bends
    evenCircleThrackleBends(graph, vert, ntone, radius);
}
function evenCircleThrackleBends(graph, orderedVertices, ntone, radius) {
    graph.removeBends(false);
    const len = graph.vertices.length;
    const v1 = orderedVertices[0];
    const v2 = orderedVertices[1];
    const v3 = orderedVertices[2];
    const v4 = orderedVertices[3];
    const v_n = orderedVertices[len - 1];
    const v_n_1 = orderedVertices[len - 2];
    const v_n_2 = orderedVertices[ntone - 3];
    const middle = Math.floor((len + ntone) / 2);
    let v_middle_2 = orderedVertices[middle - 2];
    // console.log("v1 =",v1.id,"v2 =",v2.id,"v3 =",v3.id,"v4 =",v4.id,"v_n =",v_n.id,"v_n_1 =",v_n_1.id,"v_n_2 =",v_n_2.id,"lastVertex =",lastVertex.id)
    // edge 3-4 bends
    const edge34 = graph.getEdgeByVertices(v3, v4);
    const dist = 2 * radius;
    const x34 = -1.65 * radius;
    const y34 = -1.5 * radius;
    // let coords1 = extendPoints(v3.x,v3.y,(v_n.x+v_n_1.x)/2,(v_n.y+v_n_1.y)/2,2*radius);
    let coords1 = extendPoints(v3.x, v3.y, (v_n.x + v_middle_2.x) / 2, (v_n.y + v_middle_2.y) / 2, 2 * radius);
    coords1 = extendPoints(v3.x, v3.y, coords1.x, coords1.y, dist * (y34 - v3.y) / (coords1.y - v3.y));
    let coords3 = extendPoints(v4.x, v4.y, (v1.x + v_n_2.x) / 2, (v1.y + v_n_2.y) / 2, dist);
    coords3 = extendPoints(v4.x, v4.y, coords3.x, coords3.y, dist * (v4.x - x34) / (v4.x - coords3.x));
    let coords2 = { x: coords3.x, y: coords1.y };
    if (ntone === 6) // && graph.vertices.length === 6
        coords3.y = v4.y;
    addBendsToEdge(edge34, [coords1, coords2, coords3], v3);
    // edge 1-2 bends
    const edge12 = graph.getEdgeByVertices(v1, v2);
    const x12 = 1.3 * radius;
    const y12 = -1.65 * radius;
    let vAfter3 = v4;
    if (ntone === 6)
        vAfter3 = orderedVertices[middle - 3];
    coords1 = extendPoints(v1.x, v1.y, (v3.x + vAfter3.x) / 2, (v3.y + vAfter3.y) / 2, dist);
    coords1 = extendPoints(v1.x, v1.y, coords1.x, coords1.y, dist * (x12 - v1.x) / (coords1.x - v1.x));
    coords2 = { x: coords1.x, y: y12 };
    coords3 = { x: v2.x, y: coords2.y };
    if (ntone === 6 && graph.vertices.length === 6)
        coords1.y = v1.y;
    addBendsToEdge(edge12, [coords1, coords2, coords3], v1);
    // edge (n-2,n-1) bends
    const edgeN = graph.getEdgeByVertices(v_n_1, v_n);
    const xn = -1.5 * radius;
    const yn = 1.5 * radius;
    const xNN = coords1.x;
    // const xNN = 1.5*radius;
    coords1 = extendPoints(v_n_1.x, v_n_1.y, (v1.x + v2.x) / 2, (v1.y + v2.y) / 2, dist);
    const factor = (xn - v_n_1.x) / (coords1.x - v_n_1.x);
    if (factor < 1.5)
        coords1 = extendPoints(v_n_1.x, v_n_1.y, coords1.x, coords1.y, dist * factor);
    coords2 = { x: coords1.x, y: yn };
    coords3 = { x: xNN, y: coords2.y };
    if (ntone === 6) //  && graph.vertices.length === 6
        //coords1.y -= radius;
        coords1.y = Math.max(coords2.y - radius / 2, coords1.y - radius);
    if (coords1.y > coords2.y)
        addBendsToEdge(edgeN, [coords1, coords3], v_n_1);
    else
        addBendsToEdge(edgeN, [coords1, coords2, coords3], v_n_1);
    // highlight bended edges
    const colors = document.getElementById("change-colors-in-layout");
    if (colors.checked) {
        graph.edges.forEach(e => e.color = "#878787");
        edge12.color = "#13fb3a";
        edge34.color = "blue";
        edgeN.color = "red";
    }
    graph.updateCrossings();
    graph.updateCurveComplexity();
}
/**
 * Add bends to the given edge at the given points
 * IMPORTANT: update graph's curve complexity when calling this function
 */
function addBendsToEdge(edge, points, firstVertex) {
    if (edge.points[0] === firstVertex)
        for (const p of points)
            edge.addBend(p.x, p.y, false);
    // graph.addBend(firstVertex,edge.points[1] as Vertex,p.x,p.y,false,false); Proper command using graph's methods
    else
        for (let i = points.length - 1; i >= 0; i--)
            edge.addBend(points[i].x, points[i].y, false);
}
/**
 * Starting from (x1,y1), draw a line that passes through (x2,y2) and return the point at distance d from (x1,y1)
 */
function extendPoints(x1, y1, x2, y2, d) {
    // console.log("extendPoints");
    // console.log("x1 =",x1,"x2 =",x2,"y1 =",y1,"y2 =",y2);
    const dy = y2 - y1;
    const dx = x2 - x1;
    if (dx === 0) {
        if (y2 > y1)
            return { x: x1, y: y1 + d };
        return { x: x1, y: y1 - d };
    }
    const angle = Math.abs(Math.atan(dy / dx));
    // console.log("angle = ",angle);
    return { x: x1 + d * Math.cos(angle) * Math.sign(x2 - x1), y: y1 + d * Math.sin(angle) * Math.sign(y2 - y1) };
}
export function evenCircleThrackle(graph) {
    const circle = checkCircle(graph);
    if (!circle.isCircle)
        showCustomAlert("The graph is not circle.");
    else if (graph.vertices.length % 2 === 1)
        showCustomAlert("The circle is not even.");
    else if (graph.vertices.length === 4)
        showCustomAlert("Thrackle for C4 does not exist.");
    else {
        graph.removeBends(false);
        const len = graph.vertices.length;
        const vert = circle.orderedVertices;
        // create an array with the vertices in their circular order on the thrackle
        const circularOrdered = [];
        // add a temp vertex to create an odd circle
        const temp = graph.addNewVertex();
        circularOrdered.push(temp);
        // vertices 1 and 2
        // circularOrdered.push(vert[0]);
        circularOrdered.push(vert[1]);
        // vertices 5,7,9, ... , n-1
        for (let i = 5; i < len; i += 2)
            circularOrdered.push(vert[i - 1]);
        // vertex n
        circularOrdered.push(vert[len - 1]);
        // vertices 3 and 4
        circularOrdered.push(vert[2]);
        circularOrdered.push(vert[3]);
        // vertices 6,8, ... , n-2
        for (let i = 6; i < len; i += 2)
            circularOrdered.push(vert[i - 1]);
        circularOrdered.push(vert[0]);
        const radius = 250;
        graph.makeCircle(0, 0, radius, circularOrdered);
        graph.deleteVertex(temp);
        // add bends
        evenCircleThrackleBends(graph, vert, len, radius);
    }
}
/* export function runNewAlgorithm(graph: Graph, parameter: number)
{
    
} */ 
