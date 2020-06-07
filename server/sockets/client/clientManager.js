const {
  isUndef,
  isDef,
  isFunc,
  isTrue,
  isFalse,
  emptyFunction,
  makeVar,
  makeMap,
  makeListener,
} = require("../utils.js");

//##################################################

//                 CLIENT MANAGER

//##################################################
function ClientManager() {
  let mRef = {};

  //==================================================

  //                    Variables

  //==================================================
  const mPrivateVars = ["clients"];
  const {
    set: setClientInMap,
    get: getClientInMap,
    has: hasClientInMap,
    remove: removeClientInMap,
    map: mapClients,
  } = makeMap(mRef, "clients");

  const { set: onClientDisconnect, get: getOnClientDisconnect } = makeVar(
    mRef,
    "onClientDisconnect",
    emptyFunction
  );
  const emitOnClientDisconnect = (...args) => getOnClientDisconnect()(...args);
  //==================================================

  //              External references

  //==================================================
  const mExternalRefs = [];

  //==================================================

  //                    Events

  //==================================================
  const mConnectEvent = makeListener();
  const mDisconnectEvent = makeListener();

  //==================================================

  //                Additional Logic

  //==================================================
  function makeEventPayload(client) {
    return {
      clientManager: getPublic(),
      client,
    };
  }

  function getClient(clientId) {
    return getClientInMap(clientId);
  }

  function addClient(client) {
    // clientSockets use .id as the priamry way to get the id
    if (isDef(client) && isDef(client.id)) {
      client.events = {
        disconnect: makeListener(),
      };

      setClientInMap(client.id, client);
      mConnectEvent.emit(makeEventPayload(client));
      return client;
    }
    return null;
  }

  function removeClient(clientOrId) {
    let client;
    let clientId;
    let typeofArg = typeof clientOrId;
    if (typeofArg === "object") {
      client = clientOrId;
      clientId = client.id;
    } else if (["string", "number"].includes(typeofArg)) {
      clientId = clientOrId;
      client = getClient(clientId);
    }

    if (isDef(client) && isDef(clientId)) {
      let clientId = client.id;

      //let everything associated to this client know
      client.events.disconnect.emit(makeEventPayload(client));

      // deprecated
      mDisconnectEvent.emit(makeEventPayload(client));

      if (hasClientInMap(clientId)) {
        emitOnClientDisconnect(client);
        removeClientInMap(clientId);
      }
    }
  }

  //==================================================

  //                    Serialize

  //==================================================
  function serialize() {
    let result = {};

    // Serialize everything except the external references
    let excludeKeys = [...mPrivateVars, ...mExternalRefs];
    let keys = Object.keys(mRef).filter((key) => !excludeKeys.includes(key));

    // Serialize each if possible, leave primitives as is
    keys.forEach((key) => {
      result[key] = isDef(mRef[key].serialize)
        ? mRef[key].serialize()
        : mRef[key];
    });

    result.clients = mapClients((client) => ({
      id: client.id,
    }));
    return result;
  }

  //==================================================

  //                    Export

  //==================================================
  const publicScope = {
    addClient,
    getClient,
    removeClient,
    onClientDisconnect,
    serialize,

    events: {
      connect: mConnectEvent,
      disconnect: mDisconnectEvent,
    },

    // deprecated
    connectEvent: mConnectEvent,
    disconnectEvent: mDisconnectEvent,
  };

  function getPublic() {
    return { ...publicScope };
  }

  return getPublic();
}

module.exports = ClientManager;
