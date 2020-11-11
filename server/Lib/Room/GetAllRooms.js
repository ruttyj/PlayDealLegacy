/**
 * GET_KEYED
 * GetAllRooms
 * @SEARCH_REPLACE : GetAllRooms | getAllRooms
 * const buildGetAllRooms = require(`${serverFolder}/Lib/Room/GetAllRooms`);
 */
function buildGetAllRooms({
    SocketResponseBuckets,
    PUBLIC_SUBJECTS,
    roomManager,
    makeResponse,
})
{
    function getAllRooms(props)
    {
        let subject = "ROOM";
        let action = "GET_ALL_KEYED";
        let status = "success";

        const socketResponses = new SocketResponseBuckets();
        let roomCodes = roomManager.listAllRoomCodes();
        socketResponses.addToBucket(
            "default",
            PUBLIC_SUBJECTS.ROOM.GET_KEYED({
            roomCodes: roomCodes,
            })
        );
        let payload = {
            roomCodes,
        };
        socketResponses.addToBucket(
            "default",
            makeResponse({ subject, action, status, payload })
        );

        return socketResponses;
    }
    return getAllRooms;
}

module.exports = buildGetAllRooms;
