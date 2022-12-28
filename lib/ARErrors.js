class ARError extends Error {
    constructor(message,criticality=null) {
        super(message); 
        this.criticality = criticality;
    }
}

/**
 * NominalARError
 * 
 * Throw this to show that a nominal error has occurred.  The appropriate error handler will be called to see if Anomaly Report processing can continue.
 * 
 * @alias module:AnomalyReports.NominalARError
 */
class NominalARError extends ARError {

    /**
     * @constructor
     * 
     * @param {string} message the error message
     */
    constructor(message) {
        super(message, "nominal"); 
    }

    static matches(err) {
        return err.constructor.name == this.constructor.name;
    }
}

/**
 * FatalARError
 * 
 * Throw this to show that a fatal error has occurred.  Anomaly Report processing will stop and the report will be marked for manual review.
 * 
 * @alias module:AnomalyReports.FatalARError
 */
class FatalARError extends ARError {

    /**
     * @constructor
     * 
     * @param {string} message the error message
     */
    constructor(message) {
        super(message, "fatal"); 
    }
}

module.exports = exports = {

    NominalARError : NominalARError,
    FatalARError : FatalARError
};