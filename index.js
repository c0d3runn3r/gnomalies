const ImpactReport  = require("./lib/ImpactReport");
const IRErrors = require("./lib/IRErrors");

/**
 * @module ImpactReports
 */

module.exports = exports = {
    ImpactReport : ImpactReport,
    NominalIRError : IRErrors.NominalIRError,
    FatalIRError : IRErrors.FatalIRError
};