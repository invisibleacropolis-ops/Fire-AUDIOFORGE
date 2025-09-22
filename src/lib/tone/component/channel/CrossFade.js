import { Gain } from "../../core/context/Gain.js";
import { Param } from "../../core/context/Param.js";
import { ToneAudioNode } from "../../core/context/ToneAudioNode.js";
import { optionsFromArguments } from "../../core/util/Defaults.js";
import { Signal } from "../../signal/Signal.js";
import { readOnly } from "../../core/util/Interface.js";
/**
 * CrossFade provides equal power fading between two inputs.
 * More on crossfading technique [here](https://en.wikipedia.org/wiki/Crossfading).
 * ```
 *            +-------+
 * ---input 0--> 0     |
 *            |       | --> output
 * ---input 1--> 1     |
 *            +-------+
 *                ^
 *                |
 *            +-----+
 *            | fade|
 *            +-----+
 * ```
 * @example
 * const crossFade = new CrossFade().toDestination();
 * // connect an LFO to the fade parameter
 * const lfo = new LFO(2, 0, 1).connect(crossFade.fade).start();
 * const o1 = new Oscillator("C4", "sine").connect(crossFade, 0, 0).start();
 * const o2 = new Oscillator("E4", "sine").connect(crossFade, 0, 1).start();
 * @category Component
 */
export class CrossFade extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(CrossFade.getDefaults(), arguments, ["fade"]);
        super(options);
        this.name = "CrossFade";
        this.a = new Gain({ context: this.context });
        this.b = new Gain({ context: this.context });
        this.input = [this.a, this.b];
        this.output = new Gain({ context: this.context });
        this.fade = new Signal({
            context: this.context,
            value: options.fade,
            units: "normalRange",
        });
        readOnly(this, ["fade"]);
        // connections
        this.a.connect(this.output);
        this.b.connect(this.output);
        this.fade.connect(this.a.gain);
        this.fade.connect(this.b.gain);
        // set the curve
        this._setCurve(this._curve);
        this._readOnly("fade");
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            fade: 0.5,
            curve: "equalPower",
        });
    }
    /**
     * The curve which is used for the crossfade.
     */
    get curve() {
        return this._curve;
    }
    set curve(curve) {
        if (this._curve !== curve) {
            this._curve = curve;
            this._setCurve(curve);
        }
    }
    /**
     * Set the crossfade curve.
     */
    _setCurve(curve) {
        if (curve === "equalPower") {
            this.fade.internalFan(this.a.gain, this.b.gain);
        }
        else {
            this.fade.internalUnfan(this.a.gain, this.b.gain);
            this.fade.connect(this.b.gain);
        }
    }
    /**
     * clean up
     */
    dispose() {
        super.dispose();
        this.a.dispose();
        this.b.dispose();
        this.fade.dispose();
        return this;
    }
}
