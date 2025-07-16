import { CanvasHandler } from "./canvasHandler.js";
import { SettingsOptions } from "./draw.js";
import { Point, Vertex } from "./graph.js";
import { StateHandler } from "./stateHandler.js";

export class ModalsHandler
{
    // edit label modal
    private editLabelModal: HTMLElement;
    private editLabelCloseButton: HTMLElement;
    private labelContentInput: HTMLInputElement;
    private labelFontSizeInput: HTMLInputElement;
    private saveLabelButton: HTMLButtonElement;
    // settings modal
    private settingsModal: HTMLElement;
    private settingsCloseButton: HTMLElement; // HTMLButtonElement
    private settingsSaveButton: HTMLElement; // same
    private settingsCrossingsColorInput: HTMLInputElement[] = [];       // crossings colors
    private settingsCrossingEdgesColorInput: HTMLInputElement[] = [];   // crossing edges colors
    private settingsCliqueNewEdgesColorInput: HTMLInputElement;          // clique new edges color
    private settingsLabelDefaultFonstSizeInput: HTMLInputElement;       // default label font size settings
    // settingsOptions
    public settingsOptions: SettingsOptions;

    constructor(myCanvasHandler: CanvasHandler, stateHandler: StateHandler)
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
        // settingsOptions
        this.settingsOptions = new SettingsOptions();
        this.addEventListeners(myCanvasHandler,stateHandler);
        this.hideAllModals();
    }

    public addEventListeners(myCanvasHandler: CanvasHandler, stateHandler: StateHandler)
    {
        // listener for settings button
        document.getElementById('settingsBtn')?.addEventListener('click', () => this.showSettingsModal(this.settingsOptions));
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

        // save button listener
        /*this.saveLabelButton?.addEventListener('click', () => {
            if (this.labelContentInput && this.labelFontSizeInput && hoveredLabelPoint)
            {
                stateHandler.saveState();
                hoveredLabelPoint.label.content = this.labelContentInput.value;
                hoveredLabelPoint.label.fontSize = parseInt(this.labelFontSizeInput.value);
                // checkHovered();
                myCanvasHandler?.redraw();
            }
            // hideEditLabelModal();
            this.hideAllModals();
        });*/
        
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
        if (this.settingsCloseButton) { this.settingsCloseButton.addEventListener('click', () =>  this.hideAllModals() ) };

        // Allow clicking outside the modal content to close it 
        if (this.editLabelModal) {
            this.editLabelModal.addEventListener('click', (event) => {
                if (event.target === this.editLabelModal) { // Check if the click was directly on the modal background
                    //hideEditLabelModal();
                    this.hideAllModals();
                }
            });
        }
    }

    public hideAllModals() 
    {
        if (this.editLabelModal) 
            this.editLabelModal.style.display = 'none';
        if (this.settingsModal) {
            this.settingsModal.style.display = 'none';
        }
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

    // display the edit label modal
    public showSettingsModal(settingsOptions: SettingsOptions) {
        if (this.settingsModal && this.settingsCrossingsColorInput) {
            this.settingsCrossingsColorInput[0].value = settingsOptions.crossings_colors.self;
            this.settingsCrossingsColorInput[1].value = settingsOptions.crossings_colors.neighbor;
            this.settingsCrossingsColorInput[2].value = settingsOptions.crossings_colors.multiple;
            this.settingsCrossingsColorInput[3].value = settingsOptions.crossings_colors.legal;
            this.settingsCrossingEdgesColorInput[0].value = settingsOptions.crossing_edges_colors.crossing;
            this.settingsCrossingEdgesColorInput[1].value = settingsOptions.crossing_edges_colors.nonCrossing;
            this.settingsCliqueNewEdgesColorInput.value = settingsOptions.cliqueNewEdgesColor;
            this.settingsLabelDefaultFonstSizeInput.value = settingsOptions.defaultLabelFontSize.toString();
            this.settingsModal.style.display = 'flex'; // Use 'flex' to activate the centering via CSS
        }
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
