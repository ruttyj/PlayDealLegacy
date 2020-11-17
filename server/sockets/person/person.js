const {
  isDef,
  makeList,
} = require("../utils.js");


class Person
{
  constructor(manager = null)
  {
    const person = this

    person.mData  = {}
    person.id     = 0
    person.name   = null
    person.status = Person.STATUS.UNDEFINED
    
    person.mTags  = makeList(person.mData, "tags")

    person.mManager = manager;
    person.client
  }

  static get STATUS()
  {
    return {
      READY:        'ready',
      DISCONNECTED: 'disconnected', 
      CONNECTED:    'connected',
      UNDEFINED:    'undefined',
    };
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
    person.setStatus(Person.STATUS.CONNECTED)
    
    if (isDef(client)) {
      personManager.connectPerson(person, client);
      client.events.disconnect.once(() => {
        personManager.disconnectPerson(person)
        person.disconnect()
      })
    }
  }

  disconnect() {
    const person = this
    const personManager = person.getManager()
    if (isDef(person.client)) {
      let client = person.client;
      person.setStatus(Person.STATUS.DISCONNECTED)
      person.client = null
      // need to do this after to remove mapping of client to person
      personManager.disconnectPerson(person, client)
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
