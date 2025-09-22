
import { Param } from "../context/Param.js";
import { ToneAudioNode } from "../context/ToneAudioNode.js";
import { optionsFromArguments } from "../util/Defaults.js";
import { readOnly } from "../util/Interface.js";
/**
 * Wrapper around the native Web Audio's
 * [DelayNode](http://webaudio.github.io/web-audio-api/#the-delaynode-interface).
 * @category Core
 */
export class Delay extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(Delay.getDefaults(), arguments, ["delayTime", "maxDelay"]);
        super(options);
        this.name = "Delay";
        this._delayNode = this.input = this.output = this.context.createDelay(this.toSeconds(options.maxDelay));
        this.delayTime = new Param({
            context: this.context,
            param: this._delayNode.delayTime,
            value: options.delayTime,
            units: "time",
        });
        readOnly(this, ["delayTime"]);
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            maxDelay: 1,
            delayTime: 0,
        });
    }
    /**
     * The maximum delay time. This cannot be changed after
     * the value is passed into the constructor.
     */
    get maxDelay() {
        return this._delayNode.delayTime.maxValue;
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this._delayNode.disconnect();
        this.delayTime.dispose();
        return this;
    }
}
