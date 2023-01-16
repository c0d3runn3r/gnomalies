const Gnomalies = require("../index.js");

// This Anomaly "fixes" lowercase letters.  Skipping normal class syntax for brevity here...
class EvilLowercase extends Gnomalies.Anomaly {}
EvilLowercase._detect = async (system, opts) => system.str.match(/[a-z]/)?true:false;
EvilLowercase.prototype._action = async (system, opts) => system.str = system.str.toUpperCase();

// This one turns sad faces into happy faces
class SadFace extends Gnomalies.Anomaly {}
SadFace._detect = async (system, opts) => system.str.match(/😔/)?true:false;
SadFace.prototype._action = async (system, opts) => system.str = system.str.replace(/😔/g, "🙂");

// Here is a system with things to fix
let system ={ str: "Hello World 😔" };

(async ()=>{

    // Fix the system
    let processor = new Gnomalies.Processor([EvilLowercase, SadFace]);
    await processor.detect(system);  // processor.anomalies now contains relevant anomalies
    await processor.process(system);

    console.log(system.str); // "HELLO WORLD"

})();

