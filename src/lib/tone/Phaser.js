
import { Allpass } from "tone/build/esm/component/filter/Allpass";
import { optionsFromArguments } from "tone/build/esm/core/util/Defaults";
import { readOnly } from "tone/build/esm/core/util/Interface";
import { isNumber } from "tone/build/esm/core/util/Type";
import {
	StereoEffect,
} from "tone/build/esm/effect/StereoEffect";
import { LFO } from "tone/build/esm/source/LFO";
import { Signal } from "tone/build/esm/signal/Signal";
import { Gain } from "tone/build/esm/core/context/Gain";
/**
 * Phaser is a phaser effect. It uses a series of Allpass filters
 * to create a series of phase-shifted signals.
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
        super(optionsFromArguments(Phaser.getDefaults(), arguments, ["frequency", "octaves", "baseFrequency"]));
        this.name = "Phaser";
        const options = optionsFromArguments(Phaser.getDefaults(), arguments, ["frequency", "octaves", "baseFrequency"]);
        this._lfoL = new LFO({
            context: this.context,
            min: options.baseFrequency,
            max: options.baseFrequency * Math.pow(2, options.octaves),
        });
        this._lfoR = new LFO({
            context: this.context,
            min: options.baseFrequency,
            max: options.baseFrequency * Math.pow(2, options.octaves),
            phase: 90,
        });
        this._filtersL = this._makeFilters(options.stages, this._lfoL);
        this._filtersR = this._makeFilters(options.stages, this._lfoR);
        this.frequency = new Signal({
            context: this.context,
            value: options.frequency,
            units: "frequency",
        });
        this._baseFrequency = options.baseFrequency;
        this._octaves = options.octaves;
        this.Q = new Signal({
            context: this.context,
            value: options.Q,
            units: "positive",
        });
        this.effectSendL.connect(this._filtersL[0]);
        this.effectSendR.connect(this._filtersR[0]);
        this._filtersL[options.stages - 1].connect(this.effectReturnL);
        this._filtersR[options.stages - 1].connect(this.effectReturnR);
        // control the frequency
        this.frequency.connect(this._lfoL.frequency);
        this.frequency.connect(this._lfoR.frequency);
        // control the Q
        this.Q.connect(this._q);
        // set the octaves
        this.octaves = options.octaves;
        this.baseFrequency = options.baseFrequency;
        // start the lfo
        this._lfoL.start();
        this._lfoR.start();
        readOnly(this, ["frequency", "Q"]);
    }
    _makeFilters(stages, connectTo) {
        // make the allpass filters
        const filters = [];
        // all of the filters reference the same Q value
        this._q = new Gain({ context: this.context, gain: 0 });
        for (let i = 0; i < stages; i++) {
            const filter = new Allpass({ context: this.context });
            this._q.connect(filter.Q);
            connectTo.connect(filter.frequency);
            filters.push(filter);
        }
        if (filters.length > 1) {
            // chain them up
            filters.forEach((filter, i) => {
                if (i > 0) {
                    filters[i - 1].connect(filter);
                }
            });
        }
        return filters;
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
     * The octaves of the phaser.
     */
    get octaves() {
        return this._octaves;
    }
    set octaves(octaves) {
        this._octaves = octaves;
        const max = this._baseFrequency * Math.pow(2, octaves);
        this._lfoL.max = max;
        this._lfoR.max = max;
    }
    /**
     * The base frequency of the filters.
     */
    get baseFrequency() {
        return this._baseFrequency;
    }
    set baseFrequency(freq) {
        this._baseFrequency = freq;
        this._lfoL.min = freq;
        this._lfoR.min = freq;
        this.octaves = this._octaves;
    }
    dispose() {
        super.dispose();
        this.Q.dispose();
        this.frequency.dispose();
        this._lfoL.dispose();
        this._lfoR.dispose();
        this._filtersL.forEach(f => f.dispose());
        this._filtersR.forEach(f => f.dispose());
        this._q.dispose();
        return this;
    }
}
