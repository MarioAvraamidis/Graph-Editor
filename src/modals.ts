import { CanvasHandler } from "./canvasHandler.js";
import { SettingsOptions } from "./settings.js";
import { Graph } from "./graph.js";
import { Hover, Selector } from "./selector.js";
import { StateHandler } from "./stateHandler.js";
import { createGraph } from "./graphCreator.js";
import { Point, Vertex } from "./graphElements.js";

export class ModalsHandler
{
    // edit label modal
    private editLabelModal: HTMLElement;
    private editLabelCloseButton: HTMLElement;
    private labelContentInput: HTMLInputElement;
    private labelFontSizeInput: HTMLInputElement;
    private saveLabelButton: HTMLButtonElement;
    private editLabelChanges: boolean = false;
    // settings modal
    private settingsModal: HTMLElement;
    private settingsCloseButton: HTMLElement; // HTMLButtonElement
    private settingsSaveButton: HTMLElement; // same
    private settingsCrossingsColorInput: HTMLInputElement[] = [];       // crossings colors
    private settingsCrossingEdgesColorInput: HTMLInputElement[] = [];   // crossing edges colors
    private settingsCliqueNewEdgesColorInput: HTMLInputElement;          // clique new edges color
    private settingsLabelDefaultFonstSizeInput: HTMLInputElement;       // default label font size settings
    private settingsAllowSelfLoops: HTMLInputElement;                   // allow or not self loops for the graph
    private settingsAllowParallelEdges: HTMLInputElement;               // allow or not parallel edges for the graph
    // new graph modal
    private newGraphModal: HTMLElement = document.getElementById('newGraphModal') as HTMLElement;
    private newGraphCloseButton: HTMLElement = this.newGraphModal.querySelector('.close-button') as HTMLElement;
    // settingsOptions
    public settingsOptions: SettingsOptions;

    constructor(graph: Graph, myCanvasHandler: CanvasHandler, stateHandler: StateHandler, hover: Hover, settingsOptions: SettingsOptions, selector: Selector)
    {
        // edit label modal elements
        this.editLabelModal = document.getElementById('editLabelModal') as HTMLElement;
        this.editLabelCloseButton = this.editLabelModal.querySelector('.close-button') as HTMLElement;
        this.labelContentInput = document.getElementById('labelContentInput') as HTMLInputElement;
        this.labelFontSizeInput = document.getElementById('labelFontSizeInput') as HTMLInputElement;
        this.saveLabelButton = document.getElementById('saveLabelButton') as HTMLButtonElement;
        // settings modal elements
        this.settingsModal = document.getElementById('settingsModal') as HTMLElement;
        this.settingsCloseButton = this.settingsModal.querySelector('.close-button') as HTMLElement;
        this.settingsSaveButton = document.getElementById('settingsSaveButton') as HTMLElement;
        // crossings colors settings elements
        for (const btn of ['crossings-colors-self','crossings-colors-neighbor','crossings-colors-multiple','crossings-colors-legal'])
            this.settingsCrossingsColorInput.push(document.getElementById(btn) as HTMLInputElement)
        // crossing edges colors settings elements
        for (const btn of ['crossing-edges-color','non-crossing-edges-color'])
            this.settingsCrossingEdgesColorInput.push(document.getElementById(btn) as HTMLInputElement);
        // clique new edges color
        this.settingsCliqueNewEdgesColorInput = document.getElementById('clique-new-edges-color') as HTMLInputElement;
        // default label font size settings
        this.settingsLabelDefaultFonstSizeInput = document.getElementById('labelDefaultFontSizeInput') as HTMLInputElement;
        // self-loops and parallel edges
        this.settingsAllowSelfLoops = document.getElementById('self-loops') as HTMLInputElement;
        this.settingsAllowParallelEdges = document.getElementById('parallel-edges') as HTMLInputElement;
        // settingsOptions
        this.settingsOptions = settingsOptions;
        this.addEventListeners(graph,myCanvasHandler,stateHandler,hover,selector);
        this.hideAllModals();
    }

    public addEventListeners(graph: Graph,myCanvasHandler: CanvasHandler, stateHandler: StateHandler, hover: Hover, selector: Selector)
    {
        // listener for settings button
        document.getElementById('settingsBtn')?.addEventListener('click', () => this.showSettingsModal(this.settingsOptions,graph));
        // listener for new graph button
        document.getElementById('newGraphBtn')?.addEventListener('click', () => this.showNewGraphModal() );
         // listner for settings savebutton
        this.settingsSaveButton?.addEventListener('click', () => {
            if (this.settingsCrossingsColorInput)
            {
                // console.log("clicked settings save button");
                // saveState();
                this.settingsOptions.edit_crossings_colors(this.settingsCrossingsColorInput);
                this.settingsOptions.edit_crossing_edges_colors(this.settingsCrossingEdgesColorInput);
                this.settingsOptions.edit_cliqueNewEdgesColor(this.settingsCliqueNewEdgesColorInput.value);
                this.settingsOptions.edit_defaultLabelFontSize(parseInt(this.settingsLabelDefaultFonstSizeInput.value));
                myCanvasHandler?.redraw();
            }
            //hideSettingsModal();
            this.hideAllModals();
        });

        this.labelContentInput?.addEventListener('change', () => { this.editLabelChanges = true; console.log("label content change") })
        this.labelFontSizeInput?.addEventListener('change', () => {this.editLabelChanges = true; console.log("label size change") } )
        this.settingsAllowSelfLoops?.addEventListener('change', () => {
            // const v: Vertex | null = graph.checkSelfLoops();
            // if(v)
               // showCustomAlert("Action not implemented. Graph contains self-loop on vertex "+v.id);
            graph.selfLoops = this.settingsAllowSelfLoops.checked;
        })
        this.settingsAllowParallelEdges?.addEventListener('change',() => graph.parallelEdges = this.settingsAllowParallelEdges.checked )

        // save button listener for label modal
        this.saveLabelButton?.addEventListener('click', () => {
            if (this.labelContentInput && this.labelFontSizeInput && hover.labelPoint && this.editLabelChanges)
            {
                console.log("label save button");
                stateHandler.saveState();
                hover.labelPoint.label.content = this.labelContentInput.value;
                hover.labelPoint.label.fontSize = parseInt(this.labelFontSizeInput.value);
                this.editLabelChanges = false;
                // checkHovered();
                myCanvasHandler?.redraw();
            }
            // hideEditLabelModal();
            this.hideAllModals();
        });
        
        // activate click to save button when typing enter
        for (const input of [this.labelContentInput,this.labelFontSizeInput])
            input?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter')
                {
                    e.preventDefault();
                    this.saveLabelButton?.click();   // trigger save buttton
                }
            });
        // event listener for the close button in the edit label modal
        if (this.editLabelCloseButton) { this.editLabelCloseButton.addEventListener('click', () => this.hideAllModals() ) }
        // event listener for the close button in the settings modal
        if (this.settingsCloseButton) { this.settingsCloseButton.addEventListener('click', () =>  this.hideAllModals() ) }
        // event listener for the close button in the edit label modal
        if (this.newGraphCloseButton) { this.newGraphCloseButton.addEventListener('click', () => this.hideAllModals() ); }

        // Allow clicking outside the modal content to close it 
        if (this.editLabelModal) {
            this.editLabelModal.addEventListener('click', (event) => {
                if (event.target === this.editLabelModal) { // Check if the click was directly on the modal background
                    //hideEditLabelModal();
                    this.hideAllModals();
                }
            });
        }

        // Show/hide parameter fields depending on selected graph type
        document.querySelectorAll<HTMLInputElement>("input[name='graphType']").forEach(radio => {
            radio.addEventListener("change", () => {
                // hide all parameter sections
                document.querySelectorAll<HTMLElement>(".parameter").forEach(div => {
                div.style.display = "none";
                });

                // show only the relevant one
                const selected = (radio as HTMLInputElement).value;
                const paramDiv = document.getElementById(`param-${selected}`);
                if (paramDiv) paramDiv.style.display = "block";
            });
        });

        // Handle form submission
        document.getElementById("newGraphForm")?.addEventListener("submit", (e) => {
            e.preventDefault();

            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);

            const graphType = formData.get("graphType");
            let param: number = 1;

            switch (graphType) {
                case "path":
                param = Number(formData.get("pathLength"));
                break;
                case "cycle":
                param = Number(formData.get("cycleLength"));
                break;
                case "tree":
                param = Number(formData.get("treeHeight"));
                break;
                // case "complete":
                // params.n = Number(formData.get("completeN"));
                // break;
            }

            // console.log("Creating new graph:", graphType, param);
            // 👉 Call your backend function here:
            stateHandler.saveState();
            const newGraph = graph.merge(createGraph(graphType?.toString()!, param, this.settingsOptions.defaultLabelFontSize) as Graph);
            selector.selectGraph(newGraph);
            myCanvasHandler?.redraw();
            // myCanvasHandler?.fixView(graph,selector);
            
            createGraph(graphType?.toString()!, param);

            // Close modal after creation
            this.hideAllModals();
        });
    }

    public hideAllModals() 
    {
        if (this.editLabelModal) 
            this.editLabelModal.style.display = 'none';
        if (this.settingsModal) {
            this.settingsModal.style.display = 'none';
        }
        this.newGraphModal.style.display = 'none';
        // console.log("hideAllModals");
    }

    // display the edit label modal
    public showEditLabelModal(hoveredLabelPoint: Point) {
        if (this.editLabelModal && hoveredLabelPoint) {
            
            // console.log("showEditLabelModal");
            this.labelContentInput.value = hoveredLabelPoint.label.content;
            this.labelFontSizeInput.value = hoveredLabelPoint.label.fontSize.toString();
            // if the hovered label point is a vertex, don't allow rename
            this.labelContentInput.disabled = hoveredLabelPoint instanceof Vertex;

            this.editLabelModal.style.display = 'flex'; // Use 'flex' to activate the centering via CSS

            // If the input is not disabled, focus and select its text
            if (!this.labelContentInput.disabled) {
                this.labelContentInput.focus();
                this.labelContentInput.select();
            }
        }
    }

    
    // Allow clicking outside the modal content to close it 
    /*if (settingsModal) {
        settingsModal.addEventListener('click', (event) => {
            if (event.target === settingsModal) { // Check if the click was directly on the modal background
                hideSettingsModal();
            }
        });
    }*/

    // display the edit label modal
    public showSettingsModal(settingsOptions: SettingsOptions, graph: Graph) {
        if (this.settingsModal && this.settingsCrossingsColorInput) {
            this.settingsCrossingsColorInput[0].value = settingsOptions.crossings_colors.self;
            this.settingsCrossingsColorInput[1].value = settingsOptions.crossings_colors.neighbor;
            this.settingsCrossingsColorInput[2].value = settingsOptions.crossings_colors.multiple;
            this.settingsCrossingsColorInput[3].value = settingsOptions.crossings_colors.legal;
            this.settingsCrossingEdgesColorInput[0].value = settingsOptions.crossing_edges_colors.crossing;
            this.settingsCrossingEdgesColorInput[1].value = settingsOptions.crossing_edges_colors.nonCrossing;
            this.settingsCliqueNewEdgesColorInput.value = settingsOptions.cliqueNewEdgesColor;
            this.settingsLabelDefaultFonstSizeInput.value = settingsOptions.defaultLabelFontSize.toString();
            // this.settingsAllowSelfLoops.checked = graph.selfLoops;
            // this.settingsAllowParallelEdges.checked = graph.parallelEdges;
            this.settingsModal.style.display = 'flex'; // Use 'flex' to activate the centering via CSS
        }
    }

    public showNewGraphModal()
    {
        this.newGraphModal.style.display = 'flex';
    }
}

/*
//  hide the modal
function hideEditLabelModal() {
    if (editLabelModal) {
        editLabelModal.style.display = 'none';
    }
}

//  hide the modal
function hideSettingsModal() {
    if (settingsModal) {
        settingsModal.style.display = 'none';
    }
}*/
