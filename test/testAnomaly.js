const { Anomaly } = require("../index.js");
const assert = require("assert");


let report;


describe("AnomalyReport", function()  {

    this.beforeEach(function() {
        report = new Anomaly();
    });

    describe("constructor", function() {

        it("should start in preaction state", async function() {

            assert.equal(report.state, "Preaction", "initial state should be preaction");
        });

        it("should self assign a v4 uuid if no id is passed in", async function() {

            assert.equal(report.id.length, 36, "id should be a uuid");
        });
    });

    describe(".history", function() {

        it("should initially return an empty array", async function() {

            assert.equal(Array.isArray(report.history), true, "history should be an array");
            assert.equal(report.history.length, 0, "history should be empty");
        });

        it("After a log message, should return an array with one entry", async function() {

            report.log.debug("This is a test");
            assert.equal(report.history.length, 1, "history should have one entry");
            assert.equal(report.history[0].type, "debug", "history should have one debug entry");
            assert.equal(report.history[0].message, "This is a test", "history should have an entry with the correct message");
        });

    });

    describe("iterations()", function() {

        it("should return 0 if no state changes have occurred", async function() {

            assert.equal(report.iterations(), 0, "iterations should be 0");

        });

        it("should return 1 if one state change has occurred", async function() {

            report._state = "Postaction";
            assert.equal(report.iterations("Postaction"), 1, "iterations should be 1");
        });

        it("should return 2 if two state changes have occurred", async function() {

            report._state = "Postaction";
            report._state = "Resolved";
            report._state = "Postaction";
            assert.equal(report.iterations("Postaction"), 2, "iterations should be 2");
        });
    });

    describe("_state (private setter)", function() {

        it("should emit AnomalyReport#state when state changes", async function() {

            let res;
            let done = new Promise((resolve, reject) => {
                res = resolve;
            });

            report.on("state", (e) => {

                assert.equal(e.old_state, "Preaction", "old state should be Preaction");
                assert.equal(e.new_state, "Postaction", "new state should be Postaction");
                res();
            });
            report._state = "Postaction";
            await done;
        });
    });

});
