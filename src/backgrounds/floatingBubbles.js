// js/backgrounds/floatingBubbles.js

// TypeScript interfaces (FloatingBubblesOptions, Bubble) and type imports are removed for JavaScript.
// JSDoc comments can be added for type hinting if desired.

class FloatingBubbles {
    // Public and private keywords are removed; class fields are public by default.
    // Type annotations are removed.
    canvas;
    ctx;
    options;
    originalOptions;

    bubbles = [];
    animationId = null;
    parsedColors = [];

    constructor(canvasElement, options = {}) {
        this.canvas = canvasElement;
        const context = this.canvas.getContext('2d');
        if (!context) {
            throw new Error("FloatingBubbles: Could not get 2D rendering context.");
        }
        this.ctx = context;

        this.originalOptions = { ...this.getDefaults(), ...options };
        this.options = { ...this.originalOptions };

        this.updateInternalOptions(this.options, true); // Parse colors and initialize

        this.draw = this.draw.bind(this);
        // Initial setup based on canvas size (resize is called by builder initially too)
        // this.resize();
    }

    getDefaults() {
        return {
            bubbleCount: 50,
            minSize: 5,
            maxSize: 25,
            minSpeed: 0.2,
            maxSpeed: 1.0,
            colors: ["rgba(255,255,255,0.1)", "rgba(173,216,230,0.1)", "rgba(144,238,144,0.1)"],
            spawnRate: 0.5
        };
    }

    // private keyword removed
    parseColorOptions(colorInput) {
        if (typeof colorInput === 'string') {
            return colorInput.split(',').map(c => c.trim()).filter(c => c.length > 0);
        }
        return Array.isArray(colorInput) ? colorInput : [];
    }

    updateInternalOptions(newOptions, isInitialSetup = false) {
        const oldBubbleCount = this.options.bubbleCount;
        this.options = { ...this.options, ...newOptions };

        if (newOptions.colors !== undefined || isInitialSetup) {
            this.parsedColors = this.parseColorOptions(this.options.colors);
            if (this.parsedColors.length === 0) {
                console.warn("FloatingBubbles: No valid colors provided. Using default colors.");
                // Removed 'as string[]' type assertion
                this.parsedColors = this.getDefaults().colors;
            }
        }

        // If bubbleCount changes significantly, or during initial setup, regenerate bubbles
        if (isInitialSetup || (newOptions.bubbleCount !== undefined && newOptions.bubbleCount !== oldBubbleCount)) {
            if (this.canvas && this.canvas.width > 0 && this.canvas.height > 0) { // Ensure canvas is valid before resize
                 this.resize(); // Re-initialize bubbles for new count or if canvas size changed
            }
        }
    }

    resize() {
        if (!this.canvas || this.canvas.width === 0 || this.canvas.height === 0) {
            this.bubbles = []; // Clear bubbles if canvas is invalid
            return;
        }
        // Adjust existing bubbles or create new ones
        const targetCount = this.options.bubbleCount;
        if (this.bubbles.length > targetCount) {
            this.bubbles.length = targetCount; // Truncate
        }
        while (this.bubbles.length < targetCount) {
            this.bubbles.push(this.createBubble(true)); // true for initial random Y
        }
        // Optionally, re-position existing bubbles if canvas size changed dramatically.
        // For now, new bubbles will adapt.
        if (!this.animationId) {
            this.draw();
        }
    }

    // private keyword removed
    createBubble(initialRandomY = false) {
        const size = Math.random() * (this.options.maxSize - this.options.minSize) + this.options.minSize;
        const x = Math.random() * this.canvas.width;
        const y = initialRandomY
            ? Math.random() * this.canvas.height
            : this.canvas.height + size + Math.random() * (this.canvas.height * 0.2); // Start further below screen

        const speed = Math.random() * (this.options.maxSpeed - this.options.minSpeed) + this.options.minSpeed;
        const color = this.parsedColors.length > 0
            ? this.parsedColors[Math.floor(Math.random() * this.parsedColors.length)]
            : 'rgba(255,255,255,0.1)'; // Fallback color

        return { x, y, size, speed, color };
    }

    draw() {
        if (!this.ctx || this.canvas.width === 0 || this.canvas.height === 0) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Add new bubbles based on spawn rate (simplified)
        // Assuming 60 FPS for spawnRate calculation
        if (this.options.spawnRate > 0 && Math.random() < this.options.spawnRate / 60) {
            if (this.bubbles.length < this.options.bubbleCount * 1.5) { // Cap max concurrent bubbles slightly above target
                this.bubbles.push(this.createBubble());
            }
        }

        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const bubble = this.bubbles[i];
            bubble.y -= bubble.speed;

            // Add slight horizontal drift for more natural movement
            bubble.x += (Math.random() - 0.5) * 0.5;
            if (bubble.x < -bubble.size) bubble.x = this.canvas.width + bubble.size;
            if (bubble.x > this.canvas.width + bubble.size) bubble.x = -bubble.size;


            this.ctx.beginPath();
            this.ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
            this.ctx.fillStyle = bubble.color;
            this.ctx.fill();

            // Remove or reset bubble if it goes off-screen
            if (bubble.y + bubble.size < 0) {
                if (this.bubbles.length <= this.options.bubbleCount) {
                    // Reset this bubble instead of splicing and pushing, potentially more efficient
                    Object.assign(this.bubbles[i], this.createBubble());
                } else {
                    this.bubbles.splice(i, 1); // Remove if we are over the desired count (e.g. due to spawn rate)
                }
            }
        }
    }

    start() {
        if (this.animationId) cancelAnimationFrame(this.animationId);

        if (this.bubbles.length === 0 && this.options.bubbleCount > 0 && this.canvas.width > 0 && this.canvas.height > 0) {
            this.resize(); // Ensure bubbles are created if count is > 0 and canvas is valid
        }
         if (this.parsedColors.length === 0) { // Ensure colors are parsed if not already
            this.updateInternalOptions({ colors: this.options.colors }, true);
         }
         if (this.bubbles.length === 0 && this.options.bubbleCount > 0) { // If still no bubbles and should have some
            console.warn("FloatingBubbles: Cannot start, no bubbles to draw (check canvas size or bubble count).");
            this.draw(); // Attempt a static draw
            return;
         }
         if (this.options.bubbleCount === 0) { // If explicitly 0 bubbles
             this.draw(); // Draw empty canvas (clears it)
             return;
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
        if (this.ctx && this.canvas.width > 0 && this.canvas.height > 0) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.bubbles = [];
        console.log("FloatingBubbles instance destroyed");
    }
}

export default FloatingBubbles;