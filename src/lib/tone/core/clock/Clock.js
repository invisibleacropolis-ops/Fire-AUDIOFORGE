
import { Emitter } from "../util/Emitter.js";
import { optionsFromArguments } from "../util/Defaults.js";
import { Timeline } from "../util/Timeline.js";
import { Ticks } from "../type/Ticks.js";
import { StateTimeline } from "../util/StateTimeline.js";
import { getContext } from "../Global.js";
/**
 * A sample-accurate clock which provides a callback at the given rate.
 * While `setInterval` is not sample-accurate and will drift over time,
 * this clock is based on the Web Audio `AudioContext.currentTime` and is
 * therefore very precise. For most applications, it is better to use
 * {@link Transport} instead of the Clock by itself since you can synchronize
 * multiple callbacks.
 *
 * @example
 * // the callback will be invoked every quarter note
 * const clock = new Clock(time => {
 * 	console.log(time);
 * }, "4n").start();
 * @category Core
 */
export class Clock extends Emitter {
    constructor() {
        super();
        this.name = "Clock";
        const options = optionsFromArguments(Clock.getDefaults(), arguments, ["callback", "frequency"]);
        this.context = options.context;
        this._nextTick = 0;
        this._lastUpdate = 0;
        this._state = new StateTimeline("stopped");
        /**
         * The callback function to invoke at the scheduled tick.
         */
        this.callback = options.callback;
        /**
         * The timeline of scheduled events.
         */
        this._timeline = new Timeline();
        /**
         * The clock's frequency that it's calculated against.
         * The rate of the callback is the important thing.
         */
        this.frequency = new Ticks(options.frequency);
        // listen for context events
        this._boundLoop = this._loop.bind(this);
        this.context.on("tick", this._boundLoop);
        this._readOnly("frequency");
        // start the clock with the new ticks
        this.ticks = 0;
    }
    static getDefaults() {
        return Object.assign(Emitter.getDefaults(), {
            callback: () => { },
            context: getContext(),
            frequency: 1,
        });
    }
    /**
     * The number of ticks which have passed since the clock started.
     */
    get ticks() {
        return this._ticks;
    }
    set ticks(t) {
        if (this._ticks !== t) {
            this._ticks = t;
            // do not reset the ticks while the clock is running
            if (this.state === "started") {
                const now = this.now();
                const remainingTime = this._getTickDuration(this.ticks, now) - now;
                if (remainingTime > 0) {
                    this._timeline.add({
                        event: "setTicks",
                        time: this.now() + remainingTime,
                        ticks: t,
                    });
                }
            }
        }
    }
    /**
     * The time in seconds which have passed since the clock started.
     */
    get seconds() {
        return this._ticks * this.frequency.valueOf();
    }
    set seconds(s) {
        this.ticks = this.context.secondsToTicks(s, this.frequency);
    }
    /**
     * The rate of the clock. This value can be updated while the clock is running.
     * @example
     * const clock = new Clock(time => {
     * 	console.log(time)
     * }, "4n");
     * clock.frequency.value = "8n"; // make it twice as fast
     */
    get frequency() {
        return this._frequency;
    }
    set frequency(freq) {
        this._frequency = freq;
    }
    /**
     * The current state of the clock.
     */
    get state() {
        return this._state.getValueAtTime(this.now());
    }
    /**
     * Return the time of the clock at the given time.
     * @param  time  When to get the time of the clock.
     * @return The time in seconds.
     */
    getSecondsAtTime(time) {
        time = this.toSeconds(time);
        const stopEvent = this._state.getLastState("stopped", time);
        const startEvent = this._state.getLastState("started", time);
        if (!startEvent) {
            return 0;
        }
        else if (!stopEvent || (startEvent.time > stopEvent.time)) {
            // if it's started and not stopped
            return (time - startEvent.time) * startEvent.offset;
        }
        else {
            return 0;
        }
    }
    /**
     * Set the clock's ticks at the given time.
     * @param ticks The tick value to set
     * @param time When to set the ticks.
     */
    setTicksAtTime(ticks, time) {
        time = this.toSeconds(time);
        this._timeline.add({
            time,
            ticks,
            event: "setTicks"
        });
        return this;
    }
    /**
     * The time in seconds of the next scheduled tick
     */
    nextTickTime(offset, now) {
        const tickDuration = this._getTickDuration();
        const firstTick = this._ticks + offset;
        const nextTickTime = this._getTickDuration(firstTick, now);
        return Math.max(nextTickTime, now);
    }
    /**
     * Get the tick duration, optionally passed in the ticks and current now time.
     */
    _getTickDuration(ticks, now) {
        ticks = ticks === undefined ? this._ticks : ticks;
        now = now === undefined ? this.now() : now;
        const startEvent = this._state.getLastState("started", now);
        if (startEvent) {
            const startOffset = this._getTicksAtTime(startEvent.time);
            return startEvent.time + (ticks - startOffset) * this.frequency.valueOf() / startEvent.offset;
        }
        else {
            return Infinity;
        }
    }
    /**
     * Get the number of ticks at the given time
     * @param time When to get the ticks
     */
    _getTicksAtTime(time) {
        const lastSetTick = this._timeline.get(time);
        if (lastSetTick && lastSetTick.event === "setTicks") {
            return lastSetTick.ticks;
        }
        const startEvent = this._state.get(time);
        if (startEvent && startEvent.state === "started") {
            if (lastSetTick && lastSetTick.time >= startEvent.time && lastSetTick.event === "setTicks") {
                return lastSetTick.ticks;
            }
            else {
                return Math.round(this._getTicksAtTime(startEvent.time) + (time - startEvent.time) / this.frequency.valueOf() * startEvent.offset);
            }
        }
        else {
            return 0;
        }
    }
    /**
     * Start the clock at the given time.
     * @param  time  The time to start the clock.
     * @param  offset  Where the clock should start from in seconds.
     */
    start(time, offset) {
        const computedTime = this.toSeconds(time);
        if (this._state.getValueAtTime(computedTime) !== "started") {
            this._state.setStateAtTime("started", computedTime);
            if (offset !== undefined) {
                this.setTicksAtTime(this.context.secondsToTicks(offset, this.frequency), computedTime);
            }
        }
        return this;
    }
    /**
     * Stop the clock at the given time.
     * @param  time  The time to stop the clock.
     */
    stop(time) {
        const computedTime = this.toSeconds(time);

        this._state.cancel(computedTime);
        this._state.setStateAtTime("stopped", computedTime);
        return this;
    }
    /**
     * Pause the clock at the given time.
     * @param  time  The time to stop the clock.
     */
    pause(time) {
        const computedTime = this.toSeconds(time);
        if (this._state.getValueAtTime(computedTime) === "started") {
            this._state.setStateAtTime("paused", computedTime);
        }
        return this;
    }
    /**
     * The scheduling loop.
     */
    _loop() {
        const now = this._lastUpdate = this.now();
        if (this.state === "started") {
            // clear the timeline
            this._timeline.forEachBefore(now, (event) => {
                if (event.event === "setTicks") {
                    this._ticks = event.ticks;
                }
            });
            this._timeline.cancelBefore(now);
            // get the next event
            const nextTick = Math.ceil(this._getTicksAtTime(now));
            const nextTickTime = this._getTickDuration(nextTick, now);
            try {
                if (nextTickTime <= now && nextTick > this._ticks) {
                    this.emit("tick", now, nextTick);
                    this._ticks = nextTick;
                    this.callback(now, nextTick);
                }
            }
            catch (e) {
                // if the callback error is generated from one of the callbacks
                this.emit("error", e);
            }
        }
    }
    /**
     * Returns the scheduled state at the given time.
     * @param  time  The time to query.
     * @return  The name of the state.
     */
    getStateAtTime(time) {
        time = this.toSeconds(time);
        return this._state.getValueAtTime(time);
    }
    /**
     * Clean up
     */
    dispose() {
        super.dispose();
        this.context.off("tick", this._boundLoop);
        this._timeline.dispose();
        this.frequency.dispose();
        return this;
    }
}
