
/**
 * GET_RANDOM_CODE
 * getRandomRoom
 * const buildGetRandomRoom = require(`${serverFolder}/Lib/Room/GetRandomRoom`);
 */
function buildGetRandomRoom({
    AddressedResponse,
    roomManager,
    makeResponse,
})
{
    function getRandomRoom(props)
    {
        const socketResponses = new AddressedResponse();
        const [subject, action] = ["ROOM", "GET_RANDOM_CODE"];

        let status = "success";
        let payload = {
            code: roomManager.getRandomCode(),
        };

        socketResponses.addToBucket(
        "default",
            makeResponse({ subject, action, status, payload })
        );

        return socketResponses;
    }
    return getRandomRoom;
}

module.exports = buildGetRandomRoom;
