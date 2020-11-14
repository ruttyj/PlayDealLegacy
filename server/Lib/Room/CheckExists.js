module.exports = function({
    makeResponse,
    isDef,
    AddressedResponse,
    getArrFromProp,
    roomManager,
})
{
    return function (props)
    {
        const addressedResponses = new AddressedResponse();
        const [subject, action] = ["ROOM", "EXISTS"];
        let roomCodes = getArrFromProp(props, {
          plural: "roomCodes",
          singular: "roomCode",
        });
        let status = "failure";
        let payload = {
          exists: {},
        };

        roomCodes.forEach((code) => {
          status = "success";
          let room = roomManager.getRoomByCode(code);
          payload.exists[code] = isDef(room);
        });
        addressedResponses.addToBucket(
          "default",
          makeResponse({ subject, action, status, payload })
        );

        return addressedResponses;
    }
}