
import { isUndef } from "./Type.js";
import { Tone } from "../Tone.js";
/**
 * A Timeline class for scheduling events along the time axis.
 * @internal
 */
export class Timeline extends Tone {
    constructor(memory) {
        super();
        this.name = "Timeline";
        /**
         * The array of scheduled timeline events
         */
        this._timeline = [];
        this.memory = isUndef(memory) ? Infinity : memory;
    }
    /**
     * The length of the timeline array
     */
    get length() {
        return this._timeline.length;
    }
    /**
     * Insert an event object onto the timeline. Events must have a "time" attribute.
     * @param event  The event object to insert into the timeline
     */
    add(event) {
        //the event needs to have a time attribute
        if (isUndef(event.time)) {
            throw new Error("Timeline: events must have a time attribute");
        }
        event.time = event.time.valueOf();
        const index = this.search(event.time);
        this._timeline.splice(index + 1, 0, event);
        //if the length is more than the memory, remove the previous ones
        if (this.length > this.memory) {
            const diff = this.length - this.memory;
            this._timeline.splice(0, diff);
        }
        return this;
    }
    /**
     * Remove an event from the timeline.
     * @param  {Object}  event  The event object to remove from the list
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
        const index = this.search(time);
        if (index !== -1) {
            return this._timeline[index];
        }
        else {
            return null;
        }
    }
    /**
     * Get the nearest event whose time is greater than or equal to the given time.
     * @param  time  The time to query.
     * @param  strict  If true, will not return the event if the time is equal to the event's time.
     */
    getAfter(time, strict = false) {
        const index = this.search(time);
        if (strict) {
            // if the index is right on the value, go to the next one
            if (index >= 0 && this._timeline[index].time === time) {
                if (index + 1 < this._timeline.length) {
                    return this._timeline[index + 1];
                }
                else {
                    return null;
                }
            }
        }
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
     * @param  strict  If true, will not return the event if the time is equal to the event's time.
     */
    getBefore(time, strict = false) {
        const index = this.search(time);
        // if it's strict, and the event time is the same as the passed in time,
        // get the event before it
        if (index >= 0 && this._timeline[index].time === time) {
            if (strict) {
                return this.at(index - 1);
            }
            else {
                return this.at(index);
            }
        }
        if (index >= 0) {
            return this._timeline[index];
        }
        else {
            return null;
        }
    }
    /**
     * Cancel events after the given time.
     * @param  after  The time to query.
     */
    cancel(after) {
        if (this._timeline.length > 1) {
            let index = this.search(after);
            if (index >= 0) {
                if (this._timeline[index].time === after) {
                    // get the first item that is after the given time
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
        else if (this.length === 1) {
            // if there is only one event in the timeline
            // and that event is after the after time, then cancel it
            if (this._timeline[0].time >= after) {
                this._timeline = [];
            }
        }
        return this;
    }
    /**
     * Cancel events before or equal to the given time.
     * @param  time  The time to cancel before.
     */
    cancelBefore(time) {
        const index = this.search(time);
        if (index >= 0) {
            this._timeline = this._timeline.slice(index + 1);
        }
        return this;
    }
    /**
     * Returns the previous event if there is one.
     * @param  event The event to find the previous event of
     * @return The event which comes before the given event
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
     * @param  event The event to find the next event of
     * @return The event which comes after the given event
     */
    nextEvent(event) {
        const index = this._timeline.indexOf(event);
        if (index > 0 && index < this.length - 1) {
            return this._timeline[index + 1];
        }
        else {
            return null;
        }
    }
    /**
     * Get the event at the given index
     * @param index
     */
    at(index) {
        if (index >= 0 && index < this.length) {
            return this._timeline[index];
        }
        else {
            return null;
        }
    }
    /**
     * Iterate over everything in the array
     * @param  callback The callback to invoke with every item
     */
    forEach(callback) {
        this._timeline.forEach(callback);
        return this;
    }
    /**
     * Iterate over everything in the array at or before the given time.
     * @param  time The time to check if items are before
     * @param  callback The callback to invoke with every item
     */
    forEachBefore(time, callback) {
        // get the index
        const index = this.search(time);
        if (index !== -1) {
            for (let i = index; i >= 0; i--) {
                const event = this._timeline[i];
                if (event.time === time) {
                    callback(event);
                }
                else {
                    break;
                }
            }
        }
        return this;
    }
    /**
     * Iterate over everything in the array after the given time.
     * @param  time The time to check if items are before
     * @param  callback The callback to invoke with every item
     */
    forEachAfter(time, callback) {
        // get the index
        const index = this.search(time);
        this._timeline.slice(index + 1).forEach(callback);
        return this;
    }
    /**
     * Iterate over everything in the array between the given times.
     * Events that overlap the start and end times will not be invoked.
     * @param  startTime The start time to check if items are before
     * @param  endTime The end time to check if items are before
     * @param  callback The callback to invoke with every item
     */
    forEachBetween(startTime, endTime, callback) {
        const startIndex = this.search(startTime);
        const endIndex = this.search(endTime);
        if (startIndex !== -1 && endIndex !== -1) {
            if (this._timeline[startIndex].time !== startTime) {
                // search returns the index of the item before or at the time
                this._timeline.slice(startIndex + 1, endIndex + 1).forEach(callback);
            }
            else {
                // if the start time is the same as an event, include it
                this._timeline.slice(startIndex, endIndex + 1).forEach(callback);
            }
        }
        else if (startIndex === -1) {
            this._timeline.slice(0, endIndex + 1).forEach(callback);
        }
        return this;
    }
    /**
     * Iterate over everything in the array at or after the given time. Similar to
     * `forEachAfter`, but includes events which occur at the given time.
     * @param  time The time to check if items are before
     * @param  callback The callback to invoke with every item
     */
    forEachAtTime(time, callback) {
        // get the index
        const index = this.search(time);
        if (index !== -1) {
            for (let i = index; i < this._timeline.length; i++) {
                const event = this._timeline[i];
                if (event.time === time) {
                    callback(event);
                }
                else {
                    break;
                }
            }
        }
        return this;
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this._timeline = [];
        return this;
    }
    /**
     * Internal search method for finding an event in the timeline
     * @param  time
     * @return The index of the event in the timeline.
     */
    search(time) {
        if (this.length === 0) {
            return -1;
        }
        // optimizations
        if (time < this._timeline[0].time) {
            return -1;
        }
        let beginning = 0;
        const len = this.length;
        let end = len;
        if (len > 0 && this._timeline[len - 1].time <= time) {
            return len - 1;
        }
        while (beginning < end) {
            // calculate the midpoint for roughly equal partition
            let mid = beginning + Math.floor((end - beginning) / 2);
            const event = this._timeline[mid];
            const nextEvent = this._timeline[mid + 1];
            if (event.time === time) {
                // find the first event at that time
                for (let i = mid; i < this._timeline.length; i++) {
                    const testEvent = this._timeline[i];
                    if (testEvent.time === time) {
                        mid = i;
                    }
                }
                return mid;
            }
            else if (event.time < time && nextEvent.time > time) {
                return mid;
            }
            else if (event.time > time) {
                end = mid;
            }
            else if (event.time < time) {
                beginning = mid + 1;
            }
        }
        return -1;
    }
}
