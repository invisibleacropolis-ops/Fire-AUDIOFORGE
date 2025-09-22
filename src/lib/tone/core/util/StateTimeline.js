import { Timeline } from "./Timeline.js";
/**
 * A Timeline State. Provides the methods: `setStateAtTime` and `getValueAtTime`.
 * @param initial The initial state of the StateTimeline.  Defaults to `undefined`
 */
export class StateTimeline extends Timeline {
    constructor(initial) {
        super();
        /**
         * The initial state
         */
        this._initial = initial;
        // set the initial state
        this.add({
            state: this._initial,
            time: 0,
        });
    }
    /**
     * Returns the scheduled state at the given time.
     * @param  time  The time to query.
     * @return  The name of the state input in setStateAtTime.
     */
    getValueAtTime(time) {
        const event = this.get(time);
        if (event) {
            return event.state;
        }
        else {
            return this._initial;
        }
    }
    /**
     * Add a state to the timeline.
     * @param  state The state to add.
     * @param  time  The time to add the state at.
     */
    setStateAtTime(state, time) {
        // remove anything after the new state
        this.cancel(time);
        // remove the last event if it's the same state
        const lastEvent = this.peek();
        if (lastEvent && lastEvent.state === state) {
            this.remove(lastEvent);
        }
        this.add({
            state,
            time,
        });
        return this;
    }
    /**
     * Get the last state event before the given time.
     * @param  time  The time to query.
     */
    getLastState(state, time) {
        const index = this._search(time);
        for (let i = index; i >= 0; i--) {
            const event = this._timeline[i];
            if (event.state === state) {
                return event;
            }
        }
    }
    /**
     * Get the next state event after the given time.
     * @param  state  The state to look for.
     * @param  time  The time to query.
     */
    getNextState(state, time) {
        const index = this._search(time);
        if (index !== -1) {
            for (let i = index; i < this._timeline.length; i++) {
                const event = this._timeline[i];
                if (event.state === state) {
                    return event;
                }
            }
        }
    }
}
