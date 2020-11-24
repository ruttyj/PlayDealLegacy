module.exports = function buildRoomBeforeMiddleware({
  isDef,
  BaseMiddleware
}){
  return class RoomBeforeMiddleware extends BaseMiddleware {
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
}