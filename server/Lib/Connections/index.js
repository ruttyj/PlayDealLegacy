/**
 * Build a People Method Provider
 * @SEARCH_REPLACE Connection
 * Provides methods for a socket to be able to listen with
 * const buildRegisterConnectionMethods = require(`${serverFolder}/Lib/Connection/`);
 */
function buildRegisterConnectionMethods({
    SocketResponseBuckets,
    PUBLIC_SUBJECTS,
    PRIVATE_SUBJECTS,
    mStrThisClientId,
    clientManager,
    makeResponse,
})
{
    function registerConnectionMethods(registry)
    {
        Object.assign(PUBLIC_SUBJECTS, {
            CLIENTS: {
              GET_ONLINE_STATS: (props) => {
                const socketResponses = SocketResponseBuckets();
                const subject = "CLIENTS";
                const action = "GET_ONLINE_STATS";
                const status = "success";
                const payload = {
                  peopleOnlineCount: clientManager.count(),
                };

                let { thisClientKey } = props;
        
                socketResponses.addToBucket(
                  "default",
                  makeResponse({ subject, action, status, payload })
                );
        
                const reducedResponses = SocketResponseBuckets();
                reducedResponses.addToBucket(
                  socketResponses.reduce(thisClientKey, [thisClientKey])
                );
                return reducedResponses;
              },
            },
          });
        
          Object.assign(PRIVATE_SUBJECTS, {
            CLIENT: {
              CONNECT:    (props) => {},
              DISCONNECT: (props) => {},
            },
          })
    }
    return registerConnectionMethods;
}

module.exports = buildRegisterConnectionMethods;
