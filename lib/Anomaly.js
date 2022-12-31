const { EventEmitter } = require("events");
const Errors = require("./Errors");
const { v4: uuidv4 } = require('uuid');

/**
 * @event Anomaly#activity
 * @type {object}
 * @property {Anomaly} anomaly the anomaly
 * @property {string} activity the activity name, e.g. "action", "evaluate", "revert"
 * @property {number} progress the progress, between 0 and 100
 */


/**
 * Anomaly
 * 
 * To use this class, extend it and override _action(), _evaluate(), _resolve() and optionally any _recover\_*() methods.
 * If you override _save(), it will be called after every state change.
 * 
 * @alias module:Anomalies.Anomaly
 */
class Anomaly extends EventEmitter {

    #log;           // Internal log
    #state;
    #id;            // A unique id for this anomaly
    #name;
    #paused;

    /**
     * constructor
     * 
     */
    constructor() {
        super();

        this.#log = [];
        this.#id = uuidv4();
        this.#state = "Preaction";
        this.#name = this.constructor.name;
        this.#paused = false;

        // Internal logging
        Object.defineProperty(this, "log", {
            enumerable : false,
            value : {
                debug : (...args) => this._log_type("debug",...args),
                info : (...args) => this._log_type("info",...args),
                warn : (...args) => this._log_type("warn",...args),
                error : (...args) => this._log_type("error",...args),
            }
        });

    }

    // ====================
    // Methods to override
    // ====================
    async action(system, opts) {}
    async revert(system, opts) {}
    async evaluate(system, opts) {}
    async resolve(system, opts) {}
    async save(opts) {}

    /**
     * Detect
     * 
     * Detect an anomaly
     * Override me!
     * 
     * @param {object} system the system being analyzed
     * @param {object} opts arbitrary options
     * @fires Anomaly#activity
     * @returns {boolean} true if an anomaly is detected
     */
    static async detect(system, opts) {

        throw new Errors.FatalARError(`${this.constructor.name}.detect() not implemented - please override me!`);
    }

    // ====================
    // Base Methods
    // ====================

    get [Symbol.toStringTag]() {
        return `Anomaly ${this.#name} (${this.#id}) { state: ${this.#state} }`;
    }

    /**
     * name (getter)
     * 
     * @return {string} the name of this anomaly
     */
    get name() {

        return this.#name;
    }

    /**
     * paused (getter)
     * 
     * @return {boolean} true if this is paused
     */
    get paused() {

        return this.#paused;
    }

    /**
     * allowed_states (getter)
     * 
     * @return {array} the allowed states
     */
    static get allowed_states() {
        return ["Preaction","Postaction","Resolved"];
    }

    /**
     * id (getter)
     * 
     * @return {string} the id for this anomaly 
     */
    get id() {

        return this.#id;
    }

    /**
     * Log (getter)
     * 
     * @return {array} the log for this anomaly 
     */
    get history() {

        return this.#log;
    }

    /**
     * State iterations counter
     * 
     * Show how many times we have transitioned to a given state
     * 
     * @param {string} [state = "Actioning"] the state to count
     * @return {number} the number of times we have transitioned to this state
     */
    iterations(state = "Actioning") {
        
        let re = new RegExp(`^Changing state from \\w+ to ${state}$`, 'i');
        return this.#log.filter(e => re.test(e.message)).length;
    }


    /**
     * state (getter)
     * 
     * @return {string} the state of the anomaly 
     */
    get state() {
        return this.#state;
    }

    /**
     * pause
     * 
     * Pause this anomaly 
     * 
     * @param {string} reason the reason for the pause
     * @emit Anomaly#pause
     */
    async pause(reason) {

        this.#paused = true;
        this.log.error("Paused becuase: "+reason);

        /**
         * @event Anomaly#pause
         * @type {object}
         * @property {Anomaly} anomaly the anomaly
         * @property {string} reason the reason for the pause
         */
        this.emit("pause",{ anomaly : this, reason : reason });
    }

    /**
     * resume
     * 
     * Resume this anomaly
     * 
     * @param {string} reason the reason for the resume
     * @emit Anomaly#resume
     */
    async resume(reason) {

        this.#paused = false;
        this.log.info("Resumed becuase: "+reason);

        /**
         * @event Anomaly#resume
         * @type {object}
         * @property {Anomaly} anomaly the anomaly
         * @property {string} reason the reason for the resume
         */
        this.emit("resume",{ anomaly : this, reason : reason });
    }

    
    // ====================
    // Private Methods
    // ====================

    /**
     * _log_type    
     * 
     * @private
     * @param {string} type one of debug, info, warn, error
     * @param {string} message the message to log
     * @fires Anomaly#log
     */
    _log_type(type, message) {

        // Save to our internal log
        this.#log.push({
            timestamp : (new Date()).toISOString(),
            type : type,
            message : message
        });

        /**
         * @event Anomaly#log
         * @type {object}
         * @property {Anomaly} anomaly the anomaly report
         * @property {string} type the type of log message
         * @property {string} message the message
        */
        this.emit("log", { anomaly: this, type: type, message: message});
    }

    /**
     * state (setter)
     * 
     * Set the state of the anomaly report
     * 
     * @private
     * @param {string} state the new state
     * @throws {FatalARError} if the state is not allowed
     * @fires AnomalyReport#state
     */
    set _state(state) {

        // Check if the state is allowed
        if ( !Anomaly.allowed_states.includes(state) ) throw new Errors.FatalARError(`State ${state} is not allowed`);

        this.log.debug(`Changing state from ${this.state} to ${state}`);
        let old_state = this.#state;
        this.#state = state; 

        /**
         * @event Anomaly#state
         * @type {object}
         * @property {Anomaly} anomaly this anomaly
         * @property {string} new_state the new state
         * @property {string} old_state the old state
         */
        this.emit("state", { anomaly: this, new_state:state, old_state:old_state });
    }    

}


module.exports = exports = Anomaly;