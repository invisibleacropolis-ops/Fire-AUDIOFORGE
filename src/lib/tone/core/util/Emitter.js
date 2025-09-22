
import { isUndef } from "./Type.js";
import { Tone } from "../Tone.js";
/**
 * Emitter gives classes which extend it
 * the ability to listen for and emit events.
 * Inspiration and reference from node's [EventEmitter](https://nodejs.org/api/events.html),
 * and [component-emitter](https://github.com/component/emitter).
 *
 * @example
 * class MyClass extends Emitter<{
 * 	"something" : (value: number) => void
 * 	"else" : () => void
 * }> {
 * 	//...
 * }
 * const instance = new MyClass();
 * instance.on("something", (value) => console.log("the value is " + value));
 * instance.emit("something", 4);
 * @category Core
 */
export class Emitter extends Tone {
    constructor() {
        super(...arguments);
        this.name = "Emitter";
    }
    /**
     * Bind a callback to a specific event.
     * @param  event     The name of the event to listen for.
     * @param  callback  The callback to invoke when the event is emitted
     */
    on(event, callback) {
        //split the event
        const events = event.split(/\s+/);
        events.forEach(eventName => {
            if (isUndef(this._events)) {
                this._events = {};
            }
            if (isUndef(this._events[eventName])) {
                this._events[eventName] = [];
            }
            this._events[eventName].push(callback);
        });
        return this;
    }
    /**
     * Bind a callback to a specific event. After the callback is invoked,
     * it will be removed from the list of callbacks for the event.
     * @param  event     The name of the event to listen for.
     * @param  callback  The callback to invoke when the event is emitted
     */
    once(event, callback) {
        //this function is just a wrapper around the callback that will remove it after it's invoked
        const wrappedCallback = (...args) => {
            // invoke the callback
            callback(...args);
            // remove the event
            this.off(event, wrappedCallback);
        };
        this.on(event, wrappedCallback);
        return this;
    }
    /**
     * Remove a callback from an event.
     * @param  event     The name of the event to stop listening to.
     * @param  callback  The callback which was bound to the event with Emitter.on.
     *                   If no callback is given, all callbacks bound to the event will be removed.
     */
    off(event, callback) {
        const events = event.split(/\s+/);
        events.forEach(eventName => {
            if (isUndef(this._events) || isUndef(this._events[eventName])) {
                return this;
            }
            if (isUndef(callback)) {
                this._events[eventName] = [];
            }
            else {
                const eventList = this._events[eventName];
                for (let i = eventList.length - 1; i >= 0; i--) {
                    if (eventList[i] === callback) {
                        eventList.splice(i, 1);
                    }
                }
            }
        });
        return this;
    }
    /**
     * Invoke all of the callbacks bound to the event
     * with any arguments passed in.
     * @param  event  The name of the event to invoke.
     * @param args The arguments to pass to the events
     */
    emit(event, ...args) {
        if (!isUndef(this._events) && !isUndef(this._events[event])) {
            const eventList = this._events[event].slice(0);
            for (let i = 0, len = eventList.length; i < len; i++) {
                eventList[i](...args);
            }
        }
        return this;
    }
    /**
     * Add a listener for a given event.
     */
    addListener(eventName, listener) {
        return this.on(eventName, listener);
    }
    /**
     * Remove a listener from a given event.
     */
    removeListener(eventName, listener) {
        return this.off(eventName, listener);
    }
    /**
     * Remove all listeners from a given event.
     */
    removeAllListeners(event) {
        return this.off(event);
    }
    /**
     * Get the listeners for a given event.
     */
    listeners(event) {
        if (this._events && this._events[event]) {
            return this._events[event];
        }
        else {
            return [];
        }
    }
    /**
     * Checks if the container has a listener for the given event.
     */
    hasListeners(event) {
        return this.listeners(event).length > 0;
    }
    /**
     * Clean up
     */
    dispose() {
        super.dispose();
        this._events = undefined;
        return this;
    }
}
//# sourceMappingURL=Emitter.js.map
