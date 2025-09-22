
import { createAudioContext, createOfflineAudioContext, } from "./AudioContextFactory.js";
import { close, resume, start } from "./ContextInitialization.js";
import { isAudioContext, isOfflineAudioContext } from "./OfflineContext.js";
import { Ticker } from "./Ticker.js";
import { Draw } from "../util/Draw.js";
import { Transport } from "../clock/Transport.js";
import { Emitter } from "../util/Emitter.js";
import { Time } from "../type/Time.js";
import { Frequency } from "../type/Frequency.js";
import { Ticks } from "../type/Ticks.js";

/**
 * This is a single AudioContext that is created and shared to all Tone.js objects.
 * The theory being that the less AudioContexts created, the better.
 * Even if you have multiple Tone.js instances, they will all share one AudioContext.
 * The only time a new AudioContext is created is during an Offline rendering pass.
 *
 * A reference to the pre-existing AudioContext can be retrieved with {@link getContext}.
 *
 * @category Core
 */
export class BaseAudioContext extends Emitter {
    constructor() {
        super();
        this.isOffline = false;
        this.A4 = 440;
    }
    /**
     * The time in seconds of the same oscillator source started at the same time.
     */
    now() {
        return this.currentTime;
    }
    /**
     * The time in seconds of the same oscillator source started at the same time.
     * This is not a reliable way of listening to the context's current time.
     * See {@link on}.
     * @deprecated
     */
    get seconds() {
        return this.currentTime;
    }
    /**
     * The audio output destination.
     */
    get destination() {
        if (!this._destination) {
            this._destination = this.createGain();
            this._destination.connect(this.rawContext.destination);
        }
        return this._destination;
    }
    set destination(dst) {
        if (this._destination) {
            this._destination.disconnect();
        }
        this._destination = dst;
        // connect it to the raw context
        if (this._destination) {
            this._destination.connect(this.rawContext.destination);
        }
    }
    /**
     * The sample rate of the audio context.
     */
    get sampleRate() {
        return this.rawContext.sampleRate;
    }
    /**
     * The current time of the audio context.
     */
    get currentTime() {
        return this.rawContext.currentTime;
    }
    /**
     * The current state of the audio context.
     */
    get state() {
        return this.rawContext.state;
    }
    /**
     * The listener which is used for all spatialization related audio nodes
     */
    get listener() {
        return this.rawContext.listener;
    }
    /**
     * This will only be instantiated in an OfflineAudioContext.
     */
    async render() {
        if (this.isOffline) {
            return this.rawContext.startRendering();
        }
        else {
            throw new Error("render is only available in an OfflineAudioContext");
        }
    }
    /**
     * Close the context.
     */
    async close() {
        if (isAudioContext(this.rawContext) && this.state === "running") {
            await this.rawContext.close();
        }
        // Then dispose all of the nodes
        this.dispose();
    }
    /**
     * Resume the audio context. It is required to resume the audio context
     * after it is created. It is recommended to resume after a user-initiated event
     * like a "click" or "keydown".
     */
    resume() {
        if (isAudioContext(this.rawContext)) {
            return resume(this);
        }
        else {
            return Promise.resolve();
        }
    }
    /**
     * **Internal** If the context is not running, start it.
     * This is required to be called on the first user-triggered event.
     */
    _start() {
        if (isAudioContext(this.rawContext)) {
            return start(this);
        }
        else {
            return Promise.resolve();
        }
    }
    /**
     * Create an {@link AnalyserNode}.
     */
    createAnalyser() {
        return this.rawContext.createAnalyser();
    }
    /**
     * Create a {@link BiquadFilterNode}.
     */
    createBiquadFilter() {
        return this.rawContext.createBiquadFilter();
    }
    /**
     * Create a {@link BufferSourceNode}.
     */
    createBufferSource() {
        return this.rawContext.createBufferSource();
    }
    /**
     * Create a {@link ChannelMergerNode}.
     */
    createChannelMerger(numberOfInputs) {
        return this.rawContext.createChannelMerger(numberOfInputs);
    }
    /**
     * Create a {@link ChannelSplitterNode}.
     */
    createChannelSplitter(numberOfOutputs) {
        return this.rawContext.createChannelSplitter(numberOfOutputs);
    }
    /**
     * Create a {@link ConstantSourceNode}.
     */
    createConstantSource() {
        return this.rawContext.createConstantSource();
    }
    /**
     * Create a {@link ConvolverNode}.
     */
    createConvolver() {
        return this.rawContext.createConvolver();
    }
    /**
     * Create a {@link DelayNode}.
     */
    createDelay(maxDelayTime) {
        return this.rawContext.createDelay(maxDelayTime);
    }
    /**
     * Create a {@link DynamicsCompressorNode}.
     */
    createDynamicsCompressor() {
        return this.rawContext.createDynamicsCompressor();
    }
    /**
     * Create a {@link GainNode}.
     */
    createGain() {
        return this.rawContext.createGain();
    }
    /**
     * Create an {@link IIRFilterNode}.
     */
    createIIRFilter(feedforward, feedback) {
        // @ts-ignore
        return this.rawContext.createIIRFilter(feedforward, feedback);
    }
    /**
     * Create an {@link OscillatorNode}.
     */
    createOscillator() {
        return this.rawContext.createOscillator();
    }
    /**
     * Create a {@link PannerNode}.
     */
    createPanner() {
        return this.rawContext.createPanner();
    }
    /**
     * Create a {@link PeriodicWave}.
     */
    createPeriodicWave(real, imag, constraints) {
        return this.rawContext.createPeriodicWave(real, imag, constraints);
    }
    /**
     * Create a {@link StereoPannerNode}.
     */
    createStereoPanner() {
        return this.rawContext.createStereoPanner();
    }
    /**
     * Create a {@link WaveShaperNode}.
     */
    createWaveShaper() {
        return this.rawContext.createWaveShaper();
    }
    /**
     * Decode the audio data from an array buffer.
     */
    decodeAudioData(audioData) {
        return this.rawContext.decodeAudioData(audioData);
    }
    /**
     * Convert the time into seconds.
     * @param time
     */
    toSeconds(time) {
        return new Time(time, undefined, this).toSeconds();
    }
    /**
     * Convert the time into ticks.
     * @param time
     */
    toTicks(time) {
        return new Ticks(time, undefined, this).toTicks();
    }
    /**
     * Convert the time into samples.
     * @param time
     */
    toSamples(time) {
        return this.toSeconds(time) * this.sampleRate;
    }
    /**
     * Convert the time into a frequency.
     * @param time
     */
    toFrequency(time) {
        return new Frequency(time, undefined, this).toFrequency();
    }
    /**
     * Convert a frequency into a note name.
     * @param frequency
     */
    frequencyToNote(frequency) {
        return new Frequency(frequency).toNote();
    }
    /**
     * Convert a midi note number into a frequency.
     * @param midi
     */
    midiToFrequency(midi) {
        return new Frequency(midi, "midi").toFrequency();
    }
    /**
     * Convert a note name to a frequency.
     * @param note
     */
    noteToFrequency(note) {
        return new Frequency(note).toFrequency();
    }
    /**
     * Convert a note name to a midi note number.
     * @param note
     */
    noteToMidi(note) {
        return new Frequency(note).toMidi();
    }
    /**
     * Convert the given MIDI note number to a callback progress.
     * @param midi
     */
    midiToNote(midi) {
        return new Frequency(midi, "midi").toNote();
    }
    /**
     * Convert the given frequency to a MIDI note number.
     * @param frequency
     */
    frequencyToMidi(frequency) {
        return new Frequency(frequency).toMidi();
    }
    /**
     * Convert the given ticks to seconds
     * @param ticks
     */
    ticksToSeconds(ticks) {
        return new Ticks(ticks, undefined, this).toSeconds();
    }
    /**
     * Convert the given ticks to bars.beats.sixteenths
     * @param ticks
     * @param timeSignature
     */
    ticksToBarsBeatsSixteenths(ticks, timeSignature) {
        const beats = ticks / this.transport.PPQ;
        const quarter = Math.floor(beats);
        const sixteenth = Math.floor((beats - quarter) * 4);
        const measures = Math.floor(quarter / timeSignature);
        const sixteenths = sixteenth;
        return `${measures}:${quarter % timeSignature}:${sixteenths}`;
    }
    /**
     * Convert the given gain to dB.
     * @param gain
     */
    gainToDb(gain) {
        return 20 * (Math.log(gain) / Math.LN10);
    }
    /**
     * Convert the given dB to gain.
     * @param db
     */
    dbToGain(db) {
        return Math.pow(10, db / 20);
    }
    /**
     * Convert an interval (in semitones) to a frequency ratio.
     * @param interval
     */
    intervalToFrequencyRatio(interval) {
        return Math.pow(2, (interval / 12));
    }
}
/**
 * A class for AudioContext specific stuff.
 * @category Core
 */
export class Context extends BaseAudioContext {
    constructor(options) {
        super();
        this.name = "Context";
        this._ticker = new Ticker(() => this.emit("tick"));
        this.rawContext = createAudioContext(options);
        this.on("tick", this._ticker.update.bind(this._ticker));
    }
    /**
     * The current audio context.
     */
    get rawContext() {
        return this._rawContext;
    }
    set rawContext(context) {
        this._rawContext = context;
        this.on("tick", this._ticker.update.bind(this._ticker));
    }
    /**
     * The LookAhead Time in seconds.
     */
    get lookAhead() {
        return this._ticker.lookAhead;
    }
    set lookAhead(l) {
        this._ticker.lookAhead = l;
    }
    /**
     * The update interval of the clock in seconds
     */
    get updateInterval() {
        return this._ticker.updateInterval;
    }
    set updateInterval(u) {
        this._ticker.updateInterval = u;
    }
    /**
     * The latency hint of the context.
     * This can be "interactive" (default), "playback", "balanced", or a number in seconds.
     * This value can be updated.
     */
    get latencyHint() {
        return this.rawContext.latencyHint;
    }
    /**
     * The transport for the context.
     */
    get transport() {
        if (!this._transport) {
            this._transport = new Transport({ context: this });
        }
        return this._transport;
    }
    set transport(transport) {
        this._transport = transport;
    }
    /**
     * The draw instance
     */
    get draw() {
        if (!this._draw) {
            this._draw = new Draw({ context: this });
        }
        return this._draw;
    }
    set draw(draw) {
        this._draw = draw;
    }
    /**
     * Create a new {@link Context} from the given audio context.
     */
    static fromContext(context) {
        if (isContext(context)) {
            return context;
        }
        else if (isAudioContext(context)) {
            // @ts-ignore
            return new Context(context);
        }
        else {
            // if it's a raw OfflineAudioContext
            // @ts-ignore
            return new OfflineContext(context);
        }
    }
    dispose() {
        super.dispose();
        this.off("tick", this._ticker.update.bind(this._ticker));
        this._ticker.dispose();
        if (this._transport) {
            this._transport.dispose();
        }
        if (this._draw) {
            this._draw.dispose();
        }
        this.emit("close");
        return this;
    }
}

/**
 * A class for OfflineAudioContext specific stuff.
 * @category Core
 */
export class OfflineContext extends BaseAudioContext {
    constructor(channels, duration, sampleRate) {
        super();
        this.name = "OfflineContext";
        this.isOffline = true;
        this.rawContext = createOfflineAudioContext(channels, duration, sampleRate);
    }
    /**
     * The current time of the audio context.
     */
    get currentTime() {
        return this.rawContext.currentTime;
    }
    /**
     * The transport for the context.
     */
    get transport() {
        if (!this._transport) {
            this._transport = new Transport({ context: this });
        }
        return this._transport;
    }
    set transport(transport) {
        this._transport = transport;
    }
    /**
     * The draw instance
     */
    get draw() {
        if (!this._draw) {
            this._draw = new Draw({ context: this });
        }
        return this._draw;
    }
    set draw(draw) {
        this._draw = draw;
    }
    /**
     * Resume the audio context. It is required to resume the audio context
     * after it is created. It is recommended to resume after a user-initiated event
     * like a "click" or "keydown".
     */
    resume() {
        return Promise.resolve();
    }
    dispose() {
        super.dispose();
        if (this._transport) {
            this._transport.dispose();
        }
        if (this._draw) {
            this._draw.dispose();
        }
        this.emit("close");
        return this;
    }
}
/**
 * Test if the given context is a {@link Context}
 */
export function isContext(context) {
    return context instanceof Context;
}
