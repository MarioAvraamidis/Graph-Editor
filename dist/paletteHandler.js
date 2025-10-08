export class PaletteHandler {
    constructor(selector, myCanvasHandler, stateHandler, graph, settingsOptions, modalsHandler) {
        // Palette for vertices
        this.vertexColor = document.getElementById("vertex-color");
        this.vertexShapeButtons = document.querySelectorAll(".shape-button");
        this.vertexSize = document.getElementById("vertex-size");
        this.deleteVertexBtn = document.getElementById("delete-vertex-palette");
        // Palette for bends
        this.bendColor = document.getElementById("bend-color");
        // const bendShape = document.getElementById("bend-shape") as HTMLSelectElement;
        this.bendSize = document.getElementById("bend-size");
        this.deleteBendBtn = document.getElementById("delete-bend");
        // Palette for Edges
        this.deleteEdgeBtn = document.getElementById("delete-edge-palette");
        this.edgeThickness = document.getElementById("edge-thickness");
        this.edgeColor = document.getElementById("edge-color");
        // Collapse palettes
        this.vertexPalette = document.getElementById('vertex-palette');
        this.edgePalette = document.getElementById('edge-palette');
        this.bendPalette = document.getElementById('bend-palette');
        // show labels
        this.showVertexLabels = document.getElementById("vertex-show-labels");
        this.showEdgeLabels = document.getElementById("edge-show-labels");
        this.showBendLabels = document.getElementById("bend-show-labels");
        // edit labels
        this.editVertexLabels = document.getElementById("edit-vertex-label-palette");
        this.editEdgeLabels = document.getElementById("edit-edge-label-palette");
        this.editBendLabels = document.getElementById("edit-bend-label-palette");
        this.selector = selector;
        this.myCanvasHandler = myCanvasHandler;
        this.stateHandler = stateHandler;
        this.graph = graph;
        this.settingsOptions = settingsOptions;
        this.modalsHandler = modalsHandler;
        this.activateEventListeners();
        this.updatePaletteState();
        this.addDashedEdgeEventListeners();
        this.collapse();
    }
    activateEventListeners() {
        var _a, _b, _c, _d, _e;
        // using palettes
        this.vertexColor.addEventListener("change", () => {
            var _a;
            // update selected vertices' color
            if (this.selector.vertices.length > 0) {
                this.stateHandler.saveState();
                this.selector.vertices.forEach(v => v.color = this.vertexColor.value);
                // renderGraph();
                (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
            }
            // set the color for new vertices
            else
                this.settingsOptions.vertexChars.color = this.vertexColor.value;
        });
        // vertex shape buttons
        this.vertexShapeButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                var _a;
                // Remove active class from all buttons
                this.vertexShapeButtons.forEach(b => b.classList.remove("active"));
                // Add active to the clicked one
                btn.classList.add("active");
                const selectedShape = btn.getAttribute("data-shape");
                if (this.selector.vertices.length > 0 && btn.classList) // update shape of selected vertices
                 {
                    this.stateHandler.saveState();
                    this.selector.vertices.forEach(v => v.shape = selectedShape);
                    // renderGraph();
                    (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
                }
                // update new vertex shape
                this.settingsOptions.vertexChars.shape = selectedShape;
            });
        });
        // vertex size
        this.vertexSize.addEventListener("input", () => {
            var _a;
            const size = parseInt(this.vertexSize.value);
            if (this.selector.vertices.length > 0) {
                this.stateHandler.saveState();
                this.selector.vertices.forEach(v => v.size = size);
                // renderGraph();
                (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
            }
            else
                this.settingsOptions.vertexChars.size = size;
        });
        // Vertex rename
        (_a = document.getElementById("rename-vertex")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
            var _a;
            const input = document.getElementById("vertexIdInput").value.trim();
            if (input && this.selector.vertices.length === 1) {
                this.stateHandler.saveState();
                const selectedVertex = this.selector.vertices[0];
                this.graph.renameVertex(selectedVertex, input);
                // renderGraph();
                (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
            }
        });
        // Show label checkbox
        (_b = this.showVertexLabels) === null || _b === void 0 ? void 0 : _b.addEventListener("change", () => {
            if (this.selector.vertices.length > 0) {
                this.stateHandler.saveState();
                this.selector.vertices.forEach(vertex => vertex.label.showLabel = this.showVertexLabels.checked);
                this.myCanvasHandler.redraw();
            }
        });
        (_c = this.showEdgeLabels) === null || _c === void 0 ? void 0 : _c.addEventListener("change", () => {
            if (this.selector.edges.length > 0) {
                this.stateHandler.saveState();
                this.selector.edges.forEach(edge => edge.label.showLabel = this.showEdgeLabels.checked);
                this.myCanvasHandler.redraw();
            }
        });
        (_d = this.showBendLabels) === null || _d === void 0 ? void 0 : _d.addEventListener("change", () => {
            if (this.selector.bends.length > 0) {
                this.stateHandler.saveState();
                this.selector.bends.forEach(bend => bend.label.showLabel = this.showBendLabels.checked);
                this.myCanvasHandler.redraw();
            }
        });
        // edit labels button
        this.editVertexLabels.addEventListener("click", () => { this.modalsHandler.showEditLabelModal(this.selector.vertices); });
        this.editEdgeLabels.addEventListener("click", () => { this.modalsHandler.showEditLabelModal(this.selector.edges); });
        this.editBendLabels.addEventListener("click", () => { this.modalsHandler.showEditLabelModal(this.selector.bends); });
        // bend color
        this.bendColor.addEventListener("change", () => {
            var _a;
            if (this.selector.bends.length > 0) // apply change on selected bends
             {
                this.stateHandler.saveState();
                this.selector.bends.forEach(b => b.color = this.bendColor.value);
                // renderGraph();
                (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
            }
            else // set color for new bends
                this.settingsOptions.bendChars.color = this.bendColor.value;
        });
        // bend size
        this.bendSize.addEventListener("input", () => {
            var _a;
            const size = parseInt(this.bendSize.value);
            if (this.selector.bends.length > 0) {
                this.stateHandler.saveState();
                this.selector.bends.forEach(b => b.size = size);
                // renderGraph();
                (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
            }
            else
                this.settingsOptions.bendChars.size = size;
        });
        // edge color
        this.edgeColor.addEventListener("change", () => {
            var _a;
            if (this.selector.edges.length > 0) {
                this.stateHandler.saveState();
                this.selector.edges.forEach(e => e.color = this.edgeColor.value);
                // renderGraph();
                (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
            }
            else
                this.settingsOptions.edgeChars.color = this.edgeColor.value;
        });
        // edge thickness
        this.edgeThickness.addEventListener("input", () => {
            var _a;
            if (this.selector.edges.length > 0) {
                this.stateHandler.saveState();
                this.selector.edges.forEach(e => e.thickness = parseInt(this.edgeThickness.value));
                // renderGraph();
                (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
            }
            else
                this.settingsOptions.edgeChars.thickness = parseInt(this.edgeThickness.value);
        });
        // delete vertex button
        this.deleteVertexBtn.addEventListener("click", () => {
            var _a;
            this.stateHandler.saveState();
            this.selector.deleteSelectedVertices(this.graph);
            // renderGraph();
            (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
        });
        // delete bend button
        this.deleteBendBtn.addEventListener("click", () => {
            var _a;
            this.stateHandler.saveState();
            this.selector.deleteSelectedBends(this.graph);
            // renderGraph();
            (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
        });
        // delete edge button
        this.deleteEdgeBtn.addEventListener("click", () => {
            var _a;
            this.stateHandler.saveState();
            this.selector.deleteSelectedEdges(this.graph);
            // renderGraph();
            (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
        });
        // event-listener for other highlighting crossing edges checkboxes
        for (const id of ["highlight-crossing-edges", "highlight-non-crossing-edges"]) {
            (_e = document.getElementById(id)) === null || _e === void 0 ? void 0 : _e.addEventListener('change', () => {
                var _a;
                if (this.myCanvasHandler.ctx)
                    // drawGraph(ctx, graph, true);
                    (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
            });
        }
    }
    collapse() {
        for (const palette of [this.vertexPalette, this.edgePalette, this.bendPalette])
            if (palette) {
                const paletteHeader = palette.querySelector('.palette-header');
                const paletteContent = palette.querySelector('.palette-content');
                if (paletteHeader && paletteContent) {
                    paletteHeader.addEventListener('click', () => {
                        // Toggle the 'collapsed' class on the main palette div
                        palette.classList.toggle('collapsed');
                    });
                }
            }
        // Initially collapse the bend-palette
        if (this.bendPalette)
            this.bendPalette.classList.add('collapsed');
    }
    addDashedEdgeEventListeners() {
        // Get references to the specific buttons and their common parent
        const toggleContinuousButton = document.getElementById('toggle-continuous');
        const toggleDashedButton = document.getElementById('toggle-dashed');
        const edgeStyleButtonsContainer = document.querySelector('.edge-style-buttons'); // Get the wrapper div
        if (edgeStyleButtonsContainer) {
            edgeStyleButtonsContainer.addEventListener('click', (event) => {
                var _a;
                const clickedButton = event.target;
                // Ensure a button with the 'edge-style-button' class was clicked
                const actualButton = clickedButton.closest('.edge-style-button');
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
                    }
                    else if (actualButton.id === 'toggle-dashed') {
                        this.settingsOptions.edgeChars.dashed = true;
                    }
                    // update type of selected edges
                    if (this.selector.edges.length > 0) {
                        this.stateHandler.saveState();
                        this.selector.edges.forEach(e => e.dashed = this.settingsOptions.edgeChars.dashed);
                    }
                    // You might want to trigger a redraw of your canvas here to apply the style immediately
                    (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
                }
            });
        }
    }
    updatePaletteState() {
        /*const vertexPalette = document.getElementById("vertex-palette")!;
        const edgePalette = document.getElementById("edge-palette")!;
        const bendPalette = document.getElementById("bend-palette")!;
        const vertexShape = document.getElementById("vertex-shape")!;*/
        const vertexColorPicker = document.getElementById("vertex-color");
        const edgeColorPicker = document.getElementById("edge-color");
        const bendColorPicker = document.getElementById("bend-color");
        // dashed edge buttons
        const toggleContinuousButton = document.getElementById('toggle-continuous');
        const toggleDashedButton = document.getElementById('toggle-dashed');
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
        else // show default values on palette
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
            this.showBendLabels.checked = b.label.showLabel;
        }
        else {
            bendColorPicker.value = this.settingsOptions.bendChars.color;
            this.bendSize.value = this.settingsOptions.bendChars.size.toString();
        }
        if (edgeSelected) {
            const e = this.selector.edges[this.selector.edges.length - 1];
            edgeColorPicker.value = e.color;
            this.edgeThickness.value = e.thickness.toString();
            // show label checkbox
            this.showEdgeLabels.checked = e.label.showLabel;
            // update dashed edge buttons
            if (e.dashed) {
                toggleContinuousButton === null || toggleContinuousButton === void 0 ? void 0 : toggleContinuousButton.classList.remove("active");
                toggleDashedButton === null || toggleDashedButton === void 0 ? void 0 : toggleDashedButton.classList.add("active");
            }
            else {
                toggleContinuousButton === null || toggleContinuousButton === void 0 ? void 0 : toggleContinuousButton.classList.add("active");
                toggleDashedButton === null || toggleDashedButton === void 0 ? void 0 : toggleDashedButton.classList.remove("active");
            }
            // update toggle-dashed button
            /*if (e.dashed)
                toggle_dashed_btn?.classList.add("active");
            else
                toggle_dashed_btn?.classList.remove("active");*/
        }
        else {
            edgeColorPicker.value = this.settingsOptions.edgeChars.color;
            this.edgeThickness.value = this.settingsOptions.edgeChars.thickness.toString();
            // update dashed edge buttons
            if (this.settingsOptions.edgeChars.dashed) {
                toggleContinuousButton === null || toggleContinuousButton === void 0 ? void 0 : toggleContinuousButton.classList.remove("active");
                toggleDashedButton === null || toggleDashedButton === void 0 ? void 0 : toggleDashedButton.classList.add("active");
            }
            else {
                toggleContinuousButton === null || toggleContinuousButton === void 0 ? void 0 : toggleContinuousButton.classList.add("active");
                toggleDashedButton === null || toggleDashedButton === void 0 ? void 0 : toggleDashedButton.classList.remove("active");
            }
            // update toggle-dashed button
            /*if (edgeChars.dashed)
                toggle_dashed_btn?.classList.add("active");
            else
                toggle_dashed_btn?.classList.remove("active");*/
        }
    }
    updateRenameControls(enabled) {
        const input = document.getElementById("vertexIdInput");
        const button = document.getElementById("rename-vertex");
        input.disabled = !enabled;
        button.disabled = !enabled;
    }
}
