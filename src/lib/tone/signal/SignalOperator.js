import { ToneAudioNode } from "../core/context/ToneAudioNode.js";
import { optionsFromArguments } from "../core/util/Defaults.js";
/**
 * A signal operator has an input and output and modifies the signal in some way.
 *
 * @example
 * import { SignalOperator, Signal, Gain } from "tone";
 * class MyOperator extends SignalOperator {
 * 	// There is one input and one output
 * 	input = new Gain();
 * 	output = new Gain();
 * 	// internally pass the signal through
 * 	constructor(context) {
 * 		super(context);
 * 		this.input.connect(this.output);
 * 	}
 * }
 * const sig = new Signal(1);
 * const operator = new MyOperator();
 * sig.connect(operator);
 * operator.toDestination();
 *
 * @category Signal
 */
export class SignalOperator extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(SignalOperator.getDefaults(), arguments));
        this.name = "SignalOperator";
    }
    static getDefaults() {
        return ToneAudioNode.getDefaults();
    }
    /**
     * Connect the output of this signal operator to the input of another node.
     * @param destination The node to connect to.
     * @param outputNum The output number to connect from.
     * @param inputNum The input number to connect to.
     */
    connect(destination, outputNum = 0, inputNum = 0) {
        this.output.connect(destination, outputNum, inputNum);
        return this;
    }
    /**
     * Disconnect the output of this signal operator from the input of another node.
     * @param destination The node to disconnect from.
     * @param outputNum The output number to disconnect from.
     * @param inputNum The input number to disconnect to.
     */
    disconnect(destination, outputNum = 0, inputNum = 0) {
        this.output.disconnect(destination, outputNum, inputNum);
        return this;
    }
    /**
     * Connect the output of this signal operator to the destination of the context.
     */
    toDestination() {
        this.output.connect(this.destination);
        return this;
    }
    /**
     * Dispose of this signal operator.
     */
    dispose() {
        this.input.dispose();
        this.output.dispose();
        super.dispose();
        return this;
    }
}
