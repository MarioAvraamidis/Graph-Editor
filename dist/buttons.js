var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { exportCanvasAsPdf, exportGraph, restoreGraphFromJSON } from "./exporting.js";
export class BtnHandler {
    constructor(graph, canvasHandler, selector, stateHandler, copier, modalsHandler) {
        // this.graph = graph;
        this.myCanvasHandler = canvasHandler;
        this.selector = selector;
        this.stateHandler = stateHandler;
        this.copier = copier;
        this.modalsHandler = modalsHandler;
        // activate event listeners
        this.activateEventListeners(graph);
    }
    activateEventListeners(graph) {
        this.addButtonsEventListeners(graph);
        this.addKeydownEventListeners(graph);
        this.addCheckBoxesEventListeners();
    }
    addKeydownEventListeners(graph) {
        // console.log("addKeyDownEventListeners");
        document.addEventListener('keydown', (e) => {
            var _a, _b, _c, _d, _e;
            // Get the element that triggered the event
            const targetElement = e.target;
            // Don't activate shortcuts if something else is selected
            if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA' || targetElement.tagName === 'SELECT')
                return;
            // undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault(); // prevent the browser's default undo behavior
                this.selector.setNothingSelected();
                graph.replace(this.stateHandler.undo());
                (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
            }
            // redo
            else if ((e.ctrlKey || e.metaKey) && e.key === 'y' || e.shiftKey && (e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                graph.replace(this.stateHandler.redo());
                (_b = this.myCanvasHandler) === null || _b === void 0 ? void 0 : _b.redraw();
            }
            // copy
            else if ((e.ctrlKey || e.metaKey) && e.key == 'c')
                this.copier.copySelected(this.selector, false);
            // paste
            else if ((e.ctrlKey || e.metaKey) && e.key == 'v') {
                if (this.copier.selectedVertices.length > 0) {
                    this.stateHandler.saveState();
                    this.copier.pasteSelected(graph, this.selector, true);
                    (_c = this.myCanvasHandler) === null || _c === void 0 ? void 0 : _c.redraw();
                }
            }
            // delete
            else if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                if (this.selector.points.length > 0 || this.selector.edges.length > 0) {
                    this.stateHandler.saveState();
                    this.selector.deleteSelectedObjects(graph);
                    // checkHovered();
                    this.selector.setNothingSelected();
                    (_d = this.myCanvasHandler) === null || _d === void 0 ? void 0 : _d.redraw();
                }
            }
            // select all
            else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                this.selector.selectAll(graph);
                this.selector.pointsUpdate();
                // checkHovered();
                (_e = this.myCanvasHandler) === null || _e === void 0 ? void 0 : _e.redraw();
            }
        });
    }
    addButtonsEventListeners(graph) {
        var _a, _b, _c, _d, _e, _f;
        // Undo button
        (_a = document.getElementById("undo-button")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
            var _a;
            // console.log("Undo Btn");
            this.selector.setNothingSelected();
            graph.replace(this.stateHandler.undo());
            (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
        });
        // Redo button
        (_b = document.getElementById("redo-button")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", () => {
            var _a;
            graph.replace(this.stateHandler.redo());
            (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
        });
        // Place vertices in a circle (also remove all the bends)
        (_c = document.getElementById("circle-placement")) === null || _c === void 0 ? void 0 : _c.addEventListener("click", () => {
            var _a;
            this.stateHandler.saveState();
            graph.removeBends(false); // don't update crossings here, but below
            if (this.myCanvasHandler.ctx)
                graph.makeCircle(0, 0, Math.min(this.myCanvasHandler.ctx.canvas.height, this.myCanvasHandler.ctx.canvas.width) / 3, this.selector.vertices);
            // renderGraph();
            this.myCanvasHandler.fixView(graph, this.selector);
            (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
        });
        // make the graph (or the group of selected vertices) clique
        (_d = document.getElementById("make-clique")) === null || _d === void 0 ? void 0 : _d.addEventListener("click", () => {
            var _a;
            this.stateHandler.saveState();
            graph.addAllEdges(this.selector.vertices, this.modalsHandler.settingsOptions.cliqueNewEdgesColor);
            // renderGraph();
            (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
        });
        // make the graph straight line
        (_e = document.getElementById("clear-bends")) === null || _e === void 0 ? void 0 : _e.addEventListener("click", () => {
            var _a;
            this.stateHandler.saveState();
            graph.removeBends();
            // renderGraph();
            (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
        });
        // set up listener for fix view
        (_f = document.getElementById('fix-view')) === null || _f === void 0 ? void 0 : _f.addEventListener('click', () => this.myCanvasHandler.fixView(graph, this.selector));
        // listener for reset view in CanvasHandler.ts
        document.getElementById("export-json-btn").addEventListener("click", () => {
            exportGraph(graph);
        });
        /*document.getElementById("export-image")!.addEventListener("click", () => {
            if(this.myCanvasHandler.ctx)
            {
                drawGraph(this.myCanvasHandler.ctx,this.graph,true,false);
                exportCanvasAsImage();
                drawGraph(this.myCanvasHandler.ctx,this.graph);
            }
        });*/
        document.getElementById("export-pdf").addEventListener("click", () => {
            exportCanvasAsPdf(this.myCanvasHandler.canvas);
        });
        document.getElementById("import-input").addEventListener("change", (e) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const input = e.target;
            if (!input.files || input.files.length === 0)
                return;
            const file = input.files[0];
            const text = yield file.text();
            try {
                this.stateHandler.saveState();
                this.selector.setNothingSelected();
                const data = JSON.parse(text);
                // console.log(data);
                graph.replace(restoreGraphFromJSON(data));
                // graph = restoreGraphFromJSON(data);
                // renderGraph();
                (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
                this.myCanvasHandler.fixView(graph, this.selector);
            }
            catch (err) {
                alert("Failed to load graph: Invalid format");
                console.error(err);
            }
        }));
    }
    addCheckBoxesEventListeners() {
        var _a;
        const output = document.getElementById("output");
        let checkboxes = output === null || output === void 0 ? void 0 : output.querySelectorAll('input[type="checkbox"]');
        checkboxes === null || checkboxes === void 0 ? void 0 : checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                var _a;
                (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
                // if(ctx)
                // drawGraph(ctx, graph, true);
            });
        });
        // event-listener for other highlighting crossing edges checkboxes
        for (const id of ["highlight-crossing-edges", "highlight-non-crossing-edges"]) {
            (_a = document.getElementById(id)) === null || _a === void 0 ? void 0 : _a.addEventListener('change', () => {
                var _a;
                if (this.myCanvasHandler.ctx)
                    // drawGraph(ctx, graph, true);
                    (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
            });
        }
    }
}
