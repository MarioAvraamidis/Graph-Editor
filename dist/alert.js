// Declare variables that will hold references to the DOM elements
// These are initialized to null/undefined and will be assigned in DOMContentLoaded
let customAlert = null;
let customAlertMessage = null;
let customAlertCloseBtn = null;
/**
 * Initializes the custom alert system by getting DOM element references
 * and setting up the close button listener.
 * This function should be called once after the DOM is fully loaded.
 */
function initializeCustomAlert() {
    customAlert = document.getElementById('customAlert');
    customAlertMessage = document.getElementById('customAlertMessage');
    customAlertCloseBtn = document.getElementById('customAlertCloseBtn');
    if (customAlertCloseBtn) {
        customAlertCloseBtn.addEventListener('click', hideCustomAlert);
    }
    else {
        console.error("Custom alert close button not found. Alert system might not function correctly.");
    }
    if (!customAlert || !customAlertMessage) {
        console.error("Custom alert elements (container or message span) not found. Alert system disabled.");
        // Optionally disable alert functionality if elements are missing
        // showCustomAlert = () => console.warn("Custom alert is not initialized due to missing DOM elements.");
    }
}
/**
 * Shows a custom alert message.
 * @param message The message to display.
 * @param type The type of alert ('warning', 'error', 'success'). Defaults to 'warning'.
 * @param duration Optional. How long the alert should be visible in milliseconds. Default is 3000ms (3 seconds).
 */
export function showCustomAlert(message, type = 'warning', duration = 3000) {
    if (!customAlert || !customAlertMessage) {
        console.error("Custom alert elements are not initialized or missing.");
        return;
    }
    // Set message text
    customAlertMessage.textContent = message;
    // Reset and set alert type class
    customAlert.classList.remove('warning', 'error', 'success', 'active'); // Remove previous types and active state
    customAlert.classList.add(type); // Add the new type
    // Activate the display (this triggers the CSS transition)
    customAlert.classList.add('active');
    customAlert.style.display = 'block'; // Ensure it's not 'none' during the transition setup
    // Set a timeout to hide the alert automatically
    if (duration > 0) {
        setTimeout(() => {
            hideCustomAlert();
        }, duration);
    }
}
/**
 * Hides the custom alert message.
 */
function hideCustomAlert() {
    if (customAlert) {
        // Remove 'active' class to trigger fade-out transition
        customAlert.classList.remove('active');
        // Hide it completely after the transition ends
        // This is important to allow clicks on elements beneath it
        setTimeout(() => {
            customAlert.style.display = 'none';
        }, 300); // Match this duration to your CSS transition duration (opacity)
    }
}
// Call the initialization function when the DOM is fully loaded
// This makes the alert module self-contained and ready when imported.
document.addEventListener('DOMContentLoaded', initializeCustomAlert);
