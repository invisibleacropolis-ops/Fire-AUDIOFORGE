
import { Emitter } from "./Emitter.js";
import { getContext } from "../Global.js";
import { optionsFromArguments } from "./Defaults.js";
import { Timeline } from "./Timeline.js";

/**
 * Draw is useful for synchronizing visuals and audio events.
 * Callbacks from Draw will be invoked just before the audio context
 * renders a block of samples and are not synchronized to the
 * animation frame.
 * @example
 * const draw = new Draw(() => {
 * 	// give it a callback on construction
 * 	console.log("hi");
 * }).start();
 * // or schedule a callback to be invoked in the future
 * draw.schedule(() => {
 * 	console.log("hello");
 * }, "+0.5");
 * @category Core
 */
export class Draw extends Emitter {
    constructor() {
        super();
        this.name = "Draw";
        /**
         * The duration of one callback from the underlying `requestAnimationFrame` call.
         * This is not the correct interval that events are callbacks.
         * For this, use the arguments passed into the callback function.
         */
        this.duration = 1 / 60;
        /**
         * Keep track of the scheduled callbacks.
         */
        this._events = new Timeline();
        /**
         * The AnimationFrame id
         */
        this._animationFrame = 0;
        const options = optionsFromArguments(Draw.getDefaults(), arguments, ["callback"]);
        this._events = new Timeline();
        this.callback = options.callback;
        // start the draw loop on construction
        this._loop();
    }
    static getDefaults() {
        return {
            callback: () => { },
            context: getContext(),
        };
    }
    /**
     * Schedule a function to be invoked after a certain time.
     * @param  callback  The callback to be invoked.
     * @param  time      The time after which the callback is invoked.
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
     * @param  after  The time after which to cancel the events.
     */
    cancel(after) {
        this._events.cancel(this.toSeconds(after));
        return this;
    }
    /**
     * The draw loop
     */
    _loop() {
        const now = () => getContext().now();
        // the last loop time
        let lastLoop = now();
        const loopFn = () => {
            this._animationFrame = requestAnimationFrame(loopFn);
            const nowTime = now();
            const elapsed = nowTime - lastLoop;
            // set the duration
            this.duration = elapsed / 1000;
            lastLoop = nowTime;
            // process the draw events
            this._events.forEachAtTime(nowTime / 1000, event => {
                event.callback(this.duration, nowTime / 1000);
            });
            // invoke the callback
            this.callback(this.duration, nowTime / 1000);
        };
        this._animationFrame = requestAnimationFrame(loopFn);
    }
    /**
     * Clean up
     */
    dispose() {
        super.dispose();
        this._events.dispose();
        cancelAnimationFrame(this._animationFrame);
        return this;
    }
}
