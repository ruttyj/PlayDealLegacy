const rootFolder          = `../..`
const serverFolder        = `${rootFolder}/server`
const gameFolder          = `${serverFolder}/Game`;
const builderFolder       = `${serverFolder}/Builders`

module.exports = function buildPopulateRegistryMethod({ 
  KeyedRequest,
  Transaction,
  utils,
  AddressedResponse,
  Affected,
  SocketRequest,
  SocketResponse,
  BaseMiddleware,
  RoomBeforeMiddleware,
  GameBeforeMiddleware,
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
  const buildDeps                             = require(`${serverFolder}/sockets/Deps.js`)

  // Connections
  const buildConnectionActionProvider         = require(`${builderFolder}/Methods/Connections/`)
  // Room
  const buildRoomActionProvider               = require(`${builderFolder}/Methods/Room/index`)
  // Game
  const buildGameActionProvider               = require(`${builderFolder}/Methods/Game/`)
  const GameInstance                          = require(`${gameFolder}/`)


  return class PlayDealActionProvider
      {
        constructor({
          //-------------------------
            handleRoom,
            socketManager,
            roomManager,
            cookieTokenManager,
          })
        {
          const playDealActionProvider = this

          playDealActionProvider.mDeps = {
            handleRoom,
            socketManager,
            roomManager,
            cookieTokenManager,
          }
        }

        up(registry)
        {
          const playDealActionProvider = this

          let {
            handleRoom,
            socketManager,
            roomManager,
            cookieTokenManager,
          } = playDealActionProvider.mDeps

          let {
            getAllKeyedResponse,
            createGameInstance,
  
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
          })
  
  
          //=========================================================================
  
          //                  BUILD AVAILABLE EVENTS / RESPONSES
  
          //=========================================================================
          // Clients
          let ConnectionActionProvider = buildConnectionActionProvider({
                                            AddressedResponse,
                                            socketManager,
                                            makeResponse,
                                            makeProps,
                                          })
            // Game
          let GameActionProvider        = buildGameActionProvider({
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
                                            SocketRequest,
                                            SocketResponse,
                                            BaseMiddleware,
                                            RoomBeforeMiddleware,
                                            GameBeforeMiddleware,
                                            //-------------------
                                            roomManager,
                                            //-------------------
                                            makeProps,
                                            makeResponse,
                                            makeKeyedResponse,
    
                                            getAllKeyedResponse,
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
          let RoomActionProvider        = buildRoomActionProvider({
                                            AddressedResponse,
                                            //-------------------------
                                            isDef,
                                            isStr,
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
                                            handlePerson,
                                          })
        
          this.connectionActionProvider  = new ConnectionActionProvider()
          this.gameActionProvider        = new GameActionProvider()
          this.roomActionProvider        = new RoomActionProvider()

          // register methods to socket eventRegistry
          this.connectionActionProvider.up(registry)
          this.roomActionProvider.up(registry)
          this.gameActionProvider.up(registry)
        }
        
        down (registry)
        {
          this.connectionActionProvider.down(registry)
          this.gameActionProvider.down(registry)
          this.roomActionProvider.down(registry)
        }
      }
  }