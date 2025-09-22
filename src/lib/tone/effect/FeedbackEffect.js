import { Effect } from "./Effect.js";
import { optionsFromArguments } from "../core/util/Defaults.js";
import { Gain } from "../core/context/Gain.js";
import { readOnly } from "../core/util/Interface.js";
import { Signal } from "../signal/Signal.js";
/**
 * FeedbackEffect is a base class for effects with a feedback loop.
 */
export class FeedbackEffect extends Effect {
    constructor() {
        const options = optionsFromArguments(FeedbackEffect.getDefaults(), arguments, ["feedback"]);
        super(options);
        this.name = "FeedbackEffect";
        this._feedbackGain = new Gain({
            context: this.context,
            gain: options.feedback,
            units: "normalRange",
        });
        this.feedback = this._feedbackGain.gain;
        // connections
        this.effectReturn.chain(this._feedbackGain, this.effectSend);
        readOnly(this, "feedback");
    }
    static getDefaults() {
        return Object.assign(Effect.getDefaults(), {
            feedback: 0.125,
        });
    }
    dispose() {
        super.dispose();
        this._feedbackGain.dispose();
        this.feedback.dispose();
        return this;
    }
}
