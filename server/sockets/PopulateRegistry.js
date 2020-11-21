const rootFolder          = `../..`
const serverFolder        = `${rootFolder}/server`
const gameFolder          = `${serverFolder}/Game`;
const builderFolder       = `${serverFolder}/Builders`


module.exports = function buildPopulateRegistryMethod({ 
  KeyedRequest,
  Transaction,
  utils 
})
{

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
    getArrFromProp,
  } = utils


  const GameInstance                          = require(`${gameFolder}/`)
  const buildDeps                             = require(`./Deps.js`)

  // Connections
  const buildRegisterConnectionMethods        = require(`${builderFolder}/Methods/Connections/`)
  // Room
  const buildRegisterRoomMethods              = require(`${builderFolder}/Methods/Room/index`)
  // People
  const buildRegisterPeopleMethods            = require(`${builderFolder}/Methods/People/`)
  // Chat
  const buildRegisterChatMethods              = require(`${builderFolder}/Methods/Chat/`)
  // Game
  const buildRegisterGameMethods              = require(`${builderFolder}/Methods/Game/`)


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
        let GameActionProvider    = buildRegisterGameMethods({
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
        let registerRoomMethods   = buildRegisterRoomMethods({
                                      AddressedResponse,
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


        // create providers
        let gameActionProvider = new GameActionProvider();
       
       
        // register methods to socket eventRegistry
        registerConnectionsMethods(registry);

        registerRoomMethods(registry);
        registerPeopleMethods(registry);

        registerChatMethods(registry);
        gameActionProvider.up(registry);
      }
  }