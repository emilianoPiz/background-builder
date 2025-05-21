// js/backgrounds/fireflySwarm.js

class FireflySwarm {
    canvas;
    ctx;
    options;

    fireflies = [];
    animationId = null;
    mousePos = null; // { x, y }

    // Bound event handlers
    _boundHandleMouseMove;
    _boundHandleMouseOut;

    constructor(canvasElement, options = {}) {
        this.canvas = canvasElement;
        const context = this.canvas.getContext('2d');
        if (!context) {
            throw new Error("FireflySwarm: Could not get 2D rendering context.");
        }
        this.ctx = context;

        const defaultOpts = this.getDefaults();
        this.options = JSON.parse(JSON.stringify({ ...defaultOpts, ...options }));
        
        this._parseColorOptions();
        this.updateInternalOptions(this.options, true); // Initial setup
        
        this.draw = this.draw.bind(this);
        this._boundHandleMouseMove = this._handleMouseMove.bind(this);
        this._boundHandleMouseOut = this._handleMouseOut.bind(this);

        if (this.options.mouseInteraction) {
            this._addMouseListeners();
        }
    }

    getDefaults() {
        return {
            backgroundColor: '#05080a',
            fireflyColor: 'rgba(180, 255, 150, 0.7)',
            fireflyCount: 80,
            fireflyBaseSize: 1.8,
            fireflyBaseSpeed: 0.3,
            glowIntensity: 10,
            trailAmount: 0.08,
            mouseInteraction: true,
            interactionType: 'repel',
            interactionStrength: 0.8,
            mouseInfluenceRadius: 100
        };
    }
    
    _parseColorOptions() {
        // Validate/parse fireflyColor if needed, for now assume it's a valid CSS color string
        // For more complex scenarios, one might parse it into r,g,b,a components here
    }

    _addMouseListeners() {
        if (this.canvas) {
            this.canvas.addEventListener('mousemove', this._boundHandleMouseMove);
            this.canvas.addEventListener('mouseout', this._boundHandleMouseOut);
        }
    }

    _removeMouseListeners() {
        if (this.canvas) {
            this.canvas.removeEventListener('mousemove', this._boundHandleMouseMove);
            this.canvas.removeEventListener('mouseout', this._boundHandleMouseOut);
        }
    }

    _handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    _handleMouseOut() {
        this.mousePos = null;
    }

    updateInternalOptions(newOptions, isInitialSetup = false) {
        const oldFireflyCount = this.options.fireflyCount;
        const oldMouseInteraction = this.options.mouseInteraction;

        this.options = { ...this.options, ...newOptions };
        this._parseColorOptions(); // Re-parse if color string format might change

        if (isInitialSetup || (newOptions.fireflyCount !== undefined && newOptions.fireflyCount !== oldFireflyCount)) {
            this._initializeFireflies();
        }

        if (newOptions.mouseInteraction !== undefined && newOptions.mouseInteraction !== oldMouseInteraction) {
            if (this.options.mouseInteraction) {
                this._addMouseListeners();
            } else {
                this._removeMouseListeners();
                this.mousePos = null; // Clear mouse position if interaction is disabled
            }
        }
        
        if (isInitialSetup && this.canvas.width > 0 && this.canvas.height > 0) {
             this.resize(); // Should primarily re-init fireflies if canvas size changed dramatically
        }
    }

    _initializeFireflies() {
        this.fireflies = [];
        if (!this.canvas || this.canvas.width === 0 || this.canvas.height === 0 || this.options.fireflyCount === 0) return;
        for (let i = 0; i < this.options.fireflyCount; i++) {
            this.fireflies.push(this._createFirefly());
        }
    }

    _createFirefly(x, y) {
        const angle = Math.random() * Math.PI * 2;
        const speedVariation = (Math.random() * 0.6 + 0.7); // 70% to 130% of base speed
        const actualSpeed = this.options.fireflyBaseSpeed * speedVariation;
        
        const sizeVariation = (Math.random() * 0.6 + 0.7); // 70% to 130% of base size
        const actualSize = Math.max(0.3, this.options.fireflyBaseSize * sizeVariation);

        return {
            x: x !== undefined ? x : Math.random() * this.canvas.width,
            y: y !== undefined ? y : Math.random() * this.canvas.height,
            vx: Math.cos(angle) * actualSpeed,
            vy: Math.sin(angle) * actualSpeed,
            size: actualSize,
            // For more complex meandering:
            // targetAngle: angle,
            // angleChangeTimer: Math.random() * 100 + 50 // Ticks before changing angle
        };
    }

    resize() {
        // Fireflies will naturally redistribute via their movement and boundary logic.
        // If a more direct re-initialization or repositioning on resize is needed,
        // it could be added here, but often isn't necessary for this type of effect.
        if (!this.animationId && this.canvas.width > 0 && this.canvas.height > 0) {
             this.draw();
        }
    }

    draw() {
        if (!this.ctx || !this.canvas || this.canvas.width === 0 || this.canvas.height === 0) return;

        // Trail effect by not fully clearing
        this.ctx.globalCompositeOperation = 'source-over';
        const bgRgb = this._parseRgba(this.options.backgroundColor); // Assuming helper exists
        this.ctx.fillStyle = `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, ${1 - this.options.trailAmount})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.fireflies.forEach((p, index) => {
            // Simple meandering: slightly adjust velocity vector over time
            p.vx += (Math.random() - 0.5) * 0.05; // Small random turn
            p.vy += (Math.random() - 0.5) * 0.05;

            // Mouse interaction
            if (this.options.mouseInteraction && this.mousePos) {
                const dx = p.x - this.mousePos.x;
                const dy = p.y - this.mousePos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.options.mouseInfluenceRadius && dist > 0) { // dist > 0 to avoid division by zero
                    const forceDirectionX = dx / dist;
                    const forceDirectionY = dy / dist;
                    // Strength falls off with distance
                    const force = (1 - dist / this.options.mouseInfluenceRadius) * this.options.interactionStrength;
                    
                    if (this.options.interactionType === 'repel') {
                        p.vx += forceDirectionX * force * 0.1; // Adjust multiplier for responsiveness
                        p.vy += forceDirectionY * force * 0.1;
                    } else { // Attract
                        p.vx -= forceDirectionX * force * 0.1;
                        p.vy -= forceDirectionY * force * 0.1;
                    }
                }
            }

            // Limit speed
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            const maxSpeed = this.options.fireflyBaseSpeed * 1.5; // Allow some variance
            if (speed > maxSpeed) {
                p.vx = (p.vx / speed) * maxSpeed;
                p.vy = (p.vy / speed) * maxSpeed;
            }

            p.x += p.vx;
            p.y += p.vy;

            // Boundary conditions (wrap around)
            if (p.x < -p.size) p.x = this.canvas.width + p.size;
            if (p.x > this.canvas.width + p.size) p.x = -p.size;
            if (p.y < -p.size) p.y = this.canvas.height + p.size;
            if (p.y > this.canvas.height + p.size) p.y = -p.size;

            // Draw firefly
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            
            this.ctx.fillStyle = this.options.fireflyColor;
            if (this.options.glowIntensity > 0) {
                this.ctx.shadowColor = this.options.fireflyColor; // Glow with the same color
                this.ctx.shadowBlur = this.options.glowIntensity;
            }
            this.ctx.fill();
            if (this.options.glowIntensity > 0) {
                 this.ctx.shadowBlur = 0; // Reset for next draw iteration
                 this.ctx.shadowColor = 'transparent';
            }
        });
    }
    
    // Helper to parse color string (rgba or hex) into r,g,b,a object
    _parseRgba(colorString) {
        colorString = String(colorString).trim();
        if (colorString.startsWith('#')) {
            let r = 0, g = 0, b = 0;
            if (colorString.length === 4) {
                r = parseInt(colorString[1] + colorString[1], 16);
                g = parseInt(colorString[2] + colorString[2], 16);
                b = parseInt(colorString[3] + colorString[3], 16);
            } else if (colorString.length === 7) {
                r = parseInt(colorString.substring(1, 3), 16);
                g = parseInt(colorString.substring(3, 5), 16);
                b = parseInt(colorString.substring(5, 7), 16);
            }
            return { r, g, b, a: 1 };
        }
        
        const match = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (match) {
            return {
                r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]),
                a: match[4] !== undefined ? parseFloat(match[4]) : 1
            };
        }
        return {r:0, g:0, b:0, a:1}; // Fallback: opaque black if unparseable
    }


    start() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
         if (!this.canvas || this.canvas.width === 0 || this.canvas.height === 0) {
             console.warn("FireflySwarm: Canvas not ready. Start aborted.");
             if(this.fireflies.length !== this.options.fireflyCount && this.options.fireflyCount > 0) this._initializeFireflies();
             return;
        }
        if(this.fireflies.length !== this.options.fireflyCount && this.options.fireflyCount > 0) this._initializeFireflies();

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
        this._removeMouseListeners();
        this.fireflies = [];
        // console.log("FireflySwarm instance destroyed");
    }
}

export default FireflySwarm;