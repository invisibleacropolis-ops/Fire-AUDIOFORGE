
/**
 * Test if the given value is an OfflineAudioContext
 */
export function isOfflineAudioContext(context) {
    return context.constructor.name === "OfflineAudioContext";
}
/**
 * Test if the given value is an AudioContext
 */
export function isAudioContext(context) {
    return context.constructor.name === "AudioContext";
}
