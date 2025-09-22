import { ToneWithContext } from "../ToneWithContext.js";
import { optionsFromArguments } from "../util/Defaults.js";
import { connect, disconnect } from "../Connect.js";
/**
 * The base class for all nodes that have an input and output.
 */
export class ToneAudioNode extends ToneWithContext {
    constructor() {
        super(optionsFromArguments(ToneAudioNode.getDefaults(), arguments));
        //-------------------------------------
        //
        // CONNECTIONS
        //
        //-------------------------------------
        /**
         * The version of the library.
         */
        this.version = this.version;
    }
    static getDefaults() {
        return ToneWithContext.getDefaults();
    }
    /**
     * The input node is the same as the output node by default.
     */
    get input() {
        return this.output;
    }
    set input(input) {
        this.output = input;
    }
    /**
     * The output node is the same as the input node by default.
     */
    get output() {
        return this.input;
    }
    set output(output) {
        this.input = output;
    }
    /**
     * connect the output of this node to the rest of the nodes in series.
     * @param nodes
     */
    chain(...nodes) {
        this.connect(nodes[0]);
        for (let i = 1; i < nodes.length; i++) {
            nodes[i - 1].connect(nodes[i]);
        }
        return this;
    }
    /**
     * connect the output of this node to the rest of the nodes in parallel.
     * @param nodes
     */
    fan(...nodes) {
        nodes.forEach((node) => this.connect(node));
        return this;
    }
    /**
     * Connect the output of this node to the input of another node.
     * @param destination The node to connect to.
     * @param outputNum The output number to connect from.
     * @param inputNum The input number to connect to.
     */
    connect(destination, outputNum = 0, inputNum = 0) {
        connect(this.output, destination, outputNum, inputNum);
        return this;
    }
    /**
     * Disconnect the output of this node from the input of another node.
     * @param destination The node to disconnect from.
     * @param outputNum The output number to disconnect from.
     * @param inputNum The input number to disconnect to.
     */
    disconnect(destination, outputNum = 0, inputNum = 0) {
        disconnect(this.output, destination, outputNum, inputNum);
        return this;
    }
    /**
     * Connect the output of this node to the destination of the context.
     */
    toDestination() {
        this.connect(this.destination);
        return this;
    }
    /**
     * Dispose of this node.
     */
    dispose() {
        if (this.input) {
            this.input.disconnect();
        }
        if (this.output) {
            this.output.disconnect();
        }
        super.dispose();
        return this;
    }
}
