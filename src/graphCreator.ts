import { Graph, Vertex } from "./graph.js";

export function newPath(n: number)
{
    const path: Graph = new Graph();
    let prev = path.addNewVertex();
    let next;
    for (let i=1;i<n;i++)
    {
        next = path.addNewVertex();
        path.addEdge(prev,next,false);
        prev = next;
    }
    path.straightLine();
    return path;
}

export function newCircle(n: number)
{
    const circle: Graph = new Graph();
    const first = circle.addNewVertex();
    let prev=first, next;
    for (let i=1;i<n;i++)
    {
        next = circle.addNewVertex();
        circle.addEdge(prev,next,false);
        prev = next;
    }
    circle.addEdge(prev,first);
    circle.makeCircle(0,0,200);
    return circle;
}

export function newBinaryTree(h: number, xDiff: number = 10, yDiff: number = 50)
{
    const tree: Graph = new Graph();
    const root: Vertex = tree.addNewVertex(0,0);
    let child1, child2: Vertex;
    let prevLayer: Vertex[] = [], newLayer: Vertex[] = [];
    prevLayer.push(root);
    // create complete binary tree
    for(let i=1;i<h;i++)
    {
        newLayer = [];
        prevLayer.forEach( v => {
            // create children of each vertex
            child1 = tree.addNewVertex(v.x - xDiff*2**(h-i), v.y + yDiff);
            child2 = tree.addNewVertex(v.x + xDiff*2**(h-i), v.y + yDiff);
            // connect the children to the parent
            tree.addEdge(v,child1,false);
            tree.addEdge(v,child2,false);
            // add children to newLayer
            newLayer.push(child1);
            newLayer.push(child2);
        })
        prevLayer = newLayer;   // update prevLayer
    }
    tree.updateCrossings();
    tree.updateCurveComplexity();
    return tree;
}
