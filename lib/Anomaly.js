const { EventEmitter } = require("events");
const Errors = require("./Errors");
const { v4: uuidv4 } = require('uuid');
const crypto = require("crypto");


/**
 * Anomaly
 * 
 * To use this class, extend it and override .detect(), .action(), and any other methods you need.
 * If you are saving the anomaly for later use, you should also make sure .serialize() and .deserialize() will meet your needs.
 * If your processor will be using fingerprints, you should also make sure .fingerprint() will meet your needs.
 * 
 * @alias module:Gnomalies.Anomaly
 */
class Anomaly extends EventEmitter {

    #log;           // Internal log
    #state;
    #id;            // A unique id for this anomaly
    #name;
    #paused;
    #use_fingerprints;
    #fingerprints;  // A list of fingerprints for this anomaly

    /**
     * constructor
     * 
     * @param {object} params parameters for this object
     * @param {array} params.history the log
     * @param {string} params.id the id
     * @param {string} params.state the state
     * @param {boolean} params.paused whether the anomaly is paused 
     * @throws {Error} if state is invalid
     */
    constructor(params = {}) {

        super();

        // Set up properties
        this.#log = params?.history ?? [];
        this.#id = params?.id ?? uuidv4();
        this.#state = params?.state ?? "preaction";
        this.#name = this.constructor.name;
        this.#paused = params?.paused ?? false;
        this.#use_fingerprints = params?.use_fingerprints ?? true;
        this.#fingerprints = { preaction : null, postaction: null };

        // Check for invalid entries
        if(!Anomaly.allowed_states.includes(this.#state)) throw new Error(`Invalid state: ${this.#state}`);
        if(!Array.isArray(this.#log)) throw new Error("Invalid history: " + this.#log);
        
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

    /**
     * Detect wrapper
     * 
     * Detect an anomaly.
     * Don't override me. Override _detect() instead!
     * 
     * @param {object} system the system being analyzed
     * @param {object} opts arbitrary options
     * @throws {Error} error on error
     * @returns {Promiose<boolean>} true if an anomaly is detected
     */
    static async detect(system, opts) {

        await this._detect(system, opts);
    }

    /**
     * Detect
     * 
     * Detect an anomaly.
     * Override me to add specific behavior!
     * 
     * @param {object} system the system being analyzed
     * @param {object} opts arbitrary options
     * @throws {Error} error on error
     * @returns {Promiose<boolean>} true if an anomaly is detected
     */
    static async _detect(system, opts) {

        throw new Errors.FatalARError(`${this.constructor.name}.detect() not implemented - please override me!`);
    }


    /**
     * Action wrapper
     * 
     * Perform the action for this anomaly.
     * Do not override me. Override _action() instead!
     * 
     * @param {object} system the system being analyzed
     * @param {object} opts arbitrary options
     * @returns {Promise} promise that resolves when the action is complete
     */
    async action(system, opts) {

        this.log.info(`revert() called`);
        if(this.#use_fingerprints) {

            this.log.debug(`Using fingerprints`);
            this.#fingerprints.postaction = null;   // In case _action throws an error, we don't want to keep the old fingerprint
            this.#fingerprints.preaction = this.fingerprint(system);    
            await this._action(system, opts);
            this.#fingerprints.postaction = this.fingerprint(system);
            this.log.debug(`Fingerprints: preaction ${this.#fingerprints.preaction} -> postaction ${this.#fingerprints.postaction}`);
        
        } else {
                
                this.log.debug(`Not using fingerprints`);
                await this._action(system, opts);
        }
    }

    /**
     * Action
     * 
     * Perform the action for this anomaly.
     * Override me to add specific behavior!
     * 
     * @param {object} system the system being analyzed
     * @param {object} opts arbitrary options
     * @throws {Error} error on error
     * @returns {Promise} promise that resolves when the action is complete
     */
    async _action(system, opts) {

        // Do nothing, override me!
    }    

    /**
     * Revert wrapper
     * 
     * Undo the action for this anomaly.
     * Do not override me. Override _revert() instead!
     * 
     * @param {object} system the system being analyzed
     * @param {object} opts arbitrary options
     * @throws {Error} error on error
     * @returns {Promise} promise that resolves when the reversion is complete
     */
    async revert(system, opts) {

        this.log.info(`revert() called`);
        if(this.#use_fingerprints) {

            // Take the fingerprint before we revert, make sure it matches
            this.log.debug(`Using fingerprints`);
            let fingerprint = this.fingerprint(system);
            if(fingerprint != this.#fingerprints.postaction) throw new Error(`Fingerprint mismatch: ${fingerprint} != ${this.#fingerprints.postaction}`);

            // Revert
            await this._revert(system, opts);

            // Take the fingerprint after we revert, make sure it matches what it was originally
            fingerprint = this.fingerprint(system);
            if(fingerprint != this.#fingerprints.preaction) throw new Error(`Fingerprint mismatch: ${fingerprint} != ${this.#fingerprints.preaction}`);

        } else {

            this.log.debug(`Not using fingerprints`);
            await this._revert(system, opts);
        }
    }

    /**
     * Revert
     * 
     * Undo the action for this anomaly.
     * Override me to add specific behavior!
     * 
     * @param {object} system the system being analyzed
     * @param {object} opts arbitrary options
     * @throws {Error} error on error
     * @returns {Promise} promise that resolves when the reversion is complete
     */
        async _revert(system, opts) {

            // Do nothing, override me!
        }

    /**
     * Evaluate
     * 
     * Evaluate the success of our action or reversion.
     * Throw an error if you believe the action or reversion failed.
     * Can also be used for post-action cleanup, statistics, etc.
     * Override me to add specific behavior!
     * 
     * @param {object} system the system being analyzed
     * @param {object} opts arbitrary options
     * @throws {Error} error on error
     * @returns {Promise} promise that resolves when the evaluation is complete
     */
    async evaluate(system, opts) {

        if(this.state == "postaction") {

            // We are evaluating the action

        } else {

            // We are evaluating the reversion
        }
    }

    /**
     * Serialize
     * 
     * Serialize this anomaly for storage.  By default, we serialize the following keys: #id, #name, #state, #log, #paused
     * The result is consumed by the constructor, which expects a JSON string whose keys represent the properties to restore.
     * 
     * If you override this funciton, you should call super.serialize() and add your own keys to the result.
     * 
     * @param {array<string>} keys the keys to serialize
     * @returns {string} the serialized anomaly
     * @throws {Error} error on error
     */
    static serialize(keys = ["id","name","state","history","paused"]) {
            
            let obj = {};
    
            for(let key of keys) {
                obj[key] = this[key];
            }
    
            return JSON.stringify(obj);
    }

    /**
     * From Serialized
     * 
     * Create an anomaly from a serialized string.  The string is expected to be a JSON string whose keys represent the properties to restore.
     * 
     * @static
     * @param {string} str the serialized anomaly
     * @returns {Anomaly} the anomaly
     * @throws {Error} error on error
     */
    static from_serialized(str = "") {

        return new this(JSON.parse(str));
    }

    /**
     * Fingerprint
     * 
     * Fingerprint the system.  Base implementation is to convert specified keys (or all keys) to a string,
     * then calculate the SHA256 hash of the string.
     * 
     * @param {object} system the system being analyzed
     * @param {array<string>} keys the keys to include in the fingerprint
     * @returns {string} the fingerprint
     * @throws {Error} error on error
     */
    fingerprint(system, keys = null) {

        // Create a new object that contains only the values from the specified keys
        let obj = {};
        if(keys) {
                
            for(let key of keys) {
                obj[key] = system[key];
            }
        } else {
            obj = system;
        }

        // Convert to a string
        let str = JSON.stringify(obj);

        // Use crypto to calculate the hash
        let hash = crypto.createHash('sha256').update(str).digest('hex'); 
        return hash;
    }


    get [Symbol.toStringTag]() {
        return `Anomaly ${this.#name} (${this.#id}) { state: ${this.#state} }`;
    }

    /** 
     * Use fingerprints (getter)
     * 
     * We don't have a setter for this because it is set in the constructor, and we can't go back and create fingerprints for all the actions we've already taken.
     * 
     * @return {boolean} true if we are configured to use fingerprints
     */
    get use_fingerprints() {

        return this.#use_fingerprints;
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
        return ["preaction","postaction","resolved"];
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
     * @param {string} [state = "postaction"] the state to count
     * @return {number} the number of times we have transitioned to this state
     */
    iterations(state = "postaction") {
        
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

        // Check if we are already in this state
        if ( this.#state === state ) return;

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