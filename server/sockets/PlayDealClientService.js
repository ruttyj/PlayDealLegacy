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


const buildAffected           = require(`${libFolder}/Affected`);
const buildOrderedTree        = require(`${libFolder}/OrderedTree`);
const CookieTokenManager      = require("../CookieTokenManager/");

const ClientManager           = require(`${serverSocketFolder}/client/clientManager.js`);
const RoomManager             = require(`${serverSocketFolder}/room/roomManager.js`);

// Import generic logic for indexed game data
const AddressedResponse   = require(`${serverSocketFolder}/AddressedResponse.js`); // @TODO rename AddressedResponse
const buildHandleRoom         = require(`${libFolder}/HandleRoom`);
const buildPopulatedRegistry  = require(`./PopulateRegistry`);

const buildRegistry           = require(`${libFolder}/Registry`);
const buildOnListen           = require(`${libFolder}/OnListen`);
const buildOnDisconnected     = require(`${libFolder}/OnDisconnected`);
const buildOnConnection       = require(`${libFolder}/OnConnection`);





/**
 * 
 * TODO #$%^&$#^&$%#^&%$^&%$#%^&$%
 * if discard and actions still remain offer them to play remaining actions
 * When accepting payment from rent place in set if can be placed in set (when no previous set existed)
 * Change color of set / move cards around at "done" phase
 * 
 */

const OrderedTree         = buildOrderedTree();
const Affected            = buildAffected({OrderedTree});
const Registry            = buildRegistry({
                              isStr,
                              isArr,
                              isDef,
                            })
const clientManager       = ClientManager();
const cookieTokenManager  = CookieTokenManager.getInstance();
const roomManager         = RoomManager();
roomManager.setClientManager(clientManager);



// @TODO move to injectDeps
let deps = {
  clientManager        : clientManager,
  roomManager          : roomManager,
  cookieTokenManager   : cookieTokenManager,
}





class Server {
  constructor() {
     
  }

  onUpdate() {
    
  }

  //Handle a new connection to the server
  onConnected(socket) {
   
  }

  onDisconnected(connection = Connection) {
     
  }
}















module.exports = class PlayDealClientService {
  
  constructor()
  {
  }

  injectDeps()
  {
    //deps
    this.clientManager        = deps.clientManager;
    this.roomManager          = deps.roomManager;
    this.cookieTokenManager   = deps.cookieTokenManager;

    // Right now all thelistener events are duplicated for every single client instance
    this.todoMove = new Map();
  }
  

  buildRegistry({connection, handleRoom}){
    let connectionId          = this.getConnectionId(connection);
    
    const clientManager       = this.clientManager;
    const roomManager         = this.roomManager;
    const cookieTokenManager  = this.cookieTokenManager;
    const registry            = new Registry(); // event Registry

    
    let populatedRegistry     = buildPopulatedRegistry({
      Affected,
      OrderedTree
    });
    

    populatedRegistry({
      thisClient: connection,
      //---------------------
      handleRoom,
      //---------------------
      clientManager,
      roomManager,
      cookieTokenManager,
      registry,
    })
    this.todoMove.set(connectionId, registry);

    return registry;
  }

  getConnectionId(connection)
  {
    return String(connection.id);
  }
  
  connectClient(connection)
  {
    let connectionId = this.getConnectionId(connection);
    
    let handleRoom = buildHandleRoom({
      isDef,
      isFunc,
      AddressedResponse,
      mStrThisClientId: connectionId,
      roomManager     : this.roomManager,
    })
    const registry = this.buildRegistry({connection, handleRoom});


    //==================================================
  
    //                    HANDLERS
  
    //==================================================
    const onConnected = buildOnConnection({
      clientManager: this.clientManager, 
      connection
    });
    const onListen = buildOnListen({
        els,
        isDef,
        isStr,
        isArr,
        jsonEncode,
        AddressedResponse,
        registry,
        mStrThisClientId: connectionId,
        thisClient: connection,
        handleRoom,
    });
    const onDisconnected = buildOnDisconnected({
      onListen,
      isDef,
      thisClient          : connection,
      clientManager       : this.clientManager,
      roomManager         : this.roomManager,
      cookieTokenManager  : this.cookieTokenManager,
  })

  

    

    //==================================================
  
    //                 Attach Handlers
  
    //==================================================
    onConnected();
    connection.on("request",  onListen);
    connection.on("disconnect", onDisconnected);
  }
}