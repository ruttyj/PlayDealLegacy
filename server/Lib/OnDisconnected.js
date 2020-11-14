module.exports = function({
    onListen,
    isDef,
    thisClient,
    clientManager,
    roomManager,
    cookieTokenManager,
})
{
  return function ()
    {
      let clientId = thisClient.id;
        let rooms = roomManager.getRoomsForClientId(clientId);
        cookieTokenManager.dissociateClient(clientId);
    
        if (isDef(rooms)) {
          // HACK
          rooms.forEach((room) => {
            onListen(
              JSON.stringify([
                {
                  subject: "ROOM",
                  action: "LEAVE",
                  props: { roomCode: room.getCode() },
                },
              ])
            );
    
            // Handle leave room since the above handler requires the room to exist to notify people
            let roomPersonManager = room.getPersonManager();
            if (roomPersonManager.getConnectedPeopleCount() === 0) {
              roomManager.deleteRoom(room.getId());
            }
          });
        }
        clientManager.removeClient(thisClient);
    }
}