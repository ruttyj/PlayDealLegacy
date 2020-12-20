function buildRespondToCollectValueAction({
    isDef,
    makeConsumerFallbackResponse,
    AddressedResponse,
    makeResponse,
    Affected,
    handleGame,
    makeProps,
    registry,
})
{
    return function (props)
    {
        const [subject, action] = ["RESPONSES", "RESPOND_TO_COLLECT_VALUE"];
        const addressedResponses = new AddressedResponse();

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
          if (isDef(currentTurn) && isDef(requestManager)) {
            // Is request phase
            if (phaseKey === "request") {
              // Request exists
              if (isDef(requestId) && requestManager.hasRequest(requestId)) {
                let request = requestManager.getRequest(requestId);
                let targetKey = request.getTargetKey();

                // Is request targeting me?
                if (String(targetKey) === String(thisPersonId)) {
                  // Is request still open
                  if (!request.isClosed()) {
                    // valid response key
                    if (
                      isDef(responseKey) &&
                      validResponseKeys.includes(responseKey)
                    ) {
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

                          addressedResponses.addToBucket(
                            AddressedResponse.DEFAULT_BUCKET,
                            registry.execute('PLAYER_BANKS.GET_KEYED', 
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
                            addressedResponses.addToBucket(
                              AddressedResponse.EVERYONE_BUCKET,
                              registry.execute('COLLECTIONS.GET_KEYED', 
                                makeProps(consumerData, {
                                  personId: thisPersonId,
                                  collectionIds: collectionChanges.updated,
                                })
                              )
                            );
                          }

                          // Add removed collections to REMOVE
                          if (collectionChanges.removed.length > 0) {
                            addressedResponses.addToBucket(
                              AddressedResponse.EVERYONE_BUCKET,
                              registry.execute('COLLECTIONS.REMOVE_KEYED', 
                                makeProps(consumerData, {
                                  personId: thisPersonId,
                                  collectionIds: collectionChanges.removed,
                                })
                              )
                            );
                          }
                        }


                        addressedResponses.addToBucket(
                          AddressedResponse.EVERYONE_BUCKET,
                          registry.execute('PLAYER_REQUESTS.GET_KEYED', 
                            makeProps(consumerData, {
                              personId: thisPersonId,
                            })
                          )
                        );
                        addressedResponses.addToBucket(
                          AddressedResponse.EVERYONE_BUCKET,
                          registry.execute('REQUESTS.GET_KEYED', 
                            makeProps(consumerData, {
                              requestId: request.getId(),
                            })
                          )
                        );
                        addressedResponses.addToBucket(
                          AddressedResponse.EVERYONE_BUCKET,
                          registry.execute('PLAYER_TURN.GET', 
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
                        addressedResponses.addToBucket(
                          AddressedResponse.DEFAULT_BUCKET,
                            registry.execute('PLAYER_HANDS.GET_KEYED', 
                                makeProps(consumerData, {
                                  personId: thisPersonId,
                                  receivingPeopleIds: allPlayerIds,
                                })
                            )
                        );


                        
                        if (_Affected.isAffected('ACTIVE_PILE')) {
                            addressedResponses.addToBucket(
                                AddressedResponse.EVERYONE_BUCKET,
                                registry.execute('ACTIVE_PILE.GET', makeProps(consumerData))
                            );
                        }

                        if (_Affected.isAffected('HAND')) {
                            let allPlayerIds = game.getAllPlayerKeys();
                            addressedResponses.addToBucket(
                              AddressedResponse.DEFAULT_BUCKET,
                                registry.execute('PLAYER_HANDS.GET_KEYED', 
                                    makeProps(consumerData, {
                                        personId: thisPersonId,
                                        receivingPeopleIds: allPlayerIds,
                                    })
                                )
                            );
                        }
                        if (_Affected.isAffected('COLLECTION')) {
                            addressedResponses.addToBucket(
                                AddressedResponse.EVERYONE_BUCKET,
                                registry.execute('COLLECTIONS.GET_KEYED', 
                                    makeProps(consumerData, {
                                        collectionIds: _Affected.getIdsAffectedByAction("COLLECTION", Affected.ACTION_GROUP.CHANGE),
                                    })
                                )
                            );
                        }


                        if (_Affected.isAffected('REQUEST')) {
                          
                            addressedResponses.addToBucket(
                                AddressedResponse.EVERYONE_BUCKET,
                                registry.execute('REQUESTS.GET_KEYED', 
                                    makeProps(consumerData, {
                                        requestIds: _Affected.getIdsAffectedByAction("REQUEST", Affected.ACTION_GROUP.CHANGE),
                                    })
                                )
                            );
                        }


                        if (_Affected.isAffected('PLAYER_REQUEST')) {
                            addressedResponses.addToBucket(
                                AddressedResponse.EVERYONE_BUCKET,
                                registry.execute('PLAYER_REQUESTS.GET_KEYED', 
                                    makeProps(consumerData, {
                                      peopleIds: _Affected.getIdsAffectedByAction("REQUEST", Affected.ACTION_GROUP.CHANGE),
                                    })
                                )
                            );
                        }


                        addressedResponses.addToBucket(
                            AddressedResponse.EVERYONE_BUCKET,
                            registry.execute('PLAYER_TURN.GET', makeProps(consumerData))
                        );
                      } // end decline
                    }
                  }
                }
              }
            }
          }

          payload = {};
          addressedResponses.addToBucket(
            AddressedResponse.DEFAULT_BUCKET,
            makeResponse({ subject, action, status, payload })
          );

          if (game.checkWinConditionForPlayer(thisPersonId)) {
            addressedResponses.addToBucket(
              AddressedResponse.EVERYONE_BUCKET,
              registry.execute('GAME.STATUS', makeProps(props))
            );
          }

          return addressedResponses;
        }

        return handleGame(
          props,
          doTheThing,
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      
    }
}

module.exports = buildRespondToCollectValueAction;
