/**
 * @file BackgroundBuilder.js
 * @description Manages the lifecycle of dynamic canvas backgrounds, including registration,
 * selection, rendering controls, updating options, and generating code snippets.
 * It acts as the central orchestrator for the background effects.
 */

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
    // REMOVED: this.codeOutput, this.exportButton, this.copyCodeButton
    // These are no longer managed as direct properties initialized by constructor IDs
    // as their functionality is now tied to modals.

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
            { previewCanvasId, controlsContainerId }); // Removed other IDs from log

        this.previewCanvas = document.getElementById(previewCanvasId);
        this.controlsContainer = document.getElementById(controlsContainerId);
        // The other elements (codeOutput, exportButton, copyCodeButton) are now part of modals
        // and will be accessed directly in their respective methods if needed.

        // Robustness check for essential UI elements.
        if (!this.previewCanvas || !this.controlsContainer) {
            console.error("[BackgroundBuilder.constructor] Critical UI elements (previewCanvas or controlsContainer) not found! Check provided IDs.",
                {
                    previewCanvas: this.previewCanvas,
                    controlsContainer: this.controlsContainer,
                });
            this.valid = false;
            // Alerting the user might be disruptive; console error is primary.
            // Consider a more integrated UI error message if this occurs.
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

        // Event listeners for export/copy are now on modal buttons, handled by inline script in HTML.

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
                this.previewCanvas.width = 600;
                this.previewCanvas.height = 400;
                if (this.previewCanvas.parentElement.style.height === '' || this.previewCanvas.parentElement.style.height === '0px') {
                    this.previewCanvas.parentElement.style.height = '400px'; // Ensure parent has some height
                }
            }
        } else if (this.previewCanvas) {
            this.previewCanvas.width = 600;
            this.previewCanvas.height = 400;
            console.warn("[BackgroundBuilder.constructor] Preview canvas has no parent element. Set to default size.");
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
        const className = BgClass.name || 'UnnamedClass';
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
            if (this.controlsContainer) {
                 this.controlsContainer.innerHTML = `<p class="placeholder-text error-text">Error: Module "${name}" is not registered.</p>`;
            }
            return;
        }

        if (this.currentBackgroundInstance) {
            if (typeof this.currentBackgroundInstance.destroy === 'function') {
                this.currentBackgroundInstance.destroy();
            } else if (typeof this.currentBackgroundInstance.stop === 'function') {
                this.currentBackgroundInstance.stop();
            }
            this.currentBackgroundInstance = null;
        }

        if (this.ctx && this.previewCanvas.width > 0 && this.previewCanvas.height > 0) {
            this.ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        }

        const bgInfo = this.registeredBackgrounds[name];
        this.currentBackgroundType = name;
        this.currentOptions = JSON.parse(JSON.stringify(optionsToLoad || bgInfo.defaults));
        console.log(`[BackgroundBuilder.selectBackground] Selected "${name}". Options:`, this.currentOptions);

        if (this.previewCanvas.width === 0 || this.previewCanvas.height === 0) {
            const parentEl = this.previewCanvas.parentElement;
            if (parentEl) {
                const rect = parentEl.getBoundingClientRect();
                this.previewCanvas.width = rect.width > 0 ? rect.width : 600;
                this.previewCanvas.height = rect.height > 0 ? rect.height : 400;
                if (parentEl.style.height === '' || parentEl.style.height === '0px') {
                    parentEl.style.height = '400px';
                }
            } else {
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
            } else if (typeof this.currentBackgroundInstance.draw === 'function') {
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
        this.controlsContainer.innerHTML = '';
        if (!schema || schema.length === 0) {
            this.controlsContainer.innerHTML = '<p class="placeholder-text">No adjustable parameters for this module.</p>';
            return;
        }

        schema.forEach(item => {
            const controlWrapper = document.createElement('div');
            controlWrapper.className = 'control-item';
            const labelEl = document.createElement('label');
            labelEl.htmlFor = `ctrl-${item.key}`;

            if (item.type !== 'boolean') {
                labelEl.textContent = item.label + ':'; // Colon added for consistency
                controlWrapper.appendChild(labelEl);
            }

            let input;
            if (item.type === 'boolean') {
                input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = !!this.currentOptions[item.key];
                input.id = `ctrl-${item.key}`;
                labelEl.textContent = item.label;
                const checkboxWrapper = document.createElement('div'); // Keep consistent structure
                checkboxWrapper.className = 'checkbox-wrapper'; // If you have specific styles
                checkboxWrapper.appendChild(input);
                checkboxWrapper.appendChild(labelEl);
                controlWrapper.appendChild(checkboxWrapper);
                input.addEventListener('change', (e) => {
                    if (e.target instanceof HTMLInputElement) {
                       this.updateOption(item.key, e.target.checked);
                    }
                });
            } else {
                if (item.type === 'select') {
                    input = document.createElement('select');
                    if (!item.options || !Array.isArray(item.options)) {
                        item.options = [{value: '', label: 'Error: No options'}];
                    }
                    item.options.forEach(opt => {
                        const optionEl = document.createElement('option');
                        optionEl.value = opt.value;
                        optionEl.textContent = opt.label;
                        if (String(this.currentOptions[item.key]) === String(opt.value)) {
                            optionEl.selected = true;
                        }
                        input.appendChild(optionEl);
                    });
                    input.addEventListener('change', (e) => {
                        if (e.target instanceof HTMLSelectElement) {
                            this.updateOption(item.key, e.target.value);
                        }
                    });
                } else { 
                    input = document.createElement('input');
                    input.type = item.type;
                    input.value = this.currentOptions[item.key] !== undefined ?
                                  String(this.currentOptions[item.key]) :
                                  (item.default !== undefined ? String(item.default) : '');
                    if (item.placeholder) input.placeholder = item.placeholder;
                    if (item.type === 'number') {
                        if (item.min !== undefined) input.min = String(item.min);
                        if (item.max !== undefined) input.max = String(item.max);
                        if (item.step !== undefined) input.step = String(item.step);
                    }
                    if (item.type === 'color' && !input.value) input.value = '#00f2ff'; // Default to neon blue
                    
                    input.addEventListener('input', (e) => {
                        if (e.target instanceof HTMLInputElement) {
                            let value = e.target.value;
                            if (item.type === 'number') {
                                const numValue = parseFloat(value);
                                if (isNaN(numValue) && value !== '') {
                                    this.updateOption(item.key, value); return;
                                }
                                value = (value === '') ? (item.default !== undefined ? item.default : null) : numValue;
                            }
                            this.updateOption(item.key, value);
                        }
                    });
                }
                input.id = `ctrl-${item.key}`;
                controlWrapper.appendChild(input);
            }
            if (item.tooltip) {
                const tooltipEl = document.createElement('small');
                tooltipEl.className = 'control-tooltip'; // You might need to style this
                tooltipEl.textContent = item.tooltip;
                controlWrapper.appendChild(tooltipEl);
            }
            this.controlsContainer.appendChild(controlWrapper);
        });
    }

    /**
     * Updates a specific option for the current background.
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

        if (optionSchemaEntry && optionSchemaEntry.type === 'text') {
            const defaultValue = bgInfoForSchema?.defaults?.[key];
            if (Array.isArray(defaultValue) && typeof value === 'string') {
                try {
                    const parsedArray = value.split(',').map(s => s.trim()).filter(s => s);
                    value = parsedArray.length > 0 ? parsedArray : (value.trim() === '' ? [] : value);
                } catch (e) { /* Use as string if parse fails */ }
            }
        }
        this.currentOptions[key] = value;

        const event = new CustomEvent('backgroundOptionChanged', {
            detail: { effectName: this.currentBackgroundType, options: { ...this.currentOptions } }
        });
        document.dispatchEvent(event);

        const bgInfo = this.registeredBackgrounds[this.currentBackgroundType];
        if (!bgInfo) return;

        let requiresRestart = optionSchemaEntry?.requiresRestart || false;
        let requiresResize = optionSchemaEntry?.requiresResize || false;

        if (this.currentBackgroundInstance && !requiresRestart && typeof this.currentBackgroundInstance.updateInternalOptions === 'function') {
            this.currentBackgroundInstance.updateInternalOptions({ [key]: value });
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
                if(this.controlsContainer) this.controlsContainer.innerHTML = `<p class="placeholder-text error-text">Error updating module '${this.currentBackgroundType}'. Check console.</p>`;
                this.currentBackgroundInstance = null;
            }
        }
        // Snippet generation is now triggered by modal button, not on every option update.
        // this.generateCodeSnippet(); 
    }
    
    /**
     * Clears the current background effect.
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
            // Placeholder on canvas is now handled by HTML/CSS/inline JS
        }
        if (this.controlsContainer) {
            this.controlsContainer.innerHTML = '<p class="placeholder-text">Awaiting effect module selection...</p>';
        }
        // Code output is now in a modal, clear it if necessary when modal opens or here
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
        // MODIFIED: Target the modal's code output element
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
        const classFileName = className.charAt(0).toLowerCase() + className.slice(1).replace(/[^a-zA-Z0-9_]/g, '') + '.js';
        let classFilePath = `src/backgrounds/${classFileName}`; // Ensure this path is correct
        const suggestedImportPath = `src/backgrounds/${classFileName}`;

        console.log(`[BackgroundBuilder.generateCodeSnippet] Generating for: ${className}. Fetching from: ${classFilePath}`);

        let classFileContent = `// --- ${className} class content could not be fetched. ---\n// --- Verify file at '${classFilePath}' and network access. ---\nclass ${className} { constructor(c,o){console.error("${className} not loaded.");} start(){} draw(){} resize(){} destroy(){} }`;

        try {
            const response = await fetch(classFilePath);
            if (response.ok) {
                classFileContent = await response.text();
                classFileContent = classFileContent.replace(/^export\s+default\s+[A-Za-z0-9_]+;*/gm, '').trim();
                classFileContent = classFileContent.replace(/^export\s*{\s*([A-Za-z0-9_]+(\s*as\s*default)?\s*,?\s*)*\s*};*/gm, '').trim();
                classFileContent = classFileContent.replace(/^export\s+(class|function|const|let|var)\s+/gm, '$1 ');
                if (classFileContent.trim() === "") {
                    classFileContent = `// --- ${className} class content empty after processing. Check source: ${classFilePath} ---\nclass ${className} { constructor(c,o){console.error("Empty class: ${className}");} start(){} draw(){} resize(){} destroy(){} }`;
                }
            } else {
                console.warn(`[BackgroundBuilder.generateCodeSnippet] Fetch failed for ${classFilePath}: ${response.status}. Using placeholder.`);
            }
        } catch (error) {
            console.error(`[BackgroundBuilder.generateCodeSnippet] Error fetching ${classFilePath}:`, error, ". Using placeholder.");
        }

        const serializableOptions = {};
        const defaultOptsForType = bgInfo.defaults || {};
        for (const key in this.currentOptions) {
            if (typeof this.currentOptions[key] !== 'function') {
                let isDefaultValue = JSON.stringify(this.currentOptions[key]) === JSON.stringify(defaultOptsForType[key]);
                if (!isDefaultValue || typeof this.currentOptions[key] === 'boolean' || !defaultOptsForType.hasOwnProperty(key)) {
                    serializableOptions[key] = this.currentOptions[key];
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
// Option A: ES Module Import (Recommended)
// 1. Save the class definition (BEGIN to END) into a file (e.g., ${suggestedImportPath}).
// 2. Ensure it's exported if not already (e.g., 'export default ${className};').
// 3. In your main script:
//    import ${className} from '${suggestedImportPath}'; // Adjust path

// Option B: Direct Script Inclusion
// Paste the class definition directly into your HTML via <script> tags or an existing JS file.

// --- BEGIN ${className} CLASS DEFINITION ---
${classFileContent}
// --- END OF ${className} CLASS DEFINITION ---


// --- STEP 2: HTML CANVAS INTEGRATION ---
// Add to your HTML: <canvas id="my-${className.toLowerCase()}-canvas"></canvas>

// Suggested Full-Screen CSS:
/*
#my-${className.toLowerCase()}-canvas {
    display: block; width: 100vw; height: 100vh;
    position: fixed; top: 0; left: 0; z-index: -1; 
    background-color: #0d0221; // Match your theme
}
*/

// --- STEP 3: EFFECT INITIALIZATION SCRIPT ---
function initialize${className}Effect() {
    const canvasId = 'my-${className.toLowerCase()}-canvas';
    const canvasElement = document.getElementById(canvasId);

    if (!canvasElement) {
        console.error("CRITICAL: Canvas element '" + canvasId + "' not found in DOM.");
        // Consider a less intrusive UI notification than alert()
        // For example, display a message in a dedicated status area.
        return;
    }

    if (typeof ${className} === 'undefined' || typeof ${className} !== 'function') {
        console.error("CRITICAL: ${className} class definition missing or invalid. Ensure Step 1 complete.");
        return;
    }

    const options = ${optionsString};
    
    // Ensure canvas has dimensions before effect instantiation
    canvasElement.width = canvasElement.offsetWidth || window.innerWidth;
    canvasElement.height = canvasElement.offsetHeight || window.innerHeight;


    let backgroundEffectInstance = null;
    try {
        backgroundEffectInstance = new ${className}(canvasElement, options);
    } catch (error) {
        console.error("Error instantiating ${className}:", error);
        return;
    }

    if (backgroundEffectInstance && typeof backgroundEffectInstance.start === 'function') {
        backgroundEffectInstance.start();
    } else if (backgroundEffectInstance && typeof backgroundEffectInstance.draw === 'function') {
        backgroundEffectInstance.draw(); 
    } else {
        console.warn("${className} instance lacks start() or draw() method.");
    }

    window.addEventListener('resize', () => {
        if (!canvasElement || !backgroundEffectInstance) return;
        canvasElement.width = canvasElement.offsetWidth || window.innerWidth;
        canvasElement.height = canvasElement.offsetHeight || window.innerHeight;
        if (typeof backgroundEffectInstance.resize === 'function') {
            backgroundEffectInstance.resize();
        }
        // For static effects, redraw on resize if not animated
        if (backgroundEffectInstance.animationId === null && typeof backgroundEffectInstance.draw === 'function') {
            backgroundEffectInstance.draw();
        }
    });
    console.log("${className} effect initialization sequence complete.");
}

// Initialize after DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize${className}Effect);
} else {
    initialize${className}Effect();
}
// =============================================================================
// End of Sequence
// =============================================================================
`;
        codeOutputElem.textContent = snippet.trim();
        console.log('[BackgroundBuilder.generateCodeSnippet] Code snippet generated for modal.');
    }

    /**
     * Copies the generated code snippet from the modal to the clipboard.
     * @async
     * @public
     */
    async copySnippetToClipboard() {
        // MODIFIED: Target the modal's code output and copy button elements
        const codeOutputElem = document.getElementById('code-output-modal');
        const copyButtonElem = document.getElementById('copy-code-modal-button');
        const copyStatusTextElem = copyButtonElem ? copyButtonElem.querySelector('.copy-status-text-modal') : null;

        if (!this.valid || !codeOutputElem || !copyButtonElem || !copyStatusTextElem) {
            console.warn('[BackgroundBuilder.copySnippetToClipboard] Modal elements for copy missing.');
            return;
        }

        const textToCopy = codeOutputElem.textContent;
        const originalButtonText = copyStatusTextElem.textContent;

        if (!textToCopy || textToCopy.startsWith("// No active module")) {
            copyStatusTextElem.textContent = 'No Code!';
            copyButtonElem.classList.add('error'); // Optional: style for error
            setTimeout(() => {
                copyStatusTextElem.textContent = originalButtonText;
                copyButtonElem.classList.remove('error');
            }, 2000);
            return;
        }

        try {
            await navigator.clipboard.writeText(textToCopy);
            copyStatusTextElem.textContent = 'Sequence Copied!';
            copyButtonElem.classList.add('copied'); // Add 'copied' class from HTML script
            console.log('[BackgroundBuilder.copySnippetToClipboard] Code snippet copied from modal.');

            setTimeout(() => {
                copyStatusTextElem.textContent = originalButtonText;
                copyButtonElem.classList.remove('copied');
            }, 2500);
        } catch (err) {
            console.error('[BackgroundBuilder.copySnippetToClipboard] Failed to copy from modal: ', err);
            copyStatusTextElem.textContent = 'Copy Failed!';
            copyButtonElem.classList.add('error');
             setTimeout(() => {
                copyStatusTextElem.textContent = originalButtonText;
                copyButtonElem.classList.remove('error');
            }, 2000);
            // Fallback for older browsers or if permission is denied
            try {
                const textArea = document.createElement("textarea");
                textArea.value = textToCopy;
                // Styling to make it invisible
                Object.assign(textArea.style, {
                    position: "fixed", top: "-9999px", left: "-9999px",
                    width: "1px", height: "1px", opacity: 0
                });
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                // UI feedback for fallback success (already handled by the main try-catch in this case)
            } catch (execErr) {
                 console.error('[BackgroundBuilder.copySnippetToClipboard] Fallback execCommand error: ', execErr);
            }
        }
    }

    /**
     * Cleans up the builder, stops any running effects, and clears observers.
     * @public
     */
    destroy() {
        console.log('[BackgroundBuilder.destroy] Initiating destruction.');
        if (this.currentBackgroundInstance) {
            if (typeof this.currentBackgroundInstance.destroy === 'function') this.currentBackgroundInstance.destroy();
            else if (typeof this.currentBackgroundInstance.stop === 'function') this.currentBackgroundInstance.stop();
        }
        this.currentBackgroundInstance = null; this.currentBackgroundType = null;

        if (this.resizeObserver) this.resizeObserver.disconnect();
        this.resizeObserver = null;

        if (this.controlsContainer) this.controlsContainer.innerHTML = '<p class="placeholder-text">System Offline.</p>';
        
        const codeOutputModalElem = document.getElementById('code-output-modal');
        if (codeOutputModalElem) codeOutputModalElem.textContent = '// System Offline. Code generation unavailable.';

        if (this.ctx && this.previewCanvas) this.ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        
        this.registeredBackgrounds = {}; this.currentOptions = {};
        this.valid = false;
        console.log('[BackgroundBuilder.destroy] System shut down complete.');
    }
}

export default BackgroundBuilder;
