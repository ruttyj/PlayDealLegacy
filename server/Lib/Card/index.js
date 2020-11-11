/**
 * Build a People Method Provider
 * 
 * Provides methods for a socket to be able to listen with
 * const buildRegisterCardMethods = require(`${serverFolder}/Lib/Game/`);
 */
function buildRegisterCardMethods({
    SocketResponseBuckets,
    KeyedRequest,
    PUBLIC_SUBJECTS,
    makeResponse,
    makeKeyedResponse,
    getAllKeyedResponse,
    makeConsumerFallbackResponse,
    handleGame,
})
{
    function registercardMethods(registry)
    {
        Object.assign(PUBLIC_SUBJECTS, {
            PROPERTY_SETS: {
              GET_KEYED: (props) => {
                let subject = "PROPERTY_SETS";
                let action = "GET_KEYED";
                const socketResponses = new SocketResponseBuckets();
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
                let subject = "PROPERTY_SETS";
                let action = "GET_ALL_KEYED";
                const socketResponses = new SocketResponseBuckets();
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
            CARDS: {
              GET_KEYED: (props) => {
                let subject = "CARDS";
                let action = "GET_KEYED";
                const socketResponses = new SocketResponseBuckets();
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
                let subject = "CARDS";
                let action = "GET_ALL_KEYED";
                const socketResponses = new SocketResponseBuckets();
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
                    socketResponses.addToBucket(
                      "default",
                      getAllKeyedResponse(PUBLIC_SUBJECTS, myKeyedRequest)
                    );
        
                    // Confirm
                    socketResponses.addToBucket(
                      "default",
                      makeResponse({
                        subject,
                        action,
                        status: "success",
                        payload: null,
                      })
                    );
        
                    return socketResponses;
                  },
                  makeConsumerFallbackResponse({ subject, action, socketResponses })
                );
              },
            },
          });
    }
    return registercardMethods;
}

module.exports = buildRegisterCardMethods;
