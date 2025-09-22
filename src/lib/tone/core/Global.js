import { version } from "../version.js";
import { Context } from "./context/Context.js";
import { getContext, setContext } from "./context/Context.js";
import { Destination } from "./Destination.js";
import { Draw } from "./util/Draw.js";
import { Transport } from "./clock/Transport.js";
import { Emitter } from "./util/Emitter.js";
import { Ticker } from "./clock/Ticker.js";
export { version };
/**
 * The {@link Transport} is the master timekeeper for all scheduled events.
 */
export const Transport = new Transport();
//-------------------------------------
// CONTEXT
//-------------------------------------
/**
 * The {@link Destination} is the master output for all signals.
 */
export const Destination = new Destination();
/**
 * The {@link Draw} is used to sync the effects to the rendering frame.
 */
export const Draw = new Draw();
/**
 * The {@link Ticker} is used to create a loop at audio-rate to update all of the signals.
 */
const Ticker = new Ticker();
export const context = getContext();
/**
 * An {@link Emitter} which emits events when the context is initialized and closed.
 */
export const Emitter = new Emitter();
/**
 * The current audio context.
 * @see {@link getContext}
 */
export let context = getContext();
Emitter.on("init", (ctx) => (context = ctx));
Emitter.on("close", () => (context = getContext()));
//-------------------------------------
// EVENTS
//-------------------------------------
/**
 * Set the audio context.
 * @see {@link setContext}
 */
export function setContext(ctx) {
    setContext(ctx);
}
/**
 * The current audio context time.
 * @see {@link Context.now}
 */
export function now() {
    return context.now();
}
/**
 * The current audio context's reference time.
 * @see {@link Context.currentTime}
 */
export function get currentTime() {
    return context.currentTime;
}
/**
 * The duration in seconds of one sample.
 * @see {@link Context.sampleTime}
 */
export function get sampleTime() {
    return context.sampleTime;
}
/**
 * The number of samples per second.
 * @see {@link Context.sampleRate}
 */
export function get sampleRate() {
    return context.sampleRate;
}
/**
 * The audio context's reference time.
 * @see {@link Context.currentTime}
 */
export const currentTime = () => context.currentTime;
/**
 * The duration in seconds of one sample.
 * @see {@link Context.sampleTime}
 */
export const sampleTime = () => context.sampleTime;
/**
 * The number of samples per second.
 * @see {@link Context.sampleRate}
 */
export const sampleRate = () => context.sampleRate;
/**
 * A reference to the listener object.
 * @see {@link Context.listener}
 */
export const listener = () => context.listener;
/**
 * Start the audio context.
 * @see {@link Context.resume}
 */
export async function start() {
    return await context.resume();
}
//-------------------------------------
// CLOCK
//-------------------------------------
/**
 * The number of samples per second.
 */
export function get sampleRate() {
    return context.sampleRate;
}
/**
 * A reference to the listener object.
 */
export function get listener() {
    return context.listener;
}
/**
 * Start the audio context.
 */
export async function start() {
    return await context.resume();
}
/**
 * The transport's time in seconds.
 * @see {@link Transport.seconds}
 */
export function get transportTime() {
    return Transport.seconds;
}
/**
 * The transport's time in seconds.
 * @see {@link Transport.seconds}
 */
export const transportTime = () => Transport.seconds;
onContextInit((context) => {
    // if the context is not the default context, there is no transport
    if (context.transport) {
        context.transport = Transport;
    }
});
onContextInit((context) => {
    // set the draw
    if (context.draw) {
        context.draw = Draw;
    }
});
onContextInit((context) => {
    // set the draw
    if (context.ticker) {
        context.ticker = Ticker;
    }
});
onContextInit((context) => {
    if (!context.destination) {
        context.destination = Destination;
    }
});
onContextClose((context) => {
    if (context.transport) {
        context.transport.dispose();
    }
});
onContextClose((context) => {
    if (context.draw) {
        context.draw.dispose();
    }
});
onContextClose((context) => {
    if (context.ticker) {
        context.ticker.dispose();
    }
});
onContextClose((context) => {
    if (context.destination) {
        context.destination.dispose();
    }
});
