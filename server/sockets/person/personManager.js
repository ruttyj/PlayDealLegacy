const {
  els,
  isDef,
  isNum,
  isFunc,
  makeVar,
  makeMap,
  makeListener,
  getKeyFromProp,
} = require("../utils.js");

const Person = require("./person.js");

//##################################################

//                 Person Manager

//##################################################
/*
  Public:
    createPerson,
    getPerson,
    hasPerson,
    getAllPeople,
    getClientManager,
    setClientManager,
    hasClientManager,
    serialize
*/
function PersonManager() {
  let mRef = {};

  //==================================================

  //                    Variables

  //==================================================
  const mPrivateVars = ["topId", "observers"];
  const { get: getTopId, inc: incTopId } = makeVar(mRef, "topId", 0);

  const {
    set: addPersonInMap, // experimental formatting easier to read?
    get: getPersonInMap,
    has: hasPersonInMap,
    map: mapPeople,
    filter: filterPeople,
    forEach: forEachPerson,
    find: findPerson,
    count: getPersonCount,
    serialize: serializePeople,
  } = makeMap(mRef, "people", [], {
    keyMutator: (v) => String(v),
  });

  // Dictonary mapping {clientId : personId}
  const {
    set: addClientIdPersonIdMap,
    get: getClientIdPersonIdMap,
    has: hasClientIdPersonIdMap,
    map: mapClientIdPersonIdMap,
    remove: removeClientIdPersonIdMap,
    count: getConnectedPeopleCount,
    serialize: serializeClientIds,
  } = makeMap(mRef, "clientToPersonMapping", [], {
    keyMutator: (v) => String(v),
  });

  // keep track of taken names
  const { set: setName, has: hasName, remove: releaseTakenName } = makeMap(
    mRef,
    "takenNames"
  );

  function setTakenName(name) {
    setName(name, true);
  }

  // List of observers
  const {
    set: initPlayerObserverList,
    get: getPlayerObserverList,
    has: hasPlayerObserverList,
    forEach: forEachPlayerObserver,
  } = makeMap(mRef, "observers");

  function addPlayerObserver(playerId, observer) {
    if (!hasPlayerObserverList(playerId)) initPlayerObserverList(playerId, []);
    getPlayerObserverList(playerId).push(observer);
  }

  function removePlayerObservers(playerId) {
    if (hasPlayerObserverList(playerId))
      getPlayerObserverList(playerId).forEach((observer) =>
        observer.unsubscribe()
      );
  }

  function removeAllPlayerObservers() {
    forEachPlayerObserver((observer) => {
      if (isDef(observer) && isFunc(observer.unsubscribe))
        observer.unsubscribe();
    });
  }

  //==================================================

  //              External references

  //==================================================
  const mExternalRefs = ["clientManagerRef"];
  const {
    get: getClientManager,
    set: setClientManager,
    has: hasClientManager,
  } = makeVar(mRef, "clientManagerRef", null);

  //==================================================

  //                      Events

  //==================================================
  // @TODO consider seprate for internal and external events
  const mCreatePersonEvent = makeListener();
  const mRemovePersonEvent = makeListener();
  const mPersonDisconnectEvent = makeListener();

  //==================================================

  //                Additional Logic

  //==================================================
  // If name is taken then append _#
  function generateNameVariant(baseName, variantName = null, i = 1) {
    variantName = els(variantName, baseName);
    if (hasName(variantName)) {
      return generateNameVariant(baseName, `${baseName}_${i}`, i + 1);
    }
    return variantName;
  }

  function createPerson(clientSocket, name = "Guest") {
    incTopId();
    let person = Person();
    person.setManager(getPublic());
    person.setId(getTopId());

    let nameVariant = generateNameVariant(name);
    person.setName(nameVariant);
    setTakenName(nameVariant);
    person.setClient(clientSocket);
    addPerson(person);

    //----------------------------------------------------

    // Subscribe to events

    addPlayerObserver(
      person.getId(),
      person.events.disconnect.on(({ person, client }) => {
        if (isDef(client)) {
          disconnectedPlayerByClientId(client.id);
        }
      })
    );

    addPlayerObserver(
      person.getId(),
      person.events.nameChange.on(({ person, oldValue, newValue }) => {
        releaseTakenName(oldValue);
        setTakenName(newValue);
      })
    );

    // emit createPerson event
    mCreatePersonEvent.emit({
      personManager: getPublic(),
      person,
    });

    return person;
  }

  function emitOnPlayerDisconnect(player) {
    let payload = {
      playerManager: getPublic(),
      player: player,
    };
    mPersonDisconnectEvent.emit(payload);
    person.disconnect();
  }

  function getPerson(personOrId) {
    let personId = getKeyFromProp(personOrId, "id");
    if (isDef(personId)) return getPersonInMap(personId);
    return null;
  }

  function addPerson(person) {
    let id = person.getId();
    let clientId = person.getClientId();

    addPersonInMap(id, person);
    addClientIdPersonIdMap(clientId, id);
  }

  function removePerson(personOrId) {
    let personId = getKeyFromProp(personOrId, "id");
    if (isDef(personId)) removePersonById(personId);
  }

  function hasPerson(personOrId) {
    let personId = getKeyFromProp(personOrId, "id");
    return hasPersonInMap(personId);
  }

  function removePersonById(personId) {
    if (hasPerson(personId)) getPerson(personId).setStatus("Left");
  }

  function getAllPeople() {
    return mapPeople();
  }

  function getOtherConnectedPeople(me) {
    let myId = isNum(me) ? me : me.getId();
    return filterPeople(
      (person) => person.getId() !== myId && person.isConnected()
    );
  }

  function getConnectedPeople() {
    return filterPeople((person) => person.isConnected());
  }

  function emitAll(eventName, payload) {
    getAllPeople().forEach((otherPerson) => {
      if (otherPerson.isConnected())
        otherPerson.getClient().emit(eventName, payload);
    });
  }

  function emitEveryone(eventName, payload) {
    emitAll(eventName, payload);
  }

  function emitOther(clientId, eventName, payload) {
    getAllPeople().forEach((otherPerson) => {
      if (otherPerson.getClientId() !== clientId && otherPerson.isConnected())
        otherPerson.getClient().emit(eventName, payload);
    });
  }
  function emitSelf(clientId, eventName, payload) {
    let person = getPersonByClientId(clientId);
    if (isDef(person)) person.getClient().emit(eventName, payload);
  }

  function doesAllPlayersHaveTheSameStatus(status) {
    let everyoneHasStatus = true;
    forEachPerson((person) => {
      if (person.isConnected() && person.getStatus() !== status)
        everyoneHasStatus = false;
    });
    return everyoneHasStatus;
  }

  function isAllPeopleConnected() {
    return getConnectedPeopleCount() === getPersonCount();
  }

  function removePerson(personId) {
    let person = getPersonInMap(personId);
    if (isDef(person)) {
      removePlayerObservers(personId);
      let clientId = person.getClientId();
      if (isDef(clientId)) removeClientIdPersonIdMap(clientId);
    }
  }

  function getPersonByClientId(clientId) {
    let personId = getClientIdPersonIdMap(clientId);
    let person = getPerson(personId);
    return person;
  }

  function disconnectedPlayerByClientId(clientId) {
    let person = getPersonByClientId(clientId);
    if (isDef(person)) {
      person.disconnect();
    }
    removeClientIdPersonIdMap(clientId);
  }

  function destroy() {
    removeAllPlayerObservers();
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
    return result;
  }

  //==================================================

  //                    Export

  //==================================================
  const publicScope = {
    createPerson,
    generateNameVariant,

    removePersonById,
    removePerson,
    getPerson,
    hasPerson,
    getPersonByClientId,
    getPersonCount,

    disconnectedPlayerByClientId,
    getAllPeople,
    getOtherConnectedPeople,
    getConnectedPeople,
    getConnectedPeopleCount,
    forEachPerson,
    findPerson,
    filterPeople,
    doesAllPlayersHaveTheSameStatus,
    isAllPeopleConnected,

    getClientManager,
    setClientManager,
    hasClientManager,

    emitSelf,
    emitOther,
    emitAll,
    emitEveryone, //same as emitAll

    events: {
      createPerson: mCreatePersonEvent,
      removePerson: mRemovePersonEvent,
      personDisconnect: mPersonDisconnectEvent,
    },

    destroy,
    serialize,
  };

  function getPublic() {
    return { ...publicScope };
  }

  return getPublic();
}

module.exports = PersonManager;
