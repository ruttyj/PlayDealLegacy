const { isDef, makeVar, makeMap } = require("../utils.js");
const Chat = require("../chat/chat.js");
const PersonManager = require("../person/personManager.js");

const utils = {
  randomRange: function (mn, mx) {
    return Math.floor(Math.random() * (mx - mn)) + mn;
  },
};

function Room() {
  let mRef = {};

  // ID
  const { get: getId, set: setId } = makeVar(mRef, "id", 0);

  // CODE
  const { get: getCode, set: setCode } = makeVar(mRef, "code", null);

  // CHAT
  const { get: getChat, set: setChat } = makeVar(mRef, "chat", null);

  const mPrivateVars = ["data"];
  // DATA MAP
  const { get, set, has, remove } = makeMap(mRef, "data", {});

  //==================================================

  //              External references

  //==================================================
  const mExternalRefs = [
    "roomManagerRef",
    "clientManagerRef",
    "personManagerRef",
    "gameRef",
    "chat",
  ];

  // PERSON MANAGER
  // All users for the room will be stored in this object
  const {
    get: getPersonManager,
    set: setPersonManager,
    has: hasPersonManager,
    remove: removePersonManager,
  } = makeVar(mRef, "personManagerRef", null);

  // CLIENT MANAGER
  const {
    get: getClientManager,
    set: _setClientManager,
    has: hasClientManager,
  } = makeVar(mRef, "clientManagerRef", null);

  // GAME INSTANCE
  const {
    get: getGame,
    set: setGame,
    has: hasGame,
    remove: removeGame,
  } = makeVar(mRef, "gameRef", null);

  function setClientManager(manager) {
    if (isDef(manager)) {
      if (hasPersonManager()) {
        removePersonManager();
      }

      // Set new person manager
      let personManager = PersonManager();
      personManager.setClientManager(getClientManager());
      setPersonManager(personManager);

      _setClientManager(manager);
    }
  }

  //==================================================

  //                Additional Logic

  //==================================================
  function destroy() {
    console.log("destroyRoom", serialize());
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
      result[key] =
        isDef(mRef[key]) && isDef(mRef[key].serialize)
          ? mRef[key].serialize()
          : mRef[key];
    });

    return result;
  }

  //==================================================

  //                    Initialize

  //==================================================
  setChat(Chat());

  //==================================================

  //                    Export

  //==================================================
  const publicScope = {
    getId,
    setId,
    getCode,
    setCode,

    // GENERIC MAP
    get,
    set,
    has,
    remove,

    getChat,
    getPersonManager,
    setPersonManager,

    getClientManager,
    setClientManager,
    hasClientManager,


    getGame,
    setGame,
    hasGame,
    removeGame,

    serialize,
    destroy,
  };

  function getPublic() {
    return publicScope;
  }

  return getPublic();
}

module.exports = Room;
