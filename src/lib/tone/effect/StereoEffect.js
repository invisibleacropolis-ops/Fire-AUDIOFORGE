
import { Effect } from "./Effect.js";
import { optionsFromArguments } from "../core/util/Defaults.js";
import { CrossFade } from "../component/channel/CrossFade.js";
/**
 * StereoEffect is the base class for all stereo effects.
 *
 * @category Effect
 */
export class StereoEffect extends Effect {
    constructor() {
        const options = optionsFromArguments(StereoEffect.getDefaults(), arguments, ["wet"]);
        super(options);
        this.name = "StereoEffect";
        this.input = new CrossFade({ context: this.context, fade: 0.5 });
        this.effectSendL = this.input.a;
        this.effectSendR = this.input.b;
        this.effectReturnL = this.context.createGain();
        this.effectReturnR = this.context.createGain();
        // connections
        this._dryGain.connect(this.output);
        this.effectReturnL.connect(this._wetGain);
        this.effectReturnR.connect(this._wetGain);
        this.wet.connect(this._wetGain.gain);
    }
    dispose() {
        super.dispose();
        this.effectSendL.dispose();
        this.effectSendR.dispose();
        this.effectReturnL.dispose();
        this.effectReturnR.dispose();
        return this;
    }
}
