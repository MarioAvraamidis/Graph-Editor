export class PaletteHandler {
    constructor(selector, myCanvasHandler, stateHandler, graph) {
        // palette settings
        this.vertexChars = { color: "#000000", size: 7, shape: "circle" }; // default settings of class Vertex
        this.edgeChars = { color: "#898989", thickness: 2, dashed: false }; // default of class Edge
        this.bendChars = { size: 5, color: "#0000FF" };
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
        this.selector = selector;
        this.myCanvasHandler = myCanvasHandler;
        this.stateHandler = stateHandler;
        this.graph = graph;
        this.activateEventListeners();
        this.addDashedEdgeEventListeners();
        this.collapse();
    }
    activateEventListeners() {
        var _a;
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
                this.vertexChars.color = this.vertexColor.value;
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
                this.vertexChars.shape = selectedShape;
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
                this.vertexChars.size = size;
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
                this.bendChars.color = this.bendColor.value;
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
                this.bendChars.size = size;
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
                this.edgeChars.color = this.edgeColor.value;
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
                this.edgeChars.thickness = parseInt(this.edgeThickness.value);
        });
        // delete vertex button
        this.deleteVertexBtn.addEventListener("click", () => {
            var _a;
            this.stateHandler.saveState();
            this.selector.deleteSelectedVertices(this.graph);
            this.selector.pointsUpdate();
            // renderGraph();
            (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
        });
        // delete bend button
        this.deleteBendBtn.addEventListener("click", () => {
            var _a;
            this.stateHandler.saveState();
            this.selector.deleteSelectedBends(this.graph);
            this.selector.pointsUpdate();
            // renderGraph();
            (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
        });
        // delete edge button
        this.deleteEdgeBtn.addEventListener("click", () => {
            var _a;
            this.stateHandler.saveState();
            this.selector.deleteSelectedEdges(this.graph);
            this.selector.pointsUpdate();
            // renderGraph();
            (_a = this.myCanvasHandler) === null || _a === void 0 ? void 0 : _a.redraw();
        });
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
                        this.edgeChars.dashed = false;
                    }
                    else if (actualButton.id === 'toggle-dashed') {
                        this.edgeChars.dashed = true;
                    }
                    // update type of selected edges
                    if (this.selector.edges.length > 0) {
                        this.stateHandler.saveState();
                        this.selector.edges.forEach(e => e.dashed = this.edgeChars.dashed);
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
            vertexColorPicker.value = this.vertexChars.color;
            this.vertexSize.value = this.vertexChars.size.toString();
            this.vertexShapeButtons.forEach(btn => {
                btn.removeAttribute("disabled");
                btn.classList.remove("active");
                // Highlight the correct shape button
                if (btn.getAttribute("data-shape") === this.vertexChars.shape) {
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
        else {
            bendColorPicker.value = this.bendChars.color;
            this.bendSize.value = this.bendChars.size.toString();
        }
        if (edgeSelected) {
            const e = this.selector.edges[this.selector.edges.length - 1];
            edgeColorPicker.value = e.color;
            this.edgeThickness.value = e.thickness.toString();
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
            edgeColorPicker.value = this.edgeChars.color;
            this.edgeThickness.value = this.edgeChars.thickness.toString();
            // update dashed edge buttons
            if (this.edgeChars.dashed) {
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
