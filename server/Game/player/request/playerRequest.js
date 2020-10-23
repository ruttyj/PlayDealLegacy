const {
  makeVar,
  emptyFunction,
  isDef,
  isFunc,
  isArr,
  recursiveBuild,
  getNestedValue,
} = require("../../utils.js");

const PlayerRequest = function (
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
  let mState = {};

  let mId                 = makeVar(mState, "id", null);
  let mParentId           = makeVar(mState, "parentId", null);
  let mRootId             = makeVar(mState, "rootId", null);
  let mManagerRef         = makeVar(mState, "managerRef", null);
  let mAuthorKey          = makeVar(mState, "authorKey", null);
  let mTargetKey          = makeVar(mState, "targetKey", null);
  let mActionNum          = makeVar(mState, "actionNum", actionNum);
  let mType               = makeVar(mState, "type", null);
  let mDescription        = makeVar(mState, "description", description);
  let mIsClosed           = makeVar(mState, "isClosed", false);
  let mHasResponse        = makeVar(mState, "hasResponse", false);
  let mStatus             = makeVar(mState, "status", "open");
  let mHasTargetSatisfied = makeVar(mState, "hasTargetSatisfied", false);
  let mPayload            = makeVar(mState, "payload", payload);

  //Methods called - crutial to the core operation
  let mOnAcceptFn         = makeVar(mState, "onAccept", onAccept);
  let mOnDeclineFn        = makeVar(mState, "onDecline", onDecline);
  let mOnCloseFn          = makeVar( mState, "onClose", onClose);
  let mOnCounterFn        = makeVar( mState, "onCounter", onCounter);

  // These will only get executed at the end of the request chain IE:  Request Property: SayNo -> SayNo -> SayNo -> accept
  let mOnAcceptCallback   = makeVar(mState, "onAcceptCallback", onAcceptCallback);
  let mOnDeclineCallback  = makeVar(mState, "onDeclineCallback", onDeclineCallback);

  mId.set(id);
  mType.set(requestType);

  function close(status) {
    mIsClosed.set(true);
    mStatus.set(status);
    mOnCloseFn.get()(getPublic());
  }

  function accept(...args) {
    mHasResponse.set(true);
    if (mOnAcceptFn.has()) {
      let acceptFn = mOnAcceptFn.get();
      let result = acceptFn(getPublic(), ...args);

      return result;
    }
  }

  function decline(...args) {
    mHasResponse.set(true);
    if (mOnDeclineFn.has()) return mOnDeclineFn.get()(getPublic(), ...args);
  }

  function counter(...args) {
    mHasResponse.set(true);
    return mOnCounterFn.get()(getPublic(), ...args);
  }

  function getPayload(_path = [], fallback = null) {
    let path = isArr(_path) ? _path : [_path];
    let payload = mPayload.get();
    if (path.length === 0) {
      return payload;
    } else {
      return getNestedValue(payload, path, fallback);
    }
  }

  function reset() {
    // @TODO
  }

  function serialize() {
    // Recursivly iterate over an object if has serialize value then substitiute the serialized values
    let serializePayload = recursiveBuild(
      getPayload(),
      (recurse, value, path) => {
        if (isDef(value) && isFunc(value.serialize)) {
          return value.serialize();
        } else if (!isFunc(value)) {
          return recurse(value, path);
        }
      }
    );

    return {
      id:                 mId.get(),
      type:               mType.get(),
      description:        mDescription.get(),
      actionNum:          mActionNum.get(),
      status:             mStatus.get(),
      authorKey:          mAuthorKey.get(),
      targetKey:          mTargetKey.get(),
      isClosed:           mIsClosed.get(),
      hasTargetSatisfied: mHasTargetSatisfied.get(),
      hasResponse:        mHasResponse.get(),
      parentId:           mParentId.get(),
      hasOnAcceptFn:      mOnAcceptFn.has(),
      hasOnDeclineFn:     mOnDeclineFn.has,
      hasOnCounterFn:     mOnCounterFn.get() !== emptyFunction,
      hasOnCloseFn:       mOnCloseFn.get() !== emptyFunction,
      payload:            serializePayload,
    };
  }

  function unserialize(data) {
    // @TODO
  }

  function getParent() {
    let manager = mManagerRef.get();
    let parentId = mParentId.get();
    if (isDef(manager) && isDef(parentId)) {
      return manager.getRequestById(parentId);
    }
    return null;
  }

  function getPublic() {
    // do not allow the modification of the interface
    return {
      getId: mId.get,
  
      getParentId: mParentId.get,
      setParentId: mParentId.set,
      getParent,
  
      getRootId: mRootId.get,
      setRootId: mRootId.set,
  
      getManagerRef: mManagerRef.get,
      setManagerRef: mManagerRef.set,
  
      getAuthorKey: mAuthorKey.get,
      setAuthorKey: mAuthorKey.set,
  
      getTargetKey: mTargetKey.get,
      setTargetKey: mTargetKey.set,
      getTargetSatisfied: mHasTargetSatisfied.get,
      setTargetSatisfied: mHasTargetSatisfied.set,
  
      getActionNum: mActionNum.get,
      setActionNum: mActionNum.set,
  
      setType: mType.set,
      getType: mType.get,
  
      getDescription: mDescription.get,
      setDescription: mDescription.set,
  
      getStatus: mStatus.get,
      setStatus: mStatus.set,
  
      getPayload,
      setPayload: mPayload.set,
      hasPayload: mPayload.has,
  
      isClosed: mIsClosed.get,
      setOnCloseFn: mOnCloseFn.set,
  
      setOnAcceptFn: mOnAcceptFn.set,
      setOnDeclineFn: mOnDeclineFn.set,
      setOnCounterFn: mOnCounterFn.set,
  
      hasOnAcceptCallback: mOnAcceptCallback.has,
      setOnAcceptCallback: mOnAcceptCallback.set,
      getOnAcceptCallback: mOnAcceptCallback.get,
  
      hasOnDeclineCallback: mOnDeclineCallback.has,
      setOnDeclineCallback: mOnDeclineCallback.set,
      getOnDeclineCallback: mOnDeclineCallback.get,
  
      accept,
      decline,
      counter,
      close,
  
      reset,
      serialize,
      unserialize,
    };
  }

  reset();
  return getPublic();
};

module.exports = PlayerRequest;
