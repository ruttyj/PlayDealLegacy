/**
 * TRANSFER_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_COLLECTION
 * TransferSetAugmentToExistingCollectionFromExistingAction
 * const buildTransferSetAugmentToExistingCollectionFromExistingAction = require(`${serverFolder}/Lib/Actions/FromCollection/TransferSetAugmentToExistingCollectionFromExistingAction`);
 */
function buildTransferSetAugmentToExistingCollectionFromExistingAction({
    makeConsumerFallbackResponse,
    PUBLIC_SUBJECTS,
    makeResponse,
    isDef,
    AddressedResponse,
    handleMyTurn,
})
{
    function transferSetAugmentToExistingCollectionFromExistingAction(props)
    {

        let subject = "MY_TURN";
        let action =
          "TRANSFER_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_COLLECTION";
        const addressedResponses = new AddressedResponse();
        let status = "failure";
        return handleMyTurn(
          props,
          (consumerData) => {
            const { fromCollectionId, toCollectionId, cardId } = consumerData;
            const { roomCode, game, thisPersonId, currentTurn } = consumerData;
            const collectionManager = game.getCollectionManager();
            const playerManager = game.getPlayerManager();
            const willCostAction = game.getConfigAlteringSetCostAction();

            const card = game.getCard(cardId);
            if (isDef(card)) {
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
                  if (
                    beforeAllMyCollectionIds
                      .map(String)
                      .includes(String(toCollectionId))
                  ) {
                    let toCollection = collectionManager.getCollection(
                      toCollectionId
                    );
                    if (isDef(toCollection)) {
                      if (fromCollection.hasCard(card)) {
                        if (game.isCardSetAugment(card)) {
                          if (game.canApplyAugmentToSet(card, toCollection)) {
                            fromCollection.removeCard(card);
                            toCollection.addCard(card);
                            game.cleanUpFromCollection(
                              thisPersonId,
                              fromCollection
                            );
                            if (willCostAction) {
                              currentTurn.setActionPreformed(
                                "AUGMENT_COLLECTION",
                                card
                              );
                            }
                            status = "success";
                          }
                        }
                      }

                      if (status === "success") {
                        // notify collections removed
                        let afterAllMyCollectionIds = playerManager.getAllCollectionIdsForPlayer(
                          thisPersonId
                        );
                        let removedCollectionIds = beforeAllMyCollectionIds.filter(
                          (i) => !afterAllMyCollectionIds.includes(i)
                        );

                        if (removedCollectionIds.length > 0) {
                          addressedResponses.addToBucket(
                            "everyone",
                            PUBLIC_SUBJECTS["COLLECTIONS"].REMOVE_KEYED({
                              roomCode,
                              personId: thisPersonId,
                              collectionIds: removedCollectionIds,
                            })
                          );
                        }

                        addressedResponses.addToBucket(
                          "everyone",
                          PUBLIC_SUBJECTS["PLAYER_COLLECTIONS"].GET_KEYED({
                            roomCode,
                            personId: thisPersonId,
                          })
                        );

                        addressedResponses.addToBucket(
                          "everyone",
                          PUBLIC_SUBJECTS["COLLECTIONS"].GET_KEYED({
                            roomCode,
                            collectionIds: playerManager.getAllCollectionIdsForPlayer(
                              thisPersonId
                            ),
                          })
                        );

                        addressedResponses.addToBucket(
                          "everyone",
                          PUBLIC_SUBJECTS["PLAYER_TURN"].GET({ roomCode })
                        );
                      }
                    }
                  }
                }
              }
            }
            // Confirm this executed
            let payload = {
            };
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
    return transferSetAugmentToExistingCollectionFromExistingAction;
}

module.exports = buildTransferSetAugmentToExistingCollectionFromExistingAction;
