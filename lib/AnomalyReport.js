const { EventEmitter } = require("events");
const ARErrors = require("./ARErrors");
const { v4: uuidv4 } = require('uuid');


/**
 * AnomalyReport
 * 
 * To use this class, extend it and override _action(), _evaluate(), _resolve() and optionally any _recover\_*() methods.
 * If you override _save(), it will be called after every state change.
 * 
 * @alias module:AnomalyReports.AnomalyReport
 */
class AnomalyReport extends EventEmitter {

    #logger;        // External logger to use (optional)
    #log;           // Internal log
    #data;          // Arbitrary user supplied data for this report
    #state;
    #id;            // A unique id for this report

    /**
     * constructor
     * 
     * @param {object} data the data for this anomaly report
     * @param {string} [data.id = uuidv4()] a unique id for this report
     * @param {object} logger a logger to use
     */
    constructor(data, logger) {
        super();

        this.#data = data;
        this.#logger = logger;
        this.#log = [];
        this.#id = data?.id ?? uuidv4();
        this.#state = "Preaction";

        // Ensure existance 
        this.type = this.constructor.name;

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
    /**
     * Detect
     * 
     * Detect an anomaly
     * Override me!
     * 
     * @param {object} data the data for this anomaly report (probably the system being analysed)
     * @param {string} [data.id = uuidv4()] a unique id for this report
     * @param {object} opts arbitrary options
     * @return {boolean} true if the anomaly is detected, false otherwise
     */
    static async _detect(data, opts) {

        throw new ARErrors.FatalARError("AnomalyReport._detect() not implemented - please override me!");
        return false;
    }

    //async _verify(opts) {}    // Optional, if you don't override, it will just skip this state
    async _action(opts) {}
    async _recover_action(err) { throw err }
    async _evaluate(opts) { return AnomalyReport._detect(this.data, opts); }
    async _recover_evaluate(err) { throw err }
    async _resolve(opts) {}
    async _recover_resolve(err) { throw err }
    async _save(opts) {}

    // ====================
    // Base Methods
    // ====================

    /**
     * Detect
     * 
     * Detect an anomaly
     * 
     * @param {object} data the data for this anomaly report (probably the system being analysed)
     * @param {string} [data.id = uuidv4()] a unique id for this report
     * @param {object} opts arbitrary options
     * @param {object} logger a logger to use if an anomaly report is created
     * @returns {AnomalyReport} an anomaly report if detected, null otherwise
     */
    static async detect(data, opts, logger) {

        if(await this._detect(opts) === true) {
            
            return new this(data, logger);
        }

        return null;
    }

    /**
     * allowed_states (getter)
     * 
     * @return {array} the allowed states
     */
    get allowed_states() {
        return ["Preaction","Verifying", "Actioning","Evaluating","Resolving","Resolved","Paused"];
    }

    /**
     * data (getter)
     * 
     * @return {object} the data for this anomaly report
     */
    get data() {
        return this.#data;
    }

    /**
     * id (getter)
     * 
     * @return {string} the id for this anomaly report
     */
    get id() {

        return this.#id;
    }

    /**
     * Log (getter)
     * 
     * @return {array} the log for this anomaly report
     */
    get history() {

        return this.#log;
    }

    // toJSON() {
    //     return Object.assign({
    //         id : this.id,
    //         created : this.created,
    //         type : this.type,
    //         state : this.#state,
    //     },this.#data);
    // }

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
     * @return {string} the state of the anomaly report
     */
    get state() {
        return this.#state;
    }


    /**
     * verify
     * 
     * Verify the anomaly report prior to actioning
     * 
     * Mostly useful in cases where things might have changed since the report was created
     * Only does anything if you have included a _verify() method
     * 
     * @param {object} opts options for this process
     * @fires AnomalyReport#state
     * @return {AnomalyReport} this if successful, otherwise null
     */
    async verify(opts) {

        // If we don't have a verify method, just return
        if(typeof(this._verify) !== "function") return this;

        this._set_state("Verifying");
        try {

            await this._verify(opts);

        } catch (e) {

            return this._handle_error(e,"action");
        }
        return this;
    }

    /**
     * action
     * 
     * Action the anomaly report
     * 
     * @param {object} opts options for this process
     * @fires AnomalyReport#state
     * @return {AnomalyReport} this if successful, otherwise null
     */
    async action(opts) {
        this._set_state("Actioning");
        try {

            await this._action(opts).catch(e => this._recover_action(e));
            await this._save(opts);
        } catch (e) {

            return this._handle_error(e,"action");
        }
        return this;
    }

    /**
     * evaluate
     * 
     * Action the anomaly report
     * 
     * @param {object} opts options for this process
     * @fires AnomalyReport#state
     * @return {AnomalyReport} this if successful, otherwise null
     */
    async evaluate(opts) {
        this._set_state("Evaluating");
        try {

            await this._evaluate(opts).catch(e => this._recover_evaluate(e));
            await this._save(opts);
        } catch (e) {

            return this._handle_error(e,"evaluate");
        }
        return this;
    }

    /**
     * resolve
     * 
     * Action the anomaly report
     * 
     * @param {object} opts options for this process
     * @fires AnomalyReport#state
     * @return {AnomalyReport} this if successful, otherwise null
     */
    async resolve(opts) {
        this._set_state("Resolving");
        try {

            await this._resolve(opts).catch(e => this._recover_resolve(e));
            await this._save(opts);

        } catch (e) {

            return this._handle_error(e,"resolve");
        }
        this._set_state("Resolved");
        this.log.info("Resolved");
        return this;
    }

    /**
     * pause()
     * 
     * Set the anomaly report to Paused state
     * 
     * @param {string} reason the reason for the pause
     * @param {object} opts options for this process
     * @returns {AnomalyReport} this anomaly report
     */
    async pause(reason, opts) {

        this.log.error("Paused becuase: "+reason);
        this._set_state("Paused");
        await this._save(opts);
        return this;
    }

    /**
     * force_resolve()
     * 
     * Force the anomaly report to Resolved state
     * 
     * @param {string} reason the reason for the force resolve
     * @param {object} opts options for this process
     * @returns {AnomalyReport} this anomaly report
     */
    async force_resolve(reason, opts) {

        this.log.warn("Forced to resolved becuase: "+reason);
        this._set_state("Resolved");
        await this._save(opts);
        return this;
    }

    /**
     * Save
     * 
     * @returns {AnomalyReport} this
     */
    async save() {

        // Call the overridden save method
        await this._save();
        return this;
    }
    
    // ====================
    // Private Methods
    // ====================

    /**
     * _log_type    
     * 
     * @private
     * @param {string} type one of debug, info, warn, error
     * @param {string} string the string to log
     * @param {object} payload an arbitrary object to log
     * @fires AnomalyReport#error_log
     */
    _log_type(type, string, payload={}) {

        // Save to our internal log
        this.#log.push({
            id : this.id,
            timestamp : (new Date()).toISOString(),
            type : type,
            message : string,
            data : payload
        });

        // Log to the logger
        if ( this.#logger ) this.#logger[type](string);

        // Emit AnomalyReport#error_log if it is an error
        if ( type == "error" ) {

            /**
             * @event AnomalyReport#error_log
             * @property {object} payload the associated payload
             */
            this.emit("error_log", payload);
        }
    }

    /**
     * _set_state
     * 
     * Set the state of the anomaly report
     * 
     * @private
     * @param {string} state the new state
     * @throws {FatalARError} if the state is not allowed
     * @fires AnomalyReport#state
     */
    _set_state(state) {

        // Check if the state is allowed
        if ( !this.allowed_states.includes(state) ) throw new ARErrors.FatalARError(`State ${state} is not allowed`);

        this.log.debug(`Changing state from ${this.state} to ${state}`);
        let old_state = this.#state;
        this.#state = state; 

        /**
         * @event AnomalyReport#state
         * @type {object}
         * @property {string} new_state the new state
         * @property {string} old_state the old state
         */
        this.emit("state", { new_state:state, old_state:old_state });
    }    

    /**
     * _handle_error
     * 
     * A non-recoverable error has occurred
     * 
     * @private
     * @param {Error} e the error
     * @param {string} call the call that caused the error, e.g. "action"
     * @returns {null}
     */
    _handle_error(e, call) {
        switch (e.criticality) {
            case "nominal":
                this.log.error("Nominal Error", { inside:call, message:e.message, stack:e.message });
                this._set_state("Preaction");
                break;
            case "fatal":
                this.log.error("Fatal Error", { inside:call, message:e.message, stack:e.message });
                this._set_state("Paused");
                break;
            default:
                this.log.error("Runtime error", { inside:call, message:e.message, stack:e.stack });
                this._set_state("Paused");
                break;
        }
        return null;
    }


}


module.exports = exports = AnomalyReport;