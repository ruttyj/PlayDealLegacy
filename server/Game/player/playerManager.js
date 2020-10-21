const { isDef, isDefNested, isObj, isArr, makeMap, getKeyFromProp } = require("../utils.js");
const PlayerTurn = require("./playerTurn.js");
const TurnManager = require("./turnManager.js");
const CollectionManager = require("../collection/collectionManager.js");
const Player = require("./player.js");
const constants = require("../config/constants.js");

//==================================================

//                Player Manager

//==================================================
/**
 * Manages game specific person related data.
 *
 * @param {*} gameRef reference to game instance
 */
function PlayerManager(gameRef = null) {
  let mGameRef = gameRef;

  let mState;
  let mTurnManager;
  let mCurrentTurnPlayerIndex;
  let mCurrentTurn;
  let mPlayers;
  let mPlayerKeys;
  let mCanProceedNextTurn;
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

  function getCanProceedToNextTurn() {
    return mCanProceedNextTurn;
  }

  function setCanProceedToNextTurn(val) {
    mCanProceedNextTurn = val;
  }


  

  function initializePlayerTurn() {
    if (isDef(mCurrentTurn)) {
      mCurrentTurn.destroy();
    }
    let playerKeys = getAllPlayerKeys();
    if (playerKeys.length > 0) {
      mCurrentTurn = PlayerTurn(mGameRef, playerKeys[mCurrentTurnPlayerIndex]);
    }
  }

  function nextPlayerTurn() {
    if (getCanProceedToNextTurn()) {
      let numPlayers = getPlayerCount();
      mCurrentTurnPlayerIndex = (mCurrentTurnPlayerIndex + 1) % numPlayers;
      initializePlayerTurn();

      return mPlayerKeys[mCurrentTurnPlayerIndex];
    }
    return undefined;
  }

  function getCurrentTurnPlayerKey() {
    return mPlayerKeys[mCurrentTurnPlayerIndex];
  }

  function getCurrentTurn() {
    return mCurrentTurn;
  }

  function getGameRef() {
    return mGameRef;
  }

  function destory() {
    if (isDef(mCurrentTurn)) {
      mCurrentTurn.destroy();
    }
  }

  function reset() {
    mState = {};
    mCurrentTurnPlayerIndex = 0;
    mPlayers = makeMap(mState, "players");
    mPlayerKeys = [];
    mCanProceedNextTurn = true;
    mCollectionManager = CollectionManager(mGameRef);

    mTurnManager = TurnManager();
    mTurnManager.injectDeps({
      playerManager: getPublic()
    })
    initializePlayerTurn();
  }
  
  function serialize() {

    let playerKeys = getAllPlayerKeys();

    let currentTurn = getCurrentTurn();
    let turnState = null;
    if(isDef(currentTurn)){
      turnState = currentTurn.serialize()
    }


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
      turn: {
        currentTurnPlayerIndex: mCurrentTurnPlayerIndex,
        current: turnState
      }
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
      destory,
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
  
      // Player Turn
      getCurrentTurnPlayerKey,
      getCurrentTurn,
      nextPlayerTurn,
      getCanProceedToNextTurn,
      setCanProceedToNextTurn,
  
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

module.exports = PlayerManager;
