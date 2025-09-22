import { ToneWithContext } from "../ToneWithContext.js";
import { optionsFromArguments } from "../util/Defaults.js";
import { Param } from "./Param.js";
import { onContextInit, onContextClose } from "./Context.js";
import { readOnly } from "../util/Interface.js";
import { isAudioParam } from "../util/Type.js";
import { __decorate } from "tslib";
/**
 * The Listener is a single node in the audio graph which represents the point where the sound is heard.
 * The listener is necessary for 3D audio, and is created by default automatically on the {@link Context}.
 * In a 3D scene, The listener's position and orientation is controlled by {@link positionX}, {@link positionY},
 * {@link positionZ}, {@link forwardX}, {@link forwardY}, {@link forwardZ}, {@link upX}, {@link upY}, and {@link upZ}.
 *
 * @category Core
 */
export class Listener extends ToneWithContext {
    constructor() {
        const options = optionsFromArguments(Listener.getDefaults(), arguments);
        super(options);
        this.name = "Listener";
        this.positionX = new Param({
            context: this.context,
            param: this.context.rawContext.listener.positionX,
            units: "number",
        });
        this.positionY = new Param({
            context: this.context,
            param: this.context.rawContext.listener.positionY,
            units: "number",
        });
        this.positionZ = new Param({
            context: this.context,
            param: this.context.rawContext.listener.positionZ,
            units: "number",
        });
        this.forwardX = new Param({
            context: this.context,
            param: this.context.rawContext.listener.forwardX,
            units: "number",
        });
        this.forwardY = new Param({
            context: this.context,
            param: this.context.rawContext.listener.forwardY,
            units: "number",
        });
        this.forwardZ = new Param({
            context: this.context,
            param: this.context.rawContext.listener.forwardZ,
            units: "number",
        });
        this.upX = new Param({
            context: this.context,
            param: this.context.rawContext.listener.upX,
            units: "number",
        });
        this.upY = new Param({
            context: this.context,
            param: this.context.rawContext.listener.upY,
            units: "number",
        });
        this.upZ = new Param({
            context: this.context,
            param: this.context.rawContext.listener.upZ,
            units: "number",
        });
        readOnly(this, [
            "positionX",
            "positionY",
            "positionZ",
            "forwardX",
            "forwardY",
            "forwardZ",
            "upX",
            "upY",
            "upZ",
        ]);
    }
    static getDefaults() {
        return ToneWithContext.getDefaults();
    }
    /**
     * The version of the library.
     */
    get version() {
        return this.version;
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this.positionX.dispose();
        this.positionY.dispose();
        this.positionZ.dispose();
        this.forwardX.dispose();
        this.forwardY.dispose();
        this.forwardZ.dispose();
        this.upX.dispose();
        this.upY.dispose();
        this.upZ.dispose();
        return this;
    }
}
__decorate([
    isAudioParam
], Listener.prototype, "positionX", void 0);
__decorate([
    isAudioParam
], Listener.prototype, "positionY", void 0);
__decorate([
    isAudioParam
], Listener.prototype, "positionZ", void 0);
__decorate([
    isAudioParam
], Listener.prototype, "forwardX", void 0);
__decorate([
    isAudioParam
], Listener.prototype, "forwardY", void 0);
__decorate([
    isAudioParam
], Listener.prototype, "forwardZ", void 0);
__decorate([
    isAudioParam
], Listener.prototype, "upX", void 0);
__decorate([
    isAudioParam
], Listener.prototype, "upY", void 0);
__decorate([
    isAudioParam
], Listener.prototype, "upZ", void 0);
//-------------------------------------
// INITIALIZATION
//-------------------------------------
onContextInit((context) => {
    // if it's not the default context, there's no listener
    if (context.rawContext.listener) {
        context.listener = new Listener({ context });
    }
});
onContextClose((context) => {
    if (context.listener) {
        context.listener.dispose();
    }
});
