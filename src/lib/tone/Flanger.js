
import { LFO } from "tone/build/esm/source/LFO";
import { optionsFromArguments } from "tone/build/esm/core/util/Defaults";
import { readOnly } from "tone/build/esm/core/util/Interface";
import { isNumber } from "tone/build/esm/core/util/Type";
import {
	StereoXFeedbackEffect,
} from "tone/build/esm/effect/StereoXFeedbackEffect";
/**
 * Flanger is a stereo flanger effect with feedback.
 *
 * @example
 * //create a flanger and connect it to the master output
 * const flanger = new Flanger().toDestination();
 * //create an oscillator and connect it to the flanger
 * const oscillator = new Oscillator().connect(flanger).start();
 * @category Effect
 */
export class Flanger extends StereoXFeedbackEffect {
    constructor() {
        super(optionsFromArguments(Flanger.getDefaults(), arguments, ["delayTime", "frequency", "depth"]));
        this.name = "Flanger";
        const options = optionsFromArguments(Flanger.getDefaults(), arguments, ["delayTime", "frequency", "depth"]);
        this._lfoL = new LFO({
            context: this.context,
            frequency: options.frequency,
            min: this._delayTime - this.toSeconds(options.depth),
            max: this._delayTime + this.toSeconds(options.depth),
        });
        this._lfoR = new LFO({
            context: this.context,
            frequency: options.frequency,
            min: this._delayTime - this.toSeconds(options.depth),
            max: this._delayTime + this.toSeconds(options.depth),
            phase: 90,
        });
        this._delayNodeL.delayTime.value = this.toSeconds(options.delayTime);
        this._delayNodeR.delayTime.value = this.toSeconds(options.delayTime);
        this.delayTime = options.delayTime;
        this.depth = options.depth;
        this.frequency = this._lfoL.frequency;
        this.type = options.type;
        this.spread = options.spread;
        this._lfoL.connect(this._delayNodeL.delayTime);
        this._lfoR.connect(this._delayNodeR.delayTime);
        readOnly(this, ["frequency", "depth", "type", "spread", "delayTime"]);
    }
    static getDefaults() {
        return Object.assign(StereoXFeedbackEffect.getDefaults(), {
            delayTime: 0.005,
            depth: 0.002,
            frequency: 0.2,
            spread: 180,
            type: "sine",
        });
    }
    /**
     * The depth of the effect.
     */
    get depth() {
        return this._depth;
    }
    set depth(depth) {
        this._depth = this.toSeconds(depth);
    }
    /**
     * The speed of the LFO.
     */
    get frequency() {
        return this._lfoL.frequency;
    }
    set frequency(freq) {
        this._lfoL.frequency.value = this.toSeconds(freq);
        this._lfoR.frequency.value = this.toSeconds(freq);
    }
    /**
     * The waveform of the LFO.
     */
    get type() {
        return this._lfoL.type;
    }
    set type(type) {
        this._lfoL.type = type;
        this._lfoR.type = type;
    }
    /**
     * The stereo spread of the left and right LFOs.
     */
    get spread() {
        return this._lfoL.phase - this._lfoR.phase;
    }
    set spread(spread) {
        this._lfoL.phase = 90 - spread / 2;
        this._lfoR.phase = 90 + spread / 2;
    }
    /**
     * The delay time of the flanger.
     */
    get delayTime() {
        return this._delayTime;
    }
    set delayTime(delayTime) {
        this._delayTime = this.toSeconds(delayTime);
        this._lfoL.min = this._delayTime - this._depth;
        this._lfoL.max = this._delayTime + this._depth;
        this._lfoR.min = this._delayTime - this._depth;
        this._lfoR.max = this._delayTime + this._depth;
    }
    /**
     * Start the effect.
     */
    start(time) {
        this._lfoL.start(time);
        this._lfoR.start(time);
        return this;
    }
    /**
     * Stop the lfo
     */
    stop(time) {
        this._lfoL.stop(time);
        this._lfoR.stop(time);
        return this;
    }
    dispose() {
        super.dispose();
        this._lfoL.dispose();
        this._lfoR.dispose();
        return this;
    }
}
