
import { Gain } from "../../core/context/Gain.js";
import { ToneAudioNode, } from "../../core/context/ToneAudioNode.js";
import { optionsFromArguments } from "../../core/util/Defaults.js";
import { getContext } from "../../core/Global.js";
/**
 * Convolver is a wrapper around the Native Web Audio
 * [ConvolverNode](http://webaudio.github.io/web-audio-api/#the-convolvernode-interface).
 * Convolution is useful for reverb and filter emulation.
 * Read more about convolution reverb on [Wikipedia](https://en.wikipedia.org/wiki/Convolution_reverb).
 *
 * @example
 * // initializing the convolver with an impulse response
 * const convolver = new Convolver("path/to/ir.wav").toDestination();
 * @category Component
 */
export class Convolver extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(Convolver.getDefaults(), arguments, ["url", "onLoad"]);
        super(options);
        this.name = "Convolver";
        /**
         * The native ConvolverNode
         */
        this._convolver = this.context.createConvolver();
        /**
         * The input gain node.
         */
        this.input = new Gain({ context: this.context });
        /**
         * The output gain node.
         */
        this.output = new Gain({ context: this.context });
        /**
         * The duration of the reverb.
         */
        this.decay = 0.5;
        /**
         * The amount of time before the reverb is heard.
         */
        this.preDelay = 0;
        this.input.connect(this._convolver);
        this._convolver.connect(this.output);
        if (options.url) {
            this.load(options.url, options.onLoad);
        }
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            onLoad: () => { },
            url: "",
            decay: 1.5,
            preDelay: 0.01,
        });
    }
    /**
     * Load an impulse response url as an audio buffer.
     * Decodes the audio asynchronously and invokes the
     * `onLoad` callback when the audio buffer is loaded.
     * @param url The url of the buffer to load. filetype determines decoding method.
     */
    load(url, onLoad) {
        return getContext()
            .load(url)
            .then(buffer => {
            this.buffer = buffer;
            if (onLoad) {
                onLoad();
            }
        });
    }
    /**
     * The convolver's buffer
     */
    get buffer() {
        if (this._convolver.buffer) {
            return getContext().createBuffer(this._convolver.buffer);
        }
        else {
            return null;
        }
    }
    set buffer(buffer) {
        this._convolver.buffer = buffer ? buffer.get() : null;
    }
    dispose() {
        super.dispose();
        this._convolver.disconnect();
        return this;
    }
    /**
     * Generate an impulse response.
     */
    generate() {
        // Remove this method in the next major version.
        return this.load(this._convolver.buffer.get());
    }
}
