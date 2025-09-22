import { isString, isUndef } from "../../util/Type.js";
export function isTargetAutomationEvent(event) {
    return isString(event) && event === "target";
}
export function isSetValueAutomationEvent(automation) {
    return isString(automation.type) && automation.type === "setValue";
}
export function isLinearRampToValueAutomationEvent(automation) {
    return isString(automation.type) && automation.type === "linearRampToValue";
}
export function isExponentialRampToValueAutomationEvent(automation) {
    return (isString(automation.type) && automation.type === "exponentialRampToValue");
}
export function isSetTargetAutomationEvent(automation) {
    return isString(automation.type) && automation.type === "setTarget";
}
/**
 * The Ramp automation type
 */
export var RampType;
(function (RampType) {
    RampType["Linear"] = "linear";
    RampType["Exponential"] = "exponential";
})(RampType || (RampType = {}));
/**
 * A generic automation event
 */
export class AutomationEvent {
    constructor(type, time, value) {
        this.type = type;
        this.time = time;
        this.value = value;
    }
}
/**
 * A target automation event
 */
export class TargetAutomationEvent extends AutomationEvent {
    constructor(time, value, constant) {
        super("target", time, value);
        this.constant = constant;
    }
}
/**
 * A linear ramp to value automation event
 */
export class LinearRampToValueAutomationEvent extends AutomationEvent {
    constructor(time, value) {
        super("linear", time, value);
    }
}
/**
 * An exponential ramp to value automation event
 */
export class ExponentialRampToValueAutomationEvent extends AutomationEvent {
    constructor(time, value) {
        super("exponential", time, value);
    }
}
/**
 * A set value automation event
 */
export class SetValueAutomationEvent extends AutomationEvent {
    constructor(time, value) {
        super("setValue", time, value);
    }
}
/**
 * A set target automation event
 */
export class SetTargetAutomationEvent extends AutomationEvent {
    constructor(time, value, constant) {
        super("setTarget", time, value);
        this.constant = constant;
    }
}
/**
 * A cancel scheduled values automation event
 */
export class CancelScheduledValuesAutomationEvent extends AutomationEvent {
    constructor(time) {
        super("cancel", time, 0);
    }
}
export function isAutomationEvent(event) {
    return !isUndef(event) && event instanceof AutomationEvent;
}
