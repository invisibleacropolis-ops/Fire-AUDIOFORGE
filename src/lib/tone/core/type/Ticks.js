import { TransportTime } from "./TransportTime.js";
import { optionsFromArguments } from "../util/Defaults.js";
import { isString } from "../util/Type.js";
/**
 * Ticks is a primitive type for encoding Time values.
 * Ticks can be passed into the constructor as a number or a string.
 * The string must be a number with "i" appended to the end.
 * @example
 * import { Ticks } from "tone";
 * const ticks = new Ticks(480);
 * @category Unit
 */
export class Ticks extends TransportTime {
    constructor() {
        const options = optionsFromArguments(Ticks.getDefaults(), arguments, [
            "value",
        ]);
        super(options);
        this.name = "Ticks";
        this.units = "i";
    }
    //-------------------------------------
    // CONVERSIONS
    //-------------------------------------
    /**
     * Return the value of the beats in the current units
     */
    _toUnits(val) {
        switch (this.units) {
            case "i":
                return val;
            case "n":
                return val / (this._ppq * 4);
            case "t":
                return val / (this._ppq * 4 / 3);
            case "s":
                return val / this._ppq / this._getBpm() / 60;
            case "hz":
                return 1 / (val / this._ppq / this._getBpm() / 60);
            case "tr":
                return val / this._ppq;
            default:
                return val;
        }
    }
    /**
     * Return the value of the ticks
     */
    toTicks() {
        return this.valueOf();
    }
    /**
     * Return the value of the seconds
     */
    toSeconds() {
        return (this.valueOf() / this._ppq) * (60 / this._getBpm());
    }
    /**
     * Return the value of the frequency
     */
    toFrequency() {
        return 1 / this.toSeconds();
    }
    /**
     * Return the value of the notation
     */
    toNotation() {
        const quarterNotes = this.toTicks() / this._ppq;
        return this._secondsToNotation(quarterNotes * (60 / this._getBpm()));
    }
    //-------------------------------------
    // FROM
    //-------------------------------------
    /**
     * @hidden
     */
    _fromType(val) {
        if (val instanceof Ticks) {
            return val.valueOf();
        }
        else if (isString(val) && val.endsWith("i")) {
            return parseInt(val, 10);
        }
        else {
            return super._fromType(val);
        }
    }
    /**
     * Get the current time established by the Transport
     */
    _now() {
        return this.context.transport.ticks;
    }
    /**
     * From seconds
     */
    _fromSeconds(seconds) {
        return seconds * this._getBpm() * this._ppq / 60;
    }
    /**
     * From hertz
     */
    _fromFrequency(freq) {
        return this._fromSeconds(1 / freq);
    }
    /**
     * From ticks
     */
    _fromTicks(ticks) {
        return ticks;
    }
}
