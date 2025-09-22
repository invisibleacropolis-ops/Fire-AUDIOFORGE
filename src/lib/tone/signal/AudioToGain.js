
import { ToneAudioNode } from "../core/context/ToneAudioNode.js";
import { optionsFromArguments } from "../core/util/Defaults.js";
import { WaveShaper } from "./WaveShaper.js";
/**
 * AudioToGain converts an input in AudioRange [-1, 1] to NormalRange [0, 1].
 * See {@link GainToAudio}.
 *
 * @category Signal
 */
export class AudioToGain extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(AudioToGain.getDefaults(), arguments));
        this.name = "AudioToGain";
        /**
         * The node which converts the audio ranges
         */
        this._norm = this.input = this.output = new WaveShaper({
            context: this.context,
            mapping: (x) => (x + 1) / 2,
        });
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this._norm.dispose();
        return this;
    }
}
