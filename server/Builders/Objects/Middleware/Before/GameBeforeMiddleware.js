module.exports = function buildGameBeforeMiddleware({
  isDef,
  BaseMiddleware
}){
  return class GameBeforeMiddleware extends BaseMiddleware {
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
}