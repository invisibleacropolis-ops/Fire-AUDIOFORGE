import { optionsFromArguments } from "../core/util/Defaults.js";
import { Add } from "./Add.js";
import { Multiply } from "./Multiply.js";
import { SignalOperator } from "./SignalOperator.js";
/**
 * Scale a normal range signal [0, 1] to the given output range.
 *
 * @example
 * import { Scale, Signal } from "tone";
 * const scale = new Scale(100, 200);
 * const signal = new Signal(0.5).connect(scale);
 * // the output of scale equals 150
 * @category Signal
 */
export class Scale extends SignalOperator {
    constructor() {
        const options = optionsFromArguments(Scale.getDefaults(), arguments, [
            "min",
            "max",
        ]);
        super(options);
        this.name = "Scale";
        this.output = new Add({
            context: this.context,
            value: options.min,
        });
        this._mult = this.input = new Multiply({
            context: this.context,
            value: options.max - options.min,
        });
        this._mult.connect(this.output);
    }
    static getDefaults() {
        return Object.assign(SignalOperator.getDefaults(), {
            min: 0,
            max: 1,
        });
    }
    /**
     * The minimum value of the output range.
     */
    get min() {
        return this.output.value;
    }
    set min(min) {
        this.output.value = min;
        this._setRange();
    }
    /**
     * The maximum value of the output range.
     */
    get max() {
        return this._mult.value + this.output.value;
    }
    set max(max) {
        this._mult.value = max - this.min;
    }
    /**
     * The range of the output between min and max
     */
    _setRange() {
        this._mult.value = this.max - this.min;
    }
    /**
     * clean up
     */
    dispose() {
        super.dispose();
        this.output.dispose();
        this._mult.dispose();
        return this;
    }
}
