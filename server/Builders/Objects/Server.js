module.exports = function buildPlaydealServer({ utils })
{
  // Unpack Methods
  const { isDef, isStr, isArr, isObj, isFunc }        = utils
  const { isDefNested, getNestedValue }               = utils
  const { makeVar, makeList, makeMap, makeListener }  = utils
  const { getKeyFromProp, getArrFromProp, arrSum }    = utils
  const { els, jsonEncode }                           = utils
  const { elsFn }                                     = utils

  // Define Paths
  const rootFolder                  = `../../..`
  const serverFolder                = `${rootFolder}/server`
  const serverSocketFolder          = `${serverFolder}/sockets`
  const builderFolder               = `${serverFolder}/Builders`
  const builderPlayDealFolder       = `${builderFolder}/Objects/PlayDeal`

  // Get Builders
  const buildBaseServer             = require(`${builderFolder}/Objects/Server/BaseServer`)
  const buildSocketManager          = require(`${builderFolder}/Objects/Socket/SocketManager`)
  const buildConnectionManager      = require(`${builderFolder}/Objects/ConnectionManager`)
  const buildSocketRequest          = require(`${builderFolder}/Objects/Socket/SocketRequest`)
  const buildSocketResponse         = require(`${builderFolder}/Objects/Socket/SocketResponse`)

  const buildBaseMiddleware         = require(`../../Builders/Objects/Middleware/BaseMiddleware`)
  const buildRoomBeforeMiddleware   = require(`../../Builders/Objects/Middleware/Before/RoomBeforeMiddleware`)
  const buildGameBeforeMiddleware   = require(`../../Builders/Objects/Middleware/Before/GameBeforeMiddleware`)

  const buildPerson                 = require(`${builderFolder}/Objects/Person`)
  const buildPersonManager          = require(`${builderFolder}/Objects/PersonManager`)
  const buildRoom                   = require(`${builderFolder}/Objects/Room`)
  const buildRoomManager            = require(`${builderFolder}/Objects/RoomManager`)

  const buildHandleRoom             = require(`${builderFolder}/Methods/HandleRoom`)
  const buildSocketRoute            = require(`${builderFolder}/Objects/Socket/SocketRoute`);
  const buildEventRegistry          = require(`${builderFolder}/Objects/EventRegistry`)
  const buildAffected               = require(`${builderFolder}/Objects/Affected`)
  const buildOrderedTree            = require(`${builderFolder}/Objects/OrderedTree`)
  const buildAddressedResponse      = require(`${builderFolder}/Objects/AddressedResponse`)
  const buildBaseConnection         = require(`${builderFolder}/Objects/Connection/BaseConnection`)
  const buildRoomConnection         = require(`${builderFolder}/Objects/Connection/RoomConnection`)
  const buildTransfer               = require(`${builderPlayDealFolder}/Transfer/Transfer`)
  const buildWealthTransfer         = require(`${builderPlayDealFolder}/Transfer/WealthTransfer`)
  const buildTransaction            = require(`${builderPlayDealFolder}/Transfer/Transaction`)
  const buildPlayDealActionProvider = require(`${serverFolder}/sockets/PopulateRegistry`)
  const buildDeps2                  = require(`${serverFolder}/sockets/Deps2.js`)


  // Build Objects
  const BaseServer                  = buildBaseServer();
  const SocketManager               = buildSocketManager({ isDef, makeVar, makeMap, makeListener, getKeyFromProp })

  
  const OrderedTree                 = buildOrderedTree()
  const Affected                    = buildAffected({ OrderedTree })
  const AddressedResponse           = buildAddressedResponse(utils)
  const {
    makeProps,
    makeResponse,
    makeKeyedResponse,
    makePersonSpecificResponses,
    makeConsumerFallbackResponse,
  } = buildDeps2({
    els,
    isDef,
    getArrFromProp,
    AddressedResponse,
  })
  const SocketRequest               = buildSocketRequest({ isDefNested, AddressedResponse, })
  const SocketResponse              = buildSocketResponse({ AddressedResponse, Affected })
  const BaseMiddleware              = buildBaseMiddleware({ isDef })
  const RoomBeforeMiddleware        = buildRoomBeforeMiddleware({ isDef, BaseMiddleware })
  const GameBeforeMiddleware        = buildGameBeforeMiddleware({ isDef, BaseMiddleware })
  const SocketRoute                 = buildSocketRoute({
    isDef,
    isFunc,
    BaseMiddleware,
    makeConsumerFallbackResponse,
  })
const EventRegistry               = buildEventRegistry({
    SocketRequest,
    SocketResponse,
    SocketRoute, 
    ...utils
  })


  const BaseConnection              = buildBaseConnection()
  const RoomConnection              = buildRoomConnection({ BaseConnection, AddressedResponse, els, isDef, isStr, isArr, jsonEncode })
  const ConnectionManager           = buildConnectionManager({ getKeyFromProp, isDef })
  const CookieTokenManager          = require(`${serverFolder}/CookieTokenManager/`)
  
  const Person                      = buildPerson({ isDef, makeList })
  const PersonManager               = buildPersonManager({ Person, els,  isDef,  makeVar,  makeMap,  getKeyFromProp })
  const Room                        = buildRoom({ PersonManager, makeMap })
  const RoomManager                 = buildRoomManager({ Room, elsFn,  isDef,  isStr,  makeMap })

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
  const KeyedRequest                = require(`${serverSocketFolder}/KeyedRequest.js`)



  const PlayDealActionProvider      = buildPlayDealActionProvider({ 
                                      KeyedRequest,
                                      Transaction,
                                      AddressedResponse,
                                      Affected,
                                      SocketRequest,
                                      SocketResponse,
                                      BaseMiddleware,
                                      RoomBeforeMiddleware,
                                      GameBeforeMiddleware,
                                      OrderedTree,
                                      utils,

                                      makeProps,
                                      makeResponse,
                                      makeKeyedResponse,
                                      makePersonSpecificResponses,
                                      makeConsumerFallbackResponse,
                                    })
 


  /**#$%^&$#^&$%#^&%$^&%$#%^&$%#$%^&$#^&$%#^&%$^&%$#%^&$%
   * 
   * TODO 
   * TURN MANAGER         - if discard and actions still remain offer them to play remaining actions
   * RESOURCE COLLECTION  - When accepting payment from rent place in set if can be placed in set (when no previous set existed)
   * 
   */
  return class PlayDealServer extends BaseServer
  {
    constructor()
    {
      super()
      const server = this
      server.registry          // event Registry
      server.roomManager
      server.cookieTokenManager
      server.registry
      server.connections
      server.utils
      server.init()
    }
    

    /**
     * 
     */
    init()
    {
      const server                  = this
      server.socketManager          = new SocketManager()
      server.connectionManager      = new ConnectionManager()
      server.cookieTokenManager     = CookieTokenManager.getInstance()
      server.roomManager            = new RoomManager({ server })

      // EventRegistry
      server.registry               = new EventRegistry()

      //=====================================================================
      // @TODO encapsulate elsewhere
      // @TODO remove need for handleRoom from Connection
      server.handleRoom             = buildHandleRoom({
                                      isDef,
                                      isFunc,
                                      AddressedResponse,
                                      roomManager: server.roomManager,
                                    })
      const playDealActionProvider  = new PlayDealActionProvider({
                                      handleRoom              : server.handleRoom,
                                      socketManager           : server.socketManager,
                                      connectionManager       : server.connectionManager,
                                      roomManager             : server.roomManager,
                                      cookieTokenManager      : server.cookieTokenManager,
                                    })
      //____________________________________________________________________

      // Register COMPLETE list of actions a socket can preform
      playDealActionProvider.up(server.registry)
    }

    /**
     * When a socket connects attach listeners
     * 
     * @param socket 
     */
    onConnected(socket)
    {
      const server      = this
      let connection = new RoomConnection({ server, socket })
      connection.registerEvents()
      server.connectionManager.set(connection.id, connection)
    }

    /**
     * Update loop for "Live events"
     * Ex: Play timers
     */
    onUpdate() 
    {
      // @TODO - not implemented yet
    }
    
    /**
     * 
     */
    onDisconnected(connection)
    {
      const server = this
      server.connectionManager.remove(connection)
      connection.unregisterEvents()
    }


    getRoomManager()
    {
      const server = this
      return server.roomManager
    }
  }
}