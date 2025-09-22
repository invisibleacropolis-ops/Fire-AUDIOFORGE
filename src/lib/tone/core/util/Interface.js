import { isAudioParam, isSignal } from "./Type.js";
/**
 * Make the property not writable. Only works for get/set properties.
 * @param target The target object
 * @param prop The property to make not writable
 */
export function readOnly(target, prop) {
    if (Array.isArray(prop)) {
        prop.forEach((p) => readOnly(target, p));
    }
    else {
        let proto = Object.getPrototypeOf(target);
        while (proto && !Object.getOwnPropertyDescriptor(proto, prop)) {
            proto = Object.getPrototypeOf(proto);
        }
        if (proto) {
            const property = Object.getOwnPropertyDescriptor(proto, prop);
            if (property && property.set) {
                Object.defineProperty(target, prop, {
                    set: () => {
                        throw new Error(`Cannot set readonly property: ${prop}`);
                    },
                });
            }
        }
    }
}
/**
 * Make an attribute writeable.
 * @param target The target object
 * @param prop The property to make writable
 */
export function writable(target, prop) {
    if (Array.isArray(prop)) {
        prop.forEach((p) => writable(target, p));
    }
    else {
        let proto = Object.getPrototypeOf(target);
        while (proto && !Object.getOwnPropertyDescriptor(proto, prop)) {
            proto = Object.getPrototypeOf(proto);
        }
        if (proto) {
            const property = Object.getOwnPropertyDescriptor(proto, prop);
            if (property && property.set) {
                Object.defineProperty(target, prop, {
                    set: property.set,
                });
            }
        }
    }
}
/**
 * Make a target property draggable.
 * @param target The target object
 * @param prop The property to make draggable
 * @param min The minimum value of the property
 * @param max The maximum value of the property
 */
export function draggable(target, prop, min, max) {
    if (Array.isArray(prop)) {
        prop.forEach((p) => draggable(target, p, min, max));
    }
    else {
        const ondrag = (e) => {
            const value = e.value;
            if (isAudioParam(target[prop]) || isSignal(target[prop])) {
                target[prop].value = value;
            }
            else {
                target[prop] = value;
            }
        };
        // object has to be an event emitter
        if (typeof target.on === "function") {
            target.on("drag", ondrag);
        }
    }
}
