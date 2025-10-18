import { showCustomAlert } from "./alert.js";
import { Graph } from "./graph.js";
import { Bend, Edge, Vertex } from "./graphElements.js";

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

function oddCircleBetweenThrackles(graph: Graph, orderedVertices: Vertex[], ntone: number)
{
    graph.removeBends(false);
    const len = graph.vertices.length;
    let temp = orderedVertices[0]; // temp vertex
    // create an array with the vertices in their circular order on the star graph
    const circularOrdered: Vertex[] = [];
    if (len % 2 === 0){
        temp = graph.addNewVertex();
        circularOrdered.push(temp);
    }
    const middle = Math.ceil((len+ntone)/2);
    // add vertex 1
    circularOrdered.push(orderedVertices[0]);
    //for (let i=len;i>=ntone+1;i--)
      //  circularOrdered.push(orderedVertices[i-1]);
    // add vertices 1,n,n-1,...,middle+1
    for (let i=len;i>middle;i--)
        circularOrdered.push(orderedVertices[i-1]);
    // add odd vertices
    for (let i=3;i<ntone;i+=2)
        circularOrdered.push(orderedVertices[i-1]);
    // vertices middle,middle-1,...,ntone+1
    for (let i=middle;i>ntone;i--)
        circularOrdered.push(orderedVertices[i-1]);
    // vertex ntone
    circularOrdered.push(orderedVertices[ntone-1]);
    // add even vertices
    for (let i=2;i<ntone;i+=2)
        circularOrdered.push(orderedVertices[i-1]);
    graph.makeCircle(0,0,250,circularOrdered);
    if (len % 2 === 0)
        graph.deleteVertex(temp);
    return circularOrdered;
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

export function circleDrawing(graph: Graph, crossings: number)
{
    const circle = checkCircle(graph);
    if (!circle.isCircle)
        showCustomAlert("The graph is not circle.");
    else if (crossings < 0 || crossings > graph.thrackleNumber())
        showCustomAlert("Desired number of crossings out of bounds.");
    else if (graph.vertices.length === 4)
    {
        if (crossings === 2)
            showCustomAlert("Thrackle for C4 doesn't exist");
        else
        {
            graph.makeCircle(0,0,250,circle.orderedVertices);
            graph.swapPoints(circle.orderedVertices[0],circle.orderedVertices[1]);
        }
    }
    else if (crossings <= 2)
    {
        graph.makeCircle(0,0,250,circle.orderedVertices);
        if (crossings > 0)
        graph.swapPoints(circle.orderedVertices[0],circle.orderedVertices[2]);
        if (crossings > 1)
            graph.swapPoints(circle.orderedVertices[0],circle.orderedVertices[1]);
    }
    else
    {
        const ntone = Math.ceil((3+Math.sqrt(9+8*crossings))/2);
        const radius: number = 250;
        let circularOrdered: Vertex[];
        // colors
        const colors = document.getElementById("change-colors-in-layout") as HTMLInputElement;
        if (colors.checked)
            graph.edges.forEach(e => e.color = "#878787")
        // console.log("ntone:",ntone);
        
        let dx = ntone*(ntone-3)/2 - crossings;
        let first: Vertex, second: Vertex;
        if (ntone%2 === 0){
            circularOrdered = betweenEvenCircleThrackles(graph,circle.orderedVertices,ntone);
            first = circle.orderedVertices[1];
            second = circle.orderedVertices[2];
        }
        else
        {
            circularOrdered = oddCircleBetweenThrackles(graph,circle.orderedVertices,ntone);
            first = circle.orderedVertices[2];
            second = circle.orderedVertices[1];
        }
        if (dx%2 === 1)
        {
            dx -= 1;
        }
        if (dx > 0)
            reduceCrossings(graph,ntone,dx,first,second,circularOrdered,radius);
        
    }
}

function findAngle(dy: number, dx: number)
{
    let angle = Math.atan(dy/dx);
    if (dx > 0)
        angle -= Math.PI;
    return angle;
}

// dx should be even
function reduceCrossings(graph: Graph, ntone: number, dx: number, first: Vertex, second: Vertex, circularOrdered: Vertex[],radius:number)
{
    const len = graph.vertices.length;
    const positions = len + 1 - len%2;
    // const v2: Vertex = orderedVertices[1];
    // const v3: Vertex = orderedVertices[2];
    const edge23 = graph.getEdgeByVertices(first,second) as Edge;
    // angle 
    let angle = findAngle(first.y,first.x) - 3*Math.PI/4;
    const dist = 1.45*radius;
    // 1st bend
    let coords1 = {x: dist*Math.cos(angle), y: dist*Math.sin(angle)};
    if (ntone%2 === 0)
    {
        let pos2 = circularOrdered.indexOf(first);
        let next = circularOrdered[pos2+1];
        let distt = Math.sqrt((first.x/2-next.x/2)**2+(first.y-next.y)**2);
        coords1 = extendPoints(first.x,first.y,(next.x+first.x)/2,next.y,distt);
        let ratio = Math.abs(0.9*(dist+first.y)/(first.y-coords1.y));
        coords1 = extendPoints(first.x,first.y,coords1.x,coords1.y,distt*ratio);
    }
    let coords2 = coords1;
    // 2nd bend
    const limit = ntone-4+ntone%2;
    // console.log("dx =",dx);
    if (dx === limit)
    {
        if (ntone%2 === 1)
        {
            let angle = findAngle(second.y,second.x) + 3*Math.PI/4;
            coords2 = {x: dist*Math.cos(angle), y: dist*Math.sin(angle)};
        }
        else if (len > 6)
        {
            const pos3 = circularOrdered.indexOf(second);   // position of v3
            const prev = circularOrdered[pos3-1];
            const prevprev = circularOrdered[pos3-2];
            let dx = prev.x-prevprev.x;
            let dy = prev.y-prevprev.y;
            coords2 = {x: prevprev.x+dx/3, y: prevprev.y+dy/3};
            const ratio = (second.y-coords1.y)/(second.y-coords2.y);
            coords2.x = second.x-ratio*(second.x-coords2.x);
            coords2.y = coords1.y;
        }
    }
    else
    {
        const posFirst = circularOrdered.indexOf(first);
        const bet = dx/2;
        coords2 = {x: (circularOrdered[posFirst+bet].x+circularOrdered[posFirst+bet+1].x)/2,y: (circularOrdered[posFirst+bet].y+circularOrdered[posFirst+bet+1].y)/2};
        if (2*dx >= len-1)
        {
            if (ntone%2 === 0)
            {
                const ratio = (second.y-coords1.y)/(second.y-coords2.y);
                const dist = Math.sqrt((second.x-coords2.x)**2+(second.y-coords2.y)**2);
                coords2 = extendPoints(second.x,second.y,coords2.x,coords2.y,ratio*dist);
            }
            else
            {
                let angle = findAngle(second.y,second.x) + 3*Math.PI/4;
                let coords3 = {x: dist*Math.cos(angle), y: dist*Math.sin(angle)};
                coords2 = lineIntersection(coords1.x,coords1.y,coords3.x,coords3.y,second.x,second.y,coords2.x,coords2.y);
            }
        }
    }
    addBendsToEdge(edge23,[coords1,coords2],first);
    graph.updateCrossingsByEdge(edge23);
    graph.updateCurveComplexity();
}

function betweenEvenCircleThrackles(graph: Graph, orderedVertices: Vertex[], ntone: number = graph.vertices.length)
{
    graph.removeBends(false);
        const len = graph.vertices.length;
        const vert = orderedVertices;
        let temp: Vertex = vert[0]; // temporary vertex
        // create an array with the vertices in their circular order on the thrackle
        const circularOrdered: Vertex[] = [];
        // add a temp vertex to create an odd circle
        if (len%2===0)
        {
            temp = graph.addNewVertex();
            circularOrdered.push(temp);
        }
        // vertex 2
        circularOrdered.push(vert[1]);
        // vertices 5,7,9, ... , n-1
        for (let i=5;i<ntone-1;i+=2)
            circularOrdered.push(vert[i-1]);
        // if (ntone < len)
        circularOrdered.push(vert[len-2]);
        // extra vertices (vertices middle, middle-1, ... , ntone+1)
        const middle = Math.floor((len+ntone)/2);
        for (let i=len-2;i>=middle-1;i--)
            circularOrdered.push(vert[i-1]);
        // vertex n
        circularOrdered.push(vert[len-1]);
        // vertices 3 and 4
        circularOrdered.push(vert[2]);
        if (ntone > 6)
            circularOrdered.push(vert[3]);
        // vertices 6,8, ... , n-2
        for (let i=6;i<ntone-2;i+=2)
            circularOrdered.push(vert[i-1]);
        // extra vertices (vertices len,len-1,...,middle+1)
        for (let i=middle-2;i>ntone-2;i--)
            circularOrdered.push(vert[i-1]);
        // vertex ntone-2
        circularOrdered.push(vert[ntone-3]);
        // vertex 1
        circularOrdered.push(vert[0]);
        const radius = 250;
        graph.makeCircle(0,0,radius,circularOrdered);
        // delete extra vertex if needed
        if (len%2===0){
            graph.deleteVertex(temp);
            circularOrdered.shift();
        }
        // add bends
        evenCircleThrackleBends(graph,vert,ntone,radius);
        return circularOrdered;
}

function evenCircleThrackleBends(graph: Graph, orderedVertices: Vertex[], ntone: number, radius: number)
{
    graph.removeBends(false);
    const len = graph.vertices.length;
    const v1 = orderedVertices[0];
    const v2 = orderedVertices[1];
    const v3 = orderedVertices[2];
    const v4 = orderedVertices[3];
    const v_n = orderedVertices[len-1];
    const v_n_1 = orderedVertices[len-2];
    const v_n_2 = orderedVertices[ntone-3];
    const middle = Math.floor((len+ntone)/2);
    let v_middle_2: Vertex = orderedVertices[middle-2];
    // console.log("v1 =",v1.id,"v2 =",v2.id,"v3 =",v3.id,"v4 =",v4.id,"v_n =",v_n.id,"v_n_1 =",v_n_1.id,"v_n_2 =",v_n_2.id,"lastVertex =",lastVertex.id)
    // edge 3-4 bends
    const edge34 = graph.getEdgeByVertices(v3,v4) as Edge;
    const dist = 2*radius;
    const x34 = -1.65*radius;
    const y34 = -1.5*radius;
    // let coords1 = extendPoints(v3.x,v3.y,(v_n.x+v_n_1.x)/2,(v_n.y+v_n_1.y)/2,2*radius);
    let coords1 = extendPoints(v3.x,v3.y,(v_n.x+v_middle_2.x)/2,(v_n.y+v_middle_2.y)/2,2*radius);
    coords1 = extendPoints(v3.x,v3.y,coords1.x,coords1.y,dist*(y34-v3.y)/(coords1.y-v3.y));
    let coords3 = extendPoints(v4.x,v4.y,(v1.x+v_n_2.x)/2,(v1.y+v_n_2.y)/2,dist);
    coords3 = extendPoints(v4.x,v4.y,coords3.x,coords3.y,dist*(v4.x-x34)/(v4.x-coords3.x));
    let coords2 = {x: coords3.x, y: coords1.y};
    if (ntone === 6) // && graph.vertices.length === 6
       coords3.y = v4.y;
    addBendsToEdge(edge34,[coords1,coords2,coords3],v3);
    // edge 1-2 bends
    const edge12 = graph.getEdgeByVertices(v1,v2) as Edge;
    const x12 = 1.3*radius;
    const y12 = -1.65*radius;
    let vAfter3: Vertex = v4;
    if (ntone === 6)
        vAfter3 = orderedVertices[middle-3];
    coords1 = extendPoints(v1.x,v1.y,(v3.x+vAfter3.x)/2,(v3.y+vAfter3.y)/2,dist);
    coords1 = extendPoints(v1.x,v1.y,coords1.x,coords1.y,dist*(x12-v1.x)/(coords1.x-v1.x));
    coords2 = {x: coords1.x, y: y12};
    coords3 = {x: v2.x, y: coords2.y};
    if (ntone === 6 && graph.vertices.length === 6)
        coords1.y = v1.y;
    addBendsToEdge(edge12,[coords1,coords2,coords3],v1);
    // edge (n-2,n-1) bends
    const edgeN = graph.getEdgeByVertices(v_n_1,v_n) as Edge;
    const xn = -1.5*radius;
    const yn = 1.5*radius;
    const xNN: number = coords1.x;
    // const xNN = 1.5*radius;
    coords1 = extendPoints(v_n_1.x,v_n_1.y,(v1.x+v2.x)/2,(v1.y+v2.y)/2,dist);
    const factor = (xn-v_n_1.x)/(coords1.x-v_n_1.x);
    if (factor < 1.5)
       coords1 = extendPoints(v_n_1.x,v_n_1.y,coords1.x,coords1.y,dist*factor);
    coords2 = {x: coords1.x, y: yn};
    coords3 = {x: xNN, y: coords2.y };
    if (ntone === 6) //  && graph.vertices.length === 6
        //coords1.y -= radius;
        coords1.y = Math.max(coords2.y-radius/2,coords1.y-radius);
    if (coords1.y > coords2.y)
        addBendsToEdge(edgeN,[coords1,coords3],v_n_1);
    else    
        addBendsToEdge(edgeN,[coords1,coords2,coords3],v_n_1);
    // highlight bended edges
    const colors = document.getElementById("change-colors-in-layout") as HTMLInputElement;
    if (colors.checked)
    {
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
function addBendsToEdge(edge: Edge, points: {x: number, y: number}[], firstVertex: Vertex)
{
    if (edge.points[0] === firstVertex)
        for (const p of points)
            edge.addBend(p.x,p.y,false);
            // graph.addBend(firstVertex,edge.points[1] as Vertex,p.x,p.y,false,false); Proper command using graph's methods
    else
        for (let i = points.length-1;i>=0;i--)
            edge.addBend(points[i].x,points[i].y,false);
}

/**
 * Starting from (x1,y1), draw a line that passes through (x2,y2) and return the point at distance d from (x1,y1)
 */
function extendPoints(x1: number, y1: number, x2: number, y2: number, d: number): {x: number, y: number}
{
    // console.log("extendPoints");
    // console.log("x1 =",x1,"x2 =",x2,"y1 =",y1,"y2 =",y2);
    const dy = y2 - y1;
    const dx = x2 - x1;
    if (dx === 0)
    {
        if ( y2 > y1 )
            return {x: x1, y: y1 + d}
        return {x: x1, y: y1 - d};
    }
    const angle = Math.abs(Math.atan(dy/dx));
    // console.log("angle = ",angle);
    return {x: x1 + d*Math.cos(angle)*Math.sign(x2-x1), y: y1 + d*Math.sin(angle)*Math.sign(y2-y1)};
}

function lineIntersection(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number) {

  // Compute the determinant
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  /*if (Math.abs(denom) < 1e-10) {
    // Lines are parallel or coincident
    return null;
  }*/

  const px =
    ((x1 * y2 - y1 * x2) * (x3 - x4) -
      (x1 - x2) * (x3 * y4 - y3 * x4)) /
    denom;
  const py =
    ((x1 * y2 - y1 * x2) * (y3 - y4) -
      (y1 - y2) * (x3 * y4 - y3 * x4)) /
    denom;

  return { x: px, y: py };
}


export function evenCircleThrackle(graph: Graph)
{
    const circle = checkCircle(graph);
    if (!circle.isCircle)
        showCustomAlert("The graph is not circle.");
    else if (graph.vertices.length%2 === 1)
        showCustomAlert("The circle is not even.");
    else if (graph.vertices.length === 4)
        showCustomAlert("Thrackle for C4 does not exist.")
    else
    {
        graph.removeBends(false);
        const len = graph.vertices.length;
        const vert = circle.orderedVertices;
        // create an array with the vertices in their circular order on the thrackle
        const circularOrdered: Vertex[] = [];
        // add a temp vertex to create an odd circle
        const temp = graph.addNewVertex();
        circularOrdered.push(temp);
        // vertices 1 and 2
        // circularOrdered.push(vert[0]);
        circularOrdered.push(vert[1]);
        // vertices 5,7,9, ... , n-1
        for (let i=5;i<len;i+=2)
            circularOrdered.push(vert[i-1]);
        // vertex n
        circularOrdered.push(vert[len-1]);
        // vertices 3 and 4
        circularOrdered.push(vert[2]);
        circularOrdered.push(vert[3]);
        // vertices 6,8, ... , n-2
        for (let i=6;i<len;i+=2)
            circularOrdered.push(vert[i-1]);
        circularOrdered.push(vert[0]);
        const radius = 250;
        graph.makeCircle(0,0,radius,circularOrdered);
        graph.deleteVertex(temp);
        // add bends
        evenCircleThrackleBends(graph,vert,len,radius);
    }
}


/* export function runNewAlgorithm(graph: Graph, parameter: number)
{
    
} */