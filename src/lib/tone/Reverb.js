import { __decorate } from "tslib";
import { Convolver } from "./component/channel/Convolver.js";
import { optionsFromArguments } from "./core/util/Defaults.js";
import { isBoolean, isNumber } from "./core/util/Type.js";
import { Effect } from "./effect/Effect.js";
import { OfflineContext } from "./core/context/OfflineContext.js";
import { getContext } from "./core/context/Context.js";
/**
 * Reverb is an algorithmic reverb effect. It is composed of
 * a bank of parallel comb filters, and a bank of parallel allpass filters.
 *
 * @param decay The decay time of the reverb.
 *
 * @example
 * const reverb = new Reverb(2).toDestination();
 * const synth = new FMSynth().connect(reverb);
// set the attributes
 * reverb.preDelay = 0.5;
 * synth.triggerAttackRelease("A3", 4);
 * @category Effect
 */
export class Reverb extends Effect {
    constructor() {
        const options = optionsFromArguments(Reverb.getDefaults(), arguments, [
            "decay",
        ]);
        super(options);
        this.name = "Reverb";
        this._convolver = new Convolver({
            context: this.context,
            normalize: false,
        });
        this.decay = options.decay;
        this.preDelay = options.preDelay;
        // connect the dry/wet
        this.connectEffect(this._convolver);
        this.generate();
    }
    static getDefaults() {
        return Object.assign(Effect.getDefaults(), {
            decay: 1.5,
            preDelay: 0.01,
        });
    }
    /**
     * Generate the impulse response.
     */
    async generate() {
        // create a noise burst which is audio-rate grains.
        const context = new OfflineContext(2, this.decay + 0.1, this.context.sampleRate);
        const noiseL = context.createBufferSource();
        const noiseR = context.createBufferSource();
        const noiseBuffer = context.createBuffer(2, this.context.sampleRate * 0.1, this.context.sampleRate);
        const left = noiseBuffer.getChannelData(0);
        const right = noiseBuffer.getChannelData(1);
        for (let i = 0; i < noiseBuffer.length; i++) {
            left[i] = Math.random() * 2 - 1;
            right[i] = Math.random() * 2 - 1;
        }
        noiseL.buffer = noiseBuffer;
        noiseR.buffer = noiseBuffer;
        // pre-delay
        const preDelayL = context.createDelay(this.decay);
        preDelayL.delayTime.value = this.preDelay;
        const preDelayR = context.createDelay(this.decay);
        preDelayR.delayTime.value = this.preDelay;
        const gainL = context.createGain();
        const gainR = context.createGain();
        gainL.gain.value = Math.pow(10, -1);
        gainR.gain.value = Math.pow(10, -1);
        // an attenuated gain
        const lowpass = context.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = 200;
        const attenuatedGainL = context.createGain();
        const attenuatedGainR = context.createGain();
        attenuatedGainL.gain.value = Math.pow(10, -2);
        attenuatedGainR.gain.value = Math.pow(10, -2);
        noiseL.connect(preDelayL);
        noiseR.connect(preDelayR);
        noiseL.connect(lowpass);
        noiseR.connect(lowpass);
        lowpass.connect(attenuatedGainL);
        lowpass.connect(attenuatedGainR);
        attenuatedGainL.connect(preDelayL);
        attenuatedGainR.connect(preDelayR);
        const decayL = context.createGain();
        const decayR = context.createGain();
        decayL.gain.value = 0;
        decayR.gain.value = 0;
        preDelayL.connect(decayL);
        preDelayR.connect(decayR);
        // the feedback loop
        const feedbackL = context.createGain();
        const feedbackR = context.createGain();
        decayL.connect(feedbackL);
        decayR.connect(feedbackR);
        feedbackL.gain.value = 0.8;
        feedbackR.gain.value = 0.8;
        const delayL = context.createDelay(this.decay);
        const delayR = context.createDelay(this.decay);
        delayL.delayTime.value = this.decay;
        delayR.delayTime.value = this.decay;
        feedbackL.connect(delayL);
        feedbackR.connect(delayR);
        delayL.connect(decayL);
        delayR.connect(decayR);
        decayL.connect(gainL);
        decayR.connect(gainR);
        gainL.connect(context.destination, 0, 0);
        gainR.connect(context.destination, 0, 1);
        noiseL.start(0);
        noiseR.start(0);
        decayL.gain.linearRampToValueAtTime(1, 0.001);
        decayR.gain.linearRampToValueAtTime(1, 0.001);
        const rendered = await context.render();
        // promise is resolved with the rendered buffer
        this._convolver.buffer = rendered;
        return this;
    }
    /**
     * The duration of the reverb.
     */
    get decay() {
        return this._decay;
    }
    set decay(time) {
        this._decay = time;
        if (this._convolver.buffer) {
            this.generate();
        }
    }
    /**
     * The amount of time before the reverb is heard.
     */
    get preDelay() {
        return this._preDelay;
    }
    set preDelay(time) {
        this._preDelay = time;
        if (this._convolver.buffer) {
            this.generate();
        }
    }
    dispose() {
        super.dispose();
        this._convolver.dispose();
        return this;
    }
}
__decorate([
    isNumber
], Reverb.prototype, "decay", null);
__decorate([
    isNumber
], Reverb.prototype, "preDelay", null);
