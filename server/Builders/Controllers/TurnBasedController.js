const builderFolder = `../../Builders/`
const buildTurnStartingDrawAction                   = require(`${builderFolder}/Events/TurnPhase/TurnStartingDrawAction`)
const buildAttemptFinishTurnAction                  = require(`${builderFolder}/Events/TurnPhase/AttemptFinishTurnAction`)
const buildDiscardToHandLimitAction                 = require(`${builderFolder}/Events/TurnPhase/DiscardToHandLimitAction`)
module.exports = function buildTurnBasedController({
  els,
  AddressedResponse,
  SocketRequest,
  SocketResponse,
  BaseMiddleware,
  RoomBeforeMiddleware,
  GameBeforeMiddleware,

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



  function handleSocketRequest(event, props, method, beforeMiddleware, afterMiddleware) {
    //#######################################################
    // @TODO move this into the connection
    const socketRequest  = new SocketRequest(event)
    const socketResponse = new SocketResponse(event)
    socketRequest.setProps(props)

    // Execute
    try {
      // Execute before middleware
      if (isDef(beforeMiddleware)) {
        beforeMiddleware.check(socketRequest)
      }

      // Execute primary logic
      method(socketRequest, socketResponse)

      // Execute after middleware
      if (isDef(afterMiddleware)) {
        afterMiddleware.check(socketResponse)
      }
    } catch (e) {
      // Failure
      makeConsumerFallbackResponse({
        event, 
        addressedResponses: socketResponse.getAddressedResponse() 
      })
    }

    return socketResponse.getAddressedResponse();
  }



  return class TurnBasedController {
    constructor()
    {
      const beforeMiddleware  = new BaseMiddleware()
      const roomMiddleware    = new RoomBeforeMiddleware()
      const gameMiddleware    = new GameBeforeMiddleware()
      beforeMiddleware.then(roomMiddleware)
      roomMiddleware.then(gameMiddleware)
      this.gameBeforeMiddleware = beforeMiddleware


      // Define after middleware
      const afterMiddleware = new BaseMiddleware()
      this.gameAfterMiddleware = afterMiddleware
    }
      
    getPlayerTurn(props) 
    {
      const controller = this;
      const doTheThing = (socketRequest, socketResponse) => {
        let event         = socketRequest.getEvent()
        let consumerData  = socketRequest.getProps()
      
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

        // @TODO set affected current turn


        // @TODO move this to central response processing
        socketResponse.setStatus("success");
        socketResponse.add(makeResponse({ 
            event   : event, 
            status  : "success", 
            payload : game.getCurrentTurn().serialize()
          }))

        return socketResponse.getAddressedResponse();
      }

      let event = "PLAYER_TURN.GET"

      return handleSocketRequest(event, props, doTheThing, controller.gameBeforeMiddleware, controller.gameAfterMiddleware)
    }
  
    drawCards(props) 
    {
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