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
  * [ImpactReports](#impactreports)

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

<a name="module_ImpactReports"></a>

### ImpactReports

* [ImpactReports](#module_ImpactReports)
    * [.NominalIRError](#module_ImpactReports.NominalIRError)
        * [new NominalIRError(message)](#new_module_ImpactReports.NominalIRError_new)
    * [.FatalIRError](#module_ImpactReports.FatalIRError)
        * [new FatalIRError(message)](#new_module_ImpactReports.FatalIRError_new)
    * [.ImpactReport](#module_ImpactReports.ImpactReport)
        * [new ImpactReport(data, logger)](#new_module_ImpactReports.ImpactReport_new)
        * [.allowed_states](#module_ImpactReports.ImpactReport+allowed_states) ⇒ <code>array</code>
        * [.data](#module_ImpactReports.ImpactReport+data) ⇒ <code>object</code>
        * [.id](#module_ImpactReports.ImpactReport+id) ⇒ <code>string</code>
        * [.history](#module_ImpactReports.ImpactReport+history) ⇒ <code>array</code>
        * [.state](#module_ImpactReports.ImpactReport+state) ⇒ <code>string</code>
        * [.action(opts)](#module_ImpactReports.ImpactReport+action) ⇒ <code>ImpactReport</code>
        * [.evaluate(opts)](#module_ImpactReports.ImpactReport+evaluate) ⇒ <code>ImpactReport</code>
        * [.resolve(opts)](#module_ImpactReports.ImpactReport+resolve) ⇒ <code>ImpactReport</code>
        * [.force_review(reason, opts)](#module_ImpactReports.ImpactReport+force_review) ⇒ <code>ImpactReport</code>
        * [.force_resolve(reason, opts)](#module_ImpactReports.ImpactReport+force_resolve) ⇒ <code>ImpactReport</code>
        * [.save()](#module_ImpactReports.ImpactReport+save) ⇒ <code>ImpactReport</code>

<a name="module_ImpactReports.NominalIRError"></a>

#### ImpactReports.NominalIRError
NominalIRError

Throw this to show that a nominal error has occurred.  The appropriate error handler will be called to see if Impact Report processing can continue.

**Kind**: static class of [<code>ImpactReports</code>](#module_ImpactReports)  
<a name="new_module_ImpactReports.NominalIRError_new"></a>

##### new NominalIRError(message)

| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | the error message |

<a name="module_ImpactReports.FatalIRError"></a>

#### ImpactReports.FatalIRError
FatalIRError

Throw this to show that a fatal error has occurred.  Impact Report processing will stop and the report will be marked for manual review.

**Kind**: static class of [<code>ImpactReports</code>](#module_ImpactReports)  
<a name="new_module_ImpactReports.FatalIRError_new"></a>

##### new FatalIRError(message)

| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | the error message |

<a name="module_ImpactReports.ImpactReport"></a>

#### ImpactReports.ImpactReport
ImpactReport

To use this class, extend it and override _action(), _evaluate(), _resolve() and optionally any _recover\_*() methods.
If you override _save(), it will be called after every state change.

**Kind**: static class of [<code>ImpactReports</code>](#module_ImpactReports)  

* [.ImpactReport](#module_ImpactReports.ImpactReport)
    * [new ImpactReport(data, logger)](#new_module_ImpactReports.ImpactReport_new)
    * [.allowed_states](#module_ImpactReports.ImpactReport+allowed_states) ⇒ <code>array</code>
    * [.data](#module_ImpactReports.ImpactReport+data) ⇒ <code>object</code>
    * [.id](#module_ImpactReports.ImpactReport+id) ⇒ <code>string</code>
    * [.history](#module_ImpactReports.ImpactReport+history) ⇒ <code>array</code>
    * [.state](#module_ImpactReports.ImpactReport+state) ⇒ <code>string</code>
    * [.action(opts)](#module_ImpactReports.ImpactReport+action) ⇒ <code>ImpactReport</code>
    * [.evaluate(opts)](#module_ImpactReports.ImpactReport+evaluate) ⇒ <code>ImpactReport</code>
    * [.resolve(opts)](#module_ImpactReports.ImpactReport+resolve) ⇒ <code>ImpactReport</code>
    * [.force_review(reason, opts)](#module_ImpactReports.ImpactReport+force_review) ⇒ <code>ImpactReport</code>
    * [.force_resolve(reason, opts)](#module_ImpactReports.ImpactReport+force_resolve) ⇒ <code>ImpactReport</code>
    * [.save()](#module_ImpactReports.ImpactReport+save) ⇒ <code>ImpactReport</code>

<a name="new_module_ImpactReports.ImpactReport_new"></a>

##### new ImpactReport(data, logger)
constructor


| Param | Type | Description |
| --- | --- | --- |
| data | <code>object</code> | the data for this impact report |
| logger | <code>object</code> | a logger to use |

<a name="module_ImpactReports.ImpactReport+allowed_states"></a>

##### impactReport.allowed\_states ⇒ <code>array</code>
allowed_states (getter)

**Kind**: instance property of [<code>ImpactReport</code>](#module_ImpactReports.ImpactReport)  
**Returns**: <code>array</code> - the allowed states  
<a name="module_ImpactReports.ImpactReport+data"></a>

##### impactReport.data ⇒ <code>object</code>
data (getter)

**Kind**: instance property of [<code>ImpactReport</code>](#module_ImpactReports.ImpactReport)  
**Returns**: <code>object</code> - the data for this impact report  
<a name="module_ImpactReports.ImpactReport+id"></a>

##### impactReport.id ⇒ <code>string</code>
id (getter)

**Kind**: instance property of [<code>ImpactReport</code>](#module_ImpactReports.ImpactReport)  
**Returns**: <code>string</code> - the id for this impact report  
<a name="module_ImpactReports.ImpactReport+history"></a>

##### impactReport.history ⇒ <code>array</code>
Log (getter)

**Kind**: instance property of [<code>ImpactReport</code>](#module_ImpactReports.ImpactReport)  
**Returns**: <code>array</code> - the log for this impact report  
<a name="module_ImpactReports.ImpactReport+state"></a>

##### impactReport.state ⇒ <code>string</code>
state (getter)

**Kind**: instance property of [<code>ImpactReport</code>](#module_ImpactReports.ImpactReport)  
**Returns**: <code>string</code> - the state of the impact report  
<a name="module_ImpactReports.ImpactReport+action"></a>

##### impactReport.action(opts) ⇒ <code>ImpactReport</code>
action

Action the impact report

**Kind**: instance method of [<code>ImpactReport</code>](#module_ImpactReports.ImpactReport)  
**Returns**: <code>ImpactReport</code> - this if successful, otherwise null  
**Emits**: [<code>state</code>](#ImpactReport+event_state)  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options for this process |

<a name="module_ImpactReports.ImpactReport+evaluate"></a>

##### impactReport.evaluate(opts) ⇒ <code>ImpactReport</code>
evaluate

Action the impact report

**Kind**: instance method of [<code>ImpactReport</code>](#module_ImpactReports.ImpactReport)  
**Returns**: <code>ImpactReport</code> - this if successful, otherwise null  
**Emits**: [<code>state</code>](#ImpactReport+event_state)  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options for this process |

<a name="module_ImpactReports.ImpactReport+resolve"></a>

##### impactReport.resolve(opts) ⇒ <code>ImpactReport</code>
resolve

Action the impact report

**Kind**: instance method of [<code>ImpactReport</code>](#module_ImpactReports.ImpactReport)  
**Returns**: <code>ImpactReport</code> - this if successful, otherwise null  
**Emits**: [<code>state</code>](#ImpactReport+event_state)  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options for this process |

<a name="module_ImpactReports.ImpactReport+force_review"></a>

##### impactReport.force\_review(reason, opts) ⇒ <code>ImpactReport</code>
force_review()

Force the impact report to ManualReview state

**Kind**: instance method of [<code>ImpactReport</code>](#module_ImpactReports.ImpactReport)  
**Returns**: <code>ImpactReport</code> - this impact report  

| Param | Type | Description |
| --- | --- | --- |
| reason | <code>string</code> | the reason for the manual review |
| opts | <code>object</code> | options for this process |

<a name="module_ImpactReports.ImpactReport+force_resolve"></a>

##### impactReport.force\_resolve(reason, opts) ⇒ <code>ImpactReport</code>
force_resolve()

Force the impact report to Resolved state

**Kind**: instance method of [<code>ImpactReport</code>](#module_ImpactReports.ImpactReport)  
**Returns**: <code>ImpactReport</code> - this impact report  

| Param | Type | Description |
| --- | --- | --- |
| reason | <code>string</code> | the reason for the force resolve |
| opts | <code>object</code> | options for this process |

<a name="module_ImpactReports.ImpactReport+save"></a>

##### impactReport.save() ⇒ <code>ImpactReport</code>
Save

**Kind**: instance method of [<code>ImpactReport</code>](#module_ImpactReports.ImpactReport)  
**Returns**: <code>ImpactReport</code> - this  

<!-- apistop -->
