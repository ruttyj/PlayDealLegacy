const rootFolder = `../..`;
const serverFolder = `${rootFolder}/server`;
const serverSocketFolder = `${serverFolder}/sockets`;
const gameFolder = `${serverFolder}/PlayDealGame`;

const {
  els,
  isDef,
  isDefNested,
  isTrue,
  isFunc,
  isStr,
  isArr,
  setImmutableValue,
  setNestedValue,
  getNestedValue,
  makeVar,
  log,
  logBlock,
  jsonLog,
  jsonEncode,
  getKeyFromProp,
  getArrFromProp,
} = require("./utils.js");
const ClientManager = require(`${serverSocketFolder}/client/clientManager.js`);
const RoomManager = require(`${serverSocketFolder}/room/roomManager.js`);
const SocketResponseBuckets = require(`${serverSocketFolder}/socketResponseBuckets.js`);
const KeyedRequest = require(`${serverSocketFolder}/container/keyedRequest.js`);

const gameConstants = require(`${gameFolder}/config/constants.js`);
const { SHOULD, TESTING_MODE } = require(`${gameFolder}/config/constants.js`);
const PlayDealGame = require(`${gameFolder}/`);
const Transaction = require(`${gameFolder}/player/request/transfer/Transaction.js`);

let clientManager = ClientManager();
let roomManager = RoomManager();
roomManager.setClientManager(clientManager);

//function addToArray(ref, path, value) {
//  let _path = isArr(path) ? path : [path];
//  let previousValue = getNestedValue(ref, _path, []);
//  previousValue.push(value);
//  setNestedValue(path, previousValue);
//}

function attachSocketHandlers(thisClient) {
  const thisClientId = thisClient.id;
  const strThisClientId = String(thisClientId);

  //==================================================

  //              MAIN LOGIC

  //==================================================
  const SUBJECTS = {
    ROOM: {
      CREATE: (props) => {
        let [subject, action] = ["ROOM", "CREATE"];
        let socketResponses = SocketResponseBuckets();
        let { roomCode } = props;
        let room = createRoom(roomCode);
        if (isDef(room)) {
          let status = "success";
          let payload = {};
          let roomCode = room.getCode();
          payload.roomCode = roomCode;

          // Create Game
          createGameInstance(room);

          socketResponses.addToBucket(
            "default",
            makeResponse({ subject, action, status, payload })
          );
        }
        return socketResponses;
      },
      EXISTS: (props) => {
        let socketResponses = SocketResponseBuckets();
        let [subject, action] = ["ROOM", "EXISTS"];
        let roomCodes = getArrFromProp(props, {
          plural: "roomCodes",
          singular: "roomCode",
        });
        let status = "failure";
        let payload = {
          exists: {},
        };

        roomCodes.forEach((code) => {
          status = "success";
          let room = roomManager.getRoomByCode(code);
          payload.exists[code] = isDef(room);
        });
        socketResponses.addToBucket(
          "default",
          makeResponse({ subject, action, status, payload })
        );

        return socketResponses;
      },
      GET_CURRENT: (props) => {
        let [subject, action] = ["ROOM", "GET_CURRENT"];
        let socketResponses = SocketResponseBuckets();
        let payload = null;

        let { roomCode } = props;

        if (isDef(roomCode)) {
          let room = roomManager.getRoomByCode(roomCode);
          if (isDef(room)) {
            payload = room.serialize();
          }
        }

        socketResponses.addToBucket(
          "default",
          makeResponse({
            status: isDef(payload) ? "success" : "failure",
            subject,
            action,
            payload,
          })
        );

        return socketResponses;
      },

      GET_KEYED: (props) => {
        let [subject, action] = ["ROOM", "GET_KEYED"];
        let socketResponses = SocketResponseBuckets();
        let payload = {
          items: {},
          order: [],
        };

        let roomCodes = getArrFromProp(props, {
          plural: "roomCodes",
          singular: "roomCode",
        });

        let successCount = 0;
        roomCodes.forEach((roomCode) => {
          let room = roomManager.getRoomByCode(roomCode);
          if (isDef(room)) {
            ++successCount;
            let roomCode = room.getCode();
            payload.order.push(roomCode);
            payload.items[roomCode] = room.serialize();
          } // end isDef room
        });

        socketResponses.addToBucket(
          "default",
          makeResponse({
            status: successCount > 0 ? "success" : "failure",
            subject,
            action,
            payload,
          })
        );

        return socketResponses;
      },

      GET_All_KEYED: (props) => {
        let subject = "ROOM";
        let action = "GET_ALL_KEYED";
        let status = "success";

        let socketResponses = SocketResponseBuckets();
        let roomCodes = roomManager.listAllRoomCodes();
        socketResponses.addToBucket(
          "default",
          SUBJECTS.ROOM.GET_KEYED({
            roomCodes: roomCodes,
          })
        );
        let payload = {
          roomCodes,
        };
        socketResponses.addToBucket(
          "default",
          makeResponse({ subject, action, status, payload })
        );

        return socketResponses;
      },
      // roomCode, username
      JOIN: (props) => {
        let [subject, action] = ["ROOM", "JOIN"];
        let socketResponses = SocketResponseBuckets();

        let { roomCode, username } = props;
        username = els(username, "Player");
        return roomConsumer(
          props,
          ({ room, personManager }) => {
            let person = personManager.createPerson(thisClient, username);
            let status = "";
            let payload = null;

            if (isDef(person)) {
              let personId = person.getId();

              // send room data
              socketResponses.addToBucket(
                "default",
                SUBJECTS.ROOM.GET_CURRENT({ roomCode })
              );

              // Get the full player list for myself
              socketResponses.addToBucket(
                "default",
                SUBJECTS.PEOPLE.GET_ALL_KEYED({
                  roomCode,
                })
              );

              // Let everyone else know the new users has joined
              socketResponses.addToBucket(
                "everyoneElse",
                SUBJECTS.PEOPLE.GET_KEYED({
                  personId,
                  roomCode,
                })
              );

              if (personManager.getConnectedPeopleCount() === 1) {
                socketResponses.addToBucket(
                  "default",
                  SUBJECTS.PEOPLE.SET_HOST({
                    roomCode,
                    personId,
                  })
                );
              }

              socketResponses.addToBucket(
                "default",
                SUBJECTS.PEOPLE.GET_HOST({
                  roomCode,
                })
              );

              socketResponses.addToBucket(
                "default",
                SUBJECTS.PEOPLE.ME({
                  roomCode,
                })
              );

              let payload = {
                personId,
              };
              // Confirm action
              status = "success";
              socketResponses.addToBucket(
                "everyone",
                makeResponse({
                  subject,
                  action,
                  status,
                  payload,
                })
              );
            }
            return socketResponses;
          },
          socketResponses
        );
      },
      UPDATE: (props) => {},
      LEAVE: (props) => {
        let [subject, action] = ["ROOM", "LEAVE"];
        let socketResponses = SocketResponseBuckets();

        let status = "failure";
        return roomConsumer(
          props,
          ({ roomCode, room, personManager, thisPerson }) => {
            if (isDef(thisPerson)) {
              status = "success";
              let payload = {
                personId: thisPerson.getId(),
              };
              socketResponses.addToBucket(
                "everyone",
                makeResponse({
                  subject,
                  action,
                  status,
                  payload,
                })
              );

              if (thisPerson.hasTag("host")) {
                let otherPeople = personManager.getOtherConnectedPeople(
                  thisPerson
                );
                if (isDef(otherPeople[0])) {
                  socketResponses.addToBucket(
                    "everyone",
                    SUBJECTS.PEOPLE.SET_HOST({
                      roomCode,
                      personId: otherPeople[0].getId(),
                    })
                  );
                } else {
                  //@TODO no one left in room
                }
              }

              socketResponses.addToBucket(
                "everyone",
                SUBJECTS.PEOPLE.REMOVE({
                  roomCode,
                  personId: thisPerson.getId(),
                })
              );
            }

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
    },
    PEOPLE: {
      UPDATE_MY_NAME: (props) => {
        // roomCode
        let [subject, action] = ["PEOPLE", "UPDATE_MY_NAME"];
        let socketResponses = SocketResponseBuckets();
        return personConsumer(
          props,
          (props2) => {
            let { roomCode, thisPersonId, thisPerson, username } = props2;
            let status = "failure";
            let payload = null;

            let usernameMaxLength = 20;
            if (isStr(username)) {
              username = String(username).trim();
              if (username.length < usernameMaxLength) {
                status = "success";
                thisPerson.setName(username);
                socketResponses.addToBucket(
                  "everyone",
                  SUBJECTS.PEOPLE.GET_KEYED({
                    personId: thisPersonId,
                    roomCode,
                  })
                );
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
      },
      ME: (props) => {
        // roomCode
        let [subject, action] = ["PEOPLE", "ME"];
        let socketResponses = SocketResponseBuckets();
        return personConsumer(
          props,
          (props2) => {
            let { thisPersonId, thisPerson } = props2;

            let status = "success";
            let payload = {
              me: thisPersonId,
            };

            socketResponses.addToSpecific(
              thisPerson.getClientId(),
              makeResponse({ subject, action, status, payload })
            );
            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      GET_HOST: (props) => {
        // roomCode
        let [subject, action] = ["PEOPLE", "GET_HOST"];
        let socketResponses = SocketResponseBuckets();
        return personConsumer(
          props,
          (props2) => {
            let { personManager } = props2;

            let payload = {};
            let status = "failure";
            let host = null;
            let hostPerson = personManager.findPerson((person) =>
              person.hasTag("host")
            );
            if (isDef(hostPerson)) {
              status = "success";
              host = hostPerson.getId();
            }

            payload.host = host;

            socketResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      SET_HOST: (props) => {
        // roomCode, personId
        let [subject, action] = ["PEOPLE", "SET_HOST"];
        let socketResponses = SocketResponseBuckets();
        return personConsumer(
          props,
          (props2) => {
            let { personId } = props;
            let { roomCode, personManager, thisPerson } = props2;
            let isCurrentHost = isDef(thisPerson) && thisPerson.hasTag("host");

            let payload = {};
            let status = "failure";

            if (personManager.getConnectedPeopleCount() <= 1 || isCurrentHost) {
              if (isDef(personId) && personManager.hasPerson(personId)) {
                let currentHost = personManager.findPerson((person) =>
                  person.hasTag("host")
                );
                if (isDef(currentHost)) {
                  currentHost.removeTag("host");
                }

                let newHost = personManager.getPerson(personId);
                newHost.addTag("host");

                status = "success";
                payload.host = personId;
                socketResponses.addToBucket(
                  "everyone",
                  makeResponse({ subject, action, status, payload })
                );
              }
            } else {
              socketResponses.addToBucket(
                "default",
                makeResponse({ subject, action, status, payload })
              );
            }

            socketResponses.addToBucket(
              "default",
              SUBJECTS.PEOPLE.GET_HOST({
                roomCode,
              })
            );

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      GET_ALL_KEYED: (props) => {
        let subject = "PEOPLE";
        let action = "GET_ALL_KEYED";
        let status = "failure";

        let payload = null;
        let socketResponses = SocketResponseBuckets();
        let { roomCode } = props;
        let room = roomManager.getRoomByCode(roomCode);
        if (isDef(room)) {
          status = "success";
          let personManager = room.getPersonManager();
          let peopleIds = personManager
            .getConnectedPeople()
            .map((person) => person.getId());

          socketResponses.addToBucket(
            "default",
            SUBJECTS.PEOPLE.GET_KEYED({
              peopleIds,
              roomCode,
            })
          );
        }
        socketResponses.addToBucket(
          "default",
          makeResponse({ subject, action, status, payload })
        );

        return socketResponses;
      },
      GET_KEYED: (props) => {
        let socketResponses = SocketResponseBuckets();
        let [subject, action] = ["PEOPLE", "GET_KEYED"];
        let peopleIds = getArrFromProp(props, {
          plural: "peopleIds",
          singular: "personId",
        });

        let payload = {
          items: {},
          order: [],
        };

        return roomConsumer(
          props,
          ({ room, personManager }) => {
            let personFoundCount = 0;
            peopleIds.forEach((personId) => {
              let person = personManager.getPerson(personId);
              if (isDef(person)) {
                ++personFoundCount;
                payload.items[personId] = person.serialize();
                payload.order.push(personId);
              }
            });

            let status = personFoundCount > 0 ? "success" : "failure";
            socketResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      REMOVE: (props) => {
        let socketResponses = SocketResponseBuckets();
        let [subject, action] = ["PEOPLE", "REMOVE"];
        let message = "Failed to remove people.";

        return personConsumer(
          props,
          (props2) => {
            let status = "failure";
            let { roomCode, personManager, thisPerson, thisPersonId } = props2;

            let peopleIds = getArrFromProp(
              props,
              {
                plural: "peopleIds",
                singular: "personId",
              },
              thisPersonId
            );
            let payload = {
              ids: [],
            };

            // Foreach person beign removed
            let removedPersonCount = 0;
            let wasHostRemoved = false;
            peopleIds.forEach((personId) => {
              let person = personManager.getPerson(personId);
              if (isDef(person)) {
                // Can I removed by this person
                if (canPersonRemoveOtherPerson(thisPerson, person)) {
                  ++removedPersonCount;
                  payload.ids.push(personId);

                  person.disconnect();
                  personManager.removePersonById(person.getId());

                  // If it was the host who left, assing new host
                  let wasHost = person.hasTag("host");
                  if (wasHost) wasHostRemoved = true;
                }
              }
            });

            if (removedPersonCount > 0) {
              status = "success";
              message = `Removed ${removedPersonCount} people successfully.`;
              socketResponses.addToBucket(
                "everyone",
                makeResponse({ subject, action, status, payload, message })
              );
            } else {
              socketResponses.addToBucket(
                "default",
                makeResponse({ subject, action, status, payload, message })
              );
            }

            if (wasHostRemoved) {
              let nextHost = personManager.findPerson((firstPerson) =>
                firstPerson.isConnected()
              );
              if (isDef(nextHost)) {
                socketResponses.addToBucket(
                  "everyone",
                  SUBJECTS.PEOPLE.SET_HOST({
                    roomCode,
                    personId: nextHost.getId(),
                  })
                );
              }
            }

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      UPDATE_MY_STATUS: (props) => {
        let [subject, action] = ["PEOPLE", "UPDATE_MY_STATUS"];
        let socketResponses = SocketResponseBuckets();
        let payload = null;
        let requestStatus = "failure";
        return personConsumer(
          props,
          ({ roomCode, room, personManager, person, thisPersonId }) => {
            let { status } = props;

            let allowedStatuses = ["ready", "not_ready"];
            if (allowedStatuses.includes(status)) {
              person.setStatus(String(status));
            }

            requestStatus = "success";
            socketResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status: requestStatus, payload })
            );

            socketResponses.addToBucket(
              "everyone",
              SUBJECTS.PEOPLE.GET_KEYED({
                personId: thisPersonId,
                roomCode,
              })
            );

            socketResponses.addToBucket(
              "default",
              SUBJECTS.GAME.CAN_START({ roomCode })
            );
            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
    },
    MY_TURN: {
      TURN_STARTING_DRAW: (props) => {
        let subject = "MY_TURN";
        let action = "TURN_STARTING_DRAW";
        let socketResponses = SocketResponseBuckets();
        return myTurnConsumerGood(
          props,
          (props2) => {
            let {
              logging,
              roomCode,
              game,
              personManager,
              thisPersonId,
            } = props2;

            if (game.getCurrentTurn().canDrawTurnStartingCards()) {
              // Draw Card from deck ------------------------------------

              // Get hand before
              let handBefore = game.getPlayerHand(thisPersonId).serialize();

              // Draw cards
              game.playerTurnStartingDraw(thisPersonId);

              // Get hand after
              let handAfter = game.getPlayerHand(thisPersonId).serialize();

              let cardIdsBefore = handBefore.cardIds;
              let cardIdsAfter = handAfter.cardIds;
              let cardIdsDelta = cardIdsAfter.filter(
                (n) => !cardIdsBefore.includes(n)
              );

              // Let people know ---------------------------------------------------------

              if (logging) logBlock(handBefore, "Hand Before");

              socketResponses.addToBucket(
                "everyone",
                SUBJECTS.PLAYERS.PERSON_DREW_CARDS_KEYED({
                  roomCode,
                  personId: thisPersonId,
                  cardIds: cardIdsDelta,
                  logging,
                })
              );

              socketResponses.addToBucket(
                "default",
                SUBJECTS["DRAW_PILE"].GET({ roomCode })
              );

              if (logging) logBlock(handAfter, "Hand After");

              // Update everyone with my new hand
              let allPlayerIds = getAllPlayerIds({ game, personManager });
              socketResponses.addToBucket(
                "default",
                SUBJECTS["PLAYER_HANDS"].GET_KEYED({
                  roomCode,
                  personId: thisPersonId,
                  receivingPeopleIds: allPlayerIds,
                })
              );

              // Confirm this executed
              socketResponses.addToBucket(
                "default",
                makeResponse({
                  subject,
                  action,
                  status: "success",
                  payload: null,
                })
              );

              // Update current turn state
              socketResponses.addToBucket(
                "everyone",
                SUBJECTS["PLAYER_TURN"].GET({ roomCode })
              );
              //___________________________________________________________________________
            }

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },

      CHANGE_CARD_ACTIVE_SET: (props) => {
        let subject = "MY_TURN";
        let action = "CHANGE_CARD_ACTIVE_SET";
        let socketResponses = SocketResponseBuckets();
        let status = "failure";
        let payload = null;
        return myTurnConsumerGood(
          props,
          (consumerData, checkpoints) => {
            let { cardId, chosenSetKey, collectionId } = consumerData;
            const { roomCode, game, thisPersonId } = consumerData;

            let scope = "default";
            checkpoints.set("cardIsDefined", false);
            checkpoints.set("validChosenSetKey", false);
            checkpoints.set("validPlayer", false);
            // Player
            let player = game.getPlayer(thisPersonId);
            if (isDef(player)) {
              checkpoints.set("validPlayer", true);

              // Card
              if (isDef(cardId)) {
                checkpoints.set("cardIsDefined", true);

                // Set choice is valid
                let choiceList = game.getSetChoicesForCard(cardId);
                if (isDef(chosenSetKey) && choiceList.includes(chosenSetKey)) {
                  checkpoints.set("validChosenSetKey", true);

                  // Is in hand?
                  let hand = game.getPlayerHand(thisPersonId);
                  if (hand.hasCard(cardId)) {
                    game.updateCardSet(cardId, chosenSetKey);
                    status = "success";
                    scope = "default";
                  } else {
                    //Is in collection?
                    if (
                      isDef(collectionId) &&
                      player.hasCollectionId(collectionId)
                    ) {
                      let collection = game
                        .getCollectionManager()
                        .getCollection(collectionId);

                      // is only card in set? all good
                      if (collection.propertyCount() === 1) {
                        status = "success";
                        scope = "everyone";
                        game.updateCardSet(cardId, chosenSetKey);
                        collection.setPropertySetKey(chosenSetKey);

                        socketResponses.addToBucket(
                          "everyone",
                          SUBJECTS["COLLECTIONS"].GET_KEYED({
                            roomCode,
                            collectionId: collection.getId(),
                          })
                        );
                      } else {
                        //things get more complicated
                      }
                    }
                  }
                }
              }
            }

            if (status === "success") {
              socketResponses.addToBucket(
                scope,
                SUBJECTS.CARDS.GET_KEYED({ roomCode, cardId })
              );
            }

            if (!isDef(payload)) payload = {};
            payload.checkpoints = packageCheckpoints(checkpoints);

            socketResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );

            if (game.checkWinConditionForPlayer(thisPersonId)) {
              socketResponses.addToBucket(
                "everyone",
                SUBJECTS.GAME.STATUS({ roomCode })
              );
            }
            return socketResponses; // <----- REMEMBER THIS!!!!
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      ADD_CARD_TO_MY_BANK_FROM_HAND: (props) => {
        let subject = "MY_TURN";
        let action = "ADD_CARD_TO_MY_BANK_FROM_HAND";
        let socketResponses = SocketResponseBuckets();
        let status = "failure";
        return handCardConsumer(
          props,
          (props2, checkpoints) => {
            checkpoints.set("isActionPhase", false);
            checkpoints.set("isCardInHand", false);
            checkpoints.set("cardCanBeAddedToBank", false);

            let { cardId } = props2;
            let {
              hand,
              roomCode,
              game,
              personManager,
              thisPersonId,
              logging,
            } = props2;
            if (game.getCurrentTurn().getCurrentPhase() === "action") {
              checkpoints.set("isActionPhase", true);

              let card = hand.getCardById(cardId);
              if (isDef(card)) {
                checkpoints.set("isCardInHand", true);

                checkpoints.set("isWithinActionLimit", false);
                if (game.getCurrentTurn().isWithinActionLimit()) {
                  checkpoints.set("isWithinActionLimit", true);

                  if (game.canCardBeAddedToBank(card)) {
                    checkpoints.set("cardCanBeAddedToBank", true);

                    let isWildCard = game.doesCardHaveTag(card, "wild");

                    game.playCardAddToBank(thisPersonId, card);
                    status = "success";

                    //PLAYER_HANDS
                    // Update everyone with my new hand
                    let allPlayerIds = getAllPlayerIds({ game, personManager });
                    socketResponses.addToBucket(
                      "default",
                      SUBJECTS["PLAYER_HANDS"].GET_KEYED({
                        roomCode,
                        personId: thisPersonId,
                        receivingPeopleIds: allPlayerIds,
                        logging,
                      })
                    );
                    //PLAYER_BANKS
                    socketResponses.addToBucket(
                      "default",
                      SUBJECTS["PLAYER_BANKS"].GET_KEYED({
                        roomCode,
                        personId: thisPersonId,
                        receivingPeopleIds: allPlayerIds,
                        logging,
                      })
                    );

                    //PLAYER_TURN
                    // Update current turn state
                    socketResponses.addToBucket(
                      "everyone",
                      SUBJECTS["PLAYER_TURN"].GET({ roomCode, logging })
                    );

                    // Wildcard could be any set, let other know
                    if (isWildCard) {
                      socketResponses.addToBucket(
                        "everyone",
                        SUBJECTS.CARDS.GET_KEYED({ roomCode, cardId })
                      );
                    }

                    //ADD_CARD_TO_MY_BANK_FROM_HAND
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
                        SUBJECTS.GAME.STATUS({ roomCode })
                      );
                    }
                  } else {
                    log("!canCardBeAddedToBank");
                  }
                }
              }
            }

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND: (props) => {
        let subject = "MY_TURN";
        let action = "ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND";
        let socketResponses = SocketResponseBuckets();
        let status = "failure";
        return handCardConsumer(
          props,
          (props2, checkpoints) => {
            let {
              logging,
              cardId,
              card,
              hand,
              roomCode,
              game,
              personManager,
              thisPerson,
              thisPersonId,
            } = props2;
            checkpoints.set("isPropertyCard", false);
            checkpoints.set("hasPropertySet", false);
            checkpoints.set("collectionCreated", false);

            // CARD IS PROPERTY
            if (game.isCardProperty(card)) {
              checkpoints.set("isPropertyCard", true);
              let isSuperWildCard = game.doesCardHaveTag(card, "superWild");
              let isWildCard = game.doesCardHaveTag(card, "wild");

              let decidedPropertySetKey;
              if (isSuperWildCard) {
                decidedPropertySetKey = gameConstants.AMBIGUOUS_SET_KEY;
              } else {
                decidedPropertySetKey = card.set;
              }

              // BELONGS TO A hasPropertySet
              if (isDef(decidedPropertySetKey)) {
                checkpoints.set("hasPropertySet", true);

                let handBefore = hand.serialize();
                //
                let collection = game.playCardFromHandToNewCollection(
                  thisPersonId,
                  cardId
                );
                if (isDef(collection)) {
                  checkpoints.set("collectionCreated", true);
                  collection.setPropertySetKey(decidedPropertySetKey);
                  status = "success";

                  //Update collection contents
                  socketResponses.addToBucket(
                    "everyone",
                    SUBJECTS["COLLECTIONS"].GET_KEYED({
                      roomCode,
                      collectionId: collection.getId(),
                    })
                  );

                  // Update who has what collection
                  socketResponses.addToBucket(
                    "everyone",
                    SUBJECTS["PLAYER_COLLECTIONS"].GET_KEYED({
                      roomCode,
                      personId: thisPersonId,
                    })
                  );

                  if (isWildCard) {
                    socketResponses.addToBucket(
                      "everyone",
                      SUBJECTS.CARDS.GET_KEYED({ roomCode, cardId })
                    );
                  }

                  // Emit updated player turn
                  socketResponses.addToBucket(
                    "everyone",
                    SUBJECTS["PLAYER_TURN"].GET({ roomCode })
                  );

                  // Update everyone with my new hand
                  let allPlayerIds = getAllPlayerIds({ game, personManager });
                  socketResponses.addToBucket(
                    "default",
                    SUBJECTS["PLAYER_HANDS"].GET_KEYED({
                      roomCode,
                      personId: thisPersonId,
                      receivingPeopleIds: allPlayerIds,
                    })
                  );

                  // ==================================================
                  // DEBUG LOGING
                  // ==================================================
                  if (isDef(logging) && logging) {
                    logBlock(handBefore, "Hand Before");

                    logBlock(hand.serialize(), "Hand After");
                    logBlock(card, `Added property to Collection`);
                    logBlock(collection.serialize(), `Collection`);
                    let logBlockLite = (content, title = "", w = 50) => {
                      log(`// ${"=".repeat(w)}`);
                      log(`// ${title}`);
                      log(content);
                      log(`// ${"_".repeat(w)}`);
                    };
                    logBlockLite(
                      game.getPlayer(thisPersonId).getAllCollectionIds(),
                      `Player "${thisPerson.getName()}"'s Collection IDs`
                    );
                    //logBlock(card, "Card");
                    //logBlock(currentTurn.serialize(), "CurrentTurn");
                  }
                  // __________________________________________________
                }
              }
            }

            if (game.checkWinConditionForPlayer(thisPersonId)) {
              socketResponses.addToBucket(
                "everyone",
                SUBJECTS.GAME.STATUS({ roomCode })
              );
            }

            // confirm action for async await
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
                SUBJECTS.GAME.STATUS({ roomCode })
              );
            }
            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND: (props) => {
        let subject = "MY_TURN";
        let action = "ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND";
        let socketResponses = SocketResponseBuckets();
        let status = "failure";
        return handCardConsumer(
          props,
          (props2, checkpoints) => {
            let {
              logging,
              collectionId,
              cardId,
              card,
              roomCode,
              game,
              personManager,
              currentTurn,
              thisPersonId,
            } = props2;
            checkpoints.set("isActionPhase", false);
            checkpoints.set("collectionExists", false);
            checkpoints.set("isMyCollection", false);
            checkpoints.set("isPropertyCard", false);
            checkpoints.set("hasPropertySet", false);
            checkpoints.set("cardMatchesPropertySet", false);
            checkpoints.set("isWithinActionLimit", false);

            if (currentTurn.getCurrentPhase() === "action") {
              checkpoints.set("isActionPhase", true);

              if (isDef(collectionId)) {
                let collection = game
                  .getCollectionManager()
                  .getCollection(collectionId);
                if (isDef(collection)) {
                  checkpoints.set("collectionExists", true);
                  if (collection.getPlayerKey() === thisPersonId) {
                    checkpoints.set("isMyCollection", true);
                    checkpoints.set("doesCollectionHaveRoom", false);
                    if (!collection.isFull()) {
                      checkpoints.set("doesCollectionHaveRoom", true);

                      if (game.isCardProperty(card)) {
                        checkpoints.set("isPropertyCard", true);

                        let resultFromCollection = game.canAddCardToCollection(
                          card,
                          collection
                        );
                        let decidedPropertySetKey =
                          resultFromCollection.newPropertySetKey;
                        let canBeAdded = resultFromCollection.canBeAdded;

                        checkpoints.set("canBeAdded", false);
                        if (canBeAdded) {
                          checkpoints.set("canBeAdded", true);

                          if (game.getCurrentTurn().isWithinActionLimit()) {
                            checkpoints.set("isWithinActionLimit", true);

                            let isWildCard = game.doesCardHaveTag(card, "wild");

                            collection.setPropertySetKey(decidedPropertySetKey);
                            game.playCardToExistingCollection(
                              thisPersonId,
                              cardId,
                              collection
                            );

                            status = "success";

                            if (isWildCard) {
                              socketResponses.addToBucket(
                                "everyone",
                                SUBJECTS.CARDS.GET_KEYED({ roomCode, cardId })
                              );
                            }

                            // Emit updated player turn
                            socketResponses.addToBucket(
                              "everyone",
                              SUBJECTS["PLAYER_TURN"].GET({ roomCode })
                            );

                            //Update collection contents
                            socketResponses.addToBucket(
                              "everyone",
                              SUBJECTS["COLLECTIONS"].GET_KEYED({
                                roomCode,
                                collectionId: collection.getId(),
                                logging,
                              })
                            );

                            // Update everyone with my new hand
                            let allPlayerIds = getAllPlayerIds({
                              game,
                              personManager,
                            });
                            socketResponses.addToBucket(
                              "default",
                              SUBJECTS["PLAYER_HANDS"].GET_KEYED({
                                roomCode,
                                personId: thisPersonId,
                                receivingPeopleIds: allPlayerIds,
                                logging,
                              })
                            );
                          }
                        }
                      }
                    }
                  }
                }
              }
            }

            // If player wins let people know
            if (game.checkWinConditionForPlayer(thisPersonId)) {
              socketResponses.addToBucket(
                "everyone",
                SUBJECTS.GAME.STATUS({ roomCode })
              );
            }

            // confirm action for async await
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
                SUBJECTS.GAME.STATUS({ roomCode })
              );
            }
            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      ADD_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_HAND: (props) => {
        let subject = "MY_TURN";
        let action = "ADD_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_HAND";
        let socketResponses = SocketResponseBuckets();
        let status = "failure";
        return handCardConsumer(
          props,
          (props2, checkpoints) => {
            let {
              logging,
              collectionId,
              card,
              hand,
              roomCode,
              game,
              personManager,
              currentTurn,
              thisPersonId,
            } = props2;

            // Add checkpoints which must be reached
            checkpoints.set("isActionPhase", false);
            checkpoints.set("collectionExists", false);
            checkpoints.set("isMyCollection", false);
            checkpoints.set("isSetAugmentCard", false);
            checkpoints.set("canApplyAugment", false);

            if (currentTurn.getCurrentPhase() === "action") {
              checkpoints.set("isActionPhase", true);

              if (isDef(collectionId)) {
                let collection = game
                  .getCollectionManager()
                  .getCollection(collectionId);
                if (isDef(collection)) {
                  checkpoints.set("collectionExists", true);
                  if (collection.getPlayerKey() === thisPersonId) {
                    checkpoints.set("isMyCollection", true);
                    if (game.isCardSetAugment(card)) {
                      checkpoints.set("isSetAugmentCard", true);
                      if (game.canApplyAugmentToSet(card, collection)) {
                        checkpoints.set("canApplyAugment", true);

                        collection.addCard(hand.giveCard(card));
                        currentTurn.setActionPreformed(
                          "AUGMENT_COLLECTION",
                          card
                        );
                        status = "success";

                        // Emit updated player turn
                        socketResponses.addToBucket(
                          "everyone",
                          SUBJECTS["PLAYER_TURN"].GET({ roomCode })
                        );

                        //Update collection contents
                        socketResponses.addToBucket(
                          "everyone",
                          SUBJECTS["COLLECTIONS"].GET_KEYED({
                            roomCode,
                            collectionId: collection.getId(),
                            logging,
                          })
                        );

                        // Update everyone with my new hand
                        let allPlayerIds = getAllPlayerIds({
                          game,
                          personManager,
                        });
                        socketResponses.addToBucket(
                          "default",
                          SUBJECTS["PLAYER_HANDS"].GET_KEYED({
                            roomCode,
                            personId: thisPersonId,
                            receivingPeopleIds: allPlayerIds,
                            logging,
                          })
                        );
                      }
                    }
                  }
                }
              }
            }
            let payload = {
              checkpoints: packageCheckpoints(checkpoints),
            };
            // confirm action for async await
            socketResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );

            if (game.checkWinConditionForPlayer(thisPersonId)) {
              socketResponses.addToBucket(
                "everyone",
                SUBJECTS.GAME.STATUS({ roomCode })
              );
            }

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      PLAY_PASS_GO: (props) => {
        let subject = "MY_TURN";
        let action = "PLAY_PASS_GO";
        let socketResponses = SocketResponseBuckets();
        let status = "failure";
        let payload = null;
        return handCardConsumer(
          props,
          (props2, checkpoints) => {
            let {
              logging,
              cardId,
              hand,
              card,
              roomCode,
              game,
              personManager,
              currentTurn,
              thisPersonId,
            } = props2;
            checkpoints.set("isActionPhase", false);
            checkpoints.set("isDrawCard", false);
            checkpoints.set("canPlayCard", false);

            if (currentTurn.getCurrentPhase() === "action") {
              checkpoints.set("isActionPhase", true);
              // CARD IS PASS GO
              if (card.type === "action" && card.class === "draw") {
                checkpoints.set("isDrawCard", true);
                let drawQty = card.drawCards.amount;

                if (game.getCurrentTurn().isWithinActionLimit()) {
                  checkpoints.set("canPlayCard", true);

                  let handBefore = game.getPlayerHand(thisPersonId).serialize();

                  let activePile = game.getActivePile();
                  activePile.addCard(hand.giveCard(card));
                  game.drawNCards(thisPersonId, drawQty);

                  // update action state after action preformed
                  currentTurn.setActionPreformed("DRAW_CARDS", card);
                  status = "success";
                  let handAfter = game.getPlayerHand(thisPersonId).serialize();

                  let cardIdsBefore = handBefore.cardIds;
                  let cardIdsAfter = handAfter.cardIds;
                  let cardIdsDelta = cardIdsAfter.filter(
                    (n) => !cardIdsBefore.includes(n)
                  );

                  // Let people know ---------------------------------------------------------

                  if (logging) logBlock(handBefore, "Hand Before");

                  // updated card piles
                  socketResponses.addToBucket(
                    "everyone",
                    SUBJECTS["GAME"].GET_UPDATED_PILES({ roomCode })
                  );

                  // Cards Drawn
                  socketResponses.addToBucket(
                    "everyone",
                    SUBJECTS.PLAYERS.PERSON_DREW_CARDS_KEYED({
                      roomCode,
                      personId: thisPersonId,
                      cardIds: cardIdsDelta,
                      logging,
                    })
                  );

                  // Update everyone with my new hand
                  let allPlayerIds = getAllPlayerIds({
                    game,
                    personManager,
                  });
                  socketResponses.addToBucket(
                    "default",
                    SUBJECTS["PLAYER_HANDS"].GET_KEYED({
                      roomCode,
                      personId: thisPersonId,
                      receivingPeopleIds: allPlayerIds,
                      logging,
                    })
                  );

                  socketResponses.addToBucket(
                    "default",
                    makeResponse({ subject, action, status, payload })
                  );

                  // update player turn - must be last
                  socketResponses.addToBucket(
                    "everyone",
                    SUBJECTS["PLAYER_TURN"].GET({ roomCode })
                  );

                  if (game.checkWinConditionForPlayer(thisPersonId)) {
                    socketResponses.addToBucket(
                      "everyone",
                      SUBJECTS.GAME.STATUS({ roomCode })
                    );
                  }

                  return socketResponses;
                }
              }
            }

            // confirm action for async await
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
      },

      //@TODO remove totalValue, augments,  from  handleCollectionBasedRequestCreation
      CHARGE_RENT: (props) => {
        function doTheThing(theGoods) {
          let { cardId, collectionId } = theGoods;
          let { thisPersonId, affectedIds, affected, checkpoints } = theGoods;

          let { game, requestManager, currentTurn } = theGoods;
          let {
            baseValue,
            totalValue,
            augments,
            targetPeopleIds,
            validAugmentCardsIds,
          } = theGoods;

          let hand = game.getPlayerHand(thisPersonId);
          let activePile = game.getActivePile();
          activePile.addCard(hand.giveCard(cardId));
          affected.activePile = true;

          currentTurn.setActionPreformed("REQUEST", game.getCard(cardId));
          let augmentUsesActionCount = game.getConfig(
            SHOULD.ACTION_AUGMENT_CARDS_COST_ACTION,
            true
          );
          if (augmentUsesActionCount) {
            validAugmentCardsIds.forEach((augCardId) => {
              currentTurn.setActionPreformed(
                "REQUEST",
                game.getCard(augCardId)
              );
              activePile.addCard(hand.giveCard(augCardId));
            });
          }

          function onCancelCallback(req, { affectedIds, affected }) {
            // If augmented remove an augment

            // data may be stored in differnt locations depending if it was a decline card
            let serializedData;
            let isJustSayNo = req.getType() === "justSayNo";
            if (isJustSayNo) {
              serializedData = req.getPayload("reconstruct");
            } else {
              serializedData = req.serialize();
            }

            if (isDef(serializedData)) {
              let authorKey = getNestedValue(serializedData, "authorKey");
              let targetKey = getNestedValue(serializedData, "targetKey");
              let baseValue = getNestedValue(
                serializedData,
                ["payload", "baseValue"],
                0
              );
              let actionNum = getNestedValue(serializedData, [
                "payload",
                "actionNum",
              ]);
              let originalAugmentIds = getNestedValue(
                serializedData,
                ["payload", "augmentCardIds"],
                []
              );
              let actionCardId = getNestedValue(serializedData, [
                "payload",
                "actionCardId",
              ]);
              let actionCollectionId = getNestedValue(serializedData, [
                "payload",
                "actionCollectionId",
              ]);

              if (
                isDef(authorKey) &&
                isDef(targetKey) &&
                isDef(actionCollectionId) &&
                isDef(actionNum) &&
                isDef(actionCardId) &&
                originalAugmentIds.length > 0 &&
                isDef(baseValue)
              ) {
                // if augment was presant remove (1) augment
                if (originalAugmentIds.length > 0) {
                  let newAugmentIds = originalAugmentIds.slice(1); // return all excluding first element
                  let request = createRequest({
                    authorKey: authorKey,
                    targetKey: targetKey,
                    actionNum: actionNum,
                    baseValue: baseValue,
                    augmentCardsIds: newAugmentIds,
                  });

                  //let newRequest
                  affected.requests = true;
                  affectedIds.requests.push(request.getId());
                  affectedIds.playerRequests.push(request.getAuthorKey());
                  affectedIds.playerRequests.push(request.getTargetKey());
                }
              } else {
                console.log("wont make new request", [
                  isDef(actionCollectionId),
                  isDef(actionNum),
                  isDef(actionCardId),
                  originalAugmentIds.length > 0,
                  isDef(baseValue),
                ]);
              }
            }
          }

          function createRequest({
            authorKey,
            targetKey,
            actionNum,
            baseValue = 0,
            augmentCardsIds = [],
          }) {
            let chargeValue = baseValue;
            let validAugmentCardsIds = [];
            let augments = {};
            if (isArr(augmentCardsIds)) {
              augmentCardsIds.forEach((augCardId) => {
                let canApply = game.canApplyRequestAugment(
                  cardId,
                  augCardId,
                  validAugmentCardsIds,
                  augmentCardsIds
                );
                if (canApply) {
                  validAugmentCardsIds.push(augCardId);
                  let card = game.getCard(augCardId);
                  augments[augCardId] = getNestedValue(
                    card,
                    ["action", "agument"],
                    {}
                  );
                }
              });
            }

            chargeValue = game.applyActionValueAugment(
              validAugmentCardsIds,
              chargeValue
            );
            let transaction = Transaction();
            let request = requestManager.createRequest({
              type: "collectValue",
              authorKey: authorKey,
              targetKey: targetKey,
              status: "open",
              actionNum: actionNum,
              payload: {
                actionCardId: cardId,
                actionCollectionId: collectionId,
                actionNum: actionNum,
                baseValue: baseValue,
                amountDue: chargeValue,
                amountRemaining: chargeValue,
                transaction: transaction,
                augments: augments,
                augmentCardIds: validAugmentCardsIds, // deprecated
              },
              onAcceptCallback: (req, args) => {
                console.log("CHARGE_RENT - onAcceptCallback ORIGINAL");
              },
              onDeclineCallback: onCancelCallback,
              description: `Charge value in rent`,
            });

            return request;
          }

          let actionNum = currentTurn.getActionCount();
          targetPeopleIds.forEach((targetPersonId) => {
            // Create a transaction to transfer to author
            let request = createRequest({
              authorKey: thisPersonId,
              targetKey: targetPersonId,
              actionNum: actionNum,
              baseValue: baseValue,
              augmentCardsIds: validAugmentCardsIds,
            });
            affectedIds.requests.push(request.getId());
            affected.requests = true;
            affected.activePile = true;
          });

          checkpoints.set("success", true);
        }

        return handleCollectionBasedRequestCreation(
          "MY_TURN",
          "CHARGE_RENT",
          props,
          doTheThing
        );
      },

      VALUE_COLLECTION: (props) => {
        function doTheThing(theGoods) {
          let { cardId } = theGoods;
          let { thisPersonId, affectedIds, affected, checkpoints } = theGoods;

          let { game, requestManager, currentTurn } = theGoods;
          let { augments, targetPeopleIds } = theGoods;

          let hand = game.getPlayerHand(thisPersonId);
          let activePile = game.getActivePile();
          activePile.addCard(hand.giveCard(game.getCard(cardId)));
          affected.activePile = true;

          currentTurn.setActionPreformed("REQUEST", game.getCard(cardId));
          //let augmentUsesActionCount = game.getConfig(SHOULD.ACTION_AUGMENT_CARDS_COST_ACTION, true);
          //if(augmentUsesActionCount){
          //  validAugmentCardsIds.forEach(augCardId => {
          //    currentTurn.setActionPreformed("REQUEST", game.getCard(cardId));
          //  })
          //}
          let actionNum = currentTurn.getActionCount();

          let card = game.getCard(cardId);
          if (isDefNested(card, ["action", "collectValue"])) {
            targetPeopleIds.forEach((targetPersonId) => {
              let transaction = Transaction();
              transaction.getOrCreate("toAuthor");
              let value = card.action.collectValue;
              let request = requestManager.createRequest({
                type: "collectValue",
                authorKey: thisPersonId,
                targetKey: targetPersonId,
                status: "open",
                actionNum: actionNum,
                payload: {
                  actionNum: actionNum,
                  amountDue: value,
                  amountRemaining: value,
                  baseValue: value,
                  actionCardId: cardId,
                  transaction: transaction,
                  augments: augments,
                },
                description: `Collect Debt`,
              });
              affectedIds.requests.push(request.getId());
              affected.requests = true;
              affected.activePile = true;
              checkpoints.set("success", true);
            });
          }

          if (checkpoints.get("success") === true) {
          }
        }

        return handleRequestCreation(
          "MY_TURN",
          "VALUE_COLLECTION",
          props,
          doTheThing
        );
      },

      SWAP_PROPERTY: (props) => {
        function doTheThing(theGoods) {
          let { cardId, myPropertyCardId, theirPropertyCardId } = theGoods;
          let { thisPersonId, affectedIds, affected, checkpoints } = theGoods;

          let { game, requestManager, currentTurn } = theGoods;

          let hand = game.getPlayerHand(thisPersonId);
          let activePile = game.getActivePile();

          //let augmentUsesActionCount = game.getConfig(SHOULD.ACTION_AUGMENT_CARDS_COST_ACTION, true);
          //if(augmentUsesActionCount){
          //  validAugmentCardsIds.forEach(augCardId => {
          //    currentTurn.setActionPreformed("REQUEST", game.getCard(cardId));
          //  })
          //}

          let actionCard = game.getCard(cardId);
          checkpoints.set("isValidSwapPropertyActionCard", false);
          if (game.doesCardHaveTag(cardId, "swapProperty")) {
            checkpoints.set("isValidSwapPropertyActionCard", true);

            // My collection?
            let myCollection = game.getCollectionThatHasCard(myPropertyCardId);
            checkpoints.set("isMyCollection", false);
            if (isDef(myCollection)) {
              if (
                String(myCollection.getPlayerKey()) === String(thisPersonId)
              ) {
                checkpoints.set("isMyCollection", true);

                // Their collection?
                let theirCollection = game.getCollectionThatHasCard(
                  theirPropertyCardId
                );
                checkpoints.set("isTheirCollection", false);
                if (isDef(theirCollection)) {
                  if (
                    String(theirCollection.getPlayerKey()) !==
                    String(thisPersonId)
                  ) {
                    checkpoints.set("isTheirCollection", true);

                    // Are valid cards? Augments might affect this in the future
                    let isValidCards = true;
                    checkpoints.set("isValidCards", false);

                    checkpoints.set("isTheirCollectionNotFull", false);
                    if (!theirCollection.isFull()) {
                      checkpoints.set("isTheirCollectionNotFull", true);
                    }

                    checkpoints.set("isMyCollectionNotFull", false);
                    if (!myCollection.isFull()) {
                      checkpoints.set("isMyCollectionNotFull", true);
                    }

                    isValidCards =
                      checkpoints.get("isTheirCollectionNotFull") &&
                      checkpoints.get("isMyCollectionNotFull");

                    // are they tagged as property?
                    if (isValidCards) {
                      let isMyCardProperty = game.doesCardHaveTag(
                        myPropertyCardId,
                        "property"
                      );
                      let isTheirCardProperty = game.doesCardHaveTag(
                        theirPropertyCardId,
                        "property"
                      );

                      checkpoints.set("isMyCardProperty", false);
                      if (isMyCardProperty) {
                        checkpoints.set("isMyCardProperty", true);
                      } else {
                        isValidCards = false;
                      }

                      checkpoints.set("isTheirCardProperty", false);
                      if (isTheirCardProperty) {
                        checkpoints.set("isTheirCardProperty", true);
                      } else {
                        isValidCards = false;
                      }
                    }

                    if (isValidCards) {
                      checkpoints.set("isValidCards", true);

                      activePile.addCard(hand.giveCard(game.getCard(cardId)));
                      affected.activePile = true;

                      currentTurn.setActionPreformed(
                        "REQUEST",
                        game.getCard(cardId)
                      );
                      // Log action preformed
                      let actionNum = currentTurn.getActionCount();

                      let transaction = Transaction();
                      transaction
                        .getOrCreate("fromTarget")
                        .getOrCreate("property")
                        .add(theirPropertyCardId);
                      transaction
                        .getOrCreate("fromAuthor")
                        .getOrCreate("property")
                        .add(myPropertyCardId);

                      let request = requestManager.createRequest({
                        type: "swapProperty",
                        authorKey: thisPersonId,
                        targetKey: theirCollection.getPlayerKey(),
                        status: "open",
                        actionNum: actionNum,
                        payload: {
                          actionNum: actionNum,
                          actionCardId: cardId,
                          transaction: transaction,
                        },
                        description: `Swap properties`,
                      });
                      affectedIds.requests.push(request.getId());
                      affected.requests = true;
                      affected.activePile = true;
                      checkpoints.set("success", true);
                    }
                  }
                }
              }
            }
          }
        }

        return handleRequestCreation(
          "MY_TURN",
          "SWAP_PROPERTY",
          props,
          doTheThing
        );
      },

      STEAL_PROPERTY: (props) => {
        function doTheThing(theGoods) {
          let { cardId, myPropertyCardId, theirPropertyCardId } = theGoods;
          let { thisPersonId, affectedIds, affected, checkpoints } = theGoods;

          let { game, requestManager, currentTurn } = theGoods;

          let hand = game.getPlayerHand(thisPersonId);
          let activePile = game.getActivePile();

          checkpoints.set("isValidSwapPropertyActionCard", false);
          if (game.doesCardHaveTag(cardId, "stealProperty")) {
            checkpoints.set("isValidSwapPropertyActionCard", true);

            // Their collection?
            let theirCollection = game.getCollectionThatHasCard(
              theirPropertyCardId
            );
            checkpoints.set("isTheirCollection", false);
            if (isDef(theirCollection)) {
              if (
                String(theirCollection.getPlayerKey()) !== String(thisPersonId)
              ) {
                checkpoints.set("isTheirCollection", true);

                // Are valid cards? Augments might affect this in the future
                let isValidCards = true;
                checkpoints.set("isValidCards", false);

                checkpoints.set("isTheirCollectionNotFull", false);
                if (!theirCollection.isFull()) {
                  checkpoints.set("isTheirCollectionNotFull", true);
                }

                isValidCards = checkpoints.get("isTheirCollectionNotFull");

                // are they tagged as property?
                if (isValidCards) {
                  let isTheirCardProperty = game.doesCardHaveTag(
                    theirPropertyCardId,
                    "property"
                  );

                  checkpoints.set("isTheirCardProperty", false);
                  if (isTheirCardProperty) {
                    checkpoints.set("isTheirCardProperty", true);
                  } else {
                    isValidCards = false;
                  }
                }

                if (isValidCards) {
                  checkpoints.set("isValidCards", true);

                  activePile.addCard(hand.giveCard(game.getCard(cardId)));
                  affected.activePile = true;

                  currentTurn.setActionPreformed(
                    "REQUEST",
                    game.getCard(cardId)
                  );
                  // Log action preformed
                  let actionNum = currentTurn.getActionCount();

                  let transaction = Transaction();
                  transaction
                    .getOrCreate("fromTarget")
                    .getOrCreate("property")
                    .add(theirPropertyCardId);

                  let request = requestManager.createRequest({
                    type: "stealProperty",
                    authorKey: thisPersonId,
                    targetKey: theirCollection.getPlayerKey(),
                    status: "open",
                    actionNum: actionNum,
                    payload: {
                      actionNum: actionNum,
                      actionCardId: cardId,
                      transaction: transaction,
                    },
                    description: `Steal properties`,
                  });
                  affectedIds.requests.push(request.getId());
                  affected.requests = true;
                  affected.activePile = true;
                  checkpoints.set("success", true);
                }
              }
            }
          }
        }

        return handleRequestCreation(
          "MY_TURN",
          "STEAL_PROPERTY",
          props,
          doTheThing
        );
      },

      STEAL_COLLECTION: (props) => {
        function doTheThing(theGoods) {
          let { cardId, theirCollectionId } = theGoods;
          let { thisPersonId, affectedIds, affected, checkpoints } = theGoods;

          let { game, requestManager, currentTurn } = theGoods;

          let hand = game.getPlayerHand(thisPersonId);
          let activePile = game.getActivePile();

          checkpoints.set("isValidActionCard", false);
          if (game.doesCardHaveTag(cardId, "stealCollection")) {
            checkpoints.set("isValidActionCard", true);

            let theirCollection = game
              .getCollectionManager()
              .getCollection(theirCollectionId);
            let collectionOwnerId = theirCollection.getPlayerKey();
            checkpoints.set("isValidCollection", false);
            if (String(collectionOwnerId) !== String(thisPersonId)) {
              checkpoints.set("isValidCollection", true);

              checkpoints.set("isValidPropertySetKey", false);
              if (
                !gameConstants.BAD_SET_KEYS.includes(
                  theirCollection.getPropertySetKey
                )
              ) {
                checkpoints.set("isValidPropertySetKey", true);

                checkpoints.set("isCompleteCollection", false);
                if (theirCollection.isFull()) {
                  checkpoints.set("isCompleteCollection", true);

                  // Use card
                  activePile.addCard(hand.giveCard(game.getCard(cardId)));
                  currentTurn.setActionPreformed(
                    "REQUEST",
                    game.getCard(cardId)
                  );
                  affected.activePile = true;

                  // Log action preformed
                  let actionNum = currentTurn.getActionCount();

                  let transaction = Transaction();
                  transaction
                    .getOrCreate("fromTarget")
                    .getOrCreate("collection")
                    .add(theirCollectionId);

                  let request = requestManager.createRequest({
                    type: "stealCollection",
                    authorKey: thisPersonId,
                    targetKey: theirCollection.getPlayerKey(),
                    status: "open",
                    actionNum: actionNum,
                    payload: {
                      actionNum: actionNum,
                      actionCardId: cardId,
                      transaction: transaction,
                    },
                    description: `Steal collection`,
                  });
                  affectedIds.requests.push(request.getId());
                  affected.requests = true;
                  affected.activePile = true;
                  checkpoints.set("success", true);
                }
              }
            }
          }
        }

        return handleRequestCreation(
          "MY_TURN",
          "STEAL_COLLECTION",
          props,
          doTheThing
        );
      },

      FINISH_TURN: (props) => {
        let subject = "MY_TURN";
        let action = "FINISH_TURN";
        let socketResponses = SocketResponseBuckets();

        return myTurnConsumerGood(
          props,
          (consumerData) => {
            let {
              game,
              hand,
              currentTurn,
              roomCode,
              thisPersonId,
            } = consumerData;
            let status = "failure";
            //-------------------------------------------------------

            //                       Game logic

            //-------------------------------------------------------
            if (currentTurn.getCurrentPhase() === "draw") {
              status = "draw";
            }

            if (currentTurn.getCurrentPhase() === "action") {
              currentTurn.proceedToNextPhase(true);
            }

            if (currentTurn.getCurrentPhase() === "discard") {
              let remaining = hand.getCount() - game.getHandMaxCardCount();
              //Have person discard extra cards
              if (remaining > 0) {
                currentTurn.setPhaseData({
                  remainingCountToDiscard: remaining,
                });
              } else {
                // Cards have been discarded
                currentTurn.proceedToNextPhase(true);
                currentTurn.removePhaseData();
              }
            }

            if (currentTurn.getCurrentPhase() === "done") {
              socketResponses.addToBucket(
                "default",
                SUBJECTS.PLAYER_REQUESTS.REMOVE_ALL(makeProps(consumerData))
              );
              socketResponses.addToBucket(
                "default",
                SUBJECTS.REQUESTS.REMOVE_ALL(makeProps(consumerData))
              );
              game.nextPlayerTurn();
              status = "success";
            }

            //-------------------------------------------------------

            //                        Response

            //-------------------------------------------------------
            // Confirm action
            let payload = null;

            // Emit updated player turn
            socketResponses.addToBucket(
              "everyone",
              SUBJECTS["PLAYER_TURN"].GET({ roomCode })
            );

            // If additional data required let player know
            /*
            switch (currentTurn.getCurrentPhase()) {
              case "discard":
                payload = currentTurn.getPhaseData();
                status = "discard";
                break;
              default:
            }
            */
            socketResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );

            if (game.checkWinConditionForPlayer(thisPersonId)) {
              socketResponses.addToBucket(
                "everyone",
                SUBJECTS.GAME.STATUS({ roomCode })
              );
            }

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      DISCARD_REMAINING: (props) => {
        let subject = "MY_TURN";
        let action = "DISCARD_REMAINING";
        let socketResponses = SocketResponseBuckets();
        return myTurnConsumerGood(
          props,
          (props2) => {
            let status = "failure";
            let {
              cardIds,
              game,
              personManager,
              hand,
              currentTurn,
              roomCode,
              thisPersonId,
            } = props2;
            cardIds = els(cardIds, []);

            // Limit the number of cards one can discard
            let hasWildCard = false;
            let wildCardIds = [];
            let temp = [];
            let remainingCountToDiscard =
              hand.getCount() - game.getHandMaxCardCount();
            if (remainingCountToDiscard > 0) {
              for (let i = 0; i < remainingCountToDiscard; ++i) {
                if (isDef(cardIds[i])) {
                  temp.push(cardIds[i]);
                  if (game.doesCardHaveTag(cardIds[i], "wild")) {
                    wildCardIds.push(cardIds[i]);
                    hasWildCard = true;
                  }
                }
              }
            }
            cardIds = temp;

            // Transfer the specified cards to the discard pile
            let giveCards = hand.giveCardsById(cardIds);
            game.getDiscardPile().addCards(giveCards);

            //@TODO repeated code which could be cleaned with PLAYER_TURN.GET
            remainingCountToDiscard =
              hand.getCount() - game.getHandMaxCardCount();

            let payload = null;
            // still remaining cards
            if (remainingCountToDiscard > 0) {
              status = "discard";
              // might be redundant including this data - may be used to trigger animations- undecided
              payload = {
                remainingCountToDiscard,
              };
              //--------------------------------------------------------------------------------------
            } else {
              // Discarded everything required
              status = "success";

              currentTurn.proceedToNextPhase(true);
              currentTurn.removePhaseData();
            }

            if (hasWildCard) {
              socketResponses.addToBucket(
                "everyone",
                SUBJECTS.CARDS.GET_KEYED({ roomCode, cardId: wildCardIds })
              );
            }

            // Update everyone with my new hand
            let allPlayerIds = getAllPlayerIds({ game, personManager });
            socketResponses.addToBucket(
              "default",
              SUBJECTS["PLAYER_HANDS"].GET_KEYED({
                roomCode,
                personId: thisPersonId,
                receivingPeopleIds: allPlayerIds,
              })
            );
            socketResponses.addToBucket(
              "everyone",
              makeResponse({ subject, action, status, payload })
            );
            socketResponses.addToBucket(
              "everyone",
              SUBJECTS["DISCARD_PILE"].GET({ roomCode })
            );
            socketResponses.addToBucket(
              "everyone",
              SUBJECTS["PLAYER_TURN"].GET({ roomCode })
            );

            if (game.checkWinConditionForPlayer(thisPersonId)) {
              socketResponses.addToBucket(
                "everyone",
                SUBJECTS.GAME.STATUS({ roomCode })
              );
            }

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },

      // Property or set augment
      TRANSFER_PROPERTY_TO_NEW_COLLECTION_FROM_COLLECTION: (props) => {
        let subject = "MY_TURN";
        let action = "TRANSFER_PROPERTY_TO_NEW_COLLECTION_FROM_COLLECTION";
        let socketResponses = SocketResponseBuckets();
        let status = "failure";
        return myTurnConsumerGood(
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
                  SUBJECTS["PLAYER_COLLECTIONS"].GET_KEYED({
                    roomCode,
                    personId: thisPersonId,
                  })
                );

                socketResponses.addToBucket(
                  "everyone",
                  SUBJECTS["COLLECTIONS"].GET_KEYED({
                    roomCode,
                    collectionIds: playerManager.getAllCollectionIdsForPlayer(
                      thisPersonId
                    ),
                  })
                );
                socketResponses.addToBucket(
                  "everyone",
                  SUBJECTS["PLAYER_TURN"].GET({ roomCode })
                );
              }
            }

            if (game.checkWinConditionForPlayer(thisPersonId)) {
              socketResponses.addToBucket(
                "everyone",
                SUBJECTS.GAME.STATUS({ roomCode })
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
                SUBJECTS.GAME.STATUS({ roomCode })
              );
            }
            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },

      TRANSFER_PROPERTY_TO_EXISTING_COLLECTION_FROM_COLLECTION: (props) => {
        let subject = "MY_TURN";
        let action = "TRANSFER_PROPERTY_TO_EXISTING_COLLECTION_FROM_COLLECTION";
        let socketResponses = SocketResponseBuckets();
        let status = "failure";
        return myTurnConsumerGood(
          props,
          (consumerData, checkpoints) => {
            //Defind checkpoints which must be reached
            checkpoints.set("cardExists", false);
            checkpoints.set("isMyFromCollection", false);
            checkpoints.set("isMyToCollection", false);
            checkpoints.set("doesCardBelong", false);
            checkpoints.set("cardIsAcceptable", false);

            // Unpack consumerData
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

                  if (
                    beforeAllMyCollectionIds
                      .map(String)
                      .includes(String(toCollectionId))
                  ) {
                    let toCollection = collectionManager.getCollection(
                      toCollectionId
                    );
                    if (isDef(toCollection)) {
                      checkpoints.set("isMyToCollection", true);

                      if (card.type === "property") {
                        checkpoints.set("cardIsAcceptable", true);
                        checkpoints.set("cardExistsInFromCollection", false);

                        checkpoints.set("cardMatchesPropertySet", false);

                        if (fromCollection.hasCard(cardId)) {
                          checkpoints.set("cardExistsInFromCollection", true);

                          let resultFromCollection = game.canAddCardToCollection(
                            card,
                            toCollection
                          );
                          let decidedPropertySetKey =
                            resultFromCollection.newPropertySetKey;
                          let canBeAdded = resultFromCollection.canBeAdded;

                          if (canBeAdded) {
                            checkpoints.set("cardMatchesPropertySet", true);
                            checkpoints.set("doesCardBelong", true);

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
                  socketResponses.addToBucket(
                    "everyone",
                    SUBJECTS["COLLECTIONS"].REMOVE_KEYED({
                      roomCode,
                      personId: thisPersonId,
                      collectionIds: removedCollectionIds,
                    })
                  );
                }

                socketResponses.addToBucket(
                  "everyone",
                  SUBJECTS["PLAYER_COLLECTIONS"].GET_KEYED({
                    roomCode,
                    personId: thisPersonId,
                  })
                );

                socketResponses.addToBucket(
                  "everyone",
                  SUBJECTS["COLLECTIONS"].GET_KEYED({
                    roomCode,
                    collectionIds: playerManager.getAllCollectionIdsForPlayer(
                      thisPersonId
                    ),
                  })
                );

                socketResponses.addToBucket(
                  "everyone",
                  SUBJECTS["PLAYER_TURN"].GET({ roomCode })
                );
              }
            }

            if (game.checkWinConditionForPlayer(thisPersonId)) {
              socketResponses.addToBucket(
                "everyone",
                SUBJECTS.GAME.STATUS({ roomCode })
              );
            }

            // Confirm this executed
            socketResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload: null })
            );

            if (game.checkWinConditionForPlayer(thisPersonId)) {
              socketResponses.addToBucket(
                "everyone",
                SUBJECTS.GAME.STATUS({ roomCode })
              );
            }
            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },

      TRANSFER_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_COLLECTION: (props) => {
        let subject = "MY_TURN";
        let action =
          "TRANSFER_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_COLLECTION";
        let socketResponses = SocketResponseBuckets();
        let status = "failure";
        return myTurnConsumerGood(
          props,
          (consumerData, checkpoints) => {
            //Defind checkpoints which must be reached
            checkpoints.set("cardExists", false);
            checkpoints.set("isMyFromCollection", false);
            checkpoints.set("isMyToCollection", false);
            checkpoints.set("doesCardBelong", false);
            checkpoints.set("cardIsAcceptable", false);

            // Unpack consumerData
            const { fromCollectionId, toCollectionId, cardId } = consumerData;
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

                  if (
                    beforeAllMyCollectionIds
                      .map(String)
                      .includes(String(toCollectionId))
                  ) {
                    let toCollection = collectionManager.getCollection(
                      toCollectionId
                    );
                    if (isDef(toCollection)) {
                      checkpoints.set("isMyToCollection", true);
                      checkpoints.set("isMyFromCollectionHasCard", false);
                      if (fromCollection.hasCard(card)) {
                        checkpoints.set("isMyFromCollectionHasCard", true);
                        if (game.isCardSetAugment(card)) {
                          checkpoints.set("isSetAugmentCard", true);
                          if (game.canApplyAugmentToSet(card, toCollection)) {
                            checkpoints.set("canApplyAugment", true);
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
                            SUBJECTS["COLLECTIONS"].REMOVE_KEYED({
                              roomCode,
                              personId: thisPersonId,
                              collectionIds: removedCollectionIds,
                            })
                          );
                        }

                        socketResponses.addToBucket(
                          "everyone",
                          SUBJECTS["PLAYER_COLLECTIONS"].GET_KEYED({
                            roomCode,
                            personId: thisPersonId,
                          })
                        );

                        socketResponses.addToBucket(
                          "everyone",
                          SUBJECTS["COLLECTIONS"].GET_KEYED({
                            roomCode,
                            collectionIds: playerManager.getAllCollectionIdsForPlayer(
                              thisPersonId
                            ),
                          })
                        );

                        socketResponses.addToBucket(
                          "everyone",
                          SUBJECTS["PLAYER_TURN"].GET({ roomCode })
                        );
                      }
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
                SUBJECTS.GAME.STATUS({ roomCode })
              );
            }
            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },

      TRANSFER_SET_AUGMENT_TO_NEW_COLLECTION_FROM_COLLECTION: (props) => {
        let subject = "MY_TURN";
        let action = "TRANSFER_SET_AUGMENT_TO_NEW_COLLECTION_FROM_COLLECTION";
        let socketResponses = SocketResponseBuckets();
        let status = "failure";
        return myTurnConsumerGood(
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
                          SUBJECTS["COLLECTIONS"].REMOVE_KEYED({
                            roomCode,
                            personId: thisPersonId,
                            collectionIds: removedCollectionIds,
                          })
                        );
                      }

                      socketResponses.addToBucket(
                        "everyone",
                        SUBJECTS["PLAYER_COLLECTIONS"].GET_KEYED({
                          roomCode,
                          personId: thisPersonId,
                        })
                      );

                      socketResponses.addToBucket(
                        "everyone",
                        SUBJECTS["COLLECTIONS"].GET_KEYED({
                          roomCode,
                          collectionIds: playerManager.getAllCollectionIdsForPlayer(
                            thisPersonId
                          ),
                        })
                      );

                      socketResponses.addToBucket(
                        "everyone",
                        SUBJECTS["PLAYER_TURN"].GET({ roomCode })
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
                SUBJECTS.GAME.STATUS({ roomCode })
              );
            }

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },

      TRANSFER_SET_AUGMENT_TO_NEW_COLLECTION_FROM_HAND: (props) => {
        let subject = "MY_TURN";
        let action = "TRANSFER_SET_AUGMENT_TO_NEW_COLLECTION_FROM_HAND";
        let socketResponses = SocketResponseBuckets();
        let status = "failure";
        return myTurnConsumerGood(
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
                        SUBJECTS["COLLECTIONS"].REMOVE_KEYED({
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
                      SUBJECTS["PLAYER_HANDS"].GET_KEYED(
                        specificPropsForEveryone
                      )
                    );

                    // Notify player collections
                    socketResponses.addToBucket(
                      "everyone",
                      SUBJECTS["PLAYER_COLLECTIONS"].GET_KEYED({
                        roomCode,
                        personId: thisPersonId,
                      })
                    );

                    // Notift collection contents
                    socketResponses.addToBucket(
                      "everyone",
                      SUBJECTS["COLLECTIONS"].GET_KEYED({
                        roomCode,
                        collectionIds: playerManager.getAllCollectionIdsForPlayer(
                          thisPersonId
                        ),
                      })
                    );

                    socketResponses.addToBucket(
                      "everyone",
                      SUBJECTS["PLAYER_TURN"].GET({ roomCode })
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
                SUBJECTS.GAME.STATUS({ roomCode })
              );
            }

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
    },
    RESPONSES: {
      RESPOND_TO_COLLECT_VALUE: (props) => {
        let [subject, action] = ["RESPONSES", "RESPOND_TO_COLLECT_VALUE"];
        let socketResponses = SocketResponseBuckets();
        return gameConsumer(
          props,
          (consumerData, checkpoints) => {
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
            let phaseKey = currentTurn.getCurrentPhase();
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

                        let requestPayload = request.getPayload();
                        let transaction = requestPayload.transaction; // assumes is created with request
                        if (isDef(transaction)) {
                          let { amountRemaining } = requestPayload;

                          if (responseKey === "accept") {
                            request.setStatus("accept");
                            let affectedCollections = {};
                            let affectedBank = false;

                            // Pay with bank
                            if (isArr(payWithBank)) {
                              let playerBank = player.getBank();
                              payWithBank.forEach((source) => {
                                let { cardId } = source;

                                if (playerBank.hasCard(cardId)) {
                                  if (amountRemaining > 0) {
                                    let transferBank = transaction
                                      .getOrCreate("toAuthor")
                                      .getOrCreate("bank");
                                    affectedBank = true;

                                    let card = playerBank.getCard(cardId);
                                    let cardValue = card.value;

                                    let affectsValue = false;
                                    if (
                                      [Infinity, "Infinity"].includes(cardValue)
                                    ) {
                                      amountRemaining = 0;
                                      affectsValue = true;
                                    } else {
                                      if (cardValue > 0) {
                                        amountRemaining -= cardValue;
                                        affectsValue = true;
                                      }
                                    }

                                    if (affectsValue) {
                                      playerBank.removeCard(cardId);
                                      transferBank.add(cardId);
                                    }
                                  }
                                }
                              });
                            }

                            // Pay with property
                            if (isArr(payWithProperty)) {
                              let collectionManager = game.getCollectionManager();
                              payWithProperty.forEach((source) => {
                                let { collectionId, cardId } = source;

                                // required data defiend
                                if (isDef(collectionId) && isDef(cardId)) {
                                  if (player.hasCollectionId(collectionId)) {
                                    let collection = collectionManager.getCollection(
                                      collectionId
                                    );

                                    if (collection.hasCard(cardId)) {
                                      let transferProperty = transaction
                                        .getOrCreate("toAuthor")
                                        .getOrCreate("property");
                                      // is valid card in collection
                                      let card = collection.getCard(cardId);
                                      let cardValue = getNestedValue(
                                        card,
                                        "value",
                                        0
                                      );

                                      let affectsValue = false;
                                      if (
                                        [Infinity, "Infinity"].includes(
                                          cardValue
                                        )
                                      ) {
                                        amountRemaining = 0;
                                        affectsValue = true;
                                      } else {
                                        if (cardValue > 0) {
                                          amountRemaining -= cardValue;
                                          affectsValue = true;
                                        }
                                      }
                                      //card has a value
                                      if (affectsValue) {
                                        collection.removeCard(cardId);
                                        game.cleanUpFromCollection(
                                          thisPersonId,
                                          collection
                                        );
                                        transferProperty.add(card.id);
                                        affectedCollections[
                                          collection.getId()
                                        ] = true;
                                      }
                                    }
                                  }
                                }
                              });
                            }

                            if (amountRemaining <= 0) {
                              status = "success";
                            } else {
                              //player has nothing on the table
                              let hasProperties =
                                player.getAllCollectionIds().length > 0;
                              let hasBank =
                                player.getBank().getTotalValue() > 0;
                              if (!hasProperties && !hasBank) {
                                status = "success";
                              }
                            }

                            if (status === "success") {
                              request.setTargetSatisfied(true);
                              request.accept(consumerData);
                            }

                            // If bank was affected emit updates
                            if (affectedBank) {
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
                                SUBJECTS["PLAYER_BANKS"].GET_KEYED(
                                  makeProps(consumerData, {
                                    peopleIds: thisPersonId,
                                    receivingPeopleIds: peopleIds,
                                  })
                                )
                              );
                            }

                            // If collections were affected emit updates
                            let affectedCollectionIds = Object.keys(
                              affectedCollections
                            );

                            if (affectedCollectionIds.length > 0) {
                              let collectionChanges = {
                                updated: [],
                                removed: [],
                              };

                              affectedCollectionIds.forEach((collectionId) => {
                                if (player.hasCollectionId(collectionId)) {
                                  collectionChanges.updated.push(collectionId);
                                } else {
                                  collectionChanges.removed.push(collectionId);
                                }
                              });

                              // Add updated collections to be GET
                              if (collectionChanges.updated.length > 0) {
                                socketResponses.addToBucket(
                                  "everyone",
                                  SUBJECTS["COLLECTIONS"].GET_KEYED(
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
                                  SUBJECTS["COLLECTIONS"].REMOVE_KEYED(
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
                              SUBJECTS.PLAYER_REQUESTS.GET_KEYED(
                                makeProps(consumerData, {
                                  personId: thisPersonId,
                                })
                              )
                            );
                            socketResponses.addToBucket(
                              "everyone",
                              SUBJECTS.REQUESTS.GET_KEYED(
                                makeProps(consumerData, {
                                  requestId: request.getId(),
                                })
                              )
                            );
                            socketResponses.addToBucket(
                              "everyone",
                              SUBJECTS.PLAYER_TURN.GET(makeProps(consumerData))
                            );
                          } // end accept
                          else if (responseKey === "decline") {
                            request.setStatus("decline");

                            let hand = game.getPlayerHand(thisPersonId);
                            checkpoints.set("isCardInHand", false);

                            if (hand.hasCard(cardId)) {
                              checkpoints.set("isCardInHand", true);

                              //can the card decline the request
                              if (
                                game.doesCardHaveTag(cardId, "declineRequest")
                              ) {
                                let affected = {
                                  hand: false,
                                  requests: false,
                                };
                                let affectedIds = {
                                  requests: [],
                                  playerRequests: [],
                                  collections: [],
                                  playerCollections: [],
                                };

                                game
                                  .getActivePile()
                                  .addCard(
                                    game
                                      .getPlayerHand(thisPersonId)
                                      .giveCard(cardId)
                                  );
                                affected.hand = true;

                                affected.activePile = true;
                                let doTheDecline = function ({
                                  affected,
                                  affectedIds,
                                  request,
                                  checkpoints,
                                }) {
                                  let requestPayload = request.getPayload();
                                  let transaction = requestPayload.transaction;
                                  let done = transaction
                                    .getOrCreate("done")
                                    .getOrCreate("done");
                                  done.add("done");
                                  done.confirm("done");
                                  checkpoints.set("success", true);
                                  request.setTargetSatisfied(true);
                                  request.decline(consumerData);
                                  request.close("decline");
                                  affected.requests = true;
                                  affectedIds.requests.push(request.getId());
                                };

                                if (
                                  game.doesCardHaveTag(cardId, "contestable")
                                ) {
                                  //let augmentRequest = function(){
                                  //
                                  //}

                                  let sayNoRequest = requestManager.makeJustSayNo(
                                    request,
                                    cardId
                                  );
                                  affectedIds.requests.push(
                                    sayNoRequest.getId()
                                  );
                                  affectedIds.playerRequests.push(
                                    sayNoRequest.getTargetKey()
                                  );

                                  doTheDecline({
                                    request,
                                    affected,
                                    affectedIds,
                                    checkpoints,
                                  });
                                } else {
                                  doTheDecline({
                                    request,
                                    affected,
                                    affectedIds,
                                    checkpoints,
                                  });
                                }

                                let allPlayerIds = getAllPlayerIds({
                                  game,
                                  personManager,
                                });
                                socketResponses.addToBucket(
                                  "default",
                                  SUBJECTS["PLAYER_HANDS"].GET_KEYED(
                                    makeProps(consumerData, {
                                      personId: thisPersonId,
                                      receivingPeopleIds: allPlayerIds,
                                    })
                                  )
                                );
                                if (affected.activePile) {
                                  socketResponses.addToBucket(
                                    "everyone",
                                    SUBJECTS.ACTIVE_PILE.GET(
                                      makeProps(consumerData)
                                    )
                                  );
                                }

                                if (affected.hand) {
                                  let allPlayerIds = getAllPlayerIds({
                                    game,
                                    personManager,
                                  });
                                  socketResponses.addToBucket(
                                    "default",
                                    SUBJECTS["PLAYER_HANDS"].GET_KEYED(
                                      makeProps(consumerData, {
                                        personId: thisPersonId,
                                        receivingPeopleIds: allPlayerIds,
                                      })
                                    )
                                  );
                                }
                                if (
                                  affected.collections &&
                                  affectedIds.collections.length > 0
                                ) {
                                  socketResponses.addToBucket(
                                    "everyone",
                                    SUBJECTS["COLLECTIONS"].GET_KEYED(
                                      makeProps(consumerData, {
                                        collectionIds: affectedIds.collections,
                                      })
                                    )
                                  );
                                }

                                if (
                                  affected.playerCollections &&
                                  affectedIds.playerCollections.length > 0
                                ) {
                                  // Update who has what collection
                                  socketResponses.addToBucket(
                                    "everyone",
                                    SUBJECTS["PLAYER_COLLECTIONS"].GET_KEYED(
                                      makeProps(consumerData, {
                                        peopleIds:
                                          affectedIds.playerCollections,
                                      })
                                    )
                                  );
                                }

                                if (
                                  affected.requests &&
                                  affectedIds.requests.length > 0
                                ) {
                                  socketResponses.addToBucket(
                                    "everyone",
                                    SUBJECTS.PLAYER_REQUESTS.GET_KEYED(
                                      makeProps(consumerData, {
                                        peopleIds: affectedIds.playerRequests,
                                      })
                                    )
                                  );
                                  socketResponses.addToBucket(
                                    "everyone",
                                    SUBJECTS.REQUESTS.GET_KEYED(
                                      makeProps(consumerData, {
                                        requestIds: affectedIds.requests,
                                      })
                                    )
                                  );
                                }
                                socketResponses.addToBucket(
                                  "everyone",
                                  SUBJECTS.PLAYER_TURN.GET(
                                    makeProps(consumerData)
                                  )
                                );
                              }
                            }
                          } // end decline
                        }
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
                SUBJECTS.GAME.STATUS({ roomCode })
              );
            }

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      COLLECT_CARD_TO_BANK_AUTO: (props) => {
        let doTheThing = function (consumerData) {
          let {
            affected,
            playerBank,
            transfering,
            checkpoints,
            thisPersonId,
            roomCode,
            socketResponses,
            game,
          } = consumerData;
          if (transfering.has("bank")) {
            transfering
              .get("bank")
              .getRemainingList()
              .forEach((cardId) => {
                playerBank.addCard(cardId);
                transfering.get("bank").confirm(cardId);
              });

            affected.requests = true;
            affected.bank = true;
            checkpoints.set("success", true);

            if (game.checkWinConditionForPlayer(thisPersonId)) {
              socketResponses.addToBucket(
                "everyone",
                SUBJECTS.GAME.STATUS({ roomCode })
              );
            }
          }
        };
        return handleTransferResponse(
          "RESPONSES",
          "COLLECT_CARD_TO_BANK_AUTO",
          props,
          doTheThing
        );
      },
      ACKNOWLEDGE_COLLECT_NOTHING: (props) => {
        let doTheThing = function (consumerData) {
          let { affected, checkpoints } = consumerData;
          affected.requests = true;
          affected.bank = true;
          checkpoints.set("success", true);
        };

        return handleTransactionResponse(
          "RESPONSES",
          "ACKNOWLEDGE_COLLECT_NOTHING",
          props,
          doTheThing
        );
      },
      COLLECT_CARD_TO_BANK: (props) => {
        let doTheThing = function (consumerData) {
          let { cardId } = consumerData;
          let { affected, playerBank, transfering, checkpoints } = consumerData;
          if (transfering.has("bank")) {
            let cardExists = transfering
              .get("bank")
              .getRemainingList()
              .includes(cardId);
            if (cardExists) {
              playerBank.addCard(cardId);
              transfering.get("bank").confirm(cardId);
            }

            affected.requests = true;
            affected.bank = true;
            checkpoints.set("success", true);
          }
        };

        return handleTransferResponse(
          "RESPONSES",
          "COLLECT_CARD_TO_BANK",
          props,
          doTheThing
        );
      },
      COLLECT_CARD_TO_COLLECTION: (props) => {
        let doTheThing = function (consumerData) {
          let { cardId, requestId, collectionId } = consumerData;
          let {
            affected,
            affectedIds,
            transfering,
            checkpoints,
            game,
            thisPersonId,
            player,
            roomCode,
            socketResponses,
          } = consumerData;
          let playerManager = game.getPlayerManager();
          let status = "failure";

          // if card is in list of transfer cards and has not already been processed
          checkpoints.set("isValidTransferCard", false);
          if (transfering.has("property")) {
            let transferPropertiesToMe = transfering.get("property");
            let cardIds = transferPropertiesToMe.getRemainingList();
            if (cardIds.includes(cardId)) {
              checkpoints.set("isValidTransferCard", true);

              let card = game.getCard(cardId);
              let collection;

              // If my collection is specified to transfer to
              if (isDef(collectionId)) {
                checkpoints.set("isMyCollection", false);
                if (player.hasCollectionId(collectionId)) {
                  checkpoints.set("isMyCollection", true);

                  let transformCollection = game.canAddCardToCollection(
                    cardId,
                    collectionId
                  );
                  let decidedPropertySetKey =
                    transformCollection.newPropertySetKey;
                  let canBeAdded = transformCollection.canBeAdded;

                  if (canBeAdded) {
                    collection = game
                      .getCollectionManager()
                      .getCollection(collectionId);
                    if (
                      collection.getPropertySetKey() !== decidedPropertySetKey
                    ) {
                      collection.setPropertySetKey(decidedPropertySetKey);
                    }
                    collection.addCard(cardId);
                    transferPropertiesToMe.confirm(cardId);
                    status = "success";
                  }
                  // if is augment card and cannot be placed in specified set, add to junk set
                  else if (game.isCardSetAugment(card)) {
                    collection = game.getOrCreateUselessCollectionForPlayer(
                      thisPersonId
                    );
                    collection.addCard(cardId);
                    transferPropertiesToMe.confirm(cardId);
                    status = "success";
                  }
                }
              } else {
                collection = playerManager.createNewCollectionForPlayer(
                  thisPersonId
                );
                collection.addCard(cardId);
                transferPropertiesToMe.confirm(cardId);
                status = "success";
              }

              if (isDef(collection) && status === "success") {
                affected.requests = true;
                affectedIds.requests.push(requestId);

                affected.collections = true;

                affected.playerCollections = true;
                affectedIds.collections.push(collection.getId());
                affectedIds.playerCollections.push(collection.getPlayerKey());

                checkpoints.set("success", true);

                if (game.checkWinConditionForPlayer(thisPersonId)) {
                  socketResponses.addToBucket(
                    "everyone",
                    SUBJECTS.GAME.STATUS({ roomCode })
                  );
                }
              }
            }
          }
        };

        let result = handleTransferResponse(
          "RESPONSES",
          "COLLECT_CARD_TO_COLLECTION",
          props,
          doTheThing
        );
        return result;
      },

      COLLECT_COLLECTION: (props) => {
        let doTheThing = function (consumerData) {
          let { requestId } = consumerData;
          let {
            affected,
            affectedIds,
            transfering,
            checkpoints,
            game,
            thisPersonId,
            roomCode,
            socketResponses,
          } = consumerData;
          let playerManager = game.getPlayerManager();

          // if card is in list of transfer cards and has not already been processed
          checkpoints.set("isValidTransferCard", false);
          if (transfering.has("collection")) {
            let transferToMe = transfering.get("collection");
            let collectionIds = transferToMe.getRemainingList();

            collectionIds.forEach((collectionId) => {
              let collection = game
                .getCollectionManager()
                .getCollection(collectionId);
              if (isDef(collection)) {
                // should already be dissacoated but make sure
                playerManager.disassociateCollectionFromPlayer(collectionId);

                //add to new player
                playerManager.associateCollectionToPlayer(
                  collectionId,
                  thisPersonId
                );
                transferToMe.confirm(collectionId);

                checkpoints.set("success", true);
                affected.requests = true;
                affectedIds.requests.push(requestId);

                affected.collections = true;
                affectedIds.collections.push(collection.getId());

                affected.playerCollections = true;
                affectedIds.playerCollections.push(collection.getPlayerKey());
              }
            });

            if (game.checkWinConditionForPlayer(thisPersonId)) {
              socketResponses.addToBucket(
                "everyone",
                SUBJECTS.GAME.STATUS({ roomCode })
              );
            }
          }
        };

        let result = handleTransferResponse(
          "RESPONSES",
          "COLLECT_COLLECTION",
          props,
          doTheThing
        );
        return result;
      },

      RESPOND_TO_PROPERTY_SWAP: (props) => {
        let doTheThing = function (consumerData) {
          let { cardId, requestId, responseKey } = consumerData;
          let {
            affected,
            affectedIds,
            checkpoints,
            game,
            thisPersonId,
          } = consumerData;

          let validResponses = {
            accept: 1,
            decline: 1,
          };

          let currentTurn = game.getCurrentTurn();
          let requestManager = currentTurn.getRequestManager();

          let request = requestManager.getRequest(requestId);

          if (
            isDef(request) &&
            !request.getTargetSatisfied() &&
            request.getTargetKey() === thisPersonId &&
            request.getType() === "swapProperty"
          ) {
            checkpoints.set("isValidResponseKey", false);
            if (isDef(responseKey) && isDef(validResponses[responseKey])) {
              checkpoints.set("isValidResponseKey", true);
              let { transaction } = request.getPayload();

              checkpoints.set("isTransactionDefined", false);
              if (isDef(transaction)) {
                checkpoints.set("isTransactionDefined", true);

                if (responseKey === "decline") {
                  let hand = game.getPlayerHand(thisPersonId);
                  checkpoints.set("isCardInHand", false);
                  if (hand.hasCard(cardId)) {
                    checkpoints.set("isCardInHand", true);

                    //can the card decline the request
                    if (game.doesCardHaveTag(cardId, "declineRequest")) {
                      game
                        .getActivePile()
                        .addCard(
                          game.getPlayerHand(thisPersonId).giveCard(cardId)
                        );
                      affected.hand = true;
                      affected.activePile = true;

                      let doTheDecline = function ({
                        affected,
                        affectedIds,
                        request,
                        checkpoints,
                      }) {
                        let { transaction } = request.getPayload();
                        let fromAuthor = transaction
                          .get("fromAuthor")
                          .get("property");
                        fromAuthor.confirm(fromAuthor.getRemainingList());

                        let fromTarget = transaction
                          .get("fromTarget")
                          .get("property");
                        fromTarget.confirm(fromTarget.getRemainingList());

                        checkpoints.set("success", true);

                        request.setTargetSatisfied(true);
                        request.decline(consumerData);
                        request.close("decline");
                        affected.requests = true;
                        affectedIds.requests.push(requestId);
                      };

                      if (game.doesCardHaveTag(cardId, "contestable")) {
                        let sayNoRequest = requestManager.makeJustSayNo(
                          request,
                          cardId
                        );
                        affectedIds.requests.push(sayNoRequest.getId());
                        affectedIds.playerRequests.push(
                          sayNoRequest.getTargetKey()
                        );

                        doTheDecline({
                          request,
                          affected,
                          affectedIds,
                          checkpoints,
                        });
                      } else {
                        doTheDecline({
                          request,
                          affected,
                          affectedIds,
                          checkpoints,
                        });
                      }
                    }
                  }
                } else {
                  if (responseKey === "accept") {
                    // Move proposed properties to their colleciton areas
                    let authorPropertyIds = transaction
                      .get("fromAuthor")
                      .get("property")
                      .getRemainingList();

                    authorPropertyIds.forEach((authorPropertyId) => {
                      let collection = game.getCollectionThatHasCard(
                        authorPropertyId
                      );
                      if (isDef(collection)) {
                        collection.removeCard(authorPropertyId);
                        transaction
                          .get("fromAuthor")
                          .get("property")
                          .confirm(authorPropertyId);
                        game.cleanUpFromCollection(
                          collection.getPlayerKey(),
                          collection
                        );
                        transaction
                          .getOrCreate("toTarget")
                          .getOrCreate("property")
                          .add(authorPropertyId);

                        affected.collections = true;
                        affectedIds.collections.push(collection.getId());
                        affected.playerCollections = true;
                        affectedIds.playerCollections.push(
                          collection.getPlayerKey()
                        );
                      }
                    });

                    let targetPropertyIds = transaction
                      .get("fromTarget")
                      .get("property")
                      .getRemainingList();
                    targetPropertyIds.forEach((targetPropertyId) => {
                      let collection = game.getCollectionThatHasCard(
                        targetPropertyId
                      );
                      if (isDef(collection)) {
                        collection.removeCard(targetPropertyId);
                        transaction
                          .get("fromTarget")
                          .get("property")
                          .confirm(targetPropertyId);
                        game.cleanUpFromCollection(
                          collection.getPlayerKey(),
                          collection
                        );
                        transaction
                          .getOrCreate("toAuthor")
                          .getOrCreate("property")
                          .add(targetPropertyId);

                        affected.collections = true;
                        affectedIds.collections.push(collection.getId());
                        affected.playerCollections = true;
                        affectedIds.playerCollections.push(
                          collection.getPlayerKey()
                        );
                      }
                    });

                    request.setTargetSatisfied(true);
                    request.setStatus("accept");
                    request.accept(consumerData);
                    affected.requests = true;
                    affectedIds.requests.push(requestId);
                    checkpoints.set("success", true);
                  }
                }
              }
            }
          }
        };

        let result = handleTransactionResponse(
          "RESPONSES",
          "RESPOND_TO_PROPERTY_SWAP",
          props,
          doTheThing
        );
        return result;
      },

      TEST_NO: (props) => {
        let [subject, action] = ["RESPONSES", "TEST_NO"];
        let socketResponses = SocketResponseBuckets();
        return gameConsumer(
          props,
          (consumerData, checkpoints) => {
            let {
              requestId,
              responseKey,
              payWithProperty,
              payWithBank,
            } = consumerData;
            let { game, personManager, thisPersonId } = consumerData;

            let status = "failure";
            let paylaod = null;
            socketResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );
            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },

      RESPOND_TO_JUST_SAY_NO: (props) => {
        let doTheThing = function (consumerData) {
          let { cardId, requestId, responseKey } = consumerData;
          let {
            affected,
            affectedIds,
            checkpoints,
            game,
            thisPersonId,
          } = consumerData;

          let validResponses = {
            accept: 1,
            decline: 1,
          };

          let currentTurn = game.getCurrentTurn();
          let requestManager = currentTurn.getRequestManager();
          let request = requestManager.getRequest(requestId);

          if (
            isDef(request) &&
            !request.getTargetSatisfied() &&
            request.getTargetKey() === thisPersonId &&
            request.getType() === "justSayNo"
          ) {
            checkpoints.set("isValidResponseKey", false);
            if (isDef(responseKey) && isDef(validResponses[responseKey])) {
              checkpoints.set("isValidResponseKey", true);

              checkpoints.set("success", false);

              switch (responseKey) {
                case "accept":
                  request.accept(consumerData);

                  request.setTargetSatisfied(true);
                  request.close(responseKey);
                  affected.requests = true;
                  affectedIds.requests.push(request.getId());
                  checkpoints.set("success", true);

                  break;
                case "decline":
                  if (game.doesCardHaveTag(cardId, "declineRequest")) {
                    game
                      .getActivePile()
                      .addCard(
                        game.getPlayerHand(thisPersonId).giveCard(cardId)
                      );
                    affected.hand = true;
                    affected.activePile = true;

                    let doTheDecline = function ({
                      request,
                      affected,
                      affectedIds,
                    }) {
                      request.decline(consumerData);
                      request.setTargetSatisfied(true);
                      request.close(responseKey);
                      affected.requests = true;
                      affected.requests = true;
                      affectedIds.requests.push(request.getId());
                    };
                    doTheDecline({
                      request,
                      affected,
                      affectedIds,
                      checkpoints,
                    });

                    checkpoints.set("success", true);
                  }
                  break;
                default:
              }
            }
          }
        };

        let result = handleTransactionResponse(
          "RESPONSES",
          "RESPOND_TO_JUST_SAY_NO",
          props,
          doTheThing
        );
        return result;
      },

      RESPOND_TO_STEAL_PROPERTY: (props) => {
        let doTheThing = function (consumerData) {
          let { cardId, requestId, responseKey } = consumerData;
          let {
            affected,
            affectedIds,
            checkpoints,
            game,
            thisPersonId,
          } = consumerData;

          let validResponses = {
            accept: 1,
            decline: 1,
          };

          let currentTurn = game.getCurrentTurn();
          let requestManager = currentTurn.getRequestManager();

          let request = requestManager.getRequest(requestId);

          if (
            isDef(request) &&
            !request.getTargetSatisfied() &&
            request.getTargetKey() === thisPersonId &&
            request.getType() === "stealProperty"
          ) {
            checkpoints.set("isValidResponseKey", false);
            if (isDef(responseKey) && isDef(validResponses[responseKey])) {
              checkpoints.set("isValidResponseKey", true);
              let { transaction } = request.getPayload();

              checkpoints.set("isTransactionDefined", false);
              if (isDef(transaction)) {
                checkpoints.set("isTransactionDefined", true);

                if (responseKey === "decline") {
                  let hand = game.getPlayerHand(thisPersonId);
                  checkpoints.set("isCardInHand", false);
                  if (hand.hasCard(cardId)) {
                    checkpoints.set("isCardInHand", true);

                    //can the card decline the request
                    if (game.doesCardHaveTag(cardId, "declineRequest")) {
                      game.getActivePile().addCard(hand.giveCard(cardId));
                      affected.activePile = true;
                      affected.hand = true;

                      let doTheDecline = function ({
                        affected,
                        affectedIds,
                        request,
                        checkpoints,
                      }) {
                        let { transaction } = request.getPayload();
                        let fromTarget = transaction
                          .get("fromTarget")
                          .get("property");
                        fromTarget.confirm(fromTarget.getRemainingList());
                        checkpoints.set("success", true);
                        request.setTargetSatisfied(true);
                        request.decline(consumerData);
                        request.close("decline");
                        affected.requests = true;
                        affectedIds.requests.push(request.getId());
                      };

                      if (game.doesCardHaveTag(cardId, "contestable")) {
                        let sayNoRequest = requestManager.makeJustSayNo(
                          request,
                          cardId
                        );
                        affectedIds.requests.push(sayNoRequest.getId());
                        affectedIds.playerRequests.push(
                          sayNoRequest.getTargetKey()
                        );

                        doTheDecline({
                          request,
                          affected,
                          affectedIds,
                          checkpoints,
                        });
                      } else {
                        doTheDecline({
                          request,
                          affected,
                          affectedIds,
                          checkpoints,
                        });
                      }
                    }
                  }
                } else {
                  if (responseKey === "accept") {
                    // Move proposed properties to their colleciton areas

                    let targetPropertyIds = transaction
                      .get("fromTarget")
                      .get("property")
                      .getRemainingList();
                    targetPropertyIds.forEach((targetPropertyId) => {
                      let collection = game.getCollectionThatHasCard(
                        targetPropertyId
                      );
                      if (isDef(collection)) {
                        collection.removeCard(targetPropertyId);
                        transaction
                          .get("fromTarget")
                          .get("property")
                          .confirm(targetPropertyId);
                        game.cleanUpFromCollection(
                          collection.getPlayerKey(),
                          collection
                        );
                        transaction
                          .getOrCreate("toAuthor")
                          .getOrCreate("property")
                          .add(targetPropertyId);

                        affected.collections = true;
                        affectedIds.collections.push(collection.getId());
                        affected.playerCollections = true;
                        affectedIds.playerCollections.push(
                          collection.getPlayerKey()
                        );
                      }
                    });

                    request.setTargetSatisfied(true);
                    request.accept(consumerData);
                    request.setStatus("accept");
                    affected.requests = true;
                    affectedIds.requests.push(requestId);
                    checkpoints.set("success", true);
                  }
                }
              }
            }
          }
        };

        let result = handleTransactionResponse(
          "RESPONSES",
          "RESPOND_TO_STEAL_PROPERTY",
          props,
          doTheThing
        );
        return result;
      },

      RESPOND_TO_STEAL_COLLECTION: (props) => {
        let doTheThing = function (consumerData) {
          let { cardId, requestId, responseKey } = consumerData;
          let {
            affected,
            affectedIds,
            checkpoints,
            game,
            thisPersonId,
          } = consumerData;

          let validResponses = {
            accept: 1,
            decline: 1,
          };

          let currentTurn = game.getCurrentTurn();
          let requestManager = currentTurn.getRequestManager();

          let request = requestManager.getRequest(requestId);

          if (
            isDef(request) &&
            !request.getTargetSatisfied() &&
            request.getTargetKey() === thisPersonId &&
            request.getType() === "stealCollection"
          ) {
            checkpoints.set("isValidResponseKey", false);
            if (isDef(responseKey) && isDef(validResponses[responseKey])) {
              checkpoints.set("isValidResponseKey", true);
              let { transaction } = request.getPayload();

              checkpoints.set("isTransactionDefined", false);
              if (isDef(transaction)) {
                checkpoints.set("isTransactionDefined", true);
                if (responseKey === "decline") {
                  let hand = game.getPlayerHand(thisPersonId);
                  checkpoints.set("isCardInHand", false);

                  if (hand.hasCard(cardId)) {
                    checkpoints.set("isCardInHand", true);

                    //can the card decline the request
                    if (game.doesCardHaveTag(cardId, "declineRequest")) {
                      game.getActivePile().addCard(hand.giveCard(cardId));
                      affected.hand = true;
                      affected.activePile = true;

                      let doTheDecline = function ({
                        affected,
                        affectedIds,
                        request,
                        checkpoints,
                      }) {
                        let { transaction } = request.getPayload();
                        let fromTarget = transaction
                          .get("fromTarget")
                          .get("collection");
                        fromTarget.confirm(fromTarget.getRemainingList());
                        checkpoints.set("success", true);
                        request.setTargetSatisfied(true);
                        request.decline(consumerData);
                        request.close("decline");
                        affected.requests = true;
                        affectedIds.requests.push(request.getId());
                      };

                      if (game.doesCardHaveTag(cardId, "contestable")) {
                        let sayNoRequest = requestManager.makeJustSayNo(
                          request,
                          cardId
                        );
                        affectedIds.requests.push(sayNoRequest.getId());
                        affectedIds.playerRequests.push(
                          sayNoRequest.getTargetKey()
                        );

                        doTheDecline({
                          request,
                          affected,
                          affectedIds,
                          checkpoints,
                        });
                      } else {
                        doTheDecline({
                          request,
                          affected,
                          affectedIds,
                          checkpoints,
                        });
                      }
                    }
                  }
                } else {
                  if (responseKey === "accept") {
                    // Move proposed properties to their colleciton areas

                    let targetIds = transaction
                      .get("fromTarget")
                      .get("collection")
                      .getRemainingList();

                    targetIds.forEach((collectionId) => {
                      let collection = game
                        .getCollectionManager()
                        .getCollection(collectionId);
                      if (isDef(collection)) {
                        game
                          .getPlayerManager()
                          .disassociateCollectionFromPlayer(collection);

                        transaction
                          .get("fromTarget")
                          .get("collection")
                          .confirm(collectionId);
                        transaction
                          .getOrCreate("toAuthor")
                          .getOrCreate("collection")
                          .add(collectionId);

                        affected.collections = true;
                        affectedIds.collections.push(collection.getId());
                        affected.playerCollections = true;
                        affectedIds.playerCollections.push(
                          collection.getPlayerKey()
                        );
                      }
                    });

                    request.setTargetSatisfied(true);
                    request.accept(consumerData);
                    request.setStatus("accept");
                    affected.requests = true;
                    affectedIds.requests.push(requestId);
                    checkpoints.set("success", true);
                  }
                }
              }
            }
          }
        };

        let result = handleTransactionResponse(
          "RESPONSES",
          "RESPOND_TO_STEAL_COLLECTION",
          props,
          doTheThing
        );
        return result;
      },
    },
    GAME: {
      /**
       * @PROPS {String} roomCode
       */
      GET_UPDATED_PILES: (props) => {
        const { roomCode } = props;

        let socketResponses = SocketResponseBuckets();
        if (isDef(roomCode)) {
          socketResponses.addToBucket(
            "default",
            SUBJECTS["DRAW_PILE"].GET({ roomCode })
          );

          socketResponses.addToBucket(
            "default",
            SUBJECTS["DISCARD_PILE"].GET({ roomCode })
          );

          socketResponses.addToBucket(
            "default",
            SUBJECTS["ACTIVE_PILE"].GET({ roomCode })
          );
        }
        return socketResponses;
      },

      RESET: (props) => {
        let [subject, action] = ["GAME", "RESET"];
        let socketResponses = SocketResponseBuckets();
        return roomConsumer(
          props,
          ({ room }) => {
            let status = "success";
            let payload = null;

            createGameInstance(room);

            socketResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );

            return socketResponses;
          },
          socketResponses
        );
      },

      UPDATE_CONFIG: (props) => {
        let [subject, action] = ["GAME", "UPDATE_CONFIG"];
        let payload = null;
        let status = "failure";
        let socketResponses = SocketResponseBuckets();
        return personConsumer(
          props,
          (consumerData, checkpoints) => {
            const { config } = consumerData;
            const { roomCode, game } = consumerData;

            // Only alter config before the game has started
            checkpoints.set("gameHasNotYetStarted", false);
            if (!game.isGameStarted()) {
              checkpoints.set("gameHasNotYetStarted", true);
              if (isDef(config)) {
                status = "success";
                game.updateConfig(config);
              }
            }
            socketResponses.addToBucket(
              "default",
              SUBJECTS.GAME.GET_CONFIG({ roomCode })
            );
            socketResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },

      GET_CONFIG: (props) => {
        let [subject, action] = ["GAME", "GET_CONFIG"];
        let payload = null;
        let status = "failure";
        let socketResponses = SocketResponseBuckets();
        return personConsumer(
          props,
          (consumerData) => {
            const { game } = consumerData;

            status = "success";
            payload = {
              updatedConfig: game.getConfig(),
            };

            socketResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },

      STATUS: (props) => {
        // roomCode
        let [subject, action] = ["GAME", "STATUS"];
        let socketResponses = SocketResponseBuckets();
        return personConsumer(
          props,
          (props2) => {
            let { game } = props2;
            let isGameStarted = game.isGameStarted();
            let isGameOver = game.isGameOver();
            let isInProgress = isGameStarted && !isGameOver;
            let winningCondition = game.getWinningCondition();

            let status = "success";
            let payload = {
              isGameStarted,
              isInProgress,
              isGameOver,
              winningCondition: winningCondition,
            };
            socketResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );
            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },

      START: (props) => {
        let [subject, action] = ["GAME", "START"];
        let socketResponses = SocketResponseBuckets();
        return personConsumer(
          props,
          (props2) => {
            let { roomCode, personManager, thisPerson, game } = props2;
            let canStart = canGameStart(game, personManager);
            if (thisPerson.hasTag("host") && canStart) {
              // Find the people in the room who are ready
              let attendingPeople = personManager.filterPeople(
                (person) =>
                  person.isConnected() && person.getStatus() === "ready"
              );

              // Add players to game from list of people
              attendingPeople.forEach((person) => {
                game.createPlayer(person.getId());
              });

              // Initialize game
              game.startGame();
              game.nextPlayerTurn();

              // broadcast initial game data
              let peopleIds = attendingPeople.map((person) => person.getId());
              let specificPropsForEveryone = {
                roomCode,
                peopleIds: peopleIds,
                receivingPeopleIds: peopleIds,
              };
              socketResponses.addToBucket(
                "everyone",
                SUBJECTS["PROPERTY_SETS"].GET_ALL_KEYED({ roomCode })
              );
              socketResponses.addToBucket(
                "everyone",
                SUBJECTS["PLAYERS"].GET({ roomCode })
              );
              socketResponses.addToBucket(
                "everyone",
                SUBJECTS["CARDS"].GET_ALL_KEYED({ roomCode })
              );
              socketResponses.addToBucket(
                "default",
                SUBJECTS["PLAYER_HANDS"].GET_KEYED(specificPropsForEveryone)
              );
              socketResponses.addToBucket(
                "default",
                SUBJECTS["PLAYER_BANKS"].GET_KEYED(specificPropsForEveryone)
              );
              socketResponses.addToBucket(
                "everyone",
                SUBJECTS["COLLECTIONS"].GET_ALL_KEYED({
                  roomCode,
                  peopleIds: peopleIds,
                })
              );
              socketResponses.addToBucket(
                "everyone",
                SUBJECTS["PLAYER_COLLECTIONS"].GET_ALL_KEYED({
                  roomCode,
                  peopleIds: peopleIds,
                })
              );
              socketResponses.addToBucket(
                "everyone",
                SUBJECTS["DRAW_PILE"].GET({ roomCode })
              );
              socketResponses.addToBucket(
                "everyone",
                SUBJECTS["ACTIVE_PILE"].GET({ roomCode })
              );

              socketResponses.addToBucket(
                "everyone",
                SUBJECTS["DISCARD_PILE"].GET({ roomCode })
              );

              socketResponses.addToBucket(
                "everyone",
                SUBJECTS["GAME"].STATUS({ roomCode })
              );

              socketResponses.addToBucket(
                "everyone",
                makeResponse({
                  subject,
                  action,
                  status: "success",
                  payload: null,
                })
              );
              socketResponses.addToBucket(
                "everyone",
                SUBJECTS["PLAYER_TURN"].GET({ roomCode })
              );
            }
            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      CAN_START: (props) => {
        // roomCode
        let [subject, action] = ["GAME", "CAN_START"];
        let socketResponses = SocketResponseBuckets();
        return personConsumer(
          props,
          (props2) => {
            let { game, personManager } = props2;

            let canStart = canGameStart(game, personManager);
            let host = personManager.findPerson((person) =>
              person.hasTag("host")
            );
            if (isDef(host)) {
              let status = "success";
              let payload = {
                value: canStart,
              };
              socketResponses.addToSpecific(
                host.getClientId(),
                makeResponse({ subject, action, status, payload })
              );
            }
            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
    },
    PROPERTY_SETS: {
      GET_KEYED: (props) => {
        let subject = "PROPERTY_SETS";
        let action = "GET_KEYED";
        let socketResponses = SocketResponseBuckets();
        return gameConsumer(
          props,
          (consumerData) => {
            let { game, logging } = consumerData;

            let myKeyedRequest = KeyedRequest();
            myKeyedRequest.setAction(action);
            myKeyedRequest.setSubject(subject);
            myKeyedRequest.setLogging(logging);
            myKeyedRequest.setSingularKey("propertySetKey");
            myKeyedRequest.setPluralKey("propertySetKeys");
            myKeyedRequest.setProps(consumerData);
            myKeyedRequest.setDataFn((propertySetKey) => {
              return game.getPropertySet(propertySetKey);
            });

            socketResponses.addToBucket(
              "default",
              makeKeyedResponse(myKeyedRequest)
            );

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      GET_ALL_KEYED: (props) => {
        let subject = "PROPERTY_SETS";
        let action = "GET_ALL_KEYED";
        let socketResponses = SocketResponseBuckets();
        return gameConsumer(
          props,
          (consumerData) => {
            // Config
            let { game, logging } = consumerData;

            let myKeyedRequest = KeyedRequest();
            myKeyedRequest.setAction(action);
            myKeyedRequest.setSubject(subject);
            myKeyedRequest.setLogging(logging);
            myKeyedRequest.setSingularKey("propertySetKey");
            myKeyedRequest.setPluralKey("propertySetKeys");
            myKeyedRequest.setProps(consumerData);
            myKeyedRequest.setAllKeysFn(game.getAllPropertySetKeys);

            // Get data
            socketResponses.addToBucket(
              "default",
              getAllKeyedResponse(myKeyedRequest)
            );

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
    },
    CARDS: {
      GET_KEYED: (props) => {
        let subject = "CARDS";
        let action = "GET_KEYED";
        let socketResponses = SocketResponseBuckets();
        return gameConsumer(
          props,
          (consumerData) => {
            // Config
            let { game, logging } = consumerData;

            let myKeyedRequest = KeyedRequest();
            myKeyedRequest.setAction(action);
            myKeyedRequest.setSubject(subject);
            myKeyedRequest.setLogging(logging);
            myKeyedRequest.setSingularKey("cardId");
            myKeyedRequest.setPluralKey("cardIds");
            myKeyedRequest.setProps(consumerData);
            myKeyedRequest.setDataFn(game.getCard);

            // Get data
            socketResponses.addToBucket(
              "default",
              makeKeyedResponse(myKeyedRequest)
            );

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      GET_ALL_KEYED: (props) => {
        let subject = "CARDS";
        let action = "GET_ALL_KEYED";
        let socketResponses = SocketResponseBuckets();
        return gameConsumer(
          props,
          (consumerData) => {
            // Config
            let { game, logging } = consumerData;

            let myKeyedRequest = KeyedRequest();
            myKeyedRequest.setAction(action);
            myKeyedRequest.setSubject(subject);
            myKeyedRequest.setLogging(logging);
            myKeyedRequest.setSingularKey("cardId");
            myKeyedRequest.setPluralKey("cardIds");
            myKeyedRequest.setProps(consumerData);
            myKeyedRequest.setAllKeysFn(game.getAllCardIds);

            // Get data
            socketResponses.addToBucket(
              "default",
              getAllKeyedResponse(myKeyedRequest)
            );

            // Confirm
            socketResponses.addToBucket(
              "default",
              makeResponse({
                subject,
                action,
                status: "success",
                payload: null,
              })
            );

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      UPDATE: () => {},
    },
    DISCARD_PILE: {
      GET: (props) => {
        let subject = "DISCARD_PILE";
        let action = "GET";
        let socketResponses = SocketResponseBuckets();
        return gameConsumer(
          props,
          (props2) => {
            let { game } = props2;
            let payload = game.getDiscardPile().serialize();
            socketResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status: "success", payload })
            );

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      UPDATE: {},
    },
    ACTIVE_PILE: {
      GET: (props) => {
        let subject = "ACTIVE_PILE";
        let action = "GET";
        let socketResponses = SocketResponseBuckets();
        return gameConsumer(
          props,
          (props2) => {
            let { game } = props2;
            let payload = game.getActivePile().serialize();
            socketResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status: "success", payload })
            );

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      UPDATE: {},
    },
    DRAW_PILE: {
      GET: (props) => {
        let subject = "DRAW_PILE";
        let action = "GET";
        let socketResponses = SocketResponseBuckets();
        return gameConsumer(
          props,
          ({ game }) => {
            // Takes no action
            // Current count of card in deck
            let payload = {
              count: game.getDeckCardCount(),
            };
            socketResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status: "success", payload })
            );
            //___________________________________________________________
            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      UPDATE: {},
    },
    PLAYERS: {
      GET: (props) => {
        let [subject, action] = ["PLAYERS", "GET"];
        let socketResponses = SocketResponseBuckets();
        return gameConsumer(
          props,
          (consumerData) => {
            let { game } = consumerData;

            let status = "failure";
            let payload = null;
            let playerManager = game.getPlayerManager();
            if (isDef(playerManager)) {
              let allPlayerKeys = playerManager.getAllPlayerKeys();
              if (isArr(allPlayerKeys)) {
                status = "success";
                payload = {
                  order: allPlayerKeys,
                };
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
      },
      PERSON_DREW_CARDS_KEYED: (props) => {
        let subject = "PLAYERS";
        let action = "PERSON_DREW_CARDS_KEYED";
        let socketResponses = SocketResponseBuckets();
        return gameConsumer(
          props,
          ({ logging, cardIds, game, personId }) => {
            // Takes no action

            // Let people know the cards drawn -------------------------
            let status = "failure";
            let payload = null;
            if (isDef(cardIds) && isArr(cardIds)) {
              status = "success";
              payload = {
                count: cardIds.length,
                peopleIds: [personId],
                items: {},
              };
              payload.items[personId] = {
                count: cardIds.length,
                cardIds: cardIds,
                cards: cardIds.map((id) => game.getCard(id)),
              };

              if (isDef(logging)) logBlock(jsonEncode(payload), "CARDS DRAWN ");
            }
            socketResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      }, // end PLAYERS.PERSON_DREW_CARDS_KEYED
    },
    PLAYER_TURN: {
      GET: (props) => {
        let subject = "PLAYER_TURN";
        let action = "GET";
        let socketResponses = SocketResponseBuckets();
        return gameConsumer(
          props,
          (consumerData) => {
            let { game, thisPersonId } = consumerData;
            let currentTurn = game.getCurrentTurn();

            if (currentTurn.getCurrentPhase() === "discard") {
              let thisPlayerHand = game.getPlayerHand(thisPersonId);
              let remaining =
                thisPlayerHand.getCount() - game.getHandMaxCardCount();
              if (remaining > 0) {
                currentTurn.setPhaseData({
                  remainingCountToDiscard: remaining,
                });
              }
            }

            let payload = game.getCurrentTurn().serialize();

            socketResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status: "success", payload })
            );

            //socketResponses.addToBucket("default", SUBJECTS.PLAYER_REQUESTS.REMOVE_ALL(makeProps(consumerData)));
            //socketResponses.addToBucket("default", SUBJECTS.REQUESTS.REMOVE_ALL(makeProps(consumerData)));

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
    },
    PLAYER_HANDS: {
      //
      /**
       * GET PLAYER HAND
       * The information will be tailored for each recipient.
       *
       * @param.props[receivingPeopleIds|receivingPersonId] {array|string}   People who will receive the information
       * @param.props[peopleIds|personId] {array|string}                     The players who's information changed - assumed this person by default
       */
      // props = {roomCode, personId, (receivingPeopleIds|receivingPersonId), (peopleIds|personId)}
      GET_KEYED: (props) => {
        let [subject, action] = ["PLAYER_HANDS", "GET_KEYED"];
        let socketResponses = SocketResponseBuckets();

        return personConsumer(
          props,
          (props2) => {
            let { game, logging } = props2;
            let getMyData = (ownerPersonId) => {
              let playerHand = game.getPlayerHand(ownerPersonId);
              if (isDef(playerHand)) return playerHand.serialize();
              return null;
            };

            let getOtherData = (ownerPersonId, viewerPersonId = null) => {
              let playerHand = game.getPlayerHand(ownerPersonId);
              let handCount = 0;
              if (isDef(playerHand)) {
                handCount = playerHand.getCount();
              }
              return {
                count: handCount,
              };
            };

            socketResponses.addToBucket(
              "default",
              makePersonSpecificResponses({
                props: props2,
                getMyData,
                getOtherData,
                subject,
                action,
                logging,
              })
            );

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      GET_ALL_KEYED: (props) => {
        let subject = "PLAYER_HANDS";
        let action = "GET_ALL_KEYED";
        let socketResponses = SocketResponseBuckets();
        return personConsumer(
          props,
          (props2) => {
            let { personManager, game, logging } = props2;

            let peopleIds = getAllPlayers(game, personManager).map((person) =>
              person.getId()
            );

            socketResponses.addToBucket(
              "default",
              SUBJECTS[subject].GET_KEYED({
                ...props2,
                peopleIds,
                logging,
              })
            );

            // Confirm
            socketResponses.addToBucket(
              "default",
              makeResponse({
                subject,
                action,
                status: "success",
                payload: null,
              })
            );

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
    },
    PLAYER_BANKS: {
      GET_KEYED: (props) => {
        let subject = "PLAYER_BANKS";
        let action = "GET_KEYED";
        let socketResponses = SocketResponseBuckets();
        return personConsumer(
          props,
          (props2) => {
            let { game } = props2;
            let getBankData = (ownerPersonId) => {
              return game.getPlayerBank(ownerPersonId).serialize();
            };

            socketResponses.addToBucket(
              "default",
              makePersonSpecificResponses({
                props: props2,
                getMyData: getBankData,
                getOtherData: getBankData,
                subject,
                action,
              })
            );

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      GET_ALL_KEYED: (props) => {
        let subject = "PLAYER_BANKS";
        let action = "GET_ALL_KEYED";
        let socketResponses = SocketResponseBuckets();
        return personConsumer(
          props,
          (props2) => {
            let { personManager, game } = props2;

            socketResponses.addToBucket(
              "default",
              makeResponse({
                subject,
                action,
                status: "success",
                payload: null,
              })
            );

            let peopleIds = getAllPlayers(game, personManager).map((person) =>
              person.getId()
            );
            socketResponses.addToBucket(
              "default",
              SUBJECTS[subject].GET_KEYED({
                ...props,
                peopleIds,
              })
            );

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
    },
    PLAYER_REQUESTS: {
      GET_KEYED: (props) => {
        //props: { roomCode, (peopleIds|personId)}
        let subject = "PLAYER_REQUESTS";
        let action = "GET_KEYED";
        let socketResponses = SocketResponseBuckets();

        return gameConsumer(
          props,
          (consumerData) => {
            let { game, logging } = consumerData;

            let myKeyedRequest = KeyedRequest();
            myKeyedRequest.setAction(action);
            myKeyedRequest.setSubject(subject);
            myKeyedRequest.setLogging(logging);
            myKeyedRequest.setPluralKey("peopleIds");
            myKeyedRequest.setSingularKey("personId");
            myKeyedRequest.setDataFn((personId) => {
              return game
                .getRequestManager()
                .getAllRequestIdsForPlayer(personId);
            });
            myKeyedRequest.setProps(consumerData);

            //deliver data
            socketResponses.addToBucket(
              "default",
              makeKeyedResponse(myKeyedRequest)
            );

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      REMOVE_ALL: (props) => {
        let subject = "REQUESTS";
        let action = "PLAYER_REQUESTS";
        let status = "failure";
        let payload = null;
        let socketResponses = SocketResponseBuckets();
        return gameConsumer(
          props,
          (consumerData) => {
            let { game } = consumerData;

            let currentTurn = game.getCurrentTurn();
            if (currentTurn.getCurrentPhase() === "draw") {
              status = "success";
            }
            socketResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );
            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
    },
    REQUESTS: {
      // Make
      ...makeRegularGetKeyed({
        subject: "REQUESTS",
        singularKey: "requestId",
        pluralKey: "requestIds",
        makeGetDataFn: ({ game, logging, subject, action }, checkpoints) => (
          requestId
        ) => {
          let result = null;
          let data = game
            .getCurrentTurn()
            .getRequestManager()
            .getRequest(requestId);

          if (isDef(data)) {
            checkpoints.set("requestExists", true);
            result = data.serialize();
          }
          if (logging) logBlock(result, `${subject}.${action}`);
          return result;
        },
        makeGetAllKeysFn: (
          { game, logging, subject, action },
          checkpoints
        ) => () => {
          let result = game
            .getCurrentTurn()
            .getRequestManager()
            .getAllRequestIds();
          if (logging) logBlock(result, `${subject}.${action}`);
          return result;
        },
        makeGetAlMyKeysFn: (
          { game, thisPersonId, logging, subject, action },
          checkpoints
        ) => () => {
          let result = game
            .getCurrentTurn()
            .getRequestManager()
            .getAllRequestIdsForPlayer(thisPersonId);
          if (logging) logBlock(result, `${subject}.${action}`);
          return result;
        },
      }),
      REMOVE_ALL: (props) => {
        let subject = "REQUESTS";
        let action = "REMOVE_ALL";
        let status = "failure";
        let payload = null;
        let socketResponses = SocketResponseBuckets();
        return gameConsumer(
          props,
          (consumerData) => {
            let { game } = consumerData;

            let currentTurn = game.getCurrentTurn();
            if (currentTurn.getCurrentPhase() === "draw") {
              status = "success";
            }
            socketResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );
            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
    },
    PLAYER_COLLECTIONS: {
      GET_KEYED: (props) => {
        //props: { roomCode, (peopleIds|personId)}
        let subject = "PLAYER_COLLECTIONS";
        let action = "GET_KEYED";
        let socketResponses = SocketResponseBuckets();
        return gameConsumer(
          props,
          (consumerData) => {
            let { game, logging } = consumerData;

            let myKeyedRequest = KeyedRequest();
            myKeyedRequest.setAction(action);
            myKeyedRequest.setSubject(subject);
            myKeyedRequest.setLogging(logging);
            myKeyedRequest.setPluralKey("peopleIds");
            myKeyedRequest.setSingularKey("personId");
            myKeyedRequest.setDataFn((personId) => {
              return game
                .getPlayerManager()
                .getAllCollectionIdsForPlayer(personId);
            });
            myKeyedRequest.setProps(consumerData);

            //deliver data
            socketResponses.addToBucket(
              "default",
              makeKeyedResponse(myKeyedRequest)
            );

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      GET_ALL_KEYED: (props) => {
        //props: {roomCode}
        let subject = "PLAYER_COLLECTIONS";
        let action = "GET_ALL_KEYED";
        let socketResponses = SocketResponseBuckets();
        return gameConsumer(
          props,
          (consumerData) => {
            // Config
            let { game, personManager, logging } = consumerData;

            // confirm the all command
            socketResponses.addToBucket(
              "default",
              makeResponse({
                subject,
                action,
                status: "success",
                payload: null,
              })
            );

            let myKeyedRequest = KeyedRequest();
            myKeyedRequest.setAction(action);
            myKeyedRequest.setSubject(subject);
            myKeyedRequest.setLogging(logging);
            myKeyedRequest.setPluralKey("peopleIds");
            myKeyedRequest.setSingularKey("personId");
            myKeyedRequest.setProps(consumerData);
            myKeyedRequest.setAllKeysFn(() =>
              getAllPlayerIds({ game, personManager })
            );

            // Get data
            socketResponses.addToBucket(
              "default",
              getAllKeyedResponse(myKeyedRequest)
            );

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
    },
    COLLECTIONS: {
      // Make
      // GET_KEYED
      // GET_ALL_KEYED
      // GET_ALL_MY_KEYED
      ...makeRegularGetKeyed({
        subject: "COLLECTIONS",
        singularKey: "collectionId",
        pluralKey: "collectionIds",
        makeGetDataFn: ({ game }, checkpoints) => (collectionId) => {
          let result = game.getCollectionManager().getCollection(collectionId);
          if (isDef(result)) {
            checkpoints.set("collectionExists", true);
            return result.serialize();
          }
        },
        makeGetAllKeysFn: ({ game }, checkpoints) => () => {
          return game.getCollectionManager().getAllCollectionIds();
        },
        makeGetAlMyKeysFn: ({ game, thisPersonId }, checkpoints) => () => {
          return game
            .getPlayerManager()
            .getAllCollectionIdsForPlayer(thisPersonId);
        },
      }),
    },
    CHEAT: {
      FORCE_STATE: (props) => {
        let [subject, action] = ["CHEAT", "FORCE_STATE"];
        let socketResponses = SocketResponseBuckets();
        let status = "failure";
        let payload = null;
        return roomConsumer(
          props,
          (consumerData, checkpoints) => {
            // If in testing mode
            if (TESTING_MODE) {
              let { room } = consumerData;

              //Reset game
              socketResponses.addToBucket(
                "default",
                SUBJECTS.GAME.RESET(makeProps(props))
              );
              createGameInstance(room);

              socketResponses.addToBucket(
                "default",
                SUBJECTS.GAME.UPDATE_CONFIG(
                  makeProps(consumerData, {
                    config: {
                      [SHOULD.SHUFFLE_DECK]: false,
                      [SHOULD.ALTER_SET_COST_ACTION]: false,
                    },
                  })
                )
              );

              // @TODO
              //socketResponses.addToBucket("default", SUBJECTS.GAME.START(makeProps(consumerData)));

              status = "success";
            } else {
              payload = {
                message: "Test mode is disabled",
              };
            }
            socketResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
    },
  };

  //==================================================

  //              UNSORTED FUNCTIONS

  //==================================================
  function makeProps(props, data = {}) {
    return { roomCode: props.roomCode, ...data };
  }

  function createGameInstance(room) {
    let gameInstance = PlayDealGame();

    gameInstance.newGame();
    gameInstance.updateConfig({
      [SHOULD.SHUFFLE_DECK]: true,
      [SHOULD.ALTER_SET_COST_ACTION]: false,
      [SHOULD.ACTION_AUGMENT_CARDS_COST_ACTION]: true,
    });

    room.setGame(gameInstance);

    return gameInstance;
  }

  function createRoom(roomCode = "AAAA") {
    let room = roomManager.createRoom(roomCode);
    return room;
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

  function canPersonRemoveOtherPerson(thisPerson, otherPerson) {
    return (
      thisPerson.hasTag("host") ||
      String(otherPerson.getId()) === String(thisPerson.getId())
    );
  }

  function canGameStart(game, personManager) {
    let readyPeople = personManager.filterPeople((person) => {
      return person.isConnected() && person.getStatus() === "ready";
    });
    return (
      personManager.doesAllPlayersHaveTheSameStatus("ready") &&
      game.isAcceptablePlayerCount(readyPeople.length)
    );
  }

  function getAllPlayerIds({ game, personManager }) {
    return personManager
      .getConnectedPeople()
      .filter((person) => {
        let pId = person.getId();
        return game.hasPlayer(pId);
      })
      .map((person) => person.getId());
  }

  function getAllPlayers(game, personManager) {
    return personManager.getConnectedPeople().filter((person) => {
      let pId = person.getId();
      return game.hasPlayer(pId);
    });
  }

  // Will generate resposnes for each respective person regarding the relevent information
  /**
   * @param {function} getMyData      data for the owner of the info              IE: cards in my hand
   * @param {function} getOtherData   data from the perspective of other people   IE: card count of my opponents
   * @param.props[receivingPeopleIds|receivingPersonId] {array|string}   People who will receive the information
   * @param.props[peopleIds|personId] {array|string}                     The players who's information changed - assumed this person by default
   */
  function makePersonSpecificResponses({
    subject,
    action,
    props,
    getMyData,
    getOtherData,
  }) {
    let { personManager, thisPersonId, logging } = props;
    let socketResponses = SocketResponseBuckets();

    // People who will receive the information
    let receivingPeopleIds = getArrFromProp(
      props,
      {
        plural: "receivingPeopleIds",
        singular: "receivingPersonId",
      },
      thisPersonId
    );

    // The players who's information changed - assumed this person by default
    let peopleIds = Array.from(
      new Set(
        getArrFromProp(
          props,
          {
            plural: "peopleIds",
            singular: "personId",
          },
          thisPersonId
        )
      )
    );

    if (isDef(peopleIds)) {
      // for each person receiving the data
      receivingPeopleIds.forEach((receivingPersonId) => {
        let receivingPerson = personManager.getPerson(receivingPersonId);
        if (isDef(receivingPerson)) {
          let status = "success";
          let payload = {
            items: {},
            order: [],
          };
          // Generate iHaveAHand data from the perspective of the recipient
          peopleIds.forEach((ownerPersonId) => {
            if (receivingPersonId === ownerPersonId) {
              payload.items[ownerPersonId] = getMyData(ownerPersonId);
            } else {
              payload.items[ownerPersonId] = getOtherData(
                ownerPersonId,
                receivingPersonId
              );
            }
            payload.order.push(ownerPersonId);
          });
          socketResponses.addToSpecific(
            receivingPerson.getClientId(),
            makeResponse({
              subject,
              action,
              status,
              payload,
            })
          );

          if (logging) {
            logBlock(
              jsonEncode(payload),
              `${subject} ${action} ${receivingPersonId}`
            );
          }
        }
      });
    } else {
      console.log("users not defined");
    }
    return socketResponses;
  }

  function makeKeyedResponse(keyedRequest) {
    var subject, action, props, nomenclature, getData, fallback, logging;

    subject = keyedRequest.getSubject();
    action = keyedRequest.getAction();
    props = keyedRequest.getProps();
    getData = keyedRequest.getDataFn();
    nomenclature = {
      plural: keyedRequest.getPluralKey(),
      singular: keyedRequest.getSingularKey(),
    };
    fallback = keyedRequest.getFallback();
    logging = keyedRequest.getLogging();

    fallback = els(fallback, undefined);
    let socketResponses = SocketResponseBuckets();

    let keys = getArrFromProp(props, nomenclature, fallback);

    let status = "failure";
    let payload = {
      items: {},
      order: [],
    };
    keys.forEach((key) => {
      payload.items[key] = getData(key);
      payload.order.push(key);
    });
    if (payload.order.length > 0) {
      status = "success";
    }

    if (logging) logBlock(jsonEncode(payload), `${subject} ${action}`);
    socketResponses.addToBucket(
      "default",
      makeResponse({ subject, action, status, payload })
    );
    return socketResponses;
  }

  function getAllKeyedResponse(keyedRequest) {
    var subject, action, props, propName, getAllKeys, logging;
    subject = keyedRequest.getSubject();
    action = keyedRequest.getAction();
    props = keyedRequest.getProps();
    propName = keyedRequest.getPluralKey();
    getAllKeys = keyedRequest.getAllKeysFn();
    logging = keyedRequest.getLogging();

    let socketResponses = SocketResponseBuckets();
    socketResponses.addToSpecific(
      "default",
      makeResponse({ subject, action, status: "success", payload: null })
    );
    let getProps = {
      logging,
      subject,
      action,
      ...props,
    };
    getProps[propName] = getAllKeys();
    socketResponses.addToBucket(
      "default",
      SUBJECTS[subject].GET_KEYED(getProps)
    );

    return socketResponses;
  }

  //==================================================

  //                    CONSUMERS

  //==================================================
  // ensured the data required for a room is presant
  function roomConsumer(props, fn, fallback = undefined) {
    let { roomCode } = props;
    // define which points were reached before failure
    let checkpoints = new Map();
    checkpoints.set("roomCode", false);
    checkpoints.set("room", false);
    checkpoints.set("personManager", false);

    if (isDef(roomCode)) {
      checkpoints.set("roomCode", true);
      let room = roomManager.getRoomByCode(roomCode);
      if (isDef(room)) {
        checkpoints.set("room", true);
        let personManager = room.getPersonManager();
        if (isDef(personManager)) {
          checkpoints.set("personManager", true);
          let person = personManager.getPersonByClientId(strThisClientId);
          let game = room.getGame();
          return fn(
            {
              ...props,
              game,
              roomCode,
              thisRoomCode: roomCode,
              room,
              thisRoom: room,
              person,
              thisPerson: person,
              personManager,
            },
            checkpoints
          );
        }
      }
    }
    if (isFunc(fallback)) return fallback(checkpoints);
    return fallback;
  }

  function gameConsumer(props, fn, fallback = undefined) {
    let { roomCode } = props;
    // define which points were reached before failure
    let checkpoints = new Map();
    checkpoints.set("roomCode", false);
    checkpoints.set("room", false);
    checkpoints.set("personManager", false);
    checkpoints.set("game", false);

    if (isDef(roomCode)) {
      checkpoints.set("roomCode", true);
      let room = roomManager.getRoomByCode(roomCode);
      if (isDef(room)) {
        checkpoints.set("room", true);
        let personManager = room.getPersonManager();
        if (isDef(personManager)) {
          checkpoints.set("personManager", true);
          let person = personManager.getPersonByClientId(strThisClientId);
          let game = room.getGame();
          if (isDef(game)) {
            checkpoints.set("game", true);
            return fn(
              {
                ...props,
                game,
                roomCode,
                thisRoomCode: roomCode,
                room,
                thisRoom: room,
                person,
                thisPersonId: person.getId(),
                thisPerson: person,
                personManager,
              },
              checkpoints
            );
          }
        }
      }
    }
    if (isFunc(fallback)) return fallback(checkpoints);
    return fallback;
  }

  function personConsumer(props, fn, fallback = undefined) {
    return roomConsumer(
      props,
      (props2, checkpoints) => {
        // default
        checkpoints.set("person", false);
        let { person } = props2;
        if (isDef(person)) {
          checkpoints.set("person", true);
          return fn(
            {
              personId: person.getId(),
              thisPersonId: person.getId(),
              ...props2,
            },
            checkpoints
          );
        }
        if (isFunc(fallback)) return fallback(checkpoints);
        return fallback;
      },
      fallback
    );
  }

  function myTurnConsumer(props, fn, fallback = undefined) {
    return personConsumer(
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

  function myTurnConsumerGood(props, fn, fallback = undefined) {
    let consumerCheck = (
      consumerData,
      checkpoints,
      socketResponses,
      fn,
      setFailed
    ) => {
      let boolFailed = false;
      let { game } = consumerData;
      socketResponses.addToBucket(
        "default",
        fn(
          {
            ...consumerData,
            currentTurn: game.getCurrentTurn(),
          },
          checkpoints
        )
      );

      setFailed(boolFailed);
    };
    return makeConsumer(consumerCheck, myTurnConsumer, props, fn, fallback);
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
    return makeConsumer(consumerCheck, myTurnConsumer, props, fn, fallback);
  }

  function requestConsumer(props, fn, fallback = undefined) {
    let consumerCheck = (
      consumerData,
      checkpoints,
      socketResponses,
      fn,
      setFailed
    ) => {
      let boolFailed = true;
      checkpoints.set("hasRequest", false);

      let { game, requestId } = consumerData;

      if (isDef(requestId)) {
        boolFailed = false;
        //let myRequestIds = game.getCurrentTurn().getRequestManager().getAllRequestIdsForPlayer(thisPersonId);
        //if(myRequestIds.length){
        checkpoints.set("hasRequest", true);

        socketResponses.addToBucket(
          "default",
          fn(
            {
              ...consumerData,
              requestId,
              currentTurn: game.getCurrentTurn(),
            },
            checkpoints
          )
        );
        //}
      }

      setFailed(boolFailed);
    };
    return makeConsumer(consumerCheck, personConsumer, props, fn, fallback);
  }

  function makeConsumer(
    consumerCheck,
    parentConsumer,
    props,
    fn,
    fallback = undefined
  ) {
    let socketResponses = SocketResponseBuckets();
    return parentConsumer(
      props,
      (consumerData, checkpoints) => {
        let { logging } = props;
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

          if (logging) {
            logBlock(jsonEncode(socketResponses.serialize()), `Failed logging`);
          }
        }
        return socketResponses;
      },
      fallback
    );
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

  //==================================================

  //                    HANDLERS

  //==================================================
  function handleConnect() {
    console.log("handleConnect", thisClient.id);
    clientManager.addClient(thisClient);
  }

  function makeRegularGetKeyed({
    subject,
    singularKey,
    pluralKey,
    makeGetDataFn,
    makeGetAllKeysFn,
    makeGetAlMyKeysFn,
  }) {
    return {
      GET_KEYED: (props) => {
        //props: { roomCode, (collectionIds|collectionId)}
        let action = "GET_KEYED";
        let socketResponses = SocketResponseBuckets();
        return gameConsumer(
          props,
          (consumerData, checkpoints) => {
            let { logging } = consumerData;
            let upgradedData = { ...consumerData, subject, action };
            let myKeyedRequest = KeyedRequest();
            myKeyedRequest.setAction(action);
            myKeyedRequest.setSubject(subject);
            myKeyedRequest.setLogging(logging);
            myKeyedRequest.setProps(upgradedData);
            myKeyedRequest.setSingularKey(singularKey);
            myKeyedRequest.setPluralKey(pluralKey);
            myKeyedRequest.setDataFn(makeGetDataFn(upgradedData, checkpoints));

            // deliver data
            socketResponses.addToBucket(
              "default",
              makeKeyedResponse(myKeyedRequest)
            );

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      GET_ALL_KEYED: (props) => {
        //props: {roomCode}
        let action = "GET_ALL_KEYED";
        let socketResponses = SocketResponseBuckets();
        return gameConsumer(
          props,
          (consumerData, checkpoints) => {
            let { logging } = consumerData;
            let upgradedData = { ...consumerData, subject, action };
            let myKeyedRequest = KeyedRequest();
            myKeyedRequest.setAction(action);
            myKeyedRequest.setSubject(subject);
            myKeyedRequest.setLogging(logging);
            myKeyedRequest.setSingularKey(singularKey);
            myKeyedRequest.setPluralKey(pluralKey);
            myKeyedRequest.setProps(upgradedData);
            myKeyedRequest.setAllKeysFn(
              makeGetAllKeysFn(upgradedData, checkpoints)
            );

            // Get data
            socketResponses.addToBucket(
              "default",
              getAllKeyedResponse(myKeyedRequest)
            );

            // confirm the all command
            socketResponses.addToBucket(
              "default",
              makeResponse({
                subject,
                action,
                status: "success",
                payload: null,
              })
            );

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      GET_ALL_MY_KEYED: (props) => {
        let action = "GET_ALL_MY_KEYED";
        let socketResponses = SocketResponseBuckets();
        return gameConsumer(
          props,
          (consumerData, checkpoints) => {
            let { logging } = consumerData;
            let upgradedData = { ...consumerData, subject, action };
            let myKeyedRequest = KeyedRequest();
            myKeyedRequest.setAction(action);
            myKeyedRequest.setSubject(subject);
            myKeyedRequest.setLogging(logging);
            myKeyedRequest.setSingularKey(singularKey);
            myKeyedRequest.setPluralKey(pluralKey);
            myKeyedRequest.setProps(upgradedData);
            myKeyedRequest.setAllKeysFn(
              makeGetAlMyKeysFn(upgradedData, checkpoints)
            );

            // Get data
            socketResponses.addToBucket(
              "default",
              getAllKeyedResponse(myKeyedRequest)
            );

            // confirm the all command
            socketResponses.addToBucket(
              "default",
              makeResponse({
                subject,
                action,
                status: "success",
                payload: null,
              })
            );

            if (logging)
              logBlock(
                jsonEncode(socketResponses.serialize()),
                `${subject} ${action}`
              );

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
      REMOVE_KEYED: (props) => {
        //props: { roomCode, (collectionIds|collectionId)}
        let action = "REMOVE_KEYED";
        let socketResponses = SocketResponseBuckets();
        return gameConsumer(
          props,
          (consumerData, checkpoints) => {
            let { logging } = consumerData;
            let status = "success";
            let nomenclature = {
              plural: pluralKey,
              singular: singularKey,
            };
            let payload = {
              removeItemsIds: getArrFromProp(props, nomenclature, []),
            };
            socketResponses.addToBucket(
              "default",
              makeResponse({
                subject,
                action,
                status: status,
                payload: payload,
              })
            );
            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      },
    };
  }

  function packageCheckpoints(checkpoints) {
    if (isDef(checkpoints)) {
      let dumpCheckpoint = {};
      checkpoints.forEach(
        (value, message) => (dumpCheckpoint[message] = value)
      );
      return dumpCheckpoint;
    }
    return null;
  }

  function decodeData(v) {
    return JSON.parse(v);
  }

  function handleRequests(encodedData) {
    let socketResponses = SocketResponseBuckets();
    let requests = isStr(encodedData) ? decodeData(encodedData) : encodedData;
    let clientPersonMapping = {};

    if (isArr(requests)) {
      requests.forEach((request) => {
        let requestResponses = SocketResponseBuckets();

        let subject = request.subject;
        let action = request.action;
        let props = els(request.props, {});

        if (isDef(SUBJECTS[subject])) {
          if (isDef(SUBJECTS[subject][action])) {
            // @TODO add a way of limiting the props which can be passed to method from the client
            // We may want to push data to clients but not allow it to be abused
            let actionResult = SUBJECTS[subject][action](props);

            requestResponses.addToBucket("default", actionResult);
          }
        }

        // Collect person Ids
        let clientIdsMap = {};
        clientIdsMap[strThisClientId] = true;
        roomConsumer(props, ({ personManager }) => {
          personManager.getConnectedPeople().forEach((person) => {
            clientIdsMap[String(person.getClientId())] = true;
            clientPersonMapping[String(person.getClientId())] = person;
          });
        });

        // Assing the buckets of reponses to the relevent clients
        let clientIds = Object.keys(clientIdsMap);
        socketResponses.addToBucket(
          requestResponses.reduce(strThisClientId, clientIds)
        );
      });
    }

    // Emit to "me" since I am always available
    if (socketResponses.specific.has(String(strThisClientId))) {
      let resp = socketResponses.specific.get(strThisClientId);
      thisClient.emit("response", jsonEncode(resp));
    }
    // Emit to other relevent people collected from the above requests
    Object.keys(clientPersonMapping).forEach((clientId) => {
      if (strThisClientId !== clientId) {
        let person = clientPersonMapping[clientId];
        if (socketResponses.specific.has(clientId)) {
          let resp = socketResponses.specific.get(clientId);
          person.emit("response", jsonEncode(resp));
        }
      }
    });
  }

  function handleDisconnect() {
    let clientId = thisClient.id;
    let rooms = roomManager.getRoomsForClientId(clientId);

    if (isDef(rooms)) {
      rooms.forEach((room) => {
        handleRequests(
          JSON.stringify([
            {
              subject: "ROOM",
              action: "LEAVE",
              props: { roomCode: room.getCode() },
            },
          ])
        );
      });
    }
    clientManager.removeClient(thisClient);
    console.log("disconnect", clientId);
  }

  //==================================================

  let handleTransactionResponse = function (subject, action, props, theThing) {
    let socketResponses = SocketResponseBuckets();
    let status = "failure";
    let payload = null;
    return gameConsumer(
      props,
      (consumerData, checkpoints) => {
        let { requestId } = consumerData;
        let { roomCode, game, personManager, thisPersonId } = consumerData;

        let currentTurn = game.getCurrentTurn();
        let phaseKey = currentTurn.getCurrentPhase();
        let requestManager = currentTurn.getRequestManager();
        let actionNum = currentTurn.getActionCount();

        // Request manager exists
        checkpoints.set("requestManagerExists", false);
        if (isDef(currentTurn) && isDef(requestManager)) {
          checkpoints.set("requestManagerExists", true);

          // Is request phase

          let player = game.getPlayer(thisPersonId);
          let playerBank = player.getBank();
          let request = requestManager.getRequest(requestId);
          checkpoints.set("isRequestDefined", false);
          if (isDef(request)) {
            checkpoints.set("isRequestDefined", true);

            let requestPayload = request.getPayload();
            let transaction = requestPayload.transaction;

            checkpoints.set("hasTransaction", false);
            if (isDef(transaction)) {
              checkpoints.set("hasTransaction", true);

              let isApplicable = false;
              let isAuthor = request.getAuthorKey() === thisPersonId;
              let isTarget = request.getTargetKey() === thisPersonId;

              if (isAuthor || isTarget) {
                isApplicable = true;
              }

              // If is related to request
              checkpoints.set("isApplicable", false);
              if (isApplicable) {
                checkpoints.set("isApplicable", true);

                // Log what is to be reported back to the user
                let affected = {
                  turn: true,
                  hand: false,
                  bank: false,
                  playerRequests: false,
                  requests: false,
                  playerCollections: false,
                  collections: false,
                };
                let affectedIds = {
                  playerRequests: [thisPersonId],
                  requests: [requestId],
                  playerCollections: [],
                  collections: [],
                };

                // DO THE THING
                checkpoints.set("success", false);
                theThing({
                  actionNum,
                  affected,
                  affectedIds,
                  player,
                  playerBank,
                  transaction,
                  socketResponses,
                  checkpoints,
                  ...consumerData,
                });
                if (checkpoints.get("success")) status = "success";

                // If request is completed
                if (transaction.isComplete() || transaction.isEmpty()) {
                  request.close(request.getStatus());
                  if (
                    requestManager.isAllRequestsClosed() &&
                    currentTurn.getCurrentPhase() === "request"
                  ) {
                    currentTurn.proceedToNextPhase();
                    affected.turn = true;
                  }
                }

                if (affected.hand) {
                  let allPlayerIds = getAllPlayerIds({
                    game,
                    personManager,
                  });
                  socketResponses.addToBucket(
                    "default",
                    SUBJECTS["PLAYER_HANDS"].GET_KEYED(
                      makeProps(consumerData, {
                        personId: thisPersonId,
                        receivingPeopleIds: allPlayerIds,
                      })
                    )
                  );
                }

                // COLLECTIONS
                if (
                  affected.collections &&
                  affectedIds.collections.length > 0
                ) {
                  let updatedCollectionIds = [];
                  let removedCollectionIds = [];

                  let collectionManager = game.getCollectionManager();
                  affectedIds.collections.forEach((id) => {
                    if (collectionManager.hasCollection(id)) {
                      updatedCollectionIds.push(id);
                    } else {
                      removedCollectionIds.push(id);
                    }
                  });

                  if (updatedCollectionIds.length > 0) {
                    socketResponses.addToBucket(
                      "everyone",
                      SUBJECTS["COLLECTIONS"].GET_KEYED(
                        makeProps(consumerData, {
                          collectionIds: updatedCollectionIds,
                        })
                      )
                    );
                  }

                  if (removedCollectionIds.length > 0) {
                    socketResponses.addToBucket(
                      "everyone",
                      SUBJECTS["COLLECTIONS"].REMOVE_KEYED(
                        makeProps(consumerData, {
                          collectionIds: removedCollectionIds,
                        })
                      )
                    );
                  }
                }
                // PLAYER COLLECTIONS
                if (
                  affected.playerCollections &&
                  affectedIds.playerCollections.length > 0
                ) {
                  // Update who has what collection
                  socketResponses.addToBucket(
                    "everyone",
                    SUBJECTS["PLAYER_COLLECTIONS"].GET_KEYED(
                      makeProps(consumerData, {
                        peopleIds: affectedIds.playerCollections,
                      })
                    )
                  );
                }

                // REQUESTS
                if (affected.requests && isDef(affectedIds.requests)) {
                  socketResponses.addToBucket(
                    "everyone",
                    SUBJECTS.REQUESTS.GET_KEYED(
                      makeProps(consumerData, {
                        requestIds: affectedIds.requests,
                      })
                    )
                  );
                }

                if (affectedIds.playerRequests.length > 0) {
                  socketResponses.addToBucket(
                    "everyone",
                    SUBJECTS.PLAYER_REQUESTS.GET_KEYED(
                      makeProps(consumerData, {
                        peopleIds: affectedIds.playerRequests,
                      })
                    )
                  );
                }

                // BANK
                if (affected.bank) {
                  let attendingPeople = personManager.filterPeople(
                    (person) =>
                      person.isConnected() && person.getStatus() === "ready"
                  );
                  let peopleIds = attendingPeople.map((person) =>
                    person.getId()
                  );
                  socketResponses.addToBucket(
                    "default",
                    SUBJECTS["PLAYER_BANKS"].GET_KEYED(
                      makeProps(consumerData, {
                        peopleIds: thisPersonId,
                        receivingPeopleIds: peopleIds,
                      })
                    )
                  );
                }

                // PLAYER TURN
                if (affected.turn) {
                  socketResponses.addToBucket(
                    "everyone",
                    SUBJECTS.PLAYER_TURN.GET({ roomCode })
                  );
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

        return socketResponses;
      },
      makeConsumerFallbackResponse({ subject, action, socketResponses })
    );
  };
  let handleTransferResponse = function (subject, action, props, theThing) {
    let socketResponses = SocketResponseBuckets();
    let status = "failure";
    let payload = null;
    return gameConsumer(
      props,
      (consumerData, checkpoints) => {
        let { requestId } = consumerData;
        let { roomCode, game, personManager, thisPersonId } = consumerData;

        let currentTurn = game.getCurrentTurn();
        let phaseKey = currentTurn.getCurrentPhase();
        let requestManager = currentTurn.getRequestManager();
        let actionNum = currentTurn.getActionCount();

        // Request manager exists
        checkpoints.set("requestManagerExists", false);
        if (isDef(currentTurn) && isDef(requestManager)) {
          checkpoints.set("requestManagerExists", true);

          // Is request phase
          let player = game.getPlayer(thisPersonId);
          let playerBank = player.getBank();
          let request = requestManager.getRequest(requestId);
          checkpoints.set("isRequestDefined", false);
          if (isDef(request)) {
            checkpoints.set("isRequestDefined", true);

            let requestPayload = request.getPayload();
            let transaction = requestPayload.transaction;

            checkpoints.set("hasTransaction", false);
            if (isDef(transaction)) {
              checkpoints.set("hasTransaction", true);

              let isApplicable = false;
              let isAuthor = request.getAuthorKey() === thisPersonId;
              let isTarget = request.getTargetKey() === thisPersonId;
              let transferField = "";
              if (isAuthor) {
                transferField = "toAuthor";
                isApplicable = true;
              } else if (isTarget) {
                transferField = "toTarget";
                isApplicable = true;
              }

              // If is related to request
              checkpoints.set("isApplicable", false);
              if (isApplicable) {
                if (transaction.has(transferField)) {
                  checkpoints.set("isApplicable", true);

                  // Get what is being transferd to me
                  let transfering = transaction.get(transferField);

                  // Log what is to be reported back to the user
                  let affected = {
                    turn: true,
                    hand: false,
                    bank: false,
                    playerRequests: false,
                    requests: false,
                    playerCollections: false,
                    collections: false,
                  };
                  let affectedIds = {
                    playerRequests: [],
                    requests: [requestId],
                    playerCollections: [],
                    collections: [],
                  };

                  // DO THE THING
                  checkpoints.set("success", false);
                  theThing({
                    requestId,
                    affected,
                    affectedIds,
                    actionNum,
                    player,
                    playerBank,
                    transaction,
                    transfering,
                    socketResponses,
                    checkpoints,
                    ...consumerData,
                  });

                  if (checkpoints.get("success")) status = "success";

                  // If request is completed
                  if (transaction.isComplete() || transaction.isEmpty()) {
                    request.close(request.getStatus());
                    if (
                      requestManager.isAllRequestsClosed() &&
                      currentTurn.getCurrentPhase() === "request"
                    ) {
                      currentTurn.proceedToNextPhase();
                      affected.turn = true;
                    }
                  }

                  if (affected.hand) {
                    let allPlayerIds = getAllPlayerIds({
                      game,
                      personManager,
                    });
                    socketResponses.addToBucket(
                      "default",
                      SUBJECTS["PLAYER_HANDS"].GET_KEYED(
                        makeProps(consumerData, {
                          personId: thisPersonId,
                          receivingPeopleIds: allPlayerIds,
                        })
                      )
                    );
                  }

                  // COLLECTIONS

                  if (
                    affected.collections &&
                    affectedIds.collections.length > 0
                  ) {
                    let updatedCollectionIds = [];
                    let removedCollectionIds = [];
                    affectedIds.collections.forEach((id) => {
                      let collectionManager = game.getCollectionManager();
                      if (collectionManager.hasCollection(id)) {
                        updatedCollectionIds.push(id);
                      } else {
                        removedCollectionIds.push(id);
                      }
                    });

                    if (updatedCollectionIds.length > 0) {
                      socketResponses.addToBucket(
                        "everyone",
                        SUBJECTS["COLLECTIONS"].GET_KEYED(
                          makeProps(consumerData, {
                            collectionIds: updatedCollectionIds,
                          })
                        )
                      );
                    }

                    if (removedCollectionIds.length > 0) {
                      socketResponses.addToBucket(
                        "everyone",
                        SUBJECTS["COLLECTIONS"].REMOVE_KEYED(
                          makeProps(consumerData, {
                            collectionIds: removedCollectionIds,
                          })
                        )
                      );
                    }
                  }
                  // PLAYER COLLECTIONS
                  if (
                    affected.playerCollections &&
                    affectedIds.playerCollections.length > 0
                  ) {
                    // Update who has what collection
                    socketResponses.addToBucket(
                      "everyone",
                      SUBJECTS["PLAYER_COLLECTIONS"].GET_KEYED(
                        makeProps(consumerData, {
                          peopleIds: affectedIds.playerCollections,
                        })
                      )
                    );
                  }

                  // REQUESTS
                  if (affected.requests && isDef(affectedIds.requests)) {
                    socketResponses.addToBucket(
                      "everyone",
                      SUBJECTS.REQUESTS.GET_KEYED(
                        makeProps(consumerData, {
                          requestIds: affectedIds.requests,
                        })
                      )
                    );
                    socketResponses.addToBucket(
                      "everyone",
                      SUBJECTS.PLAYER_REQUESTS.GET_KEYED(
                        makeProps(consumerData, { personId: thisPersonId })
                      )
                    ); // maybe have to include other people
                  }

                  // BANK
                  if (affected.bank) {
                    let attendingPeople = personManager.filterPeople(
                      (person) =>
                        person.isConnected() && person.getStatus() === "ready"
                    );
                    let peopleIds = attendingPeople.map((person) =>
                      person.getId()
                    );
                    socketResponses.addToBucket(
                      "default",
                      SUBJECTS["PLAYER_BANKS"].GET_KEYED(
                        makeProps(consumerData, {
                          peopleIds: thisPersonId,
                          receivingPeopleIds: peopleIds,
                        })
                      )
                    );
                  }

                  // PLAYER TURN
                  if (affected.turn) {
                    socketResponses.addToBucket(
                      "everyone",
                      SUBJECTS.PLAYER_TURN.GET({ roomCode })
                    );
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

        return socketResponses;
      },
      makeConsumerFallbackResponse({ subject, action, socketResponses })
    );
  };

  function handleRequestCreation(subject, action, props, doTheThing) {
    let socketResponses = SocketResponseBuckets();
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

        let { logging, game, personManager, thisPersonId } = consumerData;
        let currentTurn = game.getCurrentTurn();
        let actionNum = currentTurn.getActionCount();

        // request manager exists?
        let requestManager = currentTurn.getRequestManager();
        checkpoints.set("requestManagerExists", false);
        if (isDef(requestManager)) {
          checkpoints.set("requestManagerExists", true);

          // Is action phase?
          checkpoints.set("action", false);
          if (currentTurn.getCurrentPhase() === "action") {
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
                let allPlayerIds = getAllPlayerIds({ game, personManager });
                targetPeopleIds = allPlayerIds.filter(
                  (playerId) => String(playerId) !== String(thisPersonId)
                );
              }

              //==========================================================

              let affected = {
                requests: false,
                activePile: false,
                collections: false,
                playerCollections: false,
              };
              let affectedIds = {
                requests: [],
                collections: [],
                playerCollections: [],
              };

              checkpoints.set("success", false);
              doTheThing({
                ...consumerData,
                actionNum,
                requestManager,
                checkpoints,
                affected,
                affectedIds,
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
              let allPlayerIds = getAllPlayerIds({ game, personManager });
              socketResponses.addToBucket(
                "default",
                SUBJECTS["PLAYER_HANDS"].GET_KEYED(
                  makeProps(consumerData, {
                    personId: thisPersonId,
                    receivingPeopleIds: allPlayerIds,
                    logging,
                  })
                )
              );
              if (affected.activePile) {
                socketResponses.addToBucket(
                  "everyone",
                  SUBJECTS.ACTIVE_PILE.GET(makeProps(consumerData))
                );
              }

              if (affected.collections && affectedIds.collections.length > 0) {
                socketResponses.addToBucket(
                  "everyone",
                  SUBJECTS["COLLECTIONS"].GET_KEYED(
                    makeProps(consumerData, {
                      collectionIds: affectedIds.collections,
                    })
                  )
                );
              }

              if (
                affected.playerCollections &&
                affectedIds.playerCollections.length > 0
              ) {
                // Update who has what collection
                socketResponses.addToBucket(
                  "everyone",
                  SUBJECTS["PLAYER_COLLECTIONS"].GET_KEYED(
                    makeProps(consumerData, {
                      peopleIds: affectedIds.playerCollections,
                    })
                  )
                );
              }

              if (affected.requests && affectedIds.requests.length > 0) {
                socketResponses.addToBucket(
                  "everyone",
                  SUBJECTS.PLAYER_REQUESTS.GET_KEYED(
                    makeProps(consumerData, { peopleIds: targetPeopleIds })
                  )
                );
                socketResponses.addToBucket(
                  "everyone",
                  SUBJECTS.REQUESTS.GET_KEYED(
                    makeProps(consumerData, {
                      requestIds: affectedIds.requests,
                    })
                  )
                );
              }
              socketResponses.addToBucket(
                "everyone",
                SUBJECTS.PLAYER_TURN.GET(makeProps(consumerData))
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

  function handleCollectionBasedRequestCreation(
    subject,
    action,
    props,
    doTheThing
  ) {
    let socketResponses = SocketResponseBuckets();
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

        let { logging, game, personManager, thisPersonId } = consumerData;
        let currentTurn = game.getCurrentTurn();
        let actionNum = currentTurn.getActionCount();
        // request manager exists?
        let requestManager = currentTurn.getRequestManager();
        checkpoints.set("requestManagerExists", false);
        if (isDef(requestManager)) {
          checkpoints.set("requestManagerExists", true);

          // Is action phase?
          checkpoints.set("action", false);
          if (currentTurn.getCurrentPhase() === "action") {
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
                          SHOULD.ACTION_AUGMENT_CARDS_COST_ACTION,
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
                        let allPlayerIds = getAllPlayerIds({
                          game,
                          personManager,
                        });
                        targetPeopleIds = allPlayerIds.filter(
                          (playerId) =>
                            String(playerId) !== String(thisPersonId)
                        );
                      }

                      // targetPeopleIds allPlayerIds augmentCardsIds  validAugmentCardsIds
                      //==========================================================

                      let affected = {
                        requests: false,
                        activePile: false,
                      };
                      let affectedIds = {
                        requests: [],
                      };

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
                        affected,
                        affectedIds,
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

                      let allPlayerIds = getAllPlayerIds({
                        game,
                        personManager,
                      });
                      socketResponses.addToBucket(
                        "default",
                        SUBJECTS["PLAYER_HANDS"].GET_KEYED(
                          makeProps(consumerData, {
                            personId: thisPersonId,
                            receivingPeopleIds: allPlayerIds,
                            logging,
                          })
                        )
                      );
                      if (affected.activePile) {
                        socketResponses.addToBucket(
                          "everyone",
                          SUBJECTS.ACTIVE_PILE.GET(makeProps(consumerData))
                        );
                      }

                      if (
                        affected.requests &&
                        affectedIds.requests.length > 0
                      ) {
                        socketResponses.addToBucket(
                          "everyone",
                          SUBJECTS.PLAYER_REQUESTS.GET_KEYED(
                            makeProps(consumerData, {
                              peopleIds: targetPeopleIds,
                            })
                          )
                        );
                        socketResponses.addToBucket(
                          "everyone",
                          SUBJECTS.REQUESTS.GET_KEYED(
                            makeProps(consumerData, {
                              requestIds: affectedIds.requests,
                            })
                          )
                        );
                      }
                      socketResponses.addToBucket(
                        "everyone",
                        SUBJECTS.PLAYER_TURN.GET(makeProps(consumerData))
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

  //==================================================

  //                 Attach Handlers

  //==================================================
  handleConnect();
  thisClient.on("test", () => console.log("TESTING"));
  thisClient.on("request", handleRequests);
  thisClient.on("disconnect", handleDisconnect);
}

module.exports = attachSocketHandlers;
