const { makeVar, emptyFunction, isDef, isFunc, isArr, recursiveBuild, getNestedValue } = require("../../utils.js");

const PlayerRequest = function(
  id,
  requestType,
  actionNum = 0,
  payload = null,
  onAcceptCallback = null,
  onDeclineCallback = null,
  onAccept = null,
  onDecline = null,
  onClose = emptyFunction,
  onCounter = emptyFunction,
  description = ""
) {
  let mRef = {};

  const { get: getId, set: setId } = makeVar(mRef, "id", null);

  const { get: getParentId, set: setParentId } = makeVar(mRef, "parentId", null);

  const { get: getRootId, set: setRootId } = makeVar(mRef, "rootId", null);

  const { get: getManagerRef, set: setManagerRef } = makeVar(mRef, "managerRef", null);

  const { get: getAuthorKey, set: setAuthorKey } = makeVar(mRef, "authorKey", null);

  const { get: getTargetKey, set: setTargetKey } = makeVar(mRef, "targetKey", null);

  const { get: getActionNum, set: setActionNum } = makeVar(mRef, "actionNum", actionNum);

  const { get: getType, set: setType } = makeVar(mRef, "type", null);

  const { get: getDescription, set: setDescription } = makeVar(mRef, "description", description);

  const { get: isClosed, set: setIsClosed } = makeVar(mRef, "isClosed", false);

  const { get: hasResponse, set: setHasResponse } = makeVar(mRef, "hasResponse", false);

  const { get: getStatus, set: setStatus } = makeVar(mRef, "status", "open");

  const { get: getTargetSatisfied, set: setTargetSatisfied } = makeVar(mRef, "hasTargetSatisfied", false);

  const { get: _getPayload, set: setPayload, has: hasPayload } = makeVar(mRef, "payload", null);
  //const { get: _getHiddenPayload, set: setHiddenPayload, has: hasHiddenPayload } = makeVar(mRef, "hiddenPayload", null);

  //Methods called - crutial to the core operation
  const { get: getOnAcceptFn, set: setOnAcceptFn, has: hasOnAcceptFn } = makeVar(mRef, "onAccept", onAccept);
  const { get: getOnDeclineFn, set: setOnDeclineFn, has: hasOnDeclineFn } = makeVar(mRef, "onDecline", onDecline);
  const { get: getOnCloseFn, set: setOnCloseFn } = makeVar(mRef, "onClose", onClose);
  const { get: getOnCounterFn, set: setOnCounterFn } = makeVar(mRef, "onCounter", onCounter);

  // These will only get executed at the end of the request chain IE:  Request Property: SayNo -> SayNo -> SayNo -> accept
  const { get: getOnAcceptCallback, set: setOnAcceptCallback, has: hasOnAcceptCallback } = makeVar(mRef, "onAcceptCallback", onAcceptCallback);
  const { get: getOnDeclineCallback, set: setOnDeclineCallback, has: hasOnDeclineCallback } = makeVar(mRef, "onDeclineCallback", onDeclineCallback);

  setId(id);
  setType(requestType);

  function close(status) {
    setIsClosed(true);
    setStatus(status);
    getOnCloseFn()(getPublic());
  }

  function accept(...args) {
    setHasResponse(true);
    if (hasOnAcceptFn()) {
      let acceptFn = getOnAcceptFn();
      let result = acceptFn(getPublic(), ...args);

      return result;
    }
  }

  function decline(...args) {
    setHasResponse(true);
    if (hasOnDeclineFn()) return getOnDeclineFn()(getPublic(), ...args);
  }

  function counter(...args) {
    setHasResponse(true);
    return getOnCounterFn()(getPublic(), ...args);
  }

  function getPayload(_path = [], fallback = null) {
    let path = isArr(_path) ? _path : [_path];
    let payload = _getPayload();
    if (path.length === 0) {
      return payload;
    } else {
      return getNestedValue(payload, path, fallback);
    }
  }

  function serialize() {
    // Recursivly iterate over an object if has serialize value then substitiute the serialized values
    let serializePayload = recursiveBuild(getPayload(), (recurse, value, path) => {
      if (isDef(value) && isFunc(value.serialize)) {
        return value.serialize();
      } else if (!isFunc(value)) {
        return recurse(value, path);
      }
    });

    return {
      id: getId(),
      type: getType(),
      description: getDescription(),
      actionNum: getActionNum(),
      status: getStatus(),
      authorKey: getAuthorKey(),
      targetKey: getTargetKey(),
      isClosed: isClosed(),
      hasTargetSatisfied: getTargetSatisfied(),
      hasResponse: hasResponse(),
      parentId: getParentId(),
      hasOnAcceptFn,
      hasOnDeclineFn,
      hasOnCounterFn: getOnCounterFn() !== emptyFunction,
      hasOnCloseFn: getOnCloseFn() !== emptyFunction,
      payload: serializePayload
    };
  }

  function getParent() {
    let manager = getManagerRef();
    let parentId = getParentId();
    if (isDef(manager) && isDef(parentId)) {
      return manager.getRequestById(parentId);
    }
    return null;
  }

  const publicInterface = {
    getId,

    getParentId,
    setParentId,
    getParent,

    getRootId,
    setRootId,

    getManagerRef,
    setManagerRef,

    getAuthorKey,
    setAuthorKey,

    getTargetKey,
    setTargetKey,
    getTargetSatisfied,
    setTargetSatisfied,

    getActionNum,
    setActionNum,

    setType,
    getType,

    getDescription,
    setDescription,

    getStatus,
    setStatus,

    getPayload,
    setPayload,
    hasPayload,

    isClosed,
    setOnCloseFn,

    setOnAcceptFn,
    setOnDeclineFn,
    setOnCounterFn,

    hasOnAcceptCallback,
    setOnAcceptCallback,
    getOnAcceptCallback,

    hasOnDeclineCallback,
    setOnDeclineCallback,
    getOnDeclineCallback,

    accept,
    decline,
    counter,
    close,

    serialize
  };
  function getPublic() {
    // do not allow the modification of the interface
    return { ...publicInterface };
  }
  return publicInterface;
};

module.exports = PlayerRequest;
