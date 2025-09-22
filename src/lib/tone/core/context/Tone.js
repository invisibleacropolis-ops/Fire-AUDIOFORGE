import { getContext } from "./Context.js";
import { optionsFromArguments } from "../util/Defaults.js";
import { isDefined, isObject } from "../util/Type.js";
/**
 * The base class for all nodes that have an AudioContext.
 */
export class Tone {
    constructor() {
        //-------------------------------------
        //
        // CONNECTIONS
        //
        //-------------------------------------
        /**
         * The version of the library.
         */
        this.version = this.version;
        /**
         * The name of the class.
         */
        this.name = "Tone";
        const options = optionsFromArguments(Tone.getDefaults(), arguments);
        this.debug = options.debug;
        this.context = options.context;
    }
    static getDefaults() {
        return {
            context: getContext(),
            debug: false,
        };
    }
    /**
     * The context which the object belongs to.
     */
    get context() {
        return this._context;
    }
    set context(context) {
        this._context = context;
    }
    /**
     * Get the current time of the context.
     * @return The time in seconds.
     */
    now() {
        return this.context.now();
    }
    /**
     * The time in seconds of one sample.
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
     * The current time in seconds.
     */
    get currentTime() {
        return this.context.currentTime;
    }
    /**
     * The context's listener.
     */
    get listener() {
        return this.context.listener;
    }
    /**
     * The transport of the context.
     */
    get transport() {
        return this.context.transport;
    }
    /**
     * Convert the time to seconds.
     * @param time
     */
    toSeconds(time) {
        return this.context.toSeconds(time);
    }
    /**
     * Convert the time to ticks.
     * @param time
     */
    toTicks(time) {
        return this.context.toTicks(time);
    }
    /**
     * Convert the time to frequency.
     * @param time
     */
    toFrequency(time) {
        return this.context.toFrequency(time);
    }
    /**
     * Convert the time to samples.
     * @param time
     */
    toSamples(time) {
        return this.context.toSamples(time);
    }
    /**
     * The destination output of the context.
     */
    get destination() {
        return this.context.destination;
    }
    /**
     * The draw loop of the context
     */
    get draw() {
        return this.context.draw;
    }
    /**
     * The ticker of the context
     */
    get ticker() {
        return this.context.ticker;
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
     * The update interval of the context
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
     * The state of the context
     */
    get state() {
        return this.context.state;
    }
    /**
     * The raw context
     */
    get rawContext() {
        return this.context.rawContext;
    }
    /**
     * A promise which resolves when the context is running
     */
    get initialized() {
        return this.context.initialized();
    }
    /**
     * Returns true if the object has been disposed.
     */
    get disposed() {
        return this._wasDisposed;
    }
    /**
     * Clean up.
     */
    dispose() {
        this._wasDisposed = true;
        return this;
    }
    /**
     * A logging function which is gated by the `.debug` parameter.
     */
    log(...args) {
        if (this.debug) {
            // eslint-disable-next-line
            console.log(this.name, ...args);
        }
    }
    //-------------------------------------
    // UTILITIES
    //-------------------------------------
    /**
     * Test if the given argument is a valid time.
     * @param arg
     */
    isTime(arg) {
        return this.context.isTime(arg);
    }
    /**
     * Test if the given argument is a valid frequency.
     * @param arg
     */
    isFrequency(arg) {
        return this.context.isFrequency(arg);
    }
    /**
     * Test if the given argument is a valid ticks.
     * @param arg
     */
    isTicks(arg) {
        return this.context.isTicks(arg);
    }
    /**
     * Test if the given argument is a valid normal range.
     * @param arg
     */
    isNormalRange(arg) {
        return this.context.isNormalRange(arg);
    }
    /**
     * Test if the given argument is a valid audio range.
     * @param arg
     */
    isAudioRange(arg) {
        return this.context.isAudioRange(arg);
    }
    /**
     * Test if the given argument is a valid positive number.
     * @param arg
     */
    isPositive(arg) {
        return this.context.isPositive(arg);
    }
    /**
     * Test if the given argument is a valid boolean.
     * @param arg
     */
    isBoolean(arg) {
        return this.context.isBoolean(arg);
    }
    /**
     * Test if the given argument is a valid number.
     * @param arg
     */
    isNumber(arg) {
        return this.context.isNumber(arg);
    }
    /**
     * Test if the given argument is a valid string.
     * @param arg
     */
    isString(arg) {
        return this.context.isString(arg);
    }
    /**
     * Test if the given argument is a valid array.
     * @param arg
     */
    isArray(arg) {
        return this.context.isArray(arg);
    }
    /**
     * Test if the given argument is an object.
     * @param arg
     */
    isObject(arg) {
        return isObject(arg);
    }
    /**
     * Test if the given argument is undefined.
     * @param arg
     */
    isUndef(arg) {
        return this.context.isUndef(arg);
    }
    /**
     * Test if the given argument is defined.
     * @param arg
     */
    isDefined(arg) {
        return isDefined(arg);
    }
    /**
     * Get the default value if the given value is undefined.
     * @param arg
     * @param fallback
     */
    defaultArg(arg, fallback) {
        return this.context.defaultArg(arg, fallback);
    }
    /**
     * Get an options object from the arguments.
     * @param values
     * @param keys
     * @param defaults
     */
    optionsFromArguments(values, keys, defaults) {
        return optionsFromArguments(defaults, values, keys);
    }
    /**
     * Get the object's attributes as a json object.
     */
    get() {
        return {};
    }
    /**
     * Set multiple properties at once with an object.
     * @param params
     */
    set(params) {
        return this;
    }
}
