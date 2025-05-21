// js/backgrounds/cosmicPulsar.js

class CosmicPulsar {
    canvas;
    ctx;
    options;
    // originalOptions; // Kept for reference if complex defaults logic was needed

    stars = [];
    gasClouds = [];
    pulsar = { x: 0, y: 0, time: 0 }; // Pulsar's animation time, x/y set in resize/start
    animationId = null;
    // internalTime = 0; // General time for slow evolution of clouds - integrated into draw logic

    constructor(canvasElement, options = {}) {
        this.canvas = canvasElement;
        const context = this.canvas.getContext('2d');
        if (!context) {
            throw new Error("CosmicPulsar: Could not get 2D rendering context.");
        }
        this.ctx = context;

        // Deep copy options to avoid modifying defaults or shared objects if re-instantiated
        const defaultOpts = this.getDefaults();
        this.options = JSON.parse(JSON.stringify({ ...defaultOpts, ...options }));

        this._parseAndValidateOptions();
        this.updateInternalOptions(this.options, true); // Initial setup based on options

        this.draw = this.draw.bind(this);
    }

    getDefaults() {
        return {
            backgroundColor: '#000010',
            nebulaColors: '#0a0a23,#2a0045,#400030',
            cloudCount: 6,
            cloudSizeFactor: 0.7,
            cloudOpacity: 0.08,
            cloudDriftSpeed: 0.04,
            pulsarEnabled: true,
            pulsarColor: 'rgba(220, 200, 255, 0.4)',
            pulseSpeed: 0.006,
            pulseIntensity: 0.7,
            pulseRadiusFactor: 0.5,
            starCount: 100,
            starColor: 'rgba(255, 255, 255, 0.6)',
        };
    }

    _parseAndValidateOptions() {
        // Ensure nebulaColors is an array of valid hex strings
        if (typeof this.options.nebulaColors === 'string') {
            this.options.nebulaColors = this.options.nebulaColors.split(',')
                .map(s => s.trim().toLowerCase())
                .filter(s => s.match(/^#([0-9a-f]{3}){1,2}$/i));
        }
        if (!Array.isArray(this.options.nebulaColors) || this.options.nebulaColors.length === 0) {
            console.warn("CosmicPulsar: Invalid nebulaColors, using default.");
            this.options.nebulaColors = this.getDefaults().nebulaColors.split(','); // Ensure default is array
        }

        // Ensure pulsarColor and starColor are valid rgba strings or hex for parsing later
        if (typeof this.options.pulsarColor !== 'string' || !(this.options.pulsarColor.startsWith('rgba') || this.options.pulsarColor.startsWith('#'))) {
            this.options.pulsarColor = this.getDefaults().pulsarColor;
        }
        if (typeof this.options.starColor !== 'string' || !(this.options.starColor.startsWith('rgba') || this.options.starColor.startsWith('#'))) {
            this.options.starColor = this.getDefaults().starColor;
        }
    }

    updateInternalOptions(newOptions, isInitialSetup = false) {
        const oldStarCount = this.options.starCount;
        const oldCloudCount = this.options.cloudCount;

        this.options = { ...this.options, ...newOptions };
        this._parseAndValidateOptions();

        if (isInitialSetup || (newOptions.starCount !== undefined && newOptions.starCount !== oldStarCount)) {
            this._initializeStars();
        }
        if (isInitialSetup || (newOptions.cloudCount !== undefined && newOptions.cloudCount !== oldCloudCount)) {
            this._initializeGasClouds();
        }
        
        if (this.canvas && this.canvas.width > 0) { // Pulsar always center
            this.pulsar.x = this.canvas.width / 2;
            this.pulsar.y = this.canvas.height / 2;
        }

        if (isInitialSetup && this.canvas && this.canvas.width > 0 && this.canvas.height > 0) {
            this.resize(); 
        }
    }

    _initializeStars() {
        this.stars = [];
        if (!this.canvas || this.canvas.width === 0 || this.canvas.height === 0 || this.options.starCount === 0) return;
        for (let i = 0; i < this.options.starCount; i++) {
            this.stars.push(this._createStarAtRandomPosition());
        }
    }

    _createStarAtRandomPosition() {
        return this._createStar(Math.random() * this.canvas.width, Math.random() * this.canvas.height);
    }
    
    _createStar(x, y) {
        // Internal fixed ranges for variation
        const baseSpeed = 0.15; 
        const baseSize = 1.0; 

        const size = (Math.random() * 0.8 + 0.4) * baseSize; // e.g., 0.4 to 1.2
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 0.7 + 0.3) * baseSpeed; // e.g., 0.3 to 1.0 of baseSpeed
        return {
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.max(0.2, size), // Ensure min size
            opacity: Math.random() * 0.5 + 0.3, 
        };
    }
    
    _initializeGasClouds() {
        this.gasClouds = [];
        if (!this.canvas || this.canvas.width === 0 || this.canvas.height === 0 || this.options.cloudCount === 0) return;
        const minCanvasDim = Math.min(this.canvas.width, this.canvas.height);

        for (let i = 0; i < this.options.cloudCount; i++) {
            const baseRadius = this.options.cloudSizeFactor * minCanvasDim;
            this.gasClouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                // Radius with internal variation around the cloudSizeFactor
                radius: Math.max(minCanvasDim * 0.1, (Math.random() * 0.6 + 0.7) * baseRadius), // e.g., 70%-130% of calculated base
                color: this.options.nebulaColors[Math.floor(Math.random() * this.options.nebulaColors.length)],
                // Opacity with internal variation around the cloudOpacity option
                opacity: Math.max(0.01, (Math.random() * 0.5 + 0.75) * this.options.cloudOpacity), // e.g., 75%-125% of option
                vx: (Math.random() - 0.5) * this.options.cloudDriftSpeed * 0.2, // Slowed down drift
                vy: (Math.random() - 0.5) * this.options.cloudDriftSpeed * 0.2,
            });
        }
    }

    resize() {
        if (!this.canvas || this.canvas.width === 0 || this.canvas.height === 0) return;
        
        this.pulsar.x = this.canvas.width / 2; // Always center
        this.pulsar.y = this.canvas.height / 2;
        
        const minCanvasDim = Math.min(this.canvas.width, this.canvas.height);
        const baseCloudRadius = this.options.cloudSizeFactor * minCanvasDim;
        this.gasClouds.forEach(cloud => {
             cloud.radius = Math.max(minCanvasDim * 0.1, (Math.random() * 0.6 + 0.7) * baseCloudRadius);
        });

        if (!this.animationId) this.draw();
    }
    
    _hexToRgb(hex) {
        let r = 0, g = 0, b = 0;
        hex = String(hex).trim();
        if (hex.startsWith('#')) hex = hex.substring(1);

        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16); g = parseInt(hex[1] + hex[1], 16); b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16); g = parseInt(hex.substring(2, 4), 16); b = parseInt(hex.substring(4, 6), 16);
        }
        return { r, g, b, a: 1 };
    }

    _parseRgba(colorString) {
        colorString = String(colorString).trim();
        if (colorString.startsWith('#')) return this._hexToRgb(colorString);
        
        const match = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (match) {
            return {
                r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]),
                a: match[4] !== undefined ? parseFloat(match[4]) : 1
            };
        }
        return {r:255, g:255, b:255, a:0.1}; // Fallback
    }

    draw() {
        if (!this.ctx || !this.canvas || this.canvas.width === 0 || this.canvas.height === 0) return;

        this.ctx.fillStyle = this.options.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.globalCompositeOperation = 'lighter';
        this.gasClouds.forEach(cloud => {
            cloud.x += cloud.vx; cloud.y += cloud.vy;
            if (cloud.x - cloud.radius > this.canvas.width) cloud.x = -cloud.radius +1;
            else if (cloud.x + cloud.radius < 0) cloud.x = this.canvas.width + cloud.radius -1;
            if (cloud.y - cloud.radius > this.canvas.height) cloud.y = -cloud.radius +1;
            else if (cloud.y + cloud.radius < 0) cloud.y = this.canvas.height + cloud.radius -1;
            
            const cloudRgb = this._hexToRgb(cloud.color);
            const gradient = this.ctx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.radius);
            gradient.addColorStop(0, `rgba(${cloudRgb.r},${cloudRgb.g},${cloudRgb.b},${cloud.opacity * 0.6})`);
            gradient.addColorStop(0.6, `rgba(${cloudRgb.r},${cloudRgb.g},${cloudRgb.b},${cloud.opacity * 0.2})`);
            gradient.addColorStop(1, `rgba(${cloudRgb.r},${cloudRgb.g},${cloudRgb.b},0)`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath(); this.ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2); this.ctx.fill();
        });
        this.ctx.globalCompositeOperation = 'source-over';

        if (this.options.pulsarEnabled) {
            this.pulsar.time += this.options.pulseSpeed;
            const pulseCycle = (Math.sin(this.pulsar.time) + 1) / 2; 
            // Min intensity for pulse is a fraction of max, or a small fixed value
            const minPulseActualIntensity = Math.min(this.options.pulseIntensity * 0.2, 0.1); 
            const currentActualPulseIntensity = minPulseActualIntensity + pulseCycle * (this.options.pulseIntensity - minPulseActualIntensity);
            
            const minCanvasDim = Math.min(this.canvas.width, this.canvas.height);
            const currentPulseRadius = currentActualPulseIntensity * minCanvasDim * this.options.pulseRadiusFactor;

            if (currentPulseRadius > 1) {
                const pulsarCoreRgba = this._parseRgba(this.options.pulsarColor);
                const pulsarGradient = this.ctx.createRadialGradient(this.pulsar.x, this.pulsar.y, 0, this.pulsar.x, this.pulsar.y, currentPulseRadius);
                
                pulsarGradient.addColorStop(0, `rgba(${pulsarCoreRgba.r},${pulsarCoreRgba.g},${pulsarCoreRgba.b},${pulsarCoreRgba.a * currentActualPulseIntensity})`);
                pulsarGradient.addColorStop(0.3, `rgba(${pulsarCoreRgba.r},${pulsarCoreRgba.g},${pulsarCoreRgba.b},${pulsarCoreRgba.a * currentActualPulseIntensity * 0.5})`);
                pulsarGradient.addColorStop(1, `rgba(${pulsarCoreRgba.r},${pulsarCoreRgba.g},${pulsarCoreRgba.b},0)`);

                this.ctx.fillStyle = pulsarGradient;
                this.ctx.beginPath(); this.ctx.arc(this.pulsar.x, this.pulsar.y, currentPulseRadius, 0, Math.PI * 2); this.ctx.fill();
            }
        }
        
        const starBaseRgba = this._parseRgba(this.options.starColor);
        this.stars.forEach(star => {
            star.x += star.vx; star.y += star.vy;
            if (star.vx > 0 && star.x - star.size > this.canvas.width) star.x = -star.size;
            else if (star.vx < 0 && star.x + star.size < 0) star.x = this.canvas.width + star.size;
            if (star.vy > 0 && star.y - star.size > this.canvas.height) star.y = -star.size;
            else if (star.vy < 0 && star.y + star.size < 0) star.y = this.canvas.height + star.size;
            
            this.ctx.fillStyle = `rgba(${starBaseRgba.r},${starBaseRgba.g},${starBaseRgba.b},${star.opacity * starBaseRgba.a})`;
            this.ctx.beginPath(); this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2); this.ctx.fill();
        });
    }

    start() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (!this.canvas || this.canvas.width === 0 || this.canvas.height === 0) {
             console.warn("CosmicPulsar: Canvas not ready. Start aborted.");
             return;
        }
        
        this.pulsar.x = this.canvas.width / 2; // Ensure pulsar is centered
        this.pulsar.y = this.canvas.height / 2;

        if(this.stars.length !== this.options.starCount && this.options.starCount > 0) this._initializeStars();
        if(this.gasClouds.length !== this.options.cloudCount && this.options.cloudCount > 0) this._initializeGasClouds();

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
        this.stars = [];
        this.gasClouds = [];
        // console.log("CosmicPulsar instance destroyed");
    }
}

export default CosmicPulsar;