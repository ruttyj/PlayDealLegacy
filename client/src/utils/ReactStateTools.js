import {
  isDef,
  isObj,
  isFunc,
  getNestedValue,
  setImmutableValue,
  identity,
} from "./utils"; //==========================================
/**
 * Methods required for setting to a React class based state object
 *
 * @param {Component} mRef  Componet hosting the state
 * @param {Array} path      Array to location of variable to be get/set
 */

// =============================================

//         REACT BASE DATA STRUCTURES

// =============================================
function makeClassMethods(mRef, path, initialValue = null) {
  setImmutableValue(mRef.state, path, initialValue);
  return {
    allSetter(newValue) {
      let newState = setImmutableValue(mRef.state, path, newValue);
      mRef.setState(newState);
    },
    allGetter(fallbackValue) {
      return getNestedValue(mRef.state, path, fallbackValue);
    },
  };
}

// Methods required to get and set using React Hooks
function makeHookMethods(_useState, initialValue = []) {
  const [value, setter] = _useState(initialValue);
  return {
    allSetter(newValue) {
      setter(newValue);
    },
    allGetter() {
      return value;
    },
  };
}

const setMutator = (values) => Array.from(new Set(values));

// Core getter, setter, mutator, normalize
function AbstractCore() {
  let mLocal = {};
  function setAllSetterFn(fn) {
    mLocal.allSetter = fn;
  }

  function setAllGetterFn(fn) {
    mLocal.allGetter = fn;
  }

  // function used to ensure the comparioss of number and strings for example are comparible
  function setNormalizeFn(fn) {
    mLocal.normalize = fn;
  }

  function setAllMutatorFn(fn) {
    mLocal.allMutator = fn;
  }

  function allGetter(fallback) {
    return mLocal.allGetter(fallback);
  }

  function allSetter(values) {
    return mLocal.allSetter(values);
  }

  function allMutator(values) {
    return mLocal.allMutator(values);
  }

  function normalize(values) {
    return mLocal.normalize(values);
  }

  function injectMethods(objMethods) {
    if (isFunc(objMethods.allSetter)) setAllSetterFn(objMethods.allSetter);
    if (isFunc(objMethods.allGetter)) setAllGetterFn(objMethods.allGetter);
    if (isFunc(objMethods.normalize)) setNormalizeFn(objMethods.normalize);
    if (isFunc(objMethods.allMutator)) setAllMutatorFn(objMethods.allMutator);
  }

  setAllMutatorFn(identity);
  setNormalizeFn(identity);

  return {
    setAllSetterFn,
    setAllGetterFn,
    setNormalizeFn,
    setAllMutatorFn,
    injectMethods,
    allGetter,
    allSetter,
    allMutator,
    normalize,
  };
}

function AbstractImmutableList() {
  let core = AbstractCore();

  function addValue(value) {
    let oldArray = core.allGetter([]);
    let newArray = core.allMutator([...oldArray, core.normalize(value)]);
    core.allSetter(newArray);
  }

  function add(value) {
    addValue(value);
  }

  function push(value) {
    addValue(value);
  }

  function removeValue(value) {
    let oldArray = core.allGetter([]);
    let newArray = oldArray.filter(
      (val) => core.normalize(val) !== core.normalize(value)
    );
    core.allSetter(newArray);
  }

  function removeIndex(index) {
    let newValue = getAll().filter((v, i) => i !== index);
    core.allSetter(newValue);
  }

  function pop() {
    let lastIndex = count() - 1;
    if (lastIndex > -1) {
      let result = get(lastIndex);
      removeIndex(lastIndex);
      return result;
    }
    return null;
  }

  function getAll() {
    return core.allGetter();
  }

  function set(index, value) {
    let oldValue = getAll();
    oldValue[index] = value;
    core.allSetter(oldValue);
  }

  function get(index, fallback) {
    let oldValue = getAll();
    return getNestedValue(oldValue, [index], fallback);
  }

  function has(value) {
    let values = core.allGetter([]);
    if (isDef(values)) {
      return values.includes(core.normalize(value));
    }
    return false;
  }

  function count(cardId) {
    return core.allGetter([]).length;
  }

  function clear() {
    core.allSetter([]);
  }

  function toggle(cardId) {
    if (has(cardId)) {
      removeValue(cardId);
    } else {
      addValue(cardId);
    }
  }

  function forEach(fn) {
    let selfRef = getPublic();
    getAll().forEach((val, key) => fn(val, key, selfRef));
  }

  function filter(fn) {
    let selfRef = getPublic();
    return getAll().filter((val, key) => fn(val, key, selfRef));
  }

  function map(fn) {
    let selfRef = getPublic();
    return getAll().map((val, key) => fn(val, key, selfRef));
  }

  function findIndex(fn) {
    return getAll().findIndex(fn);
  }

  function find(fn) {
    return getAll().find(fn);
  }

  function serialize() {
    return getAll();
  }

  const publicScope = {
    ...core,
    has,
    add,
    addValue,
    push,
    pop,
    set,
    get,
    toggle, // will remove or add wither it exists
    clear,
    count,
    removeValue,
    removeIndex,
    getAll,
    forEach,
    filter,
    findIndex,
    find,
    map,
    serialize,
  };

  function getPublic() {
    return { ...publicScope };
  }

  return getPublic();
}

function AbstractImmutableSet() {
  let result = AbstractImmutableList();
  result.setAllMutatorFn(setMutator);
  return result;
}
function AbstractImmutableObject() {
  let core = AbstractCore();

  function setAll(objectValue) {
    if (isDef(objectValue) && isObj(objectValue)) {
      core.allSetter({ ...objectValue });
    }
  }

  function getAll() {
    return core.allGetter({});
  }

  function getAllValues() {
    return Object.values(getAll());
  }

  function getAllKeys() {
    return Object.keys(getAll());
  }

  function forEach(fn) {
    let keys = getAllKeys();
    let selfRef = getPublic();
    keys.forEach((key) => {
      let item = get(key);
      fn(item, key, selfRef);
    });
  }

  // what to return? key or value
  function filter(fn, expect = "value") {
    let keys = getAllKeys();
    let selfRef = getPublic();
    let returnKey = expect === "key";

    let result = [];
    keys.forEach((key) => {
      let item = get(key);
      let fnResult = true;

      fnResult = isFunc(fn) ? fn(item, key, selfRef) : fn;

      if (fnResult) {
        if (returnKey) {
          result.push(key);
        } else {
          result.push(item);
        }
      }
    });
    return result;
  }

  function filterKeyed(fn) {
    let keys = getAllKeys();
    let selfRef = getPublic();

    let result = {};
    keys.forEach((key) => {
      let item = get(key);
      if (fn(item, key, selfRef)) {
        result[key] = item;
      }
    });
    return result;
  }

  function map(fn) {
    let selfRef = getPublic();
    return getAllKeys().map((key) => fn(get(key), key, selfRef));
  }

  function firstKey() {
    let keys = getAllKeys(); //might be more efficent way

    if (keys.length > 0) return keys[0];

    return null;
  }

  function lastKey() {
    let keys = getAllKeys(); //might be more efficent way
    if (keys.length > 0) return keys[keys.length - 1];
    return null;
  }

  function has(key) {
    let values = getAll();
    if (isDef(values)) {
      return isDef(values[key]);
    }
    return false;
  }

  function hasValue(value) {
    let values = getAllValues();
    if (isDef(values)) {
      return isDef(
        values.find((v) => core.normalize(v) === core.normalize(value))
      );
    }
    return false;
  }

  function get(key, fallback = null) {
    if (isDef(key)) {
      let values = getAll();
      return getNestedValue(values, [key], fallback);
    }
    return null;
  }

  function set(key, value = true) {
    if (isDef(key)) {
      let oldData = getAll();
      let newData = setImmutableValue(oldData, [key], value);
      core.allSetter(newData);
    }
  }

  function count() {
    return getAll().size;
  }

  function shallowCloneData() {
    return { ...getAll() };
  }

  function remove(key) {
    if (isDef(key)) {
      let clonedData = shallowCloneData();
      delete clonedData[key];
      core.allSetter(clonedData);
    }
  }

  function removeValue(value) {
    let breakOnFirst = true;

    let clonedData = shallowCloneData();
    let keys = getAllKeys();

    let foundKeys = [];
    for (let i = 0; i < keys.length; ++i) {
      let key = keys[i];
      if (core.normalize(clonedData[key]) === value) {
        foundKeys.push(key);
        if (breakOnFirst) break;
      }
    }
    foundKeys.forEach((key) => {
      delete clonedData[key];
    });
    core.allSetter(clonedData);
  }

  function clear() {
    core.allSetter({});
  }

  function serialize() {
    return core.allGetter({});
  }

  const publicScope = {
    ...core,
    setAll,
    getAll,
    getAllValues,
    getAllKeys,
    firstKey,
    lastKey,
    get,
    has,
    hasValue,
    set,
    count,
    remove,
    removeValue,
    clear,
    forEach,
    filter,
    filterKeyed,
    map,
    serialize,
  };

  function getPublic() {
    return { ...publicScope };
  }
  return getPublic();
}

// =================================================================

//                         IMMUTABLE SET

// =================================================================
function ImmutableHookBasedSet(useState, initialValue) {
  let result = ImmutableHookBasedList(useState, initialValue);
  result.injectMethods(makeHookMethods(useState, initialValue));
  result.setAllMutatorFn(setMutator);
  return result;
}

function ImmutableClassBasedSet(mComp, path, initialState) {
  let result = AbstractImmutableList();
  result.injectMethods(makeClassMethods(mComp, path, initialState));
  result.setAllMutatorFn(setMutator);
  return result;
}

// =================================================================

//                         IMMUTABLE LIST

// =================================================================
function ImmutableHookBasedList(useState, initialValue = []) {
  let result = AbstractImmutableList();
  result.injectMethods(makeHookMethods(useState, initialValue));
  return result;
}

function ImmutableClassBasedList(mComp, path, initialState = []) {
  let result = AbstractImmutableList();
  result.injectMethods(makeClassMethods(mComp, path, initialState));
  return result;
}

// =================================================================

//                      IMMUTABLE OBJECT

// =================================================================
function ImmutableHookBasedObject(useState, initialValue = {}) {
  let result = AbstractImmutableObject();
  result.injectMethods(makeHookMethods(useState, initialValue));
  return result;
}

function ImmutableClassBasedObject(mComp, path, initialState = {}) {
  let result = AbstractImmutableObject();
  result.injectMethods(makeClassMethods(mComp, path, initialState));
  return result;
}

export {
  AbstractImmutableObject,
  AbstractImmutableList,
  AbstractImmutableSet,
  ImmutableHookBasedSet,
  ImmutableClassBasedSet,
  ImmutableHookBasedList,
  ImmutableClassBasedList,
  ImmutableHookBasedObject,
  ImmutableClassBasedObject,
};
