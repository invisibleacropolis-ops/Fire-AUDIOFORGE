import { ToneAudioNode } from "../../core/context/ToneAudioNode.js";
import { optionsFromArguments } from "../../core/util/Defaults.js";
/**
 * Split splits an incoming signal into the number of given outputs.
 *
 * @example
 * const split = new Split().toDestination();
 * const osc = new Oscillator().connect(split);
 * @category Component
 */
export class Split extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(Split.getDefaults(), arguments, [
            "channels",
        ]);
        super(options);
        this.name = "Split";
        this.input = this.context.createChannelSplitter(options.channels);
        this.output = new Array(options.channels);
        // connections
        for (let i = 0; i < options.channels; i++) {
            this.output[i] = this.context.createGain();
            this.input.connect(this.output[i], i, 0);
        }
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            channels: 2,
        });
    }
    dispose() {
        super.dispose();
        this.input.disconnect();
        this.output.forEach((output) => output.disconnect());
        return this;
    }
}
