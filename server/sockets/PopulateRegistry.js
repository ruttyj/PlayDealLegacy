const rootFolder          = `../..`
const serverFolder        = `${rootFolder}/server`
const serverSocketFolder  = `${serverFolder}/sockets`
const gameFolder          = `${serverFolder}/Game`;
const builderFolder             = `${serverFolder}/Builders`
const builderPlayDealFolder     = `${builderFolder}/Objects/PlayDeal`


const utils = require("./utils.js")

const {
  els,
  isObj,
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
  makeVar, 
  makeMap,
  arrSum,
} = utils

const ClientManager           = require(`${serverSocketFolder}/client/clientManager.js`)
const RoomManager             = require(`${serverSocketFolder}/room/roomManager.js`)
const GameInstance            = require(`${gameFolder}/`)

// Import generic logic for indexed game data
const KeyedRequest              = require(`${serverSocketFolder}/container/keyedRequest.js`)
const buildTransfer             = require(`${builderPlayDealFolder}/Transfer/Transfer`)
const buildWealthTransfer       = require(`${builderPlayDealFolder}/Transfer/WealthTransfer`)
const buildTransaction          = require(`${builderPlayDealFolder}/Transfer/Transaction`)

const Transfer                    = buildTransfer({
                                      makeVar, makeMap, isDef, isArr
                                    })
const WealthTransfer              = buildWealthTransfer({
                                      Transfer,
                                      isObj, isDef, arrSum, makeMap,
                                    });
const Transaction                 = buildTransaction({
                                    isObj,
                                    isDef,
                                    arrSum,
                                    makeMap,
                                    WealthTransfer
                                  })

const buildDeps               = require(`./Deps.js`)

// Room
const buildRegisterRoomMethods        = require(`${serverFolder}/Builders/Methods/Room/index`)
const buildCreateRoom                 = require(`${serverFolder}/Builders/Methods/Room/CreateRoom`)
const buildJoinRoom                   = require(`${serverFolder}/Builders/Methods/Room/JoinRoom`)
const buildCheckExists                = require(`${serverFolder}/Builders/Methods/Room/CheckExists`)
const buildGetRandomRoom              = require(`${serverFolder}/Builders/Methods/Room/GetRandomRoomCode`)
const buildGetCurrentRoomCode         = require(`${serverFolder}/Builders/Methods/Room/GetCurrentRoomCode`)
const buildGetRoom                    = require(`${serverFolder}/Builders/Methods/Room/GetRoom`)
const buildGetAllRooms                = require(`${serverFolder}/Builders/Methods/Room/GetAllRooms`)
const buildLeaveRoom                  = require(`${serverFolder}/Builders/Methods/Room/LeaveRoom`)

// People
const buildRegisterPeopleMethods            = require(`${serverFolder}/Builders/Methods/People/`)

// Game
const buildRegisterGameMethods              = require(`${serverFolder}/Builders/Methods/Game/`)

// Card
const buildRegisterCardMethods              = require(`${serverFolder}/Builders/Methods/Card/`)

// Player
const buildRegisterPlayerMethods            = require(`${serverFolder}/Builders/Methods/Player/`)

// Connections
const buildRegisterConnectionMethods        = require(`${serverFolder}/Builders/Methods/Connections/`)

// Collections
const buildRegisterCollectionsMethods        = require(`${serverFolder}/Builders/Methods/Collections/`)

// Request Value
const buildRegisterRequestValueMethods        = require(`${serverFolder}/Builders/Methods/RequestValue/`)

// Cheat
const buildRegisterCheatMethods             = require(`${serverFolder}/Builders/Methods/Cheat/`)

// Chat
const buildRegisterChatMethods              = require(`${serverFolder}/Builders/Methods/Chat/`)

// Turn based
const buildTurnStartingDrawAction           = require(`${serverFolder}/Builders/Events/TurnPhase/TurnStartingDrawAction`)
const buildAttemptFinishTurnAction          = require(`${serverFolder}/Builders/Events/TurnPhase/AttemptFinishTurnAction`)
const buildDiscardToHandLimitAction         = require(`${serverFolder}/Builders/Events/TurnPhase/DiscardToHandLimitAction`)

// Request Value
const buildChargeRentAction                 = require(`${serverFolder}/Builders/Events/RequestValue/ChargeRentAction`)
const buildRequestValueAction               = require(`${serverFolder}/Builders/Events/RequestValue/RequestValueAction`)
const buildRespondToCollectValueAction      = require(`${serverFolder}/Builders/Events/RequestValue/RespondToCollectValueAction`)

// Asset Collection
const buildAcknowledgeCollectNothingAction  = require(`${serverFolder}/Builders/Events/AssetCollection/AcknowledgeCollectNothingAction`)
const buildCollectCardToBankAutoAction      = require(`${serverFolder}/Builders/Events/AssetCollection/CollectCardToBankAutoAction`)
const buildCollectCardToBankAction          = require(`${serverFolder}/Builders/Events/AssetCollection/CollectCardToBankAction`)
const buildCollectCardToCollectionAction    = require(`${serverFolder}/Builders/Events/AssetCollection/CollectCardToCollectionAction`)
const buildCollectCollectionAction          = require(`${serverFolder}/Builders/Events/AssetCollection/CollectCollectionAction`)

// Steal Collection
const buildStealCollectionAction            = require(`${serverFolder}/Builders/Events/StealCollection/StealCollectionAction`)
const buildRespondToStealCollection         = require(`${serverFolder}/Builders/Events/StealCollection/RespondToStealCollection`)

// Steal Property
const buildStealPropertyAction              = require(`${serverFolder}/Builders/Events/StealProperty/StealPropertyAction`)
const buildRespondToStealPropertyAction     = require(`${serverFolder}/Builders/Events/StealProperty/RespondToStealPropertyAction`)

// Swap Property
const buildSwapPropertyAction               = require(`${serverFolder}/Builders/Events/SwapProperty/SwapPropertyAction`)
const buildRespondToPropertySwapAction      = require(`${serverFolder}/Builders/Events/SwapProperty/RespondToPropertySwapAction`)

// Draw Cards
const buildDrawCardsAction                  = require(`${serverFolder}/Builders/Events/DrawCardsAction`)

const buildChangeCardActiveSetAction        = require(`${serverFolder}/Builders/Events/ChangeCardActiveSetAction`)

// Request Response 
const buildRespondToJustSayNoAction         = require(`${serverFolder}/Builders/Events/RespondToJustSayNoAction`)


// From Hand
const buildAddCardToBankAction                      = require(`${serverFolder}/Builders/Events/FromHand/AddCardToBankAction`)
const buildAddPropertyToNewCollectionAction         = require(`${serverFolder}/Builders/Events/FromHand/AddPropertyToNewCollectionAction`)
const buildAddPropertyToExitingCollectionAction     = require(`${serverFolder}/Builders/Events/FromHand/AddPropertyToExitingCollectionAction`)
const buildAddSetAugmentToExistingCollectionAction  = require(`${serverFolder}/Builders/Events/FromHand/AddSetAugmentToExistingCollectionAction`)
const buildAddSetAugmentToNewCollectionAction       = require(`${serverFolder}/Builders/Events/FromHand/AddSetAugmentToNewCollectionAction`)

// From Collection
const buildTransferPropertyToNewCollectionFromExistingAction          = require(`${serverFolder}/Builders/Events/FromCollection/TransferPropertyToNewCollectionFromExistingAction`)
const buildTransferPropertyToExistingCollectionFromExistingAction     = require(`${serverFolder}/Builders/Events/FromCollection/TransferPropertyToExistingCollectionFromExistingAction`)
const buildTransferSetAugmentToExistingCollectionFromExistingAction   = require(`${serverFolder}/Builders/Events/FromCollection/TransferSetAugmentToExistingCollectionFromExistingAction`)
const buildTransferSetAugmentToNewCollectionFromExistingAction        = require(`${serverFolder}/Builders/Events/FromCollection/TransferSetAugmentToNewCollectionFromExistingAction`)


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
