
import { Context } from "./context/Context.js";
/**
 * The default context
 */
let defaultContext;
/**
 * Set the default audio context.
 * @param context The new audio context to set as the default.
 */
export function setContext(context) {
    defaultContext = context;
}
/**
 * Get the default audio context.
 */
export function getContext() {
    if (!defaultContext) {
        defaultContext = new Context();
    }
    return defaultContext;
}
