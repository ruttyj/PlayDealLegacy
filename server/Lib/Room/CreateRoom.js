
module.exports = function({
    makeResponse,
    isDef,
    AddressedResponse,
    els,
    roomManager,
    createGameInstance,
})
{
  return function (props)
    {
        const [subject, action] = ["ROOM", "CREATE"];
        const addressedResponses = new AddressedResponse();
        let { roomCode } = props;
        roomCode = els(roomCode, "AAAA");

        let room = roomManager.createRoom(roomCode);
        if (isDef(room)) {
          let status = "success";
          let payload = {};
          let roomCode = room.getCode();
          payload.roomCode = roomCode;

          // Create Game
          createGameInstance(room);

          addressedResponses.addToBucket(
            "default",
            makeResponse({ subject, action, status, payload })
          );
        }
        return addressedResponses;
      
    }
}