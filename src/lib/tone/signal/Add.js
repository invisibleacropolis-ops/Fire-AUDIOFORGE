import { __decorate } from "tslib";
import { Gain } from "../core/context/Gain.js";
import { Param } from "../core/context/Param.js";
import { optionsFromArguments } from "../core/util/Defaults.js";
import { isAudioParam } from "../core/util/Type.js";
import { SignalOperator } from "./SignalOperator.js";
/**
 * Add a signal and a number or two signals. When no value is
 * passed into the constructor, Tone.Add will sum input and `addend`
 * If two signals are connected to the input, they will be summed.
 *
 * @example
 * import { Add, Signal } from "tone";
 * const add = new Add(2).toDestination();
 * const signal = new Signal(3).connect(add);
 * // the output of add equals 5
 * @category Signal
 */
export class Add extends SignalOperator {
    constructor() {
        const options = optionsFromArguments(Add.getDefaults(), arguments, [
            "value",
        ]);
        super(Object.assign(options, {
            context: options.context,
            numberOfInputs: 2,
        }));
        this.name = "Add";
        this.input = [
            (this._sum = this.output = new Gain({ context: this.context })),
            (this._param = new Gain({ context: this.context })),
        ];
        this.addend = new Param({
            context: this.context,
            param: this._param.gain,
            value: options.value,
        });
        this._param.connect(this._sum);
    }
    static getDefaults() {
        return Object.assign(SignalOperator.getDefaults(), {
            value: 0,
        });
    }
    /**
     * clean up
     */
    dispose() {
        super.dispose();
        this._sum.dispose();
        this._param.dispose();
        this.addend.dispose();
        return this;
    }
}
__decorate([
    isAudioParam
], Add.prototype, "addend", void 0);
