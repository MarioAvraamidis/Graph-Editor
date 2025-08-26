import { Drawer } from "./draw.js";
import { Graph, Point } from "./graph.js";
import { Selector } from "./selector.js";
import { SimpleDrawer } from "./simpleDrawer.js";
import { Scaler } from "./zoomHelpers.js";

// export type DrawGraphCallback = (ctx: CanvasRenderingContext2D, scale: number) => void;

export class CanvasHandler {
    public canvas: HTMLCanvasElement;
    public ctx: CanvasRenderingContext2D;
    // private scale: number = 1.0;
    private scaler: Scaler;
    private drawer: Drawer | SimpleDrawer;
    private graph: Graph;
    private zoomDisplaySpan: HTMLElement | null = null;


    constructor(canvas: HTMLCanvasElement, drawer: Drawer | SimpleDrawer, graph: Graph) {
        this.canvas = canvas;
        if (!this.canvas) {
            // throw new Error(`Canvas with ID '${canvasId}' not found.`);
            throw new Error(`Canvas not found.`);
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
        this.scaler.translateX = this.canvas.clientWidth / 2;  // Use clientWidth/Height for CSS pixels
        this.scaler.translateY = this.canvas.clientHeight / 2; // Use clientWidth/Height for CSS pixels
        // --- END UPDATED ---

        this.addEventListeners();
        // this.drawContent();
    }

    private handleWindowResize(): void {
        this.resizeCanvas();
        // On resize, we might want to keep the current world center, or snap to (0,0) centered.
        // For simplicity, let's snap world (0,0) back to canvas center on resize.
        // this.translateX = this.canvas.clientWidth / 2;
        // this.translateY = this.canvas.clientHeight / 2;
        this.drawContent();
    }

    private resizeCanvas(): void {
        const dpr = window.devicePixelRatio || 1;
        // Set the canvas's internal drawing buffer dimensions
        // to match its visual display dimensions, scaled by devicePixelRatio for sharpness.
        this.canvas.width = this.canvas.clientWidth * dpr;
        this.canvas.height = this.canvas.clientHeight * dpr;
        // console.log("canvas (width,height)=("+this.canvas.width+","+this.canvas.height+")    dpr="+dpr);
    }

    // --- FIX START ---

    // drawContent now handles both clearing and applying transforms
    private drawContent(): void {
        const dpr = window.devicePixelRatio || 1;

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
        this.drawer.renderGraph(this.graph,this.canvas);

        if (this.drawer instanceof Drawer)
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

    private zoom(scaleFactor: number, mouseX?: number, mouseY?: number): void {
        const oldScale = this.scaler.scale;
        let newScale = this.scaler.scale * scaleFactor;
        newScale = Math.max(this.scaler.MIN_SCALE, Math.min(this.scaler.MAX_SCALE, newScale));
        if (newScale === oldScale) return;

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
        } else {
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

    private pan(dx: number, dy: number): void {
        // dx and dy are assumed to be in CSS pixels.
        // We want panning to move the view, not the individual elements.
        this.scaler.translateX += dx;
        this.scaler.translateY += dy;
        this.drawContent();
    }

    public resetView(): void {
        this.scaler.scale = 1.0;
        this.scaler.translateX = this.canvas.clientWidth / 2;
        this.scaler.translateY = this.canvas.clientHeight / 2;
        this.drawContent();
    }

    public fixView(/* graph: Graph,*/ selector: Selector | null = null)
    {
        // check if there are selected points
        let points: Point[] = [];
        if (selector && selector.points.length > 0)
            points = selector.points;
        else
        {
            points = points.concat(this.graph.vertices);
            points = points.concat(this.graph.getBends());
        }
        if (points.length === 0)
        {
            this.resetView();
            return;
        }
        // console.log("NEW");
        // points.forEach(p => console.log(p.id));
        this.fixViewRect(this.findMaxY(points)!,this.findMinY(points)!,this.findMinX(points)!,this.findMaxX(points)!);
    }

    private fixViewRect(top: number, bottom: number, left: number, right: number, paddingFactor: number = 0.75): void {
        // console.log("top:",top,"\nbottom:",bottom,"\nleft:",left,"\nright:",right);
        const worldWidth = right - left;
        const worldHeight = top - bottom;

        const canvasWidth = this.canvas.clientWidth;  // CSS pixels
        const canvasHeight = this.canvas.clientHeight; // CSS pixels
        // console.log("canvasWidth:",canvasWidth,"canvasHeight:",canvasHeight);

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
        let scaleX, scaleY, newScale=1;
        if (worldWidth >= 1e-5 )
            scaleX = (canvasWidth * paddingFactor) / worldWidth;
        if (worldHeight >= 1e-5 )
            scaleY = (canvasHeight * paddingFactor) / worldHeight;

        // Choose the smaller scale to ensure the entire content fits
        if (scaleX)
        {
            newScale = scaleX;
            if (scaleY)
                newScale = Math.min(scaleY, newScale);
        }
        else if(scaleY)
            newScale = scaleY;
        

        // Clamp the new scale within the defined min/max limits
        newScale = Math.max(this.scaler.MIN_SCALE, Math.min(this.scaler.MAX_SCALE, newScale));

        this.scaler.scale = newScale;

        // Calculate the new translation (translateX, translateY) to center the world box
        this.scaler.translateX = canvasCenterX - (worldCenterX * this.scaler.scale);
        this.scaler.translateY = canvasCenterY - (worldCenterY * this.scaler.scale);

        this.drawContent(); // Redraw the canvas with the new view
    }

    private addEventListeners(): void {
        this.canvas.addEventListener('wheel', this.handleMouseWheel.bind(this));
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.getElementById('zoomInButton')?.addEventListener('click', () => this.zoom(this.scaler.ZOOM_FACTOR));
        document.getElementById('zoomOutButton')?.addEventListener('click', () => this.zoom(1 / this.scaler.ZOOM_FACTOR));
        // document.getElementById('resetViewButton')?.addEventListener('click', () => this.resetView());
        // document.getElementById('fix-view')?.addEventListener('click', () => this.fixView());
    }

    private handleMouseWheel(event: WheelEvent): void {
        event.preventDefault();
        const scaleAmount = this.scaler.ZOOM_FACTOR;
        const delta = event.deltaY;
        if (delta < 0) {
            this.zoom(scaleAmount, event.clientX, event.clientY);
        } else {
            this.zoom(1 / scaleAmount, event.clientX, event.clientY);
        }
    }

    private handleKeyDown(event: KeyboardEvent): void {
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

    public redraw(): void {
        this.drawContent();
    }

    public getScale(): number {return this.scaler.scale}

    private updateZoomDisplay(): void {
        if (this.zoomDisplaySpan) {
            const zoomPercentage = (this.scaler.scale * 100).toFixed(0); // No decimal places for simplicity
            this.zoomDisplaySpan.textContent = `${zoomPercentage}%`;
        }
    }

    
    // find the max x-coordinate of the given points
    private findMaxX(points: Point[])
    {
        if (points.length === 0)
            return;
        let maxX = points[0].x;
        for (let i=1;i<points.length;i++)
            if (points[i].x > maxX)
                maxX = points[i].x;
        return maxX;
    }

    // find the min x-coordinate of the given points
    private findMinX(points: Point[])
    {
        if (points.length === 0)
            return null;
        let minX = points[0].x;
        for (let i=1;i<points.length;i++)
            if (points[i].x < minX)
                minX = points[i].x;
        return minX;
    }

    // find the max y-coordinate of the given points
    private findMaxY(points: Point[])
    {
        if (points.length === 0)
            return null;
        let maxY = points[0].y;
        for (let i=1;i<points.length;i++)
            if (points[i].y > maxY)
                maxY = points[i].y;
        /*if (this.drawer instanceof SimpleDrawer)
        {
            console.log("maxY:",maxY);
            console.log("canvasHeight:",this.canvas.height);
        }*/
        return maxY;
    }

    // find the min y-coordinate of the given points
    private findMinY(points: Point[])
    {
        if (points.length === 0)
            return null;
        let minY = points[0].y;
        for (let i=1;i<points.length;i++)
            if (points[i].y < minY)
                minY = points[i].y;
        /*if (this.drawer instanceof SimpleDrawer)
        {
            console.log("minY:",minY);
            console.log("canvasHeight:",this.canvas.height);
        }*/
        return minY;
    }
}