import { __decorate } from "tslib";
import { optionsFromArguments } from "./util/Defaults.js";
import { readOnly } from "./util/Interface.js";
import { isBoolean, isNumber } from "./util/Type.js";
import { Gain } from "./context/Gain.js";
import { ToneAudioNode } from "./context/ToneAudioNode.js";
import { onContextEvent, onContextInit, onContextClose, } from "./context/Context.js";
/**
 * A single master output which is connected to the
 * AudioDestinationNode (aka your speakers).
 * It provides useful conveniences such as a volume
 * control and mute toggle. It also ensures that anything
 * connected to it will be silenced when the transport is stopped.
 *
 * @example
 * // a player connected to the master output
 * const player = new Player("https://tonejs.github.io/audio/berklee/gong_1.mp3").toDestination();
 * // play it on a loop
 * player.loop = true;
 * player.autostart = true;
 * @category Core
 */
export class Destination extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(Destination.getDefaults(), arguments);
        super(options);
        this.name = "Destination";
        this.input = new Gain({ context: this.context });
        this.output = new Gain({ context: this.context });
        /**
         * The volume of the master output in decibels.
         */
        this.volume = this.output.gain;
        this._internalChannels = [this.input, this.output];
        // connections
        this.input.connect(this.output);
        this.output.connect(this.context.rawContext.destination);
        // set the initial volume and mute
        this.volume.value = options.volume;
        this.mute = options.mute;
        // instead of things connecting to the destination, connect them to the input
        this.input = this;
        // if the transport is started, connect the output to the destination
        const connectToMaster = () => {
            if (this.context.transport.state !== "started") {
                // disconnect it when the transport is stopped
                this._disconnectFromMaster();
            }
        };
        onContextInit((context) => {
            if (context.transport === this.context.transport) {
                // if it's already started, connect it
                if (this.context.transport.state === "started") {
                    this._connectToMaster();
                }
                this.context.transport.on("start", this._connectToMaster);
                this.context.transport.on("stop", this._disconnectFromMaster);
                this.context.transport.on("pause", this._disconnectFromMaster);
            }
        });
        onContextClose((context) => {
            if (context.transport === this.context.transport) {
                this.context.transport.off("start", this._connectToMaster);
                this.context.transport.off("stop", this._disconnectFromMaster);
                this.context.transport.off("pause", this._disconnectFromMaster);
            }
        });
        readOnly(this, ["volume"]);
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            volume: 0,
            mute: false,
        });
    }
    /**
     * Add a master volume fader.
     */
    _connectToMaster() {
        this.output.connect(this.context.rawContext.destination);
    }
    /**
     * Disconnect the master volume fader.
     */
    _disconnectFromMaster() {
        this.output.disconnect(this.context.rawContext.destination);
    }
    /**
     * Mute the output.
     * @example
     * const osc = new Oscillator().toDestination();
     * // mute the output
     * Tone.Destination.mute = true;
     * osc.start();
     */
    get mute() {
        return this.output.gain.value === 0;
    }
    set mute(mute) {
        if (!this.mute && mute) {
            this._mutedVolume = this.volume.value;
            // maybe it should ramp here?
            this.volume.value = -Infinity;
        }
        else if (this.mute && !mute) {
            this.volume.value = this._mutedVolume;
        }
    }
    /**
     * The version of the library.
     */
    get version() {
        return this.version;
    }
    /**
     * Clean up
     */
    dispose() {
        super.dispose();
        this.volume.dispose();
        this.output.dispose();
        this._internalChannels.forEach((node) => node.dispose());
        return this;
    }
}
__decorate([
    isNumber
], Destination.prototype, "volume", void 0);
__decorate([
    isBoolean
], Destination.prototype, "mute", null);
onContextInit((context) => {
    // if the context is not the default context, there is no destination
    if (context.rawContext.destination) {
        context.destination = new Destination({ context });
    }
});
onContextClose((context) => {
    if (context.destination) {
        context.destination.dispose();
    }
});
