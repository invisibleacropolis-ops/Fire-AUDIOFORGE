import { Gain } from "../../core/context/Gain.js";
import { Param } from "../../core/context/Param.js";
import { ToneAudioNode } from "../../core/context/ToneAudioNode.js";
import { optionsFromArguments } from "../../core/util/Defaults.js";
import { readOnly } from "../../core/util/Interface.js";
import { PanVol } from "./PanVol.js";
/**
 * Channel provides a channel strip interface with volume, pan, solo and mute controls.
 * @see {@link PanVol} and {@link Solo}.
 * @example
 * // pan the incoming signal left and drop the volume
 * const channel = new Channel(-0.25, -12).toDestination();
 * const osc = new Oscillator().connect(channel).start();
 * @category Component
 */
export class Channel extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(Channel.getDefaults(), arguments, [
            "volume",
            "pan",
        ]);
        super(options);
        this.name = "Channel";
        this._panVol = new PanVol({
            context: this.context,
            pan: options.pan,
            volume: options.volume,
            mute: options.mute,
            solo: options.solo,
        });
        this.input = this._panVol;
        this.output = this._panVol;
        this.pan = this._panVol.pan;
        this.volume = this._panVol.volume;
        readOnly(this, ["pan", "volume"]);
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            pan: 0,
            volume: 0,
            mute: false,
            solo: false,
        });
    }
    /**
     * Get the volume of the channel in decibels.
     */
    getVolume() {
        return this.volume.value;
    }
    /**
     * Mute the channel.
     */
    muteChannel() {
        this._panVol.mute = true;
    }
    /**
     * Unmute the channel.
     */
    unmuteChannel() {
        this._panVol.mute = false;
    }
    /**
     * Solo the channel.
     */
    soloChannel() {
        this._panVol.solo = true;
    }
    /**
     * Unsolo the channel.
     */
    unsoloChannel() {
        this._panVol.solo = false;
    }
    /**
     * Get the solo state of the channel.
     */
    get solo() {
        return this._panVol.solo;
    }
    /**
     * Get the mute state of the channel.
     */
    get mute() {
        return this._panVol.mute;
    }
    /**
     * Set the pan and volume values.
     * @param pan The pan value.
     * @param volume The volume in decibels
     */
    set(pan, volume) {
        this.pan.value = pan;
        this.volume.value = volume;
        return this;
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this._panVol.dispose();
        this.pan.dispose();
        this.volume.dispose();
        return this;
    }
}
