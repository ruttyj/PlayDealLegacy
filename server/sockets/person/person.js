const {
  isUndef,
  isDef,
  isTrue,
  isFalse,
  identityMutator,
  emptyFunction,
  makeVar,
  makeList,
  makeMap,
  makeListener,
  prettyLog
} = require("../utils.js");

function Person() {
  let mRef = {};

  // Id
  const { get: getId, set: setId } = makeVar(mRef, "id", 0);

  // Name
  const { get: getName, set: _setName } = makeVar(mRef, "name", 0);

  // Status
  const { get: getStatus, set: _setStatus } = makeVar(mRef, "status", 0, {
    mutator: v => String(v).toLowerCase()
  });

  // Tags
  const {
    toArray: getTagList,
    push: addTag,
    includes: hasTag,
    removeByValue: removeTag
  } = makeList(mRef, "tags");

  //==================================================

  //              External references

  //==================================================
  const mExternalRefs = [
    "clientRef",
    "managerRef",
    "onSetClient",
    "onRemoveClient"
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
    remove: removeClientRef
  } = makeVar(mRef, "clientRef", null);

  //==================================================

  //                    Events

  //==================================================
  const mConnectEvent = makeListener();
  const mDisconnectEvent = makeListener();
  const mNameChangeEvent = makeListener();
  const mStatusChangeEvent = makeListener();

  //==================================================

  //                Additional Logic

  //==================================================
  function makeOnValueChangePayload(newValue, oldValue) {
    return {
      person: getPublic(),
      newValue: newValue,
      oldValue
    };
  }

  function setName(_newValue) {
    let oldValue = getName();

    if (_newValue !== oldValue) {
      let newValue = getManager().generateNameVariant(_newValue);
      _setName(newValue);
      mNameChangeEvent.emit(makeOnValueChangePayload(newValue, oldValue));
    }
  }

  function setStatus(newValue) {
    let oldValue = getStatus();
    if (newValue !== oldValue) {
      _setStatus(newValue);
      mStatusChangeEvent.emit(makeOnValueChangePayload(newValue, oldValue));
    }
  }

  function getClientId() {
    let client = getClient();
    if (isDef(client)) return String(client.id);
    return null;
  }

  function makeEventClientPayload(client) {
    return {
      person: getPublic(),
      client
    };
  }

  function connect(client) {
    setClientRef(client);
    mConnectEvent.emit(makeEventClientPayload(client));
    setStatus("connected");
    client.events.disconnect.once(({ client }) => {
      disconnect();
    });
  }

  function disconnect() {
    if (hasClient()) {
      let client = getClient();
      removeClientRef();
      setStatus("disconnected");
      mDisconnectEvent.emit(makeEventClientPayload(client));
    }
  }

  //==================================================

  //                    Serialize

  //==================================================
  function serialize() {
    let result = {
      clientId: getClientId()
    };

    // Serialize everything except the external references
    let keys = Object.keys(mRef).filter(key => !mExternalRefs.includes(key));

    // Serialize each if possible, leave primitives as is
    keys.forEach(key => {
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
  const publicInterface = {
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

    // Events
    events: {
      connect: mConnectEvent,
      disconnect: mDisconnectEvent,
      nameChange: mNameChangeEvent,
      statusChange: mStatusChangeEvent
    },

    serialize
  };

  function getPublic() {
    return publicInterface;
  }

  return getPublic();
}

module.exports = Person;
