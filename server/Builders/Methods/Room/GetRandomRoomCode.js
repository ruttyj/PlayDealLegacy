module.exports = function ({
    AddressedResponse,
    roomManager,
    makeResponse,
})
{
    return function (props)
    {
        const addressedResponses = new AddressedResponse();
        const [subject, action] = ["ROOM", "GET_RANDOM_CODE"];

        let status = "success";
        let payload = {
            code: roomManager.getRandomCode(),
        };

        addressedResponses.addToBucket(
            AddressedResponse.DEFAULT_BUCKET,
            makeResponse({ subject, action, status, payload })
        );

        return addressedResponses;
    }
}