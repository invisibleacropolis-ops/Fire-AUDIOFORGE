import { getContext } from "../context/Context.js";
import { optionsFromArguments } from "./Defaults.js";
import { Emitter } from "./Emitter.js";
import { Timeline } from "./Timeline.js";
/**
 * Draw is useful for synchronizing visuals and audio events.
 * Callbacks from Tone.Transport or any of the Tone.Event classes
 * always happen strictly before the audio is scheduled to occur.
 * Tone.Draw allows you to schedule events along the AudioContext's
 * render timeline which will be synchronized with the objects but triggered
 * just before the AudioContext renders the next block of audio.
 * @example
 * import { Draw, Transport } from "tone";
 * Transport.schedule(time => {
 * 	// use the time argument to schedule a visual event
 * 	Draw.schedule(() => {
 * 		// do drawing in here
 * 	}, time);
 * }, "4n");
 * @category Core
 */
export class Draw extends Emitter {
    constructor() {
        const options = optionsFromArguments(Draw.getDefaults(), arguments);
        super();
        /**
         * The duration after which events are not invoked.
         */
        this.expiration = 0.25;
        /**
         * The amount of time before the scheduled time
         * that the callback can be invoked.
         */
        this.anticipation = 0.008;
        /**
         * The timeline of events scheduled on the draw loop.
         */
        this._events = new Timeline();
        this._boundLoop = this._loop.bind(this);
        this._animationFrame = -1;
        this.context = options.context;
        this._animationFrame = requestAnimationFrame(this._boundLoop);
    }
    static getDefaults() {
        return {
            context: getContext(),
        };
    }
    /**
     * Schedule a function to be invoked at the appropriate time.
     * @param callback The callback to be invoked.
     * @param time The time to invoke the callback at.
     */
    schedule(callback, time) {
        this._events.add({
            callback,
            time: this.toSeconds(time),
        });
        return this;
    }
    /**
     * Cancel events scheduled after the given time
     * @param after The time to query after
     */
    cancel(after) {
        this._events.cancel(this.toSeconds(after));
        return this;
    }
    /**
     * The draw loop
     */
    _loop() {
        this._animationFrame = requestAnimationFrame(this._boundLoop);
        const now = this.context.currentTime;
        let executing = false;
        while (this._events.length &&
            this._events.peek().time - this.anticipation <= now) {
            const event = this._events.shift();
            if (event.time >= now - this.expiration) {
                event.callback();
                executing = true;
            }
        }
        if (executing) {
            this.emit("update");
        }
    }
    dispose() {
        super.dispose();
        this._events.dispose();
        cancelAnimationFrame(this._animationFrame);
        return this;
    }
}
