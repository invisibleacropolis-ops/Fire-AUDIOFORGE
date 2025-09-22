import { ToneAudioNode } from "../../core/context/ToneAudioNode.js";
import { getContext } from "../../core/context/Context.js";
import { workletId } from "./Recorder.worklet.js";
import { getWorklet, getWorkletGlobal, setWorklet } from "../../core/worklet/WorkletGlobal.js";
import { optionsFromArguments } from "../../core/util/Defaults.js";
/**
 * Recorder is an audio recorder. It can be used to record sources and render the
 * results as an audio file. For long recordings, it is recommended to use {@link Offline}
 * to avoid clicks and glitches. For example, you can do time-stretching, complex scheduling,
 * and offline rendering and then load the resulting file into a {@link Player} to be played back.
 * @example
 * const recorder = new Recorder();
 * const synth = new FMSynth().connect(recorder);
 * // start recording
 * recorder.start();
 * // generate a few notes
 * synth.triggerAttackRelease("C3", "8n", 0);
 * synth.triggerAttackRelease("E3", "8n", "8n");
 * synth.triggerAttackRelease("G3", "8n", "4n");
 * // wait for the notes to end and stop the recording
 * setTimeout(async () => {
 * 	// the recorded audio is returned as a blob
 * 	const recording = await recorder.stop();
 * 	// download the recording by creating an anchor element and blob url
 * 	const url = URL.createObjectURL(recording);
 * 	const anchor = document.createElement("a");
 * 	anchor.download = "recording.webm";
 * 	anchor.href = url;
 * 	anchor.click();
 * }, 4000);
 * @category Component
 */
export class Recorder extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(Recorder.getDefaults(), arguments);
        super(options);
        this.name = "Recorder";
        this._data = [];
        this._state = "stopped";
        this.input = new MediaStreamAudioDestinationNode(this.context.rawContext);
        this._mediaRecorder = new MediaRecorder(this.input.stream, {
            mimeType: options.mimeType,
        });
        this._mediaRecorder.ondataavailable = (e) => {
            this._data.push(e.data);
        };
        this._mediaRecorder.onstart = () => {
            this._data = [];
        };
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            mimeType: "audio/webm",
        });
    }
    /**
     * The current state of the recorder.
     */
    get state() {
        return this._state;
    }
    /**
     * Start the recorder.
     */
    start() {
        this.assert(this.state === "stopped", "Recorder is already started");
        this._mediaRecorder.start();
        this._state = "started";
        return this;
    }
    /**
     * Stop the recording. Returns a promise which resolves
     * with the recorded audio.
     */
    stop() {
        this.assert(this.state === "started", "Recorder is not started");
        return new Promise((resolve) => {
            this._mediaRecorder.onstop = () => {
                const blob = new Blob(this._data, {
                    type: this._mediaRecorder.mimeType,
                });
                resolve(blob);
            };
            this._mediaRecorder.stop();
            this._state = "stopped";
        });
    }
    /**
     * Pause the recording
     */
    pause() {
        this.assert(this.state === "started", "Recorder is not started");
        this._mediaRecorder.pause();
        this._state = "paused";
        return this;
    }
    /**
     * Resume the recording
     */
    resume() {
        this.assert(this.state === "paused", "Recorder is not paused");
        this._mediaRecorder.resume();
        this._state = "started";
        return this;
    }
    dispose() {
        super.dispose();
        this.input.disconnect();
        return this;
    }
    /**
     * The mime type is the format that the audio is encoded in.
     * For example `"audio/webm"` or `"audio/ogg"`. The list of supported
     * types can be found on [MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported).
     */
    get mimeType() {
        return this._mediaRecorder.mimeType;
    }
}
async function loadWorklet(context) {
    const url = getWorklet(workletId);
    if (url) {
        try {
            return await context.audioWorklet.addModule(url);
        }
        catch (e) {
            //
        }
    }
    const blob = new Blob([workletId], { type: "text/javascript" });
    const blobUrl = URL.createObjectURL(blob);
    setWorklet(workletId, blobUrl);
    return await context.audioWorklet.addModule(blobUrl);
}
// Store the worklet at the global level so if the worklet has already been loaded,
// it is not loaded again.
if (getWorkletGlobal(workletId) === undefined) {
    setWorkletGlobal(workletId, loadWorklet(getContext()));
}
export async function loaded() {
    return getWorkletGlobal(workletId);
}
