const AnomalyReport  = require("./lib/AnomalyReport");
const ARErrors = require("./lib/ARErrors");

/**
 * @module AnomalyReports
 */

module.exports = exports = {
    AnomalyReport : AnomalyReport,
    NominalARError : ARErrors.NominalARError,
    FatalARError : ARErrors.FatalARError
};