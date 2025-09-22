import { __decorate } from "tslib";
import { optionsFromArguments } from "../../core/util/Defaults.js";
import { isString } from "../../core/util/Type.js";
import { Analyser } from "./Analyser.js";
import { Frequency } from "../../core/type/Frequency.js";
/**
 * FFT is a wrapper around the native Web Audio's
 * {@link AnalyserNode}. It is used for Frequency-domain analysis.
 *
 * @param smoothing The averaging constant with the last frame.
 * @example
 * const fft = new FFT(32);
 * const synth = new FMSynth().connect(fft);
 * synth.triggerAttackRelease("C4", "8n");
 * const fftValues = fft.getValue();
 * @category Component
 */
export class FFT extends Analyser {
    constructor() {
        const options = optionsFromArguments(FFT.getDefaults(), arguments, [
            "smoothing",
        ]);
        super(options);
        this.name = "FFT";
        this.type = "fft";
        const fftSize = this._analyser.frequencyBinCount;
        this._octaveResolution = Math.log2(this.context.sampleRate / fftSize);
        this._frequency = new Float32Array(fftSize);
        this._analyser.getFloatFrequencyData(this._frequency);
        this._normalRange = options.normalRange;
        this.smoothing = options.smoothing;
    }
    static getDefaults() {
        return Object.assign(Analyser.getDefaults(), {
            smoothing: 0.8,
            normalRange: false,
        });
    }
    /**
     * Runs the analysis and returns the results as a Float32Array.
     */
    run() {
        this._analyser.getFloatFrequencyData(this._frequency);
        return this._frequency;
    }
    /**
     * The smoothing factor determines the speed at which the signal is averaged with the previous one.
     */
    get smoothing() {
        return this._analyser.smoothingTimeConstant;
    }
    set smoothing(val) {
        this._analyser.smoothingTimeConstant = val;
    }
    /**
     * A flag to return the results in a normal range (0-1) or not (Db).
     */
    get normalRange() {
        return this._normalRange;
    }
    set normalRange(val) {
        this._normalRange = val;
    }
    /**
     * Returns the frequency value in db at the given frequency.
     * @param  frequency The frequency to query.
     * @param  db      If true, returns the value in decibels, otherwise returns the normal range (0-1)
     */
    getFrequencyOf(frequency, db = !this._normalRange) {
        const freq = this.toFrequency(frequency);
        const fftSize = this._analyser.frequencyBinCount;
        const nyquist = this.context.sampleRate / 2;
        // check if the frequency is out of the range
        if (freq > nyquist) {
            return -Infinity;
        }
        const index = Math.round((freq / nyquist) * fftSize);
        const value = this._frequency[index];
        if (db) {
            return value;
        }
        else {
            return this.dbToGain(value);
        }
    }
    /**
     * Returns the octave resolution of the FFT, i.e. how many frequency bins are there per octave.
     */
    get octaveResolution() {
        return this._octaveResolution;
    }
    /**
     * Returns the Float32Array of frequency values.
     * @param  db      If true, returns the value in decibels, otherwise returns the normal range (0-1)
     * @param  octaveResolution The number of bins per octave at which to output the data.
     *                          Defaults to the native bin resolution of the FFT.
     */
    getValue(db = !this._normalRange, octaveResolution) {
        const freqData = this.run();
        // scale it to the output range
        let ret;
        if (!db) {
            ret = new Float32Array(freqData.length);
            for (let i = 0; i < freqData.length; i++) {
                ret[i] = this.dbToGain(freqData[i]);
            }
        }
        else {
            ret = freqData;
        }
        if (octaveResolution) {
            return this.getOctaveBands(octaveResolution, ret);
        }
        else {
            return ret;
        }
    }
    /**
     * Groups the output of {@link getValue} into octave bands of the given resolution.
     * This is useful for data visualization.
     * @param  octaveResolution The number of bins per octave
     * @param  values The array of values to group into octave bands
     */
    getOctaveBands(octaveResolution, values) {
        const bands = Math.ceil(this.octaveResolution * octaveResolution);
        const fftSize = this.size;
        const ret = new Float32Array(bands);
        let lastFrequency = 0;
        let nextFrequency = 0;
        let lastBin = 0;
        let nextBin = 0;
        for (let i = 0; i < bands; i++) {
            let val = 0;
            const freq = Frequency.mtof(Frequency.ftom(20) + (i / octaveResolution));
            nextFrequency = freq;
            nextBin = Math.floor((nextFrequency / (this.context.sampleRate / 2)) * fftSize);
            for (let j = lastBin; j < nextBin; j++) {
                val = Math.max(val, values[j]);
            }
            ret[i] = val;
            lastBin = nextBin;
            lastFrequency = nextFrequency;
        }
        return ret;
    }
}
__decorate([
    isString
], FFT.prototype, "type", void 0);
