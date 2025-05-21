// js/backgrounds/flowingInk.js

class FlowingInk {
    canvas;
    ctx;
    options;

    particles = [];
    emitters = [];
    flowField = { cols: 0, rows: 0, cellSize: 20, angles: [] }; // Ensure flowField object structure
    animationId = null;
    internalTime = 0;

    mousePos = { x: 0, y: 0, down: false };
    _boundHandleMouseDown;
    _boundHandleMouseUp;
    _boundHandleMouseMove;
    _boundHandleMouseOut;

    constructor(canvasElement, options = {}) {
        this.canvas = canvasElement;
        const context = this.canvas.getContext('2d');
        if (!context) {
            throw new Error("FlowingInk: Could not get 2D rendering context.");
        }
        this.ctx = context;

        const defaultOpts = this.getDefaults();
        // Deep copy options
        this.options = JSON.parse(JSON.stringify({ ...defaultOpts, ...options }));
        
        this._parseColorOptions(); // Parse colors before full init

        // Bind methods that will be used as event handlers or callbacks
        this.draw = this.draw.bind(this);
        this._boundHandleMouseDown = this._handleMouseDown.bind(this);
        this._boundHandleMouseUp = this._handleMouseUp.bind(this);
        this._boundHandleMouseMove = this._handleMouseMove.bind(this);
        this._boundHandleMouseOut = this._handleMouseOut.bind(this);
        
        // Call updateInternalOptions to initialize everything based on options
        this.updateInternalOptions(this.options, true); // isInitialSetup = true

        // Add mouse listeners if enabled (moved from updateInternalOptions for initial setup)
        if (this.options.enableMouseInjection) {
            this._addMouseListeners();
        }
    }

    getDefaults() {
        return {
            backgroundColor: '#FFFFFF',
            inkColors: 'rgba(255,0,100,0.6),rgba(0,150,255,0.6),rgba(255,150,0,0.6)',
            numEmitters: 3,
            emissionRate: 4,
            particleLifespan: 180,
            particleStartSize: 20,
            particleEndSize: 1,
            flowFieldStrength: 0.7,
            flowFieldScale: 0.03,
            flowFieldEvolutionSpeed: 0.0015,
            particleDrag: 0.02,
            colorBlendingMode: 'lighter',
            useTrails: true,
            trailOpacity: 0.05,
            enableMouseInjection: true,
            mouseInjectColor: 'rgba(80,220,150,0.7)',
            injectOnDrag: true,
            mouseInjectSize: 15,
            mouseInjectRate: 3
        };
    }

    _parseColorOptions() {
        if (typeof this.options.inkColors === 'string') {
            this.options.inkColors = this.options.inkColors.split(',')
                .map(s => s.trim()).filter(s => s.startsWith('rgba') || s.startsWith('#'));
        }
        if (!Array.isArray(this.options.inkColors) || this.options.inkColors.length === 0) {
            this.options.inkColors = this.getDefaults().inkColors.split(',');
        }
        if (typeof this.options.mouseInjectColor !== 'string' || 
            !(this.options.mouseInjectColor.startsWith('rgba') || this.options.mouseInjectColor.startsWith('#'))) {
            this.options.mouseInjectColor = this.getDefaults().mouseInjectColor;
        }
    }
    
    _addMouseListeners() {
        if (!this.canvas) return;
        this.canvas.addEventListener('mousedown', this._boundHandleMouseDown);
        window.addEventListener('mouseup', this._boundHandleMouseUp);
        this.canvas.addEventListener('mousemove', this._boundHandleMouseMove);
        this.canvas.addEventListener('mouseout', this._boundHandleMouseOut);
    }

    _removeMouseListeners() {
        if (!this.canvas) return;
        this.canvas.removeEventListener('mousedown', this._boundHandleMouseDown);
        window.removeEventListener('mouseup', this._boundHandleMouseUp);
        this.canvas.removeEventListener('mousemove', this._boundHandleMouseMove);
        this.canvas.removeEventListener('mouseout', this._boundHandleMouseOut);
    }

    _handleMouseDown(event) {
        this.mousePos.down = true;
        this._updateMousePos(event);
        if (this.options.enableMouseInjection && !this.options.injectOnDrag) {
            this._injectInk(this.mousePos.x, this.mousePos.y, this.options.mouseInjectColor, this.options.mouseInjectRate, this.options.mouseInjectSize);
        }
    }
    _handleMouseUp() { this.mousePos.down = false; }
    _handleMouseOut() { this.mousePos.down = false; /* Consider if mousePos itself should be nulled */ }
    
    _updateMousePos(event) {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = event.clientX - rect.left;
        this.mousePos.y = event.clientY - rect.top;
    }

    _handleMouseMove(event) {
        this._updateMousePos(event);
        if (this.options.enableMouseInjection && this.options.injectOnDrag && this.mousePos.down) {
            this._injectInk(this.mousePos.x, this.mousePos.y, this.options.mouseInjectColor, this.options.mouseInjectRate, this.options.mouseInjectSize);
        }
    }

    _injectInk(x, y, color, count, size) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length < 1500) { // Increased cap slightly
                 const angle = Math.random() * Math.PI * 2;
                 const speed = Math.random() * 1.5 + 0.5;
                this.particles.push({
                    x: x + (Math.random() - 0.5) * 5, 
                    y: y + (Math.random() - 0.5) * 5,
                    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                    age: 0, lifespan: this.options.particleLifespan * (Math.random() * 0.4 + 0.8),
                    color: color,
                    startSize: size * (Math.random() * 0.4 + 0.8),
                    endSize: this.options.particleEndSize,
                });
            }
        }
    }

    updateInternalOptions(newOptions, isInitialSetup = false) {
        const oldNumEmitters = this.options.numEmitters;
        const oldMouseInjection = this.options.enableMouseInjection;

        this.options = { ...this.options, ...newOptions }; // Apply new options first
        this._parseColorOptions(); // Then parse/validate any color strings that might have changed

        if (isInitialSetup || (newOptions.numEmitters !== undefined && newOptions.numEmitters !== oldNumEmitters)) {
            this._initializeEmitters();
        }
        
        if (!isInitialSetup && newOptions.enableMouseInjection !== undefined && newOptions.enableMouseInjection !== oldMouseInjection) {
            if (this.options.enableMouseInjection) this._addMouseListeners();
            else this._removeMouseListeners();
        }

        // Re-initialize flow field if scale changes or on initial setup with valid canvas
        if (isInitialSetup || newOptions.flowFieldScale !== undefined || newOptions.flowFieldEvolutionSpeed !== undefined) {
             if (this.canvas && this.canvas.width > 0 && this.canvas.height > 0) {
                this._initializeFlowField(); 
             }
        }
        
        // If initial setup and canvas is ready, call resize to set everything up for current dimensions
        if (isInitialSetup && this.canvas && this.canvas.width > 0 && this.canvas.height > 0) {
             this.resize();
        }
    }

    _initializeEmitters() {
        this.emitters = [];
        if (!this.canvas || this.canvas.width === 0 || this.canvas.height === 0) return;
        for (let i = 0; i < this.options.numEmitters; i++) {
            this.emitters.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                colorIndex: i % this.options.inkColors.length,
                emitCooldown: Math.random() * 20, // Stagger initial emission
            });
        }
    }

    _initializeFlowField() {
        if (!this.canvas || this.canvas.width === 0 || this.canvas.height === 0) return;
        this.flowField.cellSize = 20; // Fixed cell size for simplicity
        this.flowField.cols = Math.floor(this.canvas.width / this.flowField.cellSize) + 1;
        this.flowField.rows = Math.floor(this.canvas.height / this.flowField.cellSize) + 1;
        this.flowField.angles = new Array(this.flowField.cols * this.flowField.rows);
        this._updateFlowFieldVectors();
    }
    
    _updateFlowFieldVectors() {
        if (!this.flowField.angles || this.flowField.cols === 0) return;
        const scale = this.options.flowFieldScale;
        const timeScaledSpeed = this.options.flowFieldEvolutionSpeed * this.internalTime;
        for (let r = 0; r < this.flowField.rows; r++) {
            for (let c = 0; c < this.flowField.cols; c++) {
                const angle1 = Math.sin(c * scale + timeScaledSpeed + r * scale * 0.3) * Math.PI;
                const angle2 = Math.cos(r * scale * 0.8 - timeScaledSpeed * 0.7 + c * scale * 0.4) * Math.PI;
                this.flowField.angles[r * this.flowField.cols + c] = (angle1 + angle2) * 0.5 + this.internalTime * 0.0001; // Slow overall rotation
            }
        }
    }

    _getFlowVector(x, y) {
        if (!this.flowField.angles || this.flowField.cols === 0 || !this.flowField.cellSize) return { x: 0, y: 0 };
        const c = Math.max(0, Math.min(this.flowField.cols - 1, Math.floor(x / this.flowField.cellSize)));
        const r = Math.max(0, Math.min(this.flowField.rows - 1, Math.floor(y / this.flowField.cellSize)));
        const angle = this.flowField.angles[r * this.flowField.cols + c] || 0;
        return { x: Math.cos(angle), y: Math.sin(angle) };
    }

    resize() {
        if (!this.canvas || this.canvas.width === 0 || this.canvas.height === 0) return;
        this._initializeFlowField();
        this._initializeEmitters(); // Re-position emitters based on new size
        if (!this.animationId) this.draw();
    }

    _parseRgba(colorString) { // Ensure this method is part of the class
        colorString = String(colorString).trim();
        if (colorString.startsWith('#')) {
            let r = 0, g = 0, b = 0;
            if (colorString.length === 4) { // #RGB
                r = parseInt(colorString[1] + colorString[1], 16);
                g = parseInt(colorString[2] + colorString[2], 16);
                b = parseInt(colorString[3] + colorString[3], 16);
            } else if (colorString.length === 7) { // #RRGGBB
                r = parseInt(colorString.substring(1, 3), 16);
                g = parseInt(colorString.substring(3, 5), 16);
                b = parseInt(colorString.substring(5, 7), 16);
            }
            return { r, g, b, a: 1 }; // Hex is always opaque in this context
        }
        
        const match = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (match) {
            return {
                r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]),
                a: match[4] !== undefined ? parseFloat(match[4]) : 1
            };
        }
        // console.warn(`FlowingInk: Could not parse color string "${colorString}", using fallback.`);
        return {r:128, g:128, b:128, a:0.5}; // Fallback: semi-transparent grey
    }

    draw() {
        if (!this.ctx || !this.canvas || this.canvas.width === 0 || this.canvas.height === 0) return;
        // For debugging, you can add this:
        // if (typeof this._parseRgba !== 'function') {
        //     console.error("CRITICAL: this._parseRgba is NOT a function in draw()!");
        //     alert("FlowingInk rendering error: _parseRgba missing. Check console.");
        //     this.stop(); return;
        // }
        this.internalTime++;

        this.ctx.globalCompositeOperation = 'source-over';
        if (this.options.useTrails && this.options.trailOpacity > 0) {
            const bgRgb = this._parseRgba(this.options.backgroundColor); // Error was here
            this.ctx.fillStyle = `rgba(${bgRgb.r},${bgRgb.g},${bgRgb.b},${this.options.trailOpacity})`;
        } else {
            this.ctx.fillStyle = this.options.backgroundColor;
        }
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.flowField.cols > 0) this._updateFlowFieldVectors();

        this.emitters.forEach(emitter => {
            emitter.emitCooldown -= this.options.emissionRate;
            while (emitter.emitCooldown <= 0) {
                emitter.emitCooldown += Math.random() * 5 + 5; // Randomized cooldown
                if (this.particles.length < 1500) {
                    const color = this.options.inkColors[emitter.colorIndex];
                    this._injectInk(emitter.x, emitter.y, color, 1, this.options.particleStartSize);
                }
            }
        });
        
        const blendMode = this.options.colorBlendingMode === 'alphaBlend' ? 'source-over' : this.options.colorBlendingMode;
        if (this.ctx.globalCompositeOperation !== blendMode) {
            this.ctx.globalCompositeOperation = blendMode;
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.age++;
            if (p.age > p.lifespan) {
                this.particles.splice(i, 1);
                continue;
            }

            const flow = this._getFlowVector(p.x, p.y);
            p.vx += flow.x * this.options.flowFieldStrength * 0.05; // Reduced strength factor slightly
            p.vy += flow.y * this.options.flowFieldStrength * 0.05;

            p.vx *= (1 - this.options.particleDrag);
            p.vy *= (1 - this.options.particleDrag);

            // Cap speed
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            const maxSpeed = 3; // Absolute max speed for particles
            if (speed > maxSpeed) {
                p.vx = (p.vx / speed) * maxSpeed;
                p.vy = (p.vy / speed) * maxSpeed;
            }

            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > this.canvas.width || p.y < 0 || p.y > this.canvas.height) {
                if (p.age > p.lifespan / 2 || this.options.numEmitters === 0 ) { // Remove if older or no emitters to respawn
                     this.particles.splice(i, 1);
                     continue;
                } else { // Nudge back if young
                    if (p.x < 0) { p.x = 1; p.vx *= -0.3; }
                    else if (p.x > this.canvas.width) { p.x = this.canvas.width-1; p.vx *= -0.3; }
                    if (p.y < 0) { p.y = 1; p.vy *= -0.3; }
                    else if (p.y > this.canvas.height) { p.y = this.canvas.height-1; p.vy *= -0.3; }
                }
            }

            const lifeRatio = p.age / p.lifespan;
            const currentSize = p.startSize + (p.endSize - p.startSize) * (lifeRatio * lifeRatio) ; // Ease-in for shrinking
            const opacity = (1 - lifeRatio);

            const particleColorRgba = this._parseRgba(p.color);
            this.ctx.fillStyle = `rgba(${particleColorRgba.r},${particleColorRgba.g},${particleColorRgba.b},${particleColorRgba.a * opacity * opacity})`; // Fade out more sharply
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, Math.max(0.1, currentSize), 0, Math.PI * 2);
            this.ctx.fill();
        }
        if (this.ctx.globalCompositeOperation !== 'source-over') { // Reset if changed
             this.ctx.globalCompositeOperation = 'source-over';
        }
    }

    start() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
         if (!this.canvas || this.canvas.width === 0 || this.canvas.height === 0) {
             console.warn("FlowingInk: Canvas not ready. Start aborted.");
             return; // Don't try to initialize if canvas isn't set up
        }
        
        // Ensure all initializations that depend on canvas size are done
        if (!this.flowField.angles || this.flowField.cols === 0) this._initializeFlowField();
        if (this.emitters.length !== this.options.numEmitters && this.options.numEmitters > 0) this._initializeEmitters();

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
        if (this.options.enableMouseInjection) this._removeMouseListeners();
        this.particles = [];
        this.emitters = [];
        this.flowField = { cols: 0, rows: 0, cellSize: 20, angles: [] };
        // console.log("FlowingInk instance destroyed");
    }
}

export default FlowingInk;