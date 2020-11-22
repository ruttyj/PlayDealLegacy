module.exports = function buildPlaydealServer({ utils })
{
  const { isDef, isArr, isObj, isStr, isFunc, els, elsFn, getKeyFromProp, arrSum, makeVar, makeList, makeMap, makeListener  } = utils

  // Define Paths
  const rootFolder                  = `../../..`
  const serverFolder                = `${rootFolder}/server`
  const serverSocketFolder          = `${serverFolder}/sockets`
  const builderFolder               = `${serverFolder}/Builders`
  const builderPlayDealFolder       = `${builderFolder}/Objects/PlayDeal`

  // Get Builders
  const buildBaseServer             = require(`${builderFolder}/Objects/Server/BaseServer`)
  const buildSocketManager          = require(`${builderFolder}/Objects/SocketManager`)
  const buildConnectionManager      = require(`${builderFolder}/Objects/ConnectionManager`)
  const buildPerson                 = require(`${builderFolder}/Objects/Person`)
  const buildPersonManager          = require(`${builderFolder}/Objects/PersonManager`)
  const buildRoom                   = require(`${builderFolder}/Objects/Room`)
  const buildRoomManager            = require(`${builderFolder}/Objects/RoomManager`)

  const buildHandleRoom             = require(`${builderFolder}/Methods/HandleRoom`)
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


  // Build Objects
  const BaseServer                  = buildBaseServer();
  const SocketManager               = buildSocketManager({ isDef, makeVar, makeMap, makeListener, getKeyFromProp })
  const AddressedResponse           = buildAddressedResponse(utils)
  const BaseConnection              = buildBaseConnection()
  const RoomConnection              = buildRoomConnection({ BaseConnection, AddressedResponse, ...utils, })
  const ConnectionManager           = buildConnectionManager({ getKeyFromProp, isDef })
  const CookieTokenManager          = require(`${serverFolder}/CookieTokenManager/`)
  
  const Person                      = buildPerson({ isDef, makeList })
  const PersonManager               = buildPersonManager({ Person, ...utils })
  const Room                        = buildRoom({ PersonManager, makeMap })
  const RoomManager                 = buildRoomManager({ Room, ...utils })

  const OrderedTree                 = buildOrderedTree()
  const Affected                    = buildAffected({ OrderedTree })
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
                                      OrderedTree,
                                      utils,
                                    })
  const EventRegistry               = buildEventRegistry(utils)


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
      this.registry          // event Registry
      this.roomManager
      this.cookieTokenManager
      this.registry
      this.connections
      this.utils

      this.init()
    }
    

    /**
     * 
     */
    init()
    {
      const server                  = this
      server.socketManager          = new SocketManager()
      server.connections            = new ConnectionManager()
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
      const connections = this.connections
      let connection  = new RoomConnection({ server, socket })
      connections.set(connection.id, connection)
      // Attach events
      connection.registerEvents()
    }

    /**
     * Update loop for "Live events"
     * Ex: Play timers
     */
    onUpdate() {
      // @TODO - not implemented yet
    }
    
    /**
     * 
     */
    onDisconnected(connection){
      connection.unregisterEvents()
    }
  }
}