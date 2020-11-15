const {
  els,
  isDef,
  isStr,
  isNum,
  isObj,
  makeVar,
  makeMap,
} = require("../utils.js");
const Room = require("./room.js");
const utils = {
  randomRange: function (mn, mx) {
    return Math.floor(Math.random() * (mx - mn)) + mn;
  },
  generateARandomCodeOfLength: function (length) {
    var result = "";
    var characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var lastIndex = characters.length - 1;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(utils.randomRange(0, lastIndex));
    }
    return result;
  },

  makeUniqueCode: function (strLength = 4, check) {
    let code;
    do {
      code = utils.generateARandomCodeOfLength(strLength);
    } while (check(code));
    return code;
  },
};

//##################################################

//                 Person Manager

//##################################################
function RoomManager({clientManager} = {}) {
  let mRef = {};

  function init(){
    setClientManager(clientManager)
  }

  //==================================================

  //                    Variables

  //==================================================
  const mPrivateVars = ["topId"];
  const { get: getTopId, inc: incTopId } = makeVar(mRef, "topId", 0);

  const {
    set: addRoomById, // experimental formatting easier to read?
    get: getRoomById,
    has: hasRoomById,
    map: mapRooms,
    forEach: forEachRoom,
    remove: removeRoomFromIdMaping,
    serialize: serializePeople,
  } = makeMap(mRef, "rooms");

  // {roomCode: roomId}
  const {
    set: addRoomIdByCode,
    get: getRoomIdByCode,
    has: hasRoomCode,
    map: mapRoomsCodes,
    remove: removeRoomCodeToIdMapping,
    serialize: serializeRoomCodeMap,
  } = makeMap(mRef, "rooms");

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

  //                Additional Logic

  //==================================================
  function createRoom(definedRoomCode = null) {
    if (hasClientManager()) {
      incTopId();
      let room = Room();
      let roomId = getTopId();
      let roomCode = els(definedRoomCode, utils.makeUniqueCode(4, hasRoomCode));
      room.setClientManager(getClientManager());
      room.setId(roomId);
      room.setCode(roomCode);

      addRoomById(roomId, room);
      addRoomIdByCode(roomCode, roomId);
      return room;
    }
    return null;
  }

  function getRandomCode() {
    return utils.makeUniqueCode(4, hasRoomCode);
  }

  function getRoomsForClientId(clientId) {
    let rooms = [];
    forEachRoom((room) => {
      let personManager = room.getPersonManager();
      let person = personManager.getPersonByClientId(clientId);
      if (isDef(person)) {
        rooms.push(room);
      }
    });
    return rooms;
  }

  function getRoomByCode(roomCode) {
    let roomId = getRoomIdByCode(roomCode);
    if (isDef(roomId)) return getRoomById(roomId);
    return null;
  }

  function listAllRoomCodes() {
    return mapRoomsCodes((id, code) => code);
  }

  function removeRoomById(roomId) {
    let room = getRoomById(roomId);
    if (isDef(room)) {
      let roomCode = room.getCode();

      room.destroy();

      // remove from mappings
      removeRoomCodeToIdMapping(roomCode);
      removeRoomFromIdMaping(roomId);
    }
  }

  function removeRoomByCode(roomCode) {
    let room = getRoomIdByCode(roomCode);
    if (isDef(room)) {
      let roomId = room.getId();
      removeRoomById(roomId);
    }
  }

  function deleteRoom(roomOrIdOrCode) {
    if (isDef(roomOrIdOrCode)) {
      if (isNum(roomOrIdOrCode)) {
        deleteRoomById(roomOrIdOrCode);
      } else if (isStr(roomOrIdOrCode)) {
        deleteRoomById(roomOrIdOrCode);
      } else {
        if (isObj(roomOrIdOrCode)) {
          removeRoomByCode(roomOrIdOrCode.getCode());
        }
      }
    }
  }

  function deleteRoomById(roomId) {
    removeRoomById(roomId);
  }

  function deleteRoomByCode(roomCode) {
    removeRoomByCode(roomCode);
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
  function getPublic() {
    return {
      createRoom,

      getClientManager,
      setClientManager,
      hasClientManager,

      getRoomsForClientId,
      listAllRoomCodes,
      getRandomCode,
  
      getRoomByCode,
      getRoomById,
  
      deleteRoom,
      deleteRoomById,
      deleteRoomByCode,
  
      serialize,
    };
  }


  init();
  return getPublic();
}

module.exports = RoomManager;
