module.exports = function ({
    isDef,
    AddressedResponse,
    KeyedRequest,
    makeResponse,
    makeKeyedResponse,
    getAllKeyedResponse,
    makeConsumerFallbackResponse,
    makeRegularGetKeyed,
    handleGame,
})
{
    return function (registry)
    {
      registry.public(`PLAYER_COLLECTIONS.GET_KEYED`, (props) => {
        //props: { roomCode, (peopleIds|personId)}
        let subject = "PLAYER_COLLECTIONS";
        let action = "GET_KEYED";
        const addressedResponses = new AddressedResponse();
        return handleGame(
          props,
          (consumerData) => {
            let { game } = consumerData;

            let myKeyedRequest = KeyedRequest();
            myKeyedRequest.setAction(action);
            myKeyedRequest.setSubject(subject);
            myKeyedRequest.setPluralKey("peopleIds");
            myKeyedRequest.setSingularKey("personId");
            myKeyedRequest.setDataFn((personId) => {
              return game
                .getPlayerManager()
                .getAllCollectionIdsForPlayer(personId);
            });
            myKeyedRequest.setProps(consumerData);

            //deliver data
            addressedResponses.addToBucket(
              "default",
              makeKeyedResponse(myKeyedRequest)
            );

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      })
      registry.public(`PLAYER_COLLECTIONS.GET_ALL_KEYED`, (props) => {
        //props: {roomCode}
        let subject = "PLAYER_COLLECTIONS";
        let action = "GET_ALL_KEYED";
        const addressedResponses = new AddressedResponse();
        return handleGame(
          props,
          (consumerData) => {
            // Config
            let { game, personManager } = consumerData;

            // confirm the all command
            addressedResponses.addToBucket(
              "default",
              makeResponse({
                subject,
                action,
                status: "success",
                payload: null,
              })
            );

            let myKeyedRequest = KeyedRequest();
            myKeyedRequest.setAction(action);
            myKeyedRequest.setSubject(subject);
            myKeyedRequest.setPluralKey("peopleIds");
            myKeyedRequest.setSingularKey("personId");
            myKeyedRequest.setProps(consumerData);
            myKeyedRequest.setAllKeysFn(() =>
                game.getAllPlayerKeys()
            );

            // Get data
            addressedResponses.addToBucket(
              "default",
              getAllKeyedResponse(myKeyedRequest)
            );

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      })

      let collectionStuff = makeRegularGetKeyed({
        subject: "COLLECTIONS",
        singularKey: "collectionId",
        pluralKey: "collectionIds",
        makeGetDataFn: ({ game }, checkpoints) => (collectionId) => {
          let result = game.getCollectionManager().getCollection(collectionId);
          if (isDef(result)) {
            checkpoints.set("collectionExists", true);
            return result.serialize();
          }
        },
        makeGetAllKeysFn: ({ game }, checkpoints) => () => {
          return game.getCollectionManager().getAllCollectionIds();
        },
        makeGetAlMyKeysFn: ({ game, thisPersonId }, checkpoints) => () => {
          return game
            .getPlayerManager()
            .getAllCollectionIdsForPlayer(thisPersonId);
        },
      })
      registry.public(`COLLECTIONS.GET_KEYED`, collectionStuff.GET_KEYED);
      registry.public(`COLLECTIONS.GET_ALL_KEYED`, collectionStuff.GET_ALL_KEYED);
      registry.public(`COLLECTIONS.GET_ALL_MY_KEYED`, collectionStuff.GET_ALL_MY_KEYED);
      registry.public(`COLLECTIONS.REMOVE_KEYED`, collectionStuff.REMOVE_KEYED);
    }
}