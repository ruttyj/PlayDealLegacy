/**
 * TRANSFER_SET_AUGMENT_TO_NEW_COLLECTION_FROM_COLLECTION
 * TransferSetAugmentToNewCollectionFromExistingAction
 * const buildTransferSetAugmentToNewCollectionFromExistingAction = require(`${serverFolder}/Lib/Actions/FromCollection/TransferSetAugmentToNewCollectionFromExistingAction`);
 */
function buildTransferSetAugmentToNewCollectionFromExistingAction({
    makeConsumerFallbackResponse,
    PUBLIC_SUBJECTS,
    makeResponse,
    isDef,
    AddressedResponse,
    handleMyTurn,
})
{
    function transferSetAugmentToNewCollectionFromExistingAction(props)
    {

        let subject = "MY_TURN";
        let action = "TRANSFER_SET_AUGMENT_TO_NEW_COLLECTION_FROM_COLLECTION";
        const addressedResponses = new AddressedResponse();
        let status = "failure";
        return handleMyTurn(
          props,
          (consumerData) => {
            const { fromCollectionId, cardId } = consumerData;
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
                  let toCollection = game.getUselessCollectionForPlayer(
                    thisPersonId
                  );
                  if (isDef(toCollection)) {
                    if (fromCollection.hasCard(card)) {
                      if (game.isCardSetAugment(card)) {
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
    return transferSetAugmentToNewCollectionFromExistingAction;
}

module.exports = buildTransferSetAugmentToNewCollectionFromExistingAction;
