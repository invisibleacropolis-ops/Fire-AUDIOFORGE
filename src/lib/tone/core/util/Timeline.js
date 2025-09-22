import { isUndef } from "./Type.js";
/**
 * A Timeline class for scheduling events along the time axis.
 */
export class Timeline {
    constructor() {
        /**
         * The array of events
         */
        this._timeline = [];
        this.memory = 100;
        const options = Object.assign(arguments);
        if (options.memory) {
            this.memory = options.memory;
        }
    }
    /**
     * The number of items in the timeline.
     */
    get length() {
        return this._timeline.length;
    }
    /**
     * Insert an event object onto the timeline. Events must have a "time" attribute.
     * @param event  The event object to insert into the timeline.
     */
    add(event) {
        // the event needs to have a time attribute
        if (isUndef(event.time)) {
            throw new Error("Timeline: events must have a time attribute");
        }
        event.time = event.time;
        const index = this._search(event.time);
        this._timeline.splice(index + 1, 0, event);
        // if the length is more than the memory, remove the previous ones
        if (this.length > this.memory) {
            const diff = this.length - this.memory;
            this._timeline.splice(0, diff);
        }
        return this;
    }
    /**
     * Remove an event from the timeline.
     * @param  event  The event object to remove from the list.
     */
    remove(event) {
        const index = this._timeline.indexOf(event);
        if (index !== -1) {
            this._timeline.splice(index, 1);
        }
        return this;
    }
    /**
     * Get the nearest event whose time is less than or equal to the given time.
     * @param  time  The time to query.
     */
    get(time) {
        const index = this._search(time);
        if (index !== -1) {
            return this._timeline[index];
        }
        else {
            return null;
        }
    }
    /**
     * Get the nearest event whose time is greater than the given time.
     * @param  time  The time to query.
     */
    getAfter(time) {
        const index = this._search(time);
        if (index + 1 < this._timeline.length) {
            return this._timeline[index + 1];
        }
        else {
            return null;
        }
    }
    /**
     * Get the nearest event whose time is less than the given time.
     * @param  time  The time to query.
     */
    getBefore(time) {
        const index = this._search(time);
        if (index > 0) {
            return this._timeline[index - 1];
        }
        else {
            return null;
        }
    }
    /**
     * Cancel events after the given time.
     * @param  time  The time to query.
     */
    cancel(after) {
        if (this._timeline.length > 1) {
            let index = this._search(after);
            if (index >= 0) {
                if (this._timeline[index].time === after) {
                    // get the first item with that time
                    for (let i = index; i >= 0; i--) {
                        if (this._timeline[i].time === after) {
                            index = i;
                        }
                        else {
                            break;
                        }
                    }
                    this._timeline = this._timeline.slice(0, index);
                }
                else {
                    this._timeline = this._timeline.slice(0, index + 1);
                }
            }
            else {
                this._timeline = [];
            }
        }
        else if (this.length === 1 && this._timeline[0].time >= after) {
            this._timeline = [];
        }
        return this;
    }
    /**
     * Cancel events before or equal to the given time.
     * @param  time  The time to cancel before.
     */
    cancelBefore(time) {
        const index = this._search(time);
        if (index >= 0) {
            this._timeline = this._timeline.slice(index + 1);
        }
        return this;
    }
    /**
     * Returns the previous event if there is one.
     * @param  event The event to find the previous one of.
     * @return The event which comes before the given event.
     */
    previousEvent(event) {
        const index = this._timeline.indexOf(event);
        if (index > 0) {
            return this._timeline[index - 1];
        }
        else {
            return null;
        }
    }
    /**
     * Returns the next event if there is one.
     * @param  event The event to find the next one of.
     * @return The event which comes after the given event.
     */
    nextEvent(event) {
        const index = this._timeline.indexOf(event);
        if (index !== -1 && index < this._timeline.length - 1) {
            return this._timeline[index + 1];
        }
        else {
            return null;
        }
    }
    /**
     * Iterate over everything in the timeline.
     * @param  callback The callback to invoke with every item
     */
    forEach(callback) {
        this._timeline.forEach(callback);
        return this;
    }
    /**
     * Iterate over everything in the array in reverse order.
     */
    forEachReverse(callback) {
        for (let i = this.length - 1; i >= 0; i--) {
            callback(this._timeline[i]);
        }
        return this;
    }
    /**
     * Iterate over everything in the timeline at or after the given time.
     * @param  time The time to check if items are after
     * @param  callback The callback to invoke with every item
     */
    forEachAfter(time, callback) {
        const index = this._search(time);
        if (index !== -1) {
            for (let i = index + 1; i < this._timeline.length; i++) {
                callback(this._timeline[i]);
            }
        }
        return this;
    }
    /**
     * Iterate over everything in the timeline at or before the given time.
     * @param  time The time to check if items are before
     * @param  callback The callback to invoke with every item
     */
    forEachBefore(time, callback) {
        const index = this._search(time);
        if (index !== -1) {
            for (let i = 0; i <= index; i++) {
                callback(this._timeline[i]);
            }
        }
        return this;
    }
    /**
     * Iterate over everything in the timeline between the given start and end time.
     * The callback is invoked on events which happen during the given interval.
     * @param  startTime The start time to check if items are within
     * @param  endTime The end time to check if items are within
     * @param  callback The callback to invoke with every item
     */
    forEachBetween(startTime, endTime, callback) {
        let start = this._search(startTime);
        let end = this._search(endTime);
        if (start !== -1 && end !== -1) {
            if (this._timeline[start].time !== startTime) {
                start++;
            }
            if (this._timeline[end].time === endTime) {
                end--;
            }
            for (let i = start; i <= end; i++) {
                callback(this._timeline[i]);
            }
        }
        else if (start === -1) {
            this._timeline.forEach(callback);
        }
        return this;
    }
    /**
     * Iterate over everything in the timeline at the given time.
     * @param  time The time to check if items are at
     * @param  callback The callback to invoke with every item
     */
    forEachAtTime(time, callback) {
        const index = this._search(time);
        if (index !== -1) {
            for (let i = index; i < this._timeline.length; i++) {
                const event = this._timeline[i];
                if (event.time === time) {
                    callback(event);
                }
                else if (event.time > time) {
                    break;
                }
            }
        }
        return this;
    }
    /**
     * Find the event at or before the given time and invoke the callback
     * with that event and all subsequent events.
     * @param  time The time to check if items are after
     * @param  callback The callback to invoke with every item
     */
    forEachFrom(time, callback) {
        let index = this._search(time);
        while (index >= 0 && this._timeline[index].time >= time) {
            index--;
        }
        if (index + 1 < this._timeline.length) {
            for (let i = index + 1; i < this._timeline.length; i++) {
                callback(this._timeline[i]);
            }
        }
        return this;
    }
    /**
     * The first event in the timeline
     */
    peek() {
        return this._timeline[0];
    }
    /**
     * The last event in the timeline
     */
    last() {
        return this._timeline[this._timeline.length - 1];
    }
    /**
     * The last event in the timeline
     */
    pop() {
        return this._timeline.pop();
    }
    /**
     * The first event in the timeline
     */
    shift() {
        return this._timeline.shift();
    }
    /**
     * Get the event at the given index
     * @param index
     */
    get at(index) {
        return this._timeline[index];
    }
    /**
     * Set the event at the given index
     */
    set at(index, event) {
        this._timeline[index] = event;
    }
    /**
     * Get the index of the given event.
     */
    indexOf(event) {
        return this._timeline.indexOf(event);
    }
    /**
     * Remove the event at the given index
     */
    removeAt(index) {
        this._timeline.splice(index, 1);
    }
    /**
     * Replace the event at the given index with a new event.
     */
    replace(event, newEvent) {
        const index = this.indexOf(event);
        if (index !== -1) {
            this._timeline[index] = newEvent;
        }
    }
    /**
     * Clear the timeline.
     */
    clear() {
        this._timeline = [];
    }
    /**
     * Search for the event in the timeline based on time.
     * The search is a binary search of the array, and returns the index
     * of the event which is at or before the given time.
     * @param  time
     */
    _search(time) {
        if (this.length === 0) {
            return -1;
        }
        let beginning = 0;
        const len = this.length;
        let end = len;
        // when the last item's time is less than the given time, return the last item
        if (this._timeline[len - 1].time <= time) {
            return len - 1;
        }
        while (beginning < end) {
            // calculate the midpoint for roughly equal partition
            let mid = Math.floor(beginning + (end - beginning) / 2);
            const event = this._timeline[mid];
            if (event.time === time) {
                // find the first item with that time
                for (let i = mid; i > 0; i--) {
                    if (this._timeline[i - 1].time !== time) {
                        return i;
                    }
                }
                return 0;
            }
            else if (event.time > time) {
                end = mid;
            }
            else if (event.time < time) {
                beginning = mid + 1;
            }
        }
        return beginning - 1;
    }
    /**
     * Get the array of events
     */
    toArray() {
        return this._timeline.slice();
    }
    /**
     * Clone the timeline.
     */
    clone() {
        const tl = new Timeline();
        tl._timeline = this.toArray();
        return tl;
    }
    /**
     * Get all of the events between the given start and end time.
     * The events are returned as an array.
     * @param  startTime The start time to check if items are within
     * @param  endTime The end time to check if items are within
     */
    getEventsBetween(startTime, endTime) {
        const events = [];
        let start = this._search(startTime);
        let end = this._search(endTime);
        if (start !== -1 || end !== -1) {
            if (start === -1) {
                start = 0;
            }
            if (end === -1) {
                end = this.length - 1;
            }
            if (this._timeline[start].time !== startTime) {
                start++;
            }
            if (this._timeline[end].time === endTime) {
                end--;
            }
            for (let i = start; i <= end; i++) {
                events.push(this._timeline[i]);
            }
        }
        return events;
    }
    /**
     * Clean up.
     */
    dispose() {
        this.clear();
        return this;
    }
}
