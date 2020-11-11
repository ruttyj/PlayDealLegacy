/**
 * CHANGE_CARD_ACTIVE_SET
 * ChangeCardActiveSetAction
 * @SEARCH_REPLACE : ChangeCardActiveSetAction | changeCardActiveSetAction
 * const buildChangeCardActiveSetAction = require(`${serverFolder}/Lib/Actions/ChangeCardActiveSetAction`);
 */
function buildChangeCardActiveSetAction({
    makeConsumerFallbackResponse,
    packageCheckpoints,
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
        const socketResponses = new AddressedResponse();
        let status = "failure";
        let payload = null;
        return handleMyTurn(
          props,
          (consumerData, checkpoints) => {
            let { cardId, chosenSetKey, collectionId } = consumerData;
            const { roomCode, game, thisPersonId } = consumerData;

            let scope = "default";
            checkpoints.set("cardIsDefined", false);
            checkpoints.set("validChosenSetKey", false);
            checkpoints.set("validPlayer", false);
            // Player
            let player = game.getPlayer(thisPersonId);
            if (isDef(player)) {
              checkpoints.set("validPlayer", true);

              // Card
              if (isDef(cardId)) {
                checkpoints.set("cardIsDefined", true);

                // Set choice is valid
                let choiceList = game.getSetChoicesForCard(cardId);
                if (isDef(chosenSetKey) && choiceList.includes(chosenSetKey)) {
                  checkpoints.set("validChosenSetKey", true);

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

                        socketResponses.addToBucket(
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
              socketResponses.addToBucket(
                scope,
                PUBLIC_SUBJECTS.CARDS.GET_KEYED({ roomCode, cardId })
              );
            }

            if (!isDef(payload)) payload = {};
            payload.checkpoints = packageCheckpoints(checkpoints);

            socketResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );

            if (game.checkWinConditionForPlayer(thisPersonId)) {
              socketResponses.addToBucket(
                "everyone",
                PUBLIC_SUBJECTS.GAME.STATUS({ roomCode })
              );
            }
            return socketResponses; // <----- REMEMBER THIS!!!!
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      
    }
    return changeCardActiveSetAction;
}

module.exports = buildChangeCardActiveSetAction;
