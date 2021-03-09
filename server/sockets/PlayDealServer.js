const rootFolder              = `../..`;
const serverFolder            = `${rootFolder}/server`;
const serverSocketFolder      = `${serverFolder}/sockets`;
const buildersFolder          = `${serverFolder}/Lib/Builders`;

const utils                   = require("./utils.js");

const CookieTokenManager      = require("../CookieTokenManager/");
const ClientManager           = require(`${serverSocketFolder}/client/clientManager.js`);
const RoomManager             = require(`${serverSocketFolder}/room/roomManager.js`);

const populateRegistry        = require(`./PopulateRegistry`);

const buildHandleRoom         = require(`${buildersFolder}/HandleRoom`);
const buildRegistry           = require(`${buildersFolder}/Registry`);
const buildAffected           = require(`${buildersFolder}/Affected`);
const buildOrderedTree        = require(`${buildersFolder}/OrderedTree`);
const buildAddressedResponse  = require(`${buildersFolder}/AddressedResponse`);
const buildConnection         = require('../PlayDealServer/Connection.js');

const buildTransaction      = require(`${serverFolder}/Lib/Builders/Transactions/Transaction`);
const buildWealthTransfer   = require(`${serverFolder}/Lib/Builders/Transactions/WealthTransfer`);
const buildTransfer         = require(`${serverFolder}/Lib/Builders/Transactions/Transfer`);

const buildGame = require(`${serverFolder}/Lib/Builders/Game`)

const {
  els,
  isDef,
  isDefNested,
  isFunc,
  isStr,
  isArr,
  arrSum, 
  makeMap, 
  isObj,
  getNestedValue,
  setNestedValue,
  log,
  jsonEncode,
  getArrFromProp,
  makeVar, 
  serializeState,
  getKeyFromProp,
  reduceToKeyed,
} = utils

// Build required objects
const AddressedResponse       = buildAddressedResponse(utils);
const OrderedTree             = buildOrderedTree();
const Affected                = buildAffected({ OrderedTree });
const Registry                = buildRegistry(utils)
const Connection              = buildConnection({ ...utils, AddressedResponse });

const Transfer              = buildTransfer({makeVar, makeMap, isDef, isArr});
const WealthTransfer        = buildWealthTransfer({isObj, isDef, arrSum, makeMap, Transfer});
const Transaction           = buildTransaction({
    WealthTransfer, 
    isObj,
    isDef,
    arrSum,
    makeMap
})

const pluralize = require("pluralize");
const constants = require(`${serverFolder}/Game/config/constants.js`);

const CardContainer = require(`${serverFolder}/Game/card/cardContainer`);
const PlayerManager = require(`${serverFolder}/Game/player/playerManager.js`);
const CardManager   = require(`${serverFolder}/Game/card/cardManager.js`);
const TurnManager   = require(`${serverFolder}/Game/player/turnManager.js`);


const GameInstance            = buildGame({
  els,
  isDef,
  isArr,
  isDefNested,
  getNestedValue,
  getKeyFromProp,
  reduceToKeyed,
  constants,
  pluralize,
  CardContainer,
  PlayerManager,
  CardManager,
  TurnManager,
  Transaction,
  Affected
});


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
    const server                = this;
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
      GameInstance,
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
   * Create an instance of a game
   * @returns Game instance
   */
  makeGame()
  {
    return GameInstance();
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
