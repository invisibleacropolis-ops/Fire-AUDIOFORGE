import { getWorkletId } from "../../core/worklet/WorkletId.js";
export const workletId = getWorkletId("recorder");
export const worklet = `
class RecorderWorklet extends AudioWorkletProcessor {

	constructor(options) {
		super(options);
		this.channelCount = options.channelCount;
		this.bufferSize = options.processorOptions.bufferSize;
		// 5 minutes by default, but it can be changed
		this._buffers = new Array(this.channelCount);
		this._bufferPos = 0;
		for (let i = 0; i < this.channelCount; i++) {
			this._buffers[i] = new Float32Array(this.bufferSize);
		}
	}
	
	process(inputs) {
		if (inputs[0][0]) {
			// add the buffers
			for (let i = 0; i < this.channelCount; i++) {
				this._buffers[i].set(inputs[0][i], this._bufferPos);
			}
			this._bufferPos += inputs[0][0].length;
			if (this._bufferPos >= this.bufferSize) {
				this.port.postMessage(this._buffers);
				this._bufferPos = 0;
			}
		}
		return true;
	}
}
registerProcessor("${workletId}", RecorderWorklet);
`;
