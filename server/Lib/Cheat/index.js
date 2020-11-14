function buildRegisterCheatMethods({
    AddressedResponse,
    makeResponse,
    handleGame,
})
{
  return function (registry)
  {
    registry.public(`CHEAT.DUMP_STATE`, (props) => {
      const [subject, action] = ["CHEAT", "DUMP_STATE"];
      const addressedResponses = new AddressedResponse();
      return handleGame(
        props,
        (consumerData) => {
          let { game } = consumerData;
          if (game.constants.IS_TEST_MODE) {
            
            let status = "success";
            let payload = game.serialize();

            // Might as well display to everyone if we are cheating....
            addressedResponses.addToBucket(
              "everyone",
              makeResponse({ subject, action, status, payload })
            );
          }

          return addressedResponses;
        }
      );
    })

  }
}

module.exports = buildRegisterCheatMethods;
