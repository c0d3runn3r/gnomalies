class IRError extends Error {
    constructor(message,criticality=null) {
        super(message); 
        this.criticality = criticality;
    }
}

class NominalIRError extends IRError {
    constructor(message) {
        super(message, "nominal"); 
    }

    static matches(err) {
        return err.constructor.name == this.constructor.name;
    }
}

class FatalIRError extends IRError {
    constructor(message) {
        super(message, "fatal"); 
    }
}

module.exports = exports = {

    NominalIRError : NominalIRError,
    FatalIRError : FatalIRError
};