/**
 * The current version of the library.
 */
export { version as version } from "../version.js";
/**
 * Set the logging level.
 * @example
 * import { setLogger } from "tone";
 * setLogger({
 * 	level: "error",
 * 	name: "Tone"
 * });
 */
export function setLogger(props) {
    //
}
/**
 * Get the elapsed time of the ***main*** audio context.
 * @return The time in seconds.
 * @example
 * import { now } from "tone";
 * const gain = new Gain();
 * // schedule a ramp 2 seconds in the future
 * gain.gain.linearRampToValueAtTime(0, now() + 2);
 */
export function now() {
    return getContext().now();
}
/**
 * The Transport is the master timekeeper for all scheduled events.
 * @example
 * import { Transport } from "tone";
 * // set the bpm
 * Transport.bpm.value = 120;
 * // start the transport
 * Transport.start();
 */
export const Transport = getContext().transport;
/**
 * The {@link Destination} is the master output for all signals.
 */
export const Destination = getContext().destination;
/**
 * Draw is used to synchronize audio events with visual events.
 * @example
 * import { Draw, Transport } from "tone";
 * Transport.schedule(time => {
 * 	// use the time argument to schedule a visual event
 * 	Draw.schedule(() => {
 * 		// do drawing in here
 * 	}, time);
 * }, "4n");
 */
export const Draw = getContext().draw;
/**
 * A reference to the audio context.
 * @see {@link getContext}
 * @example
 * import { context } from "tone";
 * // if you assume the context is started
 * console.log(context.currentTime);
 */
export let context = getContext();
onContextInit((ctx) => (context = ctx));
/**
 * The current audio context time plus a short {@link lookAhead}.
 * @see {@link Context.now}
 */
export function now() {
    return context.now();
}
/**
 * The current audio context time.
 * @see {@link Context.currentTime}
 */
export function get currentTime() {
    return context.currentTime;
}
/**
 * A reference to the audio context's listener which can be used to set the position of the listener in 3D space.
 */
export function get listener() {
    return context.listener;
}
/**
 * The Transport is the master timekeeper for all scheduled events.
 */
export const Transport = context.transport;
/**
 * The {@link Destination} is the master output for all signals.
 */
export const Destination = context.destination;
/**
 * Draw is used to synchronize audio events with visual events.
 */
export const Draw = context.draw;
/**
 * A reference to the audio context.
 * @see {@link getContext}
 */
export let context = context;
/**
 * Get the context from the currently active {@link Context}.
 * @category Core
 */
export function getContext() {
    return getContext();
}
/**
 * Set the audio context.
 * @category Core
 */
export function setContext(context) {
    setContext(context);
}
/**
 * The current audio context time plus a short {@link lookAhead}.
 * @category Core
 */
export function now() {
    return getContext().now();
}
/**
 * The current audio context time without the lookAhead.
 * @see {@link now}
 * @category Core
 */
export function get currentTime() {
    return getContext().currentTime;
}
/**
 * The audio context's listener.
 * @category Core
 */
export function get listener() {
    return getContext().listener;
}
/**
 * The Transport is the master timekeeper for all scheduled events.
 * @category Core
 */
export const Transport = getContext().transport;
/**
 * The {@link Destination} is the master output for all signals.
 * @category Core
 */
export const Destination = getContext().destination;
/**
 * Draw is used to synchronize audio events with visual events.
 * @category Core
 */
export const Draw = getContext().draw;
/**
 * Start the audio context. Note that this requires a user gesture to start.
 * @example
 * document.querySelector("button").addEventListener("click", async () => {
 * 	await Tone.start();
 * 	console.log("audio ready");
 * });
 * @category Core
 */
export async function start() {
    return await getContext().resume();
}
import { getContext, onContextInit, setContext, } from "./context/Context.js";
/**
 * Returns true if the audio context is started
 */
export function isStarted() {
    return getContext().state === "running";
}
/**
 * Returns a promise which resolves when the context is started
 */
export function start() {
    return getContext().resume();
}
/**
 * Get the context's current time.
 * @example
 * setInterval(() => console.log(Tone.now()), 100);
 */
export function now() {
t
}
/**
 * The Transport class gets transported to the global namespace
 */
export const Transport = getContext().transport;
/**
 * The Destination class gets transported to the global namespace
 */
export const Destination = getContext().destination;
/**
 * The Transport class gets transported to the global namespace
 */
export const Draw = getContext().draw;
/**
 * A reference to the global context
 */
export let context = getContext();
onContextInit((newContext) => {
    context = newContext;
});
/**
 * Get the context from the currently active {@link Context}.
 */
export function getContext() {
    return getContext();
}
/**
 * Set the audio context.
 */
export function setContext(context) {
    setContext(context);
}
/**
 * The current time in seconds of the AudioContext.
 * @see {@link Context.currentTime}
 */
export const currentTime = () => getContext().currentTime;
/**
 * The duration in seconds of one sample.
 * @see {@link Context.sampleTime}
 */
export const sampleTime = () => getContext().sampleTime;
/**
 * The number of samples per second.
 * @see {@link Context.sampleRate}
 */
export const sampleRate = () => getContext().sampleRate;
/**
 * The audio context's listener.
 * @see {@link Context.listener}
 */
export const listener = () => getContext().listener;
/**
 * The current time in seconds of the AudioContext.
 */
export function get currentTime() {
    return getContext().currentTime;
}
/**
 * The duration in seconds of one sample.
 */
export function get sampleTime() {
    return getContext().sampleTime;
}
/**
 * The number of samples per second.
 */
export function get sampleRate() {
    return getContext().sampleRate;
}
/**
 * The audio context's listener.
 */
export function get listener() {
    return getContext().listener;
}
/**
 * Get the current {@link Transport}
 * @category Core
 */
export const Transport = getContext().transport;
/**
 * Get the current {@link Destination}
 * @category Core
 */
export const Destination = getContext().destination;
/**
 * Get the current {@link Draw}
 * @category Core
 */
export const Draw = getContext().draw;
/**
 * The context, which is either the AudioContext or the OfflineAudioContext
 */
export let context = getContext();
onContextInit((newContext) => {
    context = newContext;
});
