const utilsFolder = `../utils`;
const { isDef, jsonLog } = require(`${utilsFolder}`);

const assert = require("chai").assert;

function transferPropertyBetweenSetsToCompleteSetDestroyingPreviousSetChecks({ responses, isFullSet, toCollectionId, fromCollectionId, thisPersonId, expectedToCollectionPropertyCount }) {
  let confirm = responses.find(r => r.subject === "MY_TURN" && r.action === "TRANSFER_PROPERTY_TO_EXISTING_COLLECTION_FROM_COLLECTION");
  assert.equal(confirm.status, "success", "operation was marked as success");

  let collectionData = responses.find(r => r.subject === "COLLECTIONS" && r.action === "GET_KEYED");
  assert.exists(collectionData.payload.items[toCollectionId], "To collection exists");

  let toCollection = collectionData.payload.items[toCollectionId];
  assert.equal(toCollection.isFullSet, isFullSet, "isFullSet is as expected");
  assert.equal(toCollection.propertyCount, expectedToCollectionPropertyCount, "property count updates as expected");
  assert.notExists(collectionData.payload.items[fromCollectionId], "From collection does not exist");

  let updatePlayerCollectionList = responses.find(r => r.subject === "PLAYER_COLLECTIONS" && r.action === "GET_KEYED");
  assert.exists(updatePlayerCollectionList, "update collection list for player exists");
  assert.notInclude(updatePlayerCollectionList.payload.items[thisPersonId], fromCollectionId, "the empty collection was sucesfully removed");

  let collectionDataRemoved = responses.find(r => r.subject === "COLLECTIONS" && r.action === "REMOVE_KEYED");
  assert.exists(collectionDataRemoved, "Remove set notice exists");
  assert.include(collectionDataRemoved.payload.removeItemsIds, fromCollectionId, "notify to remove collection");
}

function expectedAddPropertyToNewCollectionFromHandCheck({
  responses,
  thisPersonId,
  expectedHandCount,
  expectedTurnPhase,
  expectedActionCount,
  expectedPropertyCount,
  exprectedCollectionId,
  cardId,
  cardPropertySetKey
}) {
  // ACTION CONFIRM
  let confirm = responses.find(r => r.subject === "MY_TURN" && r.action === "ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND");
  assert.exists(confirm, `confirmation exists`);
  // CURRENT TURN DATA
  let playerTurnData = responses.find(r => r.subject === "PLAYER_TURN" && r.action === "GET");
  assert.exists(playerTurnData, "playerTurnData exists");
  assert.equal(playerTurnData.payload.playerKey, thisPersonId, "is correct player turn");
  assert.equal(playerTurnData.payload.phase, expectedTurnPhase, "is correct phase");
  assert.equal(playerTurnData.payload.actionCount, expectedActionCount, "is correct action count");
  //@TODO card played & actionsPreformed should accomidate for property swaps etc

  // PLAYER COLLECTION ASSOCIATION
  let playerCollectionData = responses.find(r => r.subject === "PLAYER_COLLECTIONS" && r.action === "GET_KEYED");
  assert.exists(playerCollectionData, "player collection data exists");
  assert.include(playerCollectionData.payload.items[thisPersonId], exprectedCollectionId, "Player has collection associated");

  // COLLECTION DATA
  let collectionData = responses.find(r => r.subject === "COLLECTIONS" && r.action === "GET_KEYED");
  assert.exists(collectionData.payload.items[exprectedCollectionId], "Collection data exists");
  let collection = collectionData.payload.items[exprectedCollectionId];
  assert.include(collection.cardIds, cardId, "card is in collection");
  assert.equal(collection.playerKey, thisPersonId, "collection has player key");
  assert.equal(collection.propertySetKey, cardPropertySetKey, "collection property set assigned");
  assert.equal(collection.propertyCount, expectedPropertyCount, "property is appearing in property count");
  assert.equal(collection.augmentCount, 0, "property is not appearing in augment count");

  // PLAYER HAND
  let handData = responses.find(r => r.subject === "PLAYER_HANDS" && r.action === "GET_KEYED");
  assert.exists(handData, "hand data is present");
  assert.isObject(handData.payload.items[thisPersonId], "hand details defined");
  let myHand = handData.payload.items[thisPersonId];
  assert.equal(myHand.cardIds.length, expectedHandCount, "expected hand card count");
  assert.notExists(myHand.cardIds.find(cid => cid === cardId), "card is no longer in hand");
}

function expectedAddPropertyToExistingCollectionFromHandCheck({
  responses,
  thisPersonId,
  expectedHandCount,
  expectedTurnPhase,
  expectedActionCount,
  expectedPropertyCount,
  collectionId,
  cardId,
  cardPropertySetKey
}) {
  // ACTION CONFIRM
  let confirm = responses.find(r => r.subject === "MY_TURN" && r.action === "ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND");
  assert.exists(confirm, `confirmation exists`);

  // CURRENT TURN DATA
  let playerTurnData = responses.find(r => r.subject === "PLAYER_TURN" && r.action === "GET");
  assert.exists(playerTurnData, "playerTurnData exists");
  assert.equal(playerTurnData.payload.playerKey, thisPersonId, "is correct player turn");
  assert.equal(playerTurnData.payload.phase, expectedTurnPhase, "is correct phase");
  assert.equal(playerTurnData.payload.actionCount, expectedActionCount, "is correct action count");
  //@TODO card played & actionsPreformed should accomidate for property swaps etc

  // COLLECTION DATA
  let collectionData = responses.find(r => r.subject === "COLLECTIONS" && r.action === "GET_KEYED");
  assert.exists(collectionData.payload.items[collectionId], "Collection data exists");
  let collection = collectionData.payload.items[collectionId];
  assert.include(collection.cardIds, cardId, "card is in collection");
  assert.equal(collection.playerKey, thisPersonId, "collection has player key");
  assert.equal(collection.propertySetKey, cardPropertySetKey, "collection property set assigned");
  assert.equal(collection.propertyCount, expectedPropertyCount, "property is appearing in property count");
  assert.equal(collection.augmentCount, 0, "property is not appearing in augment count");

  // PLAYER HAND
  let handData = responses.find(r => r.subject === "PLAYER_HANDS" && r.action === "GET_KEYED");
  assert.exists(handData, "hand data is present");
  assert.isObject(handData.payload.items[thisPersonId], "hand details defined");
  let myHand = handData.payload.items[thisPersonId];
  assert.equal(myHand.cardIds.length, expectedHandCount, "expected hand card count");
  assert.notExists(myHand.cardIds.find(cid => cid === cardId), "card is no longer in hand");
}

function handCheck({ handSize, data, personId, includesCardIds = [], excludeCardIds = [] }) {
  assert.exists(data.payload.items, "payload items exist");
  let items = data.payload.items;

  assert.equal(items[personId].cardIds.length, handSize, "This player can see their own cards");
  assert.exists(items[personId].cardIds, "This player can see their own cards");
  assert.exists(data.payload.order, "payload order exist");

  includesCardIds.forEach(cardId => {
    assert.include(items[personId].cardIds, cardId, "Card exists in hand");
  });

  excludeCardIds.forEach(cardId => {
    assert.notInclude(items[personId].cardIds, cardId, "Card should not be in hand");
  });
}

function handleChangeWildCardSetInHandCheck({ responses, cardId, chosenSetKey }) {
  let [subject, action] = ["MY_TURN", "CHANGE_CARD_ACTIVE_SET"];
  let playerHands = responses.find(r => r.subject === subject && r.action === action);
  assert.equal(playerHands.status, "success", "Confirm action status");

  [subject, action] = ["CARDS", "GET_KEYED"];
  let cardDefns = responses.find(r => r.subject === subject && r.action === action);
  assert.equal(cardDefns.payload.items[cardId].set, chosenSetKey, "Card changed set sucessfully");
}

function handleTurnStartingDrawCheck({ responses, personId, handSize, drawPileSize }) {
  let playerHands = responses.find(r => r.subject === "PLAYER_HANDS" && r.action === "GET_KEYED");
  handCheck({
    data: playerHands,
    personId: personId,
    handSize: handSize
  });

  let drawPileData = responses.find(r => r.subject === "DRAW_PILE" && r.action === "GET");
  checkPileCheck({
    data: drawPileData,
    count: drawPileSize,
    visibleCards: false
  });
}

function initialHandCheck({ numberOfPlayers, initalHandSize, playerHands, personId, otherPeopleIds }) {
  assert.exists(playerHands.payload.items, "payload items exist");
  assert.equal(Object.keys(playerHands.payload.items).length, numberOfPlayers, "payload items count correct");
  let items = playerHands.payload.items;

  // Self
  assert.exists(items[personId].cardIds, "This player can see their own cards");

  // Other
  otherPeopleIds.forEach(otherPersonId => {
    assert.notExists(items[otherPersonId].cardIds, "should not be able to see other persons hand");
    assert.notExists(items[otherPersonId].cards, "should not be able to see other persons hand");
    assert.equal(items[otherPersonId].count, initalHandSize, "can only see number of cards");
  });

  assert.exists(playerHands.payload.order, "payload order exist");
  assert.equal(playerHands.payload.order.length, numberOfPlayers, "payload order count correct");
}

function propertySetCheck({ data }) {
  assert.isObject(data.payload.items, "object of properties exist");
  let items = data.payload.items;
  let itemKeys = Object.keys(items);
  assert.isAtLeast(itemKeys.length, 2, "at least 2 property set defintions exist");

  itemKeys.forEach(propKey => {
    let propertySet = items[propKey];
    assert.equal(propertySet.key, propKey, "items are keyed correctly");
    assert.exists(propertySet.colorCode, "color code exists");
    assert.isAtLeast(propertySet.size, 1, "set is greater than 1");
    assert.isObject(propertySet.rent, "rent is defined");
    assert.equal(propertySet.size, Object.keys(propertySet.rent).length, "all rents are defined");
  });
}

// confirm look up of cards
function cardLookupCheck(cardsData) {
  assert.isObject(cardsData.payload.items, "card map exists");
  assert.isArray(cardsData.payload.order, "card order exists");
}

function playerCheck(data) {
  assert.isArray(data.payload.order, "player order is defined");
  assert.isAtLeast(data.payload.order.length, 2, "atleast 2 players in game");
}

function currentTurnCheck({ data, phase, actionCount = 0, actionLimit = 3, playerTurnId }) {
  assert.equal(data.payload.playerKey, playerTurnId, "second player goes first");
  assert.equal(data.payload.phase, phase, "second player goes first");
  assert.equal(data.payload.actionCount, actionCount, "correct action count");
  assert.equal(data.payload.actionLimit, actionLimit, "correct action limit");
}

function checkPileCheck({ data, count = null, visibleCards = false }) {
  if (isDef(count)) {
    assert.equal(data.payload.count, count, "Draw pile count matches");
  }
  if (visibleCards) {
    assert.exists(data.payload.cardIds, "cards should be visible");
  } else {
    assert.notExists(data.payload.cardIds, "cards should not be visible");
  }
}

function gameStatusCheck({ data, isGameStarted = false, isInProgress = false, isGameOver = false }) {
  assert.equal(data.payload.isGameStarted, isGameStarted, "game is started");
  assert.equal(data.payload.isInProgress, isInProgress, "game is started");
  assert.equal(data.payload.isGameOver, isGameOver, "game is started");
}

function startGameCheck({ responses, numberOfPlayers, playerTurnId, allPlayerIds, initalHandSize, intialDrawPileSize, personId, otherPeopleIds }) {
  let playerHands = responses.find(r => r.subject === "PLAYER_HANDS" && r.action === "GET_KEYED");
  initialHandCheck({ numberOfPlayers, initalHandSize, playerHands, personId, otherPeopleIds });

  let propertySetsData = responses.find(r => r.subject === "PROPERTY_SETS" && r.action === "GET_KEYED");
  propertySetCheck({
    data: propertySetsData
  });

  let cardsData = responses.find(r => r.subject === "CARDS" && r.action === "GET_KEYED");
  cardLookupCheck(cardsData);

  let playersData = responses.find(r => r.subject === "PLAYERS" && r.action === "GET");
  playerCheck(playersData);

  let playerTurnData = responses.find(r => r.subject === "PLAYER_TURN" && r.action === "GET");
  currentTurnCheck({
    data: playerTurnData,
    phase: "draw",
    actionCount: 0,
    actionLimit: 3,
    playerTurnId: playerTurnId
  });

  let collectionsData = responses.find(r => r.subject === "COLLECTIONS" && r.action === "GET_KEYED");
  assert.isObject(collectionsData.payload.items, "Collections map exist");
  assert.isArray(collectionsData.payload.order, "Collections order exist");

  let drawPileData = responses.find(r => r.subject === "DRAW_PILE" && r.action === "GET");
  checkPileCheck({
    data: drawPileData,
    count: intialDrawPileSize,
    visibleCards: false
  });

  let activePileData = responses.find(r => r.subject === "ACTIVE_PILE" && r.action === "GET");
  checkPileCheck({
    data: activePileData,
    count: 0,
    visibleCards: true
  });

  let discardPileData = responses.find(r => r.subject === "DISCARD_PILE" && r.action === "GET");
  checkPileCheck({
    data: discardPileData,
    count: 0,
    visibleCards: true
  });

  let gameStatusData = responses.find(r => r.subject === "GAME" && r.action === "STATUS");
  gameStatusCheck({
    data: gameStatusData,
    isGameStarted: true,
    isInProgress: true,
    isGameOver: false
  });

  let playerBankData = responses.find(r => r.subject === "PLAYER_BANKS" && r.action === "GET_KEYED");
  assert.isObject(playerBankData.payload.items, "player banks exist");
  let playerBanks = playerBankData.payload.items;
  allPlayerIds.forEach(personId => {
    assert.isArray(playerBanks[personId].cardIds, "card ids are visible");
    assert.equal(playerBanks[personId].count, 0, "count is 0");
  });
}

module.exports = {
  initialHandCheck,
  handCheck,
  propertySetCheck,
  cardLookupCheck,
  playerCheck,
  currentTurnCheck,
  checkPileCheck,
  gameStatusCheck,
  startGameCheck,
  expectedAddPropertyToNewCollectionFromHandCheck,
  expectedAddPropertyToExistingCollectionFromHandCheck,
  transferPropertyBetweenSetsToCompleteSetDestroyingPreviousSetChecks,

  handleChangeWildCardSetInHandCheck,
  handleTurnStartingDrawCheck
};
