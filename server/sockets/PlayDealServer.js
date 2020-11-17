const rootFolder              = `../..`;
const serverFolder            = `${rootFolder}/server`;
const serverSocketFolder      = `${serverFolder}/sockets`;
const builderFolder           = `${serverFolder}/Builders`;

const utils                   = require("./utils.js");

const CookieTokenManager      = require("../CookieTokenManager/");
const ClientManager           = require(`${serverSocketFolder}/client/clientManager.js`);
const RoomManager             = require(`${serverSocketFolder}/room/roomManager.js`);

const populateRegistry        = require(`./PopulateRegistry`);

const buildHandleRoom         = require(`${builderFolder}/Methods/HandleRoom`);
const buildRegistry           = require(`${builderFolder}/Objects/Registry`);
const buildAffected           = require(`${builderFolder}/Objects/Affected`);
const buildOrderedTree        = require(`${builderFolder}/Objects/OrderedTree`);
const buildAddressedResponse  = require(`${builderFolder}/Objects/AddressedResponse`);
const buildConnection         = require('../PlayDealServer/Connection.js');

let {
  isDef,
  isFunc,
} = utils;

// Build required objects
const AddressedResponse       = buildAddressedResponse(utils);
const OrderedTree             = buildOrderedTree();
const Affected                = buildAffected({ OrderedTree });
const Registry                = buildRegistry(utils)
const Connection              = buildConnection({ ...utils, AddressedResponse });



class BaseServer {
  constructor()
  {
    this.clientManager;
  }

  getSocketManager(){
    return this.clientManager;
  }
}


/**
 * 
 * TODO #$%^&$#^&$%#^&%$^&%$#%^&$%
 * if discard and actions still remain offer them to play remaining actions
 * When accepting payment from rent place in set if can be placed in set (when no previous set existed)
 * 
 */
module.exports = class PlayDealServer extends BaseServer
{
  constructor()
  {
    super();
    this.registry;            // event Registry
    this.roomManager;
    this.cookieTokenManager;
    this.registry;
    this.connections;
    this.utils;
    this.services;

    this.init();
  }


  /**
   * 
   */
  init()
  {
    const server              = this;
    server.services             = new Map();
    server.connections          = new Map();
    server.registry             = new Registry();
    server.cookieTokenManager   = CookieTokenManager.getInstance();
    server.clientManager        = ClientManager();
    server.roomManager          = new RoomManager({ server });

    // @TODO remove need for handleRoom from Connection
    server.handleRoom           = buildHandleRoom({
                                  isDef,
                                  isFunc,
                                  AddressedResponse,
                                  roomManager: server.roomManager,
                                });
    
    populateRegistry({
      registry                : server.registry,
      //-------------------------
      AddressedResponse,
      Affected,
      OrderedTree,
      //-------------------------
      handleRoom              : server.handleRoom,
      clientManager           : server.clientManager,
      roomManager             : server.roomManager,
      cookieTokenManager      : server.cookieTokenManager,
    })

  }

  /**
   * When a socket connects attach listeners
   * 
   * @param socket 
   */
  onConnected(socket)
  {
    let server      = this;
    let connection  = new Connection({ server, socket });
    this.connections.set(connection.id, connection);
    connection.registerEvents();
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
    // NOP - handeled in Connection atm
  }
}
