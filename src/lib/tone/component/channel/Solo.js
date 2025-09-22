import { Gain } from "../../core/context/Gain.js";
import { onContextEvent } from "../../core/context/Context.js";
import { Emitter } from "../../core/util/Emitter.js";
import { optionsFromArguments } from "../../core/util/Defaults.js";
import { readOnly } from "../../core/util/Interface.js";
import { ToneAudioNode } from "../../core/context/ToneAudioNode.js";
let soloCount = 0;
const soloEmitter = new Emitter();
onContextEvent("init", (context) => {
    // if a new context is created, clear the solo count
    soloCount = 0;
});
/**
 * Solo lets you isolate a specific audio stream. When an instance is set to `solo=true`,
 * it will mute all other instances of Solo. When another instance is set to `solo=true`,
 * it will automatically unsolo the previously soloed instance.
 * @example
 * const soloA = new Solo().toDestination();
 * const oscA = new Oscillator("C4").connect(soloA).start();
 * // no output will be produced.
 *
 * const soloB = new Solo().toDestination();
 * const oscB = new Oscillator("E4").connect(soloB).start();
 * soloB.solo = true;
 * // only `oscB` will be audible
 *
 * const soloC = new Solo(true).toDestination();
 * const oscC = new Oscillator("G4").connect(soloC).start();
 * // only `oscC` will be audible
 * @category Component
 */
export class Solo extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(Solo.getDefaults(), arguments, ["solo"]);
        super(options);
        this.name = "Solo";
        this.input = this.output = new Gain({
            context: this.context,
        });
        /**
         * If the channel is muted or not
         */
        this._muted = false;
        /**
         * The solo state
         */
        this._soloed = false;
        this.solo = options.solo;
        // set initially
        this._updateMute();
        // listen for changes in other solo channels
        soloEmitter.on("solo", this._soloedHandler);
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            solo: false,
        });
    }
    /**
     * If the channel is currently soloed or not.
     */
    get solo() {
        return this._soloed;
    }
    set solo(solo) {
        if (this._soloed !== solo) {
            this._soloed = solo;
            if (solo) {
                soloCount++;
                soloEmitter.emit("solo", this);
            }
            else {
                soloCount--;
                soloCount = Math.max(soloCount, 0);
                // if there are no more soloed channels, unsolo everyone
                if (soloCount === 0) {
                    soloEmitter.emit("unsolo");
                }
            }
            this._updateMute();
        }
    }
    /**
     * If the channel is muted.
     */
    get muted() {
        return this._muted || (!this._soloed && soloCount > 0);
    }
    set muted(mute) {
        if (this._muted !== mute) {
            this._muted = mute;
            this._updateMute();
        }
    }
    /**
     * if the current instance is muted
     */
    get isMuted() {
        return this.input.gain.value === 0;
    }
    /**
     * Update the muted state
     */
    _updateMute() {
        if (this.muted) {
            this.input.gain.value = 0;
        }
        else {
            this.input.gain.value = 1;
        }
    }
    /**
     * Handler for the solo event
     */
    _soloedHandler(instance) {
        if (instance !== this) {
            // if another instance is soloed, this one is not
            if (this._soloed) {
                this.solo = false;
            }
        }
    }
    dispose() {
        super.dispose();
        soloEmitter.off("solo", this._soloedHandler);
        this.input.dispose();
        return this;
    }
}
