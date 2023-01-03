const { Anomaly } = require("../index.js");
const assert = require("assert");


let anomaly;


describe("Anomaly", function()  {

    this.beforeEach(function() {
        anomaly = new Anomaly();
    });

    describe("constructor", function() {

        it("should start in preaction state", async function() {

            assert.equal(anomaly.state, "preaction", "initial state should be preaction");
        });

        it("should self assign a v4 uuid if no id is passed in", async function() {

            assert.equal(anomaly.id.length, 36, "id should be a uuid");
        });
    });

    describe(".history", function() {

        it("should initially return an empty array", async function() {

            assert.equal(Array.isArray(anomaly.history), true, "history should be an array");
            assert.equal(anomaly.history.length, 0, "history should be empty");
        });

        it("After a log message, should return an array with one entry", async function() {

            anomaly.log.debug("This is a test");
            assert.equal(anomaly.history.length, 1, "history should have one entry");
            assert.equal(anomaly.history[0].type, "debug", "history should have one debug entry");
            assert.equal(anomaly.history[0].message, "This is a test", "history should have an entry with the correct message");
        });

    });

    describe("iterations()", function() {

        it("should return 0 if no state changes have occurred", async function() {

            assert.equal(anomaly.iterations(), 0, "iterations should be 0");

        });

        it("should return 1 if one state change has occurred", async function() {

            anomaly._state = "postaction";
            assert.equal(anomaly.iterations("postaction"), 1, "iterations should be 1");
        });

        it("should return 2 if two state changes have occurred", async function() {

            anomaly._state = "postaction";
            anomaly._state = "resolved";
            anomaly._state = "postaction";
            assert.equal(anomaly.iterations("postaction"), 2, "iterations should be 2");
        });
    });

    describe("_state (private setter)", function() {

        it("should emit AnomalyReport#state when state changes", async function() {

            let res;
            let done = new Promise((resolve, reject) => {
                res = resolve;
            });

            anomaly.on("state", (e) => {

                assert.equal(e.old_state, "preaction", "old state should be preaction");
                assert.equal(e.new_state, "postaction", "new state should be postaction");
                res();
            });
            anomaly._state = "postaction";
            await done;
        });
    });

    describe("fingerprint()", function() {

        it("should return a string of length 32", async function() {

            let system = { message: "hello there", score:  32 };
            assert.equal(typeof anomaly.fingerprint(system), "string", "fingerprint should be a string");
            assert.equal(anomaly.fingerprint(system).length, 64, "fingerprint should be 64 characters long");
        });

        it("changing the system should result in a different fingerprint", async function() {

            let system = { message: "hello there", score:  32 };
            let a = anomaly.fingerprint(system);
            system.message = "hello there again";
            let b = anomaly.fingerprint(system);
            assert.notEqual(a, b, "fingerprint should be different");
        });

        it("changing a non watched key should not result in a different fingerprint", async function() {
                
                let system = { message: "hello there", score:  32 };
                let a = anomaly.fingerprint(system, ["message"]);
                system.score = 33;
                let b = anomaly.fingerprint(system, ["message"]);
                assert.equal(a, b, "fingerprint should be the same");
        });

    });

    describe("action()", function() {

        it("fingerprints the system and stores the results in .fingerprint", async function() {
            
            
            let system = { message: "hello there", score:  32 };
            await anomaly.action(system);
            assert.equal(anomaly.fingerprints.preaction, "3531ad0cae796eca7981c574fd63bf761781e19afccb3d00e48fe638c16919a3", "preaction fingerprint should be the same each time");
            assert.equal(anomaly.fingerprints.postaction, "3531ad0cae796eca7981c574fd63bf761781e19afccb3d00e48fe638c16919a3", "postaction fingerprint should be the same as preaction since nothing was changed");
        });

        it("should throw an error if the system is not in a preaction state", async function() {
                
            let system = { message: "hello there", score:  32 };
            await anomaly.action(system);
            await assert.rejects(anomaly.action(system), { message: "Cannot action an anomaly not in a preaction state" });
        });

    });

    describe ("revert()", function() {

        it("should throw an error if fingerprint does not match preaction fingerprint", async function() {

            let system = { message: "hello there", score:  32 };
            await anomaly.action(system);
            system.message = "hello there again";
            await assert.rejects(anomaly.revert(system), { message: "Fingerprint mismatch: 9f6a95948a9e877b7886f4d39240d87037c4de20db296337b6a25a3ed05170a2 != 3531ad0cae796eca7981c574fd63bf761781e19afccb3d00e48fe638c16919a3" });
        });
    });

});
