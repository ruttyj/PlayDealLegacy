const rootFolder          = `../..`;
const serverFolder        = `${rootFolder}/server`;
const serverSocketFolder  = `${serverFolder}/sockets`;
const gameFolder          = `${serverFolder}/Game`;

const buildAffected           = require(`${serverFolder}/Lib/Affected`);
const buildOrderedTree        = require(`${serverFolder}/Lib/OrderedTree`);
const CookieTokenManager      = require("../CookieTokenManager/");

const ClientManager           = require(`${serverSocketFolder}/client/clientManager.js`);
const RoomManager             = require(`${serverSocketFolder}/room/roomManager.js`);
const GameInstance            = require(`${gameFolder}/`);

// Import generic logic for indexed game data
const KeyedRequest            = require(`${serverSocketFolder}/container/keyedRequest.js`);
const SocketResponseBuckets   = require(`${serverSocketFolder}/socketResponseBuckets.js`); // @TODO rename AddressedResponse

const buildDeps               = require(`./Deps.js`);

const buildPopulatedRegistry  = require(`./PopulateRegistry`);

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
  jsonEncode,
  getArrFromProp,
} = require("./utils.js");

const OrderedTree             = buildOrderedTree();
const Affected                = buildAffected({OrderedTree});
/**
 * 
 * TODO #$%^&$#^&$%#^&%$^&%$#%^&$%
 * if discard and actions still remain offer them to play remaining actions
 * When accepting payment from rent place in set if can be placed in set (when no previous set existed)
 * Change color of set / move cards around at "done" phase
 * 
 */

class Registry {
  constructor()
  {
    this.PRIVATE_SUBJECTS = {};
    this.PUBLIC_SUBJECTS  = {};
  }

  public(identifier, fn)
  {
    if(isStr(identifier)) {
      identifier = String(identifier).split('.');
    }
    if (isArr(identifier)) {
      let [subject, action] = identifier;
      if (!isDef(this.PUBLIC_SUBJECTS[subject])){
        this.PUBLIC_SUBJECTS[subject] = {};
      }
      this.PUBLIC_SUBJECTS[subject][action] = fn;
    }
  }

  private(identifier, fn)
  {
    if(isStr(identifier)) {
      identifier = String(identifier).split('.');
    }
    if (isArr(identifier)) {
      let [subject, action] = identifier;
      if (!isDef(this.PRIVATE_SUBJECTS[subject])){
        this.PRIVATE_SUBJECTS[subject] = {};
      }
      
      this.PRIVATE_SUBJECTS[subject][action] = fn;
    }
  }

  getAllPublic()
  {
    return this.PUBLIC_SUBJECTS;
  }

  getAllPrivate()
  {
    return this.PRIVATE_SUBJECTS;
  }
}
let clientManager       = ClientManager();
let cookieTokenManager  = CookieTokenManager.getInstance();
let roomManager         = RoomManager();
    roomManager.setClientManager(clientManager);
    // @TODO move to injectDeps
let deps = {
  clientManager        : clientManager,
  roomManager          : roomManager,
  cookieTokenManager   : cookieTokenManager,
}

class PlayDealClientService {
  
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
  
  
  connectClient(thisClient)
  {
    const clientManager       = this.clientManager;
    const roomManager         = this.roomManager;
    const cookieTokenManager  = this.cookieTokenManager;
    const registry            = new Registry();


    const mThisClientId       = thisClient.id;
    const mStrThisClientId    = String(mThisClientId);
    let populatedRegistry     = buildPopulatedRegistry({
      Affected,
      OrderedTree
    });
    populatedRegistry({
      thisClient,
      //---------------------
      clientManager,
      roomManager,
      cookieTokenManager,
      registry,
    })
    this.todoMove.set(mStrThisClientId, registry);

    let {
      handleRoom,
    } = buildDeps({
      els,
      isDef,
      isDefNested,
      isFunc,
      isStr,
      isArr,
      getNestedValue,
      setNestedValue,
      log,
      jsonEncode,
      getArrFromProp,

      //-------------------
      OrderedTree,
      Affected,
      ClientManager,
      RoomManager,
      GameInstance,
      SocketResponseBuckets,
      KeyedRequest,
      PUBLIC_SUBJECTS:  registry.getAllPublic(),
      PRIVATE_SUBJECTS: registry.getAllPrivate(),

      //-------------------
      mThisClientId,
      mStrThisClientId,
      thisClient,
      clientManager,
      roomManager,
      cookieTokenManager,
      //-------------------
    });


    //==================================================
  
    //                    HANDLERS
  
    //==================================================
    // #region HANDLERS
    function onConnected() {
      clientManager.addClient(thisClient);
    }
  
    function buildOnListen(registry) {
      const subjectMap = registry.getAllPublic();
      return function(encodedData) {
        const socketResponses = SocketResponseBuckets();
        let requests = isStr(encodedData) ? JSON.parse(encodedData) : encodedData;
        let clientPersonMapping = {};
    
        if (isArr(requests)) {
          requests.forEach((request) => {
            let requestResponses = SocketResponseBuckets();
    
            request.thisClient    = thisClient;
            request.thisClientKey = thisClient.id;

            let subject = request.subject;
            let action = request.action;
            let props = els(request.props, {});
    
            if (isDef(subjectMap[subject])) {
              if (isDef(subjectMap[subject][action])) {
                // @TODO add a way of limiting the props which can be passed to method from the client
                // We may want to push data to clients but not allow it to be abused
                let actionResult = subjectMap[subject][action](props);
    
                requestResponses.addToBucket("default", actionResult);
              }
            }
    
            // Collect person Ids
            let clientIdsMap = {};
            clientIdsMap[mStrThisClientId] = true;
            handleRoom(props, ({ personManager }) => {
              personManager.getConnectedPeople().forEach((person) => {
                clientIdsMap[String(person.getClientId())] = true;
                clientPersonMapping[String(person.getClientId())] = person;
              });
            });
    
            // Assing the buckets of reponses to the relevent clients
            let clientIds = Object.keys(clientIdsMap);
            socketResponses.addToBucket(
              requestResponses.reduce(mStrThisClientId, clientIds)
            );
          });
        }
    
        // Emit to "me" since I am always available
        if (socketResponses.specific.has(String(mStrThisClientId))) {
          let resp = socketResponses.specific.get(mStrThisClientId);
          thisClient.emit("response", jsonEncode(resp));
        }
        // Emit to other relevent people collected from the above requests
        Object.keys(clientPersonMapping).forEach((clientId) => {
          if (mStrThisClientId !== clientId) {
            let person = clientPersonMapping[clientId];
            if (socketResponses.specific.has(clientId)) {
              let resp = socketResponses.specific.get(clientId);
              person.emit("response", jsonEncode(resp));
            }
          }
        });
      }
    };
  
    function onDisconnected() {
      let clientId = thisClient.id;
      let rooms = roomManager.getRoomsForClientId(clientId);
      cookieTokenManager.dissociateClient(clientId);
  
      if (isDef(rooms)) {
        // HACK
        let onListen = buildOnListen(registry);
        rooms.forEach((room) => {
          onListen(
            JSON.stringify([
              {
                subject: "ROOM",
                action: "LEAVE",
                props: { roomCode: room.getCode() },
              },
            ])
          );
  
          // Handle leave room since the above handler requires the room to exist to notify people
          let roomPersonManager = room.getPersonManager();
          if (roomPersonManager.getConnectedPeopleCount() === 0) {
            roomManager.deleteRoom(room.getId());
          }
        });
      }
      clientManager.removeClient(thisClient);
    }
    // #endregion
  

    //==================================================
  
    //                 Attach Handlers
  
    //==================================================
    onConnected();
    thisClient.on("request",  buildOnListen(registry));
    thisClient.on("disconnect", onDisconnected);
  }
}

module.exports = PlayDealClientService;
