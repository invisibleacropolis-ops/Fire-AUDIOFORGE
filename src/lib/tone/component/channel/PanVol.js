import { Gain } from "../../core/context/Gain.js";
import { Param } from "../../core/context/Param.js";
import { ToneAudioNode } from "../../core/context/ToneAudioNode.js";
import { optionsFromArguments } from "../../core/util/Defaults.js";
import { readOnly } from "../../core/util/Interface.js";
import { Panner } from "./Panner.js";
import { Solo } from "./Solo.js";
import { Volume } from "./Volume.js";
/**
 * PanVol is a Tone-style stereo panner and volume controller.
 * @example
 * // pan the input signal hard right and reduce the volume by 12dB
 * const panVol = new PanVol(-1, -12).toDestination();
 * const osc = new Oscillator().connect(panVol).start();
 * @category Component
 */
export class PanVol extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(PanVol.getDefaults(), arguments, [
            "pan",
            "volume",
        ]);
        super(options);
        this.name = "PanVol";
        this._panner = this.input = new Panner({
            context: this.context,
            pan: options.pan,
        });
        this.pan = this._panner.pan;
        this._volume = this.output = new Volume({
            context: this.context,
            volume: options.volume,
        });
        this.volume = this._volume.volume;
        this._solo = new Solo({
            context: this.context,
            solo: options.solo,
        });
        // connections
        this._panner.connect(this._volume);
        this._volume.connect(this._solo);
        this._solo.connect(this.output);
        this.mute = options.mute;
        readOnly(this, ["pan", "volume"]);
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            pan: 0,
            volume: 0,
            mute: false,
            solo: false,
        });
    }
    /**
     * Mute/unmute the volume
     */
    get mute() {
        return this._solo.mute;
    }
    set mute(mute) {
        this._solo.mute = mute;
    }
    /**
     * The solo state of the channel.
     */
    get solo() {
        return this._solo.solo;
    }
    set solo(solo) {
        this._solo.solo = solo;
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this._panner.dispose();
        this.pan.dispose();
        this._volume.dispose();
        this.volume.dispose();
        this._solo.dispose();
        return this;
    }
}
