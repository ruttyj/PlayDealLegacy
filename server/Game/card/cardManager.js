const deckTemplate = require("./deckTemplate_testDeck");
const {
  els,
  isDef,
  isArr,
  makeList,
  getKeyFromProp,
  makeMap,
} = require("../utils.js");
const {
  AMBIGUOUS_SET_KEY,
} = require("../config/constants.js");

function CardManager() {

  // Instance varaibles
  let mState;
  let mPropertySetMap;
  let mCardOrder;
  let mCardMap;


  // CARD RELATED

  function generateCards() {
    mCardMap.clear();
    mCardOrder.clear();
    mPropertySetMap.clear();

    let topCardId = 0;
    const instructions = deckTemplate;

    function makeCashCard(value) {
      return {
        id: ++topCardId,
        type: "cash",
        key: `CASH_${value}`,
        tags: ["bankable"],
        value: parseFloat(value),
      };
    }

    function makeActionCard(data) {
      let canBePrevented = data.canBePrevented || false;
      let set = data.set || null;
      let sets = isArr(data.sets) ? data.sets : [];
      if (isDef(set) && !sets.includes(set)) {
        sets.push(set);
      }
      let value = data.value || 0;
      let target = data.target || "self";
      let tags = data.tags || [];
      let action = els(data.action, {});

      const state = {
        id: ++topCardId,
        key: data.key || null,
        type: "action",
        class: data.class,
        value: parseFloat(value),
        name: data.name,
        target: target,
        canBePrevented: canBePrevented,
        setAugment: data.setAugment,
        actionAugment: data.actionAugment,
        action: {
          ...action,
          // duplikcated data @TEMP
          augment: data.actionAugment,
        },
        drawCards: data.drawCards,
        tags,
        set,
        sets,
      };

      return state;
    }

    function makePropertyCard(data) {
      let value = data.value || 1;
      let tags = data.tags || [];
      return {
        id: ++topCardId,
        key: data.key || null,
        type: "property",
        class: "concreteProperty",
        value: parseFloat(value),
        name: data.name,
        tags: tags,
        set: data.set,
      };
    }

    function makeWildCard(data) {
      let value = data.value || 0;
      let tags = data.tags || [];

      let sets = data.sets;
      let set = data.set || sets[0];
      if (data.class === "wildPropertyAll") {
        set = AMBIGUOUS_SET_KEY;
        sets = [...data.sets, AMBIGUOUS_SET_KEY];
      }

      return {
        id: ++topCardId,
        key: data.key || null,
        type: "property",
        class: data.class,
        value: parseFloat(value),
        name: data.name,
        tags: tags,
        set,
        sets,
      };
    }

    function makePropertySet(data) {
      return {
        ...data,
      };
    }

    // Cash cards
    if (1) {
      Object.keys(instructions.cash).forEach((key) => {
        let details = instructions.cash[key];
        let value = parseInt(details.value, 10);
        let count = instructions.cardCounts[key];
        for (let i = 0; i < count; ++i) {
          let card = makeCashCard(value);
          mCardMap.set(card.id, card);
          mCardOrder.push(card.id);
        }
      });
    }

    // Action Cards
    if (1) {
      let actionCardKeys = Object.keys(instructions.action);
      actionCardKeys.forEach((key) => {
        let details = instructions.action[key];
        if (details.class !== "setAugment") {
          let count = instructions.cardCounts[details.key];
          for (let i = 0; i < count; ++i) {
            let card = makeActionCard(details);
            mCardMap.set(card.id, card);
            mCardOrder.push(card.id);
          }
        }
      });
    }

    // Wild Properties
    if (1) {
      let wildCardKeys = Object.keys(instructions.wild);
      wildCardKeys.forEach((key) => {
        let details = instructions.wild[key];
        let count = instructions.cardCounts[details.key];
        for (let i = 0; i < count; ++i) {
          let card = makeWildCard(details);
          mCardMap.set(card.id, card);
          mCardOrder.push(card.id);
        }
      });
    }

    // Properties
    if (1) {
      let sets = Object.keys(instructions.properties);
      sets.forEach((color) => {
        let propertySet = instructions.properties[color];

        mPropertySetMap.set(
          color,
          makePropertySet({
            key: color,
            name: color,
            colorCode: propertySet.colorCode,
            size: propertySet.cards.length,
            rent: { ...propertySet.rent },
            tags: propertySet.tags,
          })
        );

        propertySet.cards.forEach((property) => {
          let card = makePropertyCard({
            ...property,
            tags: propertySet.tags,
            set: color,
          });
          mCardMap.set(card.id, card);
          mCardOrder.push(card.id);
        });
      });
    }

    // Action Cards
    if (1) {
      let actionCardKeys = Object.keys(instructions.action);
      actionCardKeys.forEach((key) => {
        let details = instructions.action[key];
        if (details.class === "setAugment") {
          let count = instructions.cardCounts[details.key];
          for (let i = 0; i < count; ++i) {
            let card = makeActionCard(details);
            mCardMap.set(card.id, card);
            mCardOrder.push(card.id);
          }
        }
      });
    }
  }

  function hasCard(cardOrId) {
    let cardId = getKeyFromProp(cardOrId, "id");
    return mCardMap.has(cardId);
  }

  function getCard(cardOrId) {
    let cardId = getKeyFromProp(cardOrId, "id");
    return mCardMap.get(cardId, null);
  }

  function getAllCards() {
    return mCardOrder.map((cardId) => getCard(cardId));
  }

  function getAllCardsKeyed() {
    let result = {};
    mCardOrder.forEach((cardId) => {
      result[cardId] = getCard(cardId);
    });
    return result;
  }

  function getAllCardIds() {
    return mCardOrder.getAll();
  }

  function setCardActivePropertySet(cardOrId, chosenPropSet) {
    let card = getCard(cardOrId);
    let propertySetChoices = getPropertySetChoicesForCard(card.id);
    if (isDef(card) && propertySetChoices.includes(chosenPropSet)) {
      card.set = chosenPropSet;
      mCardMap.set(card.id, card);
      return true;
    }
    return false;
  }

  function getPropertySetChoicesForCard(cardOrId) {
    let card = getCard(cardOrId);
    if (isDef(card)) {
      if (isArr(card.sets)) {
        return [...card.sets];
      } else if (isDef(card.set)) {
        return [card.set];
      }
    }
    return [];
  }

  // PROPERTY SETS

  function getAllPropertySets() {
    return mPropertySetMap.map((v) => v);
  }

  function getAllPropertySetsKeyed() {
    let result = {};
    mPropertySetMap.forEach((v, k) => (result[k] = v));
    return result;
  }

  function getAllPropertySetKeys() {
    return mPropertySetMap.map((v, k) => k);
  }

  function getPropertySet(propSetOrKey) {
    let propSetKey = getKeyFromProp(propSetOrKey, "id");
    return mPropertySetMap.get(propSetKey, null);
  }

  // MANAGER RELATED

  function reset() {
    mState          = {};
    mPropertySetMap = makeMap(mState, "propertySetMap");
    mCardOrder      = makeList(mState, "cardOrder");
    mCardMap        = makeMap(mState, "cardMap");
  }

  function serialize() {
    return {
      propertySets: {
        order: mPropertySetMap.keys(),
        items: mPropertySetMap.getKeyed(),
      },
      cards: {
        order: mCardOrder.toArray(),
        items: mCardMap.getKeyed(),
      }
    };
  }

  function unserialize(data) {
    reset();
    // Load property sets
    data.propertySets.order.forEach(propertySetKey => {
      mPropertySetMap.set(propertySetKey, data.propertySets.items[propertySetKey]);
    });

    // Load cards
    data.cards.order.forEach(propertySetKey => {
      mCardOrder.push(propertySetKey);
      mCardMap.set(propertySetKey, data.cards.items[propertySetKey]);
    });
  }

  function getPublic() {
    return {
      generateCards,
      hasCard,
      getCard,
      getAllCards,
      getAllCardIds,
      getAllCardsKeyed,
      setCardActivePropertySet,
      getAllPropertySetsKeyed,
      getPropertySetChoicesForCard,
      getPropertySet,
      getAllPropertySets,
      getAllPropertySetKeys,
  
      allCards: mCardMap.toArray,
      cardCount: mCardMap.count,
      findCard: mCardMap.find,
      mapCards: mCardMap.map,
      forEachCard: mCardMap.forEach,
      filterCards: mCardMap.filter,
      filterCardsKeyed: mCardMap.filterKeyed,
  
      reset, 
      serialize,
      unserialize,
    };
  }

  reset();
  return getPublic();
}

module.exports = CardManager;
