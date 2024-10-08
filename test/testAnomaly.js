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
            assert.notEqual(a, b, `fingerprint should be different (${a} vs ${b})`);
        });

        it("changing a non watched key should not result in a different fingerprint", async function() {
                
                let system = { message: "hello there", score:  32 };
                let my_anomaly = new Anomaly({fingerprint_keys: ["message"]});
                let a = my_anomaly.fingerprint(system);
                system.score = 33;
                let b = my_anomaly.fingerprint(system);
                assert.equal(a, b, "fingerprint should be the same");
        });

    });

    describe("action()", function() {

        it("fingerprints the system and stores the results in .fingerprint", async function() {
            
            
            let system = { message: "hello there", score:  32 };
            await anomaly.action(system);
            assert.equal(anomaly.fingerprints.preaction, "04c115f9840d916b37e6364c18bdbf9f8760b779b16afb83c4add99ae6b5ae12", "preaction fingerprint should be the same each time");
            assert.equal(anomaly.fingerprints.postaction, "04c115f9840d916b37e6364c18bdbf9f8760b779b16afb83c4add99ae6b5ae12", "postaction fingerprint should be the same as preaction since nothing was changed");
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
            await assert.rejects(anomaly.revert(system), { message: "Unable to revert - current fingerprint 8382107af85ed8b8eb50cbd8673d79f1c52466965001a2156640d16f2efd532f does not match postaction fingerprint 04c115f9840d916b37e6364c18bdbf9f8760b779b16afb83c4add99ae6b5ae12" });
        });
    });

    describe("toJSON() / deserialization using the constructor", function() {

        let before, after, json, system;
        class SomeAnomaly extends Anomaly {}

        this.beforeEach(function(){

            before = new SomeAnomaly({fingerprint_keys: ["message"]});
            system = { message: "hello there", score:  32 };
            json = JSON.stringify(before.toJSON());
            after = new SomeAnomaly(JSON.parse(json));
        });
        
        it("results in a new object of the correct class", async function() {

            assert.notEqual(before, after, "before and after should not be the same object");
            assert.equal(after.name, "SomeAnomaly", "after should be an instance of SomeAnomaly");
        });

        it("serialized data contains .name of the class", async function() {

            assert.equal(JSON.parse(json).name, "SomeAnomaly", "before should be an instance of SomeAnomaly");
        });

        it(".id is unchanged", async function() {

            assert.equal(before.id, after.id, "before and after should have the same id");
        });

        it(".description is unchanged", async function() {

            assert.equal(before.description, after.description, "before and after should have the same description");
            assert.equal(before.state, after.state, "before and after should have the same state");
            assert.equal(before.paused, after.paused, "before and after should have the same paused");
            assert.equal(before.dirty, after.dirty, "before and after should have the same dirty");
            assert.deepEqual(before.fingerprint_keys, after.fingerprint_keys, "before and after should have the same fingerprint_keys");
            assert.deepEqual(before.fingerprints, after.fingerprints, "before and after should have the same fingerprints");
        });

        it(".state is unchanged", async function() {

            assert.equal(before.state, after.state, "before and after should have the same state");
        });

        it(".paused is unchanged", async function() {

            assert.equal(before.paused, after.paused, "before and after should have the same paused");
        });

        it(".dirty is unchanged", async function() {

            assert.equal(before.dirty, after.dirty, "before and after should have the same dirty");
        });

        it(".fingerprint_keys are unchanged", async function() {

            assert.deepEqual(before.fingerprint_keys, after.fingerprint_keys, "before and after should have the same fingerprint_keys");
        });

        it(".fingerprints are unchanged", async function() {

            assert.deepEqual(before.fingerprints, after.fingerprints, "before and after should have the same fingerprints");
        });


    });


});
