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

- [Anomaly Workflow](#anomaly-workflow)
- [Todo](#todo)
- [Acknowledgements](#acknowledgements)
- [License](#license)
- [API](#api)
  * [Anomalies](#anomalies)

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

<a name="module_Anomalies"></a>

### Anomalies

* [Anomalies](#module_Anomalies)
    * [.Anomaly](#module_Anomalies.Anomaly)
        * [new Anomaly()](#new_module_Anomalies.Anomaly_new)
        * _instance_
            * [.name](#module_Anomalies.Anomaly+name) ⇒ <code>string</code>
            * [.paused](#module_Anomalies.Anomaly+paused) ⇒ <code>boolean</code>
            * [.id](#module_Anomalies.Anomaly+id) ⇒ <code>string</code>
            * [.history](#module_Anomalies.Anomaly+history) ⇒ <code>array</code>
            * [.state](#module_Anomalies.Anomaly+state) ⇒ <code>string</code>
            * [.iterations([state])](#module_Anomalies.Anomaly+iterations) ⇒ <code>number</code>
            * [.pause(reason)](#module_Anomalies.Anomaly+pause)
            * [.resume(reason)](#module_Anomalies.Anomaly+resume)
        * _static_
            * [.allowed_states](#module_Anomalies.Anomaly.allowed_states) ⇒ <code>array</code>
            * [.detect(system, opts)](#module_Anomalies.Anomaly.detect) ⇒ <code>boolean</code>
    * [.Processor](#module_Anomalies.Processor)
        * [.anomalies](#module_Anomalies.Processor+anomalies) ⇒ <code>Array.&lt;Anomaly&gt;</code>
        * [.classes](#module_Anomalies.Processor+classes) ⇒ <code>Array.&lt;Anomaly&gt;</code>
        * [.anomalies_with_state(state)](#module_Anomalies.Processor+anomalies_with_state) ⇒ <code>Array.&lt;Anomaly&gt;</code>
        * [.detect(system, opts)](#module_Anomalies.Processor+detect)
        * [.process()](#module_Anomalies.Processor+process) ⇒ <code>Promise.&lt;(Anomaly\|null)&gt;</code>

<a name="module_Anomalies.Anomaly"></a>

#### Anomalies.Anomaly
Anomaly

To use this class, extend it and override _action(), _evaluate(), _resolve() and optionally any _recover\_*() methods.
If you override _save(), it will be called after every state change.

**Kind**: static class of [<code>Anomalies</code>](#module_Anomalies)  

* [.Anomaly](#module_Anomalies.Anomaly)
    * [new Anomaly()](#new_module_Anomalies.Anomaly_new)
    * _instance_
        * [.name](#module_Anomalies.Anomaly+name) ⇒ <code>string</code>
        * [.paused](#module_Anomalies.Anomaly+paused) ⇒ <code>boolean</code>
        * [.id](#module_Anomalies.Anomaly+id) ⇒ <code>string</code>
        * [.history](#module_Anomalies.Anomaly+history) ⇒ <code>array</code>
        * [.state](#module_Anomalies.Anomaly+state) ⇒ <code>string</code>
        * [.iterations([state])](#module_Anomalies.Anomaly+iterations) ⇒ <code>number</code>
        * [.pause(reason)](#module_Anomalies.Anomaly+pause)
        * [.resume(reason)](#module_Anomalies.Anomaly+resume)
    * _static_
        * [.allowed_states](#module_Anomalies.Anomaly.allowed_states) ⇒ <code>array</code>
        * [.detect(system, opts)](#module_Anomalies.Anomaly.detect) ⇒ <code>boolean</code>

<a name="new_module_Anomalies.Anomaly_new"></a>

##### new Anomaly()
constructor

<a name="module_Anomalies.Anomaly+name"></a>

##### anomaly.name ⇒ <code>string</code>
name (getter)

**Kind**: instance property of [<code>Anomaly</code>](#module_Anomalies.Anomaly)  
**Returns**: <code>string</code> - the name of this anomaly  
<a name="module_Anomalies.Anomaly+paused"></a>

##### anomaly.paused ⇒ <code>boolean</code>
paused (getter)

**Kind**: instance property of [<code>Anomaly</code>](#module_Anomalies.Anomaly)  
**Returns**: <code>boolean</code> - true if this is paused  
<a name="module_Anomalies.Anomaly+id"></a>

##### anomaly.id ⇒ <code>string</code>
id (getter)

**Kind**: instance property of [<code>Anomaly</code>](#module_Anomalies.Anomaly)  
**Returns**: <code>string</code> - the id for this anomaly  
<a name="module_Anomalies.Anomaly+history"></a>

##### anomaly.history ⇒ <code>array</code>
Log (getter)

**Kind**: instance property of [<code>Anomaly</code>](#module_Anomalies.Anomaly)  
**Returns**: <code>array</code> - the log for this anomaly  
<a name="module_Anomalies.Anomaly+state"></a>

##### anomaly.state ⇒ <code>string</code>
state (getter)

**Kind**: instance property of [<code>Anomaly</code>](#module_Anomalies.Anomaly)  
**Returns**: <code>string</code> - the state of the anomaly  
<a name="module_Anomalies.Anomaly+iterations"></a>

##### anomaly.iterations([state]) ⇒ <code>number</code>
State iterations counter

Show how many times we have transitioned to a given state

**Kind**: instance method of [<code>Anomaly</code>](#module_Anomalies.Anomaly)  
**Returns**: <code>number</code> - the number of times we have transitioned to this state  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [state] | <code>string</code> | <code>&quot;\&quot;Actioning\&quot;&quot;</code> | the state to count |

<a name="module_Anomalies.Anomaly+pause"></a>

##### anomaly.pause(reason)
pause

Pause this anomaly

**Kind**: instance method of [<code>Anomaly</code>](#module_Anomalies.Anomaly)  
**Emit**: Anomaly#pause  

| Param | Type | Description |
| --- | --- | --- |
| reason | <code>string</code> | the reason for the pause |

<a name="module_Anomalies.Anomaly+resume"></a>

##### anomaly.resume(reason)
resume

Resume this anomaly

**Kind**: instance method of [<code>Anomaly</code>](#module_Anomalies.Anomaly)  
**Emit**: Anomaly#resume  

| Param | Type | Description |
| --- | --- | --- |
| reason | <code>string</code> | the reason for the resume |

<a name="module_Anomalies.Anomaly.allowed_states"></a>

##### Anomaly.allowed\_states ⇒ <code>array</code>
allowed_states (getter)

**Kind**: static property of [<code>Anomaly</code>](#module_Anomalies.Anomaly)  
**Returns**: <code>array</code> - the allowed states  
<a name="module_Anomalies.Anomaly.detect"></a>

##### Anomaly.detect(system, opts) ⇒ <code>boolean</code>
Detect

Detect an anomaly
Override me!

**Kind**: static method of [<code>Anomaly</code>](#module_Anomalies.Anomaly)  
**Returns**: <code>boolean</code> - true if an anomaly is detected  
**Emits**: [<code>activity</code>](#Anomaly+event_activity)  

| Param | Type | Description |
| --- | --- | --- |
| system | <code>object</code> | the system being analyzed |
| opts | <code>object</code> | arbitrary options |

<a name="module_Anomalies.Processor"></a>

#### Anomalies.Processor
AnomalyProcessor

Process anomaly

**Kind**: static class of [<code>Anomalies</code>](#module_Anomalies)  

* [.Processor](#module_Anomalies.Processor)
    * [.anomalies](#module_Anomalies.Processor+anomalies) ⇒ <code>Array.&lt;Anomaly&gt;</code>
    * [.classes](#module_Anomalies.Processor+classes) ⇒ <code>Array.&lt;Anomaly&gt;</code>
    * [.anomalies_with_state(state)](#module_Anomalies.Processor+anomalies_with_state) ⇒ <code>Array.&lt;Anomaly&gt;</code>
    * [.detect(system, opts)](#module_Anomalies.Processor+detect)
    * [.process()](#module_Anomalies.Processor+process) ⇒ <code>Promise.&lt;(Anomaly\|null)&gt;</code>

<a name="module_Anomalies.Processor+anomalies"></a>

##### processor.anomalies ⇒ <code>Array.&lt;Anomaly&gt;</code>
Get all anomalies

**Kind**: instance property of [<code>Processor</code>](#module_Anomalies.Processor)  
**Returns**: <code>Array.&lt;Anomaly&gt;</code> - the queue of anomalies  
<a name="module_Anomalies.Processor+classes"></a>

##### processor.classes ⇒ <code>Array.&lt;Anomaly&gt;</code>
Get all classes

**Kind**: instance property of [<code>Processor</code>](#module_Anomalies.Processor)  
**Returns**: <code>Array.&lt;Anomaly&gt;</code> - all Anomaly classes  
<a name="module_Anomalies.Processor+anomalies_with_state"></a>

##### processor.anomalies\_with\_state(state) ⇒ <code>Array.&lt;Anomaly&gt;</code>
Get anomalies with a particular state

**Kind**: instance method of [<code>Processor</code>](#module_Anomalies.Processor)  
**Returns**: <code>Array.&lt;Anomaly&gt;</code> - anomalies with the specified state  
**Throws**:

- <code>Error</code> if state is invalid


| Param | Type | Description |
| --- | --- | --- |
| state | <code>string</code> | The state to filter on |

<a name="module_Anomalies.Processor+detect"></a>

##### processor.detect(system, opts)
Detect anomalies in a system

Adds anomalies to the queue

**Kind**: instance method of [<code>Processor</code>](#module_Anomalies.Processor)  

| Param | Type | Description |
| --- | --- | --- |
| system | <code>object</code> | The system to detect anomalies in |
| opts | <code>object</code> | Options to pass to the detect() methods |

<a name="module_Anomalies.Processor+process"></a>

##### processor.process() ⇒ <code>Promise.&lt;(Anomaly\|null)&gt;</code>
Process one anomaly 

Finds the first (by order) anomaly with a state of "Preaction" and processes it
to the Resolved state (if possible).  May call .action(), .evaluate(), .revert()
Events are bubbled up.

**Kind**: instance method of [<code>Processor</code>](#module_Anomalies.Processor)  
**Returns**: <code>Promise.&lt;(Anomaly\|null)&gt;</code> - the anomaly processed, or null if there are no anomalies to process.  You can check for success by checking the anomaly itself.  
**Emits**: [<code>log</code>](#Anomaly+event_log), [<code>state</code>](#Anomaly+event_state), [<code>pause</code>](#Anomaly+event_pause), [<code>resume</code>](#Anomaly+event_resume), [<code>activity</code>](#Anomaly+event_activity)  

<!-- apistop -->
