import { __decorate } from "tslib";
import { ToneWithContext } from "../ToneWithContext.js";
import { optionsFromArguments } from "../util/Defaults.js";
import { Emitter } from "../util/Emitter.js";
import { StateTimeline } from "../util/StateTimeline.js";
import { Ticks } from "../type/Ticks.js";
import { TransportTime } from "../type/TransportTime.js";
import { BPM } from "../type/BPM.js";
import { TickParam } from "./TickParam.js";
import { isNumber } from "../util/Type.js";
import { TickSignal } from "./TickSignal.js";
import { Timeline } from "../util/Timeline.js";
import { onContextEvent } from "../context/Context.js";
import { getContext } from "../context/Context.js";
/**
 * Transport is the master timekeeper object of the entire application.
 * It is responsible for scheduling and timing all of the events.
 * By default, the transport is not started. To start it, call
 * `Transport.start()`. The transport can be started and stopped multiple
 * times.
 *
 * @example
 * import { Oscillator, Transport } from "tone";
 * const osc = new Oscillator().toDestination();
 * // repeat an event every quarter note
 * Transport.scheduleRepeat(time => {
 * 	// use the callback time to schedule events
 * 	osc.start(time).stop(time + 0.1);
 * }, "4n");
 * // transport must be started before it starts invoking events
 * Transport.start();
 * @category Core
 */
export class Transport extends ToneWithContext {
    constructor() {
        const options = optionsFromArguments(Transport.getDefaults(), arguments);
        super(options);
        this.name = "Transport";
        this._events = new Timeline();
        this._scheduledEvents = {};
        this._timeline = new Timeline();
        this._repeatedEvents = new Timeline();
        this._clock = new Ticks({
            context: this.context,
            callback: this._processTick.bind(this),
            frequency: 0,
        });
        this.bpm = new TickSignal({
            context: this.context,
            units: "bpm",
            value: options.bpm,
        });
        this.timeSignature = options.timeSignature;
        this._ppq = options.ppq;
        this._swing = new TickParam({
            context: this.context,
            value: 0,
            units: "positive",
        });
        this._swingAmount = 0;
        this._state = new StateTimeline("stopped");
        // start initially
        this._state.setStateAtTime("stopped", 0);
        this.loop = options.loop;
        this.loopStart = this.toTicks(options.loopStart);
        this.loopEnd = this.toTicks(options.loopEnd);
        this._clock.on("start", this._clockStart.bind(this));
        this._clock.on("stop", this._clockStop.bind(this));
        this._clock.on("pause", this._clockPause.bind(this));
        this.bpm.connect(this._clock.frequency);
        // an alias for the context
        this.context.transport = this;
    }
    static getDefaults() {
        return Object.assign(ToneWithContext.getDefaults(), {
            bpm: 120,
            loopEnd: "4m",
            loopStart: 0,
            loop: false,
            ppq: 192,
            swing: 0,
            swingSubdivision: "8n",
            timeSignature: 4,
        });
    }
    //-------------------------------------
    // TICKING
    //-------------------------------------
    /**
     * called on every tick
     * @param  tickTime clock relative tick time
     */
    _processTick(tickTime, ticks) {
        // do the swing
        if (this._swingAmount > 0 &&
            ticks % this._ppq !== 0 && // not on a quarter note
            ticks % this._swingTicks !== 0) {
            // add some swing
            const progress = (ticks % this._swingTicks) / this._swingTicks;
            const amount = Math.sin(progress * Math.PI);
            tickTime +=
                this.ticksToSeconds(this._swingAmount * this._swingTicks) *
                    amount;
        }
        // handle looping
        if (this.loop) {
            if (ticks >= this.loopEnd) {
                this.emit("loopEnd", tickTime);
                this._clock.setTicksAtTime(this.loopStart, tickTime);
                ticks = this.loopStart;
                this.emit("loopStart", tickTime, this.ticksToSeconds(ticks));
                this.emit("loop", tickTime);
            }
        }
        // fire the next tick events
        this._timeline.forEachAtTime(ticks, (event) => {
            event.callback(tickTime);
        });
    }
    //-------------------------------------
    // SCHEDULABLE EVENTS
    //-------------------------------------
    /**
     * Schedule an event along the transport.
     * @param  callback The callback to be invoked at the time.
     * @param  time The time to invoke the callback at.
     * @return The id of the schedule event. Use this to remove the event.
     * @example
     * import { Transport } from "tone";
     * // schedule an event on the 16th measure
     * Transport.schedule(time => {
     * 	// invoked on the 16th measure
     * }, "16:0:0");
     */
    schedule(callback, time) {
        const event = {
            time: this.toTicks(time),
            callback,
        };
        const id = this._addEvent(event, this._events);
        return id;
    }
    /**
     * Schedule a repeated event along the transport. The event will fire
     * at the `interval` starting at the `startTime`.
     * @param  callback   The callback to be invoked with the event time.
     * @param  interval   The interval between successive callbacks.
     * @param  startTime  When along the transport the callback should start being invoked.
     * @param  duration How long the event should repeat.
     * @return The id of the schedule event. Use this to remove the event.
     * @example
     * import { Oscillator, Transport } from "tone";
     * const osc = new Oscillator().toDestination();
     * // a callback invoked every eighth note starting from the second measure
     * Transport.scheduleRepeat(time => {
     * 	osc.start(time).stop(time + 0.1);
     * }, "8n", "2m");
     */
    scheduleRepeat(callback, interval, startTime, duration = Infinity) {
        const event = {
            time: this.toTicks(startTime),
            duration: this.toTicks(duration),
            interval: this.toTicks(interval),
            callback,
        };
        // when the event is scheduled, schedule the first callback
        const id = this._addEvent(event, this._repeatedEvents);
        // then invoke the callback based on the start time
        if (this.state === "started") {
            const now = this.now();
            if (this.seconds > this.toSeconds(event.time)) {
                this._rescheduleEvents(this.now(), this.seconds - this.toSeconds(event.time));
            }
        }
        return id;
    }
    /**
     * Schedule an event that will be removed after it is invoked.
     * @param  callback The callback to be invoked at the time.
     * @param  time The time to invoke the callback at.
     * @return The id of the schedule event. Use this to remove the event.
     * @example
     * import { Transport } from "tone";
     * Transport.scheduleOnce(time => {
     * 	// this callback is invoked only once at the given time
     * }, "2m");
     */
    scheduleOnce(callback, time) {
        const id = this.schedule((time) => {
            callback(time);
            this.clear(id);
        }, time);
        return id;
    }
    /**
     * Clear the scheduled event from the transport.
     * @param eventId The id of the event.
     */
    clear(eventId) {
        if (this._scheduledEvents.hasOwnProperty(eventId)) {
            const item = this._scheduledEvents[eventId];
            item.timeline.remove(item.event);
            delete this._scheduledEvents[eventId];
        }
        return this;
    }
    /**
     * Add an event to the correct timeline. Keep track of the
     * timeline it was added to.
     * @returns the event id which can be used to clear the event
     */
    _addEvent(event, timeline) {
        // generate a unique event id
        const id = Math.floor(Math.random() * 1000000);
        this._scheduledEvents[id] = {
            event,
            timeline,
        };
        timeline.add(event);
        return id;
    }
    /**
     * Remove all events from the transport.
     */
    cancel(after) {
        const computedAfter = this.toTicks(after);
        this._timeline.cancel(computedAfter);
        this._repeatedEvents.cancel(computedAfter);
        this._events.cancel(computedAfter);
        return this;
    }
    //-------------------------------------
    //
    // START/STOP/PAUSE
    //
    //-------------------------------------
    /**
     * Start the transport at the given time.
     * @param  time The time to start the transport.
     * @param  offset The offset from the start of the transport to begin playing.
     */
    start(time, offset) {
        const event = this._state.get(time);
        // if it's started, do nothing
        if (event && event.state === "started") {
            return this;
        }
        if (offset !== undefined) {
            this.ticks = this.toTicks(offset);
        }
        const computedTime = this.toSeconds(time);
        this._state.setStateAtTime("started", computedTime);
        this._clock.start(computedTime, this.ticks);
        this.emit("start", computedTime, this.toSeconds(this.ticks));
        return this;
    }
    /**
     * Stop the transport at the given time.
     * @param  time The time to stop the transport.
     */
    stop(time) {
        const computedTime = this.toSeconds(time);
        if (this._state.getValueAtTime(computedTime) === "stopped") {
            return this;
        }
        this._state.setStateAtTime("stopped", computedTime);
        this._clock.stop(computedTime);
        this.emit("stop", computedTime);
        return this;
    }
    /**
     * Pause the transport at the given time.
     */
    pause(time) {
        const computedTime = this.toSeconds(time);
        if (this._state.getValueAtTime(computedTime) === "started") {
            this._state.setStateAtTime("paused", computedTime);
            this._clock.pause(computedTime);
            this.emit("pause", computedTime);
        }
        return this;
    }
    /**
     * Toggle the current state of the transport. If it is
     * started, it will be paused, if it is paused, it will be started.
     */
    toggle(time) {
        const computedTime = this.toSeconds(time);
        const state = this._state.getValueAtTime(computedTime);
        if (state === "started") {
            this.pause(computedTime);
        }
        else {
            this.start(computedTime);
        }
        return this;
    }
    /**
     * When the clock starts, schedule all of the events
     */
    _clockStart(time, offset) {
        this.emit("start", time, offset);
        this._rescheduleEvents(time, offset);
    }
    _clockStop(time) {
        this.emit("stop", time);
    }
    _clockPause(time) {
        this.emit("pause", time);
    }
    _rescheduleEvents(time, offset) {
        this._timeline.cancel(0);
        // reschedule the events that are on the timeline
        this._events.forEach((event) => {
            this.schedule(event.callback, event.time);
        });
        // schedule the repeated events
        this._repeatedEvents.forEach((event) => {
            this.scheduleRepeat(event.callback, event.interval, event.time, event.duration);
        });
    }
    //-------------------------------------
    // GET/SET
    //-------------------------------------
    /**
     * The time signature as just the numerator over 4.
     * For example 4/4 would be 4 and 3/4 would be 3.
     * A time signature of 5/4 would be 5.
     */
    get timeSignature() {
        return this._timeSignature;
    }
    set timeSignature(ts) {
        if (isNumber(ts)) {
            this._timeSignature = ts;
            this.emit("timeSignature", ts);
        }
    }
    /**
     * The Transport's loop position
     */
    get loopStart() {
        return this.ticksToSeconds(this._loopStart);
    }
    set loopStart(start) {
        this._loopStart = this.toTicks(start);
    }
    /**
     * The Transport's loop end position
     */
    get loopEnd() {
        return this.ticksToSeconds(this._loopEnd);
    }
    set loopEnd(end) {
        this._loopEnd = this.toTicks(end);
    }
    /**
     * The loop state of the transport.
     */
    get loop() {
        return this._loop;
    }
    set loop(loop) {
        this._loop = loop;
        this.emit("loop", loop);
    }
    /**
     * Set the loop start and end points. The loop start position must be
     * before the loop end.
     * @param loopStart The loop start time.
     * @param loopEnd The loop end time.
     */
    setLoopPoints(loopStart, loopEnd) {
        this.loopStart = loopStart;
        this.loopEnd = loopEnd;
        return this;
    }
    /**
     * The swing value. Between 0-1 where 1 is full swing.
     */
    get swing() {
        return this._swingAmount;
    }
    set swing(amount) {
        this._swingAmount = amount;
    }
    /**
     * The subdivision of the swing.
     */
    get swingSubdivision() {
        return this.ticksToNotation(this._swingTicks, this._ppq);
    }
    set swingSubdivision(subdivision) {
        this._swingTicks = this.toTicks(subdivision);
    }
    /**
     * The Transport's position in Bars:Beats:Sixteenths.
     * Setting the value will jump the transport to that position.
     * @example
     * import { Transport } from "tone";
     * Transport.position = "4:3:2"; // set the transport to the 4th measure, 3rd beat, 2nd sixteenth note.
     */
    get position() {
        const now = this.now();
        const ticks = this.getTicksAtTime(now);
        return this.ticksToBarsBeatsSixteenths(ticks);
    }
    set position(progress) {
        const ticks = this.toTicks(progress);
        this.ticks = ticks;
    }
    /**
     * The Transport's position in seconds.
     * Setting the value will jump the transport to that position.
     */
    get seconds() {
        return this._clock.seconds;
    }
    set seconds(s) {
        const now = this.now();
        const ticks = this.bpm.timeToTicks(s, now);
        this.ticks = ticks.toTicks();
    }
    /**
     * The Transport's loop position in progress, always between 0-1.
     */
    get progress() {
        if (this.loop) {
            const now = this.now();
            const ticks = this.getTicksAtTime(now);
            return (ticks - this._loopStart) / (this._loopEnd - this._loopStart);
        }
        else {
            return 0;
        }
    }
    /**
     * The Transport's current tick position.
     */
    get ticks() {
        return this._clock.ticks;
    }
    set ticks(t) {
        if (this._clock.ticks !== t) {
            const now = this.now();
            if (this.state === "started") {
                const offset = this.ticksToSeconds(t);
                const transportTime = this.seconds;
                // set the clock's ticks
                this._clock.setTicksAtTime(t, now);
                this.emit("seek", now, offset);
                // re-evaluate the timeline events
                this._rescheduleEvents(now, offset - transportTime);
            }
            else {
                this._clock.ticks = t;
            }
        }
    }
    /**
     * The number of subdivisions per quarter note.
     */
    get PPQ() {
        return this._ppq;
    }
    set PPQ(ppq) {
        const currentTicks = this.ticks;
        this._ppq = ppq;
        // update the bpm
        this.bpm.factor = ppq;
        const newTicks = this.toTicks(currentTicks, this.seconds);
        this.ticks = newTicks;
    }
    /**
     * Returns the time of the given tick.
     * @param  tick The tick to get the time of.
     * @param  now  When to get the tick from.
     */
    getTimeOfTick(tick, now = this.now()) {
        return this._clock.getTimeOfTick(tick, now);
    }
    /**
     * Get the clock's ticks at the given time.
     * @param  time  When to get the ticks from.
     */
    getTicksAtTime(time) {
        return this._clock.getTicksAtTime(time);
    }
    /**
     * The current state of the transport.
     */
    get state() {
        return this._state.getValueAtTime(this.now());
    }
    /**
     * Return the transport's items as a string.
     */
    toString() {
        return "Transport";
    }
    //-------------------------------------
    //
    // TIME CONVERSIONS
    //
    //-------------------------------------
    /**
     * Convert from the transports ticks into seconds
     * @param ticks
     */
    ticksToSeconds(ticks) {
        const now = this.now();
        return this.bpm.ticksToTime(ticks, now).toSeconds();
    }
    /**
     * Convert the transports seconds into ticks
     * @param seconds
     */
    secondsToTicks(seconds) {
        const now = this.now();
        return this.bpm.timeToTicks(seconds, now).toTicks();
    }
    /**
     * Convert the transports ticks into time and return the time
     * in the given units.
     * @param ticks
     * @param units
     */
    ticksToUnits(ticks, units) {
        const now = this.now();
        const time = this.bpm.ticksToTime(ticks, now);
        return time.to(units);
    }
    /**
     * Convert a time into ticks.
     * @param time
     * @param now
     */
    toTicks(time, now = this.now()) {
        const seconds = this.toSeconds(time);
        const ticks = this.secondsToTicks(seconds);
        return ticks;
    }
    /**
     * Convert a time into ticks.
     * @param time
     * @param now
     */
    toTicks(time, now) {
        const computedNow = this.toSeconds(now);
        // process the time expression
        const seconds = this.toSeconds(time);
        return this.bpm.timeToTicks(seconds, computedNow).toTicks();
    }
    /**
     * Convert a time into seconds.
     * @param time
     * @param now
     */
    toSeconds(time, now = this.now()) {
        return super.toSeconds(time);
    }
    /**
     * Pulses Per Quarter note. This is the smallest resolution
     * the Transport timing supports. It is the number of ticks per quarter note.
     */
    get PPQ() {
        return this.bpm.factor;
    }
    set PPQ(ppq) {
        this.bpm.factor = ppq;
    }
    //-------------------------------------
    // TIME CONVERSIONS
    //-------------------------------------
    /**
     * Get the time aligned to the next subdivision
     * of the Transport.
     * @param  subdivision  The subdivision to quantize to
     * @return The time of the next subdivision.
     * @example
     * import { Transport } from "tone";
     * // the transport is not started, so this will return 0
     * Transport.nextSubdivision("4n");
     * // start the transport and log the time of the next subdivision
     * Transport.start();
     * setInterval(() => console.log(Transport.nextSubdivision("1m")), 100);
     */
    nextSubdivision(subdivision) {
        const subdivisionTicks = this.toTicks(subdivision);
        // the current tick at the current time
        const now = this.now();
        const transportPos = this.getTicksAtTime(now);
        // the next subdivision
        const nextSub = Math.ceil(transportPos / subdivisionTicks) * subdivisionTicks;
        return this.getTimeOfTick(nextSub);
    }
    /**
     * Get the time aligned to the next subdivision
     * of the Transport.
     * @param  subdivision  The subdivision to quantize to
     * @return The time of the next subdivision.
     * @example
     * // the transport is not started, so this will return 0
     * Transport.nextSubdivision("4n");
     * // start the transport and log the time of the next subdivision
     * Transport.start();
     * setInterval(() => console.log(Transport.nextSubdivision("1m")), 100);
     */
    nextSubdivision(subdivision, now) {
        const subdivisionTicks = this.toTicks(subdivision);
        const computedNow = this.toSeconds(now);
        // the current tick at the current time
        const transportPos = this.getTicksAtTime(computedNow);
        // the next subdivision
        const nextSub = Math.ceil(transportPos / subdivisionTicks) * subdivisionTicks;
        return this.getTimeOfTick(nextSub, computedNow);
    }
    /**
     * Attaches the Tone.js Transport to the given AudioContext.
     * @param context
     */
    setContext(context) {
        super.setContext(context);
    }
    dispose() {
        super.dispose();
        this._clock.dispose();
        this.bpm.dispose();
        this._swing.dispose();
        this._state.dispose();
        this._events.dispose();
        this._timeline.dispose();
        this._repeatedEvents.dispose();
        return this;
    }
}
__decorate([
    isNumber
], Transport.prototype, "timeSignature", null);
__decorate([
    isNumber
], Transport.prototype, "loopStart", null);
__decorate([
    isNumber
], Transport.prototype, "loopEnd", null);
__decorate([
    isBoolean
], Transport.prototype, "loop", null);
__decorate([
    isNumber
], Transport.prototype, "swing", null);
__decorate([
    isString
], Transport.prototype, "swingSubdivision", null);
//-------------------------------------
// 	INITIALIZATION
//-------------------------------------
onContextEvent("init", (context) => {
    // if it's not the default context, don't create a transport
    if (context.rawContext) {
        context.transport = new Transport({ context });
    }
});
onContextClose((context) => {
    if (context.transport) {
        context.transport.dispose();
    }
});
// Setup the default transport.
const transport = getContext().transport;
export default transport;
