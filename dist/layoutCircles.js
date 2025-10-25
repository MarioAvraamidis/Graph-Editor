import { showCustomAlert } from "./alert.js";
export function checkCircle(graph) {
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
/*function checkCircle2(graph: Graph)
{
    if(graph.vertices.length <= 3)
        return false;
    const clone = graph.clone();
    const deleted: Vertex = clone.vertices[0];
    if (deleted.neighbors.length !== 2)
        return false;
    clone.deleteVertex(deleted);
    const path = checkPath(clone);
    if (!path.isPath)
        return false;
    const first = path.orderedVertices[0];
    const last = path.orderedVertices[graph.vertices.length-2];
    return (deleted.neighbors[0].id === first.id && deleted.neighbors[1].id === last.id
        || deleted.neighbors[0].id === last.id && deleted.neighbors[1].id === first.id
    );
}*/
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
    // create an array with the vertices in their circular order on the star graph
    const circularOrdered = [];
    if (len % 2 === 0) {
        temp = graph.addNewVertex();
        circularOrdered.push(temp);
    }
    const middle = Math.ceil((len + ntone) / 2);
    // add vertex 1
    circularOrdered.push(orderedVertices[0]);
    // add vertices 1,n,n-1,...,middle+1
    for (let i = len; i > middle; i--)
        circularOrdered.push(orderedVertices[i - 1]);
    // add odd vertices
    for (let i = 3; i < ntone; i += 2)
        circularOrdered.push(orderedVertices[i - 1]);
    // vertices middle,middle-1,...,ntone+1
    for (let i = middle; i > ntone; i--)
        circularOrdered.push(orderedVertices[i - 1]);
    // vertex ntone
    circularOrdered.push(orderedVertices[ntone - 1]);
    // add even vertices
    for (let i = 2; i < ntone; i += 2)
        circularOrdered.push(orderedVertices[i - 1]);
    graph.makeCircle(0, 0, 250, circularOrdered);
    if (len % 2 === 0) {
        graph.deleteVertex(temp);
        circularOrdered.shift();
    }
    return circularOrdered;
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
    else if (graph.vertices.length === 4) {
        if (crossings === 2)
            showCustomAlert("Thrackle for C4 doesn't exist");
        else {
            graph.removeBends();
            graph.makeCircle(0, 0, 250, circle.orderedVertices);
            if (crossings === 1)
                graph.swapPoints(circle.orderedVertices[0], circle.orderedVertices[1]);
        }
    }
    else if (crossings <= 2) {
        graph.removeBends();
        graph.makeCircle(0, 0, 250, circle.orderedVertices);
        if (crossings > 0)
            graph.swapPoints(circle.orderedVertices[0], circle.orderedVertices[2]);
        if (crossings > 1)
            graph.swapPoints(circle.orderedVertices[0], circle.orderedVertices[1]);
    }
    else if (crossings === 6 || crossings === 8) {
        const radius = 250;
        let circularOrdered = drawWith6crossings(graph, circle.orderedVertices, radius);
        if (crossings === 8)
            edgeAroundNextVertex(graph, circle.orderedVertices[2], circle.orderedVertices[3], circularOrdered, radius);
    }
    else {
        const ntone = Math.ceil((3 + Math.sqrt(9 + 8 * crossings)) / 2);
        const radius = 250;
        let circularOrdered = circle.orderedVertices;
        // colors
        const colors = document.getElementById("change-colors-in-layout");
        if (colors.checked)
            graph.edges.forEach(e => e.color = "#878787");
        // console.log("ntone:",ntone);
        let dx = ntone * (ntone - 3) / 2 - crossings;
        let first = circle.orderedVertices[1], second = circle.orderedVertices[2];
        if (ntone % 2 === 0) {
            circularOrdered = betweenEvenCircleThrackles(graph, circle.orderedVertices, ntone);
            first = circle.orderedVertices[1];
            second = circle.orderedVertices[2];
        }
        else {
            circularOrdered = oddCircleBetweenThrackles(graph, circle.orderedVertices, ntone);
            first = circle.orderedVertices[2];
            second = circle.orderedVertices[1];
        }
        if (dx % 2 === 1) {
            if (ntone > 6) {
                continuousSwap(graph, circularOrdered, circle.orderedVertices[3], circle.orderedVertices[5]); // swap vertices 4 and 6
                if (dx === 1) {
                    if (ntone > 15)
                        edgeAroundVertex(graph, circle.orderedVertices[5], circle.orderedVertices[6], circle.orderedVertices[3], circularOrdered, radius);
                    else
                        edgeAroundNextVertex(graph, circle.orderedVertices[6], circle.orderedVertices[5], circularOrdered, radius);
                    dx -= 1;
                }
                else
                    dx -= 3;
            }
            else {
                if (dx === 1 && ntone === 5) {
                    // swap vertices 2 and 4 and guide edge (4,5) around vertex 2
                    continuousSwap(graph, circularOrdered, circle.orderedVertices[1], circle.orderedVertices[3]);
                    // edgeAroundVertex(graph,circle.orderedVertices[3],circle.orderedVertices[4],circle.orderedVertices[1],circularOrdered,radius);
                    // edge45aroundV2(graph,circle.orderedVertices,circularOrdered,radius);
                    edgeAroundNextVertex(graph, circle.orderedVertices[4], circle.orderedVertices[3], circularOrdered, radius);
                    dx -= 1;
                }
            }
        }
        if (dx > 0)
            reduceCrossings(graph, ntone, dx, first, second, circularOrdered, radius);
    }
}
function continuousSwap(graph, circularOrdered, first, second) {
    let pos1 = circularOrdered.indexOf(first);
    while (circularOrdered[pos1 + 1] !== second) {
        graph.swapPoints(first, circularOrdered[pos1 + 1]);
        circularOrdered[pos1] = circularOrdered[pos1 + 1];
        circularOrdered[pos1 + 1] = first;
        pos1++;
    }
    graph.swapPoints(first, circularOrdered[pos1 + 1]);
    circularOrdered[pos1] = circularOrdered[pos1 + 1];
    circularOrdered[pos1 + 1] = first;
}
function drawWith6crossings(graph, orderedVertices, radius) {
    graph.removeBends();
    const ntone = 6;
    const circularOrdered = [];
    const len = graph.vertices.length;
    let temp = orderedVertices[0];
    let middle = Math.floor((len + ntone) / 2);
    if (len % 2 === 0) {
        temp = graph.addNewVertex();
        circularOrdered.push(temp);
    }
    // vertex 1
    circularOrdered.push(orderedVertices[0]);
    // vertices len,len-1,...,middle+1
    for (let i = len; i > middle; i--)
        circularOrdered.push(orderedVertices[i - 1]);
    // vertices 3 and 4
    circularOrdered.push(orderedVertices[2]);
    circularOrdered.push(orderedVertices[3]);
    // vertices middle,middle-1,...,ntone+1
    for (let i = middle; i > ntone; i--)
        circularOrdered.push(orderedVertices[i - 1]);
    // vertices 6,2,5
    circularOrdered.push(orderedVertices[5]);
    circularOrdered.push(orderedVertices[1]);
    circularOrdered.push(orderedVertices[4]);
    // make circle
    graph.removeBends();
    graph.makeCircle(0, 0, radius, circularOrdered);
    // delete extra vertex if needed
    if (len % 2 === 0) {
        graph.deleteVertex(temp);
        circularOrdered.shift();
    }
    return circularOrdered;
}
function edgeAroundVertex(graph, v6, v7, v4, circularOrdered, radius) {
    // const v4 = orderedVertices[3];
    // const v6 = orderedVertices[5];
    // const v7 = orderedVertices[6];
    const edge67 = graph.getEdgeByVertices(v6, v7);
    const pos4 = circularOrdered.indexOf(v4);
    const pos6 = circularOrdered.indexOf(v6);
    console.log("pos" + v4.id + ":", pos4);
    console.log("pos" + v6.id + ":", pos6);
    const after4 = circularOrdered[(pos4 + 1) % circularOrdered.length];
    const before6 = circularOrdered[(pos6 - 1) % circularOrdered.length];
    console.log("after" + v4.id + ":", after4.id);
    console.log("before" + v6.id + ":", before6.id);
    // const midAfter4 = {x: (v4.x+after4.x)/2, y: (v4.y+after4.y)/2};
    // const midBefore6 = {x: (v6.x+circularOrdered[pos6-1].x)/2, y: (v6.y+circularOrdered[pos6-1].y)/2};
    const mid46 = { x: (v4.x + v6.x) / 2, y: (v4.y + v6.y) / 2 };
    const dist46 = Math.sqrt(Math.pow((v4.x - v6.x), 2) + Math.pow((v4.y - v6.y), 2));
    // const angle = findAngle(mid.y,mid.x);
    // let coords1 = extendPoints(0,0,midAfter4.x,midAfter4.y,radius*0.85);
    // let coords1 = midAfter4;
    let coords1 = pointAtRatio(v4.x, v4.y, after4.x, after4.y, 2 / 3);
    // let coords2 = extendPoints(0,0,midAfter4.x,midAfter4.y,radius*1.1);
    let coords2 = extendPoints(0, 0, mid46.x, mid46.y, radius * (1 + dist46 / 2 / radius));
    // let p4 = extendPoints(0,0,v4.x,v4.y,radius*1.15);
    // let p6 = extendPoints(0,0,v6.x,v6.y,radius*1.15);
    // let coords3 = extendPoints(v7.x,v7.y,midBefore6.x,midBefore6.y,radius);
    // coords3 = lineIntersection(p4.x,p4.y,p6.x,p6.y,v7.x,v7.y,coords3.x,coords3.y);
    let coords3 = pointAtRatio(v6.x, v6.y, before6.x, before6.y, 2 / 3);
    // let dist = Math.sqrt((v7.x-coords3.x)**2+(v7.y-coords3.y)**2);
    // coords3 = extendPoints(v7.x,v7.y,midBefore6.x,midBefore6.y,dist*1.01);
    addBendsToEdge(graph, edge67, [coords1, coords2, coords3], v6);
    graph.updateCrossingsByEdge(edge67);
    graph.updateCurveComplexity();
}
function edge45aroundV2(graph, orderedVertices, circularOrdered, radius) {
    const v4 = orderedVertices[3];
    const v5 = orderedVertices[4];
    const v2 = orderedVertices[1];
    const edge45 = graph.getEdgeByVertices(v4, v5);
    const pos2 = circularOrdered.indexOf(v2);
    const pos4 = circularOrdered.indexOf(v4);
    const after2 = circularOrdered[(pos2 + 1) % circularOrdered.length];
    const before4 = circularOrdered[(pos4 - 1) % circularOrdered.length];
    let coords1 = pointAtRatio(v2.x, v2.y, after2.x, after2.y, 1 / 2);
    // let coords2 = pointAtRatio(v2.x,v2.y,v4.x,v4.y,1/2);
    // let coords3 = pointAtRatio(v4.x,v4.y,before4.x,before4.y,1/2);
    // extend
    coords1 = extendPoints(0, 0, coords1.x, coords1.y, radius);
    let coords2 = extendPoints(0, 0, v2.x, v2.y, radius * 1.2);
    let coords3 = extendPoints(0, 0, v4.x, v4.y, radius * 1.2);
    addBendsToEdge(graph, edge45, [coords1, coords2, coords3], v4);
    graph.updateCrossingsByEdge(edge45);
    graph.updateCurveComplexity();
}
function edgeAroundNextVertex(graph, first, second, circularOrdered, radius) {
    const len = circularOrdered.length;
    const edge = graph.getEdgeByVertices(first, second);
    // const pos1 = circularOrdered.indexOf(first);
    const pos2 = circularOrdered.indexOf(second);
    const after = circularOrdered[(pos2 + 1) % len];
    const afterafter = circularOrdered[(pos2 + 2) % len];
    let coords1 = pointAtRatio(after.x, after.y, afterafter.x, afterafter.y, 1 / 2);
    // let coords2 = pointAtRatio(v2.x,v2.y,v4.x,v4.y,1/2);
    // let coords3 = pointAtRatio(v4.x,v4.y,before4.x,before4.y,1/2);
    // extend
    coords1 = extendPoints(0, 0, coords1.x, coords1.y, radius);
    let coords2 = extendPoints(0, 0, after.x, after.y, radius * 1.2);
    let coords3 = extendPoints(0, 0, second.x, second.y, radius * 1.2);
    addBendsToEdge(graph, edge, [coords1, coords2, coords3], second);
    graph.updateCrossingsByEdge(edge);
    graph.updateCurveComplexity();
}
function findAngle(dy, dx) {
    let angle = Math.atan(dy / dx);
    if (dx > 0)
        angle -= Math.PI;
    return angle;
}
// dx should be even
function reduceCrossings(graph, ntone, dx, first, second, circularOrdered, radius) {
    const len = graph.vertices.length;
    const edge23 = graph.getEdgeByVertices(first, second);
    // angle 
    let angle = findAngle(first.y, first.x) - 3 * Math.PI / 4;
    const dist = 1.45 * radius;
    // 1st bend
    let coords1 = { x: dist * Math.cos(angle), y: dist * Math.sin(angle) };
    if (ntone % 2 === 0) {
        let pos2 = circularOrdered.indexOf(first);
        let next = circularOrdered[pos2 + 1];
        let distt = Math.sqrt(Math.pow((first.x / 2 - next.x / 2), 2) + Math.pow((first.y - next.y), 2));
        coords1 = extendPoints(first.x, first.y, (next.x + first.x) / 2, next.y, distt);
        let ratio = Math.abs(0.9 * (dist + first.y) / (first.y - coords1.y));
        coords1 = extendPoints(first.x, first.y, coords1.x, coords1.y, distt * ratio);
    }
    let coords2 = coords1;
    // 2nd bend
    const limit = ntone - 4 + ntone % 2;
    // console.log("dx =",dx);
    if (dx === limit) {
        if (ntone % 2 === 1) {
            let angle = findAngle(second.y, second.x) + 3 * Math.PI / 4;
            coords2 = { x: dist * Math.cos(angle), y: dist * Math.sin(angle) };
        }
        else if (len > 6) {
            const pos3 = circularOrdered.indexOf(second); // position of v3
            const prev = circularOrdered[pos3 - 1];
            const prevprev = circularOrdered[pos3 - 2];
            let dx = prev.x - prevprev.x;
            let dy = prev.y - prevprev.y;
            coords2 = { x: prevprev.x + dx / 3, y: prevprev.y + dy / 3 };
            const ratio = (second.y - coords1.y) / (second.y - coords2.y);
            coords2.x = second.x - ratio * (second.x - coords2.x);
            coords2.y = coords1.y;
        }
    }
    else {
        const posFirst = circularOrdered.indexOf(first);
        const bet = dx / 2;
        coords2 = { x: (circularOrdered[posFirst + bet].x + circularOrdered[posFirst + bet + 1].x) / 2, y: (circularOrdered[posFirst + bet].y + circularOrdered[posFirst + bet + 1].y) / 2 };
        if (2 * dx >= len - 1) {
            if (ntone % 2 === 0) {
                const ratio = (second.y - coords1.y) / (second.y - coords2.y);
                const dist = Math.sqrt(Math.pow((second.x - coords2.x), 2) + Math.pow((second.y - coords2.y), 2));
                coords2 = extendPoints(second.x, second.y, coords2.x, coords2.y, ratio * dist);
            }
            else {
                let angle = findAngle(second.y, second.x) + 3 * Math.PI / 4;
                let coords3 = { x: dist * Math.cos(angle), y: dist * Math.sin(angle) };
                coords2 = lineIntersection(coords1.x, coords1.y, coords3.x, coords3.y, second.x, second.y, coords2.x, coords2.y);
            }
        }
    }
    addBendsToEdge(graph, edge23, [coords1, coords2], first);
    // if (ntone%2 === 0)
    // evenCircleThrackleBends(graph,ordered)
    graph.updateCrossingsByEdge(edge23);
    graph.updateCurveComplexity();
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
    return circularOrdered;
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
    addBendsToEdge(graph, edge34, [coords1, coords2, coords3], v3);
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
    addBendsToEdge(graph, edge12, [coords1, coords2, coords3], v1);
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
        addBendsToEdge(graph, edgeN, [coords1, coords3], v_n_1);
    else
        addBendsToEdge(graph, edgeN, [coords1, coords2, coords3], v_n_1);
    // highlight bended edges
    const colors = document.getElementById("change-colors-in-layout");
    if (colors.checked) {
        // graph.edges.forEach(e => e.color = "#878787")
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
export function addBendsToEdge(graph, edge, points, firstVertex) {
    if (edge.points[0] === firstVertex)
        for (const p of points)
            // edge.addBend(p.x,p.y,false);
            graph.addBend(firstVertex, edge.points[1], p.x, p.y, false, false); //  Proper command using graph's methods
    else
        for (let i = points.length - 1; i >= 0; i--)
            // edge.addBend(points[i].x,points[i].y,false);
            graph.addBend(firstVertex, edge.points[0], points[i].x, points[i].y, false, false);
    // update crossings
    graph.updateCrossingsByEdge(edge);
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
function lineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
    // Compute the determinant
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    /*if (Math.abs(denom) < 1e-10) {
      // Lines are parallel or coincident
      return null;
    }*/
    const px = ((x1 * y2 - y1 * x2) * (x3 - x4) -
        (x1 - x2) * (x3 * y4 - y3 * x4)) /
        denom;
    const py = ((x1 * y2 - y1 * x2) * (y3 - y4) -
        (y1 - y2) * (x3 * y4 - y3 * x4)) /
        denom;
    return { x: px, y: py };
}
function pointAtRatio(x1, y1, x2, y2, r) {
    return {
        x: x1 + (x2 - x1) * r,
        y: y1 + (y2 - y1) * r,
    };
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
