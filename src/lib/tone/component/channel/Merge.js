import { ToneAudioNode } from "../../core/context/ToneAudioNode.js";
import { optionsFromArguments } from "../../core/util/Defaults.js";
/**
 * Merge brings multiple mono inputs into a single stereo output.
 *
 * @example
 * // bring two mono inputs into a single stereo output
 * const merge = new Merge().toDestination();
 * // connect the LFO to the left side and the oscillator to the right
 * new LFO(4, 200, 400).connect(merge.left).start();
 * new Oscillator(300).connect(merge.right).start();
 * @category Component
 */
export class Merge extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(Merge.getDefaults(), arguments, [
            "channels",
        ]);
        super(options);
        this.name = "Merge";
        this.input = new Array(options.channels);
        this.output = this.context.createChannelMerger(options.channels);
        // connections
        for (let i = 0; i < options.channels; i++) {
            this.input[i] = this.context.createGain();
            this.input[i].connect(this.output, 0, i);
        }
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            channels: 2,
        });
    }
    /**
     * The left input channel.
     */
    get left() {
        return this.input[0];
    }
    /**
     * The right input channel.
     */
    get right() {
        return this.input[1];
    }
    dispose() {
        super.dispose();
        this.output.disconnect();
        this.input.forEach((input) => input.disconnect());
        return this;
    }
}
