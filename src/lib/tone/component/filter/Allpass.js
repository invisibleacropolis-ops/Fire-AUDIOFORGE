
import { Filter } from "./Filter.js";
import { optionsFromArguments } from "../../core/util/Defaults.js";
/**
 * Allpass is a filter which allows all frequencies to pass, but changes the phase relationship between the various frequencies.
 *
 * @example
 * const allpass = new Allpass(200).toDestination();
 * const noise = new Noise().connect(allpass).start();
 * @category Component
 */
export class Allpass extends Filter {
    constructor() {
        const options = optionsFromArguments(Allpass.getDefaults(), arguments, ["frequency", "Q"]);
        super(Object.assign(options, { type: "allpass" }));
        this.name = "Allpass";
    }
}
