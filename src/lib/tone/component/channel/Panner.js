import { Gain } from "../../core/context/Gain.js";
import { Param } from "../../core/context/Param.js";
import { ToneAudioNode } from "../../core/context/ToneAudioNode.js";
import { optionsFromArguments } from "../../core/util/Defaults.js";
import { readOnly } from "../../core/util/Interface.js";
import { Merge } from "./Merge.js";
import { Split } from "./Split.js";
import { Signal } from "../../signal/Signal.js";
/**
 * Panner is a wrapper around the StereoPannerNode.
 * @see {@link StereoPannerNode}
 * @example
 * // pan the input signal hard right.
 * const panner = new Panner(1).toDestination();
 * const osc = new Oscillator().connect(panner).start();
 * @category Component
 */
export class Panner extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(Panner.getDefaults(), arguments, [
            "pan",
        ]);
        super(options);
        this.name = "Panner";
        this._panner = this.context.createStereoPanner();
        /**
         * The input node
         */
        this.input = this._panner;
        /**
         * The output node
         */
        this.output = this._panner;
        this.pan = new Param({
            context: this.context,
            param: this._panner.pan,
            value: options.pan,
            units: "audioRange",
        });
        readOnly(this, ["pan"]);
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            pan: 0,
        });
    }
    dispose() {
        super.dispose();
        this._panner.disconnect();
        this.pan.dispose();
        return this;
    }
    /**
     * Returns the panner's "channelCount"
     */
    get channelCount() {
        return this._panner.channelCount;
    }
    set channelCount(count) {
        this._panner.channelCount = count;
    }
    /**
     * Returns the panner's "channelCountMode"
     */
    get channelCountMode() {
        return this._panner.channelCountMode;
    }
    set channelCountMode(mode) {
        this._panner.channelCountMode = mode;
    }
}
/**
 * Panner is a wrapper around the StereoPannerNode.
 * @see {@link StereoPannerNode}
 * @example
 * // pan the input signal hard right.
 * const panner = new Panner(1).toDestination();
 * const osc = new Oscillator().connect(panner).start();
 * @category Component
 */
export class Panner extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(Panner.getDefaults(), arguments, [
            "pan",
        ]);
        super(options);
        this.name = "Panner";
        this.pan = new Signal({
            context: this.context,
            value: options.pan,
            units: "audioRange",
        });
        readOnly(this, ["pan"]);
        this._merger = this.output = new Merge({
            context: this.context,
            channels: 2,
        });
        this._splitter = this.input = new Split({
            context: this.context,
            channels: 1,
        });
        this._gains = [
            new Gain({ context: this.context }),
            new Gain({ context: this.context }),
        ];
        // connections
        this._splitter.connect(this._gains[0], 0, 0);
        this._splitter.connect(this._gains[1], 0, 0);
        // connect the gains to the merger
        this._gains[0].connect(this._merger, 0, 0);
        this._gains[1].connect(this._merger, 0, 1);
        // Use an equal power crossfade for the panner to keep the energy of the signal constant
        this.pan.connect(this._gains[0].gain, 0, 0);
        this.pan.connect(this._gains[1].gain, 0, 0);
        this.pan.internalFan(this._gains[0].gain, this._gains[1].gain);
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            pan: 0,
        });
    }
    dispose() {
        super.dispose();
        this.pan.dispose();
        this._gains[0].dispose();
        this._gains[1].dispose();
        this._splitter.dispose();
        this._merger.dispose();
        return this;
    }
}
