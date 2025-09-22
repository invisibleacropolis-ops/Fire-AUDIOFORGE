
import { Param } from "../context/Param.js";
import { ToneAudioNode } from "../context/ToneAudioNode.js";
import { optionsFromArguments } from "../util/Defaults.js";
import { readOnly } from "../util/Interface.js";
/**
 * A thin wrapper around the Native Web Audio GainNode.
 * The GainNode is a basic building block of the Web Audio API and is useful
 * for controlling the volume of a signal.
 *
 * @example
 * const gain = new Gain(0.5).toDestination();
 * const osc = new Oscillator().connect(gain).start();
 * @category Core
 */
export class Gain extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(Gain.getDefaults(), arguments, ["gain", "units"]);
        super(options);
        this.name = "Gain";
        this.input = this.output = this._gainNode = this.context.createGain();
        this.gain = new Param({
            context: this.context,
            param: this._gainNode.gain,
            units: options.units,
            value: options.gain,
            convert: options.convert,
        });
        readOnly(this, ["gain"]);
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            convert: true,
            gain: 1,
            units: "gain",
        });
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this._gainNode.disconnect();
        this.gain.dispose();
        return this;
    }
}
