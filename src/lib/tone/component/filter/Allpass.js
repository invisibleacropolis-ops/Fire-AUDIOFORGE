import { __decorate } from "tslib";
import { Gain } from "../../core/context/Gain.js";
import { ToneAudioNode } from "../../core/context/ToneAudioNode.js";
import { optionsFromArguments } from "../../core/util/Defaults.js";
import { readOnly } from "../../core/util/Interface.js";
import { Signal } from "../../signal/Signal.js";
import { isAudioParam } from "../../core/util/Type.js";
/**
 * Allpass filter with that let's you control the delay time.
 * ```
 *       +-----------+
 *       |           |
 *   v_in ->(+)--.----(v_out)-->
 *           ^   |
 *           |   |
 *           | .---.
 *           '-| z |
 *             '---'
 * ```
 * @category Component
 */
export class Allpass extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(Allpass.getDefaults(), arguments, [
            "delayTime",
        ]);
        super(options);
        this.name = "Allpass";
        this._delayNode = new DelayNode(this.context, {
            // give it a short delay time to start
            delayTime: 0,
            maxDelayTime: 1,
        });
        this._feedback = new Gain({ context: this.context, gain: options.feedback });
        this.delayTime = new Signal({
            context: this.context,
            value: options.delayTime,
            units: "time",
        });
        readOnly(this, ["delayTime"]);
        this.input = this.output = this.context.createGain();
        // signal routing
        this.input.connect(this._delayNode);
        this.delayTime.connect(this._delayNode.delayTime);
        this._delayNode.connect(this.output);
        this._delayNode.connect(this._feedback);
        this._feedback.connect(this.input);
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            delayTime: 0.1,
            feedback: 0.5,
        });
    }
    /**
     * The amount of feedback of the allpass filter.
     */
    get feedback() {
        return this._feedback.gain;
    }
    dispose() {
        super.dispose();
        this.delayTime.dispose();
        this._delayNode.disconnect();
        this._feedback.disconnect();
        return this;
    }
}
__decorate([
    isAudioParam
], Allpass.prototype, "feedback", null);
