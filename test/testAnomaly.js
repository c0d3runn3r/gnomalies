const { Anomaly } = require("../index.js");
const assert = require("assert");


let report;


describe("Anomaly", function()  {

    this.beforeEach(function() {
        report = new Anomaly();
    });

    describe("constructor", function() {

        it("should start in preaction state", async function() {

            assert.equal(report.state, "preaction", "initial state should be preaction");
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

            report._state = "postaction";
            assert.equal(report.iterations("postaction"), 1, "iterations should be 1");
        });

        it("should return 2 if two state changes have occurred", async function() {

            report._state = "postaction";
            report._state = "resolved";
            report._state = "postaction";
            assert.equal(report.iterations("postaction"), 2, "iterations should be 2");
        });
    });

    describe("_state (private setter)", function() {

        it("should emit AnomalyReport#state when state changes", async function() {

            let res;
            let done = new Promise((resolve, reject) => {
                res = resolve;
            });

            report.on("state", (e) => {

                assert.equal(e.old_state, "preaction", "old state should be preaction");
                assert.equal(e.new_state, "postaction", "new state should be postaction");
                res();
            });
            report._state = "postaction";
            await done;
        });
    });

    describe("fingerprint()", function() {

        it("should return a string of length 32", async function() {

            let system = { message: "hello there", score:  32 };
            assert.equal(typeof report.fingerprint(system), "string", "fingerprint should be a string");
            assert.equal(report.fingerprint(system).length, 64, "fingerprint should be 64 characters long");
        });

        it("changing the system should result in a different fingerprint", async function() {

            let system = { message: "hello there", score:  32 };
            let a = report.fingerprint(system);
            system.message = "hello there again";
            let b = report.fingerprint(system);
            assert.notEqual(a, b, "fingerprint should be different");
        });

        it("changing a non watched key should not result in a different fingerprint", async function() {
                
                let system = { message: "hello there", score:  32 };
                let a = report.fingerprint(system, ["message"]);
                system.score = 33;
                let b = report.fingerprint(system, ["message"]);
                assert.equal(a, b, "fingerprint should be the same");
        });

    });

});
