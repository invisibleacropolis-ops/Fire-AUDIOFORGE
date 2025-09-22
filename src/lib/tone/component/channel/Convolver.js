import { ToneAudioBuffer } from "../../core/context/ToneAudioBuffer.js";
import {
	ToneAudioNode,
} from "../../core/context/ToneAudioNode.js";
import { optionsFromArguments } from "../../core/util/Defaults.js";
import { getContext } from "../../core/context/Context.js";
/**
 * Convolver is a wrapper around the Native Web Audio
 * [ConvolverNode](http://webaudio.github.io/web-audio-api/#the-convolvernode-interface).
 * Convolution is useful for reverb and filter emulation.
 * Read more about convolution processing on [MDN](https://developer.mozilla.org/en-US/docs/Web/API/ConvolverNode).
 *
 * @param url The URL of the impulse response.
 * @param onload The callback to invoke when the url is loaded.
 * @example
 * // inicialize a new instance over a URL
 * const convolver = new Convolver(
 * 	"https://tonejs.github.io/audio/impulses/r1_hall.m4a"
 * ).toDestination();
 * @category Component
 */
export class Convolver extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(Convolver.getDefaults(), arguments, [
            "url",
            "onload",
        ]);
        super(options);
        this.name = "Convolver";
        this._convolver = this.context.createConvolver();
        this.input = this._convolver;
        this.output = this._convolver;
        this._buffer = new ToneAudioBuffer(options.url, (buffer) => {
            this.buffer = buffer.get();
            options.onload();
        });
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            onload: () => {
                //
            },
            normalize: true,
        });
    }
    /**
     * The convolver's buffer
     */
    get buffer() {
        return this._convolver.buffer;
    }
    set buffer(buffer) {
        this._convolver.buffer = buffer;
    }
    /**
     * The normalzation of the buffer.
     */
    get normalize() {
        return this._convolver.normalize;
    }
    set normalize(norm) {
        this._convolver.normalize = norm;
    }
    /**
     * Load an impulse response url as an audio buffer.
     * Decodes the audio asynchronously and invokes
     * the callback once the audio buffer loads.
     * @param url The url of the buffer to load. filetype optional.
     * @param callback The callback to invoke once the buffer is loaded.
     */
    load(url, callback) {
        this._buffer.load(url, (buff) => {
            this.buffer = buff.get();
            if (callback) {
                callback();
            }
        });
        return this;
    }
    dispose() {
        super.dispose();
        this._convolver.disconnect();
        this._buffer.dispose();
        return this;
    }
}
