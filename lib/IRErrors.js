class IRError extends Error {
    constructor(message,criticality=null) {
        super(message); 
        this.criticality = criticality;
    }
}

/**
 * NominalIRError
 * 
 * Throw this to show that a nominal error has occurred.  The appropriate error handler will be called to see if Impact Report processing can continue.
 * 
 * @alias module:ImpactReports.NominalIRError
 */
class NominalIRError extends IRError {

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
 * FatalIRError
 * 
 * Throw this to show that a fatal error has occurred.  Impact Report processing will stop and the report will be marked for manual review.
 * 
 * @alias module:ImpactReports.FatalIRError
 */
class FatalIRError extends IRError {

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

    NominalIRError : NominalIRError,
    FatalIRError : FatalIRError
};