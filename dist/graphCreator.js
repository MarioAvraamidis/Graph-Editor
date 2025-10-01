import { Graph } from "./graph.js";
export function createGraph(type, param, labelFontSize = 14) {
    switch (type) {
        case "path":
            return newPath(param, labelFontSize);
        case "cycle":
            return newCircle(param, labelFontSize);
        case "tree":
            return newBinaryTree(param, labelFontSize);
    }
}
function newPath(n, labelFontSize = 14) {
    const path = new Graph();
    let prev = path.addNewVertex();
    prev.label.fontSize = labelFontSize; // label font size from settings
    let next;
    for (let i = 1; i < n; i++) {
        next = path.addNewVertex();
        next.label.fontSize = labelFontSize; // label font size from settings
        path.addEdge(prev, next, false);
        prev = next;
    }
    path.straightLine();
    return path;
}
function newCircle(n, labelFontSize = 14) {
    const circle = new Graph();
    const first = circle.addNewVertex();
    first.label.fontSize = labelFontSize; // label font size from settings
    let prev = first, next;
    for (let i = 1; i < n; i++) {
        next = circle.addNewVertex();
        next.label.fontSize = labelFontSize; // label font size from settings
        circle.addEdge(prev, next, false);
        prev = next;
    }
    circle.addEdge(prev, first);
    circle.makeCircle(0, 0, 100);
    return circle;
}
function newBinaryTree(h, labelFontSize = 14, xDiff = 20, yDiff = 50) {
    const tree = new Graph();
    const root = tree.addNewVertex(0, 0);
    root.label.fontSize = labelFontSize; // label font size from settings
    let child1, child2;
    let prevLayer = [], newLayer = [];
    prevLayer.push(root);
    // create complete binary tree
    for (let i = 1; i <= h; i++) {
        newLayer = [];
        prevLayer.forEach(v => {
            // create children of each vertex
            child1 = tree.addNewVertex(v.x - xDiff * Math.pow(2, (h - i)), v.y + yDiff);
            child2 = tree.addNewVertex(v.x + xDiff * Math.pow(2, (h - i)), v.y + yDiff);
            child1.label.fontSize = labelFontSize; // label font size from settings
            child2.label.fontSize = labelFontSize; // label font size from settings
            // connect the children to the parent
            tree.addEdge(v, child1, false);
            tree.addEdge(v, child2, false);
            // add children to newLayer
            newLayer.push(child1);
            newLayer.push(child2);
        });
        prevLayer = newLayer; // update prevLayer
    }
    // tree.updateCrossings();
    // tree.updateCurveComplexity();
    return tree;
}
