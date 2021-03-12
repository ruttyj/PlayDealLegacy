const {
  isDef,
  makeVar,
  makeList,
  stateSerialize,
  getKeyFromProp,
} = require("../utils.js");
const { INCLUDE_DEBUG_DATA } = require("../config/constants.js");

function Collection(gameRef = null) {
  let mGameRef = gameRef;
  const mState = {};
  const mExcludeKeys = [];

  const { get: getId, set: setId, has: hasId } = makeVar(mState, "id");

  const { get: getPlayerKey, set: setPlayerKey, has: hasPlayerKey } = makeVar(
    mState,
    "playerKey",
    null
  );

  const {
    get: getPropertySetKey,
    set: setPropertySetKey,
    has: hasPropertySetKey,
    remove: removePropertySetKey,
  } = makeVar(mState, "propertySetKey", null);

  const {
    get: propertyCount,
    inc: _incPropertyCount,
    dec: _decPropertyCount,
  } = makeVar(mState, "propertyCount", 0);

  const mPropertyAugmentCount = makeVar(mState, "augmentCount", 0);
  const mCardIds = makeList(mState, "cardIds", []);

  const mIsFullSet = makeVar(mState, "isFullSet", false);

  function hasCard(cardOrId) {
    let cardId = getKeyFromProp(cardOrId, "id");
    return mCardIds.includes(cardId);
  }

  function getCard(cardOrId) {
    let cardId = getKeyFromProp(cardOrId, "id");
    return mGameRef.getCard(cardId);
  }

  function getPropertySet() {
    if (isDef(mGameRef)) {
      let propertySetKey = getPropertySetKey();
      return mGameRef.getPropertySet(propertySetKey);
    }
    return null;
  }

  function updateIsComplete() {
    if (isDef(mGameRef)) {
      let propertySet = getPropertySet();
      if (isDef(propertySet)) {
        mIsFullSet.set(propertySet.size === propertyCount());
      }
    }
  }

  function remainingToBeFull() {
    if (isDef(mGameRef)) {
      let propertySet = getPropertySet();
      if (isDef(propertySet)) {
        return propertySet.size - propertyCount();
      }
    } else return 1000000; // yeah.. something went wrong
  }

  function addCard(cardOrId) {
    let cardId = getKeyFromProp(cardOrId, "id");
    let card = mGameRef.getCard(cardId);
    if (!mCardIds.hasValue(cardId)) mCardIds.push(cardId);

    if (card.type === "property") {
      let propertySetKey = card.set;
      if (propertyCount() === 0) {
        setPropertySetKey(propertySetKey);
      }
      _incPropertyCount();
      updateIsComplete();
    }

    if (card.class === "setAugment") {
      mPropertyAugmentCount.inc();
    }
  }

  function removeCard(cardOrId) {
    let cardId = getKeyFromProp(cardOrId, "id");

    let card = getCard(cardId);
    if (card.type === "property") {
      _decPropertyCount();
      updateIsComplete();
    }

    if (card.class === "setAugment") {
      mPropertyAugmentCount.dec();
    }

    mCardIds.removeValue(card.id);
  }

  function getAllCardIds() {
    return mCardIds.getAll();
  }

  function serialize() {
    let result = stateSerialize(mState, mExcludeKeys);

    result.remainingToBeFull = remainingToBeFull();

    if (INCLUDE_DEBUG_DATA) {
      result.cards = getAllCardsKeyed();
    }
    return result;
  }

  function unserialize(data) {
    setPlayerKey(data.playerKey);
    setPropertySetKey(data.propertySetKey);
    data.cardIds.forEach(cardId => {
      addCard(cardId);
    })
  }

  function filterCardsKeyed(fn) {
    let result = {};
    let selfRef = getPublic();
    mCardIds.forEach((cardId) => {
      let card = getCard(cardId);
      if (fn(card, cardId, selfRef)) {
        result[cardId] = card;
      }
    });
    return result;
  }

  function filterCards(fn) {
    let result = [];
    let selfRef = getPublic();
    mCardIds.forEach((cardId) => {
      let card = getCard(cardId);
      if (fn(card, cardId, selfRef)) {
        result.push(card);
      }
    });
    return result;
  }

  function findCard(fn) {
    let result = null;
    mCardIds.forEach((cardId) => {
      let card = getCard(cardId);
      if (fn(card, cardId, getPublic())) {
        result = card;
      }
    });
    return result;
  }

  function mapCards(fn = (v) => v) {
    let selfRef = getPublic();
    return mCardIds.map((cardId) => fn(getCard(cardId), cardId, selfRef));
  }

  function allCards() {
    return mapCards();
  }

  function getAllCards() {
    return filterCards(() => true);
  }

  function getAllCardsKeyed() {
    return filterCardsKeyed(() => true);
  }

  function getAllPropertyCards() {
    return filterCards((card) => card.type === "property");
  }

  function getAllAugmentCards() {
    return filterCards(
      (card) => card.type === "action" && card.class === "setAugment"
    );
  }

 

  const publicScope = {
    getId,
    setId,
    hasId,

    getPlayerKey,
    setPlayerKey,
    hasPlayerKey,

    getPropertySet,
    getPropertySetKey,
    setPropertySetKey,
    removePropertySetKey,
    hasPropertySetKey,

    isFull: mIsFullSet.get,
    remainingToBeFull,
    getAllPropertyCards,
    getAllAugmentCards,
    getCard,
    addCard,
    removeCard,
    hasCard,
    isEmpty: mCardIds.isEmpty,
    getAllCards,
    getAllCardsKeyed,
    filterCard: filterCards,
    filterCards,
    filterCardsKeyed,
    findCard,
    allCards,
    mapCards,
    getAllCardIds,
    propertyCount,
    cardCount: mCardIds.count,
    augmentCount: mPropertyAugmentCount.get,

    serialize,
    unserialize,
  };

  function getPublic() {
    return { ...publicScope };
  }

  return getPublic();
}

module.exports = Collection;
