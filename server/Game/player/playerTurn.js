const { jsonLog, isDef, makeListener, makeVar } = require("../utils.js");
const PlayerRequestManager = require("./request/playerRequestManager.js");

function PlayerTurn(gameRef, playerKey = null) {
  let mPlayerKey;
  let mCanDrawTurnStartingCards = true;
  const mState = {};
  const {
    get: getPhaseData,
    set: setPhaseData,
    remove: removePhaseData,
  } = makeVar(mState, "phaseData", null);
  const mActionLimit = 3;
  const mCardsPlayed = [];
  const mActionsPreformed = [];
  const mTurnRequestManager = PlayerRequestManager();
  mTurnRequestManager.setGameInstance(gameRef);
  mTurnRequestManager.events.allRequestSatisfied.on(() => {
    // Alert possible phase change when requests satisfied
    proceedToNextPhase();
  });

  //==================================================

  //                  PHASE LOGIC

  //==================================================
  const mTurnPhases = ["draw", "action", "request", "discard", "done"];
  let mInitialPhase = "draw";
  let mCurrentPhase;
  const mPhaseChangeEvent = makeListener();

  function getCurrentPhase() {
    return mCurrentPhase;
  }

  function getPossiblePhases() {
    return mTurnPhases;
  }

  function setToPhase(phaseKey) {
    mCurrentPhase = phaseKey;
    mPhaseChangeEvent.emit(getPublic());
  }

  function proceedToNextPhase(force = false) {
    let currentPhase = getCurrentPhase();
    if (currentPhase !== "done") {
      let goToEnd = false;
      // Can still play?
      if (isWithinActionLimit()) {
        if (["draw", "request"].includes(currentPhase)) {
          setToPhase("action");
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
          setToPhase("discard");
        } else {
          setToPhase("done");
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

  function getActionCount() {
    return mActionsPreformed.length;
  }

  function isWithinActionLimit() {
    return getActionCount() < getActionLimit();
  }

  // Any card played - could be in response to a request - @TODO add who played card  - transfer to game logs after turn
  function setCardPlayed(card) {
    mCardsPlayed.push(card);
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
      setToPhase("request");
    } else {
      proceedToNextPhase();
    }
  }

  function getActionsPreformed() {
    return [...mActionsPreformed];
  }

  function getCardsPlayed() {
    return [...mCardsPlayed];
  }

  function shouldDiscardCards() {
    let hand = gameRef.getPlayerHand(getPlayerKey());
    return isDef(hand) && hand.getCount() > gameRef.getHandMaxCardCount();
  }

  function serialize() {
    return {
      playerKey: getPlayerKey(),
      phase: getCurrentPhase(),
      phaseData: getPhaseData(),
      actionCount: getActionCount(),
      actionLimit: getActionLimit(),
      //cardsPlayed: getCardsPlayed(),
      //actionsPreformed: getActionsPreformed()
    };
  }

  function destroy() {
    mTurnRequestManager.destroy();
  }

  if (isDef(playerKey)) setPlayerKey(playerKey);

  const publicScope = {
    getRequestManager,
    destroy,

    setPlayerKey,
    getPlayerKey,

    getPhaseData,
    setPhaseData,
    removePhaseData,

    //Phase
    getCurrentPhase,
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

    setCardPlayed, // deprecated
    getCardsPlayed, // deprecated

    events: {
      phaseChange: mPhaseChangeEvent,
    },

    serialize,
  };

  function getPublic() {
    return { ...publicScope };
  }

  // Set intial phase
  setToPhase(mInitialPhase);

  return getPublic();
}
module.exports = PlayerTurn;
