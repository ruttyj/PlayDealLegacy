/**
 * ADD_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_HAND
 * AddSetAugmentToExistingCollectionAction
 * const buildAddSetAugmentToExistingCollectionAction = require(`${serverFolder}/Lib/Actions/FromHand/AddSetAugmentToExistingCollectionAction`);
 */
function buildAddSetAugmentToExistingCollectionAction({
    makeConsumerFallbackResponse,
    PUBLIC_SUBJECTS,
    makeResponse,
    packageCheckpoints,
    isDef,
    handCardConsumer,
    AddressedResponse,
})
{
    function addSetAugmentToExistingCollectionAction(props)
    {
        let subject = "MY_TURN";
        let action = "ADD_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_HAND";
        const addressedResponses = new AddressedResponse();
        let status = "failure";
        return handCardConsumer(
          props,
          (props2, checkpoints) => {
            let {
              collectionId,
              card,
              hand,
              roomCode,
              game,
              currentTurn,
              thisPersonId,
            } = props2;

            if (currentTurn.getPhaseKey() === "action") {

              if (isDef(collectionId)) {
                let collection = game
                  .getCollectionManager()
                  .getCollection(collectionId);
                if (isDef(collection)) {
                  if (collection.getPlayerKey() === thisPersonId) {
                    if (game.isCardSetAugment(card)) {
                      if (game.canApplyAugmentToSet(card, collection)) {
                        collection.addCard(hand.giveCard(card));
                        currentTurn.setActionPreformed(
                          "AUGMENT_COLLECTION",
                          card
                        );
                        status = "success";

                        // Emit updated player turn
                        addressedResponses.addToBucket(
                          "everyone",
                          PUBLIC_SUBJECTS["PLAYER_TURN"].GET({ roomCode })
                        );

                        //Update collection contents
                        addressedResponses.addToBucket(
                          "everyone",
                          PUBLIC_SUBJECTS["COLLECTIONS"].GET_KEYED({
                            roomCode,
                            collectionId: collection.getId(),
                          })
                        );

                        // Update everyone with my new hand
                        let allPlayerIds = game.getAllPlayerKeys();
                        addressedResponses.addToBucket(
                          "default",
                          PUBLIC_SUBJECTS["PLAYER_HANDS"].GET_KEYED({
                            roomCode,
                            personId: thisPersonId,
                            receivingPeopleIds: allPlayerIds,
                          })
                        );
                      }
                    }
                  }
                }
              }
            }
            let payload = {
              checkpoints: packageCheckpoints(checkpoints),
            };
            // confirm action for async await
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

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
    }
    return addSetAugmentToExistingCollectionAction;
}

module.exports = buildAddSetAugmentToExistingCollectionAction;
