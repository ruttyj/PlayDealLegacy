function buildRegisterCardMethods({
    AddressedResponse,
    KeyedRequest,
    makeResponse,
    makeKeyedResponse,
    getAllKeyedResponse,
    makeConsumerFallbackResponse,
    handleGame,
})
{
    return function (registry)
    {
      registry.public(`PROPERTY_SETS.GET_KEYED`, (props) => {
        let subject = "PROPERTY_SETS";
        let action = "GET_KEYED";
        const addressedResponses = new AddressedResponse();
        return handleGame(
          props,
          (consumerData) => {
            let { game } = consumerData;

            let myKeyedRequest = KeyedRequest();
            myKeyedRequest.setAction(action);
            myKeyedRequest.setSubject(subject);
            myKeyedRequest.setSingularKey("propertySetKey");
            myKeyedRequest.setPluralKey("propertySetKeys");
            myKeyedRequest.setProps(consumerData);
            myKeyedRequest.setDataFn((propertySetKey) => {
              return game.getPropertySet(propertySetKey);
            });

            addressedResponses.addToBucket(
              AddressedResponse.DEFAULT_BUCKET,
              makeKeyedResponse(myKeyedRequest)
            );

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      })
      registry.public(`PROPERTY_SETS.GET_ALL_KEYED`, (props) => {
        let subject = "PROPERTY_SETS";
        let action = "GET_ALL_KEYED";
        const addressedResponses = new AddressedResponse();
        return handleGame(
          props,
          (consumerData) => {
            // Config
            let { game } = consumerData;

            let myKeyedRequest = KeyedRequest();
            myKeyedRequest.setAction(action);
            myKeyedRequest.setSubject(subject);
            myKeyedRequest.setSingularKey("propertySetKey");
            myKeyedRequest.setPluralKey("propertySetKeys");
            myKeyedRequest.setProps(consumerData);
            myKeyedRequest.setAllKeysFn(game.getAllPropertySetKeys);

            // Get data
            addressedResponses.addToBucket(
              AddressedResponse.DEFAULT_BUCKET,
              getAllKeyedResponse(myKeyedRequest)
            );

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      })
      registry.public(`CARDS.GET_KEYED`, (props) => {
        let subject = "CARDS";
        let action = "GET_KEYED";
        const addressedResponses = new AddressedResponse();
        return handleGame(
          props,
          (consumerData) => {
            // Config
            let { game } = consumerData;

            let myKeyedRequest = KeyedRequest();
            myKeyedRequest.setAction(action);
            myKeyedRequest.setSubject(subject);
            myKeyedRequest.setSingularKey("cardId");
            myKeyedRequest.setPluralKey("cardIds");
            myKeyedRequest.setProps(consumerData);
            myKeyedRequest.setDataFn(game.getCard);

            // Get data
            addressedResponses.addToBucket(
              AddressedResponse.DEFAULT_BUCKET,
              makeKeyedResponse(myKeyedRequest)
            );

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      })
      registry.public(`CARDS.GET_ALL_KEYED`, (props) => {
        let subject = "CARDS";
        let action = "GET_ALL_KEYED";
        const addressedResponses = new AddressedResponse();
        return handleGame(
          props,
          (consumerData) => {
            // Config
            let { game } = consumerData;

            let myKeyedRequest = KeyedRequest();
            myKeyedRequest.setAction(action);
            myKeyedRequest.setSubject(subject);
            myKeyedRequest.setSingularKey("cardId");
            myKeyedRequest.setPluralKey("cardIds");
            myKeyedRequest.setProps(consumerData);
            myKeyedRequest.setAllKeysFn(game.getAllCardIds);

            // Get data
            addressedResponses.addToBucket(
              AddressedResponse.DEFAULT_BUCKET,
              getAllKeyedResponse(myKeyedRequest)
            );

            // Confirm
            addressedResponses.addToBucket(
              AddressedResponse.DEFAULT_BUCKET,
              makeResponse({
                subject,
                action,
                status: "success",
                payload: null,
              })
            );

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      })
    }
}

module.exports = buildRegisterCardMethods;
