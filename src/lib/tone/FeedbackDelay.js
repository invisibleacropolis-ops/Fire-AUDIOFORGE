
import { Delay } from "./core/context/Delay.js";
import { optionsFromArguments } from "./core/util/Defaults.js";
import { readOnly } from "./core/util/Interface.js";
import { Signal } from "./signal/Signal.js";
import { Gain } from "./core/context/Gain.js";
import {
	Effect,
} from "./effect/Effect.js";
/**
 * FeedbackDelay is a DelayNode with a feedback loop.
 *
 * @example
 * const feedbackDelay = new FeedbackDelay("8n", 0.5).toDestination();
 * const tom = new MembraneSynth({
 * 	octaves: 4,
 * 	pitchDecay: 0.1
 * }).connect(feedbackDelay);
 * tom.triggerAttackRelease("A2", "32n");
 * @category Effect
 */
export class FeedbackDelay extends Effect {
    constructor() {
        super(optionsFromArguments(FeedbackDelay.getDefaults(), arguments, ["delayTime", "feedback"]));
        this.name = "FeedbackDelay";
        const options = optionsFromArguments(FeedbackDelay.getDefaults(), arguments, ["delayTime", "feedback"]);
        this._delayNode = new Delay({
            context: this.context,
            delayTime: options.delayTime,
            maxDelay: options.maxDelay,
        });
        this.delayTime = this._delayNode.delayTime;
        this._feedback = new Gain({
            context: this.context,
            gain: options.feedback,
        });
        this.feedback = this._feedback.gain;
        this.connectEffect(this._delayNode);
        this._delayNode.connect(this._feedback);
        this._feedback.connect(this._delayNode);
        readOnly(this, ["delayTime", "feedback"]);
    }
    static getDefaults() {
        return Object.assign(Effect.getDefaults(), {
            delayTime: 0.25,
            feedback: 0.125,
            maxDelay: 1,
        });
    }
    dispose() {
        super.dispose();
        this._delayNode.dispose();
        this._feedback.dispose();
        return this;
    }
}
