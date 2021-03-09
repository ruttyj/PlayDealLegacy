module.exports = function ({
    isDef,
    isArr,
    AddressedResponse,
    makeResponse,
    makePersonSpecificResponses,
    makeConsumerFallbackResponse,
    handleGame,
})
{
    return function (registry)
    {
      registry.public('PLAYERS.GET', (props) => {
        const [subject, action] = ["PLAYERS", "GET"];
        const addressedResponses = new AddressedResponse();
        return handleGame(
          props,
          (consumerData) => {
            let { game } = consumerData;

            let status = "failure";
            let payload = null;
            let playerManager = game.getPlayerManager();
            if (isDef(playerManager)) {
              let allPlayerKeys = playerManager.getAllPlayerKeys();
              if (isArr(allPlayerKeys)) {
                status = "success";
                payload = {
                  order: allPlayerKeys,
                };
              }
            }

            addressedResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      });
      registry.public('PLAYERS.PERSON_DREW_CARDS_KEYED', (props) => {
        let subject = "PLAYERS";
        let action = "PERSON_DREW_CARDS_KEYED";
        const addressedResponses = new AddressedResponse();
        return handleGame(
          props,
          ({ cardIds, game, personId }) => {
            // Takes no action

            // Let people know the cards drawn -------------------------
            let status = "failure";
            let payload = null;
            if (isDef(cardIds) && isArr(cardIds)) {
              status = "success";
              payload = {
                count: cardIds.length,
                peopleIds: [personId],
                items: {},
              };
              payload.items[personId] = {
                count: cardIds.length,
                cardIds: cardIds,
                cards: cardIds.map((id) => game.getCard(id)),
              };
            }
            addressedResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      },);
      registry.public('PLAYER_HANDS.GET_KEYED', (props) => {
        const [subject, action] = ["PLAYER_HANDS", "GET_KEYED"];
        const addressedResponses = new AddressedResponse();
        return handleGame(
          props,
          (props2) => {
            let { game } = props2;
            let getMyData = (ownerPersonId) => {
              let playerHand = game.getPlayerHand(ownerPersonId);
              if (isDef(playerHand)) return playerHand.serialize();
              return null;
            };

            let getOtherData = (ownerPersonId, viewerPersonId = null) => {
              let playerHand = game.getPlayerHand(ownerPersonId);
              let handCount = 0;
              if (isDef(playerHand)) {
                handCount = playerHand.getCount();
              }
              return {
                count: handCount,
              };
            };

            addressedResponses.addToBucket(
              "default",
              makePersonSpecificResponses({
                props: props2,
                getMyData,
                getOtherData,
                subject,
                action,
              })
            );

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      });
      registry.public('PLAYER_HANDS.GET_ALL_KEYED', (props) => {
        let subject = "PLAYER_HANDS";
        let action = "GET_ALL_KEYED";
        const addressedResponses = new AddressedResponse();
        return handleGame(
          props,
          (props2) => {
            let { game } = props2;

            let peopleIds = game.getAllPlayerKeys().map((person) =>
              person.getId()
            );

            
            addressedResponses.addToBucket(
              "default",
              registry.execute(`${subject}.GET_KEYED`, makeProps(props, {
                ...props2,
                peopleIds,
              }))
            );

            // Confirm
            addressedResponses.addToBucket(
              "default",
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
      });
      registry.public('PLAYER_BANKS.GET_KEYED', (props) => {
        let subject = "PLAYER_BANKS";
        let action = "GET_KEYED";
        const addressedResponses = new AddressedResponse();
        return handleGame(
          props,
          (props2) => {
            let { game } = props2;
            let getBankData = (ownerPersonId) => {
              const playerBank = game.getPlayerBank(ownerPersonId);
              if (isDef(playerBank)) {
                return playerBank.serialize();
              }
              return null;
            };

            addressedResponses.addToBucket(
              "default",
              makePersonSpecificResponses({
                props: props2,
                getMyData: getBankData,
                getOtherData: getBankData,
                subject,
                action,
              })
            );

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      });
      registry.public('PLAYER_BANKS.GET_ALL_KEYED', (props) => {
        let subject = "PLAYER_BANKS";
        let action = "GET_ALL_KEYED";
        const addressedResponses = new AddressedResponse();

        console.log('handleGame PLAYER_BANKS  GET_ALL_KEYED')



        return handleGame(
          props,
          (props2) => {
            let { personManager, game } = props2;

            addressedResponses.addToBucket(
              "default",
              makeResponse({
                subject,
                action,
                status: "success",
                payload: null,
              })
            );

            let peopleIds = game.getAllPlayerKeys();
            addressedResponses.addToBucket(
              "default",
              registry.execute(`${subject}.GET_KEYED`, makeProps(props, {
                ...props,
                peopleIds,
              }))
            );

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      });
    }
}