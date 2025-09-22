
import { Gain } from "../core/context/Gain.js";
import { ToneAudioNode, } from "../core/context/ToneAudioNode.js";
import { optionsFromArguments } from "../core/util/Defaults.js";
import { readOnly } from "../core/util/Interface.js";
import { StateTimeline } from "../core/util/StateTimeline.js";
/**
 * Base class for all sources. Sources have start/stop methods
 * and are classes which output audio. All signal-rate audio processing
 * happens in sources. For example, {@link Oscillator}, {@link LFO},
 * {@link AudioBufferSourceNode} and {@link Noise} are sources.
 *
 * @category Source
 */
export class Source extends ToneAudioNode {
    constructor(options) {
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
         * @example
         * const source = new Source();
         * source.volume.value = -6;
         */
        this.volume = this._volume.gain;
        this._state = new StateTimeline("stopped");
        this._synced = false;
        this._scheduled = [];
        // set the initial state
        this._state.setStateAtTime("stopped", 0);
        this.mute = options.mute;
        readOnly(this, "volume");
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            mute: false,
            onended: () => { },
            volume: 0,
        });
    }
    /**
     * The output volume level of the source in decibels.
     */
    get volume() {
        return this._volume.gain;
    }
    set volume(level) {
        this._volume.gain = level;
    }
    /**
     * Mute the output.
     * @example
     * const source = new Source().toDestination();
     * source.start();
     * // mute the source after 1 second
     * source.mute = true;
     * source.scheduled(1);
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
            if (this.context.transport.state === "started") {
                return this._state.getValueAtTime(this.context.transport.seconds);
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
     * Get the current state of the source at the given time.
     * @param  time  The time to get the state at.
     */
    getStateAtTime(time) {
        const computedTime = this.toSeconds(time);
        return this._state.getValueAtTime(computedTime);
    }
    /**
     * Start the source at the given time.
     * @param  time When to start the source.
     */
    start(time) {
        const computedTime = this.toSeconds(time);
        if (this._state.getValueAtTime(computedTime) === "stopped") {
            this._state.add({
                time: computedTime,
                state: "started",
                offset: undefined,
            });
            this._start(computedTime, undefined);
        }
        return this;
    }
    /**
     * Stop the source at the given time.
     * @param  time When to stop the source.
     */
    stop(time) {
        const computedTime = this.toSeconds(time);
        // if it's already stopped, do nothing
        if (this.getStateAtTime(computedTime) === "stopped") {
            return this;
        }
        // if it is playing, stop it
        if (this.state === "started") {
            this._state.setStateAtTime("stopped", computedTime);
            const scheduledEvent = this._state.get(computedTime);
            if (scheduledEvent) {
                // remove all of the events after this stop time
                this._state.cancel(scheduledEvent.time + this.sampleTime);
            }
            this._stop(computedTime);
            // call the onended callback
            this.onended();
        }
        return this;
    }
    /**
     * Restart the source.
     * @param  time When to restart the source.
     */
    restart(time) {
        const computedTime = this.toSeconds(time);
        this._state.cancel(computedTime);
        this._state.setStateAtTime("stopped", computedTime);
        this._restart(computedTime, undefined);
        return this;
    }
    /**
     * Sync the source to the Transport so that all subsequent calls to
     * {@link start} and {@link stop} are synced to the TransportTime instead
     * of the AudioContext time.
     *
     * @example
     * const source = new Source().toDestination();
     * source.sync().start(0);
     * // start the transport.
     * Tone.Transport.start();
     *
     * @example
     * // restart the source at the beginning of the next measure
     * source.restart("@1m");
     */
    sync() {
        if (!this._synced) {
            this._synced = true;
            const stopEvent = (e) => this.stop(e);
            this.context.transport.on("stop", stopEvent);
            this.context.transport.on("pause", stopEvent);
            this.context.transport.on("loopEnd", stopEvent);
            // make sure the start method is invoked with the transport's time
            const startEvent = (time) => {
                const state = this.getStateAtTime(time);
                if (state === "started") {
                    this._start(time, undefined);
                }
            };
            this.context.transport.on("start", startEvent);
            this.context.transport.on("loopStart", startEvent);
            // add it to the scheduled list
            this._scheduled.push(stopEvent, startEvent);
        }
        return this;
    }
    /**
     * Unsync the source to the Transport. See {@link sync}.
     */
    unsync() {
        if (this._synced) {
            this._synced = false;
            this.context.transport.off("stop", this._scheduled[0]);
            this.context.transport.off("pause", this._scheduled[0]);
            this.context.transport.off("loopEnd", this._scheduled[0]);
            this.context.transport.off("start", this._scheduled[1]);
            this.context.transport.off("loopStart", this._scheduled[1]);
            this._scheduled = [];
        }
        return this;
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this.onended = () => { };
        this.unsync();
        this._volume.dispose();
        this.volume.dispose();
        this._state.dispose();
        return this;
    }
}
