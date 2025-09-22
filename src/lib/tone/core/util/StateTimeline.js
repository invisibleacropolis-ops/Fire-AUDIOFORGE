
import { isNumber } from "./Type.js";
import { Timeline } from "./Timeline.js";
/**
 * A Timeline which splits the timeline into states.
 * Any event added to the timeline is converted into a state
 * which has a duration.
 * @internal
 */
export class StateTimeline extends Timeline {
    constructor() {
        super();
        this.name = "StateTimeline";
        // set the initial state
        const options = Array.from(arguments);
        if (options.length > 0 && isNumber(options[0])) {
            super.add({
                state: "stopped",
                time: options[0]
            });
        }
        else {
            super.add({
                state: "stopped",
                time: 0
            });
        }
    }
    /**
     * The current state of the timeline.
     * The state is whatever `state` was set to in the event at the current time.
     */
    getValueAtTime(time) {
        const event = this.get(time);
        if (event !== null) {
            return event.state;
        }
        else {
            return "stopped";
        }
    }
    /**
     * Add a state to the timeline.
     * @param  state The state to add.
     * @param  time  The time to add the state at.
     */
    setStateAtTime(state, time) {
        this.add({
            state,
            time
        });
        return this;
    }
    /**
     * Return the event before the time with the given state
     * @param  state The state to look for
     * @param  time  When to check before
     * @return  The event with the given state before the time
     */
    getLastState(state, time) {
        // get the last event with that state
        const index = this.search(time);
        for (let i = index; i >= 0; i--) {
            const event = this._timeline[i];
            if (event.state === state) {
                return event;
            }
        }
    }
    /**
     * Return the event after the time with the given state
     * @param  state The state to look for
     * @param  time  When to check after
     * @return  The next event with the given state
     */
    getNextState(state, time) {
        // get the last event with that state
        const index = this.search(time);
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
