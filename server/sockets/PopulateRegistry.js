const rootFolder          = `../..`;
const serverFolder        = `${rootFolder}/server`;
const serverSocketFolder  = `${serverFolder}/sockets`;
const gameFolder          = `${serverFolder}/Game`;

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

// Chat
const buildRegisterChatMethods              = require(`${serverFolder}/Lib/Chat/`);

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

/**
 * 
 * TODO #$%^&$#^&$%#^&%$^&%$#%^&$%
 * if discard and actions still remain offer them to play remaining actions
 * When accepting payment from rent place in set if can be placed in set (when no previous set existed)
 * Change color of set / move cards around at "done" phase
 * 
 */


    //this.todoMove.set(mStrThisClientId, registry);
module.exports = function({
    Affected,
    OrderedTree,
  })
  {
    return function ({
      thisClient,
      //-------------------------
      handleRoom,
      registry,
      clientManager,
      roomManager,
      cookieTokenManager,
    })
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
      const thisClientKey       = mStrThisClientId;


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

        handlePerson,

        handleGame,
        handleMyTurn,
        handCardConsumer,
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
      // Game
      let registerGameMethods = buildRegisterGameMethods({
        enabled,
        els,
        isDef,
        isDefNested,
        isFunc,
        isArr,
        log,
        getArrFromProp,

        //-------------------
        Affected,
        Transaction,
        SocketResponseBuckets,
        KeyedRequest,
        PUBLIC_SUBJECTS,
        PRIVATE_SUBJECTS,

        //-------------------
        thisClientKey,
        roomManager,
        //-------------------

        makeProps,
        makeResponse,
        makeKeyedResponse,

        getAllKeyedResponse,
        packageCheckpoints,
        getAllPlayers,
        canGameStart,
        createGameInstance,

        makePersonSpecificResponses,
        makeConsumerFallbackResponse,
        makeRegularGetKeyed,

        handleRoom,
        handlePerson,
        handleGame,
        handleMyTurn,
        handCardConsumer,
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
        buildRegisterRequestValueMethods,
        buildRegisterCollectionsMethods,
        buildRegisterCardMethods,
        buildRegisterPlayerMethods,
      })
          // People in room
      let registerPeopleMethods = buildRegisterPeopleMethods({
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
      let registerCheatMethods = buildRegisterCheatMethods({
        SocketResponseBuckets,
        PUBLIC_SUBJECTS,
        makeResponse,
        handleGame,
      })
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
      let registerChatMethods = buildRegisterChatMethods({
          isDef,
          SocketResponseBuckets,
          PUBLIC_SUBJECTS,
          makeResponse,
          makeConsumerFallbackResponse,
          handlePerson,
      })

      registerConnectionsMethods(registry);
      registerGameMethods(registry);
      registerPeopleMethods(registry);
      registerChatMethods(registry);
      registerCheatMethods(registry);
      registerRoomMethods(registry);
    }
}

