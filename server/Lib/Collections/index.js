/**
 * Build a People Method Provider
 * @SEARCH_REPLACE Collection
 * Provides methods for a socket to be able to listen with
 * const buildRegisterCollectionsMethods = require(`${serverFolder}/Lib/Collection/`);
 */
function buildRegisterCollectionsMethods({
    isDef,
    SocketResponseBuckets,
    KeyedRequest,
    PUBLIC_SUBJECTS,
    makeResponse,
    makeKeyedResponse,
    getAllKeyedResponse,
    makeConsumerFallbackResponse,
    makeRegularGetKeyed,
    handleGame,
})
{
    function registerCollectionMethods(registry)
    {
        Object.assign(PUBLIC_SUBJECTS, {
            COLLECTIONS: {
              ...makeRegularGetKeyed({
                SUBJECTS: PUBLIC_SUBJECTS,
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
              }),
            },
            PLAYER_COLLECTIONS: {
              GET_KEYED: (props) => {
                //props: { roomCode, (peopleIds|personId)}
                let subject = "PLAYER_COLLECTIONS";
                let action = "GET_KEYED";
                const socketResponses = new SocketResponseBuckets();
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
                    socketResponses.addToBucket(
                      "default",
                      makeKeyedResponse(myKeyedRequest)
                    );
        
                    return socketResponses;
                  },
                  makeConsumerFallbackResponse({ subject, action, socketResponses })
                );
              },
              GET_ALL_KEYED: (props) => {
                //props: {roomCode}
                let subject = "PLAYER_COLLECTIONS";
                let action = "GET_ALL_KEYED";
                const socketResponses = new SocketResponseBuckets();
                return handleGame(
                  props,
                  (consumerData) => {
                    // Config
                    let { game, personManager } = consumerData;
        
                    // confirm the all command
                    socketResponses.addToBucket(
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
                    socketResponses.addToBucket(
                      "default",
                      getAllKeyedResponse(PUBLIC_SUBJECTS, myKeyedRequest)
                    );
        
                    return socketResponses;
                  },
                  makeConsumerFallbackResponse({ subject, action, socketResponses })
                );
              },
            },
          });
      
    }
    return registerCollectionMethods;
}

module.exports = buildRegisterCollectionsMethods;
