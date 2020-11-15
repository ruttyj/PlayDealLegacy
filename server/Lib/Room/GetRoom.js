module.exports = function({
    isDef,
    getArrFromProp,
    AddressedResponse,
    roomManager,
    makeResponse,
})
{
    return function (props)
    {
        const [subject, action] = ["ROOM", "GET_KEYED"];
        const addressedResponses = new AddressedResponse();
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
            let room = roomManager.getRoom(roomCode);
            if (isDef(room)) {
            ++successCount;
            let roomCode = room.getCode();
            payload.order.push(roomCode);
            payload.items[roomCode] = room.serialize();
            } // end isDef room
        });

        addressedResponses.addToBucket(
            "default",
            makeResponse({
            status: successCount > 0 ? "success" : "failure",
            subject,
            action,
            payload,
            })
        );

        return addressedResponses;
    }
}