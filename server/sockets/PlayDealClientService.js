const rootFolder          = `../..`;
const serverFolder        = `${rootFolder}/server`;
const serverSocketFolder  = `${serverFolder}/sockets`;
const gameFolder          = `${serverFolder}/Game`;

const buildAffected           = require(`${serverFolder}/Lib/Affected`);
const buildOrderedTree        = require(`${serverFolder}/Lib/OrderedTree`);
const CookieTokenManager      = require("../CookieTokenManager/");


const ClientManager           = require(`${serverSocketFolder}/client/clientManager.js`);
const RoomManager             = require(`${serverSocketFolder}/room/roomManager.js`);
const GameInstance            = require(`${gameFolder}/`);


// Import generic logic for indexed game data
const KeyedRequest            = require(`${serverSocketFolder}/container/keyedRequest.js`);
const SocketResponseBuckets   = require(`${serverSocketFolder}/socketResponseBuckets.js`); // @TODO rename AddressedResponse
const Transaction             = require(`${gameFolder}/player/request/transfer/Transaction.js`);

const buildDeps               = require(`./Deps.js`);

// Room
const buildRegisterRoomMethods        = require(`${serverFolder}/Lib/Room/index`);
const buildCreateRoom                 = require(`${serverFolder}/Lib/Room/CreateRoom`);
const buildJoinRoom                   = require(`${serverFolder}/Lib/Room/JoinRoom`);
const buildCheckExists                = require(`${serverFolder}/Lib/Room/CheckExists`);
const buildGetRandomRoom              = require(`${serverFolder}/Lib/Room/GetRandomRoomCode`);
const buildGetCurrentRoomCode         = require(`${serverFolder}/Lib/Room/GetCurrentRoomCode`);
const buildGetRoom                    = require(`${serverFolder}/Lib/Room/GetRoom`);
const buildGetAllRooms                = require(`${serverFolder}/Lib/Room/GetAllRooms`);
const buildLeaveRoom                  = require(`${serverFolder}/Lib/Room/LeaveRoom`);

// People
const buildRegisterPeopleMethods            = require(`${serverFolder}/Lib/People/`);

// Game
const buildRegisterGameMethods              = require(`${serverFolder}/Lib/Game/`);

// Card
const buildRegisterCardMethods              = require(`${serverFolder}/Lib/Card/`);

// Player
const buildRegisterPlayerMethods            = require(`${serverFolder}/Lib/Player/`);

// Connections
const buildRegisterConnectionMethods        = require(`${serverFolder}/Lib/Connections/`);

// Collections
const buildRegisterCollectionsMethods        = require(`${serverFolder}/Lib/Collections/`);

// Request Value
const buildRegisterRequestValueMethods        = require(`${serverFolder}/Lib/RequestValue/`);

// Cheat
const buildRegisterCheatMethods             = require(`${serverFolder}/Lib/Cheat/`);




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

const OrderedTree             = buildOrderedTree();
const Affected                = buildAffected({OrderedTree});
/*
buildTurnStartingDrawAction,
buildAttemptFinishTurnAction,
buildDiscardToHandLimitAction,
buildChargeRentAction,
buildRequestValueAction,
buildRespondToCollectValueAction,
buildAcknowledgeCollectNothingAction,
buildCollectCardToBankAutoAction,
buildCollectCardToBankAction,
buildCollectCardToCollectionAction,
buildCollectCollectionAction,
buildStealPropertyAction,
buildRespondToStealPropertyAction,
buildSwapPropertyAction,
buildRespondToPropertySwapAction,
buildDrawCardsAction,
buildChangeCardActiveSetAction,
buildRespondToJustSayNoAction,
buildAddCardToBankAction,
buildAddPropertyToNewCollectionAction,
buildAddPropertyToExitingCollectionAction,
buildAddSetAugmentToExistingCollectionAction,
buildAddSetAugmentToNewCollectionAction,
buildTransferPropertyToNewCollectionFromExistingAction,
buildTransferPropertyToExistingCollectionFromExistingAction,
buildTransferSetAugmentToExistingCollectionFromExistingAction,
buildTransferSetAugmentToNewCollectionFromExistingAction,   
*/
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
    if(isStr(identifier)) {
      identifier = String(identifier).split('.');
    }
    if (isArr(identifier)) {
      let [subject, action] = identifier;
      if (!isDef(this.PUBLIC_SUBJECTS[subject])){
        this.PUBLIC_SUBJECTS[subject] = {};
      }
      this.PUBLIC_SUBJECTS[subject][action] = fn;
    }
  }

  private(identifier, fn)
  {
    if(isStr(identifier)) {
      identifier = String(identifier).split('.');
    }
    if (isArr(identifier)) {
      let [subject, action] = identifier;
      if (!isDef(this.PRIVATE_SUBJECTS[subject])){
        this.PRIVATE_SUBJECTS[subject] = {};
      }
      
      this.PRIVATE_SUBJECTS[subject][action] = fn;
    }
  }
}
let clientManager       = ClientManager();
let cookieTokenManager  = CookieTokenManager.getInstance();
let roomManager         = RoomManager();
    roomManager.setClientManager(clientManager);
    // @TODO move to injectDeps
let deps = {
  clientManager        : clientManager,
  roomManager          : roomManager,
  cookieTokenManager   : cookieTokenManager,
}

class PlayDealClientService {
  
  constructor()
  {
  }

  getDepKeys()
  {
    return [
      'clientManager',
      'roomManager',
      'cookieTokenManager',
    ]
  }

  injectDeps()
  {
    //deps
    this.clientManager        = deps.clientManager;
    this.roomManager          = deps.roomManager;
    this.cookieTokenManager   = deps.cookieTokenManager;

    // Right now all thelistener events are duplicated for every single client instance
    this.todoMove = new Map();
  }
  
  
  connectClient(thisClient)
  {

    // Enable Actions
    let enabled = {
      requestValue: true,
        chargeRent: true, // extends is requestValue
      stealCollection: true,
      collectCards: true,
      justSayNo: true,
      stealProperty: true,
      swapProperty: true,
    }


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
      setNestedValue,
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


    // Mega list of all possible dependencies to provide when seperating so nothing breaks - to be reduced
    const thisClientKey = mStrThisClientId;
    const kitchenSinkDeps = {
      serverFolder,
      commonDeps,
      els,
      isDef,
      isDefNested,
      getNestedValue,
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
      thisClientKey,
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

    //                  BUILD AVAILABLE EVENTS / RESPONSES

    //=========================================================================
    // Clients
    let registerConnectionsMethods = buildRegisterConnectionMethods({
        SocketResponseBuckets,
        PUBLIC_SUBJECTS,
        PRIVATE_SUBJECTS,
        mStrThisClientId,
        clientManager,
        makeResponse,
    })
    registerConnectionsMethods(registry);

    // Game
    //buildRegisterGameMethods
    let registerGameMethods = buildRegisterGameMethods({
      enabled,
      serverFolder,
      commonDeps,
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
      thisClientKey: mStrThisClientId,
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
      buildAttemptFinishTurnAction,
      buildDiscardToHandLimitAction,
      buildChargeRentAction,
      buildRequestValueAction,
      buildRespondToCollectValueAction,
      buildAcknowledgeCollectNothingAction,
      buildCollectCardToBankAutoAction,
      buildCollectCardToBankAction,
      buildCollectCardToCollectionAction,
      buildCollectCollectionAction,
      buildStealPropertyAction,
      buildRespondToStealPropertyAction,
      buildSwapPropertyAction,
      buildRespondToPropertySwapAction,
      buildDrawCardsAction,
      buildChangeCardActiveSetAction,
      buildRespondToJustSayNoAction,
      buildAddCardToBankAction,
      buildAddPropertyToNewCollectionAction,
      buildAddPropertyToExitingCollectionAction,
      buildAddSetAugmentToExistingCollectionAction,
      buildAddSetAugmentToNewCollectionAction,
      buildTransferPropertyToNewCollectionFromExistingAction,
      buildTransferPropertyToExistingCollectionFromExistingAction,
      buildTransferSetAugmentToExistingCollectionFromExistingAction,
      buildTransferSetAugmentToNewCollectionFromExistingAction, 
      buildStealCollectionAction,
    buildRespondToStealCollection,  
    buildTurnStartingDrawAction,
    buildAttemptFinishTurnAction,
    buildRegisterRequestValueMethods,
    buildRegisterCollectionsMethods,
    buildRegisterCardMethods,
    })
    registerGameMethods(registry);

    
    // People in room
    let peopleMethodsProvider = buildRegisterPeopleMethods({
      isDef,
      isStr,
      getArrFromProp,
      SocketResponseBuckets,
      PUBLIC_SUBJECTS,
      PRIVATE_SUBJECTS,
      roomManager,
      makeResponse,
      canPersonRemoveOtherPerson,
      makeConsumerFallbackResponse,
      handleRoom,
      handlePerson,
    })
    peopleMethodsProvider(registry);


    
    // Players
    let registerPlayerMethods = buildRegisterPlayerMethods({
      isDef,
      isArr,
      SocketResponseBuckets,
      PUBLIC_SUBJECTS,
      makeResponse,
      getAllPlayers,
      makePersonSpecificResponses,
      makeConsumerFallbackResponse,
      handleGame,
    })
    registerPlayerMethods(registry);

    // Chat & Sounds
    Object.assign(PUBLIC_SUBJECTS, {
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
    })

    let registerCheatMethods = buildRegisterCheatMethods({
        SocketResponseBuckets,
        PUBLIC_SUBJECTS,
        makeResponse,
        handleGame,
    })
    registerCheatMethods(registry);

    // Rooms
    if (1) {
      let registerRoomMethods = buildRegisterRoomMethods({
        SocketResponseBuckets,
        //-------------------------
        buildCreateRoom,
        buildJoinRoom,
        buildCheckExists,
        buildGetRandomRoom,
        buildGetCurrentRoomCode,
        buildGetRoom,
        buildGetAllRooms,
        buildLeaveRoom,

        //-------------------------
        isDef,
        els,
        getNestedValue,
        setNestedValue,
        getArrFromProp, 

        //-------------------
        PUBLIC_SUBJECTS,
        PRIVATE_SUBJECTS,
        
        //-------------------
        thisClientKey,
        thisClient,
        roomManager,
        cookieTokenManager,
        //-------------------
        
        makeResponse,
        createGameInstance,
        makeConsumerFallbackResponse,

        //-------------------
        handleRoom,
      })
      registerRoomMethods(registry);
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
