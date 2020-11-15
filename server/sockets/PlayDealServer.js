const rootFolder              = `../..`;
const serverFolder            = `${rootFolder}/server`;
const serverSocketFolder      = `${serverFolder}/sockets`;
const libFolder               = `${serverFolder}/Lib`;

const {
        isDef,
        isFunc,
        isStr,
        isArr,
        jsonEncode,
        els,
        makeMap,
        stateSerialize,
      }                       = require("./utils.js");

const CookieTokenManager      = require("../CookieTokenManager/");
const ClientManager           = require(`${serverSocketFolder}/client/clientManager.js`);
const RoomManager             = require(`${serverSocketFolder}/room/roomManager.js`);

const buildHandleRoom         = require(`${libFolder}/HandleRoom`);
const populateRegistry        = require(`./PopulateRegistry`);
const buildRegistry           = require(`${libFolder}/Registry`);
const buildOnDisconnected     = require(`${libFolder}/OnDisconnected`);
const buildAffected           = require(`${libFolder}/Affected`);
const buildOrderedTree        = require(`${libFolder}/OrderedTree`);

const buildAddressedResponse  = require(`${libFolder}/AddressedResponse`);
const AddressedResponse       = buildAddressedResponse({isDef, isArr, makeMap, stateSerialize});

const buildConnection         = require('../PlayDealServer/Connection.js');


const OrderedTree             = buildOrderedTree();
const Affected                = buildAffected({OrderedTree});
const Registry                = buildRegistry({
                                  isStr,
                                  isArr,
                                  isDef,
                                  isFunc,
                                })

/**
 * 
 * TODO #$%^&$#^&$%#^&%$^&%$#%^&$%
 * if discard and actions still remain offer them to play remaining actions
 * When accepting payment from rent place in set if can be placed in set (when no previous set existed)
 * 
 */




 /*
    functions:
      accept a connections and add it to the server
      store the connection

 */

let utils = {
  els,
  isDef,
  isStr,
  isArr,
  jsonEncode,
}


const classes = {
  AddressedResponse,
}
const Connection = buildConnection({
  utils,
  classes,
  //-----------------
  buildOnDisconnected,
});


module.exports = class PlayDealServer 
{
  constructor()
  {
    this.registry; // event Registry
    this.clientManager;
    this.roomManager;
    this.cookieTokenManager;
    this.todoMove;
    this.registry;
    this.connections;
    this.utils;

    this.init();
  }


  init()
  {
    this.connections          = new Map();
    this.clientManager        = ClientManager();
    this.roomManager          = RoomManager();
    this.cookieTokenManager   = CookieTokenManager.getInstance();
    this.roomManager.setClientManager(this.clientManager);
    this.todoMove             = new Map();
    this.registry             = new Registry();

    this.handleRoom           = buildHandleRoom({
                                isDef,
                                isFunc,
                                AddressedResponse,
                                roomManager: this.roomManager,
                              });
    populateRegistry({
      registry            : this.registry,
      //-------------------------
      AddressedResponse,
      Affected,
      OrderedTree,
      //-------------------------
      handleRoom          : this.handleRoom,
      clientManager       : this.clientManager,
      roomManager         : this.roomManager,
      cookieTokenManager  : this.cookieTokenManager,
    })

  }

  /**
   * When a socket connects attach listeners
   * @param socket 
   */
  onConnected(socket)
  {
    let server = this;

    // Create Connection
    let cid = String(socket.id);
    let connection = new Connection({
      server,
      socket,
    });
    this.connections.set(cid, connection);
    
    // Register events
    connection.registerEvents();
  }

  onUpdate() {
    // NOP
  }
  
  onDisconnected(connection){
    // NOP
  }
}