const rootFolder          = '../../../';
const serverFolder        = `${rootFolder}/server`;
const serverSocketFolder  = `${serverFolder}/sockets`;

const buildDeps               = require(`${serverSocketFolder}/Deps.js`);

// Room
const buildRegisterRoomMethods        = require(`${serverFolder}/Lib/Builders/Listeners/Room/index`);
const buildCreateRoom                 = require(`${serverFolder}/Lib/Builders/Listeners/Room/CreateRoom`);
const buildJoinRoom                   = require(`${serverFolder}/Lib/Builders/Listeners/Room/JoinRoom`);
const buildCheckExists                = require(`${serverFolder}/Lib/Builders/Listeners/Room/CheckExists`);
const buildGetRandomRoom              = require(`${serverFolder}/Lib/Builders/Listeners/Room/GetRandomRoomCode`);
const buildGetCurrentRoomCode         = require(`${serverFolder}/Lib/Builders/Listeners/Room/GetCurrentRoomCode`);
const buildGetRoom                    = require(`${serverFolder}/Lib/Builders/Listeners/Room/GetRoom`);
const buildGetAllRooms                = require(`${serverFolder}/Lib/Builders/Listeners/Room/GetAllRooms`);
const buildLeaveRoom                  = require(`${serverFolder}/Lib/Builders/Listeners/Room/LeaveRoom`);

// People
const buildRegisterPeopleMethods            = require(`${serverFolder}/Lib/Builders/Listeners/People/`);

// Game
const buildRegisterGameMethods              = require(`${serverFolder}/Lib/Builders/Listeners/Game/`);

// Card
const buildRegisterCardMethods              = require(`${serverFolder}/Lib/Builders/Listeners/Card/`);

// Player
const buildRegisterPlayerMethods            = require(`${serverFolder}/Lib/Builders/Listeners/Player/`);

// Connections
const buildRegisterConnectionMethods        = require(`${serverFolder}/Lib/Builders/Listeners/Connections/`);

// Collections
const buildRegisterCollectionsMethods        = require(`${serverFolder}/Lib/Builders/Listeners/Collections/`);

// Request Value
const buildRegisterRequestValueMethods        = require(`${serverFolder}/Lib/Builders/Listeners/RequestValue/`);

// Cheat
const buildRegisterCheatMethods             = require(`${serverFolder}/Lib/Builders/Listeners/Cheat/`);

// Chat
const buildRegisterChatMethods              = require(`${serverFolder}/Lib/Builders/Listeners/Chat/`);

// Turn based
const buildTurnStartingDrawAction           = require(`${serverFolder}/Lib/Builders/Actions/TurnPhase/TurnStartingDrawAction`);
const buildAttemptFinishTurnAction          = require(`${serverFolder}/Lib/Builders/Actions/TurnPhase/AttemptFinishTurnAction`);
const buildDiscardToHandLimitAction         = require(`${serverFolder}/Lib/Builders/Actions/TurnPhase/DiscardToHandLimitAction`);

// Request Value
const buildChargeRentAction                 = require(`${serverFolder}/Lib/Builders/Actions/RequestValue/ChargeRentAction`);
const buildRequestValueAction               = require(`${serverFolder}/Lib/Builders/Actions/RequestValue/RequestValueAction`);
const buildRespondToCollectValueAction      = require(`${serverFolder}/Lib/Builders/Actions/RequestValue/RespondToCollectValueAction`);

// Asset Collection
const buildAcknowledgeCollectNothingAction  = require(`${serverFolder}/Lib/Builders/Actions/AssetCollection/AcknowledgeCollectNothingAction`);
const buildCollectCardToBankAutoAction      = require(`${serverFolder}/Lib/Builders/Actions/AssetCollection/CollectCardToBankAutoAction`);
const buildCollectCardToBankAction          = require(`${serverFolder}/Lib/Builders/Actions/AssetCollection/CollectCardToBankAction`);
const buildCollectCardToCollectionAction    = require(`${serverFolder}/Lib/Builders/Actions/AssetCollection/CollectCardToCollectionAction`);
const buildCollectCollectionAction          = require(`${serverFolder}/Lib/Builders/Actions/AssetCollection/CollectCollectionAction`);

// Steal Collection
const buildStealCollectionAction            = require(`${serverFolder}/Lib/Builders/Actions/StealCollection/StealCollectionAction`);
const buildRespondToStealCollection         = require(`${serverFolder}/Lib/Builders/Actions/StealCollection/RespondToStealCollection`);

// Steal Property
const buildStealPropertyAction              = require(`${serverFolder}/Lib/Builders/Actions/StealProperty/StealPropertyAction`);
const buildRespondToStealPropertyAction     = require(`${serverFolder}/Lib/Builders/Actions/StealProperty/RespondToStealPropertyAction`);

// Swap Property
const buildSwapPropertyAction               = require(`${serverFolder}/Lib/Builders/Actions/SwapProperty/SwapPropertyAction`);
const buildRespondToPropertySwapAction      = require(`${serverFolder}/Lib/Builders/Actions/SwapProperty/RespondToPropertySwapAction`);

// Draw Cards
const buildDrawCardsAction                  = require(`${serverFolder}/Lib/Builders/Actions/DrawCardsAction`);

const buildChangeCardActiveSetAction        = require(`${serverFolder}/Lib/Builders/Actions/ChangeCardActiveSetAction`);

// Request Response 
const buildRespondToJustSayNoAction         = require(`${serverFolder}/Lib/Builders/Actions/RespondToJustSayNoAction`);


// From Hand
const buildAddCardToBankAction                      = require(`${serverFolder}/Lib/Builders/Actions/FromHand/AddCardToBankAction`);
const buildAddPropertyToNewCollectionAction         = require(`${serverFolder}/Lib/Builders/Actions/FromHand/AddPropertyToNewCollectionAction`);
const buildAddPropertyToExitingCollectionAction     = require(`${serverFolder}/Lib/Builders/Actions/FromHand/AddPropertyToExitingCollectionAction`);
const buildAddSetAugmentToExistingCollectionAction  = require(`${serverFolder}/Lib/Builders/Actions/FromHand/AddSetAugmentToExistingCollectionAction`);
const buildAddSetAugmentToNewCollectionAction       = require(`${serverFolder}/Lib/Builders/Actions/FromHand/AddSetAugmentToNewCollectionAction`);

// From Collection
const buildTransferPropertyToNewCollectionFromExistingAction          = require(`${serverFolder}/Lib/Builders/Actions/FromCollection/TransferPropertyToNewCollectionFromExistingAction`);
const buildTransferPropertyToExistingCollectionFromExistingAction     = require(`${serverFolder}/Lib/Builders/Actions/FromCollection/TransferPropertyToExistingCollectionFromExistingAction`);
const buildTransferSetAugmentToExistingCollectionFromExistingAction   = require(`${serverFolder}/Lib/Builders/Actions/FromCollection/TransferSetAugmentToExistingCollectionFromExistingAction`);
const buildTransferSetAugmentToNewCollectionFromExistingAction        = require(`${serverFolder}/Lib/Builders/Actions/FromCollection/TransferSetAugmentToNewCollectionFromExistingAction`);



/**
 * 
 * TODO #$%^&$#^&$%#^&%$^&%$#%^&$%
 * if discard and actions still remain offer them to play remaining actions
 * When accepting payment from rent place in set if can be placed in set (when no previous set existed)
 * Change color of set / move cards around at "done" phase
 * 
 */


module.exports = ({
  KeyedRequest,
  Transaction, 
  RoomManager, 
  ClientManager, 
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

  AddressedResponse,
  Affected,
  OrderedTree,
  GameInstance
}) => class EventRoster {
  constructor(server) {
    this.mServer = server;
  }
 

  populate(registry) {
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
        clientManager: this.mServer.clientManager,
        roomManager: this.mServer.roomManager,
        cookieTokenManager: this.mServer.cookieTokenManager,
        //-------------------
      });





      //=========================================================================

      //                  BUILD AVAILABLE EVENTS / RESPONSES

      //=========================================================================
      // Clients
      let registerConnectionsMethods = buildRegisterConnectionMethods({
        AddressedResponse,
        clientManager: this.mServer.clientManager,
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
        roomManager: this.mServer.roomManager,
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

        handleRoom: this.mServer.handleRoom,
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
                                    roomManager: this.mServer.roomManager,
                                    makeResponse,
                                    canPersonRemoveOtherPerson,
                                    makeConsumerFallbackResponse,
                                    handleRoom: this.mServer.handleRoom,
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
                                    roomManager: this.mServer.roomManager,
                                    cookieTokenManager: this.mServer.cookieTokenManager,
                                    makeProps,
                                    //-------------------
                                    makeResponse,
                                    createGameInstance,
                                    makeConsumerFallbackResponse,
                                    //-------------------
                                    handleRoom: this.mServer.handleRoom,
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
}
