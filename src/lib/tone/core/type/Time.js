import { TimeBase } from "./TimeBase.js";
import { optionsFromArguments } from "../util/Defaults.js";
import { isString } from "../util/Type.js";
/**
 * Time is a primitive type for encoding Time values.
 * Time can be passed into the constructor as a number or a string.
 * The string must be a number with a time unit appended to the end,
 * or a transport-relative value.
 * @example
 * import { Time } from "tone";
 * const time = new Time("4n"); // a quarter note
 * @category Unit
 */
export class Time extends TimeBase {
    constructor() {
        const options = optionsFromArguments(Time.getDefaults(), arguments, [
            "value",
            "units",
        ]);
        super(options);
        this.name = "Time";
        this.units = "s";
        this._val = this._fromType(options.value);
        this.units = options.units;
    }
    /**
     * The value as a number.
     */
    get value() {
        return this._val;
    }
    set value(val) {
        this._val = val;
    }
    /**
     * Quantize the time by the given subdivision. Optionally add a
     * percentage which will move the time value towards the ideal
     * quantized subdivision by that percentage.
     * @param  subdivision  The subdivision to quantize to
     * @param  percent  Move the time value towards the quantized subdivision by a percentage.
     * @return  A new Time object.
     * @example
     * import { Time } from "tone";
     * const time = new Time("4n + 4t");
     * time.quantize("4n"); // "4n"
     * time.quantize("4n", 0.5); // "4n + 8t"
     */
    quantize(subdivision, percent = 1) {
        const subdivisionTime = this.toSeconds(subdivision);
        const whole = Math.round(this.value / subdivisionTime);
        const remainder = this.value - whole * subdivisionTime;
        const newTime = this.value - remainder * percent;
        return new Time(newTime);
    }
    //-------------------------------------
    // CONVERSIONS
    //-------------------------------------
    /**
     * Return the time in seconds.
     */
    toSeconds() {
        return this.value;
    }
    /**
     * Return the time in hertz.
     */
    toFrequency() {
        return 1 / this.value;
    }
    /**
     * Return the time as a midi note.
     */
    toMidi() {
        return Math.log2(this.value / 440) * 12 + 69;
    }
    /**
     * Return the time in samples.
     */
    toSamples() {
        return this.value * this.context.sampleRate;
    }
    /**
     * Return the time in ticks.
     */
    toTicks() {
        const quarterTime = this._beatsToUnits(1);
        const quarters = this.value / quarterTime;
        return Math.round(quarters * this._ppq);
    }
    //-------------------------------------
    // FROM
    //-------------------------------------
    /**
     * @hidden
     */
    _fromType(val) {
        if (val instanceof Time) {
            return val.valueOf();
        }
        else if (isString(val) && val.trim() in Time.timeExpressions) {
            return Time.timeExpressions[val.trim()];
        }
        else {
            return super._fromType(val);
        }
    }
    /**
     * All of the time expressions.
     */
    static get timeExpressions() {
        return {
            "1m": 1,
            "1n": 1,
            "2n": 0.5,
            "4n": 0.25,
            "8n": 0.125,
            "16n": 0.0625,
            "32n": 0.03125,
            "64n": 0.015625,
            "128n": 0.0078125,
            "1t": 2 / 3,
            "2t": 1 / 3,
            "4t": 1 / 6,
            "8t": 1 / 12,
            "16t": 1 / 24,
            "32t": 1 / 48,
            "64t": 1 / 96,
            "0": 0,
        };
    }
}
