// js/backgroundManifest.js
/**
 * @file BackgroundManifest.js
 * @description Defines a registry of available background effects for the BackgroundCraft application.
 * Each entry in the registry provides metadata and configuration for a specific background effect,
 * including its display name, class reference, default options, and UI schema for customization.
 */

// Import statements for each background effect class.
// Ensure paths are correct relative to this file's location.
import DigitalRain from './backgrounds/digitalRain.js';
import FloatingBubbles from './backgrounds/floatingBubbles.js';
import Starfield from './backgrounds/starfield.js';
import ColorShiftGradient from './backgrounds/colorShiftGradient.js';
import CosmicPulsar from './backgrounds/cosmicPulsar.js';
import GeometricWeave from './backgrounds/geometricWeave.js';
import FireflySwarm from './backgrounds/fireflySwarm.js';
import AuroraBorealis from './backgrounds/auroraBorealis.js';
import FlowingInk from './backgrounds/flowingInk.js';

/**
 * @typedef {Object} BackgroundRegistryEntry
 * @property {string} name - The user-friendly display name of the background effect.
 * @property {string} className - The string name of the background effect's class (e.g., "DigitalRain").
 * @property {Function} classRef - A direct reference to the constructor of the background effect's class.
 * @property {Object} defaults - An object containing the default configuration options for this effect.
 * These values are used when the effect is first selected or when options are reset.
 * @property {Array<ControlSchemaItem>} schema - An array of objects defining the UI controls for customizing
 * the effect's options. Each object describes a single control
 * (e.g., its key, label, type, and other properties like min/max/step).
 */

/**
 * @typedef {Object} ControlSchemaItem
 * @property {string} key - The key (property name) in the effect's options object that this control modifies.
 * @property {string} label - The user-friendly label displayed for this control in the UI.
 * @property {('number'|'text'|'color'|'boolean'|'select')} type - The type of HTML input element to generate.
 * @property {number} [min] - For 'number' type: the minimum allowed value.
 * @property {number} [max] - For 'number' type: the maximum allowed value.
 * @property {number} [step] - For 'number' type: the stepping interval.
 * @property {string} [placeholder] - For 'text' type: placeholder text for the input.
 * @property {Array<{value: string, label: string}>} [options] - For 'select' type: an array of option objects.
 * @property {string} [tooltip] - A short descriptive text displayed as a tooltip for the control.
 * @property {boolean} [requiresRestart] - If true, changing this option will cause the background effect to be fully re-initialized.
 * @property {boolean} [requiresResize] - If true, changing this option might require a resize operation on the effect.
 * @property {string} [default] - A default value for the input, typically used if `currentOptions[key]` is undefined.
 * @property {number} [debounce] - For some input types, a debounce time in milliseconds before updating the option.
 */

/**
 * An array of {@link BackgroundRegistryEntry} objects.
 * This registry is used by `BackgroundBuilder` to populate the list of available
 * background effects and to manage their instantiation and control rendering.
 * @type {Array<BackgroundRegistryEntry>}
 */
const backgroundRegistry = [
    {
        name: 'Digital Rain',
        className: 'DigitalRain',
        classRef: DigitalRain, // Reference to the imported DigitalRain class.
        defaults: { // Default options for Digital Rain.
            fontSize: 18,
            fontFamily: 'VT323, monospace',
            chars: "0123456789ABCDEFﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍｦｲｸｺｿﾁﾄﾉﾌﾔﾖﾙﾚﾛﾝ",
            isDarkThemePreview: true,
            fontColorDark: "#00FF00",
            trailColorDark: "rgba(0, 5, 0, 0.05)",
            glowColorDark: "#00FF00",
            fontColorLight: "#006400",
            trailColorLight: "rgba(230, 245, 230, 0.08)",
            glowColorLight: "#008F00",
        },
        schema: [ // UI schema for Digital Rain options.
            { key: 'fontSize', label: 'Font Size (px)', type: 'number', min: 6, max: 48, step: 1, requiresResize: true, debounce: 300 },
            { key: 'fontFamily', label: 'Font Family', type: 'text', default: 'VT323, monospace' },
            { key: 'chars', label: 'Character Set', type: 'text' },
            { key: 'isDarkThemePreview', label: 'Preview Dark Theme Mode', type: 'boolean' },
            { key: 'fontColorDark', label: 'Font Color (Dark)', type: 'color' },
            { key: 'trailColorDark', label: 'Trail Color (Dark Theme)', type: 'text', placeholder: 'rgba(0,5,0,0.05)' },
            { key: 'glowColorDark', label: 'Glow Color (Dark)', type: 'color' },
            { key: 'fontColorLight', label: 'Font Color (Light)', type: 'color' },
            { key: 'trailColorLight', label: 'Trail Color (Light Theme)', type: 'text', placeholder: 'rgba(230,245,230,0.08)' },
            { key: 'glowColorLight', label: 'Glow Color (Light)', type: 'color' },
        ],
    },
    {
        name: 'Floating Bubbles',
        className: 'FloatingBubbles',
        classRef: FloatingBubbles, // Reference to the imported FloatingBubbles class.
        defaults: { // Default options for Floating Bubbles.
            bubbleCount: 50,
            minSize: 5,
            maxSize: 25,
            minSpeed: 0.2,
            maxSpeed: 1.0,
            colors: ["rgba(255,255,255,0.1)", "rgba(173,216,230,0.15)", "rgba(144,238,144,0.12)"],
            spawnRate: 0.5
        },
        schema: [ // UI schema for Floating Bubbles options.
            { key: 'bubbleCount', label: 'Bubble Count', type: 'number', min: 10, max: 300, step: 5, requiresRestart: true, debounce: 500 },
            { key: 'minSize', label: 'Min Bubble Size (px)', type: 'number', min: 1, max: 50, step: 1 },
            { key: 'maxSize', label: 'Max Bubble Size (px)', type: 'number', min: 1, max: 100, step: 1 },
            { key: 'minSpeed', label: 'Min Speed', type: 'number', min: 0.1, max: 5, step: 0.1 },
            { key: 'maxSpeed', label: 'Max Speed', type: 'number', min: 0.1, max: 10, step: 0.1 },
            { key: 'colors', label: 'Bubble Colors (comma-sep, e.g., rgba(255,255,255,0.1),#ADD8E6)', type: 'text', tooltip: 'Enter valid CSS colors, separated by commas.' },
            { key: 'spawnRate', label: 'Spawn Rate (approx. per sec)', type: 'number', min: 0.1, max: 10, step: 0.1, tooltip: 'Approximate number of new bubbles spawned per second.' }
        ],
    },
    {
        name: 'Starfield',
        className: 'Starfield',
        classRef: Starfield, // Reference to the imported Starfield class.
        defaults: { // Default options for Starfield.
            starCount: 300,
            minStarSize: 0.5,
            maxStarSize: 2.5,
            baseSpeed: 0.5,
            starColor: "rgba(255, 255, 255, 0.8)",
            backgroundColor: "#000000",
            warpEffect: true,
            warpStrength: 50
        },
        schema: [ // UI schema for Starfield options.
            { key: 'starCount', label: 'Star Count', type: 'number', min: 50, max: 2000, step: 50, requiresRestart: true, debounce: 500 },
            { key: 'minStarSize', label: 'Min Star Size (px)', type: 'number', min: 0.1, max: 5, step: 0.1 },
            { key: 'maxStarSize', label: 'Max Star Size (px)', type: 'number', min: 0.5, max: 10, step: 0.1 },
            { key: 'baseSpeed', label: 'Base Speed', type: 'number', min: 0.05, max: 5, step: 0.05 },
            { key: 'starColor', label: 'Star Color', type: 'text', placeholder: 'rgba(255,255,255,0.8)' },
            { key: 'backgroundColor', label: 'Background Color', type: 'color' },
            { key: 'warpEffect', label: 'Warp Effect (from center)', type: 'boolean' },
            { key: 'warpStrength', label: 'Warp Strength (if warp)', type: 'number', min: 10, max: 300, step: 5, tooltip: 'Higher values create a more pronounced perspective effect from the center.' }
        ],
    },
    {
        name: 'Color Shift Gradient',
        className: 'ColorShiftGradient',
        classRef: ColorShiftGradient, // Reference to the imported ColorShiftGradient class.
        defaults: { // Default options for Color Shift Gradient.
            colors: ["#FFB6C1", "#FFDAB9", "#E6E6FA", "#B0E0E6"],
            speed: 0.0005,
            angle: 45,
            type: 'linear'
        },
        schema: [ // UI schema for Color Shift Gradient options.
            { key: 'colors', label: 'Gradient Colors (comma-sep hex/rgba)', type: 'text', tooltip: 'Enter valid CSS colors (hex, rgb, rgba), separated by commas. At least 2 are needed.' },
            { key: 'speed', label: 'Shift Speed', type: 'number', min: 0.00001, max: 0.01, step: 0.00001, tooltip: 'Controls how fast the colors transition.' },
            { key: 'angle', label: 'Angle (degrees, for linear)', type: 'number', min: 0, max: 360, step: 1 },
            {
                key: 'type', label: 'Gradient Type', type: 'select', options: [
                    { value: 'linear', label: 'Linear' },
                    { value: 'radial', label: 'Radial' }
                ]
            }
        ],
    },
    {
        name: 'Cosmic Pulsar',
        className: 'CosmicPulsar',
        classRef: CosmicPulsar, // Reference to the imported CosmicPulsar class.
        defaults: { // Default options for Cosmic Pulsar.
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
        },
        schema: [ // UI schema for Cosmic Pulsar options.
            { key: 'backgroundColor', label: 'Background Color', type: 'color' },
            { key: 'nebulaColors', label: 'Nebula Colors (comma-sep hex)', type: 'text', tooltip: 'E.g., #0a0a23,#2a0045,#400030' },
            { key: 'cloudCount', label: 'Gas Cloud Count', type: 'number', min: 1, max: 15, step: 1 },
            { key: 'cloudSizeFactor', label: 'Cloud Size Factor', type: 'number', min: 0.1, max: 1.5, step: 0.05, tooltip: 'Relative to canvas size' },
            { key: 'cloudOpacity', label: 'Cloud Opacity', type: 'number', min: 0.01, max: 0.3, step: 0.01 },
            { key: 'cloudDriftSpeed', label: 'Cloud Drift Speed', type: 'number', min: 0, max: 0.2, step: 0.01 },
            { key: 'pulsarEnabled', label: 'Enable Pulsar', type: 'boolean' },
            { key: 'pulsarColor', label: 'Pulsar Color', type: 'text', placeholder: 'rgba(220,200,255,0.4)' },
            { key: 'pulseSpeed', label: 'Pulse Speed', type: 'number', min: 0.0005, max: 0.02, step: 0.0005 },
            { key: 'pulseIntensity', label: 'Pulse Intensity', type: 'number', min: 0.1, max: 1.0, step: 0.05, tooltip: 'Max strength of pulse' },
            { key: 'pulseRadiusFactor', label: 'Pulse Radius Factor', type: 'number', min: 0.1, max: 1.0, step: 0.05, tooltip: 'Relative to canvas size' },
            { key: 'starCount', label: 'Star Count', type: 'number', min: 0, max: 300, step: 10, requiresRestart: true },
            { key: 'starColor', label: 'Star Color', type: 'text', placeholder: 'rgba(255,255,255,0.6)' },
        ]
    },
    {
        name: 'Geometric Weave',
        className: 'GeometricWeave',
        classRef: GeometricWeave, // Reference to the imported GeometricWeave class.
        defaults: { // Default options for Geometric Weave.
            backgroundColor: '#1a1a1a',
            tileColor: '#4a90e2',
            tileSize: 30,
            gap: 3,
            animationStyle: 'random',
            animationSpeed: 0.03,
            waveMovementSpeed: 2.0,
            maxOpacity: 0.9,
            tileShape: 'square',
            useRotation: false,
            rotationSpeedFactor: 0.5
        },
        schema: [ // UI schema for Geometric Weave options.
            { key: 'backgroundColor', label: 'Background Color', type: 'color' },
            { key: 'tileColor', label: 'Tile Color', type: 'color' },
            { key: 'tileSize', label: 'Tile Size (px)', type: 'number', min: 10, max: 150, step: 1, requiresRestart: true },
            { key: 'gap', label: 'Gap Between Tiles (px)', type: 'number', min: 0, max: 30, step: 1, requiresRestart: true },
            {
                key: 'animationStyle', label: 'Animation Style', type: 'select', options: [
                    { value: 'pulse', label: 'Pulse All Together' },
                    { value: 'wave', label: 'Wave from Center' },
                    { value: 'random', label: 'Randomized Pulse' }
                ]
            },
            { key: 'animationSpeed', label: 'Animation Cycle Speed', type: 'number', min: 0.001, max: 0.1, step: 0.001 },
            { key: 'waveMovementSpeed', label: 'Wave Propagation Speed', type: 'number', min: 0.1, max: 10, step: 0.1, tooltip: "For 'Wave' style only." },
            { key: 'maxOpacity', label: 'Max Tile Opacity', type: 'number', min: 0.1, max: 1, step: 0.05 },
            {
                key: 'tileShape', label: 'Tile Shape', type: 'select', options: [
                    { value: 'square', label: 'Square' },
                    { value: 'circle', label: 'Circle' }
                ]
            },
            { key: 'useRotation', label: 'Enable Tile Rotation', type: 'boolean' },
            { key: 'rotationSpeedFactor', label: 'Rotation Speed Factor', type: 'number', min: 0.1, max: 2.0, step: 0.1, tooltip: "Multiplier for rotation relative to animation speed. Active if rotation is enabled." }
        ]
    },
    {
        name: 'Firefly Swarm',
        className: 'FireflySwarm',
        classRef: FireflySwarm, // Reference to the imported FireflySwarm class.
        defaults: { // Default options for Firefly Swarm.
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
        },
        schema: [ // UI schema for Firefly Swarm options.
            { key: 'backgroundColor', label: 'Background Color', type: 'color' },
            { key: 'fireflyColor', label: 'Firefly Color (rgba recommended)', type: 'text', placeholder: 'rgba(180,255,150,0.7)' },
            { key: 'fireflyCount', label: 'Firefly Count', type: 'number', min: 5, max: 250, step: 5, requiresRestart: true },
            { key: 'fireflyBaseSize', label: 'Base Size (px radius)', type: 'number', min: 0.5, max: 5, step: 0.1, tooltip: "Actual size will vary slightly around this." },
            { key: 'fireflyBaseSpeed', label: 'Base Speed', type: 'number', min: 0.05, max: 2, step: 0.05, tooltip: "Actual speed will vary slightly." },
            { key: 'glowIntensity', label: 'Glow Intensity (blur)', type: 'number', min: 0, max: 40, step: 1 },
            { key: 'trailAmount', label: 'Trail Effect Strength', type: 'number', min: 0, max: 0.5, step: 0.01, tooltip: '0=No Trails (full clear). Higher = stronger trails (alpha of background redraw).' },
            { key: 'mouseInteraction', label: 'Enable Mouse Interaction', type: 'boolean' },
            {
                key: 'interactionType', label: 'Mouse Interaction Type', type: 'select', options: [
                    { value: 'repel', label: 'Repel' },
                    { value: 'attract', label: 'Attract' }
                ], tooltip: "Active if mouse interaction is enabled."
            },
            { key: 'interactionStrength', label: 'Mouse Interaction Strength', type: 'number', min: 0.1, max: 5, step: 0.1 },
            { key: 'mouseInfluenceRadius', label: 'Mouse Influence Radius (px)', type: 'number', min: 30, max: 400, step: 10 }
        ]
    },
    {

        name: 'Aurora Borealis',
        className: 'AuroraBorealis',
        classRef: AuroraBorealis,
        defaults: {
            backgroundColor: '#01000D', // Very dark, near black, slightly blue
            auroraColors: 'rgba(0,230,120,0.15),rgba(100,80,255,0.1),rgba(220,80,200,0.12)', // Greens, purples, pinks with low alpha
            numCurtains: 4,             // Number of layered aurora bands
            curtainAnchorYFactor: 0.1,  // Where the curtains are 'anchored' at the top (0.0 = very top, 0.3 = lower)
            curtainMaxReachFactor: 0.7, // How far down the canvas they can reach (0.2 = short, 0.9 = almost full)
            swaySpeed: 0.004,           // Speed of the side-to-side waving motion
            driftSpeed: 0.0015,         // Speed of overall pattern evolution/drift
            complexity: 4,              // Number of sine waves summed for shape (2-8 recommended)
            baseIntensity: 0.6,         // Overall max opacity/brightness multiplier
            shimmerSpeed: 0.015         // Speed of brightness/opacity variations (shimmering)
        },
        schema: [
            { key: 'backgroundColor', label: 'Night Sky Color', type: 'color' },
            { key: 'auroraColors', label: 'Aurora Colors (comma-sep rgba)', type: 'text', tooltip: 'E.g., rgba(0,230,120,0.15),rgba(100,80,255,0.1)' },
            { key: 'numCurtains', label: 'Number of Curtains', type: 'number', min: 1, max: 8, step: 1, requiresRestart: true },
            { key: 'curtainAnchorYFactor', label: 'Curtain Anchor Y (%)', type: 'number', min: 0.0, max: 0.5, step: 0.01, tooltip: 'Vertical start position from top (0-50%).' },
            { key: 'curtainMaxReachFactor', label: 'Curtain Max Reach (%)', type: 'number', min: 0.2, max: 1.0, step: 0.05, tooltip: 'How far down they extend (20-100%).' },
            { key: 'swaySpeed', label: 'Sway Speed', type: 'number', min: 0.0001, max: 0.02, step: 0.0001 },
            { key: 'driftSpeed', label: 'Pattern Drift Speed', type: 'number', min: 0.0001, max: 0.01, step: 0.0001 },
            { key: 'complexity', label: 'Shape Complexity', type: 'number', min: 1, max: 10, step: 1, tooltip: 'Higher = more detailed waves. (1-10)', requiresRestart: true },
            { key: 'baseIntensity', label: 'Base Intensity', type: 'number', min: 0.1, max: 1.0, step: 0.05, tooltip: "Overall brightness multiplier." },
            { key: 'shimmerSpeed', label: 'Shimmer Speed', type: 'number', min: 0.001, max: 0.05, step: 0.001, tooltip: "Speed of light intensity fluctuations." }
        ]
    }
    ,
    {
        name: 'Flowing Ink',
        className: 'FlowingInk',
        classRef: FlowingInk, // Reference to the imported FlowingInk class.
        defaults: { // Default options for Flowing Ink.
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
        },
        schema: [ // UI schema for Flowing Ink options.
            { key: 'backgroundColor', label: 'Background Color', type: 'color' },
            { key: 'inkColors', label: 'Emitter Ink Colors (comma-sep rgba)', type: 'text', tooltip: 'E.g., rgba(255,0,0,0.5),#00FF00' },
            { key: 'numEmitters', label: 'Ink Emitters', type: 'number', min: 0, max: 10, step: 1, requiresRestart: true },
            { key: 'emissionRate', label: 'Emission Rate (per emitter/frame)', type: 'number', min: 0, max: 20, step: 1 },
            { key: 'particleLifespan', label: 'Particle Lifespan (frames)', type: 'number', min: 30, max: 600, step: 10 },
            { key: 'particleStartSize', label: 'Particle Start Size (px)', type: 'number', min: 1, max: 60, step: 1 },
            { key: 'particleEndSize', label: 'Particle End Size (px)', type: 'number', min: 0, max: 30, step: 1 },
            { key: 'flowFieldStrength', label: 'Flow Field Strength', type: 'number', min: 0, max: 3, step: 0.05 },
            { key: 'flowFieldScale', label: 'Flow Field Scale', type: 'number', min: 0.001, max: 0.1, step: 0.001, tooltip: "Detail of flow patterns" },
            { key: 'flowFieldEvolutionSpeed', label: 'Flow Field Evolution', type: 'number', min: 0, max: 0.01, step: 0.0002 },
            { key: 'particleDrag', label: 'Particle Drag (Viscosity)', type: 'number', min: 0, max: 0.1, step: 0.002 },
            {
                key: 'colorBlendingMode', label: 'Color Blending Mode', type: 'select', options: [
                    { value: 'alphaBlend', label: 'Alpha Blend (Normal)' }, { value: 'lighter', label: 'Additive (Lighter)' },
                    { value: 'screen', label: 'Screen' }, { value: 'multiply', label: 'Multiply (Darker)' }
                ]
            },
            { key: 'useTrails', label: 'Enable Fading Trails', type: 'boolean' },
            { key: 'trailOpacity', label: 'Trail BG Opacity', type: 'number', min: 0.01, max: 0.5, step: 0.01, tooltip: 'If trails enabled. Lower = stronger trails.' },
            { key: 'enableMouseInjection', label: 'Enable Mouse Ink Injection', type: 'boolean' },
            { key: 'mouseInjectColor', label: 'Mouse Inject Color (rgba)', type: 'text', placeholder: 'rgba(80,220,150,0.7)' },
            { key: 'injectOnDrag', label: 'Inject on Mouse Drag (Button Down)', type: 'boolean' },
            { key: 'mouseInjectSize', label: 'Mouse Inject Particle Size', type: 'number', min: 1, max: 50, step: 1 },
            { key: 'mouseInjectRate', label: 'Mouse Inject Particle Rate', type: 'number', min: 1, max: 10, step: 1 }
        ]
    }
    // --- Placeholder for adding a new background ---
    // To add a new background effect:
    // 1. Create the background class file in the 'js/backgrounds/' directory (e.g., 'myNewBackground.js').
    // 2. Import the class at the top of this file (e.g., `import MyNewBackground from './backgrounds/myNewBackground.js';`).
    // 3. Add a new entry to this `backgroundRegistry` array:
    // {
    //     name: 'My New Awesome Background', // Display name in the dropdown
    //     className: 'MyNewBackground',     // The exact class name
    //     classRef: MyNewBackground,        // The imported class reference
    //     defaults: { /* ... its default options ... */ },
    //     schema: [ /* ... its UI control schema ... */ ],
    // }
];

// Export the registry for use by BackgroundBuilder.
export default backgroundRegistry;