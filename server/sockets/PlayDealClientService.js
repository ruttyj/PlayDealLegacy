const rootFolder = `../..`;
const serverFolder = `${rootFolder}/server`;
const serverSocketFolder = `${serverFolder}/sockets`;
const gameFolder = `${serverFolder}/Game`;
const CookieTokenManager = require("../CookieTokenManager/");

const buildAffected = require(`${serverFolder}/Lib/Affected`);
const buildOrderedTree = require(`${serverFolder}/Lib/OrderedTree`);

const buildCoreFuncs = require(`${serverFolder}/Lib/Actions/ActionsCore`);


// Turn based
const buildTurnStartingDrawAction         = require(`${serverFolder}/Lib/Actions/TurnPhase/TurnStartingDrawAction`);
const buildAttemptFinishTurnAction        = require(`${serverFolder}/Lib/Actions/TurnPhase/AttemptFinishTurnAction`);
const buildDiscardToHandLimitAction       = require(`${serverFolder}/Lib/Actions/TurnPhase/DiscardToHandLimitAction`);


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

// Room
const buildCreateRoom         = require(`${serverFolder}/Lib/Room/CreateRoom`);
const buildJoinRoom           = require(`${serverFolder}/Lib/Room/JoinRoom`);
const buildCheckExists        = require(`${serverFolder}/Lib/Room/CheckExists`);

const OrderedTree = buildOrderedTree();
const Affected = buildAffected({OrderedTree});



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
  setNestedValue,
  log,
  jsonLog,
  jsonEncode,
  getArrFromProp,
} = require("./utils.js");

const ClientManager = require(`${serverSocketFolder}/client/clientManager.js`);
const RoomManager = require(`${serverSocketFolder}/room/roomManager.js`);
const GameInstance = require(`${gameFolder}/`);
const cookieTokenManager = CookieTokenManager.getInstance();

// Import generic logic for indexed game data
const KeyedRequest = require(`${serverSocketFolder}/container/keyedRequest.js`);
const SocketResponseBuckets = require(`${serverSocketFolder}/socketResponseBuckets.js`);
const Transaction = require(`${gameFolder}/player/request/transfer/Transaction.js`);

const {
  CONFIG, // CONFIG Options
  IS_TEST_MODE,
  AMBIGUOUS_SET_KEY,
  NON_PROPERTY_SET_KEYS,
} = require(`${gameFolder}/config/constants.js`);



class PlayDealClientService {
  
  constructor() { 
    this.deps = {};
  }

  injectDeps() {
    let clientManager = ClientManager();
    let roomManager = RoomManager(); // @TODO Still needs to remove rooms
    roomManager.setClientManager(clientManager);

    this.deps.clientManager = clientManager;
    this.deps.roomManager = roomManager;
  }
  
  connectClient(thisClient) {
    let clientManager = this.deps.clientManager;
    let roomManager = this.deps.roomManager;


    
    //==================================================

    //                  DEPENDENCIES

    //==================================================

    // #region DEPENDENCIES
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

    function makeKeyedResponse(keyedRequest) {
      var subject, action, props, nomenclature, getData, fallback;

      subject = keyedRequest.getSubject();
      action = keyedRequest.getAction();
      props = keyedRequest.getProps();
      getData = keyedRequest.getDataFn();
      nomenclature = {
        plural: keyedRequest.getPluralKey(),
        singular: keyedRequest.getSingularKey(),
      };
      fallback = keyedRequest.getFallback();

      fallback = els(fallback, undefined);
      const socketResponses = SocketResponseBuckets();

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

      socketResponses.addToBucket(
        "default",
        makeResponse({ subject, action, status, payload })
      );
      return socketResponses;
    }

    function getAllKeyedResponse(PUBLIC_SUBJECTS, keyedRequest) {
      var subject, action, props, propName, getAllKeys;
      subject = keyedRequest.getSubject();
      action = keyedRequest.getAction();
      props = keyedRequest.getProps();
      propName = keyedRequest.getPluralKey();
      getAllKeys = keyedRequest.getAllKeysFn();

      const socketResponses = SocketResponseBuckets();
      socketResponses.addToSpecific(
        "default",
        makeResponse({ subject, action, status: "success", payload: null })
      );
      let getProps = {
        subject,
        action,
        ...props,
      };
      getProps[propName] = getAllKeys();
      socketResponses.addToBucket(
        "default",
        PUBLIC_SUBJECTS[subject].GET_KEYED(getProps)
      );

      return socketResponses;
    }

    function packageCheckpoints(checkpoints) {
      if (isDef(checkpoints)) {
        let dumpCheckpoint = {};
        checkpoints.forEach((value, message) => (dumpCheckpoint[message] = value));
        return dumpCheckpoint;
      }
      return null;
    }

    function getAllPlayerIds({ game }) {
      return game.getPlayerManager().getAllPlayerKeys();
    }

    function getAllPlayers(game, personManager) {
      return personManager.getConnectedPeople().filter((person) => {
        let pId = person.getId();
        return game.hasPlayer(pId);
      });
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

    function createGameInstance(room) {
      let gameInstance = GameInstance();

      gameInstance.newGame();
      gameInstance.updateConfig({
        [CONFIG.SHUFFLE_DECK]: true,
        [CONFIG.ALTER_SET_COST_ACTION]: false,
      });

      room.setGame(gameInstance);

      return gameInstance;
    }

    function canPersonRemoveOtherPerson(thisPerson, otherPerson) {
      return (
        thisPerson.hasTag("host") ||
        String(otherPerson.getId()) === String(thisPerson.getId())
      );
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
      let { personManager, thisPersonId } = props;
      const socketResponses = SocketResponseBuckets();

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
          }
        });
      } else {
        console.log("users not defined");
      }
      return socketResponses;
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
    // #endregion

    function makeRegularGetKeyed({
      SUBJECTS,
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
          const socketResponses = SocketResponseBuckets();
          return handleGame(
            props,
            (consumerData, checkpoints) => {
              let upgradedData = { ...consumerData, subject, action };
              let myKeyedRequest = KeyedRequest();
              myKeyedRequest.setAction(action);
              myKeyedRequest.setSubject(subject);
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
          const socketResponses = SocketResponseBuckets();
          return handleGame(
            props,
            (consumerData, checkpoints) => {
              let upgradedData = { ...consumerData, subject, action };
              let myKeyedRequest = KeyedRequest();
              myKeyedRequest.setAction(action);
              myKeyedRequest.setSubject(subject);
              myKeyedRequest.setSingularKey(singularKey);
              myKeyedRequest.setPluralKey(pluralKey);
              myKeyedRequest.setProps(upgradedData);
              myKeyedRequest.setAllKeysFn(
                makeGetAllKeysFn(upgradedData, checkpoints)
              );
  
              // Get data
              socketResponses.addToBucket(
                "default",
                getAllKeyedResponse(SUBJECTS, myKeyedRequest)
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
          const socketResponses = SocketResponseBuckets();
          return handleGame(
            props,
            (consumerData, checkpoints) => {
              let upgradedData = { ...consumerData, subject, action };
              let myKeyedRequest = KeyedRequest();
              myKeyedRequest.setAction(action);
              myKeyedRequest.setSubject(subject);
              myKeyedRequest.setSingularKey(singularKey);
              myKeyedRequest.setPluralKey(pluralKey);
              myKeyedRequest.setProps(upgradedData);
              myKeyedRequest.setAllKeysFn(
                makeGetAlMyKeysFn(upgradedData, checkpoints)
              );
  
              // Get data
              socketResponses.addToBucket(
                "default",
                getAllKeyedResponse(SUBJECTS, myKeyedRequest)
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
        REMOVE_KEYED: (props) => {
          //props: { roomCode, (collectionIds|collectionId)}
          let action = "REMOVE_KEYED";
          const socketResponses = SocketResponseBuckets();
          return handleGame(
            props,
            (consumerData, checkpoints) => {
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


    //==================================================
  
    //                    CONSUMERS
  
    //==================================================

    // #region CONSUMERS
    // ensured the data required for a room is presant
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
  
            let myClientId = mStrThisClientId;
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
            let myClientId = mStrThisClientId;
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
  
    function _myTurnConsumerBase(props, fn, fallback = undefined) {
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
  
    function handleMyTurn(props, fn, fallback = undefined) {
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
      return makeConsumer(
        consumerCheck,
        _myTurnConsumerBase,
        props,
        fn,
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
        _myTurnConsumerBase,
        props,
        fn,
        fallback
      );
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
  
    function handleTransactionResponse(
      PUBLIC_SUBJECTS,
      subject,
      action,
      props,
      theThing
    ) {
      const socketResponses = SocketResponseBuckets();
      let status = "failure";
      let payload = null;
      return handleGame(
        props,
        (consumerData, checkpoints) => {
          let { requestId } = consumerData;
          let { roomCode, game, personManager, thisPersonId } = consumerData;
  
          let currentTurn = game.getCurrentTurn();
          let phaseKey = currentTurn.getPhaseKey();
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
                  let _Affected = new Affected();
                  
  
                  // DO THE THING
                  checkpoints.set("success", false);
                  theThing({
                    thisPersonId,
                    actionNum,
                    _Affected,
                    request,
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
                      currentTurn.getPhaseKey() === "request"
                    ) {
                      currentTurn.proceedToNextPhase();
                      _Affected.setAffected('TURN');
                    }
                  }
  
                  
  
                  if (_Affected.isAffected('HAND')) {
                    let allPlayerIds = getAllPlayerIds({
                      game,
                      personManager,
                    });
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
  
  
                  
                  // COLLECTIONS
                  if (_Affected.isAffected('COLLECTION')) {
                    let updatedCollectionIds = _Affected.getIdsAffectedByAction("COLLECTION", Affected.ACTION_GROUP.CHANGE);
                    let removedCollectionIds = _Affected.getIdsAffectedByAction("COLLECTION", Affected.ACTION_GROUP.REMOVE);
  
                    if (updatedCollectionIds.length > 0) {
                      socketResponses.addToBucket(
                        "everyone",
                        PUBLIC_SUBJECTS["COLLECTIONS"].GET_KEYED(
                          makeProps(consumerData, {
                            collectionIds: updatedCollectionIds,
                          })
                        )
                      );
                    }
  
                    if (removedCollectionIds.length > 0) {
                      socketResponses.addToBucket(
                        "everyone",
                        PUBLIC_SUBJECTS["COLLECTIONS"].REMOVE_KEYED(
                          makeProps(consumerData, {
                            collectionIds: removedCollectionIds,
                          })
                        )
                      );
                    }
                  }
  
  
                  // PLAYER COLLECTIONS
                  if (_Affected.isAffected('PLAYER_COLLECTION')) {
                    // Update who has what collection
                    socketResponses.addToBucket(
                      "everyone",
                      PUBLIC_SUBJECTS["PLAYER_COLLECTIONS"].GET_KEYED(
                        makeProps(consumerData, {
                          peopleIds: _Affected.getIdsAffectedByAction("COLLECTION", Affected.ACTION_GROUP.CHANGE),
                        })
                      )
                    );
                  }
  
                  // REQUESTS
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
                          peopleIds: _Affected.getIdsAffectedByAction("PLAYER_REQUEST", Affected.ACTION_GROUP.CHANGE),
                        })
                      )
                    );
                  }
  
                  // BANK
                  if (_Affected.isAffected('BANK')) {
                    let attendingPeople = personManager.filterPeople(
                      (person) =>
                        person.isConnected() && person.getStatus() === "ready"
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
  
                  // PLAYER TURN
                  if (_Affected.isAffected('TURN')) {
                    socketResponses.addToBucket(
                      "everyone",
                      PUBLIC_SUBJECTS.PLAYER_TURN.GET({ roomCode })
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
    }
  
    function handleTransferResponse(
      PUBLIC_SUBJECTS,
      subject,
      action,
      props,
      theThing
    ) {
      const socketResponses = SocketResponseBuckets();
      let status = "failure";
      let payload = null;
      return handleGame(
        props,
        (consumerData, checkpoints) => {
          let { requestId } = consumerData;
          let { roomCode, game, personManager, thisPersonId } = consumerData;
    
          let currentTurn = game.getCurrentTurn();
          let phaseKey = currentTurn.getPhaseKey();
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
                    let _Affected = new Affected();
    
                    // DO THE THING
                    checkpoints.set("success", false);
                    theThing({
                      request,
                      requestId,
                      _Affected,
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
                        currentTurn.getPhaseKey() === "request"
                      ) {
                        currentTurn.proceedToNextPhase();
                        _Affected.setAffected('TURN');
                      }
                    }
    
                    
                    if (_Affected.isAffected('HAND')) {
                      let allPlayerIds = getAllPlayerIds({
                        game,
                        personManager,
                      });
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
    
                    // COLLECTIONS
                    
                    if (_Affected.isAffected('COLLECTION')) {
                      let updatedCollectionIds = _Affected.getIdsAffectedByAction("COLLECTION", Affected.ACTION_GROUP.CHANGE);
                      let removedCollectionIds = _Affected.getIdsAffectedByAction("COLLECTION", Affected.ACTION_GROUP.REMOVE);
    
                      if (updatedCollectionIds.length > 0) {
                        socketResponses.addToBucket(
                          "everyone",
                          PUBLIC_SUBJECTS["COLLECTIONS"].GET_KEYED(
                            makeProps(consumerData, {
                              collectionIds: updatedCollectionIds,
                            })
                          )
                        );
                      }
    
                      if (removedCollectionIds.length > 0) {
                        socketResponses.addToBucket(
                          "everyone",
                          PUBLIC_SUBJECTS["COLLECTIONS"].REMOVE_KEYED(
                            makeProps(consumerData, {
                              collectionIds: removedCollectionIds,
                            })
                          )
                        );
                      }
                    }
                    // PLAYER COLLECTIONS
                    if (_Affected.isAffected('PLAYER_COLLECTION')) {
                      // Update who has what collection
                      socketResponses.addToBucket(
                        "everyone",
                        PUBLIC_SUBJECTS["PLAYER_COLLECTIONS"].GET_KEYED(
                          makeProps(consumerData, {
                            peopleIds: _Affected.getIdsAffectedByAction("PLAYER_COLLECTIONS", Affected.ACTION_GROUP.CHANGE),
                          })
                        )
                      );
                    }
    
                    // REQUESTS
                    if (_Affected.isAffected('REQUEST')) {
                      socketResponses.addToBucket(
                        "everyone",
                        PUBLIC_SUBJECTS.REQUESTS.GET_KEYED(
                          makeProps(consumerData, {
                            requestIds: _Affected.getIdsAffectedByAction("REQUEST", Affected.ACTION_GROUP.CHANGE),
                          })
                        )
                      );
                      socketResponses.addToBucket(
                        "everyone",
                        PUBLIC_SUBJECTS.PLAYER_REQUESTS.GET_KEYED(
                          makeProps(consumerData, { personId: thisPersonId })
                        )
                      ); // maybe have to include other people
                    }
    
                    // BANK
                    if (_Affected.isAffected('BANK')) {
                      let attendingPeople = personManager.filterPeople(
                        (person) =>
                          person.isConnected() && person.getStatus() === "ready"
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
    
                    // PLAYER TURN
                    if (_Affected.isAffected('TURN')) {
                      socketResponses.addToBucket(
                        "everyone",
                        PUBLIC_SUBJECTS.PLAYER_TURN.GET({ roomCode })
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
    }
  
    function handleRequestCreation(
      PUBLIC_SUBJECTS,
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
                  let allPlayerIds = getAllPlayerIds({ game, personManager });
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
                let allPlayerIds = getAllPlayerIds({ game, personManager });
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
  
    function handleCollectionBasedRequestCreation(
      PUBLIC_SUBJECTS,
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
                        let allPlayerIds = getAllPlayerIds({
                          game,
                          personManager,
                        });
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
    // #endregion
  


    //=========================================================================

    //                INTEGRATE GAME MANAGER TO REQUEST TREE 

    //=========================================================================
    
    /*
      Each method focuses on preforming an action and bundleding information required by the UI 
    */

    const mThisClientId = thisClient.id;
    const mStrThisClientId = String(mThisClientId);
  
    // Declare
    const PRIVATE_SUBJECTS = {};
    const PUBLIC_SUBJECTS = {};

    // These objects will be refactored into build methods 
    Object.assign(PRIVATE_SUBJECTS, {
      CLIENT: {
        CONNECT: (props) => {},
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
      MY_TURN:    {},
      RESPONSES:  {},
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
        UPDATE: () => {},
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
        UPDATE: {},
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
        UPDATE: {},
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
        UPDATE: {},
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
        // Make
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
        // Make
        // GET_KEYED
        // GET_ALL_KEYED
        // GET_ALL_MY_KEYED
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

              if (IS_TEST_MODE) {
                let { game } = consumerData;
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
        FORCE_STATE: (props) => {
          const [subject, action] = ["CHEAT", "FORCE_STATE"];
          const socketResponses = SocketResponseBuckets();
          let status = "failure";
          let payload = null;
          return handleRoom(
            props,
            (consumerData, checkpoints) => {
              // If in testing mode
              if (IS_TEST_MODE) {
                let { room } = consumerData;
  
                //Reset game
                socketResponses.addToBucket(
                  "default",
                  PUBLIC_SUBJECTS.GAME.RESET(makeProps(props))
                );
                createGameInstance(room);
  
                socketResponses.addToBucket(
                  "default",
                  PUBLIC_SUBJECTS.GAME.UPDATE_CONFIG(
                    makeProps(consumerData, {
                      config: {
                        [CONFIG.SHUFFLE_DECK]: false,
                        [CONFIG.ALTER_SET_COST_ACTION]: false,
                      },
                    })
                  )
                );
  
                // @TODO
                //socketResponses.addToBucket("default", PUBLIC_SUBJECTS.GAME.START(makeProps(consumerData)));
  
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
    });
  




    //==================================================
  
    //                  BUILD ACTIONS
  
    //==================================================
    const coreDeps = buildCoreFuncs({
      isDef, isArr, isFunc, getArrFromProp,
      Affected, SocketResponseBuckets, 
      myClientId: mStrThisClientId,
      roomManager, 
      packageCheckpoints,
      PUBLIC_SUBJECTS,
      makeProps,
    })


    const commonDeps = {
      // Reference
      PUBLIC_SUBJECTS,
      // Structures
      Affected, 
      Transaction,
      SocketResponseBuckets,
      // Helpers
      isDef, isArr, isFunc, 
      getArrFromProp, packageCheckpoints, makeProps,
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
        PUBLIC_SUBJECTS['MY_TURN']['CHARGE_RENT'] = 
          buildChargeRentAction({
          ...commonDeps,
          makeConsumerFallbackResponse:         coreDeps.makeConsumerFallbackResponse,
          handleGame:                           coreDeps.handleGame,
          handleCollectionBasedRequestCreation,
          makeConsumerFallbackResponse,
        })
      }

        
      PUBLIC_SUBJECTS['MY_TURN']['VALUE_COLLECTION'] = 
        buildRequestValueAction({
          ...commonDeps,
          makeConsumerFallbackResponse,
          makeResponse,
          handleGame, 
          isDefNested,
          handleRequestCreation,
        })

      PUBLIC_SUBJECTS['RESPONSES']['RESPOND_TO_COLLECT_VALUE'] = 
        buildRespondToCollectValueAction({
          ...commonDeps,
          makeConsumerFallbackResponse,
          makeResponse,
          handleGame, 
          handleTransactionResponse,
        })
    }

    PUBLIC_SUBJECTS['MY_TURN']['PLAY_PASS_GO'] = 
      buildDrawCardsAction({
        ...commonDeps,
        makeConsumerFallbackResponse,
        makeResponse,
        handCardConsumer,
      })

    PUBLIC_SUBJECTS['MY_TURN']['CHANGE_CARD_ACTIVE_SET'] = 
      buildChangeCardActiveSetAction({
        ...commonDeps,
        makeResponse,
        handleMyTurn,
        makeConsumerFallbackResponse,
        packageCheckpoints,
        makeResponse,
      })
      
    PUBLIC_SUBJECTS['MY_TURN']['ADD_CARD_TO_MY_BANK_FROM_HAND'] = 
      buildAddCardToBankAction({
        ...commonDeps,
        makeConsumerFallbackResponse,
        makeResponse,
        packageCheckpoints,
        handCardConsumer,
        log,
      })
    PUBLIC_SUBJECTS['MY_TURN']['ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND'] = 
      buildAddPropertyToNewCollectionAction({
        ...commonDeps,
        makeConsumerFallbackResponse,
        makeResponse,
        packageCheckpoints,
        handCardConsumer,
        log,
      })
    PUBLIC_SUBJECTS['MY_TURN']['ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND'] = 
      buildAddPropertyToExitingCollectionAction({
        ...commonDeps,
        makeConsumerFallbackResponse,
        makeResponse,
        packageCheckpoints,
        handCardConsumer,
        log,
      })
    

    PUBLIC_SUBJECTS['MY_TURN']['ADD_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_HAND'] = 
      buildAddSetAugmentToExistingCollectionAction({
        ...commonDeps,
        makeConsumerFallbackResponse,
        makeResponse,
        packageCheckpoints,
        handCardConsumer,
      })
    
    PUBLIC_SUBJECTS['MY_TURN']['TRANSFER_SET_AUGMENT_TO_NEW_COLLECTION_FROM_HAND'] = 
      buildAddSetAugmentToNewCollectionAction({
        ...commonDeps,
        makeConsumerFallbackResponse,
        makeResponse,
        packageCheckpoints,
        handCardConsumer,
        handleMyTurn,
      })
        
    PUBLIC_SUBJECTS['MY_TURN']['TRANSFER_PROPERTY_TO_NEW_COLLECTION_FROM_COLLECTION'] = 
      buildTransferPropertyToNewCollectionFromExistingAction({
        ...commonDeps,
        makeConsumerFallbackResponse,
        makeResponse,
        packageCheckpoints,
        handCardConsumer,
        handleMyTurn,
      })

    PUBLIC_SUBJECTS['MY_TURN']['TRANSFER_PROPERTY_TO_EXISTING_COLLECTION_FROM_COLLECTION'] = 
      buildTransferPropertyToExistingCollectionFromExistingAction({
        ...commonDeps,
        makeConsumerFallbackResponse,
        makeResponse,
        packageCheckpoints,
        handCardConsumer,
        handleMyTurn,
      })


    PUBLIC_SUBJECTS['MY_TURN']['TRANSFER_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_COLLECTION'] = 
      buildTransferSetAugmentToExistingCollectionFromExistingAction({
        ...commonDeps,
        makeConsumerFallbackResponse,
        makeResponse,
        packageCheckpoints,
        handCardConsumer,
        handleMyTurn,
      })
        
      
    PUBLIC_SUBJECTS['MY_TURN']['TRANSFER_SET_AUGMENT_TO_NEW_COLLECTION_FROM_COLLECTION'] = 
      buildTransferSetAugmentToNewCollectionFromExistingAction({
        ...commonDeps,
        makeConsumerFallbackResponse,
        makeResponse,
        packageCheckpoints,
        handCardConsumer,
        handleMyTurn,
      })

    PUBLIC_SUBJECTS['ROOM']['CREATE'] = 
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
      
    PUBLIC_SUBJECTS['ROOM']['JOIN'] = 
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
      
  PUBLIC_SUBJECTS['ROOM']['EXISTS'] = 
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
      
      

    // REACT WITH JUST_SAY_NO
    if (enabled.justSayNo) {
      PUBLIC_SUBJECTS['RESPONSES']['RESPOND_TO_JUST_SAY_NO'] = 
        buildRespondToJustSayNoAction({
          ...commonDeps,
          makeConsumerFallbackResponse,
          makeResponse,
          handleGame, 
          handleTransactionResponse,
        })
    }

    // STEAL COLLECTION
    if (enabled.stealCollection) {
      PUBLIC_SUBJECTS['MY_TURN']['STEAL_COLLECTION'] = 
        buildStealCollectionAction({
          ...commonDeps,
          handleRequestCreation: coreDeps.handleRequestCreation,
        })
      PUBLIC_SUBJECTS['RESPONSES']['RESPOND_TO_STEAL_COLLECTION'] = 
        buildRespondToStealCollection({
          ...commonDeps,
          handleTransactionResponse,
        })     
    }

    // STEAL_PROPERTY
    if (enabled.stealProperty) {
      PUBLIC_SUBJECTS['MY_TURN']['STEAL_PROPERTY'] = 
        buildStealPropertyAction({
          ...commonDeps,
          handleRequestCreation,
        }) 

      PUBLIC_SUBJECTS['RESPONSES']['RESPOND_TO_STEAL_PROPERTY'] = 
        buildRespondToStealPropertyAction({
          ...commonDeps,
          handleTransactionResponse,
        }) 
    }

    // SWAP_PROPERTY
    if (enabled.swapProperty) {    
      PUBLIC_SUBJECTS['MY_TURN']['SWAP_PROPERTY'] =
        buildSwapPropertyAction({
          ...commonDeps,
          handleRequestCreation,
        }) 
        
      PUBLIC_SUBJECTS['RESPONSES']['RESPOND_TO_PROPERTY_SWAP'] =
        buildRespondToPropertySwapAction({
          ...commonDeps,
          handleTransactionResponse
        }) 
    }
       

    PUBLIC_SUBJECTS['MY_TURN']['TURN_STARTING_DRAW'] =
      buildTurnStartingDrawAction({
        ...commonDeps,
        SocketResponseBuckets,
        PUBLIC_SUBJECTS,
        makeConsumerFallbackResponse,
        handleMyTurn,
        makeResponse,
      }) 

      PUBLIC_SUBJECTS['MY_TURN']['FINISH_TURN'] =
        buildAttemptFinishTurnAction({
          ...commonDeps,
          SocketResponseBuckets,
          PUBLIC_SUBJECTS,
          makeConsumerFallbackResponse,
          handleMyTurn,
          makeResponse,
          makeProps,
        }) 

      PUBLIC_SUBJECTS['MY_TURN']['DISCARD_REMAINING'] =
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
      

    // COLLECT CARDS
    if (enabled.collectCards) {
      PUBLIC_SUBJECTS['RESPONSES']['ACKNOWLEDGE_COLLECT_NOTHING'] =
        buildAcknowledgeCollectNothingAction({
          ...commonDeps,
          handleTransactionResponse
        }) 

      PUBLIC_SUBJECTS['RESPONSES']['COLLECT_CARD_TO_BANK_AUTO'] = 
        buildCollectCardToBankAutoAction({
          ...commonDeps,
          handleTransferResponse,
        }) 

      PUBLIC_SUBJECTS['RESPONSES']['COLLECT_CARD_TO_BANK'] = 
        buildCollectCardToBankAction({
          ...commonDeps,
          handleTransferResponse,
        }) 
      PUBLIC_SUBJECTS['RESPONSES']['COLLECT_CARD_TO_COLLECTION'] = 
        buildCollectCardToCollectionAction({
          ...commonDeps,
          handleTransferResponse,
        }) 
        
      PUBLIC_SUBJECTS['RESPONSES']['COLLECT_COLLECTION'] =
        buildCollectCollectionAction({
          ...commonDeps,
          handleTransferResponse
        }) 
    }


      

    //==================================================
  
    //                    HANDLERS
  
    //==================================================
    // #region HANDLERS
    function handleConnect() {
      console.log("handleConnect", thisClient.id);
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
      console.log("disconnect", clientId);
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
