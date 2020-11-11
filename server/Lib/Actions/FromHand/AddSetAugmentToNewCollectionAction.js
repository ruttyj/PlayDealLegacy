/**
 * 
 * AddSetAugmentToNewCollectionAction
 * const buildAddSetAugmentToNewCollectionAction = require(`${serverFolder}/Lib/Actions/FromHand/AddSetAugmentToNewCollectionAction`);
 */
function buildAddSetAugmentToNewCollectionAction({
    makeConsumerFallbackResponse,
    PUBLIC_SUBJECTS,
    makeResponse,
    packageCheckpoints,
    isDef,
    AddressedResponse,
    handleMyTurn,
})
{
    function addSetAugmentToNewCollectionAction(props)
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
                        PUBLIC_SUBJECTS["COLLECTIONS"].REMOVE_KEYED({
                          roomCode,
                          personId: thisPersonId,
                          collectionIds: removedCollectionIds,
                        })
                      );
                    }

                    // Notify player hands
                    let peopleIds = attendingPeople.map((person) =>
                      person.getId()
                    );
                    let specificPropsForEveryone = {
                      roomCode,
                      peopleIds: peopleIds,
                      receivingPeopleIds: peopleIds,
                    };
                    addressedResponses.addToBucket(
                      "default",
                      PUBLIC_SUBJECTS["PLAYER_HANDS"].GET_KEYED(
                        specificPropsForEveryone
                      )
                    );

                    // Notify player collections
                    addressedResponses.addToBucket(
                      "everyone",
                      PUBLIC_SUBJECTS["PLAYER_COLLECTIONS"].GET_KEYED({
                        roomCode,
                        personId: thisPersonId,
                      })
                    );

                    // Notift collection contents
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
                PUBLIC_SUBJECTS.GAME.STATUS({ roomCode })
              );
            }

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
    }
    return addSetAugmentToNewCollectionAction;
}

module.exports = buildAddSetAugmentToNewCollectionAction;

