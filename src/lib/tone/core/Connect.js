
import { ToneAudioNode } from "./context/ToneAudioNode.js";
import { isAudioNode, isAudioParam } from "./util/Type.js";
/**
 * A class for organizing connections between {@link ToneAudioNode}s.
 * @internal
 */
class Connect {
    constructor(source, destination, outputNumber = 0, inputNumber = 0) {
        this.source = source;
        this.destination = destination;
        this.outputNumber = outputNumber;
        this.inputNumber = inputNumber;
    }
    /**
     * connect the source to the destination
     */
    connect(context) {
        if (isAudioNode(this.source) && isAudioNode(this.destination)) {
            this.source.connect(this.destination, this.outputNumber, this.inputNumber);
        }
        else if (isAudioNode(this.source)) {
            this.source.connect(this.destination, this.outputNumber);
        }
        else if (this.source instanceof ToneAudioNode) {
            this.source.connect(this.destination, this.outputNumber, this.inputNumber);
        }
    }
    /**
     * disconnect the source from the destination
     */
    disconnect() {
        if (isAudioNode(this.source) && isAudioNode(this.destination)) {
            this.source.disconnect(this.destination, this.outputNumber, this.inputNumber);
        }
        else if (isAudioNode(this.source)) {
            this.source.disconnect(this.destination, this.outputNumber);
        }
        else if (this.source instanceof ToneAudioNode) {
            this.source.disconnect(this.destination, this.outputNumber, this.inputNumber);
        }
    }
}
/**
 * Connect the source to the destination.
 * @param source The source node.
 * @param destination The destination node.
 * @param outputNumber The output number on the source to connect from.
 * @param inputNumber The input number on the destination to connect to.
 * @internal
 */
export function connect(source, destination, outputNumber = 0, inputNumber = 0) {
    if (destination instanceof ToneAudioNode) {
        destination.input = source;
    }
    else if (isAudioNode(destination)) {
        source.connect(destination, outputNumber, inputNumber);
    }
    else {
        source.connect(destination, outputNumber);
    }
}
/**
 * Disconnect the source from the destination.
 * @param source The source node.
 * @param destination The destination node.
 * @param outputNumber The output number on the source to connect from.
 * @param inputNumber The input number on the destination to connect to.
 * @internal
 */
export function disconnect(source, destination, outputNumber = 0, inputNumber = 0) {
    if (destination && destination instanceof ToneAudioNode) {
        destination.input = undefined;
    }
    else if (destination && isAudioNode(destination)) {
        source.disconnect(destination, outputNumber, inputNumber);
    }
    else {
        source.disconnect(destination, outputNumber);
    }
}
