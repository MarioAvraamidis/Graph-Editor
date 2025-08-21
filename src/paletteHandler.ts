import { CanvasHandler } from "./canvasHandler";
import { Graph } from "./graph";
import { Selector } from "./selector";
import { SettingsOptions } from "./settings";
import { StateHandler } from "./stateHandler";

export class PaletteHandler
{

    // Palette for vertices
    private vertexColor = document.getElementById("vertex-color") as HTMLSelectElement
    private vertexShapeButtons = document.querySelectorAll(".shape-button");
    private vertexSize = document.getElementById("vertex-size") as HTMLInputElement;
    private deleteVertexBtn = document.getElementById("delete-vertex-palette") as HTMLButtonElement;
    // Palette for bends
    private bendColor = document.getElementById("bend-color") as HTMLSelectElement
    // const bendShape = document.getElementById("bend-shape") as HTMLSelectElement;
    private bendSize = document.getElementById("bend-size") as HTMLInputElement;
    private deleteBendBtn = document.getElementById("delete-bend") as HTMLButtonElement;
    // Palette for Edges
    private deleteEdgeBtn = document.getElementById("delete-edge-palette") as HTMLButtonElement;
    private edgeThickness = document.getElementById("edge-thickness") as HTMLInputElement;
    private edgeColor = document.getElementById("edge-color") as HTMLSelectElement;

    // Collapse palettes
    private vertexPalette = document.getElementById('vertex-palette');
    private edgePalette = document.getElementById('edge-palette');
    private bendPalette = document.getElementById('bend-palette');

    // show labels
    private showVertexLabels = document.getElementById("vertex-show-labels") as HTMLInputElement;
    private showEdgeLabels = document.getElementById("edge-show-labels") as HTMLInputElement;

    // helpers
    private selector: Selector;
    private myCanvasHandler: CanvasHandler;
    private stateHandler: StateHandler
    private graph: Graph
    private settingsOptions: SettingsOptions;

    constructor(selector: Selector, myCanvasHandler: CanvasHandler, stateHandler: StateHandler, graph: Graph, settingsOptions: SettingsOptions)
    {
        this.selector = selector;
        this.myCanvasHandler = myCanvasHandler;
        this.stateHandler = stateHandler;
        this.graph = graph;
        this.settingsOptions = settingsOptions;
        this.activateEventListeners();
        this.updatePaletteState();
        this.addDashedEdgeEventListeners();
        this.collapse();
    }

    private activateEventListeners()
    {
        // using palettes
        this.vertexColor.addEventListener("change", () => {
            // update selected vertices' color
            if (this.selector.vertices.length > 0)
            {
                this.stateHandler.saveState();
                this.selector.vertices.forEach(v => v.color = this.vertexColor.value);
                // renderGraph();
                this.myCanvasHandler?.redraw();
            }
            // set the color for new vertices
            else
                this.settingsOptions.vertexChars.color = this.vertexColor.value;
        });

        // vertex shape buttons
        this.vertexShapeButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
            // Remove active class from all buttons
            this.vertexShapeButtons.forEach(b => b.classList.remove("active"));
        
            // Add active to the clicked one
            btn.classList.add("active");
        
            const selectedShape = btn.getAttribute("data-shape");
            
            if (this.selector.vertices.length > 0 && btn.classList)   // update shape of selected vertices
            {
                this.stateHandler.saveState();
                this.selector.vertices.forEach(v => v.shape = selectedShape!)
                // renderGraph();
                this.myCanvasHandler?.redraw();
            }
            // update new vertex shape
            this.settingsOptions.vertexChars.shape = selectedShape!;
            });
        });

        // vertex size
        this.vertexSize.addEventListener("input", () => {
            const size = parseInt(this.vertexSize.value);
            if (this.selector.vertices.length > 0)
            {
                this.stateHandler.saveState();
                this.selector.vertices.forEach(v => v.size = size);
                // renderGraph();
                this.myCanvasHandler?.redraw();
            }
            else
                this.settingsOptions.vertexChars.size = size;
        });

        // Vertex rename
        document.getElementById("rename-vertex")?.addEventListener("click", () => {
            const input = (document.getElementById("vertexIdInput") as HTMLInputElement).value.trim();
            if (input && this.selector.vertices.length===1) {
                this.stateHandler.saveState();
                const selectedVertex = this.selector.vertices[0];
                this.graph.renameVertex(selectedVertex,input);
                // renderGraph();
                this.myCanvasHandler?.redraw();
            }
        });

        // Show label checkbox
        this.showVertexLabels?.addEventListener("change", () => {
            if (this.selector.vertices.length > 0)
            {
                this.stateHandler.saveState();
                this.selector.vertices.forEach(vertex => vertex.label.showLabel = this.showVertexLabels.checked);
                this.myCanvasHandler.redraw();
            }
        })
        
        // Show label checkbox
        this.showEdgeLabels?.addEventListener("change", () => {
            if (this.selector.edges.length > 0)
            {
                this.stateHandler.saveState();
                this.selector.edges.forEach(edge => edge.label.showLabel = this.showEdgeLabels.checked);
                this.myCanvasHandler.redraw();
            }
        })

        // bend color
        this.bendColor.addEventListener("change", () => {
            if (this.selector.bends.length > 0)   // apply change on selected bends
            {
                this.stateHandler.saveState();
                this.selector.bends.forEach(b => b.color = this.bendColor.value);
                // renderGraph();
                this.myCanvasHandler?.redraw();
            }
            else    // set color for new bends
                this.settingsOptions.bendChars.color = this.bendColor.value;
        });

        // bend size
        this.bendSize.addEventListener("input", () => {
            const size = parseInt(this.bendSize.value);
            if (this.selector.bends.length > 0)
            {
                this.stateHandler.saveState();
                this.selector.bends.forEach(b => b.size = size);
                // renderGraph();
                this.myCanvasHandler?.redraw();
            }
            else
                this.settingsOptions.bendChars.size = size;
        });

        // edge color
        this.edgeColor.addEventListener("change", () => {
            if (this.selector.edges.length > 0)
            {
                this.stateHandler.saveState();
                this.selector.edges.forEach(e => e.color = this.edgeColor.value);
                // renderGraph();
                this.myCanvasHandler?.redraw();
            }
            else
                this.settingsOptions.edgeChars.color = this.edgeColor.value;
        });

        // edge thickness
        this.edgeThickness.addEventListener("input", () => {
            if (this.selector.edges.length > 0)
            {
                this.stateHandler.saveState();
                this.selector.edges.forEach(e => e.thickness = parseInt(this.edgeThickness.value))
                // renderGraph();
                this.myCanvasHandler?.redraw();
            }
            else
                this.settingsOptions.edgeChars.thickness = parseInt(this.edgeThickness.value);
        });

        // delete vertex button
        this.deleteVertexBtn.addEventListener("click", () => {
            this.stateHandler.saveState();
            this.selector.deleteSelectedVertices(this.graph);
            this.selector.pointsUpdate();
            // renderGraph();
            this.myCanvasHandler?.redraw();
        });

        // delete bend button
        this.deleteBendBtn.addEventListener("click", () => {
            this.stateHandler.saveState();
            this.selector.deleteSelectedBends(this.graph);
            this.selector.pointsUpdate();
            // renderGraph();
            this.myCanvasHandler?.redraw();
        });

        // delete edge button
        this.deleteEdgeBtn.addEventListener("click", () => {
            this.stateHandler.saveState();
            this.selector.deleteSelectedEdges(this.graph);
            this.selector.pointsUpdate();
            // renderGraph();
            this.myCanvasHandler?.redraw();
        });
    }

    private collapse()
    {
        for (const palette of [this.vertexPalette, this.edgePalette, this.bendPalette])
            if (palette) {
                const paletteHeader = palette.querySelector('.palette-header') as HTMLElement;
                const paletteContent = palette.querySelector('.palette-content') as HTMLElement;

                if (paletteHeader && paletteContent) {
                    paletteHeader.addEventListener('click', () => {
                        // Toggle the 'collapsed' class on the main palette div
                        palette.classList.toggle('collapsed');
                    });
                }
            }

        // Initially collapse the bend-palette
        if(this.bendPalette)
            this.bendPalette.classList.add('collapsed');
    }

    private addDashedEdgeEventListeners(): void {
        // Get references to the specific buttons and their common parent
        const toggleContinuousButton = document.getElementById('toggle-continuous') as HTMLButtonElement;
        const toggleDashedButton = document.getElementById('toggle-dashed') as HTMLButtonElement;
        const edgeStyleButtonsContainer = document.querySelector('.edge-style-buttons'); // Get the wrapper div

        if (edgeStyleButtonsContainer) {
            edgeStyleButtonsContainer.addEventListener('click', (event) => {
                const clickedButton = event.target as HTMLElement;

                // Ensure a button with the 'edge-style-button' class was clicked
                const actualButton = clickedButton.closest('.edge-style-button') as HTMLButtonElement;

                if (actualButton) {
                    // Remove 'active' class from all buttons in the group
                    const allStyleButtons = edgeStyleButtonsContainer.querySelectorAll('.edge-style-button');
                    allStyleButtons.forEach(button => {
                        button.classList.remove('active');
                    });

                    // Add 'active' class to the clicked button
                    actualButton.classList.add('active');

                    // --- Your logic for handling the selected style ---
                    if (actualButton.id === 'toggle-continuous') {
                        this.settingsOptions.edgeChars.dashed = false;
                    } else if (actualButton.id === 'toggle-dashed') {
                        this.settingsOptions.edgeChars.dashed = true;
                    }

                    // update type of selected edges
                    if (this.selector.edges.length > 0)
                    {
                        this.stateHandler.saveState();
                        this.selector.edges.forEach(e => e.dashed = this.settingsOptions.edgeChars.dashed);
                    }

                    // You might want to trigger a redraw of your canvas here to apply the style immediately
                    this.myCanvasHandler?.redraw();
                }
            });
        }
    }

    public updatePaletteState() {

        /*const vertexPalette = document.getElementById("vertex-palette")!;
        const edgePalette = document.getElementById("edge-palette")!;
        const bendPalette = document.getElementById("bend-palette")!;
        const vertexShape = document.getElementById("vertex-shape")!;*/
        const vertexColorPicker = document.getElementById("vertex-color") as HTMLInputElement;
        const edgeColorPicker = document.getElementById("edge-color") as HTMLInputElement;
        const bendColorPicker = document.getElementById("bend-color") as HTMLInputElement;
        // dashed edge buttons
        const toggleContinuousButton = document.getElementById('toggle-continuous') as HTMLButtonElement;
        const toggleDashedButton = document.getElementById('toggle-dashed') as HTMLButtonElement;
        
        const vertexSelected = this.selector.vertices.length > 0;
        const edgeSelected = this.selector.edges.length > 0;
        const bendSelected = this.selector.bends.length > 0;
        
        // disable color pickers
        // vertexColorPicker.disabled = !vertexSelected;
        // edgeColorPicker.disabled = !edgeSelected;
        // bendColorPicker.disabled = !bendSelected;
        
        // vertexPalette.classList.toggle("disabled", !vertexSelected);
        // bendPalette.classList.toggle("disabled", !bendSelected);
        // edgePalette.classList.toggle("disabled", !edgeSelected);

        if (vertexSelected) {
            const v = this.selector.vertices[this.selector.vertices.length - 1]; // use last selected
            vertexColorPicker.value = v.color;
            this.vertexSize.value = v.size.toString();
            this.showVertexLabels.checked = v.label.showLabel;
            // Enable shape buttons
            this.vertexShapeButtons.forEach(btn => {
                btn.removeAttribute("disabled");
                btn.classList.remove("active");
    
                // Highlight the correct shape button
                if (btn.getAttribute("data-shape") === v.shape) {
                btn.classList.add("active");
                }
            });
        }
        else    // show default values on palette
        {
            vertexColorPicker.value = this.settingsOptions.vertexChars.color;
            this.vertexSize.value = this.settingsOptions.vertexChars.size.toString();
            this.vertexShapeButtons.forEach(btn => {
                btn.removeAttribute("disabled");
                btn.classList.remove("active");
    
                // Highlight the correct shape button
                if (btn.getAttribute("data-shape") === this.settingsOptions.vertexChars.shape) {
                btn.classList.add("active");
                }
            });
        }
        this.updateRenameControls(this.selector.vertices.length === 1);

        if (bendSelected) {
            const b = this.selector.bends[this.selector.bends.length - 1]; // use last selected
            bendColorPicker.value = b.color;
            // bendShape.value = b.shape;
            this.bendSize.value = b.size.toString();
        }
        else{
            bendColorPicker.value = this.settingsOptions.bendChars.color;
            this.bendSize.value = this.settingsOptions.bendChars.size.toString();
        }
        
        if (edgeSelected) {
            const e = this.selector.edges[this.selector.edges.length-1]
            edgeColorPicker.value = e.color;
            this.edgeThickness.value = e.thickness.toString();
            // show label checkbox
            this.showEdgeLabels.checked = e.label.showLabel;
            // update dashed edge buttons
            if (e.dashed)
            {
                toggleContinuousButton?.classList.remove("active");
                toggleDashedButton?.classList.add("active");
            }
            else
            {
                toggleContinuousButton?.classList.add("active");
                toggleDashedButton?.classList.remove("active");
            }
            // update toggle-dashed button
            /*if (e.dashed)
                toggle_dashed_btn?.classList.add("active");
            else
                toggle_dashed_btn?.classList.remove("active");*/
        }
        else
        {
            edgeColorPicker.value = this.settingsOptions.edgeChars.color;
            this.edgeThickness.value = this.settingsOptions.edgeChars.thickness.toString();
                    // update dashed edge buttons
            if (this.settingsOptions.edgeChars.dashed)
            {
                toggleContinuousButton?.classList.remove("active");
                toggleDashedButton?.classList.add("active");
            }
            else
            {
                toggleContinuousButton?.classList.add("active");
                toggleDashedButton?.classList.remove("active");
            }
            // update toggle-dashed button
            /*if (edgeChars.dashed)
                toggle_dashed_btn?.classList.add("active");
            else
                toggle_dashed_btn?.classList.remove("active");*/
        }
    }

    private updateRenameControls(enabled: boolean) 
    {
        const input = document.getElementById("vertexIdInput") as HTMLInputElement;
        const button = document.getElementById("rename-vertex") as HTMLButtonElement;
    
        input.disabled = !enabled;
        button.disabled = !enabled;
    }  
}