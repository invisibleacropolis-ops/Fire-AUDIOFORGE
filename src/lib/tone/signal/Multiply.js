import { __decorate } from "tslib";
import { Param } from "../core/context/Param.js";
import { optionsFromArguments } from "../core/util/Defaults.js";
import { isAudioParam } from "../core/util/Type.js";
import { SignalOperator } from "./SignalOperator.js";
import { Gain } from "../core/context/Gain.js";
/**
 * Multiply two incoming signals. Or, if a number is given in the constructor,
 * multiplies the incoming signal by that value.
 *
 * @example
 * import { Multiply, Signal } from "tone";
 * const mult = new Multiply();
 * const sigA = new Signal(3).connect(mult.a);
 * const sigB = new Signal(4).connect(mult.b);
 * // output of mult is 12.
 * @example
 * import { Multiply, Signal } from "tone";
 * const mult = new Multiply(10);
 * const sig = new Signal(2).connect(mult);
 * // output of mult is 20.
 * @category Signal
 */
export class Multiply extends SignalOperator {
    constructor() {
        const options = optionsFromArguments(Multiply.getDefaults(), arguments, ["value"]);
        super(Object.assign(options, {
            context: options.context,
            numberOfInputs: 2,
            numberOfOutputs: 1,
        }));
        this.name = "Multiply";
        this.input[0] = this.output = this._mult = new Gain({
            context: this.context,
        });
        this.input[1] = this._mult.gain;
        this.factor = this._mult.gain;
        this.factor.value = options.value;
    }
    static getDefaults() {
        return Object.assign(SignalOperator.getDefaults(), {
            value: 0,
        });
    }
    /**
     * The multiplying factor.
     */
    get factor() {
        return this._factor;
    }
    set factor(factor) {
        this._factor = factor;
    }
    /**
     * clean up
     */
    dispose() {
        super.dispose();
        this._mult.dispose();
        this.factor.dispose();
        return this;
    }
}
__decorate([
    isAudioParam
], Multiply.prototype, "factor", null);
