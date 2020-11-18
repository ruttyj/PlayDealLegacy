module.exports = function buildPlayerManager({
  isDef, isDefNested, isObj, makeMap, getKeyFromProp,
  TurnManager,
  CollectionManager,
  Player,
  constants
}){
  return function PlayerManager(gameRef = null) {
    let mGameRef = gameRef;
  
    let mState;
    let mTurnManager;
    let mPlayers;
    let mPlayerKeys;
    let mCollectionManager;
  
    
  
    //--------------------------------
  
    //      Player Collections
  
    //--------------------------------
    function getCollectionManager() {
      return mCollectionManager;
    }
  
    function createNewCollectionForPlayer(playerKeyOrObj) {
      let player = getPlayer(playerKeyOrObj);
      if (isDef(player)) {
        let collection = getCollectionManager().createCollection();
        associateCollectionToPlayer(collection, player);
        return collection;
      }
      return null;
    }
  
    function getOrCreateUselessCollectionForPlayer(playerKeyOrObj) {
      let uselessSetKey = constants.USELESS_PROPERTY_SET_KEY;
      let player = getPlayer(playerKeyOrObj);
  
      // search for collection
      if (isDef(player)) {
        let allPlayerCollectionIds = player.getAllCollectionIds();
        let foundCollection = null;
        allPlayerCollectionIds.forEach((collectionId) => {
          let collection = mGameRef
            .getCollectionManager()
            .getCollection(collectionId);
          if (collection.getPropertySetKey() === uselessSetKey) {
            foundCollection = collection;
          }
        });
        if (isDef(foundCollection)) {
          return foundCollection;
        }
  
        // no collection found
        let uselessCollection = createNewCollectionForPlayer(playerKeyOrObj);
        uselessCollection.setPropertySetKey(uselessSetKey);
        return uselessCollection;
      }
      return null;
    }
  
    function getAllCollectionIdsForPlayer(playerKey) {
      if (hasPlayer(playerKey)) {
        return getPlayer(playerKey).getAllCollectionIds();
      }
      return null;
    }
  
    function getAllCollectionsForPlayer(playerKey) {
      if (hasPlayer(playerKey)) {
        let collectionIds = getAllCollectionIdsForPlayer(playerKey);
        if (isDef(collectionIds))
          return getCollectionManager().getCollections(collectionIds);
      }
      return null;
    }
  
    function getCollection(collectionOrId) {
      let collectionId = getKeyFromProp(collectionOrId, "getId()");
      if (isDef(collectionId))
        return getCollectionManager().getCollection(collectionId);
      return null;
    }
  
    function associateCollectionToPlayer(collectionOrId, playerOrId) {
      let collection = getCollection(collectionOrId);
      let player = getPlayer(playerOrId);
      if (isDef(collection) && isDef(player)) {
        collection.setPlayerKey(player.getKey());
        player.addCollectionId(collection.getId());
      }
    }
  
    function disassociateCollectionFromPlayer(collectionOrId) {
      let collection = getCollection(collectionOrId);
      if (isDef(collection)) {
        let collectionId = collection.getId();
        let prevOwnerKey = collection.getPlayerKey();
        if (isDef(prevOwnerKey)) {
          let prevOwner = getPlayer(prevOwnerKey);
          if (isDef(prevOwner)) {
            prevOwner.removeCollectionId(collectionId);
          }
        }
      }
    }
  
    function removeCollection(collectionOrId) {
      let collection = getCollection(collectionOrId);
      if (isDef(collection)) {
        if (collection.cardCount() === 0) {
          let collectionId = collection.getId();
          disassociateCollectionFromPlayer(collectionId);
          getCollectionManager().removeCollection(collectionId);
        }
      }
    }
  
    function transferCollectionOwnership(collectionOrId, playerKeyOrObj) {
      let collection = getCollection(collectionOrId);
      let player = getPlayer(playerKeyOrObj);
  
      if (isDef(player) && isDef(collection)) {
        let collectionId = collection.getId();
        let prevOwnerKey = collection.getPlayerKey();
        let prevOwner = getPlayer(prevOwnerKey);
        if (isDef(prevOwner)) {
          prevOwner.removeCollectionId(collectionId);
        }
  
        collection.setPlayerKey(player.getKey());
        player.addCollectionId(collectionId);
  
        return collection;
      }
      return false;
    }
  
    //------------------------------
    //        Make Player
    //------------------------------
  
    function createPlayer(key) {
      // make new player
      let player = Player(getPublic());
      player.setKey(key);
      //player.setPlayerManager(getPublic());
  
      mPlayers.set(key, player);
      mPlayerKeys.push(key);
  
      return player;
    }
  
    function getPlayer(playerKeyOrObj) {
      let key = getKeyFromProp(playerKeyOrObj, "getKey()");
      if (isDef(key) && mPlayers.has(key)) {
        let player = mPlayers.get(key);
        return player;
      }
      return null;
    }
  
    function getAllPlayers() {
      return mPlayers.toArray();
    }
  
    function hasPlayer(playerKeyOrObj) {
      let key = getKeyFromProp(playerKeyOrObj, "getKey()");
      if (isDef(key)) return mPlayers.has(key);
      return false;
    }
  
    function getAllPlayerKeys() {
      return mPlayerKeys;
    }
  
    function getPlayerCount() {
      return mPlayerKeys.length;
    }
  
    function getTurnManager(){
      return mTurnManager;
    }
  
    function getGameRef() {
      return mGameRef;
    }
  
    function reset() {
      mState = {};
      mPlayers = makeMap(mState, "players");
      mPlayerKeys = [];
      mCollectionManager = CollectionManager(mGameRef);
  
      mTurnManager = TurnManager();
      mTurnManager.injectDeps({
        playerManager:  getPublic(),
        gameRef:        getGameRef(),
      })
      mTurnManager.newTurn()
    }
    
    function serialize() {
  
      let playerKeys = getAllPlayerKeys();
  
      
  
  
      // @TODO playerRequests
      let players = {}
      getAllPlayers().forEach((player) => {
        let playerKey = player.getKey();
        players[playerKey] = {
          hand: player.getHand().serialize(),
          bank: player.getBank().serialize(),
          collections: player.getAllCollectionIds(),
        }
      })
  
      return {
        players: {
          order: playerKeys,
          items: players
        },
      };
    }
  
    function unserialize(serializedState) {
      reset();
  
      // Load players
      if(isObj(serializedState) ){
        if(isDefNested(serializedState, ['players', 'order'])){
          let playerKeys = serializedState.players.order;
  
          // add player
          playerKeys.forEach(playerKey => {
            createPlayer(playerKey);
          })
  
          // load player data
          if(isDefNested(serializedState, ['players', 'items'])){
            playerKeys.forEach(playerKey => {
  
              // load hand
              let newPlayerHand = getPlayer(playerKey).getHand();
              if(isDefNested(serializedState, ['players', 'items', playerKey, 'hand'])){
                newPlayerHand.unserialize(serializedState.players.items[playerKey].hand);
              }
  
              // load bank
              let newPlayerBank = getPlayer(playerKey).getBank();
              if(isDefNested(serializedState, ['players', 'items', playerKey, 'bank'])){
                newPlayerBank.unserialize(serializedState.players.items[playerKey].bank);
              }
  
              // load collections
  
  
  
            })
          }
        }
      } // end load players
    }
  
    function getPublic() {
      return {
        // Self
        getGameRef,
        reset,
        serialize,
        unserialize,
    
        // Players
        createPlayer,
        getPlayer,
        hasPlayer,
        getAllPlayers,
        getAllPlayerKeys,
        getPlayerCount,
    
        // Collections
        getCollection,
        removeCollection,
        getCollectionManager,
        createNewCollectionForPlayer,
        disassociateCollectionFromPlayer,
        associateCollectionToPlayer,
        getOrCreateUselessCollectionForPlayer,
        getAllCollectionsForPlayer,
        getAllCollectionIdsForPlayer,
        transferCollectionOwnership,
      };
    }
  
    reset();
    return getPublic();
  }
}
