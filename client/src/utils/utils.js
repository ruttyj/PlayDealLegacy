const classNames = require("classname");

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
const isArr = (v) => isDef(v) && Array.isArray(v);
const isFunc = (v) => isDef(v) && typeof v === "function";
const isStr = (v) => isDef(v) && typeof v === "string";
const isNum = (v) => isDef(v) && typeof v === "number";
const isObj = (v) => isDef(v) && typeof v === "object";
const isUndef = (v) => v === undefined || v === null;
const isTrue = (v) => v === true;
const isFalse = (v) => v === false;

//==================================================

//                 Default Values

//==================================================
const identity = (v) => v; // deprecated
const emptyFunction = () => {}; // deprecated
const identityFunc = (v) => v;
const trueFunc = () => true;
const emptyFun = () => {};
const defaultMutator = (value) => (value === undefined ? null : value); // undefined cannot be serialized so default to null
const defaultAccessor = (value) => value;
const functionMutator = (fn) =>
  isDef(fn) && typeof fn === "function" ? fn : identity;
const identityMutator = functionMutator;
const makeSeq = (num, fn = identity) => Array.from(Array(num).keys()).map(fn);

// Flatten the mess of classes given as props into a usable attribute
// @usage 
//   input  <div {...classes(["a1", "b1", ["c1", ["d1"]]], "e1", ["f1"], "g1 h1")} /> 
//   output <div className={classNames("a1", "b1", "c1", "d1", "e1", "f1", "g1", "h1")}/>
function classes(...args) {
  let _args = [];
  if (isDef(args)) {
    args.forEach((arg) => {
      if (isDef(arg)) {
        if (isArr(arg)) {
          _args = [..._args, ...arg.flat(0)];
        } else if (isStr(arg)) {
          _args = [..._args, ...arg.split(" ")];
        }
      }
    });
  }
  return { className: classNames(..._args) };
}

//==================================================

//                LOGGING METHODS

//==================================================
const log = console.log;
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

//==================================================

//              Property Manipulation

//==================================================

// Used to accept either the id or object in get or has methods
const getKeyFromProp = function(prop, getterName) {
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

// GET NESTED VALUE (ref, [nested, path], fallbackValue)
const getNestedValue = function(reference, path, fallback = undefined) {
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

const isDefNested = function(reference, path) {
  return isDef(getNestedValue(reference, path, undefined));
};
// SET NESTED VALUE
// Makes up for vues missing functionality to reactivly set a value many layers deep
const setNestedValue = function(a, b, c, d) {
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
        var initValue = Number.isNaN(key) ? {} : [];
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
const deleteNestedValue = function(a, b, c) {
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
function setImmutableValue(ref, _path, value) {
  let path = Array.isArray(_path) ? _path : [_path];
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
const recursiveForEach = function(
  obj,
  callbackFunction,
  filterFunc = (v) => true
) {
  var recursive = function(value, path = []) {
    // Loop over all objects
    if (_isPlainObject(value)) {
      _forEach(value, function(val, key) {
        recursive(val, [...path, key]);
      });
    } else if (_isArray(value)) {
      // loop over all arrays
      var i = 0;
      return _map(value, (item) => {
        recursive(item, [...path, i]);
        ++i;
      });
    } else if (filterFunc(value)) {
      // Filter items and execute function
      callbackFunction(path, value);
    }
  };
  recursive(obj);
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
const makeVar = function(
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
const makeMap = function(
  ref,
  field = "value",
  kvPairs = [],
  { mutator, accessor, keyMutator } = {}
) {
  keyMutator = isDef(keyMutator) ? keyMutator : defaultMutator;
  mutator = isDef(mutator) ? mutator : defaultMutator;
  accessor = isDef(accessor) ? accessor : defaultAccessor;

  let mObj = {};
  let { get: getTopId, inc: _incTopId, set: _setTopId } = makeVar(
    mObj,
    "topId",
    0,
    {
      mutator: (v) => (Number.isNaN(v) ? 0 : parseInt(v, 10)),
    }
  );

  const incTopId = function(key) {
    _incTopId();
    if (!Number.isNaN(key)) _setTopId(key);
  };

  let mMap = new Map();

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

  function getAll() {
    let result = {};
    mMap.forEach((item, key) => {
      result[key] = item;
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

  function listAll() {
    let result = [];
    mMap.forEach((item, key) => {
      result.push(item);
    });
    return result;
  }

  function inc(key, value = 1) {
    set(key, get(key, 0) + value);
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

  function toArray() {
    return map(identity);
  }

  function filter(fn = identity) {
    let result = [];
    mMap.forEach((val, key, map) => {
      if (fn(val, key, map)) result.push(val);
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

  const publicScope = {
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
    get,
    getItems,
    getAll, // deprecated
    listAll,
    remove,
    toObject,
    getCount,
    count: getCount,
    map,
    filter,
    find,
    forEach,
    serialize,
  };

  function getPublic() {
    return { ...publicScope };
  }

  ref[field] = getPublic();

  return getPublic();
};

const makeTree = function(
  ref,
  field = "value",
  kvPairs = [],
  { mutator, accessor, keyMutator } = {}
) {
  keyMutator = isDef(keyMutator) ? keyMutator : defaultMutator;
  mutator = isDef(mutator) ? mutator : defaultMutator;
  accessor = isDef(accessor) ? accessor : defaultAccessor;

  let mObj = {};

  function is() {
    return makeTree;
  }

  function get(path, defaultVal = null) {
    return getNestedValue(mObj, path, defaultVal);
  }

  function getAll() {
    return { ...mObj };
  }

  function has(path) {
    return isDef(getNestedValue(mObj, path));
  }

  function set(path, value) {
    setNestedValue(mObj, path, value);
  }

  function inc(path, value = 1) {
    set(get(path, 0) + value);
  }

  function dec(path, value = 1) {
    let num = parseFloat(get(path, 0));
    set(num - value);
  }

  function remove(path) {
    deleteNestedValue(mObj, path);
  }

  function map(_path, fn) {
    let path = isArr(_path) ? _path : [_path];
    let level = getNestedValue(mObj, path, []);
    let self = getPublic();
    if (isObj(level)) {
      let keys = Object.keys(level);
      if (keys.length > 0) {
        keys.forEach((key) => {
          let value = level[key];
          return fn(value, key, [...path, key], self);
        });
      }
    }
  }

  const publicScope = {
    is,
    value: mObj,
    has,
    get,
    getAll,
    map,
    set,
    inc,
    dec,
    remove,
  };

  function getPublic() {
    return { ...publicScope };
  }

  ref[field] = getPublic();

  return getPublic();
};

//==================================================

//                    Make List

//==================================================
const makeList = function(ref, field = "value", defaultValue = []) {
  let mList =
    isDef(defaultValue) && Array.isArray(defaultValue) ? [...defaultValue] : [];

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
    mList[index] = value;
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

  function push(...value) {
    mList.push(...value);
  }

  function pop() {
    return mList.pop();
  }

  function unshift(...value) {
    mList.unshift(...value);
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

  const publicScope = {
    is,
    value: mList,
    has,
    hasIndex,
    hasValue,
    set,
    get,
    toArray,
    getAll: toArray,
    all: toArray,
    map,
    inc,
    dec,
    includes, // checks values
    remove,
    removeByFn: removeItemByFn,
    removeByValue: removeItemByValue,
    push,
    add: push,
    pop,
    shift,
    unshift,
    getCount,
    count: getCount,
    isEmpty,
    shallowClone,
    find,
    forEach,
    serialize,
  };

  function getPublic() {
    return { ...publicScope };
  }

  ref[field] = getPublic();

  return getPublic();
};

//==================================================

//                  Make Listener

//==================================================
const makeListener = function() {
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

  const publicScope = {
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
    return { ...publicScope };
  }

  return getPublic();
};

const makeListenerMap = function() {
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

  const publicScope = {
    addEvent,
    on,
    once,
    emit,
    off,
    serialize,
  };

  function getPublic() {
    return { ...publicScope };
  }

  return getPublic();
};

// basic 2d tree
let makeListnerTree = function() {
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

function deleteImmutableValue(ref, _path) {
  let path = Array.isArray(_path) ? _path : [_path];
  if (path.length > 0) {
    let key = path[0];

    // Clone branch
    let sClone;
    if (isArr(ref)) {
      key = parseInt(key, 10);
      sClone = [...ref];
    } else if (isObj(ref)) {
      sClone = { ...ref };
    }

    if (isDef(sClone)) {
      if (path.length === 1) {
        if (isArr(sClone)) {
          let deleteIndex = parseInt(path[0]);
          if (
            !Number.isNaN(deleteIndex) &&
            -1 < deleteIndex &&
            deleteIndex < sClone.length
          ) {
            sClone.splice(deleteIndex, 1);
          }
        } else if (isObj(sClone)) {
          let deleteKey = path[0];
          if (sClone[deleteKey] !== undefined) {
            delete sClone[deleteKey];
          }
        }
      } else {
        let nextPath = path.slice(1);
        sClone[key] = deleteImmutableValue(sClone[key], nextPath);
      }
      return sClone;
    }
    return ref;
  } else {
    return ref;
  }
}

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
  identityFunc,
  trueFunc,
  emptyFun,
  makeSeq,

  classes,

  // Object / Array helpers
  removeByFn,
  getNestedValue,
  setNestedValue,
  setImmutableValue,
  deleteImmutableValue,
  deleteNestedValue,
  recursiveForEach,

  stateSerialize,
  serializeState,
  getKeyFromProp,

  JSON_PRETTY,
  prettyLog,
  log,
  logBlock,

  pluralize,

  makeVar,
  makeMap,
  makeList,
  makeTree,
  makeListener,
  makeListenerMap,
  makeListnerTree,
};
