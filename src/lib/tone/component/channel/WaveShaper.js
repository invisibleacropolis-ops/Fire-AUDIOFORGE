import { ToneAudioNode } from "../../core/context/ToneAudioNode.js";
import { optionsFromArguments } from "../../core/util/Defaults.js";
import { isArray, isFunction } from "../../core/util/Type.js";
/**
 * A waveshaper can be used to add distortion to a signal.
 *
 * @param mapping The function used to define the values.
 *                The mapping function should take two arguments:
 *                the first is the value at the current position
 *                and the second is the index of the value
 *                in the array.
 * @param length The length of the WaveShaper curve.
 * @example
 * const shaper = new WaveShaper(x => Math.pow(x, 3), 2048).toDestination();
 * const osc = new Oscillator().connect(shaper).start();
 * @category Component
 */
export class WaveShaper extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(WaveShaper.getDefaults(), arguments, ["mapping", "length"]);
        super(options);
        this.name = "WaveShaper";
        this._shaper = this.context.createWaveShaper();
        this.input = this._shaper;
        this.output = this._shaper;
        this._curve = null;
        if (isArray(options.mapping) ||
            options.mapping instanceof Float32Array) {
            this.curve = options.mapping;
        }
        else if (isFunction(options.mapping)) {
            this.setMap(options.mapping, options.length);
        }
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            length: 1024,
        });
    }
    /**
     * Uses a mapping function to set the value of the curve.
     * @param mapping The function used to define the values.
     *                The mapping function should take two arguments:
     *                the first is the value at the current position
     *                and the second is the index of the value
     * @param length The length of the WaveShaper curve.
     */
    setMap(mapping, length = 1024) {
        const curve = new Float32Array(length);
        for (let i = 0; i < length; i++) {
            const normalized = (i / (length - 1)) * 2 - 1;
            curve[i] = mapping(normalized, i);
        }
        this.curve = curve;
        return this;
    }
    /**
     * The array of values which define the waveshaping curve.
     * For browsers that don't support wasm, the curve is limited to 1024 samples.
     */
    get curve() {
        return this._shaper.curve;
    }
    set curve(mapping) {
        this._curve = mapping;
        this._shaper.curve = this._curve;
    }
    /**
     * Specifies what type of oversampling (if any) should be used when
     * applying the shaping curve. Can be "none", "2x", or "4x".
     */
    get oversample() {
        return this._shaper.oversample;
    }
    set oversample(oversampling) {
        if (["2x", "4x", "none"].includes(oversampling)) {
            this._shaper.oversample = oversampling;
        }
        else {
            throw new RangeError("Tone.WaveShaper: oversampling must be '2x', '4x', or 'none'");
        }
    }
    /**
     * The length of the shaping curve.
     */
    get length() {
        var _a;
        return (_a = this._curve) === null || _a === void 0 ? void 0 : _a.length;
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this._shaper.disconnect();
        this._curve = null;
        return this;
    }
}
