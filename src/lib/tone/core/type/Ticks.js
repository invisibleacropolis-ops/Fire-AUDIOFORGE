
import { TransportTime } from "./TransportTime.js";
/**
 * Ticks is a primitive type for encoding Time values.
 * Ticks can be constructed with or without the `new` keyword. Ticks can be passed
 * into the constructor with or without units. If no units are given,
 * the default is `ticks`.
 *
 * @example
 * new Ticks("4n");
 * new Ticks(120);
 * @category Unit
 */
export class Ticks extends TransportTime {
    constructor(value, units) {
        super(value, units);
        this.name = "Ticks";
    }
    /**
     * The default units if none are provided.
     */
    static get defaultUnits() {
        return "i";
    }
    /**
     * Get the current time in the given units
     */
    _now() {
        return this.transport.ticks;
    }
    /**
     * Return the value of the beats in the current units
     */
    valueOf() {
        return this.toTicks();
    }
    /**
     * Return the value of the ticks.
     */
    toTicks() {
        const val = this._getBpm() * this._getPPQ();
        return this._seconds * val;
    }
    /**
     * Return the time in seconds.
     */
    toSeconds() {
        const val = this._getBpm() * this._getPPQ();
        return this._ticks / val;
    }
}
//# sourceMappingURL=Ticks.js.map
