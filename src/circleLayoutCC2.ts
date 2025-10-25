import { showCustomAlert } from "./alert.js";
import { Graph } from "./graph.js";
import { Edge, Vertex } from "./graphElements.js";
import { checkPath } from "./layout.js";
import { addBendsToEdge, checkCircle } from "./layoutCircles.js";

export function circleLinearPlacement(graph: Graph/*, ntone: number*/)
{
    const circle = checkCircle(graph);
    if (!circle.isCircle)
        showCustomAlert("Graph is not circle");
    else if (graph.vertices.length === 4)
        showCustomAlert("Thrackle for C4 doesn't exist");
    else 
    {
        const x0=0,y0=0;
        let xDist = 100, yDist = 200;
        if (graph.vertices.length < 10)
            yDist = 100;
        const colors = document.getElementById("change-colors-in-layout") as HTMLInputElement;
        // colors
        if (colors.checked)
            graph.edges.forEach(e => e.color = "#878787");
        // if (ntone%2===0)
           // evenCircleBetweenThrackles(graph,circle.orderedVertices,ntone,colors.checked,x0,y0,xDist,yDist);
        if (graph.vertices.length%2 === 1)
            oddCircleLinearThrackle(graph,circle.orderedVertices,x0,y0,xDist,yDist);
        else
            evenCircleLinearThrackle(graph,circle.orderedVertices,colors.checked,x0,y0,xDist,yDist);
    }
    
}

function evenCircleBetweenThrackles(graph: Graph, orderedVertices: Vertex[], ntone: number, colors: boolean, x0: number = 0, y0: number = 0, xDist: number = 100, yDist: number = 200)
{
    const ordered: Vertex[] = [];
    const len = orderedVertices.length;
    const middle = Math.ceil((len+ntone)/2)-2;
    // vertices 5,7,...,ntone-3
    for (let i=5;i<ntone-2;i+=2)
        ordered.push(orderedVertices[i-1]);
    // vertex len-1
    ordered.push(orderedVertices[len-2]);
    // vertices 4,6, ... , ntone-4
    for (let i=4;i<ntone-1;i+=2)
        ordered.push(orderedVertices[i-1]);
    linearPlacement(graph,ordered,x0,y0,xDist,yDist);
    let limits = addRemainingVerticesEvenCircle(graph,orderedVertices,ntone,xDist);
    placeMainVertices(graph,orderedVertices,limits,x0,y0,xDist,yDist);
    addBends(graph,orderedVertices,colors,xDist,yDist);
}

function addRemainingVerticesEvenCircle(graph: Graph, orderedVertices: Vertex[], ntone: number, xDist: number = 100)
{
    const len = graph.vertices.length;
    const middle = Math.ceil((len+ntone)/2)-2;
    // remove vertices 4,6, ... , ntone-4 to the right
    const verticesDown = middle - (ntone-2);
    for (let i=4;i<ntone-2;i+=2)
        graph.moveVertex(orderedVertices[i-1],orderedVertices[i-1].x+verticesDown*xDist,orderedVertices[i-1].y);
    // add remaining vertices in the downside row
    for (let i=ntone-1;i<=middle;i++)
        graph.moveVertex(orderedVertices[i-1],orderedVertices[i-2].x+xDist,orderedVertices[i-2].y);
    // add remaining vertices to the upside row
    for (let i=middle+1;i<len-1;i++)
        graph.moveVertex(orderedVertices[i-1],orderedVertices[len-2].x+(len-1-i)*xDist,orderedVertices[len-2].y);
    return {firstDown: orderedVertices[ntone-3].x, lastUp: orderedVertices[middle].x};
}

function evenCircleLinearThrackle(graph: Graph, orderedVertices: Vertex[], colors: boolean, x0: number = 0, y0: number = 0, xDist: number = 100, yDist: number = 200)
{
    const ordered: Vertex[] = [];
    const len = orderedVertices.length;
    // even vertices
    for (let i=5;i<len;i+=2)
        ordered.push(orderedVertices[i-1]);
    // odd vertices
    for (let i=4;i<len;i+=2)
        ordered.push(orderedVertices[i-1]);
    let limits = linearPlacement(graph,ordered,x0,y0,xDist,yDist);
    placeMainVertices(graph,orderedVertices,limits,x0,y0,xDist,yDist);
    addBends(graph,orderedVertices,colors,xDist,yDist);
}

// len > 3
function oddCircleLinearThrackle(graph: Graph, orderedVertices: Vertex[],x0: number = 0, y0: number = 0, xDist: number = 100, yDist: number = 200)
{
    graph.removeBends();
    const ordered: Vertex[] = [];
    const len = orderedVertices.length;
    // odd vertices
    for (let i=1;i<len-1;i+=2)
        ordered.push(orderedVertices[i-1]);
    for (let i=2;i<len;i+=2)
        ordered.push(orderedVertices[i-1]);
    linearPlacement(graph,ordered,x0,y0,xDist,yDist);
    graph.moveVertex(orderedVertices[len-1],orderedVertices[Math.max(len-3,1)].x,y0);
    // v_n label
    orderedVertices[len-1].label.offsetX = 20;
    orderedVertices[len-1].label.offsetY = 0;
    if (len < 7)
        graph.moveVertex(orderedVertices[len-1],orderedVertices[1].x+xDist,y0);
}

function addBends(graph: Graph, orderedVertices: Vertex[], colors: boolean, xDist: number = 100, yDist: number = 200)
{
    graph.removeBends();
    const len = orderedVertices.length;
    // define vertices
    const v1 = orderedVertices[0];
    const v2 = orderedVertices[1];
    const v3 = orderedVertices[2];
    const v4 = orderedVertices[3];
    const v_n = orderedVertices[len-1];
    const v_n_1 = orderedVertices[len-2];
    // console.log("v_n:",v_n.id);
    // console.log("v_n_1:",v_n_1.id);
    // define edges
    const edge12 = graph.getEdgeByVertices(v1,v2) as Edge;
    const edge34 = graph.getEdgeByVertices(v3,v4) as Edge;
    const edgeNN = graph.getEdgeByVertices(v_n_1,v_n) as Edge;
    // edge12 bends
    let coords1 = {x: v_n.x+xDist, y: v4.y};
    let coords2 = {x: coords1.x, y: v2.y-yDist};
    addBendsToEdge(graph,edge12,[coords1,coords2],v1);
    // edge34 bends
    coords1 = {x: v3.x, y: v_n.y-yDist};
    coords2 = {x: v1.x-xDist*len/2, y: v2.y};
    addBendsToEdge(graph,edge34,[coords1,coords2],v3);
    // edgeNN bends
    coords1 = {x: v1.x-(v_n_1.x-v1.x)-2*xDist, y: v4.y};
    coords2 = {x: v_n.x, y: v4.y+yDist};
    addBendsToEdge(graph,edgeNN,[coords1,coords2],v_n_1);
    // colors
    if (colors)
    {
        // graph.edges.forEach(e => e.color = "#878787")
        edge12.color = "#13fb3a";
        edge34.color = "blue";
        edgeNN.color = "red";
    }
}

function placeMainVertices(graph: Graph, orderedVertices: Vertex[], limits: any, x0: number = 0, y0: number = 0, xDist: number = 100, yDist: number = 200)
{
    const len = graph.vertices.length;
    graph.moveVertex(orderedVertices[0],limits.firstDown,y0);                   // v1
    if (len <= 10)
        graph.moveVertex(orderedVertices[0],orderedVertices[4].x,y0);
    graph.moveVertex(orderedVertices[1],orderedVertices[4].x-xDist,y0-yDist);           // v2
    graph.moveVertex(orderedVertices[2],limits.lastUp+xDist/2,y0);           // v3
    graph.moveVertex(orderedVertices[len-1],limits.lastUp+xDist,y0-yDist);   // v_n
    // label of v_n
    orderedVertices[len-1].label.offsetX = 0;
    orderedVertices[len-1].label.offsetY = 20;
}

function placeMainVerticess(graph: Graph, orderedVertices: Vertex[], limits: any, x0: number = 0, y0: number = 0, xDist: number = 100, yDist: number = 200)
{
    const len = graph.vertices.length;
    graph.moveVertex(orderedVertices[0],orderedVertices[len-3].x,y0);                   // v1
    // if (len <= 10)
        graph.moveVertex(orderedVertices[0],orderedVertices[4].x,y0);
    graph.moveVertex(orderedVertices[1],orderedVertices[4].x-xDist,y0-yDist);           // v2
    graph.moveVertex(orderedVertices[2],orderedVertices[len-2].x+xDist/2,y0);           // v3
    graph.moveVertex(orderedVertices[len-1],orderedVertices[len-2].x+xDist,y0-yDist);   // v_n
    // label of v_n
    orderedVertices[len-1].label.offsetX = 0;
    orderedVertices[len-1].label.offsetY = 20;
}

function linearPlacement(graph: Graph, orderedVertices: Vertex[], x0: number = 0, y0: number = 0, xDist: number = 100, yDist: number = 200)
{
    const len = orderedVertices.length;
    const half = Math.floor(len/2);     // len should be even integer
    let x = x0;
    // first row
    for (let i=0;i<half;i++)
    {
        graph.moveVertex(orderedVertices[i],x+(1+i/half)*xDist,y0-yDist);
        orderedVertices[i].label.offsetX = 0;
        orderedVertices[i].label.offsetY = 20;
        x = orderedVertices[i].x;
    }
    // second row
    x = x0 + xDist*half/4;
    for (let i=len-1;i>=half;i--)
    {
        graph.moveVertex(orderedVertices[i],x+xDist,y0+yDist);
        orderedVertices[i].label.offsetX = 0;
        orderedVertices[i].label.offsetY = -20;
        x = orderedVertices[i].x;
    }
    return {firstDown: orderedVertices[len-1].x, lastUp: orderedVertices[half-1].x}
}

export function pathLinearPlacement(graph: Graph)
{
    const path = checkPath(graph);
    const ordered: Vertex[] = [];
    if (path.isPath)
    {
        // even vertices
        for (let i=1;i<graph.vertices.length;i+=2)
            ordered.push(path.orderedVertices[i]);
        // odd vertices
        for (let i=0;i<graph.vertices.length;i+=2)
            ordered.push(path.orderedVertices[i]);
        linearPlacement(graph,ordered);
    }
    else
        showCustomAlert("Graph is not path");
}
