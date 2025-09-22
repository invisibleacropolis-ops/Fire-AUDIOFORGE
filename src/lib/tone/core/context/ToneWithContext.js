
import { getContext } from "../Global.js";
import { Tone } from "../Tone.js";
import { optionsFromArguments } from "../util/Defaults.js";
/**
 * The Base class for all nodes that have an AudioContext.
 */
export class ToneWithContext extends Tone {
    constructor(options) {
        super();
        const defaultOptions = optionsFromArguments(ToneWithContext.getDefaults(), arguments, ["context"]);
        if (this.isUndef(defaultOptions.context)) {
            this.context = getContext();
        }
        else {
            this.context = defaultOptions.context;
        }
    }
    static getDefaults() {
        return {
            context: getContext(),
        };
    }
    /**
     * Return the current time of the Context clock plus the lookAhead.
     */
    now() {
        return this.context.now();
    }
    /**
     * Return the current time of the Context clock without any lookAhead.
     */
    immediate() {
        return this.context.currentTime;
    }
    /**
     * The duration in seconds of one sample.
     */
    get sampleTime() {
        return 1 / this.context.sampleRate;
    }
    /**
     * The number of samples per second.
     */
    get sampleRate() {
        return this.context.sampleRate;
    }
    /**
     * The current audio context time
     */
    get currentTime() {
        return this.context.currentTime;
    }
    /**
     * The current audio context time plus a short {@link lookAhead}.
     * @see {@link lookAhead}
     */
    get blockTime() {
        return this.context.currentTime + this.context.lookAhead;
    }
    /**
     * The time of the next block of audio that will be processed.
     * @see {@link lookAhead}
     */
    get transport() {
        return this.context.transport;
    }
    /**
     * Convert the input to the same units as the output.
     * @param val
     * @param units
     */
    toSeconds(val) {
        return this.context.toSeconds(val);
    }
    /**
     * Convert the input to the same units as the output.
     * @param val
     */
    toFrequency(val) {
        return this.context.toFrequency(val);
    }
    /**
     * Convert the input to the same units as the output.
     * @param val
     */
    toTicks(val) {
        return this.context.toTicks(val);
    }
    /**
     * Convert from the given argument to db
     * @param args
     */
    toDb(args) {
        return this.context.gainToDb(args);
    }
    /**
     * Convert the given db value to gain
     * @param db
     */
    dbToGain(db) {
        return this.context.dbToGain(db);
    }
    /**
     * Convert the given gain to db
     * @param gain
     */
    gainToDb(gain) {
        return this.context.gainToDb(gain);
    }
    /**
     * Convert the given value to a normal range between 0-1
     * @param value
     * @param min
     * @param max
     */
    normalize(value, min, max) {
        return this.context.transport.normalize(value, min, max);
    }
    /**
     * Denormalize the value from a normal range (0-1) to the given range.
     * @param value
     * @param min
     * @param max
     */
    denormalize(value, min, max) {
        return this.context.transport.denormalize(value, min, max);
    }
    /**
     * Convert a MIDI note to frequency in hertz.
     * @param  midi The midi number to convert.
     * @return The corresponding frequency in hertz
     */
    midiToHz(midi) {
        return this.context.midiToFrequency(midi);
    }
    /**
     * Convert the given frequency to a MIDI note.
     * @param frequency The frequency to convert.
     */
    hzToMidi(frequency) {
        return this.context.frequencyToMidi(frequency);
    }
    /**
     * Convert the given frequency to a MIDI note.
     * @param frequency The frequency to convert.
     */
    ftom(frequency) {
        return this.context.frequencyToMidi(frequency);
    }
    /**
     * Convert the given MIDI note to a frequency.
     * @param midi The midi number to convert.
     */
    mtof(midi) {
        return this.context.midiToFrequency(midi);
    }
    /**
     * Return the frequency represented by the given scientific notation.
     * @param note
     */
    noteToFrequency(note) {
        return this.context.noteToFrequency(note);
    }
    /**
     * Return the note name of the given frequency.
     * @param frequency
     */
    frequencyToNote(frequency) {
        return this.context.frequencyToNote(frequency);
    }
    /**
     * Return the number of half steps from the given interval string.
     * @param interval
     */
    intervalToFrequencyRatio(interval) {
        return this.context.intervalToFrequencyRatio(interval);
    }
}

    