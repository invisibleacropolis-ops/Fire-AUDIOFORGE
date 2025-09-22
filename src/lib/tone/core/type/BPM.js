import { Time } from "./Time.js";
import { Frequency } from "./Frequency.js";
import { optionsFromArguments } from "../util/Defaults.js";
/**
 * BPM is a primitive type for encoding Beats Per Minute.
 * BPM can be passed into the constructor as a number or a string.
 * The string must be a number with "bpm" appended to the end.
 * @example
 * import { BPM } from "tone";
 * const bpm = new BPM(120);
 * @category Unit
 */
export class BPM extends Frequency {
    constructor() {
        const options = optionsFromArguments(BPM.getDefaults(), arguments, [
            "value",
        ]);
        super(options);
        this.name = "BPM";
        this.units = "bpm";
    }
    /**
     * A suggested range of values.
     */
    static get range() {
        return [30, 300];
    }
    /**
     * Convert a TimeBase value to BPM.
     */
    _fromType(val) {
        if (val instanceof BPM) {
            return val.value;
        }
        else {
            return super._fromType(val);
        }
    }
    /**
     * Convert another sting type to BPM.
     */
    _fromString(val) {
        if (val.endsWith("bpm")) {
            return parseFloat(val);
        }
        else {
            return super._fromString(val);
        }
    }
    /**
     * Convert the BPM to seconds
     */
    _toFrequency(val) {
        return val / 60;
    }
    /**
     * Convert the seconds to BPM
     */
    _fromFrequency(val) {
        return val * 60;
    }
}
