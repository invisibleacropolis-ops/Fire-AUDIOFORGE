import { __decorate } from "tslib";
import { StereoXFeedbackEffect, } from "./effect/StereoXFeedbackEffect.js";
import { LFO } from "./source/LFO.js";
import { optionsFromArguments } from "./core/util/Defaults.js";
import { readOnly } from "./core/util/Interface.js";
import { isNumber } from "./core/util/Type.js";
/**
 * Flanger is a stereo flanger effect with independent left and right modulation depths.
 *
 * @param delayTime The delay time of the flange effect.
 * @param depth The modulation depth of the flange.
 * @param feedback The amount of feedback from the output back into the input.
 * @example
 * //create a flanger effect
 * const flanger = new Flanger({
 * 	delayTime: 0.5,
 * 	depth: 0.1,
 * 	feedback: 0.2,
 * 	frequency: 0.4,
 * }).toDestination();
 * //create an input
 * const synth = new FMSynth().connect(flanger);
 * synth.triggerAttackRelease("A3", "2n");
 * @category Effect
 */
export class Flanger extends StereoXFeedbackEffect {
    constructor() {
        const options = optionsFromArguments(Flanger.getDefaults(), arguments, [
            "delayTime",
            "depth",
            "feedback",
        ]);
        super(options);
this.name = "Flanger";
        this._lfoL = new LFO({
            context: this.context,
            frequency: options.frequency,
            min: 0,
            max: 1,
        });
        this._lfoR = new LFO({
            context: this.context,
            frequency: options.frequency,
            min: 0,
            max: 1,
            phase: options.spread,
        });
        this._delayTime = options.delayTime;
        this._depth = options.depth;
        this.frequency = this._lfoL.frequency;
        this.effectSendL.delayTime.value = this.toSeconds(this._delayTime);
        this.effectSendR.delayTime.value = this.toSeconds(this._delayTime);
        this._lfoL.connect(this.effectSendL.delayTime);
        this._lfoR.connect(this.effectSendR.delayTime);
        this._setRange();
        this.spread = options.spread;
        this.type = options.type;
        readOnly(this, ["frequency"]);
    }
    static getDefaults() {
        return Object.assign(StereoXFeedbackEffect.getDefaults(), {
            frequency: 0.5,
            delayTime: 3,
            depth: 1,
            spread: 180,
            type: "sine",
        });
    }
    /**
     * The modulation frequency of the flanger.
     */
    get frequency() {
        return this._lfoL.frequency;
    }
    /**
     * The modulation depth of the flanger.
     */
    get depth() {
        return this._depth;
    }
    set depth(depth) {
        this._depth = depth;
        this._setRange();
    }
    /**
     * The delay time of the flanger in milliseconds.
     */
    get delayTime() {
        return this._delayTime;
    }
    set delayTime(delayTime) {
        this._delayTime = delayTime;
        this._setRange();
    }
    /**
     * The lfo type for the flanger.
     */
    get type() {
        return this._lfoL.type;
    }
    set type(type) {
        this._lfoL.type = type;
        this._lfoR.type = type;
    }
    /**
     * The phase difference between the left and right lfos.
     */
    get spread() {
        return this._lfoR.phase - this._lfoL.phase;
    }
    set spread(spread) {
        this._lfoR.phase = this._lfoL.phase + spread;
    }
    /**
     * Set the minimum and maximum values for the LFOs
     */
    _setRange() {
        const delayTime = this.toSeconds(this._delayTime);
        const depth = this.toSeconds(this._depth);
        this._lfoL.min = Math.max(0, delayTime - depth);
        this._lfoL.max = delayTime + depth;
        this._lfoR.min = Math.max(0, delayTime - depth);
        this._lfoR.max = delayTime + depth;
    }
    dispose() {
        super.dispose();
        this._lfoL.dispose();
        this._lfoR.dispose();
        this.frequency.dispose();
        return this;
    }
}
__decorate([
    isNumber
], Flanger.prototype, "depth", null);
__decorate([
    isNumber
], Flanger.prototype, "delayTime", null);
__decorate([
    isNumber
], Flanger.prototype, "spread", null);
