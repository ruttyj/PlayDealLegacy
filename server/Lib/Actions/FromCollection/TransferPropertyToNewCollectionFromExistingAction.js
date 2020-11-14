function buildTransferPropertyToNewCollectionFromExistingAction({
    makeProps,
    makeConsumerFallbackResponse,
    registry,
    makeResponse,
    isDef,
    AddressedResponse,
    handleMyTurn,
})
{
    return function (props)
    {

        let subject = "MY_TURN";
        let action = "TRANSFER_PROPERTY_TO_NEW_COLLECTION_FROM_COLLECTION";
        const addressedResponses = new AddressedResponse();
        let status = "failure";
        return handleMyTurn(
          props,
          (consumerData) => {
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
              // Is my collection?
              let beforeAllMyCollectionIds = playerManager.getAllCollectionIdsForPlayer(
                thisPersonId
              );
              if (
                beforeAllMyCollectionIds
                  .map(String)
                  .includes(String(fromCollectionId))
              ) {
                let fromCollection = collectionManager.getCollection(
                  fromCollectionId
                );

                // FromCollection has more that 1 property?
                // would not make sense to transfer to another set when it only had 1 card to start

                if (card.type === "property") {
                  if (fromCollection.propertyCount() > 1) {
                    if (fromCollection.hasCard(cardId)) {
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
            let payload = {
            };
            addressedResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
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
}

module.exports = buildTransferPropertyToNewCollectionFromExistingAction;
