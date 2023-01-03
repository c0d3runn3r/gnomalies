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

        it("calls overloaded _process() for each class", async function() {
            
            let called = true;
            class TestAnomaly extends Anomaly {}
            TestAnomaly._process = function() { called = true; return false;}

            const processor = new Processor();
            processor.anomalies.push(new TestAnomaly());
            await processor.process();

            assert.equal(called, true, "process() should have been called");
        });

    });

});