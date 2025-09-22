import { TimeBase } from "./TimeBase.js";
import { optionsFromArguments } from "../util/Defaults.js";
import { isString } from "../util/Type.js";
/**
 * Frequency is a primitive type for encoding Frequency values.
 * Eventually all time values are evaluated to hertz
 * but can be passed in as notation strings, numbers, or Time objects.
 * @example
 * import { Frequency } from "tone";
 * const freq = new Frequency("C4");
 * @category Unit
 */
export class Frequency extends TimeBase {
    constructor() {
        const options = optionsFromArguments(Frequency.getDefaults(), arguments, ["value", "units"]);
        super(options);
        this.name = "Frequency";
        this.units = "hz";
        this._val = this._fromType(options.value);
        this.units = options.units;
    }
    static getDefaults() {
        return Object.assign(TimeBase.getDefaults(), {
            units: "hz",
        });
    }
    /**
     * The value in hertz
     */
    get value() {
        return this._val;
    }
    set value(val) {
        this._val = val;
    }
    /**
     * Transposes the frequency by the given number of semitones.
     * @param  semitones The number of semitones to transpose the frequency by.
     * @return A new transposed frequency
     * @example
     * import { Frequency } from "tone";
     * const freq = new Frequency("A4").transpose(3);
     * freq.toNote(); // "C5"
     */
    transpose(semitones) {
        const newFreq = new Frequency();
        newFreq.value = this.value * Math.pow(2, semitones / 12);
        return newFreq;
    }
    /**
     * Takes an array of semitone intervals and returns
     * an array of frequencies transposed by those intervals.
     * @param  intervals The intervals to transpose
     * @return The transposed frequencies
     * @example
     * import { Frequency } from "tone";
     * const freq = new Frequency("A4").harmonize([0, 3, 7]);
     * freq.map(f => f.toNote()); // ["A4", "C5", "E5"]
     */
    harmonize(intervals) {
        return intervals.map((interval) => {
            return this.transpose(interval);
        });
    }
    //-------------------------------------
    // CONVERSIONS
    //-------------------------------------
    /**
     * Return the value of the frequency as a MIDI note
     * @example
     * import { Frequency } from "tone";
     * new Frequency("C4").toMidi(); // 60
     */
    toMidi() {
        return Math.log2(this.value / 440) * 12 + 69;
    }
    /**
     * Return the value of the frequency in Scientific Pitch Notation
     * @example
     * import { Frequency } from "tone";
     * new Frequency(440).toNote(); // "A4"
     */
    toNote() {
        const log = Math.log2(this.value / 440);
        let noteNumber = Math.round(12 * log) + 57;
        const octave = Math.floor(noteNumber / 12);
        if (octave < 0) {
            noteNumber += -12 * octave;
        }
        const noteName = noteNames[noteNumber % 12];
        return noteName + octave.toString();
    }
    /**
     * Return the value in Hertz
     */
    toFrequency() {
        return this.value;
    }
    /**
     * Return the value in seconds
     */
    toSeconds() {
        return 1 / this.value;
    }
    /**
     * Return the value in ticks
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
        if (val instanceof Frequency) {
            return val.value;
        }
        else if (isString(val) && val.trim() in midi) {
            return midiToFrequency(midi[val.trim()]);
        }
        else {
            return super._fromType(val);
        }
    }
    /**
     * Convert from the time type
     */
    _fromTime(val) {
        return 1 / super._fromTime(val);
    }
    /**
     * Convert from the notation type
     */
    _fromNotation(val) {
        const parts = val.split(/(\d+)/);
        if (parts.length > 1) {
            const note = parts[0];
            const octave = parseInt(parts[1], 10);
            const index = noteNames.indexOf(note.toUpperCase());
            if (index !== -1) {
                return midiToFrequency(index + (octave + 1) * 12);
            }
        }
        return 0;
    }
    /**
     * Convert from the midi type
     */
    _fromMidi(val) {
        return midiToFrequency(val);
    }
    /**
     * Convert from the ticks type
     */
    _fromTicks(val) {
        const quarters = val / this._ppq;
        const quarterTime = this._beatsToUnits(1);
        return quarters * quarterTime;
    }
}
//-------------------------------------
// 	FREQUENCY CONVERSIONS
//-------------------------------------
const noteNames = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
];
const midi = {
    A0: 21,
    "A#0": 22,
    B0: 23,
    C1: 24,
    "C#1": 25,
    D1: 26,
    "D#1": 27,
    E1: 28,
    F1: 29,
    "F#1": 30,
    G1: 31,
    "G#1": 32,
    A1: 33,
    "A#1": 34,
    B1: 35,
    C2: 36,
    "C#2": 37,
    D2: 38,
    "D#2": 39,
    E2: 40,
    F2: 41,
    "F#2": 42,
    G2: 43,
    "G#2": 44,
    A2: 45,
    "A#2": 46,
    B2: 47,
    C3: 48,
    "C#3": 49,
    D3: 50,
    "D#3": 51,
    E3: 52,
    F3: 53,
    "F#3": 54,
    G3: 55,
    "G#3": 56,
    A3: 57,
    "A#3": 58,
    B3: 59,
    C4: 60,
    "C#4": 61,
    D4: 62,
    "D#4": 63,
    E4: 64,
    F4: 65,
    "F#4": 66,
    G4: 67,
    "G#4": 68,
    A4: 69,
    "A#4": 70,
    B4: 71,
    C5: 72,
    "C#5": 73,
    D5: 74,
    "D#5": 75,
    E5: 76,
    F5: 77,
    "F#5": 78,
    G5: 79,
    "G#5": 80,
    A5: 81,
    "A#5": 82,
    B5: 83,
    C6: 84,
    "C#6": 85,
    D6: 86,
    "D#6": 87,
    E6: 88,
    F6: 89,
    "F#6": 90,
    G6: 91,
    "G#6": 92,
    A6: 93,
    "A#6": 94,
    B6: 95,
    C7: 96,
    "C#7": 97,
    D7: 98,
    "D#7": 99,
    E7: 100,
    F7: 101,
    "F#7": 102,
    G7: 103,
    "G#7": 104,
    A7: 105,
    "A#7": 106,
    B7: 107,
    C8: 108,
};
/**
 * Convert a MIDI note to a frequency.
 * @param  midi The midi number to convert.
 * @return The corresponding frequency of the midi number.
 */
function midiToFrequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}
