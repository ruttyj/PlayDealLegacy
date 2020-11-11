function buildRespondToCollectValueAction({
    isDef,
    makeConsumerFallbackResponse,
    AddressedResponse,
    packageCheckpoints,
    makeResponse,
    Affected,
    handleGame,
    makeProps,
    PUBLIC_SUBJECTS,
})
{
    function respondToCollectValueAction(props)
    {
        const [subject, action] = ["RESPONSES", "RESPOND_TO_COLLECT_VALUE"];
        const socketResponses = new AddressedResponse();

        const doTheThing = (consumerData, checkpoints) => {
          let {
            cardId,
            requestId,
            responseKey,
            payWithProperty,
            payWithBank,
          } = consumerData;
          let { game, personManager, thisPersonId } = consumerData;

          let status = "failure";
          let payload = null;

          let currentTurn = game.getCurrentTurn();
          let phaseKey = currentTurn.getPhaseKey();
          let requestManager = currentTurn.getRequestManager();

          let validResponseKeys = ["accept", "decline", "counter"];

          // Request manager exists
          checkpoints.set("requestManagerExists", false);
          if (isDef(currentTurn) && isDef(requestManager)) {
            checkpoints.set("requestManagerExists", true);

            // Is request phase
            checkpoints.set("isRequestPhase", false);
            if (phaseKey === "request") {
              checkpoints.set("isRequestPhase", true);

              // Request exists
              if (isDef(requestId) && requestManager.hasRequest(requestId)) {
                let request = requestManager.getRequest(requestId);
                let targetKey = request.getTargetKey();

                // Is request targeting me?
                checkpoints.set("isTargetingMe", true);
                if (String(targetKey) === String(thisPersonId)) {
                  checkpoints.set("isTargetingMe", false);

                  // Is request still open
                  checkpoints.set("isRequestOpen", false);
                  if (!request.isClosed()) {
                    checkpoints.set("isRequestOpen", true);

                    // valid response key
                    checkpoints.set("isValidResponseKey", false);
                    if (
                      isDef(responseKey) &&
                      validResponseKeys.includes(responseKey)
                    ) {
                      checkpoints.set("isValidResponseKey", true);

                      let player = game.getPlayer(thisPersonId);
                      let _Affected = new Affected();

                      if (responseKey === "accept") {

                        status = game.acceptCollectValueRequest({
                          player,
                          request,
                          _Affected,
                          payWithBank,
                          payWithProperty,
                          thisPersonId,
                        });

                        // If bank was affected emit updates
                        if (_Affected.isAffected('BANK')) {
                          let attendingPeople = personManager.filterPeople(
                            (person) =>
                              person.isConnected() &&
                              person.getStatus() === "ready"
                          );
                          let peopleIds = attendingPeople.map((person) =>
                            person.getId()
                          );
                          socketResponses.addToBucket(
                            "default",
                            PUBLIC_SUBJECTS["PLAYER_BANKS"].GET_KEYED(
                              makeProps(consumerData, {
                                peopleIds: thisPersonId,
                                receivingPeopleIds: peopleIds,
                              })
                            )
                          );
                        }

                        if (_Affected.isAffected('COLLECTION')) {
                          let collectionChanges = {
                            updated: _Affected.getIdsAffectedByAction("COLLECTION", Affected.ACTION_GROUP.CHANGE),
                            removed: _Affected.getIdsAffectedByAction("COLLECTION", Affected.ACTION_GROUP.REMOVE),
                          };

                          // Add updated collections to be GET
                          if (collectionChanges.updated.length > 0) {
                            socketResponses.addToBucket(
                              "everyone",
                              PUBLIC_SUBJECTS["COLLECTIONS"].GET_KEYED(
                                makeProps(consumerData, {
                                  personId: thisPersonId,
                                  collectionIds: collectionChanges.updated,
                                })
                              )
                            );
                          }

                          // Add removed collections to REMOVE
                          if (collectionChanges.removed.length > 0) {
                            socketResponses.addToBucket(
                              "everyone",
                              PUBLIC_SUBJECTS["COLLECTIONS"].REMOVE_KEYED(
                                makeProps(consumerData, {
                                  personId: thisPersonId,
                                  collectionIds: collectionChanges.removed,
                                })
                              )
                            );
                          }
                        }


                        socketResponses.addToBucket(
                          "everyone",
                          PUBLIC_SUBJECTS.PLAYER_REQUESTS.GET_KEYED(
                            makeProps(consumerData, {
                              personId: thisPersonId,
                            })
                          )
                        );
                        socketResponses.addToBucket(
                          "everyone",
                          PUBLIC_SUBJECTS.REQUESTS.GET_KEYED(
                            makeProps(consumerData, {
                              requestId: request.getId(),
                            })
                          )
                        );
                        socketResponses.addToBucket(
                          "everyone",
                          PUBLIC_SUBJECTS.PLAYER_TURN.GET(
                            makeProps(consumerData)
                          )
                        );
                      } // end accept
                      else if (responseKey === "decline") {
                        game.declineCollectValueRequest({
                            request,
                            checkpoints,
                            game,
                            thisPersonId,
                            cardId,
                            _Affected,
                        });


                        let allPlayerIds = game.getAllPlayerKeys();
                        socketResponses.addToBucket(
                            "default",
                            PUBLIC_SUBJECTS["PLAYER_HANDS"].GET_KEYED(
                                makeProps(consumerData, {
                                    personId: thisPersonId,
                                    receivingPeopleIds: allPlayerIds,
                                })
                            )
                        );


                        
                        if (_Affected.isAffected('ACTIVE_PILE')) {
                            socketResponses.addToBucket(
                                "everyone",
                                PUBLIC_SUBJECTS.ACTIVE_PILE.GET(
                                makeProps(consumerData)
                                )
                            );
                        }

                        if (_Affected.isAffected('HAND')) {
                            let allPlayerIds = game.getAllPlayerKeys();
                            socketResponses.addToBucket(
                                "default",
                                PUBLIC_SUBJECTS["PLAYER_HANDS"].GET_KEYED(
                                    makeProps(consumerData, {
                                        personId: thisPersonId,
                                        receivingPeopleIds: allPlayerIds,
                                    })
                                )
                            );
                        }
                        if (_Affected.isAffected('COLLECTION')) {
                            socketResponses.addToBucket(
                                "everyone",
                                PUBLIC_SUBJECTS["COLLECTIONS"].GET_KEYED(
                                    makeProps(consumerData, {
                                        collectionIds: _Affected.getIdsAffectedByAction("COLLECTION", Affected.ACTION_GROUP.CHANGE),
                                    })
                                )
                            );
                        }


                        if (_Affected.isAffected('REQUEST')) {
                          
                            socketResponses.addToBucket(
                                "everyone",
                                PUBLIC_SUBJECTS.REQUESTS.GET_KEYED(
                                    makeProps(consumerData, {
                                        requestIds: _Affected.getIdsAffectedByAction("REQUEST", Affected.ACTION_GROUP.CHANGE),
                                    })
                                )
                            );
                        }


                        if (_Affected.isAffected('PLAYER_REQUEST')) {
                            socketResponses.addToBucket(
                                "everyone",
                                PUBLIC_SUBJECTS.PLAYER_REQUESTS.GET_KEYED(
                                    makeProps(consumerData, {
                                    peopleIds: _Affected.getIdsAffectedByAction("REQUEST", Affected.PLAYER_REQUEST.CHANGE),
                                    })
                                )
                            );
                        }


                        socketResponses.addToBucket(
                            "everyone",
                            PUBLIC_SUBJECTS.PLAYER_TURN.GET(
                                makeProps(consumerData)
                            )
                        );
                      } // end decline
                    }
                  }
                }
              }
            }
          }

          payload = {
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
        }

        return handleGame(
          props,
          doTheThing,
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      
    }
    return respondToCollectValueAction;
}

module.exports = buildRespondToCollectValueAction;
