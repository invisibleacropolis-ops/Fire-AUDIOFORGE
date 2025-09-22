import { getContext } from "../context/Context.js";
import { optionsFromArguments } from "../util/Defaults.js";
import { isNumber, isString, isUndef } from "../util/Type.js";
/**
 * The base class for all time classes.
 */
export class TimeBase {
    constructor() {
        const options = optionsFromArguments(TimeBase.getDefaults(), arguments, [
            "value",
            "units",
        ]);
        this.context = options.context;
        // set the value
        this._val = this._fromType(options.value);
        // set the units
        this.units = options.units;
    }
    static getDefaults() {
        return {
            context: getContext(),
            units: "s",
        };
    }
    /**
     * The value of the units
     */
    get value() {
        return this._val;
    }
    set value(val) {
        this._val = val;
    }
    /**
     * The units of the value.
     */
    get units() {
        return this._units;
    }
    set units(units) {
        // convert the value to the new units
        this._val = this._toUnits(this.valueOf(), units);
        this._units = units;
    }
    /**
     * The default units of the type
     */
    get defaultUnits() {
        return "s";
    }
    /**
     * All of the conversion expressions that can be passed into the constructor
     */
    get expressions() {
        return {
            n: this._notationToUnits.bind(this),
            t: this._tripletToUnits.bind(this),
            i: this._ticksToUnits.bind(this),
            hz: this._frequencyToUnits.bind(this),
            s: this._secondsToUnits.bind(this),
            ms: this._secondsToUnits.bind(this),
            tr: this._transportTimeToUnits.bind(this),
        };
    }
    /**
     * The value in seconds
     */
    valueOf() {
        return this._toUnits(this._val, "s");
    }
    /**
     * Return the value in the default units
     */
    toString() {
        return `${this._val}${this.units}`;
    }
    /**
     * Return the value in seconds
     */
    toSeconds() {
        return this.valueOf();
    }
    /**
     * Return the value in hertz
     */
    toFrequency() {
        return 1 / this.valueOf();
    }
    /**
     * Return the value in ticks
     */
    toTicks() {
        return this._fromUnits(this.valueOf(), "i");
    }
    /**
     * Return the value in samples
     */
    toSamples() {
        return this.valueOf() * this.context.sampleRate;
    }
    /**
     * Return the value as a notation string
     */
    toNotation() {
        return this._secondsToNotation(this.valueOf());
    }
    /**
     * co-erce a time either from a Time object or a number
     */
    _fromType(val) {
        if (isUndef(val)) {
            return this._now();
        }
        else if (val instanceof TimeBase) {
            return val.valueOf();
        }
        else if (isString(val)) {
            return this._fromString(val);
        }
        else if (isNumber(val)) {
            return val;
        }
        else {
            return 0;
        }
    }
    /**
     * Units to seconds
     */
    _fromUnits(val, units) {
        return this._fromType(val.toString() + units);
    }
    /**
     * Convert from a string to the base units
     */
    _fromString(val) {
        const numeric = val.match(/(-?\d*\.?\d+)/);
        if (numeric) {
            const num = parseFloat(numeric[1]);
            const units = val.match(/([a-z]+)/i);
            if (units) {
                const unit = units[1].toLowerCase();
                const expression = this.expressions[unit];
                if (expression) {
                    return expression(num);
                }
            }
            // if no units, assume it's the default units
            return this._fromUnits(num, this.defaultUnits);
        }
        else {
            // no numeric value, so maybe it's a notation value
            return this._notationToUnits(val);
        }
    }
    /**
     * The current time in the base units
     */
    _now() {
        return this.toSeconds();
    }
    /**
     * Convert the value into the specified units
     */
    _toUnits(val, units) {
        return val;
    }
    /**
     * Returns the value of a number in the current units
     */
    _frequencyToUnits(freq) {
        return 1 / freq;
    }
    /**
     * Return the value of the beats in the current units
     */
    _beatsToUnits(beats) {
        return (60 / this._getBpm()) * beats;
    }
    /**
     * Returns the value of a tick in the current time units
     */
    _ticksToUnits(ticks) {
        return (ticks * (this._beatsToUnits(1) / this._ppq));
    }
    /**
     * Return the value of the seconds in the current units
     */
    _secondsToUnits(seconds) {
        return seconds;
    }
    /**
     * Return the value of a transport time without the tempo scaling.
     */
    _transportTimeToUnits(transportTime) {
        const seconds = this.toSeconds(transportTime);
        return this._secondsToUnits(seconds);
    }
    _notationToUnits(notation) {
        const subdivision = parseInt(notation, 10);
        let beats = 0;
        if (subdivision === 0) {
            beats = 0;
        }
        const last = notation.slice(-1);
        if (last === "t") {
            beats = (4 / subdivision) * 2 / 3;
        }
        else if (last === "n") {
            beats = 4 / subdivision;
        }
        else {
            beats = 4 / subdivision;
        }
        return this._beatsToUnits(beats);
    }
    /**
     * Convert a triplet notation to beats.
     */
    _tripletToUnits(triplets) {
        return this._beatsToUnits(triplets * 2 / 3);
    }
    /**
     * Convert from seconds to notation.
     */
    _secondsToNotation(seconds) {
        const quarterLen = this._beatsToUnits(1);
        const quarters = seconds / quarterLen;
        const subdivision = 4 / quarters;
        if (subdivision > 1) {
            // round to the nearest subdivision
            const rounded = Math.round(subdivision);
            // check for triplet
            const remainder = subdivision - rounded;
            if (Math.abs(remainder) > 0.1) {
                // search for a triplet
                for (let i = 1; i < 20; i++) {
                    const test = i * 2 / 3;
                    if (Math.abs(test - quarters) < 0.01) {
                        return `${i}t`;
                    }
                }
            }
            return `${rounded}n`;
        }
        else {
            return `${quarters.toFixed(2)}`;
        }
    }
    /**
     * Get the bpm
     */
    _getBpm() {
        return this.context.transport.bpm.value;
    }
    /**
     * Get the ppq
     */
    get _ppq() {
        return this.context.transport.PPQ;
    }
}
