import { createGraph } from "./graphCreator.js";
import { Vertex } from "./graphElements.js";
import { showCustomAlert } from "./alert.js";
import { circularPathDrawing, linearPathDrawing } from "./layout.js";
export class ModalsHandler {
    constructor(graph, myCanvasHandler, stateHandler, hover, settingsOptions, selector) {
        this.editLabelChanges = false;
        this.editLabelPoints = [];
        this.settingsCrossingsColorInput = []; // crossings colors
        this.settingsCrossingEdgesColorInput = []; // crossing edges colors
        // new graph modal
        this.newGraphModal = document.getElementById('newGraphModal');
        this.newGraphCloseButton = this.newGraphModal.querySelector('.close-button');
        // layout modal
        this.layoutModal = document.getElementById("layoutModal");
        this.layoutModalCloseButton = this.layoutModal.querySelector('.close-button');
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
        // self-loops and parallel edges
        this.settingsAllowSelfLoops = document.getElementById('self-loops');
        this.settingsAllowParallelEdges = document.getElementById('parallel-edges');
        // settingsOptions
        this.settingsOptions = settingsOptions;
        this.addEventListeners(graph, myCanvasHandler, stateHandler, hover, selector);
        this.activateLayoutModal(graph, stateHandler, myCanvasHandler);
        this.hideAllModals();
    }
    addEventListeners(graph, myCanvasHandler, stateHandler, hover, selector) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        // listener for settings button
        (_a = document.getElementById('settingsBtn')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => this.showSettingsModal(this.settingsOptions, graph));
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
        (_d = this.labelContentInput) === null || _d === void 0 ? void 0 : _d.addEventListener('change', () => { this.editLabelChanges = true; });
        (_e = this.labelFontSizeInput) === null || _e === void 0 ? void 0 : _e.addEventListener('change', () => { this.editLabelChanges = true; });
        (_f = this.settingsAllowSelfLoops) === null || _f === void 0 ? void 0 : _f.addEventListener('change', () => {
            // const v: Vertex | null = graph.checkSelfLoops();
            // if(v)
            // showCustomAlert("Action not implemented. Graph contains self-loop on vertex "+v.id);
            graph.selfLoops = this.settingsAllowSelfLoops.checked;
        });
        (_g = this.settingsAllowParallelEdges) === null || _g === void 0 ? void 0 : _g.addEventListener('change', () => graph.parallelEdges = this.settingsAllowParallelEdges.checked);
        // save button listener for label modal
        (_h = this.saveLabelButton) === null || _h === void 0 ? void 0 : _h.addEventListener('click', () => {
            if (this.labelContentInput && this.labelFontSizeInput && (this.editLabelPoints.length > 0) && this.editLabelChanges) {
                console.log("label save button");
                stateHandler.saveState();
                const fontSize = parseInt(this.labelFontSizeInput.value);
                /*if (hover.labelPoint)
                {
                    hover.labelPoint.label.content = this.labelContentInput.value;
                    hover.labelPoint.label.fontSize = fontSize;
                }
                else
                {
                    selector.vertices.forEach( v => v.label.fontSize = fontSize);
                } */
                if (this.editLabelPoints.length === 1)
                    this.editLabelPoints[0].label.content = this.labelContentInput.value;
                this.editLabelPoints.forEach(p => p.label.fontSize = fontSize);
                this.editLabelChanges = false;
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
        // event listeners for close buttons of the modals
        for (const btn of [this.editLabelCloseButton, this.settingsCloseButton, this.newGraphCloseButton, this.layoutModalCloseButton])
            if (btn)
                btn.addEventListener('click', () => this.hideAllModals());
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
        document.querySelectorAll("input[name='graphType']").forEach(radio => {
            radio.addEventListener("change", () => {
                var _a;
                // hide all parameter sections
                (_a = document.getElementById("newGraphModal")) === null || _a === void 0 ? void 0 : _a.querySelectorAll(".parameter").forEach(div => {
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
        (_j = document.getElementById("newGraphForm")) === null || _j === void 0 ? void 0 : _j.addEventListener("submit", (e) => {
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
            // myCanvasHandler?.fixView(selector);
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
        this.layoutModal.style.display = 'none';
        // console.log("hideAllModals");
    }
    // display the edit label modal
    showEditLabelModal(points) {
        // update editLabelPoints
        this.editLabelPoints = points;
        let firstPoint;
        if (points.length > 0)
            firstPoint = points[0];
        else
            showCustomAlert("No point selected.");
        if (this.editLabelModal && firstPoint) {
            // console.log("showEditLabelModal");
            this.labelContentInput.value = firstPoint.label.content;
            this.labelFontSizeInput.value = firstPoint.label.fontSize.toString();
            // if the hovered label point is a vertex, don't allow rename
            this.labelContentInput.disabled = firstPoint instanceof Vertex;
            this.editLabelModal.style.display = 'flex'; // Use 'flex' to activate the centering via CSS
            // If the input is not disabled, focus and select its text
            if (!this.labelContentInput.disabled) {
                this.labelContentInput.focus();
                this.labelContentInput.select();
            }
        }
    }
    // display the edit label modal
    showSettingsModal(settingsOptions, graph) {
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
    showNewGraphModal() { this.newGraphModal.style.display = 'flex'; }
    activateLayoutModal(graph, stateHandler, myCanvasHandler) {
        const modal = document.getElementById("layoutModal");
        const openBtn = document.getElementById("layout-btn");
        const cancelBtn = document.getElementById("layoutCancelBtn");
        const okBtn = document.getElementById("layoutOkBtn");
        const form = document.getElementById("layoutOptionsForm");
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
            let paramValue = 0;
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
            if (selectedOption === "linearPath")
                linearPathDrawing(graph, paramValue);
            else if (selectedOption === "circularPath")
                circularPathDrawing(graph, paramValue);
            myCanvasHandler.fixView();
            myCanvasHandler.redraw();
            modal.style.display = "none";
        };
        // Show/hide parameter fields depending on selected layout
        document.querySelectorAll("input[name='layoutOption']").forEach(radio => {
            radio.addEventListener("change", () => {
                var _a;
                // hide all parameter sections
                (_a = document.getElementById("layoutModal")) === null || _a === void 0 ? void 0 : _a.querySelectorAll(".parameter").forEach(div => {
                    div.style.display = "none";
                });
                // show only the relevant one
                const selected = radio.value;
                const paramDiv = document.getElementById(`layout-param-${selected}`);
                if (paramDiv)
                    paramDiv.style.display = "block";
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
