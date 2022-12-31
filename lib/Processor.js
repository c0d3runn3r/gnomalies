const { EventEmitter } = require("events");
const Anomaly = require("./Anomaly.js");




/**
 * AnomalyProcessor
 * 
 * Process anomaly
 * @alias module:Anomalies.Processor
 */
class Processor extends EventEmitter {

    #anomalies;
    #classes;
    #logger;

    constructor(logger) {
 
        super();
        this.#anomalies = [];
        this.#classes = [];
        this.#logger = logger;
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

            if(anomaly_class.detect(system, opts)) this.#anomalies.push(new anomaly_class(system, this.#logger));
        }
    }

    /**
     * Process one anomaly 
     * 
     * Finds the first (by order) anomaly with a state of "Preaction" and processes it
     * to the Resolved state (if possible).  May call .action(), .evaluate(), .revert()
     * Events are bubbled up.
     * 
     * @fires Anomaly#log
     * @fires Anomaly#state
     * @fires Anomaly#pause
     * @fires Anomaly#resume
     * @fires Anomaly#activity
     * @return {Promise<Anomaly|null>} the anomaly processed, or null if there are no anomalies to process.  You can check for success by checking the anomaly itself.
     */
    async process(system, opts) {

        // Get a non-paused anomaly to process, or return false
        let preaction_anomalies = this.anomalies_with_state("Preaction").filter((anomaly) => !anomaly.paused);
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

        // Process the anomaly from the Preaction state to the Resolved state
        try {
            // Action 
            this.emit("activity", { anomaly: anomaly, activity: "action", progress: 0 });
            await anomaly.action(system, opts);
            this.emit("activity", { anomaly: anomaly, activity: "action", progress: 100 });
            anomaly._state = "Postaction";

            // Evaluate
            this.emit("activity", { anomaly: anomaly, activity: "evaluate", progress: 0 });
            await anomaly.evaluate(system, opts);
            this.emit("activity", { anomaly: anomaly, activity: "evaluate", progress: 100 });
            anomaly._state = "Resolved";

        } catch (err) {

            // An error! Revert the change
            this.emit("activity", { anomaly: anomaly, activity: "revert", progress: 0 });            
            await anomaly.revert(system, opts);
            this.emit("activity", { anomaly: anomaly, activity: "revert", progress: 100 });

            // Pause the anomaly and return it to the Preaction state
            anomaly.pause("fatal error: " + err.message);
            anomaly._state = "Preaction";

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