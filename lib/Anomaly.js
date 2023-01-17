const { EventEmitter } = require("events");
const Errors = require("./Errors");
const { v4: uuidv4 } = require('uuid');
const crypto = require("crypto");
const { KeyExtractor, Key } = require("../lib/KeyExtractor");


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
    #name;          // Not settable - this is the name of the class
    #description;
    #paused;
    #dirty;     
    #fingerprint_keys;    
    #fingerprints;  // A list of fingerprints for this anomaly

    /**
     * constructor
     * 
     * @param {object} params parameters for this object
     * @param {array} [params.history] the log
     * @param {string} [params.id] the id
     * @param {string} [params.description] a short description of this anomaly type
     * @param {string} [params.state] the state
     * @param {boolean} [params.paused] whether the anomaly is paused 
     * @param {boolean} [params.dirty] whether the anomaly is dirty
     * @param {array} [params.fingerprint_keys = null] the keys that will be used to generate fingerprints, or null for all keys.  Expects full paths into the systems to be analyzed, e.g. ["a.name", "b.name.first"]
     * @param {object} [params.fingerprints] the fingerprints
     * @throws {Error} error on invalid parameter
     */
    constructor(params = {}) {

        super();

        // Set up properties
        this.#log = params?.history ?? [];
        this.#id = params?.id ?? uuidv4();
        this.#state = params?.state ?? "preaction";
        this.#description = params?.description ?? "";
        this.#name = this.constructor.name;
        this.#paused = params?.paused ?? false;
        this.#dirty = params?.dirty ?? false;
        this.#fingerprint_keys = params?.fingerprint_keys ?? null;
        this.#fingerprints = params?.fingerprints ?? { preaction : null, postaction: null };

        // Check for invalid entries
        if(!Anomaly.allowed_states.includes(this.#state)) throw new Error(`Invalid state: ${this.#state}`);
        if(!Array.isArray(this.#log)) throw new Error("Invalid history: " + this.#log);
        if(!this.#id) throw new Error("Invalid id: " + this.#id);
        if(typeof this.#paused !== "boolean") throw new Error("Invalid 'paused' parameter: " + this.#paused);
        if(typeof this.#dirty !== "boolean") throw new Error("Invalid 'dirty' parameter: " + this.#dirty);
        if(this.#fingerprint_keys !== null && !Array.isArray(this.#fingerprint_keys)) throw new Error("Fingerprint keys must be null or an array: " + this.#fingerprint_keys);

        
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
     * Placeholder functions - these don't do anything until they are overidden
     * Function signature matches that of their non-underscored wrappers
     */
    static async _detect(system, opts) { return false; }
    async _action(system, opts) {}  
    async _revert(system, opts) {}
    async _evaluate(system, opts) {}

    /**
     * Detect an anomaly.
     * Don't override me. Override _detect() instead!
     * 
     * @param {object} system the system being analyzed
     * @param {object} opts arbitrary options
     * @throws {Error} error on error
     * @returns {Promiose<boolean>} true if an anomaly is detected
     */
    static async detect(system, opts) {

        return await this._detect(system, opts);
    }

    /**
     * Action
     * 
     * Performs the action for this anomaly.  If the anomaly is not in a preaction state, an error is thrown.  When using fingerprints, we take the fingerprint before and after calling _action().
     * Do not override me. Override _action() instead!
     * 
     * @param {object} system the system being analyzed
     * @param {object} opts arbitrary options
     * @throws {Error} error if the anomaly is not in a preaction state or system is undefined
     * @fires Anomaly#activity
     * @returns {Promise} promise that resolves when the action is complete
     */
    async action(system, opts) {

        this.log.info(`action() called`);
        if(system === undefined) throw new Error(`system is undefined`);
        if(this.state !== "preaction") throw new Error(`Cannot action an anomaly not in a preaction state`);

        this.emit("activity", { anomaly: this, activity: "action", progress: 0 });

        // Take fingerprints
        this.log.debug(`action(): taking preaction fingerprint`);
        this.#fingerprints.postaction = null;   // In case _action throws an error, we don't want to keep the old fingerprint
        this.#fingerprints.preaction = this.fingerprint(system); 
        
        // Run our action
        try {

            this.log.debug(`action(): calling _action()`);
            await this._action(system, opts);
        
        } catch(e) {

            // _action failed.  We will have to re-throw the error, but we catch it here so we can put ourselves in a postaction state
            this.log.error(`action(): _action() failed: ${e}`);
            this.#fingerprints.postaction = this.fingerprint(system);
            this._state = "postaction";
            throw e;
        }

        // Take the postaction fingerprint
        this.#fingerprints.postaction = this.fingerprint(system);
        this.log.debug(`action(): fingerprints - preaction = ${this.#fingerprints.preaction} postaction = ${this.#fingerprints.postaction}`);


        this.emit("activity", { anomaly: this, activity: "action", progress: 100 });
        this._state = "postaction";
    }  

    /**
     * Revert
     * 
     * Undo the action for this anomaly.  If we are in a preaction state and using fingerprints, we verify the fingerprint and then return.  Otherwise, we check that we match the postaction fingerprint; call _revert(), and then check the preaction fingerprint.  If any of this fails, we throw an error.
     * Do not override me. Override _revert() instead!
     * 
     * @param {object} system the system being analyzed
     * @param {object} opts arbitrary options
     * @throws {Error} error on error
     * @fires Anomaly#activity
     * @returns {Promise} promise that resolves when the reversion is complete
     */
    async revert(system, opts) {

        this.log.info(`revert() called`);
        this.emit("activity", { anomaly: this, activity: "revert", progress: 0 });
        
        if(system === undefined) throw new Error(`system is undefined`);
        
        this.log.info(`revert(): checking to see if we match the preaction fingerprint`);
        let fingerprint = this.fingerprint(system);
        if(fingerprint == this.#fingerprints.preaction) { 

            this.log.info(`revert(): Fingerprint matches, no need to revert.  Resetting state to preaction`);
            this._state = "preaction";
            return;
        }

        // We need to perform an actual reversion.  See if we match the postaction fingerprint
        if(fingerprint != this.#fingerprints.postaction) throw new Error(`Unable to revert - current fingerprint ${fingerprint} does not match postaction fingerprint ${this.#fingerprints.postaction}`);

        // Revert
        this.log.debug(`revert(): calling _revert()`);
        await this._revert(system, opts);

        // Take the fingerprint after we revert, make sure it matches what it was originally
        fingerprint = this.fingerprint(system);
        if(fingerprint != this.#fingerprints.preaction) throw new Error(`Revert failed - current fingerprint ${fingerprint} does not match preaction fingerprint ${this.#fingerprints.preaction}`);

    }

    

    /**
     * Evaluate
     * 
     * Evaluate the success of our action.
     * Throw an error if you believe the action or reversion failed.
     * Can also be used for post-action cleanup, statistics, etc.
     * Do not override me. Override _evaluate() instead!
     * 
     * @param {object} system the system being analyzed
     * @param {object} opts arbitrary options
     * @throws {Error} error on error
     * @fires Anomaly#activity
     * @returns {Promise} promise that resolves when the evaluation is complete
     */
    async evaluate(system, opts) {

        this.emit("activity", { anomaly: this, activity: "evaluate", progress: 0 });
        await this._evaluate(system, opts);
        this.emit("activity", { anomaly: this, activity: "evaluate", progress: 100 });
        this._state = "resolved";
    }

    /**
     * toJSON
     * 
     * Serialize this anomaly for storage.  By default, we serialize the following keys: #id, #name, #state, #log, #paused, #dirty, #fingerprint_keys
     * 
     * If you override this funciton, you should call super.serialize() and add your own keys to the result.
     * 
     * @param {array<string>} keys the keys to serialize
     * @returns {object} the JSON-ized object
     * @throws {Error} error on error
     */
    toJSON(keys = ["id","description","name", "state","history","paused","dirty","fingerprint_keys"]) {
            
            let obj = {};
    
            for(let key of keys) {
                obj[key] = this[key];
            }
    
            return obj;
    }

    /**
     * Snapshot
     * 
     * Take a snapshot of the system suitable for fingerprinting.
     * 
     * @param {object} system the system being analyzed
     * @returns {object} the snapshot
     */
    snapshot(system) {

        if(system === undefined) throw new Error(`system is undefined`);
        switch(system.constructor.name) {
            case "Object":
            case "Array":
            case "Map":
            case "Set":
                return system;
        }

        // Default
        throw new Error(`Unable to snapshot system of type ${system.constructor.name} - please override Anomaly.snapshot() in your derived class`);
    }


    /**
     * Fingerprint
     * 
     * Creates a SHA256 hash of the system's keys and values, using the set of keys that were specified in our constructor.
     * Skips keys that point to functions.
     * 
     * @param {object} system the system being analyzed
     * @returns {string} the fingerprint as a hex string
     * @throws {Error} error if we can't find a specified key
     */
    fingerprint(system) {

        // Get all keys from the system in alphabetical order (for consistency, since object key order is not guaranteed)
        let snapshot = this.snapshot(system);
        let keys = KeyExtractor.extract(snapshot).filter((key)=>key.type != "function" ).sort(Key.compare);

        // Filter out keys that are not in the list (if any)
        if(this.#fingerprint_keys !== null) { 

            let only = [...this.#fingerprint_keys];  // Copy so we can modify
            keys = keys.filter((key)=> { 
                
                // If the key is in `only`, remove it from `only` but keep the key
                let index = only.indexOf(key.fullname);
                if(index != -1) {
                    only.splice(index, 1);
                    return true;
                }

                // Not in `only`, remove the key
                return false;
            });

            // `only` should now be empty.  If not, we have a problem
            if(only.length > 0) throw new Error(`Unable to fingerprint - the following keys were not found: ${only.join(", ")}`);
        }

        // Create a set of tuples that contain the key/value pairs from the keys
        let tuples  = keys.map((key)=>[key.fullname, key.value]);

        // Convert tuples to a string
        let str = JSON.stringify(tuples);

        // Use crypto to calculate the hash
        let hash = crypto.createHash('sha256').update(str).digest('hex'); 
        return hash;
    }


    get [Symbol.toStringTag]() {
        return `Anomaly ${this.#name} (${this.#id}) { state: ${this.#state} }`;
    }

    /**
     * fingerprints (getter)
     * 
     * @return {object} fingerprints the fingerprints
     * @return {string} fingerprints.preaction the fingerprint before the action
     * @return {string} fingerprints.postaction the fingerprint after the action
     */
    get fingerprints() {

        return this.#fingerprints;
    }

    /**
     * fingerprint_keys (getter)
     * 
     * This is set in the constructor and can't be changed after instantiation (otherwise fingerprints would stop being reliable)
     * 
     * @return {array<string>} the keys that are used to generate fingerprints
     */
    get fingerprint_keys() {

        return this.#fingerprint_keys;
    }

    /**
     * dirty (getter)
     * 
     * This flag is set by the processor to indicate we failed somewhere during a state transition
     * 
     * @return {boolean} true if this anomaly is dirty
     */
    get dirty() {

        return this.#dirty;
    }

    /**
     * dirty (setter)
     * 
     * This flag is set by the processor to indicate we failed somewhere during a state transition
     * 
     * @param {boolean} dirty true if this anomaly is dirty
     */
    set dirty(dirty) {

        this.log.error(`dirty set to ${dirty}`);
        this.#dirty = dirty;
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
        
        let re = new RegExp(`^_state: changing state from \\w+ to ${state}$`, 'i');
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
        this.log.error("pause(): Paused becuase: "+reason);

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
        this.log.info("resume(): Resumed becuase: "+reason);

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

        this.log.debug(`_state: changing state from ${this.state} to ${state}`);
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