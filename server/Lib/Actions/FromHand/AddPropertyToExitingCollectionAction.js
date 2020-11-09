/**
 * ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND
 * AddPropertyToExitingCollectionAction
 * const buildAddPropertyToExitingCollectionAction = require(`${serverFolder}/Lib/Actions/FromHand/AddPropertyToExitingCollectionAction`);
 */
function buildAddPropertyToExitingCollectionAction({
    makeConsumerFallbackResponse,
    PUBLIC_SUBJECTS,
    makeResponse,
    packageCheckpoints,
    isDef,
    handCardConsumer,
    SocketResponseBuckets,
})
{
    function addPropertyToExitingCollectionAction(props)
    {

        let subject = "MY_TURN";
        let action = "ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND";
        const socketResponses = SocketResponseBuckets();
        let status = "failure";
        return handCardConsumer(
          props,
          (props2, checkpoints) => {
            let {
              collectionId,
              cardId,
              card,
              roomCode,
              game,
              personManager,
              currentTurn,
              thisPersonId,
            } = props2;
            checkpoints.set("isActionPhase", false);
            checkpoints.set("collectionExists", false);
            checkpoints.set("isMyCollection", false);
            checkpoints.set("isPropertyCard", false);
            checkpoints.set("hasPropertySet", false);
            checkpoints.set("cardMatchesPropertySet", false);
            checkpoints.set("isWithinActionLimit", false);

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
                    checkpoints.set("doesCollectionHaveRoom", false);
                    if (!collection.isFull()) {
                      checkpoints.set("doesCollectionHaveRoom", true);

                      if (game.isCardProperty(card)) {
                        checkpoints.set("isPropertyCard", true);

                        let resultFromCollection = game.canAddCardToCollection(
                          card,
                          collection
                        );
                        let decidedPropertySetKey =
                          resultFromCollection.newPropertySetKey;
                        let canBeAdded = resultFromCollection.canBeAdded;

                        checkpoints.set("canBeAdded", false);
                        if (canBeAdded) {
                          checkpoints.set("canBeAdded", true);

                          if (game.getCurrentTurn().isWithinActionLimit()) {
                            checkpoints.set("isWithinActionLimit", true);

                            let isWildCard = game.doesCardHaveTag(card, "wild");

                            collection.setPropertySetKey(decidedPropertySetKey);
                            game.playCardToExistingCollection(
                              thisPersonId,
                              cardId,
                              collection
                            );

                            status = "success";

                            if (isWildCard) {
                              socketResponses.addToBucket(
                                "everyone",
                                PUBLIC_SUBJECTS.CARDS.GET_KEYED({
                                  roomCode,
                                  cardId,
                                })
                              );
                            }

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
              }
            }

            // If player wins let people know
            if (game.checkWinConditionForPlayer(thisPersonId)) {
              socketResponses.addToBucket(
                "everyone",
                PUBLIC_SUBJECTS.GAME.STATUS({ roomCode })
              );
            }

            // confirm action for async await
            let payload = {
              checkpoints: packageCheckpoints(checkpoints),
            };
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
    return addPropertyToExitingCollectionAction;
}

module.exports = buildAddPropertyToExitingCollectionAction;
