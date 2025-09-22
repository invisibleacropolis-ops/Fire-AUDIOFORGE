import { Tone } from "../Tone.js";
import { optionsFromArguments } from "../util/Defaults.js";
import { isArray, isNumber } from "../util/Type.js";
import { getContext } from "./Context.js";
/**
 * A thin wrapper around the AudioBuffer that provides useful methods like reversing the buffer.
 * @category Core
 */
export class ToneAudioBuffer extends Tone {
    constructor() {
        const options = optionsFromArguments(ToneAudioBuffer.getDefaults(), arguments, ["url", "onload", "onerror"]);
        super(options);
        this.name = "ToneAudioBuffer";
        /**
         * The url of the buffer. `undefined` if the buffer was created from an array.
         */
        this.url = undefined;
        /**
         * Indicates if the buffer is loaded or not.
         */
        this.loaded = false;
        /**
         * A promise which resolves when the buffer is loaded.
         */
        this.load = this.loaded;
        /**
         * An array of promises which are proxies for the load event
         */
        this._loadingPromises = [];
        this._buffer = null;
        if (options.url instanceof AudioBuffer) {
            this.set(options.url);
            this.loaded = true;
        }
        else if (options.url instanceof ToneAudioBuffer) {
            this.set(options.url.get());
            this.loaded = true;
        }
        else if (isNumber(options.url)) {
            // assume it's the length of the buffer
            this.set(this.context.createBuffer(options.channels, options.url * this.context.sampleRate, this.context.sampleRate));
        }
        else if (isArray(options.url)) {
            // assume it's an array of numbers
            const buffer = this.context.createBuffer(options.channels, options.url.length, this.context.sampleRate);
            for (let i = 0; i < options.channels; i++) {
                buffer.copyToChannel(options.url, i);
            }
            this.set(buffer);
        }
        else if (options.url) {
            this.load(options.url)
                .then(options.onload)
                .catch(options.onerror);
        }
    }
    static getDefaults() {
        return {
            onload: () => {
                //
            },
            onerror: () => {
                //
            },
            url: undefined,
            reverse: false,
            channels: 1,
        };
    }
    /**
     * The sample rate of the audio buffer.
     */
    get sampleRate() {
        if (this._buffer) {
            return this._buffer.sampleRate;
        }
        else {
            return this.context.sampleRate;
        }
    }
    /**
     *  Set the audio buffer.
     */
    set(buffer) {
        this._buffer = buffer;
        this.loaded = true;
        return this;
    }
    /**
     * The audio buffer.
     */
    get() {
        return this._buffer;
    }
    /**
     *  Loads a url using fetch and returns the AudioBuffer.
     * @param url The url of the audio file.
     * @param cors If the requests should be done with cross-origin-resource-sharing
     */
    async load(url, cors = false) {
        this.url = url;
        // add this to the loading promises
        let promise;
        this._loadingPromises.push(promise);
        // fetch the url
        const response = await fetch(url, {
            mode: cors ? "cors" : "no-cors",
        });
        if (!response.ok) {
            throw new Error(`could not load url: ${url}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
        this.set(audioBuffer);
        this.loaded = true;
        // resolve all the promises
        this._loadingPromises.forEach((p) => p.resolve(this));
        // return this promise
        return this;
    }
    /**
     * Pass in an AudioBuffer or ToneAudioBuffer to set the value of this buffer.
     */
    fromArray(array, channels = 1) {
        const buffer = this.context.createBuffer(channels, array.length, this.context.sampleRate);
        for (let i = 0; i < channels; i++) {
            buffer.copyToChannel(array, i);
        }
        this.set(buffer);
        return this;
    }
    /**
     * Get the buffer as an array.
     */
    toArray(channel) {
        if (this._buffer) {
            if (isNumber(channel)) {
                return this._buffer.getChannelData(channel);
            }
            else {
                const ret = [];
                for (let i = 0; i < this._buffer.numberOfChannels; i++) {
                    ret[i] = this._buffer.getChannelData(i);
                }
                return ret;
            }
        }
        else {
            return new Float32Array(0);
        }
    }
    /**
     * The duration of the buffer in seconds.
     */
    get duration() {
        if (this._buffer) {
            return this._buffer.duration;
        }
        else {
            return 0;
        }
    }
    /**
     * The length of the buffer in samples.
     */
    get length() {
        if (this._buffer) {
            return this._buffer.length;
        }
        else {
            return 0;
        }
    }
    /**
     * The number of channels of the buffer.
     */
    get numberOfChannels() {
        if (this._buffer) {
            return this._buffer.numberOfChannels;
        }
        else {
            return 0;
        }
    }
    /**
     * Reverse the buffer.
     */
    get reverse() {
        if (this.loaded) {
            for (let i = 0; i < this.numberOfChannels; i++) {
                const channel = this._buffer.getChannelData(i);
                Array.prototype.reverse.call(channel);
            }
        }
        return this;
    }
    /**
     * Make a copy of the buffer
     */
    clone() {
        const buff = new ToneAudioBuffer();
        if (this._buffer) {
            const newBuff = this.context.createBuffer(this.numberOfChannels, this.length, this.sampleRate);
            for (let i = 0; i < this.numberOfChannels; i++) {
                const channel = this._buffer.getChannelData(i);
                newBuff.copyToChannel(channel, i);
            }
            buff.set(newBuff);
        }
        return buff;
    }
    /**
     * The url of the buffer. `undefined` if the buffer was created from an array.
     */
    get url() {
        return this._url;
    }
    set url(url) {
        this._url = url;
    }
    /**
     * Get a slice of the buffer.
     * @param start The start of the slice in seconds.
     * @param end The end of the slice in seconds.
     */
    slice(start, end = this.duration) {
        const startSamples = Math.floor(start * this.sampleRate);
        const endSamples = Math.floor(end * this.sampleRate);
        const len = endSamples - startSamples;
        const newBuff = this.context.createBuffer(this.numberOfChannels, len, this.sampleRate);
        for (let i = 0; i < this.numberOfChannels; i++) {
            const channel = this._buffer.getChannelData(i);
            const newChannel = newBuff.getChannelData(i);
            for (let j = 0; j < len; j++) {
                newChannel[j] = channel[j + startSamples];
            }
        }
        return new ToneAudioBuffer().set(newBuff);
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this._buffer = null;
        return this;
    }
}
let cache = new Map();
/**
 * A path to a directory of audio files.
 */
let baseUrl = "";
/**
 * Set the base url for all Tone.js audio files.
 */
export function setBaseUrl(url) {
    baseUrl = url;
}
/**
 * Add a url to the cache
 */
function add(url, buffer) {
    const absoluteUrl = new URL(url, baseUrl).href;
    cache.set(absoluteUrl, buffer);
}
/**
 * Remove a url from the cache
 */
function remove(url) {
    const absoluteUrl = new URL(url, baseUrl).href;
    cache.delete(absoluteUrl);
}
/**
 * Get a buffer from the cache
 */
function get(url) {
    const absoluteUrl = new URL(url, baseUrl).href;
    return cache.get(absoluteUrl);
}
/**
 * Check if the url is in the cache
 */
function has(url) {
    const absoluteUrl = new URL(url, baseUrl).href;
    return cache.has(absoluteUrl);
}
/**
 * A map of all of the audio buffers
 */
export const ToneAudioBuffers = {
    add,
    get,
    has,
    remove,
    setBaseUrl,
};
/**
 * A map of all of the loaded buffers
 */
const loaded = new Map();
/**
 * A promise which resolves when all of the buffers have loaded.
 */
export async function loaded() {
    await Promise.all(Array.from(loaded.values()));
}
/**
 * All of the buffers
 */
export { ToneAudioBuffers as Buffers };
export function loaded() {
    let allLoaded = false;
    for (const url of loaded.keys()) {
        const buffer = ToneAudioBuffer.get(url);
        if (!buffer.loaded) {
            allLoaded = false;
            break;
        }
    }
    return allLoaded;
}
/**
 * The cache of all of the audio buffers
 */
export const Buffers = new Map();
/**
 * Load a buffer or an array of buffers.
 * @param url
 * @param onload
 * @param onerror
 */
export function load(url, onload, onerror) {
    const urls = Array.isArray(url) ? url : [url];
    const promise = Promise.all(urls.map((url) => {
        const promise = new Promise((success, error) => {
            new ToneAudioBuffer(url, success, error);
        });
        return promise;
    }));
    if (onload) {
        promise.then(onload);
    }
    if (onerror) {
        promise.catch(onerror);
    }
    return promise;
}
// Also make the ToneAudioBuffer on the Tone object
Tone.ToneAudioBuffer = ToneAudioBuffer;
