/**
 * GET_KEYED
 * GetRoom
 * @SEARCH_REPLACE : GetRoom | getRoom
 * const buildGetRoom = require(`${serverFolder}/Lib/Room/GetRoom`);
 */
function buildGetRoom({
    isDef,
    getArrFromProp,
    SocketResponseBuckets,
    roomManager,
    makeResponse,
})
{
    function getRoom(props)
    {
        const [subject, action] = ["ROOM", "GET_KEYED"];
        const socketResponses = SocketResponseBuckets();
        let payload = {
            items: {},
            order: [],
        };

        let roomCodes = getArrFromProp(props, {
            plural: "roomCodes",
            singular: "roomCode",
        });

        let successCount = 0;
        roomCodes.forEach((roomCode) => {
            let room = roomManager.getRoomByCode(roomCode);
            if (isDef(room)) {
            ++successCount;
            let roomCode = room.getCode();
            payload.order.push(roomCode);
            payload.items[roomCode] = room.serialize();
            } // end isDef room
        });

        socketResponses.addToBucket(
            "default",
            makeResponse({
            status: successCount > 0 ? "success" : "failure",
            subject,
            action,
            payload,
            })
        );

        return socketResponses;
    }
    return getRoom;
}

module.exports = buildGetRoom;
