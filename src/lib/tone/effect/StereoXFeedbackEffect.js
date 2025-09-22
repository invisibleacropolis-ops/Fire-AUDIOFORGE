import { StereoEffect } from "./StereoEffect.js";
import { optionsFromArguments } from "../core/util/Defaults.js";
import { Gain } from "../core/context/Gain.js";
import { readOnly } from "../core/util/Interface.js";
import { Signal } from "../signal/Signal.js";
/**
 * Just like a {@link FeedbackEffect}, but both effects are fed back into each other.
 */
export class StereoXFeedbackEffect extends StereoEffect {
    constructor() {
        const options = optionsFromArguments(StereoXFeedbackEffect.getDefaults(), arguments, ["feedback"]);
        super(options);
        this.name = "StereoXFeedbackEffect";
        this._feedbackLR = new Gain({
            context: this.context,
            gain: options.feedback,
            units: "normalRange",
        });
        this.feedback = this._feedbackLR.gain;
        this._feedbackRL = new Gain({
            context: this.context,
            gain: options.feedback,
            units: "normalRange",
        });
        // connections
        this.effectReturnL.connect(this._feedbackLR);
        this.effectReturnR.connect(this._feedbackRL);
        this._feedbackLR.connect(this.effectSendR);
        this._feedbackRL.connect(this.effectSendL);
        readOnly(this, "feedback");
    }
    static getDefaults() {
        return Object.assign(StereoEffect.getDefaults(), {
            feedback: 0.5,
        });
    }
    dispose() {
        super.dispose();
        this._feedbackLR.dispose();
        this._feedbackRL.dispose();
        this.feedback.dispose();
        return this;
    }
}
