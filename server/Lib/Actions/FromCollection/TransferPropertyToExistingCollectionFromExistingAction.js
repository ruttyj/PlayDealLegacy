/**
 * TRANSFER_PROPERTY_TO_EXISTING_COLLECTION_FROM_COLLECTION
 * TransferPropertyToExistingCollectionFromExistingAction
 * const buildTransferPropertyToExistingCollectionFromExistingAction = require(`${serverFolder}/Lib/Actions/FromCollection/TransferPropertyToExistingCollectionFromExistingAction`);
 */
function buildTransferPropertyToExistingCollectionFromExistingAction({
    makeConsumerFallbackResponse,
    PUBLIC_SUBJECTS,
    makeResponse,
    isDef,
    SocketResponseBuckets,
    handleMyTurn,
})
{
    function transferPropertyToExistingCollectionFromExistingAction(props)
    {

        let subject = "MY_TURN";
        let action = "TRANSFER_PROPERTY_TO_EXISTING_COLLECTION_FROM_COLLECTION";
        const socketResponses = SocketResponseBuckets();
        let status = "failure";
        return handleMyTurn(
          props,
          (consumerData, checkpoints) => {
            //Defind checkpoints which must be reached
            checkpoints.set("cardExists", false);
            checkpoints.set("isMyFromCollection", false);
            checkpoints.set("isMyToCollection", false);
            checkpoints.set("doesCardBelong", false);
            checkpoints.set("cardIsAcceptable", false);

            // Unpack consumerData
            const {
              roomCode,
              fromCollectionId,
              toCollectionId,
              cardId,
            } = consumerData;
            const { game, thisPersonId, currentTurn } = consumerData;
            const collectionManager = game.getCollectionManager();
            const playerManager = game.getPlayerManager();
            const willCostAction = game.getConfigAlteringSetCostAction();

            const card = game.getCard(cardId);
            if (isDef(card)) {
              checkpoints.set("cardExists", true);

              // Is my collection?
              let beforeAllMyCollectionIds = JSON.parse(
                JSON.stringify(
                  playerManager.getAllCollectionIdsForPlayer(thisPersonId)
                )
              );
              if (
                beforeAllMyCollectionIds
                  .map(String)
                  .includes(String(fromCollectionId))
              ) {
                let fromCollection = collectionManager.getCollection(
                  fromCollectionId
                );
                if (isDef(fromCollection)) {
                  checkpoints.set("isMyFromCollection", true);

                  if (
                    beforeAllMyCollectionIds
                      .map(String)
                      .includes(String(toCollectionId))
                  ) {
                    let toCollection = collectionManager.getCollection(
                      toCollectionId
                    );
                    if (isDef(toCollection)) {
                      checkpoints.set("isMyToCollection", true);

                      if (card.type === "property") {
                        checkpoints.set("cardIsAcceptable", true);
                        checkpoints.set("cardExistsInFromCollection", false);

                        checkpoints.set("cardMatchesPropertySet", false);

                        if (fromCollection.hasCard(cardId)) {
                          checkpoints.set("cardExistsInFromCollection", true);

                          let resultFromCollection = game.canAddCardToCollection(
                            card,
                            toCollection
                          );
                          let decidedPropertySetKey =
                            resultFromCollection.newPropertySetKey;
                          let canBeAdded = resultFromCollection.canBeAdded;

                          if (canBeAdded) {
                            checkpoints.set("cardMatchesPropertySet", true);
                            checkpoints.set("doesCardBelong", true);

                            fromCollection.removeCard(card);
                            toCollection.addCard(card);
                            toCollection.setPropertySetKey(
                              decidedPropertySetKey
                            );
                            game.cleanUpFromCollection(
                              thisPersonId,
                              fromCollection
                            );

                            if (willCostAction) {
                              currentTurn.setActionPreformed(
                                "MODIFY_PROPERTY_COLLECTION",
                                card
                              );
                            }
                            status = "success";
                          }
                        }
                      }
                    }
                  }
                }

                // notify collections removed
                let afterAllMyCollectionIds = playerManager.getAllCollectionIdsForPlayer(
                  thisPersonId
                );
                let removedCollectionIds = beforeAllMyCollectionIds.filter(
                  (i) => !afterAllMyCollectionIds.includes(i)
                );

                if (removedCollectionIds.length > 0) {
                  socketResponses.addToBucket(
                    "everyone",
                    PUBLIC_SUBJECTS["COLLECTIONS"].REMOVE_KEYED({
                      roomCode,
                      personId: thisPersonId,
                      collectionIds: removedCollectionIds,
                    })
                  );
                }

                socketResponses.addToBucket(
                  "everyone",
                  PUBLIC_SUBJECTS["PLAYER_COLLECTIONS"].GET_KEYED({
                    roomCode,
                    personId: thisPersonId,
                  })
                );

                socketResponses.addToBucket(
                  "everyone",
                  PUBLIC_SUBJECTS["COLLECTIONS"].GET_KEYED({
                    roomCode,
                    collectionIds: playerManager.getAllCollectionIdsForPlayer(
                      thisPersonId
                    ),
                  })
                );

                socketResponses.addToBucket(
                  "everyone",
                  PUBLIC_SUBJECTS["PLAYER_TURN"].GET({ roomCode })
                );
              }
            }

            if (game.checkWinConditionForPlayer(thisPersonId)) {
              socketResponses.addToBucket(
                "everyone",
                PUBLIC_SUBJECTS.GAME.STATUS({ roomCode })
              );
            }

            // Confirm this executed
            socketResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload: null })
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
    return transferPropertyToExistingCollectionFromExistingAction;
}

module.exports = buildTransferPropertyToExistingCollectionFromExistingAction;


