import { isContext } from "../context/Context.js";
import { Param } from "../context/Param.js";
import { ToneAudioNode } from "../context/ToneAudioNode.js";
import { Time } from "../type/Time.js";
/**
 * Test if the arg is undefined
 */
export function isUndef(arg) {
    return arg === undefined;
}
/**
 * Test if the arg is not undefined
 */
export function isDefined(arg) {
    return !isUndef(arg);
}
/**
 * Test if the arg is a function
 */
export function isFunction(arg) {
    return typeof arg === "function";
}
/**
 * Test if the arg is a number
 */
export function isNumber(arg) {
    return typeof arg === "number";
}
/**
 * Test if the arg is a boolean
 */
export function isBoolean(arg) {
    return typeof arg === "boolean";
}
/**
 * Test if the arg is a string
 */
export function isString(arg) {
    return typeof arg === "string";
}
/**
 * Test if the arg is an array
 */
export function isArray(arg) {
    return Array.isArray(arg);
}
/**
 * Test if the arg is an object.
 */
export function isObject(arg) {
    return (Object.prototype.toString.call(arg) === "[object Object]" &&
        arg.constructor === Object);
}
/**
 * Test if the arg is an AudioParam
 */
export function isAudioParam(arg) {
    return arg instanceof AudioParam;
}
/**
 * Test if the arg is an AudioNode
 */
export function isAudioNode(arg) {
    return arg instanceof AudioNode;
}
/**
 * Test if the arg is a signal.
 */
export function isSignal(arg) {
    return arg instanceof ToneAudioNode && arg.isSignal;
}
/**
 * Test if the arg is a constructor function.
 */
export function isConstructor(arg) {
    return isFunction(arg) && arg.prototype && arg.prototype.constructor === arg;
}
/**
 * Test if the arg is a valid time representation
 */
export function isTime(arg) {
    return arg instanceof Time;
}
