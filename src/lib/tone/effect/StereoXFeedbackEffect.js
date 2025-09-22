
import { Delay } from "../core/context/Delay.js";
import { Gain } from "../core/context/Gain.js";
import { optionsFromArguments } from "../core/util/Defaults.js";
import { readOnly } from "../core/util/Interface.js";
import { StereoEffect } from "./StereoEffect.js";
/**
 * A stereo feedback effect where the feedback is derived from the left and right outputs respectively.
 *
 * @category Effect
 */
export class StereoXFeedbackEffect extends StereoEffect {
    constructor() {
        const options = optionsFromArguments(StereoXFeedbackEffect.getDefaults(), arguments, ["feedback"]);
        super(options);
        this.name = "StereoXFeedbackEffect";
        this.feedback = new Gain({
            context: this.context,
            gain: options.feedback,
            units: "normalRange",
        });
        this._feedbackL = new Gain({ context: this.context });
        this._feedbackR = new Gain({ context: this.context });
        this._delayNodeL = new Delay({ context: this.context });
        this._delayNodeR = new Delay({ context: this.context });
        // connect it up
        this.effectSendL.connect(this._delayNodeL);
        this.effectSendR.connect(this._delayNodeR);
        this._delayNodeL.connect(this.effectReturnL);
        this._delayNodeR.connect(this.effectReturnR);
        this._delayNodeL.connect(this._feedbackR);
        this._delayNodeR.connect(this._feedbackL);
        this._feedbackL.connect(this._delayNodeL);
        this._feedbackR.connect(this._delayNodeR);
        this.feedback.connect(this._feedbackL.gain);
        this.feedback.connect(this._feedbackR.gain);
        readOnly(this, ["feedback"]);
    }
    static getDefaults() {
        return Object.assign(StereoEffect.getDefaults(), {
            feedback: 0.5,
        });
    }
    dispose() {
        super.dispose();
        this.feedback.dispose();
        this._feedbackL.dispose();
        this._feedbackR.dispose();
        this._delayNodeL.dispose();
        this._delayNodeR.dispose();
        return this;
    }
}
