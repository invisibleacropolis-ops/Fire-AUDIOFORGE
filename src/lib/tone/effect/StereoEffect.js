import { Effect } from "./Effect.js";
import { optionsFromArguments } from "../core/util/Defaults.js";
import { Split } from "../component/channel/Split.js";
import { Merge } from "../component/channel/Merge.js";
/**
 * StereoEffect is a base class for all stereo effects.
 */
export class StereoEffect extends Effect {
    constructor() {
        const options = optionsFromArguments(StereoEffect.getDefaults(), arguments);
        super(options);
        this.name = "StereoEffect";
        this._split = new Split({ context: this.context, channels: 2 });
        this._merge = new Merge({ context: this.context, channels: 2 });
        this.effectSendL = this._split.left;
        this.effectSendR = this._split.right;
        this.effectReturnL = this._merge.left;
        this.effectReturnR = this._merge.right;
        // connections
        this.effectSend.connect(this._split);
        this._merge.connect(this.effectReturn);
    }
    dispose() {
        super.dispose();
        this._split.dispose();
        this._merge.dispose();
        return this;
    }
}
