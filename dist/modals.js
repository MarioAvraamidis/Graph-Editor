import { Vertex } from "./graph.js";
import { createGraph } from "./graphCreator.js";
export class ModalsHandler {
    constructor(graph, myCanvasHandler, stateHandler, hover, settingsOptions, selector) {
        this.settingsCrossingsColorInput = []; // crossings colors
        this.settingsCrossingEdgesColorInput = []; // crossing edges colors
        // new graph modal
        this.newGraphModal = document.getElementById('newGraphModal');
        this.newGraphCloseButton = this.newGraphModal.querySelector('.close-button');
        // edit label modal elements
        this.editLabelModal = document.getElementById('editLabelModal');
        this.editLabelCloseButton = this.editLabelModal.querySelector('.close-button');
        this.labelContentInput = document.getElementById('labelContentInput');
        this.labelFontSizeInput = document.getElementById('labelFontSizeInput');
        this.saveLabelButton = document.getElementById('saveLabelButton');
        // settings modal elements
        this.settingsModal = document.getElementById('settingsModal');
        this.settingsCloseButton = this.settingsModal.querySelector('.close-button');
        this.settingsSaveButton = document.getElementById('settingsSaveButton');
        // crossings colors settings elements
        for (const btn of ['crossings-colors-self', 'crossings-colors-neighbor', 'crossings-colors-multiple', 'crossings-colors-legal'])
            this.settingsCrossingsColorInput.push(document.getElementById(btn));
        // crossing edges colors settings elements
        for (const btn of ['crossing-edges-color', 'non-crossing-edges-color'])
            this.settingsCrossingEdgesColorInput.push(document.getElementById(btn));
        // clique new edges color
        this.settingsCliqueNewEdgesColorInput = document.getElementById('clique-new-edges-color');
        // default label font size settings
        this.settingsLabelDefaultFonstSizeInput = document.getElementById('labelDefaultFontSizeInput');
        // settingsOptions
        this.settingsOptions = settingsOptions;
        this.addEventListeners(graph, myCanvasHandler, stateHandler, hover, selector);
        this.hideAllModals();
    }
    addEventListeners(graph, myCanvasHandler, stateHandler, hover, selector) {
        var _a, _b, _c, _d, _e;
        // listener for settings button
        (_a = document.getElementById('settingsBtn')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => this.showSettingsModal(this.settingsOptions));
        // listener for new graph button
        (_b = document.getElementById('newGraphBtn')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => this.showNewGraphModal());
        // listner for settings savebutton
        (_c = this.settingsSaveButton) === null || _c === void 0 ? void 0 : _c.addEventListener('click', () => {
            if (this.settingsCrossingsColorInput) {
                // console.log("clicked settings save button");
                // saveState();
                this.settingsOptions.edit_crossings_colors(this.settingsCrossingsColorInput);
                this.settingsOptions.edit_crossing_edges_colors(this.settingsCrossingEdgesColorInput);
                this.settingsOptions.edit_cliqueNewEdgesColor(this.settingsCliqueNewEdgesColorInput.value);
                this.settingsOptions.edit_defaultLabelFontSize(parseInt(this.settingsLabelDefaultFonstSizeInput.value));
                myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
            }
            //hideSettingsModal();
            this.hideAllModals();
        });
        // save button listener
        (_d = this.saveLabelButton) === null || _d === void 0 ? void 0 : _d.addEventListener('click', () => {
            if (this.labelContentInput && this.labelFontSizeInput && hover.labelPoint) {
                stateHandler.saveState();
                hover.labelPoint.label.content = this.labelContentInput.value;
                hover.labelPoint.label.fontSize = parseInt(this.labelFontSizeInput.value);
                // checkHovered();
                myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
            }
            // hideEditLabelModal();
            this.hideAllModals();
        });
        // activate click to save button when typing enter
        for (const input of [this.labelContentInput, this.labelFontSizeInput])
            input === null || input === void 0 ? void 0 : input.addEventListener('keydown', (e) => {
                var _a;
                if (e.key === 'Enter') {
                    e.preventDefault();
                    (_a = this.saveLabelButton) === null || _a === void 0 ? void 0 : _a.click(); // trigger save buttton
                }
            });
        // event listener for the close button in the edit label modal
        if (this.editLabelCloseButton) {
            this.editLabelCloseButton.addEventListener('click', () => this.hideAllModals());
        }
        // event listener for the close button in the settings modal
        if (this.settingsCloseButton) {
            this.settingsCloseButton.addEventListener('click', () => this.hideAllModals());
        }
        // event listener for the close button in the edit label modal
        if (this.newGraphCloseButton) {
            this.newGraphCloseButton.addEventListener('click', () => this.hideAllModals());
        }
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
        document.querySelectorAll("input[name='graphType']").forEach(radio => {
            radio.addEventListener("change", () => {
                // hide all parameter sections
                document.querySelectorAll(".parameter").forEach(div => {
                    div.style.display = "none";
                });
                // show only the relevant one
                const selected = radio.value;
                const paramDiv = document.getElementById(`param-${selected}`);
                if (paramDiv)
                    paramDiv.style.display = "block";
            });
        });
        // Handle form submission
        (_e = document.getElementById("newGraphForm")) === null || _e === void 0 ? void 0 : _e.addEventListener("submit", (e) => {
            e.preventDefault();
            const form = e.target;
            const formData = new FormData(form);
            const graphType = formData.get("graphType");
            let param = 1;
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
            const newGraph = graph.merge(createGraph(graphType === null || graphType === void 0 ? void 0 : graphType.toString(), param, this.settingsOptions.defaultLabelFontSize));
            selector.selectGraph(newGraph);
            myCanvasHandler === null || myCanvasHandler === void 0 ? void 0 : myCanvasHandler.redraw();
            // myCanvasHandler?.fixView(graph,selector);
            createGraph(graphType === null || graphType === void 0 ? void 0 : graphType.toString(), param);
            // Close modal after creation
            this.hideAllModals();
        });
    }
    hideAllModals() {
        if (this.editLabelModal)
            this.editLabelModal.style.display = 'none';
        if (this.settingsModal) {
            this.settingsModal.style.display = 'none';
        }
        this.newGraphModal.style.display = 'none';
        // console.log("hideAllModals");
    }
    // display the edit label modal
    showEditLabelModal(hoveredLabelPoint) {
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
    showSettingsModal(settingsOptions) {
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
    showNewGraphModal() {
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
