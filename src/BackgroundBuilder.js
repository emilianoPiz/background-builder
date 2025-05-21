// js/BackgroundBuilder.js
/**
 * @file BackgroundBuilder.js
 * @description Manages the lifecycle of dynamic canvas backgrounds, including registration,
 * selection, rendering controls, updating options, and generating code snippets.
 * It acts as the central orchestrator for the background effects.
 */

// --- Helper Functions ---

/**
 * Parses an rgba or rgb string into an object with r, g, b, a components.
 * @param {string} rgbaString - The string to parse (e.g., "rgba(255,0,0,0.5)", "rgb(0,255,0)").
 * @returns {{r: number, g: number, b: number, a: number} | null} Parsed color object or null if invalid.
 */
function parseRgbaString(rgbaString) {
    if (typeof rgbaString !== 'string') return null;
    const match = rgbaString.match(/^rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(?:,\s*([\d.]+))?\)$/);
    if (match) {
        return {
            r: parseInt(match[1]),
            g: parseInt(match[2]),
            b: parseInt(match[3]),
            a: match[4] !== undefined ? parseFloat(match[4]) : 1
        };
    }
    return null;
}

/**
 * Converts R, G, B color components to a HEX string.
 * @param {number} r - Red component (0-255).
 * @param {number} g - Green component (0-255).
 * @param {number} b - Blue component (0-255).
 * @returns {string} HEX color string (e.g., "#FF0000").
 */
function rgbToHex(r, g, b) {
    const rSafe = Math.max(0, Math.min(255, r));
    const gSafe = Math.max(0, Math.min(255, g));
    const bSafe = Math.max(0, Math.min(255, b));
    return "#" + ((1 << 24) + (rSafe << 16) + (gSafe << 8) + bSafe).toString(16).slice(1).toUpperCase();
}

/**
 * Converts a HEX color string to an object with r, g, b components.
 * @param {string} hexString - The HEX string to parse (e.g., "#FF0000", "#F00").
 * @returns {{r: number, g: number, b: number} | null} Parsed color object or null if invalid.
 */
function hexToRgb(hexString) {
    if (typeof hexString !== 'string') return null;
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const hex = hexString.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Set of schema keys that represent single RGBA color strings
 * and should be enhanced with a visual color picker and alpha slider.
 * @type {Set<string>}
 */
const SINGLE_RGBA_TEXT_KEYS = new Set([
    'trailColorDark',     // DigitalRain
    'trailColorLight',    // DigitalRain
    'starColor',          // Starfield & CosmicPulsar
    'pulsarColor',        // CosmicPulsar
    'fireflyColor',       // FireflySwarm
    'mouseInjectColor'    // FlowingInk
]);
// --- End Helper Functions ---


/**
 * @class BackgroundBuilder
 * @classdesc Orchestrates the creation, customization, and code generation for dynamic canvas backgrounds.
 * It interfaces with the DOM to provide a user interface for selecting and configuring
 * various background effects.
 */
class BackgroundBuilder {
    // --- Class Property Declarations ---

    /**
     * The HTMLCanvasElement used for rendering live previews of the background effects.
     * @type {HTMLCanvasElement | null}
     * @public
     */
    previewCanvas = null;
    /**
     * The HTMLElement that serves as a container for dynamically generated UI controls
     * for the selected background effect.
     * @type {HTMLElement | null}
     * @public
     */
    controlsContainer = null;

    /**
     * A flag indicating whether the BackgroundBuilder instance was successfully initialized
     * with all required DOM elements.
     * @type {boolean}
     * @public
     */
    valid = false;
    /**
     * The 2D rendering context of the `previewCanvas`.
     * This is used by the background effects to draw onto the canvas.
     * @type {CanvasRenderingContext2D | null}
     * @private
     */
    ctx = null;
    /**
     * A record of all registered background effects.
     * Each key is the display name of the background, and the value is an object
     * containing the background's class constructor, class name, default options, and UI schema.
     * @type {Record<string, { class: any, className: string, defaults: Record<string, any>, schema: any[] }>}
     * @private
     */
    registeredBackgrounds = {};
    /**
     * The currently active background effect instance.
     * This will be an instance of one of the registered background classes.
     * @type {any | null}
     * @private
     */
    currentBackgroundInstance = null;
    /**
     * The string identifier (name) of the currently selected background type.
     * Corresponds to a key in `registeredBackgrounds`.
     * @type {string | null}
     * @private
     */
    currentBackgroundType = null;
    /**
     * An object holding the current configuration options for the active background effect.
     * These options are a combination of the effect's defaults and any user modifications.
     * @type {Record<string, any>}
     * @private
     */
    currentOptions = {};
    /**
     * A ResizeObserver instance that monitors the `previewCanvas`'s parent element
     * for size changes, allowing the canvas to be responsive.
     * @type {ResizeObserver | null}
     * @private
     */
    resizeObserver = null;

    /**
     * Creates an instance of BackgroundBuilder.
     * Initializes the builder by fetching necessary DOM elements and setting up
     * event listeners and the resize observer.
     * @param {string} previewCanvasId - The ID of the HTMLCanvasElement for live preview.
     * @param {string} controlsContainerId - The ID of the HTMLElement where controls will be rendered.
     * @param {string | null} _codeOutputId - (No longer used directly) Was ID for code output.
     * @param {string | null} _exportButtonId - (No longer used directly) Was ID for export button.
     * @param {string | null} _copyCodeButtonId - (No longer used directly) Was ID for copy button.
     * @constructor
     */
    constructor(previewCanvasId, controlsContainerId, _codeOutputId, _exportButtonId, _copyCodeButtonId) {
        console.log('[BackgroundBuilder.constructor] Initializing with IDs:',
            { previewCanvasId, controlsContainerId });

        this.previewCanvas = document.getElementById(previewCanvasId);
        this.controlsContainer = document.getElementById(controlsContainerId);

        if (!this.previewCanvas || !this.controlsContainer) {
            console.error("[BackgroundBuilder.constructor] Critical UI elements (previewCanvas or controlsContainer) not found! Check provided IDs.",
                {
                    previewCanvas: this.previewCanvas,
                    controlsContainer: this.controlsContainer,
                });
            this.valid = false;
            return;
        }
        this.valid = true;
        console.log('[BackgroundBuilder.constructor] Essential UI elements (previewCanvas, controlsContainer) found and validated.');

        if (this.previewCanvas instanceof HTMLCanvasElement) {
            this.ctx = this.previewCanvas.getContext('2d');
        } else {
             console.error("[BackgroundBuilder.constructor] previewCanvas is not an HTMLCanvasElement.", { previewCanvasId });
             this.valid = false;
             return;
        }

        if (!this.ctx) {
            console.error("[BackgroundBuilder.constructor] Failed to get 2D rendering context from preview canvas.", { previewCanvasId });
            this.valid = false;
            return;
        }
        console.log('[BackgroundBuilder.constructor] 2D rendering context obtained.');

        this.resizeObserver = new ResizeObserver(entries => {
            if (!this.previewCanvas || !this.valid) {
                console.warn('[BackgroundBuilder.ResizeObserver] ResizeObserver called but previewCanvas or builder is not valid.');
                return;
            }
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    this.previewCanvas.width = width;
                    this.previewCanvas.height = height;
                    if (this.currentBackgroundInstance && typeof this.currentBackgroundInstance.resize === 'function') {
                        this.currentBackgroundInstance.resize();
                        if (!this.currentBackgroundInstance.animationId && typeof this.currentBackgroundInstance.draw === 'function') {
                            this.currentBackgroundInstance.draw();
                        }
                    }
                } else {
                    console.warn('[BackgroundBuilder.ResizeObserver] Invalid dimensions observed. Canvas not resized.');
                }
            }
        });

        if (this.previewCanvas && this.previewCanvas.parentElement) {
            this.resizeObserver.observe(this.previewCanvas.parentElement);
            const rect = this.previewCanvas.parentElement.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                this.previewCanvas.width = rect.width;
                this.previewCanvas.height = rect.height;
            } else {
                this.previewCanvas.width = 600; // Default fallback width
                this.previewCanvas.height = 400; // Default fallback height
                if (this.previewCanvas.parentElement.style.height === '' || this.previewCanvas.parentElement.style.height === '0px') {
                    this.previewCanvas.parentElement.style.height = '400px'; // Ensure parent has some height
                }
            }
        } else if (this.previewCanvas) { // No parent, set default canvas size
            this.previewCanvas.width = 600;
            this.previewCanvas.height = 400;
            console.warn("[BackgroundBuilder.constructor] Preview canvas has no parent element. Set to default size (600x400).");
        }
        console.log('[BackgroundBuilder.constructor] Initialization complete.');
    }

    /**
     * Registers a new background effect class with the builder.
     * @param {string} name - The display name for the background effect.
     * @param {Function} BgClass - The constructor class for the background effect.
     * @param {Object} defaultOptions - Default configuration options for this background.
     * @param {Array<Object>} uiSchema - Schema describing the UI controls for this background's options.
     * @public
     */
    registerBackground(name, BgClass, defaultOptions, uiSchema) {
        if (!this.valid) {
            console.warn('[BackgroundBuilder.registerBackground] Attempted to register on an invalid builder. Aborting.');
            return;
        }
        if (!BgClass || typeof BgClass !== 'function') {
            console.error(`[BackgroundBuilder.registerBackground] Invalid class for "${name}". Failed.`);
            return;
        }
        const className = BgClass.name || 'UnnamedClass'; // Get class name for logging
        this.registeredBackgrounds[name] = {
            class: BgClass,
            className: className,
            defaults: defaultOptions || {},
            schema: uiSchema || [],
        };
        console.log(`[BackgroundBuilder.registerBackground] Registered "${name}" (Class: ${className})`);
    }

    /**
     * Selects and initializes a registered background effect.
     * @param {string} name - The name of the background effect to select.
     * @param {Object} [optionsToLoad] - Optional initial options to load.
     * @public
     */
    selectBackground(name, optionsToLoad) {
        if (!this.valid || !this.previewCanvas || !this.ctx || !this.controlsContainer) {
            console.warn('[BackgroundBuilder.selectBackground] Builder not fully initialized. Aborting.');
            return;
        }
        if (!this.registeredBackgrounds[name]) {
            console.error(`[BackgroundBuilder.selectBackground] Background "${name}" not registered.`);
            if (this.controlsContainer) { // Display error in controls panel
                 this.controlsContainer.innerHTML = `<p class="placeholder-text error-text">Error: Module "${name}" is not registered.</p>`;
            }
            return;
        }

        // Clean up previous background instance
        if (this.currentBackgroundInstance) {
            if (typeof this.currentBackgroundInstance.destroy === 'function') {
                this.currentBackgroundInstance.destroy();
            } else if (typeof this.currentBackgroundInstance.stop === 'function') { // Fallback to stop if no destroy
                this.currentBackgroundInstance.stop();
            }
            this.currentBackgroundInstance = null;
        }

        // Clear canvas before drawing new background
        if (this.ctx && this.previewCanvas.width > 0 && this.previewCanvas.height > 0) {
            this.ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        }

        const bgInfo = this.registeredBackgrounds[name];
        this.currentBackgroundType = name;
        // Deep copy defaults and merge with optionsToLoad
        this.currentOptions = JSON.parse(JSON.stringify(optionsToLoad || bgInfo.defaults));
        console.log(`[BackgroundBuilder.selectBackground] Selected "${name}". Options:`, this.currentOptions);

        // Ensure canvas has valid dimensions if it was 0x0
        if (this.previewCanvas.width === 0 || this.previewCanvas.height === 0) {
            const parentEl = this.previewCanvas.parentElement;
            if (parentEl) {
                const rect = parentEl.getBoundingClientRect();
                this.previewCanvas.width = rect.width > 0 ? rect.width : 600;
                this.previewCanvas.height = rect.height > 0 ? rect.height : 400;
                if (parentEl.style.height === '' || parentEl.style.height === '0px') { // Ensure parent has visual height
                    parentEl.style.height = '400px';
                }
            } else { // Fallback if no parent
                this.previewCanvas.width = 600; this.previewCanvas.height = 400;
            }
        }
        
        try {
            this.currentBackgroundInstance = new bgInfo.class(this.previewCanvas, { ...this.currentOptions });
        } catch (e) {
            console.error(`[BackgroundBuilder.selectBackground] Error instantiating ${bgInfo.className}:`, e);
            if(this.controlsContainer) this.controlsContainer.innerHTML = `<p class="placeholder-text error-text">Error creating module '${name}'. Check console.</p>`;
            this.currentBackgroundInstance = null; this.currentBackgroundType = null;
            return;
        }
        
        this.renderControls(bgInfo.schema);

        if (this.currentBackgroundInstance) {
            if (typeof this.currentBackgroundInstance.start === 'function') {
                this.currentBackgroundInstance.start();
            } else if (typeof this.currentBackgroundInstance.draw === 'function') { // For non-animated effects
                this.currentBackgroundInstance.draw();
            }
        }
        console.log(`[BackgroundBuilder.selectBackground] Selection of "${name}" complete.`);
    }

    /**
     * Renders UI controls for the currently selected background.
     * @param {Array<Object>} schema - The UI schema for the current background.
     * @private
     */
    renderControls(schema) {
        if (!this.valid || !this.controlsContainer) {
            console.warn('[BackgroundBuilder.renderControls] Controls container missing. Aborting.');
            return;
        }
        this.controlsContainer.innerHTML = ''; // Clear previous controls
        if (!schema || schema.length === 0) {
            this.controlsContainer.innerHTML = '<p class="placeholder-text">No adjustable parameters for this module.</p>';
            return;
        }

        schema.forEach(item => {
            const controlWrapper = document.createElement('div');
            controlWrapper.className = 'control-item';
            const labelEl = document.createElement('label');
            labelEl.htmlFor = `ctrl-${item.key}`;

            // Add label first for most types, but handle boolean specifically for layout
            if (item.type !== 'boolean') {
                labelEl.textContent = item.label + ':';
                controlWrapper.appendChild(labelEl);
            }

            let primaryInputControl; // This will be the main input element for the option

            if (item.type === 'boolean') {
                const checkboxInput = document.createElement('input');
                checkboxInput.type = 'checkbox';
                checkboxInput.checked = !!this.currentOptions[item.key]; // Ensure boolean
                checkboxInput.id = `ctrl-${item.key}`;
                
                labelEl.textContent = item.label; // Set label text for boolean
                
                const checkboxWrapper = document.createElement('div'); // Wrapper for layout
                checkboxWrapper.className = 'checkbox-wrapper';
                checkboxWrapper.appendChild(checkboxInput);
                checkboxWrapper.appendChild(labelEl); // Label after checkbox
                controlWrapper.appendChild(checkboxWrapper);
                
                primaryInputControl = checkboxInput; // This is the control to listen to
                checkboxInput.addEventListener('change', (e) => {
                    if (e.target instanceof HTMLInputElement) {
                        this.updateOption(item.key, e.target.checked);
                    }
                });
            }
            // Enhanced RGBA text input with visual picker
            else if (item.type === 'text' && SINGLE_RGBA_TEXT_KEYS.has(item.key)) {
                const textInput = document.createElement('input');
                textInput.type = 'text'; // Can be 'hidden' if only visual picker is desired
                textInput.id = `ctrl-${item.key}`;
                textInput.value = this.currentOptions[item.key] !== undefined ?
                    String(this.currentOptions[item.key]) :
                    (item.default !== undefined ? String(item.default) : (item.placeholder || ''));
                if (item.placeholder) textInput.placeholder = item.placeholder;
                
                primaryInputControl = textInput; // This text input remains the source of truth
                controlWrapper.appendChild(textInput);

                const pickerContainer = document.createElement('div');
                pickerContainer.className = 'rgba-picker-widget';
                // Apply some basic inline styles for the widget container
                pickerContainer.style.display = 'flex';
                pickerContainer.style.alignItems = 'center';
                pickerContainer.style.gap = '8px'; // Space between color input and alpha slider
                pickerContainer.style.marginTop = '4px'; // Space below the text input

                const colorInput = document.createElement('input'); // For RGB part
                colorInput.type = 'color';
                colorInput.className = 'rgba-color-part';
                colorInput.title = "Select RGB color";

                const alphaSlider = document.createElement('input'); // For Alpha part
                alphaSlider.type = 'range';
                alphaSlider.min = '0';
                alphaSlider.max = '1';
                alphaSlider.step = '0.01'; // 2 decimal places for alpha
                alphaSlider.className = 'rgba-alpha-part';
                alphaSlider.title = "Adjust alpha (opacity)";
                alphaSlider.style.flexGrow = "1"; // Allow slider to fill space

                /** Updates the visual color picker and alpha slider from the text input's RGBA value. */
                const updateVisualPickerFromText = () => {
                    const rgbaValue = textInput.value;
                    const parsed = parseRgbaString(rgbaValue);
                    if (parsed) {
                        colorInput.value = rgbToHex(parsed.r, parsed.g, parsed.b);
                        alphaSlider.value = String(parsed.a);
                    } else { // Handle cases where text input might not be a valid RGBA (e.g. user typed hex)
                        const hexRgb = hexToRgb(rgbaValue); // Try parsing as hex
                        if (hexRgb) {
                            colorInput.value = rgbToHex(hexRgb.r, hexRgb.g, hexRgb.b); // Ensure format #RRGGBB
                            alphaSlider.value = '1'; // Assume full alpha for plain hex
                        } else { // Fallback to default/placeholder if completely unparseable
                            const defaultSource = item.default || item.placeholder || 'rgba(0,0,0,1)';
                            const parsedDefault = parseRgbaString(defaultSource) || { r: 0, g: 0, b: 0, a: 1 };
                            colorInput.value = rgbToHex(parsedDefault.r, parsedDefault.g, parsedDefault.b);
                            alphaSlider.value = String(parsedDefault.a);
                        }
                    }
                };

                /** Updates the main text input's RGBA value from the visual color picker and alpha slider. */
                const updateTextFromVisualPicker = () => {
                    const hexColor = colorInput.value;
                    const alpha = parseFloat(alphaSlider.value);
                    const rgb = hexToRgb(hexColor);

                    if (rgb) {
                        const newRgbaString = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha.toFixed(2)})`;
                        if (textInput.value !== newRgbaString) {
                            textInput.value = newRgbaString;
                            // Dispatch an 'input' event on the textInput to trigger updateOption
                            textInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                        }
                    }
                };

                colorInput.addEventListener('input', updateTextFromVisualPicker);
                alphaSlider.addEventListener('input', updateTextFromVisualPicker);

                // If the textInput is directly edited, update the visual picker elements
                // This listener is separate from the one that calls `updateOption`
                textInput.addEventListener('input', () => {
                    // Defer to allow `updateOption` (called by the main listener) to process first
                    setTimeout(updateVisualPickerFromText, 0);
                });
                
                updateVisualPickerFromText(); // Initialize visual picker state

                pickerContainer.appendChild(colorInput);
                pickerContainer.appendChild(alphaSlider);
                controlWrapper.appendChild(pickerContainer);
            }
            // Standard select dropdown
            else if (item.type === 'select') {
                const selectInput = document.createElement('select');
                selectInput.id = `ctrl-${item.key}`;
                if (!item.options || !Array.isArray(item.options)) { // Safety check for options
                    item.options = [{value: '', label: 'Error: No options provided in schema'}];
                }
                item.options.forEach(opt => {
                    const optionEl = document.createElement('option');
                    optionEl.value = opt.value;
                    optionEl.textContent = opt.label;
                    if (String(this.currentOptions[item.key]) === String(opt.value)) {
                        optionEl.selected = true;
                    }
                    selectInput.appendChild(optionEl);
                });
                primaryInputControl = selectInput;
                selectInput.addEventListener('change', (e) => { // 'change' is more suitable for select
                    if (e.target instanceof HTMLSelectElement) {
                        this.updateOption(item.key, e.target.value);
                    }
                });
                controlWrapper.appendChild(selectInput);
            }
            // Default handler for other input types (number, non-RGBA text, standard color)
            else { 
                const generalInput = document.createElement('input');
                generalInput.type = item.type;
                generalInput.id = `ctrl-${item.key}`;
                generalInput.value = this.currentOptions[item.key] !== undefined ?
                                    String(this.currentOptions[item.key]) :
                                    (item.default !== undefined ? String(item.default) : '');
                if (item.placeholder) generalInput.placeholder = item.placeholder;
                
                if (item.type === 'number') {
                    if (item.min !== undefined) generalInput.min = String(item.min);
                    if (item.max !== undefined) generalInput.max = String(item.max);
                    // Set step for fine-grained control and to indicate decimal type
                    const schemaStep = parseFloat(item.step);
                    if (!isNaN(schemaStep) && Number.isInteger(schemaStep) && schemaStep >= 1) {
                        generalInput.step = String(schemaStep);
                    } else if (!isNaN(schemaStep)) { // Use schema step if it's a decimal (e.g., 0.1, 0.005)
                        generalInput.step = String(item.step);
                    } else { // Default for numbers that might be decimal but have no specific step
                        generalInput.step = '0.0001'; 
                    }
                }
                if (item.type === 'color' && !generalInput.value) { // Default for standard HTML color pickers
                     generalInput.value = '#00F2FF'; // A vibrant default
                }

                primaryInputControl = generalInput;
                controlWrapper.appendChild(generalInput);
            }

            // Attach the main 'input' event listener that calls updateOption
            // This applies to text, number, and the text part of our RGBA widget.
            // Boolean and Select have their own specific listeners ('change').
            if (primaryInputControl && item.type !== 'boolean' && item.type !== 'select') {
                 primaryInputControl.addEventListener('input', (e) => {
                    if (e.target instanceof HTMLInputElement) { // Ensure target is an input element
                        this.updateOption(item.key, e.target.value);
                    }
                });
            }

            // Add tooltip if specified in schema
            if (item.tooltip) {
                const tooltipEl = document.createElement('small');
                tooltipEl.className = 'control-tooltip';
                tooltipEl.textContent = item.tooltip;
                controlWrapper.appendChild(tooltipEl);
            }
            this.controlsContainer.appendChild(controlWrapper);
        });
    }

    /**
     * Updates a specific option for the current background.
     * Handles parsing, clamping, and rounding for numbers.
     * @param {string} key - The option key to update.
     * @param {*} value - The new value for the option.
     * @public
     */
    updateOption(key, value) {
        if (!this.valid || !this.previewCanvas) {
            console.warn('[BackgroundBuilder.updateOption] Builder invalid or previewCanvas missing.');
            return;
        }
        if (!this.currentBackgroundType) { 
            console.warn(`[BackgroundBuilder.updateOption] No current background type. Cannot update "${key}".`);
            return;
        }
        
        const bgInfoForSchema = this.registeredBackgrounds[this.currentBackgroundType];
        const optionSchemaEntry = bgInfoForSchema?.schema?.find(s => s.key === key);
        let processedValue = value;

        if (optionSchemaEntry && optionSchemaEntry.type === 'number') {
            let numValueStr = String(value).trim();
            let numValue = parseFloat(numValueStr);

            // If input is empty and there's a default, use default
            if (numValueStr === '' && optionSchemaEntry.default !== undefined) {
                numValue = parseFloat(optionSchemaEntry.default);
            }

            if (!isNaN(numValue)) {
                const min = optionSchemaEntry.min !== undefined ? parseFloat(optionSchemaEntry.min) : -Infinity;
                const max = optionSchemaEntry.max !== undefined ? parseFloat(optionSchemaEntry.max) : Infinity;

                numValue = Math.max(min, Math.min(max, numValue)); // Clamp

                const schemaStep = parseFloat(optionSchemaEntry.step);
                const isIntegerType = (Number.isInteger(schemaStep) && schemaStep >= 1) ||
                                      (!isNaN(schemaStep) && schemaStep === 0) || // step 0 implies integer sometimes
                                      (optionSchemaEntry.step === undefined && String(numValue).indexOf('.') === -1);

                if (isIntegerType) {
                    numValue = Math.round(numValue);
                } else {
                    numValue = parseFloat(numValue.toFixed(4)); // Round to 4 decimal places
                }
                processedValue = numValue;
            } else { // Value was not a parseable number (and not empty string handled above)
                console.warn(`[BackgroundBuilder.updateOption] Invalid number for key "${key}": "${value}". Reverting.`);
                if (this.currentOptions.hasOwnProperty(key)) {
                    processedValue = this.currentOptions[key]; // Revert to previously known good value
                } else if (optionSchemaEntry.default !== undefined) { // Fallback to schema default
                    processedValue = parseFloat(optionSchemaEntry.default);
                     // Re-apply constraints to the default value
                    const min = optionSchemaEntry.min !== undefined ? parseFloat(optionSchemaEntry.min) : -Infinity;
                    const max = optionSchemaEntry.max !== undefined ? parseFloat(optionSchemaEntry.max) : Infinity;
                    processedValue = Math.max(min, Math.min(max, processedValue));
                    const schemaStep = parseFloat(optionSchemaEntry.step);
                    const isIntegerTypeDefault = (Number.isInteger(schemaStep) && schemaStep >= 1) || optionSchemaEntry.step === undefined;
                    if (isIntegerTypeDefault) processedValue = Math.round(processedValue);
                    else processedValue = parseFloat(processedValue.toFixed(4));
                } else {
                    return; // Cannot determine a valid value, abort update for this key
                }
            }
        } else if (optionSchemaEntry && optionSchemaEntry.type === 'text' && Array.isArray(bgInfoForSchema?.defaults?.[key])) {
            // Handle conversion of comma-separated string to array for relevant text inputs (e.g. color lists)
            if (typeof value === 'string') {
                try {
                    const parsedArray = value.split(',').map(s => s.trim()).filter(s => s);
                    // Use parsed array if it's not empty. If input string was empty, use empty array.
                    // If input string was non-empty but resulted in empty array (e.g. only commas), could keep original string or empty array.
                    processedValue = (value.trim() === '') ? [] : (parsedArray.length > 0 ? parsedArray : value);
                } catch (e) { /* value remains as string if parse fails */ }
            }
        }
        // For boolean or other types, processedValue remains as original 'value' from parameter

        this.currentOptions[key] = processedValue;

        // Update the input field in the UI to reflect the potentially clamped/rounded value
        const inputElement = document.getElementById(`ctrl-${key}`);
        if (inputElement && inputElement.value !== String(processedValue)) { // Avoid redundant updates/cursor jumps
            if (optionSchemaEntry && optionSchemaEntry.type === 'boolean' && inputElement instanceof HTMLInputElement) {
                inputElement.checked = !!processedValue;
            } else if (inputElement.value !== undefined){ // Check for HTML elements that have a .value property
               inputElement.value = String(processedValue);
            }
        }

        // Dispatch event for external listeners (e.g., URL updater)
        const event = new CustomEvent('backgroundOptionChanged', {
            detail: { effectName: this.currentBackgroundType, options: { ...this.currentOptions } }
        });
        document.dispatchEvent(event);

        const bgInfo = this.registeredBackgrounds[this.currentBackgroundType];
        if (!bgInfo) return; // Should not happen if currentBackgroundType is set

        let requiresRestart = optionSchemaEntry?.requiresRestart || false;
        let requiresResize = optionSchemaEntry?.requiresResize || false;

        // Apply options to the current background instance
        if (this.currentBackgroundInstance && !requiresRestart && typeof this.currentBackgroundInstance.updateInternalOptions === 'function') {
            this.currentBackgroundInstance.updateInternalOptions({ [key]: processedValue });
            if (requiresResize && typeof this.currentBackgroundInstance.resize === 'function') {
                this.currentBackgroundInstance.resize();
            }
            // If not animating, draw to reflect static changes
            if (!this.currentBackgroundInstance.animationId && typeof this.currentBackgroundInstance.draw === 'function') {
                this.currentBackgroundInstance.draw();
            }
        } else { // Full restart needed
            if (this.currentBackgroundInstance) {
                if (typeof this.currentBackgroundInstance.destroy === 'function') this.currentBackgroundInstance.destroy();
                else if (typeof this.currentBackgroundInstance.stop === 'function') this.currentBackgroundInstance.stop();
            }
            try {
                 // Ensure canvas has dimensions before re-instantiating
                if (this.previewCanvas && (this.previewCanvas.width === 0 || this.previewCanvas.height === 0)) {
                     const parentEl = this.previewCanvas.parentElement;
                     if (parentEl) {
                         const rect = parentEl.getBoundingClientRect();
                         this.previewCanvas.width = rect.width > 0 ? rect.width : 600;
                         this.previewCanvas.height = rect.height > 0 ? rect.height : 400;
                          if (parentEl.style.height === '' || parentEl.style.height === '0px') parentEl.style.height = '400px';
                     } else { this.previewCanvas.width = 600; this.previewCanvas.height = 400; }
                }
                this.currentBackgroundInstance = new bgInfo.class(this.previewCanvas, { ...this.currentOptions });
                if (typeof this.currentBackgroundInstance.start === 'function') this.currentBackgroundInstance.start();
                else if (typeof this.currentBackgroundInstance.draw === 'function') this.currentBackgroundInstance.draw();
            } catch (e) {
                console.error(`[BackgroundBuilder.updateOption] Error re-instantiating ${bgInfo.className}:`, e);
                if(this.controlsContainer) this.controlsContainer.innerHTML = `<p class="placeholder-text error-text">Error updating module '${this.currentBackgroundType}'. Check console.</p>`;
                this.currentBackgroundInstance = null;
            }
        }
    }
    
    /**
     * Clears the current background effect and resets controls.
     * @public
     */
    clearCurrentBackground() {
        if (this.currentBackgroundInstance) {
            if (typeof this.currentBackgroundInstance.destroy === 'function') this.currentBackgroundInstance.destroy();
            else if (typeof this.currentBackgroundInstance.stop === 'function') this.currentBackgroundInstance.stop();
        }
        this.currentBackgroundInstance = null;
        this.currentBackgroundType = null;
        this.currentOptions = {};

        if (this.ctx && this.previewCanvas && this.previewCanvas.width > 0 && this.previewCanvas.height > 0) {
            this.ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        }
        if (this.controlsContainer) { // Reset controls panel
            this.controlsContainer.innerHTML = '<p class="placeholder-text">Awaiting effect module selection...</p>';
        }
        
        // Clear code output in modal
        const codeOutputModalElem = document.getElementById('code-output-modal');
        if (codeOutputModalElem) {
            codeOutputModalElem.textContent = "// Select a module and customize it first.";
        }
    }


    /**
     * Generates an HTML/JS code snippet for the current background configuration.
     * The snippet is displayed in the `#code-output-modal` element.
     * @async
     * @public
     */
    async generateCodeSnippet() {
        const codeOutputElem = document.getElementById('code-output-modal');

        if (!this.valid || !codeOutputElem) {
            console.warn('[BackgroundBuilder.generateCodeSnippet] Builder not valid or code output modal element missing.');
            if (codeOutputElem) codeOutputElem.textContent = "// ERROR: System integrity compromised. Code generation offline.";
            return;
        }

        if (!this.currentBackgroundType || !this.currentBackgroundInstance) {
            codeOutputElem.textContent = "// No active module. Engage a module and calibrate parameters to extract code sequence.";
            return;
        }

        const bgInfo = this.registeredBackgrounds[this.currentBackgroundType];
        const className = bgInfo.className;
        // Simplified filename generation, assuming class name is camelCase or PascalCase
        const classFileName = className.charAt(0).toLowerCase() + className.slice(1).replace(/[^a-zA-Z0-9_]/g, '') + '.js';
        // Adjust this path if your file structure is different or served from a different base
        const classFilePath = `src/backgrounds/${classFileName}`; 
        const suggestedImportPath = `js/backgrounds/${classFileName}`; // Common import path style

        console.log(`[BackgroundBuilder.generateCodeSnippet] Generating for: ${className}. Attempting to fetch from: ${classFilePath}`);

        let classFileContent = `// --- ${className} class content could not be fetched. ---\n// --- Verify file at '${classFilePath}' is accessible and correctly exported. ---\nclass ${className} { constructor(c,o){console.error("${className} class definition not loaded.");} start(){} draw(){} resize(){} destroy(){} updateInternalOptions(o){} getDefaults(){return{};} }`;

        try {
            // Attempt to fetch the class file content.
            // NOTE: This fetch path is relative to where the main HTML file is served.
            // Ensure your development server can serve files from this path.
            const response = await fetch(classFilePath); // Path might need adjustment based on server root
            if (response.ok) {
                classFileContent = await response.text();
                // Remove common ES module export statements to make the class self-contained for the snippet
                classFileContent = classFileContent.replace(/^export\s+default\s+[A-Za-z0-9_]+;*/gm, '').trim();
                classFileContent = classFileContent.replace(/^export\s*{\s*([A-Za-z0-9_]+(\s*as\s*default)?\s*,?\s*)*\s*};*/gm, '').trim();
                classFileContent = classFileContent.replace(/^export\s+(class|function|const|let|var)\s+/gm, '$1 '); // `export class Foo` -> `class Foo`
                
                if (classFileContent.trim() === "") { // If stripping exports left nothing
                    classFileContent = `// --- ${className} class content empty after processing exports. Check source: ${classFilePath} ---\nclass ${className} { constructor(c,o){console.error("Empty class definition: ${className}");} start(){} draw(){} resize(){} destroy(){} updateInternalOptions(o){} getDefaults(){return{};} }`;
                }
            } else {
                console.warn(`[BackgroundBuilder.generateCodeSnippet] Fetch failed for ${classFilePath}: ${response.status} ${response.statusText}. Using placeholder class definition.`);
            }
        } catch (error) {
            console.error(`[BackgroundBuilder.generateCodeSnippet] Error fetching ${classFilePath}:`, error, ". Using placeholder class definition.");
        }

        const serializableOptions = {};
        const defaultOptsForType = bgInfo.defaults || {};
        // Include only options that differ from default, or are booleans (to ensure they are explicit)
        // or are not present in defaults (custom additions not in manifest perhaps)
        for (const key in this.currentOptions) {
            if (Object.prototype.hasOwnProperty.call(this.currentOptions, key)) {
                if (typeof this.currentOptions[key] !== 'function') { // Exclude functions
                    let isDefaultValue = JSON.stringify(this.currentOptions[key]) === JSON.stringify(defaultOptsForType[key]);
                    if (!isDefaultValue || typeof this.currentOptions[key] === 'boolean' || !Object.prototype.hasOwnProperty.call(defaultOptsForType,key) ) {
                        serializableOptions[key] = this.currentOptions[key];
                    }
                }
            }
        }
        const optionsString = Object.keys(serializableOptions).length > 0 ? JSON.stringify(serializableOptions, null, 4) : '{}';

        const snippet = `
// =============================================================================
// Dynamic Background Sequence: ${className}
// Generated by BackgroundCraft // NEON GRID EDITION
// Timestamp: ${new Date().toISOString()}
// =============================================================================

// --- STEP 1: INTEGRATE ${className} CLASS DEFINITION ---
// Option A: ES Module Import (Recommended for projects with a build process or modern servers)
// 1. Save the class definition (from "BEGIN ${className} CLASS DEFINITION" to "END OF ${className} CLASS DEFINITION")
//    into a JavaScript file (e.g., '${suggestedImportPath}').
// 2. Ensure the class is exported from that file (e.g., using 'export default ${className};').
// 3. In your main application script:
//    import ${className} from './${suggestedImportPath}'; // Adjust path as per your project structure

// Option B: Direct Script Inclusion (Simpler for single HTML files or basic setups)
// Paste the entire class definition below directly into your HTML file inside <script> tags,
// or into an existing JavaScript file that is loaded before the initialization script.

// --- BEGIN ${className} CLASS DEFINITION ---
${classFileContent}
// --- END OF ${className} CLASS DEFINITION ---


// --- STEP 2: HTML CANVAS INTEGRATION ---
// Add the following canvas element to your HTML body where you want the background:
// <canvas id="my-${className.toLowerCase()}-canvas"></canvas>

// Suggested CSS for a full-page background canvas:
/*
#my-${className.toLowerCase()}-canvas {
    display: block; 
    width: 100vw; 
    height: 100vh;
    position: fixed; 
    top: 0; 
    left: 0; 
    z-index: -1;  // Place it behind other content
    background-color: ${this.currentOptions.backgroundColor || '#000000'}; // Match your theme or effect's bg
}
*/

// --- STEP 3: EFFECT INITIALIZATION SCRIPT ---
// Place this script in a <script> tag at the end of your HTML body, or in a JS file loaded after the DOM is ready.
function initialize${className}Effect() {
    const canvasId = 'my-${className.toLowerCase()}-canvas';
    const canvasElement = document.getElementById(canvasId);

    if (!canvasElement) {
        console.error("CRITICAL: Canvas element '" + canvasId + "' not found in the DOM. Effect cannot start.");
        // Optionally, display a user-friendly message on the page.
        return;
    }

    if (typeof ${className} === 'undefined' || typeof ${className} !== 'function') {
        console.error("CRITICAL: The ${className} class definition is missing or not loaded correctly. Please ensure Step 1 is complete.");
        return;
    }

    // User-configured options (only non-default values are typically included here for brevity)
    const effectOptions = ${optionsString};
    
    // Ensure canvas has dimensions before effect instantiation, using its offsetWidth/Height or window fallback
    canvasElement.width = canvasElement.offsetWidth || window.innerWidth;
    canvasElement.height = canvasElement.offsetHeight || window.innerHeight;

    let backgroundEffectInstance = null;
    try {
        backgroundEffectInstance = new ${className}(canvasElement, effectOptions);
    } catch (error) {
        console.error("Error during instantiation of ${className}:", error);
        // Provide feedback to the user if instantiation fails.
        return;
    }

    // Start the effect
    if (backgroundEffectInstance && typeof backgroundEffectInstance.start === 'function') {
        backgroundEffectInstance.start();
    } else if (backgroundEffectInstance && typeof backgroundEffectInstance.draw === 'function') {
        // For effects that are not continuously animated but need an initial draw
        backgroundEffectInstance.draw(); 
    } else {
        console.warn("${className} instance was created but does not have a start() or draw() method.");
    }

    // Make the canvas responsive to window resizing
    window.addEventListener('resize', () => {
        if (!canvasElement || !backgroundEffectInstance) return; // Safety check
        
        canvasElement.width = canvasElement.offsetWidth || window.innerWidth;
        canvasElement.height = canvasElement.offsetHeight || window.innerHeight;
        
        if (typeof backgroundEffectInstance.resize === 'function') {
            backgroundEffectInstance.resize();
        }
        // For static effects, redraw on resize if it's not actively animating
        if (backgroundEffectInstance.animationId === null && typeof backgroundEffectInstance.draw === 'function') {
            backgroundEffectInstance.draw();
        }
    });
    console.log("${className} effect initialization sequence deployed successfully.");
}

// Initialize the effect once the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize${className}Effect);
} else {
    // DOMContentLoaded has already fired
    initialize${className}Effect();
}
// =============================================================================
// End of Generated Sequence
// =============================================================================
`;
        codeOutputElem.textContent = snippet.trim();
        console.log('[BackgroundBuilder.generateCodeSnippet] Code snippet generated and displayed in modal.');
    }

    /**
     * Copies the generated code snippet from the modal to the clipboard.
     * @async
     * @public
     */
    async copySnippetToClipboard() {
        const codeOutputElem = document.getElementById('code-output-modal');
        const copyButtonElem = document.getElementById('copy-code-modal-button'); // Specific to modal
        const copyStatusTextElem = copyButtonElem ? copyButtonElem.querySelector('.copy-status-text-modal') : null;

        if (!this.valid || !codeOutputElem || !copyButtonElem || !copyStatusTextElem) {
            console.warn('[BackgroundBuilder.copySnippetToClipboard] Modal elements for copying are missing.');
            return;
        }

        const textToCopy = codeOutputElem.textContent;
        const originalButtonText = copyStatusTextElem.textContent; // Assuming default is "Copy Sequence" or similar

        if (!textToCopy || textToCopy.startsWith("// No active module") || textToCopy.startsWith("// ERROR:")) {
            copyStatusTextElem.textContent = 'No Code!';
            copyButtonElem.classList.add('error');
            setTimeout(() => {
                copyStatusTextElem.textContent = originalButtonText;
                copyButtonElem.classList.remove('error');
            }, 2000);
            return;
        }

        try {
            await navigator.clipboard.writeText(textToCopy);
            copyStatusTextElem.textContent = 'Sequence Copied!';
            copyButtonElem.classList.remove('error'); // Ensure no error state
            copyButtonElem.classList.add('copied'); // For styling feedback
            console.log('[BackgroundBuilder.copySnippetToClipboard] Code snippet copied from modal successfully.');

            setTimeout(() => {
                copyStatusTextElem.textContent = originalButtonText;
                copyButtonElem.classList.remove('copied');
            }, 2500);
        } catch (err) {
            console.error('[BackgroundBuilder.copySnippetToClipboard] Failed to copy using navigator.clipboard API: ', err);
            copyStatusTextElem.textContent = 'Copy Failed!';
            copyButtonElem.classList.add('error');
            copyButtonElem.classList.remove('copied');
             setTimeout(() => {
                copyStatusTextElem.textContent = originalButtonText;
                copyButtonElem.classList.remove('error');
            }, 2000);
            // Fallback for older browsers or if permission is denied (less common now)
            try {
                const textArea = document.createElement("textarea");
                textArea.value = textToCopy;
                Object.assign(textArea.style, { // Make it invisible
                    position: "fixed", top: "-9999px", left: "-9999px",
                    width: "1px", height: "1px", opacity: 0
                });
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                // UI feedback for fallback success already handled by primary try-catch structure
            } catch (execErr) {
                 console.error('[BackgroundBuilder.copySnippetToClipboard] Fallback execCommand copy also failed: ', execErr);
            }
        }
    }

    /**
     * Cleans up the builder, stops any running effects, removes event listeners,
     * and disconnects observers. Call this when the application or component is being destroyed.
     * @public
     */
    destroy() {
        console.log('[BackgroundBuilder.destroy] Initiating destruction sequence.');
        if (this.currentBackgroundInstance) {
            if (typeof this.currentBackgroundInstance.destroy === 'function') {
                this.currentBackgroundInstance.destroy();
            } else if (typeof this.currentBackgroundInstance.stop === 'function') {
                this.currentBackgroundInstance.stop();
            }
        }
        this.currentBackgroundInstance = null;
        this.currentBackgroundType = null;

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }

        if (this.controlsContainer) {
            this.controlsContainer.innerHTML = '<p class="placeholder-text">System Offline. Interface Terminated.</p>';
        }
        
        const codeOutputModalElem = document.getElementById('code-output-modal');
        if (codeOutputModalElem) {
            codeOutputModalElem.textContent = '// System Offline. Code generation unavailable.';
        }

        // Clear the canvas
        if (this.ctx && this.previewCanvas) {
            this.ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        }
        
        // Nullify properties
        this.previewCanvas = null;
        this.ctx = null;
        this.controlsContainer = null;
        this.registeredBackgrounds = {};
        this.currentOptions = {};
        this.valid = false; // Mark builder as no longer valid
        console.log('[BackgroundBuilder.destroy] System shutdown and resource liberation complete.');
    }
}

export default BackgroundBuilder;