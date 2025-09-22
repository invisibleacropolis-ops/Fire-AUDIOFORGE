
/**
 * This is a simplified partial mirror of the native AudioContext options.
 * Some of the options are not available in all browsers.
 */
/**
 * This is a partial mirror of the native OfflineAudioContext options
 */
/**
 * Create a new AudioContext
 */
export function createAudioContext(options) {
    // @ts-ignore
    return new (window.AudioContext || window.webkitAudioContext)(options);
}
/**
 * Create a new OfflineAudioContext
 */
export function createOfflineAudioContext(channels, length, sampleRate) {
    // @ts-ignore
    return new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(channels, length, sampleRate);
}
