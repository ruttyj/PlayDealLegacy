import {
  isDef,
  isStr,
  isArr,
  isObj,
  getNestedValue,
  getKeyFromProp,
} from "../../utils/";
import gameBuffer from "../buffers/gameBuffer";

let storeName = "game";

const makeGetters = (state) => {
  const cachedState = state;
  const storeState = gameBuffer.getState();

  //publicScope
  const pi = {
    getCustomUi(path = [], fallback = null) {
      return getNestedValue(storeState.uiCustomize, path, fallback);
    },
    displayMode: storeState.displayMode,

    // PROPERTY SETS
    propertySets: storeState.propertySets,
    getPropertySetMap() {
      return gameBuffer.get(["propertySets", "items"], {});
    },

    // COLLECTIONS
    playerCollections: storeState.playerCollections,

    collections: storeState.collections,

    getCollectionIdsForPlayer(playerId) {
      return gameBuffer.get(["playerCollections", "items", playerId], []);
    },

    getCollection(collectionId) {
      let collection = gameBuffer.get(
        ["collections", "items", collectionId],
        {}
      );
      let result = { ...collection };
      let collectionCardIds = getNestedValue(result, "cardIds", []);
      result.cards = pi._mapCardIdsToCardObject(collectionCardIds);
      return result;
    },

    getIsCollectionFull(collectionId) {
      let collection = pi.getCollection(collectionId);
      return getNestedValue(collection, "isFullSet", false);
    },
    getCollections(myCollectionIds) {
      let result = [];
      myCollectionIds.forEach((collectionId) => {
        let collection = pi.getCollection(collectionId);
        if (isDef(collection)) result.push(collection);
      });
      return result;
    },

    getCollectionIdsMatchingSets(playerId, propertySetKeys) {
      let result = [];
      let myCollectionIds = pi.getCollectionIdsForPlayer(playerId);
      myCollectionIds.forEach((collectionId) => {
        let collection = pi.getCollection(collectionId);
        if (propertySetKeys.includes(collection.propertySetKey)) {
          result.push(collectionId);
        }
      });
      return result;
    },

    getCollectionMatchingSet(playerId, propertySetKey) {
      let myCollectionIds = pi.getCollectionIdsForPlayer(playerId);

      for (
        let collectionIndex = 0;
        collectionIndex < myCollectionIds.length;
        ++collectionIndex
      ) {
        let collectionId = myCollectionIds[collectionIndex];

        let collectionCards = pi.getCollectionCards(collectionId);
        for (
          let cardIndex = 0;
          cardIndex < collectionCards.length;
          ++cardIndex
        ) {
          let card = collectionCards[cardIndex];
          if (isDef(card.set)) {
            if (card.set === propertySetKey) {
              return collectionId;
            }
          }
        }
      }
      return null;
    },

    getCollectionCards(collectionId) {
      let collectionCardIds = gameBuffer.get(
        ["collections", "items", collectionId, "cardIds"],
        []
      );
      return pi._mapCardIdsToCardList(collectionCardIds);
    },

    getCollectionCardIds(collectionId) {
      return gameBuffer.get(
        ["collections", "items", collectionId, "cardIds"],
        []
      );
    },

    // ROOM
    getRoomCode() {
      return cachedState.rooms.currentRoom
        ? cachedState.rooms.currentRoom.code
        : null;
    },
    getCurrentRoom() {
      return cachedState.rooms.currentRoom;
    },

    // PEOPLE
    players: storeState.players,

    getHostId() {
      return cachedState.people.host;
    },

    isHost(personId = null) {
      if (!isDef(personId)) personId = pi.getMyId();
      let hostId = pi.getHostId();
      return isDef(hostId) && String(hostId) === String(personId);
    },

    amIHost() {
      return pi.isMyId(pi.getHostId());
    },

    getMyId() {
      return cachedState.people.myId;
    },

    isMyId(personId = null) {
      let myId = pi.getMyId();
      if (!isDef(personId)) return false;
      return isDef(myId) && String(myId) === String(personId);
    },

    getPerson(personId) {
      return isDef(cachedState.people.items[personId])
        ? cachedState.people.items[personId]
        : null;
    },

    getPersonStatus(personId = null) {
      if (!isDef(personId)) personId = pi.getMyId();

      let person = pi.getPerson(personId);
      if (isDef(person)) return person.status;
      return null;
    },

    isPersonReady(personId = null) {
      if (!isDef(personId)) personId = pi.getMyId();
      let status = pi.getPersonStatus(personId);
      return status === "ready";
    },

    isAllPlayersReady() {
      let readyCount = 0;
      let personCount = cachedState.people.order.length;
      cachedState.people.order.forEach((personId) => {
        let person = pi.getPerson(personId);
        if (person.status === "ready") {
          ++readyCount;
        }
      });
      return readyCount === personCount;
    },

    getAllPeopleList() {
      let result = [];
      cachedState.people.order.foreach((personId) => {
        let person = cachedState.people.items[personId];
        result.push(person);
      });
      return result;
    },

    getAllPlayerIds() {
      return gameBuffer.get(["players", "order"], []);
    },

    // People in game
    getAllPlayers() {
      let playerOrder = pi.getAllPlayerIds();
      return playerOrder.map((...props) => pi.getPerson(...props));
    },

    getAllOpponentIds() {
      let myId = pi.getMyId();
      return pi.getAllPlayerIds().filter((id) => String(id) !== String(myId));
    },

    // PLAYER HAND
    playerHands: storeState.playerHands,
    getAllPlayerHands() {
      return storeState.playerHands;
    },
    getMyHandCardIds() {
      return gameBuffer.get(
        ["playerHands", "items", pi.getMyId(), "cardIds"],
        {}
      );
    },
    getPlayerHand(playerId) {
      let playerHand = gameBuffer.get(["playerHands", "items", playerId], {});
      return pi._mergeCardDataIntoObject(playerHand);
    },
    getMyHand() {
      return pi.getPlayerHand(pi.getMyId());
    },

    //gameConstants
    getMyCardIdsWithTags(mxd) {
      let tags = isArr(mxd) ? mxd : [mxd];
      let myHand = pi.getMyHand();
      let result = [];
      let cardIds = myHand.cardIds;
      if (isArr(cardIds)) {
        cardIds.forEach((cardId) => {
          for (let i = 0; i < tags.length; ++i) {
            if (pi.doesCardHaveTag(cardId, tags[i])) {
              result.push(cardId);
              break;
            }
          }
        });
      }
      return result;
    },

    getMyCardIdsWithTag(tag) {
      let myHand = pi.getMyHand();
      let result = [];
      let cardIds = myHand.cardIds;
      if (isArr(cardIds)) {
        cardIds.forEach((cardId) => {
          if (pi.doesCardHaveTag(cardId, tag)) {
            result.push(cardId);
          }
        });
      }
      //rentAugment
      return result;
    },

    // PLAYER BANK
    playerBanks: storeState.playerBanks,
    getMyBankCardIds() {
      return getNestedValue(
        pi.playerBanks,
        ["items", pi.getMyId(), "cardIds"],
        []
      );
    },
    getPlayerBankCardIds(playerId) {
      return getNestedValue(pi.playerBanks, ["items", playerId, "cardIds"], []);
    },
    getPlayerBankCards(playerId) {
      return pi._mapCardIdsToCardList(
        getNestedValue(pi.playerBanks, ["items", playerId, "cardIds"], [])
      );
    },

    getPlayerBankTotal(playerId) {
      return getNestedValue(
        pi.playerBanks,
        ["items", playerId, "totalValue"],
        []
      );
    },

    // CARDS
    cards: storeState.cards,

    _mapCardIdsToCardList: function (cardIds) {
      if (isArr(cardIds)) return cardIds.map((cardId) => pi.getCard(cardId));
      return [];
    },
    _mapCardIdsToCardObject: function (cardIds) {
      if (isArr(cardIds))
        return cardIds.reduce((result, cardId) => {
          result[cardId] = pi.getCard(cardId);
          return result;
        }, {});
      return {};
    },
    _mergeCardDataIntoObject: function (original) {
      if (isObj(original)) {
        let result = { ...original };
        result.cards = pi._mapCardIdsToCardList(
          getNestedValue(result, "cardIds", [])
        );
        return result;
      }
      return original;
    },
    getPropertySetKeysForCard: function (cardOrId) {
      let card = pi.getCard(cardOrId);
      return getNestedValue(card, "sets", []);
    },
    doesCardHaveTag(cardOrId, tag) {
      let card = pi.getCard(cardOrId);
      return isArr(card.tags) ? card.tags.includes(tag) : false;
    },

    getCard(cardOrId) {
      let cardId = getKeyFromProp(cardOrId, "id");
      return gameBuffer.get(["cards", "items", cardId], null);
    },
    getTotalCardCount() {
      return gameBuffer.get(["cards", "order"], []).length;
    },

    isCardSetAugment(cardOrId) {
      let cardId = getKeyFromProp(cardOrId, "id");
      let card = pi.getCard(cardId);
      return card.type === "action" && card.class === "setAugment";
    },

    isCardProperty(cardOrId) {
      let cardId = getKeyFromProp(cardOrId, "id");
      let card = pi.getCard(cardId);
      return card.type === "property";
    },

    canAddCardToBank(cardOrId) {
      let card = pi.getCard(cardOrId);
      return card.type === "cash" || card.type === "action";
    },

    // CURRENT TURN
    playerTurn: storeState.playerTurn,
    getCurrentTurnPersonId() {
      return gameBuffer.get(["playerTurn", "playerKey"], 0);
    },
    isMyTurn() {
      return pi.getCurrentTurnPersonId() === pi.getMyId();
    },
    getCurrentTurnActionCount() {
      return gameBuffer.get(["playerTurn", "actionCount"], 0);
    },
    getCurrentTurnActionLimit() {
      return gameBuffer.get(["playerTurn", "actionLimit"], 0);
    },
    getCurrentTurnActionsRemaining() {
      return pi.getCurrentTurnActionLimit() - pi.getCurrentTurnActionCount();
    },
    getCurrentTurnPhase() {
      return gameBuffer.get(["playerTurn", "phase"], null);
    },
    getPeviousTurnPhase() {
      return gameBuffer.get(["playerTurnPrevious", "phase"], null);
    },
    getPeviousTurnPersonId() {
      return gameBuffer.get(["playerTurnPrevious", "playerKey"], null);
    },
    isDrawPhase() {
      return gameBuffer.get(["playerTurn", "phase"], null) === "draw";
    },
    isDiscardPhase() {
      return gameBuffer.get(["playerTurn", "phase"], null) === "discard";
    },
    isDonePhase() {
      return gameBuffer.get(["playerTurn", "phase"], null) === "done";
    },
    isActionPhase() {
      return gameBuffer.get(["playerTurn", "phase"], null) === "action";
    },
    getTotalCountToDiscard() {
      return gameBuffer.get(
        ["playerTurn", "phaseData", "remainingCountToDiscard"],
        0
      );
    },

    // GAME STATUS
    gameStatus: storeState.gameStatus,
    winningPlayerId: storeState.winningPlayerId,
    drawPile: storeState.drawPile,
    activePile: storeState.activePile,
    discardPile: storeState.discardPile,

    getActivePile() {
      let activePile = gameBuffer.get("activePile", {
        count: 0,
        totalValue: 0,
        cardIds: [],
      });
      return pi._mergeCardDataIntoObject(activePile);
    },
    getTopCardOnActionPile() {
      let activePile = pi.getActivePile();
      if (isDef(activePile)) {
        let numCards = activePile.cards.length;
        if (numCards > 0) {
          return activePile.cards[numCards - 1];
        }
      }
      return null;
    },
    getActivePileCount() {
      return gameBuffer.get(["activePile", "count"], 0);
    },

    getDrawPile() {
      return gameBuffer.get("drawPile", { count: 0 });
    },
    getDrawPileCount() {
      return gameBuffer.get(["drawPile", "count"], 0);
    },

    getDiscardPile() {
      let discardPile = gameBuffer.get("discardPile", {
        count: 0,
        totalValue: 0,
        cardIds: [],
      });
      return pi._mergeCardDataIntoObject(discardPile);
    },
    getDiscardPileCount() {
      return gameBuffer.get(["discardPile", "count"], 0);
    },

    getTopCardOnDiscardPile() {
      let discardPile = pi.getDiscardPile();
      if (isDef(discardPile) && discardPile.count > 0)
        return discardPile.cards[discardPile.count - 1];
      return null;
    },

    previousRequests: storeState.previousRequests,
    requests: storeState.requests,
    playerRequests: storeState.playerRequests,

    getRequestIdsForPlayer(playerId) {
      gameBuffer.get(["playerRequests", "items", playerId], []);
    },

    getDisplayMode(fallback = null) {
      return gameBuffer.get(["displayMode"], fallback);
    },

    getActionData(path = [], fallback = null) {
      let _path = isArr(path) ? path : [path];
      return gameBuffer.get(["actionData", ..._path], fallback);
    },

    getDisplayData(path = [], fallback = null) {
      let _path = isArr(path) ? path : [path];
      return gameBuffer.get(["displayData", ..._path], fallback);
    },

    getRequest(requestId, fallback = null) {
      return gameBuffer.get(["requests", "items", requestId], fallback);
    },

    getRequestsKeyed() {
      return gameBuffer.get(["requests", "items"], {});
    },
    getRequestNestedValue(requestId, path = [], fallback = null) {
      return gameBuffer.get(
        ["requests", "items", requestId, ...path],
        fallback
      );
    },

    cardSelection_getMeta(path, fallback = null) {
      let _path = isArr(path) ? path : [path];
      return gameBuffer.get(["cardSelect", ..._path], fallback);
    },
    cardSelection_getAll() {
      return gameBuffer.get(["cardSelect"], null);
    },
    cardSelection_getEnable() {
      return gameBuffer.get(["cardSelect", "enable"], false);
    },
    cardSelection_getType() {
      return gameBuffer.get(["cardSelect", "type"], "add");
    },
    cardSelection_getLimit() {
      return gameBuffer.get(["cardSelect", "limit"], 0);
    },
    cardSelection_getSelectable() {
      return gameBuffer.get(["cardSelect", "selectable"], []);
    },
    cardSelection_hasSelectableValue(value) {
      return pi.cardSelection_getSelectable().includes(value);
    },
    cardSelection_getSelected() {
      return gameBuffer.get(["cardSelect", "selected"], []);
    },
    cardSelection_hasSelectedValue(value) {
      return pi.cardSelection_getSelected().includes(value);
    },
    cardSelection_canSelectMoreValues() {
      return (
        pi.cardSelection_getLimit() - pi.cardSelection_getSelected().length > 0
      );
    },

    collectionSelection_getAll() {
      return gameBuffer.get(["collectionSelect"], null);
    },
    collectionSelection_getEnable() {
      return gameBuffer.get(["collectionSelect", "enable"], false);
    },
    collectionSelection_getType() {
      return gameBuffer.get(["collectionSelect", "type"], "add");
    },
    collectionSelection_getLimit() {
      return gameBuffer.get(["collectionSelect", "limit"], 0);
    },
    collectionSelection_getSelectable() {
      return gameBuffer.get(["collectionSelect", "selectable"], []);
    },
    collectionSelection_hasSelectableValue(value) {
      return pi.collectionSelection_getSelectable().includes(value);
    },
    collectionSelection_getSelected() {
      return gameBuffer.get(["collectionSelect", "selected"], []);
    },
    collectionSelection_hasSelectedValue(value) {
      return pi.collectionSelection_getSelected().includes(value);
    },

    personSelection_getAll() {
      return gameBuffer.get(["personSelect"], null);
    },
    personSelection_getEnable() {
      return gameBuffer.get(["personSelect", "enable"], false);
    },
    personSelection_getType() {
      return gameBuffer.get(["personSelect", "type"], "add");
    },
    personSelection_getLimit() {
      return gameBuffer.get(["personSelect", "limit"], 0);
    },
    personSelection_getSelectable() {
      return gameBuffer.get(["personSelect", "selectable"], []);
    },
    personSelection_hasSelectableValue(value) {
      return pi.personSelection_getSelectable().includes(value);
    },
    personSelection_getSelected() {
      return gameBuffer.get(["personSelect", "selected"], []);
    },
    personSelection_hasSelectedValue(value) {
      return pi.personSelection_getSelected().includes(value);
    },
    personSelection_canSelectMoreValues() {
      return (
        pi.personSelection_getLimit() -
          pi.personSelection_getSelected().length >
        0
      );
    },
  };

  return pi;
};

export default makeGetters;
