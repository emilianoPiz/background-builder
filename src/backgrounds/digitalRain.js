// js/backgrounds/digitalRain.js

// TypeScript interface (DigitalRainOptions) and type imports are removed for JavaScript.
// JSDoc comments can be added for type hinting if desired.

class DigitalRain {
    // Public and private keywords are removed; class fields are public by default.
    // Type annotations are removed.
    canvas;
    ctx;
    options;
    originalOptions;

    animationId = null;
    drops = [];
    columns = 0;

    // To ensure theme colors are derived from options correctly
    currentFontColor = '';
    currentTrailColor = '';
    currentGlowColor = '';


    constructor(canvasElement, options = {}) {
        this.canvas = canvasElement;
        const context = this.canvas.getContext('2d');
        if (!context) {
            throw new Error("DigitalRain: Could not get 2D rendering context.");
        }
        this.ctx = context;

        this.originalOptions = { ...this.getDefaults(), ...options };
        // Initialize options with a deep copy to avoid modifying originalOptions or defaults
        this.options = JSON.parse(JSON.stringify(this.originalOptions));

        this.updateInternalOptions(this.options, true); // Apply initial options, set defaults, and update theme colors

        this.draw = this.draw.bind(this);

        // Initial setup of columns and drops if canvas has dimensions
        if (this.canvas.width > 0 && this.canvas.height > 0) {
            this.resize();
        }
        // Builder's ResizeObserver will also call resize if dimensions change later.
    }

    getDefaults() {
        return {
            fontSize: 16,
            fontFamily: 'VT323, monospace',
            chars: "0123456789ABCDEFﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍｦｲｸｺｿﾁﾄﾉﾌﾔﾖﾙﾚﾛﾝ",
            isDarkThemePreview: true,
            fontColorDark: "#00FF00",
            trailColorDark: "rgba(0, 5, 0, 0.05)",
            glowColorDark: "#00FF00",
            fontColorLight: "#006400",
            trailColorLight: "rgba(230, 245, 230, 0.08)",
            glowColorLight: "#008F00"
        };
    }

    updateInternalOptions(newOptions, isInitialSetup = false) {
        const oldFontSize = this.options?.fontSize;
        this.options = { ...(this.options || this.getDefaults()), ...newOptions };

        // Update theme-dependent colors
        this.updateColorsBasedOnTheme();

        // If font size changes, a resize is needed to recalculate columns
        if (!isInitialSetup && newOptions.fontSize !== undefined && newOptions.fontSize !== oldFontSize) {
            if (this.canvas && this.canvas.width > 0 && this.canvas.height > 0) { // Check canvas validity
                this.resize();
            }
        } else if (isInitialSetup && (this.canvas && this.canvas.width > 0 && this.canvas.height > 0)) {
            // Ensure resize is called on initial setup if canvas is ready
            // this.resize(); // This is often handled by builder's initial resize call on the instance
        }
    }

    // private keyword removed
    updateColorsBasedOnTheme() {
        const defaults = this.getDefaults();
        this.currentFontColor = this.options.isDarkThemePreview
            ? (this.options.fontColorDark || defaults.fontColorDark)
            : (this.options.fontColorLight || defaults.fontColorLight);
        this.currentTrailColor = this.options.isDarkThemePreview
            ? (this.options.trailColorDark || defaults.trailColorDark)
            : (this.options.trailColorLight || defaults.trailColorLight);
        this.currentGlowColor = this.options.isDarkThemePreview
            ? (this.options.glowColorDark || defaults.glowColorDark)
            : (this.options.glowColorLight || defaults.glowColorLight);
    }

    resize() {
        if (!this.canvas || this.canvas.width === 0 || this.canvas.height === 0 || this.options.fontSize <= 0) {
            this.columns = 0;
            this.drops = [];
            if (this.ctx && !this.animationId && this.canvas && this.canvas.width > 0 && this.canvas.height > 0) { // If canvas is valid but effect is not runnable
                this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
            }
            return;
        }

        this.columns = Math.floor(this.canvas.width / this.options.fontSize);
        // Only re-initialize drops if the number of columns changes or if drops is empty
        if (this.drops.length !== this.columns || this.drops.length === 0) {
            this.drops = [];
            for (let i = 0; i < this.columns; i++) {
                // Staggered start: some off-screen, some on-screen
                this.drops[i] = Math.random() > 0.5
                    ? Math.random() * (this.canvas.height / this.options.fontSize)
                    : Math.random() * (-this.canvas.height / this.options.fontSize) * 0.5; // Start further up
            }
        }
        // If not animating, perform a draw to reflect the resize.
        if (!this.animationId) {
            this.draw();
        }
    }

    draw() {
        if (!this.ctx || this.columns === 0 || this.canvas.width === 0 || this.canvas.height === 0 || !this.options.chars) {
            if (this.ctx && this.canvas.width > 0 && this.canvas.height > 0) {
                 this.ctx.fillStyle = this.options.isDarkThemePreview ? 'black' : 'white'; // Clear with appropriate bg
                 this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
            return;
        }

        this.ctx.fillStyle = this.currentTrailColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.font = `${this.options.fontSize}px ${this.options.fontFamily}`;

        for (let i = 0; i < this.columns; i++) {
            if (this.drops[i] === undefined) continue; // Should not happen if resize worked

            const text = this.options.chars[Math.floor(Math.random() * this.options.chars.length)];
            const yPos = this.drops[i] * this.options.fontSize;

            // Leading character glow
            const isLeadingCharacter = Math.random() > (this.options.isDarkThemePreview ? 0.97 : 0.988);
            if (isLeadingCharacter && yPos > this.options.fontSize * 1.5 && yPos < this.canvas.height - this.options.fontSize) {
                this.ctx.fillStyle = this.options.isDarkThemePreview ? '#E0FFE0' : '#004000'; // Brighter for dark, darker for light
                this.ctx.shadowColor = this.currentGlowColor;
                this.ctx.shadowBlur = this.options.isDarkThemePreview ? 8 : 5;
            } else {
                this.ctx.fillStyle = this.currentFontColor;
                this.ctx.shadowColor = 'transparent';
                this.ctx.shadowBlur = 0;
            }

            this.ctx.fillText(text, i * this.options.fontSize, yPos);
            this.ctx.shadowBlur = 0; // Reset shadow for next char (important!)

            // Reset drop if it goes off-screen, with a chance to stagger respawn
            if (yPos > this.canvas.height && Math.random() > 0.98) {
                this.drops[i] = Math.random() * -20 -1; // Start further off-screen upwards
            }
            this.drops[i]++;
        }
    }

    start() {
        if (this.animationId) cancelAnimationFrame(this.animationId);

        // Ensure dimensions are set and drops initialized before starting
        if ((this.columns === 0 || this.drops.length === 0) && this.canvas && this.canvas.width > 0 && this.canvas.height > 0) {
            this.resize();
        }
         if (this.columns === 0) { // If still no columns, cannot start
            console.warn("DigitalRain: Cannot start, columns count is zero (check canvas size and font size).");
            this.draw(); // Attempt a static draw / clear
            return;
        }

        const animateRain = () => {
            this.draw();
            this.animationId = requestAnimationFrame(animateRain);
        };
        animateRain();
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    destroy() {
        this.stop();
        if (this.ctx && this.canvas && this.canvas.width > 0 && this.canvas.height > 0) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.drops = [];
        console.log("DigitalRain instance destroyed");
    }
}

export default DigitalRain;