
import { getContext } from "../Global.js";
import { isNumber, isString } from "../util/Type.js";

/**
 * TimeBase is a flexible encoding of time which can be evaluated to and from a string.
 */
export class TimeBase {
    constructor(value, units) {
        // The value might be an object if it's a Time object pass in
        if (value instanceof TimeBase) {
            this.copy(value);
            return;
        }
        // The transport is not available immediately, so it has to be stored in the constructor
        this.context = getContext();
        this._val = value;
        this._units = units;
        // If the value is a string, it could be in the form of multiple values
        if (this._isString(value) && value.includes(":")) {
            this.fromNotation(value);
        }
        else if (value && units) {
            this.fromParts(value, units);
        }
    }

    /**
     * All of the time encodings supported by Time.
     */
    get _expressions() {
        return {
            "n": {
                regexp: /^(\d+)n/i,
                method: (value) => this._notationToUnits(value),
            },
            "t": {
                regexp: /^(\d+)t/i,
                method: (value) => {
                    const val = parseInt(value, 10);
                    return this._notationToUnits(val.toString()) * 2 / 3;
                },
            },
            "i": {
                regexp: /^(\d+)i/i,
                method: (value) => this._ticksToUnits(parseInt(value, 10)),
            },
            "m": {
                regexp: /^(\d+)m/i,
                method: (value) => this._beatsToUnits(parseInt(value, 10) * this._getTimeSignature()),
            },
            "hz": {
                regexp: /^(\d+(?:\.\d+)?)hz/i,
                method: (value) => 1 / parseFloat(value),
            },
            "tr": {
                regexp: /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?):?(\d+(?:\.\d+)?)?/,
                method: (m, q, s) => {
                    return this._transportToUnits(m, q, s);
                },
            },
            "s": {
                regexp: /^(\d+(?:\.\d+)?)s/,
                method: (value) => parseFloat(value),
            },
            "samples": {
                regexp: /^(\d+)samples/,
                method: (value) => parseInt(value, 10) / this.context.sampleRate,
            },
            "now": {
                regexp: /^\+(.+)/,
                method: (value) => this._now() + new this.constructor(value).valueOf(),
            },
            "default": {
                regexp: /^(\d+(?:\.\d+)?)$/,
                method: (value) => {
                    const numericValue = parseFloat(value);
                    if (this._defaultUnits) {
                        const constructor = this.constructor;
                        return (new constructor(numericValue, this._defaultUnits)).valueOf();
                    }
                    else {
                        return numericValue;
                    }
                },
            }
        };
    }

    /**
     * The default units.
     */
    get _defaultUnits() {
        return this.constructor.defaultUnits;
    }

    /**
     * Test if the given value is a string.
     * @param value
     */
    _isString(value) {
        return isString(value);
    }

    /**
     * Test if the given value is a number
     * @param value
     */
    _isNumber(value) {
        return isNumber(value);
    }

    /**
     * Return the value of the time in the current units.
     */
    valueOf() {
        if (!this._units) {
            this.fromSeconds(this._getVal());
        }
        return this._val;
    }

    /**
     * Get the value of the duration in seconds.
     */
    toSeconds() {
        return this.valueOf();
    }

    /**
     * Return the value in hertz, alias for `toFrequency`
     */
    toFrequency() {
        return 1 / this.toSeconds();
    }

    /**
     * Return the time in samples.
     */
    toSamples() {
        return this.toSeconds() * this.context.sampleRate;
    }

    /**
     * Parse a time string into parts. Returns an array of parts.
     * @param time
     */
    _parse(time) {
        const permutations = this._getExpressions();
        // search the string for the first expression that matches
        for (const units in permutations) {
            const results = time.match(permutations[units].regexp);
            if (results) {
                const method = permutations[units].method;
                const value = method.apply(this, results.slice(1));
                return this.fromSeconds(value);
            }
        }
        // if it didn't match any of the expressions
        throw new Error(`TimeBase: unable to parse "${time}"`);
    }

    /**
     * Get all of the expressions
     */
    _getExpressions() {
        return this._expressions;
    }

    /**
     * Coerce a time expression to the same units as `this`.
     * @param value
     */
    _secondsToUnits(seconds) {
        return seconds;
    }

    /**
     * Get the current value of the time expression.
     */
    _getVal() {
        if (this._isString(this._val)) {
            // is it a string expression?
            if (this._val.includes("+")) {
                const now = this._now();
                const parts = this._val.split("+").map(part => {
                    if (part.trim() === "") {
                        return 0;
                    }
                    else {
                        return new this.constructor(part.trim()).valueOf();
                    }
                });
                return parts.reduce((a, b) => a + b, now);
            }
            else {
                return this._parse(this._val);
            }
        }
        else if (this._isNumber(this._val)) {
            const constructor = this.constructor;
            return (new constructor(this._val, this._defaultUnits)).valueOf();
        }
        else {
            return 0;
        }
    }

    /**
     * Set the time from the given seconds.
     */
    fromSeconds(seconds) {
        this._val = this._secondsToUnits(seconds);
        this._units = undefined;
        return this;
    }

    /**
     * Set the time from the given parts.
     * @param value
     * @param units
     */
    fromParts(value, units) {
        this._val = value;
        this._units = units;
        this.valueOf();
        return this;
    }

    /**
     * Set the time from a time string which can have multiple components.
     * e.g. "1:2:3"
     * @param notation
     */
    fromNotation(notation) {
        const parts = notation.split(":");
        let totalSeconds = 0;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const partNum = parseFloat(part);
            if (i === 0) {
                // measures
                totalSeconds += this._beatsToUnits(partNum * this._getTimeSignature());
            }
            else if (i === 1) {
                // quarter notes
                totalSeconds += this._beatsToUnits(partNum);
            }
            else if (i === 2) {
                // sixteenth notes
                totalSeconds += this._beatsToUnits(partNum / 4);
            }
        }
        return this.fromSeconds(totalSeconds);
    }

    /**
     * Convert a notation value to the current units.
     * @param notation
     */
    _notationToUnits(notation) {
        const primary = this._getTimeSignature();
        const subdivision = parseInt(notation, 10);
        if (subdivision === 0) {
            return 0;
        }
        const dot = notation.slice(-1);
        let val = (primary / subdivision);
        if (dot === ".") {
            val *= 1.5;
        }
        return val;
    }

    /**
     * Convert from ticks to the current units
     * @param ticks
     */
    _ticksToUnits(ticks) {
        return ticks * (this._beatsToUnits(1) / this._getPPQ());
    }

    /**
     * Convert from transports to the current units
     * @param measures
     * @param quarters
     * @param sixteenths
     */
    _transportToUnits(measures, quarters, sixteenths) {
        let total = this._beatsToUnits(parseFloat(measures) * this._getTimeSignature());
        total += this._beatsToUnits(parseFloat(quarters));
        if (sixteenths) {
            total += this._beatsToUnits(parseFloat(sixteenths) / 4);
        }
        return total;
    }

    /**
     * Convert the given value from the type specified by the units
     * into the specified units.
     * @param val
     * @param units
     */
    _frequencyToUnits(val, units) {
        return 1 / new this.constructor(val, units).valueOf();
    }
    
    /**
     * Convert a beat number to the seconds.
     * @param beats
     */
    _beatsToUnits(beats) {
        return (60 / this._getBpm()) * beats;
    }

    /**
     * Clone the current time object
     */
    clone() {
        return new this.constructor(this.valueOf());
    }
    
    /**
     * Copy the values from another time object
     */
    copy(time) {
        this._val = time._val;
        this._units = time._units;
        return this;
    }

    /**
     * Get the current transport.
     */
    get transport() {
        return this.context.transport;
    }

    /**
     * Get the current context.
     */
    get context() {
        return this._context;
    }
    set context(context) {
        this._context = context;
    }

    dispose() {
        return this;
    }
}
