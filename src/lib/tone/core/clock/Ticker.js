import { getContext } from "../context/Context.js";
import { Tone } from "../Tone.js";
import { optionsFromArguments } from "../util/Defaults.js";
import { Emitter } from "../util/Emitter.js";
import { Timeline } from "../util/Timeline.js";
import { intervalToSeconds, loop, secondsToUnits, } from "../type/Conversions.js";
const process = loop.bind(undefined);
/**
 * A class which provides initialization and cleanup behavior
 * for any process which needs to be executed on the Ticker.
 * The process will be started and stopped with the Ticker.
 */
class TickerProcess {
    constructor(callback) {
        this.callback = callback;
        this.id = -1;
    }
    /**
     * Start the process
     */
    start(context) {
        context.addInit(this.callback);
    }
    /**
     * Stop the process
     */
    stop(context) {
        context.removeInit(this.callback);
    }
}
/**
 * The Ticker is the master clock for all of the relevant timing events
 * that happen within Tone.js. The Ticker is completely independent of the
 * transport, manages it's own RAF and Timeout scheduling, and handles all of the
 * interaction with the AudioContext's timing.
 *
 * It is not instantiated by the user, there is a single Ticker instance passed
 * to all Tone.js objects, inside the {@link Context}.
 */
export class Ticker extends Emitter {
    constructor() {
        const options = optionsFromArguments(Ticker.getDefaults(), arguments, [
            "callback",
            "type",
            "updateInterval",
        ]);
        super();
        /**
         * The list of all of the events that are bound to the tick.
         */
        this._boundEvents = new Map();
        /**
         * The timeline of all the "init" events
         */
        this._inits = new Timeline();
        /**
         * The timeline of all the "dispose" events
         */
        this._disposes = new Timeline();
        this._callback = options.callback;
        this.type = options.type;
        this.updateInterval = options.updateInterval;
        // set the initial values
        this._createClock();
    }
    static getDefaults() {
        return {
            callback: () => {
                //
            },
            type: "worker",
            updateInterval: 0.03,
        };
    }
    /**
     * The update interval of the ticker
     */
    get updateInterval() {
        return this._updateInterval;
    }
    set updateInterval(interval) {
        this._updateInterval = Math.max(interval, 128 / this.context.sampleRate);
        if (this.type === "worker") {
            this._clock.postMessage(this._updateInterval * 1000);
        }
    }
    /**
     * The type of the ticker.
     */
    get type() {
        return this._type;
    }
    set type(type) {
        if (this._type !== type) {
            // tear down the old clock
            this._tearDownClock();
            this._type = type;
            // create the new clock
            this._createClock();
        }
    }
    /**
     * The method which is called on every tick.
     */
    _tick() {
        if (this._callback) {
            this._callback();
        }
    }
    /**
     * Bind a callback to the ticker.
     */
    _createClock() {
        if (this.type === "worker" && typeof Worker === "function") {
            try {
                this._clock = new Worker("./Ticker.worker.js");
                this._clock.onmessage = this._tick.bind(this);
                this._clock.postMessage(this._updateInterval * 1000);
            }
            catch (e) {
                // workers not supported, fallback to 'timeout'
                this.type = "timeout";
            }
        }
        else if (this.type === "timeout") {
            this._timeout = setTimeout(this._tick.bind(this), this._updateInterval * 1000);
        }
        else if (this.type === "raf") {
            this._raf = requestAnimationFrame(this._tick.bind(this));
        }
    }
    /**
     * Tear down the clock
     */
    _tearDownClock() {
        if (this._clock) {
            this._clock.terminate();
            this._clock = undefined;
        }
        if (this._timeout) {
            clearTimeout(this._timeout);
            this._timeout = undefined;
        }
        if (this._raf) {
            cancelAnimationFrame(this._raf);
            this._raf = undefined;
        }
    }
    /**
     * Add the process to the master ticker.
     */
    add(process) {
        if (!this._boundEvents.has(process.id)) {
            this._boundEvents.set(process.id, process);
            this._inits.add({
                callback: process.start,
                time: this.now() + this.blockTime,
            });
            if (this.state === "running") {
                this._tick();
            }
        }
    }
    /**
     * Remove the process from the master ticker
     */
    remove(process) {
        this._boundEvents.delete(process.id);
        this._disposes.add({
            callback: process.stop,
            time: this.now() + this.blockTime,
        });
    }
    /**
     * Get the current time of the Ticker.
     */
    now() {
        return this.context.currentTime * this.context.lookAhead;
    }
    /**
     * The time of the next tick
     */
    get nextTick() {
        return this.now() + this.blockTime;
    }
    /**
     * The time in seconds of a single block
     */
    get blockTime() {
        return 128 / this.context.sampleRate;
    }
    dispose() {
        super.dispose();
        this._tearDownClock();
        this._boundEvents.forEach((process) => process.stop(this.now()));
        this._boundEvents.clear();
        return this;
    }
}
//-------------------------------------
// THE SINGLETON
//-------------------------------------
// set up a new context, schedule events in the future
const Ticker = new Ticker({
    callback: process,
    context: getContext(),
});
/**
 * The singleton which is implicitly used by all objects created without a context.
 * The context in which the Ticker is running.
 */
export const context = Ticker.context;
/**
 * The time in seconds between each tick of the Ticker.
 */
export const blockTime = Ticker.blockTime;
/**
 * The current time in seconds of the Ticker.
 */
export const now = Ticker.now.bind(Ticker);
/**
 * The time of the next tick of the Ticker.
 */
export const nextTick = Ticker.nextTick.bind(Ticker);
/**
 * Add a process to the ticker. The process will be invoked on every tick.
 * @param process The process to add to the Ticker.
 */
export function add(process) {
    Ticker.add(process);
}
/**
 * Remove a process from the Ticker.
 * @param process The process to remove from the Ticker.
 */
export function remove(process) {
    Ticker.remove(process);
}
