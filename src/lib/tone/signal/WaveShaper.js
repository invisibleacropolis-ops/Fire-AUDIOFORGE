
import { ToneAudioNode, } from "../core/context/ToneAudioNode.js";
import { optionsFromArguments } from "../core/util/Defaults.js";
/**
 * A signal shaper.
 *
 * @example
 * const shaper = new WaveShaper(x => Math.pow(x, 2));
 * @category Signal
 */
export class WaveShaper extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(WaveShaper.getDefaults(), arguments, ["mapping", "length"]);
        super(options);
        this.name = "WaveShaper";
        /**
         * The waveshaper node
         */
        this._shaper = this.context.createWaveShaper();
        /**
         * The input and output are the same connect.
         */
        this.input = this.output = this._shaper;
        if (options.length || options.mapping) {
            this.curve = this._shaper.curve = this._generateCurve(options.mapping, options.length);
        }
        this.oversample = options.oversample;
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            length: 1024,
            mapping: val => val,
            oversample: "none",
        });
    }
    /**
     * Uses a mapping function to set the value of the curve.
     * @param mapping The function used to define the values.
     *                The mapping function should take two arguments:
     *                the first is the value at the current position
     *                and the second is the array index.
     * @example
     * const shaper = new WaveShaper();
     * shaper.setMap((val, index) => {
     * 	// index is the position in array of `length`
     * 	// val is the value which corresponds to the index
     * 	return val * 2;
     * });
     */
    setMap(mapping, length = 1024) {
        const curve = new Float32Array(length);
        for (let i = 0, len = length; i < len; i++) {
            const normalized = (i / (len - 1)) * 2 - 1;
            curve[i] = mapping(normalized, i);
        }
        this.curve = curve;
        return this;
    }
    /**
     * The array of values defining the waveshaping curve.
     * For browsers that don't support wasm, the curve is limited to 1024 samples.
     */
    get curve() {
        return this._shaper.curve;
    }
    set curve(curve) {
        this._shaper.curve = curve;
    }
    /**
     * Specifies what type of oversampling (if any) should be used when
     * applying the shaping curve. Can be "none", "2x", or "4x".
     */
    get oversample() {
        return this._shaper.oversample;
    }
    set oversample(oversampling) {
        if (["none", "2x", "4x"].includes(oversampling)) {
            this._shaper.oversample = oversampling;
        }
        else {
            throw new Error("oversample can only be 'none', '2x', or '4x'");
        }
    }
    /**
     * Generate a curve with the given map function and length.
     */
    _generateCurve(mapping, length) {
        const curve = new Float32Array(length);
        for (let i = 0, len = length; i < len; i++) {
            const normalized = (i / (len - 1)) * 2 - 1;
            curve[i] = mapping(normalized, i);
        }
        return curve;
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this._shaper.disconnect();
        return this;
    }
}
