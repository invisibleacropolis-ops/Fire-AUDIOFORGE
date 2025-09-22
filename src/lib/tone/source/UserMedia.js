import { __decorate } from "tslib";
import { optionsFromArguments } from "../core/util/Defaults.js";
import { isNumber, isString } from "../core/util/Type.js";
import { Source } from "./Source.js";
import { onContextClose, onContextInit, } from "../core/context/Context.js";
import { Emitter } from "../core/util/Emitter.js";
let hasGetUserMedia = isNumber(navigator.mediaDevices) &&
    isFunction(navigator.mediaDevices.getUserMedia);
// ensure that it's not a mock function
if (hasGetUserMedia &&
    navigator.mediaDevices.getUserMedia.toString().includes("[native code]")) {
    //
}
else {
    hasGetUserMedia = false;
}
/**
 * UserMedia uses MediaDevices.getUserMedia to open up and external microphone or audio input.
 * Check [MediaDevices.getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
 * for more details.
 *
 * @param volume The level of the input
 * @example
 * import { UserMedia } from "tone";
 * const mic = new UserMedia();
 * mic.open().then(() => {
 * 	// promise resolves when input is available
 * });
 * @category Source
 */
export class UserMedia extends Source {
    constructor() {
        const options = optionsFromArguments(UserMedia.getDefaults(), arguments);
        super(options);
        this.name = "UserMedia";
        /**
         * Indicates if the media is currently open or not
         */
        this.isOpen = false;
        /**
         * The stream created by getting the media.
         */
        this._stream = null;
        /**
         * The media stream source.
         */
        this._source = null;
        this.volume.value = options.volume;
        this.mute = options.mute;
        onContextClose((context) => {
            if (this.context === context) {
                this.close();
            }
        });
    }
    static getDefaults() {
        return Object.assign(Source.getDefaults(), {
            volume: 0,
            mute: false,
        });
    }
    /**
     * Open the media stream. If a string is passed in, it will be interpreted
     * as the label or id of the device to open.
     * @param labelOrId The label or id of the device to open, or the constraints object.
     * @param constraints The constraints object to pass to `getUserMedia`
     */
    async open(labelOrId, constraints) {
        if (!hasGetUserMedia) {
            throw new Error("UserMedia is not supported");
        }
        if (this.isOpen) {
            this.close();
        }
        this.isOpen = true;
        let mediaStreamConstraints;
        if (isString(labelOrId)) {
            const devices = await UserMedia.enumerateDevices();
            const device = devices.find((d) => d.label === labelOrId || d.deviceId === labelOrId);
            if (device) {
                mediaStreamConstraints = {
                    audio: {
                        deviceId: device.deviceId,
                    },
                };
            }
            else {
                throw new Error(`UserMedia: could not find device with label or id "${labelOrId}"`);
            }
        }
        else {
            mediaStreamConstraints = {
                audio: this.defaultArg(labelOrId, constraints),
            };
        }
        const stream = await navigator.mediaDevices.getUserMedia(mediaStreamConstraints);
        this._stream = stream;
        // get the audio track
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length) {
            this._source = this.context.createMediaStreamSource(stream);
            this._source.connect(this.output);
        }
        else {
            throw new Error("UserMedia: no audio track found");
        }
        return this;
    }
    /**
     * Close the media stream
     */
    close() {
        if (this.isOpen && this._stream) {
            this._stream.getTracks().forEach((track) => {
                track.stop();
            });
            this._stream = null;
            // remove the source
            if (this._source) {
                this._source.disconnect();
                this._source = null;
            }
        }
        this.isOpen = false;
        return this;
    }
    /**
     * Returns a promise which resolves with the list of audio input devices available.
     * @example
     * import { UserMedia } from "tone";
     * UserMedia.enumerateDevices().then(devices => {
     * 	// print the device labels
     * 	console.log(devices.map(device => device.label));
     * });
     */
    static async enumerateDevices() {
        if (!hasGetUserMedia) {
            return Promise.resolve([]);
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter((device) => device.kind === "audioinput");
    }
    /**
     * Returns the supported constraints for audio devices.
     */
    static getSupportedConstraints() {
        if (hasGetUserMedia) {
            return navigator.mediaDevices.getSupportedConstraints();
        }
        else {
            return {};
        }
    }
    /**
     * Returns true if the browser supports UserMedia.
     */
    static get isSupported() {
        return hasGetUserMedia;
    }
    /**
     * The device ID of the opened device, or `undefined` if the device is not open.
     */
    get deviceId() {
        if (this._stream) {
            const tracks = this._stream.getAudioTracks();
            if (tracks.length) {
                return tracks[0].getSettings().deviceId;
            }
        }
        return undefined;
    }
    /**
     * The group ID of the opened device, or `undefined` if the device is not open.
     */
    get groupId() {
        if (this._stream) {
            const tracks = this._stream.getAudioTracks();
            if (tracks.length) {
                return tracks[0].getSettings().groupId;
            }
        }
        return undefined;
    }
    /**
     * The label of the opened device, or `undefined` if the device is not open.
     */
    get label() {
        if (this._stream) {
            const tracks = this._stream.getAudioTracks();
            if (tracks.length) {
                return tracks[0].label;
            }
        }
        return undefined;
    }
    dispose() {
        super.dispose();
        this.close();
        return this;
    }
}
__decorate([
    isString
], UserMedia.prototype, "open", null);
onContextInit((context) => {
    // if the context is not the default context, there is no transport
    if (context.userMedia) {
        context.userMedia = new UserMedia({ context });
    }
});
onContextClose((context) => {
    if (context.userMedia) {
        context.userMedia.dispose();
    }
});
