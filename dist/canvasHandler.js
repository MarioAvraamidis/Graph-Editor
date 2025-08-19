// export type DrawGraphCallback = (ctx: CanvasRenderingContext2D, scale: number) => void;
export class CanvasHandler {
    // private readonly ZOOM_FACTOR: number = 1.1;
    // private readonly MIN_SCALE: number = 0.1;
    // private readonly MAX_SCALE: number = 10.0;
    // private readonly PAN_STEP: number = 20;
    constructor(canvasId, /* drawCallback: DrawGraphCallback,*/ drawer, graph) {
        // private translateX: number = 0;
        // private translateY: number = 0;
        // private drawCallback: DrawGraphCallback;
        this.zoomDisplaySpan = null;
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas with ID '${canvasId}' not found.`);
        }
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get 2D rendering context.');
        }
        this.ctx = ctx;
        // this.drawCallback = drawCallback;
        this.drawer = drawer;
        this.scaler = this.drawer.getScaler();
        this.graph = graph;
        // --- UPDATED: Dynamic sizing and DPI handling ---
        this.resizeCanvas(); // Call this once initially
        window.addEventListener('resize', this.handleWindowResize.bind(this));
        // Get reference to the zoom display span
        this.zoomDisplaySpan = document.getElementById('currentZoomSpan');
        // Set initial translation to center the graph's (0,0) in the canvas (in CSS pixels)
        // This is based on the *visual* size of the canvas, which is what the user perceives.
        this.scaler.translateX = this.canvas.clientWidth / 2; // Use clientWidth/Height for CSS pixels
        this.scaler.translateY = this.canvas.clientHeight / 2; // Use clientWidth/Height for CSS pixels
        // --- END UPDATED ---
        this.addEventListeners();
        // this.drawContent();
    }
    handleWindowResize() {
        this.resizeCanvas();
        // On resize, we might want to keep the current world center, or snap to (0,0) centered.
        // For simplicity, let's snap world (0,0) back to canvas center on resize.
        // this.translateX = this.canvas.clientWidth / 2;
        // this.translateY = this.canvas.clientHeight / 2;
        this.drawContent();
    }
    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        // Set the canvas's internal drawing buffer dimensions
        // to match its visual display dimensions, scaled by devicePixelRatio for sharpness.
        this.canvas.width = this.canvas.clientWidth * dpr;
        this.canvas.height = this.canvas.clientHeight * dpr;
        // console.log("canvas (width,height)=("+this.canvas.width+","+this.canvas.height+")    dpr="+dpr);
    }
    /*private applyTransform(): void {
        const dpr = window.devicePixelRatio || 1;

        // Reset transformation to identity
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Apply DPI scaling first to work with physical pixels
        // All subsequent drawing operations will be implicitly scaled by DPR
        this.ctx.scale(dpr, dpr);

        // Apply pan (translate) in CSS pixels
        this.ctx.translate(this.translateX, this.translateY);

        // Apply zoom (scale) in CSS pixels
        this.ctx.scale(this.scale, this.scale);
    }*/
    // --- FIX START ---
    // drawContent now handles both clearing and applying transforms
    drawContent() {
        const dpr = window.devicePixelRatio || 1;
        // TEMPORARY DEBUG LINE (remove later)
        // this.ctx.fillStyle = 'purple';
        // this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        // Then, the clearRect should wipe this purple out.
        // If you still see purple, clearRect isn't working.
        // 1. Reset the entire transformation matrix to identity
        // This is crucial to ensure clearRect operates on the full physical canvas
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        // 2. Clear the entire physical pixel buffer of the canvas
        // Use canvas.width and canvas.height attributes (physical pixels)
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // 3. Now apply the DPI scaling. All subsequent operations (translate, scale, draw) will be implicitly scaled.
        this.ctx.scale(dpr, dpr);
        // 4. Apply pan (translate) in CSS pixels
        this.ctx.translate(this.scaler.translateX, this.scaler.translateY);
        // 5. Apply zoom (scale) in CSS pixels
        this.ctx.scale(this.scaler.scale, this.scaler.scale);
        // 6. Call the external drawing function with the now transformed context
        // this.drawCallback(this.ctx, this.scaler.scale);
        this.drawer.renderGraph(this.graph, this.canvas);
        this.updateZoomDisplay();
        // Optional debug info: World origin (0,0) marker
        /*const crossArmLength = 10; // Length of each arm of the cross in world units at scale 1
        const halfCrossArmLength = crossArmLength / 2;

        // Set stroke style for the cross
        this.ctx.strokeStyle = 'red';
        // Adjust line width so it appears consistent regardless of zoom level
        // (e.g., always 2 physical pixels thick)
        this.ctx.lineWidth = 2 / this.scale;

        // Draw horizontal line for the cross
        this.ctx.beginPath();
        this.ctx.moveTo(-halfCrossArmLength, 0);
        this.ctx.lineTo(halfCrossArmLength, 0);
        this.ctx.stroke();

        // Draw vertical line for the cross
        this.ctx.beginPath();
        this.ctx.moveTo(0, -halfCrossArmLength);
        this.ctx.lineTo(0, halfCrossArmLength);
        this.ctx.stroke();*/
    }
    // The applyTransform method is no longer strictly needed as a separate method
    // because drawContent now handles the full sequence.
    // You can remove applyTransform or keep it as a private helper if other methods
    // need to apply the transform without drawing content (unlikely for this use case).
    // Let's remove it for simplicity.
    // --- FIX END ---
    // In CanvasHandler.ts
    /*public screenToWorld(clientX: number, clientY: number) {
        const canvasRect = this.canvas.getBoundingClientRect();
        // const dpr = window.devicePixelRatio || 1; // Not needed here, as it cancels out in the formula

        // 1. Get mouse position relative to the canvas element (in CSS pixels)
        const canvasX_css = clientX - canvasRect.left;
        const canvasY_css = clientY - canvasRect.top;

        // 2. Invert the combined transformations (Translate then Zoom, then DPR scaling for output)
        // The simplified formula based on the derivation above is:
        const worldX = (canvasX_css - this.scaler.translateX) / this.scaler.scale;
        const worldY = (canvasY_css - this.scaler.translateY) / this.scaler.scale;

        return { x: worldX, y: worldY };
    }

    public worldToCanvas(worldX: number, worldY: number): { x: number, y: number } {
        // const dpr = window.devicePixelRatio || 1; // Not needed as it cancels out, and translateX/Y are in CSS pixels

        // Apply zoom (scale), then pan (translate)
        const canvasX_css = (worldX * this.scaler.scale) + this.scaler.translateX;
        const canvasY_css = (worldY * this.scaler.scale) + this.scaler.translateY;

        return { x: canvasX_css, y: canvasY_css };
    }*/
    zoom(scaleFactor, mouseX, mouseY) {
        const oldScale = this.scaler.scale;
        let newScale = this.scaler.scale * scaleFactor;
        newScale = Math.max(this.scaler.MIN_SCALE, Math.min(this.scaler.MAX_SCALE, newScale));
        if (newScale === oldScale)
            return;
        if (mouseX !== undefined && mouseY !== undefined) {
            // Convert mouse screen coords to world coords *before* applying new scale
            const worldPointAtMouse = this.scaler.screenToWorld(mouseX, mouseY);
            this.scaler.scale = newScale; // Update scale
            // Re-calculate translation to keep worldPointAtMouse under the mouse cursor after new scale
            const canvasRect = this.canvas.getBoundingClientRect();
            const mouseCanvasX = mouseX - canvasRect.left;
            const mouseCanvasY = mouseY - canvasRect.top;
            this.scaler.translateX = mouseCanvasX - worldPointAtMouse.x * this.scaler.scale;
            this.scaler.translateY = mouseCanvasY - worldPointAtMouse.y * this.scaler.scale;
        }
        else {
            // For button zoom, zoom towards the center of the visible canvas (in CSS pixels)
            const centerX = this.canvas.clientWidth / 2;
            const centerY = this.canvas.clientHeight / 2;
            // Convert canvas center to world coordinates before zoom
            const worldCenterXBefore = (centerX - this.scaler.translateX) / oldScale;
            const worldCenterYBefore = (centerY - this.scaler.translateY) / oldScale;
            this.scaler.scale = newScale; // Update scale
            // Recalculate translation to keep worldCenter under the canvas center after new scale
            this.scaler.translateX = centerX - worldCenterXBefore * this.scaler.scale;
            this.scaler.translateY = centerY - worldCenterYBefore * this.scaler.scale;
        }
        this.drawContent();
    }
    pan(dx, dy) {
        // dx and dy are assumed to be in CSS pixels.
        // We want panning to move the view, not the individual elements.
        this.scaler.translateX += dx;
        this.scaler.translateY += dy;
        this.drawContent();
    }
    resetView() {
        this.scaler.scale = 1.0;
        this.scaler.translateX = this.canvas.clientWidth / 2;
        this.scaler.translateY = this.canvas.clientHeight / 2;
        this.drawContent();
    }
    fixView(graph, selector) {
        // check if there are selected points
        let points = [];
        if (selector.points.length > 0)
            points = selector.points;
        else {
            points = points.concat(graph.vertices);
            points = points.concat(graph.getBends());
        }
        if (points.length === 0) {
            this.resetView();
            return;
        }
        this.fixViewRect(this.findMaxY(points), this.findMinY(points), this.findMinX(points), this.findMaxX(points));
    }
    fixViewRect(top, bottom, left, right, paddingFactor = 0.8) {
        const worldWidth = right - left;
        const worldHeight = top - bottom;
        const canvasWidth = this.canvas.clientWidth; // CSS pixels
        const canvasHeight = this.canvas.clientHeight; // CSS pixels
        // Calculate world center regardless, as it's used in both cases
        const worldCenterX = left + (worldWidth / 2);
        const worldCenterY = bottom + (worldHeight / 2); // Assuming Y increases upwards in world coords
        const canvasCenterX = canvasWidth / 2;
        const canvasCenterY = canvasHeight / 2;
        // --- Handle invalid (NaN/Infinity) inputs first ---
        if (!isFinite(worldWidth) || !isFinite(worldHeight) || !isFinite(worldCenterX) || !isFinite(worldCenterY)) {
            console.warn("fixView: Invalid (non-finite) world dimensions. Resetting view.");
            this.resetView();
            return;
        }
        // --- Handle Degenerate Cases (line or point) ---
        if (worldWidth < 1e-5 && worldHeight < 1e-5) {
            // console.log("fixView: Degenerate world dimensions (line or point). Setting scale to 1 and centering.");
            this.scaler.scale = 1.0; // As requested, set scale to 1 for degenerate cases
            // Center the degenerate axis/point on the canvas
            this.scaler.translateX = canvasCenterX - (worldCenterX * this.scaler.scale);
            this.scaler.translateY = canvasCenterY - (worldCenterY * this.scaler.scale);
            this.drawContent();
            return; // Exit after handling degenerate case
        }
        // --- Handle Valid (Non-Degenerate) World Rectangle ---
        // Calculate the scale needed to fit the content with padding
        let scaleX, scaleY, newScale = 1;
        if (worldWidth >= 1e-5)
            scaleX = (canvasWidth * paddingFactor) / worldWidth;
        if (worldHeight >= 1e-5)
            scaleY = (canvasHeight * paddingFactor) / worldHeight;
        // Choose the smaller scale to ensure the entire content fits
        if (scaleX) {
            newScale = scaleX;
            if (scaleY)
                newScale = Math.min(scaleY, newScale);
        }
        else if (scaleY)
            newScale = scaleY;
        // Clamp the new scale within the defined min/max limits
        newScale = Math.max(this.scaler.MIN_SCALE, Math.min(this.scaler.MAX_SCALE, newScale));
        this.scaler.scale = newScale;
        // Calculate the new translation (translateX, translateY) to center the world box
        this.scaler.translateX = canvasCenterX - (worldCenterX * this.scaler.scale);
        this.scaler.translateY = canvasCenterY - (worldCenterY * this.scaler.scale);
        this.drawContent(); // Redraw the canvas with the new view
    }
    addEventListeners() {
        var _a, _b, _c;
        this.canvas.addEventListener('wheel', this.handleMouseWheel.bind(this));
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        (_a = document.getElementById('zoomInButton')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => this.zoom(this.scaler.ZOOM_FACTOR));
        (_b = document.getElementById('zoomOutButton')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => this.zoom(1 / this.scaler.ZOOM_FACTOR));
        (_c = document.getElementById('resetViewButton')) === null || _c === void 0 ? void 0 : _c.addEventListener('click', () => this.resetView());
        // document.getElementById('fix-view')?.addEventListener('click', () => this.fixView());
    }
    handleMouseWheel(event) {
        event.preventDefault();
        const scaleAmount = this.scaler.ZOOM_FACTOR;
        const delta = event.deltaY;
        if (delta < 0) {
            this.zoom(scaleAmount, event.clientX, event.clientY);
        }
        else {
            this.zoom(1 / scaleAmount, event.clientX, event.clientY);
        }
    }
    handleKeyDown(event) {
        let moved = false;
        // Pan speed is independent of current zoom, as it's added to translateX/Y in CSS pixels
        const actualPanStep = this.scaler.PAN_STEP; // This value is already in CSS pixels
        switch (event.key) {
            case 'ArrowLeft':
                this.pan(actualPanStep, 0); // Move view right (graph moves left)
                moved = true;
                break;
            case 'ArrowRight':
                this.pan(-actualPanStep, 0); // Move view left (graph moves right)
                moved = true;
                break;
            case 'ArrowUp':
                this.pan(0, actualPanStep); // Move view down (graph moves up)
                moved = true;
                break;
            case 'ArrowDown':
                this.pan(0, -actualPanStep); // Move view up (graph moves down)
                moved = true;
                break;
        }
        if (moved) {
            event.preventDefault();
        }
    }
    redraw() {
        this.drawContent();
    }
    getScale() { return this.scaler.scale; }
    updateZoomDisplay() {
        if (this.zoomDisplaySpan) {
            const zoomPercentage = (this.scaler.scale * 100).toFixed(0); // No decimal places for simplicity
            this.zoomDisplaySpan.textContent = `${zoomPercentage}%`;
        }
    }
    // find the max x-coordinate of the given points
    findMaxX(points) {
        if (points.length === 0)
            return;
        let maxX = points[0].x;
        for (let i = 1; i < points.length; i++)
            if (points[i].x > maxX)
                maxX = points[i].x;
        return maxX;
    }
    // find the min x-coordinate of the given points
    findMinX(points) {
        if (points.length === 0)
            return null;
        let minX = points[0].x;
        for (let i = 1; i < points.length; i++)
            if (points[i].x < minX)
                minX = points[i].x;
        return minX;
    }
    // find the max y-coordinate of the given points
    findMaxY(points) {
        if (points.length === 0)
            return null;
        let maxY = points[0].y;
        for (let i = 1; i < points.length; i++)
            if (points[i].y > maxY)
                maxY = points[i].y;
        return maxY;
    }
    // find the min y-coordinate of the given points
    findMinY(points) {
        if (points.length === 0)
            return null;
        let minY = points[0].y;
        for (let i = 1; i < points.length; i++)
            if (points[i].y < minY)
                minY = points[i].y;
        return minY;
    }
}
