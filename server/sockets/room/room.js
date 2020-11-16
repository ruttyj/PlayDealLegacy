const { makeMap } = require("../utils.js");
const PersonManager = require("../person/personManager.js");

module.exports = class Room
{
  constructor()
  {
    const room  = this
    room.code   = null
    room.chat   = null

    room.mData  = {}
    room._data  = makeMap(room.mData, "data", {})

    room.mPersonManager = null
    room.mClientManager = null
    room.game           = null
  }


  setClientManager(manager) 
  {
    this.mClientManager = manager
    this.mPersonManager = PersonManager()
  }

  getPersonManager()
  {
    return this.mPersonManager
  }


  serialize()
  {
    const room = this
    return {
      id:   room.code,
      code: room.code,
    }
  }

  getId()
  {
    return this.code
  }



  getCode()
  {
    return this.code
  }

  setCode(code)
  {
    this.code = code
  }



  setGame(game)
  {
    this.game = game
  }

  getGame()
  {
    return this.game
  }



  get(key, fallback)
  {
    this._data.get(key, fallback)
  }

  set(key, value)
  {
    this._data.set(key, value)
  }

  has(key)
  {
    return this._data.has(key)
  }

  remove(key)
  {
    this._data.set(remove)
  }
}
