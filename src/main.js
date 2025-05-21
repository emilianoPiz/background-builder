// js/main.js
/**
 * @file main.js
 * @description Main entry point for the BackgroundCraft application.
 * This script initializes the BackgroundBuilder, registers available background effects
 * from the BackgroundManifest, populates the UI (specifically the effect selector dropdown),
 * and handles loading/saving of the last used effect and its options to localStorage.
 * It also sets up event listeners for UI interactions.
 */

import BackgroundBuilder from './BackgroundBuilder.js'; // Core class for managing backgrounds.
import backgroundRegistry from './BackgroundManifest.js'; // Array of background effect definitions.

/**
 * @constant {string} LAST_EFFECT_KEY
 * @description The localStorage key used to store the name of the last selected background effect.
 * @default
 */
const LAST_EFFECT_KEY = 'backgroundCraft_lastEffect';

/**
 * @constant {string} LAST_OPTIONS_KEY_PREFIX
 * @description The prefix for localStorage keys used to store the options of the last selected background effects.
 * The full key is formed by appending the effect name to this prefix.
 * @default
 */
const LAST_OPTIONS_KEY_PREFIX = 'backgroundCraft_lastOptions_';

/**
 * Saves the name and options of the currently selected background effect to localStorage.
 * This allows the application to remember the user's last session.
 * @param {string} effectName - The name of the effect to save.
 * @param {Object} options - The current options object for the effect.
 */
function saveLastEffect(effectName, options) {
    try {
        localStorage.setItem(LAST_EFFECT_KEY, effectName);
        localStorage.setItem(`${LAST_OPTIONS_KEY_PREFIX}${effectName}`, JSON.stringify(options));
        console.log(`[main.saveLastEffect] Saved effect "${effectName}" and its options to localStorage.`);
    } catch (e) {
        console.warn("[main.saveLastEffect] Could not save last effect to localStorage:", e);
    }
}

/**
 * Loads the name and options of the last selected background effect from localStorage.
 * @returns {{name: string | null, options: Object | null}} An object containing the loaded
 * effect name and its options. Returns null for both if nothing is found or an error occurs.
 */
function loadLastEffect() {
    try {
        const name = localStorage.getItem(LAST_EFFECT_KEY); // Retrieve the name of the last effect.
        if (name) {
            const optionsString = localStorage.getItem(`${LAST_OPTIONS_KEY_PREFIX}${name}`); // Retrieve options for that effect.
            console.log(`[main.loadLastEffect] Loaded effect "${name}" from localStorage. Options string:`, optionsString);
            return { name, options: optionsString ? JSON.parse(optionsString) : null };
        }
    } catch (e) {
        console.warn("[main.loadLastEffect] Could not load last effect from localStorage:", e);
    }
    console.log("[main.loadLastEffect] No last effect found in localStorage or error during load.");
    return { name: null, options: null };
}


/**
 * Initializes the application once the DOM is fully loaded.
 * Sets up the BackgroundBuilder, registers effects, populates UI elements,
 * and loads any previously saved state.
 * @listens DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log("[main.DOMContentLoaded] DOM Loaded. Initializing builder...");

    /**
     * Instance of the BackgroundBuilder.
     * @type {BackgroundBuilder}
     */
    // MODIFIED: Pass null for codeOutputId, exportButtonId, and copyCodeButtonId
    // as these elements are no longer directly on the page for BackgroundBuilder's constructor
    // to find. Their functionality is now handled via modals and direct DOM manipulation
    // within BackgroundBuilder methods or inline HTML script.
    const builder = new BackgroundBuilder(
        'preview-canvas',       // ID of the preview canvas
        'controls-container',   // ID of the controls container
        null,                   // Was 'code-output', now handled by modal
        null,                   // Was 'export-code-button', now handled by modal trigger
        null                    // Was 'copy-code-button', now handled by modal
    );

    // Check if BackgroundBuilder initialized correctly.
    if (!builder.valid) {
        console.error("[main.DOMContentLoaded] BackgroundBuilder failed to initialize. Aborting.");
        const mainContent = document.querySelector('.builder-main-content'); // Attempt to display error in UI.
        if (mainContent) {
            mainContent.innerHTML = `
                <div style="color: #ff07eb; text-align: center; padding: 20px; font-size: 1.2em; font-family: 'Roboto Mono', monospace; border: 1px solid #ff07eb; box-shadow: 0 0 10px #ff07eb;">
                    CRITICAL SYSTEM ERROR: UI Core (BackgroundBuilder) failed to initialize. <br> Essential rendering components might be offline. <br> Check console logs for diagnostics.
                </div>`;
        }
        return;
    }

    /**
     * Exposes the builder instance globally for debugging purposes.
     * @global
     * @name builderInstance
     * @type {BackgroundBuilder}
     */
    window.builderInstance = builder;
    console.log("[main.DOMContentLoaded] Builder instance initialized:", builder);
    console.log("[main.DOMContentLoaded] Backgrounds to register from manifest:", backgroundRegistry);

    // --- Register backgrounds from the manifest ---
    if (backgroundRegistry && backgroundRegistry.length > 0) {
        backgroundRegistry.forEach((bgDetails) => { // Iterate through background definitions from the manifest.
            if (bgDetails.classRef && typeof bgDetails.classRef === 'function') {
                console.log(`[main.DOMContentLoaded] Registering: ${bgDetails.name} (Class: ${bgDetails.classRef.name})`);
                builder.registerBackground( // Register each background with the builder.
                    bgDetails.name,
                    bgDetails.classRef,
                    bgDetails.defaults || {},
                    bgDetails.schema || []
                );
            } else {
                console.error(`[main.DOMContentLoaded] Cannot register background "${bgDetails.name}": classRef is missing or not a function. Check backgroundManifest.js and the individual background file imports/exports.`);
            }
        });
    } else {
        console.warn("[main.DOMContentLoaded] No backgrounds found in the manifest or manifest is empty. Check js/backgroundManifest.js.");
    }


    // --- Populate the background selector dropdown ---
    const bgSelect = document.getElementById('bg-type-select'); // Get the dropdown element.
    if (!bgSelect) {
        console.error("[main.DOMContentLoaded] Background select dropdown ('bg-type-select') not found!");
        return;
    }

    // Clear existing options except the first placeholder option.
    while (bgSelect.options.length > 1) {
        bgSelect.remove(1);
    }

    const registeredNames = Object.keys(builder.registeredBackgrounds); // Get names of all registered backgrounds.
    if (registeredNames.length === 0) {
        if (bgSelect.options.length <= 1) { // If no backgrounds registered, show a message in dropdown.
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "No Modules Loaded";
            option.disabled = true;
            bgSelect.appendChild(option);
        }
        console.warn("[main.DOMContentLoaded] No backgrounds were successfully registered into the builder. Check manifest and class definitions.");
    } else {
        registeredNames.forEach(name => { // Populate dropdown with registered background names.
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            bgSelect.appendChild(option);
        });
    }

    // Event listener for dropdown changes to select a background.
    bgSelect.addEventListener('change', (e) => {
        // Ensure e.target is an HTMLSelectElement before accessing its value
        if (e.target instanceof HTMLSelectElement) {
            const selectedValue = e.target.value;
            if (selectedValue && builder.registeredBackgrounds[selectedValue]) {
                builder.selectBackground(selectedValue); // Select the background in the builder.
                // Code snippet generation is now triggered by a dedicated button, not on select.
                if (builder.currentOptions) {
                    saveLastEffect(selectedValue, builder.currentOptions); // Save the newly selected effect and its options.
                }
            } else {
                builder.clearCurrentBackground(); // Clear current background if "Select Effect" is chosen.
                localStorage.removeItem(LAST_EFFECT_KEY); // Remove the last effect from storage.
            }
        }
    });

    // --- Load last used effect ---
    const lastEffect = loadLastEffect(); // Attempt to load the last used effect from localStorage.
    if (lastEffect.name && builder.registeredBackgrounds[lastEffect.name]) {
        bgSelect.value = lastEffect.name; // Set dropdown to the loaded effect.
        builder.selectBackground(lastEffect.name, lastEffect.options || undefined); // Select the background with its saved options.
        // Code snippet generation is now triggered by a dedicated button.
        console.log(`[main.DOMContentLoaded] Loaded and selected last effect: "${lastEffect.name}" with options:`, lastEffect.options);
    } else if (registeredNames.length > 0) {
        builder.clearCurrentBackground();
        console.log("[main.DOMContentLoaded] No valid last effect loaded, or no last effect. Cleared background.");
    } else {
        builder.clearCurrentBackground();
        console.log("[main.DOMContentLoaded] No registered effects available. Cleared background.");
    }

    /**
     * Listens for custom 'backgroundOptionChanged' events dispatched by BackgroundBuilder.
     * When an option changes, it saves the current effect's name and all its options.
     * @listens backgroundOptionChanged
     * @param {CustomEvent} event - The custom event object.
     * @param {object} event.detail - The detail object.
     * @param {string} event.detail.effectName - The name of the effect whose option changed.
     * @param {object} event.detail.options - The complete set of options for that effect.
     */
    document.addEventListener('backgroundOptionChanged', (event) => {
        // Ensure event is a CustomEvent and has the expected detail structure
        if (event instanceof CustomEvent && event.detail && event.detail.effectName && event.detail.options) {
            saveLastEffect(event.detail.effectName, event.detail.options); // Save changes to localStorage.
            console.log(`[main.backgroundOptionChanged] Detected option change for "${event.detail.effectName}". Saved to localStorage.`);
        } else {
            console.warn("[main.backgroundOptionChanged] Received event with incomplete details:", event.detail);
        }
    });

    // Reset options button functionality
    const resetOptionsButton = document.getElementById('reset-options-button');
    if (resetOptionsButton) {
        resetOptionsButton.addEventListener('click', () => {
            if (builder && builder.currentBackgroundType && builder.registeredBackgrounds[builder.currentBackgroundType]) {
                const currentBgName = builder.currentBackgroundType;
                const defaultOptions = builder.registeredBackgrounds[currentBgName].defaults;
                console.log(`[main.resetOptions] Resetting options for "${currentBgName}" to defaults:`, defaultOptions);
                // Reselect the background with its default options
                builder.selectBackground(currentBgName, JSON.parse(JSON.stringify(defaultOptions)));
                // Save the reset state
                saveLastEffect(currentBgName, builder.currentOptions);
            } else {
                console.warn("[main.resetOptions] No current background selected or found to reset.");
            }
        });
    }


    console.log("[main.DOMContentLoaded] Initialization sequence complete.");
});
