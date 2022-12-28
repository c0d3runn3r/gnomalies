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

## Table of Contents

<!-- toc -->

- [Impact Report (IR) Workflow](#impact-report-ir-workflow)
- [Acknowledgements](#acknowledgements)
- [License](#license)
- [API](#api)
  * [ImpactReport](#impactreport)

<!-- tocstop -->

## Impact Report (IR) Workflow

For each problem (impact) you would like to manage, create a class that derives from `ImpactReport.js`.  Override `_action()`, `_evaluate()`, and `_resolve()`; when your IR is processed, each one of these methods will be called in turn.  Your overridden functions are `async` and expected to the `throw` if there is a problem.   If this happens, your associated `_recover_` method will then be called.  If this also `throws`, the IR will be re-queued (go to `Queued` state) for a `NominalIRError` or go to `ManualReview` state for any other kind if error.

IRs have built in `.log.{debug|info|warn|error}()` methods, and it is recommended that you use this for logging since it allows the IR to keep a rich internal log of everything you are doing.  If your constructor was passed a logger with similarly named functions, that logger will also be automatically called when you call the built in logger. 

## Acknowledgements

Thanks to Dr. Jonathan Van Schenck for developing the Impact Report concept.  This project is based on his original class.

## License

Copyright (c) 2022 Nova Dynamics

## API

<!-- api -->

<a name="ImpactReport"></a>

### ImpactReport
**Kind**: global class  

* [ImpactReport](#ImpactReport)
    * [new ImpactReport(data, logger)](#new_ImpactReport_new)
    * [.allowed_states](#ImpactReport+allowed_states) ⇒ <code>array</code>
    * [.data](#ImpactReport+data) ⇒ <code>object</code>
    * [.id](#ImpactReport+id) ⇒ <code>string</code>
    * [.history](#ImpactReport+history) ⇒ <code>array</code>
    * [.state](#ImpactReport+state) ⇒ <code>string</code>
    * [.action(opts)](#ImpactReport+action) ⇒ [<code>ImpactReport</code>](#ImpactReport)
    * [.evaluate(opts)](#ImpactReport+evaluate) ⇒ [<code>ImpactReport</code>](#ImpactReport)
    * [.resolve(opts)](#ImpactReport+resolve) ⇒ [<code>ImpactReport</code>](#ImpactReport)
    * [.force_review(reason, opts)](#ImpactReport+force_review) ⇒ [<code>ImpactReport</code>](#ImpactReport)
    * [.force_resolve(reason, opts)](#ImpactReport+force_resolve) ⇒ [<code>ImpactReport</code>](#ImpactReport)
    * [.save()](#ImpactReport+save) ⇒ [<code>ImpactReport</code>](#ImpactReport)
    * ["error_log"](#ImpactReport+event_error_log)
    * ["state"](#ImpactReport+event_state)

<a name="new_ImpactReport_new"></a>

#### new ImpactReport(data, logger)
constructor


| Param | Type | Description |
| --- | --- | --- |
| data | <code>object</code> | the data for this impact report |
| logger | <code>object</code> | a logger to use |

<a name="ImpactReport+allowed_states"></a>

#### impactReport.allowed\_states ⇒ <code>array</code>
allowed_states (getter)

**Kind**: instance property of [<code>ImpactReport</code>](#ImpactReport)  
**Returns**: <code>array</code> - the allowed states  
<a name="ImpactReport+data"></a>

#### impactReport.data ⇒ <code>object</code>
data (getter)

**Kind**: instance property of [<code>ImpactReport</code>](#ImpactReport)  
**Returns**: <code>object</code> - the data for this impact report  
<a name="ImpactReport+id"></a>

#### impactReport.id ⇒ <code>string</code>
id (getter)

**Kind**: instance property of [<code>ImpactReport</code>](#ImpactReport)  
**Returns**: <code>string</code> - the id for this impact report  
<a name="ImpactReport+history"></a>

#### impactReport.history ⇒ <code>array</code>
Log (getter)

**Kind**: instance property of [<code>ImpactReport</code>](#ImpactReport)  
**Returns**: <code>array</code> - the log for this impact report  
<a name="ImpactReport+state"></a>

#### impactReport.state ⇒ <code>string</code>
state (getter)

**Kind**: instance property of [<code>ImpactReport</code>](#ImpactReport)  
**Returns**: <code>string</code> - the state of the impact report  
<a name="ImpactReport+action"></a>

#### impactReport.action(opts) ⇒ [<code>ImpactReport</code>](#ImpactReport)
action

Action the impact report

**Kind**: instance method of [<code>ImpactReport</code>](#ImpactReport)  
**Returns**: [<code>ImpactReport</code>](#ImpactReport) - this if successful, otherwise null  
**Emits**: [<code>state</code>](#ImpactReport+event_state)  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | optoons for this process |

<a name="ImpactReport+evaluate"></a>

#### impactReport.evaluate(opts) ⇒ [<code>ImpactReport</code>](#ImpactReport)
evaluate

Action the impact report

**Kind**: instance method of [<code>ImpactReport</code>](#ImpactReport)  
**Returns**: [<code>ImpactReport</code>](#ImpactReport) - this if successful, otherwise null  
**Emits**: [<code>state</code>](#ImpactReport+event_state)  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | optoons for this process |

<a name="ImpactReport+resolve"></a>

#### impactReport.resolve(opts) ⇒ [<code>ImpactReport</code>](#ImpactReport)
resolve

Action the impact report

**Kind**: instance method of [<code>ImpactReport</code>](#ImpactReport)  
**Returns**: [<code>ImpactReport</code>](#ImpactReport) - this if successful, otherwise null  
**Emits**: [<code>state</code>](#ImpactReport+event_state)  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options for this process |

<a name="ImpactReport+force_review"></a>

#### impactReport.force\_review(reason, opts) ⇒ [<code>ImpactReport</code>](#ImpactReport)
force_review()

Force the impact report to ManualReview state

**Kind**: instance method of [<code>ImpactReport</code>](#ImpactReport)  
**Returns**: [<code>ImpactReport</code>](#ImpactReport) - this impact report  

| Param | Type | Description |
| --- | --- | --- |
| reason | <code>string</code> | the reason for the manual review |
| opts | <code>object</code> | options for this process |

<a name="ImpactReport+force_resolve"></a>

#### impactReport.force\_resolve(reason, opts) ⇒ [<code>ImpactReport</code>](#ImpactReport)
force_resolve()

Force the impact report to Resolved state

**Kind**: instance method of [<code>ImpactReport</code>](#ImpactReport)  
**Returns**: [<code>ImpactReport</code>](#ImpactReport) - this impact report  

| Param | Type | Description |
| --- | --- | --- |
| reason | <code>string</code> | the reason for the force resolve |
| opts | <code>object</code> | options for this process |

<a name="ImpactReport+save"></a>

#### impactReport.save() ⇒ [<code>ImpactReport</code>](#ImpactReport)
Save

**Kind**: instance method of [<code>ImpactReport</code>](#ImpactReport)  
**Returns**: [<code>ImpactReport</code>](#ImpactReport) - this  
<a name="ImpactReport+event_error_log"></a>

#### "error_log"
**Kind**: event emitted by [<code>ImpactReport</code>](#ImpactReport)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| payload | <code>object</code> | the associated payload |

<a name="ImpactReport+event_state"></a>

#### "state"
**Kind**: event emitted by [<code>ImpactReport</code>](#ImpactReport)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| new_state | <code>string</code> | the new state |
| old_state | <code>string</code> | the old state |


<!-- apistop -->
