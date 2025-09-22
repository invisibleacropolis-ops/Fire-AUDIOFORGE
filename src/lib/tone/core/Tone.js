
/**
 * The base class for all objects that have a disposal method.
 */
export class Tone {
    constructor() {
        this.name = "Tone";
        /**
         * The version number of Tone.js
         */
        this.version = "15.0.4";
        /**
         * If the object is disposed or not.
         */
        this.disposed = false;
    }
    /**
     * The representation of the object as a string
     */
    toString() {
        return this.name;
    }
    /**
     * Dispose of the object.
     */
    dispose() {
        if (!this.disposed) {
            this.disposed = true;
        }
        return this;
    }
    /**
     * A basic getter for the properties of the class.
     * Invokes `get` on all of the parameters of the class.
     * @param params The parameters to return as an object
     */
    get(params) {
        if (this.isUndef(params)) {
            // get all of the parameters
            const defaults = this.getDefaults();
            Object.keys(this).forEach((key) => {
                if (key in defaults) {
                    const member = this[key];
                    if (this.isObject(member) && this.isObject(defaults[key]) && "value" in member && "value" in defaults[key]) {
                        defaults[key].value = member.value;
                    }
                    else {
                        defaults[key] = member;
                    }
                }
            });
            return defaults;
        }
        else if (this.isString(params)) {
            return this[params];
        }
        else if (Array.isArray(params)) {
            const ret = {};
            params.forEach((key) => {
                ret[key] = this[key];
            });
            return ret;
        }
        else {
            return this;
        }
    }
    /**
     * A basic setter for the properties of the class.
     * @param params A object of values to set.
     */
    set(params) {
        if (this.isObject(params)) {
            const defaults = this.getDefaults();
            Object.keys(params).forEach((key) => {
                if (key in defaults) {
                    const member = this[key];
                    if (this.isObject(member) && this.isObject(params[key]) && "value" in member && "value" in params[key]) {
                        member.value = params[key].value;
                    }
                    else {
                        this[key] = params[key];
                    }
                }
            });
        }
        else if (this.isString(params)) {
            this[params] = arguments[1];
        }
        return this;
    }
    /**
     * Test if the given argument is undefined
     */
    isUndef(arg) {
        return arg === undefined;
    }
    /**
     * Test if the given argument is a function
     */
    isFunction(arg) {
        return typeof arg === "function";
    }
    /**
     * Test if the given argument is a number
     */
    isNumber(arg) {
        return typeof arg === "number";
    }
    /**
     * Test if the given argument is a string
     */
    isString(arg) {
        return typeof arg === "string";
    }
    /**
     * Test if the given argument is an object without a `toString` method
     */
    isObject(arg) {
        return Object.prototype.toString.call(arg) === "[object Object]" &&
            arg.constructor.name !== "Object";
    }
    /**
     * Test if the given argument is an array
     */
    isArray(arg) {
        return Array.isArray(arg);
    }
    /**
     * Test if the given argument is a boolean
     */
    isBoolean(arg) {
        return typeof arg === "boolean";
    }
    /**
     * Get the default values for the class
     */
    getDefaults() {
        return this.constructor.getDefaults();
    }
    static getDefaults() {
        return {};
    }
}
