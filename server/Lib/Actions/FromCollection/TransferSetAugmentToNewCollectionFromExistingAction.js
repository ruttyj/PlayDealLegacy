/**
 * TRANSFER_SET_AUGMENT_TO_NEW_COLLECTION_FROM_COLLECTION
 * TransferSetAugmentToNewCollectionFromExistingAction
 * const buildTransferSetAugmentToNewCollectionFromExistingAction = require(`${serverFolder}/Lib/Actions/FromCollection/TransferSetAugmentToNewCollectionFromExistingAction`);
 */
function buildTransferSetAugmentToNewCollectionFromExistingAction({
    makeConsumerFallbackResponse,
    PUBLIC_SUBJECTS,
    makeResponse,
    packageCheckpoints,
    isDef,
    AddressedResponse,
    handleMyTurn,
})
{
    function transferSetAugmentToNewCollectionFromExistingAction(props)
    {

        let subject = "MY_TURN";
        let action = "TRANSFER_SET_AUGMENT_TO_NEW_COLLECTION_FROM_COLLECTION";
        const socketResponses = new AddressedResponse();
        let status = "failure";
        return handleMyTurn(
          props,
          (consumerData, checkpoints) => {
            //Defind checkpoints which must be reached
            checkpoints.set("cardExists", false);
            checkpoints.set("isMyFromCollection", false);
            checkpoints.set("isMyToCollection", false);

            // Unpack consumerData
            const { fromCollectionId, cardId } = consumerData;
            const { roomCode, game, thisPersonId, currentTurn } = consumerData;
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

                  let toCollection = game.getUselessCollectionForPlayer(
                    thisPersonId
                  );
                  if (isDef(toCollection)) {
                    checkpoints.set("isMyToCollection", true);
                    checkpoints.set("isMyFromCollectionHasCard", false);
                    if (fromCollection.hasCard(card)) {
                      checkpoints.set("isMyFromCollectionHasCard", true);
                      if (game.isCardSetAugment(card)) {
                        checkpoints.set("isSetAugmentCard", true);

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
                }
              }
            }
            // Confirm this executed
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
    return transferSetAugmentToNewCollectionFromExistingAction;
}

module.exports = buildTransferSetAugmentToNewCollectionFromExistingAction;
