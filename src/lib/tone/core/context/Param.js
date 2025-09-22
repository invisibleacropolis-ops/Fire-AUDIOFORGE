
import { Ticks } from "../type/Ticks.js";
import { TransportTime } from "../type/TransportTime.js";
import { Time } from "../type/Time.js";
import { Frequency } from "../type/Frequency.js";
import { optionsFromArguments } from "../util/Defaults.js";
import { Timeline } from "../util/Timeline.js";
import { isAudioParam } from "../util/Type.js";
import { ToneWithContext } from "../ToneWithContext.js";

/**
 * the possible automation types
 */
export var AutomationType;
(function (AutomationType) {
    AutomationType["Linear"] = "linearRampToValueAtTime";
    AutomationType["Exponential"] = "exponentialRampToValueAtTime";
    AutomationType["Target"] = "setTargetAtTime";
    AutomationType["SetValue"] = "setValueAtTime";
    AutomationType["Cancel"] = "cancelScheduledValues";
})(AutomationType || (AutomationType = {}));

/**
 * Param is a wrapper around {@link AudioParam} which allows for easy
 * scheduling of automation. It also simplifies the getters and setters
 * of the AudioParam's value, allowing units to be passed in and converted
 * to the correct values.
 *
 * @example
 * const gain = new Gain();
 * // instead of gain.gain.value = 0.2
 * gain.gain.value = 0.2;
 *
 * // can also schedule changes
 * gain.gain.linearRampToValueAtTime(0.2, "+1");
 * @category Core
 */
export class Param extends ToneWithContext {
    constructor() {
        const options = optionsFromArguments(Param.getDefaults(), arguments, ["param", "units", "convert"]);
        super(options);
        this.name = "Param";
        this._events = new Timeline();
        this._initialValue = 0;
        this.input = this._source = this.context.createConstantSource();
        this._source.start(0);
        this._param = options.param;
        this._initialValue = this._param.defaultValue;
        this.units = options.units;
        this.convert = options.convert;
        // if the value is defined, set it immediately
        if (this.value !== this._param.value) {
            this.value = options.value;
        }
    }
    static getDefaults() {
        return Object.assign(ToneWithContext.getDefaults(), {
            convert: true,
            units: "number",
            param: undefined,
            value: 0
        });
    }
    /**
     * The current value of the parameter.
     */
    get value() {
        return this.getValueAtTime(this.now());
    }
    set value(value) {
        this.cancelScheduledValues(this.now());
        this.setValueAtTime(value, this.now());
    }
    /**
     * The defaultValue of the parameter
     */
    get defaultValue() {
        return this._param.defaultValue;
    }
    /**
     * The minimum allowable value.
     */
    get minValue() {
        return this._param.minValue;
    }
    /**
     * The maximum allowable value.
     */
    get maxValue() {
        return this._param.maxValue;
    }
    /**
     * The value of the parameter as a signal.
     */
    get signal() {
        return this._source;
    }
    /**
     * Connect the Param to a native AudioParam or another Tone.Param
     */
    connect(destination, outputNumber, inputNumber) {
        if (isAudioParam(destination)) {
            // if it's an audio param, connect the constant source to it
            this._source.connect(destination, outputNumber, inputNumber);
        }
        else {
            super.connect(destination, outputNumber, inputNumber);
        }
        return this;
    }
    /**
     * Disconnect the signal from the audio param.
     */
    disconnect(destination, outputNumber, inputNumber) {
        if (isAudioParam(destination)) {
            this._source.disconnect(destination, outputNumber, inputNumber);
        }
        else {
            super.disconnect(destination, outputNumber, inputNumber);
        }
        return this;
    }
    /**
     * Apply the given units to the value
     * @param  val the value to convert
     */
    _fromUnits(val) {
        if (this.convert) {
            switch (this.units) {
                case "time":
                    return this.toSeconds(val);
                case "decibels":
                    return this.dbToGain(val);
                case "frequency":
                    return this.toFrequency(val);
                default:
                    return val;
            }
        }
        else if (val instanceof Time || val instanceof Frequency || val instanceof Ticks || val instanceof TransportTime) {
            return val.valueOf();
        }
        else {
            return val;
        }
    }
    /**
     * Convert the given value to the units of the param
     * @param val the value to convert
     */
    _toUnits(val) {
        if (this.convert) {
            switch (this.units) {
                case "decibels":
                    return this.gainToDb(val);
                default:
                    return val;
            }
        }
        else {
            return val;
        }
    }
    /**
     * Schedules a parameter value change at the given time.
     * @param value The value to set the signal.
     * @param time The time when the signal should be set to the given value.
     */
    setValueAtTime(value, time) {
        const computedTime = this.toSeconds(time);
        const numericValue = this._fromUnits(value);
        // remove the events which have been replaced by this event
        this._events.add({
            time: computedTime,
            type: AutomationType.SetValue,
            value: numericValue,
        });
        this._source.offset.setValueAtTime(numericValue, computedTime);
        return this;
    }
    /**
     * Get the value of the parameter at the given time.
     * @param time The time when the signal should be set to the given value.
     */
    getValueAtTime(time) {
        const computedTime = Math.max(this.toSeconds(time), 0);
        const event = this._events.get(computedTime);
        if (event) {
            const before = this._events.getBefore(computedTime);
            const after = this._events.getAfter(computedTime);
            if (event.type === AutomationType.SetValue) {
                return this._toUnits(event.value);
            }
            else if (event.type === AutomationType.Linear && after && after.type === AutomationType.Linear) {
                // approximate the value when the value is in the middle of two linear ramps
                return this._toUnits(this._linearInterpolate(event.time, event.value, after.time, after.value, computedTime));
            }
            else if (event.type === AutomationType.Linear) {
                return this._toUnits(this._linearInterpolate(event.time, event.value, computedTime + this.sampleTime, this.value, computedTime));
            }
            else if (event.type === AutomationType.Exponential && after && after.type === AutomationType.Exponential) {
                return this._toUnits(this._exponentialInterpolate(event.time, event.value, after.time, after.value, computedTime));
            }
            else if (event.type === AutomationType.Exponential) {
                // currently returns the value at the beginning of the ramp
                return this._toUnits(event.value);
            }
            else if (event.type === AutomationType.Target) {
                const prevEvent = before || { value: this._initialValue, time: 0 };
                // @ts-ignore
                const timeConstant = event.timeConstant;
                return this._toUnits(this._exponentialApproach(prevEvent.time, prevEvent.value, event.value, timeConstant, computedTime));
            }
            else {
                return this._toUnits(event.value);
            }
        }
        else {
            return this._toUnits(this._initialValue);
        }
    }
    /**
     * Creates a schedule point with the current value at the current time.
     * This is useful for creating an automation anchor point in order to schedule
     * changes from the current value.
     * @param time When to add a ramp point.
     */
    setRampPoint(time) {
        const computedTime = this.toSeconds(time);
        let val = this.getValueAtTime(computedTime);
        this.cancelScheduledValues(computedTime);
        this.setValueAtTime(val, computedTime);
        return this;
    }
    /**
     * Schedules a linear continuous change in parameter value from the
     * previous scheduled parameter value to the given value.
     *
     * @param value The value to ramp to.
     * @param time When the ramp should start.
     */
    linearRampToValueAtTime(value, time) {
        const computedTime = this.toSeconds(time);
        const numericValue = this._fromUnits(value);
        this._events.add({
            time: computedTime,
            type: AutomationType.Linear,
            value: numericValue,
        });
        this._source.offset.linearRampToValueAtTime(numericValue, computedTime);
        return this;
    }
    /**
     * Schedules an exponential continuous change in parameter value from
     * the previous scheduled parameter value to the given value.
     *
     * @param value The value to ramp to.
     * @param time When the ramp should start.
     */
    exponentialRampToValueAtTime(value, time) {
        const computedTime = this.toSeconds(time);
        const numericValue = this._fromUnits(value);
        // if the value is 0, use a target ramp to avoid infinity issues
        if (numericValue === 0) {
            this.setTargetAtTime(numericValue, computedTime - this.sampleTime, 0.9);
            // and make sure it's 0 at the end
            this.setValueAtTime(0, computedTime);
        }
        else {
            this._events.add({
                time: computedTime,
                type: AutomationType.Exponential,
                value: numericValue,
            });
            this._source.offset.exponentialRampToValueAtTime(numericValue, computedTime);
        }
        return this;
    }
    /**
     * Schedules an exponential continuous change in parameter value from
     * the current time and current value to the given value.
     *
     * @param value The value to ramp to.
     * @param rampTime the time that it should take to reach the value.
     */
    exponentialRampTo(value, rampTime) {
        const computedTime = this.toSeconds(rampTime);
        const numericValue = this._fromUnits(value);
        const now = this.now();
        // exponentialRampTo doesn't exist, but linearRampTo does
        // and it can be used to approximate the exponential ramp
        // get the current value
        const currentVal = this.getValueAtTime(now);
        this.setValueAtTime(currentVal, now);
        this.exponentialRampToValueAtTime(numericValue, now + computedTime);
        return this;
    }
    /**
     * Schedules a linear continuous change in parameter value from
     * the current time and current value to the given value.
     *
     * @param value The value to ramp to.
     * @param rampTime the time that it should take to reach the value.
     */
    linearRampTo(value, rampTime) {
        const computedTime = this.toSeconds(rampTime);
        const numericValue = this._fromUnits(value);
        const now = this.now();
        // get the current value
        const currentVal = this.getValueAtTime(now);
        this.setValueAtTime(currentVal, now);
        this.linearRampToValueAtTime(numericValue, now + computedTime);
        return this;
    }
    /**
     * Start exponentially approaching the target value at the given time with
     * a rate having the given time constant.
     * @param value The value to ramp to.
     * @param startTime When the ramp should start.
     * @param timeConstant The time constant.
     */
    setTargetAtTime(value, startTime, timeConstant) {
        const computedTime = this.toSeconds(startTime);
        const numericValue = this._fromUnits(value);
        this._events.add({
            time: computedTime,
            type: AutomationType.Target,
            value: numericValue,
            timeConstant: timeConstant
        });
        this._source.offset.setTargetAtTime(numericValue, computedTime, timeConstant);
        return this;
    }
    /**
     * Cancels all scheduled parameter changes with times greater than or
     * equal to startTime.
     * @param time The time after which events will be cancelled.
     */
    cancelScheduledValues(time) {
        const computedTime = this.toSeconds(time);
        this._events.cancel(computedTime);
        this._source.offset.cancelScheduledValues(computedTime);
        return this;
    }
    /**
     * Cancels all scheduled parameter changes from the given time to the end of the timeline.
     * @param time The time after which events will be cancelled.
     */
    cancelAndHoldAtTime(time) {
        const computedTime = this.toSeconds(time);
        const valueAtTime = this.getValueAtTime(computedTime);
        // remove the schedule
        this._source.offset.cancelScheduledValues(computedTime);
        // set the value
        this._source.offset.setValueAtTime(valueAtTime, computedTime);
        // remove all the events after this time
        this._events.cancel(computedTime);
        // add a new event
        this._events.add({
            time: computedTime,
            type: AutomationType.SetValue,
            value: valueAtTime,
        });
        return this;
    }
    /**
     * Ramps to the given value over the duration of the rampTime.
     * Automatically selects the best ramp type (linear or exponential)
     * depending on the `units` of the signal
     *
     * @param  value
     * @param  rampTime The time that it should take to reach the value.
     */
    rampTo(value, rampTime) {
        rampTime = this.toSeconds(rampTime);
        if (this.units === "frequency" || this.units === "bpm") {
            this.exponentialRampTo(value, rampTime);
        }
        else {
            this.linearRampTo(value, rampTime);
        }
        return this;
    }
    /**
     * dispose and disconnect
     */
    dispose() {
        super.dispose();
        this._source.disconnect();
        this._events.dispose();
        return this;
    }
    /**
     * The representation of the object as a string
     */
    toString() {
        return this._param.toString();
    }
    //-------------------------------------
    // 	AUTOMATION CURVE CALCULATIONS
    // 	MIT License, copyright (c) 2014 Chris Wilson
    //-------------------------------------
    /**
     * Make sure the value is always within the min/max range
     */
    _clampValue(value) {
        return Math.max(Math.min(value, this.maxValue), this.minValue);
    }
    /**
     * @param t0
     * @param v0
     * @param t1
     * @param v1
     * @param t
     */
    _linearInterpolate(t0, v0, t1, v1, t) {
        return v0 + (v1 - v0) * ((t - t0) / (t1 - t0));
    }
    /**
     * @param t0
     * @param v0
     * @param t1
     * @param v1
     * @param t
     */
    _exponentialInterpolate(t0, v0, t1, v1, t) {
        return v0 * Math.pow(v1 / v0, (t - t0) / (t1 - t0));
    }
    /**
     * @param t0
     * @param v0
     * @param v1
     * @param timeConstant
     * @param t
     */
    _exponentialApproach(t0, v0, v1, timeConstant, t) {
        return v1 + (v0 - v1) * Math.exp(-(t - t0) / timeConstant);
    }
}

    