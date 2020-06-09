const {
  isUndef,
  els,
  isDef,
  isStr,
  isNum,
  isObj,
  isTrue,
  isFalse,
  emptyFunction,
  identity,
  makeVar,
  makeMap,
  makeListener,
} = require("../utils.js");

const Room = require("./room.js");
const PersonManager = require("../person/personManager.js");

let prettyImages = [
  "https://images.unsplash.com/photo-1553984840-b8cbc34f5215?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1950&q=80",
  "https://images.unsplash.com/photo-1553524788-3997b32fe069?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1950&q=80",
  "https://images.unsplash.com/photo-1546423237-abf72876d79d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1534&q=80",
  "https://images.unsplash.com/flagged/photo-1552863477-7dc7069090c8?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1950&q=80",
  "https://images.unsplash.com/photo-1571631465319-22849a35a54e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2134&q=80",
  "https://images.unsplash.com/flagged/photo-1552863477-7dc7069090c8?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1950&q=80",
  "https://images.unsplash.com/photo-1569196769169-148d853ee706?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2082&q=80",
  "https://images.unsplash.com/photo-1472396961693-142e6e269027?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2103&q=80",
  "https://images.unsplash.com/photo-1444090542259-0af8fa96557e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
  "https://images.unsplash.com/photo-1582761371078-6509f13666b1?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1950&q=80",
  "https://images.unsplash.com/photo-1471825600287-1f2aa68545aa?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2089&q=80",
  "https://images.unsplash.com/photo-1544297787-43ce4f544585?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1950&q=80",
  "https://images.unsplash.com/photo-1543302242-ece3ed37a7ca?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1950&q=80",
  "https://images.unsplash.com/photo-1444090542259-0af8fa96557e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
  "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjI0MX0&auto=format&fit=crop&w=1500&q=80",
  "https://images.unsplash.com/photo-1586254626726-22f20bd7102e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=634&q=80",
  "https://images.unsplash.com/photo-1586254574632-55e4aaea7793?ixlib=rb-1.2.1&auto=format&fit=crop&w=2134&q=80",
  "https://images.unsplash.com/photo-1586021755075-3da0c78d4881?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2100&q=80",
  "https://images.unsplash.com/photo-1585224489225-03ca294de508?ixlib=rb-1.2.1&auto=format&fit=crop&w=2134&q=80",
  "https://images.unsplash.com/photo-1486728297118-82a07bc48a28?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1602&q=80",
  "https://images.unsplash.com/photo-1516496636080-14fb876e029d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1534&q=80",
  "https://images.unsplash.com/photo-1570700720924-95bf33158ed5?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
  "https://images.unsplash.com/photo-1562474541-07ed748b1d46?ixlib=rb-1.2.1&auto=format&fit=crop&w=1489&q=80",
];

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

  getRandomImage: function () {
    return prettyImages[utils.randomRange(0, prettyImages - 1)];
  },
};

//##################################################

//                 Person Manager

//##################################################
/*
  Public:
    createRoom,
    getClientManager,
    setClientManager,
    hasClientManager,
    getRoomByCode,
    getRoomById,
    deleteRoomById,
    deleteRoomByCode,
    serialize
*/
function RoomManager() {
  let mRef = {};

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
  const makeElse = (v, makeFn) => (isDef(v) ? v : makeFn());
  function createRoom(definedRoomCode = null) {
    if (hasClientManager()) {
      incTopId();
      let room = Room();
      let roomId = getTopId();
      let roomCode = els(definedRoomCode, utils.makeUniqueCode(4, hasRoomCode));
      room.setClientManager(getClientManager());
      room.setManager(getPublic());
      room.setId(roomId);
      room.setCode(roomCode);
      room.setImage(utils.getRandomImage());

      addRoomById(roomId, room);
      addRoomIdByCode(roomCode, roomId);
      return room;
    }
    return null;
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

  function isRoomEmpty(room) {
    let roomManager = room.getPersonManager();
    if (isDef()) {
      let personCount = roomManager.getPersonCount();
      if (personCount > 0) return false;
    }
    return true;
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
  const publicScope = {
    createRoom,
    getClientManager,
    setClientManager,
    hasClientManager,
    getRoomsForClientId,
    listAllRoomCodes,

    getRoomByCode,
    getRoomById,

    deleteRoom,
    deleteRoomById,
    deleteRoomByCode,

    serialize,
  };

  function getPublic() {
    return { ...publicScope };
  }

  return getPublic();
}

module.exports = RoomManager;
