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
    SocketResponseBuckets,
})
{
    function addSetAugmentToExistingCollectionAction(props)
    {
        let subject = "MY_TURN";
        let action = "ADD_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_HAND";
        const socketResponses = SocketResponseBuckets();
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

            // Add checkpoints which must be reached
            checkpoints.set("isActionPhase", false);
            checkpoints.set("collectionExists", false);
            checkpoints.set("isMyCollection", false);
            checkpoints.set("isSetAugmentCard", false);
            checkpoints.set("canApplyAugment", false);

            if (currentTurn.getPhaseKey() === "action") {
              checkpoints.set("isActionPhase", true);

              if (isDef(collectionId)) {
                let collection = game
                  .getCollectionManager()
                  .getCollection(collectionId);
                if (isDef(collection)) {
                  checkpoints.set("collectionExists", true);
                  if (collection.getPlayerKey() === thisPersonId) {
                    checkpoints.set("isMyCollection", true);
                    if (game.isCardSetAugment(card)) {
                      checkpoints.set("isSetAugmentCard", true);
                      if (game.canApplyAugmentToSet(card, collection)) {
                        checkpoints.set("canApplyAugment", true);

                        collection.addCard(hand.giveCard(card));
                        currentTurn.setActionPreformed(
                          "AUGMENT_COLLECTION",
                          card
                        );
                        status = "success";

                        // Emit updated player turn
                        socketResponses.addToBucket(
                          "everyone",
                          PUBLIC_SUBJECTS["PLAYER_TURN"].GET({ roomCode })
                        );

                        //Update collection contents
                        socketResponses.addToBucket(
                          "everyone",
                          PUBLIC_SUBJECTS["COLLECTIONS"].GET_KEYED({
                            roomCode,
                            collectionId: collection.getId(),
                          })
                        );

                        // Update everyone with my new hand
                        let allPlayerIds = game.getAllPlayerKeys();
                        socketResponses.addToBucket(
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

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
    }
    return addSetAugmentToExistingCollectionAction;
}

module.exports = buildAddSetAugmentToExistingCollectionAction;
