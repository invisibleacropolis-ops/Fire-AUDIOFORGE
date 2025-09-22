import { Param } from "./Param.js";
import { ToneAudioNode } from "./ToneAudioNode.js";
import { optionsFromArguments } from "../util/Defaults.js";
import { readOnly } from "../util/Interface.js";
/**
 * A delay node with feedback.
 * @category Core
 */
export class Delay extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(Delay.getDefaults(), arguments, ["delayTime", "maxDelay"]);
        super(options);
        this.name = "Delay";
        this._delayNode = this.context.createDelay(options.maxDelay);
        this.input = this._delayNode;
        this.output = this._delayNode;
        this.delayTime = new Param({
            context: this.context,
            param: this._delayNode.delayTime,
            units: "time",
            value: options.delayTime,
        });
        readOnly(this, "delayTime");
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            maxDelay: 1,
            delayTime: 0,
        });
    }
    /**
     * The maximum delay time. This cannot be changed after
     * object creation.
     */
    get maxDelay() {
        return this._delayNode.delayTime.maxValue;
    }
    dispose() {
        super.dispose();
        this._delayNode.disconnect();
        this.delayTime.dispose();
        return this;
    }
}
