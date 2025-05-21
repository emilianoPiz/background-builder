// js/backgrounds/colorShiftGradient.js

// TypeScript interfaces (ColorShiftGradientOptions, RGBColor) and type imports are removed for JavaScript.
// JSDoc comments can be added for type hinting if desired.

class ColorShiftGradient {
    // Public and private keywords are removed; class fields are public by default.
    // Type annotations are removed.
    canvas;
    ctx;
    options;
    originalOptions; // Store initial config

    animationId = null;
    time = 0;
    parsedColors = [];

    constructor(canvasElement, options = {}) {
        this.canvas = canvasElement;
        const context = this.canvas.getContext('2d');
        if (!context) {
            throw new Error("ColorShiftGradient: Could not get 2D rendering context.");
        }
        this.ctx = context;

        this.originalOptions = { ...this.getDefaults(), ...options };
        this.options = { ...this.originalOptions }; // Initial setup

        this.updateInternalOptions(this.options, true); // Parse initial colors

        this.draw = this.draw.bind(this);
    }

    getDefaults() {
        return {
            colors: ["#FFB6C1", "#FFDAB9", "#E6E6FA", "#B0E0E6"],
            speed: 0.0005,
            angle: 45,
            type: 'linear'
        };
    }

    // private keyword removed
    hexToRgb(hex) {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // private keyword removed
    parseColorInput(colorInput) {
        let colorArray;
        if (typeof colorInput === 'string') {
            colorArray = colorInput.split(',').map(c => c.trim()).filter(c => c);
        } else {
            colorArray = colorInput;
        }
        // Removed 'as RGBColor[]' type assertion
        return colorArray.map(c => this.hexToRgb(c)).filter(c => c !== null);
    }

    updateInternalOptions(newOptions, isInitialSetup = false) {
        this.options = { ...this.options, ...newOptions };

        if (newOptions.colors !== undefined || isInitialSetup) {
            this.parsedColors = this.parseColorInput(this.options.colors);
            if (this.parsedColors.length < 2) {
                console.warn("ColorShiftGradient: Not enough valid colors provided. Using default colors for rendering.");
                this.parsedColors = this.parseColorInput(this.getDefaults().colors);
            }
        }
    }

    resize() {
        // No specific resize logic needed beyond canvas dimensions being set by builder,
        // as the gradient fills the entire canvas. Redraw if not animating.
        if (!this.animationId) {
            this.draw();
        }
    }

    // private keyword removed
    interpolateColor(color1, color2, factor) {
        const r = Math.round(color1.r + factor * (color2.r - color1.r));
        const g = Math.round(color1.g + factor * (color2.g - color1.g));
        const b = Math.round(color1.b + factor * (color2.b - color1.b));
        return `rgb(${r},${g},${b})`;
    }

    draw() {
        if (!this.ctx || this.canvas.width === 0 || this.canvas.height === 0 || this.parsedColors.length < 2) {
            // Clear if invalid to prevent artifacts, or draw fallback
            if (this.ctx && this.canvas.width > 0 && this.canvas.height > 0) {
                 this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                 // console.warn("ColorShiftGradient: Not enough colors to draw, canvas cleared.");
            }
            return;
        }

        this.time += this.options.speed;
        const w = this.canvas.width;
        const h = this.canvas.height;

        const colorCount = this.parsedColors.length;
        // Ensure continuous loop: scale time to cycle through all (colorCount) segments
        // A segment is between color_i and color_{i+1}. There are 'colorCount' such segments if we loop back.
        const scaledTime = (this.time * colorCount) % colorCount;

        const colorIndex1 = Math.floor(scaledTime);
        const colorIndex2 = (colorIndex1 + 1) % colorCount;
        const factor = scaledTime - colorIndex1; // Factor between 0 and 1

        const c1 = this.parsedColors[colorIndex1];
        const c2 = this.parsedColors[colorIndex2];

        if (!c1 || !c2) { // Should not happen if parsedColors has >= 2 elements
            console.error("ColorShiftGradient: Error with parsed colors during draw.");
            this.ctx.clearRect(0, 0, w, h); // Clear to avoid drawing with bad state
            return;
        }

        const startColor = this.interpolateColor(c1, c2, factor);
        // For a smoother gradient transition, the "endColor" should be the *next* interpolated color in the sequence
        const nextSegmentStartTime = (Math.floor(scaledTime) + 1) % colorCount; // This logic is a bit complex, effectively what the original did by picking two colors based on time.
                                                                              // Simpler: the "end" color of the current gradient segment.
        const endColorC1 = this.parsedColors[colorIndex2]; // End of current segment
        const endColorC2 = this.parsedColors[(colorIndex2 + 1) % colorCount]; // Start of next segment for interpolation over the *whole* gradient span
        const endColor = this.interpolateColor(endColorC1, endColorC2, factor); // This makes the *second* color also shift.

        let gradient;
        if (this.options.type === 'radial') {
            const centerX = w / 2;
            const centerY = h / 2;
            const radius = Math.sqrt(w*w + h*h) / 2; // Diagonal radius to cover corners
            gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        } else { // Linear
            const angleRad = (this.options.angle * Math.PI) / 180;
            // Calculate gradient line based on angle and canvas dimensions
            // This ensures the gradient line spans across the canvas correctly for any angle
            const length = Math.max(w,h) * Math.sqrt(2); // Ensure gradient line is long enough
            const x0 = w / 2 - (Math.cos(angleRad) * length) / 2;
            const y0 = h / 2 - (Math.sin(angleRad) * length) / 2;
            const x1 = w / 2 + (Math.cos(angleRad) * length) / 2;
            const y1 = h / 2 + (Math.sin(angleRad) * length) / 2;
            gradient = this.ctx.createLinearGradient(x0, y0, x1, y1);
        }

        gradient.addColorStop(0, startColor);
        gradient.addColorStop(1, endColor);

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, w, h);
    }

    start() {
        if (this.animationId) cancelAnimationFrame(this.animationId);

        // Ensure colors are parsed if not done yet (e.g. if options updated without restart)
        if (this.parsedColors.length < 2) {
            this.updateInternalOptions({ colors: this.options.colors }, true);
            if (this.parsedColors.length < 2) {
                console.warn("ColorShiftGradient: Cannot start, not enough valid colors. Fallback drawn if possible.");
                this.draw(); // Attempt a static draw with defaults if possible
                return;
            }
        }

        const animate = () => {
            this.draw();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    destroy() {
        this.stop();
        // No specific clearing needed as it's a full-canvas fill,
        // but good practice to nullify if needed elsewhere.
        this.parsedColors = [];
        console.log("ColorShiftGradient instance destroyed");
    }
}

export default ColorShiftGradient;