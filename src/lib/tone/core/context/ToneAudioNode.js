
import { connect, disconnect } from "../Connect.js";
import { ToneWithContext } from "../ToneWithContext.js";
import { optionsFromArguments } from "../util/Defaults.js";
/**
 * ToneAudioNode is the base class for classes which process audio.
 * Nodes have inputs and outputs.
 *
 * @category Core
 */
export class ToneAudioNode extends ToneWithContext {
    constructor(options) {
        super(options);
        /**
         * The number of inputs feeding into the AudioNode.
         * For source nodes, this will be 0.
         */
        this.numberOfInputs = 1;
        /**
         * The number of outputs coming out of the AudioNode.
         */
        this.numberOfOutputs = 1;
    }
    /**
     * The input node is the same as the output node by default.
     */
    get input() {
        return this._input;
    }
    set input(input) {
        if (input) {
            this._input = input;
        }
    }
    /**
     * The output node is the same as the input node by default.
     */
    get output() {
        return this._output;
    }
    set output(output) {
        if (output) {
            this._output = output;
        }
    }
    //-------------------------------------
    // CONNECTIONS
    //-------------------------------------
    /**
     * connect the output of this node to the rest of the nodes in series.
     * @param nodes
     * @example
     * const player = new Player();
     * const filter = new Filter();
     * const reverb = new Reverb();
     * // connect in series
     * player.chain(filter, reverb);
     */
    chain(...nodes) {
        if (nodes.length > 0) {
            connect(this, nodes[0]);
            if (nodes.length > 1) {
                for (let i = 0; i < nodes.length - 1; i++) {
                    const node = nodes[i];
                    const nextNode = nodes[i + 1];
                    if (Array.isArray(node) || Array.isArray(nextNode)) {
                        throw new Error("chain does not accept arrays of nodes");
                    }
                    connect(node, nextNode);
                }
            }
        }
        return this;
    }
    /**
     * connect the output of this node to the rest of the nodes in parallel.
     * @param nodes
     * @example
     * const player = new Player();
     * const chorus = new Chorus();
     * const phaser = new Phaser();
     * // connect in parallel
     * player.fan(chorus, phaser);
     */
    fan(...nodes) {
        if (nodes.length > 0) {
            nodes.forEach(node => this.connect(node));
        }
        return this;
    }
    /**
     * Connect the output of this node to the input of another node.
     * The output of this node can only be connected to the input of
     * other ToneAudioNodes or native Web Audio Nodes.
     *
     * @param destination The node to connect to.
     * @param outputNum The output number to connect from.
     * @param inputNum The input number to connect to.
     */
    connect(destination, outputNum = 0, inputNum = 0) {
        connect(this, destination, outputNum, inputNum);
        return this;
    }
    /**
     * Disconnect the output of this node from the input of another node.
     *
     * @param destination The node to disconnect from.
     * @param outputNum The output number to disconnect from.
     * @param inputNum The input number to disconnect from.
     */
    disconnect(destination, outputNum = 0, inputNum = 0) {
        disconnect(this, destination, outputNum, inputNum);
        return this;
    }
    /**
     * Connect the output of this node to the destination node.
     *
     * @param destination The node to connect to.
     * @param outputNum The output number to connect from.
     * @param inputNum The input number to connect to.
     */
    toDestination(outputNum, inputNum) {
        this.connect(this.context.destination, outputNum, inputNum);
        return this;
    }
    /**
     * Connect the output to the transport's master output.
     */
    toMaster() {
        this.context.transport.connect(this);
        return this;
    }
    /**
     * Dispose of this node.
     */
    dispose() {
        super.dispose();
        if (this._input) {
            if (this._input instanceof ToneAudioNode) {
                this._input.dispose();
            }
            else if ("disconnect" in this._input) {
                this._input.disconnect();
            }
        }
        if (this._output) {
            if (this._output instanceof ToneAudioNode) {
                this._output.dispose();
            }
            else if ("disconnect" in this._output) {
                this._output.disconnect();
            }
        }
        return this;
    }
    static getDefaults() {
        return optionsFromArguments(super.getDefaults(), [], ["numberOfInputs", "numberOfOutputs"]);
    }
}
