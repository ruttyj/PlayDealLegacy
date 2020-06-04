const { 
  makeVar, serializeState,
  log, logBlock
} = require("../utils.js");

function KeyedRequest(){
  const mState = {};

  function is(){
    return KeyedRequest;
  }

  //subject, action, props, nomenclature, getData, fallback
  const {
    set:  setSubject,
    get:  getSubject,
    has:  hasSubject,
  } = makeVar(mState, "subject");

  const {
    set:  setAction,
    get:  getAction,
    has:  hasAction,
  } = makeVar(mState, "action");

  const {
    set:  setLogging,
    get:  getLogging,
    has:  hasLogging,
  } = makeVar(mState, "logging", false);

  const {
    set:  setPluralKey,
    get:  getPluralKey,
    has:  hasPluralKey,
  } = makeVar(mState, "pluralKey");

  const {
    set:  setSingularKey,
    get:  getSingularKey,
    has:  hasSingularKey,
  } = makeVar(mState, "singularKey");

  const {
    set:  setDataFn,
    get:  getDataFn,
    has:  hasDataFn,
  } = makeVar(mState, "dataFn");

  const {
    set:  setAllKeysFn,
    get:  getAllKeysFn,
    has:  hasAllKeysFn,
  } = makeVar(mState, "allKeysFn");

  const {
    set:  setProps,
    get:  getProps,
    has:  hasProps,
  } = makeVar(mState, "props");

  const {
    set:  setFallback,
    get:  getFallback,
    has:  hasFallback,
  } = makeVar(mState, "fallback");


  function serialize(){
    return serializeState(mState);
  }

  const publicInterface = {
    is,
    serialize,

    setSubject,
    getSubject,
    hasSubject,

    setAction,
    getAction,
    hasAction,
    
    setLogging,
    getLogging,
    hasLogging,

    setPluralKey,
    getPluralKey,
    hasPluralKey,

    setSingularKey,
    getSingularKey,
    hasSingularKey,

    setDataFn,
    getDataFn,
    hasDataFn,

    setAllKeysFn,
    getAllKeysFn,
    hasAllKeysFn,

    setFallback,
    getFallback,
    hasFallback,

    setProps,
    getProps,
    hasProps,
  }

  function getPublic(){
    return {...publicInterface}
  }

  return getPublic();
}

module.exports = KeyedRequest;