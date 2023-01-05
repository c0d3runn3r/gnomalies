const { EventEmitter } = require("events");
const Anomaly = require("./Anomaly.js");


/**
 * @event Anomaly#activity
 * @type {object}
 * @property {Anomaly} anomaly the anomaly
 * @property {string} activity the activity name, e.g. "action", "evaluate", "revert"
 * @property {number} progress the progress, between 0 and 100
 */



/**
 * AnomalyProcessor
 * 
 * Detect and process anomalies in a queue.  Call the constructor with an array of Anomaly classes, then await .detect() and .process()
 * 
 * @alias module:Gnomalies.Processor
 */
class Processor extends EventEmitter {

    #anomalies;
    #classes;

    /**
     * Create a new Processor
     * 
     * @param {Array<Anomaly>} [classes = []] - An array of Anomaly classes we may detect
     * @throws {Error} if classes is not an array
     * @return {Processor} the new Processor
     */
    constructor(classes = []) {
 
        super();

        if(!Array.isArray(classes)) throw new Error("classes must be an array");

        this.#anomalies = [];
        this.#classes = classes;
    }

    /**
     * Get all anomalies
     * 
     * @returns {Array<Anomaly>} the queue of anomalies
     */
    get anomalies() {

        return this.#anomalies;
    }

    /**
     * Get all classes
     * 
     * @returns {Array<Anomaly>} all Anomaly classes
     */
    get classes() {

        return this.#classes;
    }

    /** 
     * Get anomalies with a particular state
     * 
     * @param {string} state - The state to filter on
     * @throws {Error} if state is invalid
     * @return {Array<Anomaly>} anomalies with the specified state
     */
    anomalies_with_state(state) {

        // If state is invlid, throw an error
        if(!Anomaly.allowed_states.includes(state)) throw new Error("Invalid state: " + state);
        return this.#anomalies.filter((anomaly) => anomaly.state == state);
    }

    /**
     * Detect anomalies in a system
     * 
     * Adds anomalies to the queue
     * 
     * @param {object} system - The system to detect anomalies in
     * @param {object} opts - Options to pass to the detect() methods
     */
    async detect(system, opts) {

        // Iterate all classes
        for (let anomaly_class of this.#classes) {

            if(await anomaly_class.detect(system, opts)) this.#anomalies.push(new anomaly_class(system, opts));
        }
    }

    /**
     * Process all anomalies
     * 
     * Processes all anomalies in the queue from the preaction state to the resolved state (if possible).  May call .action(), .evaluate(), .revert()
     * Events are bubbled up from each anomaly.  Anomalies that fail between states will be paused and will be set to `.dirty` state
     * 
     * @param {object} system - The system to detect anomalies in
     * @param {object} opts - Options to pass to the methods (action() etc)
     * @fires Anomaly#log
     * @fires Anomaly#state
     * @fires Anomaly#pause
     * @fires Anomaly#resume
     * @fires Anomaly#activity
     * @return {Promise} resolves when all anomalies are processed
     */
    async process(system, opts) {

        // Process all anomalies
        for (let anomaly; anomaly !== null;) anomaly = await this.process_one(system, opts);
    }

    /**
     * Process one anomaly 
     * 
     * Finds the first (by order) anomaly with a state of "preaction" and processes it
     * to the resolved state (if possible).  May call .action(), .evaluate(), .revert()
     * Events are bubbled up. Anomalies that fail between states will be paused and will be set to `.dirty` state
     * 
     * @fires Anomaly#log
     * @fires Anomaly#state
     * @fires Anomaly#pause
     * @fires Anomaly#resume
     * @fires Anomaly#activity
     * @return {Promise<Anomaly|null>} the anomaly processed, or null if there are no anomalies to process.  You can check for success by checking the anomaly itself.
     */
    async process_one(system, opts) {

        // Get a non-paused anomaly to process, or return false
        let preaction_anomalies = this.anomalies_with_state("preaction").filter((anomaly) => !anomaly.paused);
        if(preaction_anomalies.length == 0) return null;
        let anomaly = preaction_anomalies[0];

        // Attach event handlers
        const self = this;
        let log_handler = function(data) { self.emit("log", data); };
        let state_handler = function(data) { self.emit("state", data); };
        let pause_handler = function(data) { self.emit("pause", data); };
        let resume_handler = function(data) { self.emit("resume", data); };
        let activity_handler = function(data) { self.emit("activity", data); };
        anomaly.on("log", log_handler);
        anomaly.on("state", state_handler);
        anomaly.on("pause", pause_handler);
        anomaly.on("resume", resume_handler);
        anomaly.on("activity", activity_handler);

        // Process the anomaly from the preaction state to the resolved state
        try {
            // Action and evaluate
            await anomaly.action(system, opts);
            await anomaly.evaluate(system, opts);

        } catch (err) {

            // Well, that didn't work.  Log the error and try to revert
            anomaly.log.error("process_one(): exception thrown while processing anomaly: " + err.message);
            
            try {

                // Revert and pause
                await anomaly.revert(system, opts);
                anomaly.pause("fatal error: " + err.message);
                anomaly._state = "preaction";

            } catch(e) {

                // A reversion error means we need to pause the anomaly and leave it in the postaction state
                anomaly.log.error("process_one(): exception thrown while reverting anomaly: " + e.message);
                anomaly.pause("revert() failed after action() - anomaly is in unknown state (error: '" + err.message + "')");
                anomaly.dirty=true;
            }

        }

        // Remove event handlers
        anomaly.off("log", log_handler);
        anomaly.off("state", state_handler);
        anomaly.off("pause", pause_handler);
        anomaly.off("resume", resume_handler);
        anomaly.off("activity", activity_handler);


        return anomaly;
    }


}

module.exports = exports = Processor;