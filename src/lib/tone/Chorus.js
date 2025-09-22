
import { LFO } from "./source/LFO.js";
import { optionsFromArguments } from "./core/util/Defaults.js";
import { readOnly } from "./core/util/Interface.js";
import { isNumber } from "./core/util/Type.js";
import {
	StereoXFeedbackEffect,
} from "./effect/StereoXFeedbackEffect.js";
/**
 * Chorus is a stereo chorus effect with feedback composed of
 * a left and right channel delay network.
 *
 * @example
 * const chorus = new Chorus(4, 2.5, 0.5).toDestination().start();
 * const synth = new PolySynth(Synth).connect(chorus);
 * synth.triggerAttackRelease(["C3", "E3", "G3"], "8n");
 * @category Effect
 */
export class Chorus extends StereoXFeedbackEffect {
    constructor() {
        super(optionsFromArguments(Chorus.getDefaults(), arguments, ["frequency", "delayTime", "depth"]));
        this.name = "Chorus";
        const options = optionsFromArguments(Chorus.getDefaults(), arguments, ["frequency", "delayTime", "depth"]);
        this._lfoL = new LFO({
            context: this.context,
            frequency: options.frequency,
            min: this.toSeconds(options.delayTime) - this.toSeconds(options.depth),
            max: this.toSeconds(options.delayTime) + this.toSeconds(options.depth),
        });
        this._lfoR = new LFO({
            context: this.context,
            frequency: options.frequency,
            min: this.toSeconds(options.delayTime) - this.toSeconds(options.depth),
            max: this.toSeconds(options.delayTime) + this.toSeconds(options.depth),
            phase: 90,
        });
        this._delayNodeL.delayTime.value = this.toSeconds(options.delayTime);
        this._delayNodeR.delayTime.value = this.toSeconds(options.delayTime);
        this.depth = options.depth;
        this.frequency = this._lfoL.frequency;
        this.type = options.type;
        this.spread = options.spread;
        this._lfoL.connect(this._delayNodeL.delayTime);
        this._lfoR.connect(this._delayNodeR.delayTime);
        readOnly(this, ["frequency", "depth", "type", "spread"]);
    }
    static getDefaults() {
        return Object.assign(StereoXFeedbackEffect.getDefaults(), {
            frequency: 1.5,
            delayTime: 3.5,
            depth: 0.7,
            type: "sine",
            spread: 180,
        });
    }
    /**
     * The depth of the chorus. A fully dry signal is 0 and a fully wet signal is 1.
     */
    get depth() {
        return this._depth;
    }
    set depth(depth) {
        this._depth = depth;
        const delayTime = this.toSeconds(this._delayTime);
        this._lfoL.min = delayTime - this.toSeconds(this._depth);
        this._lfoL.max = delayTime + this.toSeconds(this._depth);
        this._lfoR.min = delayTime - this.toSeconds(this._depth);
        this._lfoR.max = delayTime + this.toSeconds(this._depth);
    }
    /**
     * The delay time of the chorus
     */
    get delayTime() {
        return this._delayTime;
    }
    set delayTime(delayTime) {
        this._delayTime = delayTime;
        const delayTimeSec = this.toSeconds(delayTime);
        this.depth = this._depth;
        this._delayNodeL.delayTime.value = delayTimeSec;
        this._delayNodeR.delayTime.value = delayTimeSec;
    }
    /**
     * The lfo traversal waveform. Can be any of the basic types: "sine", "square", "sawtooth", "triangle".
     */
    get type() {
        return this._lfoL.type;
    }
    set type(type) {
        this._lfoL.type = type;
        this._lfoR.type = type;
    }
    /**
     * The spread in degrees of the two LFOs. A spread of 180 (default) will produce a nice stereo effect.
     * When the spread is 0, both LFOs will be panned centrally.
     */
    get spread() {
        return this._lfoL.phase - this._lfoR.phase;
    }
    set spread(spread) {
        this._lfoL.phase = 90 - spread / 2;
        this._lfoR.phase = 90 + spread / 2;
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
    sync() {
        this._lfoL.sync();
        this._lfoR.sync();
        return this;
    }
    unsync() {
        this._lfoL.unsync();
        this._lfoR.unsync();
        return this;
    }
    dispose() {
        super.dispose();
        this._lfoL.dispose();
        this._lfoR.dispose();
        return this;
    }
}
