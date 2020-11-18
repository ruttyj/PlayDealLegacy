module.exports = function buildCollectionManager({
  isDef,
  makeVar,
  makeMap,
  getKeyFromProp,
  Collection
})
{

  function CollectionManager(gameRef) {
    let mState;
    let mGameRef;
    let mTopId;
    let mCollections;
  
    reset();
  
    function reset() {
      mState = {};
      mGameRef = gameRef;
      mTopId = makeVar(mState, "topId", 0);
      mCollections = makeMap(mState, "collections", [], {
        keyMutator: (v) => parseInt(v, 10),
      });
    }
  
    // Create Collection
    function createCollection() {
      mTopId.inc();
      let collection = Collection(mGameRef);
      collection.setId(mTopId.get());
      mCollections.set(collection.getId(), collection);
      return collection;
    }
  
    // Filter for garbage collection
    function filterUnassignedCollections() {
      return mCollections.filter((collection) => !collection.hasPlayerKey());
    }
  
    // Get all collection IDS
    function getAllCollectionIds() {
      return mCollections.map((collection) => collection.getId());
    }
  
    // Get 1 collection
    function getCollection(collectionOrId) {
      let collectionId = getKeyFromProp(collectionOrId, "getId()");
      if (isDef(collectionId) && mCollections.has(collectionId)) {
        return mCollections.get(collectionId);
      }
      return null;
    }
  
    function getCollections(collectionsOrIds) {
      let results = [];
      getAllCollectionIds().forEach((collectionOrId) => {
        let collection = getCollection(collectionOrId);
        if (isDef(collection)) {
          results.push(collection);
        }
      });
      return results;
    }
  
    function getCollectionThatHasCard(cardOrId) {
      let card = mGameRef.getCard(cardOrId);
      let cardId = card.id;
      let collectionIds = getAllCollectionIds();
  
      for (let i = 0; i < collectionIds.length; ++i) {
        let collectionId = collectionIds[i];
        let collection = getCollection(collectionId);
        if (isDef(collection)) {
          if (collection.hasCard(cardId)) {
            return collection;
          }
        }
      }
      return null;
    }
  
  
    function serialize(){
      return {
        order: getAllCollectionIds(),
        items: mCollections.serialize(),
      }
    }
  
    function unserialize(data){
      reset();
      data.order.forEach(collectionId => {
        let collectionData = data.items[collectionId];
    
        let collection = createCollection();
        collection.unserialize(collectionData);
      })
    }
  
    const publicScope = {
      reset, 
      createCollection,
      getCollection,
      getCollections,
      getCollectionThatHasCard,
      allCollections: mCollections.toArray,
      getAllCollectionIds,
      hasCollection: mCollections.has,
      removeCollection: mCollections.remove,
      filterUnassignedCollections,
      serialize,
      unserialize,
    };
  
    function getPublic() {
      return { ...publicScope };
    }
  
    return getPublic();
  }

  return CollectionManager
}
