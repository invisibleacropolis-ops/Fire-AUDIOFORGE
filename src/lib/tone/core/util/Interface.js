
import { isAudioParam } from "./Type.js";
/**
 * Set the given properties on the object after the object has been constructed.
 * @param  object
 * @param  props
 */
export function setProps(obj, props) {
    for (const prop in props) {
        if (prop in obj && obj[prop] !== null) {
            if (isAudioParam(obj[prop])) {
                // @ts-ignore
                obj[prop].value = props[prop];
            }
            else {
                // @ts-ignore
                obj[prop] = props[prop];
            }
        }
    }
}
/**
 * Make the given properties on the object read only.
 */
export function readOnly(obj, properties) {
    properties.forEach(prop => {
        if (prop in obj) {
            const proto = Object.getPrototypeOf(obj);
            const superProto = Object.getPrototypeOf(proto);
            // if the property is on the super class, make sure we're not squashing a setter
            if (Object.getOwnPropertyDescriptor(superProto, prop)) {
                // if it has a setter, it must be a property which can be set
                if (Object.getOwnPropertyDescriptor(superProto, prop).set) {
                    return;
                }
            }
            const desc = Object.getOwnPropertyDescriptor(proto, prop);
            if (desc) {
                Object.defineProperty(obj, prop, {
                    enumerable: desc.enumerable,
                    get: desc.get,
                });
            }
        }
    });
}
//# sourceMappingURL=Interface.js.map
