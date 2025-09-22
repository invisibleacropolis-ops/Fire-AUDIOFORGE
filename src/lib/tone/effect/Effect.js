
import { CrossFade } from "../component/channel/CrossFade.js";
import { ToneAudioNode, } from "../core/context/ToneAudioNode.js";
import { optionsFromArguments } from "../core/util/Defaults.js";
import { readOnly } from "../core/util/Interface.js";
/**
 * Effect is the base class for effects.
 *
 * @category Effect
 */
export class Effect extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(Effect.getDefaults(), arguments, ["wet"]);
        super(options);
        this.name = "Effect";
        this.input = new CrossFade({ context: this.context });
        this.output = new CrossFade({ context: this.context });
        this._dryGain = this.input;
        this._wetGain = this.context.createGain();
        this.wet = new CrossFade({
            context: this.context,
            fade: options.wet,
        });
        // connections
        this._dryGain.connect(this.output);
        this._wetGain.connect(this.output.a);
        this.wet.connect(this.output.fade);
        readOnly(this, ["wet"]);
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            wet: 1,
        });
    }
    /**
     * connect the effect to the...
     * @param  {ToneAudioNode|AudioNode|Tone.Param|AudioParam} destination
     * @param  {number} [outputNum=0]
     * @param  {number} [inputNum=0]
     */
    connect(destination, outputNum = 0, inputNum = 0) {
        this.output.connect(destination, outputNum, inputNum);
        return this;
    }
    /**
     * disconnect the effect
     * @param  {ToneAudioNode|AudioNode|Tone.Param|AudioParam} destination
     * @param  {number} [outputNum=0]
     * @param  {number} [inputNum=0]
     */
    disconnect(destination, outputNum = 0, inputNum = 0) {
        this.output.disconnect(destination, outputNum, inputNum);
        return this;
    }
    /**
     * The effect input.
     */
    get effectSend() {
        return this._dryGain.b;
    }
    /**
     * The effect output.
     */
    get effectReturn() {
        return this._wetGain;
    }
    /**
     * connect the dry signal to the output
     */
    _connectDry() {
        this._dryGain.a.disconnect();
        this._dryGain.a.connect(this.output);
    }
    /**
     * connect the wet signal to the output
     */
    _connectWet() {
        this._wetGain.connect(this.output.a);
    }
    /**
     * Connect the effect input to the effect output.
     */
    connectEffect(effect) {
        this.effectSend.chain(effect, this.effectReturn);
    }
    dispose() {
        super.dispose();
        this._dryGain.dispose();
        this._wetGain.dispose();
        this.wet.dispose();
        return this;
    }
}
