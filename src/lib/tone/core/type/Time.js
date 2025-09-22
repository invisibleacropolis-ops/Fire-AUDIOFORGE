
import { getContext } from "../Global.js";
import { isNumber, isString } from "../util/Type.js";
import { TransportTime } from "./TransportTime.js";
import { Ticks } from "./Ticks.js";
/**
 * Time is a primitive type for encoding and manipulating time quantities.
 *
 * Time can be passed into the constructor with or without units.
 * If no units are given, the default units are `seconds`.
 *
 * @example
 * new Time("4n"); // a quarter note
 * new Time("8t"); // an eighth note triplet
 * new Time(1.5); // 1.5 seconds
 * new Time("1:2:0"); // 1 measure, 2 beats, 0 sixteenths
 * @category Unit
 */
export class Time extends TransportTime {
    constructor(value, units) {
        super(value, units);
        this.name = "Time";
    }
    /**
     * The default units if none are provided.
     */
    static get defaultUnits() {
        return "s";
    }
    /**
     * Quantize the time by the given subdivision. Optionally add a percentage which will move
     * the time value towards the ideal quantized value by that percentage.
     * @param  subdivision  The subdivision to quantize to
     * @param  percent      Move the time value towards the quantized value by a percentage.
     * @return  A new Time whose value is quantized.
     * @example
     * new Time("4n + 4n").quantize("4n"); // "1m"
     * new Time(0.6).quantize("4n", 0.5); // "2n" (exactly in between 0.5 and 1)
     */
    quantize(subdivision, percent = 1) {
        const subdivisionTime = this.toSeconds(subdivision);
        const whole = Math.round(this.valueOf() / subdivisionTime);
        const ideal = whole * subdivisionTime;
        const diff = ideal - this.valueOf();
        return new Time(this.valueOf() + diff * percent);
    }
    /**
     * Add the given value to the time.
     * @param  val
     * @return  A new Time instance with the added value.
     */
    add(val) {
        return new Time(this.valueOf() + this.toSeconds(val));
    }
    /**
     * Subtract the given value from the time.
     * @param  val
     * @return  A new Time instance with the subtracted value.
     */
    sub(val) {
        return new Time(this.valueOf() - this.toSeconds(val));
    }
    /**
     * Multiply the time by the given value.
     * @param  val
     */
    mult(val) {
        return new Time(this.valueOf() * val);
    }
    /**
     * Divide the time by the given value.
     * @param  val
     */
    div(val) {
        return new Time(this.valueOf() / val);
    }
    //-------------------------------------
    // 	CONVERSIONS
    //-------------------------------------
    /**
     * Return the time in samples
     */
    toSamples() {
        return this.toSeconds() * this.context.sampleRate;
    }
    /**
     * Return the time in hertz
     */
    toFrequency() {
        return 1 / this.toSeconds();
    }
    /**
     * Return the time in milliseconds.
     */
    toMilliseconds() {
        return this.toSeconds() * 1000;
    }
    /**
     * Evaluate the time value. Returns the time in seconds.
     */
    valueOf() {
        return this.toSeconds();
    }
    /**
     * @param expr
     */
    _noUnits(expr) {
        return expr;
    }
    /**
     * @param expr
     */
    _notationToSeconds(expr, bpm, timeSignature) {
        const beatTime = (60 / bpm) * (4 / timeSignature);
        let subdivision = parseInt(expr, 10);
        let seconds = 0;
        if (subdivision === 0) {
            seconds = 0;
        }
        const lastChar = expr.slice(-1);
        if (lastChar === "t") {
            subdivision = Math.pow(2, Math.log2(subdivision) - 1) * 3;
            seconds = (beatTime * 4) / subdivision;
        }
        else if (lastChar === "n") {
            seconds = (beatTime * 4) / subdivision;
        }
        else if (lastChar === "m") {
            seconds = subdivision * beatTime * timeSignature;
        }
        else {
            seconds = subdivision * beatTime;
        }
        // find the rest of the string
        const symbol = expr.match(/[.]$/);
        if (symbol) {
            const dot = symbol[0];
            if (dot === ".") {
                seconds += seconds / 2;
            }
        }
        return seconds;
    }
    _nowToSeconds(now) {
        return now + this.context.lookAhead;
    }
    /**
     * @param expr
     * @param bpm
     */
    _ticksToSeconds(expr, bpm) {
        // Ticks are only useful in the context of the Transport
        const transport = getContext().transport;
        return (new Ticks(expr, bpm)).toSeconds();
    }
    /**
     * @param expr
     * @param bpm
     * @param timeSignature
     */
    _transportToSeconds(expr, bpm, timeSignature) {
        // TransportTime are only useful in the context of the Transport
        const transport = getContext().transport;
        return (new TransportTime(expr, bpm, timeSignature)).toSeconds();
    }
}
//# sourceMappingURL=Time.js.map
