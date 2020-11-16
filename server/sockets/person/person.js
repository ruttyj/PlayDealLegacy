const {
  isDef,
  makeVar,
  makeList,
} = require("../utils.js");


const PERSON_STATUS = {
  DISCONNECTED: 'disconnected', 
  CONNECTED:    'connected',
}



function Person() {
  let mRef = {};

  // Id
  const { get: getId, set: setId } = makeVar(mRef, "id", 0);

  // Name
  const { get: getName, set: _setName } = makeVar(mRef, "name", 0);

  // Status
  const { get: getStatus, set: _setStatus } = makeVar(mRef, "status", 0, {
    mutator: (v) => String(v).toLowerCase(),
  });

  // Tags
  const {
    toArray: getTagList,
    push: addTag,
    includes: hasTag,
    removeByValue: removeTag,
  } = makeList(mRef, "tags");

  //==================================================

  //              External references

  //==================================================
  const mExternalRefs = [
    "clientRef",
    "managerRef",
    "onSetClient",
    "onRemoveClient",
  ];
  // Manager Ref
  const { get: getManager, set: setManager } = makeVar(
    mRef,
    "managerRef",
    null
  );

  // Client Ref
  const {
    get: getClient,
    set: setClientRef,
    has: hasClient,
    remove: removeClientRef,
  } = makeVar(mRef, "clientRef", null);

  //==================================================

  //                Additional Logic

  //==================================================

  function setName(_newValue) {
    let oldValue = getName();
    let personManager = getManager();

    if (_newValue !== oldValue) {
      personManager.releaseTakenName(oldValue)
      let newValue = getManager().generateNameVariant(_newValue);
      _setName(newValue);
      personManager.setTakenName(_newValue)
    }
  }

  function setStatus(newValue) {
    let oldValue = getStatus();
    if (newValue !== oldValue) {
      _setStatus(newValue);
    }
  }

  function getClientId() {
    let client = getClient();
    if (isDef(client)) {
      return String(client.id);
    }
    return null;
  }

  function connect(client) {
    let person = getPublic();
    let personManager = getManager();
    setClientRef(client);
    setStatus(PERSON_STATUS.CONNECTED);
    client.events.disconnect.once(({ client }) => {
      personManager.disconnectPerson(person);
      disconnect();
    });
  }

  function disconnect() {
    if (hasClient()) {
      removeClientRef();
      setStatus(PERSON_STATUS.DISCONNECTED);
    }
  }

  //==================================================

  //                    Serialize

  //==================================================
  function serialize() {
    let result = {
      clientId: getClientId(),
    };

    // Serialize everything except the external references
    let keys = Object.keys(mRef).filter((key) => !mExternalRefs.includes(key));

    // Serialize each if possible, leave primitives as is
    keys.forEach((key) => {
      result[key] = isDef(mRef[key].serialize)
        ? mRef[key].serialize()
        : mRef[key];
    });

    return result;
  }

  function emit(eventName, payload) {
    if (hasClient()) {
      getClient().emit(eventName, payload);
    }
  }

  //==================================================

  //                    Export

  //==================================================
  const publicScope = {
    getId,
    setId,
    getName,
    setName,

    // Status
    getStatus,
    setStatus,

    // Tags
    getTagList,
    addTag,
    hasTag,
    removeTag,

    // Manager Ref
    getManager,
    setManager,

    // Client Ref
    isConnected: hasClient,
    hasClient,

    // Connect
    connect,
    setClient: connect,

    // Disconnect
    disconnect,
    removeClient: disconnect,

    // Client/Connection ID
    getClient,
    getClientId,

    //emit to client
    emit,

    serialize,
  };

  function getPublic() {
    return publicScope;
  }

  return getPublic();
}

module.exports = Person;
