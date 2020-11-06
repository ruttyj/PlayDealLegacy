function buildCoreFuncs({
    isDef, isArr, isFunc, getArrFromProp,

    Affected, SocketResponseBuckets,

    roomManager, myClientId,

    packageCheckpoints, 
    PUBLIC_SUBJECTS
  }){
  
    function makeProps(props, data = {}) {
      return { roomCode: props.roomCode, ...data };
    }
  
    function makeResponse({ status, subject, action, payload, message }) {
      let result = {
        status: status,
        subject: subject,
        action: action,
        payload: payload,
      };
  
      if (isDef(message)) {
        result.message = message;
      }
  
      return result;
    }
  
    
    function makeConsumerFallbackResponse({ subject, action, socketResponses }) {
      return function (checkpoints) {
          let serializecheckpoints = {
          items: {},
          order: [],
          };
  
          let message = null;
          checkpoints.forEach((val, key) => {
          serializecheckpoints.items[key] = val;
          serializecheckpoints.order.push(key);
          if (!isDef(message) && !val) {
              message = `Query failed because this was not true: ${key}.`;
          }
          });
  
          socketResponses.addToBucket(
          "default",
          makeResponse({
              subject,
              action,
              message,
              status: "failure",
              payload: serializecheckpoints,
          })
          );
          return socketResponses;
      };
    }
  
    
  
  
    function handleRoom(props, fn, fallback = undefined) {
      let { roomCode } = props;
      // define which points were reached before failure
      let checkpoints = new Map();
      checkpoints.set("roomCode", false);
      checkpoints.set("room", false);
      checkpoints.set("personManager", false);
  
      let reducedResponses = SocketResponseBuckets();
      let responses = null;
  
      if (isDef(roomCode)) {
        checkpoints.set("roomCode", true);
        let room = roomManager.getRoomByCode(roomCode);
        if (isDef(room)) {
          checkpoints.set("room", true);
          let personManager = room.getPersonManager();
          if (isDef(personManager)) {
            checkpoints.set("personManager", true);
  
            let person = personManager.getPersonByClientId(myClientId);
            let game = room.getGame();
  
            let newProps = {
              ...props,
              //game,
              //person,
              roomCode,
              thisRoomCode: roomCode,
              room,
              thisRoom: room,
              personManager,
            };
            if (isDef(person)) {
              Object.assign(newProps, {
                person,
                thisPersonId: person.getId(),
                thisPerson: person,
              });
            }
  
            responses = fn(newProps, checkpoints);
  
            if (isDef(responses)) {
              let clientPersonMapping = {};
              personManager.getConnectedPeople().forEach((person) => {
                clientPersonMapping[String(person.getClientId())] = true;
              });
              let clientIds = Object.keys(clientPersonMapping);
  
              reducedResponses.addToBucket(
                responses.reduce(myClientId, clientIds)
              );
            }
            return responses;
          }
        }
      }
      if (!isDef(responses) && isFunc(fallback)) {
        return fallback(checkpoints);
      }
      return fallback;
    }
  
    function handlePerson(props, fn, fallback = undefined) {
      return handleRoom(
        props,
        (props2, checkpoints) => {
          const { room } = props2;
          let personManager = room.getPersonManager();
          if (isDef(personManager)) {
            checkpoints.set("personManager", true);
            // default
            checkpoints.set("person", false);
            let person = personManager.getPersonByClientId(myClientId);
  
            if (isDef(person)) {
              checkpoints.set("person", true);
              return fn(
                {
                  personId: person.getId(),
                  person,
                  thisPersonId: person.getId(),
                  ...props2,
                },
                checkpoints
              );
            }
          }
          if (isFunc(fallback)) return fallback(checkpoints);
          return fallback;
        },
        fallback
      );
    }
  
    function handleGame(props, fn, fallback = undefined) {
      // define which points were reached before failure
      let checkpoints = new Map();
  
      // define which points were reached before failure
      return handlePerson(
        props,
        (props2, checkpoints) => {
          let { room } = props2;
          let game = room.getGame();
          if (isDef(game)) {
            checkpoints.set("game", true);
            return fn(
              {
                ...props2,
                game,
              },
              checkpoints
            );
          } else {
            console.log("game not defined");
          }
          if (isFunc(fallback2)) return fallback2(checkpoints);
          return fallback2;
        },
        fallback
      );
  
      if (isFunc(fallback)) return fallback(checkpoints);
      return fallback;
    }
  
    
    function makeConsumer(
      consumerCheck,
      parentConsumer,
      props,
      fn,
      fallback = undefined
    ) {
      const socketResponses = SocketResponseBuckets();
      return parentConsumer(
        props,
        (consumerData, checkpoints) => {
          let boolFailed = true;
  
          // If the consumer check adds checkpoints but are not met the function is considered a failure
          consumerCheck(
            consumerData,
            checkpoints,
            socketResponses,
            fn,
            (val) => (boolFailed = val)
          );
  
          // If not all checkpoints were met
          checkpoints.forEach((value, key) => {
            if (!value) {
              boolFailed = true;
            }
          });
  
          if (boolFailed) {
            if (isFunc(fallback)) {
              let fallbackResult = fallback(checkpoints);
              socketResponses.addToBucket("default", fallbackResult);
            } else {
              socketResponses.addToBucket("default", fallback);
            }
          }
          return socketResponses;
        },
        fallback
      );
    }
  
  
    
  
    function handCardConsumer(props, fn, fallback = undefined) {
      let consumerCheck = (
        consumerData,
        checkpoints,
        socketResponses,
        fn,
        setFailed
      ) => {
        let boolFailed = true;
        checkpoints.set("the card", false);
        checkpoints.set("isCardInHand", false);
  
        let { hand, game } = consumerData;
  
        let { cardId } = consumerData;
        if (isDef(cardId)) {
          checkpoints.set("the card", true);
          let card = hand.getCard(cardId);
          if (isDef(card)) {
            checkpoints.set("isCardInHand", true);
            boolFailed = false;
  
            socketResponses.addToBucket(
              "default",
              fn(
                {
                  ...consumerData,
                  card,
                  cardId,
                  hand,
                  currentTurn: game.getCurrentTurn(),
                },
                checkpoints
              )
            );
          }
        }
  
        setFailed(boolFailed);
      };
      return makeConsumer(
        consumerCheck,
        myTurnConsumerBase,
        props,
        fn,
        fallback
      );
    }
  
    function myTurnConsumerBase(props, fn, fallback = undefined) {
      return handleGame(
        props,
        (props2, checkpoints) => {
          checkpoints.set("iHaveAHand", false);
          checkpoints.set("isMyTurn", false);
  
          let { game, thisPersonId } = props2;
  
          let hand = game.getPlayerHand(thisPersonId);
          if (isDef(hand)) {
            checkpoints.set("iHaveAHand", true);
  
            if (game.isMyTurn(thisPersonId)) {
              checkpoints.set("isMyTurn", true);
  
              return fn(
                {
                  ...props2,
                  hand,
                  currentTurn: game.getCurrentTurn(),
                },
                checkpoints
              );
            }
          }
          if (isFunc(fallback)) return fallback(checkpoints);
          return fallback;
        },
        fallback
      );
    }
  
  
  
  
    function handleCollectionBasedRequestCreation(
      subject,
      action,
      props,
      doTheThing
    ) {
      const socketResponses = SocketResponseBuckets();
      let status = "failure";
      let payload = null;
      return handCardConsumer(
        props,
        (consumerData, checkpoints) => {
          let { collectionId, cardId, augmentCardsIds } = consumerData;
          let targetPeopleIds = getArrFromProp(consumerData, {
            plural: "targetIds",
            singular: "targetId",
          });
  
          let { game, personManager, thisPersonId } = consumerData;
          let currentTurn = game.getCurrentTurn();
          let actionNum = currentTurn.getActionCount();
          // request manager exists?
          let requestManager = currentTurn.getRequestManager();
          checkpoints.set("requestManagerExists", false);
          if (isDef(requestManager)) {
            checkpoints.set("requestManagerExists", true);
  
            // Is action phase?
            checkpoints.set("action", false);
            if (currentTurn.getPhaseKey() === "action") {
              let collectionManager = game.getCollectionManager();
              checkpoints.set("action", true);
  
              if (isDef(collectionId)) {
                let collection = collectionManager.getCollection(collectionId);
  
                checkpoints.set("collectionExists", false);
                if (isDef(collection)) {
                  checkpoints.set("collectionExists", true);
                  let collectionPropertySetKey = collection.getPropertySetKey();
  
                  checkpoints.set("isMyCollection", false);
                  if (collection.getPlayerKey() === thisPersonId) {
                    checkpoints.set("isMyCollection", true);
  
                    let hand = game.getPlayerHand(thisPersonId);
                    let card = game.getCard(cardId);
                    checkpoints.set("isValidCard", false);
                    if (
                      isDef(card) &&
                      game.isRentCard(card) &&
                      hand.hasCard(card)
                    ) {
                      checkpoints.set("isValidCard", true);
  
                      let rentCardApplicableSets = game.getSetChoicesForCard(
                        card
                      );
                      checkpoints.set("rentCanBeChargedForThisCollection", false);
                      if (
                        rentCardApplicableSets.includes(collectionPropertySetKey)
                      ) {
                        checkpoints.set(
                          "rentCanBeChargedForThisCollection",
                          true
                        );
  
                        let activePile = game.getActivePile();
                        activePile.addCard(hand.giveCard(card));
  
                        // get rent value for collection
                        let rentValue = game.getRentValueOfCollection(
                          thisPersonId,
                          collectionId
                        );
  
                        // If rent augment ment cards exist alter value
                        let chargeValue = rentValue;
                        let validAugmentCardsIds = [];
                        let augments = {};
                        if (isArr(augmentCardsIds)) {
                          let augmentUsesActionCount = game.getConfig(
                            CONFIG.ACTION_AUGMENT_CARDS_COST_ACTION,
                            true
                          );
                          let currentActionCount =
                            currentTurn.getActionCount() + 1; // +1 for the rent card
                          let additionalActionCountFromAugments = 0;
                          augmentCardsIds.forEach((augCardId) => {
                            if (
                              !augmentUsesActionCount ||
                              (augmentUsesActionCount &&
                                currentActionCount < currentTurn.getActionLimit())
                            ) {
                              let canApply = game.canApplyRequestAugment(
                                cardId,
                                augCardId,
                                validAugmentCardsIds,
                                augmentCardsIds
                              );
                              if (canApply) {
                                ++additionalActionCountFromAugments;
                                validAugmentCardsIds.push(augCardId);
                                let card = game.getCard(augCardId);
                                augments[augCardId] = getNestedValue(
                                  card,
                                  ["action", "agument"],
                                  {}
                                );
                              }
                            }
                          });
                          currentActionCount += additionalActionCountFromAugments;
                        }
  
                        let baseValue = chargeValue;
                        chargeValue = game.applyActionValueAugment(
                          validAugmentCardsIds,
                          chargeValue
                        );
  
                        // Determine request cardnality
                        let target = isDef(card.target) ? card.target : "one";
                        if (target === "one") {
                          targetPeopleIds = [targetPeopleIds[0]];
                        } else if (target === "all") {
                          let allPlayerIds = game.getAllPlayerKeys();
                          targetPeopleIds = allPlayerIds.filter(
                            (playerId) =>
                              String(playerId) !== String(thisPersonId)
                          );
                        }
  
                        // targetPeopleIds allPlayerIds augmentCardsIds  validAugmentCardsIds
                        //==========================================================
  
                        let _Affected = new Affected();
                        checkpoints.set("success", false);
  
                        doTheThing({
                          ...consumerData,
                          requestManager,
                          checkpoints,
                          baseValue: baseValue,
                          totalValue: chargeValue,
                          augments: {
                            cardIds: validAugmentCardsIds,
                            items: augments,
                          },
                          actionNum,
                          _Affected,
                          targetPeopleIds,
                          currentTurn,
                          collectionId,
                          thisPersonId,
                          socketResponses,
                          validAugmentCardsIds,
                        }); //actuallly do it
  
                        if (checkpoints.get("success") === true) {
                          status = "success";
                        }
  
                        // Player Hands
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
  
                        // Active Pile
                        if (_Affected.isAffected('ACTIVE_PILE')) {
                          socketResponses.addToBucket(
                            "everyone",
                            PUBLIC_SUBJECTS.ACTIVE_PILE.GET(
                              makeProps(consumerData)
                            )
                          );
                        }
  
                        // Requests
                        if (_Affected.isAffected('REQUEST')) {
                          socketResponses.addToBucket(
                            "everyone",
                            PUBLIC_SUBJECTS.PLAYER_REQUESTS.GET_KEYED(
                              makeProps(consumerData, {
                                peopleIds: targetPeopleIds,
                              })
                            )
                          );
                          socketResponses.addToBucket(
                            "everyone",
                            PUBLIC_SUBJECTS.REQUESTS.GET_KEYED(
                              makeProps(consumerData, {
                                requestIds: _Affected.getIdsAffectedByAction("REQUEST", Affected.ACTION_GROUP.CHANGE),
                              })
                            )
                          );
                        }
  
                        // Player Turn
                        socketResponses.addToBucket(
                          "everyone",
                          PUBLIC_SUBJECTS.PLAYER_TURN.GET(makeProps(consumerData))
                        );
                      }
                    }
                  }
                }
              }
            }
          }
  
          socketResponses.addToBucket(
            "default",
            makeResponse({ subject, action, status, payload })
          );
  
          return socketResponses;
        },
        makeConsumerFallbackResponse({ subject, action, socketResponses })
      );
    }
  
    function handleRequestCreation(
      subject,
      action,
      props,
      doTheThing
    ) {
      const self = this;
      const socketResponses = SocketResponseBuckets();
      let status = "failure";
      let payload = null;
      return handCardConsumer(
        props,
        (consumerData, checkpoints) => {
          let { cardId } = consumerData;
          let targetPeopleIds = getArrFromProp(consumerData, {
            plural: "targetIds",
            singular: "targetId",
          });
  
          let { game, personManager, thisPersonId } = consumerData;
          let currentTurn = game.getCurrentTurn();
          let actionNum = currentTurn.getActionCount();
  
          // request manager exists?
          let requestManager = currentTurn.getRequestManager();
          checkpoints.set("requestManagerExists", false);
          if (isDef(requestManager)) {
            checkpoints.set("requestManagerExists", true);
  
            // Is action phase?
            checkpoints.set("action", false);
            if (currentTurn.getPhaseKey() === "action") {
              checkpoints.set("action", true);
              let hand = game.getPlayerHand(thisPersonId);
              let card = game.getCard(cardId);
              checkpoints.set("isValidCard", false);
              if (isDef(card) && game.isActionCard(card) && hand.hasCard(card)) {
                checkpoints.set("isValidCard", true);
  
                // Determine request cardnality
                let target = isDef(card.target) ? card.target : "one";
                if (target === "one") {
                  targetPeopleIds = [targetPeopleIds[0]];
                } else if (target === "all") {
                  let allPlayerIds = game.getAllPlayerKeys();
                  targetPeopleIds = allPlayerIds.filter(
                    (playerId) => String(playerId) !== String(thisPersonId)
                  );
                }
  
                //==========================================================
                let _Affected = new Affected();
                
                checkpoints.set("success", false);
                doTheThing({
                  ...consumerData,
                  actionNum,
                  requestManager,
                  checkpoints,
                  _Affected,
                  targetPeopleIds,
                  currentTurn,
                  thisPersonId,
                  socketResponses,
                });
  
                if (checkpoints.get("success") === true) {
                  status = "success";
                }
  
                //==========================================================
  
                // Update current turn state
  
                // Update everyone with my new hand
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
                    PUBLIC_SUBJECTS.ACTIVE_PILE.GET(makeProps(consumerData))
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
  
                if (_Affected.isAffected('PLAYER_COLLECTION')) {
                  // Update who has what collection
                  socketResponses.addToBucket(
                    "everyone",
                    PUBLIC_SUBJECTS["PLAYER_COLLECTIONS"].GET_KEYED(
                      makeProps(consumerData, {
                        peopleIds: _Affected.getIdsAffectedByAction("PLAYER_COLLECTION", Affected.ACTION_GROUP.CHANGE),
                      })
                    )
                  );
                }
  
                if (_Affected.isAffected('PLAYER_REQUEST')) {
                  socketResponses.addToBucket(
                    "everyone",
                    PUBLIC_SUBJECTS.PLAYER_REQUESTS.GET_KEYED(
                      makeProps(consumerData, { peopleIds: targetPeopleIds })
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
  
                socketResponses.addToBucket(
                  "everyone",
                  PUBLIC_SUBJECTS.PLAYER_TURN.GET(makeProps(consumerData))
                );
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
          return socketResponses;
        },
        makeConsumerFallbackResponse({ subject, action, socketResponses })
      );
    }
    
  
    return {
      makeProps,
      makeResponse,
      makeConsumerFallbackResponse,
      handleRoom,
      handlePerson,
      handleGame,
      makeConsumer,
      handCardConsumer,
      myTurnConsumerBase,
      handleCollectionBasedRequestCreation,
      handleRequestCreation,
    }
  }

module.exports = buildCoreFuncs;
