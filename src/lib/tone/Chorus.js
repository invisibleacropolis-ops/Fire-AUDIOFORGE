import { __decorate } from "tslib";
import { StereoXFeedbackEffect, } from "./effect/StereoXFeedbackEffect.js";
import { LFO } from "./source/LFO.js";
import { optionsFromArguments } from "./core/util/Defaults.js";
import { readOnly } from "./core/util/Interface.js";
import { isNumber } from "./core/util/Type.js";
/**
 * Chorus is a stereo chorus effect composed of a specified number of voices.
 * Chorus makes a single input sound like many voices by using an LFO to vary the delay time of each voice.
 *
 * @param frequency The frequency of the LFO.
 * @param delayTime The delay of the chorus effect in ms.
 * @param depth The depth of the chorus.
 *
 * @example
 * const chorus = new Chorus(4, 2.5, 0.5).toDestination();
 * const synth = new Polysynth().connect(chorus);
 * synth.triggerAttackRelease(["C3", "E3", "G3"], "2n");
 * @category Effect
 */
export class Chorus extends StereoXFeedbackEffect {
    constructor() {
        const options = optionsFromArguments(Chorus.getDefaults(), arguments, [
            "frequency",
            "delayTime",
            "depth",
        ]);
        super(options);
        this.name = "Chorus";
        this._lfo = new LFO({
            context: this.context,
            frequency: options.frequency,
            min: 0,
            max: 1,
        });
        this._depth = options.depth;
        this._delayTime = options.delayTime / 1000;
        this.frequency = this._lfo.frequency;
        this.type = options.type;
        this.spread = options.spread;
        this._lfo.connect(this.effectSendL);
        this._lfo.connect(this.effectSendR);
        this._lfo.start();
        this._setDelay(this._delayTime, this._depth);
        readOnly(this, ["frequency"]);
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
     * The depth of the effect. A depth of 1 makes the delayTime modulate between 0 and 2*delayTime (centered around the delayTime).
     */
    get depth() {
        return this._depth;
    }
    set depth(depth) {
        this._depth = depth;
        this._setDelay(this._delayTime, this._depth);
    }
    /**
     * The delayTime in milliseconds of the chorus. A larger delayTime will give a more pronounced chorus effect.
     */
    get delayTime() {
        return this._delayTime * 1000;
    }
    set delayTime(delayTime) {
        this._delayTime = delayTime / 1000;
        this._setDelay(this._delayTime, this._depth);
    }
    /**
     * The oscillator type of the LFO.
     */
    get type() {
        return this._lfo.type;
    }
    set type(type) {
        this._lfo.type = type;
    }
    /**
     * The spread in degrees of the chorus LFOs. A spread of 180 is fully stereo, where the left and right LFOs are 180 degrees apart.
     */
    get spread() {
        return this._lfo.phase;
    }
    set spread(spread) {
        this._lfo.phase = spread;
    }
    /**
     * Set the delay time and depth of the chorus
     */
    _setDelay(delayTime, depth) {
        this.effectSendL.delayTime.value = delayTime;
        this._lfo.min = Math.max(0, delayTime - depth * delayTime);
        this._lfo.max = delayTime + depth * delayTime;
    }
    dispose() {
        super.dispose();
        this._lfo.dispose();
        this.frequency.dispose();
        return this;
    }
}
__decorate([
    isNumber
], Chorus.prototype, "depth", null);
__decorate([
    isNumber
], Chorus.prototype, "delayTime", null);
__decorate([
    isNumber
], Chorus.prototype, "spread", null);
