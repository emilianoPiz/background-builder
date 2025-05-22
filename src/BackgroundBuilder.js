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
     * The current language code (e.g., 'en', 'es').
     * @type {string}
     * @private
     */
    currentLang = 'en';
    /**
     * An object holding the translations for the current language.
     * @type {Record<string, string>}
     * @private
     */
    translations = {};


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
     * Updates the builder's language and translations.
     * If a background is currently active, it re-selects it to potentially update UI text.
     * @param {string} lang - The new language code (e.g., 'en').
     * @param {Record<string, string>} translationsData - The translation strings for the new language.
     */
    updateLanguage(lang, translationsData) {
        this.currentLang = lang;
        this.translations = translationsData || {};
        console.log(`[BackgroundBuilder.updateLanguage] Language set to: ${lang}`);

        // If a background is currently selected, re-select it.
        // This will trigger renderControls, which could in the future use translated schema labels/tooltips.
        // It also ensures any messages currently displayed are updated if they depend on this.translations.
        if (this.currentBackgroundType && this.controlsContainer) {
            const name = this.currentBackgroundType;
            const options = { ...this.currentOptions }; // Keep current options

            // Temporarily clear controls to show immediate feedback if re-rendering takes time or if an error occurs
            // this.controlsContainer.innerHTML = `<p class="placeholder-text">${this.translations.loadingControls || 'Loading controls...'}</p>`;

            // Re-select the background to apply new language to any dynamic text (primarily error messages or placeholders for now)
            // and to establish the mechanism for future dynamic label/tooltip translation in renderControls
            this.selectBackground(name, options);
        } else if (this.controlsContainer && !this.currentBackgroundType) {
            // If no background is selected, update the placeholder message in controlsContainer
             this.controlsContainer.innerHTML = `<p class="placeholder-text">${this.translations.controlsPlaceholderText || 'Awaiting effect module selection...'}</p>`;
        }

        // Update code output modal placeholder if it's in its initial state
        const codeOutputModalElem = document.getElementById('code-output-modal');
        if (codeOutputModalElem) {
            const initialTextKey = 'codeOutputModalInitial';
            const currentText = codeOutputModalElem.textContent.trim();
            let isInitial = false;
            // Check against all known translations of initial text
            // This check logic is similar to language.js, might be consolidated in future
            if (window.translations) { // Assuming global translations object for this check
                 for (const langKey in window.translations) {
                    if (window.translations[langKey][initialTextKey] === currentText) {
                        isInitial = true;
                        break;
                    }
                }
            }

            if (isInitial) {
                 codeOutputModalElem.textContent = this.translations[initialTextKey] || "// Code sequence will materialize here...";
            }
        }
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
                 const errorMsgTemplate = this.translations.errorModuleNotRegistered || 'Error: Module "%NAME%" is not registered.';
                 this.controlsContainer.innerHTML = `<p class="placeholder-text error-text">${errorMsgTemplate.replace('%NAME%', name)}</p>`;
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
            if(this.controlsContainer) {
                const errorMsgTemplate = this.translations.errorCreatingModule || "Error creating module '%NAME%'. Check console.";
                this.controlsContainer.innerHTML = `<p class="placeholder-text error-text">${errorMsgTemplate.replace('%NAME%', name)}</p>`;
            }
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
            this.controlsContainer.innerHTML = `<p class="placeholder-text">${this.translations.noAdjustableParametersForModule || 'No adjustable parameters for this module.'}</p>`;
            return;
        }

        schema.forEach(item => {
            const controlWrapper = document.createElement('div');
            controlWrapper.className = 'control-item';
            const labelEl = document.createElement('label');
            labelEl.htmlFor = `ctrl-${item.key}`;

            // TODO: For full translation, item.label should be a key e.g. item.labelKey
            // const labelText = (this.translations && this.translations[item.labelKey]) ? this.translations[item.labelKey] : item.label;
            const labelText = item.label; // Using hardcoded label for now

            if (item.type !== 'boolean') {
                labelEl.textContent = labelText + ':';
                controlWrapper.appendChild(labelEl);
            }

            let primaryInputControl; 

            if (item.type === 'boolean') {
                const checkboxInput = document.createElement('input');
                checkboxInput.type = 'checkbox';
                checkboxInput.checked = !!this.currentOptions[item.key]; 
                checkboxInput.id = `ctrl-${item.key}`;
                
                labelEl.textContent = labelText; 
                
                const checkboxWrapper = document.createElement('div'); 
                checkboxWrapper.className = 'checkbox-wrapper';
                checkboxWrapper.appendChild(checkboxInput);
                checkboxWrapper.appendChild(labelEl); 
                controlWrapper.appendChild(checkboxWrapper);
                
                primaryInputControl = checkboxInput; 
                checkboxInput.addEventListener('change', (e) => {
                    if (e.target instanceof HTMLInputElement) {
                        this.updateOption(item.key, e.target.checked);
                    }
                });
            }
            else if (item.type === 'text' && SINGLE_RGBA_TEXT_KEYS.has(item.key)) {
                const textInput = document.createElement('input');
                textInput.type = 'text'; 
                textInput.id = `ctrl-${item.key}`;
                textInput.value = this.currentOptions[item.key] !== undefined ?
                    String(this.currentOptions[item.key]) :
                    (item.default !== undefined ? String(item.default) : (item.placeholder || ''));
                if (item.placeholder) textInput.placeholder = item.placeholder;
                
                primaryInputControl = textInput; 
                controlWrapper.appendChild(textInput);

                const pickerContainer = document.createElement('div');
                pickerContainer.className = 'rgba-picker-widget';
                pickerContainer.style.display = 'flex';
                pickerContainer.style.alignItems = 'center';
                pickerContainer.style.gap = '8px'; 
                pickerContainer.style.marginTop = '4px';

                const colorInput = document.createElement('input'); 
                colorInput.type = 'color';
                colorInput.className = 'rgba-color-part';
                colorInput.title = "Select RGB color"; // TODO: Translate title

                const alphaSlider = document.createElement('input'); 
                alphaSlider.type = 'range';
                alphaSlider.min = '0';
                alphaSlider.max = '1';
                alphaSlider.step = '0.01'; 
                alphaSlider.className = 'rgba-alpha-part';
                alphaSlider.title = "Adjust alpha (opacity)"; // TODO: Translate title
                alphaSlider.style.flexGrow = "1"; 

                const updateVisualPickerFromText = () => {
                    const rgbaValue = textInput.value;
                    const parsed = parseRgbaString(rgbaValue);
                    if (parsed) {
                        colorInput.value = rgbToHex(parsed.r, parsed.g, parsed.b);
                        alphaSlider.value = String(parsed.a);
                    } else { 
                        const hexRgb = hexToRgb(rgbaValue); 
                        if (hexRgb) {
                            colorInput.value = rgbToHex(hexRgb.r, hexRgb.g, hexRgb.b); 
                            alphaSlider.value = '1'; 
                        } else { 
                            const defaultSource = item.default || item.placeholder || 'rgba(0,0,0,1)';
                            const parsedDefault = parseRgbaString(defaultSource) || { r: 0, g: 0, b: 0, a: 1 };
                            colorInput.value = rgbToHex(parsedDefault.r, parsedDefault.g, parsedDefault.b);
                            alphaSlider.value = String(parsedDefault.a);
                        }
                    }
                };

                const updateTextFromVisualPicker = () => {
                    const hexColor = colorInput.value;
                    const alpha = parseFloat(alphaSlider.value);
                    const rgb = hexToRgb(hexColor);

                    if (rgb) {
                        const newRgbaString = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha.toFixed(2)})`;
                        if (textInput.value !== newRgbaString) {
                            textInput.value = newRgbaString;
                            textInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                        }
                    }
                };

                colorInput.addEventListener('input', updateTextFromVisualPicker);
                alphaSlider.addEventListener('input', updateTextFromVisualPicker);

                textInput.addEventListener('input', () => {
                    setTimeout(updateVisualPickerFromText, 0);
                });
                
                updateVisualPickerFromText(); 

                pickerContainer.appendChild(colorInput);
                pickerContainer.appendChild(alphaSlider);
                controlWrapper.appendChild(pickerContainer);
            }
            else if (item.type === 'select') {
                const selectInput = document.createElement('select');
                selectInput.id = `ctrl-${item.key}`;
                if (!item.options || !Array.isArray(item.options)) { 
                    // TODO: Translate error option label
                    item.options = [{value: '', label: 'Error: No options provided in schema'}];
                }
                item.options.forEach(opt => {
                    const optionEl = document.createElement('option');
                    optionEl.value = opt.value;
                     // TODO: For full translation, opt.label should be a key
                    optionEl.textContent = opt.label;
                    if (String(this.currentOptions[item.key]) === String(opt.value)) {
                        optionEl.selected = true;
                    }
                    selectInput.appendChild(optionEl);
                });
                primaryInputControl = selectInput;
                selectInput.addEventListener('change', (e) => { 
                    if (e.target instanceof HTMLSelectElement) {
                        this.updateOption(item.key, e.target.value);
                    }
                });
                controlWrapper.appendChild(selectInput);
            }
            else { 
                const generalInput = document.createElement('input');
                generalInput.type = item.type;
                generalInput.id = `ctrl-${item.key}`;
                generalInput.value = this.currentOptions[item.key] !== undefined ?
                                    String(this.currentOptions[item.key]) :
                                    (item.default !== undefined ? String(item.default) : '');
                if (item.placeholder) generalInput.placeholder = item.placeholder; // TODO: placeholder could be a translatable key
                
                if (item.type === 'number') {
                    if (item.min !== undefined) generalInput.min = String(item.min);
                    if (item.max !== undefined) generalInput.max = String(item.max);
                    const schemaStep = parseFloat(item.step);
                    if (!isNaN(schemaStep) && Number.isInteger(schemaStep) && schemaStep >= 1) {
                        generalInput.step = String(schemaStep);
                    } else if (!isNaN(schemaStep)) { 
                        generalInput.step = String(item.step);
                    } else { 
                        generalInput.step = '0.0001'; 
                    }
                }
                if (item.type === 'color' && !generalInput.value) { 
                     generalInput.value = '#00F2FF'; 
                }

                primaryInputControl = generalInput;
                controlWrapper.appendChild(generalInput);
            }

            if (primaryInputControl && item.type !== 'boolean' && item.type !== 'select') {
                 primaryInputControl.addEventListener('input', (e) => {
                    if (e.target instanceof HTMLInputElement) { 
                        this.updateOption(item.key, e.target.value);
                    }
                });
            }

            // TODO: For full translation, item.tooltip should be a key e.g. item.tooltipKey
            // const tooltipText = (this.translations && this.translations[item.tooltipKey]) ? this.translations[item.tooltipKey] : item.tooltip;
            const tooltipText = item.tooltip; // Using hardcoded tooltip for now

            if (tooltipText) {
                const tooltipEl = document.createElement('small');
                tooltipEl.className = 'control-tooltip';
                tooltipEl.textContent = tooltipText;
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

            if (numValueStr === '' && optionSchemaEntry.default !== undefined) {
                numValue = parseFloat(optionSchemaEntry.default);
            }

            if (!isNaN(numValue)) {
                const min = optionSchemaEntry.min !== undefined ? parseFloat(optionSchemaEntry.min) : -Infinity;
                const max = optionSchemaEntry.max !== undefined ? parseFloat(optionSchemaEntry.max) : Infinity;

                numValue = Math.max(min, Math.min(max, numValue)); 

                const schemaStep = parseFloat(optionSchemaEntry.step);
                const isIntegerType = (Number.isInteger(schemaStep) && schemaStep >= 1) ||
                                      (!isNaN(schemaStep) && schemaStep === 0) || 
                                      (optionSchemaEntry.step === undefined && String(numValue).indexOf('.') === -1);

                if (isIntegerType) {
                    numValue = Math.round(numValue);
                } else {
                    numValue = parseFloat(numValue.toFixed(4)); 
                }
                processedValue = numValue;
            } else { 
                console.warn(`[BackgroundBuilder.updateOption] Invalid number for key "${key}": "${value}". Reverting.`);
                if (this.currentOptions.hasOwnProperty(key)) {
                    processedValue = this.currentOptions[key]; 
                } else if (optionSchemaEntry.default !== undefined) { 
                    processedValue = parseFloat(optionSchemaEntry.default);
                    const min = optionSchemaEntry.min !== undefined ? parseFloat(optionSchemaEntry.min) : -Infinity;
                    const max = optionSchemaEntry.max !== undefined ? parseFloat(optionSchemaEntry.max) : Infinity;
                    processedValue = Math.max(min, Math.min(max, processedValue));
                    const schemaStep = parseFloat(optionSchemaEntry.step);
                    const isIntegerTypeDefault = (Number.isInteger(schemaStep) && schemaStep >= 1) || optionSchemaEntry.step === undefined;
                    if (isIntegerTypeDefault) processedValue = Math.round(processedValue);
                    else processedValue = parseFloat(processedValue.toFixed(4));
                } else {
                    return; 
                }
            }
        } else if (optionSchemaEntry && optionSchemaEntry.type === 'text' && Array.isArray(bgInfoForSchema?.defaults?.[key])) {
            if (typeof value === 'string') {
                try {
                    const parsedArray = value.split(',').map(s => s.trim()).filter(s => s);
                    processedValue = (value.trim() === '') ? [] : (parsedArray.length > 0 ? parsedArray : value);
                } catch (e) { /* value remains as string if parse fails */ }
            }
        }

        this.currentOptions[key] = processedValue;

        const inputElement = document.getElementById(`ctrl-${key}`);
        if (inputElement && inputElement.value !== String(processedValue)) { 
            if (optionSchemaEntry && optionSchemaEntry.type === 'boolean' && inputElement instanceof HTMLInputElement) {
                inputElement.checked = !!processedValue;
            } else if (inputElement.value !== undefined){ 
               inputElement.value = String(processedValue);
            }
        }

        const event = new CustomEvent('backgroundOptionChanged', {
            detail: { effectName: this.currentBackgroundType, options: { ...this.currentOptions } }
        });
        document.dispatchEvent(event);

        const bgInfo = this.registeredBackgrounds[this.currentBackgroundType];
        if (!bgInfo) return; 

        let requiresRestart = optionSchemaEntry?.requiresRestart || false;
        let requiresResize = optionSchemaEntry?.requiresResize || false;

        if (this.currentBackgroundInstance && !requiresRestart && typeof this.currentBackgroundInstance.updateInternalOptions === 'function') {
            this.currentBackgroundInstance.updateInternalOptions({ [key]: processedValue });
            if (requiresResize && typeof this.currentBackgroundInstance.resize === 'function') {
                this.currentBackgroundInstance.resize();
            }
            if (!this.currentBackgroundInstance.animationId && typeof this.currentBackgroundInstance.draw === 'function') {
                this.currentBackgroundInstance.draw();
            }
        } else { 
            if (this.currentBackgroundInstance) {
                if (typeof this.currentBackgroundInstance.destroy === 'function') this.currentBackgroundInstance.destroy();
                else if (typeof this.currentBackgroundInstance.stop === 'function') this.currentBackgroundInstance.stop();
            }
            try {
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
                if(this.controlsContainer) {
                    const errorMsgTemplate = this.translations.errorUpdatingModule || "Error updating module '%NAME%'. Check console.";
                    this.controlsContainer.innerHTML = `<p class="placeholder-text error-text">${errorMsgTemplate.replace('%NAME%', this.currentBackgroundType || 'unknown')}</p>`;
                }
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
        if (this.controlsContainer) { 
            this.controlsContainer.innerHTML = `<p class="placeholder-text">${this.translations.controlsPlaceholderText || 'Awaiting effect module selection...'}</p>`;
        }
        
        const codeOutputModalElem = document.getElementById('code-output-modal');
        if (codeOutputModalElem) {
            codeOutputModalElem.textContent = this.translations.codeOutputModalSelectModuleFirst || "// Select a module and customize it first.";
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
            if (codeOutputElem) codeOutputElem.textContent = this.translations.codeOutputModalSystemError || "// ERROR: System integrity compromised. Code generation offline.";
            return;
        }

        if (!this.currentBackgroundType || !this.currentBackgroundInstance) {
            codeOutputElem.textContent = this.translations.codeOutputModalNoActiveModule || "// No active module. Engage a module and calibrate parameters to extract code sequence.";
            return;
        }

        const bgInfo = this.registeredBackgrounds[this.currentBackgroundType];
        const className = bgInfo.className;
        const classFileName = className.charAt(0).toLowerCase() + className.slice(1).replace(/[^a-zA-Z0-9_]/g, '') + '.js';
        const classFilePath = `src/backgrounds/${classFileName}`; 
        const suggestedImportPath = `js/backgrounds/${classFileName}`; 

        console.log(`[BackgroundBuilder.generateCodeSnippet] Generating for: ${className}. Attempting to fetch from: ${classFilePath}`);

        let classFileContent = `// --- ${className} class content could not be fetched. ---\n// --- Verify file at '${classFilePath}' is accessible and correctly exported. ---\nclass ${className} { constructor(c,o){console.error("${className} class definition not loaded.");} start(){} draw(){} resize(){} destroy(){} updateInternalOptions(o){} getDefaults(){return{};} }`;

        try {
            const response = await fetch(classFilePath); 
            if (response.ok) {
                classFileContent = await response.text();
                classFileContent = classFileContent.replace(/^export\s+default\s+[A-Za-z0-9_]+;*/gm, '').trim();
                classFileContent = classFileContent.replace(/^export\s*{\s*([A-Za-z0-9_]+(\s*as\s*default)?\s*,?\s*)*\s*};*/gm, '').trim();
                classFileContent = classFileContent.replace(/^export\s+(class|function|const|let|var)\s+/gm, '$1 '); 
                
                if (classFileContent.trim() === "") { 
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
        for (const key in this.currentOptions) {
            if (Object.prototype.hasOwnProperty.call(this.currentOptions, key)) {
                if (typeof this.currentOptions[key] !== 'function') { 
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
        return;
    }

    if (typeof ${className} === 'undefined' || typeof ${className} !== 'function') {
        console.error("CRITICAL: The ${className} class definition is missing or not loaded correctly. Please ensure Step 1 is complete.");
        return;
    }

    const effectOptions = ${optionsString};
    
    canvasElement.width = canvasElement.offsetWidth || window.innerWidth;
    canvasElement.height = canvasElement.offsetHeight || window.innerHeight;

    let backgroundEffectInstance = null;
    try {
        backgroundEffectInstance = new ${className}(canvasElement, effectOptions);
    } catch (error) {
        console.error("Error during instantiation of ${className}:", error);
        return;
    }

    if (backgroundEffectInstance && typeof backgroundEffectInstance.start === 'function') {
        backgroundEffectInstance.start();
    } else if (backgroundEffectInstance && typeof backgroundEffectInstance.draw === 'function') {
        backgroundEffectInstance.draw(); 
    } else {
        console.warn("${className} instance was created but does not have a start() or draw() method.");
    }

    window.addEventListener('resize', () => {
        if (!canvasElement || !backgroundEffectInstance) return; 
        
        canvasElement.width = canvasElement.offsetWidth || window.innerWidth;
        canvasElement.height = canvasElement.offsetHeight || window.innerHeight;
        
        if (typeof backgroundEffectInstance.resize === 'function') {
            backgroundEffectInstance.resize();
        }
        if (backgroundEffectInstance.animationId === null && typeof backgroundEffectInstance.draw === 'function') {
            backgroundEffectInstance.draw();
        }
    });
    console.log("${className} effect initialization sequence deployed successfully.");
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize${className}Effect);
} else {
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
        const copyButtonElem = document.getElementById('copy-code-modal-button'); 
        const copyStatusTextElem = copyButtonElem ? copyButtonElem.querySelector('.copy-status-text-modal') : null;

        if (!this.valid || !codeOutputElem || !copyButtonElem || !copyStatusTextElem) {
            console.warn('[BackgroundBuilder.copySnippetToClipboard] Modal elements for copying are missing.');
            return;
        }

        const textToCopy = codeOutputElem.textContent;
        
        // Get the original "Copy Sequence" text in the current language
        const originalButtonTextKey = 'copySequenceButtonText';
        const originalButtonText = (this.translations && this.translations[originalButtonTextKey]) 
                                   ? this.translations[originalButtonTextKey] 
                                   : (copyStatusTextElem.dataset.defaultText || 'Copy Sequence'); // Fallback or data-attribute
        if (!copyStatusTextElem.dataset.defaultText) { // Store default if not already for reset
            copyStatusTextElem.dataset.defaultText = originalButtonText;
        }


        const noCodeKey = 'codeOutputModalNoActiveModule'; // Or a more generic "no code to copy" key
        const errorKey = 'codeOutputModalSystemError'; // Or a generic "error code" key

        const noCodeText = (this.translations && this.translations[noCodeKey]) ? this.translations[noCodeKey] : "";
        const errorText = (this.translations && this.translations[errorKey]) ? this.translations[errorKey] : "";

        if (!textToCopy || textToCopy === noCodeText || textToCopy === errorText || textToCopy.startsWith("// No active module") || textToCopy.startsWith("// ERROR:")) {
            const statusNoCodeKey = 'copyStatusNoCode';
            copyStatusTextElem.textContent = (this.translations && this.translations[statusNoCodeKey]) ? this.translations[statusNoCodeKey] : 'No Code!';
            copyButtonElem.classList.add('error');
            setTimeout(() => {
                copyStatusTextElem.textContent = originalButtonText;
                copyButtonElem.classList.remove('error');
            }, 2000);
            return;
        }

        try {
            await navigator.clipboard.writeText(textToCopy);
            const statusCopiedKey = 'copyStatusCopied';
            copyStatusTextElem.textContent = (this.translations && this.translations[statusCopiedKey]) ? this.translations[statusCopiedKey] : 'Sequence Copied!';
            copyButtonElem.classList.remove('error'); 
            copyButtonElem.classList.add('copied'); 
            console.log('[BackgroundBuilder.copySnippetToClipboard] Code snippet copied from modal successfully.');

            setTimeout(() => {
                copyStatusTextElem.textContent = originalButtonText;
                copyButtonElem.classList.remove('copied');
            }, 2500);
        } catch (err) {
            console.error('[BackgroundBuilder.copySnippetToClipboard] Failed to copy using navigator.clipboard API: ', err);
            const statusFailedKey = 'copyStatusFailed';
            copyStatusTextElem.textContent = (this.translations && this.translations[statusFailedKey]) ? this.translations[statusFailedKey] : 'Copy Failed!';
            copyButtonElem.classList.add('error');
            copyButtonElem.classList.remove('copied');
             setTimeout(() => {
                copyStatusTextElem.textContent = originalButtonText;
                copyButtonElem.classList.remove('error');
            }, 2000);
            try {
                const textArea = document.createElement("textarea");
                textArea.value = textToCopy;
                Object.assign(textArea.style, { 
                    position: "fixed", top: "-9999px", left: "-9999px",
                    width: "1px", height: "1px", opacity: 0
                });
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
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
            this.controlsContainer.innerHTML = `<p class="placeholder-text">${this.translations.controlsSystemOffline || 'System Offline. Interface Terminated.'}</p>`;
        }
        
        const codeOutputModalElem = document.getElementById('code-output-modal');
        if (codeOutputModalElem) {
            codeOutputModalElem.textContent = this.translations.codeOutputModalSystemOffline || '// System Offline. Code generation unavailable.';
        }

        if (this.ctx && this.previewCanvas) {
            this.ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        }
        
        this.previewCanvas = null;
        this.ctx = null;
        this.controlsContainer = null;
        this.registeredBackgrounds = {};
        this.currentOptions = {};
        this.valid = false; 
        console.log('[BackgroundBuilder.destroy] System shutdown and resource liberation complete.');
    }
}

export default BackgroundBuilder;