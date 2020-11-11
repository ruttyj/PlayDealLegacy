/**
 * Build a People Method Provider
 * @SEARCH_REPLACE Cheat
 * Provides methods for a socket to be able to listen with
 * const buildRegisterCheatMethods = require(`${serverFolder}/Lib/Cheat/`);
 */
function buildRegisterCheatMethods({
    SocketResponseBuckets,
    PUBLIC_SUBJECTS,
    makeResponse,
    handleGame,
})
{
    function registerCheatMethods(registry)
    {
     // Cheat & debug
    Object.assign(PUBLIC_SUBJECTS, {
        CHEAT: {
          DUMP_STATE: (props) => {
            const [subject, action] = ["CHEAT", "DUMP_STATE"];
            const socketResponses = new SocketResponseBuckets();
            return handleGame(
              props,
              (consumerData) => {
                let { game } = consumerData;
                if (game.constants.IS_TEST_MODE) {
                  
                  let status = "success";
                  let payload = game.serialize();
  
                  // Might as well display to everyone if we are cheating....
                  socketResponses.addToBucket(
                    "everyone",
                    makeResponse({ subject, action, status, payload })
                  );
                }
    
                return socketResponses;
              }
            );
          },
        },
      })
  
    }
    return registerCheatMethods;
}

module.exports = buildRegisterCheatMethods;
