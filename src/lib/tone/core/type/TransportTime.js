import { Time } from "./Time.js";
import { optionsFromArguments } from "../util/Defaults.js";
/**
 * TransportTime is a primitive type for encoding Time values.
 * TransportTime can be passed into the constructor as a number or a string.
 * The string must be a time-relative value.
 * @example
 * import { TransportTime } from "tone";
 * const time = new TransportTime("4n");
 * @category Unit
 */
export class TransportTime extends Time {
    constructor() {
        const options = optionsFromArguments(TransportTime.getDefaults(), arguments, ["value", "units"]);
        super(options);
        this.name = "TransportTime";
        this.units = "s";
    }
    //-------------------------------------
    // CONVERSIONS
    //-------------------------------------
    /**
     * Return the value in seconds
     */
    toSeconds() {
        let seconds = this.value;
        if (this.units === "s") {
            seconds = this.value;
        }
        else if (this.units === "i") {
            seconds = this.value / this._ppq / this._getBpm() / 60;
        }
        else {
            // is notation
            seconds = this._beatsToUnits(this.value);
        }
        return seconds;
    }
    /**
     * Return the value in ticks
     */
    toTicks() {
        const quarterNotes = this.toSeconds() / (60 / this._getBpm());
        return Math.round(quarterNotes * this._ppq);
    }
}
