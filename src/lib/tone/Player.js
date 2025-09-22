import { __decorate } from "tslib";
import { ToneAudioBuffer } from "./core/context/ToneAudioBuffer.js";
import { optionsFromArguments } from "./core/util/Defaults.js";
import { isBoolean } from "./core/util/Type.js";
import { onContextClose, onContextInit } from "./core/Global.js";
import { Source } from "./source/Source.js";
/**
 * Player is an audio file player with start, loop, and stop functions.
 *
 * @param url The url of the audio file.
 * @param onload The callback to execute when the audio file is loaded.
 * @example
 * const player = new Player("https://tonejs.github.io/audio/berklee/gong_1.mp3", () => {
 * 	player.start();
 * }).toDestination();
 * @example
 * // can also be constructed with an options object
 * const player = new Player({
 * 	url: "https://tonejs.github.io/audio/berklee/Ah_1.mp3",
 * 	loop: true,
 * 	onload: () => {
 * 		player.start();
 * 	},
 * }).toDestination();
 * @example
 * // or a ToneAudioBuffer
 * const buffer = new ToneAudioBuffer("https://tonejs.github.io/audio/berklee/gong_1.mp3", () => {
 * 	const player = new Player(buffer).toDestination();
 * 	player.start();
 * });
 * @category Source
 */
export class Player extends Source {
    constructor() {
        const options = optionsFromArguments(Player.getDefaults(), arguments, [
            "url",
            "onload",
        ]);
        super(options);
        this.name = "Player";
        /**
         * If the file should play as soon as it's loaded
         */
        this.autostart = options.autostart;
        /**
         * If the audio file should loop.
         */
        this._loop = options.loop;
        /**
         * The loop start time.
         */
        this._loopStart = options.loopStart;
        /**
         * The loop end time.
         */
        this._loopEnd = options.loopEnd;
        /**
         * The playback rate of the audio file.
         */
        this.playbackRate = options.playbackRate;
        /**
         * The fadeIn time of the amplitude envelope.
         */
        this.fadeIn = options.fadeIn;
        /**
         * The fadeOut time of the amplitude envelope.
         */
        this.fadeOut = options.fadeOut;
        /**
         * The buffer
         */
        this._buffer = new ToneAudioBuffer({
            url: options.url,
            onload: this._onload.bind(this, options.onload),
            reverse: options.reverse,
        });
        this._source = this.context.createBufferSource();
        this._source.loop = this._loop;
        this._source.loopStart = this._loopStart;
        this._source.loopEnd = this._loopEnd;
        this._source.playbackRate.value = this._playbackRate;
        this._source.onended = () => this._onended();
        this._playbackRateParam = this._source.playbackRate;
        // set the initial values
        this.playbackRate = options.playbackRate;
        // if it's a reversed buffer, should be reversed
        onContextInit((context) => {
            if (context.transport === this.context.transport) {
                if (options.reverse) {
                    this.reverse = options.reverse;
                }
            }
        });
        onContextClose((context) => {
            if (context.transport === this.context.transport) {
                if (this._source) {
                    this._source.onended = null;
                }
            }
        });
    }
    static getDefaults() {
        return Object.assign(Source.getDefaults(), {
            url: undefined,
            onload: () => {
                //
            },
            playbackRate: 1,
            loop: false,
            autostart: false,
            loopStart: 0,
            loopEnd: 0,
            reverse: false,
            fadeIn: 0,
            fadeOut: 0,
        });
    }
    /**
     * Load the audio file as an audio buffer.
     * Decodes the audio asynchronously and invokes
     * the callback once the audio buffer is loaded.
     * Note: this does not return the buffer, it invokes the callback
     * with the buffer as the first argument.
     * @param url The url of the buffer to load. filetype optional.
     * @param callback The callback to invoke when the buffer is loaded.
     */
    load(url, callback) {
        this._buffer.load(url, this._onload.bind(this, callback));
        return this;
    }
    /**
     * Internal callback when the buffer is loaded.
     */
    _onload(callback) {
        callback === null || callback === void 0 ? void 0 : callback(this);
        if (this.autostart) {
            this.start();
        }
    }
    /**
     * Internal callback when the buffer is done playing.
     */
    _onended() {
        this.context.transport.off("stop", this._stopSource);
        if (this.state === "started") {
            this.state = "stopped";
            this.onstop(this);
        }
    }
    /**
     * True if the player is looping, false otherwise.
     */
    get loop() {
        return this._loop;
    }
    set loop(loop) {
        this._loop = loop;
        if (this._source) {
            this._source.loop = loop;
        }
    }
    /**
     * The loop start time in seconds.
     */
    get loopStart() {
        return this._loopStart;
    }
    set loopStart(loopStart) {
        this._loopStart = loopStart;
        if (this._source) {
            this._source.loopStart = this.toSeconds(loopStart);
        }
    }
    /**
     * The loop end time in seconds.
     */
    get loopEnd() {
        return this._loopEnd;
    }
    set loopEnd(loopEnd) {
        this._loopEnd = loopEnd;
        if (this._source) {
            this._source.loopEnd = this.toSeconds(loopEnd);
        }
    }
    /**
     * The audio buffer belonging to the player.
     */
    get buffer() {
        return this._buffer;
    }
    set buffer(buffer) {
        this._buffer.set(buffer);
    }
    /**
     * If the buffer should be reversed.
     */
    get reverse() {
        return this._buffer.reverse;
    }
    set reverse(rev) {
        this._buffer.reverse = rev;
    }
    /**
     * Get the playback rate of the player.
     */
    get playbackRate() {
        return this._playbackRate;
    }
    /**
     * The playback rate can be set to any positive number. Less than 1
     * will slow down the playback, and greater than 1 will speed it up.
     */
    set playbackRate(rate) {
        this._playbackRate = rate;
        if (this._playbackRateParam) {
            this._playbackRateParam.value = rate;
        }
    }
    /**
     * The direction the buffer is played in
     */
    get direction() {
        if (this.reverse) {
            return -1;
        }
        else {
            return 1;
        }
    }
    /**
     * If the buffer is loaded.
     */
    get loaded() {
        return this._buffer.loaded;
    }
    /**
     * Play the buffer at the given time.
     *
     * @param time When the player should start.
     * @param offset The offset from the beginning of the sample to start at.
     * @param duration How long the sample should play. If no duration is given, it will play to the end.
     */
    start(time, offset, duration) {
        super.start(time, offset, duration);
        return this;
    }
    /**
     * Internal start method
     */
    _start(time, offset, duration) {
        if (this.loaded) {
            // if it's a loop the default offset is the loopstart point
            if (this._loop) {
                offset = this.defaultArg(offset, this._loopStart);
            }
            else {
                // otherwise the default offset is 0
                offset = this.defaultArg(offset, 0);
            }
            // the values in seconds
            const startTime = this.toSeconds(time);
            const offsetSeconds = this.toSeconds(offset);
            // make the source
            this._source = this.context.createBufferSource();
            this._source.onended = () => this._onended();
            this._source.loop = this._loop;
            this._source.loopStart = this.toSeconds(this._loopStart);
            this._source.loopEnd = this.toSeconds(this._loopEnd);
            // set the playbackRate
            this._playbackRateParam = this._source.playbackRate;
            this.playbackRate = this._playbackRate;
            this._source.connect(this.output);
            // set the buffer
            this._source.buffer = this._buffer.get();
            // start it
            this.context.transport.once("stop", this._stopSource);
            if (this._loop) {
                if (duration !== undefined) {
                    this.context.log("Player.start: duration cannot be used with loop=true");
                }
                this._source.start(startTime, offsetSeconds);
            }
            else {
                // play a specific duration
                const computedDur = this._getBufferDuration() - offsetSeconds;
                const dur = this.defaultArg(duration, computedDur);
                const durationSeconds = this.toSeconds(dur);
                this.applyADSR(this.fadeIn, this.fadeOut, durationSeconds);
                this._source.start(startTime, offsetSeconds, durationSeconds);
            }
        }
        else {
            throw new Error("tried to start Player before the buffer was loaded");
        }
    }
    /**
     * Get the duration of the buffer.
     */
    _getBufferDuration() {
        if (this.loaded) {
            return this.buffer.duration;
        }
        else {
            return 0;
        }
    }
    /**
     * Stop the player at the given time.
     * @param time When the player should stop.
     */
    stop(time) {
        super.stop(time);
        return this;
    }
    _stop(time) {
        if (this._source) {
            this._stopSource(time);
        }
    }
    /**
     * Stop the source at the given time
     * @param time
     */
    _stopSource(time) {
        var _a;
        (_a = this._source) === null || _a === void 0 ? void 0 : _a.stop(this.toSeconds(time));
        this._source = undefined;
    }
    /**
     * Seek to a specific time in the player's buffer. If the
     * source is playing, it will stop and restart at the new position.
     * @param offset The time to seek to.
     * @param time The time for the seek event to occur.
     */
    seek(offset, time) {
        const seconds = this.toSeconds(time);
        if (this.state === "started") {
            const now = this.context.transport.seconds;
            if (seconds > now) {
                // if the seek is in the future, schedule the stopping of the current source
                this.stop(seconds);
                // schedule the start of the new source
                this.start(seconds, offset);
            }
            else {
                this.stop(seconds);
                this.start(seconds, offset);
            }
        }
        else {
            this.start(seconds, offset);
        }
        return this;
    }
    /**
     * Internal restart method
     */
    _restart(time, offset) {
        if (this.state === "started") {
            this.stop(time);
            this.start(time, offset);
        }
    }
/**
     * Set the loop start and end. Will only loop if loop is
     * set to true.
     * @param loopStart The loop start time
     * @param loopEnd The loop end time
     */
    setLoopPoints(loopStart, loopEnd) {
        this.loopStart = loopStart;
        this.loopEnd = loopEnd;
        return this;
    }
    /**
     * If there is a source, schedule it to stop.
     */
    _stopSource(time) {
        if (this._source) {
            this._source.stop(this.toSeconds(time));
        }
    }
    /**
     * If there is a source, disconnect it from the output
     */
    _disconnect() {
        if (this._source) {
            this._source.disconnect();
        }
    }
    dispose() {
        super.dispose();
        // disconnect from the transport
        this.context.transport.off("stop", this._stopSource);
        if (this._source) {
            this._source.onended = null;
            this._source.disconnect();
            try {
                this._source.stop(0);
            }
            catch (e) {
                // Tone.js player has no way of knowing if it's already stopped
            }
            this._source = undefined;
        }
        this._buffer.dispose();
        if (this._playbackRateParam) {
            this._playbackRateParam = undefined;
        }
        return this;
    }
}
__decorate([
    isBoolean
], Player.prototype, "loop", null);
