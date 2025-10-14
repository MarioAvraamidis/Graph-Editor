var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { exportCanvasAsImage, exportCanvasAsPdf, exportCanvasWithReportPNG, exportJSON, restoreGraphFromJSON, exportWithReportPDF } from "./exporting.js";
import { showCustomAlert } from "./alert.js";
export class BtnHandler {
    constructor(canvas, graph, canvasHandler, selector, stateHandler, copier, settingsOptions) {
        // this.graph = graph;
        this.myCanvasHandler = canvasHandler;
        this.selector = selector;
        this.stateHandler = stateHandler;
        this.copier = copier;
        this.settingsOptions = settingsOptions;
        // activate event listeners
        this.activateEventListeners(canvas, graph);
    }
    activateEventListeners(canvas, graph) {
        this.addButtonsEventListeners(graph);
        this.addKeydownEventListeners(canvas, graph);
        this.addCheckBoxesEventListeners();
    }
    addKeydownEventListeners(canvas, graph) {
        canvas.tabIndex = 0; // make the canvas focusable
        // console.log("addKeyDownEventListeners");
        document.addEventListener('keydown', (e) => {
            var _a, _b, _c;
            // Get the element that triggered the event
            const targetElement = e.target;
            // Don't activate shortcuts if something else is selected
            if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA' || targetElement.tagName === 'SELECT')
                return;
            // undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault(); // prevent the browser's default undo behavior
                this.undo(graph);
            }
            // redo
            else if ((e.ctrlKey || e.metaKey) && e.key === 'y' || e.shiftKey && (e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                this.redo(graph);
            }
            // copy
            else if ((e.ctrlKey || e.metaKey) && e.key == 'c')
                this.copier.copySelected(this.selector, false);
            // paste
            else if ((e.ctrlKey || e.metaKey) && e.key == 'v') {
                if (this.copier.canPaste()) {
                    this.stateHandler.saveState();
                    this.copier.pasteSelected(graph, this.selector, true);
                    (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
                }
            }
            // delete
            else if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                if (this.selector.points.length > 0 || this.selector.edges.length > 0) {
                    this.stateHandler.saveState();
                    this.selector.deleteSelectedObjects(graph);
                    // checkHovered();
                    // this.selector.setNothingSelected();
                    (_b = this.myCanvasHandler) === null || _b === void 0 ? void 0 : _b.redraw();
                }
            }
            // select all
            else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                this.selector.selectAll(graph);
                // checkHovered();
                (_c = this.myCanvasHandler) === null || _c === void 0 ? void 0 : _c.redraw();
            }
            else
                this.myCanvasHandler.handleKeyDown(e);
        });
    }
    addButtonsEventListeners(graph) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        // Undo button
        (_a = document.getElementById("undo-button")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
            // console.log("Undo Btn");
            this.undo(graph);
        });
        // Redo button
        (_b = document.getElementById("redo-button")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", () => {
            this.redo(graph);
        });
        // Place vertices in a circle (also remove all the bends)
        (_c = document.getElementById("circle-placement")) === null || _c === void 0 ? void 0 : _c.addEventListener("click", () => {
            var _a;
            this.stateHandler.saveState();
            graph.removeBends(false); // don't update crossings here, but below
            if (this.myCanvasHandler.ctx)
                graph.makeCircle(0, 0, Math.min(this.myCanvasHandler.ctx.canvas.height, this.myCanvasHandler.ctx.canvas.width) / 3, this.selector.vertices);
            // renderGraph();
            this.myCanvasHandler.fixView(this.selector);
            (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
        });
        // make the graph (or the group of selected vertices) clique
        (_d = document.getElementById("make-clique")) === null || _d === void 0 ? void 0 : _d.addEventListener("click", () => {
            var _a;
            this.stateHandler.saveState();
            graph.addAllEdges(this.selector.vertices, this.settingsOptions.cliqueNewEdgesColor);
            // renderGraph();
            (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
        });
        // swap the 2 selected points of the graph
        (_e = document.getElementById("swap-points-btn")) === null || _e === void 0 ? void 0 : _e.addEventListener("click", () => {
            if (this.selector.points.length === 2) {
                this.stateHandler.saveState();
                graph.swapPoints(this.selector.points[0], this.selector.points[1]);
                this.myCanvasHandler.redraw();
            }
            else
                showCustomAlert("To swap the coordinates of 2 points, exactly 2 points must be selected.");
        });
        /*document.getElementById("new-circle")?.addEventListener("click", () => {
            this.stateHandler.saveState();
            const tree = graph.merge(newBinaryTree(5));
            this.selector.selectGraph(tree);
            this.myCanvasHandler?.fixView(graph,this.selector);
            this.myCanvasHandler?.redraw();
        });*/
        // make the graph straight line
        (_f = document.getElementById("clear-bends")) === null || _f === void 0 ? void 0 : _f.addEventListener("click", () => {
            var _a;
            this.stateHandler.saveState();
            graph.removeBends();
            // renderGraph();
            (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
        });
        // set up listener for fix view
        (_g = document.getElementById('fix-view')) === null || _g === void 0 ? void 0 : _g.addEventListener('click', () => this.myCanvasHandler.fixView(this.selector));
        // listener for reset view in CanvasHandler.ts
        (_h = document.getElementById('resetViewButton')) === null || _h === void 0 ? void 0 : _h.addEventListener('click', () => this.myCanvasHandler.resetView());
        (_j = document.getElementById("export-json-btn")) === null || _j === void 0 ? void 0 : _j.addEventListener("click", () => {
            exportJSON(graph);
        });
        (_k = document.getElementById("export-image")) === null || _k === void 0 ? void 0 : _k.addEventListener("click", () => {
            if (this.myCanvasHandler.ctx) {
                // drawGraph(this.myCanvasHandler.ctx,this.graph,true,false);
                if (document.getElementById("include-report-in-export").checked)
                    exportCanvasWithReportPNG(this.myCanvasHandler.canvas, graph.report(), this.settingsOptions.crossings_colors);
                else
                    exportCanvasAsImage(this.myCanvasHandler.canvas);
                // drawGraph(this.myCanvasHandler.ctx,this.graph);
            }
        });
        document.getElementById("export-pdf").addEventListener("click", () => {
            if (document.getElementById("include-report-in-export").checked)
                exportWithReportPDF(this.myCanvasHandler.canvas, graph.report(), this.settingsOptions.crossings_colors);
            else
                exportCanvasAsPdf(this.myCanvasHandler.canvas);
            // const includeReport = (document.getElementById("include-report-in-export") as HTMLInputElement).checked;
            // exportCanvasAsPdfWithReport(this.myCanvasHandler.canvas,graph.report(),includeReport);
        });
        (_l = document.getElementById("import-input")) === null || _l === void 0 ? void 0 : _l.addEventListener("change", (e) => __awaiter(this, void 0, void 0, function* () {
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
                this.myCanvasHandler.fixView(this.selector);
            }
            catch (err) {
                alert("Failed to load graph: Invalid format");
                console.error(err);
            }
            finally {
                // ✅ Reset file input so the same file can be uploaded again
                input.value = "";
            }
        }));
    }
    addCheckBoxesEventListeners() {
        const output = document.getElementById("output");
        let checkboxes = output === null || output === void 0 ? void 0 : output.querySelectorAll('input[type="checkbox"]');
        checkboxes === null || checkboxes === void 0 ? void 0 : checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                var _a;
                (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
            });
        });
    }
    undo(graph) {
        var _a;
        this.selector.setNothingSelected();
        graph.replace(this.stateHandler.undo());
        (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
    }
    redo(graph) {
        var _a;
        graph.replace(this.stateHandler.redo());
        (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
    }
}
