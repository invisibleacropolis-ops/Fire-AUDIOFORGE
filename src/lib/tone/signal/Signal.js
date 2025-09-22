import { __decorate } from "tslib";
import { Param } from "../core/context/Param.js";
import { optionsFromArguments } from "../core/util/Defaults.js";
import { isAudioParam, isNumber, isSignal } from "../core/util/Type.js";
import { SignalOperator } from "./SignalOperator.js";
import { ToneConstantSource } from "../source/ToneConstantSource.js";
import { Gain } from "../core/context/Gain.js";
/**
 * A signal is an audio-rate value. Tone.Signal is a wrapper around the
 * native Web Audio's [ConstantSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/ConstantSourceNode).
 * A signal can be scheduled to change value in the future.
 * @example
 * import { Signal } from "tone";
 * const signal = new Signal(1).toDestination();
 * // ramp the value of the signal to 0 over 2 seconds
 * signal.rampTo(0, 2);
 * @category Signal
 */
export class Signal extends SignalOperator {
    constructor() {
        const options = optionsFromArguments(Signal.getDefaults(), arguments, [
            "value",
            "units",
        ]);
        super(options);
        this.name = "Signal";
        this.override = false;
        this.input = this.output = this._constantSource = new ToneConstantSource({
            context: this.context,
            offset: options.value,
            units: options.units,
        });
        this.param = this._constantSource.offset;
    }
    static getDefaults() {
        return Object.assign(SignalOperator.getDefaults(), {
            value: 0,
            units: "number",
            convert: true,
        });
    }
    //-------------------------------------
    // SIGNAL VALUE
    //-------------------------------------
    get value() {
        return this.param.value;
    }
    set value(value) {
        this.param.value = value;
    }
    get convert() {
        return this.param.convert;
    }
    set convert(convert) {
        this.param.convert = convert;
    }
    //-------------------------------------
    // CONNECTIONS
    //-------------------------------------
    /**
     * When a signal is connected to this signal, the output of this signal
     * will be the sum of the two signals.
     * @param node The node to connect to the input of this signal
     * @param outputNum The output to connect from.
     * @param inputNum The input to connect to.
     */
    connect(node, outputNum = 0, inputNum = 0) {
        // if the destination is an audio param, should override that value
        if (isAudioParam(node) ||
            (node instanceof Param && isAudioParam(node.input))) {
            this.override = true;
            this.input.connect(node, outputNum, inputNum);
        }
        else if (node instanceof Signal) {
            // if it's a signal, just connect it to the input
            super.connect(node, outputNum, inputNum);
        }
        else {
            // otherwise connect to the normal input
            super.connect(node, outputNum, inputNum);
        }
        return this;
    }
    //-------------------------------------
    // SCHEDULING
    //-------------------------------------
    setValueAtTime(value, time) {
        this.param.setValueAtTime(value, time);
        return this;
    }
    getValueAtTime(time) {
        return this.param.getValueAtTime(time);
    }
    linearRampToValueAtTime(value, endTime) {
        this.param.linearRampToValueAtTime(value, endTime);
        return this;
    }
    exponentialRampToValueAtTime(value, endTime) {
        this.param.exponentialRampToValueAtTime(value, endTime);
        return this;
    }
    setTargetAtTime(value, startTime, timeConstant) {
        this.param.setTargetAtTime(value, startTime, timeConstant);
        return this;
    }
    setValueCurveAtTime(values, startTime, duration, scaling) {
        this.param.setValueCurveAtTime(values, startTime, duration, scaling);
        return this;
    }
    cancelScheduledValues(startTime) {
        this.param.cancelScheduledValues(startTime);
        return this;
    }
    cancelAndHoldAtTime(time) {
        this.param.cancelAndHoldAtTime(time);
        return this;
    }
    rampTo(value, rampTime = 0.1, startTime) {
        this.param.rampTo(value, rampTime, startTime);
        return this;
    }
    //-------------------------------------
    // private methods
    //-------------------------------------
    /**
     * When a signal is connected to this signal, the output of this signal
     * will be the sum of the two signals.
     * @param node The node to connect to the input of this signal
     */
    _connectSignal(node) {
        // if there's no summing node, create one
        if (!this._sum) {
            this._sum = new Gain({ context: this.context });
            this.input.connect(this._sum);
            this._constantSource.connect(this._sum);
            this.input = this._sum;
        }
        node.connect(this._sum);
    }
    /**
     * when a signal is disconnected, if there are no more connections,
     * return the signal to it's original state
     */
    _disconnectSignal(node) {
        if (this._sum) {
            node.disconnect(this._sum);
            if (this._sum.numberOfInputs === 1) {
                // disconnect the constant source and the sum
                this._constantSource.disconnect(this._sum);
                this._sum.disconnect();
                // move the input back to the constant source
                this.input = this._constantSource;
                this._sum = undefined;
            }
        }
    }
    //-------------------------------------
    // DISPOSE
    //-------------------------------------
    dispose() {
        super.dispose();
        this._constantSource.dispose();
        this.param.dispose();
        if (this._sum) {
            this._sum.dispose();
        }
        return this;
    }
}
__decorate([
    isSignal
], Signal.prototype, "connect", null);
