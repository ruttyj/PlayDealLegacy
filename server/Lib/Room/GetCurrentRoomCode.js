/**
 * GET_CURRENT
 * GetCurrentRoomCode
 * @SEARCH_REPLACE : GetCurrentRoomCode | getCurrentRoomCode
 * const buildGetCurrentRoomCode = require(`${serverFolder}/Lib/Room/GetCurrentRoomCode`);
 */
function buildGetCurrentRoomCode({
    //-------------------------
    isDef,
    //-------------------
    SocketResponseBuckets,
    //-------------------
    roomManager,
    //-------------------
    makeResponse,
})
{
    function getCurrentRoomCode(props)
    {
        const [subject, action] = ["ROOM", "GET_CURRENT"];
        const socketResponses = new SocketResponseBuckets();
        let payload = null;

        let { roomCode } = props;

        if (isDef(roomCode)) {
        let room = roomManager.getRoomByCode(roomCode);
        if (isDef(room)) {
            payload = room.serialize();
        }
        }

        socketResponses.addToBucket(
        "default",
        makeResponse({
            status: isDef(payload) ? "success" : "failure",
            subject,
            action,
            payload,
        })
        );

        return socketResponses;
    }
    return getCurrentRoomCode;
}

module.exports = buildGetCurrentRoomCode;
