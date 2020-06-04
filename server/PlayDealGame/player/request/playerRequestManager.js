const PlayerRequest = require("./playerRequest.js");
const { makeVar, isDef, isObj, makeListener, makeMap, emptyFunc, jsonLog } = require("../../utils.js");
const Transaction = require("./transfer/Transaction.js");

const PlayerRequestManager = function() {
  const mState = {};
  const mRequests = makeMap(mState, "requests");
  const mAuthorRequests = makeMap(mState, "authorRequests");
  const mTargetRequests = makeMap(mState, "targetRequests");
  let mGameInstance = null;

  const mAllRequestSatisfiedEvent = makeListener();

  // Top Id
  const { get: getTopId, inc: incTopId } = makeVar(mState, "topId", 0);
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
    onCounter = emptyFunc
  }) {
    incTopId();
    let topId = getTopId();
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

    if (isDef(onAcceptCallback)) playerRequest.setOnAcceptCallback(onAcceptCallback);
    if (isDef(onDeclineCallback)) playerRequest.setOnDeclineCallback(onDeclineCallback);

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
        Object.keys(serialized.payload).forEach(key => {
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

  function _reconstructRequest(thisRequest, { affected, affectedIds, checkpoints }) {
    // sure it did go away.... but its baccccck
    let reconstruct = thisRequest.getPayload("reconstruct");
    let newRequest = loadRequest(reconstruct);
    newRequest.setOnAcceptCallback(thisRequest.getPayload("reconstructOnAccept"));
    newRequest.setOnDeclineCallback(thisRequest.getPayload("reconstructOnDecline"));

    affected.requests = true;
    affectedIds.requests.push(newRequest.getId());
    affectedIds.playerRequests.push(newRequest.getAuthorKey());
    affectedIds.playerRequests.push(newRequest.getTargetKey());

    _justSayNoClose(thisRequest);

    affectedIds.requests.push(thisRequest.getId());
  }

  function _justSayNoTransitive(thisRequest, { cardId, affected, affectedIds, checkpoints }) {
    let counterJustSayNo = makeJustSayNo(thisRequest, cardId);

    affectedIds.requests.push(thisRequest.getId());

    affected.requests = true;
    affectedIds.requests.push(counterJustSayNo.getId());
    affectedIds.playerRequests.push(counterJustSayNo.getAuthorKey());
    affectedIds.playerRequests.push(counterJustSayNo.getTargetKey());
  }

  function makeJustSayNo(request, cardId) {
    let transaction = Transaction();
    transaction
      .getOrCreate("done")
      .getOrCreate("done")
      .add("done");

    let payload = {
      actionCardId: cardId
    };
    let handleOnAccept = _justSayNoClose;
    let handleOnDecline = _justSayNoTransitive;
    let isJustSayNo = request.getType() === "justSayNo";
    if (isJustSayNo) {
      handleOnAccept = _reconstructRequest;
      handleOnDecline = _justSayNoTransitive;
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
      payload: {
        // store data to reconstruct original request
        ...payload,
        transaction
      },
      description: `No!`,
      onAccept: doHandleOnAccept,
      onDecline: doHandleOnDecline
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
      requestsForAuthor.forEach(val => {
        result.push(val);
      });
    }

    let requestsForTarget = getRequestsForTarget(playerKey);
    if (isDef(requestsForTarget)) {
      requestsForTarget.forEach(val => {
        result.push(val);
      });
    }

    return result;
  }

  function getAnOpenTargetRequst(targetKey) {
    let targetRequests = mTargetRequests.get(targetKey);
    if (isDef(targetRequests)) {
      let clone = [...targetRequests].reverse();
      return clone.find(req => !req.isClosed());
    }
    return null;
  }

  function serializeAllRequests() {
    let result = [];
    mRequests.forEach(req => {
      result.push(req.serialize());
    });
    return result;
  }

  function handleOnCounter(parentReq, couterCard) {
    let mdg = getGameInstance();
    let managerRef = parentReq.getManagerRef();
    let targetPlayerKey = parentReq.getTargetKey();
    let targetPlayerHand = mdg.getPlayerHand(parentReq.getTargetKey());

    let isValidCounter = false;
    if (isDef(couterCard)) {
      if (mdg.doesCardHaveTag(couterCard, "justSayNo")) {
        isValidCounter = true;
        // Play on pile
        mdg.getActivePile().addCard(targetPlayerHand.giveCard(couterCard));

        // Allow other player to accept or counter with another "just say no"
        managerRef.createRequest({
          type: "justSayNo",
          parentId: parentReq.getId(),
          authorKey: targetPlayerKey,
          targetKey: parentReq.getAuthorKey(),
          description: `(${targetPlayerKey} response with "justSayNo" to (${parentReq.getDescription()}))`,
          onCounter: handleOnCounter,
          onAccept(justSayNoReq) {
            let parent = justSayNoReq.getParent();
            if (isDef(parent)) {
              parent.decline();
            }
          },
          onDecline(justSayNoReq) {
            //Add a request here if an offer other than the original is to be offered
            /*
            // Double negative, repeat initial request
            managerRef.createRequest({
              type: parentReq.getType(),
              parentId: justSayNoReq.getId(),
              authorKey: parentReq.getAuthorKey(),
              targetKey: parentReq.getTargetKey(),
              payload: parentReq.getPayload(),
              description: `(${parentReq.getAuthorKey()} repeats request ${parentReq.getDescription()})`,
              onAccept(thisReq) {
                // Accept original request
                let parent = thisReq.getParent();
                if (isDef(parent)) {
                  //Close original request
                  parent.accept();
                }
              },
              onDecline(thisReq) {
                let parent = thisReq.getParent();
                if (isDef(parent)) {
                  //Close original request
                  parent.decline();
                }
              },
              onCounter: handleOnCounter
            });
            //*/
          }
        });
      }
    }

    if (!isValidCounter) {
      parentReq.accept();
    }
  }

  function makeFundRequest({ authorKey, value, targetKey }) {
    // Request funds
    let req = createRequest({
      type: "collectFunds",
      parentId: null,
      authorKey: authorKey,
      targetKey: targetKey,
      payload: {
        value: value,
        paid: 0
      },
      description: `(Player ${authorKey} request ${value}M from Player ${targetKey})`,
      onAccept: handleOnAcceptCollectFunds,
      onCounter: handleOnCounter
    });
    return req;
  }

  function makePropertyValueRequest({ authorKey, value, targetKey, description = null, parentId = null }) {
    return createRequest({
      type: "collectValueOfProperty",
      parentId: parentId,
      authorKey: authorKey,
      targetKey: targetKey,
      payload: {
        value: value
      },
      description: description,
      onCounter: handleOnCounter,
      onAccept(propReq) {
        let propertyReqPayload = propReq.getPayload();
        let transferProperty = propertyReqPayload.cards;
        //get selected property
        //transfer property
        //@TODO transfer property
      }
    });
  }

  function handleOnAcceptCollectFunds(fundReq) {
    let game = getGameInstance();
    let managerRef = fundReq.getManagerRef();
    let targetPlayerKey = fundReq.getTargetKey();
    let authorPlayerKey = fundReq.getAuthorKey();

    let collectAmount = fundReq.getPayload().value;
    let targetPlayerBank = game.getPlayerBank(targetPlayerKey);
    let authorPlayerBank = game.getPlayerBank(authorPlayerKey);

    // Get cards from bank to pay with
    let seperatedCards = game.calculateChangeFromPlayerBank(targetPlayerKey, collectAmount);

    let giveCards = seperatedCards.giveCards;
    let remainder = seperatedCards.remainder;

    // Pay the cards
    authorPlayerBank.addCards(targetPlayerBank.giveCards(giveCards));

    // If not enough request property
    if (remainder > 0) {
      makePropertyValueRequest({
        parentId: fundReq.getId(),
        authorKey: authorPlayerKey,
        value: remainder,
        targetKey: targetPlayerKey,
        requestManager: managerRef,
        description: `(${fundReq.getDescription()} not enough, request property from ${targetPlayerKey})`
      });
    }
  }

  function checkIfAllRequestsSatisfied() {
    if (isAllRequestsSatisfied()) {
      mAllRequestSatisfiedEvent.emit(getPublic());
    }
  }

  function destroy() {}

  function serialize() {
    let serializedResultItems = {};
    let requestIds = getAllRequestIds();
    requestIds.forEach(requestId => {
      let request = getRequestById(requestId);
      if (isDef(request)) {
        serializedResultItems[request.getId()] = request.serialize();
      }
    });

    let result = {
      requests: {
        items: serializedResultItems
      }
    };

    return result;
  }

  const publicInterface = {
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
    serialize,

    events: {
      allRequestSatisfied: mAllRequestSatisfiedEvent
    },

    destroy,

    //------------
    makeFundRequest,
    handleOnCounter,
    makePropertyValueRequest,
    handleOnAcceptCollectFunds
  };

  function getPublic() {
    return { ...publicInterface };
  }
  return getPublic();
};

module.exports = PlayerRequestManager;
