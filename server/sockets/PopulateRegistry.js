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
const buildRegisterRoomMethods        = require(`${serverFolder}/Builders/Room/index`);
const buildCreateRoom                 = require(`${serverFolder}/Builders/Room/CreateRoom`);
const buildJoinRoom                   = require(`${serverFolder}/Builders/Room/JoinRoom`);
const buildCheckExists                = require(`${serverFolder}/Builders/Room/CheckExists`);
const buildGetRandomRoom              = require(`${serverFolder}/Builders/Room/GetRandomRoomCode`);
const buildGetCurrentRoomCode         = require(`${serverFolder}/Builders/Room/GetCurrentRoomCode`);
const buildGetRoom                    = require(`${serverFolder}/Builders/Room/GetRoom`);
const buildGetAllRooms                = require(`${serverFolder}/Builders/Room/GetAllRooms`);
const buildLeaveRoom                  = require(`${serverFolder}/Builders/Room/LeaveRoom`);

// People
const buildRegisterPeopleMethods            = require(`${serverFolder}/Builders/People/`);

// Game
const buildRegisterGameMethods              = require(`${serverFolder}/Builders/Game/`);

// Card
const buildRegisterCardMethods              = require(`${serverFolder}/Builders/Card/`);

// Player
const buildRegisterPlayerMethods            = require(`${serverFolder}/Builders/Player/`);

// Connections
const buildRegisterConnectionMethods        = require(`${serverFolder}/Builders/Connections/`);

// Collections
const buildRegisterCollectionsMethods        = require(`${serverFolder}/Builders/Collections/`);

// Request Value
const buildRegisterRequestValueMethods        = require(`${serverFolder}/Builders/RequestValue/`);

// Cheat
const buildRegisterCheatMethods             = require(`${serverFolder}/Builders/Cheat/`);

// Chat
const buildRegisterChatMethods              = require(`${serverFolder}/Builders/Chat/`);

// Turn based
const buildTurnStartingDrawAction           = require(`${serverFolder}/Builders/Actions/TurnPhase/TurnStartingDrawAction`);
const buildAttemptFinishTurnAction          = require(`${serverFolder}/Builders/Actions/TurnPhase/AttemptFinishTurnAction`);
const buildDiscardToHandLimitAction         = require(`${serverFolder}/Builders/Actions/TurnPhase/DiscardToHandLimitAction`);

// Request Value
const buildChargeRentAction                 = require(`${serverFolder}/Builders/Actions/RequestValue/ChargeRentAction`);
const buildRequestValueAction               = require(`${serverFolder}/Builders/Actions/RequestValue/RequestValueAction`);
const buildRespondToCollectValueAction      = require(`${serverFolder}/Builders/Actions/RequestValue/RespondToCollectValueAction`);

// Asset Collection
const buildAcknowledgeCollectNothingAction  = require(`${serverFolder}/Builders/Actions/AssetCollection/AcknowledgeCollectNothingAction`);
const buildCollectCardToBankAutoAction      = require(`${serverFolder}/Builders/Actions/AssetCollection/CollectCardToBankAutoAction`);
const buildCollectCardToBankAction          = require(`${serverFolder}/Builders/Actions/AssetCollection/CollectCardToBankAction`);
const buildCollectCardToCollectionAction    = require(`${serverFolder}/Builders/Actions/AssetCollection/CollectCardToCollectionAction`);
const buildCollectCollectionAction          = require(`${serverFolder}/Builders/Actions/AssetCollection/CollectCollectionAction`);

// Steal Collection
const buildStealCollectionAction            = require(`${serverFolder}/Builders/Actions/StealCollection/StealCollectionAction`);
const buildRespondToStealCollection         = require(`${serverFolder}/Builders/Actions/StealCollection/RespondToStealCollection`);

// Steal Property
const buildStealPropertyAction              = require(`${serverFolder}/Builders/Actions/StealProperty/StealPropertyAction`);
const buildRespondToStealPropertyAction     = require(`${serverFolder}/Builders/Actions/StealProperty/RespondToStealPropertyAction`);

// Swap Property
const buildSwapPropertyAction               = require(`${serverFolder}/Builders/Actions/SwapProperty/SwapPropertyAction`);
const buildRespondToPropertySwapAction      = require(`${serverFolder}/Builders/Actions/SwapProperty/RespondToPropertySwapAction`);

// Draw Cards
const buildDrawCardsAction                  = require(`${serverFolder}/Builders/Actions/DrawCardsAction`);

const buildChangeCardActiveSetAction        = require(`${serverFolder}/Builders/Actions/ChangeCardActiveSetAction`);

// Request Response 
const buildRespondToJustSayNoAction         = require(`${serverFolder}/Builders/Actions/RespondToJustSayNoAction`);


// From Hand
const buildAddCardToBankAction                      = require(`${serverFolder}/Builders/Actions/FromHand/AddCardToBankAction`);
const buildAddPropertyToNewCollectionAction         = require(`${serverFolder}/Builders/Actions/FromHand/AddPropertyToNewCollectionAction`);
const buildAddPropertyToExitingCollectionAction     = require(`${serverFolder}/Builders/Actions/FromHand/AddPropertyToExitingCollectionAction`);
const buildAddSetAugmentToExistingCollectionAction  = require(`${serverFolder}/Builders/Actions/FromHand/AddSetAugmentToExistingCollectionAction`);
const buildAddSetAugmentToNewCollectionAction       = require(`${serverFolder}/Builders/Actions/FromHand/AddSetAugmentToNewCollectionAction`);

// From Collection
const buildTransferPropertyToNewCollectionFromExistingAction          = require(`${serverFolder}/Builders/Actions/FromCollection/TransferPropertyToNewCollectionFromExistingAction`);
const buildTransferPropertyToExistingCollectionFromExistingAction     = require(`${serverFolder}/Builders/Actions/FromCollection/TransferPropertyToExistingCollectionFromExistingAction`);
const buildTransferSetAugmentToExistingCollectionFromExistingAction   = require(`${serverFolder}/Builders/Actions/FromCollection/TransferSetAugmentToExistingCollectionFromExistingAction`);
const buildTransferSetAugmentToNewCollectionFromExistingAction        = require(`${serverFolder}/Builders/Actions/FromCollection/TransferSetAugmentToNewCollectionFromExistingAction`);

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
                                    els,
                                    isArr,
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
