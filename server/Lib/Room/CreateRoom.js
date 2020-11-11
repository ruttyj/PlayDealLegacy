/**
 * ROOM CREATE
 * CreateRoom
 * @SEARCH_REPLACE : CreateRoom | createRoom
 * const buildCreateRoom = require(`${serverFolder}/Lib/Actions/CreateRoom`);
 */
function buildCreateRoom({
    makeResponse,
    isDef,
    AddressedResponse,
    els,
    roomManager,
    createGameInstance,
})
{
    function createRoom(props)
    {
        const [subject, action] = ["ROOM", "CREATE"];
        const socketResponses = new AddressedResponse();
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

          socketResponses.addToBucket(
            "default",
            makeResponse({ subject, action, status, payload })
          );
        }
        return socketResponses;
      
    }
    return createRoom;
}

module.exports = buildCreateRoom;
