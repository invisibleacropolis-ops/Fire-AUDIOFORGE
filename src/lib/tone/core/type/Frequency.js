
import { Time } from "./Time.js";
import { TransportTime } from "./TransportTime.js";
/**
 * Frequency is a primitive type for encoding Frequency values.
 * Eventually all time values are evaluating to seconds.
 *
 * @example
 * new Frequency("C4").toSeconds(); // 261.6255653005986
 * @category Unit
 */
export class Frequency extends Time {
    constructor(value, units) {
        super(value, units);
        this.name = "Frequency";
    }
    /**
     * The default units if none are provided.
     */
    static get defaultUnits() {
        return "hz";
    }
    /**
     * Transposes the frequency by the given number of semitones.
     * @return  A new transposed frequency
     * @example
     * new Frequency("A4").transpose(3); //"C5"
     */
    transpose(interval) {
        return new Frequency(this.valueOf() * this.intervalToFrequencyRatio(interval));
    }
    /**
     * Takes an array of semitone intervals and returns
     * an array of frequencies transposed by those intervals.
     * @param  intervals
     * @return  Returns an array of Frequencies
     * @example
     * new Frequency("A4").harmonize([0, 3, 7]); //["A4", "C5", "E5"]
     */
    harmonize(intervals) {
        return intervals.map(interval => {
            return this.transpose(interval);
        });
    }
    //-------------------------------------
    // 	UNIT CONVERSIONS
    //-------------------------------------
    /**
     * Return the value of the frequency as a MIDI note.
     * @return
     * @example
     * new Frequency("C4").toMidi(); //60
     */
    toMidi() {
        return this.hzToMidi(this.valueOf());
    }
    /**
     * Return the value of the frequency in Scientific Pitch Notation.
     * @return
     * @example
     * new Frequency(69, "midi").toNote(); //"A4"
     */
    toNote() {
        const freq = this.valueOf();
        const log = Math.log2(freq / this.A4);
        let noteNumber = Math.round(12 * log) + 57;
        const octave = Math.floor(noteNumber / 12);
        if (octave < 0) {
            noteNumber += -12 * octave;
        }
        const noteName = noteMap[noteNumber % 12];
        return noteName + octave.toString();
    }
    /**
     * Return the duration of one cycle in seconds.
     */
    toSeconds() {
        return 1 / super.toSeconds();
    }
    /**
     * Return the duration of one cycle in ticks
     */
    toTicks() {
        const seconds = this.toSeconds();
        const quarter = this.transport.bpm.value / 60;
        const quarters = seconds * quarter;
        const ticks = quarters * this.transport.PPQ;
        return ticks;
    }
    //-------------------------------------
    // 	CONVERSIONS
    //-------------------------------------
    /**
     * @param  freq
     */
    _frequencyToUnits(freq) {
        return freq;
    }
    /**
     * @param  note
     */
    _midiToFrequency(note) {
        return this.midiToHz(note);
    }
    /**
     * @param  freq
     */
    _notationToFrequency(note) {
        const parts = note.match(/^([a-g]{1}(?:b|#|x|bb)?)(-?[0-9]+)/i);
        if (parts) {
            const name = parts[1];
            const octave = parts[2];
            const noteNameToFrequency = (noteName) => {
                const noteIndex = noteMap.indexOf(noteName.toUpperCase());
                return this.A4 * Math.pow(2, (noteIndex - 9) / 12);
            };
            const freq = noteNameToFrequency(name);
            return freq * Math.pow(2, parseFloat(octave) - 4);
        }
        else {
            return 0;
        }
    }
    _nowToFrequency(now) {
        return now;
    }
    /**
     * @param  ticks
     */
    _ticksToFrequency(ticks) {
        return 1 / (new TransportTime(ticks).toSeconds());
    }
    _noUnits(val) {
        return val;
    }
}
/**
 * Note strings to a lookup of the note name
 */
const noteMap = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
];
//# sourceMappingURL=Frequency.js.map
