
import { ToneConstantSource } from "./ToneConstantSource.js";
import { optionsFromArguments } from "../core/util/Defaults.js";
import { readOnly } from "../core/util/Interface.js";
import { Signal } from "../signal/Signal.js";
import { Source } from "./Source.js";
/**
 * Oscillator is a source that starts at a given time and stops at a given time.
 * It's used internally by other classes to create signals.
 *
 * It is not possible to change the frequency of the oscillator only the amplitude.
 *
 * @example
 * const osc = new Oscillator(440, "sine").toDestination().start();
 * @category Source
 */
export class Oscillator extends Source {
    constructor() {
        const options = optionsFromArguments(Oscillator.getDefaults(), arguments, ["frequency", "type"]);
        super(options);
        this.name = "Oscillator";
        /**
         * the main oscillator
         */
        this._oscillator = this.context.createOscillator();
        this.type = options.type;
        this.frequency = new Signal({
            context: this.context,
            units: "frequency",
            value: options.frequency,
        });
        this.detune = new Signal({
            context: this.context,
            units: "cents",
            value: options.detune,
        });
        this.phase = options.phase;
        this.partials = options.partials;
        this.partialCount = options.partialCount;
        this.frequency.connect(this._oscillator.frequency);
        this.detune.connect(this._oscillator.detune);
        // connections
        this._oscillator.connect(this.output);
        readOnly(this, ["frequency", "detune"]);
    }
    static getDefaults() {
        return Object.assign(Source.getDefaults(), {
            detune: 0,
            frequency: 440,
            partialCount: 0,
            partials: [],
            phase: 0,
            type: "sine",
        });
    }
    /**
     * start the oscillator
     */
    _start(time) {
        const computedTime = this.toSeconds(time);
        // apply the partials
        if (this._wave) {
            this._oscillator.setPeriodicWave(this._wave);
        }
        // start the oscillator
        this._oscillator.start(computedTime);
    }
    /**
     * stop the oscillator
     */
    _stop(time) {
        const computedTime = this.toSeconds(time);
        this._oscillator.stop(computedTime);
    }
    _restart(time) {
        const computedTime = this.toSeconds(time);
        this._oscillator.cancelStop();
        this._oscillator.stop(computedTime);
        const newOsc = this.context.createOscillator();
        newOsc.set(this._oscillator);
        this._oscillator.disconnect();
        this._oscillator = newOsc;
        // connect the new oscillator
        this.frequency.connect(this._oscillator.frequency);
        this.detune.connect(this._oscillator.detune);
        this._oscillator.connect(this.output);
        this._oscillator.start(computedTime);
    }
    /**
     * Sync the signal to the transport signal position
     */
    syncFrequency() {
        this.context.transport.syncSignal(this.frequency);
        return this;
    }
    /**
     * Unsync the signal from the transport
     */
    unsyncFrequency() {
        this.context.transport.unsyncSignal(this.frequency);
        return this;
    }
    /**
     * The type of the oscillator: sine, square, sawtooth, triangle.
     * Or create a custom waveform by passing in an array of partials.
     * The value of the partials are relative to the fundamental frequency.
     * For example: `[1, 0.2, 0.01]` is the fundamental, followed by the
     * 2nd and 3rd harmonics, at 0.2 and 0.01 respectively.
     * A partial containing an array instead of a number will create a
     * detuned partial. The first number is the harmonic, the second is the amount
     * in cents to detune the partial.
     * @example
     * const osc = new Oscillator("sine").toDestination().start();
     * @example
     * // a square wave
     * const sq = new Oscillator({
     * 	type: "square",
     * 	frequency: 440
     * }).toDestination().start();
     * @example
     * // a custom wave
     * const custom = new Oscillator({
     * 	type: "custom",
     * 	partials: [2, 1, 2, 2]
     * }).toDestination().start();
     * @example
     * // a detuned partial
     * const harm = new Oscillator({
     * 	type: "custom",
     * 	partials: [
     * 		[4, 4],
     * 		[5, -4]
     * 	]
     * }).toDestination().start();
     */
    get type() {
        return this._type;
    }
    set type(type) {
        this._type = type;
        const isBasicType = ["sine", "square", "sawtooth", "triangle"].includes(type);
        if (this._phase === 0 && isBasicType) {
            this._oscillator.type = type;
            this._wave = undefined;
        }
        else {
            const real = new Float32Array(this._getRealImaginary("real", this._phase));
            const imag = new Float32Array(this._getRealImaginary("imag", this._phase));
            this._wave = this.context.createPeriodicWave(real, imag);
            this._oscillator.setPeriodicWave(this._wave);
        }
    }
    /**
     * Returns the real and imaginary components of the oscillator.
     * @param type
     * @param phase
     */
    _getRealImaginary(type, phase) {
        const fftSize = 4096;
        let periodicWaveSize = fftSize / 2;
        const real = new Float32Array(periodicWaveSize);
        const imag = new Float32Array(periodicWaveSize);
        let partialCount = 1;
        if (this._type === "custom") {
            partialCount = this.partials.length + 1;
            periodicWaveSize = partialCount;
        }
        else {
            const partial = /^(sine|square|sawtooth|triangle)(\d+)$/.exec(this._type);
            if (partial) {
                partialCount = parseInt(partial[2], 10) + 1;
                this._type = partial[1];
                periodicWaveSize = partialCount;
            }
        }
        if (this.partialCount !== 0) {
            partialCount = this.partialCount + 1;
            periodicWaveSize = partialCount;
        }
        for (let i = 1; i < periodicWaveSize; i++) {
            const realLong = new Float32Array(fftSize);
            const imagLong = new Float32Array(fftSize);
            const harmonic = i;
            if (this._type === "custom") {
                const partial = this.partials[i - 1];
                const magnitude = Array.isArray(partial) ? partial[0] : partial;
                const detune = Array.isArray(partial) ? partial[1] : 0;
                if (Math.abs(detune) > 0) {
                    // apply the detune
                    const originalFreq = this.frequency.value;
                    this.frequency.value *= 1 + this.intervalToFrequencyRatio(detune / 100);
                    // get the fft
                    const partialReal = this._getRealImaginary(this.type, phase);
                    const partialImag = this._getRealImaginary(this.type, phase);
                    // restore the frequency
                    this.frequency.value = originalFreq;
                    // combine the partials
                    for (let j = 0; j < partialReal.length; j++) {
                        real[j] += partialReal[j] * magnitude;
                        imag[j] += partialImag[j] * magnitude;
                    }
                }
                else {
                    const partialReal = this._getRealImaginary(this.type, phase);
                    const partialImag = this._getRealImaginary(this.type, phase);
                    for (let j = 0; j < partialReal.length; j++) {
                        real[j] += partialReal[j] * magnitude;
                        imag[j] += partialImag[j] * magnitude;
                    }
                }
            }
            else {
                // generate the complex fourier series
                if (this._type === "sine") {
                    if (harmonic === 1) {
                        imagLong[harmonic] = 1;
                    }
                }
                else if (this._type === "square") {
                    if (harmonic % 2 === 1) {
                        imagLong[harmonic] = 4 / (harmonic * Math.PI);
                    }
                }
                else if (this._type === "sawtooth") {
                    if (harmonic !== 0) {
                        imagLong[harmonic] = 2 * (Math.pow(-1, harmonic) / (harmonic * Math.PI));
                    }
                }
                else if (this._type === "triangle") {
                    if (harmonic % 2 === 1) {
                        realLong[harmonic] = (2 * (Math.pow(-1, (harmonic - 1) / 2))) / (Math.pow(harmonic, 2) * Math.pow(Math.PI, 2));
                    }
                }
            }
            if (phase !== 0) {
                // apply the phase rotation
                const angle = -phase * Math.PI / 180;
                const c = Math.cos(angle);
                const s = Math.sin(angle);
                const r = realLong[i];
                const im = imagLong[i];
                realLong[i] = r * c - im * s;
                imagLong[i] = r * s + im * c;
            }
            real[i] = realLong[i];
            imag[i] = imagLong[i];
        }
        if (type === "real") {
            return real;
        }
        else {
            return imag;
        }
    }
    /**
     * The phase of the oscillator in degrees.
     */
    get phase() {
        return this._phase;
    }
    set phase(phase) {
        this._phase = phase;
        this.type = this._type;
    }
    /**
     * The partials of the waveform. A partial is a harmonic and its amplitude.
     * A partial is an array of numbers, where the first number is the harmonic number,
     * and the second number is the amplitude.
     * If the partials are not specified, a default waveform is used.
     * The partials are relative to the fundamental frequency.
     * For example, `[1, 0.2, 0.01]` is the fundamental, followed by the
     * 2nd and 3rd harmonics, at 0.2 and 0.01 respectively.
     * A partial containing an array instead of a number will create a
     * detuned partial. The first number is the harmonic, the second is the amount
     * in cents to detune the partial.
     * @example
     * const osc = new Oscillator({
     * 	frequency: 220,
     * 	type: "custom",
     * 	partials: [
     * 		1,
     * 		[2, 0.1], // detune the second harmonic by 0.1 cents
     * 		0.5,
     * 		0.1
     * 	]
     * }).toDestination().start();
     */
    get partials() {
        if (this._type !== "custom") {
            return [];
        }
        else {
            return this._partials;
        }
    }
    set partials(partials) {
        this._partials = partials;
        if (partials.length > 0) {
            this.type = "custom";
        }
    }
    /**
     * The number of partials to use to generate the waveform.
     * This is an alternative to setting the partials directly.
     * The partials are generated using the formula `1/n` for the amplitude
     * of the nth partial.
     * @example
     * const osc = new Oscillator({
     * 	frequency: 220,
     * 	type: "sine",
     * 	partialCount: 3
     * }).toDestination().start();
     */
    get partialCount() {
        return this._partialCount;
    }
    set partialCount(p) {
        let type = this._type;
        const partial = /^(sine|square|sawtooth|triangle)(\d+)$/.exec(this._type);
        if (partial) {
            type = partial[1];
        }
        if (this._phase === 0) {
            this.type = type + p.toString();
        }
        else {
            this._partialCount = p;
            this.type = type;
        }
    }
    /**
     * Returns the value of the oscillator at the given time.
     * This is useful for knowing the value of the oscillator at a given time,
     * but is not sample-accurate.
     * @param time The time to get the value at.
     */
    getValueAtTime(time) {
        const computedTime = this.toSeconds(time);
        const freq = this.frequency.getValueAtTime(computedTime);
        const detune = this.detune.getValueAtTime(computedTime);
        const phase = this.phase;
        const phaseOffset = phase / 360;
        const value = this._oscillator.getPoint(computedTime, freq * Math.pow(2, detune / 1200), phaseOffset);
        return value;
    }
    /**
     * Make this oscillator a "fat" oscillator by creating multiple
     * oscillators with slight detunings. The number of oscillators
     * is determined by the `count` argument. The detune amount is
     * given by the `spread` argument.
     * @param count The number of oscillators to create.
     * @param spread The spread in cents.
     * @example
     * const fatOsc = new Oscillator(220, "sawtooth").toDestination().start();
     * fatOsc.spread = 20;
     * fatOsc.count = 3;
     */
    fatto(count) {
        if (this._fatz) {
            this._fatz.dispose();
            this._fatz = undefined;
        }
        if (count > 1) {
            this._fatz = new FatOscillator({
                context: this.context,
                count: count,
                spread: this.spread,
                type: this.type,
                phase: this.phase,
            });
            this._fatz.connect(this.output);
            this._oscillator.disconnect(this.output);
        }
    }
    get spread() {
        if (this._fatz) {
            return this._fatz.spread;
        }
        else {
            return 0;
        }
    }
    set spread(spread) {
        if (this._fatz) {
            this._fatz.spread = spread;
        }
    }
    get count() {
        if (this._fatz) {
            return this._fatz.count;
        }
        else {
            return 1;
        }
    }
    set count(count) {
        if (this._fatz) {
            this._fatz.count = count;
        }
        else if (count > 1) {
            this.fatto(count);
        }
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        if (this._wave) {
            this._wave = undefined;
        }
        this.frequency.dispose();
        this.detune.dispose();
        this._oscillator.disconnect();
        return this;
    }
}
