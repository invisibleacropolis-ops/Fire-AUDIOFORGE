import { optionsFromArguments } from "../core/util/Defaults.js";
import { SignalOperator } from "./SignalOperator.js";
/**
 * AudioToGain converts an input in AudioRange [-1, 1] to NormalRange [0, 1].
 * See {@link GainToAudio}.
 *
 * @example
 * import { AudioToGain, LFO, Signal } from "tone";
 * const lfo = new LFO(-1, 1).start();
 * const a2g = new AudioToGain();
 * lfo.connect(a2g);
 * // a2g.output is a Signal between 0 and 1
 *
 * @category Signal
 */
export class AudioToGain extends SignalOperator {
    constructor() {
        const options = optionsFromArguments(AudioToGain.getDefaults(), arguments);
        super(options);
        this.name = "AudioToGain";
        this._norm = this.input = this.output = new WaveShaper({
            context: this.context,
            mapping: (x) => (x + 1) / 2,
        });
    }
    /**
     * clean up
     */
    dispose() {
        super.dispose();
        this._norm.dispose();
        return this;
    }
}
