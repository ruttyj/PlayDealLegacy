const {
  isDef,
  makeList,
} = require("../utils.js");


const PERSON_STATUS = {
  DISCONNECTED: 'disconnected', 
  CONNECTED:    'connected',
  UNDEFINED:    'undefined',
}


class Person
{
  constructor()
  {
    const person = this

    person.mData  = {}
    person.id     = 0
    person.name   = null
    person.status = PERSON_STATUS.UNDEFINED
    
    person.mTags  = makeList(person.mData, "tags")

    person.mManager
    person.client
  }

  setManager(manager)
  {
    this.mManager = manager
  }

  getManager()
  {
    return this.mManager
  }



  connect(client)
  {
    const person = this
    const personManager = person.getManager()

    person.client = client
    person.setStatus(PERSON_STATUS.CONNECTED)
    if (isDef(client)) {
      client.events.disconnect.once(() => {
        personManager.disconnectPerson(person)
        person.disconnect()
      })
    }
  }

  disconnect() {
    const person = this
    if (isDef(person.client)) {
      person.client = null
      person.setStatus(PERSON_STATUS.DISCONNECTED)
    }
  }

  isConnected() {
    return isDef(this.client);
  }

  getClient()
  {
    return this.client
  }

  getClientId()
  {
    const client = this.getClient()
    if (isDef(client)) {
      return String(client.id)
    }
    return null
  }

  emit(eventName, payload) {
    const client = this.getClient()
    if (isDef(client)) {
      client.emit(eventName, payload);
    }
  }



  setId(id)
  {
    this.id = id
  }

  getId()
  {
    return this.id
  }



  setName(newValue)
  {
    const person        = this
    const oldValue      = person.getName()
    const personManager = person.getManager()

    let changeName      = false
    let hasOldValue     = isDef(oldValue);

    if (hasOldValue && newValue !== oldValue) {
      personManager.releaseTakenName(oldValue)
      changeName = true
    }

    if (!hasOldValue) {
      changeName = true
    }

    if (changeName) {
      person.name = personManager.generateNameVariant(newValue)
      personManager.setTakenName(person.name)
    }
  }

  getName()
  {
    return this.name
  }



  setStatus(newValue)
  {
    this.status = newValue
  }

  getStatus()
  {
    return this.status
  }


  getTagList()
  {
    return this.mTags.toArray()
  }

  addTag(tag)
  {
    this.mTags.push(tag)
  }

  hasTag(tag)
  {
    return this.mTags.includes(tag)
  }

  removeTag(tag)
  {
    return this.mTags.removeByValue(tag)
  }



  serialize()
  {
    const person = this;
    return {
      id: person.id,
      name: person.name,
      status: person.status,
      tags: person.mTags.serialize(),
    }
  }
}

module.exports = Person;
