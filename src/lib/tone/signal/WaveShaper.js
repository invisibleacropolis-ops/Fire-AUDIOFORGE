import { optionsFromArguments } from "../core/util/Defaults.js";
import { isArray, isFunction } from "../core/util/Type.js";
import { SignalOperator } from "./SignalOperator.js";
/**
 * Wraps the native Web Audio API
 * [WaveShaperNode](http://webaudio.github.io/web-audio-api/#the-waveshapernode-interface).
 *
 * @example
 * import { Oscillator, WaveShaper } from "tone";
 * const osc = new Oscillator().toDestination().start();
 * // create a new waveshaper
 * const waveshaper = new WaveShaper(x => x * 2, 2048);
 * osc.connect(waveshaper);
 * @category Signal
 */
export class WaveShaper extends SignalOperator {
    constructor() {
        const options = optionsFromArguments(WaveShaper.getDefaults(), arguments, ["mapping", "length"]);
        super(options);
        this.name = "WaveShaper";
        /**
         * The waveshaper node
         */
        this._shaper = this.context.createWaveShaper();
        this.input = this.output = this._shaper;
        if (isArray(options.mapping) ||
            options.mapping instanceof Float32Array) {
            this.curve = options.mapping;
        }
        else if (isFunction(options.mapping)) {
            this.setMap(options.mapping, options.length);
        }
    }
    static getDefaults() {
        return Object.assign(SignalOperator.getDefaults(), {
            length: 1024,
        });
    }
    /**
     * Uses a mapping function to set the value of the curve.
     * @param mapping The function used to define the values.
     *                The mapping function should take two arguments:
     *                the first is the value at the current position
     *                and the second is the index of the value
     * @example
     * import { WaveShaper } from "tone";
     * const shaper = new WaveShaper();
     * shaper.setMap(x => Math.pow(x, 2));
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
     */
    get curve() {
        return this._shaper.curve;
    }
    set curve(mapping) {
        this._shaper.curve = mapping;
    }
    /**
     * Specifies what type of oversampling (if any) should be used when
     * applying the shaping curve. Can be "none", "2x", or "4x".
     */
    get oversample() {
        return this._shaper.oversample;
    }
    set oversample(oversampling) {
        if (["none", "2x", "4x"].indexOf(oversampling) !== -1) {
            this._shaper.oversample = oversampling;
        }
        else {
            throw new Error(`oversampling must be either 'none', '2x', or '4x'`);
        }
    }
    /**
     * clean up
     */
    dispose() {
        super.dispose();
        this._shaper.disconnect();
        return this;
    }
}
