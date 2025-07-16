// context-menu.ts

// DOM elements (initialized on DOMContentLoaded)
let customContextMenu: HTMLElement | null = null;
let menuItemAddVertex: HTMLElement | null = null;
let menuItemRenameLabel: HTMLElement | null = null;
let menuItemDeleteSelected: HTMLElement | null = null;
// ... other menu items

// Callbacks will be stored here after initialization
type ContextMenuActions = {
    onAddVertex?: (e: MouseEvent) => void;
    onRenameLabel?: (e: MouseEvent) => void;
    onDeleteSelected?: (e: MouseEvent) => void;
    onSettings?: (e: MouseEvent) => void;
    // ... define types for all other actions
};
let menuActions: ContextMenuActions = {};


/**
 * Initializes the context menu and sets up its event listeners.
 * @param actions An object containing callback functions for each menu item.
 */
export function initializeContextMenu(actions: ContextMenuActions): void {
    customContextMenu = document.getElementById('customContextMenu') as HTMLElement;
    menuItemAddVertex = document.getElementById('menuItemAddVertex') as HTMLElement;
    menuItemRenameLabel = document.getElementById('menuItemRenameLabel') as HTMLElement;
    menuItemDeleteSelected = document.getElementById('menuItemDeleteSelected') as HTMLElement;
    // ... get references for other menu items

    menuActions = actions; // Store the provided actions

    if (!customContextMenu) {
        console.error("Context menu element not found. Context menu disabled.");
        return;
    }

    // Attach internal click handlers to menu items
    menuItemAddVertex?.addEventListener('click', (e) => { hideContextMenu(); menuActions.onAddVertex?.(e); });
    menuItemRenameLabel?.addEventListener('click', (e) => { hideContextMenu(); menuActions.onRenameLabel?.(e); });
    menuItemDeleteSelected?.addEventListener('click', (e) => { hideContextMenu(); menuActions.onDeleteSelected?.(e); });
    // ... attach listeners for other items

    // Add the main contextmenu listener to your canvas or document
    // This part might still be in main.ts if it depends on specific canvas state,
    // or you can pass the element to listen on. Let's assume you pass it.
    // However, the logic for *which* options to show depends on the click context,
    // so `showDynamicContextMenu` should also be exported and take context.
}


/**
 * Shows the custom context menu with options filtered by the given context.
 * @param e The mouse event that triggered the context menu.
 * @param clickedObjectType The type of object clicked ('vertex' | 'edge' | 'canvas').
 * @param specificData Optional. Any specific data about the clicked object (e.g., the vertex object itself).
 */
export function showDynamicContextMenu(e: MouseEvent, clickedObjectType: 'vertex' | 'edge' | 'canvas', specificData?: any): void {
    e.preventDefault(); // Prevent the browser's default context menu

    hideContextMenu(); // Hide any currently open menu
    hideAllMenuItems(); // Start by hiding all options

    // Show relevant menu items based on the condition
    if (clickedObjectType === 'vertex') {
        menuItemRenameLabel?.classList.remove('hidden');
        menuItemDeleteSelected?.classList.remove('hidden');
        // ... show other vertex-specific options
    } else if (clickedObjectType === 'edge') {
        menuItemDeleteSelected?.classList.remove('hidden'); // For deleting edge
        // ... show other edge-specific options
    } else if (clickedObjectType === 'canvas') {
        menuItemAddVertex?.classList.remove('hidden');
        // ... show other canvas-specific options
    }

    // Position the context menu
    customContextMenu!.style.left = `${e.clientX}px`;
    customContextMenu!.style.top = `${e.clientY}px`;
    customContextMenu!.style.display = 'block';

    // Set up a one-time listener to hide the menu when the user clicks anywhere else
    setTimeout(() => { // Small delay to avoid immediate close
        document.addEventListener('click', hideContextMenu, { once: true });
        document.addEventListener('contextmenu', hideContextMenu, { once: true });
    }, 10);
}

// Helper to hide all items initially
function hideAllMenuItems(): void {
    if (customContextMenu) {
        const allMenuItems = customContextMenu.querySelectorAll('.context-menu-item');
        allMenuItems.forEach(item => item.classList.add('hidden'));
    }
}

// Helper to hide the context menu
function hideContextMenu(): void {
    if (customContextMenu) {
        customContextMenu.style.display = 'none';
    }
}

// Call initializeContextMenu on DOMContentLoaded from main.ts
// The actual event listener for contextmenu will still be in main.ts
// because it needs to know what object was clicked to call showDynamicContextMenu.