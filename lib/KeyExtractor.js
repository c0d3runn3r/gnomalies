
/**
 * Key
 * 
 * A rich representation of a key
 */
class Key {

    #name;
    #type;
    #path;

    /**
     * Constructor
     * 
     * @param {string} name the name of the key
     * @param {string} type the type of thing pointed to by the key
     * @param {string} [path = null] the parent path
     */
    constructor(name, type, path = null) {

        this.#name = name;
        this.#type = type;
        this.#path = path ?? "";
    }

    get [Symbol.toStringTag]() { return `'${this.fullname}' -> ${this.type}`; }
    get fullname() { return this.#path ? this.#path + "." + this.#name :  this.#name; }
    get name() { return this.#name; }
    get type() { return this.#type; }
    get path() { return this.#path; }
    get can_have_keys() { return this.#type == "object" || this.#type == "array" || this.#type == "map" || this.#type == "set"; }

    /**
     * Compare two keys (for sorting)
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
     * @param {Object} obj the object to get the type of
     * @returns {string} the **actual** type of the object: array, object, null, undefined, boolean, number, string, function, date, map, set
     */
    static _type(obj) {

        return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
    }

    /**
     * Extract all keys from an object recursively
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

        // If no keys, this is a leaf node. Add it and return
        if (parent && keys.length == 0) {
            paths.push(new Key(parent.name, this._type(objectified), parent.path));
            return;
        }


        for (let key of keys) {

            let child = new Key(key, this._type(objectified[key]), parent?.fullname);

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
