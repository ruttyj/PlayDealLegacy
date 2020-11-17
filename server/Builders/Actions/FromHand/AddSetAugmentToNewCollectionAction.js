function buildAddSetAugmentToNewCollectionAction({
    makeProps,
    makeConsumerFallbackResponse,
    registry,
    makeResponse,
    packageCheckpoints,
    isDef,
    AddressedResponse,
    handleMyTurn,
})
{
    return function (props)
    {
        let subject = "MY_TURN";
        let action = "TRANSFER_SET_AUGMENT_TO_NEW_COLLECTION_FROM_HAND";
        const addressedResponses = new AddressedResponse();
        let status = "failure";
        return handleMyTurn(
          props,
          (consumerData, checkpoints) => {
            const { cardId } = consumerData;
            const {
              roomCode,
              game,
              thisPersonId,
              currentTurn,
              personManager,
            } = consumerData;
            const playerManager = game.getPlayerManager();
            const willCostAction = game.getConfigAlteringSetCostAction();

            let attendingPeople = personManager.filterPeople(
              (person) => person.isConnected() && person.getStatus() === "ready"
            );

            const card = game.getCard(cardId);
            if (isDef(card)) {
              let beforeAllMyCollectionIds = JSON.parse(
                JSON.stringify(
                  playerManager.getAllCollectionIdsForPlayer(thisPersonId)
                )
              );

              let toCollection = game.getUselessCollectionForPlayer(
                thisPersonId
              );
              if (isDef(toCollection)) {
                // Player has hand?
                let hand = game.getPlayerHand(thisPersonId);
                if (isDef(hand)) {
                  if (game.isCardSetAugment(card)) {
                    toCollection.addCard(hand.giveCard(card));

                    if (willCostAction) {
                      currentTurn.setActionPreformed(
                        "AUGMENT_COLLECTION",
                        card
                      );
                    }
                    status = "success";
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
                        registry.execute('COLLECTIONS.REMOVE_KEYED', makeProps(props, {
                          personId: thisPersonId,
                          collectionIds: removedCollectionIds,
                        }))
                      );
                    }

                    // Notify player hands
                    let peopleIds = attendingPeople.map((person) =>
                      person.getId()
                    );
                    let specificPropsForEveryone = makeProps(props, {
                      peopleIds: peopleIds,
                      receivingPeopleIds: peopleIds,
                    });
                    addressedResponses.addToBucket(
                      "default",
                      registry.execute('PLAYER_HANDS.GET_KEYED', specificPropsForEveryone)
                    );

                    // Notify player collections
                    addressedResponses.addToBucket(
                      "everyone",
                      registry.execute('PLAYER_COLLECTIONS.GET_KEYED', makeProps(props, {
                        personId: thisPersonId,
                      }))
                    );

                    // Notift collection contents
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
              }
            }
            // Confirm this executed
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
                registry.execute('GAME.STATUS', makeProps(props))
              );
            }

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
    }
}

module.exports = buildAddSetAugmentToNewCollectionAction;
