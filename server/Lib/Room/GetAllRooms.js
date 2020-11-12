/**
 * GET_KEYED
 * GetAllRooms
 * @SEARCH_REPLACE : GetAllRooms | getAllRooms
 * const buildGetAllRooms = require(`${serverFolder}/Lib/Room/GetAllRooms`);
 */
function buildGetAllRooms({
    AddressedResponse,
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

        const addressedResponses = new AddressedResponse();
        let roomCodes = roomManager.listAllRoomCodes();
        addressedResponses.addToBucket(
            "default",
            PUBLIC_SUBJECTS.ROOM.GET_KEYED(makeProps(props, {
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
    return getAllRooms;
}

module.exports = buildGetAllRooms;
