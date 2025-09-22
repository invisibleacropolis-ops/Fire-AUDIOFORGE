import { __decorate } from "tslib";
import { ToneWithContext } from "../ToneWithContext.js";
import { optionsFromArguments } from "../util/Defaults.js";
import { Emitter } from "../util/Emitter.js";
import { Ticks } from "../type/Ticks.js";
import { StateTimeline } from "../util/StateTimeline.js";
import { getContext } from "../context/Context.js";
/**
 * A sample-accurate clock which provides a callback at the given rate.
 * While `setInterval` is not sample-accurate and will drift over time,
 * this clock is based on the Web Audio `AudioContext.currentTime` and is
 * therefore sample-accurate.
 *
 * @param callback The callback to be invoked with the time of the audio event
 * @param frequency The rate of the callback
 * @example
 * // the callback will be invoked approximately once a second
 * // and will print the time exactly once a second apart.
 * const clock = new Clock(time => {
 * 	console.log(time);
 * }, 1).start();
 * @category Core
 */
export class Clock extends ToneWithContext {
    constructor() {
        const options = optionsFromArguments(Clock.getDefaults(), arguments, [
            "callback",
            "frequency",
        ]);
        super(options);
        this.name = "Clock";
        /**
         * The callback function to invoke at the scheduled tick.
         */
        this.callback = options.callback;
        this._lastUpdate = 0;
        this._state = new StateTimeline("stopped");
        /**
         * The rate of the callback
         */
        this.frequency = new Ticks({
            context: this.context,
            units: "frequency",
            value: options.frequency,
        });
        this.ticks = 0;
        this._tickSource = new Ticks({
            context: this.context,
            units: "hertz",
            value: 1,
        });
        this._lastUpdate = 0;
        this.context.on("tick", this._boundLoop);
    }
    static getDefaults() {
        return Object.assign(ToneWithContext.getDefaults(), {
            callback: () => {
                //
            },
            frequency: 1,
        });
    }
    /**
     * The current state of the clock.
     */
    get state() {
        return this._state.getValueAtTime(this.now());
    }
    /**
     * Start the clock at the given time.
     * @param  time  When to start the clock.
     */
    start(time) {
        const computedTime = this.toSeconds(time);
        this.log("start", computedTime);
        if (this._state.getValueAtTime(computedTime) !== "started") {
            this._state.setStateAtTime("started", computedTime);
            this._tickSource.start(computedTime);
            if (computedTime < this._lastUpdate) {
                this.ticks = this.frequency.getTicksAtTime(computedTime);
            }
        }
        return this;
    }
    /**
     * Stop the clock at the given time.
     * @param  time  When to stop the clock.
     */
    stop(time) {
        const computedTime = this.toSeconds(time);
        this.log("stop", computedTime);
        this._state.cancel(computedTime);
        this._state.setStateAtTime("stopped", computedTime);
        this._tickSource.stop(computedTime);
        return this;
    }
    /**
     * Pause the clock at the given time.
     * @param  time  When to stop the clock.
     */
    pause(time) {
        const computedTime = this.toSeconds(time);
        if (this._state.getValueAtTime(computedTime) === "started") {
            this._state.setStateAtTime("paused", computedTime);
            this._tickSource.pause(computedTime);
        }
        return this;
    }
    /**
     * The scheduling loop.
     */
    _loop() {
        const now = this._lastUpdate;
        const lookAhead = this.context.lookAhead;
        this._lastUpdate = this.now();
        constelapsedTime = this._lastUpdate - now;
        if (elapsedTime > 0) {
            const events = this._state.getEventsBetween(now, now + elapsedTime);
            for (const event of events) {
                switch (event.state) {
                    case "started": {
                        const nextTick = event.time;
                        let ticks = this.frequency.getTicksAtTime(nextTick);
                        if (nextTick < now) {
                            ticks = Math.ceil(ticks);
                        }
                        if (ticks > this.ticks) {
                            this.ticks = ticks;
                            const time = this.frequency.getTimeOfTick(ticks);
                            this.callback(time);
                        }
                        break;
                    }
                }
            }
        }
    }
    /**
     * The scheduling loop.
     * @param  time  The current time of the AudioContext
     */
    _loop(time) {
        // the end of the update interval
        const endTime = time + this.context.blockTime;
        // get all of the events on this iteration
        const events = this._state.getEventsBetween(this._lastUpdate, endTime);
        for (const event of events) {
            // The tick is either selected relative to the transport's start time
            // or the sources start time
            let when = event.time;
            switch (event.state) {
                case "started": {
                    // get the ticks
                    const ticks = this._tickSource.getTicksAtTime(when);
                    if (ticks > this.ticks) {
                        this.ticks = ticks;
                        // get the time of the tick
                        const tickTime = this._tickSource.getTimeOfTick(ticks);
                        this.callback(tickTime);
                    }
                    break;
                }
            }
        }
        this._lastUpdate = endTime;
    }
    /**
     * Get the time of the next tick
     * @param  offset  The tick number.
     */
    nextTickTime(offset, now) {
        const computedNow = this.toSeconds(now);
        const currentTick = this.getTicksAtTime(computedNow);
        return this.getTimeOfTick(currentTick + offset, computedNow);
    }
    /**
     * Get the time of the given tick. The second argument
     * is when to get the tick from. Defaults to `now()`
     * @param  tick  The tick number.
     * @param  when  When to get the tick from.
     */
    getTimeOfTick(tick, when = this.now()) {
        return this._tickSource.getTimeOfTick(tick, when);
    }
    /**
     * Get the clock's ticks at the given time.
     * @param  time  When to get the ticks from.
     */
    getTicksAtTime(time) {
        return this._tickSource.getTicksAtTime(time);
    }
    /**
     * Get the clock's ticks at the given time.
     * @param  time  When to get the ticks from.
     */
    getTicksAtTime(time) {
        return this.frequency.getTicksAtTime(time);
    }
    /**
     * Get the time of the next tick
     * @param  offset  The tick number.
     * @param  when  When to get the tick from.
     */
    nextTickTime(offset, when) {
        const computedWhen = this.toSeconds(when);
        const currentTick = this.frequency.getTicksAtTime(computedWhen);
        return this.frequency.getTimeOfTick(currentTick + offset);
    }
    /**
     * Get the time of the given tick. The second argument
     * is when to get the tick from. Defaults to `now()`
     * @param  tick  The tick number.
     * @param  when  When to get the tick from.
     */
    getTimeOfTick(tick, when = this.now()) {
        return this.frequency.getTimeOfTick(tick, when);
    }
    /**
     * Set the clock's ticks at the given time.
     * @param  ticks The tick value to set
     * @param  time  When to set the ticks.
     */
    setTicksAtTime(ticks, time) {
        this.ticks = ticks;
        this._tickSource.setTicksAtTime(ticks, time);
        return this;
    }
    /**
     * Get the elapsed ticks between the given time and now
     */
    getElapsedTicks() {
        return this.ticks - this.getTicksAtTime(this.now());
    }
    /**
     * Set the clock's ticks at the given time.
     * @param  ticks The tick value to set
     * @param  time  When to set the ticks.
     */
    setTicksAtTime(ticks, time) {
        this.frequency.setTicksAtTime(ticks, time);
        return this;
    }
    /**
     * Get the elapsed ticks between the given time and now
     */
    getElapsedTicks(when) {
        return this.getTicksAtTime(this.now()) - this.getTicksAtTime(when);
    }
    dispose() {
        super.dispose();
        this.context.off("tick", this._boundLoop);
        this._tickSource.dispose();
        this._state.dispose();
        this.frequency.dispose();
        return this;
    }
}
__decorate([
    bound
], Clock.prototype, "_loop", null);
