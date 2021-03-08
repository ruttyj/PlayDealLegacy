const rootFolder          = `../..`;
const serverFolder        = `${rootFolder}/server`;
const serverSocketFolder  = `${serverFolder}/sockets`;
const gameFolder          = `${serverFolder}/Game`;

const ClientManager           = require(`${serverSocketFolder}/client/clientManager.js`);
const RoomManager             = require(`${serverSocketFolder}/room/roomManager.js`);
const GameInstance            = require(`${gameFolder}/`);

// Import generic logic for indexed game data
const KeyedRequest            = require(`${serverSocketFolder}/container/keyedRequest.js`);
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


module.exports = function ({
      //-------------------------
      handleRoom,
      registry,
      clientManager,
      roomManager,
      cookieTokenManager,
      AddressedResponse,
      Affected,
      OrderedTree,
    })
    {
      //==================================================

      //                  DEPENDENCIES

      //==================================================
      let {
        getAllKeyedResponse,
        packageCheckpoints,
        canGameStart,
        createGameInstance,
        canPersonRemoveOtherPerson,

        makeProps,
        makeResponse,
        makeKeyedResponse,
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
        AddressedResponse,
        KeyedRequest,
        registry,
        //-------------------
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
        AddressedResponse,
        clientManager,
        makeResponse,
        makeProps,
      })
      // Game
      let registerGameMethods = buildRegisterGameMethods({
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
        AddressedResponse,
        KeyedRequest,
        //-------------------
        roomManager,
        //-------------------
        makeProps,
        makeResponse,
        makeKeyedResponse,

        getAllKeyedResponse,
        packageCheckpoints,
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
                                    AddressedResponse,
                                    roomManager,
                                    makeResponse,
                                    canPersonRemoveOtherPerson,
                                    makeConsumerFallbackResponse,
                                    handleRoom,
                                    handlePerson,
                                    makeProps,
                                  })
      let registerCheatMethods  = buildRegisterCheatMethods({
                                    AddressedResponse,
                                    makeResponse,
                                    handleGame,
                                    makeProps,
                                  })
      let registerRoomMethods   = buildRegisterRoomMethods({
                                    AddressedResponse,
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
                                    isArr,
                                    els,
                                    getNestedValue,
                                    setNestedValue,
                                    getArrFromProp, 
                                    //-------------------
                                    roomManager,
                                    cookieTokenManager,
                                    makeProps,
                                    //-------------------
                                    makeResponse,
                                    createGameInstance,
                                    makeConsumerFallbackResponse,
                                    //-------------------
                                    handleRoom,
                                  })
      let registerChatMethods   = buildRegisterChatMethods({
                                    isDef,
                                    AddressedResponse,
                                    makeResponse,
                                    makeConsumerFallbackResponse,
                                    handlePerson,
                                    makeProps,
                                  })

      registerConnectionsMethods(registry);
      registerPeopleMethods(registry);
      registerRoomMethods(registry);
      registerChatMethods(registry);

      registerGameMethods(registry);
      registerCheatMethods(registry);
      
    }
