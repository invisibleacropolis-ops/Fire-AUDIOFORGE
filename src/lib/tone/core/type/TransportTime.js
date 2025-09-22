
import { getContext } from "../Global.js";
import { isNumber, isString } from "../util/Type.js";
import { TimeBase } from "./TimeBase.js";

/**
 * TransportTime is a the time along the Transport's
 * timeline. It is similar to {@link Time}, but it also has features which are
 * specific to the Transport's timeline. TransportTime operates in
 * ticks instead of seconds. There are 192 ticks per quarter note.
 *
 * @example
 * new TransportTime("4n"); // a quarter note
 * new TransportTime("8t"); // an eighth note triplet
 * new TransportTime("1:2:0"); // 1 measure, 2 beats, 0 sixteenths
 * @category Unit
 */
export class TransportTime extends TimeBase {
    constructor(value, units) {
        super(value, units);
        this.name = "TransportTime";
        this.context = getContext();
    }

    /**
     * The default units if none are provided.
     */
    static get defaultUnits() {
        return "i";
    }

    /**
     * All of the time encodings supported by TransportTime.
     */
    get _expressions() {
        return Object.assign(super._expressions, {
            "i": {
                regexp: /^(\d+)i$/,
                method: (value) => this._beatsToUnits(parseInt(value) / this._getPPQ()),
            },
        });
    }

    /**
     * Return the time in ticks.
     */
    toTicks() {
        const quarters = this._beatsToUnits(1);
        const quartersPerBeat = this._getBpm() / 60;
        const tickRate = quarters * quartersPerBeat;
        return this._seconds * tickRate;
    }

    /**
     * Return the time in seconds.
     * @return
     */
    toSeconds() {
        const quartersPerBeat = this._getBpm() / 60;
        return this._ticks / this._getPPQ() / quartersPerBeat;
    }
    
    /**
     * Return the time in seconds.
     */
    valueOf() {
        return this.toSeconds();
    }
    
    /**
     * Return the time in seconds.
     */
    _now() {
        return this.transport.seconds;
    }

    /**
     * Coerce a time expression to the same units as `this`.
     * @param value
     */
    _secondsToUnits(seconds) {
        return this._beatsToUnits(seconds * (this._getBpm() / 60));
    }
    
    /**
     * Convert a beat number to the seconds.
     * @param beats
     */
    _beatsToUnits(beats) {
        const quarterTime = this._getPPQ() / (4 / this._getTimeSignature());
        return Math.round(beats * quarterTime);
    }
    
    /**
     * Get the current transport's BPM.
     */
    _getBpm() {
        return this.transport.bpm.value;
    }

    /**
     * Get the current transport's time signature.
     */
    _getTimeSignature() {
        return this.transport.timeSignature;
    }

    /**
     * Get the current transport's PPQ (Pulse Per Quarter).
     */
    _getPPQ() {
        return this.transport.PPQ;
    }
}
