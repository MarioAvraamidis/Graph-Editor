import { CanvasHandler } from "./canvasHandler.js";
import { SettingsOptions } from "./settings.js";
import { Graph } from "./graph.js";
import { Hover, Selector } from "./selector.js";
import { StateHandler } from "./stateHandler.js";
import { createGraph } from "./graphCreator.js";
import { Edge, Point, Vertex } from "./graphElements.js";
import { showCustomAlert } from "./alert.js";
import { circularPathDrawing, linearPathDrawing } from "./layout.js";

export class ModalsHandler
{
    // edit label modal
    private editLabelModal: HTMLElement;
    private editLabelCloseButton: HTMLElement;
    private labelContentInput: HTMLInputElement;
    private labelFontSizeInput: HTMLInputElement;
    private saveLabelButton: HTMLButtonElement;
    private editLabelChanges: boolean = false;
    private editLabelElements: (Point|Edge)[] = [];
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
    // layout modal
    private layoutModal: HTMLElement = document.getElementById("layoutModal") as HTMLElement;
    private layoutModalCloseButton: HTMLElement = this.layoutModal.querySelector('.close-button') as HTMLElement;
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
        this.activateLayoutModal(graph,stateHandler,myCanvasHandler);
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

        this.labelContentInput?.addEventListener('change', () => { this.editLabelChanges = true;})
        this.labelFontSizeInput?.addEventListener('change', () => {this.editLabelChanges = true;} )
        this.settingsAllowSelfLoops?.addEventListener('change', () => {
            // const v: Vertex | null = graph.checkSelfLoops();
            // if(v)
               // showCustomAlert("Action not implemented. Graph contains self-loop on vertex "+v.id);
            graph.selfLoops = this.settingsAllowSelfLoops.checked;
        });
        this.settingsAllowParallelEdges?.addEventListener('change',() => graph.parallelEdges = this.settingsAllowParallelEdges.checked )

        // save button listener for label modal
        this.saveLabelButton?.addEventListener('click', () => {
            if (this.labelContentInput && this.labelFontSizeInput && (this.editLabelElements.length > 0) && this.editLabelChanges)
            {
                console.log("label save button");
                stateHandler.saveState();
                const fontSize = parseInt(this.labelFontSizeInput.value)
                /*if (hover.labelPoint)
                {
                    hover.labelPoint.label.content = this.labelContentInput.value;
                    hover.labelPoint.label.fontSize = fontSize;
                }
                else
                {
                    selector.vertices.forEach( v => v.label.fontSize = fontSize);
                } */
                if (this.editLabelElements.length === 1)
                    this.editLabelElements[0].label.content = this.labelContentInput.value;
                this.editLabelElements.forEach( p => p.label.fontSize = fontSize);
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
        // event listeners for close buttons of the modals
        for (const btn of [this.editLabelCloseButton,this.settingsCloseButton, this.newGraphCloseButton, this.layoutModalCloseButton])
            if(btn) btn.addEventListener('click', () => this.hideAllModals());

        // Allow clicking outside the modal content to close it 
        /* if (this.editLabelModal) {
            this.editLabelModal.addEventListener('click', (event) => {
                if (event.target === this.editLabelModal) { // Check if the click was directly on the modal background
                    //hideEditLabelModal();
                    this.hideAllModals();
                }
            });
        } */

        // Show/hide parameter fields depending on selected graph type
        document.querySelectorAll<HTMLInputElement>("input[name='graphType']").forEach(radio => {
            radio.addEventListener("change", () => {
                // hide all parameter sections
                document.getElementById("newGraphModal")?.querySelectorAll<HTMLElement>(".parameter").forEach(div => {
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
            // myCanvasHandler?.fixView(selector);
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
        this.layoutModal.style.display = 'none';
        // console.log("hideAllModals");
    }

    // display the edit label modal
    public showEditLabelModal(elements: (Point|Edge)[]) {
        // update editLabelElements
        this.editLabelElements = elements;
        let firstElement;
        if (elements.length > 0)
            firstElement = elements[0];
        else 
        {
            showCustomAlert("No relevant items selected.");
            return;
        }
        if (this.editLabelModal && firstElement) {
            
            // console.log("showEditLabelModal");
            this.labelContentInput.value = firstElement.label.content;
            this.labelFontSizeInput.value = firstElement.label.fontSize.toString();
            // if the hovered label point is a vertex, don't allow rename
            this.labelContentInput.disabled = firstElement instanceof Vertex || elements.length>1;

            this.editLabelModal.style.display = 'flex'; // Use 'flex' to activate the centering via CSS

            // If the input is not disabled, focus and select its text
            if (!this.labelContentInput.disabled) {
                this.labelContentInput.focus();
                this.labelContentInput.select();
            }
        }
    }

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

    public showNewGraphModal() { this.newGraphModal.style.display = 'flex'; }

    private activateLayoutModal(graph: Graph, stateHandler: StateHandler, myCanvasHandler: CanvasHandler)
    {
        const modal = document.getElementById("layoutModal") as HTMLDivElement;
        const openBtn = document.getElementById("layout-btn") as HTMLButtonElement;
        const cancelBtn = document.getElementById("layoutCancelBtn") as HTMLButtonElement;
        const okBtn = document.getElementById("layoutOkBtn") as HTMLButtonElement;
        const form = document.getElementById("layoutOptionsForm") as HTMLFormElement;

        // Show modal
        openBtn.onclick = () => { modal.style.display = "flex"; };

        // Hide modal
        cancelBtn.onclick = (e) => {
            e.preventDefault();
            modal.style.display = "none";
        };

        // Apply choice
        okBtn.onclick = (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const selectedOption = formData.get("layoutOption");
            let paramValue: number = 0;

            /*if (selectedOption) {
                paramValue = formData.get("param" + selectedOption.toString().slice(-1)) as string;
            }*/

            switch (selectedOption) {
                case "linearPath":
                    paramValue = Number(formData.get("numOfCrossingsLinearPath"));
                break;
                case "circularPath":
                    paramValue = Number(formData.get("numOfCrossingsCircularPath"));
                break;
                // case "opt3":
                // paramValue = Number(formData.get("numOfCrossings"));
                // break;
            }

            // console.log("Selected:", selectedOption, "Parameter:", paramValue);

            stateHandler.saveState();
            if(selectedOption === "linearPath")
                linearPathDrawing(graph,paramValue);
            else if (selectedOption === "circularPath")
                circularPathDrawing(graph,paramValue);
            myCanvasHandler.fixView();
            myCanvasHandler.redraw();

            modal.style.display = "none";
        };

        // Show/hide parameter fields depending on selected layout
        document.querySelectorAll<HTMLInputElement>("input[name='layoutOption']").forEach(radio => {
            radio.addEventListener("change", () => {
                // hide all parameter sections
                document.getElementById("layoutModal")?.querySelectorAll<HTMLElement>(".parameter").forEach(div => {
                    div.style.display = "none";
                });

                // show only the relevant one
                const selected = (radio as HTMLInputElement).value;
                const paramDiv = document.getElementById(`layout-param-${selected}`);
                if (paramDiv) paramDiv.style.display = "block";
            });
        });

        // Close modal if clicking outside
        /*window.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = "none";
            }
        };*/

    }
}
