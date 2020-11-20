module.exports = function buildRoomManager({ Room, elsFn,  isDef,  isStr,  makeMap })
{
  return class RoomManager
  {
    constructor({server})
    {
      const roomManager     = this
      roomManager.mServer   = server
      roomManager.mData     = {}
      roomManager.mRooms    = makeMap(this.mData, "rooms")
    }
  
    _getSocketManager()
    {
      const server = this.mServer
  
      return server.getSocketManager()
    }
  
    createRoom(desiredRoomCode=null)
    {
      const roomManager = this
  
      let socketManager = roomManager._getSocketManager()
      let room = new Room()
      let roomCode = elsFn(desiredRoomCode, () => roomManager.getRandomCode())
      room.setClientManager(socketManager)
      room.setCode(roomCode)
  
      roomManager.mRooms.set(roomCode, room)
  
      return room;
    }
  
    deleteRoom(roomOrCode)
    {
      const roomManager = this;
  
      let roomCode
      if (isDef(roomOrCode)) {
        if (isStr(roomOrCode)) {
          roomCode = roomOrCode
        } else {
          roomCode = roomOrCode.getCode()
        }
      }
  
      if (isDef(roomCode)) {
        let room = roomManager.mRooms.get(roomCode)
        if (isDef(room)) {
          roomManager.mRooms.remove(roomCode)
        }
      }
    }
  
    listAllRoomCodes() 
    {
      const roomManager = this
  
      return roomManager.mRooms.map((id, code) => code)
    }
  
    getRoomsForSocketId(socketId)
    {
      const roomManager = this
      let rooms = []
  
      roomManager.mRooms.forEach((room) => {
        let personManager = room.getPersonManager()
        let person = personManager.getPersonByClientId(socketId)
        if (isDef(person)) {
          rooms.push(room)
        }
      })
  
      return rooms;
    }
  
    getRoom(code)
    {
      const roomManager = this
  
      return roomManager.mRooms.get(code)
    }
  
    getRandomCode()
    {
      const roomManager = this
      const randomCodeUtil = {
        randomRange: function (mn, mx) {
          return Math.floor(Math.random() * (mx - mn)) + mn
        },
        generateARandomCodeOfLength: function (characters, length) {
          var result = ""
          const lastIndex = characters.length - 1
          for (var i = 0; i < length; i++) {
            result += characters.charAt(randomCodeUtil.randomRange(0, lastIndex))
          }
          return result
        },
        makeUniqueCode: function (strLength = 4, check) {
          let code
          const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
          do {
            code = randomCodeUtil.generateARandomCodeOfLength(characters, strLength)
          } while (check(code))
          return code;
        },
      }
      return randomCodeUtil.makeUniqueCode(4, roomManager.mRooms.has)
    }
  
    serialize()
    {
      const self = this
  
      let result = {}
  
      // Serialize everything except the external references
      let excludeKeys = [...mPrivateVars, ...mExternalRefs]
      let keys = Object.keys(self.mData).filter((key) => !excludeKeys.includes(key))
  
      // Serialize each if possible, leave primitives as is
      keys.forEach((key) => {
        result[key] = isDef(self.mData[key].serialize)
          ? self.mData[key].serialize()
          : self.mData[key]
      });
      return result
    }
  }
}