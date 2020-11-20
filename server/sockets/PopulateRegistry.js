const rootFolder          = `../..`
const serverFolder        = `${rootFolder}/server`
const serverSocketFolder  = `${serverFolder}/sockets`
const gameFolder          = `${serverFolder}/Game`;
const builderFolder             = `${serverFolder}/Builders`


module.exports = function buildPopulateRegistryMethod({ 
  Transaction,
  utils 
})
{

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
    makeListener,
    arrSum,
  } = utils


  const GameInstance            = require(`${gameFolder}/`)

  // Import generic logic for indexed game data
  const KeyedRequest              = require(`${serverSocketFolder}/container/keyedRequest.js`)
  

  const buildDeps               = require(`./Deps.js`)

  // Room
  const buildRegisterRoomMethods        = require(`${builderFolder}/Methods/Room/index`)
  const buildCreateRoom                 = require(`${builderFolder}/Methods/Room/CreateRoom`)
  const buildJoinRoom                   = require(`${builderFolder}/Methods/Room/JoinRoom`)
  const buildCheckExists                = require(`${builderFolder}/Methods/Room/CheckExists`)
  const buildGetRandomRoom              = require(`${builderFolder}/Methods/Room/GetRandomRoomCode`)
  const buildGetCurrentRoomCode         = require(`${builderFolder}/Methods/Room/GetCurrentRoomCode`)
  const buildGetRoom                    = require(`${builderFolder}/Methods/Room/GetRoom`)
  const buildGetAllRooms                = require(`${builderFolder}/Methods/Room/GetAllRooms`)
  const buildLeaveRoom                  = require(`${builderFolder}/Methods/Room/LeaveRoom`)

  // People
  const buildRegisterPeopleMethods            = require(`${builderFolder}/Methods/People/`)

  // Game
  const buildRegisterGameMethods              = require(`${builderFolder}/Methods/Game/`)

  // Card
  const buildRegisterCardMethods              = require(`${builderFolder}/Methods/Card/`)

  // Player
  const buildRegisterPlayerMethods            = require(`${builderFolder}/Methods/Player/`)

  // Connections
  const buildRegisterConnectionMethods        = require(`${builderFolder}/Methods/Connections/`)

  // Collections
  const buildRegisterCollectionsMethods        = require(`${builderFolder}/Methods/Collections/`)

  // Request Value
  const buildRegisterRequestValueMethods        = require(`${builderFolder}/Methods/RequestValue/`)

  // Cheat
  const buildRegisterCheatMethods             = require(`${builderFolder}/Methods/Cheat/`)

  // Chat
  const buildRegisterChatMethods              = require(`${builderFolder}/Methods/Chat/`)

  // Turn based
  const buildTurnStartingDrawAction           = require(`${builderFolder}/Events/TurnPhase/TurnStartingDrawAction`)
  const buildAttemptFinishTurnAction          = require(`${builderFolder}/Events/TurnPhase/AttemptFinishTurnAction`)
  const buildDiscardToHandLimitAction         = require(`${builderFolder}/Events/TurnPhase/DiscardToHandLimitAction`)

  // Request Value
  const buildChargeRentAction                 = require(`${builderFolder}/Events/RequestValue/ChargeRentAction`)
  const buildRequestValueAction               = require(`${builderFolder}/Events/RequestValue/RequestValueAction`)
  const buildRespondToCollectValueAction      = require(`${builderFolder}/Events/RequestValue/RespondToCollectValueAction`)

  // Asset Collection
  const buildAcknowledgeCollectNothingAction  = require(`${builderFolder}/Events/AssetCollection/AcknowledgeCollectNothingAction`)
  const buildCollectCardToBankAutoAction      = require(`${builderFolder}/Events/AssetCollection/CollectCardToBankAutoAction`)
  const buildCollectCardToBankAction          = require(`${builderFolder}/Events/AssetCollection/CollectCardToBankAction`)
  const buildCollectCardToCollectionAction    = require(`${builderFolder}/Events/AssetCollection/CollectCardToCollectionAction`)
  const buildCollectCollectionAction          = require(`${builderFolder}/Events/AssetCollection/CollectCollectionAction`)

  // Steal Collection
  const buildStealCollectionAction            = require(`${builderFolder}/Events/StealCollection/StealCollectionAction`)
  const buildRespondToStealCollection         = require(`${builderFolder}/Events/StealCollection/RespondToStealCollection`)

  // Steal Property
  const buildStealPropertyAction              = require(`${builderFolder}/Events/StealProperty/StealPropertyAction`)
  const buildRespondToStealPropertyAction     = require(`${builderFolder}/Events/StealProperty/RespondToStealPropertyAction`)

  // Swap Property
  const buildSwapPropertyAction               = require(`${builderFolder}/Events/SwapProperty/SwapPropertyAction`)
  const buildRespondToPropertySwapAction      = require(`${builderFolder}/Events/SwapProperty/RespondToPropertySwapAction`)

  // Draw Cards
  const buildDrawCardsAction                  = require(`${builderFolder}/Events/DrawCardsAction`)

  const buildChangeCardActiveSetAction        = require(`${builderFolder}/Events/ChangeCardActiveSetAction`)

  // Request Response 
  const buildRespondToJustSayNoAction         = require(`${builderFolder}/Events/RespondToJustSayNoAction`)


  // From Hand
  const buildAddCardToBankAction                      = require(`${builderFolder}/Events/FromHand/AddCardToBankAction`)
  const buildAddPropertyToNewCollectionAction         = require(`${builderFolder}/Events/FromHand/AddPropertyToNewCollectionAction`)
  const buildAddPropertyToExitingCollectionAction     = require(`${builderFolder}/Events/FromHand/AddPropertyToExitingCollectionAction`)
  const buildAddSetAugmentToExistingCollectionAction  = require(`${builderFolder}/Events/FromHand/AddSetAugmentToExistingCollectionAction`)
  const buildAddSetAugmentToNewCollectionAction       = require(`${builderFolder}/Events/FromHand/AddSetAugmentToNewCollectionAction`)

  // From Collection
  const buildTransferPropertyToNewCollectionFromExistingAction          = require(`${builderFolder}/Events/FromCollection/TransferPropertyToNewCollectionFromExistingAction`)
  const buildTransferPropertyToExistingCollectionFromExistingAction     = require(`${builderFolder}/Events/FromCollection/TransferPropertyToExistingCollectionFromExistingAction`)
  const buildTransferSetAugmentToExistingCollectionFromExistingAction   = require(`${builderFolder}/Events/FromCollection/TransferSetAugmentToExistingCollectionFromExistingAction`)
  const buildTransferSetAugmentToNewCollectionFromExistingAction        = require(`${builderFolder}/Events/FromCollection/TransferSetAugmentToNewCollectionFromExistingAction`)


  /**
   * 
   * TODO #$%^&$#^&$%#^&%$^&%$#%^&$%
   * if discard and actions still remain offer them to play remaining actions
   * When accepting payment from rent place in set if can be placed in set (when no previous set existed)
   * Change color of set / move cards around at "done" phase
   * 
   */


  return function ({
        //-------------------------
        handleRoom,
        registry,
        clientManager,
        roomManager,
        cookieTokenManager,
        AddressedResponse,
        Affected,
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
          isFunc,
          isArr,
          getNestedValue,
          getArrFromProp,
          //-------------------
          Affected,
          GameInstance,
          AddressedResponse,
          KeyedRequest,
          registry,
          //-------------------
          roomManager,
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
  }