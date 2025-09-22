
import { Param } from "../core/context/Param.js";
import { optionsFromArguments } from "../core/util/Defaults.js";
import { WaveShaper } from "./WaveShaper.js";
import { Gain } from "../core/context/Gain.js";
import { readOnly } from "../core/util/Interface.js";
/**
 * Signal is a core component which allows for sample-accurate scheduling
 * of globals changes. It is used extensively throughout the library. Signals
 * can be scheduled with all of the functions available on {@link Param}.
 *
 * Signals are not a source of audio like {@link Oscillator} but are used
 * to control other nodes, for example, in modulating the frequency of
 * an Oscillator.
 *
 * The signal can also be set directly, but this will cause a rewrite of all
 * previously scheduled automation.
 *
 * @example
 * const signal = new Signal(1);
 * const osc = new Oscillator(440, "sine").toDestination().start();
 * //the signal will be used to modulate the frequency of the oscillator
 * signal.connect(osc.frequency);
 * //start at 1, ramp to 0 over 3 seconds
 * signal.setValueAtTime(1, 0);
 * signal.linearRampToValueAtTime(0, 3);
 * @category Signal
 */
export class Signal extends WaveShaper {
    constructor() {
        const options = optionsFromArguments(Signal.getDefaults(), arguments, ["value", "units"]);
        super({
            context: options.context,
            length: 1,
        });
        this.name = "Signal";
        /**
         * When true, the signal value will be converted to the units when being set and gotten.
         */
        this.convert = true;
        this.output = this._outputGain = new Gain({
            context: this.context,
            gain: 0,
        });
        this._constantSource = this.input = new Param({
            context: this.context,
            convert: options.convert,
            param: this._outputGain.gain,
            units: options.units,
            value: options.value,
        });
        this.param = this._constantSource;
        readOnly(this, ["param", "value"]);
    }
    static getDefaults() {
        return Object.assign(WaveShaper.getDefaults(), {
            convert: true,
            units: "number",
            value: 0,
        });
    }
    //-------------------------------------
    // ABSTRACT SYNTH INTERFACE
    // all of these methods are stubs that are otherwise available on Param
    // but are not available on the WaveShaper.
    //-------------------------------------
    setValueAtTime(value, time) {
        this.param.setValueAtTime(value, time);
        return this;
    }
    getValueAtTime(time) {
        return this.param.getValueAtTime(time);
    }
    linearRampToValueAtTime(value, time) {
        this.param.linearRampToValueAtTime(value, time);
        return this;
    }
    exponentialRampToValueAtTime(value, time) {
        this.param.exponentialRampToValueAtTime(value, time);
        return this;
    }
    exponentialRampTo(value, rampTime, startTime) {
        this.param.exponentialRampTo(value, rampTime, startTime);
        return this;
    }
    linearRampTo(value, rampTime, startTime) {
        this.param.linearRampTo(value, rampTime, startTime);
        return this;
    }
    setTargetAtTime(value, startTime, timeConstant) {
        this.param.setTargetAtTime(value, startTime, timeConstant);
        return this;
    }
    setRampPoint(time) {
        this.param.setRampPoint(time);
        return this;
    }
    cancelScheduledValues(time) {
        this.param.cancelScheduledValues(time);
        return this;
    }
    cancelAndHoldAtTime(time) {
        this.param.cancelAndHoldAtTime(time);
        return this;
    }
    rampTo(value, rampTime, startTime) {
        this.param.rampTo(value, rampTime, startTime);
        return this;
    }
    /**
     * The current value of the signal.
     */
    get value() {
        return this.param.value;
    }
    set value(value) {
        this.param.value = value;
    }
    /**
     * The units of the signal.
     */
    get units() {
        return this.param.units;
    }
    /**
     * When true, the signal value will be converted to the units when being set and gotten.
     */
    get convert() {
        return this.param.convert;
    }
    set convert(convert) {
        this.param.convert = convert;
    }
    /**
     * @see {@link Param.connect}
     */
    connect(destination, outputNum = 0, inputNum = 0) {
        this._outputGain.connect(destination, outputNum, inputNum);
        return this;
    }
    /**
     * @see {@link Param.disconnect}
     */
    disconnect(destination, outputNum, inputNum) {
        this._outputGain.disconnect(destination, outputNum, inputNum);
        return this;
    }
    dispose() {
        super.dispose();
        this._constantSource.dispose();
        this._outputGain.dispose();
        return this;
    }
}
