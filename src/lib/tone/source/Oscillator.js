import { __decorate } from "tslib";
import { optionsFromArguments } from "../core/util/Defaults.js";
import { readOnly } from "../core/util/Interface.js";
import { isArray, isNumber, isString } from "../core/util/Type.js";
import { Source } from "./Source.js";
import { Signal } from "../signal/Signal.js";
import { Gain } from "../core/context/Gain.js";
import { onContextInit, onContextClose } from "../core/context/Context.js";
/**
 * Oscillator is a source that produces a periodic waveform. It is the
 * basic building block of many synthesizers.
 *
 * @param frequency The frequency of the oscillator in hertz.
 * @param type The type of the waveform.
 * @example
 * import { Oscillator } from "tone";
 * const osc = new Oscillator(440, "sine").toDestination().start();
 * @category Source
 */
export class Oscillator extends Source {
    constructor() {
        const options = optionsFromArguments(Oscillator.getDefaults(), arguments, ["frequency", "type"]);
        super(options);
        this.name = "Oscillator";
        this.type = options.type;
        this.phase = options.phase;
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
        this.partials = options.partials;
        this.partialCount = options.partialCount;
        // connections
        this._oscillator = null;
        this._output = new Gain({ context: this.context });
        this.output = this._output;
        this._volume = this.output.gain;
        this.volume = options.volume;
        readOnly(this, ["frequency", "detune", "volume"]);
    }
    static getDefaults() {
        return Object.assign(Source.getDefaults(), {
            detune: 0,
            frequency: 440,
            phase: 0,
            partials: [],
            partialCount: 0,
            type: "sine",
            volume: 0,
        });
    }
    /**
     * start the oscillator
     * @param  time
     */
    _start(time) {
        const computedTime = this.toSeconds(time);
        // new oscillator with previous values
        this._oscillator = this.context.createOscillator();
        this._oscillator.type = this.type;
        this._oscillator.frequency.value = this.frequency.value;
        this._oscillator.detune.value = this.detune.value;
        // connect the control signal to the oscillator
        this.frequency.connect(this._oscillator.frequency);
        this.detune.connect(this._oscillator.detune);
        // start the oscillator
        this._oscillator.start(computedTime);
        // connect it to the output
        this._oscillator.connect(this.output);
        // set the values that cannot be scheduled
        this.phase = this.phase;
        this.partials = this.partials;
        // if there is a stop scheduled, reschedule it
        const stopEvent = this._state.get(computedTime);
        if (stopEvent && stopEvent.state === "stopped") {
            this.stop(stopEvent.time);
        }
    }
    /**
     * stop the oscillator
     * @param  time
     */
    _stop(time) {
        if (this._oscillator) {
            const computedTime = this.toSeconds(time);
            this._oscillator.stop(computedTime);
        }
    }
    /**
     * restart the oscillator
     */
    _restart(time) {
        if (this._oscillator) {
            this._oscillator.cancelStop();
        }
        this._state.cancel(time);
        return this;
    }
    /**
     * The type of the oscillator. Can be set to "sine", "triangle", "sawtooth", "square", "custom".
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode/type|OscillatorNode:type}
     * @example
     * import { Oscillator } from "tone";
     * const osc = new Oscillator().toDestination().start();
     * osc.type = "square";
     */
    get type() {
        return this._type;
    }
    set type(type) {
        this._type = type;
        const isBasicType = [
            "sine",
            "square",
            "sawtooth",
            "triangle",
        ].includes(type);
        if (this.partialCount === 0 && isBasicType) {
            this.partials = [];
        }
        else if (this.partialCount > 0 && !isBasicType) {
            // if it's a custom type, but the partials have not been set
            if (this.partials.length === 0) {
                switch (type) {
                    case "custom":
                        this.partials = [1];
                        break;
                    case "fat-sine":
                        this.partials = [1, 0.2, 0.01];
                        break;
                    case "fat-triangle":
                        this.partials = [1, 0, 0.2, 0, 0.01];
                        break;
                    case "fat-square":
                        this.partials = [
                            1, 0, 0.2, 0, 0.01, 0, 0.001, 0, 0.0001,
                        ];
                        break;
                    case "fat-sawtooth":
                        this.partials = [
                            1, 0.2, 0.01, 0.001, 0.0001, 0.00001,
                        ];
                        break;
                    case "pulse":
                        this.partials = [
                            1, 0.2, 0.01, 0.001, 0.0001, 0.00001,
                        ];
                        break;
                    case "saw":
                        this.partials = [
                            1, 0, 0.2, 0, 0.01, 0, 0.001, 0, 0.0001,
                        ];
                        break;
                }
            }
        }
        if (this._oscillator) {
            this._oscillator.type = type;
        }
    }
    /**
     * The phase of the oscillator in degrees.
     * @example
     * import { Oscillator } from "tone";
     * const osc = new Oscillator({
     * 	frequency: 220,
     * 	phase: 90, // 90 degrees out of phase
     * }).toDestination().start();
     */
    get phase() {
        return this._phase;
    }
    set phase(phase) {
        this._phase = phase;
        if (this._oscillator) {
            this._oscillator.phase = this._phase;
        }
    }
    /**
     * The partials of the waveform. A partial is a harmonic which is a multiple of the fundamental frequency.
     * The first harmonic is the fundamental frequency, the second is 2 times the fundamental, the third is 3 times, etc.
     * If the partials are not given, the default waveform is used.
     * Does not affect "sine", "square", "sawtooth", or "triangle".
     * @example
     * import { Oscillator } from "tone";
     * const osc = new Oscillator({
     * 	frequency: 220,
     * 	// a sine wave with the first and third harmonics
     * 	partials: [1, 0, 0.5],
     * }).toDestination().start();
     */
    get partials() {
        return this._partials;
    }
    set partials(partials) {
        this._partials = partials;
        if (this._oscillator && this.type !== "custom") {
            this._oscillator.partials = this._partials;
        }
        else {
            this.type = "custom";
        }
    }
    /**
     * The number of partials to use for the waveform.
     * A partial is a harmonic which is a multiple of the fundamental frequency.
     * The first harmonic is the fundamental frequency, the second is 2 times the fundamental, the third is 3 times, etc.
     * If the partials are not given, the default waveform is used.
     * Does not affect "sine", "square", "sawtooth", or "triangle".
     * @example
     * import { Oscillator } from "tone";
     * const osc = new Oscillator({
     * 	frequency: 220,
     * 	partialCount: 2, // a square wave with 2 harmonics
     * }).toDestination().start();
     */
    get partialCount() {
        return this._partialCount;
    }
    set partialCount(p) {
        this._partialCount = p;
        if (p > 0 && this.type !== "custom") {
            const partials = new Array(p).fill(0);
            partials[0] = 1;
            this.partials = partials;
        }
    }
    /**
     * Returns the real and imaginary components of the periodic waveform.
     * @returns
     */
    asArray(length = 1024) {
        return this.context.getPeriodicWave(this.type, this.phase, length);
    }
    dispose() {
        super.dispose();
        if (this._oscillator) {
            this._oscillator.disconnect();
            this._oscillator.stop(0);
        }
        this.frequency.dispose();
        this.detune.dispose();
        this.volume.dispose();
        this._output.dispose();
        return this;
    }
}
__decorate([
    isString
], Oscillator.prototype, "type", null);
__decorate([
    isNumber
], Oscillator.prototype, "phase", null);
__decorate([
    isArray
], Oscillator.prototype, "partials", null);
__decorate([
    isNumber
], Oscillator.prototype, "partialCount", null);
onContextInit((context) => {
    //
});
onContextClose((context) => {
    //
});
