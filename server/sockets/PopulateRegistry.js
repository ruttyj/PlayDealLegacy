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
            clientManager,
            roomManager,
            cookieTokenManager,
          })
        {
          this.handleRoom         = handleRoom
          this.clientManager      = clientManager
          this.roomManager        = roomManager
          this.cookieTokenManager = cookieTokenManager
        }

        up(registry)
        {
          let handleRoom          = this.handleRoom
          let clientManager       = this.clientManager
          let roomManager         = this.roomManager
          let cookieTokenManager  = this.cookieTokenManager

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
          });
  
  
          //=========================================================================
  
          //                  BUILD AVAILABLE EVENTS / RESPONSES
  
          //=========================================================================
          // Clients
          let ConnectionActionProvider = buildConnectionActionProvider({
                                            AddressedResponse,
                                            clientManager,
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
          //@TODO
        }
      }
  }