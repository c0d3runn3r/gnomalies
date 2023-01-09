const { KeyExtractor: KeyExtractor, Key } = require("../lib/KeyExtractor");
const assert = require("assert");


let objects = [

    { "test": "test" },

    { 
        "a": "a",
        "b": {
             "A" : "A"
             }
     },

    {
        "a_map"    : new Map(),
        "a_set"    : new Set(),
        "a_date"   : new Date()
     },

     {
        "an_array" : [
            {
                "item_one" : "item_one",
                "item_two" : "item_two"
            },
            {
                "item_three" : "item_three",
                "item_four" : "item_four"
            }
        ],
        "a_function" : function() { return "a_function"; },
        "a_string" : "a_string",
        "a_number" : 123,
        "a_boolean" : true,
        "a_null" : null,
        "a_undefined" : undefined,
        "a_map"    : new Map(),
        "a_set"    : new Set(),
        "a_date"   : new Date()
     }
];

let paths = [

    [ new Key("test", "string") ],
    [ new Key("a", "string"), new Key("b.A", "string") ],
    [ new Key("a_map", "map"), new Key("a_set", "set"), new Key("a_date", "date") ],
    [ new Key("an_array.0.item_one", "string"), new Key("an_array.0.item_two", "string"), new Key("an_array.1.item_three", "string"), new Key("an_array.1.item_four", "string"), new Key("a_string", "string"), new Key("a_number", "number"), new Key("a_boolean", "boolean"), new Key("a_null", "null"), new Key("a_undefined", "undefined"), new Key("a_map", "map"), new Key("a_set", "set"), new Key("a_date", "date"), new Key("a_function", "function") ]
];

describe("Key", function() {

    describe("compare()", function() {

        it("returns 0 if the keys are equal", function() {

            assert.equal(Key.compare(new Key("a", "string"), new Key("a", "string")), 0, "Key.compare() should return 0 if the keys are equal");
        });


        it("returns -1 if the first key is less than the second key", function() {

            assert.equal(Key.compare(new Key("a", "string"), new Key("b", "string")), -1, "Key.compare() should return -1 if the first key is less than the second key");
        });

        it("returns 1 if the first key is greater than the second key", function() {
                
                assert.equal(Key.compare(new Key("b", "string"), new Key("a", "string")), 1, "Key.compare() should return 1 if the first key is greater than the second key");
        });

        it("works to sort an array of Keys", function() {

            let keys = [ new Key("b", "string"), new Key("a", "string"), new Key("c", "string") ];
            let sorted = keys.sort(Key.compare);

            assert.equal(sorted[0].compare(new Key("a", "string")), 0, "Key.compare() should work to sort an array of Keys");
            assert.equal(sorted[1].compare(new Key("b", "string")), 0, "Key.compare() should work to sort an array of Keys");
            assert.equal(sorted[2].compare(new Key("c", "string")), 0, "Key.compare() should work to sort an array of Keys");
        });
    });



});


describe("KeyExtractor", function() {

    describe("extract()", function() {
        
        it("throws if given a non-object", function() {

            assert.throws(() => KeyExtractor.extract("test"), Error, "KeyExtractor.extract() should throw an error if given a non-object");
        });

        it("handles maps and converts to a set of Keys", function() {

            let map = new Map();
            map.set("a", "a");
            map.set("b", "b");

            let extracted = KeyExtractor.extract(map).sort(Key.compare);
            let expected = [ new Key("a", "string"), new Key("b", "string") ].sort(Key.compare);

            assert.equal(extracted.length, expected.length, "KeyExtractor.extract() should return the correct number of keys");
            assert.equal(extracted[0].compare(expected[0]), 0, "KeyExtractor.extract() should return the correct keys");
        });

        it("handles empty map, returns empty array", function() {

            let map = new Map();

            let extracted = KeyExtractor.extract(map).sort(Key.compare);

            assert.equal(extracted.length, 0, "KeyExtractor.extract() should return an empty array since the Map had no keys");
        });

        it("handles object containing a Map with keys", function() {

            let map = new Map();
            map.set("a", "a");
            map.set("b", "b");

            let extracted = KeyExtractor.extract({ a_map : map }).sort(Key.compare);
            let expected = [ new Key("a_map.a", "string"), new Key("a_map.b", "string") ].sort(Key.compare);

            assert.equal(extracted.length, expected.length, "KeyExtractor.extract() should return the correct number of keys");
            assert.equal(extracted[0].compare(expected[0]), 0, "KeyExtractor.extract() should return the correct keys");
        });

        it("handles an object containing a Map with no keys", function() {

            let map = new Map();

            let extracted = KeyExtractor.extract({ a_map : map }).sort(Key.compare);
            let expected = [ new Key("a_map", "map") ].sort(Key.compare);

            assert.equal(extracted.length, expected.length, "KeyExtractor.extract() should return the correct number of keys");
            assert.equal(extracted[0].compare(expected[0]), 0, "KeyExtractor.extract() should return the correct keys");
        });

        it("handles a set and converts to a set of Keys", function() {

            let set = new Set();
            set.add("a");
            set.add("b");
            set.add(1);

            let extracted = KeyExtractor.extract(set).sort(Key.compare);
            let expected = [ new Key("0", "string"), new Key("1", "string"), new Key("2", "number") ].sort(Key.compare);

            assert.equal(extracted.length, expected.length, "KeyExtractor.extract() should return the correct number of keys");
            assert.equal(extracted[0].compare(expected[0]), 0, "KeyExtractor.extract() should return the correct keys");
        });

        it("handles empty set, returns empty array", function() {

            let set = new Set();

            let extracted = KeyExtractor.extract(set).sort(Key.compare);

            assert.equal(extracted.length, 0, "KeyExtractor.extract() should return an empty array since the Set had no keys");
        });

        it("handles object containing a Set with keys", function() {

            let set = new Set();
            set.add("a");
            set.add("b");
            set.add(1);

            let extracted = KeyExtractor.extract({ a_set : set }).sort(Key.compare);
            let expected = [ new Key("a_set.0", "string"), new Key("a_set.1", "string"), new Key("a_set.2", "number") ].sort(Key.compare);

            assert.equal(extracted.length, expected.length, "KeyExtractor.extract() should return the correct number of keys");
            assert.equal(extracted[0].compare(expected[0]), 0, "KeyExtractor.extract() should return the correct keys");
        });

        it("handles an object containing a Set with no keys", function() {

            let set = new Set();

            let extracted = KeyExtractor.extract({ a_set : set }).sort(Key.compare);
            let expected = [ new Key("a_set", "set") ].sort(Key.compare);

            assert.equal(extracted.length, expected.length, "KeyExtractor.extract() should return the correct number of keys");
            assert.equal(extracted[0].compare(expected[0]), 0, "KeyExtractor.extract() should return the correct keys");
        });

        it("handles a map containing an object containing a map", function() {

            let map = new Map();
            map.set("a", "a");
            map.set("b", "b");
            map.set("_an_object", { a : "a", b : "b", _a_map : new Map([ [ "a", "a" ], [ "b", "b" ] ]) });

            let extracted = KeyExtractor.extract(map).sort(Key.compare);
            let expected = [ new Key("a", "string"), new Key("b", "string"), new Key("_an_object.a", "string"), new Key("_an_object.b", "string"), new Key("_an_object._a_map.a", "string"), new Key("_an_object._a_map.b", "string") ].sort(Key.compare);

            assert.equal(extracted.length, expected.length, "KeyExtractor.extract() should return the correct number of keys");
            assert.equal(extracted[0].compare(expected[0]), 0, "KeyExtractor.extract() should return the correct keys");
        });


        for (let i = 0; i < objects.length; i++) {

            describe("returns the correct keys for object " + i, function() {

                let extracted = KeyExtractor.extract(objects[i]).sort(Key.compare);
                let expected = paths[i].sort(Key.compare);

                it(`returns the correct number of keys (${expected.length})`, function() {
                    assert.equal(extracted.length, expected.length, "KeyExtractor.extract() should return the correct number of keys");
                });

                for (let j = 0; j < extracted.length; j++) {

                    let extracted_item = extracted[j];
                    let expected_item = expected[j];

                    it(extracted_item + " == " + expected_item, function() {

                        assert.equal(extracted_item.compare(expected_item), 0, "KeyExtractor.extract() should return the correct keys");

                    });
                }
            });
        }

    });

});


