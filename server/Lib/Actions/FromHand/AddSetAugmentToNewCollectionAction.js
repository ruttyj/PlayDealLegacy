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
        const socketResponses = new AddressedResponse();
        let status = "failure";
        return handleMyTurn(
          props,
          (consumerData, checkpoints) => {
            //Defind checkpoints which must be reached
            checkpoints.set("cardExists", false);

            // Unpack consumerData
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
              checkpoints.set("cardExists", true);
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
                    checkpoints.set("isSetAugmentCard", true);

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
                      socketResponses.addToBucket(
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
                    socketResponses.addToBucket(
                      "default",
                      PUBLIC_SUBJECTS["PLAYER_HANDS"].GET_KEYED(
                        specificPropsForEveryone
                      )
                    );

                    // Notify player collections
                    socketResponses.addToBucket(
                      "everyone",
                      PUBLIC_SUBJECTS["PLAYER_COLLECTIONS"].GET_KEYED({
                        roomCode,
                        personId: thisPersonId,
                      })
                    );

                    // Notift collection contents
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
    return addSetAugmentToNewCollectionAction;
}

module.exports = buildAddSetAugmentToNewCollectionAction;

