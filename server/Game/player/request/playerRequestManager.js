const PlayerRequest = require("./playerRequest.js");
const {
  makeVar,
  isDef,
  isObj,
  makeListener,
  makeMap,
  emptyFunc,
  jsonLog,
} = require("../../utils.js");
const Transaction = require("./transfer/Transaction.js");

const serverFolder = '../../..';
const buildAffected = require(`${serverFolder}/Builders/Affected`);
const buildOrderedTree = require(`${serverFolder}/Builders/OrderedTree`);
const OrderedTree = buildOrderedTree();
const Affected = buildAffected({OrderedTree});

const PlayerRequestManager = function () {

  let mState;
  let mGameInstance;
  let mRequests;
  let mAuthorRequests;
  let mTargetRequests;
  let mAllRequestSatisfiedEvent;
  let mTopId;


  /**
   * Request types:
   *
   *    Collect Funds
   *    Collect Property
   *
   *    Counter Request
   */

  function createRequest({
    type = "Undefined",
    parentId = 0,
    authorKey,
    targetKey,
    payload = null,
    description = "",
    onAcceptCallback = null,
    onDeclineCallback = null,
    onAccept = null,
    onDecline = null,
    onCounter = emptyFunc,
  }) {
    mTopId.inc();
    let topId = mTopId.get();
    let playerRequest = PlayerRequest(topId, type);
    playerRequest.setPayload(payload);
    playerRequest.setManagerRef(getPublic());
    playerRequest.setAuthorKey(authorKey);
    playerRequest.setTargetKey(targetKey);

    if (isDef(onAccept)) playerRequest.setOnAcceptFn(onAccept);
    if (isDef(onDecline)) playerRequest.setOnDeclineFn(onDecline);
    if (isDef(onCounter)) playerRequest.setOnCounterFn(onCounter);
    if (isDef(parentId)) playerRequest.setParentId(parentId);
    if (isDef(description)) playerRequest.setDescription(description);

    if (isDef(onAcceptCallback))
      playerRequest.setOnAcceptCallback(onAcceptCallback);
    if (isDef(onDeclineCallback))
      playerRequest.setOnDeclineCallback(onDeclineCallback);

    // add to maps
    if (!mAuthorRequests.has(authorKey)) mAuthorRequests.set(authorKey, []);
    mAuthorRequests.get(authorKey).push(playerRequest.getId());

    if (!mTargetRequests.has(targetKey)) mTargetRequests.set(targetKey, []);
    mTargetRequests.get(targetKey).push(playerRequest.getId());

    mRequests.set(topId, playerRequest);
    return playerRequest;
  }

  function loadRequest(serialized) {
    //Transaction
    if (isDef(serialized)) {
      let payload = null;
      if (isDef(serialized.payload) && isObj(serialized.payload)) {
        payload = {};
        Object.keys(serialized.payload).forEach((key) => {
          let val = serialized.payload[key];
          if (isObj(val) && isDef(val.is) && val.is === "Transaction") {
            let transaction = Transaction();
            transaction.load(val);
            payload[key] = transaction;
          } else {
            payload[key] = val;
          }
        });
      }

      let temp = { ...serialized };
      temp.payload = payload;
      return createRequest(temp);
    }
  }

  // Can only end in a just say no getting accepted... eventually
  function _justSayNoClose(thisRequest) {
    thisRequest
      .getPayload("transaction")
      .getOrCreate("done")
      .getOrCreate("done")
      .confirm("done");
  }

  function _reconstructRequest(
    thisRequest,
    { affected, affectedIds, _Affected }
  ) {
    // sure, it did go away.... but its baccccck
    let reconstruct = thisRequest.getPayload("reconstruct");
    let newRequest = loadRequest(reconstruct);
    newRequest.setOnAcceptCallback(
      thisRequest.getPayload("reconstructOnAccept")
    );
    newRequest.setOnDeclineCallback(
      thisRequest.getPayload("reconstructOnDecline")
    );

    if (isDef(_Affected)){
      _Affected.setAffected('REQUEST', newRequest.getId(), Affected.ACTION.UPDATE);
      _Affected.setAffected('PLAYER_REQUEST', newRequest.getAuthorKey(), Affected.ACTION.UPDATE);
      _Affected.setAffected('PLAYER_REQUEST', newRequest.getTargetKey(), Affected.ACTION.UPDATE);
      _Affected.setAffected('REQUEST', thisRequest.getId(), Affected.ACTION.UPDATE);

    } else {
      affected.requests = true;
      affectedIds.requests.push(newRequest.getId());
      affectedIds.playerRequests.push(newRequest.getAuthorKey());
      affectedIds.playerRequests.push(newRequest.getTargetKey());
      affectedIds.requests.push(thisRequest.getId());
    }

    _justSayNoClose(thisRequest);
  }


  function _justSayNoTransitive(
    thisRequest,
    { cardId, affected, affectedIds, _Affected }
  ) {
    let counterJustSayNo = makeJustSayNo(thisRequest, cardId);


    if (isDef(_Affected)) {
      _Affected.setAffected('REQUEST', thisRequest.getId(), Affected.ACTION.UPDATE);
      _Affected.setAffected('REQUEST', counterJustSayNo.getId(), Affected.ACTION.UPDATE);
      _Affected.setAffected('PLAYER_REQUEST', counterJustSayNo.getAuthorKey(), Affected.ACTION.UPDATE);
      _Affected.setAffected('PLAYER_REQUEST', counterJustSayNo.getTargetKey(), Affected.ACTION.UPDATE);
    } else {
      affected.requests = true;
      affectedIds.requests.push(thisRequest.getId());
      affectedIds.requests.push(counterJustSayNo.getId());
      affectedIds.playerRequests.push(counterJustSayNo.getAuthorKey());
      affectedIds.playerRequests.push(counterJustSayNo.getTargetKey());
    }
    
  }

  function makeJustSayNo(request, cardId) {
    let transaction = Transaction();
    transaction.getOrCreate("done").getOrCreate("done").add("done");

    let payload = {
      actionCardId: cardId,
    };
    let handleOnAccept = _justSayNoClose;
    let handleOnDecline = _justSayNoTransitive;
    let isJustSayNo = request.getType() === "justSayNo";
    let grandParentId = request.getParentId();
    let grandParent = isDef(grandParentId) ? getRequestById(grandParentId) : null;
    let grandParentTypeIsJustSayNo = isDef(grandParent) ? grandParent.getType() === "justSayNo" : false;
    if (isJustSayNo) {
      handleOnAccept = _reconstructRequest;
      handleOnDecline = _justSayNoTransitive;

      // I know this is a horrible solution to the 3rd "just say no" problem      
      if(grandParentTypeIsJustSayNo) {
        handleOnAccept = _justSayNoClose;
        handleOnDecline = _reconstructRequest;
      } else {
        handleOnAccept = _reconstructRequest;
        handleOnDecline = _justSayNoTransitive;
      }
      payload.reconstruct = request.getPayload("reconstruct");
      payload.activeOnAccept = request.getPayload("reconstructOnDecline");
      payload.reconstructOnAccept = request.getPayload("reconstructOnAccept");
      payload.reconstructOnDecline = request.getPayload("reconstructOnDecline");
    } else {
      payload.reconstruct = JSON.parse(JSON.stringify(request.serialize()));
      payload.activeOnAccept = request.getOnDeclineCallback();
      payload.reconstructOnAccept = request.getOnDeclineCallback();
      payload.reconstructOnDecline = request.getOnAcceptCallback();
    }

    // Wrap the chosen methods to actually close the request
    let doHandleOnAccept = (req, ...args) => {
      let result = handleOnAccept(req, ...args);
      req.close("accept");

      let activeOnAccept = req.getPayload("activeOnAccept", null);
      if (isDef(activeOnAccept)) {
        activeOnAccept(req, ...args);
      }

      return result;
    };

    let doHandleOnDecline = (req, ...args) => {
      let result = handleOnDecline(req, ...args);
      req.close("decline");

      return result;
    };

    let sayNoRequest = createRequest({
      type: "justSayNo",
      authorKey: request.getTargetKey(),
      targetKey: request.getAuthorKey(),
      status: "open",
      parentId: request.getId(),
      payload: {
        // store data to reconstruct original request
        ...payload,
        transaction,
      },
      description: `No!`,
      onAccept: doHandleOnAccept,
      onDecline: doHandleOnDecline,
    });
    return sayNoRequest;
  }

  function setGameInstance(inst) {
    mGameInstance = inst;
  }

  function getGameInstance() {
    return mGameInstance;
  }

  function hasRequest(id) {
    return mRequests.has(id);
  }

  function getRequestById(id) {
    return mRequests.get(id);
  }

  function isAllRequestsClosed() {
    let requestIds = getAllRequestIds();
    for (let i = 0; i < requestIds.length; ++i) {
      let requestId = requestIds[i];
      let request = getRequestById(requestId);
      if (!request.isClosed()) {
        return false;
      }
    }
    return true;
  }

  function isAllRequestsSatisfied() {
    return isAllRequestsClosed();
  }

  function getRequestsForAuthor(authorKey) {
    if (mAuthorRequests.has(authorKey)) return mAuthorRequests.get(authorKey);
    return [];
  }

  function getRequestsForTarget(authorKey) {
    if (mTargetRequests.has(authorKey)) return mTargetRequests.get(authorKey);
    return [];
  }

  function getAllRequestIds() {
    let result = [];
    mRequests.forEach((val, key) => {
      result.push(key);
    });
    return result;
  }

  function getAllRequestIdsForPlayer(playerKey) {
    let result = [];

    let requestsForAuthor = getRequestsForAuthor(playerKey);
    if (isDef(requestsForAuthor)) {
      requestsForAuthor.forEach((val) => {
        result.push(val);
      });
    }

    let requestsForTarget = getRequestsForTarget(playerKey);
    if (isDef(requestsForTarget)) {
      requestsForTarget.forEach((val) => {
        result.push(val);
      });
    }

    return result;
  }

  function getAnOpenTargetRequst(targetKey) {
    let targetRequests = mTargetRequests.get(targetKey);
    if (isDef(targetRequests)) {
      let clone = [...targetRequests].reverse();
      return clone.find((req) => !req.isClosed());
    }
    return null;
  }

  function serializeAllRequests() {
    let result = [];
    mRequests.forEach((req) => {
      result.push(req.serialize());
    });
    return result;
  }

  function destroy() {}

  function reset(resetRefs = true) {
    if (resetRefs) {
      mGameInstance = null;
      mAllRequestSatisfiedEvent = makeListener();
    }

    mState = {};
    mTopId = makeVar(mState, "topId", 0);
    mRequests = makeMap(mState, "requests");
    mAuthorRequests = makeMap(mState, "authorRequests");
    mTargetRequests = makeMap(mState, "targetRequests");
  }
  
  function serialize() {
    let serializedResultItems = {};
    let requestIds = getAllRequestIds();
    requestIds.forEach((requestId) => {
      let request = getRequestById(requestId);
      if (isDef(request)) {
        serializedResultItems[request.getId()] = request.serialize();
      }
    });

    let result = {
      requests: {
        items: serializedResultItems,
      },
    };

    return result;
  }

  function unserialize(data){
    reset(false);
  }

  function getPublic() {
    return {
      createRequest,
      loadRequest,
      makeJustSayNo,
      getRequest: getRequestById,
      getRequestById,
      hasRequest,
      getAllRequestIds,
      getAllRequestIdsForPlayer,
      setGameInstance,
      getGameInstance,
      isAllRequestsSatisfied,
      isAllRequestsClosed,
      getRequestsForAuthor,
      getRequestsForTarget,
      getAnOpenTargetRequst,
      serializeAllRequests,

      reset,
      serialize,
      unserialize,
      destroy,
  
      events: {
        allRequestSatisfied: mAllRequestSatisfiedEvent,
      },
  
    };
  }

  reset();
  return getPublic();
};

module.exports = PlayerRequestManager;
