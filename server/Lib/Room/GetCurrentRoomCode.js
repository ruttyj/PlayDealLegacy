module.exports = function ({
    isDef,
    AddressedResponse,
    roomManager,
    makeResponse,
})
{
    return function (props)
    {
        const [subject, action] = ["ROOM", "GET_CURRENT"];
        const addressedResponses = new AddressedResponse();
        let payload = null;

        let { roomCode } = props;

        if (isDef(roomCode)) {
            let room = roomManager.getRoomByCode(roomCode);
            if (isDef(room)) {
                payload = room.serialize();
            }
        }

        addressedResponses.addToBucket(
            "default",
            makeResponse({
                status: isDef(payload) ? "success" : "failure",
                subject,
                action,
                payload,
            })
        );

        return addressedResponses;
    }
}