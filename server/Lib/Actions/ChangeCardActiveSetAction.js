/**
 * CHANGE_CARD_ACTIVE_SET
 * ChangeCardActiveSetAction
 * @SEARCH_REPLACE : ChangeCardActiveSetAction | changeCardActiveSetAction
 * const buildChangeCardActiveSetAction = require(`${serverFolder}/Lib/Actions/ChangeCardActiveSetAction`);
 */
function buildChangeCardActiveSetAction({
    makeConsumerFallbackResponse,
    isDef,
    PUBLIC_SUBJECTS,
    AddressedResponse,
    handleMyTurn,
    makeResponse,
})
{
    function changeCardActiveSetAction(props)
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
                          PUBLIC_SUBJECTS["COLLECTIONS"].GET_KEYED({
                            roomCode,
                            collectionId: collection.getId(),
                          })
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
                PUBLIC_SUBJECTS.CARDS.GET_KEYED({ roomCode, cardId })
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
                PUBLIC_SUBJECTS.GAME.STATUS({ roomCode })
              );
            }
            return addressedResponses; // <----- REMEMBER THIS!!!!
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      
    }
    return changeCardActiveSetAction;
}

module.exports = buildChangeCardActiveSetAction;
