const Anomaly  = require("./lib/Anomaly");
const Processor = require("./lib/Processor");
const Errors = require("./lib/Errors");

/**
 * @module Gnomalies
 */

module.exports = exports = {
    Anomaly : Anomaly,
    Processor : Processor,
    NominalError : Errors.NominalARError,
    FatalError : Errors.FatalARError
};