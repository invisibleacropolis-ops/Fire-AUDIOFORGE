import { ToneAudioNode } from "./context/ToneAudioNode.js";
import { isAudioNode, isAudioParam, isNumber, } from "./util/Type.js";
/**
 * A class which provides a connect and disconnect method for audio components.
 */
class Connect extends ToneAudioNode {
    constructor() {
        // this is an abstract class, should not be instantiated directly
        super();
    }
    /**
     * connect the output of this node to the rest of the nodes in series.
     * @param nodes
     */
    chain(...nodes) {
        if (nodes.length > 0) {
            this.connect(nodes[0]);
            for (let i = 1; i < nodes.length; i++) {
                nodes[i - 1].connect(nodes[i]);
            }
        }
        return this;
    }
    /**
     * connect the output of this node to the rest of the nodes in parallel.
     * @param nodes
     */
    fan(...nodes) {
        if (nodes.length > 0) {
            nodes.forEach((node) => this.connect(node));
        }
        return this;
    }
}
/**
 * Connect the output of this node to the input of another node.
 * @param destination The node to connect to.
 * @param outputNum The output number to connect from.
 * @param inputNum The input number to connect to.
 */
export function connect(source, destination, outputNum, inputNum) {
    // resolve the destination and connect
    if (isAudioParam(destination)) {
        source.connect(destination, outputNum);
    }
    else if (destination instanceof ToneAudioNode) {
        destination.set(source);
        source.connect(destination.input, outputNum, inputNum);
    }
    else if (isAudioNode(destination)) {
        source.connect(destination, outputNum, inputNum);
    }
    else {
        // should connect to the inputs of the node, not the node itself
        destination.input.set(source);
    }
}
/**
 * Disconnect the output of this node from the input of another node.
 * @param destination The node to disconnect from.
 * @param outputNum The output number to disconnect from.
 * @param inputNum The input number to disconnect to.
 */
export function disconnect(source, destination, outputNum, inputNum) {
    if (isAudioParam(destination)) {
        source.disconnect(destination, outputNum);
    }
    else if (destination instanceof ToneAudioNode) {
        source.disconnect(destination.input, outputNum, inputNum);
    }
    else if (isAudioNode(destination)) {
        source.disconnect(destination, outputNum, inputNum);
    }
    else if (!destination) {
        source.disconnect();
    }
    else {
        // should disconnect from the inputs of the node, not the node itself
        destination.input.unset(source);
    }
}
