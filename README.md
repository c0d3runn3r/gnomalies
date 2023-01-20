# Gnomalies
Reversible, controlled anomaly detection and management 
![Gnomaly](img/gnome.png "The Gnomaly"){height=300 align=right}


## Table of Contents

<!-- toc -->

- [Example](#example)
- [Anomalies](#anomalies)
- [Processor](#processor)
- [Subclassing notes](#subclassing-notes)
- [Todo](#todo)
- [Acknowledgements](#acknowledgements)
- [License](#license)
- [API](#api)
  * [Modules](#modules)
  * [Classes](#classes)
  * [Gnomalies](#gnomalies)
  * [Key](#key)
  * [KeyExtractor](#keyextractor)

<!-- tocstop -->

## Example
```
const Gnomalies = require("../index.js");

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

(async ()=>{

    // Fix the system
    let processor = new Gnomalies.Processor([EvilLowercase, SadFace]);
    await processor.detect(system);  // processor.anomalies now contains relevant anomalies
    await processor.process(system);

    console.log(system.str); // "HELLO WORLD 🙂"

})();
```

## Anomalies 
We define a *system* as "an entity represented by a collection of values".  An *anomaly* is the condition that a subset of those values are in an inferior state that could potentially be transformed into a superior state. The `Anomaly` class containes a set of functions that allow us to process these anomalies in a systematic way, including fingerprinting and reversion management.

| Wrapper                       | Override this function    | Purpose                                                    |
|-------------------------------|---------------------------|------------------------------------------------------------|
| `Anomaly.detect(system, opts)`| `_detect(system, opts)`   | Detect an anomaly (static function!)                       |
| `.action(system, opts)`       | `_action(system, opts)`   | Correct the anomaly by changing `system`                   |
| `.revert(system, opts)`       | `_revert(system, opts)`   | Undo `action()`                                            |
| `.evaluate(system, opts)`     | `_evaluate(system, opts)` | Evaluate the successfulness of `action()` or `revert()`    |

As you can see, the workhorse anomaly management functions you should override start with `_underscore`.  Do not call the underscore function directly however; please call the wrapper (no underscore).  This allows us to handle events, fingerprinting, etc while keeping your code simple.

 When an anomaly is actioned we take before-and-after fingerprints so that we can ensure any reversion is done properly and actually results in a resoration of the original state.  We also check fingerprints before starting a reversion (to make sure we are reverting the same thing we actioned). By default, this is all done by taking the SHA256 hash of  `JSON.serialize(system)`.  Do make sure you set `fingerprint_keys` to something sensible if you don't want everything about your *system* fingerprinted.

 `revert()` is intelligent enough to know that a fingerprint matching your preaction fingerprint means no reversion is necessary; overloaded `_revert()` will never gets called. In that case, the fingerprint is further checked against the postaction fingerprint.  A match means that we should be able to perform a clean reversion; `_revert()` is called.  A mismatch means we are in some sort of dirty state; an error is thrown.

 Once `_revert()` is done, the wrapping `revert()` checks fingerprints to make sure we have a pristine `preaction` state.  A mismatch will throw an error.

## Processor
A helpful `Processor` class is included that can automate much of the anomaly detection, processing, error handling, and reversion work.  To use a Processor, pass an array of Anomaly classes (not instances!) to it's constructor.  Then call `.detect()`, passing a system.  The Processor will call each anomaly's `.detect()` method, constructing anomaly objects for those that return `true` and storing the resulting array in `.anomalies`.  You can then call `Processor.process()` to `.action()` each anomaly on the system.

When using `processor.process()`, errors thrown in `anomaly.action()` result in an automatic call to `anomaly.revert()`.   If `revert()` also throws, the `anomaly.dirty` will be set to `true`.

Once you have processed all anomalies, you should check to see which ones are paused, and if any of those are dirty.

![Anomaly State Graph](img/anomaly_state_graph.png "Anomaly State Graph")

A few important departures from the original concept (//delete me after everyone is on board)
1. `Anomaly.state` tracks only the state of the anomaly with respect to the `action()`.  
2. Since 'paused' (or ManualReview) doesn't tell us anything about the state, it's actually just a property - not a state.  This is `.paused`.
3. Activity notifications about work being done are events (e.g. `Anomaly#activity` -> `{"activity" : "detect", "progress" : "45" }`)
4. We don't retain any logger references or emit 'error_log' events.  Instead we emit `Anomaly#log` events for all `Anomaly.log()` calls.  If you want to log these in a logger, just consume them from the `Processor`.

## Subclassing notes 
- Most overridden functions are `async`
- When you implement `_revert()`, you are expected to store whatever data you need during `_action()` in order to perform the reversion.  Make sure you override `.serialize()` and `.from_serialized()` so that this data gets stored with your class!
- You should override `fingerprint()` to call the base method with just the keys that should be used in the fingerprint.  Otherwise all keys in `system` will be fingerprinted by default.
- You may emit Anomaly#activity with your progress, in percent.  `Anomaly` will emit 0 and 100 for you as bookends automatically.
- Use the built in `Anomaly.log.{debug|info|warn|error}()` methods for logging.  It is accessable via `.history`.  Each call will also emit `Anomaly#log` events, making it easy to connect with your external logging engine.

## Todo
- 

## Acknowledgements

Thanks to Dr. Jonathan Van Schenck for developing the Anomaly Report concept.  This project is based on his original class.

## License

Copyright (c) 2022 Nova Dynamics

## API

<!-- api -->

### Modules

<dl>
<dt><a href="#module_Gnomalies">Gnomalies</a></dt>
<dd></dd>
</dl>

### Classes

<dl>
<dt><a href="#Key">Key</a></dt>
<dd><p>Key</p>
<p>A rich representation of a key extracted from an object</p>
</dd>
<dt><a href="#KeyExtractor">KeyExtractor</a></dt>
<dd><p>KeyExtractor</p>
<p>Extract all keys from an object</p>
</dd>
</dl>

<a name="module_Gnomalies"></a>

### Gnomalies

* [Gnomalies](#module_Gnomalies)
    * [.Anomaly](#module_Gnomalies.Anomaly)
        * [new Anomaly(params)](#new_module_Gnomalies.Anomaly_new)
        * _instance_
            * [.fingerprints](#module_Gnomalies.Anomaly+fingerprints) ⇒ <code>object</code> \| <code>string</code> \| <code>string</code>
            * [.fingerprint_keys](#module_Gnomalies.Anomaly+fingerprint_keys) ⇒ <code>array.&lt;string&gt;</code>
            * [.dirty](#module_Gnomalies.Anomaly+dirty) ⇒ <code>boolean</code>
            * [.dirty](#module_Gnomalies.Anomaly+dirty)
            * [.name](#module_Gnomalies.Anomaly+name) ⇒ <code>string</code>
            * [.paused](#module_Gnomalies.Anomaly+paused) ⇒ <code>boolean</code>
            * [.id](#module_Gnomalies.Anomaly+id) ⇒ <code>string</code>
            * [.history](#module_Gnomalies.Anomaly+history) ⇒ <code>array</code>
            * [.state](#module_Gnomalies.Anomaly+state) ⇒ <code>string</code>
            * [.action(system, opts)](#module_Gnomalies.Anomaly+action) ⇒ <code>Promise</code>
            * [.revert(system, opts)](#module_Gnomalies.Anomaly+revert) ⇒ <code>Promise</code>
            * [.evaluate(system, opts)](#module_Gnomalies.Anomaly+evaluate) ⇒ <code>Promise</code>
            * [.toJSON(keys)](#module_Gnomalies.Anomaly+toJSON) ⇒ <code>object</code>
            * [.snapshot(system)](#module_Gnomalies.Anomaly+snapshot) ⇒ <code>object</code>
            * [.fingerprint(system)](#module_Gnomalies.Anomaly+fingerprint) ⇒ <code>string</code>
            * [.iterations([state])](#module_Gnomalies.Anomaly+iterations) ⇒ <code>number</code>
            * [.pause(reason)](#module_Gnomalies.Anomaly+pause)
            * [.resume(reason)](#module_Gnomalies.Anomaly+resume)
        * _static_
            * [.allowed_states](#module_Gnomalies.Anomaly.allowed_states) ⇒ <code>array</code>
            * [._detect()](#module_Gnomalies.Anomaly._detect)
            * [.detect(system, opts)](#module_Gnomalies.Anomaly.detect) ⇒ <code>Promiose.&lt;boolean&gt;</code>
    * [.Processor](#module_Gnomalies.Processor)
        * [new Processor([classes])](#new_module_Gnomalies.Processor_new)
        * [.anomalies](#module_Gnomalies.Processor+anomalies) ⇒ <code>Array.&lt;Anomaly&gt;</code>
        * [.classes](#module_Gnomalies.Processor+classes) ⇒ <code>Array.&lt;Anomaly&gt;</code>
        * [.reset()](#module_Gnomalies.Processor+reset) ⇒ <code>Processor</code>
        * [.serialize()](#module_Gnomalies.Processor+serialize) ⇒ <code>string</code>
        * [.deserialize(data)](#module_Gnomalies.Processor+deserialize) ⇒ <code>Processor</code>
        * [.anomalies_with_state(state)](#module_Gnomalies.Processor+anomalies_with_state) ⇒ <code>Array.&lt;Anomaly&gt;</code>
        * [.detect(system, opts)](#module_Gnomalies.Processor+detect)
        * [.process(system, opts)](#module_Gnomalies.Processor+process) ⇒ <code>Promise</code>
        * [.process_one()](#module_Gnomalies.Processor+process_one) ⇒ <code>Promise.&lt;(Anomaly\|null)&gt;</code>

<a name="module_Gnomalies.Anomaly"></a>

#### Gnomalies.Anomaly
Anomaly

To use this class, extend it and override .detect(), .action(), and any other methods you need.
If you are saving the anomaly for later use, you should also make sure .serialize() and .deserialize() will meet your needs.
If your processor will be using fingerprints, you should also make sure .fingerprint() will meet your needs.

**Kind**: static class of [<code>Gnomalies</code>](#module_Gnomalies)  

* [.Anomaly](#module_Gnomalies.Anomaly)
    * [new Anomaly(params)](#new_module_Gnomalies.Anomaly_new)
    * _instance_
        * [.fingerprints](#module_Gnomalies.Anomaly+fingerprints) ⇒ <code>object</code> \| <code>string</code> \| <code>string</code>
        * [.fingerprint_keys](#module_Gnomalies.Anomaly+fingerprint_keys) ⇒ <code>array.&lt;string&gt;</code>
        * [.dirty](#module_Gnomalies.Anomaly+dirty) ⇒ <code>boolean</code>
        * [.dirty](#module_Gnomalies.Anomaly+dirty)
        * [.name](#module_Gnomalies.Anomaly+name) ⇒ <code>string</code>
        * [.paused](#module_Gnomalies.Anomaly+paused) ⇒ <code>boolean</code>
        * [.id](#module_Gnomalies.Anomaly+id) ⇒ <code>string</code>
        * [.history](#module_Gnomalies.Anomaly+history) ⇒ <code>array</code>
        * [.state](#module_Gnomalies.Anomaly+state) ⇒ <code>string</code>
        * [.action(system, opts)](#module_Gnomalies.Anomaly+action) ⇒ <code>Promise</code>
        * [.revert(system, opts)](#module_Gnomalies.Anomaly+revert) ⇒ <code>Promise</code>
        * [.evaluate(system, opts)](#module_Gnomalies.Anomaly+evaluate) ⇒ <code>Promise</code>
        * [.toJSON(keys)](#module_Gnomalies.Anomaly+toJSON) ⇒ <code>object</code>
        * [.snapshot(system)](#module_Gnomalies.Anomaly+snapshot) ⇒ <code>object</code>
        * [.fingerprint(system)](#module_Gnomalies.Anomaly+fingerprint) ⇒ <code>string</code>
        * [.iterations([state])](#module_Gnomalies.Anomaly+iterations) ⇒ <code>number</code>
        * [.pause(reason)](#module_Gnomalies.Anomaly+pause)
        * [.resume(reason)](#module_Gnomalies.Anomaly+resume)
    * _static_
        * [.allowed_states](#module_Gnomalies.Anomaly.allowed_states) ⇒ <code>array</code>
        * [._detect()](#module_Gnomalies.Anomaly._detect)
        * [.detect(system, opts)](#module_Gnomalies.Anomaly.detect) ⇒ <code>Promiose.&lt;boolean&gt;</code>

<a name="new_module_Gnomalies.Anomaly_new"></a>

##### new Anomaly(params)
constructor

**Throws**:

- <code>Error</code> error on invalid parameter


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| params | <code>object</code> |  | parameters for this object |
| [params.history] | <code>array</code> |  | the log |
| [params.id] | <code>string</code> |  | the id |
| [params.description] | <code>string</code> |  | a short description of this anomaly type |
| [params.state] | <code>string</code> |  | the state |
| [params.paused] | <code>boolean</code> |  | whether the anomaly is paused |
| [params.dirty] | <code>boolean</code> |  | whether the anomaly is dirty |
| [params.fingerprint_keys] | <code>array</code> | <code></code> | the keys that will be used to generate fingerprints, or null for all keys.  Expects full paths into the systems to be analyzed, e.g. ["a.name", "b.name.first"] |
| [params.fingerprints] | <code>object</code> |  | the fingerprints |

<a name="module_Gnomalies.Anomaly+fingerprints"></a>

##### anomaly.fingerprints ⇒ <code>object</code> \| <code>string</code> \| <code>string</code>
fingerprints (getter)

**Kind**: instance property of [<code>Anomaly</code>](#module_Gnomalies.Anomaly)  
**Returns**: <code>object</code> - fingerprints the fingerprints<code>string</code> - fingerprints.preaction the fingerprint before the action<code>string</code> - fingerprints.postaction the fingerprint after the action  
<a name="module_Gnomalies.Anomaly+fingerprint_keys"></a>

##### anomaly.fingerprint\_keys ⇒ <code>array.&lt;string&gt;</code>
fingerprint_keys (getter)

This is set in the constructor and can't be changed after instantiation (otherwise fingerprints would stop being reliable)

**Kind**: instance property of [<code>Anomaly</code>](#module_Gnomalies.Anomaly)  
**Returns**: <code>array.&lt;string&gt;</code> - the keys that are used to generate fingerprints  
<a name="module_Gnomalies.Anomaly+dirty"></a>

##### anomaly.dirty ⇒ <code>boolean</code>
dirty (getter)

This flag is set by the processor to indicate we failed somewhere during a state transition

**Kind**: instance property of [<code>Anomaly</code>](#module_Gnomalies.Anomaly)  
**Returns**: <code>boolean</code> - true if this anomaly is dirty  
<a name="module_Gnomalies.Anomaly+dirty"></a>

##### anomaly.dirty
dirty (setter)

This flag is set by the processor to indicate we failed somewhere during a state transition

**Kind**: instance property of [<code>Anomaly</code>](#module_Gnomalies.Anomaly)  

| Param | Type | Description |
| --- | --- | --- |
| dirty | <code>boolean</code> | true if this anomaly is dirty |

<a name="module_Gnomalies.Anomaly+name"></a>

##### anomaly.name ⇒ <code>string</code>
name (getter)

**Kind**: instance property of [<code>Anomaly</code>](#module_Gnomalies.Anomaly)  
**Returns**: <code>string</code> - the name of this anomaly  
<a name="module_Gnomalies.Anomaly+paused"></a>

##### anomaly.paused ⇒ <code>boolean</code>
paused (getter)

**Kind**: instance property of [<code>Anomaly</code>](#module_Gnomalies.Anomaly)  
**Returns**: <code>boolean</code> - true if this is paused  
<a name="module_Gnomalies.Anomaly+id"></a>

##### anomaly.id ⇒ <code>string</code>
id (getter)

**Kind**: instance property of [<code>Anomaly</code>](#module_Gnomalies.Anomaly)  
**Returns**: <code>string</code> - the id for this anomaly  
<a name="module_Gnomalies.Anomaly+history"></a>

##### anomaly.history ⇒ <code>array</code>
Log (getter)

**Kind**: instance property of [<code>Anomaly</code>](#module_Gnomalies.Anomaly)  
**Returns**: <code>array</code> - the log for this anomaly  
<a name="module_Gnomalies.Anomaly+state"></a>

##### anomaly.state ⇒ <code>string</code>
state (getter)

**Kind**: instance property of [<code>Anomaly</code>](#module_Gnomalies.Anomaly)  
**Returns**: <code>string</code> - the state of the anomaly  
<a name="module_Gnomalies.Anomaly+action"></a>

##### anomaly.action(system, opts) ⇒ <code>Promise</code>
Action

Performs the action for this anomaly.  If the anomaly is not in a preaction state, an error is thrown.  When using fingerprints, we take the fingerprint before and after calling _action().
Do not override me. Override _action() instead!

**Kind**: instance method of [<code>Anomaly</code>](#module_Gnomalies.Anomaly)  
**Returns**: <code>Promise</code> - promise that resolves when the action is complete  
**Throws**:

- <code>Error</code> error if the anomaly is not in a preaction state or system is undefined

**Emits**: [<code>activity</code>](#Anomaly+event_activity)  

| Param | Type | Description |
| --- | --- | --- |
| system | <code>object</code> | the system being analyzed |
| opts | <code>object</code> | arbitrary options |

<a name="module_Gnomalies.Anomaly+revert"></a>

##### anomaly.revert(system, opts) ⇒ <code>Promise</code>
Revert

Undo the action for this anomaly.  If we are in a preaction state and using fingerprints, we verify the fingerprint and then return.  Otherwise, we check that we match the postaction fingerprint; call _revert(), and then check the preaction fingerprint.  If any of this fails, we throw an error.
Do not override me. Override _revert() instead!

**Kind**: instance method of [<code>Anomaly</code>](#module_Gnomalies.Anomaly)  
**Returns**: <code>Promise</code> - promise that resolves when the reversion is complete  
**Throws**:

- <code>Error</code> error on error

**Emits**: [<code>activity</code>](#Anomaly+event_activity)  

| Param | Type | Description |
| --- | --- | --- |
| system | <code>object</code> | the system being analyzed |
| opts | <code>object</code> | arbitrary options |

<a name="module_Gnomalies.Anomaly+evaluate"></a>

##### anomaly.evaluate(system, opts) ⇒ <code>Promise</code>
Evaluate

Evaluate the success of our action.
Throw an error if you believe the action or reversion failed.
Can also be used for post-action cleanup, statistics, etc.
Do not override me. Override _evaluate() instead!

**Kind**: instance method of [<code>Anomaly</code>](#module_Gnomalies.Anomaly)  
**Returns**: <code>Promise</code> - promise that resolves when the evaluation is complete  
**Throws**:

- <code>Error</code> error on error

**Emits**: [<code>activity</code>](#Anomaly+event_activity)  

| Param | Type | Description |
| --- | --- | --- |
| system | <code>object</code> | the system being analyzed |
| opts | <code>object</code> | arbitrary options |

<a name="module_Gnomalies.Anomaly+toJSON"></a>

##### anomaly.toJSON(keys) ⇒ <code>object</code>
toJSON

Serialize this anomaly for storage.  By default, we serialize the following keys: #id, #name, #state, #log, #paused, #dirty, #fingerprint_keys

If you override this funciton, you should call super.serialize() and add your own keys to the result.

**Kind**: instance method of [<code>Anomaly</code>](#module_Gnomalies.Anomaly)  
**Returns**: <code>object</code> - the JSON-ized object  
**Throws**:

- <code>Error</code> error on error


| Param | Type | Description |
| --- | --- | --- |
| keys | <code>array.&lt;string&gt;</code> | the keys to serialize |

<a name="module_Gnomalies.Anomaly+snapshot"></a>

##### anomaly.snapshot(system) ⇒ <code>object</code>
Snapshot

Take a snapshot of the system suitable for fingerprinting.

**Kind**: instance method of [<code>Anomaly</code>](#module_Gnomalies.Anomaly)  
**Returns**: <code>object</code> - the snapshot  

| Param | Type | Description |
| --- | --- | --- |
| system | <code>object</code> | the system being analyzed |

<a name="module_Gnomalies.Anomaly+fingerprint"></a>

##### anomaly.fingerprint(system) ⇒ <code>string</code>
Fingerprint

Creates a SHA256 hash of the system's keys and values, using the set of keys that were specified in our constructor.
Skips keys that point to functions.

**Kind**: instance method of [<code>Anomaly</code>](#module_Gnomalies.Anomaly)  
**Returns**: <code>string</code> - the fingerprint as a hex string  
**Throws**:

- <code>Error</code> error if we can't find a specified key


| Param | Type | Description |
| --- | --- | --- |
| system | <code>object</code> | the system being analyzed |

<a name="module_Gnomalies.Anomaly+iterations"></a>

##### anomaly.iterations([state]) ⇒ <code>number</code>
State iterations counter

Show how many times we have transitioned to a given state

**Kind**: instance method of [<code>Anomaly</code>](#module_Gnomalies.Anomaly)  
**Returns**: <code>number</code> - the number of times we have transitioned to this state  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [state] | <code>string</code> | <code>&quot;\&quot;postaction\&quot;&quot;</code> | the state to count |

<a name="module_Gnomalies.Anomaly+pause"></a>

##### anomaly.pause(reason)
pause

Pause this anomaly

**Kind**: instance method of [<code>Anomaly</code>](#module_Gnomalies.Anomaly)  
**Emit**: Anomaly#pause  

| Param | Type | Description |
| --- | --- | --- |
| reason | <code>string</code> | the reason for the pause |

<a name="module_Gnomalies.Anomaly+resume"></a>

##### anomaly.resume(reason)
resume

Resume this anomaly

**Kind**: instance method of [<code>Anomaly</code>](#module_Gnomalies.Anomaly)  
**Emit**: Anomaly#resume  

| Param | Type | Description |
| --- | --- | --- |
| reason | <code>string</code> | the reason for the resume |

<a name="module_Gnomalies.Anomaly.allowed_states"></a>

##### Anomaly.allowed\_states ⇒ <code>array</code>
allowed_states (getter)

**Kind**: static property of [<code>Anomaly</code>](#module_Gnomalies.Anomaly)  
**Returns**: <code>array</code> - the allowed states  
<a name="module_Gnomalies.Anomaly._detect"></a>

##### Anomaly.\_detect()
Placeholder functions - these don't do anything until they are overidden
Function signature matches that of their non-underscored wrappers

**Kind**: static method of [<code>Anomaly</code>](#module_Gnomalies.Anomaly)  
<a name="module_Gnomalies.Anomaly.detect"></a>

##### Anomaly.detect(system, opts) ⇒ <code>Promiose.&lt;boolean&gt;</code>
Detect an anomaly.
Don't override me. Override _detect() instead!

**Kind**: static method of [<code>Anomaly</code>](#module_Gnomalies.Anomaly)  
**Returns**: <code>Promiose.&lt;boolean&gt;</code> - true if an anomaly is detected  
**Throws**:

- <code>Error</code> error on error


| Param | Type | Description |
| --- | --- | --- |
| system | <code>object</code> | the system being analyzed |
| opts | <code>object</code> | arbitrary options |

<a name="module_Gnomalies.Processor"></a>

#### Gnomalies.Processor
AnomalyProcessor

Detect and process anomalies in a queue.  Call the constructor with an array of Anomaly classes, then await .detect() and .process()

**Kind**: static class of [<code>Gnomalies</code>](#module_Gnomalies)  

* [.Processor](#module_Gnomalies.Processor)
    * [new Processor([classes])](#new_module_Gnomalies.Processor_new)
    * [.anomalies](#module_Gnomalies.Processor+anomalies) ⇒ <code>Array.&lt;Anomaly&gt;</code>
    * [.classes](#module_Gnomalies.Processor+classes) ⇒ <code>Array.&lt;Anomaly&gt;</code>
    * [.reset()](#module_Gnomalies.Processor+reset) ⇒ <code>Processor</code>
    * [.serialize()](#module_Gnomalies.Processor+serialize) ⇒ <code>string</code>
    * [.deserialize(data)](#module_Gnomalies.Processor+deserialize) ⇒ <code>Processor</code>
    * [.anomalies_with_state(state)](#module_Gnomalies.Processor+anomalies_with_state) ⇒ <code>Array.&lt;Anomaly&gt;</code>
    * [.detect(system, opts)](#module_Gnomalies.Processor+detect)
    * [.process(system, opts)](#module_Gnomalies.Processor+process) ⇒ <code>Promise</code>
    * [.process_one()](#module_Gnomalies.Processor+process_one) ⇒ <code>Promise.&lt;(Anomaly\|null)&gt;</code>

<a name="new_module_Gnomalies.Processor_new"></a>

##### new Processor([classes])
Create a new Processor

**Returns**: <code>Processor</code> - the new Processor  
**Throws**:

- <code>Error</code> if classes is not an array


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [classes] | <code>Array.&lt;Anomaly&gt;</code> | <code>[]</code> | An array of Anomaly classes we may detect |

<a name="module_Gnomalies.Processor+anomalies"></a>

##### processor.anomalies ⇒ <code>Array.&lt;Anomaly&gt;</code>
Get all anomalies

**Kind**: instance property of [<code>Processor</code>](#module_Gnomalies.Processor)  
**Returns**: <code>Array.&lt;Anomaly&gt;</code> - the queue of anomalies  
<a name="module_Gnomalies.Processor+classes"></a>

##### processor.classes ⇒ <code>Array.&lt;Anomaly&gt;</code>
Get all classes

**Kind**: instance property of [<code>Processor</code>](#module_Gnomalies.Processor)  
**Returns**: <code>Array.&lt;Anomaly&gt;</code> - all Anomaly classes  
<a name="module_Gnomalies.Processor+reset"></a>

##### processor.reset() ⇒ <code>Processor</code>
Reset the set of anomalies

**Kind**: instance method of [<code>Processor</code>](#module_Gnomalies.Processor)  
**Returns**: <code>Processor</code> - this for chaining  
**Emits**: [<code>reset</code>](#Processor+event_reset)  
<a name="module_Gnomalies.Processor+serialize"></a>

##### processor.serialize() ⇒ <code>string</code>
Serialize all anomalies

**Kind**: instance method of [<code>Processor</code>](#module_Gnomalies.Processor)  
**Returns**: <code>string</code> - the serialized anomalies  
<a name="module_Gnomalies.Processor+deserialize"></a>

##### processor.deserialize(data) ⇒ <code>Processor</code>
Deserialize anomalies into our .anomalies property

**Kind**: instance method of [<code>Processor</code>](#module_Gnomalies.Processor)  
**Returns**: <code>Processor</code> - this for chaining  
**Throws**:

- <code>Error</code> error on error


| Param | Type | Description |
| --- | --- | --- |
| data | <code>string</code> | The serialized anomalies |

<a name="module_Gnomalies.Processor+anomalies_with_state"></a>

##### processor.anomalies\_with\_state(state) ⇒ <code>Array.&lt;Anomaly&gt;</code>
Get anomalies with a particular state

**Kind**: instance method of [<code>Processor</code>](#module_Gnomalies.Processor)  
**Returns**: <code>Array.&lt;Anomaly&gt;</code> - anomalies with the specified state  
**Throws**:

- <code>Error</code> if state is invalid


| Param | Type | Description |
| --- | --- | --- |
| state | <code>string</code> | The state to filter on |

<a name="module_Gnomalies.Processor+detect"></a>

##### processor.detect(system, opts)
Detect anomalies in a system

Adds anomalies to the queue

**Kind**: instance method of [<code>Processor</code>](#module_Gnomalies.Processor)  

| Param | Type | Description |
| --- | --- | --- |
| system | <code>object</code> | The system to detect anomalies in |
| opts | <code>object</code> | Options to pass to the detect() methods |

<a name="module_Gnomalies.Processor+process"></a>

##### processor.process(system, opts) ⇒ <code>Promise</code>
Process all anomalies

Processes all anomalies in the queue from the preaction state to the resolved state (if possible).  May call .action(), .evaluate(), .revert()
Events are bubbled up from each anomaly.  Anomalies that fail between states will be paused and will be set to `.dirty` state

**Kind**: instance method of [<code>Processor</code>](#module_Gnomalies.Processor)  
**Returns**: <code>Promise</code> - resolves when all anomalies are processed  
**Emits**: [<code>log</code>](#Anomaly+event_log), [<code>state</code>](#Anomaly+event_state), [<code>pause</code>](#Anomaly+event_pause), [<code>resume</code>](#Anomaly+event_resume), [<code>activity</code>](#Anomaly+event_activity)  

| Param | Type | Description |
| --- | --- | --- |
| system | <code>object</code> | The system to detect anomalies in |
| opts | <code>object</code> | Options to pass to the methods (action() etc) |

<a name="module_Gnomalies.Processor+process_one"></a>

##### processor.process\_one() ⇒ <code>Promise.&lt;(Anomaly\|null)&gt;</code>
Process one anomaly 

Finds the first (by order) anomaly with a state of "preaction" and processes it
to the resolved state (if possible).  May call .action(), .evaluate(), .revert()
Events are bubbled up. Anomalies that fail between states will be paused and will be set to `.dirty` state

**Kind**: instance method of [<code>Processor</code>](#module_Gnomalies.Processor)  
**Returns**: <code>Promise.&lt;(Anomaly\|null)&gt;</code> - the anomaly processed, or null if there are no anomalies to process.  You can check for success by checking the anomaly itself.  
**Emits**: [<code>log</code>](#Anomaly+event_log), [<code>state</code>](#Anomaly+event_state), [<code>pause</code>](#Anomaly+event_pause), [<code>resume</code>](#Anomaly+event_resume), [<code>activity</code>](#Anomaly+event_activity)  
<a name="Key"></a>

### Key
Key

A rich representation of a key extracted from an object

**Kind**: global class  

* [Key](#Key)
    * [new Key(name, type, [path], [value])](#new_Key_new)
    * _instance_
        * [.fullname](#Key+fullname) ⇒ <code>string</code>
        * [.name](#Key+name) ⇒ <code>string</code>
        * [.type](#Key+type) ⇒ <code>string</code>
        * [.path](#Key+path) ⇒ <code>string</code>
        * [.value](#Key+value) ⇒ <code>any</code>
        * [.compare(other)](#Key+compare) ⇒ <code>number</code>
    * _static_
        * [.compare(a, b)](#Key.compare) ⇒ <code>number</code>

<a name="new_Key_new"></a>

#### new Key(name, type, [path], [value])
Constructor


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | <code>string</code> |  | the name of the key |
| type | <code>string</code> |  | the type of thing pointed to by the key |
| [path] | <code>string</code> | <code>null</code> | the parent path |
| [value] | <code>any</code> | <code></code> | the value of the key |

<a name="Key+fullname"></a>

#### key.fullname ⇒ <code>string</code>
Get the full name (path) of the key, e.g. "a.b.0.name"

**Kind**: instance property of [<code>Key</code>](#Key)  
**Returns**: <code>string</code> - the full name of the key  
<a name="Key+name"></a>

#### key.name ⇒ <code>string</code>
Get the name of the key, e.g. "name"

**Kind**: instance property of [<code>Key</code>](#Key)  
**Returns**: <code>string</code> - the name of the key  
<a name="Key+type"></a>

#### key.type ⇒ <code>string</code>
Get the type of the key, e.g. "string"

**Kind**: instance property of [<code>Key</code>](#Key)  
**Returns**: <code>string</code> - the type of the key  
<a name="Key+path"></a>

#### key.path ⇒ <code>string</code>
Get the path of the key, but not its own name: e.g. "a.b.0"

**Kind**: instance property of [<code>Key</code>](#Key)  
**Returns**: <code>string</code> - the path of the key  
<a name="Key+value"></a>

#### key.value ⇒ <code>any</code>
Get the value pointed at by the key (if any) in the original object

**Kind**: instance property of [<code>Key</code>](#Key)  
**Returns**: <code>any</code> - the value of the key  
<a name="Key+compare"></a>

#### key.compare(other) ⇒ <code>number</code>
Compare another key to this key

**Kind**: instance method of [<code>Key</code>](#Key)  
**Returns**: <code>number</code> - -1 if this < other, 0 if this == other, 1 if this > other  

| Param | Type | Description |
| --- | --- | --- |
| other | [<code>Key</code>](#Key) | the other key |

<a name="Key.compare"></a>

#### Key.compare(a, b) ⇒ <code>number</code>
Compare two keys (for sorting).  This is just a string comparison of `.fullname`.
Future work could be to make this sort number-like array elements numerically, e.g. "a.b.2" should be before "a.b.10"

**Kind**: static method of [<code>Key</code>](#Key)  
**Returns**: <code>number</code> - -1 if a < b, 0 if a == b, 1 if a > b  

| Param | Type | Description |
| --- | --- | --- |
| a | [<code>Key</code>](#Key) | the first key |
| b | [<code>Key</code>](#Key) | the second key |

<a name="KeyExtractor"></a>

### KeyExtractor
KeyExtractor

Extract all keys from an object

**Kind**: global class  
<a name="KeyExtractor.extract"></a>

#### KeyExtractor.extract(obj) ⇒ [<code>array.&lt;Key&gt;</code>](#Key)
Extract all keys from an object

This function extracts a set of deep keys (like "a.b.0.name") from a nested collection of objects, arrays, Maps and Sets.  
Map and Set are converted to Object and Array, respectively, before processing.  This results in map keys being stringified.  
In other words, the keys "0" and 0 are not distinguishable in the result of this function.

**Kind**: static method of [<code>KeyExtractor</code>](#KeyExtractor)  
**Returns**: [<code>array.&lt;Key&gt;</code>](#Key) - an array of keys  

| Param | Type | Description |
| --- | --- | --- |
| obj | <code>Object</code> | an array, map, set, or object whose paths need extraction |


<!-- apistop -->
