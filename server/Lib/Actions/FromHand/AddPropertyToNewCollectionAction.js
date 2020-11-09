/**
 * ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND
 * AddPropertyToNewCollectionAction
 * const buildAddPropertyToNewCollectionAction = require(`${serverFolder}/Lib/Actions/FromHand/AddPropertyToNewCollectionAction`);
 */
function buildAddPropertyToNewCollectionAction({
    makeConsumerFallbackResponse,
    PUBLIC_SUBJECTS,
    makeResponse,
    packageCheckpoints,
    isDef,
    handCardConsumer,
    SocketResponseBuckets,
})
{
    function addPropertyToNewCollectionAction(props)
    {

        let subject = "MY_TURN";
        let action = "ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND";
        const socketResponses = SocketResponseBuckets();
        let status = "failure";
        return handCardConsumer(
          props,
          (props2, checkpoints) => {
            let {
              cardId,
              card,
              hand,
              roomCode,
              game,
              personManager,
              thisPerson,
              thisPersonId,
            } = props2;
            checkpoints.set("isPropertyCard", false);
            checkpoints.set("hasPropertySet", false);
            checkpoints.set("collectionCreated", false);

            // CARD IS PROPERTY
            if (game.isCardProperty(card)) {
              checkpoints.set("isPropertyCard", true);
              let isSuperWildCard = game.doesCardHaveTag(card, "superWild");
              let isWildCard = game.doesCardHaveTag(card, "wild");

              let decidedPropertySetKey;
              if (isSuperWildCard) {
                decidedPropertySetKey = game.constants.AMBIGUOUS_SET_KEY;
              } else {
                decidedPropertySetKey = card.set;
              }

              // BELONGS TO A hasPropertySet
              if (isDef(decidedPropertySetKey)) {
                checkpoints.set("hasPropertySet", true);

                let handBefore = hand.serialize();
                //
                let collection = game.playCardFromHandToNewCollection(
                  thisPersonId,
                  cardId
                );
                if (isDef(collection)) {
                  checkpoints.set("collectionCreated", true);
                  collection.setPropertySetKey(decidedPropertySetKey);
                  status = "success";

                  //Update collection contents
                  socketResponses.addToBucket(
                    "everyone",
                    PUBLIC_SUBJECTS["COLLECTIONS"].GET_KEYED({
                      roomCode,
                      collectionId: collection.getId(),
                    })
                  );

                  // Update who has what collection
                  socketResponses.addToBucket(
                    "everyone",
                    PUBLIC_SUBJECTS["PLAYER_COLLECTIONS"].GET_KEYED({
                      roomCode,
                      personId: thisPersonId,
                    })
                  );

                  if (isWildCard) {
                    socketResponses.addToBucket(
                      "everyone",
                      PUBLIC_SUBJECTS.CARDS.GET_KEYED({ roomCode, cardId })
                    );
                  }

                  // Emit updated player turn
                  socketResponses.addToBucket(
                    "everyone",
                    PUBLIC_SUBJECTS["PLAYER_TURN"].GET({ roomCode })
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
    return addPropertyToNewCollectionAction;
}

module.exports = buildAddPropertyToNewCollectionAction;
