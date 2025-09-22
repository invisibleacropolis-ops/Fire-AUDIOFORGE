
import { isObject, isUndef } from "./Type.js";
/**
 * Deeply merge the given objects. The first object is the destination.
 * Unlike `Object.assign`, this function will merge recursively.
 */
export function deepMerge(target, ...sources) {
    if (sources.length === 0) {
        return target;
    }
    const source = sources.shift();
    if (!isObject(target) || !isObject(source)) {
        return target;
    }
    for (const key in source) {
        if (isObject(source[key])) {
            if (!target[key]) {
                Object.assign(target, { [key]: {} });
            }
            deepMerge(target[key], source[key]);
        }
        else {
            Object.assign(target, { [key]: source[key] });
        }
    }
    return deepMerge(target, ...sources);
}
/**
 * Returns true if the two arrays have the same value for each of the elements.
 */
export function equal(arrayA, arrayB) {
    if (arrayA.length !== arrayB.length) {
        return false;
    }
    for (let i = 0; i < arrayA.length; i++) {
        if (arrayA[i] !== arrayB[i]) {
            return false;
        }
    }
    return true;
}
/**
 * Convert an args array into an object.
 * @param keys The keys to look for
 * @param args The args array
 * @param defaults The default values if none are found.
 */
export function optionsFromArguments(defaults, args, keys = [], objKey) {
    const options = {};
    const argsArray = Array.from(args);
    // if the first argument is an object, then use that as the options
    if (isObject(argsArray[0]) && Object.keys(argsArray[0]).length > 0 && !(argsArray[0] instanceof
        ToneWithContext)) {
        Object.assign(options, argsArray[0]);
        // if the objKey exists, the first argument is going to be the object key
    }
    else if (objKey && isObject(argsArray[0]) && objKey in argsArray[0]) {
        Object.assign(options, argsArray[0]);
    }
    else {
        for (let i = 0; i < keys.length; i++) {
            if (!isUndef(argsArray[i])) {
                options[keys[i]] = argsArray[i];
            }
        }
    }
    return Object.assign(defaults, options);
}
import { ToneWithContext } from "../ToneWithContext.js";
/**
 * Return this instances default values by calling `getDefaults` on the class,
 * then merging the values with the options object.
 * @param options The options object to be merged with the defaults
 */
export function getDefaultsFromInstance(instance) {
    // @ts-ignore
    return instance.constructor.getDefaults();
}
/**
 * Returns the fallback if the given value is undefined.
 * @param value
 * @param fallback
 */
export function fallback(value, fallback) {
    if (isUndef(value)) {
        return fallback;
    }
    else {
        return value;
    }
}
/**
 * If the `given` parameter is undefined, use the `fallback`.
 * If the `given` parameter is an object, recursively merge it with the `fallback`
 * `fallback` must be an object.
 *
 * @param given
 * @param fallback
 */
export function deepFallback(given, fallback) {
    if (isUndef(given)) {
        return fallback;
    }
    else if (isObject(given)) {
        return deepMerge(fallback, given);
    }
    else {
        return given;
    }
}
