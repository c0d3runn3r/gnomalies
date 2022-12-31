const Anomalies = require("./index.js");
const assert = require("assert");

class FixLowercase extends Anomalies.Anomaly {

    // Detect lowercase letters (we've decided to make system a string)
    static async detect(system, opts) {
        
        return system.str.match(/[a-z]/)?true:false;
    }

    async action (system, opts) {

        // Fix the lowercase letters
        system.str = system.str.toUpperCase();
    }
}

(async ()=>{

    // Create a new processor that can detect lowercase letters
    let processor = new Anomalies.Processor(/* logger */);
    processor.classes.push(FixLowercase);
    processor.on("log", (o) => console.log(`${o.anomaly.name} ${o.type}: ${o.message}`));
    processor.on("activity", (o) => console.log(o.anomaly.name, o.activity, o.progress));

    // Create a system 
    let system = { str: "Hello World" };

    // Detect anomalies
    processor.detect(system);
    assert(processor.anomalies.length == 1);

    // Process anomalies
    let anomaly = null;
    do {
        anomaly = await processor.process(system);
    } while(anomaly);

    console.log(system.str); // "HELLO WORLD"

})();

