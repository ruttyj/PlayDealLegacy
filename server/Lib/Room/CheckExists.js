/**
 * EXISTS
 * CheckExists
 * @SEARCH_REPLACE : CheckExists | checkExists
 * const buildCheckExists = require(`${serverFolder}/Lib/Room/CheckExists`);
 */
function buildCheckExists({
    makeResponse,
    isDef,
    AddressedResponse,
    getArrFromProp,
    roomManager,
})
{
    function checkExists(props)
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
    return checkExists;
}

module.exports = buildCheckExists;
