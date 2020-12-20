function buildRegisterChatMethods({
    isDef,
    AddressedResponse,
    makeResponse,
    makeConsumerFallbackResponse,
    handlePerson,
})
{
    return function (registry)
    {
      registry.public(`CHAT.SEND_PRIVATE_MESSAGE`, (props) => {
        const [subject, action] = ["CHAT", "SEND_PRIVATE_MESSAGE"];
        const addressedResponses = new AddressedResponse();
        return handlePerson(
          props,
          (props2) => {
            let { type, value, playerKey, thisPersonId } = props2;
            let { personManager } = props2;

            let status = "success";
            let payload = {
              type,
              visibility: "private",
              from: thisPersonId,
              value
            };

            let receivingPerson = personManager.getPerson(playerKey);
            if (isDef(receivingPerson)) {
              addressedResponses.addToSpecific(
                receivingPerson.getSocketId(),
                makeResponse({ subject, action: "RECEIVE_MESSAGE", status, payload })
              );
            }

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      })
      registry.public(`CHAT.SEND_MESSAGE`, (props) => {
        const [subject, action] = ["CHAT", "SEND_MESSAGE"];
        const addressedResponses = new AddressedResponse();
        return handlePerson(
          props,
          (props2) => {
            let { type, value } = props2;
            let { thisPersonId } = props2;

            let status = "success";
            let payload = {
              type,
              visibility: "public",
              from: thisPersonId,
              value
            };

            addressedResponses.addToBucket(
              AddressedResponse.EVERYONE_BUCKET,
              makeResponse({ subject, action: "RECEIVE_MESSAGE", status, payload })
            );

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      })
      registry.public(`CHAT.RECEIVE_MESSAGE`, () => {
        // emit to user
        // roomCode
        const [subject, action] = ["CHAT", "RECEIVE_MESSAGE"];
        const addressedResponses = new AddressedResponse();
        return handlePerson(
          props,
          (props2) => {
            let { message } = props2;

            let status = "success";
            let payload = {
              type: "text",
              message
            };

            addressedResponses.addToBucket(
              AddressedResponse.EVERYONE_ELSE_BUCKET,
              makeResponse({ subject, action, status, payload })
            );

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      })
    }
}

module.exports = buildRegisterChatMethods;
