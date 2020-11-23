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



  class SocketRequest 
  {
    constructor(event, props = {})
    {
      this.response = new AddressedResponse()
      this.event = event
      this.props = props
    }

    getEvent()
    {
      return this.event
    }

    getResponse()
    {
      return this.response
    }

    getProps()
    {
      return this.props
    }

    setProps(props)
    {
      this.props = props
    }
  }

  class SocketResponse
  {
    constructor(event)
    {
      this.event = event
      this.response = new AddressedResponse()
      this.affected = new Affected()
      this.status = `failure`
    }

    getEvent()
    {
      return this.event
    }

    getStatus()
    {
      return this.status
    }

    setStatus(status)
    {
      this.status = status
    }

    getAddressedResponse()
    {
      return this.response
    }

    add(responses)
    {
      this.response.addToBucket("default", responses)
    }

    setAffected(entityKey, id=0, action=null)
    {
      this.affected.setAffected(entityKey, id, action)
    }

    getAffected()
    {
      return this.affected;
    }
  }

  class BaseMiddleware 
  {
    constructor()
    {
      this.nextCheck = null;
    }
  
    then(nextCheck) {
      this.nextCheck = nextCheck;
    }

    check(socketRequest) {
      this.next(socketRequest)
    }

    next(socketRequest) {
      if (this.nextCheck !== null) {
        this.nextCheck.check(socketRequest)
      }
    }
  }

  class RoomMiddleware extends BaseMiddleware {
    check(socketRequest)
    {
      const { connection } = socketRequest.props;
      if (!connection) {
        throw `Connection not defined`
      }

      const server      = connection.getServer();
      const roomManager = server.getRoomManager()
      const room        = connection.getRoom();
      const person      = connection.getPerson();

      if (!isDef(room)) {
        throw `Room not defined`
      }

      socketRequest.setProps({
        ...socketRequest.getProps(),  // contains roomCode
        thisRoomCode: room.getCode(), 
        connection,
        roomManager,
        room,
        thisRoom      : room,
        personManager : room.getPersonManager(),
        person,
        personId      : person.getId(),
        thisPersonId  : person.getId(),
        thisPerson    : person,
        server,
      })

      this.next(socketRequest)
    }
  }

  class GameMiddleware extends BaseMiddleware {
    check(socketRequest)
    {
      const { room } = socketRequest.props;
      if (room) {
        const game = room.getGame();

        if (!isDef(game)) {
          throw `Game not defined`
        }

        socketRequest.setProps({
          ...socketRequest.getProps(),
          game
        })

        this.next(socketRequest)
      }
    }
  }

  return class TurnBasedController {
    constructor(){}
      
    getPlayerTurn(props) 
    {
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
      //#######################################################
      // @TODO move this into the connection
      const socketRequest  = new SocketRequest(event)
      const socketResponse = new SocketResponse(event)
      socketRequest.setProps(props)

      // Define before middleware
      let beforeMiddleware = new BaseMiddleware()
      const roomMiddleware = new RoomMiddleware()
      const gameMiddleware = new GameMiddleware()
      beforeMiddleware.then(roomMiddleware)
      roomMiddleware.then(gameMiddleware)

      // Define after middleware
      let afterMiddleware = new BaseMiddleware()

      // Execute
      try {
        // Execute before middleware
        beforeMiddleware.check(socketRequest)

        // Execute primary logic
        doTheThing(socketRequest, socketResponse)

        // Execute after middleware
        afterMiddleware.check(socketResponse)
      } catch (e) {
        // Failure
        makeConsumerFallbackResponse({
          event, 
          addressedResponses: socketResponse.getAddressedResponse() 
        })
      }

      return socketResponse.getAddressedResponse();
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