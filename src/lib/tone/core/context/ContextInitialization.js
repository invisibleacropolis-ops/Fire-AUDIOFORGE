
import { Context } from "./AudioContext.js";

/**
 * The private audio context shared by all Tone.js instances.
 */
let audioContext;
/**
 * The object which holds all of the unique contexts
 */
export const AlternateContext = {
    set: (context) => {
        audioContext = context;
    },
    get: () => audioContext,
};
/**
 * This promise is resolved when the AudioContext is started.
 * It is used to flattened the promise chain of the start method.
 */
let startedPromise;
/**
 * The default audio context if one is not provided.
 */
function createDefaultContext() {
    // check if the default context is already created
    if (!audioContext) {
        audioContext = new Context();
    }
    return audioContext;
}
/**
 * A Promise which is invoked after the AudioContext is started
 */
export function started() {
    const context = createDefaultContext();
    if (!startedPromise) {
        startedPromise = context._start();
    }
    return startedPromise;
}
/**
 * For test purposes, get the current promise
 */
export function getStartedPromise() {
    return startedPromise;
}
/**
 * For test purposes, set the started promise
 */
export function setStartedPromise(promise) {
    startedPromise = promise;
}
/**
 * If the audio context is not started, start it up.
 */
export async function start() {
    const context = createDefaultContext();
    if (context.state !== "running") {
        await started();
    }
}
/**
 * Resume the audio context
 */
export async function resume() {
    const context = createDefaultContext();
    if (context.state !== "running") {
        await started();
        await context.resume();
    }
}
/**
 * close the audio context
 */
export async function close() {
    const context = createDefaultContext();
    await context.close();
}
