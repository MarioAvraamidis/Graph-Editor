import { CanvasHandler } from "./canvasHandler.js";
import { Copier, Selector } from "./selector.js";
import { Graph } from "./graph.js";
import { StateHandler } from "./stateHandler.js";
import { exportCanvasAsImage, exportCanvasAsPdf, exportJSON, restoreGraphFromJSON } from "./exporting.js";
import { SettingsOptions } from "./settings.js";

export class BtnHandler
{
    // private graph: Graph;
    private myCanvasHandler: CanvasHandler;
    private selector: Selector;
    private stateHandler: StateHandler;
    private copier: Copier;
    private settingsOptions: SettingsOptions;

    constructor(graph: Graph, canvasHandler: CanvasHandler, selector: Selector, stateHandler: StateHandler, copier: Copier, settingsOptions: SettingsOptions)
    {
        // this.graph = graph;
        this.myCanvasHandler = canvasHandler;
        this.selector = selector;
        this.stateHandler = stateHandler;
        this.copier = copier;
        this.settingsOptions = settingsOptions;
        // activate event listeners
        this.activateEventListeners(graph);
    }

    private activateEventListeners(graph: Graph)
    {
        this.addButtonsEventListeners(graph);
        this.addKeydownEventListeners(graph);
        this.addCheckBoxesEventListeners();
    }

    private addKeydownEventListeners(graph: Graph)
    {
        // console.log("addKeyDownEventListeners");
        document.addEventListener('keydown', (e) => {
            // Get the element that triggered the event
            const targetElement = e.target as HTMLElement;

            // Don't activate shortcuts if something else is selected
            if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA' || targetElement.tagName === 'SELECT')
                return;

            // undo
            if ((e.ctrlKey || e.metaKey) && e.key==='z')
            {
                e.preventDefault(); // prevent the browser's default undo behavior
                this.selector.setNothingSelected();
                graph.replace(this.stateHandler.undo());
                this.myCanvasHandler?.redraw();
            }
            // redo
            else if ((e.ctrlKey || e.metaKey) && e.key==='y' || e.shiftKey && (e.ctrlKey || e.metaKey) && e.key==='z')
            {
                e.preventDefault();
                graph.replace(this.stateHandler.redo());
                this.myCanvasHandler?.redraw();
            }
            // copy
            else if ((e.ctrlKey || e.metaKey) && e.key=='c')
                this.copier.copySelected(this.selector,false);
            // paste
            else if ((e.ctrlKey || e.metaKey) && e.key=='v')
            {
                if (this.copier.canPaste())
                {
                    this.stateHandler.saveState();
                    this.copier.pasteSelected(graph,this.selector,true);
                    this.myCanvasHandler?.redraw();
                }
            }
            // delete
            else if(e.key==='Delete' || e.key==='Backspace')
            {
                e.preventDefault();
                if (this.selector.points.length > 0 || this.selector.edges.length > 0)
                {
                    this.stateHandler.saveState();
                    this.selector.deleteSelectedObjects(graph);
                    // checkHovered();
                    this.selector.setNothingSelected();
                    this.myCanvasHandler?.redraw();
                }
            }
            // select all
            else if ( (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' )
            {
                e.preventDefault();
                this.selector.selectAll(graph);
                this.selector.pointsUpdate();
                // checkHovered();
                this.myCanvasHandler?.redraw();
            }
        });
    }

    private addButtonsEventListeners(graph: Graph)
    {
        // Undo button
        document.getElementById("undo-button")?.addEventListener("click", () => {
            // console.log("Undo Btn");
            this.selector.setNothingSelected();
            graph.replace(this.stateHandler.undo());
            this.myCanvasHandler?.redraw();
        });
    
        // Redo button
        document.getElementById("redo-button")?.addEventListener("click", () => {
            graph.replace(this.stateHandler.redo());
            this.myCanvasHandler?.redraw();
        });
    
        // Place vertices in a circle (also remove all the bends)
        document.getElementById("circle-placement")?.addEventListener("click", () => {
            this.stateHandler.saveState();
            graph.removeBends(false);   // don't update crossings here, but below
            if (this.myCanvasHandler.ctx)
                graph.makeCircle(0,0,Math.min(this.myCanvasHandler.ctx.canvas.height,this.myCanvasHandler.ctx.canvas.width)/3,this.selector.vertices);
            // renderGraph();
            this.myCanvasHandler.fixView(graph,this.selector);
            this.myCanvasHandler?.redraw();
        })
    
        // make the graph (or the group of selected vertices) clique
        document.getElementById("make-clique")?.addEventListener("click", () => {
            this.stateHandler.saveState();
            graph.addAllEdges(this.selector.vertices,this.settingsOptions.cliqueNewEdgesColor);
            // renderGraph();
            this.myCanvasHandler?.redraw();
        })
    
        // make the graph straight line
        document.getElementById("clear-bends")?.addEventListener("click", () => {
            this.stateHandler.saveState();
            graph.removeBends();
            // renderGraph();
            this.myCanvasHandler?.redraw();
        })
    
        // set up listener for fix view
        document.getElementById('fix-view')?.addEventListener('click', () => this.myCanvasHandler.fixView(graph,this.selector));
    
        // listener for reset view in CanvasHandler.ts
    
        document.getElementById("export-json-btn")?.addEventListener("click", () => {
            exportJSON(graph);
        });
    
        document.getElementById("export-image")?.addEventListener("click", () => {
            if(this.myCanvasHandler.ctx)
            {
                // drawGraph(this.myCanvasHandler.ctx,this.graph,true,false);
                exportCanvasAsImage();
                // drawGraph(this.myCanvasHandler.ctx,this.graph);
            }
        });
    
        document.getElementById("export-pdf")!.addEventListener("click", () => {
            exportCanvasAsPdf(this.myCanvasHandler.canvas);
        });
    
    
        document.getElementById("import-input")!.addEventListener("change", async (e) => {
            const input = e.target as HTMLInputElement;
            if (!input.files || input.files.length === 0) return;
        
            const file = input.files[0];
            const text = await file.text();
        
            try {
                this.stateHandler.saveState();
                this.selector.setNothingSelected();
                const data = JSON.parse(text);
                // console.log(data);
                graph.replace(restoreGraphFromJSON(data));
                // graph = restoreGraphFromJSON(data);
                // renderGraph();
                this.myCanvasHandler?.redraw();
                this.myCanvasHandler.fixView(graph,this.selector);
            } catch (err) {
                alert("Failed to load graph: Invalid format");
                console.error(err);
            }
        });
    }


    private addCheckBoxesEventListeners()
    {
        const output = document.getElementById("output");
        let checkboxes = output?.querySelectorAll('input[type="checkbox"]');
        checkboxes?.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.myCanvasHandler?.redraw();
                // if(ctx)
                    // drawGraph(ctx, graph, true);
            });
        });
        // event-listener for other highlighting crossing edges checkboxes
        for (const id of ["highlight-crossing-edges","highlight-non-crossing-edges"])
        {
            document.getElementById(id)?.addEventListener('change', () => {
                if (this.myCanvasHandler.ctx)
                    // drawGraph(ctx, graph, true);
                    this.myCanvasHandler?.redraw();
            })
        }
    }
}