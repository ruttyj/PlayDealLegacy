/**
 * Build a People Method Provider
 * @SEARCH_REPLACE Chat
 * Provides methods for a socket to be able to listen with
 * const buildRegisterChatMethods = require(`${serverFolder}/Lib/Chat/`);
 */
function buildRegisterChatMethods({
    isDef,
    AddressedResponse,
    PUBLIC_SUBJECTS,
    registry,
    makeResponse,
    makeConsumerFallbackResponse,
    handlePerson,
})
{
    function registerChatMethods(registry)
    {
        Object.assign(PUBLIC_SUBJECTS, {
            CHAT: {
              SEND_PRIVATE_MESSAGE: (props) => {
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
                        receivingPerson.getClientId(),
                        makeResponse({ subject, action: "RECEIVE_MESSAGE", status, payload })
                      );
                    }
        
                    return addressedResponses;
                  },
                  makeConsumerFallbackResponse({ subject, action, addressedResponses })
                );
              },
              SEND_MESSAGE: (props) => {
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
                      "everyone",
                      makeResponse({ subject, action: "RECEIVE_MESSAGE", status, payload })
                    );
        
                    return addressedResponses;
                  },
                  makeConsumerFallbackResponse({ subject, action, addressedResponses })
                );
              },
              /**
               * @param userIds
               */
              RECEIVE_MESSAGE: () => {
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
                      "everyoneElse",
                      makeResponse({ subject, action, status, payload })
                    );
        
                    return addressedResponses;
                  },
                  makeConsumerFallbackResponse({ subject, action, addressedResponses })
                );
              },
            },
          })
      
    }
    return registerChatMethods;
}

module.exports = buildRegisterChatMethods;
