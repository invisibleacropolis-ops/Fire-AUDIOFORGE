
import { Gain } from "../../core/context/Gain.js";
import { Signal } from "../../signal/Signal.js";
import { ToneAudioNode, } from "../../core/context/ToneAudioNode.js";
import { readOnly } from "../../core/util/Interface.js";
import { optionsFromArguments } from "../../core/util/Defaults.js";
/**
 * CrossFade provides equal power fading between two inputs.
 * More on crossfading technique [here](https://en.wikipedia.org/wiki/Crossfading).
 *
 * @example
 * const crossFade = new CrossFade().toDestination();
 * // connect an LFO to the crossfade signal
 * const lfo = new LFO(2, 0, 1).connect(crossFade.fade).start();
 * const oA = new Oscillator(440, "sine").connect(crossFade.a).start();
 * const oB = new Oscillator(440, "square").connect(crossFade.b).start();
 * @category Component
 */
export class CrossFade extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(CrossFade.getDefaults(), arguments, ["fade"]);
        super(options);
        this.name = "CrossFade";
        this.input = [this.a, this.b] = [new Gain({ context: this.context }), new Gain({ context: this.context })];
        this.output = new Gain({ context: this.context });
        this.fade = new Signal({
            context: this.context,
            value: options.fade,
            units: "normalRange",
        });
        readOnly(this, ["fade"]);
        this.a.connect(this.output);
        this.b.connect(this.output);
        this.fade.connect(this.a.gain);
        this.fade.connect(this.b.gain, 0, 1);
        // initially set the gain
        this._readOnly("fade");
        this.fade.value = options.fade;
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            fade: 0.5,
        });
    }
    dispose() {
        super.dispose();
        this.a.dispose();
        this.b.dispose();
        this.output.dispose();
        this.fade.dispose();
        return this;
    }
}
