const { jsonLog, isDef, makeVar } = require("../utils.js");
const PlayerRequestManager = require("./request/playerRequestManager.js");

function PlayerTurn(gameRef, playerKey = null) {
  let mGameRef = gameRef;
  let mState;

  let mPlayerKey;
  let mCanDrawTurnStartingCards;

  let getPhaseData;
  let setPhaseData;
  let removePhaseData;
  let mActionLimit;
  let mActionsPreformed;
  let mTurnRequestManager;
  let mTurnPhases;
  let mCurrentPhase;

  //==================================================

  //                  PHASE LOGIC

  //==================================================

  function reset(){
    mState = {};
    mCanDrawTurnStartingCards = true;

    let phaseData = makeVar(mState, "phaseData", null);;
    getPhaseData = phaseData.get;
    setPhaseData = phaseData.set;
    removePhaseData = phaseData.remove;

    mActionLimit = 3;
    mActionsPreformed = [];
    mTurnRequestManager = PlayerRequestManager();
    mTurnRequestManager.setGameInstance(mGameRef);
    mTurnRequestManager.events.allRequestSatisfied.on(() => {
      // Alert possible phase change when requests satisfied
      proceedToNextPhase();
    });
  
    //==================================================
  
    //                  PHASE LOGIC
  
    //==================================================
    mTurnPhases = ["draw", "action", "request", "discard", "done"];
    // Set intial phase
    setPhaseKey("draw");
  }

  function getPhaseKey() {
    return mCurrentPhase;
  }

  function getPossiblePhases() {
    return mTurnPhases;
  }

  function setPhaseKey(phaseKey) {
    mCurrentPhase = phaseKey;
  }

  function proceedToNextPhase(force = false) {
    let currentPhase = getPhaseKey();
    if (currentPhase !== "done") {
      let goToEnd = false;
      // Can still play?
      if (isWithinActionLimit()) {
        if (["draw", "request"].includes(currentPhase)) {
          setPhaseKey("action");
        } else if (force) {
          goToEnd = true;
        }
      } else {
        goToEnd = true;
      }

      let requestManagerExists = isDef(mTurnRequestManager);
      let isAllClosed = mTurnRequestManager.isAllRequestsClosed();
      if (goToEnd && isAllClosed) {
        // should discard?
        if (shouldDiscardCards()) {
          setPhaseKey("discard");
        } else {
          setPhaseKey("done");
        }
      }
    }
  }

  function setHasDrawnStartingCards() {
    mCanDrawTurnStartingCards = false;
    proceedToNextPhase(true);
  }

  function canDrawTurnStartingCards() {
    return mCanDrawTurnStartingCards;
  }

  function canPlayerPreformAction() {
    return !mCanDrawTurnStartingCards && isWithinActionLimit();
  }

  function isDone() {
    return mCurrentPhase === "done";
  }

  function setPlayerKey(val) {
    mPlayerKey = val;
  }

  function getPlayerKey() {
    return mPlayerKey;
  }

  function getRequestManager() {
    return mTurnRequestManager;
  }

  //==================================================

  // ACTION LIMIT

  //==================================================
  function getActionLimit() {
    return mActionLimit;
  }

  function setActionLimit(value) {
    mActionLimit = value;
  }

  function getActionCount() {
    return mActionsPreformed.length;
  }

  function isWithinActionLimit() {
    return getActionCount() < getActionLimit();
  }

  // Cards played which take up an action
  function setActionPreformed(actionType, card) {
    /*
    MODIFY_PROPERTY_COLLECTION
    AUGMENT_COLLECTION
    DRAW_CARDS
    REQUEST
    */
    mActionsPreformed.push(card);
    if (actionType === "REQUEST") {
      setPhaseKey("request");
    } else {
      proceedToNextPhase();
    }
  }

  function setActionsPreformed(actions) {
    mActionsPreformed = [...actions];
  }
  function getActionsPreformed() {
    return [...mActionsPreformed];
  }


  function shouldDiscardCards() {
    let hand = gameRef.getPlayerHand(getPlayerKey());
    return isDef(hand) && hand.getCount() > gameRef.getHandMaxCardCount();
  }

  function serialize() {
    return {
      playerKey: getPlayerKey(),
      phase: getPhaseKey(),
      phaseData: getPhaseData(),
      actionsPreformed: getActionsPreformed(),
      actionLimit: getActionLimit(),
      actionCount: getActionCount(),
    };
  }

  function unserialize(data) {
    setPlayerKey(data.playerKey);
    setPhaseKey(data.phase);
    setPhaseData(data.phaseData);
    setActionsPreformed(data.actionsPreformed);
    setActionLimit(data.actionLimit);
    //actionCount calculated
  }

  function destroy() {
    mTurnRequestManager.destroy();
  }

  if (isDef(playerKey)) setPlayerKey(playerKey);

  function getPublic() {
    return {
      getRequestManager,
      destroy,
  
      setPlayerKey,
      getPlayerKey,
  
      getPhaseData,
      setPhaseData,
      removePhaseData,
  
      //Phase
      getCurrentPhase: getPhaseKey,
      getPhaseKey,
      proceedToNextPhase,
      isDone,
      getPossiblePhases,
      shouldDiscardCards,
      setHasDrawnStartingCards,
      canDrawTurnStartingCards,
  
      // Actions
      getActionCount,
      getActionLimit,
      isWithinActionLimit,
      canPlayerPreformAction,
      setActionPreformed,
      getActionsPreformed,
  
      reset,
      serialize,
      unserialize,
    };
  }

  
  reset();
  return getPublic();
}
module.exports = PlayerTurn;
