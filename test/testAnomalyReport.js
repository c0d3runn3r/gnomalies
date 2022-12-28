const {AnomalyReport, ARErrors} = require("../index.js");
const assert = require("assert");


let report;


describe("AnomalyReport", function()  {

    this.beforeEach(function() {
        report = new AnomalyReport();
    });

    describe("constructor", function() {

        it("should start in preaction state", async function() {

            assert.equal(report.state, "Preaction", "initial state should be preaction");
        });

        it("should adopt any id passed in", async function() {

            report = new AnomalyReport({ id: "1234"});
            assert.equal(report.id, "1234", "id should be 1234");
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

        it("After an action, should return an array with one entry", async function() {

            await report.action();
            assert.equal(report.history.length, 1, "history should have one entry");
            assert.equal(report.history[0].type, "debug", "history should have one debug entry");
            assert.equal(report.history[0].message, "Changing state from Preaction to Actioning", "history should have one state change entry");
        });

    });

    describe("iterations()", function() {

        it("should return 0 if no state changes have occurred", async function() {

            assert.equal(report.iterations(), 0, "iterations should be 0");

        });

        it("should return 1 if one state change has occurred", async function() {

            await report.action();
            assert.equal(report.iterations(), 1, "iterations should be 1");
        });

        it("should return 2 if two state changes have occurred", async function() {

            await report.action();
            await report.action();
            assert.equal(report.iterations(), 2, "iterations should be 2");
        });
    });

    describe("action()", function() {

 
        it("should call _action() and set state to Actioning", async function() {

            let called = false;
            report._action = async function() {
                called = true;
            };
            await report.action();
            assert.equal(called, true, "_action() should have been called");
            assert.equal(report.state, "Actioning", "state should be Actioning");
        });

        it("should emit AnomalyReport#state", async function() {

            let res;
            let done = new Promise((resolve, reject) => {
                res = resolve;
            });

            report.on("state", (e) => {

                assert.equal(e.old_state, "Preaction", "old state should be Preaction");
                assert.equal(e.new_state, "Actioning", "new state should be Actioning");
                res();
            });
            await report.action();
            await done;

        });

        it("should call _recover_action() if _action() throws", async function() {

            report._action = async function() {
                throw new Error("test");
            }
            let called = false;
            report._recover_action = async function(e) {
                called = true;
                assert.equal(e.message, "test", "error should be test");
            }

            await report.action();
            assert.equal(called, true, "_recover_action() should have been called");
        });

    });

    describe("evaluate()", function() {
 
        it("should call _evaluate() and set state to Evaluating", async function() {

            let called = false;
            report._evaluate = async function() {
                called = true;
            };
            await report.evaluate();
            assert.equal(called, true, "_evaluate() should have been called");
            assert.equal(report.state, "Evaluating", "state should be Evaluating");
        });

        it("should emit AnomalyReport#state", async function() {

            let res;
            let done = new Promise((resolve, reject) => {
                res = resolve;
            });

            report.on("state", (e) => {

                assert.equal(e.new_state, "Evaluating", "new state should be Evaluating");
                res();
            });
            await report.evaluate();
            await done;

        });
    });

    describe("resolve()", function() {
 
        it("should call _resolve() and end in Resolved state", async function() {

            let called = false;
            report._resolve = async function() {
                called = true;
            };

            await report.resolve();
            assert.equal(called, true, "_resolve() should have been called");
            assert.equal(report.state, "Resolved", "state should be Resolving");
        });

        it("should emit AnomalyReport#state", async function() {

            let res;
            let done = new Promise((resolve, reject) => {
                res = resolve;
            });

            report.once("state", (e) => {

                assert.equal(e.new_state, "Resolving", "new state should be Resolving");

                report.once("state", (e) => {

                    assert.equal(e.old_state, "Resolving", "old state should be Resolving");
                    assert.equal(e.new_state, "Resolved", "new state should be Resolved");
                    res();
                });
            });
            await report.resolve();
            await done;

        });
    });

});
