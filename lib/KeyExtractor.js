
/**
 * Key
 * 
 * A rich representation of a key extracted from an object
 */
class Key {

    #name;
    #type;
    #path;
    #value;

    /**
     * Constructor
     * 
     * @param {string} name the name of the key
     * @param {string} type the type of thing pointed to by the key
     * @param {string} [path = null] the parent path
     * @param {any} [value = null] the value of the key
     */
    constructor(name, type, path = null, value = null) {

        this.#name = name;
        this.#type = type;
        this.#path = path ?? "";
        this.#value = value;
    }

    get [Symbol.toStringTag]() { return `'${this.fullname}' -> ${this.type}`; }

    /**
     * Get the full name (path) of the key, e.g. "a.b.0.name"
     * 
     * @return {string} the full name of the key
     */
    get fullname() { return this.#path ? this.#path + "." + this.#name :  this.#name; }

    /**
     * Get the name of the key, e.g. "name"
     * 
     * @return {string} the name of the key
     */
    get name() { return this.#name; }

    /**
     * Get the type of the key, e.g. "string"
     * 
     * @return {string} the type of the key
     */
    get type() { return this.#type; }

    /**
     * Get the path of the key, but not its own name: e.g. "a.b.0"
     * 
     * @return {string} the path of the key
     */
    get path() { return this.#path; }

    /**
     * Get the value pointed at by the key (if any) in the original object
     * 
     * @return {any} the value of the key
     */
    get value() { return this.#value; }

    /**
     * Can this type have keys?
     * 
     * @private
     * @return {boolean} true if this type is an object, array, map or set
     */
    get can_have_keys() { return this.#type == "object" || this.#type == "array" || this.#type == "map" || this.#type == "set"; }

    /**
     * Compare two keys (for sorting).  This is just a string comparison of `.fullname`.
     * Future work could be to make this sort number-like array elements numerically, e.g. "a.b.2" should be before "a.b.10"
     * 
     * @param {Key} a the first key
     * @param {Key} b the second key
     * @return {number} -1 if a < b, 0 if a == b, 1 if a > b
     */
    static compare(a, b) {

        if (a.constructor.name != "Key") throw new Error("a is not a Key");
        if (b.constructor.name != "Key") throw new Error("b is not a Key");

        if (a.fullname < b.fullname) return -1;
        if (a.fullname > b.fullname) return 1;
        return 0;
    }

    /**
     * Compare another key to this key
     * 
     * @param {Key} other the other key
     * @return {number} -1 if this < other, 0 if this == other, 1 if this > other
     */
    compare(other) {

        return Key.compare(this, other);
    }
}



/**
 * KeyExtractor
 * 
 * Extract all keys from an object
 */

class KeyExtractor {

    /**
     * Extract all keys from an object
     * 
     * This function extracts a set of deep keys (like "a.b.0.name") from a nested collection of objects, arrays, Maps and Sets.  
     * Map and Set are converted to Object and Array, respectively, before processing.  This results in map keys being stringified.  
     * In other words, the keys "0" and 0 are not distinguishable in the result of this function.
     * 
     * @param {Object} obj an array, map, set, or object whose paths need extraction
     * @returns {array<Key>} an array of keys
     */
    static extract(obj) {

        let keys = [];
        this._extract(obj, keys);
        return keys;
    }

    /**
     * Get the actual type of an object
     * 
     * @private
     * @param {Object} obj the object to get the type of
     * @returns {string} the **actual** type of the object: array, object, null, undefined, boolean, number, string, function, date, map, set
     */
    static _type(obj) {

        return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
    }

    /**
     * Extract all keys from an object recursively
     * 
     * Map and Set are converted to Object and Array, respectively, before processing.  This results in map keys being stringified.
     * 
     * @private
     * @param {Object} obj an object, map, set, or array whose paths need extraction
     * @param {array<string>} [paths = []] a place to put extracted keys
     * @param {key} [parent = null] the parent key 
     * @throws {Error} if we have been given a bad parameter
     */
    static _extract(obj, paths = [], parent = null) {
        
        // Check paths and parent parameters
        if (!Array.isArray(paths)) throw new Error("'paths' parameter must be an array");
        if (parent !== null && parent?.constructor?.name != "Key") throw new Error("'parent' parameter must be a Key or else null");

        // Make sure we have an object
        let objectified;
        switch(this._type(obj)) {

            case "array":
            case "object":
                objectified = obj;
                break;
            case "map":
                objectified = Object.fromEntries(obj);
                break;
            case "set":
                objectified = Array.from(obj);
                break;
            default:
                throw new Error("'obj' parameter is not an object, array, map, or set - unable to extract keys");
        }

        // We have an object now.  Get keys
        let keys = Object.keys(objectified);

        // If no keys, this is a leaf node (e.g., an empty Map). Add it and return
        if (parent && keys.length == 0) {
            paths.push(new Key(parent.name, this._type(objectified), parent.path));
            return;
        }

        for (let key of keys) {

            let child = new Key(key, this._type(objectified[key]), parent?.fullname, objectified[key]);

            // Things with keys get called recursively (we don't push paths to objects, only their children)
            if (child.can_have_keys) {

                this._extract(objectified[key], paths, child);
            } else {

                // Things without keys just get added
                paths.push(child);
            }

        }

    }

}

module.exports = exports = { KeyExtractor: KeyExtractor, Key: Key };
