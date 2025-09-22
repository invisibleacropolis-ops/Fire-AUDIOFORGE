
import { Param } from "../../core/context/Param.js";
import { ToneAudioNode, } from "../../core/context/ToneAudioNode.js";
import { optionsFromArguments } from "../../core/util/Defaults.js";
import { readOnly } from "../../core/util/Interface.js";
/**
 * Filter is a wrapper around the Web Audio's [BiquadFilterNode](http://webaudio.github.io/web-audio-api/#the-biquadfilternode-interface).
 *
 * @example
 * const filter = new Filter(200, "highpass").toDestination();
 * const noise = new Noise().connect(filter).start();
 * @category Component
 */
export class Filter extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(Filter.getDefaults(), arguments, ["frequency", "type", "rolloff"]);
        super(options);
        this.name = "Filter";
        /**
         * The native BiquadFilterNode
         */
        this._filters = [];
        this.input = this._biquad = this.context.createBiquadFilter();
        this.output = this._biquad;
        this.frequency = new Param({
            context: this.context,
            param: this._biquad.frequency,
            units: "frequency",
            value: options.frequency,
        });
        this.detune = new Param({
            context: this.context,
            param: this._biquad.detune,
            units: "cents",
            value: options.detune,
        });
        this.gain = new Param({
            context: this.context,
            param: this._biquad.gain,
            units: "decibels",
            value: options.gain,
        });
        this.Q = new Param({
            context: this.context,
            param: this._biquad.Q,
            units: "positive",
            value: options.Q,
        });
        this._type = options.type;
        this.rolloff = options.rolloff;
        readOnly(this, ["detune", "frequency", "gain", "Q"]);
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            Q: 1,
            detune: 0,
            frequency: 350,
            gain: 0,
            rolloff: -12,
            type: "lowpass",
        });
    }
    /**
     * The type of the filter.
     */
    get type() {
        return this._type;
    }
    set type(type) {
        const isBiquad = [
            "lowpass",
            "highpass",
            "bandpass",
            "lowshelf",
            "highshelf",
            "notch",
            "allpass",
            "peaking",
        ].includes(type);
        if (isBiquad) {
            this._type = type;
            this._setRolloff(this.rolloff);
        }
    }
    /**
     * The rolloff of the filter which is the drop in db-per-octave.
     * At the moment, only `-12` and `-24` and `-48` and `-96` are supported.
     * Steeper rolloffs are created by cascading multiple filters
     */
    get rolloff() {
        return this._rolloff;
    }
    set rolloff(rolloff) {
        this._rolloff = rolloff;
        this._setRolloff(this.rolloff);
    }
    /**
     * Set the rolloff of the filter
     */
    _setRolloff(rolloff) {
        const isBiquad = this._type !== "lowpass" && this._type !== "highpass";
        const cascadingCount = Math.log2(Math.abs(rolloff) / 12) + 1;
        if (isBiquad || cascadingCount % 1 > 0) {
            // not a supported rolloff value
            return;
        }
        // disconnect the previous filters
        this.input.disconnect();
        this._filters.forEach(filter => filter.disconnect());
        // make new filters
        this._filters = [];
        for (let i = 0; i < cascadingCount; i++) {
            const filter = this.context.createBiquadFilter();
            filter.type = this._type;
            this.frequency.connect(filter.frequency);
            this.detune.connect(filter.detune);
            this.Q.connect(filter.Q);
            this.gain.connect(filter.gain);
            this._filters.push(filter);
        }
        // connect them up
        this._filters.forEach((filter, i) => {
            if (i === 0) {
                this.input.connect(filter);
            }
            else {
                this._filters[i - 1].connect(filter);
            }
        });
        this._filters[this._filters.length - 1].connect(this.output);
        this._biquad = this._filters[0];
    }
    /**
     * Get the frequency response curve. This method returns values in decibels.
     * The frequencies are distributed logarithmically.
     * @param len The number of points to return
     */
    getFrequencyResponse(len = 64) {
        const magResponse = new Float32Array(len);
        const phaseResponse = new Float32Array(len);
        const freqValues = new Float32Array(len);
        // start with the first filter
        const filter = this._biquad;
        // set the frequency values
        const minFreq = 10;
        const maxFreq = this.context.sampleRate / 2;
        for (let i = 0; i < len; i++) {
            const linearRange = i / (len - 1);
            const logRange = Math.pow(10, linearRange);
            freqValues[i] = minFreq * logRange;
        }
        filter.getFrequencyResponse(freqValues, magResponse, phaseResponse);
        // process the other filters in the chain
        for (let i = 1; i < this._filters.length; i++) {
            const tempMag = new Float32Array(len);
            this._filters[i].getFrequencyResponse(freqValues, tempMag, phaseResponse);
            // multiply the responses
            for (let j = 0; j < len; j++) {
                magResponse[j] *= tempMag[j];
            }
        }
        // convert it to db
        for (let i = 0; i < magResponse.length; i++) {
            magResponse[i] = 20 * Math.log10(magResponse[i]);
        }
        return magResponse;
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this._filters.forEach(filter => {
            filter.disconnect();
        });
        this.frequency.dispose();
        this.detune.dispose();
        this.gain.dispose();
        this.Q.dispose();
        return this;
    }
}
