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
      }                       = require("./utils.js");

const CookieTokenManager      = require("../CookieTokenManager/");
const ClientManager           = require(`${serverSocketFolder}/client/clientManager.js`);
const RoomManager             = require(`${serverSocketFolder}/room/roomManager.js`);

const buildHandleRoom         = require(`${libFolder}/HandleRoom`);
const buildPopulatedRegistry  = require(`./PopulateRegistry`);
const buildRegistry           = require(`${libFolder}/Registry`);
const buildOnListen           = require(`${libFolder}/OnListen`);
const buildOnDisconnected     = require(`${libFolder}/OnDisconnected`);
const buildOnConnection       = require(`${libFolder}/OnConnection`);
const buildAffected           = require(`${libFolder}/Affected`);
const buildOrderedTree        = require(`${libFolder}/OrderedTree`);

const AddressedResponse       = require(`${serverSocketFolder}/AddressedResponse.js`); // @TODO rename AddressedResponse
const OrderedTree             = buildOrderedTree();
const Affected                = buildAffected({OrderedTree});
const Registry                = buildRegistry({
                                  isStr,
                                  isArr,
                                  isDef,
                                })


/**
 * 
 * TODO #$%^&$#^&$%#^&%$^&%$#%^&$%
 * if discard and actions still remain offer them to play remaining actions
 * When accepting payment from rent place in set if can be placed in set (when no previous set existed)
 * Change color of set / move cards around at "done" phase
 * 
 */
module.exports = class PlayDealServer {
  constructor()
  {
    this.clientManager        = ClientManager();
    this.roomManager          = RoomManager();
    this.cookieTokenManager   = CookieTokenManager.getInstance();
    this.roomManager.setClientManager(this.clientManager);
    this.todoMove = new Map();
    this.registry = new Registry();
    this.handleRoom = buildHandleRoom({
      isDef,
      isFunc,
      AddressedResponse,
      roomManager: this.roomManager,
    })
    const clientManager       = this.clientManager;
    const roomManager         = this.roomManager;
    const cookieTokenManager  = this.cookieTokenManager;
    const registry            = this.registry; // event Registry
    
    let populatedRegistry     = buildPopulatedRegistry({
      Affected,
      OrderedTree
    });

    populatedRegistry({
      handleRoom: this.handleRoom,
      clientManager,
      roomManager,
      cookieTokenManager,
      registry,
    })
  }

  /**
   * When a socket connects attach listeners
   * @param socket 
   */
  onConnected(socket)
  {
    //==================================================
  
    //                 Build handlers
  
    //==================================================
    const onConnected = buildOnConnection({
      clientManager: this.clientManager, 
      socket
    });
    const onListen = buildOnListen({
      els,
      isDef,
      isStr,
      isArr,
      jsonEncode,
      AddressedResponse,
      registry    : this.registry,
      thisClient  : socket,
      handleRoom  : this.handleRoom,
    });
    const onDisconnected = buildOnDisconnected({
      onListen,
      isDef,
      thisClient          : socket,
      clientManager       : this.clientManager,
      roomManager         : this.roomManager,
      cookieTokenManager  : this.cookieTokenManager,
    })

    //==================================================
  
    //                 Attach Handlers
  
    //==================================================
    onConnected();
    socket.on("request",  onListen);
    socket.on("disconnect", onDisconnected);
  }

  onUpdate() {
    // NOP
  }
  
  onDisconnected(connection){
    // NOP
  }
}