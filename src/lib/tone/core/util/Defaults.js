import { isArray, isDefined, isObject, isUndef } from "./Type.js";
/**
 * Some objects should not be merged
 */
function noCopy(arg) {
    return (arg instanceof Element ||
        arg instanceof AudioBuffer ||
        arg instanceof AudioContext);
}
/**
 * Recursively merge an object.
 */
export function deepMerge(target, ...sources) {
    if (!sources.length) {
        return target;
    }
    const source = sources.shift();
    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (noCopy(source[key])) {
                target[key] = source[key];
            }
            else if (isObject(source[key])) {
                if (!target[key]) {
                    Object.assign(target, { [key]: {} });
                }
                deepMerge(target[key], source[key]);
            }
            else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }
    return deepMerge(target, ...sources);
}
/**
 * Returns true if the object contains no nested objects, false otherwise.
 */
export function isBasicObject(obj) {
    // eslint-disable-next-line
    for (const key in obj) {
        if (isObject(obj[key])) {
            return false;
        }
    }
    return true;
}
/**
 * Convert an object into a JSON object.
 * @param {object} object
 * @param {string[]} [keys] If a list of keys is given, only those keys will be included in the returned object.
 * @returns {object}
 */
export function serialize(object, keys) {
    const serialized = {};
    if (keys) {
        keys.forEach((key) => {
            if (isDefined(object[key])) {
                serialized[key] = serialize(object[key]);
            }
        });
    }
    else {
        // eslint-disable-next-line
        for (const key in object) {
            const val = object[key];
            if (isDefined(val)) {
                if (typeof val.get === "function") {
                    serialized[key] = val.get();
                }
                else if (typeof val.getValueAtTime === "function") {
                    serialized[key] = val.value;
                }
                else if (isObject(val) && !noCopy(val)) {
                    serialized[key] = serialize(val);
                }
                else if (typeof val !== "function") {
                    serialized[key] = val;
                }
            }
        }
    }
    return serialized;
}
/**
 * Create an options object from the original arguments.
 * Used in combination with getDefaults.
 * @param values The original arguments
 * @param keys The keys to parse the arguments as.
 * @param defaults The default values.
 * @param values The original arguments.
 * @param keys The keys to parse the arguments as.
 * @param defaults The default values.
 * @example
 * function constructor(arg0, arg1, arg2){
 * 	const options = optionsFromArguments(defaults, [arg0, arg1, arg2], ["a", "b"]);
 * }
 */
export function optionsFromArguments(defaults, args, keys = [], objKey) {
    const options = {};
    // if the first argument is an object and has an object key
    if (isObject(args[0]) &&
        objKey &&
        Object.keys(args[0]).some((key) => keys.includes(key))) {
        deepMerge(options, args[0]);
    }
    else {
        // otherwise if it's not an object, assign it to the first key
        for (let i = 0; i < args.length; i++) {
            if (isDefined(args[i]) && keys.length > i) {
                options[keys[i]] = args[i];
            }
        }
    }
    return deepMerge(defaults, options);
}
