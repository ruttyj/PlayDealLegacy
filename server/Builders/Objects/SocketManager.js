module.exports = function buildSocketManager({
  isDef,
  makeVar,
  makeMap,
  makeListener,
}){
  return function SocketManager() {
    let mState = {};
  
    //==================================================
  
    //                    Variables
  
    //==================================================
    const mPrivateVars = ["clients"];
    const {
      set: setClientInMap,
      get: getSocketInMap,
      has: hasClientInMap,
      remove: removeSocketInMap,
      map: mapClients,
    } = makeMap(mState, "clients");
  
    const mClientCount = makeVar(mState, "clientCount", 0);
    
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
        socketManager: getPublic(),
        client,
      };
    }
  
    function getSocket(clientId) {
      return getSocketInMap(clientId);
    }
  
    function addSocket(client) {
      // clientSockets use .id as the priamry way to get the id
      if (isDef(client) && isDef(client.id)) {
        client.events = {
          disconnect: makeListener(),
        };
  
        setClientInMap(client.id, client);
        mClientCount.inc();
        mConnectEvent.emit(makeEventPayload(client));
        return client;
      }
      return null;
    }
  
    function removeSocket(clientOrId) {
      let client;
      let clientId;
      let typeofArg = typeof clientOrId;
      if (typeofArg === "object") {
        client = clientOrId;
        clientId = client.id;
      } else if (["string", "number"].includes(typeofArg)) {
        clientId = clientOrId;
        client = getSocket(clientId);
      }
  
      if (isDef(client) && isDef(clientId)) {
        let clientId = client.id;
  
        //let everything associated to this client know
        client.events.disconnect.emit(makeEventPayload(client));
  
        // deprecated
        mDisconnectEvent.emit(makeEventPayload(client));
  
        if (hasClientInMap(clientId)) {
          removeSocketInMap(clientId);
          mClientCount.dec();
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
      let keys = Object.keys(mState).filter((key) => !excludeKeys.includes(key));
  
      // Serialize each if possible, leave primitives as is
      keys.forEach((key) => {
        result[key] = isDef(mState[key].serialize)
          ? mState[key].serialize()
          : mState[key];
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
      addSocket,
      getSocket,
      removeSocket,
      serialize,
      count: mClientCount.get,
  
      events: {
        connect:    mConnectEvent,
        disconnect: mDisconnectEvent,
      },
    };
  
    function getPublic() {
      return { ...publicScope };
    }
  
    return getPublic();
  }
}