/**
 * TRANSFER_PROPERTY_TO_EXISTING_COLLECTION_FROM_COLLECTION
 * TransferPropertyToExistingCollectionFromExistingAction
 * const buildTransferPropertyToExistingCollectionFromExistingAction = require(`${serverFolder}/Lib/Actions/FromCollection/TransferPropertyToExistingCollectionFromExistingAction`);
 */
function buildTransferPropertyToExistingCollectionFromExistingAction({
    makeProps,
    makeConsumerFallbackResponse,
    registry,
    makeResponse,
    isDef,
    AddressedResponse,
    handleMyTurn,
})
{
    function transferPropertyToExistingCollectionFromExistingAction(props)
    {

        let subject = "MY_TURN";
        let action = "TRANSFER_PROPERTY_TO_EXISTING_COLLECTION_FROM_COLLECTION";
        const addressedResponses = new AddressedResponse();
        let status = "failure";
        return handleMyTurn(
          props,
          (consumerData) => {
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
                      if (card.type === "property") {
                        if (fromCollection.hasCard(cardId)) {

                          let resultFromCollection = game.canAddCardToCollection(
                            card,
                            toCollection
                          );
                          let decidedPropertySetKey =
                            resultFromCollection.newPropertySetKey;
                          let canBeAdded = resultFromCollection.canBeAdded;

                          if (canBeAdded) {
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
                  addressedResponses.addToBucket(
                    "everyone",
                    registry.execute('COLLECTIONS.REMOVE_KEYED', makeProps(props, {
                      roomCode,
                      personId: thisPersonId,
                      collectionIds: removedCollectionIds,
                    }))
                  );
                }

                addressedResponses.addToBucket(
                  "everyone",
                  registry.execute('PLAYER_COLLECTIONS.GET_KEYED', makeProps(props, {
                    personId: thisPersonId,
                  }))
                );

                addressedResponses.addToBucket(
                  "everyone",
                  registry.execute('COLLECTIONS.GET_KEYED', makeProps(props, {
                    collectionIds: playerManager.getAllCollectionIdsForPlayer(
                      thisPersonId
                    ),
                  }))
                );

                addressedResponses.addToBucket(
                  "everyone",
                  registry.execute('PLAYER_TURN.GET', makeProps(props))
                );
              }
            }

            if (game.checkWinConditionForPlayer(thisPersonId)) {
              addressedResponses.addToBucket(
                "everyone",
                registry.execute('GAME.STATUS', makeProps(props))
              );
            }

            // Confirm this executed
            addressedResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload: null })
            );

            if (game.checkWinConditionForPlayer(thisPersonId)) {
              addressedResponses.addToBucket(
                "everyone",
                registry.execute('GAME.STATUS', makeProps(props))
              );
            }
            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      
    }
    return transferPropertyToExistingCollectionFromExistingAction;
}

module.exports = buildTransferPropertyToExistingCollectionFromExistingAction;


