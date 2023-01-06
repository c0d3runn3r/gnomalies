const Gnomalies = require("../index.js");
const assert = require("assert");

// This Anomaly "fixes" lowercase letters.  Skipping normal class syntax for brevity here...
class EvilLowercase extends Gnomalies.Anomaly {}
EvilLowercase.detect = async (system, opts) => system.str.match(/[a-z]/)?true:false;
EvilLowercase.prototype.action = async (system, opts) => system.str = system.str.toUpperCase();

// This one turns sad faces into happy faces
class SadFace extends Gnomalies.Anomaly {}
SadFace.detect = async (system, opts) => system.str.match(/😔/)?true:false;
SadFace.prototype.action = async (system, opts) => system.str = system.str.replace(/😔/g, "🙂");

// Here is a system with things to fix
let system ={ str: "Hello World 😔" };

describe("Example 1", function() {

    it("Works as described", async function() {

        // Fix the system
        let processor = new Gnomalies.Processor([EvilLowercase, SadFace]);
        await processor.detect(system);  // processor.anomalies now contains relevant anomalies
        await processor.process(system);

        assert.equal(system.str, "HELLO WORLD 🙂", "Example 1 should work as described");
    });


});