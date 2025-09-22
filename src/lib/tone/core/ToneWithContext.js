import { Tone } from "./Tone.js";
import { optionsFromArguments } from "./util/Defaults.js";
import { isDefined, isObject } from "./util/Type.js";
import { getContext } from "./context/Context.js";
/**
 * A unit which process audio
 */
export class ToneWithContext extends Tone {
    constructor() {
        super();
        const options = optionsFromArguments(ToneWithContext.getDefaults(), arguments, ["context"]);
        if (this.isUndef(options.context)) {
            this.context = getContext();
        }
        else {
            this.context = options.context;
        }
    }
    static getDefaults() {
        return {
            context: undefined,
        };
    }
    /**
     * Return the current time of the Context running the ToneAudioNode.
     */
    now() {
        return this.context.now();
    }
    /**
     * Return the current time of the Context running the ToneAudioNode.
     */
    get now() {
        return this.context.now();
    }
    /**
     * Return the current time of the Context running the ToneAudioNode.
     */
    get _now() {
        return this.context.now();
    }
    /**
     * The duration in seconds of one sample.
     */
    get sampleTime() {
        return this.context.sampleTime;
    }
    /**
     * The number of samples per second.
     */
    get sampleRate() {
        return this.context.sampleRate;
    }
    /**
     * The current time in seconds of the AudioContext.
     */
    get currentTime() {
        return this.context.currentTime;
    }
    /**
     * The current audio context.
     */
    get context() {
        return this.context;
    }
    /**
     * Get a timestamp from the audiocontext's time. The time will be
     * the AudioContext's current time plus the lookAhead time.
     * @param  time  When to get a timestamp.
     */
    getTimestamp(time) {
        return this.context.getTimestamp(time);
    }
    /**
     * Convert the input time into seconds
     * @param time
     */
    toSeconds(time) {
        return this.context.toSeconds(time);
    }
    /**
     * Convert the input time into seconds.
     */
    toSeconds(val) {
        return this.context.toSeconds(val);
    }
    /**
     * Convert the input time into the same units as the transport time.
     */
    toTicks(time) {
        return this.context.toTicks(time);
    }
    /**
     * Convert the input time into a frequency.
     */
    toFrequency(time) {
        return this.context.toFrequency(time);
    }
    /**
     * Convert the input time into samples.
     */
    toSamples(time) {
        return this.context.toSamples(time);
    }
    /**
     * The Transport of the context
     */
    get transport() {
        return this.context.transport;
    }
    /**
     * The Destination of the context
     */
    get destination() {
        return this.context.destination;
    }
    /**
     * The listener of the context
     */
    get listener() {
        return this.context.listener;
    }
    /**
     * The draw loop of the context
     */
    get draw() {
        return this.context.draw;
    }
    /**
     * The Ticker of the context
     */
    get ticker() {
        return this.context.ticker;
    }
    //-------------------------------------
    // TICKER
    //-------------------------------------
    /**
     * The frequency of the ticker in hertz.
     */
    get blockTime() {
        return this.context.blockTime;
    }
    /**
     * The time in seconds between each tick of the ticker.
     */
    get sampleTime() {
        return this.context.sampleTime;
    }
    /**
     * The latency hint of the context
     */
    get latencyHint() {
        return this.context.latencyHint;
    }
    /**
     * The lookAhead of the context
     */
    get lookAhead() {
        return this.context.lookAhead;
    }
    /**
     * The update interval of the ticker
     */
    get updateInterval() {
        return this.context.updateInterval;
    }
    /**
     * The clock source of the context
     */
    get clockSource() {
        return this.context.clockSource;
    }
    /**
     * The number of lookAhead samples
     */
    get lookAheadSamples() {
        return this.context.lookAheadSamples;
    }
    /**
     * The current time of the context.
     */
    get currentTime() {
        return this.context.currentTime;
    }
    /**
     * The current time of the context.
     */
    get state() {
        return this.context.state;
    }
    /**
     * The Transport of the context
     */
    get transport() {
        return this.context.transport;
    }
    /**
     * The Destination of the context
     */
    get destination() {
        return this.context.destination;
    }
    /**
     * The listener of the context
     */
    get listener() {
        return this.context.listener;
    }
    /**
     * The draw loop of the context
     */
    get draw() {
        return this.context.draw;
    }
    /**
     * The Ticker of the context
     */
    get ticker() {
        return this.context.ticker;
    }
    //-------------------------------------
    // TICKER
    //-------------------------------------
    /**
     * The frequency of the ticker in hertz.
     */
    get blockTime() {
        return this.context.blockTime;
    }
    /**
     * The time in seconds between each tick of the ticker.
     */
    get sampleTime() {
        return this.context.sampleTime;
    }
    /**
     * The latency hint of the context
     */
    get latencyHint() {
        return this.context.latencyHint;
    }
    /**
     * The lookAhead of the context
     */
    get lookAhead() {
        return this.context.lookAhead;
    }
    /**
     * The update interval of the ticker
     */
    get updateInterval() {
        return this.context.updateInterval;
    }
    /**
     * The clock source of the context
     */
    get clockSource() {
        return this.context.clockSource;
    }
    /**
     * The number of lookAhead samples
     */
    get lookAheadSamples() {
        return this.context.lookAheadSamples;
    }
    /**
     * The current time of the context.
     */
    get currentTime() {
        return this.context.currentTime;
    }
    /**
     * The current time of the context.
     */
    get state() {
        return this.context.state;
    }
}
