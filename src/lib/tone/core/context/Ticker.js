
/**
 * A class which provides a reliable callback using either
 * a Web Worker, or if that isn't available, falls back to setTimeout.
 * @private
 */
export class Ticker {
    constructor(callback) {
        this._callback = callback;
        this._type = Ticker.Type.Worker;
        /**
         * The update interval of the ticker
         */
        this.updateInterval = 0.03;
        /**
         * The lookAhead of the ticker
         */
        this.lookAhead = 0.1;
        this._create();
    }
    _create() {
        if (Ticker.hasWorker) {
            try {
                this._worker = new Worker(Ticker._workerPath);
                this._worker.onmessage = this.update.bind(this);
                this._type = Ticker.Type.Worker;
            }
            catch (e) {
                // if there is a security error, fallback to timeout
                this._type = Ticker.Type.Timeout;
            }
        }
        else {
            this._type = Ticker.Type.Timeout;
        }
        // create the timeout loop
        if (this._type === Ticker.Type.Timeout) {
            this._timeout = setTimeout(this.update.bind(this), this.updateInterval * 1000);
        }
        // start the ticker
        return this;
    }
    /**
     * call the callback
     */
    update() {
        if (this._type === Ticker.Type.Worker) {
            this._worker.postMessage(this.lookAhead);
        }
        else {
            this._callback();
            this._timeout = setTimeout(this.update.bind(this), this.updateInterval * 1000);
        }
    }
    /**
     * clean up
     */
    dispose() {
        if (this._worker) {
            this._worker.terminate();
            this._worker.onmessage = null;
        }
        if (this._timeout) {
            clearTimeout(this._timeout);
        }
    }
}
/**
 * The type of the ticker, either a worker or a timeout
 */
Ticker.Type = {
    Worker: "worker",
    Timeout: "timeout",
};
/**
 * Test if the browser has web workers
 */
Ticker.hasWorker = typeof Worker === "function";
/**
 * The path to the worker script
 */
Ticker._workerPath = URL.createObjectURL(new Blob([`
		//the initial timeout time
		let timeoutTime = ${Ticker.baseUpdateInterval * 1000};
		//onmessage callback
		self.onmessage = function(msg){
			timeoutTime = msg.data;
		};
		//the tick function which posts a message
		//and schedules a new tick
		function tick(){
			setTimeout(tick, timeoutTime);
			self.postMessage("tick");
		}
		//start the first tick
		tick();
	`], { type: "application/javascript" }));
/**
 * The base update interval of the Worker
 */
Ticker.baseUpdateInterval = 0.03;
