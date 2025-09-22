import { __decorate } from "tslib";
import { version } from "../../version.js";
import { createAudioContext, createOfflineAudioContext, } from "./AudioContext.js";
import { isAudioContext, isNumber, isOfflineAudioContext, isString, } from "../util/Type.js";
import { Emitter } from "../util/Emitter.js";
import { Timeline } from "../util/Timeline.js";
import { Ticker } from "../clock/Ticker.js";
import { Transport } from "../clock/Transport.js";
import { Destination } from "../Destination.js";
import { Draw } from "../util/Draw.js";
import { optionsFromArguments } from "../util/Defaults.js";
import { Seconds } from "../type/Units.js";
import { Gain } from "./Gain.js";
/**
 * Wrapper around the native AudioContext.
 * @category Core
 */
export class Context extends Emitter {
    constructor() {
        super();
        const options = optionsFromArguments(Context.getDefaults(), arguments, [
            "context",
        ]);
        if (options.context) {
            this._context = options.context;
        }
        else {
            this._context = createAudioContext();
        }
        this._latencyHint = options.latencyHint;
        // add the consoles
        if (options.debug) {
            this.debug = options.debug;
        }
        // the default destination node
        this.destination = new Destination({ context: this });
        // create the transport
        this.transport = new Transport({ context: this });
        // the draw loop
        this.draw = new Draw({ context: this });
        // the ticker
        this.ticker = new Ticker({
            context: this,
            callback: this._readoutLoop.bind(this),
            type: options.clockSource,
            updateInterval: options.updateInterval,
        });
        this.transport.on("start", (time, offset) => {
            this.emit("start", time, offset);
        });
        this.transport.on("stop", (time) => {
            this.emit("stop", time);
        });
        this.transport.on("pause", (time) => {
            this.emit("pause", time);
        });
        this.transport.on("loop", (time) => {
            this.emit("loop", time);
        });
        this.transport.on("loopStart", (time) => {
            this.emit("loopStart", time);
        });
        this.transport.on("loopEnd", (time) => {
            this.emit("loopEnd", time);
        });
        // events
        this._eventLoop = this._eventLoop.bind(this);
        this._readoutLoop = this._readoutLoop.bind(this);
        this._context.onstatechange = () => {
            this.emit("statechange", this.state);
        };
        // look ahead
        this._lookAhead = options.lookAhead;
        // name
        this.name = "Context";
        // throw an error if the context is already running
        if (this._context.state === "running") {
            this.log("AudioContext is already running. This is probably a bug. Expect errors.");
        }
    }
    static getDefaults() {
        return {
            clockSource: "worker",
            latencyHint: "interactive",
            lookAhead: 0.1,
            updateInterval: 0.05,
            debug: false,
        };
    }
    //---------------------------
    // BASE AUDIO CONTEXT METHODS
    //---------------------------
    /**
     * The native {@link AudioContext}
     */
    get rawContext() {
        return this._context;
    }
    /**
     * The current time in seconds of the AudioContext.
     */
    get currentTime() {
        return this._context.currentTime;
    }
    /**
     * The current time in seconds of the AudioContext.
     */
    get state() {
        return this._context.state;
    }
    /**
     * The sample rate of the audio context.
     */
    get sampleRate() {
        return this._context.sampleRate;
    }
    /**
     * The listener
     */
    get listener() {
        return this._context.listener;
    }
    /**
     * The duration in seconds of one sample.
     */
    get sampleTime() {
        return 1 / this.sampleRate;
    }
    /**
     * This is the time that the AudioContext is rendering at.
     */
    now() {
        return this._context.currentTime + this.lookAhead;
    }
    /**
     * The maximum number of channels supported by the AudioContext.
     */
    get maxChannels() {
        return this._context.destination.maxChannelCount;
    }
    /**
     * THe current lookup time of the requests in the timer.
     * This is not the same as the AudioContext's time.
     * Is only useful for methods which are scheduled by the {@link Ticker}.
     */
    get lookAhead() {
        return this.ticker.updateInterval + this.blockTime * 4;
    }
    /**
     * The block size of the audio context from the underlying audio driver.
     * @see {@link https://dev.opera.com/articles/webaudio-timing-precision/}
     */
    get blockTime() {
        return 128 / this.sampleRate;
    }
    /**
     * The time of the next block of audio that will be processed.
     * This is not the same as the AudioContext's time.
     * Is only useful for methods which are scheduled by the {@link Ticker}.
     */
    get nextTick() {
        return this.ticker.nextTick;
    }
    /**
     * Create an audio buffer from the contents of an audio file.
     */
    decodeAudioData(audioData) {
        return this._context.decodeAudioData(audioData);
    }
    //---------------------------
    // SCHEDULING/TIMING
    //---------------------------
    /**
     * A reference to the {@link Transport} which allows for scheduling and control
     * over all scheduled events.
     */
    get transport() {
        return this._transport;
    }
    set transport(transport) {
        this._transport = transport;
    }
    /**
     * The {@link Destination} node for the context.
     */
    get destination() {
        return this._destination;
    }
    set destination(destination) {
        if (this._destination) {
            this._destination.dispose();
        }
        this._destination = destination;
        this.emit("destination", destination);
    }
    /**
     * A reference to the {@link Draw} which is the clock for drawable events.
     */
    get draw() {
        return this._draw;
    }
    set draw(d) {
        this._draw = d;
    }
    /**
     * A reference to the {@link Ticker} which is the master clock for all sources.
     */
    get ticker() {
        return this._ticker;
    }
    set ticker(t) {
        this._ticker = t;
    }
    /**
     * The timeout for `resolve`
     */
    get lookAhead() {
        return this._lookAhead;
    }
    set lookAhead(time) {
        this._lookAhead = time;
    }
    /**
     * How often the interval callback is invoked.
     * This is for the draw callbacks.
     */
    get updateInterval() {
        return this.ticker.updateInterval;
    }
    set updateInterval(interval) {
        this.ticker.updateInterval = interval;
    }
    /**
     * The type of playback, which affects latency.
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/latencyHint}
     */
    get latencyHint() {
        return this._latencyHint;
    }
    /**
     * The clock source determines the type of clock that the context uses.
     * Can be "worker" (uses a Web Worker), "timeout" (uses `setTimeout`),
     * or "offline" (driven by the OfflineAudioContext).
     */
    get clockSource() {
        return this.ticker.type;
    }
    /**
     * The current time of the context, plus a short lookAhead.
     * @see {@link lookAhead}
     */
    now() {
        return this._context.currentTime + this.lookAhead;
    }
    /**
     * The current time of the context in seconds.
     * Same as {@link currentTime}.
     */
    get seconds() {
        return this._context.currentTime;
    }
    /**
     * The unique identifier for the context.
     */
    get id() {
        return this._context.id;
    }
    /**
     * Create a {@link Tone.Gain} node.
     */
    createGain() {
        return new Gain({ context: this }).toDestination();
    }
    /**
     * The time (in seconds) of the next rendering quantum.
     * This is not the same as the {@link currentTime}, but is the
     * time of the start of the next block of audio that will be processed.
     */
    get nextBlockTime() {
        return this.transport.nextSubdivision(this.blockTime);
    }
    /**
     * A time which is guaranteed to be ahead of the current time.
     * This is useful for scheduling events in the near future.
     */
    get immediate() {
        return this.now();
    }
    /**
     * The current time.
     */
    get currentTime() {
        return this._context.currentTime;
    }
    /**
     * A time which is guaranteed to be ahead of the current time.
     * This is useful for scheduling events in the near future.
     */
    get immediate() {
        return this.now();
    }
    /**
     * The time until the next audio block is processed.
     */
    get blockTime() {
        return 128 / this.sampleRate;
    }
    /**
     * The time of the next audio block.
     */
    get nextTick() {
        return this.immediate + this.blockTime;
    }
    /**
     * The duration of a single sample.
     */
    get sampleTime() {
        return 1 / this.sampleRate;
    }
    /**
     * The current {@link Transport} time in seconds.
     */
    get transportTime() {
        return this.transport.seconds;
    }
    /**
     * The {@link Draw} loop
     */
    get draw() {
        return this._draw;
    }
    /**
     * The {@link Transport}
     */
    get transport() {
        return this._transport;
    }
    /**
     * The {@link Destination}
     */
    get destination() {
        return this._destination;
    }
    /**
     * The {@link Ticker}
     */
    get ticker() {
        return this._ticker;
    }
    /**
     * The {@link Listener}
     */
    get listener() {
        return this.rawContext.listener;
    }
    /**
     * The underlying AudioContext
     */
    get rawContext() {
        return this._context;
    }
    /**
     * The current audio context time, plus a short {@link lookAhead}.
     */
    now() {
        return this._context.currentTime + this.lookAhead;
    }
    /**
     * The current audio context time without the lookAhead.
     * In most cases, it's better to use {@link now} to schedule events.
     */
    get currentTime() {
        return this._context.currentTime;
    }
    /**
     * The audio context's sample rate.
     */
    get sampleRate() {
        return this._context.sampleRate;
    }
    /**
     * The state of the audio context.
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/state}
     */
    get state() {
        return this._context.state;
    }
    /**
     * The type of playback, which affects latency.
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/latencyHint}
     */
    get latencyHint() {
        var _a;
        if (isString(this._context.latencyHint)) {
            return this._context.latencyHint;
        }
        else if (isNumber((_a = this._context.baseLatency) !== null && _a !== void 0 ? _a : 0)) {
            return this._context.baseLatency;
        }
        else {
            return 0;
        }
    }
    /**
     * The readonly sample rate of the entire AudioContext
     */
    get sampleRate() {
        return this._context.sampleRate;
    }
    /**
     * The current time of the AudioContext in seconds.
     */
    get currentTime() {
        return this._context.currentTime;
    }
    /**
     * The current time of the AudioContext in seconds.
     */
    get state() {
        return this._context.state;
    }
    /**
     * The listener which can be used to control the listener's position and orientation.
     */
    get listener() {
        return this.rawContext.listener;
    }
    /**
     * The {@link Destination} node for the context.
     */
    get destination() {
        return this._destination;
    }
    set destination(destination) {
        if (this._destination) {
            this._destination.dispose();
        }
        this._destination = destination;
        // send all of the events to the new destination
        this.emit("destination", destination);
    }
    /**
     * The {@link Transport} which is the master clock for the context.
     */
    get transport() {
        return this._transport;
    }
    set transport(transport) {
        this._transport = transport;
    }
    /**
     * The {@link Draw} which is used to synchronize online and offline events.
     */
    get draw() {
        return this._draw;
    }
    set draw(draw) {
        this._draw = draw;
    }
    /**
     * The {@link Ticker} which is used to schedule events.
     */
    get ticker() {
        return this._ticker;
    }
    set ticker(ticker) {
        this._ticker = ticker;
    }
    /**
     * The underlying AudioContext.
     */
    get rawContext() {
        return this._context;
    }
    /**
     * A promise which resolves when the context is running.
     */
    async initialized() {
        if (this.state === "running") {
            return;
        }
        return new Promise((resolve) => {
            const res = () => {
                resolve();
                this.off("statechange", res);
            };
            this.on("statechange", res);
        });
    }
    /**
     * Resume the audio context.
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume}
     */
    async resume() {
        if (this._context.state === "suspended") {
            await this._context.resume();
        }
        if (this._context.state === "running") {
            this.emit("resume");
        }
        return this;
    }
    /**
     * Get a timestamp from the audiocontext's time. The time will be
     * the AudioContext's current time plus the lookAhead time.
     * @param  time  When to get a timestamp.
     */
    getTimestamp(time) {
        const computedTime = this.toSeconds(time);
        return this.now() + computedTime;
    }
    /**
     * The current time of the context in seconds.
     */
    get seconds() {
        return this.currentTime;
    }
    /**
     * The version of the library.
     */
    get version() {
        return version;
    }
    /**
     * If the context is a "running" state
     */
    get isRunning() {
        return this.state === "running";
    }
    /**
     * The current destination node of the context.
     */
    get destination() {
        return this.destination;
    }
    /**
     * The transport of the context
     */
    get transport() {
        return this.transport;
    }
    /**
     * The listener of the context
     */
    get listener() {
        return this.listener;
    }
    /**
     * The draw loop of the context
     */
    get draw() {
        return this.draw;
    }
    /**
     * The ticker of the context
     */
    get ticker() {
        return this.ticker;
    }
    /**
     * The timeout for `resolve`
     */
    get lookAhead() {
        return this.lookAhead;
    }
    set lookAhead(time) {
        this.lookAhead = time;
    }
    /**
     * How often the interval callback is invoked.
     * This is for the draw callbacks.
     */
    get updateInterval() {
        return this.updateInterval;
    }
    set updateInterval(interval) {
        this.updateInterval = interval;
    }
    /**
     * The clock source determines the type of clock that the context uses.
     * Can be "worker" (uses a Web Worker), "timeout" (uses `setTimeout`),
     * or "offline" (driven by the OfflineAudioContext).
     */
    get clockSource() {
        return this.clockSource;
    }
    /**
     * The current time of the context, plus a short lookAhead.
     * @see {@link lookAhead}
     */
    now() {
        return this.now();
    }
    /**
     * The current time of the context in seconds.
     * Same as {@link currentTime}.
     */
    get seconds() {
        return this.seconds;
    }
    /**
     * The unique identifier for the context.
     */
    get id() {
        return this.id;
    }
    /**
     * Create a {@link Tone.Gain} node.
     */
    createGain() {
        return this.createGain();
    }
    /**
     * The time (in seconds) of the next rendering quantum.
     * This is not the same as the {@link currentTime}, but is the
     * time of the start of the next block of audio that will be processed.
     */
    get nextBlockTime() {
        return this.nextBlockTime;
    }
    /**
     * A time which is guaranteed to be ahead of the current time.
     * This is useful for scheduling events in the near future.
     */
    get immediate() {
        return this.immediate;
    }
    /**
     * The current time.
     */
    get currentTime() {
        return this.currentTime;
    }
    /**
     * A time which is guaranteed to be ahead of the current time.
     * This is useful for scheduling events in the near future.
     */
    get immediate() {
        return this.immediate;
    }
    /**
     * The time until the next audio block is processed.
     */
    get blockTime() {
        return this.blockTime;
    }
    /**
     * The time of the next audio block.
     */
    get nextTick() {
        return this.nextTick;
    }
    /**
     * The duration of a single sample.
     */
    get sampleTime() {
        return this.sampleTime;
    }
    /**
     * The current {@link Transport} time in seconds.
     */
    get transportTime() {
        return this.transportTime;
    }
    /**
     * The {@link Draw} loop
     */
    get draw() {
        return this.draw;
    }
    /**
     * The {@link Transport}
     */
    get transport() {
        return this.transport;
    }
    /**
     * The {@link Destination}
     */
    get destination() {
        return this.destination;
    }
    /**
     * The {@link Ticker}
     */
    get ticker() {
        return this.ticker;
    }
    /**
     * The {@link Listener}
     */
    get listener() {
        return this.listener;
    }
    /**
     * The underlying AudioContext
     */
    get rawContext() {
        return this.rawContext;
    }
    /**
     * The current audio context time, plus a short {@link lookAhead}.
     */
    now() {
        return this.now();
    }
    /**
     * The current audio context time without the lookAhead.
     * In most cases, it's better to use {@link now} to schedule events.
     */
    get currentTime() {
        return this.currentTime;
    }
    /**
     * The audio context's sample rate.
     */
    get sampleRate() {
        return this.sampleRate;
    }
    /**
     * The state of the audio context.
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/state}
     */
    get state() {
        return this.state;
    }
    /**
     * The type of playback, which affects latency.
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/latencyHint}
     */
    get latencyHint() {
        return this.latencyHint;
    }
    /**
     * The readonly sample rate of the entire AudioContext
     */
    get sampleRate() {
        return this.sampleRate;
    }
    /**
     * The current time of the AudioContext in seconds.
     */
    get currentTime() {
        return this.currentTime;
    }
    /**
     * The current time of the AudioContext in seconds.
     */
    get state() {
        return this.state;
    }
    /**
     * The listener which can be used to control the listener's position and orientation.
     */
    get listener() {
        return this.listener;
    }
    /**
     * The {@link Destination} node for the context.
     */
    get destination() {
        return this.destination;
    }
    set destination(destination) {
        this.destination = destination;
    }
    /**
     * The {@link Transport} which is the master clock for the context.
     */
    get transport() {
        return this.transport;
    }
    set transport(transport) {
        this.transport = transport;
    }
    /**
     * The {@link Draw} which is used to synchronize online and offline events.
     */
    get draw() {
        return this.draw;
    }
    set draw(draw) {
        this.draw = draw;
    }
    /**
     * The {@link Ticker} which is used to schedule events.
     */
    get ticker() {
        return this.ticker;
    }
    set ticker(ticker) {
        this.ticker = ticker;
    }
    /**
     * The underlying AudioContext.
     */
    get rawContext() {
        return this.rawContext;
    }
    /**
     * A promise which resolves when the context is running.
     */
    async initialized() {
        await this.initialized();
    }
    /**
     * Resume the audio context.
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume}
     */
    async resume() {
        return await this.resume();
    }
    /**
     * Get a timestamp from the audiocontext's time. The time will be
     * the AudioContext's current time plus the lookAhead time.
     * @param  time  When to get a timestamp.
     */
    getTimestamp(time) {
        return this.getTimestamp(time);
    }
    /**
     * The current time of the context in seconds.
     */
    get seconds() {
        return this.seconds;
    }
    /**
     * The version of the library.
     */
    get version() {
        return this.version;
    }
    /**
     * If the context is a "running" state
     */
    get isRunning() {
        return this.isRunning;
    }
    /**
     * The current destination node of the context.
     */
    get destination() {
        return this.destination;
    }
    /**
     * The transport of the context
     */
    get transport() {
        return this.transport;
    }
    /**
     * The listener of the context
     */
    get listener() {
        return this.listener;
    }
    /**
     * The draw loop of the context
     */
    get draw() {
        return this.draw;
    }
    /**
     * The ticker of the context
     */
    get ticker() {
        return this.ticker;
    }
    //-------------------------------------
    // TICKER
    //-------------------------------------
    /**
     * The frequency of the ticker in hertz.
     */
    get blockTime() {
        return this.ticker.blockTime;
    }
    /**
     * The time in seconds between each tick of the ticker.
     */
    get sampleTime() {
        return this.ticker.sampleTime;
    }
    /**
     * The latency hint of the context
     */
    get latencyHint() {
        return this._latencyHint;
    }
    /**
     * The lookAhead of the context
     */
    get lookAhead() {
        return this._lookAhead;
    }
    /**
     * The update interval of the ticker
     */
    get updateInterval() {
        return this.ticker.updateInterval;
    }
    /**
     * The clock source of the context
     */
    get clockSource() {
        return this.ticker.type;
    }
    /**
     * The number of lookAhead samples
     */
    get lookAheadSamples() {
        return Math.ceil(this.sampleRate * this.lookAhead);
    }
    /**
     * The current time of the context.
     */
    get currentTime() {
        return this._context.currentTime;
    }
    /**
     * The current time of the context.
     */
    get state() {
        return this._context.state;
    }
    //-------------------------------------
    // CONVERSIONS
    //-------------------------------------
    /**
     * Convert the input time into seconds.
     * @param time
     */
    toSeconds(time) {
        return this.transport.toSeconds(time);
    }
    /**
     * Convert the input time into ticks.
     * @param time
     */
    toTicks(time) {
        return this.transport.toTicks(time);
    }
    /**
     * Convert the input time into a frequency.
     * @param time
     */
    toFrequency(time) {
        return this.transport.toFrequency(time);
    }
    /**
     * Convert the input time into samples.
     * @param time
     */
    toSamples(time) {
        return this.transport.toSamples(time);
    }
    //-------------------------------------
    // TIMEOUTS
    //-------------------------------------
    /**
     * The private loop which looks ahead and schedules events.
     */
    _readoutLoop() {
        const now = this.now();
        // stop everything that should have been stopped by now
        this.emit("pre-tick", now);
        // schedule the events that are coming up
        this.emit("tick", now);
        // call the draw loop
        this.draw.emit("update", now);
        this.emit("post-tick", now);
    }
    /**
     * Close the context.
     */
    close() {
        if (this !== defaultContext) {
            this.emit("close", this);
            return this._context.close();
        }
        else {
            return Promise.resolve();
        }
    }
    /**
     * **Internal** Only a single event loop can be running at a time.
     * The event loop is started when the first event is scheduled.
     */
    _startEventLoop() {
        if (!this._eventLoop) {
            this._eventLoop = setInterval(this._eventLoop, this.updateInterval * 1000);
        }
    }
    /**
     * **Internal** The event loop.
     */
    _eventLoop() {
        const now = this.now();
        this._timeline.forEachAtTime(now, (event) => {
            event();
        });
    }
    /**
     * Schedule a callback to be invoked at a specific time.
     * The callback will be invoked approximately at the given time.
     *
     * @param callback The callback to invoke
     * @param time The time to invoke the callback at
     * @returns The id of the event which can be used to cancel the event.
     */
    setTimeout(callback, time) {
        const id = this._timeline.add({
            callback,
            time: this.now() + time,
        });
        if (!this._eventLoop) {
            this._startEventLoop();
        }
        return id;
    }
    /**
     * Clears a previously scheduled timeout with {@link setTimeout}
     * @param id The ID returned from {@link setTimeout}
     */
    clearTimeout(id) {
        this._timeline.remove(id);
        if (this._timeline.length === 0) {
            clearInterval(this._eventLoop);
            this._eventLoop = 0;
        }
    }
    /**
     * The private loop which looks ahead and schedules events.
     */
    _readoutLoop() {
        this.ticker.callback();
    }
    /**
     * Close the context and all nodes attached to it.
     */
    dispose() {
        super.dispose();
        this.transport.dispose();
        this.destination.dispose();
        this.draw.dispose();
        this.ticker.dispose();
        this.emit("close");
        return this;
    }
}
__decorate([
    isString
], Context.prototype, "_latencyHint", void 0);
/**
 * The default audio context.
 */
let defaultContext;
// if it's in a browser, create a default context
if (typeof window !== "undefined" && window.AudioContext) {
    defaultContext = new Context();
}
else {
    // if it's not in a browser, still create a context
    defaultContext = new Context();
}
/**
 * A reference to the default context.
 */
export const theContext = defaultContext;
//-------------------------------------
// EMITTER PROXY
//-------------------------------------
/**
 * The emitter which is used for all events that are not specific to a single {@link Context}.
 */
const globalEmitter = new Emitter();
/**
 * @category Core
 */
export function onContextInit(callback) {
    globalEmitter.on("init", callback);
}
/**
 * @category Core
 */
export function onContextClose(callback) {
    globalEmitter.on("close", callback);
}
/**
 * @category Core
 */
export function onContextEvent(event, callback) {
    globalEmitter.on(event, callback);
}
/**
 * A reference to the default context
 * @category Core
 */
export let defaultContext = defaultContext;
/**
 * Get the default audio context.
 * @category Core
 */
export function getContext() {
    return defaultContext;
}
/**
 * Set the default audio context.
 * This should be called before any other {@link Tone} objects are created.
 * @category Core
 */
export function setContext(context) {
    if (isAudioContext(context)) {
        defaultContext = new Context(context);
    }
    else if (isOfflineAudioContext(context)) {
        defaultContext = new Context(context);
    }
    else {
        defaultContext = context;
    }
    globalEmitter.emit("init", defaultContext);
}
//-------------------------------------
//
// CONTEXT
//
//-------------------------------------
/**
 * The default {@link Context}
 */
export const context = getContext();
/**
 * The default {@link Context}
 */
export const defaultContext = context;
onContextEvent("init", (ctx) => {
    if (context !== ctx) {
        context = ctx;
        defaultContext = ctx;
    }
});
