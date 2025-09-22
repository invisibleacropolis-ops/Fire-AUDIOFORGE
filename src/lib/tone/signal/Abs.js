import { WaveShaper } from "../component/channel/WaveShaper.js";
import { optionsFromArguments } from "../core/util/Defaults.js";
import { SignalOperator } from "./SignalOperator.js";
/**
 * Abs returns the absolute value of an incoming signal.
 *
 * @example
 * import { Abs, Oscillator, Signal } from "tone";
 * const signal = new Signal(-1);
 * const abs = new Abs();
 * signal.connect(abs);
 * // the output of abs is 1.
 * @category Signal
 */
export class Abs extends SignalOperator {
    constructor() {
        const options = optionsFromArguments(Abs.getDefaults(), arguments);
        super(options);
        this.name = "Abs";
        this._abs =
            this.input =
                this.output =
                    new WaveShaper({
                        context: this.context,
                        mapping: (val) => {
                            if (Math.abs(val) < 0.001) {
                                return 0;
                            }
                            else {
                                return Math.abs(val);
                            }
                        },
                    });
    }
    /**
     * clean up
     */
    dispose() {
        super.dispose();
        this._abs.dispose();
        return this;
    }
}
