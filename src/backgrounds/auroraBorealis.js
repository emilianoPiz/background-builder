// js/backgrounds/auroraBorealis.js

class AuroraBorealis {
    canvas;
    ctx;
    options;

    curtains = []; // Each curtain will have its own set of sine wave parameters
    animationId = null;
    internalTime = 0;

    constructor(canvasElement, options = {}) {
        this.canvas = canvasElement;
        const context = this.canvas.getContext('2d');
        if (!context) {
            throw new Error("AuroraBorealis: Could not get 2D rendering context.");
        }
        this.ctx = context;

        const defaultOpts = this.getDefaults();
        this.options = JSON.parse(JSON.stringify({ ...defaultOpts, ...options }));

        this._parseColorOptions();
        this.updateInternalOptions(this.options, true); // Initial setup

        this.draw = this.draw.bind(this);
    }

    getDefaults() {
        return {
            backgroundColor: '#01000D',
            auroraColors: 'rgba(0,230,120,0.15),rgba(100,80,255,0.1),rgba(220,80,200,0.12)',
            numCurtains: 4,
            curtainAnchorYFactor: 0.1,
            curtainMaxReachFactor: 0.7,
            swaySpeed: 0.004,
            driftSpeed: 0.0015,
            complexity: 4,
            baseIntensity: 0.6,
            shimmerSpeed: 0.015
        };
    }

    _parseColorOptions() {
        if (typeof this.options.auroraColors === 'string') {
            this.options.auroraColors = this.options.auroraColors.split(',')
                .map(s => s.trim())
                .filter(s => s.startsWith('rgba')); // Basic validation for rgba
        }
        if (!Array.isArray(this.options.auroraColors) || this.options.auroraColors.length === 0) {
            console.warn("AuroraBorealis: Invalid auroraColors, using default.");
            this.options.auroraColors = this.getDefaults().auroraColors.split(',');
        }
    }

    updateInternalOptions(newOptions, isInitialSetup = false) {
        const oldNumCurtains = this.options.numCurtains;
        const oldComplexity = this.options.complexity;
        const oldColors = JSON.stringify(this.options.auroraColors);

        this.options = { ...this.options, ...newOptions };
        this._parseColorOptions();

        if (isInitialSetup ||
            (newOptions.numCurtains !== undefined && newOptions.numCurtains !== oldNumCurtains) ||
            (newOptions.complexity !== undefined && newOptions.complexity !== oldComplexity) ||
            (JSON.stringify(this.options.auroraColors) !== oldColors)
        ) {
            if (this.canvas.width > 0 && this.canvas.height > 0) {
                 this._initializeCurtains();
            }
        }
        
        if (isInitialSetup && this.canvas.width > 0 && this.canvas.height > 0) {
             this.resize(); // Ensure curtains are initialized for current canvas size
        }
    }

    _initializeCurtains() {
        this.curtains = [];
        if (!this.canvas || this.canvas.width === 0 || this.canvas.height === 0 || this.options.numCurtains === 0) return;

        for (let i = 0; i < this.options.numCurtains; i++) {
            const curtain = {
                color: this.options.auroraColors[i % this.options.auroraColors.length],
                // Base Y slightly randomized around the anchor for layering
                baseY: this.canvas.height * (this.options.curtainAnchorYFactor + (Math.random() - 0.5) * 0.1), 
                pathPoints: this.options.complexity, // Number of sine waves to sum for complexity
                // Each curtain gets its own set of random parameters for its sine waves
                sines: [],
                opacityFactor: 0.8 + Math.random() * 0.4 // Slight base opacity variation
            };
            for (let j = 0; j < curtain.pathPoints; j++) {
                curtain.sines.push({
                    amplitude: (Math.random() * 0.8 + 0.2) * (this.canvas.height * this.options.curtainMaxReachFactor * 0.2), // Amplitude relative to max reach
                    frequency: (Math.random() * 0.02 + 0.005) * (j + 1) * 0.5, // Varying frequencies
                    timeOffset: Math.random() * Math.PI * 2, // Random phase
                    spatialOffset: Math.random() * Math.PI * 2 // Adds variation along x-axis
                });
            }
            this.curtains.push(curtain);
        }
    }

    resize() {
        // Re-initialize curtains as their properties depend on canvas dimensions
        if (this.canvas.width > 0 && this.canvas.height > 0) {
            this._initializeCurtains();
        }
        if (!this.animationId && this.canvas.width > 0 && this.canvas.height > 0) {
             this.draw();
        }
    }
    
    // Helper to parse rgba string into an object {r,g,b,a}
    _parseRgbaColor(rgbaString) {
        const match = String(rgbaString).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (match) {
            return {
                r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]),
                a: match[4] !== undefined ? parseFloat(match[4]) : 1
            };
        }
        return {r:0,g:255,b:0,a:0.1}; // Default fallback (greenish)
    }


    draw() {
        if (!this.ctx || !this.canvas || this.canvas.width === 0 || this.canvas.height === 0) return;
        this.internalTime++;

        this.ctx.fillStyle = this.options.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.globalCompositeOperation = 'lighter'; // Additive blending for light effects

        this.curtains.forEach(curtain => {
            const currentGlobalIntensity = this.options.baseIntensity * curtain.opacityFactor;
            // Shimmer effect: modulate opacity
            const shimmer = (Math.sin(this.internalTime * this.options.shimmerSpeed + curtain.sines[0].timeOffset) + 1) / 2; // 0 to 1
            const finalOpacity = currentGlobalIntensity * (0.6 + shimmer * 0.4); // Shimmer between 60% and 100% of current intensity

            const curtainColorObj = this._parseRgbaColor(curtain.color);
            // Modify alpha of the parsed color by finalOpacity
            const effectiveColor = `rgba(${curtainColorObj.r}, ${curtainColorObj.g}, ${curtainColorObj.b}, ${Math.min(curtainColorObj.a, 0.4) * finalOpacity})`; // Cap base alpha for better blending

            // Create a vertical gradient for this curtain
            const gradient = this.ctx.createLinearGradient(0, curtain.baseY, 0, curtain.baseY + this.canvas.height * this.options.curtainMaxReachFactor * 1.5); // Extend gradient further down
            gradient.addColorStop(0, effectiveColor);
            const endColor = `rgba(${curtainColorObj.r}, ${curtainColorObj.g}, ${curtainColorObj.b}, 0)`;
            gradient.addColorStop(1, endColor);
            this.ctx.fillStyle = gradient;
            
            this.ctx.beginPath();
            // Move to starting point slightly off-screen to ensure smooth edge
            let firstY = curtain.baseY;
             curtain.sines.forEach(sine => {
                firstY += sine.amplitude * Math.sin(-10 * sine.frequency + this.internalTime * this.options.swaySpeed + sine.timeOffset + this.internalTime * this.options.driftSpeed * (sine.frequency*10) + sine.spatialOffset);
            });
            this.ctx.moveTo(-10, firstY);


            const segments = this.canvas.width / 10; // Draw in segments for smoother curves
            for (let i = 0; i <= segments; i++) {
                const x = (i / segments) * this.canvas.width;
                let yOffset = 0;
                curtain.sines.forEach(sine => {
                    // swaySpeed for horizontal oscillation, driftSpeed for overall pattern evolution
                    // spatialOffset and sine.frequency create unique wave patterns along x
                    yOffset += sine.amplitude * Math.sin(x * sine.frequency + this.internalTime * this.options.swaySpeed + sine.timeOffset + this.internalTime * this.options.driftSpeed * (sine.frequency*10) + sine.spatialOffset);
                });
                this.ctx.lineTo(x, curtain.baseY + yOffset);
            }
            
            // Define the bottom edge of the aurora curtain shape
            this.ctx.lineTo(this.canvas.width + 10, this.canvas.height * (this.options.curtainAnchorYFactor + this.options.curtainMaxReachFactor + 0.2) ); // Extend beyond bottom edge
            this.ctx.lineTo(-10, this.canvas.height * (this.options.curtainAnchorYFactor + this.options.curtainMaxReachFactor + 0.2) );
            this.ctx.closePath();
            this.ctx.fill();
        });

        this.ctx.globalCompositeOperation = 'source-over'; // Reset composite mode
    }

    start() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (!this.canvas || this.canvas.width === 0 || this.canvas.height === 0) {
             console.warn("AuroraBorealis: Canvas not ready. Start aborted.");
             if(this.curtains.length !== this.options.numCurtains && this.options.numCurtains > 0) this._initializeCurtains();
             return;
        }
        if(this.curtains.length !== this.options.numCurtains && this.options.numCurtains > 0) this._initializeCurtains();

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
        this.curtains = [];
        // console.log("AuroraBorealis instance destroyed");
    }
}

export default AuroraBorealis;