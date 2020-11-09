/**
 * TRANSFER_PROPERTY_TO_NEW_COLLECTION_FROM_COLLECTION
 * TransferPropertyToNewCollectionFromExistingAction
 * const buildTransferPropertyToNewCollectionFromExistingAction = require(`${serverFolder}/Lib/Actions/FromCollection/TransferPropertyToNewCollectionFromExistingAction`);
 */
function buildTransferPropertyToNewCollectionFromExistingAction({
    makeConsumerFallbackResponse,
    PUBLIC_SUBJECTS,
    makeResponse,
    packageCheckpoints,
    isDef,
    SocketResponseBuckets,
    handleMyTurn,
})
{
    function transferPropertyToNewCollectionFromExistingAction(props)
    {

        let subject = "MY_TURN";
        let action = "TRANSFER_PROPERTY_TO_NEW_COLLECTION_FROM_COLLECTION";
        const socketResponses = SocketResponseBuckets();
        let status = "failure";
        return handleMyTurn(
          props,
          (consumerData, checkpoints) => {
            //Defind checkpoints which must be reached
            checkpoints.set("cardExists", false);
            checkpoints.set("isMyCollection", false);
            checkpoints.set("doesCardBelong", false);

            // Unpack consumerData
            const {
              roomCode,
              game,
              thisPersonId,
              fromCollectionId,
              currentTurn,
              cardId,
            } = consumerData;
            const collectionManager = game.getCollectionManager();
            const playerManager = game.getPlayerManager();
            const willCostAction = game.getConfigAlteringSetCostAction();

            const card = game.getCard(cardId);
            if (isDef(card)) {
              checkpoints.set("cardExists", true);

              // Is my collection?
              let beforeAllMyCollectionIds = playerManager.getAllCollectionIdsForPlayer(
                thisPersonId
              );
              if (
                beforeAllMyCollectionIds
                  .map(String)
                  .includes(String(fromCollectionId))
              ) {
                checkpoints.set("isMyCollection", true);

                let fromCollection = collectionManager.getCollection(
                  fromCollectionId
                );

                // FromCollection has more that 1 property?
                // would not make sense to transfer to another set when it only had 1 card to start

                if (card.type === "property") {
                  checkpoints.set("collectionHasMultipleCards", false);
                  if (fromCollection.propertyCount() > 1) {
                    checkpoints.set("collectionHasMultipleCards", true);

                    if (fromCollection.hasCard(cardId)) {
                      checkpoints.set("doesCardBelong", true);

                      let newCollection = playerManager.createNewCollectionForPlayer(
                        thisPersonId
                      );
                      fromCollection.removeCard(card);
                      newCollection.addCard(card);
                      newCollection.setPropertySetKey(card.set);
                      game.cleanUpFromCollection(thisPersonId, fromCollection);

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
    return transferPropertyToNewCollectionFromExistingAction;
}

module.exports = buildTransferPropertyToNewCollectionFromExistingAction;
