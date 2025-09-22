
import { Param } from "../core/context/Param.js";
import { optionsFromArguments } from "../core/util/Defaults.js";
import { readOnly } from "../core/util/Interface.js";
import { Source } from "./Source.js";
/**
 * Wrapper around the native fire-and-forget ConstantSource.
 * Can be scheduled to start/stop and change values.
 *
 * @example
 * // schedule a constant value of 1 to start at 1 second
 * const constantSource = new ToneConstantSource(1).toDestination();
 * constantSource.start(1);
 * @category Source
 */
export class ToneConstantSource extends Source {
    constructor() {
        const options = optionsFromArguments(ToneConstantSource.getDefaults(), arguments, ["offset"]);
        super(options);
        this.name = "ToneConstantSource";
        this.offset = new Param({
            context: this.context,
            param: this._source.offset,
            units: options.units,
            value: options.offset,
        });
        readOnly(this, ["offset"]);
    }
    static getDefaults() {
        return Object.assign(Source.getDefaults(), {
            offset: 1,
            units: "number",
        });
    }
    /**
     * Start the source at the given time
     * @param time
     */
    _start(time) {
        const computedTime = this.toSeconds(time);
        this._source = this.context.createConstantSource();
        this._source.connect(this.output);
        this._source.start(computedTime);
    }
    /**
     * Stop the source at the given time.
     * @param time
     */
    _stop(time) {
        const computedTime = this.toSeconds(time);
        this._source.stop(computedTime);
    }
    dispose() {
        super.dispose();
        if (this.state === "started") {
            this.stop(this.now());
        }
        this._source.disconnect();
        this.offset.dispose();
        return this;
    }
}
