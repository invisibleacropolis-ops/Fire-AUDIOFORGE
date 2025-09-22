import { Gain } from "../../core/context/Gain.js";
import { Param } from "../../core/context/Param.js";
import { ToneAudioNode } from "../../core/context/ToneAudioNode.js";
import { optionsFromArguments } from "../../core/util/Defaults.js";
import { readOnly } from "../../core/util/Interface.js";
/**
 * Volume is a simple volume node, useful for creating a volume fader.
 *
 * @param volume The initial volume of the node
 * @example
 * const vol = new Volume(-12).toDestination();
 * const osc = new Oscillator().connect(vol).start();
 * @category Component
 */
export class Volume extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(Volume.getDefaults(), arguments, [
            "volume",
        ]);
        super(options);
        this.name = "Volume";
        this.input = this.output = new Gain({
            context: this.context,
            gain: 1,
        });
        this.volume = new Param({
            context: this.context,
            param: this.output.gain,
            units: "decibels",
            value: options.volume,
            convert: !options.mute,
        });
        readOnly(this, ["volume"]);
        this.mute = options.mute;
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            volume: 0,
            mute: false,
        });
    }
    /**
     * Mute the output.
     */
    get mute() {
        return this.volume.mute;
    }
    set mute(mute) {
        this.volume.mute = mute;
    }
    dispose() {
        super.dispose();
        this.input.dispose();
        this.volume.dispose();
        return this;
    }
}
