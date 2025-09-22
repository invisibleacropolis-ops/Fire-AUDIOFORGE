import { __decorate } from "tslib";
import { FeedbackEffect } from "./effect/FeedbackEffect.js";
import { optionsFromArguments } from "./core/util/Defaults.js";
import { isNumber } from "./core/util/Type.js";
/**
 * FeedbackDelay is a DelayNode with a feedback loop.
 *
 * @param delayTime The delay time in seconds.
 * @param feedback The amount of the effected signal which is fed back through the delay.
 * @example
 * const feedbackDelay = new FeedbackDelay("8n", 0.5).toDestination();
 * const tom = new MetalSynth({
 * 	envelope: {
 * 		attack: 0.001,
 * 		decay: 0.1,
 * 		release: 0.01
 * 	},
 * 	harmonicity: 8,
 * 	modulationIndex: 20,
 * 	resonance: 4000,
 * 	octaves: 1.5
 * }).connect(feedbackDelay);
 * tom.triggerAttackRelease("A6", "32n");
 * @category Effect
 */
export class FeedbackDelay extends FeedbackEffect {
    constructor() {
        const options = optionsFromArguments(FeedbackDelay.getDefaults(), arguments, ["delayTime", "feedback"]);
        super(options);
        this.name = "FeedbackDelay";
        this.delayTime = this.toSeconds(options.delayTime);
        this.feedback = options.feedback;
    }
    static getDefaults() {
        return Object.assign(FeedbackEffect.getDefaults(), {
            delayTime: 0.25,
            maxDelay: 1,
        });
    }
    dispose() {
        super.dispose();
        return this;
    }
}
__decorate([
    isNumber
], FeedbackDelay.prototype, "delayTime", null);
