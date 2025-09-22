import { __decorate } from "tslib";
import { Gain } from "../../core/context/Gain.js";
import { Param } from "../../core/context/Param.js";
import { ToneAudioNode } from "../../core/context/ToneAudioNode.js";
import { optionsFromArguments } from "../../core/util/Defaults.js";
import { readOnly } from "../../core/util/Interface.js";
import { Signal } from "../../signal/Signal.js";
import { isAudioParam } from "../../core/util/Type.js";
/**
 * Filter is a wrapper around the native Web Audio
 * [BiquadFilterNode](http://webaudio.github.io/web-audio-api/#the-biquadfilternode-interface).
 * A filter allows you to cut or boost certain frequencies of a sound.
 *
 * @param frequency The frequency of the filter.
 * @param type The type of the filter.
 * @param rolloff The drop-off of the filter in decibels/octave.
 * @example
 * const filter = new Filter(200, "highpass").toDestination();
 * const noise = new Noise().connect(filter).start();
 * @category Component
 */
export class Filter extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(Filter.getDefaults(), arguments, [
            "frequency",
            "type",
            "rolloff",
        ]);
        super(options);
        this.name = "Filter";
        this._filters = [];
        this.input = new Gain({ context: this.context });
        this.output = new Gain({ context: this.context });
        this.frequency = new Signal({
            context: this.context,
            value: options.frequency,
            units: "frequency",
        });
        this.detune = new Signal({
            context: this.context,
            value: options.detune,
            units: "cents",
        });
        this.gain = new Signal({
            context: this.context,
            value: options.gain,
            units: "decibels",
        });
        this.Q = new Signal({
            context: this.context,
            value: options.Q,
            units: "positive",
        });
        this.type = options.type;
        this.rolloff = options.rolloff;
        readOnly(this, ["frequency", "detune", "gain", "Q"]);
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            type: "lowpass",
            frequency: 350,
            rolloff: -12,
            Q: 1,
            gain: 0,
            detune: 0,
        });
    }
    /**
     * The type of the filter.
     */
    get type() {
        return this._type;
    }
    set type(type) {
        const matchingType = [
            "lowpass",
            "highpass",
            "bandpass",
            "lowshelf",
            "highshelf",
            "notch",
            "allpass",
            "peaking",
        ].find((t) => t === type);
        if (this.isUndef(matchingType)) {
            throw new Error(`Tone.Filter: '${type}' is not a valid filter type`);
        }
        this._type = type;
        this._filters.forEach((filter) => (filter.type = type));
    }
    /**
     * The rolloff of the filter which is the drop in db
     * per octave. Assumes that for each 12dBs, one additional filter is added.
     */
    get rolloff() {
        return this._rolloff;
    }
    set rolloff(rolloff) {
        const rolloffNum = Math.round(rolloff);
        const isSupported = [
            -12,
            -24,
            -48,
            -96,
        ].some((r) => r === rolloffNum);
        if (!isSupported) {
            throw new Error(`Tone.Filter: rolloff must be -12, -24, -48 or -96. Got: ${rolloffNum}`);
        }
        this._rolloff = rolloffNum;
        // first disconnect the filters and throw them away
        this.input.disconnect();
        this._filters.forEach((filter) => filter.disconnect());
        // make new filters
        const filterCount = this._rolloff / -12;
        this._filters = [];
        for (let i = 0; i < filterCount; i++) {
            const filter = this.context.createBiquadFilter();
            filter.type = this._type;
            this.frequency.connect(filter.frequency);
            this.detune.connect(filter.detune);
            this.Q.connect(filter.Q);
            this.gain.connect(filter.gain);
            this._filters[i] = filter;
        }
        // connect them up
        const connectionChain = [
            this.input,
            ...this._filters,
            this.output,
        ];
        this.chain(...connectionChain);
    }
    /**
     * Get the frequency response curve. This curve represents how the filter
     * responses to frequencies between 20hz-20khz.
     * @param len The number of values to return.
     * @return The frequency response curve.
     */
    getFrequencyResponse(len = this.context.sampleRate / 40) {
        const mag = new Float32Array(len);
        const phase = new Float32Array(len);
        const freq = new Float32Array(len);
        for (let i = 0; i < this._filters.length; i++) {
            const filter = this._filters[i];
            const responseFreq = new Float32Array(len);
            for (let i = 0; i < len; i++) {
                responseFreq[i] =
                    (this.context.sampleRate / 2) * Math.pow(i / len, 4);
            }
            const magResponse = new Float32Array(len);
            const phaseResponse = new Float32Array(len);
            filter.getFrequencyResponse(responseFreq, magResponse, phaseResponse);
            for (let j = 0; j < len; j++) {
                if (i === 0) {
                    mag[j] = magResponse[j];
                    phase[j] = phaseResponse[j];
                    freq[j] = responseFreq[j];
                }
                else {
                    // multiply the responses
                    const complex = this._magPhaseToComplex(mag[j], phase[j]);
                    const filterComplex = this._magPhaseToComplex(magResponse[j], phaseResponse[j]);
                    const mult = this._multiplyComplex(complex, filterComplex);
                    const newMagPhase = this._complexToMagPhase(mult);
                    mag[j] = newMagPhase.mag;
                    phase[j] = newMagPhase.phase;
                }
            }
        }
        return mag;
    }
    /**
     * multiply two complex numbers
     */
    _multiplyComplex(a, b) {
        return {
            real: a.real * b.real - a.imag * b.imag,
            imag: a.real * b.imag + a.imag * b.real,
        };
    }
    /**
     * convert magnitude and phase to a complex number
     */
    _magPhaseToComplex(mag, phase) {
        return {
            real: mag * Math.cos(phase),
            imag: mag * Math.sin(phase),
        };
    }
    /**
     * convert a complex number to magnitude and phase
     */
    _complexToMagPhase(complex) {
        return {
            mag: Math.sqrt(Math.pow(complex.real, 2) + Math.pow(complex.imag, 2)),
            phase: Math.atan2(complex.imag, complex.real),
        };
    }
    dispose() {
        super.dispose();
        this._filters.forEach((filter) => {
            filter.disconnect();
        });
        this.input.dispose();
        this.output.dispose();
        this.frequency.dispose();
        this.detune.dispose();
        this.Q.dispose();
        this.gain.dispose();
        return this;
    }
}
__decorate([
    isAudioParam
], Filter.prototype, "frequency", void 0);
__decorate([
    isAudioParam
], Filter.prototype, "detune", void 0);
__decorate([
    isAudioParam
], Filter.prototype, "gain", void 0);
__decorate([
    isAudioParam
], Filter.prototype, "Q", void 0);
