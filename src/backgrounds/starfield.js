// js/backgrounds/starfield.js

// TypeScript interfaces (StarfieldOptions, Star) and type imports are removed for JavaScript.
// JSDoc comments can be added for type hinting if desired.

class Starfield {
    // Public and private keywords are removed; class fields are public by default.
    // Type annotations are removed.
    canvas;
    ctx;
    options;
    originalOptions;

    stars = [];
    animationId = null;
    center = { x: 0, y: 0 };

    constructor(canvasElement, options = {}) {
        this.canvas = canvasElement;
        const context = this.canvas.getContext('2d');
        if (!context) {
            throw new Error("Starfield: Could not get 2D rendering context.");
        }
        this.ctx = context;

        this.originalOptions = { ...this.getDefaults(), ...options };
        this.options = { ...this.originalOptions };

        this.updateInternalOptions(this.options, true); // Initial setup, sets center

        this.draw = this.draw.bind(this);
        // this.resize(); // Builder calls resize initially if canvas has dimensions
    }

    getDefaults() {
        return {
            starCount: 300,
            minStarSize: 0.5,
            maxStarSize: 2.5,
            baseSpeed: 0.5,
            starColor: "rgba(255, 255, 255, 0.8)",
            backgroundColor: "rgb(0,0,0)",
            warpEffect: true,
            warpStrength: 50
        };
    }

    updateInternalOptions(newOptions, isInitialSetup = false) {
        const oldStarCount = this.options.starCount;
        this.options = { ...this.options, ...newOptions };

        // Update center (important if canvas size changes via options, though unlikely here)
        this.center.x = this.canvas.width / 2;
        this.center.y = this.canvas.height / 2;

        if (isInitialSetup || (newOptions.starCount !== undefined && newOptions.starCount !== oldStarCount)) {
             if (this.canvas.width > 0 && this.canvas.height > 0) this.resize(); // Re-initialize stars
        }
    }

    // private keyword removed
    createStar(isInitial = false) {
        const size = Math.random() * (this.options.maxStarSize - this.options.minStarSize) + this.options.minStarSize;

        if (this.options.warpEffect) {
            // For warp, x and y are offsets from center, scaled by z
            // Initialize them further out to give a sense of depth
            return {
                x: (Math.random() - 0.5) * this.canvas.width * 1.5, // Wider spread initially
                y: (Math.random() - 0.5) * this.canvas.height * 1.5,
                z: isInitial ? Math.random() * this.canvas.width : this.canvas.width, // z from 0 to canvas.width
                size: size
            };
        } else {
            // For non-warp, x and y are direct screen coordinates
            return {
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                z: 0, // Not used for non-warp perspective
                size: size
            };
        }
    }

    resize() {
        if (!this.canvas || this.canvas.width === 0 || this.canvas.height === 0) {
            this.stars = [];
            return;
        }
        this.center.x = this.canvas.width / 2;
        this.center.y = this.canvas.height / 2;

        const targetCount = this.options.starCount;
        // Efficiently adjust star array size
        if (this.stars.length > targetCount) {
            this.stars.length = targetCount;
        }
        // Fill up to targetCount
        for (let i = this.stars.length; i < targetCount; i++) {
            this.stars.push(this.createStar(true));
        }

        // If resize implies a need to re-initialize all stars' positions (e.g. due to warp effect or major changes)
        // This part of the original logic re-initializes all stars if the count was already correct but resize was called.
        // This could be refined to only re-initialize if certain conditions are met (e.g., warpEffect changed, significant dimension ratio change)
        // For now, keeping the original logic which re-creates all if the array was already full.
        if (this.stars.length > 0 && this.stars.length === targetCount && !isInitialCallDuringConstruction(this)) {
             // Re-initialize all stars if the canvas dimensions fundamentally change
             // This ensures stars are correctly distributed in the new space, especially for warp.
            this.stars = [];
            for (let i = 0; i < targetCount; i++) {
                this.stars.push(this.createStar(true));
            }
        }
        // Helper to avoid re-initializing stars unnecessarily during constructor chain leading to first resize.
        function isInitialCallDuringConstruction(instance) {
            // This is a heuristic. A more robust way might involve a flag set after constructor.
            // However, for this conversion, we'll assume resize() outside constructor implies a true resize event.
            // If `instance.animationId` is null and `instance.stars` was just populated, it might be initial.
            // The original code structure might call resize() during `updateInternalOptions` in constructor.
            return !instance.ctx; // If ctx not fully set, likely still in construction.
        }


        if (!this.animationId) {
            this.draw();
        }
    }

    draw() {
        if (!this.ctx ||this.canvas.width === 0 || this.canvas.height === 0 ) {
            if (this.ctx && this.canvas.width > 0 && this.canvas.height > 0) { // Check ctx before using
                 this.ctx.fillStyle = this.options.backgroundColor || "rgb(0,0,0)"; // Fallback backgroundColor
                 this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
            return;
        }
        if (this.stars.length === 0 && this.options.starCount > 0) {
            // Attempt to initialize stars if they are missing but should exist
            this.resize();
            if (this.stars.length === 0) { // If resize still couldn't create stars
                this.ctx.fillStyle = this.options.backgroundColor || "rgb(0,0,0)";
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                return;
            }
        } else if (this.stars.length === 0 && this.options.starCount === 0) {
             this.ctx.fillStyle = this.options.backgroundColor || "rgb(0,0,0)";
             this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
             return;
        }


        this.ctx.fillStyle = this.options.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.options.starColor;


        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];

            if (this.options.warpEffect) {
                star.z -= this.options.baseSpeed * (star.size / this.options.maxStarSize + 0.5);

                if (star.z <= 0) {
                    Object.assign(star, this.createStar(false));
                    star.z = this.canvas.width;
                    star.x = (Math.random() - 0.5) * this.canvas.width * 1.5;
                    star.y = (Math.random() - 0.5) * this.canvas.height * 1.5;
                }

                const k = this.options.warpStrength / Math.max(0.1, star.z);
                const px = star.x * k + this.center.x;
                const py = star.y * k + this.center.y;
                const projectedSize = Math.max(0.1, star.size * k * 0.5);

                if (px > -projectedSize && px < this.canvas.width + projectedSize &&
                    py > -projectedSize && py < this.canvas.height + projectedSize) {
                    this.ctx.beginPath();
                    this.ctx.arc(px, py, projectedSize, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            } else { // Simple scrolling effect
                star.x -= this.options.baseSpeed * (this.options.maxStarSize / star.size + 0.2);
                if (star.x + star.size < 0) {
                    star.x = this.canvas.width + star.size;
                    star.y = Math.random() * this.canvas.height;
                    star.size = Math.random() * (this.options.maxStarSize - this.options.minStarSize) + this.options.minStarSize;
                }
                this.ctx.beginPath();
                this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }

    start() {
        if (this.animationId) cancelAnimationFrame(this.animationId);

        if (this.stars.length === 0 && this.options.starCount > 0 && this.canvas.width > 0 && this.canvas.height > 0) {
            this.resize();
        }
        if (this.stars.length === 0 && this.options.starCount > 0) { // Check again if resize failed
            console.warn("Starfield: Cannot start, no stars to draw (check canvas size or star count).");
            this.draw(); // Attempt a static clear/draw
            return;
        }
        if (this.options.starCount === 0) { // If explicitly 0 stars, just draw background
            this.draw();
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
        this.stars = [];
        console.log("Starfield instance destroyed");
    }
}

export default Starfield;