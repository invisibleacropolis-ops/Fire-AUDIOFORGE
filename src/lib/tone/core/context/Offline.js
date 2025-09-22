import { ToneAudioBuffer } from "./ToneAudioBuffer.js";
import { createOfflineAudioContext, } from "./AudioContext.js";
import { Context } from "./Context.js";
import { isNumber } from "../util/Type.js";
/**
 * Generate a buffer by rendering all of the Tone.js code within the callback using the OfflineAudioContext.
 * The OfflineAudioContext is promise-based, so this method returns a promise which resolves with the rendered ToneAudioBuffer.
 *
 * @param  callback The callback to be invoked with the offline context.
 * @param  duration The duration of the buffer to render in seconds.
 * @example
 * import { Offline, Oscillator } from "tone";
 * // render 2 seconds of the oscillator
 * const buffer = await Offline(() => {
 * 	// a single oscillator
 * 	const osc = new Oscillator(440, "sine").toDestination().start(0);
 * }, 2);
 * @category Core
 */
export function Offline(callback, duration, channels = 2, sampleRate = 44100) {
    // set the sample rate and channels
    if (isNumber(channels)) {
        sampleRate = channels;
        channels = 2;
    }
    // create the context
    const offlineContext = createOfflineAudioContext(channels, duration * sampleRate, sampleRate);
    // wrap the callback in a promise
    return new Promise((resolve, reject) => {
        // run the callback and then render the audio
        Promise.resolve(callback(offlineContext))
            .then(() => {
            // render the buffer
            offlineContext
                .startRendering()
                .then((buffer) => {
                // resolve the promise with a ToneAudioBuffer
                resolve(new ToneAudioBuffer(buffer));
            })
                .catch(reject);
        })
            .catch(reject);
    });
}
