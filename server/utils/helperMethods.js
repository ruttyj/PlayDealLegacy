const {
  isPlainObject: _isPlainObject,
  forEach: _forEach,
  isArray: _isArray,
  map: _map,
} = require("lodash");
const Observable = require("rxjs").Observable;
const pluralize = require("pluralize");
//##################################################

//                 HELPER METHODS

//##################################################

//==================================================

//                Commonly Reused

//==================================================
const els = (v, el) => (isDef(v) ? v : el);
const elsFn = (v, fn) => (isDef(v) ? v : fn());
const isDef = (v) => v !== undefined && v !== null;
const isArr = (v, len = 0) => isDef(v) && Array.isArray(v) && v.length >= len;
const isFunc = (v) => isDef(v) && typeof v === "function";
const isStr = (v) => isDef(v) && typeof v === "string";
const isNum = (v) => isDef(v) && typeof v === "number";
const isObj = (v) => isDef(v) && typeof v === "object";
const isUndef = (v) => v === undefined || v === null;
const isTrue = (v) => v === true;
const isFalse = (v) => v === false;

//==================================================

//                LOGGING METHODS

//==================================================
const log = console.log;

const stackTrace = () => {
  var stack = new Error().stack;
  console.log(stack);
};
const jsonLog = (result, message = "") =>
  console.log(message, JSON.stringify(result, null, 2));
////////////////////////////////////////////////////////
//                     EXAMPLE
////////////////////////////////////////////////////////
// // ==================================================
// // Added property to Collection
// // ==================================================
// {
//   id: 76,
//   type: 'property',
//   class: 'concreteProperty',
//   value: 1,
//   name: 'Mediterranean Ave',
//   tags: [],
//   set: 'brown'
// }
// // --------------------------------------------------
////////////////////////////////////////////////////////
let logBlock = (content, title = "", w = 50) => {
  log(`// ${"=".repeat(w)}`);
  log(`// ${title}`);
  log(`// ${"=".repeat(w)}`);
  console.log(content);
  log(`// ${"_".repeat(w)}`);
};

const prettyLog = (result, label = "Result") => {
  let bar = "-".repeat(50) + `\n`;
  let bottomBar = ``; //`\n`+('_'.repeat(50))+`\n`
  console.log(`${bar}${label}\n${JSON.stringify(result, null, 2)}${bottomBar}`);
};

function removeByFn(arr, fn) {
  const index = arr.findIndex(fn);
  if (index > -1) {
    let item = arr[index];
    arr.splice(index, 1);
    return item;
  }
  return false;
}

const JSON_PRETTY = (v) => JSON.stringify(v, null, 2);
const jsonEncode = JSON_PRETTY;

//==================================================

//                 Default Values

//==================================================
const identity = (v) => v;
const emptyFunction = () => {};
const defaultMutator = (value) => (value === undefined ? null : value); // undefined cannot be serialized so default to null
const defaultAccessor = (value) => value;
const functionMutator = (fn) =>
  isDef(fn) && typeof fn === "function" ? fn : identity;
const identityMutator = functionMutator;

//==================================================

//      Property / Array / Object Manipulation

//==================================================

const arrSum = (arr) => arr.reduce((a, b) => a + b, 0);

// produces a keyed object of the value counts
function reduceToKeyed(arr) {
  return arr.reduce((result, item) => {
    result[item] = isDef(result[item]) ? result[item] + 1 : 1;
    return result;
  }, {});
}

// create a arry of values from two possible fields, singular / plural
let getArrFromProp = (props, names, fallback = null) => {
  let codeArr = [];
  if (isDef(props[names.singular]) && !isArr(props[names.singular]))
    codeArr.push(props[names.singular]);

  if (isArr(props[names.plural]))
    props[names.plural].forEach((val) => {
      codeArr.push(val);
    });
  if (codeArr.length === 0 && isDef(fallback)) codeArr.push(fallback);
  return codeArr;
};

// Used to accept either the id or object in get or has methods
const getKeyFromProp = function (prop, getterName) {
  let key = null;
  if (isObj(prop)) {
    // if is function execute function
    let isFunction = getterName.slice(-2) === "()";
    if (isFunction) key = prop[getterName.slice(0, -2)]();
    // else get prop containing the key
    else key = prop[getterName];
  } else {
    key = prop;
  }
  return key;
};

// will convert array values to object keys
const reduceArrayToMap = (arr) =>
  arr.reduce((result, val) => {
    result[val] = 1;
    return result;
  }, {});

// GET NESTED VALUE (ref, [nested, path], fallbackValue)
const getNestedValue = function (reference, path, fallback = undefined) {
  path = isArr(path) ? path : [path];

  var pointer = reference;
  for (var i = 0, len = path.length; i < len; i++) {
    if (
      typeof pointer !== "string" &&
      pointer !== null &&
      typeof pointer[path[i]] !== "undefined"
    ) {
      pointer = pointer[path[i]];
    } else {
      return fallback;
    }
  }

  if (typeof pointer === "string") {
    pointer = ("" + pointer).trim();
    if (pointer.length === 0) return fallback;
  }
  return pointer;
};

const isDefNested = function (reference, path) {
  return isDef(getNestedValue(reference, path, undefined));
};

// SET NESTED VALUE
// Makes up for vues missing functionality to reactivly set a value many layers deep
const setNestedValue = function (a, b, c, d) {
  var setter, startingRef, tempPath, value;
  if (typeof a === "function") {
    // Use a custom setter
    setter = a;
    startingRef = b;
    tempPath = c;
    value = d;
  } else {
    // Use Default object syntax to set value.
    setter = (obj, key, val) => {
      obj[key] = val;
    };
    startingRef = a;
    tempPath = b;
    value = c;
  }
  var ref = startingRef;
  var path = tempPath instanceof Array ? tempPath : [tempPath];
  var lastIndex = path.length - 1;
  var current = 0;
  path.forEach((key) => {
    if (current === lastIndex) {
      setter(ref, key, value);
    } else {
      if (typeof ref[key] === "object" && ref[key] != null) {
        //proceed to next
      } else if (isArr(ref[key])) {
        //proceed to next
      } else {
        var initValue = isNaN(key) ? {} : [];
        setter(ref, key, initValue);
      }
      ref = ref[key];
    }
    ++current;
  });
};

// DELETE NESTED VALUE
/**
 * Allows a path to be provided to delete a nested value
 * Intended for use on objects, arrays not fully supported yet.
 */
const deleteNestedValue = function (a, b, c) {
  var deleter;
  var startingRef;
  var tempPath;
  if (typeof a === "function") {
    deleter = a;
    startingRef = b;
    tempPath = c;
  } else {
    deleter = (r, k) => {
      delete r[k];
    }; // standard delete syntax
    startingRef = a;
    tempPath = b;
  }
  var ref = startingRef;
  var path = tempPath instanceof Array ? tempPath : [tempPath];
  var lastIndex = path.length - 1;
  var current = 0;
  path.forEach((key) => {
    if (current === lastIndex) {
      deleter(ref, key);
    } else {
      ref = ref[key];
    }
    ++current;
  });
};

// Generating a shallow clone for each key in path
// immutable version of setNestedValue
function setImmutableValue(ref, path, value) {
  if (path.length > 0) {
    let sClone = { ...ref };
    let key = path[0];
    let nextPath = path.slice(1);
    sClone[key] = setImmutableValue(sClone[key], nextPath, value);
    return sClone;
  } else {
    return value;
  }
}

// RECURSIVE FOR EACH
const recursiveForEach = function (
  obj,
  callbackFunction,
  filterFunc = (v) => true
) {
  var recursive = function (value, path = []) {
    // Loop over all objects
    if (filterFunc(value)) {
      // Filter items and execute function
      callbackFunction(path, value);
    } else if (_isPlainObject(value)) {
      _forEach(value, function (val, key) {
        recursive(val, [...path, key]);
      });
    } else if (_isArray(value)) {
      // loop over all arrays
      var i = 0;
      return _map(value, (item) => {
        recursive(item, [...path, i]);
        ++i;
      });
    }
  };
  recursive(obj);
};

// Build a recursive object
const defaultPivotFunc = function (recurse, value, path) {
  return recurse(value, path);
};
const recursiveBuild = function (obj, pivotFunc = defaultPivotFunc) {
  var recursive = function (value, path = []) {
    let recurse = (value, path = []) => {
      // Loop over all objects
      if (_isPlainObject(value)) {
        let result = {};
        _forEach(value, function (val, key) {
          result[key] = recursive(val, [...path, key]);
        });
        return result;
      } else if (_isArray(value)) {
        // loop over all arrays
        var i = 0;
        let result = [];
        _map(value, (item) => {
          result.push(recursive(item, [...path, i]));
          ++i;
        });
        return result;
      } else {
        // return primitive
        return value;
      }
    };
    return pivotFunc(recurse, value, path);
  };
  return recursive(obj);
};

// The default serialize function , with exclusions
function stateSerialize(mState, excludeKeys = []) {
  let result = {};

  // Serialize everything except the external references
  let keys = Object.keys(mState).filter((key) => !excludeKeys.includes(key));

  // Serialize each if possible, leave primitives as is
  keys.forEach((key) => {
    result[key] =
      isDef(mState[key]) && isDef(mState[key].serialize)
        ? mState[key].serialize()
        : mState[key];
  });

  return result;
}

function serializeState(mState, excludeKeys = []) {
  // more intuitive name
  return stateSerialize(mState, excludeKeys);
}

//==================================================

//                    Make Variable

//==================================================
const makeVar = function (
  ref = {},
  field = "value",
  defaultVal = null,
  { mutator, accessor } = {}
) {
  mutator = isDef(mutator) ? mutator : defaultMutator;
  accessor = isDef(accessor) ? accessor : defaultAccessor;

  function get() {
    return accessor(ref[field]);
  }
  function set(val) {
    ref[field] = mutator(val);
  }
  function has() {
    return isDef(ref[field]);
  }

  function remove() {
    set(defaultVal);
  }

  function inc(value = 1) {
    let original = has(field) ? get() : 0;
    set(original + value);
  }

  function dec(value = 1) {
    let original = has(field) ? get() : 0;
    set(original - value);
  }

  set(defaultVal);

  return {
    get,
    set,
    has,
    remove,
    increment: inc,
    decrement: dec,
    inc,
    dec,
  };
};

//==================================================

//                    Make Map

//==================================================
const makeMap = function (
  ref,
  field = "value",
  kvPairs = [],
  { mutator, accessor, keyMutator } = {}
) {
  keyMutator = isDef(keyMutator) ? keyMutator : String;
  mutator = isDef(mutator) ? mutator : defaultMutator;
  accessor = isDef(accessor) ? accessor : defaultAccessor;

  let mObj = {};
  let { get: getTopId, inc: _incTopId, set: _setTopId } = makeVar(
    mObj,
    "topId",
    0,
    {
      mutator: (v) => (isNaN(v) ? 0 : parseInt(v, 10)),
    }
  );

  const incTopId = function (key) {
    _incTopId();
    if (!isNaN(key)) _setTopId(key);
  };

  let mMap = new Map();

  function clear() {
    mMap = new Map();
  }

  function is() {
    return makeMap;
  }

  function get(key, defaultVal = null) {
    if (has(key)) return mMap.get(keyMutator(key));
    return defaultVal;
  }

  function getItems(keys) {
    let result = [];
    keys.forEach((key) => {
      if (has(key)) result.push(get(keys));
    });
    return result;
  }

  function has(key) {
    return mMap.has(keyMutator(key));
  }

  function set(key, value) {
    incTopId(key);
    mMap.set(keyMutator(key), value);
    return getPublic();
  }

  function add(valueA, valueB = undefined) {
    if (isDef(valueB)) {
      incTopId(valueA);
      // key value
      set(valueA, valueB);
      mMap.set(keyMutator(valueA), valueB);
    } else {
      incTopId();
      // just value
      mMap.set(keyMutator(getTopId()), valueA);
    }
    return getPublic();
  }

  function addMap(key, mapObject = undefined) {
    return isDef(mapObject) ? set(key, mapObject) : set(key, makeMap({}));
  }

  function createMap(valA, valB = undefined) {
    if (isDef(valB)) set(valA, valB);
    else set(valA, makeMap({}));
    return get(valA);
  }

  function getMap(key) {
    return get(key);
  }

  function inc(key, value = 1) {
    set(get(key, 0) + value);
  }

  function dec(key, value = 1) {
    set(get(key, 0) - value);
  }

  function getCount() {
    return mMap.size;
  }

  function isEmpty() {
    return getCount() === 0;
  }

  function forEach(fn) {
    mMap.forEach((val, key, map) => fn(val, key, map));
  }

  function toObject(fn) {
    let result = {};
    forEach((val, key) => {
      result[key] = val;
    });
    return result;
  }

  function map(fn = identity) {
    let result = [];
    mMap.forEach((val, key, map) => {
      result.push(fn(val, key, map));
    });
    return result;
  }

  function mapKeyed(fn = identity) {
    let result = {};
    mMap.forEach((val, key, map) => {
      result[key] = fn(val, key, map);
    });
    return result;
  }

  function keys() {
    return map((value, key) => key);
  }

  function values() {
    return map((value, key) => value);
  }

  function toArray() {
    return map(identity);
  }

  function listAll() {
    return map(identity);
  }

  function filter(fn = identity) {
    let result = [];
    mMap.forEach((val, key, map) => {
      if (fn(val, key, map)) result.push(val);
    });
    return result;
  }

  function filterKeyed(fn = identity) {
    let result = {};
    mMap.forEach((val, key, map) => {
      if (fn(val, key, map)) result[key] = val;
    });
    return result;
  }

  function find(fn = identity) {
    let result = undefined;
    mMap.forEach((val, key, map) => {
      if (!isDef(result) && fn(val, key, map)) result = val;
    });
    return result;
  }

  function _makeMap(fn = identity) {
    let result = [];
    mMap.forEach((val, key, map) => {
      result.push(fn(val, key, map));
    });
    return result;
  }

  function serialize() {
    let result = {};
    mMap.forEach((val, key, map) => {
      result[key] = isDef(val) && isDef(val.serialize) ? val.serialize() : val;
    });
    return result;
  }

  function remove(key) {
    if (has(key)) {
      mMap.delete(String(key));
    }
  }

  const publicInterface = {
    is,
    value: mMap,
    has,
    inc,
    dec,
    set,
    add,
    addMap,
    getMap,
    createMap,
    toArray,
    listAll,
    get,
    getItems,
    remove,
    toObject,
    getCount,
    count: getCount,
    isEmpty,
    map,
    mapKeyed,
    filter,
    filterKeyed,
    find,
    keys,
    values,
    clear,
    forEach,
    serialize,
  };

  function getPublic() {
    return { ...publicInterface };
  }

  ref[field] = getPublic();

  return getPublic();
};

//==================================================

//                    Make List

//==================================================
const makeList = function (
  ref,
  field = "value",
  defaultValue = [],
  { mutator } = {}
) {
  let mList = isArr(defaultValue) ? [...defaultValue] : [];

  mutator = isDef(mutator) ? mutator : defaultMutator;

  function is() {
    return makeList;
  }

  function has(key) {
    return hasIndex(key) || hasValue(key);
  }

  function hasIndex(key) {
    return isDef(mList[key]);
  }

  function hasValue(value) {
    return mList.findIndex((item) => item === mutator(value)) > -1;
  }

  function get(index, defaultVal = null) {
    if (has(index)) return mList[index];
    return defaultVal;
  }

  function set(index, value) {
    mList[index] = mutator(value);
  }

  function toArray() {
    return [...mList];
  }

  function inc(index, value = 1) {
    set(get(index, 0) + value);
  }

  function dec(index, value = 1) {
    set(get(index, 0) - value);
  }

  function remove(index) {
    if (has(index)) mList.splice(index, 1);
  }

  function push(...args) {
    args.forEach((value) => {
      mList.push(mutator(value));
    });
  }

  function pop() {
    return mList.pop();
  }

  function unshift(...args) {
    args.forEach((value) => {
      mList.unshift(mutator(value));
    });
  }

  function shift() {
    mList.shift();
  }

  function getCount() {
    return mList.length;
  }

  function isEmpty() {
    return getCount() === 0;
  }

  function includes(val) {
    return mList.includes(val);
  }

  function forEach(fn) {
    mList.forEach((val, key, map) => fn(val, key, map));
  }

  function find(fn) {
    return els(mList.find(fn), null);
  }

  function map(fn = identity) {
    let result = [];
    mList.forEach((val, key, map) => {
      result.push(fn(val, key, map));
    });
    return result;
  }

  function shallowClone() {
    return map(identity);
  }

  function serialize() {
    let result = [];
    mList.forEach((val, key, map) => {
      result.push(isDef(val.serialize) ? val.serialize() : val);
    });
    return result;
  }

  function removeItemByFn(fn) {
    return removeByFn(mList, fn);
  }

  function removeItemByValue(value) {
    return removeByFn(mList, (item) => item === value);
  }

  function clear() {
    mList.length = 0;
  }
  function setAll(items) {
    clear();
    items.forEach((item) => {
      push(item);
    });
  }

  const publicInterface = {
    is,
    value: mList,
    has,
    hasIndex,
    hasValue,
    set,
    get,
    toArray,
    setAll,
    getAll: toArray,
    all: toArray,
    map,
    inc,
    dec,
    includes, // checks values
    remove,
    removeByFn: removeItemByFn,
    removeByValue: removeItemByValue,
    removeValue: removeItemByValue,
    push,
    pop,
    shift,
    unshift,
    getCount,
    count: getCount,
    isEmpty,
    clear,
    shallowClone,
    find,
    forEach,
    serialize,
  };

  function getPublic() {
    return { ...publicInterface };
  }

  ref[field] = getPublic();

  return getPublic();
};

//==================================================

//                    Make Set

//==================================================
const makeSet = function (ref, field = "value", defaultValue = []) {
  let mList = isArr(defaultValue) ? [...defaultValue] : [];

  function is() {
    return makeList;
  }

  function has(key) {
    return hasIndex(key) || hasValue(key);
  }

  function hasIndex(key) {
    return isDef(mList[key]);
  }

  function hasValue(value) {
    return mList.findIndex((item) => item === value) > -1;
  }

  function get(index, defaultVal = null) {
    if (has(index)) return mList[index];
    return defaultVal;
  }

  function set(index, value) {
    if (!hasValue(value)) mList[index] = value;
  }

  function toArray() {
    return [...mList];
  }

  function inc(index, value = 1) {
    set(get(index, 0) + value);
  }

  function dec(index, value = 1) {
    set(get(index, 0) - value);
  }

  function remove(index) {
    if (has(index)) mList.splice(index, 1);
  }

  function push(...mxd) {
    if (isArr(mxd)) {
      mxd.forEach((value) => {
        if (!hasValue(value)) {
          mList.push(value);
        }
      });
    } else {
      let value = mxd;
      if (!hasValue(value)) {
        mList.push(value);
      }
    }
  }

  function pop() {
    return mList.pop();
  }

  function unshift(...mxd) {
    if (isArr(mxd)) {
      mxd.forEach((value) => {
        if (!hasValue(value)) {
          mList.unshift(value);
        }
      });
    } else {
      let value = mxd;
      if (!hasValue(value)) {
        mList.unshift(value);
      }
    }
  }

  function shift() {
    mList.shift();
  }

  function getCount() {
    return mList.length;
  }

  function isEmpty() {
    return getCount() === 0;
  }

  function includes(val) {
    return mList.includes(val);
  }

  function forEach(fn) {
    mList.forEach((val, key, map) => fn(val, key, map));
  }

  function find(fn) {
    return els(mList.find(fn), null);
  }

  function map(fn = identity) {
    let result = [];
    mList.forEach((val, key, map) => {
      result.push(fn(val, key, map));
    });
    return result;
  }

  function shallowClone() {
    return map(identity);
  }

  function serialize() {
    let result = [];
    mList.forEach((val, key, map) => {
      result.push(isDef(val.serialize) ? val.serialize() : val);
    });
    return result;
  }

  function removeItemByFn(fn) {
    return removeByFn(mList, fn);
  }

  function removeItemByValue(value) {
    return removeByFn(mList, (item) => item === value);
  }

  function clear() {
    mList.length = 0;
  }
  function setAll(items) {
    clear();
    items.forEach((item) => {
      push(item);
    });
  }

  const publicInterface = {
    is,
    value: mList,
    has,
    hasIndex,
    hasValue,
    set,
    get,
    toArray,
    setAll,
    getAll: toArray,
    all: toArray,
    map,
    inc,
    dec,
    includes, // checks values
    remove,
    removeByFn: removeItemByFn,
    removeByValue: removeItemByValue,
    removeValue: removeItemByValue,
    push,
    pop,
    shift,
    unshift,
    getCount,
    count: getCount,
    isEmpty,
    clear,
    shallowClone,
    find,
    forEach,
    serialize,
  };

  function getPublic() {
    return { ...publicInterface };
  }

  ref[field] = getPublic();

  return getPublic();
};

//==================================================

//                  Make Listener

//==================================================
const makeListener = function () {
  let mOnObserverArr = [];
  let mOnceObserverArr = [];

  let onObservable = new Observable((observer) => {
    mOnObserverArr.push(observer);
  });

  let onceObservable = new Observable((observer) => {
    mOnceObserverArr.push(observer);
  });

  function on(fn) {
    return onObservable.subscribe(fn);
  }

  function once(fn) {
    return onceObservable.subscribe(fn);
  }

  function off() {
    mOnObserverArr.forEach((observer) => {
      observer.unsubscribe();
    });
    mOnceObserverArr.forEach((observer) => {
      observer.unsubscribe();
    });

    mOnObserverArr = [];
    mOnceObserverArr = [];
  }

  function emit(value) {
    mOnObserverArr.forEach((observer) => {
      observer.next(value);
    });

    mOnceObserverArr.forEach((observer) => {
      observer.next(value);
      observer.unsubscribe();
    });
    mOnceObserverArr = [];
  }

  const publicInterface = {
    value: {
      mOnObserverArr,
      mOnceObserverArr,
    },
    on,
    once,
    emit,
    off,
  };

  function getPublic() {
    return { ...publicInterface };
  }

  return getPublic();
};

const makeListenerMap = function () {
  let mRef = {};

  const {
    has: hasEvent,
    set: initEvent,
    get: getEvent,
    forEach: forEachEvent,
    remove: removeEvent,
    serialize: serializeMap,
  } = makeMap(mRef, "eventMap");

  function addEvent(eventName) {
    if (!hasEvent(eventName)) initEvent(eventName, makeListener());
  }

  function on(eventName, fn) {
    if (isDef(fn)) {
      addEvent(eventName);
      return getEvent(eventName).on(fn);
    }
  }

  function once(eventName, fn) {
    if (isDef(fn)) {
      addEvent(eventName);
      return getEvent(eventName).once(fn);
    }
  }

  function emit(eventName, payload = null) {
    addEvent(eventName);
    getEvent(eventName).emit(payload);
  }

  function off(eventName) {
    if (hasEvent(eventName)) {
      let event = getEvent(eventName);
      if (isDef(event)) event.off();
      removeEvent(eventName);
    }
  }

  function serialize() {
    let result;
    let short = true;

    if (short) {
      result = [];
      forEachEvent((objMap, key) => {
        result.push(key);
      });
    } else {
      result = {};
      forEachEvent((objMap, key) => {
        let listNames = Object.keys(objMap.value);
        let onCount = objMap.value["mOnObserverArr"].length;
        let onceCount = objMap.value["mOnceObserverArr"].length;
        result[key] = {
          count: onCount + onceCount,
          typeCount: {
            on: onCount,
            once: onceCount,
          },
        };
      });
    }
    return result;
  }

  const publicInterface = {
    addEvent,
    on,
    once,
    emit,
    off,
    serialize,
  };

  function getPublic() {
    return { ...publicInterface };
  }

  return getPublic();
};

// basic 2d tree
let makeListnerTree = function () {
  let mState = {};
  let tree = makeMap(mState, "tree");

  function _getListnerBranch([subject, action]) {
    if (!tree.has(subject)) tree.set(subject, makeListenerMap());
    return tree.get(subject);
  }

  function on([subject, action], cb) {
    let subjectBranch = _getListnerBranch([subject, action]);
    return subjectBranch.on(action, cb);
  }

  function once([subject, action], cb) {
    let subjectBranch = _getListnerBranch([subject, action]);
    return subjectBranch.once(action, cb);
  }

  function off([subject, action]) {
    let subjectBranch = _getListnerBranch([subject, action]);
    return subjectBranch.off(action);
  }

  function emit([subject, action], data) {
    let subjectBranch = _getListnerBranch([subject, action]);
    return subjectBranch.emit(action, data);
  }

  function destroy() {
    //@TODO
  }

  return {
    on,
    once,
    off,
    emit,
    destroy,
  };
};

module.exports = {
  els,
  elsFn,
  isUndef,
  isDef,
  isDefNested,
  isStr,
  isNum,
  isObj,
  isArr,
  isFunc,
  isTrue,
  isFalse,
  identity,
  identityMutator,
  emptyFunction,

  // Object / Array helpers
  arrSum,
  reduceArrayToMap,
  reduceToKeyed,
  removeByFn,
  getNestedValue,
  setNestedValue,
  setImmutableValue,
  deleteNestedValue,
  recursiveForEach,
  recursiveBuild,

  stateSerialize,
  serializeState,
  getKeyFromProp,
  getArrFromProp,

  JSON_PRETTY,
  jsonEncode,
  prettyLog,
  log,
  jsonLog,
  logBlock,
  stackTrace,

  pluralize,

  makeVar,
  makeMap,
  makeList,
  makeSet,
  makeListener,
  makeListenerMap,
  makeListnerTree,
};
