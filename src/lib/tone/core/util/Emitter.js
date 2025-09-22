import { onContextClose, onContextInit } from "../context/Context.js";
import { isUndef } from "./Type.js";
/**
 * Emitter gives classes which extend it the ability to listen for
 * and emit events. Inspiration and reference from node's events class.
 *
 * @example
 * import { Emitter } from "tone";
 *
 * class MyClass extends Emitter<{
 * 	"event" : [number, string]
 * }>() {
 * 	// the available events and their parameters
 * 	constructor() {
 * 		// events can be emitted
 * 		setInterval(() => this.emit("event", Math.random(), "hello"), 1000);
 * 	}
 * }
 *
 * const instance = new MyClass();
 * instance.on("event", (num, str) => {
 * 	console.log("event happened", num, str);
 * });
 *
 * // can also unsubscribe from an event
 * const callback = (num: number, str: string) => console.log(num, str);
 * instance.on("event", callback);
 * // after a while
 * instance.off("event", callback);
 * @category Core
 */
export class Emitter {
    constructor() {
        this.name = "Emitter";
        /**
         * The events that are being listened for
         */
        this._events = new Map();
    }
    /**
     * Bind a callback to a specific event.
     * @param event The name of the event to listen for.
     * @param callback The callback to invoke when the event is emitted
     */
    on(event, callback) {
        const events = this._events.get(event);
        if (events) {
            events.push(callback);
        }
        else {
            this._events.set(event, [callback]);
        }
        return this;
    }
    /**
     * Bind a callback which is only invoked once
     * @param event The name of the event to listen for.
     * @param callback The callback to invoke when the event is emitted
     */
    once(event, callback) {
        const fn = (...args) => {
            // remove the event
            this.off(event, fn);
            // invoke the callback
            callback(...args);
        };
        this.on(event, fn);
        return this;
    }
    /**
     * Remove the event listener.
     * @param event The event to stop listening to.
     * @param callback The callback which was bound to the event. If no callback is given, all callbacks events are removed.
     */
    off(event, callback) {
        if (!callback) {
            this._events.delete(event);
        }
        else {
            const events = this._events.get(event);
            if (events) {
                const index = events.indexOf(callback);
                if (index !== -1) {
                    events.splice(index, 1);
                }
            }
        }
        return this;
    }
    /**
     * Invoke all of the callbacks bound to the event
     * with any arguments passed in.
     * @param event The name of the event to invoke.
     * @param args The arguments to pass to the events
     */
    emit(event, ...args) {
        const events = this._events.get(event);
        if (events) {
            // copy the array so if the array is modified during the event, it doesn't cause issues
            [...events].forEach((callback) => callback(...args));
        }
    }
    /**
     * Returns the number of listeners who are listening to the given event
     */
    listenerCount(event) {
        if (this._events.has(event)) {
            return this._events.get(event).length;
        }
        else {
            return 0;
        }
    }
    /**
     * Returns true if there are listeners for the given event
     */
    hasListener(event) {
        return this.listenerCount(event) > 0;
    }
    /**
     * Get the names of all the events that have listeners
     */
    eventNames() {
        return Array.from(this._events.keys());
    }
    /**
     * Clean up
     */
    dispose() {
        this._events.clear();
        return this;
    }
}
onContextInit((context) => {
    // if the context is not the default context, there is no transport
    if (context.emitter) {
        context.emitter = new Emitter();
    }
});
onContextClose((context) => {
    if (context.emitter) {
        context.emitter.dispose();
    }
});
