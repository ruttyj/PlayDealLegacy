module.exports = function buildCardContainer({
  isDef,
  isArr,
  makeVar,
  makeList,
  getKeyFromProp,
  reduceArrayToMap,
  constants
}) {
  const utils = {
    sort: function (arr, order = "asc", propertyRetriever = (v) => v) {
      let c = String(order).toLowerCase() === "asc" ? 1 : -1;
      arr.sort((a, b) => {
        var valueA = propertyRetriever(a);
        var valueB = propertyRetriever(b);
  
        if (valueA < valueB) {
          return -1 * c;
        } else if (valueA > valueB) {
          return 1 * c;
        } else {
          return 0;
        }
      });
    },
    randomRange: function (min, max) {
      return Math.floor(Math.random() * max - min) + min;
    },
    findIndexOfCardById: function (arr, cardId) {
      return arr.findIndex((card) => card.id === cardId);
    },
    removeCardByIndex: function (arr, index) {
      arr.splice(index, 1);
    },
    giveCardByIdFromArray: function (arr, cardId) {
      const index = utils.findIndexOfCardById(arr, cardId);
      if (index > -1) {
        let card = arr[index];
        utils.removeCardByIndex(arr, index);
        return card;
      }
      return null;
    },
  };
  ;
  const CardContainer = function (gameRef) {
    let mState;
    let mGameRef;
    let incTotalValue;
    let decTotalValue;
    let getTotalValue;
    let mCardOrder;

    reset();

    function reset(){
      mState = {};
      mGameRef = gameRef;
      mCardOrder = makeList(mState, "cardOrder", []);
      totalValue = makeVar(mState, "totalValue", 0);
      incTotalValue = totalValue.inc;
      decTotalValue = totalValue.dec;
      getTotalValue = totalValue.get;
    }


    function _shuffleCards(cards) {
      let temp = [...cards];

      let doShuffle = (temp) => {
        let lastIndex, selectedIndex;
        lastIndex = temp.length - 1;
        while (lastIndex > 0) {
          selectedIndex = utils.randomRange(0, lastIndex);
          [temp[lastIndex], temp[selectedIndex]] = [
            temp[selectedIndex],
            temp[lastIndex],
          ];
          --lastIndex;
        }
      };
      doShuffle(temp);
      doShuffle(temp);

      return temp;
    }

    function shuffle() {
      let cards = getAllCards();
      replaceAllCards(_shuffleCards(cards));
    }

    function addCard(cardOrId) {
      let cardId = parseInt(getKeyFromProp(cardOrId, "id"), 10);
      let card = mGameRef.getCard(cardOrId);
      if (isDef(card) && isDef(card.value)) {
        mCardOrder.push(cardId);
        incTotalValue(card.value);
      }
    }

    function addCards(cardOrCards) {
      if (isArr(cardOrCards))
        cardOrCards.forEach((card) => {
          addCard(card);
        });
      else addCard(cardOrCards);
    }

    function getCard(cardOrId) {
      let cardId = getKeyFromProp(cardOrId, "id");
      if (hasCard(cardId)) return mGameRef.getCard(cardId);
      return null;
    }

    function getAllCards() {
      let result = [];
      getAllCardIds().forEach((cardId) => {
        let card = getCard(cardId);
        if (isDef(card)) result.push(card);
      });
      return result;
    }

    function getCards(cardIds = null) {
      let shouldReturnAll = !isDef(cardIds);

      let result = [];
      if (shouldReturnAll) {
        return getAllCardIds();
      } else if (isArr(cardIds)) {
        let lookup = reduceArrayToMap(cardIds);
        mCardOrder.forEach((cardId) => {
          if (isDef(lookup[cardId])) {
            let card = getCard(cardId);
            if (isDef(card)) result.push(card);
          }
        });
      }
      return result;
    }

    function getAllCardIds() {
      return mCardOrder.map((v) => v);
    }

    function hasCard(cardOrId) {
      let cardId = getKeyFromProp(cardOrId, "id");
      return isDef(mCardOrder.find((cid) => String(cid) === String(cardId)));
    }

    // returns a card if exists but does not remove
    function getCardById(cardId) {
      // return card else null
      return findCard((card) => String(card.id) === String(cardId));
    }

    function giveCardsById(arrCardId) {
      return arrCardId.map((cardId) => giveCardById(cardId));
    }

    function removeCard(cardOrId) {
      let cardId = getKeyFromProp(cardOrId, "id");
      let card = getCard(cardId);
      if (isDef(card.value)) decTotalValue(card.value);
      mCardOrder.removeByValue(cardId);
    }

    // returns and removed form card list
    function giveCardById(cardId) {
      let card = getCardById(cardId);
      if (isDef(card)) {
        removeCard(card);
        return card;
      }
      return null;
    }

    function giveCard(cardOrId) {
      let cardId = getKeyFromProp(cardOrId, "id");
      return giveCardById(cardId);
    }

    function giveCards(cardsOrIds) {
      return cardsOrIds.map((cardOrId) => {
        let cardId = getKeyFromProp(cardOrId, "id");
        return giveCard(cardId);
      });
    }

    function replaceAllCards(newCards) {
      giveCards(getAllCards());
      addCards(newCards);
    }

    function getBottomCards(num) {
      let result = [];
      let stopIndex = num - 1;
      if (num > 0) {
        for (let i = 0; i <= stopIndex; ++i) {
          let cardId = mCardOrder.get(i);
          let card = getCard(cardId);
          if (isDef(card)) {
            result.push(card);
          }
        }
      }
      return result;
    }

    function getTopCards(num) {
      let result = [];
      let lastIndex = mCardOrder.count() - 1;
      if (lastIndex > -1) {
        for (let i = lastIndex - num + 1; i <= lastIndex; ++i) {
          let cardId = mCardOrder.get(i);
          let card = getCard(cardId);
          if (isDef(card)) {
            result.push(card);
          }
        }
      }
      return result;
    }

    function getTopCard() {
      let topCards = getTopCards(1);
      if (topCards.length > 0) {
        return topCards[0];
      }
      return null;
    }

    function pop() {
      let card = getTopCard();
      return giveCard(card);
    }

    function serialize() {
      let result = {
        totalValue: getTotalValue(),
        count: mCardOrder.count(),
        cardIds: [...mCardOrder.getAll()],
      };

      if (constants.INCLUDE_DEBUG_DATA) {
        result.cards = [...getAllCards()];
      }

      return result;
    }

    function unserialize(data) {
      if (isDef(data.cardIds)){
        addCards(data.cardIds)
      }
    }

    function findCard(fn) {
      let selfRef = getPublic();
      let result = null;
      mCardOrder.forEach((cardId) => {
        if (!isDef(result)) {
          let card = getCard(cardId);
          if (isDef(card) && fn(card, cardId, selfRef)) {
            result = card;
          }
        }
      });

      return result;
    }

    const publicScope = {
      getCards,
      getAllCards,
      getAllCardIds,

      getTotalValue,
      getCount: mCardOrder.count,
      count: mCardOrder.count,

      shuffle,

      pop,

      addCard,
      addCards,
      hasCard,
      removeCard,
      findCard,
      find: findCard,
      getCard,
      getCardById,
      getTopCard,
      getTopCards,
      getBottomCards,
      giveCardById,
      giveCard,
      giveCards,
      giveCardsById,

      replaceAllCards,

      reset,
      serialize,
      unserialize,
    };

    function getPublic() {
      return { ...publicScope };
    }

    return getPublic();
  };

  return CardContainer
}