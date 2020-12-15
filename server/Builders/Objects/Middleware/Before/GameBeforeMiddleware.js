module.exports = function buildGameBeforeMiddleware({
  isDef,
  BaseMiddleware
}){
  return class GameBeforeMiddleware extends BaseMiddleware {
    check(req, res)
    {
      const { room } = req.props;
      if (room) {
        const game = room.getGame();

        if (!isDef(game)) {
          throw `Game not defined`
        }

        req.setProps({
          ...req.getProps(),
          game
        })

        this.next(req, res)
      }
    }
  }
}