module.exports = function ({
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
            AddressedResponse.DEFAULT_BUCKET,
            registry.execute('ROOM.GET_KEYED', makeProps(props, {
                roomCodes: roomCodes,
            }))
        );
        let payload = {
            roomCodes,
        };
        addressedResponses.addToBucket(
            AddressedResponse.DEFAULT_BUCKET,
            makeResponse({ subject, action, status, payload })
        );

        return addressedResponses;
    }
}