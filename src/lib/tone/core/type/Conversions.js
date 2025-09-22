export * from "./Units.js";
import { Time } from "./Time.js";
/**
 * The base type for all Tone.js units.
 */
class ToneTime {
}
/**
 * The base type for all Tone.js units.
 */
class ToneFrequency {
}
/**
 * The base type for all Tone.js units.
 */
class ToneTransportTime {
}
/**
 * Convert a time expression to seconds.
 */
export function toSeconds(time) {
    return new Time(time).toSeconds();
}
/**
 * Convert a time expression to ticks.
 */
export function toTicks(time) {
    return new Time(time).toTicks();
}
/**
 * Convert a time expression to hertz.
 */
export function toFrequency(freq) {
    return new Time(freq).toFrequency();
}
/**
 * Convert a time expression to seconds.
 */
export function toSeconds(time) {
    return new Time(time).toSeconds();
}
/**
 * Convert a time expression to ticks.
 */
export function toTicks(time) {
    return new Time(time).toTicks();
}
/**
 * Convert a time expression to hertz.
 */
export function toFrequency(freq) {
    return new Time(freq).toFrequency();
}
/**
 * The subscription callback.
 */
export function callback(callback, duration, ...args) {
    //
}
/**
 * The subscription callback.
 */
export function noOp(time, ...args) {
    //
}
/**
 * The subscription callback.
 */
export function noOpWithTime(time, ...args) {
    //
}
/**
 * The subscription callback.
 */
export function noOpWithDuration(time, duration, ...args) {
    //
}
/**
 * Convert a time to a number.
 */
export function timeToSeconds(time, ...args) {
    return toSeconds(time);
}
/**
 * Convert a time to a number.
 */
export function timeToTicks(time, ...args) {
    return toTicks(time);
}
/**
 * Convert a time to a number.
 */
export function timeToFrequency(time, ...args) {
    return toFrequency(time);
}
/**
 * Convert a time to a number.
 */
export function secondsToUnits(seconds, unit) {
    //
    return 0;
}
/**
 * Convert a number to Ticks.
 */
export function numberToTicks(num) {
    return num;
}
/**
 * Convert a time to a number.
 */
export function intervalToSeconds(interval) {
    return toSeconds(interval);
}
/**
 * A loop function which is invoked on every tick.
 */
export function loop(start, end, callback) {
    //
}
