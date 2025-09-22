import { ToneAudioNode } from "../../core/context/ToneAudioNode.js";
import { optionsFromArguments } from "../../core/util/Defaults.js";
/**
 * Abstract base class for analysis nodes.
 */
export class Analyser extends ToneAudioNode {
    constructor() {
        const options = optionsFromArguments(Analyser.getDefaults(), arguments, [
            "type",
            "size",
        ]);
        super(options);
        this.type = options.type;
        this.size = options.size;
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            size: 1024,
            type: "fft",
        });
    }
    /**
     * The size of the analysis. This must be a power of two in the range 16 to 16384.
     */
    get size() {
        return this.analyser.fftSize;
    }
    set size(size) {
        this.analyser.fftSize = size;
    }
    run() {
        // defined in the extending class
        return [];
    }
    dispose() {
        super.dispose();
        this.analyser.disconnect();
        return this;
    }
}
