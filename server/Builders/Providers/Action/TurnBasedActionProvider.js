module.exports = function buildTurnBasedActionProvider({
  TurnBasedController,
}){
  return class TurnBasedActionProvider
  {
    constructor()
    {
      this.turnBasedController = new TurnBasedController()
    }
    up(registry)
    {
      const turnBasedController = this.turnBasedController
      registry.public(`PLAYER_TURN.GET`,            turnBasedController.getPlayerTurn)
      registry.public(`MY_TURN.TURN_STARTING_DRAW`, turnBasedController.drawCards)
      registry.public(`MY_TURN.FINISH_TURN`,        turnBasedController.finishTurn)
      registry.public(`MY_TURN.DISCARD_REMAINING`,  turnBasedController.discardRemainingCards)
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