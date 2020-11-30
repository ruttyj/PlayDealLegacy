module.exports = function buildTurnBasedActionProvider({
  isDef, isArr, isFunc, 
  AddressedResponse,
  TurnBasedController,
  SocketRequest,
  SocketResponse,
  RoomBeforeMiddleware,
  GameBeforeMiddleware,
}){


let executedOnce = false;


  return class TurnBasedActionProvider
  {
    constructor()
    {
      this.turnBasedController = new TurnBasedController()
    }

    up(registry)
    {
      const turnBasedController = this.turnBasedController
      //processWithBeforeMiddleWare(socketRequest, turnBasedController.getPlayerTurn)

      //================================================================================
      registry.public(`PLAYER_TURN.GET`, (...args) => turnBasedController.getPlayerTurn(...args))// @TODO move middle ware here ->before()->after()
      //--------------------------------------------------------------------------------

      /*
        @TODO
          - Create a middleware to adapt from legacy to new format
      //*/


      // When socketEvent `PLAYER_TURN.GET` is requested, ask the controller
      registry.on(`PLAYER_TURN.GET`, 
        (...args) => {

          if (!executedOnce) {
            //console.log("PLAYER_TURN.GET args", ...args)
            executedOnce = true
          }
          return turnBasedController.getPlayerTurn(...args);
        })
        .before(new RoomBeforeMiddleware())
        .before(new GameBeforeMiddleware())
        //.after()

      //================================================================================
      registry.public(`MY_TURN.TURN_STARTING_DRAW`, (...args) => turnBasedController.drawCards(...args))
      registry.public(`MY_TURN.FINISH_TURN`,        (...args) => turnBasedController.finishTurn(...args))
      registry.public(`MY_TURN.DISCARD_REMAINING`,  (...args) => turnBasedController.discardRemainingCards(...args))
    }

    down(registry)
    {
      registry.remove(`PLAYER_TURN.GET`)
      registry.remove(`MY_TURN.TURN_STARTING_DRAW`)
      registry.remove(`MY_TURN.FINISH_TURN`)
      registry.remove(`MY_TURN.DISCARD_REMAINING`)
    }
  }  
}