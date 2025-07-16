// context-menu.ts
// DOM elements (initialized on DOMContentLoaded)
let customContextMenu = null;
let menuItemAddVertex = null;
let menuItemRenameLabel = null;
let menuItemDeleteSelected = null;
let menuActions = {};
/**
 * Initializes the context menu and sets up its event listeners.
 * @param actions An object containing callback functions for each menu item.
 */
export function initializeContextMenu(actions) {
    customContextMenu = document.getElementById('customContextMenu');
    menuItemAddVertex = document.getElementById('menuItemAddVertex');
    menuItemRenameLabel = document.getElementById('menuItemRenameLabel');
    menuItemDeleteSelected = document.getElementById('menuItemDeleteSelected');
    // ... get references for other menu items
    menuActions = actions; // Store the provided actions
    if (!customContextMenu) {
        console.error("Context menu element not found. Context menu disabled.");
        return;
    }
    // Attach internal click handlers to menu items
    menuItemAddVertex === null || menuItemAddVertex === void 0 ? void 0 : menuItemAddVertex.addEventListener('click', (e) => { var _a; hideContextMenu(); (_a = menuActions.onAddVertex) === null || _a === void 0 ? void 0 : _a.call(menuActions, e); });
    menuItemRenameLabel === null || menuItemRenameLabel === void 0 ? void 0 : menuItemRenameLabel.addEventListener('click', (e) => { var _a; hideContextMenu(); (_a = menuActions.onRenameLabel) === null || _a === void 0 ? void 0 : _a.call(menuActions, e); });
    menuItemDeleteSelected === null || menuItemDeleteSelected === void 0 ? void 0 : menuItemDeleteSelected.addEventListener('click', (e) => { var _a; hideContextMenu(); (_a = menuActions.onDeleteSelected) === null || _a === void 0 ? void 0 : _a.call(menuActions, e); });
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
export function showDynamicContextMenu(e, clickedObjectType, specificData) {
    e.preventDefault(); // Prevent the browser's default context menu
    hideContextMenu(); // Hide any currently open menu
    hideAllMenuItems(); // Start by hiding all options
    // Show relevant menu items based on the condition
    if (clickedObjectType === 'vertex') {
        menuItemRenameLabel === null || menuItemRenameLabel === void 0 ? void 0 : menuItemRenameLabel.classList.remove('hidden');
        menuItemDeleteSelected === null || menuItemDeleteSelected === void 0 ? void 0 : menuItemDeleteSelected.classList.remove('hidden');
        // ... show other vertex-specific options
    }
    else if (clickedObjectType === 'edge') {
        menuItemDeleteSelected === null || menuItemDeleteSelected === void 0 ? void 0 : menuItemDeleteSelected.classList.remove('hidden'); // For deleting edge
        // ... show other edge-specific options
    }
    else if (clickedObjectType === 'canvas') {
        menuItemAddVertex === null || menuItemAddVertex === void 0 ? void 0 : menuItemAddVertex.classList.remove('hidden');
        // ... show other canvas-specific options
    }
    // Position the context menu
    customContextMenu.style.left = `${e.clientX}px`;
    customContextMenu.style.top = `${e.clientY}px`;
    customContextMenu.style.display = 'block';
    // Set up a one-time listener to hide the menu when the user clicks anywhere else
    setTimeout(() => {
        document.addEventListener('click', hideContextMenu, { once: true });
        document.addEventListener('contextmenu', hideContextMenu, { once: true });
    }, 10);
}
// Helper to hide all items initially
function hideAllMenuItems() {
    if (customContextMenu) {
        const allMenuItems = customContextMenu.querySelectorAll('.context-menu-item');
        allMenuItems.forEach(item => item.classList.add('hidden'));
    }
}
// Helper to hide the context menu
function hideContextMenu() {
    if (customContextMenu) {
        customContextMenu.style.display = 'none';
    }
}
// Call initializeContextMenu on DOMContentLoaded from main.ts
// The actual event listener for contextmenu will still be in main.ts
// because it needs to know what object was clicked to call showDynamicContextMenu.
