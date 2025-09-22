import { __decorate } from "tslib";
import { Filter } from "./component/filter/Filter.js";
import { optionsFromArguments } from "./core/util/Defaults.js";
import {
	StereoEffect,
} from "./effect/StereoEffect.js";
import { LFO } from "./source/LFO.js";
import { Signal } from "./signal/Signal.js";
import { Gain } from "./core/context/Gain.js";
/**
 * Phaser is a stereo phasing effect. It has a built-in LFO which can be configured.
 *
 * @param frequency The speed of the phasing.
 * @param octaves The octaves of the phasing.
 * @param baseFrequency The base frequency of the filters.
 *
 * @example
 * const phaser = new Phaser({
 * 	frequency: 15,
 * 	octaves: 5,
 * 	baseFrequency: 1000
 * }).toDestination();
 * const synth = new FMSynth().connect(phaser);
 * synth.triggerAttackRelease("E3", "2n");
 * @category Effect
 */
export class Phaser extends StereoEffect {
    constructor() {
        const options = optionsFromArguments(Phaser.getDefaults(), arguments, [
            "frequency",
            "octaves",
            "baseFrequency",
        ]);
        super(options);
        this.name = "Phaser";
        this.Q = new Signal({
            context: this.context,
            value: options.Q,
            units: "positive",
        });
        this._filtersL = [];
        this._filtersR = [];
        this._lfoL = new LFO({
            context: this.context,
            min: options.baseFrequency,
            max: options.baseFrequency * Math.pow(2, options.octaves),
        });
        this._lfoR = new LFO({
            context: this.context,
            min: options.baseFrequency,
            max: options.baseFrequency * Math.pow(2, options.octaves),
        });
        this._lfoR.phase = 90;
        this.frequency = new Signal({
            context: this.context,
            value: options.frequency,
            units: "frequency",
        });
        this.octaves = options.octaves;
        this.baseFrequency = options.baseFrequency;
        // make the connections
        this.effectSendL = new Gain({ context: this.context });
        this.effectSendR = new Gain({ context: this.context });
        this.input.connect(this.effectSendL);
        this.input.connect(this.effectSendR);
        let lastL = this.effectSendL;
        let lastR = this.effectSendR;
        for (let i = 0; i < options.stages; i++) {
            const filterL = new Filter({
                context: this.context,
                type: "allpass",
            });
            const filterR = new Filter({
                context: this.context,
                type: "allpass",
            });
            filterL.Q.connect(this.Q);
            filterR.Q.connect(this.Q);
            this._lfoL.connect(filterL.frequency);
            this._lfoR.connect(filterR.frequency);
            lastL.connect(filterL);
            lastR.connect(filterR);
            lastL = filterL;
            lastR = filterR;
            this._filtersL.push(filterL);
            this._filtersR.push(filterR);
        }
        lastL.connect(this.effectReturnL);
        lastR.connect(this.effectReturnR);
        // control the frequency
        this.frequency.connect(this._lfoL.frequency);
        this.frequency.connect(this._lfoR.frequency);
        // start the lfo
        this._lfoL.start();
        this._lfoR.start();
    }
    static getDefaults() {
        return Object.assign(StereoEffect.getDefaults(), {
            frequency: 0.5,
            octaves: 3,
            stages: 10,
            Q: 10,
            baseFrequency: 350,
        });
    }
    /**
     * The number of octaves the phase goes above the baseFrequency
     */
    get octaves() {
        return Math.log2(this._lfoL.max / this._lfoL.min);
    }
    set octaves(octaves) {
        this._lfoL.min = this.baseFrequency;
        this._lfoL.max = this.baseFrequency * Math.pow(2, octaves);
        this._lfoR.min = this.baseFrequency;
        this._lfoR.max = this.baseFrequency * Math.pow(2, octaves);
    }
    /**
     * The base frequency of the filters.
     */
    get baseFrequency() {
        return this._lfoL.min;
    }
    set baseFrequency(freq) {
        const currentOctaves = this.octaves;
        this._lfoL.min = freq;
        this._lfoL.max = freq * Math.pow(2, currentOctaves);
        this._lfoR.min = freq;
        this._lfoR.max = freq * Math.pow(2, currentOctaves);
    }
    dispose() {
        super.dispose();
        this.Q.dispose();
        this.frequency.dispose();
        this._lfoL.dispose();
        this._lfoR.dispose();
        this._filtersL.forEach((f) => f.dispose());
        this._filtersR.forEach((f) => f.dispose());
        this.effectSendL.dispose();
        this.effectSendR.dispose();
        return this;
    }
}
__decorate([
    isFinite
], Phaser.prototype, "octaves", null);
__decorate([
    isFinite
], Phaser.prototype, "baseFrequency", null);
