module.exports = function buildPersonManager({
  Person,  els,  isDef,  makeVar,  makeMap,  getKeyFromProp
} = {}) 
{
  return class PersonManager 
  {
    constructor()
    {
      const personManager = this
  
      personManager._data = {}
  
      personManager.mTopId                    = makeVar(personManager._data, "topId",       0)
      personManager.mItems                    = makeMap(personManager._data, "people",      [], { keyMutator: (v) => String(v) })
      personManager.mClientMap                = makeMap(personManager._data, "clientMap",   [], { keyMutator: (v) => String(v) })
      personManager.mTakenNames               = makeMap(personManager._data, "takenNames",  [])
    }
    
    _addPerson(person)
    {
      const personManager = this
  
      let id = person.getId()
      personManager.mItems.set(id, person)
      personManager.mClientMap.set(person.getSocketId(), id)
    }
  
    createPerson(clientSocket, name = "Guest")
    {
      const personManager = this
  
      let person = new Person(personManager)
      let topIdCounter = personManager.mTopId
      person.setId(topIdCounter.incGet())
      person.setName(name)
      person.setClient(clientSocket)
      personManager._addPerson(person)
  
      
      return person;
    }
  
  
    removePerson(personOrId) 
    {
      const personManager = this
  
      // call get person.getId() or personId
      let personId = getKeyFromProp(personOrId, "id")
      let person = personManager.getPerson(personId)
      if (isDef(person)) {
        personManager.disconnectPerson(person)
        personManager.mItems.remove(personId)
      }
    }
  
    markPersonAsLeftRoom(personOrId)
    {
      const personManager = this
  
      // call get person.getId() or personId
      let personId = getKeyFromProp(personOrId, "id")
      let person = personManager.getPerson(personId)
      if (isDef(person)) {
        person.setStatus("Left");
      }
    }
  
  
    getPersonByClientId(clientId)
    {
      const personManager = this
  
      let personId = personManager.mClientMap.get(clientId)
      return personManager.getPerson(personId)
    }
  
    
    connectPerson(personOrId, clientOrId)
    {
      const personManager = this
      let personId = getKeyFromProp(personOrId, "id")
      let clientId = getKeyFromProp(clientOrId, "id")
      personManager.mClientMap.set(clientId, personId)
    }
    
    disconnectPerson(person, client)
    {
      const personManager = this
  
      if (isDef(client)){
        personManager.mClientMap.remove(client.id)
      }
  
      if (isDef(person)) {
        if (person.isConnected()) {
          person.removeClient()
        }
      }
    }
  
    
    setTakenName(name) {
      const personManager = this
      personManager.mTakenNames.set(name, true)
    }
  
    releaseTakenName(name)
    {
      const personManager = this
      personManager.mTakenNames.remove(name)
    }
    
    generateNameVariant(baseName, variantName = null, i = 1)
    {
      // If name taken use variant
      const personManager = this
      variantName = els(variantName, baseName);
      if (personManager.mTakenNames.has(variantName)) {
        return personManager.generateNameVariant(baseName, `${baseName}-${i}`, i + 1);
      }
      return variantName;
    }
   
  
    getPerson(personOrId) 
    {
      const personManager = this
      return personManager.mItems.get(getKeyFromProp(personOrId, "id"))
    }
    hasPerson(personOrId) 
    {
      const personManager = this
      let personId = getKeyFromProp(personOrId, "id")
      return personManager.mItems.has(personId)
    }
    getPersonCount(){
      const personManager = this
      return personManager.mItems.count()
    }
    getAllPeople(){
      const personManager = this
      return personManager.mItems.map((v => v))
    }
    filterPeople(fn){
      const personManager = this
      return personManager.mItems.filter(fn)
    }
    findPerson(fn){
      const personManager = this
      return personManager.mItems.find(fn)
    }
    forEachPerson(fn){
      const personManager = this
      personManager.mItems.forEach(fn)
    }
    doesAllSatisfy(fn) 
    {
      const personManager = this
  
      let everyoneSatisfies = true
      personManager.mItems.forEach((item) => {
        if (everyoneSatisfies && !fn(item))
          everyoneSatisfies = false
      });
      return everyoneSatisfies
    }
  
  
    getOtherConnectedPeople(personOrId) 
    {
      const personManager = this
      let myId = getKeyFromProp(personOrId, "id")
      return personManager.filterPeople(
        (person) => person.getId() !== myId && person.isConnected()
      );
    }
    getConnectedPeople() 
    {
      const personManager = this
      return personManager.filterPeople(
        (person) => person.isConnected()
      )
    }
    getConnectedPeopleCount()
    {
      const personManager = this
      return personManager.mClientMap.count()
    }
    isAllPeopleConnected(){
      const personManager = this
      return personManager.getConnectedPeopleCount() === personManager.getPersonCount();
    }
  
    
    serialize(){
      // @TODO
      return {}
    }
    unserialize(data){
      // @TODO
    }
  }
}