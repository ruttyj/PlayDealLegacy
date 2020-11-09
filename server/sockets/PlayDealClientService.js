const rootFolder          = `../..`;
const serverFolder        = `${rootFolder}/server`;
const serverSocketFolder  = `${serverFolder}/sockets`;
const gameFolder          = `${serverFolder}/Game`;
const CookieTokenManager  = require("../CookieTokenManager/");

const buildAffected       = require(`${serverFolder}/Lib/Affected`);
const buildOrderedTree    = require(`${serverFolder}/Lib/OrderedTree`);

const OrderedTree             = buildOrderedTree();
const Affected                = buildAffected({OrderedTree});
const ClientManager           = require(`${serverSocketFolder}/client/clientManager.js`);
const RoomManager             = require(`${serverSocketFolder}/room/roomManager.js`);
const GameInstance            = require(`${gameFolder}/`);

// Import generic logic for indexed game data
const KeyedRequest            = require(`${serverSocketFolder}/container/keyedRequest.js`);
const SocketResponseBuckets   = require(`${serverSocketFolder}/socketResponseBuckets.js`); // @TODO rename AddressedResponse
const Transaction             = require(`${gameFolder}/player/request/transfer/Transaction.js`);

const buildDeps               = require(`./Deps.js`);

// Room
const buildCreateRoom         = require(`${serverFolder}/Lib/Room/CreateRoom`);
const buildJoinRoom           = require(`${serverFolder}/Lib/Room/JoinRoom`);
const buildCheckExists        = require(`${serverFolder}/Lib/Room/CheckExists`);

// Turn based
const buildTurnStartingDrawAction           = require(`${serverFolder}/Lib/Actions/TurnPhase/TurnStartingDrawAction`);
const buildAttemptFinishTurnAction          = require(`${serverFolder}/Lib/Actions/TurnPhase/AttemptFinishTurnAction`);
const buildDiscardToHandLimitAction         = require(`${serverFolder}/Lib/Actions/TurnPhase/DiscardToHandLimitAction`);

// Request Value
const buildChargeRentAction                 = require(`${serverFolder}/Lib/Actions/RequestValue/ChargeRentAction`);
const buildRequestValueAction               = require(`${serverFolder}/Lib/Actions/RequestValue/RequestValueAction`);
const buildRespondToCollectValueAction      = require(`${serverFolder}/Lib/Actions/RequestValue/RespondToCollectValueAction`);

// Asset Collection
const buildAcknowledgeCollectNothingAction  = require(`${serverFolder}/Lib/Actions/AssetCollection/AcknowledgeCollectNothingAction`);
const buildCollectCardToBankAutoAction      = require(`${serverFolder}/Lib/Actions/AssetCollection/CollectCardToBankAutoAction`);
const buildCollectCardToBankAction          = require(`${serverFolder}/Lib/Actions/AssetCollection/CollectCardToBankAction`);
const buildCollectCardToCollectionAction    = require(`${serverFolder}/Lib/Actions/AssetCollection/CollectCardToCollectionAction`);
const buildCollectCollectionAction          = require(`${serverFolder}/Lib/Actions/AssetCollection/CollectCollectionAction`);

// Steal Collection
const buildStealCollectionAction            = require(`${serverFolder}/Lib/Actions/StealCollection/StealCollectionAction`);
const buildRespondToStealCollection         = require(`${serverFolder}/Lib/Actions/StealCollection/RespondToStealCollection`);

// Steal Property
const buildStealPropertyAction              = require(`${serverFolder}/Lib/Actions/StealProperty/StealPropertyAction`);
const buildRespondToStealPropertyAction     = require(`${serverFolder}/Lib/Actions/StealProperty/RespondToStealPropertyAction`);

// Swap Property
const buildSwapPropertyAction               = require(`${serverFolder}/Lib/Actions/SwapProperty/SwapPropertyAction`);
const buildRespondToPropertySwapAction      = require(`${serverFolder}/Lib/Actions/SwapProperty/RespondToPropertySwapAction`);

// Draw Cards
const buildDrawCardsAction                  = require(`${serverFolder}/Lib/Actions/DrawCardsAction`);

const buildChangeCardActiveSetAction        = require(`${serverFolder}/Lib/Actions/ChangeCardActiveSetAction`);

// Request Response 
const buildRespondToJustSayNoAction         = require(`${serverFolder}/Lib/Actions/RespondToJustSayNoAction`);

// From Hand
const buildAddCardToBankAction                      = require(`${serverFolder}/Lib/Actions/FromHand/AddCardToBankAction`);
const buildAddPropertyToNewCollectionAction         = require(`${serverFolder}/Lib/Actions/FromHand/AddPropertyToNewCollectionAction`);
const buildAddPropertyToExitingCollectionAction     = require(`${serverFolder}/Lib/Actions/FromHand/AddPropertyToExitingCollectionAction`);
const buildAddSetAugmentToExistingCollectionAction  = require(`${serverFolder}/Lib/Actions/FromHand/AddSetAugmentToExistingCollectionAction`);
const buildAddSetAugmentToNewCollectionAction       = require(`${serverFolder}/Lib/Actions/FromHand/AddSetAugmentToNewCollectionAction`);

// From Collection
const buildTransferPropertyToNewCollectionFromExistingAction          = require(`${serverFolder}/Lib/Actions/FromCollection/TransferPropertyToNewCollectionFromExistingAction`);
const buildTransferPropertyToExistingCollectionFromExistingAction     = require(`${serverFolder}/Lib/Actions/FromCollection/TransferPropertyToExistingCollectionFromExistingAction`);
const buildTransferSetAugmentToExistingCollectionFromExistingAction   = require(`${serverFolder}/Lib/Actions/FromCollection/TransferSetAugmentToExistingCollectionFromExistingAction`);
const buildTransferSetAugmentToNewCollectionFromExistingAction        = require(`${serverFolder}/Lib/Actions/FromCollection/TransferSetAugmentToNewCollectionFromExistingAction`);



/**
 * 
 * TODO #$%^&$#^&$%#^&%$^&%$#%^&$%
 * if discard and actions still remain offer them to play remaining actions
 * When accepting payment from rent place in set if can be placed in set (when no previous set existed)
 * Change color of set / move cards around at "done" phase
 * 
 */
const {
  els,
  isDef,
  isDefNested,
  isFunc,
  isStr,
  isArr,
  getNestedValue,
  log,
  jsonEncode,
  getArrFromProp,
} = require("./utils.js");


class Registry {

  constructor()
  {
    this.PRIVATE_SUBJECTS = {};
    this.PUBLIC_SUBJECTS  = {};
  }

  public(identifier, fn)
  {
    if (isArr(identifier)) {
      let [subject, action] = identifier;
      if (!isDef(this.PUBLIC_SUBJECTS[subject])){
        this.PUBLIC_SUBJECTS[subject] = {};
      }
      this.PUBLIC_SUBJECTS[subject][action] = fn;
    }
  }

  registerPrivate(identifier, fn)
  {
    if (isArr(identifier)) {
      let [subject, action] = identifier;
      if (!isDef(this.PRIVATE_SUBJECTS[subject])){
        this.PRIVATE_SUBJECTS[subject] = {};
      }
      
      this.PRIVATE_SUBJECTS[subject][action] = fn;
    }
  }
}



class PlayDealClientService {
  
  constructor()
  {
  }

  injectDeps()
  {
    let clientManager         = ClientManager();
    let roomManager           = RoomManager();
                                roomManager.setClientManager(clientManager);

    this.clientManager        = clientManager;
    this.roomManager          = roomManager;
    this.cookieTokenManager   = CookieTokenManager.getInstance();

    // Right now all thelistener events are duplicated for every single client instance
    this.todoMove = new Map();
  }
  
  
  connectClient(thisClient)
  {
    const mThisClientId       = thisClient.id;
    const mStrThisClientId    = String(mThisClientId);

    const clientManager       = this.clientManager;
    const roomManager         = this.roomManager;
    const cookieTokenManager  = this.cookieTokenManager;



    const registry            = new Registry();
    this.todoMove.set(mStrThisClientId, registry);
    

    

    //==================================================

    //                  DEPENDENCIES

    //==================================================


    const PRIVATE_SUBJECTS = registry.PRIVATE_SUBJECTS;
    const PUBLIC_SUBJECTS  = registry.PUBLIC_SUBJECTS;
    let {
      makeProps,
      makeResponse,
      makeKeyedResponse,

      getAllKeyedResponse,
      packageCheckpoints,
      getAllPlayerIds,
      getAllPlayers,
      canGameStart,
      createGameInstance,
      canPersonRemoveOtherPerson,

      makePersonSpecificResponses,
      makeConsumerFallbackResponse,
      makeRegularGetKeyed,

      handleRoom,
      handlePerson,

      handleGame,

      _myTurnConsumerBase,
      handleMyTurn,
      handCardConsumer,
      makeConsumer,
      handleTransactionResponse,
      handleTransferResponse,
      handleRequestCreation,
      handleCollectionBasedRequestCreation,
    } = buildDeps({
      els,
      isDef,
      isDefNested,
      isFunc,
      isStr,
      isArr,
      getNestedValue,
      log,
      jsonEncode,
      getArrFromProp,

      //-------------------
      OrderedTree,
      Affected,
      ClientManager,
      RoomManager,
      GameInstance,
      SocketResponseBuckets,
      KeyedRequest,
      PUBLIC_SUBJECTS,
      PRIVATE_SUBJECTS,

      //-------------------
      mThisClientId,
      mStrThisClientId,
      thisClient,
      clientManager,
      roomManager,
      cookieTokenManager,
      //-------------------
    });


    const kitchenSinkDeps = {
      els,
      isDef,
      isDefNested,
      isFunc,
      isStr,
      isArr,
      getNestedValue,
      log,
      jsonEncode,
      getArrFromProp,

      //-------------------
      OrderedTree,
      Affected,
      ClientManager,
      RoomManager,
      GameInstance,
      SocketResponseBuckets,
      KeyedRequest,
      PUBLIC_SUBJECTS,
      PRIVATE_SUBJECTS,
      registry,

      //-------------------
      mThisClientId,
      mStrThisClientId,
      thisClient,
      clientManager,
      roomManager,
      cookieTokenManager,
      //-------------------

      makeProps,
      makeResponse,
      makeKeyedResponse,

      getAllKeyedResponse,
      packageCheckpoints,
      getAllPlayerIds,
      getAllPlayers,
      canGameStart,
      createGameInstance,
      canPersonRemoveOtherPerson,

      makePersonSpecificResponses,
      makeConsumerFallbackResponse,
      makeRegularGetKeyed,

      handleRoom,
      handlePerson,

      handleGame,

      _myTurnConsumerBase,
      handleMyTurn,
      handCardConsumer,
      makeConsumer,
      handleTransactionResponse,
      handleTransferResponse,
      handleRequestCreation,
      handleCollectionBasedRequestCreation,
    }

    //=========================================================================

    //                INTEGRATE GAME MANAGER TO REQUEST TREE 

    //=========================================================================
    /*
      Each method focuses on preforming an action and bundleding information required by the UI 
    */
  

    // These objects will be refactored into build methods 
    Object.assign(PRIVATE_SUBJECTS, {
      CLIENT: {
        CONNECT:    (props) => {},
        DISCONNECT: (props) => {},
      },
      PEOPLE: {
        DISCONNECT: (props) => {
          // when game is in progeress and the user loses connection or closes the browser
          const socketResponses = SocketResponseBuckets();
          const [subject, action] = ["PEOPLE", "DISCONNECT"];
          let status = "failure";
          let payload = {};
          return handlePerson(
            props,
            (props2) => {
              let { roomCode, personManager, thisPerson, thisPersonId } = props2;
              let peopleIds = getArrFromProp(
                props,
                {
                  plural: "peopleIds",
                  singular: "personId",
                },
                thisPersonId
              );
  
              // Foreach person beign removed
              let disconnectedIds = [];
              peopleIds.forEach((personId) => {
                let person = personManager.getPerson(personId);
                if (isDef(person)) {
                  disconnectedIds.push(person.getId());
                  person.disconnect();
                }
              });
  
              socketResponses.addToBucket(
                "everyone",
                PUBLIC_SUBJECTS.PEOPLE.GET_KEYED({
                  peopleIds: disconnectedIds,
                  roomCode,
                })
              );
  
              return socketResponses;
            },
            makeConsumerFallbackResponse({ subject, action, socketResponses })
          );
        },
      },
    });
  
    // @ WARNING These methods are callable by the client
    // DO NOT MAKE AYTHING PUBLIC WHICH COULD ME USED TO SABOTAGE OTHER CLIENTS
    Object.assign(PUBLIC_SUBJECTS, {
      CLIENTS: {
        GET_ONLINE_STATS: () => {
          const socketResponses = SocketResponseBuckets();
          const subject = "CLIENTS";
          const action = "GET_ONLINE_STATS";
          const status = "success";
          const payload = {
            peopleOnlineCount: clientManager.count(),
          };
  
          socketResponses.addToBucket(
            "default",
            makeResponse({ subject, action, status, payload })
          );
  
          const reducedResponses = SocketResponseBuckets();
          reducedResponses.addToBucket(
            socketResponses.reduce(mStrThisClientId, [mStrThisClientId])
          );
          return reducedResponses;
        },
      },
      ROOM: {
        // Get a random room code
        GET_RANDOM_CODE: (props) => {
          const socketResponses = SocketResponseBuckets();
          const [subject, action] = ["ROOM", "GET_RANDOM_CODE"];
  
          let status = "success";
          let payload = {
            code: roomManager.getRandomCode(),
          };
  
          socketResponses.addToBucket(
            "default",
            makeResponse({ subject, action, status, payload })
          );
  
          return socketResponses;
        },
        GET_CURRENT: (props) => {
          const [subject, action] = ["ROOM", "GET_CURRENT"];
          const socketResponses = SocketResponseBuckets();
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
          const [subject, action] = ["ROOM", "GET_KEYED"];
          const socketResponses = SocketResponseBuckets();
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
  
          const socketResponses = SocketResponseBuckets();
          let roomCodes = roomManager.listAllRoomCodes();
          socketResponses.addToBucket(
            "default",
            PUBLIC_SUBJECTS.ROOM.GET_KEYED({
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
        LEAVE: (props) => {
          const [subject, action] = ["ROOM", "LEAVE"];
          const socketResponses = SocketResponseBuckets();
  
          let status = "failure";
          return handleRoom(
            props,
            ({ roomCode, room, personManager, thisPerson, thisPersonId }) => {
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
  
                let reconnectAllowed = false;
  
                let game = room.getGame();
                if (isDef(game)) {
                  let playerManager = game.getPlayerManager();
                  // game is in process
                  if (game.isGameStarted() && !game.isGameOver()) {
                    reconnectAllowed = true;
                  }
  
                  if (reconnectAllowed) {
                    if (playerManager.hasPlayer(thisPersonId)) {
                      reconnectAllowed = true;
                    } else {
                      reconnectAllowed = false;
                    }
                  }
                }
  
                if (reconnectAllowed) {
                  socketResponses.addToBucket(
                    "everyoneElse",
                    PUBLIC_SUBJECTS.PEOPLE.GET_KEYED({
                      personId: thisPersonId,
                      roomCode,
                    })
                  );
  
                  socketResponses.addToBucket(
                    "default",
                    PRIVATE_SUBJECTS.PEOPLE.DISCONNECT({
                      roomCode,
                      personId: thisPerson.getId(),
                    })
                  );
                } else {
                  if (thisPerson.hasTag("host")) {
                    let otherPeople = personManager.getOtherConnectedPeople(
                      thisPerson
                    );
                    if (isDef(otherPeople[0])) {
                      socketResponses.addToBucket(
                        "everyone",
                        PUBLIC_SUBJECTS.PEOPLE.SET_HOST({
                          roomCode,
                          personId: otherPeople[0].getId(),
                        })
                      );
                    } else {
                      //@TODO no one left in room
                    }
                  }
  
                  // Remove person from room
                  socketResponses.addToBucket(
                    "everyone",
                    PUBLIC_SUBJECTS.PEOPLE.REMOVE({
                      roomCode,
                      personId: thisPerson.getId(),
                    })
                  );
                }
              }
  
              return socketResponses;
            },
            makeConsumerFallbackResponse({ subject, action, socketResponses })
          );
        },
      },
      CHAT: {
        SEND_PRIVATE_MESSAGE: (props) => {
          const [subject, action] = ["CHAT", "SEND_PRIVATE_MESSAGE"];
          const socketResponses = SocketResponseBuckets();
          return handlePerson(
            props,
            (props2) => {
              let { type, value, playerKey, thisPersonId } = props2;
              let { personManager } = props2;

              let status = "success";
              let payload = {
                type,
                visibility: "private",
                from: thisPersonId,
                value
              };

              let receivingPerson = personManager.getPerson(playerKey);
              if (isDef(receivingPerson)) {
                socketResponses.addToSpecific(
                  receivingPerson.getClientId(),
                  makeResponse({ subject, action: "RECEIVE_MESSAGE", status, payload })
                );
              }
  
              return socketResponses;
            },
            makeConsumerFallbackResponse({ subject, action, socketResponses })
          );
        },
        SEND_MESSAGE: (props) => {
          const [subject, action] = ["CHAT", "SEND_MESSAGE"];
          const socketResponses = SocketResponseBuckets();
          return handlePerson(
            props,
            (props2) => {
              let { type, value } = props2;
              let { thisPersonId } = props2;

              let status = "success";
              let payload = {
                type,
                visibility: "public",
                from: thisPersonId,
                value
              };
  
              socketResponses.addToBucket(
                "everyone",
                makeResponse({ subject, action: "RECEIVE_MESSAGE", status, payload })
              );
  
              return socketResponses;
            },
            makeConsumerFallbackResponse({ subject, action, socketResponses })
          );
        },
        /**
         * @param userIds
         */
        RECEIVE_MESSAGE: () => {
          // emit to user
          // roomCode
          const [subject, action] = ["CHAT", "RECEIVE_MESSAGE"];
          const socketResponses = SocketResponseBuckets();
          return handlePerson(
            props,
            (props2) => {
              let { message } = props2;

              let status = "success";
              let payload = {
                type: "text",
                message
              };
  
              socketResponses.addToBucket(
                "everyoneElse",
                makeResponse({ subject, action, status, payload })
              );
  
              return socketResponses;
            },
            makeConsumerFallbackResponse({ subject, action, socketResponses })
          );
        },
        /**
         * 
         */
        GET_ALL_MESSAGES: (props) => {
          //
        },
      },
      PEOPLE: {
        UPDATE_MY_NAME: (props) => {
          // roomCode
          const [subject, action] = ["PEOPLE", "UPDATE_MY_NAME"];
          const socketResponses = SocketResponseBuckets();
          return handlePerson(
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
                    PUBLIC_SUBJECTS.PEOPLE.GET_KEYED({
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
          const [subject, action] = ["PEOPLE", "ME"];
          const socketResponses = SocketResponseBuckets();
          return handlePerson(
            props,
            (props2) => {
              let { thisPersonId, thisPerson } = props2;
  
              let status = "success";
              let payload = {
                me: thisPersonId,
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
        GET_HOST: (props) => {
          // roomCode
          const [subject, action] = ["PEOPLE", "GET_HOST"];
          const socketResponses = SocketResponseBuckets();
          return handlePerson(
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
          const [subject, action] = ["PEOPLE", "SET_HOST"];
          const socketResponses = SocketResponseBuckets();
          return handlePerson(
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
                PUBLIC_SUBJECTS.PEOPLE.GET_HOST({
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
          const socketResponses = SocketResponseBuckets();
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
              PUBLIC_SUBJECTS.PEOPLE.GET_KEYED({
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
          const socketResponses = SocketResponseBuckets();
          const [subject, action] = ["PEOPLE", "GET_KEYED"];
          let peopleIds = getArrFromProp(props, {
            plural: "peopleIds",
            singular: "personId",
          });
  
          let payload = {
            items: {},
            order: [],
          };
  
          return handleRoom(
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
          const socketResponses = SocketResponseBuckets();
          const [subject, action] = ["PEOPLE", "REMOVE"];
          let message = "Failed to remove people.";
  
          return handlePerson(
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
                    PUBLIC_SUBJECTS.PEOPLE.SET_HOST({
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
          const [subject, action] = ["PEOPLE", "UPDATE_MY_STATUS"];
          const socketResponses = SocketResponseBuckets();
          let payload = null;
          let requestStatus = "failure";
          return handlePerson(
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
                PUBLIC_SUBJECTS.PEOPLE.GET_KEYED({
                  personId: thisPersonId,
                  roomCode,
                })
              );
  
              socketResponses.addToBucket(
                "default",
                PUBLIC_SUBJECTS.GAME.CAN_START({ roomCode })
              );
              return socketResponses;
            },
            makeConsumerFallbackResponse({ subject, action, socketResponses })
          );
        },
      },
      GAME: {
        /**
         * @PROPS {String} roomCode
         */
        GET_UPDATED_PILES: (props) => {
          const { roomCode } = props;
  
          const socketResponses = SocketResponseBuckets();
          if (isDef(roomCode)) {
            socketResponses.addToBucket(
              "default",
              PUBLIC_SUBJECTS["DRAW_PILE"].GET({ roomCode })
            );
  
            socketResponses.addToBucket(
              "default",
              PUBLIC_SUBJECTS["DISCARD_PILE"].GET({ roomCode })
            );
  
            socketResponses.addToBucket(
              "default",
              PUBLIC_SUBJECTS["ACTIVE_PILE"].GET({ roomCode })
            );
          }
          return socketResponses;
        },
        RESET: (props) => {
          const [subject, action] = ["GAME", "RESET"];
          const socketResponses = SocketResponseBuckets();
          return handleRoom(
            props,
            (consumerData) => {
              const { room } = consumerData;
              let status = "success";
              let payload = null;
  
              createGameInstance(room);
  
              socketResponses.addToBucket(
                "everyone",
                PUBLIC_SUBJECTS.PLAYER_REQUESTS.REMOVE_ALL(
                  makeProps(consumerData)
                )
              );
              socketResponses.addToBucket(
                "everyone",
                PUBLIC_SUBJECTS.REQUESTS.REMOVE_ALL(makeProps(consumerData))
              );
  
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
          const [subject, action] = ["GAME", "UPDATE_CONFIG"];
          let payload = null;
          let status = "failure";
          const socketResponses = SocketResponseBuckets();
          return handlePerson(
            props,
            (consumerData, checkpoints) => {
              const { config } = consumerData;
              const { roomCode, room } = consumerData;
  
              const game = room.getGame();
  
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
                PUBLIC_SUBJECTS.GAME.GET_CONFIG({ roomCode })
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
          const [subject, action] = ["GAME", "GET_CONFIG"];
          let payload = null;
          let status = "failure";
          const socketResponses = SocketResponseBuckets();
          return handlePerson(
            props,
            (consumerData) => {
              const { room } = consumerData;
  
              const game = room.getGame();
  
              status = "success";
              payload = {
                updatedConfig: isDef(game) ? game.getConfig() : null,
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
          const [subject, action] = ["GAME", "STATUS"];
          const socketResponses = SocketResponseBuckets();
          return handlePerson(
            props,
            (props2) => {
              let { room } = props2;
  
              const game = room.getGame();
              let isGameStarted = isDef(game) ? game.isGameStarted() : false;
              let isGameOver = isDef(game) ? game.isGameOver() : false;
              let isInProgress = isGameStarted && !isGameOver;
              let winningCondition = isDef(game)
                ? game.getWinningCondition()
                : null;
  
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
          const [subject, action] = ["GAME", "START"];
          const socketResponses = SocketResponseBuckets();
          return handlePerson(
            props,
            (consumerData) => {
              let { roomCode, personManager, thisPerson, room } = consumerData;
              let game = room.getGame();
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
                  PUBLIC_SUBJECTS.PLAYER_REQUESTS.REMOVE_ALL(
                    makeProps(consumerData)
                  )
                );
                socketResponses.addToBucket(
                  "everyone",
                  PUBLIC_SUBJECTS.REQUESTS.REMOVE_ALL(makeProps(consumerData))
                );
  
                socketResponses.addToBucket(
                  "everyone",
                  PUBLIC_SUBJECTS["PROPERTY_SETS"].GET_ALL_KEYED({ roomCode })
                );
                socketResponses.addToBucket(
                  "everyone",
                  PUBLIC_SUBJECTS["CARDS"].GET_ALL_KEYED({ roomCode })
                );
                socketResponses.addToBucket(
                  "everyone",
                  PUBLIC_SUBJECTS["PLAYERS"].GET({ roomCode })
                );
                socketResponses.addToBucket(
                  "default",
                  PUBLIC_SUBJECTS["PLAYER_HANDS"].GET_KEYED(
                    specificPropsForEveryone
                  )
                );
                socketResponses.addToBucket(
                  "default",
                  PUBLIC_SUBJECTS["PLAYER_BANKS"].GET_KEYED(
                    specificPropsForEveryone
                  )
                );
                socketResponses.addToBucket(
                  "everyone",
                  PUBLIC_SUBJECTS["COLLECTIONS"].GET_ALL_KEYED({
                    roomCode,
                    peopleIds: peopleIds,
                  })
                );
                socketResponses.addToBucket(
                  "everyone",
                  PUBLIC_SUBJECTS["PLAYER_COLLECTIONS"].GET_ALL_KEYED({
                    roomCode,
                    peopleIds: peopleIds,
                  })
                );
                socketResponses.addToBucket(
                  "everyone",
                  PUBLIC_SUBJECTS["DRAW_PILE"].GET({ roomCode })
                );
                socketResponses.addToBucket(
                  "everyone",
                  PUBLIC_SUBJECTS["ACTIVE_PILE"].GET({ roomCode })
                );
  
                socketResponses.addToBucket(
                  "everyone",
                  PUBLIC_SUBJECTS["DISCARD_PILE"].GET({ roomCode })
                );
  
                socketResponses.addToBucket(
                  "everyone",
                  PUBLIC_SUBJECTS["GAME"].STATUS({ roomCode })
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
                  PUBLIC_SUBJECTS["PLAYER_TURN"].GET({ roomCode })
                );
              }
              return socketResponses;
            },
            makeConsumerFallbackResponse({ subject, action, socketResponses })
          );
        },
        CAN_START: (props) => {
          // roomCode
          const [subject, action] = ["GAME", "CAN_START"];
          const socketResponses = SocketResponseBuckets();
          return handlePerson(
            props,
            (props2) => {
              let { room, personManager } = props2;
  
              let game = room.getGame();
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
          const socketResponses = SocketResponseBuckets();
          return handleGame(
            props,
            (consumerData) => {
              let { game } = consumerData;
  
              let myKeyedRequest = KeyedRequest();
              myKeyedRequest.setAction(action);
              myKeyedRequest.setSubject(subject);
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
          const socketResponses = SocketResponseBuckets();
          return handleGame(
            props,
            (consumerData) => {
              // Config
              let { game } = consumerData;
  
              let myKeyedRequest = KeyedRequest();
              myKeyedRequest.setAction(action);
              myKeyedRequest.setSubject(subject);
              myKeyedRequest.setSingularKey("propertySetKey");
              myKeyedRequest.setPluralKey("propertySetKeys");
              myKeyedRequest.setProps(consumerData);
              myKeyedRequest.setAllKeysFn(game.getAllPropertySetKeys);
  
              // Get data
              socketResponses.addToBucket(
                "default",
                getAllKeyedResponse(PUBLIC_SUBJECTS, myKeyedRequest)
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
          const socketResponses = SocketResponseBuckets();
          return handleGame(
            props,
            (consumerData) => {
              // Config
              let { game } = consumerData;
  
              let myKeyedRequest = KeyedRequest();
              myKeyedRequest.setAction(action);
              myKeyedRequest.setSubject(subject);
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
          const socketResponses = SocketResponseBuckets();
          return handleGame(
            props,
            (consumerData) => {
              // Config
              let { game } = consumerData;
  
              let myKeyedRequest = KeyedRequest();
              myKeyedRequest.setAction(action);
              myKeyedRequest.setSubject(subject);
              myKeyedRequest.setSingularKey("cardId");
              myKeyedRequest.setPluralKey("cardIds");
              myKeyedRequest.setProps(consumerData);
              myKeyedRequest.setAllKeysFn(game.getAllCardIds);
  
              // Get data
              socketResponses.addToBucket(
                "default",
                getAllKeyedResponse(PUBLIC_SUBJECTS, myKeyedRequest)
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
      DISCARD_PILE: {
        GET: (props) => {
          let subject = "DISCARD_PILE";
          let action = "GET";
          const socketResponses = SocketResponseBuckets();
          return handleGame(
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
      },
      ACTIVE_PILE: {
        GET: (props) => {
          let subject = "ACTIVE_PILE";
          let action = "GET";
          const socketResponses = SocketResponseBuckets();
          return handleGame(
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
      },
      DRAW_PILE: {
        GET: (props) => {
          let subject = "DRAW_PILE";
          let action = "GET";
          const socketResponses = SocketResponseBuckets();
          return handleGame(
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
      },
      PLAYERS: {
        GET: (props) => {
          const [subject, action] = ["PLAYERS", "GET"];
          const socketResponses = SocketResponseBuckets();
          return handleGame(
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
          const socketResponses = SocketResponseBuckets();
          return handleGame(
            props,
            ({ cardIds, game, personId }) => {
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
          const socketResponses = SocketResponseBuckets();
          return handleGame(
            props,
            (consumerData) => {
              let { game, thisPersonId } = consumerData;
              let currentTurn = game.getCurrentTurn();
  
              if (currentTurn.getPhaseKey() === "discard") {
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
  
              //socketResponses.addToBucket("default", PUBLIC_SUBJECTS.PLAYER_REQUESTS.REMOVE_ALL(makeProps(consumerData)));
              //socketResponses.addToBucket("default", PUBLIC_SUBJECTS.REQUESTS.REMOVE_ALL(makeProps(consumerData)));
  
              return socketResponses;
            },
            makeConsumerFallbackResponse({ subject, action, socketResponses })
          );
        },
      },
      PLAYER_HANDS: {
        /**
         * GET PLAYER HAND
         * The information will be tailored for each recipient.
         *
         * @param.props[receivingPeopleIds|receivingPersonId] {array|string}   People who will receive the information
         * @param.props[peopleIds|personId] {array|string}                     The players who's information changed - assumed this person by default
         */
        // props = {roomCode, personId, (receivingPeopleIds|receivingPersonId), (peopleIds|personId)}
        GET_KEYED: (props) => {
          const [subject, action] = ["PLAYER_HANDS", "GET_KEYED"];
          const socketResponses = SocketResponseBuckets();
  
          return handleGame(
            props,
            (props2) => {
              let { game } = props2;
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
          const socketResponses = SocketResponseBuckets();
          return handleGame(
            props,
            (props2) => {
              let { personManager, game } = props2;
  
              let peopleIds = getAllPlayers(game, personManager).map((person) =>
                person.getId()
              );
  
              socketResponses.addToBucket(
                "default",
                PUBLIC_SUBJECTS[subject].GET_KEYED({
                  ...props2,
                  peopleIds,
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
          const socketResponses = SocketResponseBuckets();
          return handleGame(
            props,
            (props2) => {
              let { game } = props2;
              let getBankData = (ownerPersonId) => {
                const playerBank = game.getPlayerBank(ownerPersonId);
                if (isDef(playerBank)) {
                  return playerBank.serialize();
                }
                return null;
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
          const socketResponses = SocketResponseBuckets();
          return handleGame(
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
                PUBLIC_SUBJECTS[subject].GET_KEYED({
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
          const socketResponses = SocketResponseBuckets();
  
          return handleGame(
            props,
            (consumerData) => {
              let { game } = consumerData;
  
              let myKeyedRequest = KeyedRequest();
              myKeyedRequest.setAction(action);
              myKeyedRequest.setSubject(subject);
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
          const socketResponses = SocketResponseBuckets();
          return handleGame(
            props,
            (consumerData) => {
              status = "success";
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
        ...makeRegularGetKeyed({
          SUBJECTS: PUBLIC_SUBJECTS,
          subject: "REQUESTS",
          singularKey: "requestId",
          pluralKey: "requestIds",
          makeGetDataFn: ({ game, subject, action }, checkpoints) => (
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
            return result;
          },
          makeGetAllKeysFn: ({ game, subject, action }, checkpoints) => () => {
            let result = game
              .getCurrentTurn()
              .getRequestManager()
              .getAllRequestIds();
            return result;
          },
          makeGetAlMyKeysFn: (
            { game, thisPersonId, subject, action },
            checkpoints
          ) => () => {
            let result = game
              .getCurrentTurn()
              .getRequestManager()
              .getAllRequestIdsForPlayer(thisPersonId);
            return result;
          },
        }),
        REMOVE_ALL: (props) => {
          let subject = "REQUESTS";
          let action = "REMOVE_ALL";
          let status = "failure";
          let payload = null;
          const socketResponses = SocketResponseBuckets();
          return handleGame(
            props,
            (consumerData) => {
              status = "success";
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
          const socketResponses = SocketResponseBuckets();
          return handleGame(
            props,
            (consumerData) => {
              let { game } = consumerData;
  
              let myKeyedRequest = KeyedRequest();
              myKeyedRequest.setAction(action);
              myKeyedRequest.setSubject(subject);
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
          const socketResponses = SocketResponseBuckets();
          return handleGame(
            props,
            (consumerData) => {
              // Config
              let { game, personManager } = consumerData;
  
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
              myKeyedRequest.setPluralKey("peopleIds");
              myKeyedRequest.setSingularKey("personId");
              myKeyedRequest.setProps(consumerData);
              myKeyedRequest.setAllKeysFn(() =>
                getAllPlayerIds({ game, personManager })
              );
  
              // Get data
              socketResponses.addToBucket(
                "default",
                getAllKeyedResponse(PUBLIC_SUBJECTS, myKeyedRequest)
              );
  
              return socketResponses;
            },
            makeConsumerFallbackResponse({ subject, action, socketResponses })
          );
        },
      },
      COLLECTIONS: {
        ...makeRegularGetKeyed({
          SUBJECTS: PUBLIC_SUBJECTS,
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
        DUMP_STATE: (props) => {
          const [subject, action] = ["CHEAT", "DUMP_STATE"];
          const socketResponses = SocketResponseBuckets();
          return handleGame(
            props,
            (consumerData) => {
              let { game } = consumerData;
              if (game.constants.IS_TEST_MODE) {
                
                let status = "success";
                let payload = game.serialize();

                // Might as well display to everyone if we are cheating....
                socketResponses.addToBucket(
                  "everyone",
                  makeResponse({ subject, action, status, payload })
                );
              }
  
              return socketResponses;
            }
          );
        },
      },
    });


    //==================================================
  
    //                  BUILD ACTIONS
  
    //==================================================

    const commonDeps = {
      // Helpers
      isDef, isArr, isFunc, 
      getArrFromProp, packageCheckpoints, makeProps,
      // Reference
      PUBLIC_SUBJECTS,
      PRIVATE_SUBJECTS,
      // Structures
      Affected, 
      Transaction,
      SocketResponseBuckets,
      // Props
      myClientId: mStrThisClientId,
      roomManager, 
    }

    // Enable Actions
    //if (enabled.chargeRent)    
    let enabled = {
      requestValue: true,
        chargeRent: true, // extends is requestValue
      stealCollection: true,
      collectCards: true,
      justSayNo: true,
      stealProperty: true,
      swapProperty: true,
    }

    // REQUEST VALUE
    if (enabled.requestValue) {
      // CHARGE RENT
      if (enabled.chargeRent) {
        registry.public(['MY_TURN', 'CHARGE_RENT'], buildChargeRentAction({
            ...commonDeps,
            makeConsumerFallbackResponse,
            handleGame,
            handleCollectionBasedRequestCreation,
            makeConsumerFallbackResponse,
          })
        )
      }

        
      registry.public(['MY_TURN', 'VALUE_COLLECTION'], buildRequestValueAction({
          ...commonDeps,
          makeConsumerFallbackResponse,
          makeResponse,
          handleGame, 
          isDefNested,
          handleRequestCreation,
        })
      )
        

      registry.public(['RESPONSES', 'RESPOND_TO_COLLECT_VALUE'], buildRespondToCollectValueAction({
          ...commonDeps,
          makeConsumerFallbackResponse,
          makeResponse,
          handleGame, 
          handleTransactionResponse,
        })
      )
    }

    // Draw Cards
    registry.public(['MY_TURN', 'PLAY_PASS_GO'],
      buildDrawCardsAction({
        ...commonDeps,
        makeConsumerFallbackResponse,
        makeResponse,
        handCardConsumer,
      })
    )

    // Card Manipulation
    registry.public(['MY_TURN', 'CHANGE_CARD_ACTIVE_SET'],
      buildChangeCardActiveSetAction({
        ...commonDeps,
        makeResponse,
        handleMyTurn,
        makeConsumerFallbackResponse,
        packageCheckpoints,
        makeResponse,
      })
    )

    // Add From Hand
    if (1) {
      registry.public(['MY_TURN', 'ADD_CARD_TO_MY_BANK_FROM_HAND'],
        buildAddCardToBankAction({
          ...commonDeps,
          makeConsumerFallbackResponse,
          makeResponse,
          packageCheckpoints,
          handCardConsumer,
          log,
        })
      )

      registry.public(['MY_TURN', 'ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND'],
        buildAddPropertyToNewCollectionAction({
          ...commonDeps,
          makeConsumerFallbackResponse,
          makeResponse,
          packageCheckpoints,
          handCardConsumer,
          log,
        })
      )

      registry.public(['MY_TURN', 'ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND'],
        buildAddPropertyToExitingCollectionAction({
          ...commonDeps,
          makeConsumerFallbackResponse,
          makeResponse,
          packageCheckpoints,
          handCardConsumer,
          log,
        })
      )

      registry.public(['MY_TURN', 'ADD_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_HAND'],
        buildAddSetAugmentToExistingCollectionAction({
          ...commonDeps,
          makeConsumerFallbackResponse,
          makeResponse,
          packageCheckpoints,
          handCardConsumer,
        })
      )

      registry.public(['MY_TURN', 'TRANSFER_SET_AUGMENT_TO_NEW_COLLECTION_FROM_HAND'],
        buildAddSetAugmentToNewCollectionAction({
          ...commonDeps,
          makeConsumerFallbackResponse,
          makeResponse,
          packageCheckpoints,
          handCardConsumer,
          handleMyTurn,
        })
      )
    }


    // Transfer From Collections
    if (1) {
      registry.public(['MY_TURN', 'TRANSFER_PROPERTY_TO_NEW_COLLECTION_FROM_COLLECTION'],
        buildTransferPropertyToNewCollectionFromExistingAction({
          ...commonDeps,
          makeConsumerFallbackResponse,
          makeResponse,
          packageCheckpoints,
          handCardConsumer,
          handleMyTurn,
        })
      )
      registry.public(['MY_TURN', 'TRANSFER_PROPERTY_TO_EXISTING_COLLECTION_FROM_COLLECTION'],
        buildTransferPropertyToExistingCollectionFromExistingAction({
          ...commonDeps,
          makeConsumerFallbackResponse,
          makeResponse,
          packageCheckpoints,
          handCardConsumer,
          handleMyTurn,
        })
      )

      registry.public(['MY_TURN', 'TRANSFER_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_COLLECTION'],
        buildTransferSetAugmentToExistingCollectionFromExistingAction({
          ...commonDeps,
          makeConsumerFallbackResponse,
          makeResponse,
          packageCheckpoints,
          handCardConsumer,
          handleMyTurn,
        })
      )

      registry.public(['MY_TURN', 'TRANSFER_SET_AUGMENT_TO_NEW_COLLECTION_FROM_COLLECTION'],
        buildTransferSetAugmentToNewCollectionFromExistingAction({
          ...commonDeps,
          makeConsumerFallbackResponse,
          makeResponse,
          packageCheckpoints,
          handCardConsumer,
          handleMyTurn,
        })
      )
    }

    // Rooms
    if (1) {
      registry.public(['ROOM', 'CREATE'],
        buildCreateRoom({
          ...commonDeps,
          makeConsumerFallbackResponse,
          makeResponse,
          packageCheckpoints,
          handCardConsumer,
          handleMyTurn,
          els,
          roomManager,
          createGameInstance,
        })
      )

      registry.public(['ROOM', 'JOIN'],
        buildJoinRoom({
          ...commonDeps,
          makeResponse,
          els,
          handleRoom,
          roomManager,
          cookieTokenManager,
          thisClientKey: mStrThisClientId,
          thisClient,
        })
      )

      registry.public(['ROOM', 'EXISTS'],
        buildCheckExists({
          ...commonDeps,
          makeResponse,
          els,
          handleRoom,
          roomManager,
          cookieTokenManager,
          thisClientKey: mStrThisClientId,
          thisClient,
          getArrFromProp,
        })
      )
    }
      

    // REACT WITH JUST_SAY_NO
    if (enabled.justSayNo) {
      registry.public(['RESPONSES', 'RESPOND_TO_JUST_SAY_NO'],
        buildRespondToJustSayNoAction({
          ...commonDeps,
          makeConsumerFallbackResponse,
          makeResponse,
          handleGame, 
          handleTransactionResponse,
        })
      )
    }

    // STEAL COLLECTION
    if (enabled.stealCollection) {
      registry.public(['MY_TURN', 'STEAL_COLLECTION'],
        buildStealCollectionAction({
          ...commonDeps,
          handleRequestCreation,
        })
      )

      registry.public(['RESPONSES', 'RESPOND_TO_STEAL_COLLECTION'],
        buildRespondToStealCollection({
          ...commonDeps,
          handleTransactionResponse,
        })     
      )
    }

    // STEAL_PROPERTY
    if (enabled.stealProperty) {
      registry.public(['MY_TURN', 'STEAL_PROPERTY'],
        buildStealPropertyAction({
          ...commonDeps,
          handleRequestCreation,
        }) 
      )

      registry.public(['RESPONSES', 'RESPOND_TO_STEAL_PROPERTY'],
        buildRespondToStealPropertyAction({
          ...commonDeps,
          handleTransactionResponse,
        }) 
      )
    }

    // SWAP_PROPERTY
    if (enabled.swapProperty) {    
      registry.public(['MY_TURN', 'SWAP_PROPERTY'],
        buildSwapPropertyAction({
          ...commonDeps,
          handleRequestCreation,
        }) 
      )

      registry.public(['RESPONSES', 'RESPOND_TO_PROPERTY_SWAP'],
        buildRespondToPropertySwapAction({
          ...commonDeps,
          handleTransactionResponse
        }) 
      )
    }


    // Turn based
    if (1) {
      registry.public(['MY_TURN','TURN_STARTING_DRAW'],
        buildTurnStartingDrawAction({
          ...commonDeps,
          SocketResponseBuckets,
          PUBLIC_SUBJECTS,
          makeConsumerFallbackResponse,
          handleMyTurn,
          makeResponse,
        }) 
      )

      registry.public(['MY_TURN', 'FINISH_TURN'],
        buildAttemptFinishTurnAction({
          ...commonDeps,
          SocketResponseBuckets,
          PUBLIC_SUBJECTS,
          makeConsumerFallbackResponse,
          handleMyTurn,
          makeResponse,
          makeProps,
        }) 
      )

      registry.public(['MY_TURN', 'DISCARD_REMAINING'],
        buildDiscardToHandLimitAction({
          ...commonDeps,
          SocketResponseBuckets,
          PUBLIC_SUBJECTS,
          makeConsumerFallbackResponse,
          handleMyTurn,
          makeResponse,
          makeProps,
          els,
        }) 
      )
    }

    // COLLECT CARDS
    if (enabled.collectCards) {
      registry.public(['RESPONSES', 'ACKNOWLEDGE_COLLECT_NOTHING'],
        buildAcknowledgeCollectNothingAction({
          ...commonDeps,
          handleTransactionResponse
        }) 
      )

      registry.public(['RESPONSES', 'COLLECT_CARD_TO_BANK_AUTO'],
        buildCollectCardToBankAutoAction({
          ...commonDeps,
          handleTransferResponse,
        }) 
      )

      registry.public(['RESPONSES', 'COLLECT_CARD_TO_BANK'],
        buildCollectCardToBankAction({
          ...commonDeps,
          handleTransferResponse,
        }) 
      )

      registry.public(['RESPONSES', 'COLLECT_CARD_TO_COLLECTION'],
        buildCollectCardToCollectionAction({
          ...commonDeps,
          handleTransferResponse,
        }) 
      )
        
      registry.public(['RESPONSES','COLLECT_COLLECTION'],
        buildCollectCollectionAction({
          ...commonDeps,
          handleTransferResponse
        }) 
      )
    }


      

    //==================================================
  
    //                    HANDLERS
  
    //==================================================
    // #region HANDLERS
    function handleConnect() {
      clientManager.addClient(thisClient);
    }
  
    const makeRequestHandle = (subjectMap) => (encodedData) => {
      const socketResponses = SocketResponseBuckets();
      let requests = isStr(encodedData) ? JSON.parse(encodedData) : encodedData;
      let clientPersonMapping = {};
  
      if (isArr(requests)) {
        requests.forEach((request) => {
          let requestResponses = SocketResponseBuckets();
  
          let subject = request.subject;
          let action = request.action;
          let props = els(request.props, {});
  
          if (isDef(subjectMap[subject])) {
            if (isDef(subjectMap[subject][action])) {
              // @TODO add a way of limiting the props which can be passed to method from the client
              // We may want to push data to clients but not allow it to be abused
              let actionResult = subjectMap[subject][action](props);
  
              requestResponses.addToBucket("default", actionResult);
            }
          }
  
          // Collect person Ids
          let clientIdsMap = {};
          clientIdsMap[mStrThisClientId] = true;
          handleRoom(props, ({ personManager }) => {
            personManager.getConnectedPeople().forEach((person) => {
              clientIdsMap[String(person.getClientId())] = true;
              clientPersonMapping[String(person.getClientId())] = person;
            });
          });
  
          // Assing the buckets of reponses to the relevent clients
          let clientIds = Object.keys(clientIdsMap);
          socketResponses.addToBucket(
            requestResponses.reduce(mStrThisClientId, clientIds)
          );
        });
      }
  
      // Emit to "me" since I am always available
      if (socketResponses.specific.has(String(mStrThisClientId))) {
        let resp = socketResponses.specific.get(mStrThisClientId);
        thisClient.emit("response", jsonEncode(resp));
      }
      // Emit to other relevent people collected from the above requests
      Object.keys(clientPersonMapping).forEach((clientId) => {
        if (mStrThisClientId !== clientId) {
          let person = clientPersonMapping[clientId];
          if (socketResponses.specific.has(clientId)) {
            let resp = socketResponses.specific.get(clientId);
            person.emit("response", jsonEncode(resp));
          }
        }
      });
    };
  
    function handleClientDisconnect() {
      let clientId = thisClient.id;
      let rooms = roomManager.getRoomsForClientId(clientId);
      cookieTokenManager.dissociateClient(clientId);
  
      if (isDef(rooms)) {
        let handleIo = makeRequestHandle(PUBLIC_SUBJECTS);
        rooms.forEach((room) => {
          handleIo(
            JSON.stringify([
              {
                subject: "ROOM",
                action: "LEAVE",
                props: { roomCode: room.getCode() },
              },
            ])
          );
  
          // Handle leave room since the above handler requires the room to exist to notify people
          let roomPersonManager = room.getPersonManager();
          if (roomPersonManager.getConnectedPeopleCount() === 0) {
            roomManager.deleteRoom(room.getId());
          }
        });
      }
      clientManager.removeClient(thisClient);
    }
    // #endregion
  




    //==================================================
  
    //                 Attach Handlers
  
    //==================================================
    handleConnect();
    thisClient.on("request",  makeRequestHandle(PUBLIC_SUBJECTS));
    thisClient.on("disconnect", handleClientDisconnect);
  }
}

module.exports = PlayDealClientService;
