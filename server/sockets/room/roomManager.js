const {
  elsFn,
  isDef,
  isStr,
  makeMap,
} = require("../utils.js")
const Room = require("./room.js")

const buildRoomManager = require(`../../Builders/Objects/RoomManager`)

module.exports = buildRoomManager({ Room, elsFn,  isDef,  isStr,  makeMap })