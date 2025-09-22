import { getAudioContext, setAudioContext, } from "./AudioContext.js";
export { createAudioContext, createOfflineAudioContext, } from "./AudioContext.js";
let factory;
if (typeof window === "object") {
    factory = () => new AudioContext();
}
else if (typeof global === "object") {
    factory = () => {
        // @ts-ignore
        const { AudioContext, } = require("web-audio-api");
        return new AudioContext();
    };
}
else {
    factory = () => undefined;
}
/**
 * This dummy context is used to avoid breaking Typescript-only environments.
 */
class DummyContext {
    constructor() {
        this.baseLatency = 0;
        this.outputLatency = 0;
        this.sampleRate = 44100;
        this.state = "suspended";
        this.onstatechange = null;
        //---------------------------
        // From BaseAudioContext
        //---------------------------
        this.currentTime = 0;
        this.destination = {};
        this.listener = {};
    }
    //---------------------------
    // From AudioContext
    //---------------------------
    close() {
        return Promise.resolve();
    }
    createAnalyser() {
        return {};
    }
    createBiquadFilter() {
        return {};
    }
    createBuffer() {
        return {};
    }
    createBufferSource() {
        return {};
    }
    createChannelMerger() {
        return {};
    }
    createChannelSplitter() {
        return {};
    }
    createConstantSource() {
        return {};
    }
    createConvolver() {
        return {};
    }
    createDelay() {
        return {};
    }
    createDynamicsCompressor() {
        return {};
    }
    createGain() {
        return {};
    }
    createIIRFilter() {
        return {};
    }
    createOscillator() {
        return {};
    }
    createPanner() {
        return {};
    }
    createPeriodicWave() {
        return {};
    }
    createScriptProcessor() {
        return {};
    }
    createStereoPanner() {
        return {};
    }
    createWaveShaper() {
        return {};
    }
    decodeAudioData() {
        return Promise.resolve({});
    }
    getOutputTimestamp() {
        return {
            contextTime: 0,
            performanceTime: 0,
        };
    }
    resume() {
        return Promise.resolve();
    }
    suspend() {
        return Promise.resolve();
    }
    //---------------------------
    // From OfflineAudioContext
    //---------------------------
    startRendering() {
        return Promise.resolve({});
    }
}
/**
 * A dummy OfflineAudioContext.
 */
class DummyOfflineContext extends DummyContext {
    constructor(channels, length, sampleRate) {
        super();
        this.length = length;
        this.oncomplete = null;
    }
}
/**
 * Create a new AudioContext
 */
export function createAudioContext() {
    return new window.AudioContext();
}
/**
 * Create a new OfflineAudioContext
 */
export function createOfflineAudioContext(channels, length, sampleRate) {
    return new window.OfflineAudioContext(channels, length, sampleRate);
}
if (!getAudioContext()) {
    setAudioContext(new DummyContext());
}
