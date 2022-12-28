const { EventEmitter } = require("events");
const IRErrors = require("./IRErrors");
const { v4: uuidv4 } = require('uuid');



class ImpactReport extends EventEmitter {

    #logger;        // External logger to use (optional)
    #log;           // Internal log
    #data;          // Arbitrary user supplied data for this report
    #state;
    #id;            // A unique id for this report

    /**
     * constructor
     * 
     * @param {object} data the data for this impact report
     * @param {object} logger a logger to use
     */
    constructor(data, logger) {
        super();

        this.#data = data;
        this.#logger = logger;
        this.#log = [];
        this.#id = uuidv4();

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
    async _action(opts) {}
    async _recover_action(err) { throw err }
    async _evaluate(opts) {}
    async _recover_evaluate(err) { throw err }
    async _resolve(opts) {}
    async _recover_resolve(err) { throw err }
    async _save(opts) {}

    // ====================
    // Base Methods
    // ====================

    /**
     * allowed_states (getter)
     * 
     * @return {array} the allowed states
     */
    get allowed_states() {
        return ["Queued","Actioning","Evaluating","Resolving","Resolved","ManualReview"];
    }

    /**
     * data (getter)
     * 
     * @return {object} the data for this impact report
     */
    get data() {
        return this.#data;
    }

    /**
     * id (getter)
     * 
     * @return {string} the id for this impact report
     */
    get id() {

        return this.#id;
    }

    /**
     * Log (getter)
     * 
     * @return {array} the log for this impact report
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
     * state (getter)
     * 
     * @return {string} the state of the impact report
     */
    get state() {
        return this.#state;
    }

    /**
     * action
     * 
     * Action the impact report
     * 
     * @param {object} opts optoons for this process
     * @fires ImpactReport#state
     * @return {ImpactReport} this if successful, otherwise null
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
     * Action the impact report
     * 
     * @param {object} opts optoons for this process
     * @fires ImpactReport#state
     * @return {ImpactReport} this if successful, otherwise null
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
     * Action the impact report
     * 
     * @param {object} opts options for this process
     * @fires ImpactReport#state
     * @return {ImpactReport} this if successful, otherwise null
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
     * force_review()
     * 
     * Force the impact report to ManualReview state
     * 
     * @param {string} reason the reason for the manual review
     * @param {object} opts options for this process
     * @returns {ImpactReport} this impact report
     */
    async force_review(reason, opts) {

        this.log.error("Forced to manual review becuase: "+reason);
        this._set_state("ManualReview");
        await this._save(opts);
        return this;
    }

    /**
     * force_resolve()
     * 
     * Force the impact report to Resolved state
     * 
     * @param {string} reason the reason for the force resolve
     * @param {object} opts options for this process
     * @returns {ImpactReport} this impact report
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
     * @returns {ImpactReport} this
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
     * @fires ImpactReport#error_log
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

        // Emit ImpactReport#error_log if it is an error
        if ( type == "error" ) {

            /**
             * @event ImpactReport#error_log
             * @property {object} payload the associated payload
             */
            this.emit("error_log", payload);
        }
    }

    /**
     * _set_state
     * 
     * Set the state of the impact report
     * 
     * @private
     * @param {string} state the new state
     * @throws {FatalIRError} if the state is not allowed
     * @fires ImpactReport#state
     */
    _set_state(state) {

        // Check if the state is allowed
        if ( !this.allowed_states.includes(state) ) throw new IRErrors.FatalIRError(`State ${state} is not allowed`);

        this.log.debug(`Changing state from ${this.state} to ${state}`);
        let old_state = this.#state;
        this.#state = state; 

        /**
         * @event ImpactReport#state
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
                this._set_state("Queued");
                break;
            case "fatal":
                this.log.error("Fatal Error", { inside:call, message:e.message, stack:e.message });
                this._set_state("ManualReview");
                break;
            default:
                this.log.error("Runtime error", { inside:call, message:e.message, stack:e.stack });
                this._set_state("ManualReview");
                break;
        }
        return null;
    }


}


module.exports = exports = ImpactReport;