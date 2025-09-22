import { __decorate } from "tslib";
import { Tone } from "../Tone.js";
import { optionsFromArguments } from "../util/Defaults.js";
import {
	isAudioParam,
	isNumber,
	isString,
	isUndef,
} from "../util/Type.js";
import {
	decibelsToGain,
	gainToDecibels,
} from "../type/Conversions.js";
import {
	AutomationEvent,
	TargetAutomationEvent,
	isTargetAutomationEvent,
} from "./timeline/TimelineValue.js";
import { Timeline } from "../util/Timeline.js";
import { getContext } from "./Context.js";
/**
 * Param is a wrapper around {@link AudioParam} which allows for setting scheduling and signal automation.
 * @example
 * const gain = new Gain();
 * // get the gain AudioParam
 * gain.gain.setValueAtTime(0.5, "+1");
 * // move the value of the audio parameter immediately
 * gain.gain.value = 0;
 * // a short ramp to the given value
 * gain.gain.rampTo(1, 0.2);
 * @category Core
 */
export class Param extends Tone {
    //-------------------------------------
    // 	AUTOMATION
    //-------------------------------------
    /**
     * @param param The AudioParam to wrap
     * @param units The unit name
     * @param convert Whether or not to convert the value to the destination units
     */
    constructor() {
        const options = optionsFromArguments(Param.getDefaults(), arguments, [
            "param",
            "units",
            "convert",
        ]);
        super();
        this.name = "Param";
        /**
         * The timeline which tracks all of the automations.
         */
        this._events = new Timeline();
        this.input = this._param = options.param;
        this.units = options.units;
        this.convert = options.convert;
        this.overridden = false;
        // if the AudioParam has a value, start there
        if (isNumber(this._param.value)) {
            this.value = this._param.value;
        }
        // if the options are passed in, set them
        if (isNumber(options.value)) {
            this.setValueAtTime(options.value, 0);
        }
    }
    static getDefaults() {
        return {
            convert: true,
            units: "number",
            param: undefined,
            value: 0,
        };
    }
    get value() {
        return this.getValueAtTime(this.now());
    }
    set value(value) {
        // cancel all modifications
        this.cancelScheduledValues(this.now());
        // set the value as of now
        this.setValueAtTime(value, this.now());
    }
    /**
     * The minimum value of the parameter
     */
    get minValue() {
        return this._param.minValue;
    }
    /**
     * The maximum value of the parameter
     */
    get maxValue() {
        return this._param.maxValue;
    }
    //-------------------------------------
    // CONVERSIONS
    //-------------------------------------
    /**
     * Convert the given value from the type specified by {@link units}
     * into the destination value (which is always a number).
     */
    _fromUnits(val) {
        if (this.convert || this.isUndef(this.convert)) {
            switch (this.units) {
                case "time":
                    return this.toSeconds(val);
                case "hertz":
                    return this.toFrequency(val);
                case "decibels":
                    return decibelsToGain(val);
                case "normalRange":
                    return Math.min(Math.max(val, 0), 1);
                case "audioRange":
                    return Math.min(Math.max(val, -1), 1);
                case "positive":
                    return Math.max(val, 0);
                default:
                    return val;
            }
        }
        else {
            return val;
        }
    }
    /**
     * Convert the given value to the type specified by {@link units}.
     */
    _toUnits(val) {
        if (this.convert || this.isUndef(this.convert)) {
            switch (this.units) {
                case "decibels":
                    return gainToDecibels(val);
                default:
                    return val;
            }
        }
        else {
            return val;
        }
    }
    //-------------------------------------
    // SCHEDULING
    //-------------------------------------
    /**
     * Schedules a parameter value change at the given time.
     * @param value The value to set the signal.
     * @param time The time when the signal should be set to the given value.
     * @example
     * const gain = new Gain(0).toDestination();
     * // set the gain to 0.5 exactly at 1 second
     * gain.gain.setValueAtTime(0.5, 1);
     */
    setValueAtTime(value, time) {
        const computedTime = this.toSeconds(time);
        const numericValue = this._fromUnits(value);
        this.log("setValueAtTime", numericValue, computedTime);
        // remove all events after this time
        this._events.cancel(computedTime);
        // remove any linear or exponential ramps that may have been scheduled on the AudioParam
        this._param.cancelScheduledValues(computedTime);
        // set the value at the given time
        this._events.add({
            time: computedTime,
            value: numericValue,
        });
        this._param.setValueAtTime(numericValue, computedTime);
        return this;
    }
    /**
     * Get the value of the parameter at the given time.
     * @param time The time when the signal should be read.
     */
    getValueAtTime(time) {
        const computedTime = this.toSeconds(time);
        const after = this._events.getAfter(computedTime);
        const before = this._events.get(computedTime);
        let value = this._param.defaultValue;
        if (before === null) {
            value = this._param.defaultValue;
        }
        else if (isTargetAutomationEvent(before.type) && after === null) {
            const beforeValue = before.value;
            const V = this.getValueAtTime(before.time);
            value = this._exponentialApproach(before.time, V, beforeValue, before.constant, computedTime);
        }
        else if (after === null) {
            value = before.value;
        }
        else if (isTargetAutomationEvent(before.type)) {
            const beforeValue = before.value;
            const V = this.getValueAtTime(before.time);
            value = this._exponentialApproach(before.time, V, beforeValue, before.constant, computedTime);
        }
        else if (isLinearAutomationEvent(after.type)) {
            const beforeValue = before.value;
            const afterValue = after.value;
            const progress = (computedTime - before.time) / (after.time - before.time);
            value = beforeValue + (afterValue - beforeValue) * progress;
        }
        else if (isExponentialAutomationEvent(after.type)) {
            const beforeValue = before.value;
            const afterValue = after.value;
            let progress = (computedTime - before.time) / (after.time - before.time);
            if (beforeValue === 0) {
                // if the previous value is 0, the interpolation is linear
                value = beforeValue + (afterValue - beforeValue) * progress;
            }
            else {
                value =
                    beforeValue * Math.pow(afterValue / beforeValue, progress);
            }
        }
        else {
            value = before.value;
        }
        return this._toUnits(value);
    }
    /**
     * Creates a schedule point with the current value at the current time.
     * This is useful for creating an anchor point and silencing the signal
     * afterwards.
     * @param time When to anchor the signal value.
     */
    setRampPoint(time) {
        const computedTime = this.toSeconds(time);
        let value = this.getValueAtTime(computedTime);
        this.cancelScheduledValues(computedTime);
        // if the value is very close to 0, assume it's 0.
        if (value < 1e-7) {
            value = 0;
        }
        this.setValueAtTime(value, computedTime);
        return this;
    }
    /**
     * Schedules a linear continuous change in parameter value from the
     * previous scheduled parameter value to the given value.
     *
     * @param value The value to ramp to.
     * @param rampTime The time that it should take to ramp from the previous value to the given value.
     * @param startTime When the ramp should start.
     */
    linearRampToValueAtTime(value, rampTime, startTime) {
        const numericValue = this._fromUnits(value);
        const computedTime = this.toSeconds(startTime);
        this.log("linearRampToValueAtTime", numericValue, rampTime, computedTime);
        this._events.add({
            time: computedTime + this.toSeconds(rampTime),
            value: numericValue,
            type: "linear",
        });
        this._param.linearRampToValueAtTime(numericValue, computedTime + this.toSeconds(rampTime));
        return this;
    }
    /**
     * Schedules an exponential continuous change in parameter value from
     * the previous scheduled parameter value to the given value.
     *
     * @param value The value to ramp to.
     * @param rampTime The time that it should take to ramp from the previous value to the given value.
     * @param startTime When the ramp should start.
     */
    exponentialRampToValueAtTime(value, rampTime, startTime) {
        const numericValue = this._fromUnits(value);
        const computedTime = this.toSeconds(startTime);
        // if the value is 0, use linearRampToValueAtTime
        if (numericValue === 0) {
            this.linearRampToValueAtTime(0, rampTime, startTime);
            return this;
        }
        this.log("exponentialRampToValueAtTime", numericValue, rampTime, computedTime);
        this._events.add({
            time: computedTime + this.toSeconds(rampTime),
            value: numericValue,
            type: "exponential",
        });
        this._param.exponentialRampToValueAtTime(numericValue, computedTime + this.toSeconds(rampTime));
        return this;
    }
    /**
     * Schedules an exponential continuous change in parameter value from
     * the current time and current value to the given value.
     *
     * @param value The value to ramp to.
     * @param rampTime The time that it should take to ramp from the current value to the given value.
     * @param startTime When the ramp should start.
     * @example
     * const gain = new Gain(0).toDestination();
     * //set the gain to 0.5 in 2 seconds
     * gain.gain.exponentialRampTo(0.5, 2);
     */
    exponentialRampTo(value, rampTime, startTime) {
        const computedTime = this.toSeconds(startTime);
        this.setRampPoint(computedTime);
        this.exponentialRampToValueAtTime(value, rampTime, computedTime);
        return this;
    }
    /**
     * Schedules an linear continuous change in parameter value from
     * the current time and current value to the given value.
     *
     * @param value The value to ramp to.
     * @param rampTime The time that it should take to ramp from the current value to the given value.
     * @param startTime When the ramp should start.
     * @example
     * const gain = new Gain(0).toDestination();
     * //set the gain to 0.5 in 2 seconds
     * gain.gain.linearRampTo(0.5, 2);
     */
    linearRampTo(value, rampTime, startTime) {
        const computedTime = this.toSeconds(startTime);
        this.setRampPoint(computedTime);
        this.linearRampToValueAtTime(value, rampTime, computedTime);
        return this;
    }
    /**
     * Start exponentially approaching the target value at the given time with
     * a rate having the given time constant.
     * @param value
     * @param timeConstant
     * @param startTime
     */
    setTargetAtTime(value, startTime, timeConstant) {
        const numericValue = this._fromUnits(value);
        const computedTime = this.toSeconds(startTime);
        this.log("setTargetAtTime", numericValue, computedTime, timeConstant);
        this._events.add({
            time: computedTime,
            value: numericValue,
            type: "target",
            constant: timeConstant * 3,
        });
        this._param.setTargetAtTime(numericValue, computedTime, timeConstant);
        return this;
    }
    /**
     * Sets an array of arbitrary parameter values starting at the given time
     * for the given duration.
     *
     * @param values Values to set.
     * @param startTime When to start applying the values.
     * @param duration The total duration to schedule the values.
     * @param scaling The scaling which is applied to the entire curve.
     */
    setValueCurveAtTime(values, startTime, duration, scaling = 1) {
        duration = this.toSeconds(duration);
        const computedTime = this.toSeconds(startTime);
        this.log("setValueCurveAtTime", values, computedTime, duration);
        const startingValue = this._fromUnits(values[0]) * scaling;
        this.setValueAtTime(this._toUnits(startingValue), computedTime);
        for (let i = 1; i < values.length; i++) {
            const numericValue = this._fromUnits(values[i]) * scaling;
            const time = computedTime + (i / (values.length - 1)) * duration;
            this.linearRampToValueAtTime(this._toUnits(numericValue), 0, time);
        }
        return this;
    }
    /**
     * Cancels all scheduled parameter changes with times greater than or
     * equal to startTime.
     * @param time The time after which events will be canceled.
     */
    cancelScheduledValues(time) {
        const computedTime = this.toSeconds(time);
        this.log("cancelScheduledValues", computedTime);
        this._events.cancel(computedTime);
        this._param.cancelScheduledValues(computedTime);
        return this;
    }
    /**
     * This is similar to {@link cancelScheduledValues} except
     * it holds the automated value at cancel time until the next scheduled automation occurs.
     * @param time The time after which events will be canceled.
     */
    cancelAndHoldAtTime(time) {
        const computedTime = this.toSeconds(time);
        const valueAtTime = this._fromUnits(this.getValueAtTime(computedTime));
        this.log("cancelAndHoldAtTime", computedTime, "value=" + valueAtTime);
        // remove the schedule events
        this.cancelScheduledValues(computedTime);
        // If there are no more scheduled events, it will hold the value that's
        // there now. Otherwise, it will hold it until the next event.
        const nextEvent = this._events.getAfter(computedTime);
        // set the next value to be the same as the current value
        this.setValueAtTime(this._toUnits(valueAtTime), computedTime);
        // and then rampt to the next event
        if (nextEvent) {
            // figure out what kind of ramp it is
            if (isLinearAutomationEvent(nextEvent.type)) {
                this.linearRampToValueAtTime(this._toUnits(nextEvent.value), nextEvent.time - computedTime, computedTime);
            }
            else if (isExponentialAutomationEvent(nextEvent.type)) {
                this.exponentialRampToValueAtTime(this._toUnits(nextEvent.value), nextEvent.time - computedTime, computedTime);
            }
        }
        return this;
    }
    /**
     * Ramps to the given value over the duration of the rampTime.
     * Automatically selects the best ramp type (exponential or linear)
     * depending on the `units` of the signal
     *
     * @param  value
     * @param  rampTime The time that it should take to ramp from the current value to the given value.
     * @param startTime When the ramp should start.
     */
    rampTo(value, rampTime = 0.1, startTime) {
        if (this.units === "hertz" ||
            this.units === "bpm" ||
            this.units === "decibels") {
            this.exponentialRampTo(value, rampTime, startTime);
        }
        else {
            this.linearRampTo(value, rampTime, startTime);
        }
        return this;
    }
    /**
     * The implementation of getValueAtTime which does not convert the values.
     * Does the actual work of scheduling the AudioParam.
     * @param time The time when the signal should be read.
     */
    _getInitialValueAtTime(time) {
        const events = this._events.get(time);
        if (events) {
            return events.value;
        }
        else {
            return this._param.value;
        }
    }
    /**
     * Compute the value along an exponential ramp.
     */
    _exponentialApproach(t0, v0, v1, timeConstant, t) {
        return v1 + (v0 - v1) * Math.exp(-(t - t0) / timeConstant);
    }
    /**
     * Clean up
     */
    dispose() {
        super.dispose();
        this._events.dispose();
        return this;
    }
}
__decorate([
    isAudioParam
], Param.prototype, "input", void 0);
function isLinearAutomationEvent(automation) {
    return isString(automation) && automation === "linear";
}
function isExponentialAutomationEvent(automation) {
    return isString(automation) && automation === "exponential";
}
/**
 * @hidden
 */
export function isParam(arg) {
    return arg instanceof Param;
}
