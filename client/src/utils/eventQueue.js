export default function() {
  const events = {};
  const executeCallbacksOnce = {};
  const executeCallbacksOn = {};

  let removeFromArrayByValue = (arr, item) => {
    var index = arr.indexOf(item);
    if (index !== -1) arr.splice(index, 1);
  };

  //========================================

  //              On Event

  //========================================
  let existsOnEvent = eventName => {
    return typeof executeCallbacksOn[eventName] !== "undefined";
  };

  let addOnEventCallback = (eventName, callback) => {
    if (!existsOnEvent(eventName)) executeCallbacksOn[eventName] = [];

    executeCallbacksOn[eventName].push(callback);
  };

  let removeOnEventCallback = (eventName, callback) => {
    if (existsOnEvent(eventName))
      removeFromArrayByValue(executeCallbacksOn[eventName], callback);
  };

  let clearOnEvent = eventName => {
    if (existsOnEvent(eventName)) delete executeCallbacksOn[eventName];
  };

  let triggerOnEvent = (eventName, ...payload) => {
    if (existsOnEvent(eventName)) {
      executeCallbacksOn[eventName].forEach(callback => callback(...payload));
    }
  };

  //========================================

  //              Once Event

  //========================================
  let existsOnceEvent = eventName => {
    return typeof executeCallbacksOnce[eventName] !== "undefined";
  };

  let addOnceEventCallback = (eventName, callback) => {
    if (!existsOnceEvent(eventName)) executeCallbacksOnce[eventName] = [];
    executeCallbacksOnce[eventName].push(callback);
  };

  let removeOnceEventCallback = (eventName, callback) => {
    if (existsOnceEvent(eventName))
      removeFromArrayByValue(executeCallbacksOnce[eventName], callback);
  };

  let clearOnceEvent = eventName => {
    if (existsOnceEvent(eventName)) delete executeCallbacksOnce[eventName];
  };
  let triggerOnceEvent = (eventName, ...payload) => {
    if (existsOnceEvent(eventName)) {
      executeCallbacksOnce[eventName].forEach(callback => callback(...payload));
      clearOnceEvent(eventName);
    }
  };

  //========================================

  //

  //========================================
  let registerEvent = eventName => {
    events[eventName] = true;
  };

  let unregisterEvent = eventName => {
    if (typeof events[eventName] !== "undefined") delete events[eventName];

    clearOnceEvent(eventName);
    clearOnEvent(eventName);
  };

  let on = (eventName, callback) => {
    registerEvent(eventName);
    addOnEventCallback(eventName, callback);
  };

  let once = (eventName, callback) => {
    registerEvent(eventName);
    addOnceEventCallback(eventName, callback);
  };

  let off = (eventName, callback = null) => {
    if (callback === null) {
      unregisterEvent(eventName);
    } else {
      removeOnEventCallback(eventName, callback);
      removeOnceEventCallback(eventName, callback);
    }
  };

  let trigger = (eventName, ...payload) => {
    triggerOnEvent(eventName, ...payload);
    triggerOnceEvent(eventName, ...payload);
  };

  return {
    once,
    on,
    off,
    trigger
  };
}
