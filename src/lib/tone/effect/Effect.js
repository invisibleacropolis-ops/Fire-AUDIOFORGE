import { ToneAudioNode } from "../core/context/ToneAudioNode.js";
import { Gain } from "../core/context/Gain.js";
import { CrossFade } from "../component/channel/CrossFade.js";
import { optionsFromArguments } from "../core/util/Defaults.js";
import { readOnly } from "../core/util/Interface.js";
/**
 * Effect is the base class for effects. Connect the effect between
 * the effectSend and effectReturn GainNodes, then control the amount of
 * effect which is applied to the incoming signal using the wet control.
 */
export class Effect extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(Effect.getDefaults(), arguments, [
            "wet",
        ]);
        super(options);
        this.name = "Effect";
        this.input = new Gain({ context: this.context });
        this._dryWet = new CrossFade({
            context: this.context,
            fade: options.wet,
        });
        this.wet = this._dryWet.fade;
        this.effectSend = new Gain({ context: this.context });
        this.effectReturn = new Gain({ context: this.context });
        // connections
        this.input.fan(this._dryWet.a, this.effectSend);
        this.effectReturn.connect(this._dryWet.b);
        this._dryWet.connect(this.output);
        readOnly(this, "wet");
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            wet: 1,
        });
    }
    /**
     * connect the effect to the destination node.
     * @param destination
     * @param outputNum
     * @param inputNum
     */
    connect(destination, outputNum = 0, inputNum = 0) {
        if (this.input === destination) {
            // if connecting to itself, connect the effectsend to the destination
            // and the destination to the effectReturn
            this.effectSend.connect(destination, outputNum, inputNum);
            destination.connect(this.effectReturn, outputNum, inputNum);
        }
        else {
            super.connect(destination, outputNum, inputNum);
        }
        return this;
    }
    dispose() {
        super.dispose();
        this._dryWet.dispose();
        this.wet.dispose();
        this.effectSend.dispose();
        this.effectReturn.dispose();
        return this;
    }
}
