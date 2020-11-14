/**
 * GET_KEYED
 * GetAllRooms
 * @SEARCH_REPLACE : GetAllRooms | getAllRooms
 * const buildGetAllRooms = require(`${serverFolder}/Lib/Room/GetAllRooms`);
 */
function buildGetAllRooms({
    AddressedResponse,
    registry,
    roomManager,
    makeResponse,
})
{
    return function (props)
    {
        let subject = "ROOM";
        let action = "GET_ALL_KEYED";
        let status = "success";

        const addressedResponses = new AddressedResponse();
        let roomCodes = roomManager.listAllRoomCodes();
        addressedResponses.addToBucket(
            "default",
            registry.execute('ROOM.GET_KEYED', makeProps(props, {
                roomCodes: roomCodes,
            }))
        );
        let payload = {
            roomCodes,
        };
        addressedResponses.addToBucket(
            "default",
            makeResponse({ subject, action, status, payload })
        );

        return addressedResponses;
    }
}

module.exports = buildGetAllRooms;
