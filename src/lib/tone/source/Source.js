import { ToneAudioNode } from "../core/context/ToneAudioNode.js";
import { optionsFromArguments } from "../core/util/Defaults.js";
import { readOnly } from "../core/util/Interface.js";
import { StateTimeline } from "../core/util/StateTimeline.js";
import { isNumber } from "../core/util/Type.js";
import { onContextEvent } from "../core/context/Context.js";
import { Gain } from "../core/context/Gain.js";
/**
 * Base class for all sources.
 * Sources have start/stop methods and are volume-controllable.
 */
export class Source extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(Source.getDefaults(), arguments);
        super(options);
        /**
         * The output volume node
         */
        this._volume = this.output = new Gain({
            context: this.context,
            gain: 1,
        });
        /**
         * The volume of the output in decibels.
         * @see {@link Decibels}
         * @example
         * import { Oscillator } from "tone";
         * const osc = new Oscillator().toDestination();
         * osc.volume.value = -6; // set the volume to -6dB
         * osc.start();
         */
        this.volume = this._volume.gain;
        this.volume.value = options.volume;
        this.mute = options.mute;
        this._state = new StateTimeline("stopped");
        this._state.setStateAtTime("stopped", 0);
        this._synced = false;
        this._scheduled = [];
        this._volume = this.output = new Gain({
            context: this.context,
            gain: 1,
        });
        this.volume = this._volume.gain;
        this.volume.value = options.volume;
        this.mute = options.mute;
        this._state = new StateTimeline("stopped");
        this._state.setStateAtTime("stopped", 0);
        this._synced = false;
        this._scheduled = [];
        this._volume = this.output = new Gain({
            context: this.context,
            gain: 1,
        });
        this.volume = this._volume.gain;
        this.volume.value = options.volume;
        this.mute = options.mute;
        this._state = new StateTimeline("stopped");
        this._state.setStateAtTime("stopped", 0);
        this._synced = false;
        this._scheduled = [];
        onContextEvent(this.context, "tick", () => {
            if (this._synced) {
                const now = this.now();
                if (this.transport.seconds > 0) {
                    const startEvent = this._state.get(now);
                    if (startEvent && startEvent.state === "started") {
                        // find the last scheduled start event
                        const lastStart = this._state.getLastState("started", now);
                        if (lastStart) {
                            const elapsed = this.transport.seconds - lastStart.time;
                            this.log("elapsed", elapsed);
                            this._start(now, elapsed);
                        }
                    }
                }
            }
        });
        readOnly(this, "volume");
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            volume: 0,
            mute: false,
        });
    }
    /**
     * Mute the output.
     * @example
     * import { Oscillator } from "tone";
     * const osc = new Oscillator().toDestination().start();
     * // mute the output
     * osc.mute = true;
     */
    get mute() {
        return this._volume.mute;
    }
    set mute(mute) {
        this._volume.mute = mute;
    }
    /**
     * The current state of the source.
     */
    get state() {
        if (this._synced) {
            if (this.transport.state === "started") {
                return this._state.getValueAtTime(this.transport.seconds);
            }
            else {
                return "stopped";
            }
        }
        else {
            return this._state.getValueAtTime(this.now());
        }
    }
    /**
     * Get the scheduled start time of the source.
     */
    get startTime() {
        const event = this._state.get(this.now());
        if (event && event.state === "started") {
            return event.time;
        }
        else {
            return -1;
        }
    }
    //-------------------------------------
    // ABSTRACT METHODS
    //-------------------------------------
    /**
     * Internal start method. Should be overridden by derived classes.
     */
    _start(time, offset, duration) {
        // should be overridden by derived classes
    }
    /**
     * Internal stop method. Should be overridden by derived classes.
     */
    _stop(time) {
        // should be overridden by derived classes
    }
    /**
     * Internal pause method. Should be overridden by derived classes.
     */
    _pause(time) {
        this._stop(time);
    }
    /**
     * Internal restart method. Should be overridden by derived classes.
     * The given time is the time of the event in seconds.
     */
    _restart(time, offset) {
        this._stop(time);
        this._start(time, offset);
    }
    //-------------------------------------
    // SCHEDULING METHODS
    //-------------------------------------
    /**
     * Start the source at the given time.
     * @param  time When the source should be started.
     */
    start(time, offset, duration) {
        let computedTime = this.toSeconds(time);
        // if it's started, stop it and restart it
        if (this._state.getValueAtTime(computedTime) === "started") {
            this._state.cancel(computedTime);
            this._state.setStateAtTime("stopped", computedTime);
            this._restart(computedTime, offset);
        }
        else {
            this._state.setStateAtTime("started", computedTime);
        }
        if (this._synced) {
            // add the offset to the start time
            const transport = this.context.transport;
            computedTime = transport.toSeconds(time);
            this._state.setStateAtTime("started", computedTime);
            const event = this._state.get(computedTime);
            // if the transport is already started
            if (transport.state === "started") {
                const now = transport.now();
                // if the start time has already passed, invoke it
                if (now > computedTime) {
                    this._start(now, this.toSeconds(computedTime) - now);
                }
            }
        }
        else {
            // not synced
            this._start(computedTime, offset, duration);
        }
        return this;
    }
    /**
     * Stop the source at the given time.
     * @param  time When the source should be stopped.
     */
    stop(time) {
        const computedTime = this.toSeconds(time);
        if (this.state === "stopped") {
            const lastStart = this._state.getLastState("started", computedTime);
            if (lastStart) {
                this._state.setStateAtTime("stopped", computedTime);
                this._stop(computedTime);
            }
        }
        else {
            this._state.cancel(computedTime);
            this._state.setStateAtTime("stopped", computedTime);
            this._stop(computedTime);
        }
        return this;
    }
    /**
     * Pause the source at the given time.
     * @param  time When the source should be paused.
     */
    pause(time) {
        const computedTime = this.toSeconds(time);
        if (this.state === "started") {
            this._state.setStateAtTime("paused", computedTime);
            this._pause(computedTime);
        }
        return this;
    }
    /**
     * Sync the source to the Transport so that all subsequent
     * calls to `start` and `stop` are synced to the TransportTime
     * instead of the AudioContext time.
     *
     * @example
     * import { Oscillator, Transport } from "tone";
     * const osc = new Oscillator().toDestination();
     * // sync the source so that it starts exactly on the next measure
     * osc.sync().start("1m");
     * // start the transport.
     * Transport.start();
     */
    sync() {
        this._synced = true;
        this._state.context = this.context.transport;
        return this;
    }
    /**
     * Unsync the source to the Transport. See {@link sync}
     */
    unsync() {
        this._synced = false;
        this._state.context = this.context;
        // stop everything
        this._stop(0);
        return this;
    }
    //-------------------------------------
    // UTILITY
    //-------------------------------------
    /**
     * Apply an ADSR envelope to the output to start and stop the source.
     */
    applyADSR(attack, decay, sustain, release, time) {
        this.log("applyADSR", attack, decay, sustain, release, time);
        const computedTime = this.toSeconds(time);
        this.volume.cancelScheduledValues(computedTime);
        this.volume.setValueAtTime(0, computedTime);
        // attack
        this.volume.linearRampToValueAtTime(1, this.toSeconds(attack), computedTime);
        // decay
        this.volume.linearRampToValueAtTime(sustain, this.toSeconds(decay), computedTime + this.toSeconds(attack));
        // release
        this.volume.linearRampToValueAtTime(0, this.toSeconds(release), computedTime + this.toSeconds(attack) + this.toSeconds(decay));
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this._volume.dispose();
        this.volume.dispose();
        this._state.dispose();
        onContextEvent(this.context, "tick", () => {
            //
        });
        return this;
    }
}
