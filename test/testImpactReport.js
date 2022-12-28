const {ImpactReport, IRErrors} = require("../index.js");
const assert = require("assert");


let report;


describe("ImpactReport", function()  {

    this.beforeEach(function() {
        report = new ImpactReport();
    });

    describe("constructor", function() {

        it("should start in unknown state", async function() {

            assert.equal(report.state, undefined, "initial state should be undefined");
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

        it("should emit ImpactReport#state", async function() {

            let res;
            let done = new Promise((resolve, reject) => {
                res = resolve;
            });

            report.on("state", (e) => {

                assert.equal(e.old_state, undefined, "old state should be undefined");
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
            console.log(report.history);
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

        it("should emit ImpactReport#state", async function() {

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

        it("should emit ImpactReport#state", async function() {

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
