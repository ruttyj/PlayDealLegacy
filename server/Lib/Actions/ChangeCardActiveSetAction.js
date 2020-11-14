function buildChangeCardActiveSetAction({
  makeProps,
  makeConsumerFallbackResponse,
  isDef,
  registry,
  AddressedResponse,
  handleMyTurn,
  makeResponse,
})
{
    return function (props)
    {

        let subject = "MY_TURN";
        let action = "CHANGE_CARD_ACTIVE_SET";
        const addressedResponses = new AddressedResponse();
        let status = "failure";
        let payload = null;
        return handleMyTurn(
          props,
          (consumerData) => {
            let { cardId, chosenSetKey, collectionId } = consumerData;
            const { roomCode, game, thisPersonId } = consumerData;
            let scope = "default";
            let player = game.getPlayer(thisPersonId);
            if (isDef(player)) {
              if (isDef(cardId)) {

                // Set choice is valid
                let choiceList = game.getSetChoicesForCard(cardId);
                if (isDef(chosenSetKey) && choiceList.includes(chosenSetKey)) {
                  // Is in hand?
                  let hand = game.getPlayerHand(thisPersonId);
                  if (hand.hasCard(cardId)) {
                    game.updateCardSet(cardId, chosenSetKey);
                    status = "success";
                    scope = "default";
                  } else {
                    //Is in collection?
                    if (
                      isDef(collectionId) &&
                      player.hasCollectionId(collectionId)
                    ) {
                      let collection = game
                        .getCollectionManager()
                        .getCollection(collectionId);

                      // is only card in set? all good
                      if (collection.propertyCount() === 1) {
                        status = "success";
                        scope = "everyone";
                        game.updateCardSet(cardId, chosenSetKey);
                        collection.setPropertySetKey(chosenSetKey);

                        addressedResponses.addToBucket(
                          "everyone",
                          registry.execute('COLLECTIONS.GET_KEYED', makeProps(props, {
                            roomCode,
                            collectionId: collection.getId(),
                          }))
                        );
                      } else {
                        //things get more complicated
                      }
                    }
                  }
                }
              }
            }

            if (status === "success") {
              addressedResponses.addToBucket(
                scope,
                registry.execute('CARDS.GET_KEYED', makeProps(props, { cardId }))
              );
            }

            if (!isDef(payload)) payload = {};

            addressedResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );

            if (game.checkWinConditionForPlayer(thisPersonId)) {
              addressedResponses.addToBucket(
                "everyone",
                registry.execute('GAME.STATUS', makeProps(props))
              );
            }
            return addressedResponses; // <----- REMEMBER THIS!!!!
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      
    }
}

module.exports = buildChangeCardActiveSetAction;
