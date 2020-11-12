/**
 * ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND
 * AddPropertyToExitingCollectionAction
 * const buildAddPropertyToExitingCollectionAction = require(`${serverFolder}/Lib/Actions/FromHand/AddPropertyToExitingCollectionAction`);
 */
function buildAddPropertyToExitingCollectionAction({
    makeProps,
    makeConsumerFallbackResponse,
    PUBLIC_SUBJECTS,
    makeResponse,
    packageCheckpoints,
    isDef,
    handCardConsumer,
    AddressedResponse,
})
{
    function addPropertyToExitingCollectionAction(props)
    {

        let subject = "MY_TURN";
        let action = "ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND";
        const addressedResponses = new AddressedResponse();
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
            if (currentTurn.getPhaseKey() === "action") {

              if (isDef(collectionId)) {
                let collection = game
                  .getCollectionManager()
                  .getCollection(collectionId);
                if (isDef(collection)) {
                  if (collection.getPlayerKey() === thisPersonId) {
                    if (!collection.isFull()) {
                      if (game.isCardProperty(card)) {

                        let resultFromCollection = game.canAddCardToCollection(
                          card,
                          collection
                        );
                        let decidedPropertySetKey =
                          resultFromCollection.newPropertySetKey;
                        let canBeAdded = resultFromCollection.canBeAdded;

                        if (canBeAdded) {

                          if (game.getCurrentTurn().isWithinActionLimit()) {

                            let isWildCard = game.doesCardHaveTag(card, "wild");

                            collection.setPropertySetKey(decidedPropertySetKey);
                            game.playCardToExistingCollection(
                              thisPersonId,
                              cardId,
                              collection
                            );

                            status = "success";

                            if (isWildCard) {
                              addressedResponses.addToBucket(
                                "everyone",
                                PUBLIC_SUBJECTS.CARDS.GET_KEYED(makeProps(props, {
                                  roomCode,
                                  cardId,
                                }))
                              );
                            }

                            // Emit updated player turn
                            addressedResponses.addToBucket(
                              "everyone",
                              PUBLIC_SUBJECTS["PLAYER_TURN"].GET(makeProps(props))
                            );

                            //Update collection contents
                            addressedResponses.addToBucket(
                              "everyone",
                              PUBLIC_SUBJECTS["COLLECTIONS"].GET_KEYED(makeProps(props, {
                                roomCode,
                                collectionId: collection.getId(),
                              }))
                            );

                            // Update everyone with my new hand
                            let allPlayerIds = game.getAllPlayerKeys();
                            addressedResponses.addToBucket(
                              "default",
                              PUBLIC_SUBJECTS["PLAYER_HANDS"].GET_KEYED(makeProps(props, {
                                roomCode,
                                personId: thisPersonId,
                                receivingPeopleIds: allPlayerIds,
                              }))
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
              addressedResponses.addToBucket(
                "everyone",
                PUBLIC_SUBJECTS.GAME.STATUS(makeProps(props))
              );
            }

            // confirm action for async await
            let payload = {
              checkpoints: packageCheckpoints(checkpoints),
            };
            addressedResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );

            if (game.checkWinConditionForPlayer(thisPersonId)) {
              addressedResponses.addToBucket(
                "everyone",
                PUBLIC_SUBJECTS.GAME.STATUS(makeProps(props))
              );
            }
            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      
    }
    return addPropertyToExitingCollectionAction;
}

module.exports = buildAddPropertyToExitingCollectionAction;
