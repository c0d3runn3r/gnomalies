# Anomalies
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

- [Overview](#overview)
- [Todo](#todo)
- [Acknowledgements](#acknowledgements)
- [License](#license)
- [API](#api)
  * [Anomalies](#anomalies)

<!-- tocstop -->

## Overview
We define a *system* as "an entity represented by a collection of values".  An *anomaly* is the condition that a subset of those settings are in an inferior state that could potentially be transformed into a superior state. The `Anomaly` class provides a set of overrideable functions that allow us to process these anomalies in a systematic way.

| Function                         | Purpose                                                    |
|----------------------------------|------------------------------------------------------------|
| `Anomaly.detect(system, opts)`   | Detect an anomaly (static function!)                       |
| `Anomaly.action(system, opts)`   | Correct the anomaly by changing `system`                   |
| `Anomaly.revert(system, opts)`   | Undo `action()`                                            |
| `Anomaly.evaluate(system, opts)` | Evaluate the successfulness of `action()` or `revert()`    |
| `Anomaly.fingerprint(system)`    | fingerprint(revert(action(system))) == fingerprint(system) |
| `Anomaly.serialize(opts)`        | Serialize ourself for storage                              |


![Anomaly State Graph](img/anomaly_state_graph.png "Anomaly State Graph")

A few important departures from the original concept (//delete me after everyone is on board)
1. `Anomaly.state` tracks only the state of the anomaly with respect to the `action()`.  
2. Since 'paused' (or ManualReview) doesn't tell us anything about the state, it's actually just a property - not a state.  This is `.paused`.
3. Activity notifications about work being done are events (e.g. `Anomaly#activity` -> `{"activity" : "detect", "progress" : "45" }`)
4. We don't retain any logger references or emit 'error_log' events.  Instead we emit `Anomaly#log` events for all `Anomaly.log()` calls.  If you want to log these in a logger, just consume them from the `Processor`.

Subclassing notes:
- At a minimum, you must override the static `detect()` method.  
- Most overridden functions are `async`.  If you `throw` an error from `action()`, `revert()` will be called.  
- If you implement `revert()`, you are expected to store whatever data you need during `action()` in order to perform the reversion.  You can do this externally, in a database, or you can store the data within your subclass.
- Use the built in `Anomaly.log.{debug|info|warn|error}()` methods for logging.  It is accessable via `.history`.  Each call will also emit `Anomaly#log` events, making it easy to connect with your external logging engine.

## Todo
- Make more tests?

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
        * [new Anomaly(params)](#new_module_Anomalies.Anomaly_new)
        * _instance_
            * [.name](#module_Anomalies.Anomaly+name) ⇒ <code>string</code>
            * [.paused](#module_Anomalies.Anomaly+paused) ⇒ <code>boolean</code>
            * [.id](#module_Anomalies.Anomaly+id) ⇒ <code>string</code>
            * [.history](#module_Anomalies.Anomaly+history) ⇒ <code>array</code>
            * [.state](#module_Anomalies.Anomaly+state) ⇒ <code>string</code>
            * [.action(system, opts)](#module_Anomalies.Anomaly+action) ⇒ <code>Promise</code>
            * [.revert(system, opts)](#module_Anomalies.Anomaly+revert) ⇒ <code>Promise</code>
            * [.evaluate(system, opts)](#module_Anomalies.Anomaly+evaluate) ⇒ <code>Promise</code>
            * [.fingerprint(system, keys)](#module_Anomalies.Anomaly+fingerprint) ⇒ <code>string</code>
            * [.iterations([state])](#module_Anomalies.Anomaly+iterations) ⇒ <code>number</code>
            * [.pause(reason)](#module_Anomalies.Anomaly+pause)
            * [.resume(reason)](#module_Anomalies.Anomaly+resume)
        * _static_
            * [.allowed_states](#module_Anomalies.Anomaly.allowed_states) ⇒ <code>array</code>
            * [.detect(system, opts)](#module_Anomalies.Anomaly.detect) ⇒ <code>Promiose.&lt;boolean&gt;</code>
            * [.serialize(keys)](#module_Anomalies.Anomaly.serialize) ⇒ <code>string</code>
            * [.from_serialized(str)](#module_Anomalies.Anomaly.from_serialized) ⇒ <code>Anomaly</code>
    * [.Processor](#module_Anomalies.Processor)
        * [new Processor([classes])](#new_module_Anomalies.Processor_new)
        * [.anomalies](#module_Anomalies.Processor+anomalies) ⇒ <code>Array.&lt;Anomaly&gt;</code>
        * [.classes](#module_Anomalies.Processor+classes) ⇒ <code>Array.&lt;Anomaly&gt;</code>
        * [.anomalies_with_state(state)](#module_Anomalies.Processor+anomalies_with_state) ⇒ <code>Array.&lt;Anomaly&gt;</code>
        * [.detect(system, opts)](#module_Anomalies.Processor+detect)
        * [.process(system, opts)](#module_Anomalies.Processor+process) ⇒ <code>Promise</code>
        * [.process_one()](#module_Anomalies.Processor+process_one) ⇒ <code>Promise.&lt;(Anomaly\|null)&gt;</code>

<a name="module_Anomalies.Anomaly"></a>

#### Anomalies.Anomaly
Anomaly

To use this class, extend it and override _action(), _evaluate(), _resolve() and optionally any _recover\_*() methods.
If you override _save(), it will be called after every state change.

**Kind**: static class of [<code>Anomalies</code>](#module_Anomalies)  

* [.Anomaly](#module_Anomalies.Anomaly)
    * [new Anomaly(params)](#new_module_Anomalies.Anomaly_new)
    * _instance_
        * [.name](#module_Anomalies.Anomaly+name) ⇒ <code>string</code>
        * [.paused](#module_Anomalies.Anomaly+paused) ⇒ <code>boolean</code>
        * [.id](#module_Anomalies.Anomaly+id) ⇒ <code>string</code>
        * [.history](#module_Anomalies.Anomaly+history) ⇒ <code>array</code>
        * [.state](#module_Anomalies.Anomaly+state) ⇒ <code>string</code>
        * [.action(system, opts)](#module_Anomalies.Anomaly+action) ⇒ <code>Promise</code>
        * [.revert(system, opts)](#module_Anomalies.Anomaly+revert) ⇒ <code>Promise</code>
        * [.evaluate(system, opts)](#module_Anomalies.Anomaly+evaluate) ⇒ <code>Promise</code>
        * [.fingerprint(system, keys)](#module_Anomalies.Anomaly+fingerprint) ⇒ <code>string</code>
        * [.iterations([state])](#module_Anomalies.Anomaly+iterations) ⇒ <code>number</code>
        * [.pause(reason)](#module_Anomalies.Anomaly+pause)
        * [.resume(reason)](#module_Anomalies.Anomaly+resume)
    * _static_
        * [.allowed_states](#module_Anomalies.Anomaly.allowed_states) ⇒ <code>array</code>
        * [.detect(system, opts)](#module_Anomalies.Anomaly.detect) ⇒ <code>Promiose.&lt;boolean&gt;</code>
        * [.serialize(keys)](#module_Anomalies.Anomaly.serialize) ⇒ <code>string</code>
        * [.from_serialized(str)](#module_Anomalies.Anomaly.from_serialized) ⇒ <code>Anomaly</code>

<a name="new_module_Anomalies.Anomaly_new"></a>

##### new Anomaly(params)
constructor

**Throws**:

- <code>Error</code> if state is invalid


| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | parameters for this object |
| params.history | <code>array</code> | the log |
| params.id | <code>string</code> | the id |
| params.state | <code>string</code> | the state |
| params.paused | <code>boolean</code> | whether the anomaly is paused |

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
<a name="module_Anomalies.Anomaly+action"></a>

##### anomaly.action(system, opts) ⇒ <code>Promise</code>
Action

Perform the action for this anomaly
Override me!

**Kind**: instance method of [<code>Anomaly</code>](#module_Anomalies.Anomaly)  
**Returns**: <code>Promise</code> - promise that resolves when the action is complete  
**Throws**:

- <code>Error</code> error on error


| Param | Type | Description |
| --- | --- | --- |
| system | <code>object</code> | the system being analyzed |
| opts | <code>object</code> | arbitrary options |

<a name="module_Anomalies.Anomaly+revert"></a>

##### anomaly.revert(system, opts) ⇒ <code>Promise</code>
Revert

Undo the action for this anomaly
Override me!

**Kind**: instance method of [<code>Anomaly</code>](#module_Anomalies.Anomaly)  
**Returns**: <code>Promise</code> - promise that resolves when the reversion is complete  
**Throws**:

- <code>Error</code> error on error


| Param | Type | Description |
| --- | --- | --- |
| system | <code>object</code> | the system being analyzed |
| opts | <code>object</code> | arbitrary options |

<a name="module_Anomalies.Anomaly+evaluate"></a>

##### anomaly.evaluate(system, opts) ⇒ <code>Promise</code>
Evaluate

Evaluate the success of our action or reversion.
Throw an error if you believe the action or reversion failed.
Can also be used for post-action cleanup, statistics, etc.
Override me!

**Kind**: instance method of [<code>Anomaly</code>](#module_Anomalies.Anomaly)  
**Returns**: <code>Promise</code> - promise that resolves when the evaluation is complete  
**Throws**:

- <code>Error</code> error on error


| Param | Type | Description |
| --- | --- | --- |
| system | <code>object</code> | the system being analyzed |
| opts | <code>object</code> | arbitrary options |

<a name="module_Anomalies.Anomaly+fingerprint"></a>

##### anomaly.fingerprint(system, keys) ⇒ <code>string</code>
Fingerprint

Fingerprint the system.  Base implementation is to convert specified keys (or all keys) to a string,
then calculate the SHA256 hash of the string.

**Kind**: instance method of [<code>Anomaly</code>](#module_Anomalies.Anomaly)  
**Returns**: <code>string</code> - the fingerprint  
**Throws**:

- <code>Error</code> error on error


| Param | Type | Description |
| --- | --- | --- |
| system | <code>object</code> | the system being analyzed |
| keys | <code>array.&lt;string&gt;</code> | the keys to include in the fingerprint |

<a name="module_Anomalies.Anomaly+iterations"></a>

##### anomaly.iterations([state]) ⇒ <code>number</code>
State iterations counter

Show how many times we have transitioned to a given state

**Kind**: instance method of [<code>Anomaly</code>](#module_Anomalies.Anomaly)  
**Returns**: <code>number</code> - the number of times we have transitioned to this state  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [state] | <code>string</code> | <code>&quot;\&quot;Postaction\&quot;&quot;</code> | the state to count |

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

##### Anomaly.detect(system, opts) ⇒ <code>Promiose.&lt;boolean&gt;</code>
Detect

Detect an anomaly
Override me!

**Kind**: static method of [<code>Anomaly</code>](#module_Anomalies.Anomaly)  
**Returns**: <code>Promiose.&lt;boolean&gt;</code> - true if an anomaly is detected  
**Throws**:

- <code>Error</code> error on error


| Param | Type | Description |
| --- | --- | --- |
| system | <code>object</code> | the system being analyzed |
| opts | <code>object</code> | arbitrary options |

<a name="module_Anomalies.Anomaly.serialize"></a>

##### Anomaly.serialize(keys) ⇒ <code>string</code>
Serialize

Serialize this anomaly for storage.  By default, we serialize the following keys: #id, #name, #state, #log, #paused
The result is consumed by the constructor, which expects a JSON string whose keys represent the properties to restore.

If you override this funciton, you should call super.serialize() and add your own keys to the result.

**Kind**: static method of [<code>Anomaly</code>](#module_Anomalies.Anomaly)  
**Returns**: <code>string</code> - the serialized anomaly  
**Throws**:

- <code>Error</code> error on error


| Param | Type | Description |
| --- | --- | --- |
| keys | <code>array.&lt;string&gt;</code> | the keys to serialize |

<a name="module_Anomalies.Anomaly.from_serialized"></a>

##### Anomaly.from\_serialized(str) ⇒ <code>Anomaly</code>
From Serialized

Create an anomaly from a serialized string.  The string is expected to be a JSON string whose keys represent the properties to restore.

**Kind**: static method of [<code>Anomaly</code>](#module_Anomalies.Anomaly)  
**Returns**: <code>Anomaly</code> - the anomaly  
**Throws**:

- <code>Error</code> error on error


| Param | Type | Description |
| --- | --- | --- |
| str | <code>string</code> | the serialized anomaly |

<a name="module_Anomalies.Processor"></a>

#### Anomalies.Processor
AnomalyProcessor

Process anomaly

**Kind**: static class of [<code>Anomalies</code>](#module_Anomalies)  

* [.Processor](#module_Anomalies.Processor)
    * [new Processor([classes])](#new_module_Anomalies.Processor_new)
    * [.anomalies](#module_Anomalies.Processor+anomalies) ⇒ <code>Array.&lt;Anomaly&gt;</code>
    * [.classes](#module_Anomalies.Processor+classes) ⇒ <code>Array.&lt;Anomaly&gt;</code>
    * [.anomalies_with_state(state)](#module_Anomalies.Processor+anomalies_with_state) ⇒ <code>Array.&lt;Anomaly&gt;</code>
    * [.detect(system, opts)](#module_Anomalies.Processor+detect)
    * [.process(system, opts)](#module_Anomalies.Processor+process) ⇒ <code>Promise</code>
    * [.process_one()](#module_Anomalies.Processor+process_one) ⇒ <code>Promise.&lt;(Anomaly\|null)&gt;</code>

<a name="new_module_Anomalies.Processor_new"></a>

##### new Processor([classes])
Create a new Processor

**Returns**: <code>Processor</code> - the new Processor  
**Throws**:

- <code>Error</code> if classes is not an array


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [classes] | <code>Array.&lt;Anomaly&gt;</code> | <code>[]</code> | An array of Anomaly classes we may detect |

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

##### processor.process(system, opts) ⇒ <code>Promise</code>
Process all anomalies

Processes all anomalies in the queue from the Preaction state to the Resolved state (if possible).  May call .action(), .evaluate(), .revert()
Events are bubbled up from each anomaly.

**Kind**: instance method of [<code>Processor</code>](#module_Anomalies.Processor)  
**Returns**: <code>Promise</code> - resolves when all anomalies are processed  
**Emits**: [<code>log</code>](#Anomaly+event_log), [<code>state</code>](#Anomaly+event_state), [<code>pause</code>](#Anomaly+event_pause), [<code>resume</code>](#Anomaly+event_resume), [<code>activity</code>](#Anomaly+event_activity)  

| Param | Type | Description |
| --- | --- | --- |
| system | <code>object</code> | The system to detect anomalies in |
| opts | <code>object</code> | Options to pass to the methods (action() etc) |

<a name="module_Anomalies.Processor+process_one"></a>

##### processor.process\_one() ⇒ <code>Promise.&lt;(Anomaly\|null)&gt;</code>
Process one anomaly 

Finds the first (by order) anomaly with a state of "Preaction" and processes it
to the Resolved state (if possible).  May call .action(), .evaluate(), .revert()
Events are bubbled up.

**Kind**: instance method of [<code>Processor</code>](#module_Anomalies.Processor)  
**Returns**: <code>Promise.&lt;(Anomaly\|null)&gt;</code> - the anomaly processed, or null if there are no anomalies to process.  You can check for success by checking the anomaly itself.  
**Emits**: [<code>log</code>](#Anomaly+event_log), [<code>state</code>](#Anomaly+event_state), [<code>pause</code>](#Anomaly+event_pause), [<code>resume</code>](#Anomaly+event_resume), [<code>activity</code>](#Anomaly+event_activity)  

<!-- apistop -->
