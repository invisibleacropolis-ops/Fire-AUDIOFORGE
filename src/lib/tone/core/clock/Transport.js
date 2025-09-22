
import { Clock } from "./Clock.js";
import { Param } from "../context/Param.js";
import { optionsFromArguments } from "../util/Defaults.js";
import { Emitter } from "../util/Emitter.js";
import { readOnly } from "../util/Interface.js";
import { Timeline } from "../util/Timeline.js";
import { StateTimeline } from "../util/StateTimeline.js";
import { getContext } from "../context/Context.js";
/**
 * Transport is the master timekeeper object of the entire application.
 * It is responsible for scheduling events in the future and synchronizing them.
 * The transport can be started, stopped, and paused. The transport position
 * can also be set.
 *
 * @example
 * // The transport won't start playing until start() is called
 * const synth = new Tone.Synth().toDestination();
 * Tone.Transport.schedule(time => {
 * 	synth.triggerAttackRelease("C4", "8n", time);
 * }, 0);
 * // start the transport
 * Tone.Transport.start();
 * @category Core
 */
export class Transport extends Emitter {
    constructor(options) {
        super();
        this.name = "Transport";
        this._scheduledEvents = {};
        this._timeline = new Timeline();
        this._repeatedEvents = new Timeline();
        this._syncedSignals = [];
        const defaults = Transport.getDefaults();
        options = Object.assign(defaults, options);
        this.context = options.context;
        // CLOCK/TEMPO
        this._clock = new Clock({
            callback: this._processTick.bind(this),
            context: this.context,
            frequency: 0,
        });
        this.bpm = new Param({
            context: this.context,
            units: "bpm",
            value: options.bpm,
        });
        this.PPQ = options.PPQ;
        this._bindClockEvents();
        this.timeSignature = options.timeSignature;
        // SWING
        this._swingAmount = options.swing;
        this._swingTicks = options.swingSubdivision;
        // STATE
        this._state = new StateTimeline("stopped");
        // add the initial state
        this._state.setStateAtTime("stopped", 0);
        // an internal loop timer
        this._loop = false;
        this._loopStart = 0;
        this._loopEnd = 0;
        // Start the clock so that it is alive, but without a callback
        this._clock.start(0);
    }
    static getDefaults() {
        return {
            bpm: 120,
            context: getContext(),
            loopEnd: "4m",
            loopStart: 0,
            PPQ: 192,
            swing: 0,
            swingSubdivision: "8n",
            timeSignature: 4,
        };
    }
    //-------------------------------------
    // 	TICK METHOD
    //-------------------------------------
    /**
     * This is the event which is invoked on every tick.
     * @param tickTime The time of the tick in seconds
     * @param ticks The tick number
     */
    _processTick(tickTime, ticks) {
        // handle looping
        if (this._loop) {
            if (ticks >= this._loopEnd) {
                this.emit("loopEnd", tickTime);
                this._clock.setTicksAtTime(this._loopStart, tickTime);
                ticks = this._loopStart;
                this.emit("loopStart", tickTime, this.seconds);
                this.emit("loop", tickTime);
            }
        }
        // do the swing
        if (this._swingAmount > 0 &&
            ticks % this.PPQ !== 0 && // not on a downbeat
            (ticks % this._swingTicks) === 0) {
            // add some swing
            const swingAmount = (this._swingTicks / 2) * this._swingAmount;
            tickTime += this.context.ticksToSeconds(swingAmount, this.bpm);
        }
        // process the timeline events
        this._timeline.forEachAtTime(ticks, event => {
            event.callback(tickTime);
        });
    }
    //-------------------------------------
    // 	SCHEDULABLE EVENTS
    //-------------------------------------
    /**
     * Schedule an event along the transport.
     * @param callback The callback to be invoked at the time.
     * @param time The time to invoke the callback at.
     * @return The id of the schedule event. Use this to remove the event.
     * @example
     * // schedule an event on the 16th measure
     * Transport.schedule(time => {
     * 	// do something with the time
     * }, "16:0:0");
     */
    schedule(callback, time) {
        const event = {
            callback,
            time: this.toTicks(time),
        };
        const id = this._timeline.add(event);
        this.emit("schedule", time, id);
        return id;
    }
    /**
     * Schedule a repeated event along the transport. The event will fire
     * at the `interval` starting at the `startTime` and for the specified
     * `duration`.
     * @param  callback   The callback to invoke.
     * @param  interval   The duration between successive callbacks.
     * @param  startTime  When along the transport to start the event.
     * @param  duration How long the event should repeat.
     * @return  The ID of the scheduled event. Use this to remove the event.
     * @example
     * // a callback invoked every eighth note after the first measure
     * Transport.scheduleRepeat(time => {
     * 	// do something with the time
     * }, "8n", "1m");
     */
    scheduleRepeat(callback, interval, startTime, duration = Infinity) {
        const event = {
            callback,
            duration: this.toTicks(duration),
            interval: this.toTicks(interval),
            time: this.toTicks(startTime),
        };
        // when the event is added, schedule it
        const id = this._repeatedEvents.add(event);
        // schedule the first invocation
        this._scheduleRepeat(event, id);
        return id;
    }
    /**
     * Schedule the first event of a repeat
     * @hidden
     */
    _scheduleRepeat(event, id) {
        // schedule the cells
        this.schedule(time => {
            // if the event is removed, don't run it
            if (this._repeatedEvents.get(id) === event) {
                // if it's still looping
                if (this._clock.ticks >= event.time &&
                    this._clock.ticks < event.time + event.duration) {
                    event.callback(time);
                    // schedule the next event
                    const nextTick = event.time + event.interval;
                    const nextEvent = Object.assign({}, event, { time: nextTick });
                    this._scheduleRepeat(nextEvent, id);
                }
            }
        }, event.time);
    }
    /**
     * Schedule an event that will be removed after it is invoked.
     * @param callback The callback to invoke once.
     * @param time The time the callback should be invoked.
     * @return The ID of the scheduled event.
     */
    scheduleOnce(callback, time) {
        const id = this.schedule(t => {
            callback(t);
            this.clear(id);
        }, time);
        return id;
    }
    /**
     * Clear the passed in event id from the transport
     * @param eventId The id of the event.
     */
    clear(eventId) {
        if (this._timeline.has(eventId)) {
            this._timeline.remove(eventId);
        }
        else if (this._repeatedEvents.has(eventId)) {
            this._repeatedEvents.remove(eventId);
        }
        else {
            // find the event across all the timelines
            for (const timeline of [this._timeline, this._repeatedEvents]) {
                timeline.forEach(event => {
                    if (event.id === eventId) {
                        this.clear(event.id);
                    }
                });
            }
        }
        return this;
    }
    /**
     * Remove all scheduled events from the transport.
     */
    cancel(after) {
        const computedAfter = this.toTicks(after);
        this._timeline.cancel(computedAfter);
        this._repeatedEvents.cancel(computedAfter);
        this.emit("cancel");
        return this;
    }
    /**
     * Bind the Transport to the context's callback clock.
     * @private
     */
    _bindClockEvents() {
        this._clock.on("start", (time, offset) => {
            offset = this.context.ticksToSeconds(offset, this.bpm);
            this.emit("start", time, offset);
        });
        this._clock.on("stop", time => {
            this.emit("stop", time);
        });
        this._clock.on("pause", time => {
            this.emit("pause", time);
        });
    }
    //-------------------------------------
    //
    // START/STOP/PAUSE
    //
    //-------------------------------------
    /**
     * The current state of the transport.
     */
    get state() {
        return this._state.getValueAtTime(this._clock.seconds);
    }
    /**
     * Start the transport and all sources synced to the transport.
     * @param  time The time when the transport should start.
     * @param  offset The offset position to start the transport from.
     */
    start(time, offset) {
        // start the clock
        let ticks;
        if (offset !== undefined) {
            ticks = this.toTicks(offset);
        }
        else {
            ticks = this.ticks;
        }
        const computedTime = this.toSeconds(time);
        if (this.state !== "started") {
            this._state.setStateAtTime("started", computedTime);
            // start the clock
            this._clock.start(computedTime, ticks);
            this.emit("start", computedTime, this.context.ticksToSeconds(ticks, this.bpm));
        }
        return this;
    }
    /**
     * Stop the transport and all sources synced to the transport.
     * @param  time The time when the transport should stop.
     */
    stop(time) {
        const computedTime = this.toSeconds(time);
        if (this.state !== "stopped") {
            // The state is stopped
            this._state.setStateAtTime("stopped", computedTime);
            // stop the clock
            this._clock.stop(computedTime);
            this.emit("stop", computedTime);
        }
        return this;
    }
    /**
     * Pause the transport and all sources synced to the transport.
     */
    pause(time) {
        const computedTime = this.toSeconds(time);
        if (this.state === "started") {
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
        time = this.toSeconds(time);
        if (this.state === "started") {
            this.pause(time);
        }
        else {
            this.start(time);
        }
        return this;
    }
    //-------------------------------------
    //
    // Ticks/Seconds/BPM
    //
    //-------------------------------------
    /**
     * The Transport's time signature, formatted as a number over 4.
     * Defaults to 4/4.
     * @example
     * Transport.timeSignature = 3; // 3/4
     * Transport.timeSignature = [5, 8]; // 5/8
     */
    get timeSignature() {
        return this._timeSignature;
    }
    set timeSignature(ts) {
        if (Array.isArray(ts)) {
            this.timeSignature = (ts[0] / ts[1]) * 4;
        }
        else {
            this._timeSignature = ts;
        }
    }
    //-------------------------------------
    //
    // LOOPING
    //
    //-------------------------------------
    /**
     * When true, the transport will loop between the
     * {@link loopStart} and {@link loopEnd} times.
     * @example
     * // loop between the first and second measure
     * Transport.loop = true;
     * Transport.loopStart = 0;
     * Transport.loopEnd = "2m";
     */
    get loop() {
        return this._loop;
    }
    set loop(loop) {
        this._loop = loop;
        this.emit("loop", loop);
    }
    /**
     * The loop start position.
     */
    get loopStart() {
        return this.context.ticksToSeconds(this._loopStart, this.bpm);
    }
    set loopStart(startPosition) {
        this._loopStart = this.toTicks(startPosition);
        this.emit("loopStart", this.loopStart);
    }
    /**
     * The loop end position.
     */
    get loopEnd() {
        return this.context.ticksToSeconds(this._loopEnd, this.bpm);
    }
    set loopEnd(endPosition) {
        this._loopEnd = this.toTicks(endPosition);
        this.emit("loopEnd", this.loopEnd);
    }
    //-------------------------------------
    //
    // SWING
    //
    //-------------------------------------
    /**
     * The subdivision of the swing.
     * Defaults to an eighth note.
     */
    get swingSubdivision() {
        return this.context.ticksToNotation(this._swingTicks, this.bpm);
    }
    set swingSubdivision(subdivision) {
        this._swingTicks = this.toTicks(subdivision);
    }
    /**
     * The swing value. Between 0-1 where 1 is full swing.
     * Defaults to 0.
     */
    get swing() {
        return this._swingAmount;
    }
    set swing(amount) {
        this._swingAmount = amount;
    }
    //-------------------------------------
    //
    // EVENTS
    //
    //-------------------------------------
    /**
     * Get the scheduled value at the given time.
     * @return The scheduled value at the given time.
     */
    getTicksAtTime(time) {
        return this._clock.getTicksAtTime(time);
    }
    /**
     * Get the time of the next event in the given direction.
     * @param  direction The direction to search
     * @return The time of the next event.
     */
    nextSubdivision(subdivision) {
        subdivision = this.toTicks(subdivision);
        if (subdivision !== 0) {
            // tick value
            const now = this.ticks;
            // the number of subdivisions to the next subdivision
            const subdivisions = Math.ceil(now / subdivision);
            const nextSubdivision = subdivisions * subdivision;
            return this.context.ticksToSeconds(nextSubdivision, this.bpm);
        }
        else {
            return Infinity;
        }
    }
    /**
     * The time in seconds of the current transport position.
     */
    get seconds() {
        return this._clock.seconds;
    }
    set seconds(s) {
        const now = this.now();
        const ticks = this.context.secondsToTicks(s, this.bpm);
        this.ticks = ticks;
    }
    /**
     * The progress of the transport, between 0-1.
     */
    get progress() {
        if (this.loop) {
            const now = this.now();
            const start = this.loopStart;
            const end = this.loopEnd;
            const progress = (this.seconds - start) / (end - start);
            return progress % 1;
        }
        else {
            return 0;
        }
    }
    /**
     * The transport's position in ticks. Being able to get/set the transport
     * in ticks is slightly more accurate than seconds since it doesn't require
     * any conversion.
     */
    get ticks() {
        return this._clock.ticks;
    }
    set ticks(t) {
        if (this._clock.ticks !== t) {
            const now = this.now();
            if (this.state === "started") {
                const offset = this._clock.getTicksAtTime(now);
                const time = now + this.context.ticksToSeconds(t - offset, this.bpm);
                this.emit("time", time);
                this._clock.setTicksAtTime(t, time);
            }
            else {
                this._clock.setTicksAtTime(t, 0);
            }
        }
    }
    /**
     * Get the transport's position in Bars:Beats:Sixteenths.
     * @example
     * Transport.position = "4:3:2"; // set the transport to the 4th measure, 3rd beat, 2nd sixteenth note.
     */
    get position() {
        const now = this.now();
        const ticks = this.getTicksAtTime(now);
        return this.context.ticksToBarsBeatsSixteenths(ticks, this.bpm, this.timeSignature);
    }
    set position(pos) {
        const ticks = this.toTicks(pos);
        this.ticks = ticks;
    }
    /**
     * The total number of ticks of the progress of the loop if the transport is looped.
     * otherwise it will return the duration of the entire song
     * @private
     */
    get loopProgress() {
        return (this.ticks - this._loopStart) / (this._loopEnd - this._loopStart);
    }
    //-------------------------------------
    //
    // CONVERSIONS
    //
    //-------------------------------------
    /**
     * Set the tempo in beats per minute.
     * @example
     * Transport.bpm.value = 80;
     * // ramp the bpm to 120 over 10 seconds
     * Transport.bpm.rampTo(120, 10);
     */
    get bpm() {
        return this._bpm;
    }
    set bpm(param) {
        this._bpm = param;
        this._readOnly("bpm");
        // set the clock's frequency
        this._clock.frequency.value = (param.value * this.PPQ) / 60;
        // invalidate the clock's value.
        param.internal = false;
        // connect the bpm to the clock's frequency
        this._bpm.connect(this._clock.frequency);
        // and make it so the clock's frequency is not settable
        this._clock.frequency.internal = true;
        // assume the same units
        this._clock.frequency.units = "hertz";
    }
    /**
     * Return the time measures + beats + sixteenths in ticks.
     * @param progress The progress in "B:B:S" format.
     */
    toTicks(progress) {
        return this.context.toTicks(progress, this.bpm, this.timeSignature);
    }
    /**
     * Pulses per quarter note. This is the smallest resolution
     * the Transport timing supports. It defaults to 480, but can be
     * set to any integer value.
     * @example
     * // at 120bpm, this will be 1/960 of a second
     * Transport.PPQ = 480;
     */
    get PPQ() {
        return this._ppq;
    }
    set PPQ(ppq) {
        const bpm = this.bpm.value;
        this._ppq = ppq;
        // set the clock's frequency
        this.bpm.value = bpm;
    }
    //-------------------------------------
    //
    // SYNCING
    //
    //-------------------------------------
    /**
     * Returns the time aligned to the next subdivision
     * of the Transport. It will also sync all sources to the grid.
     * @param  subdivision  The subdivision to quantize to
     * @return  The context time of the next subdivision.
     * @example
     * // sometime in the future, trigger the C4 to start on the next 16th note
     * synth.triggerAttack("C4", Transport.nextGrid("16n"));
     */
    nextGrid(subdivision) {
        const nextGrid = this._clock.nextTickTime(0, this.now());
        const ticksAtGrid = this._clock.getTicksAtTime(nextGrid);
        const nextSubdivision = this.nextSubdivision(subdivision);
        if (nextSubdivision < this._clock.getTicksAtTime(nextGrid)) {
            // if the next subdivision is just before the next grid, don't subscribe to the grid
            return this.context.ticksToSeconds(this.nextSubdivision(subdivision), this.bpm);
        }
        else {
            return nextGrid;
        }
    }
    /**
     * Sync a source to the transport. The source will be started/stopped
     * along with the transport.
     * @param  source The source to sync to the transport.
     * @param  startTime The time on the transport to start the source.
     * @example
     * // sync a player to the transport
     * const player = new Player("path/to/sample.mp3").sync().toDestination();
     * // start the player at the 2nd measure
     * player.start("2m");
     * // start the transport
     * Transport.start();
     *
     * // all sources synced to the transport will start with the transport
     */
    syncSource(source, startTime) {
        this._syncedSignals.push(source);
        this.on("start", (time, offset) => {
            const relativeStart = this.toSeconds(startTime);
            if (offset > relativeStart) {
                // start it immediately
                source.start(time, offset - relativeStart);
            }
            else {
                const startWait = relativeStart - offset;
                const computedStart = time + startWait;
                source.start(computedStart);
            }
        });
        this.on("stop pause", (time) => {
            source.stop(time);
        });
        return this;
    }
    /**
     * Unsync a source from the transport.
     */
    unsyncSource(source) {
        source.dispose();
        const index = this._syncedSignals.indexOf(source);
        if (index !== -1) {
            this._syncedSignals.splice(index, 1);
        }
        return this;
    }
    /**
     * Attaches the signal to the transport's clock. The signal will be
     * started/stopped along with the transport. All signals synced to the transport
     * are automatically unsynced when the transport is disposed.
     * @param signal The signal to sync to the transport
     * @param  ratio  The ratio between the signal's frequency and the transport's frequency
     */
    syncSignal(signal, ratio = 1) {
        if (!this._syncedSignals.includes(signal)) {
            this._syncedSignals.push(signal);
            // multiply the frequency of the clock by the ratio
            const mult = this.context.createGain();
            mult.gain.value = ratio;
            this._clock.frequency.connect(mult).connect(signal);
        }
        return this;
    }
    /**
     * Unsync a signal from the transport.
     */
    unsyncSignal(signal) {
        if (this._syncedSignals.includes(signal)) {
            const index = this._syncedSignals.indexOf(signal);
            this._syncedSignals.splice(index, 1);
            // find the multiplier
            const mult = signal.context.createGain();
            this._clock.frequency.disconnect(mult, 0, 0);
            mult.disconnect(signal);
        }
        return this;
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this._clock.dispose();
        this.bpm.dispose();
        this._timeline.dispose();
        this._repeatedEvents.dispose();
        this._state.dispose();
        this._syncedSignals.forEach(s => s.dispose());
        this._syncedSignals = [];
        this._readOnly(["bpm"]);
        this.emit("dispose");
        return this;
    }
}
readOnly(Transport.prototype, ["ticks", "seconds", "position", "progress"]);
