const rootFolder              = `../..`;
const serverFolder            = `${rootFolder}/server`;
const serverSocketFolder      = `${serverFolder}/sockets`;
const libFolder               = `${serverFolder}/Lib`;

const utils                   = require("./utils.js");

const CookieTokenManager      = require("../CookieTokenManager/");
const ClientManager           = require(`${serverSocketFolder}/client/clientManager.js`);
const RoomManager             = require(`${serverSocketFolder}/room/roomManager.js`);

const populateRegistry        = require(`./PopulateRegistry`);

const buildHandleRoom         = require(`${libFolder}/HandleRoom`);
const buildRegistry           = require(`${libFolder}/Registry`);
const buildAffected           = require(`${libFolder}/Affected`);
const buildOrderedTree        = require(`${libFolder}/OrderedTree`);
const buildAddressedResponse  = require(`${libFolder}/AddressedResponse`);
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
    this.services             = new Map();
    this.connections          = new Map();
    this.registry             = new Registry();
    this.cookieTokenManager   = CookieTokenManager.getInstance();
    this.clientManager        = ClientManager();
    this.roomManager          = RoomManager({ clientManager: this.clientManager });

    // @TODO remove need for handleRoom from Connection
    this.handleRoom           = buildHandleRoom({
                                  isDef,
                                  isFunc,
                                  AddressedResponse,
                                  roomManager: this.roomManager,
                                });
    
    populateRegistry({
      registry                : this.registry,
      //-------------------------
      AddressedResponse,
      Affected,
      OrderedTree,
      //-------------------------
      handleRoom              : this.handleRoom,
      clientManager           : this.clientManager,
      roomManager             : this.roomManager,
      cookieTokenManager      : this.cookieTokenManager,
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
