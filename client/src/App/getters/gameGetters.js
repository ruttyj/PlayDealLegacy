import {
  isDef,
  isStr,
  isArr,
  isObj,
  getNestedValue,
  getKeyFromProp,
} from "../../utils/";
import ReduxState from "../controllers/reduxState";
const reduxState = ReduxState.getInstance();

const makeGetters = (state) => {
  const publicScope = {};
  Object.assign(publicScope, {
    getCustomUi(path = [], fallback = null) {
      const _path = isArr(path) ? path : [path];
      return reduxState.get(["game", "uiCustomize", ..._path], fallback);
    },

    // PROPERTY SETS
    getPropertySetsData() {
      return reduxState.get(["game", "propertySets"], {});
    },
    getPropertySetMap() {
      return reduxState.get(["game", "propertySets", "items"], {});
    },

    // COLLECTIONS
    getPlayerCollectionsData() {
      return reduxState.get(["game", "playerCollections"], {});
    },

    getCollectionData() {
      return reduxState.get(["game", "collections"], {});
    },

    getCollectionIdsForPlayer(playerId) {
      return reduxState.get(
        ["game", "playerCollections", "items", playerId],
        []
      );
    },

    getCollection(collectionId) {
      let collection = reduxState.get(
        ["game", "collections", "items", collectionId],
        {}
      );
      let result = { ...collection };
      let collectionCardIds = getNestedValue(result, "cardIds", []);
      result.cards = publicScope._mapCardIdsToCardObject(collectionCardIds);
      return result;
    },

    getIsCollectionFull(collectionId) {
      let collection = publicScope.getCollection(collectionId);
      return getNestedValue(collection, "isFullSet", false);
    },
    getCollections(myCollectionIds) {
      let result = [];
      myCollectionIds.forEach((collectionId) => {
        let collection = publicScope.getCollection(collectionId);
        if (isDef(collection)) result.push(collection);
      });
      return result;
    },

    getCollectionIdsMatchingSets(playerId, propertySetKeys) {
      let result = [];
      let myCollectionIds = publicScope.getCollectionIdsForPlayer(playerId);
      myCollectionIds.forEach((collectionId) => {
        let collection = publicScope.getCollection(collectionId);
        if (propertySetKeys.includes(collection.propertySetKey)) {
          result.push(collectionId);
        }
      });
      return result;
    },

    getIncompleteCollectionMatchingSet(playerId, propertySetKey) {
      let myCollectionIds = publicScope.getCollectionIdsForPlayer(playerId);

      for (
        let collectionIndex = 0;
        collectionIndex < myCollectionIds.length;
        ++collectionIndex
      ) {
        let collectionId = myCollectionIds[collectionIndex];
        let collection = publicScope.getCollection(collectionId);
        if (
          !collection.isFullSet &&
          collection.propertySetKey === propertySetKey
        ) {
          return collectionId;
        }
      }
      return null;
    },

    getCollectionMatchingSet(playerId, propertySetKey) {
      let myCollectionIds = publicScope.getCollectionIdsForPlayer(playerId);

      for (
        let collectionIndex = 0;
        collectionIndex < myCollectionIds.length;
        ++collectionIndex
      ) {
        let collectionId = myCollectionIds[collectionIndex];

        let collectionCards = publicScope.getCollectionCards(collectionId);
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
      let collectionCardIds = reduxState.get(
        ["game", "collections", "items", collectionId, "cardIds"],
        []
      );
      return publicScope._mapCardIdsToCardList(collectionCardIds);
    },

    getCollectionCardIds(collectionId) {
      return reduxState.get(
        ["game", "collections", "items", collectionId, "cardIds"],
        []
      );
    },

    // ROOM
    getRoomCode(fallback = null) {
      return reduxState.get(["rooms", "currentRoom", "code"], fallback);
    },
    getCurrentRoom() {
      return reduxState.get(["rooms", "currentRoom"], null);
    },

    // PEOPLE
    getAllPlayersData() {
      return reduxState.get(["game", "players"], {});
    },

    getHostId() {
      return reduxState.get(["people", "host"], null);
    },

    isHost(personId = null) {
      if (!isDef(personId)) personId = publicScope.getMyId();
      let hostId = publicScope.getHostId();
      return isDef(hostId) && String(hostId) === String(personId);
    },

    amIHost() {
      return publicScope.isMyId(publicScope.getHostId());
    },

    getMyId() {
      return reduxState.get(["people", "myId"], null);
    },

    isMyId(personId = null) {
      let myId = publicScope.getMyId();
      if (!isDef(personId)) return false;
      return isDef(myId) && String(myId) === String(personId);
    },

    getPerson(personId) {
      let path = ["people", "items", personId];
      return reduxState.get(path, null);
    },

    getPersonStatus(personId = null) {
      if (!isDef(personId)) personId = publicScope.getMyId();

      let person = publicScope.getPerson(personId);
      if (isDef(person)) return person.status;
      return null;
    },

    isPersonReady(personId = null) {
      if (!isDef(personId)) personId = publicScope.getMyId();
      let status = publicScope.getPersonStatus(personId);
      return status === "ready";
    },

    isAllPlayersReady() {
      let readyCount = 0;
      let path = ["people", "order"];
      let personOrder = reduxState.get(path, []);
      let personCount = personOrder.length;
      personOrder.forEach((personId) => {
        let person = publicScope.getPerson(personId);
        if (person.status === "ready") {
          ++readyCount;
        }
      });
      return readyCount === personCount;
    },

    getAllPeopleData() {
      return reduxState.get(["people"], {});
    },
    getPersonOrder() {
      return reduxState.get(["people", "order"], []);
    },

    getAllPeopleList() {
      let result = [];
      let personOrder = reduxState.get(["people", "order"], []);

      personOrder.foreach((personId) => {
        let person = reduxState.get(["people", "items", personId], null);
        if (isDef(person)) result.push(person);
      });
      return result;
    },

    getAllPlayerIds() {
      return reduxState.get(["game", "players", "order"], []);
    },

    // People in game
    getAllPlayers() {
      let playerOrder = publicScope.getAllPlayerIds();
      return playerOrder.map((...props) => publicScope.getPerson(...props));
    },

    getAllOpponentIds() {
      let myId = publicScope.getMyId();
      return publicScope
        .getAllPlayerIds()
        .filter((id) => String(id) !== String(myId));
    },

    // PLAYER HAND
    getAllPlayerHandsData() {
      return reduxState.get(["game", "playerHands"], {});
    },

    getMyHandCardIds() {
      return reduxState.get(
        ["game", "playerHands", "items", publicScope.getMyId(), "cardIds"],
        []
      );
    },
    getPlayerHand(playerId) {
      let playerHand = reduxState.get(
        ["game", "playerHands", "items", playerId],
        {}
      );
      return publicScope._mergeCardDataIntoObject(playerHand);
    },
    getMyHand() {
      return publicScope.getPlayerHand(publicScope.getMyId());
    },

    //gameConstants
    getMyCardIdsWithTags(mxd) {
      let tags = isArr(mxd) ? mxd : [mxd];
      let myHand = publicScope.getMyHand();
      let result = [];
      let cardIds = myHand.cardIds;
      if (isArr(cardIds)) {
        cardIds.forEach((cardId) => {
          for (let i = 0; i < tags.length; ++i) {
            if (publicScope.doesCardHaveTag(cardId, tags[i])) {
              result.push(cardId);
              break;
            }
          }
        });
      }
      return result;
    },

    getMyCardIdsWithTag(tag) {
      let myHand = publicScope.getMyHand();
      let result = [];
      let cardIds = myHand.cardIds;
      if (isArr(cardIds)) {
        cardIds.forEach((cardId) => {
          if (publicScope.doesCardHaveTag(cardId, tag)) {
            result.push(cardId);
          }
        });
      }
      //rentAugment
      return result;
    },

    // PLAYER BANK
    getAllPlayerBanksData() {
      return reduxState.get(["game", "playerBanks"], {});
    },
    getMyBankCardIds() {
      return getNestedValue(
        publicScope.getAllPlayerBanksData(),
        ["items", publicScope.getMyId(), "cardIds"],
        []
      );
    },
    getPlayerBankCardIds(playerId) {
      return getNestedValue(
        publicScope.getAllPlayerBanksData(),
        ["items", playerId, "cardIds"],
        []
      );
    },
    getPlayerBankCards(playerId) {
      return publicScope._mapCardIdsToCardList(
        getNestedValue(
          publicScope.getAllPlayerBanksData(),
          ["items", playerId, "cardIds"],
          []
        )
      );
    },

    getPlayerBankTotal(playerId) {
      return getNestedValue(
        publicScope.getAllPlayerBanksData(),
        ["items", playerId, "totalValue"],
        []
      );
    },

    // CARDS

    getAllCardsData() {
      return reduxState.get(["game", "cards"], {});
    },

    _mapCardIdsToCardList: function(cardIds) {
      if (isArr(cardIds))
        return cardIds.map((cardId) => publicScope.getCard(cardId));
      return [];
    },
    _mapCardIdsToCardObject: function(cardIds) {
      if (isArr(cardIds))
        return cardIds.reduce((result, cardId) => {
          result[cardId] = publicScope.getCard(cardId);
          return result;
        }, {});
      return {};
    },
    _mergeCardDataIntoObject: function(original) {
      if (isObj(original)) {
        let result = { ...original };
        result.cards = publicScope._mapCardIdsToCardList(
          getNestedValue(result, "cardIds", [])
        );
        return result;
      }
      return original;
    },
    getPropertySetKeysForCard: function(cardOrId) {
      let card = publicScope.getCard(cardOrId);
      return getNestedValue(card, "sets", []);
    },
    doesCardHaveTag(cardOrId, tag) {
      let card = publicScope.getCard(cardOrId);
      return isArr(card.tags) ? card.tags.includes(tag) : false;
    },

    getCard(cardOrId) {
      let cardId = getKeyFromProp(cardOrId, "id");
      return reduxState.get(["game", "cards", "items", cardId], null);
    },
    getTotalCardCount() {
      return reduxState.get(["game", "cards", "order"], []).length;
    },

    isCardSetAugment(cardOrId) {
      let cardId = getKeyFromProp(cardOrId, "id");
      let card = publicScope.getCard(cardId);
      return card.type === "action" && card.class === "setAugment";
    },

    isCardProperty(cardOrId) {
      let cardId = getKeyFromProp(cardOrId, "id");
      let card = publicScope.getCard(cardId);
      return card.type === "property";
    },

    canAddCardToBank(cardOrId) {
      let card = publicScope.getCard(cardOrId);
      return card.type === "cash" || card.type === "action";
    },

    // CURRENT TURN
    getPlayerTurnData() {
      return reduxState.get(["game", "playerTurn"], {});
    },
    getCurrentTurnPersonId() {
      return reduxState.get(["game", "playerTurn", "playerKey"], 0);
    },
    isMyTurn() {
      return publicScope.getCurrentTurnPersonId() === publicScope.getMyId();
    },
    getCurrentTurnActionCount() {
      return reduxState.get(["game", "playerTurn", "actionCount"], 0);
    },
    getCurrentTurnActionLimit() {
      return reduxState.get(["game", "playerTurn", "actionLimit"], 0);
    },
    getCurrentTurnActionsRemaining() {
      return (
        publicScope.getCurrentTurnActionLimit() -
        publicScope.getCurrentTurnActionCount()
      );
    },
    getCurrentTurnPhase() {
      return reduxState.get(["game", "playerTurn", "phase"], null);
    },
    getPeviousTurnPhase() {
      return reduxState.get(["game", "playerTurnPrevious", "phase"], null);
    },
    getPeviousTurnPersonId() {
      return reduxState.get(["game", "playerTurnPrevious", "playerKey"], null);
    },
    isDrawPhase() {
      return reduxState.get(["game", "playerTurn", "phase"], null) === "draw";
    },
    isDiscardPhase() {
      return (
        reduxState.get(["game", "playerTurn", "phase"], null) === "discard"
      );
    },
    isDonePhase() {
      return reduxState.get(["game", "playerTurn", "phase"], null) === "done";
    },
    isActionPhase() {
      return reduxState.get(["game", "playerTurn", "phase"], null) === "action";
    },
    getTotalCountToDiscard() {
      console.log(
        "getTotalCountToDiscard",
        reduxState.get(["game", "playerTurn", "phaseData"], null)
      );
      return reduxState.get(
        ["game", "playerTurn", "phaseData", "remainingCountToDiscard"],
        0
      );
    },

    // GAME STATUS
    getGameStatusData() {
      return reduxState.get(["game", "gameStatus"], {});
    },
    getWinningPlayerId() {
      return reduxState.get(["game", "winningPlayerId"], null);
    },

    getActivePile() {
      let activePile = reduxState.get(["game", "activePile"], {
        count: 0,
        totalValue: 0,
        cardIds: [],
      });
      return publicScope._mergeCardDataIntoObject(activePile);
    },
    getTopCardOnActionPile() {
      let activePile = publicScope.getActivePile();
      if (isDef(activePile)) {
        let numCards = activePile.cards.length;
        if (numCards > 0) {
          return activePile.cards[numCards - 1];
        }
      }
      return null;
    },
    getActivePileCount() {
      return reduxState.get(["game", "activePile", "count"], 0);
    },

    getDrawPile() {
      return reduxState.get(["game", "drawPile"], { count: 0 });
    },
    getDrawPileCount() {
      return reduxState.get(["game", "drawPile", "count"], 0);
    },

    getDiscardPile() {
      let discardPile = reduxState.get(["game", "discardPile"], {
        count: 0,
        totalValue: 0,
        cardIds: [],
      });
      return publicScope._mergeCardDataIntoObject(discardPile);
    },
    getDiscardPileCount() {
      return reduxState.get(["game", "discardPile", "count"], 0);
    },

    getTopCardOnDiscardPile() {
      let discardPile = publicScope.getDiscardPile();
      if (isDef(discardPile) && discardPile.count > 0)
        return discardPile.cards[discardPile.count - 1];
      return null;
    },
    getPreviousRequests() {
      return reduxState.get(["game", "previousRequests"], {});
    },
    getAllRequestData() {
      return reduxState.get(["game", "requests"], {});
    },
    getAllPlayerRequestsData() {
      return reduxState.get(["game", "playerRequests"], {});
    },

    getRequestIdsForPlayer(playerId) {
      reduxState.get(["game", "playerRequests", "items", playerId], []);
    },

    getDisplayMode(fallback = null) {
      return reduxState.get(["game", "displayMode"], fallback);
    },

    getActionData(path = [], fallback = null) {
      let _path = isArr(path) ? path : [path];
      return reduxState.get(["game", "actionData", ..._path], fallback);
    },

    getDisplayData(path = [], fallback = null) {
      let _path = isArr(path) ? path : [path];
      return reduxState.get(["game", "displayData", ..._path], fallback);
    },

    getRequest(requestId, fallback = null) {
      return reduxState.get(["game", "requests", "items", requestId], fallback);
    },

    getRequestsKeyed() {
      return reduxState.get(["game", "requests", "items"], {});
    },
    getRequestNestedValue(requestId, path = [], fallback = null) {
      return reduxState.get(
        ["game", "requests", "items", requestId, ...path],
        fallback
      );
    },

    cardSelection_getMeta(path, fallback = null) {
      let _path = isArr(path) ? path : [path];
      return reduxState.get(["game", "cardSelect", ..._path], fallback);
    },
    cardSelection_getAll() {
      return reduxState.get(["game", "cardSelect"], null);
    },
    cardSelection_getEnable() {
      return reduxState.get(["game", "cardSelect", "enable"], false);
    },
    cardSelection_getType() {
      return reduxState.get(["game", "cardSelect", "type"], "add");
    },
    cardSelection_getLimit() {
      return reduxState.get(["game", "cardSelect", "limit"], 0);
    },
    cardSelection_getSelectable() {
      return reduxState.get(["game", "cardSelect", "selectable"], []);
    },
    cardSelection_hasSelectableValue(value) {
      return publicScope.cardSelection_getSelectable().includes(value);
    },
    cardSelection_getSelected() {
      return reduxState.get(["game", "cardSelect", "selected"], []);
    },
    cardSelection_hasSelectedValue(value) {
      return publicScope.cardSelection_getSelected().includes(value);
    },
    cardSelection_canSelectMoreValues() {
      return (
        publicScope.cardSelection_getLimit() -
          publicScope.cardSelection_getSelected().length >
        0
      );
    },

    collectionSelection_getAll() {
      return reduxState.get(["game", "collectionSelect"], null);
    },
    collectionSelection_getEnable() {
      return reduxState.get(["game", "collectionSelect", "enable"], false);
    },
    collectionSelection_getType() {
      return reduxState.get(["game", "collectionSelect", "type"], "add");
    },
    collectionSelection_getLimit() {
      return reduxState.get(["game", "collectionSelect", "limit"], 0);
    },
    collectionSelection_getSelectable() {
      return reduxState.get(["game", "collectionSelect", "selectable"], []);
    },
    collectionSelection_hasSelectableValue(value) {
      return publicScope.collectionSelection_getSelectable().includes(value);
    },
    collectionSelection_getSelected() {
      return reduxState.get(["game", "collectionSelect", "selected"], []);
    },
    collectionSelection_hasSelectedValue(value) {
      return publicScope.collectionSelection_getSelected().includes(value);
    },

    personSelection_getAll() {
      return reduxState.get(["game", "personSelect"], null);
    },
    personSelection_getEnable() {
      return reduxState.get(["game", "personSelect", "enable"], false);
    },
    personSelection_getType() {
      return reduxState.get(["game", "personSelect", "type"], "add");
    },
    personSelection_getLimit() {
      return reduxState.get(["game", "personSelect", "limit"], 0);
    },
    personSelection_getSelectable() {
      return reduxState.get(["game", "personSelect", "selectable"], []);
    },
    personSelection_hasSelectableValue(value) {
      return publicScope.personSelection_getSelectable().includes(value);
    },
    personSelection_getSelected() {
      return reduxState.get(["game", "personSelect", "selected"], []);
    },
    personSelection_hasSelectedValue(value) {
      return publicScope.personSelection_getSelected().includes(value);
    },
    personSelection_canSelectMoreValues() {
      return (
        publicScope.personSelection_getLimit() -
          publicScope.personSelection_getSelected().length >
        0
      );
    },
  });

  return publicScope;
};

export default makeGetters;
