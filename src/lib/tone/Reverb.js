
import { Effect } from "./effect/Effect.js";
import { Convolver } from "./component/channel/Convolver.js";
import { optionsFromArguments } from "./core/util/Defaults.js";
import { readOnly } from "./core/util/Interface.js";
/**
 * Reverb is an algorithmic reverb built on {@link Freeverb} and {@link JCReverb}.
 * In addition to those two famous reverb algorithms, Reverb also has a convolution
 * reverb which can be loaded with an impulse response.
 *
 * @example
 * const reverb = new Reverb().toDestination();
 * const synth = new Synth().connect(reverb);
 * synth.triggerAttackRelease("C4", "8n");
 * @category Effect
 */
export class Reverb extends Effect {
    constructor() {
        super(optionsFromArguments(Reverb.getDefaults(), arguments, ["decay", "preDelay"]));
        this.name = "Reverb";
        const options = optionsFromArguments(Reverb.getDefaults(), arguments, ["decay", "preDelay"]);
        this._convolver = new Convolver({
            context: this.context,
            url: options.url,
        });
        this.decay = options.decay;
        this.preDelay = options.preDelay;
        this.connectEffect(this._convolver);
        readOnly(this, ["decay", "preDelay"]);
    }
    static getDefaults() {
        return Object.assign(Effect.getDefaults(), {
            decay: 1.5,
            preDelay: 0.01,
            url: undefined,
        });
    }
    /**
     * The duration of the reverb.
     */
    get decay() {
        return this._convolver.decay;
    }
    set decay(time) {
        this._convolver.decay = time;
    }
    /**
     * The amount of time before the reverb is heard.
     */
    get preDelay() {
        return this._convolver.preDelay;
    }
    set preDelay(time) {
        this._convolver.preDelay = time;
    }
    /**
     * Generate an impulse response.
     */
    async generate() {
        return this._convolver.generate();
    }
    dispose() {
        super.dispose();
        this._convolver.dispose();
        return this;
    }
}
