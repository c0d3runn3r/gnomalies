const { Anomaly, Processor } = require("../index.js");
const assert = require("assert");


describe("Processor", function() {

    describe("detect()", function() {

        it("calls overloaded _detect() for each class", async function() {
            
            let called = true;
            class TestAnomaly extends Anomaly {}
            TestAnomaly._detect = function() { called = true; return false;}

            const processor = new Processor([TestAnomaly]);
            await processor.detect();

            assert.equal(called, true, "detect() should have been called");
        });

        it("instantiates objects when overloaded _detect returns true", async function() {
            
            class TestAnomaly extends Anomaly {}
            TestAnomaly._detect = function() { return true;}

            const processor = new Processor([TestAnomaly]);
            await processor.detect();

            assert.equal(processor.anomalies.length, 1, "detect() should have instantiated an object");
            assert(processor.anomalies[0] instanceof TestAnomaly, "detect() should have instantiated the correct object");
        });
    });

    describe("process()", function() {

        it("calls overloaded _action() for each class", async function() {
            
            let called = false;
            class TestAnomaly extends Anomaly {}
            TestAnomaly.prototype._action = async function() { called = true; return false;}

            const processor = new Processor();
            processor.anomalies.push(new TestAnomaly());
            await processor.process({});
            assert.equal(called, true, "_action() should have been called");
        });

        it("if _action() throws but no change, _revert is not called", async function() {

            let called = false;
            class TestAnomaly extends Anomaly {}
            TestAnomaly.prototype._action = async function() { throw new Error("test"); }
            TestAnomaly.prototype._revert = async function() { called = true; }

            const processor = new Processor();
            processor.anomalies.push(new TestAnomaly());
            await processor.process({ "test": "test" });
            assert.equal(called, false, "_revert() was not called since no change was made and no reversion is needed");
        });

        it("if _action() throws after change, _revert() is called", async function() {

            let called = false;
            class TestAnomaly extends Anomaly {}
            TestAnomaly.prototype._action = async function(system) { system.test = "modified"; throw new Error("test"); }
            TestAnomaly.prototype._revert = async function() { called = true; }

            const processor = new Processor();
            processor.anomalies.push(new TestAnomaly());
            await processor.process({ "test": "test" });
            
            assert.equal(called, true, "_revert() was called since a change was made");
        });

        it("anomaly is paused dirty if _revert() does not properly revert after _action throws", async function() {
                
                class TestAnomaly extends Anomaly {}
                TestAnomaly.prototype._action = async function(system) { system.test = "modified"; throw new Error("test"); }
    
                const processor = new Processor();
                processor.anomalies.push(new TestAnomaly());
                await processor.process({ "test": "test" });
                
                assert.equal(processor.anomalies[0].paused, true, "anomaly was paused due to throw in _action()");
                assert.equal(processor.anomalies[0].dirty, true, "anomaly was dirty due to improper reversion");
        });

        it("anomaly is paused clean if _revert() does not properly revert after _action throws", async function() {
                
            class TestAnomaly extends Anomaly {}
            TestAnomaly.prototype._action = async function(system) { system.test = "modified"; throw new Error("test"); }
            TestAnomaly.prototype._revert = async function(system) { system.test = "test"; }

            const processor = new Processor();
            processor.anomalies.push(new TestAnomaly());
            await processor.process({ "test": "test" });
            
            assert.equal(processor.anomalies[0].paused, true, "anomaly was paused due to throw in _action()");
            assert.equal(processor.anomalies[0].dirty, false, "anomaly was clean due to proper reversion");
    });

    });

});