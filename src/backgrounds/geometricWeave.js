// js/backgrounds/geometricWeave.js

class GeometricWeave {
    canvas;
    ctx;
    options;

    animationId = null;
    internalTime = 0;
    grid = { cols: 0, rows: 0, tileWidth: 0, tileHeight: 0, randomPhases: [] };
    waveCenter = { x: 0, y: 0 };

    constructor(canvasElement, options = {}) {
        this.canvas = canvasElement;
        const context = this.canvas.getContext('2d');
        if (!context) {
            throw new Error("GeometricWeave: Could not get 2D rendering context.");
        }
        this.ctx = context;

        const defaultOpts = this.getDefaults();
        this.options = JSON.parse(JSON.stringify({ ...defaultOpts, ...options }));

        this.updateInternalOptions(this.options, true);
        this.draw = this.draw.bind(this);
    }

    getDefaults() {
        return {
            backgroundColor: '#1a1a1a',
            tileColor: '#4a90e2',
            tileSize: 30,
            gap: 3,
            animationStyle: 'wave',
            animationSpeed: 0.03,
            waveMovementSpeed: 2.0,
            maxOpacity: 0.9,
            tileShape: 'square',
            useRotation: false,
            rotationSpeedFactor: 0.5
        };
    }

    updateInternalOptions(newOptions, isInitialSetup = false) {
        const oldTileSize = this.options.tileSize;
        const oldGap = this.options.gap;

        this.options = { ...this.options, ...newOptions };

        if (isInitialSetup || 
            (newOptions.tileSize !== undefined && newOptions.tileSize !== oldTileSize) ||
            (newOptions.gap !== undefined && newOptions.gap !== oldGap)
        ) {
            if (this.canvas.width > 0 && this.canvas.height > 0) {
                this.resize(); // Recalculate grid
            }
        }
        
        if (isInitialSetup && this.canvas.width > 0 && this.canvas.height > 0) {
             this.resize();
        }
    }

    resize() {
        if (!this.canvas || this.canvas.width === 0 || this.canvas.height === 0 || this.options.tileSize <= 0) {
            this.grid = { cols: 0, rows: 0, tileWidth: 0, tileHeight: 0, randomPhases: [] };
            if (this.ctx && !this.animationId) this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
            return;
        }

        this.grid.tileWidth = this.options.tileSize + this.options.gap;
        this.grid.tileHeight = this.options.tileSize + this.options.gap;

        this.grid.cols = Math.ceil(this.canvas.width / this.grid.tileWidth) + 1; // +1 for smoother edges when animating
        this.grid.rows = Math.ceil(this.canvas.height / this.grid.tileHeight) + 1;

        this.waveCenter.x = this.canvas.width / 2;
        this.waveCenter.y = this.canvas.height / 2;

        // Initialize random phases for 'random' animation style
        this.grid.randomPhases = [];
        for (let i = 0; i < this.grid.cols * this.grid.rows; i++) {
            this.grid.randomPhases.push(Math.random() * Math.PI * 2); // Random offset for sine wave
        }

        if (!this.animationId) this.draw();
    }
    
    _getTileAnimationValue(col, row) {
        let rawValue = 0;
        const minOpacity = this.options.maxOpacity * 0.1; // Tiles fade to 10% of maxOpacity

        switch (this.options.animationStyle) {
            case 'pulse':
                rawValue = (Math.sin(this.internalTime * this.options.animationSpeed) + 1) / 2; // 0 to 1
                break;
            case 'wave':
                const x = col * this.grid.tileWidth + this.options.tileSize / 2;
                const y = row * this.grid.tileHeight + this.options.tileSize / 2;
                const dist = Math.sqrt(Math.pow(x - this.waveCenter.x, 2) + Math.pow(y - this.waveCenter.y, 2));
                // Wave travels outwards. Adjust dist factor for visual scaling of wave.
                const waveFactor = 0.02; 
                rawValue = (Math.sin(dist * waveFactor - this.internalTime * this.options.waveMovementSpeed) + 1) / 2; // 0 to 1
                break;
            case 'random':
                const phaseIndex = row * this.grid.cols + col;
                const phase = this.grid.randomPhases[phaseIndex] || 0;
                rawValue = (Math.sin(this.internalTime * this.options.animationSpeed + phase) + 1) / 2; // 0 to 1
                break;
            default:
                rawValue = 1; // Default to fully visible if style is unknown
        }
        return minOpacity + rawValue * (this.options.maxOpacity - minOpacity);
    }


    draw() {
        if (!this.ctx || !this.canvas || this.canvas.width === 0 || this.canvas.height === 0 || this.grid.cols === 0) {
            if(this.ctx && this.canvas) this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
            return;
        }
        this.internalTime++;

        this.ctx.fillStyle = this.options.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let r = 0; r < this.grid.rows; r++) {
            for (let c = 0; c < this.grid.cols; c++) {
                const x = c * this.grid.tileWidth;
                const y = r * this.grid.tileHeight;
                
                const animationValue = this._getTileAnimationValue(c, r); // This is primarily opacity
                this.ctx.globalAlpha = animationValue;
                this.ctx.fillStyle = this.options.tileColor;

                this.ctx.save();
                // Center of the tile for rotation
                const tileCenterX = x + this.options.tileSize / 2;
                const tileCenterY = y + this.options.tileSize / 2;
                this.ctx.translate(tileCenterX, tileCenterY);

                if (this.options.useRotation) {
                    let rotationAngle = 0;
                    const rotationSpeed = this.options.animationSpeed * this.options.rotationSpeedFactor;
                    // Vary rotation based on style or position for more dynamic look
                    if (this.options.animationStyle === 'wave') {
                        rotationAngle = animationValue * Math.PI * 0.1 * (Math.sin(this.internalTime * rotationSpeed + c * 0.1 - r * 0.1)); 
                    } else {
                         rotationAngle = Math.sin(this.internalTime * rotationSpeed + (c * 0.2) + (r * 0.3)) * Math.PI * 0.05; // Max 9 deg rotation
                    }
                    this.ctx.rotate(rotationAngle);
                }
                
                // Draw shape centered
                if (this.options.tileShape === 'square') {
                    this.ctx.fillRect(-this.options.tileSize / 2, -this.options.tileSize / 2, this.options.tileSize, this.options.tileSize);
                } else if (this.options.tileShape === 'circle') {
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, this.options.tileSize / 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                this.ctx.restore();
            }
        }
        this.ctx.globalAlpha = 1; // Reset global alpha
    }

    start() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (!this.canvas || this.canvas.width === 0 || this.canvas.height === 0) {
             console.warn("GeometricWeave: Canvas not ready. Start aborted.");
             if (this.grid.cols === 0 && this.canvas.width > 0 && this.canvas.height > 0) this.resize();
             return;
        }
        if (this.grid.cols === 0) this.resize(); // Ensure grid is initialized

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
        this.grid.randomPhases = [];
        // console.log("GeometricWeave instance destroyed");
    }
}

export default GeometricWeave;