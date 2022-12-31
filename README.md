# Anomaly
Reversible, controlled anomaly detection and management

```
const AR = require("anomaly-reports");

class FixLowercase extends AR.AnomalyReports {

    // Detect lowercase letters (we've decided to make system a string)
    static async detect(system, opts) {
        
        return system.match(/[a-z]/)?:true:false;
    }
}

let processor = new AR.processor(/* logger */);
processor.reports.push(new AR.report());
```

## Table of Contents

<!-- toc -->

- [Anomaly Report (AR) Workflow](#anomaly-report-ar-workflow)
- [Todo](#todo)
- [Acknowledgements](#acknowledgements)
- [License](#license)
- [API](#api)
  * [AnomalyReports](#anomalyreports)

<!-- tocstop -->

## Anomaly Workflow

An Anomaly is a combination of state and history that pertain to an anomaly in a particular system, as well as a set of functions to manage that anomaly.

![Anomaly State Graph](img/anomaly_state_graph.png "Anomaly State Graph")

A few important departures from the original concept:
1. `Anomaly.state` tracks only the state of the anomaly with respect to the `action()`.  
2. Since 'paused' (or ManualReview) doesn't tell us anything about the state, it's actually just a property - not a state.  This is `.paused`.
3. Activity notifications about work being done are events (e.g. `Anomaly#activity` -> `{"activity" : "detect", "progress" : "45" }`)
4. We don't retain any logger references or emil 'error_log' events.  Instead we emit `Anomaly#log` events for all `Anomaly.log()` calls.  If you want to log these in a logger it will be trivial to do so.


For each anomaly you would like to manage, create a class that derives from `Anomaly.Report` and override the appropriate functions:

| Type     | Function       | Required | What does it do?                              |
|----------|----------------|----------|-----------------------------------------------|
| static   | `detect()`     | yes      | Detect an anomaly                             |
| instance | `action()`     | no       | Correct the anomaly by changing `system`      |
| instance | `revert()`     | no       | Undo `action()`                               |
| instance | `evaluate()`   | no       | Evaluate the successfulness of `action()`     |
| static   | `serialize()`  | no       | Allows us to save this report for future use  |
| static   | `deserialize()`| no       | Allows us to restore this report from save    |

 At a minimum, you must override the static `detect()` method.  
 
 All these functions are `async`.  If you `throw` an error from `action()`, `revert()` will be called.  

 If you implement `revert()`, you are expected to store whatever data you need during `action()` in order to perform the reversion.  You can do this externally, in a database, or you can store the data within your subclass.

IRs have built in `.log.{debug|info|warn|error}()` methods, and it is recommended that you use this for logging since it allows the IR to keep a rich internal log of everything you are doing, accessable via `.history`.  If your constructor was passed a logger with similarly named functions, that logger will also be automatically called when you call the built in logger. 

## Todo

- Better document the override methods
- Make example into test?  Also simpify - seems complicated
- Fix tests

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
        * _instance_
            * [.allowed_states](#module_AnomalyReports.AnomalyReport+allowed_states) ⇒ <code>array</code>
            * [.data](#module_AnomalyReports.AnomalyReport+data) ⇒ <code>object</code>
            * [.id](#module_AnomalyReports.AnomalyReport+id) ⇒ <code>string</code>
            * [.history](#module_AnomalyReports.AnomalyReport+history) ⇒ <code>array</code>
            * [.state](#module_AnomalyReports.AnomalyReport+state) ⇒ <code>string</code>
            * [.iterations([state])](#module_AnomalyReports.AnomalyReport+iterations) ⇒ <code>number</code>
            * [.verify(opts)](#module_AnomalyReports.AnomalyReport+verify) ⇒ <code>AnomalyReport</code>
            * [.action(opts)](#module_AnomalyReports.AnomalyReport+action) ⇒ <code>AnomalyReport</code>
            * [.evaluate(opts)](#module_AnomalyReports.AnomalyReport+evaluate) ⇒ <code>AnomalyReport</code>
            * [.resolve(opts)](#module_AnomalyReports.AnomalyReport+resolve) ⇒ <code>AnomalyReport</code>
            * [.pause(reason, opts)](#module_AnomalyReports.AnomalyReport+pause) ⇒ <code>AnomalyReport</code>
            * [.force_resolve(reason, opts)](#module_AnomalyReports.AnomalyReport+force_resolve) ⇒ <code>AnomalyReport</code>
            * [.save()](#module_AnomalyReports.AnomalyReport+save) ⇒ <code>AnomalyReport</code>
        * _static_
            * [._detect(data, opts)](#module_AnomalyReports.AnomalyReport._detect) ⇒ <code>boolean</code>
            * [.detect(data, opts, logger)](#module_AnomalyReports.AnomalyReport.detect) ⇒ <code>AnomalyReport</code>

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
    * _instance_
        * [.allowed_states](#module_AnomalyReports.AnomalyReport+allowed_states) ⇒ <code>array</code>
        * [.data](#module_AnomalyReports.AnomalyReport+data) ⇒ <code>object</code>
        * [.id](#module_AnomalyReports.AnomalyReport+id) ⇒ <code>string</code>
        * [.history](#module_AnomalyReports.AnomalyReport+history) ⇒ <code>array</code>
        * [.state](#module_AnomalyReports.AnomalyReport+state) ⇒ <code>string</code>
        * [.iterations([state])](#module_AnomalyReports.AnomalyReport+iterations) ⇒ <code>number</code>
        * [.verify(opts)](#module_AnomalyReports.AnomalyReport+verify) ⇒ <code>AnomalyReport</code>
        * [.action(opts)](#module_AnomalyReports.AnomalyReport+action) ⇒ <code>AnomalyReport</code>
        * [.evaluate(opts)](#module_AnomalyReports.AnomalyReport+evaluate) ⇒ <code>AnomalyReport</code>
        * [.resolve(opts)](#module_AnomalyReports.AnomalyReport+resolve) ⇒ <code>AnomalyReport</code>
        * [.pause(reason, opts)](#module_AnomalyReports.AnomalyReport+pause) ⇒ <code>AnomalyReport</code>
        * [.force_resolve(reason, opts)](#module_AnomalyReports.AnomalyReport+force_resolve) ⇒ <code>AnomalyReport</code>
        * [.save()](#module_AnomalyReports.AnomalyReport+save) ⇒ <code>AnomalyReport</code>
    * _static_
        * [._detect(data, opts)](#module_AnomalyReports.AnomalyReport._detect) ⇒ <code>boolean</code>
        * [.detect(data, opts, logger)](#module_AnomalyReports.AnomalyReport.detect) ⇒ <code>AnomalyReport</code>

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

<a name="module_AnomalyReports.AnomalyReport+verify"></a>

##### anomalyReport.verify(opts) ⇒ <code>AnomalyReport</code>
verify

Verify the anomaly report prior to actioning

Mostly useful in cases where things might have changed since the report was created
Only does anything if you have included a _verify() method

**Kind**: instance method of [<code>AnomalyReport</code>](#module_AnomalyReports.AnomalyReport)  
**Returns**: <code>AnomalyReport</code> - this if successful, otherwise null  
**Emits**: [<code>state</code>](#AnomalyReport+event_state)  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>object</code> | options for this process |

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
<a name="module_AnomalyReports.AnomalyReport._detect"></a>

##### AnomalyReport.\_detect(data, opts) ⇒ <code>boolean</code>
Detect

Detect an anomaly
Override me!

**Kind**: static method of [<code>AnomalyReport</code>](#module_AnomalyReports.AnomalyReport)  
**Returns**: <code>boolean</code> - true if the anomaly is detected, false otherwise  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| data | <code>object</code> |  | the data for this anomaly report (probably the system being analysed) |
| [data.id] | <code>string</code> | <code>&quot;uuidv4()&quot;</code> | a unique id for this report |
| opts | <code>object</code> |  | arbitrary options |

<a name="module_AnomalyReports.AnomalyReport.detect"></a>

##### AnomalyReport.detect(data, opts, logger) ⇒ <code>AnomalyReport</code>
Detect

Detect an anomaly

**Kind**: static method of [<code>AnomalyReport</code>](#module_AnomalyReports.AnomalyReport)  
**Returns**: <code>AnomalyReport</code> - an anomaly report if detected, null otherwise  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| data | <code>object</code> |  | the data for this anomaly report (probably the system being analysed) |
| [data.id] | <code>string</code> | <code>&quot;uuidv4()&quot;</code> | a unique id for this report |
| opts | <code>object</code> |  | arbitrary options |
| logger | <code>object</code> |  | a logger to use if an anomaly report is created |


<!-- apistop -->
