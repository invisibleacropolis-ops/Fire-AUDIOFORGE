import { optionsFromArguments } from "../core/util/Defaults.js";
import { readOnly } from "../core/util/Interface.js";
import { Signal } from "../signal/Signal.js";
import { Source } from "./Source.js";
import { Gain } from "../core/context/Gain.js";
import { Param } from "../core/context/Param.js";
/**
 * Wrapper around the native ConstantSourceNode.
 * @category Source
 */
export class ToneConstantSource extends Source {
    constructor() {
        const options = optionsFromArguments(ToneConstantSource.getDefaults(), arguments, ["offset"]);
        super(options);
        this.name = "ToneConstantSource";
        /**
         * The offset of the constant source.
         */
        this.offset = new Param({
            context: this.context,
            param: this.context.createConstantSource().offset,
            units: options.units,
            value: options.offset,
        });
        readOnly(this, "offset");
        const source = this.context.createConstantSource();
        this.output = new Gain({ context: this.context });
        this.offset.connect(this.output);
    }
    static getDefaults() {
        return Object.assign(Source.getDefaults(), {
            offset: 1,
            units: "number",
        });
    }
    /**
     * start the source
     * @param  time
     */
    _start(time) {
        const computedTime = this.toSeconds(time);
        this._source.start(computedTime);
    }
    /**
     * stop the source
     * @param  time
     */
    _stop(time) {
        if (this._source) {
            const computedTime = this.toSeconds(time);
            this._source.stop(computedTime);
        }
    }
    dispose() {
        if (this.state === "started") {
            this.stop(this.now());
        }
        super.dispose();
        this.offset.dispose();
        return this;
    }
}
