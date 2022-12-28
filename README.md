# Anomaly Reports
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
        await ir.force_review("Anomaly detector servicing ended in unexpected state "+ir.state, { ir_db:this.#ir_db }); // add db ref for auto-save
    }
}
```

## Table of Contents

<!-- toc -->

- [Anomaly Report (IR) Workflow](#anomaly-report-ir-workflow)
- [Acknowledgements](#acknowledgements)
- [License](#license)
- [API](#api)
  * [AnomalyReports](#anomalyreports)

<!-- tocstop -->

## Anomaly Report (IR) Workflow

For each problem (anomaly) you would like to manage, create a class that derives from `AnomalyReport.js`.  Override `_action()`, `_evaluate()`, and `_resolve()`; when your IR is processed, each one of these methods will be called in turn.  Your overridden functions are `async` and expected to the `throw` if there is a problem.   If this happens, your associated `_recover_` method will then be called.  If this also `throws`, the IR will be re-queued (go to `Queued` state) for a `NominalARError` or go to `ManualReview` state for any other kind if error.

IRs have built in `.log.{debug|info|warn|error}()` methods, and it is recommended that you use this for logging since it allows the IR to keep a rich internal log of everything you are doing.  If your constructor was passed a logger with similarly named functions, that logger will also be automatically called when you call the built in logger. 

## Acknowledgements

Thanks to Dr. Jonathan Van Schenck for developing the Anomaly Report concept.  This project is based on his original class.

## License

Copyright (c) 2022 Nova Dynamics

## API

<!-- api -->

<a name="module_AnomalyReports"></a>

### AnomalyReports

* [AnomalyReports](#module_AnomalyReports)
    * [.NominalARError](#module_AnomalyReports.NominalARError)
        * [new NominalARError(message)](#new_module_AnomalyReports.NominalARError_new)
    * [.FatalARError](#module_AnomalyReports.FatalARError)
        * [new FatalARError(message)](#new_module_AnomalyReports.FatalARError_new)
    * [.AnomalyReport](#module_AnomalyReports.AnomalyReport)
        * [new AnomalyReport(data, logger)](#new_module_AnomalyReports.AnomalyReport_new)
        * [.allowed_states](#module_AnomalyReports.AnomalyReport+allowed_states) ⇒ <code>array</code>
        * [.data](#module_AnomalyReports.AnomalyReport+data) ⇒ <code>object</code>
        * [.id](#module_AnomalyReports.AnomalyReport+id) ⇒ <code>string</code>
        * [.history](#module_AnomalyReports.AnomalyReport+history) ⇒ <code>array</code>
        * [.state](#module_AnomalyReports.AnomalyReport+state) ⇒ <code>string</code>
        * [.iterations([state])](#module_AnomalyReports.AnomalyReport+iterations) ⇒ <code>number</code>
        * [.action(opts)](#module_AnomalyReports.AnomalyReport+action) ⇒ <code>AnomalyReport</code>
        * [.evaluate(opts)](#module_AnomalyReports.AnomalyReport+evaluate) ⇒ <code>AnomalyReport</code>
        * [.resolve(opts)](#module_AnomalyReports.AnomalyReport+resolve) ⇒ <code>AnomalyReport</code>
        * [.pause(reason, opts)](#module_AnomalyReports.AnomalyReport+pause) ⇒ <code>AnomalyReport</code>
        * [.force_resolve(reason, opts)](#module_AnomalyReports.AnomalyReport+force_resolve) ⇒ <code>AnomalyReport</code>
        * [.save()](#module_AnomalyReports.AnomalyReport+save) ⇒ <code>AnomalyReport</code>

<a name="module_AnomalyReports.NominalARError"></a>

#### AnomalyReports.NominalARError
NominalARError

Throw this to show that a nominal error has occurred.  The appropriate error handler will be called to see if Anomaly Report processing can continue.

**Kind**: static class of [<code>AnomalyReports</code>](#module_AnomalyReports)  
<a name="new_module_AnomalyReports.NominalARError_new"></a>

##### new NominalARError(message)

| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | the error message |

<a name="module_AnomalyReports.FatalARError"></a>

#### AnomalyReports.FatalARError
FatalARError

Throw this to show that a fatal error has occurred.  Anomaly Report processing will stop and the report will be marked for manual review.

**Kind**: static class of [<code>AnomalyReports</code>](#module_AnomalyReports)  
<a name="new_module_AnomalyReports.FatalARError_new"></a>

##### new FatalARError(message)

| Param | Type | Description |
| --- | --- | --- |
| message | <code>string</code> | the error message |

<a name="module_AnomalyReports.AnomalyReport"></a>

#### AnomalyReports.AnomalyReport
AnomalyReport

To use this class, extend it and override _action(), _evaluate(), _resolve() and optionally any _recover\_*() methods.
If you override _save(), it will be called after every state change.

**Kind**: static class of [<code>AnomalyReports</code>](#module_AnomalyReports)  

* [.AnomalyReport](#module_AnomalyReports.AnomalyReport)
    * [new AnomalyReport(data, logger)](#new_module_AnomalyReports.AnomalyReport_new)
    * [.allowed_states](#module_AnomalyReports.AnomalyReport+allowed_states) ⇒ <code>array</code>
    * [.data](#module_AnomalyReports.AnomalyReport+data) ⇒ <code>object</code>
    * [.id](#module_AnomalyReports.AnomalyReport+id) ⇒ <code>string</code>
    * [.history](#module_AnomalyReports.AnomalyReport+history) ⇒ <code>array</code>
    * [.state](#module_AnomalyReports.AnomalyReport+state) ⇒ <code>string</code>
    * [.iterations([state])](#module_AnomalyReports.AnomalyReport+iterations) ⇒ <code>number</code>
    * [.action(opts)](#module_AnomalyReports.AnomalyReport+action) ⇒ <code>AnomalyReport</code>
    * [.evaluate(opts)](#module_AnomalyReports.AnomalyReport+evaluate) ⇒ <code>AnomalyReport</code>
    * [.resolve(opts)](#module_AnomalyReports.AnomalyReport+resolve) ⇒ <code>AnomalyReport</code>
    * [.pause(reason, opts)](#module_AnomalyReports.AnomalyReport+pause) ⇒ <code>AnomalyReport</code>
    * [.force_resolve(reason, opts)](#module_AnomalyReports.AnomalyReport+force_resolve) ⇒ <code>AnomalyReport</code>
    * [.save()](#module_AnomalyReports.AnomalyReport+save) ⇒ <code>AnomalyReport</code>

<a name="new_module_AnomalyReports.AnomalyReport_new"></a>

##### new AnomalyReport(data, logger)
constructor


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| data | <code>object</code> |  | the data for this anomaly report |
| [data.id] | <code>string</code> | <code>&quot;uuidv4()&quot;</code> | a unique id for this report |
| logger | <code>object</code> |  | a logger to use |

<a name="module_AnomalyReports.AnomalyReport+allowed_states"></a>

##### anomalyReport.allowed\_states ⇒ <code>array</code>
allowed_states (getter)

**Kind**: instance property of [<code>AnomalyReport</code>](#module_AnomalyReports.AnomalyReport)  
**Returns**: <code>array</code> - the allowed states  
<a name="module_AnomalyReports.AnomalyReport+data"></a>

##### anomalyReport.data ⇒ <code>object</code>
data (getter)

**Kind**: instance property of [<code>AnomalyReport</code>](#module_AnomalyReports.AnomalyReport)  
**Returns**: <code>object</code> - the data for this anomaly report  
<a name="module_AnomalyReports.AnomalyReport+id"></a>

##### anomalyReport.id ⇒ <code>string</code>
id (getter)

**Kind**: instance property of [<code>AnomalyReport</code>](#module_AnomalyReports.AnomalyReport)  
**Returns**: <code>string</code> - the id for this anomaly report  
<a name="module_AnomalyReports.AnomalyReport+history"></a>

##### anomalyReport.history ⇒ <code>array</code>
Log (getter)

**Kind**: instance property of [<code>AnomalyReport</code>](#module_AnomalyReports.AnomalyReport)  
**Returns**: <code>array</code> - the log for this anomaly report  
<a name="module_AnomalyReports.AnomalyReport+state"></a>

##### anomalyReport.state ⇒ <code>string</code>
state (getter)

**Kind**: instance property of [<code>AnomalyReport</code>](#module_AnomalyReports.AnomalyReport)  
**Returns**: <code>string</code> - the state of the anomaly report  
<a name="module_AnomalyReports.AnomalyReport+iterations"></a>

##### anomalyReport.iterations([state]) ⇒ <code>number</code>
State iterations counter

Show how many times we have transitioned to a given state

**Kind**: instance method of [<code>AnomalyReport</code>](#module_AnomalyReports.AnomalyReport)  
**Returns**: <code>number</code> - the number of times we have transitioned to this state  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [state] | <code>string</code> | <code>&quot;\&quot;Actioning\&quot;&quot;</code> | the state to count |

<a name="module_AnomalyReports.AnomalyReport+action"></a>

##### anomalyReport.action(opts) ⇒ <code>AnomalyReport</code>
action

Action the anomaly report

**Kind**: instance method of [<code>AnomalyReport</code>](#module_AnomalyReports.AnomalyReport)  
**Returns**: <code>AnomalyReport</code> - this if successful, otherwise null  
**Emits**: [<code>state</code>](#AnomalyReport+event_state)  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options for this process |

<a name="module_AnomalyReports.AnomalyReport+evaluate"></a>

##### anomalyReport.evaluate(opts) ⇒ <code>AnomalyReport</code>
evaluate

Action the anomaly report

**Kind**: instance method of [<code>AnomalyReport</code>](#module_AnomalyReports.AnomalyReport)  
**Returns**: <code>AnomalyReport</code> - this if successful, otherwise null  
**Emits**: [<code>state</code>](#AnomalyReport+event_state)  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options for this process |

<a name="module_AnomalyReports.AnomalyReport+resolve"></a>

##### anomalyReport.resolve(opts) ⇒ <code>AnomalyReport</code>
resolve

Action the anomaly report

**Kind**: instance method of [<code>AnomalyReport</code>](#module_AnomalyReports.AnomalyReport)  
**Returns**: <code>AnomalyReport</code> - this if successful, otherwise null  
**Emits**: [<code>state</code>](#AnomalyReport+event_state)  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options for this process |

<a name="module_AnomalyReports.AnomalyReport+pause"></a>

##### anomalyReport.pause(reason, opts) ⇒ <code>AnomalyReport</code>
pause()

Set the anomaly report to Paused state

**Kind**: instance method of [<code>AnomalyReport</code>](#module_AnomalyReports.AnomalyReport)  
**Returns**: <code>AnomalyReport</code> - this anomaly report  

| Param | Type | Description |
| --- | --- | --- |
| reason | <code>string</code> | the reason for the pause |
| opts | <code>object</code> | options for this process |

<a name="module_AnomalyReports.AnomalyReport+force_resolve"></a>

##### anomalyReport.force\_resolve(reason, opts) ⇒ <code>AnomalyReport</code>
force_resolve()

Force the anomaly report to Resolved state

**Kind**: instance method of [<code>AnomalyReport</code>](#module_AnomalyReports.AnomalyReport)  
**Returns**: <code>AnomalyReport</code> - this anomaly report  

| Param | Type | Description |
| --- | --- | --- |
| reason | <code>string</code> | the reason for the force resolve |
| opts | <code>object</code> | options for this process |

<a name="module_AnomalyReports.AnomalyReport+save"></a>

##### anomalyReport.save() ⇒ <code>AnomalyReport</code>
Save

**Kind**: instance method of [<code>AnomalyReport</code>](#module_AnomalyReports.AnomalyReport)  
**Returns**: <code>AnomalyReport</code> - this  

<!-- apistop -->
