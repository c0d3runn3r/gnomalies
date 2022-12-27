# Impact Reports
Resolvable, recoverable deficiency management

```
async service_next() {

    const ir = this.#queue.shift();
    const params = {};

    await ir.action(params).then(ir => {
        return ir?.evaluate(params);
    }).then(ir => {
        return ir?.resolve(params);
    });

    if ( ir.state == "Queued" ) {
        this.#queue.push(ir);
    } else if ( ir.state != "Resolved" ) {
        // TODO
        await ir.force_review("Impact detector servicing ended in unexpected state "+ir.state, { ir_db:this.#ir_db }); // add db ref for auto-save
    }
}
```

## Impact Report (IR) Workflow

For each problem (impact) you would like to manage, create a class that derives from `ImpactReport.js`.  Override `_action()`, `_evaluate()`, and `_resolve()`; when your IR is processed, each one of these methods will be called in turn.  Your overridden functions are `async` and expected to the `throw` if there is a problem.   If this happens, your associated `_recover_` method will then be called.  If this also `throws`, the IR will be re-queued (go to `Queued` state) for a `NominalIRError` or go to `ManualReview` state for any other kind if error.

IRs have built in `.log.{debug|info|warn|error}()` methods, and it is recommended that you use this for logging since it allows the IR to keep a rich internal log of everything you are doing.  If your constructor was passed a logger with similarly named functions, that logger will also be automatically called when you call the built in logger. 

## Acknowledgements

Thanks to Dr. Jonathan Van Schenck for developing the Impact Report concept.  This project is based on his original class.

## License

Copyright (c) 2022 Nova Dynamics
