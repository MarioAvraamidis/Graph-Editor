import { showCustomAlert } from "./alert.js";
import { Graph } from "./graph.js";
import { Bend, Vertex } from "./graphElements.js";

/**
 * Create a straight line drawing of the path with the desired number of crossings. The vertices are place around a circle
 * The vertices are first placed in linear order and produce a drawing with the given number of crossings.
 * After that they are placed around the circle.
 * 
 * @param graph 
 * @param crossings 
 */
export function circularPathDrawing(graph: Graph, crossings: number)
{
    const xDist = linearPathDrawing(graph,crossings);
    let newVertex: Vertex = new Vertex("");
    if (xDist === -1)
        return;
    // create a x-sorted array of the vertices in the linear drawing
    const sorted: Vertex[] = [];
    graph.vertices.forEach(v => sorted.push(v));
    const len = graph.vertices.length;
    // handle even n case (add a temporary vertex so that the circle placement looks like an odd circle drawing)
    if (len%2 === 0)
    {
        newVertex = new Vertex("NEWVerTeX",len*xDist,0);
        graph.addVertex(newVertex);
        sorted.push(newVertex);
    }
    // sort the vertices
    graph.vertices.forEach( v => sorted[v.x/xDist] = v);
    // circle placement
    graph.makeCircle(0,0,250,sorted);
    graph.removeBends();
    // remove the temporary vertex
    if (len%2 === 0)
        graph.deleteVertex(newVertex);
}

/**
 * Place the vertices and edges of the graph (if it's path) so that the number of crossings in the drawing is the given.
 * Also check if the given graph is a path and that the given number of crossings is between 0 and thrackleBound(path)
 * 
 * @param graph 
 * @param crossings 
 */
export function linearPathDrawing(graph: Graph, crossings: number)
{
    const xDist: number = 100;
    // console.log("pathDrawing. crossings = ",crossings);
    const checkP = checkPath(graph);
    if (!checkP.isPath)
    {
        showCustomAlert("The graph is not path.");
        return -1;
    }
    else if( crossings > graph.thrackleNumber())
    {
        showCustomAlert("The number you entered is greater than the path's thrackle.");
        return -1;
    }
    else if (crossings === 0)
    {
        graph.moveVertex(checkP.orderedVertices[0],0,0,false);
        addRemainingVertices(graph,1,checkP.orderedVertices,xDist);
        graph.updateCrossings();
        return xDist;
    }
    else
    {
        drawPathWithCrossings(graph,checkP.orderedVertices,crossings,xDist);
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
function drawPathWithCrossings(graph: Graph, orderedVertices: Vertex[], crossings: number, xDist: number)
{
    const nn = Math.ceil((5+Math.sqrt(25-4*(6-2*crossings)))/2);
    // select the vertices that will be used in the drawing of the path P_n'
    const usedVertices: Vertex[] = [];
    for (let i=0;i<nn;i++)
        usedVertices.push(orderedVertices[i]);
    // place the vertices
    drawBetweenThrackles(graph,usedVertices,crossings,xDist);
    // add the remaining vertices
    addRemainingVertices(graph,nn,orderedVertices,xDist);
    // add bends
    addBends(graph,usedVertices,xDist);
    graph.updateCrossings();
}

/**
 * Produce a thrackle of the given graph (path)
 * 
 * @param graph 
 * @param orderedVertices 
 * @param xDist 
 */
function pathThrackle(graph: Graph, orderedVertices: Vertex[], xDist: number)
{
    graph.removeBends();                                    // remove bends from the graph
    verticesInitialPlacement(graph,orderedVertices,xDist);  // vertex placement
    addBends(graph,orderedVertices,xDist);                  // add bends to the edges
    graph.updateCrossings();                                // update crossings
}

/**
 * Place the remaining vertices at the right side of the last used vertex. Move to the right the other used vertices if needed.
 */
function addRemainingVertices(graph: Graph, nn: number, orderedVertices: Vertex[], xDist: number)
{
    graph.removeBends(false);
    const diff = orderedVertices.length - nn;
    // first move the vertices at the right of the last used vertex more to the right
    for (let i=0;i<nn-1;i++)
        if (orderedVertices[i].x > orderedVertices[nn-1].x)
            graph.moveVertex(orderedVertices[i],orderedVertices[i].x+diff*xDist,orderedVertices[i].y,false);
    // place the remaining vertices at the right of the last used vertex
    for (let i=nn;i<orderedVertices.length;i++)
        graph.moveVertex(orderedVertices[i],orderedVertices[nn-1].x+(i-nn+1)*xDist,orderedVertices[nn-1].y,false);
}

/**
 * Given a graph (path) and a subset of its vertices, produce a drawing with these vertices with the given number of crossings.
 * If the subset has n vertices, the number of crossings should belong between the thrackle bounds of P_{n-1} and P_n
 */
function drawBetweenThrackles(graph: Graph, usedVertices: Vertex[], crossings: number, xDist: number)
{
    const n = usedVertices.length;
    const thrackleBound = (n-2)*(n-3)/2;
    // check that number of desired crossings is greater that the thrackle bound of the path with n-1 vertices
    if ( crossings <= (n-3)*(n-4)/2 || crossings > thrackleBound)
        return;
    const dx = thrackleBound-crossings;
    // graph.removeBends();
    verticesInitialPlacement(graph,usedVertices,xDist);  // initial vertices' placement
    swapVertices(graph,usedVertices,dx);                 // make the necessary swaps
}

/**
 * Place firstly the odd vertices of the given graph (path) in increasing order and then the even vertices in increasing order
 */
function verticesInitialPlacement(graph: Graph, orderedVertices: Vertex[], xDist: number)
{
    let x = 0;
    let y = 0;
    // place vertices
    for (let i=0; i<orderedVertices.length; i+=2)
    {
        graph.moveVertex(orderedVertices[i],x,y);
        x += xDist;
    }
    for (let i=1; i<orderedVertices.length; i+=2)
    {
        graph.moveVertex(orderedVertices[i],x,y);
        x += xDist;
    }
}

/**
 * Given a graph (path), a subset of its vertices and a number dx, perform the necessary swaps between the vertices so that
 * the number of crossings is reduced by dx.
 * We assume that the initial drawing of the graph was a thrackle
 */
function swapVertices(graph: Graph, usedVertices: Vertex[], dx: number)
{
    const n = usedVertices.length;
    if (dx%2==1)
    {
        const k = (dx-1)/2;
        for (let i=1;i<=k+1;i++)
            graph.swapVertices(usedVertices[0],usedVertices[2*i],false);
    }
    else if (dx >= 2)
    {
        const k = dx/2;
        for (let i=1;i<=k;i++)
            graph.swapVertices(usedVertices[0],usedVertices[2*i],false);
        graph.swapVertices(usedVertices[n-1],usedVertices[n-3],false);
    }
}

/**
 * Add bends to the edges of the graph (path) so that they take (somehow) the shape of a semi-circle
 */
function addBends(graph: Graph, usedVertices: Vertex[], xDist: number)
{
    let x,y: number;
    let v0,v1,v2: Vertex;
    let dx1,dx2: number;
    let bend: Bend;
    // add bends
    for (let i=0;i<usedVertices.length-1;i++)
    {
        v1 = usedVertices[i];
        v2 = usedVertices[i+1];
        x = (v1.x+v2.x)/2;
        y = -Math.abs(v1.x-v2.x)/2; ///(i%2+2);
        graph.addBend(v1,v2,x,y,false,false);
    }
    // adjust bends so that no edge parts overlap
    const reduce = xDist/Math.exp(0.8);
    let sign: number;                       // variable which helps moving the bends on the x-axis for a more clear drawing
    for (let i=1;i<usedVertices.length-1;i++)
    {
        v0 = usedVertices[i-1];
        v1 = usedVertices[i];
        v2 = usedVertices[i+1];
        // compute dx's
        dx1 = Math.abs(v1.x-v0.x);
        dx2 = Math.abs(v2.x-v1.x);
        sign = 1;
        // move the bend of the smallest edge a little bit lower
        if (dx1 < dx2)  // edge v0-v1 is smaller
        {
            bend = graph.getEdgeByVertices(v0,v1)?.bends[0] as Bend;
            if (v0.x < v1.x)
                sign = -1;
        }
        else   // edge v1-v2 is smaller
        {
            bend = graph.getEdgeByVertices(v1,v2)?.bends[0] as Bend;
            if (v2.x < v1.x)
                sign = -1;
        }
        graph.moveBend(bend,bend.x+sign*reduce,Math.min(bend.y+reduce/2,0));
    }
}

/**
 * Check if the given graph is a path. The graph must be simple, i.e. no parallel edges, loops and not directed
 * 
 * @param graph 
 * @returns 
 */
function checkPath(graph: Graph)
{
    const vertices = graph.vertices;
    let isPath: boolean = true;
    let current: Vertex | null = null;
    let prev: Vertex | null = null;
    let orderedVertices: Vertex[] = [];

    for (const v of vertices)
    {
        if (v.neighbors.length > 2 || v.neighbors.length === 0)
        {
            isPath = false;
            break;
        }
        else if (v.neighbors.length === 1)
        {
            current = v;
            break;
        }
    }

    if (isPath && current)
    {
        orderedVertices.push(current);
        prev = current;
        current = current.neighbors[0];
        while (current.neighbors.length === 2)
        {
            // push current in the array
            orderedVertices.push(current);
            // check which of the neighbors is the previous
            if ( prev === current.neighbors[0] )
            {
                prev = current;                     // update prev
                current = current?.neighbors[1];    // update current
            }
            else
            {
                prev = current;                     // update prev
                current = current?.neighbors[0];    // update current
            }
        }
        if ( orderedVertices.length !== vertices.length-1)
            isPath = false;
        else
            orderedVertices.push(current);
    }
    else
        isPath = false;

    return {isPath: isPath, orderedVertices: orderedVertices};
}

function checkCircle(graph: Graph)
{
    const vertices = graph.vertices;
    let isCircle: boolean = true;
    let orderedVertices: Vertex[] = [];

    if (vertices.length < 3)
        isCircle = false;
    vertices.forEach(v => {if(v.neighbors.length !== 2) isCircle = false;})
    if (isCircle)
    {
        const first: Vertex = vertices[0];
        orderedVertices.push(first);
        let prev: Vertex = first;
        let current: Vertex = first.neighbors[0];
        while (current !== first)
        {
            // push current in the array
            orderedVertices.push(current);
            // check which of the neighbors is the previous
            if ( prev === current.neighbors[0] )
            {
                prev = current;                     // update prev
                current = current.neighbors[1];    // update current
            }
            else
            {
                prev = current;                     // update prev
                current = current.neighbors[0];    // update current
            }
        }
        if (orderedVertices.length !== vertices.length)
            isCircle = false;
    }

    return {isCircle: isCircle, orderedVertices: orderedVertices};
}

function checkCircle2(graph: Graph)
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
}

export function starDrawing(graph: Graph)
{
    const circle = checkCircle(graph);
    if (!circle.isCircle)
        showCustomAlert("The graph is not circle.");
    else if (graph.vertices.length%2 === 0)
        showCustomAlert("The circle is not odd.");
    else
    {
        graph.removeBends(false);
        const len = graph.vertices.length;
        // create an array with the vertices in their circular order on the star graph
        let position: number = 0;
        const circularOrdered: Vertex[] = [];
        for (let i=0;i<len;i++)
        {
            circularOrdered.push(circle.orderedVertices[position]);
            position = (position + 2) % len;
        }
        graph.makeCircle(0,0,250,circularOrdered);
    }
}

export function maxRectilinearCircle(graph: Graph)
{
    const circle = checkCircle(graph);
    if (!circle.isCircle)
        showCustomAlert("The graph is not circle.");
    else if (graph.vertices.length%2 === 1)
        showCustomAlert("The circle is not even.");
    else
    {
        graph.removeBends(false);
        const len = graph.vertices.length;
        // create an array with the vertices in their circular order on the star graph
        let position: number = 1;
        const circularOrdered: Vertex[] = [];
        const temp = graph.addNewVertex(0,0);
        circularOrdered.push(temp);
        // odd vertices
        while (position < len/2 )
        {
            circularOrdered.push(circle.orderedVertices[position-1]);
            circularOrdered.push(circle.orderedVertices[len-position-1]);
            position += 2;
        }
        if (len%4 === 2)
            circularOrdered.push(circle.orderedVertices[len/2-1]);
        // even vertices
        circularOrdered.push(circle.orderedVertices[len-1]);    // last vertex
        position = 2;
        while( position < len/2 )
        {
            circularOrdered.push(circle.orderedVertices[position-1]);
            circularOrdered.push(circle.orderedVertices[len-position-1]);
            position += 2;
        }
        if (len%4 === 0)
            circularOrdered.push(circle.orderedVertices[len/2-1]);
        graph.makeCircle(0,0,250,circularOrdered);
        graph.deleteVertex(temp);
    }
}

/* export function runNewAlgorithm(graph: Graph, parameter: number)
{
    
} */