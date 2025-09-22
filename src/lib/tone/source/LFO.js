
import { Oscillator } from "./Oscillator.js";
import { optionsFromArguments } from "../core/util/Defaults.js";
import { Signal } from "../signal/Signal.js";
import { readOnly } from "../core/util/Interface.js";
import { Gain } from "../core/context/Gain.js";
import { ToneConstantSource } from "./ToneConstantSource.js";
import { AudioToGain } from "../signal/AudioToGain.js";
/**
 * LFO stands for low frequency oscillator. LFO produces an output signal
 * which can be attached to an AudioParam or Tone.Signal
 * in order to modulate that parameter with an audio signal.
 * The LFO can also be synchronized to the transport.
 *
 * @example
 * // a lfo which moves between 70 and 150
 * const lfo = new LFO(4, 70, 150);
 * lfo.start();
 * const amOsc = new AMOscillator(300, "square").toDestination().start();
 * // connect the lfo to the harmonicity
 * lfo.connect(amOsc.harmonicity);
 * @category Source
 */
export class LFO extends Oscillator {
    constructor() {
        const options = optionsFromArguments(LFO.getDefaults(), arguments, ["frequency", "min", "max"]);
        super(options);
        this.name = "LFO";
        /**
         * The carrier oscillator
         */
        this._oscillator = new Oscillator({
            context: this.context,
            frequency: this.frequency,
            type: this.type
        });
        this.frequency = this._oscillator.frequency;
        this.detune = this._oscillator.detune;
        /**
         * The amplitude of the LFO, which is connected to the output of the Oscillator
         */
        this.amplitude = this._oscillator.volume;
        /**
         * The output of the LFO is a signal instead of a plain oscillator
         */
        this._output = new Signal({
            context: this.context,
            units: options.units,
        });
        /**
         * A private placeholder for the units
         */
        this._units = options.units;
        /**
         * A constant source of 1.
         */
        this._one = new ToneConstantSource({
            context: this.context,
            offset: 1
        });
        /**
         * Convert the oscillator into a gain node instead of a source node.
         * This is because the LFO is going to be used to modulate a parameter.
         */
        this._a2g = new AudioToGain({ context: this.context });
        /**
         * The node which converts the audio ranges of the oscillator
         * to the min/max values of the LFO.
         */
        this._shiftAndScale = new Gain({
            context: this.context,
            gain: 0.5,
        });
        /**
         * The min value of the LFO.
         */
        this._min = this.toSeconds(options.min);
        /**
         * The max value of the LFO.
         */
        this._max = this.toSeconds(options.max);
        /**
         * The LFO's output value scales from the min to the max value
         * and is controlled by the LFO's amplitude
         */
        this.output = this._output;
        // connect it up
        this._oscillator.chain(this._a2g, this._shiftAndScale);
        this._one.connect(this._shiftAndScale.gain);
        this._shiftAndScale.connect(this._output);
        this.phase = options.phase;
        readOnly(this, ["amplitude", "frequency", "detune", "output"]);
    }
    static getDefaults() {
        return Object.assign(Oscillator.getDefaults(), {
            frequency: "4n",
            max: 1,
            min: 0,
            type: "sine",
        });
    }
    /**
     * Start the LFO.
     * @param time The time the LFO will start
     */
    start(time) {
        const computedTime = this.toSeconds(time);
        this._oscillator.start(computedTime);
        this._one.start(computedTime);
        return this;
    }
    /**
     * Stop the LFO.
     * @param time The time the LFO will stop
     */
    stop(time) {
        const computedTime = this.toSeconds(time);
        this._oscillator.stop(computedTime);
        this._one.stop(computedTime);
        return this;
    }
    /**
     * Sync the start/stop/pause to the transport
     * and the frequency to the transport's bpm
     * @example
     * const lfo = new LFO("8n", 400, 4000).toDestination();
     * lfo.sync().start(0);
     * // the LFO will start with the transport
     * Transport.start();
     */
    sync() {
        this._oscillator.sync();
        this._one.sync();
        return this;
    }
    /**
     * unsync the LFO from transport control
     */
    unsync() {
        this._oscillator.unsync();
        this._one.unsync();
        return this;
    }
    /**
     * The minimum output of the LFO.
     */
    get min() {
        return this._toUnits(this._min);
    }
    set min(min) {
        this._min = this.toSeconds(min);
        this._setRange();
    }
    /**
     * The maximum output of the LFO.
     */
    get max() {
        return this._toUnits(this._max);
    }
    set max(max) {
        this._max = this.toSeconds(max);
        this._setRange();
    }
    /**
     * The type of the oscillator: See {@link Oscillator.type}
     */
    get type() {
        return this._oscillator.type;
    }
    set type(type) {
        this._oscillator.type = type;
    }
    /**
     * The phase of the LFO.
     */
    get phase() {
        return this._oscillator.phase;
    }
    set phase(phase) {
        this._oscillator.phase = phase;
    }
    /**
     * The output units of the LFO.
     */
    get units() {
        return this._output.units;
    }
    /**
     * The output of the LFO, which is a signal.
     */
    connect(destination, outputNumber, inputNumber) {
        if (destination instanceof Param || destination instanceof AudioParam) {
            this._output.connect(destination, outputNumber, inputNumber);
        }
        else {
            super.connect(destination, outputNumber, inputNumber);
        }
        return this;
    }
    /**
     * Set the range of the LFO between min and max values.
     */
    _setRange() {
        this._shiftAndScale.gain.value = this._max - this._min;
        this._output.value = this._min;
    }
    /**
     * returns the signal value at the given time.
     * @param time
     */
    getValueAtTime(time) {
        const val = this._oscillator.getValueAtTime(time);
        const shifted = (val + 1) / 2;
        return shifted * (this._max - this._min) + this._min;
    }
    /**
     * Convert to the units of the LFO
     */
    _toUnits(val) {
        if (this.units === "decibels") {
            return this.gainToDb(val);
        }
        else {
            return val;
        }
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this._oscillator.dispose();
        this._output.dispose();
        this._a2g.dispose();
        this._one.dispose();
        this._shiftAndScale.dispose();
        return this;
    }
}
