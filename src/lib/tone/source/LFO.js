import { __decorate } from "tslib";
import { optionsFromArguments } from "../core/util/Defaults.js";
import { isAudioParam, isNumber, isString } from "../core/util/Type.js";
import { Oscillator } from "./Oscillator.js";
import { Signal } from "../signal/Signal.js";
import { AudioToGain } from "../signal/AudioToGain.js";
import { readOnly } from "../core/util/Interface.js";
import { Gain } from "../core/context/Gain.js";
/**
 * LFO stands for low frequency oscillator. LFO produces an output signal
 * which can be attached to an AudioParam or Tone.Signal
 * in order to modulate that parameter's value. The LFO can also be synchronized
 * to the transport to start, stop, and change speed along with the transport.
 *
 * @param frequency The frequency of the LFO.
 * @param min The minimum output value of the LFO.
 * @param max The maximum output value of the LFO.
 * @example
 * import { LFO, Oscillator } from "tone";
 * const lfo = new LFO("4n", 400, 4000).start().toDestination();
 * const osc = new Oscillator().connect(lfo).start();
 * @category Source
 */
export class LFO extends Oscillator {
    constructor() {
        const options = optionsFromArguments(LFO.getDefaults(), arguments, [
            "frequency",
            "min",
            "max",
        ]);
        super(Object.assign(options, {
            frequency: options.frequency,
            amplitude: options.amplitude,
        }));
        this.name = "LFO";
        this.output = new Gain({ context: this.context });
        this._a2g = new AudioToGain({ context: this.context });
        this.amplitude = new Signal({
            context: this.context,
            units: "normalRange",
            value: options.amplitude,
        });
        this.min = options.min;
        this.max = options.max;
        // connections
        this._oscillator.connect(this._a2g);
        this._a2g.connect(this.output);
        this.phase = options.phase;
        readOnly(this, "amplitude");
    }
    static getDefaults() {
        return Object.assign(Oscillator.getDefaults(), {
            frequency: "4n",
            min: 0,
            max: 1,
            amplitude: 1,
            type: "sine",
            units: "number",
        });
    }
    /**
     * Start the LFO.
     * @param time The time to start the LFO.
     */
    start(time) {
        super.start(time);
        return this;
    }
    /**
     * Stop the LFO.
     * @param time The time to stop the LFO.
     */
    stop(time) {
        super.stop(time);
        return this;
    }
    /**
     * Sync the start/stop/pause to the transport
     * and the frequency to the transport's bpm
     * @param delay The time to delay the start of the sync by
     */
    sync(delay) {
        this.frequency.sync(delay);
        super.sync(delay);
        return this;
    }
    /**
     * Unsync the start/stop/pause and the frequency from the transport
     */
    unsync() {
        this.frequency.unsync();
        super.unsync();
        return this;
    }
    /**
     * The minimum value of the output of the LFO.
     */
    get min() {
        return this._a2g.min;
    }
    set min(min) {
        this._a2g.min = min;
    }
    /**
     * The maximum value of the output of the LFO.
     */
    get max() {
        return this._a2g.max;
    }
    set max(max) {
        this._a2g.max = max;
    }
    /**
     * The LFO's oscillator type
     */
    get type() {
        return this._oscillator.type;
    }
    set type(type) {
        this._oscillator.type = type;
    }
    /**
     * The amplitude of the LFO, which is between 0-1. Bounced between 0-1 to equalPower gain scale.
     */
    get amplitude() {
        return this._oscillator.volume.value;
    }
    set amplitude(amp) {
        this._oscillator.volume.value = amp;
    }
    /**
     * The frequency of the LFO.
     */
    get frequency() {
        return this._oscillator.frequency;
    }
    /**
     * The phase of the LFO.
     */
    get phase() {
        return this._oscillator.phase;
    }
    set phase(phase) {
        this._oscillator.phase = phase;
    }
    /**
     * The output of the LFO
     */
    get output() {
        return this._output;
    }
    set output(output) {
        this._output = output;
    }
    /**
     * The partials of the LFO.
     */
    get partials() {
        return this._oscillator.partials;
    }
    set partials(partials) {
        this._oscillator.partials = partials;
    }
    /**
     * The partial count of the LFO.
     */
    get partialCount() {
        return this._oscillator.partialCount;
    }
    set partialCount(partialCount) {
        this._oscillator.partialCount = partialCount;
    }
    /**
     * Connect the output of the LFO to an AudioParam, AudioNode, or Tone.Signal.
     * @param node The node to connect to.
     * @param outputNum The output number to connect from.
     * @param inputNum The input number to connect to.
     */
    connect(node, outputNum = 0, inputNum = 0) {
        if (isAudioParam(node) ||
            (node instanceof Signal && isAudioParam(node.input))) {
            this.output.connect(node, outputNum, inputNum);
        }
        else {
            super.connect(node, outputNum, inputNum);
        }
        return this;
    }
    /**
     * The value of the LFO at the current time.
     */
    get value() {
        return this.output.value;
    }
    /**
     * Mute the output.
     */
    mute() {
        this.output.mute = true;
        return this;
    }
    /**
     * Unmute the output.
     */
    unmute() {
        this.output.mute = false;
        return this;
    }
    /**
     * Dispose of the LFO.
     */
    dispose() {
        super.dispose();
        this._a2g.dispose();
        this.amplitude.dispose();
        return this;
    }
}
__decorate([
    isNumber
], LFO.prototype, "min", null);
__decorate([
    isNumber
], LFO.prototype, "max", null);
__decorate([
    isString
], LFO.prototype, "type", null);
__decorate([
    isNumber
], LFO.prototype, "amplitude", null);
__decorate([
    isAudioParam
], LFO.prototype, "frequency", null);
__decorate([
    isNumber
], LFO.prototype, "phase", null);
__decorate([
    isArray
], LFO.prototype, "partials", null);
__decorate([
    isNumber
], LFO.prototype, "partialCount", null);
