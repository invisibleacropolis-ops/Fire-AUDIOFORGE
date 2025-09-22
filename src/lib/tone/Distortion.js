
import { WaveShaper } from "tone/build/esm/signal/WaveShaper";
import { optionsFromArguments } from "tone/build/esm/core/util/Defaults";
import { readOnly } from "tone/build/esm/core/util/Interface";
import {
	Effect,
} from "tone/build/esm/effect/Effect";
/**
 * A simple distortion effect using a `WaveShaper` node.
 *
 * @example
 * const dist = new Distortion(0.8).toDestination();
 * const fm = new FMSynth().connect(dist);
 * fm.triggerAttackRelease("A1", "8n");
 * @category Effect
 */
export class Distortion extends Effect {
    constructor() {
        super(optionsFromArguments(Distortion.getDefaults(), arguments, ["distortion"]));
        this.name = "Distortion";
        const options = optionsFromArguments(Distortion.getDefaults(), arguments, ["distortion"]);
        this._shaper = new WaveShaper({
            context: this.context,
            length: 4096,
        });
        this.distortion = options.distortion;
        this.oversample = options.oversample;
        this.connectEffect(this._shaper);
        readOnly(this, ["distortion", "oversample"]);
    }
    static getDefaults() {
        return Object.assign(Effect.getDefaults(), {
            distortion: 0.4,
            oversample: "none",
        });
    }
    /**
     * The amount of distortion.
     */
    get distortion() {
        return this._distortion;
    }
    set distortion(amount) {
        this._distortion = amount;
        const k = amount * 100;
        const deg = Math.PI / 180;
        this._shaper.setMap(x => {
            if (Math.abs(x) < 0.001) {
                // should output 0 when input is 0
                return 0;
            }
            else {
                return (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
            }
        });
    }
    /**
     * The oversampling of the effect. Can either be "none", "2x" or "4x".
     */
    get oversample() {
        return this._shaper.oversample;
    }
    set oversample(oversampling) {
        this._shaper.oversample = oversampling;
    }
    dispose() {
        super.dispose();
        this._shaper.dispose();
        return this;
    }
}
