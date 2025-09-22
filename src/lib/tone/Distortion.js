import { __decorate } from "tslib";
import { WaveShaper } from "./component/channel/WaveShaper.js";
import { optionsFromArguments } from "./core/util/Defaults.js";
import { isNumber, isString } from "./core/util/Type.js";
import { Effect } from "./effect/Effect.js";
/**
 * Distortion is a simple distortion effect using a
 * {@link WaveShaper} to alter the input signal.
 *
 * @param distortion The amount of distortion (normal range is 0-1).
 *
 * @example
 * const dist = new Distortion(0.8).toDestination();
 * const fm = new FMSynth().connect(dist);
 * fm.triggerAttackRelease("A1", "8n");
 * @category Effect
 */
export class Distortion extends Effect {
    constructor() {
        const options = optionsFromArguments(Distortion.getDefaults(), arguments, ["distortion"]);
        super(options);
        this.name = "Distortion";
        this._shaper = new WaveShaper({
            context: this.context,
            length: 4096,
        });
        this._distortion = options.distortion;
        this.effectSend = this.effectReturn = this._shaper;
        this.distortion = options.distortion;
        this.oversample = options.oversample;
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
        const curveAmount = 100;
        const k = amount * curveAmount;
        const deg = Math.PI / 180;
        this._shaper.setCurve(Array.from(new Array(this._shaper.length)).map((_, i) => {
            if (this._shaper.length > 2) {
                const x = (i * 2) / (this._shaper.length - 1) - 1;
                return ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
            }
            else {
                return 0;
            }
        }));
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
__decorate([
    isNumber
], Distortion.prototype, "distortion", null);
__decorate([
    isString
], Distortion.prototype, "oversample", null);
