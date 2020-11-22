const builderFolder = `../../Builders/`
const buildTurnStartingDrawAction                   = require(`${builderFolder}/Events/TurnPhase/TurnStartingDrawAction`)
const buildAttemptFinishTurnAction                  = require(`${builderFolder}/Events/TurnPhase/AttemptFinishTurnAction`)
const buildDiscardToHandLimitAction                 = require(`${builderFolder}/Events/TurnPhase/DiscardToHandLimitAction`)
module.exports = function buildTurnBasedController({
  els,
  AddressedResponse,
  makeProps,
  makeResponse,
  makeConsumerFallbackResponse,
  handleGame,
  handleMyTurn,
  // Props
  roomManager, 
  // Helpers
  isDef, isArr, isFunc, 
  getArrFromProp,
  // Structures
  Affected, 
  Transaction,
}) {

  /*
  function handleGame(props, fn, fallback = undefined) {
    let checkpoints = new Map();
    const { connection } = props;
    if (isDef(connection)) {
      const room = connection.getRoom()
      const personManager = room.getPersonManager()
      const person = connection.getPerson()
      if (isDef(room)) {
        const roomCode = room.getCode()
        const game = room.getGame()
        return fn({
          ...props,
          room,

          game,
          personManager,
          person,
          // dep
          roomManager,
          thisRoomCode: roomCode,
          thisPersonId: person.getId()
        }, checkpoints)
      }
    }
    if (isFunc(fallback)) {
      return fallback(checkpoints)
    }
    return fallback
  }
  */
  return class TurnBasedController {
    constructor()
    {
    }
      
    getPlayerTurn(props) {
      let event = "PLAYER_TURN.GET";
      const addressedResponses = new AddressedResponse();
      return handleGame(
        props,
        (consumerData) => {
          let { game, thisPersonId } = consumerData;
          let currentTurn = game.getCurrentTurn();
  
          if (currentTurn.getPhaseKey() === "discard") {
            let thisPlayerHand = game.getPlayerHand(thisPersonId);
            let remaining = thisPlayerHand.getCount() - game.getHandMaxCardCount();
            if (remaining > 0) {
              currentTurn.setPhaseData({
                remainingCountToDiscard: remaining,
              });
            }
          }
  
          addressedResponses.addToBucket(
            "default",
            makeResponse({ 
              event, 
              status  : "success", 
              payload : game.getCurrentTurn().serialize()
            })
          );
  
          return addressedResponses;
        },
        makeConsumerFallbackResponse({ event, addressedResponses })
      );
    }
  
    drawCards(props) {
      return buildTurnStartingDrawAction({
        els,
        makeProps,
        handleGame,
        // Props
        roomManager, 
        // Helpers
        isDef, isArr, isFunc, 
        getArrFromProp,
        // Structures
        Affected, 
        Transaction,
        AddressedResponse,
        makeConsumerFallbackResponse,
        handleMyTurn,
        makeResponse,
      })(props)
    }
  
    finishTurn(props)
    {
      return buildAttemptFinishTurnAction({
        els,
        makeProps,
        handleGame,
        // Props
        roomManager, 
        // Helpers
        isDef, isArr, isFunc, 
        getArrFromProp,
        // Structures
        Affected, 
        Transaction,
        AddressedResponse,
        makeConsumerFallbackResponse,
        handleMyTurn,
        makeResponse,
        makeProps,
      })(props)
    }
  
    discardRemainingCards(props)
    {
      return buildDiscardToHandLimitAction({
        els,
        makeProps,
        handleGame,
        // Props
        roomManager, 
        // Helpers
        isDef, isArr, isFunc, 
        getArrFromProp,
        // Structures
        Affected, 
        Transaction,
        AddressedResponse,
        makeConsumerFallbackResponse,
        handleMyTurn,
        makeResponse,
        makeProps,
        els,
      })(props)
    }
  }
}