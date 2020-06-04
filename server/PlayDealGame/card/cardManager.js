const {
  els,
  isDef,
  isArr,
  makeList,
  getKeyFromProp,
  makeMap,
  stateSerialize,
} = require("../utils.js");
const {
  AMBIGUOUS_SET_KEY,
  USELESS_PROPERTY_SET_KEY,
} = require("../config/constants.js");

function CardManager() {
  const mState = {};
  const mExcludeKeys = ["gameRef"];

  let mPropertySetMap = makeMap(mState, "propertySetMap");
  let mCardOrder = makeList(mState, "cardOrder");
  let mCardMap = makeMap(mState, "cardMap");

  // CARD RELATED

  function generateCards() {
    mCardMap.clear();
    mCardOrder.clear();
    mPropertySetMap.clear();

    let topCardId = 0;
    const instructions = {
      cash: {
        10: 1,
        5: 2,
        4: 3,
        3: 3,
        2: 5,
        1: 6,
      },
      action: {
        DEAL_BREAKER: {
          name: "Deal breaker",
          key: "DEAL_BREAKER",
          tags: ["request", "stealCollection", "contestable", "bankable"],
          class: "stealCollection",
          target: "one",
          canBePrevented: true,
          count: 2,
          value: 5,
        },
        JUST_SAY_NO: {
          name: "Just say no",
          key: "JUST_SAY_NO",
          class: "justSayNo",
          tags: [
            "justSayNo",
            "declineRequest",
            "request",
            "contestable",
            "bankable",
          ],
          rebuttle: true,
          count: 3,
          value: 4,
        },
        STEAL_PROPERTY: {
          name: "Sly deal",
          key: "STEAL_PROPERTY",
          class: "stealProperty",
          tags: ["request", "stealProperty", "contestable", "bankable"],
          target: "one",
          canBePrevented: true,
          count: 3,
          value: 3,
        },
        SWAP_PROPERTY: {
          name: "Force deal",
          key: "SWAP_PROPERTY",
          class: "swapProperty",
          tags: ["request", "swapProperty", "contestable", "bankable"],
          target: "one",
          canBePrevented: true,
          count: 3,
          value: 3,
        },
        DRAW_CARDS: {
          name: "Draw Cards",
          key: "DRAW_CARDS",
          class: "draw",
          tags: ["draw", "bankable"],
          drawCards: {
            amount: 2,
          },
          count: 10,
          value: 3,
        },
        DEBT_COLLECTOR: {
          name: "Debt collector",
          key: "DEBT_COLLECTOR",
          class: "collection",
          tags: [
            "request",
            "collection",
            "collectValue",
            "debtCollection",
            "contestable",
            "bankable",
          ],
          target: "one",
          action: {
            collectValue: 5,
          },
          canBePrevented: true,
          count: 3,
          value: 3,
        },
        ITS_MY_BIRTHDAY: {
          name: "It's my birthday!",
          key: "ITS_MY_BIRTHDAY",
          class: "collection",
          tags: [
            "request",
            "collection",
            "collectValue",
            "itsMyBirthday",
            "contestable",
            "bankable",
          ],
          target: "all",
          action: {
            collectValue: 2,
          },
          canBePrevented: true,
          count: 3,
          value: 2,
        },
        DOUBLE_THE_RENT: {
          name: "Double the rent",
          key: "DOUBLE_THE_RENT",
          tags: [
            "rentAugment",
            "actionAugment",
            "doubleTheRent",
            "contestable",
            "bankable",
          ],
          class: "rentAugment",
          actionAugment: {
            multiplyValue: 2,
            affects: {
              multiply: 2,
            },
            requires: {
              actionCard: {
                withTags: ["rent"],
                withoutTags: [],
              },
            },
          },
          count: 2,
          value: 1,
        },
        HOUSE: {
          name: "House",
          value: 3,
          count: 3,
          key: "HOUSE",
          tags: ["house", "setAugment", "bankable"],
          class: "setAugment",
          setAugment: {
            is: "house",
            affect: {
              inc: 3,
            },
            requires: {
              fullSet: true,
              withoutTagsInSet: {
                house: 1, // cannot have another house in set
                utility: 1,
                transport: 1,
              },
            },
          },
          set: USELESS_PROPERTY_SET_KEY,
        },
        HOTEL: {
          name: "Hotel",
          key: "HOTEL",
          tags: ["hotel", "setAugment", "bankable"],
          class: "setAugment",
          setAugment: {
            is: "hotel",
            affect: {
              inc: 4,
            },
            requires: {
              fullSet: true,
              withoutTagsInSet: {
                hotel: 1, // cannot have another hotel in set
                utility: 1, // cant be utility or transport
                transport: 1,
              },
              withTagsInSet: {
                house: 1, // requires 1 house in set
              },
            },
          },
          set: USELESS_PROPERTY_SET_KEY,
          value: 4,
          count: 2,
        },
        SUPER_RENT: {
          class: "collection",
          key: "SUPER_RENT",
          tags: ["rent", "request", "contestable", "bankable"],
          name: "Rent",
          canBePrevented: true,
          target: "one",
          value: 3,
          sets: [
            "blue",
            "green",
            "yellow",
            "red",
            "orange",
            "black",
            "purple",
            "cyan",
            "teal",
            "brown",
          ],
          count: 3,
        },
        RENT_BLUE_GREEN: {
          class: "collection",
          key: "RENT_BLUE_GREEN",
          name: "Rent",
          tags: ["rent", "request", "contestable", "bankable"],
          canBePrevented: true,
          target: "all",
          sets: ["blue", "green"],
          value: 4,
          count: 2,
        },
        RENT_ORANGE_PURPLE: {
          class: "collection",
          key: "RENT_ORANGE_PURPLE",
          name: "Rent",
          tags: ["rent", "request", "contestable", "bankable"],
          canBePrevented: true,
          target: "all",
          sets: ["orange", "purple"],
          value: 1,
          count: 2,
        },
        RENT_BLACK_TEAL: {
          class: "collection",
          key: "RENT_BLACK_TEAL",
          name: "Rent",
          tags: ["rent", "request", "contestable", "bankable"],
          canBePrevented: true,
          target: "all",
          sets: ["black", "teal"],
          value: 1,
          count: 2,
        },
        RENT_YELLOW_ORANGE: {
          class: "collection",
          key: "RENT_YELLOW_ORANGE",
          name: "Rent",
          tags: ["rent", "request", "contestable", "bankable"],
          canBePrevented: true,
          target: "all",
          sets: ["yellow", "orange"],
          value: 1,
          count: 2,
        },
        RENT_BROWN_CYAN: {
          class: "collection",
          key: "RENT_BROWN_CYAN",
          name: "Rent",
          tags: ["rent", "request", "contestable", "bankable"],
          canBePrevented: true,
          target: "all",
          sets: ["cyan", "brown"],
          value: 1,
          count: 2,
        },
      },
      properties: {
        blue: {
          cards: [
            {
              name: "Penthouse Suite",
              key: "PROPERTY_BLUE_1",
              value: 4,
            },
            {
              name: "Lake Side",
              key: "PROPERTY_BLUE_2",
              value: 4,
            },
          ],
          tags: ["property"],
          colorCode: "#134bbf",
          rent: {
            "1": 3,
            "2": 8,
          },
        },
        green: {
          cards: [
            {
              name: "National Park",
              key: "PROPERTY_GREEN_1",
              value: 4,
            },
            {
              name: "North of Nowhere",
              key: "PROPERTY_GREEN_2",
              value: 4,
            },
            {
              name: "The Booneys",
              key: "PROPERTY_GREEN_3",
              value: 4,
            },
          ],
          tags: ["property"],
          colorCode: "#049004",
          rent: {
            "1": 2,
            "2": 4,
            "3": 7,
          },
        },
        yellow: {
          cards: [
            {
              name: "Collage Dorms",
              key: "PROPERTY_YELLOW_1",
              value: 3,
            },
            {
              name: "Thrift Shop",
              key: "PROPERTY_YELLOW_2",
              value: 3,
            },
            {
              name: "Friend's Couch",
              key: "PROPERTY_YELLOW_3",
              value: 3,
            },
          ],
          tags: ["property"],
          colorCode: "#e8c700",
          rent: {
            "1": 2,
            "2": 4,
            "3": 6,
          },
        },
        red: {
          cards: [
            {
              name: "KFC",
              key: "PROPERTY_RED_1",
              value: 2,
            },
            {
              name: "McDo",
              key: "PROPERTY_RED_2",
              value: 2,
            },
            {
              name: "Dominoes",
              key: "PROPERTY_RED_3",
              value: 2,
            },
          ],
          tags: ["property"],
          colorCode: "#a50c0c",
          rent: {
            "1": 2,
            "2": 3,
            "3": 6,
          },
        },
        orange: {
          cards: [
            {
              name: "Hill-Billy Hay Stack",
              key: "PROPERTY_ORANGE_1",
              value: 2,
            },
            {
              name: "Trailer Park",
              key: "PROPERTY_ORANGE_2",
              value: 2,
            },
            {
              name: "The local bar",
              key: "PROPERTY_ORANGE_3",
              value: 2,
            },
          ],
          tags: ["property"],
          colorCode: "#ff7100",
          rent: {
            "1": 1,
            "2": 3,
            "3": 5,
          },
        },
        black: {
          cards: [
            {
              name: "Metro",
              key: "PROPERTY_BLACK_1",
              value: 2,
            },
            {
              name: "Zuber",
              key: "PROPERTY_BLACK_2",
              value: 2,
            },
            {
              name: "Taxi",
              key: "PROPERTY_BLACK_3",
              value: 2,
            },
            {
              name: "The Bus",
              key: "PROPERTY_BLACK_4",
              value: 2,
            },
          ],
          tags: ["transport", "property"],
          colorCode: "#555",
          rent: {
            "1": 1,
            "2": 3,
            "3": 3,
            "4": 4,
          },
        },
        purple: {
          cards: [
            {
              name: "Hair Salon",
              key: "PROPERTY_PURPLE_1",
              value: 2,
            },
            {
              name: "Spa",
              key: "PROPERTY_PURPLE_2",
              value: 2,
            },
            {
              name: "Yoga",
              key: "PROPERTY_PURPLE_3",
              value: 2,
            },
          ],
          tags: ["property"],
          colorCode: "#940194",
          rent: {
            "1": 1,
            "2": 2,
            "3": 4,
          },
        },
        cyan: {
          cards: [
            {
              name: "Water Park",
              key: "PROPERTY_CYAN_1",
              value: 1,
            },
            {
              name: "The Local Beach",
              key: "PROPERTY_CYAN_2",
              value: 1,
            },
            {
              name: "AquaLand",
              key: "PROPERTY_CYAN_3",
              value: 1,
            },
          ],
          tags: ["property"],
          colorCode: "#00b3d6",
          rent: {
            "1": 1,
            "2": 2,
            "3": 3,
          },
        },
        teal: {
          cards: [
            {
              name: "Internet provider",
              key: "PROPERTY_TEAL_1",
              value: 2,
            },
            {
              name: "Streaming Services",
              key: "PROPERTY_TEAL_2",
              value: 2,
            },
          ],
          tags: ["property", "utility"],
          colorCode: "teal",
          rent: {
            "1": 1,
            "2": 2,
          },
        },
        brown: {
          cards: [
            {
              name: "Cardboard Box",
              key: "PROPERTY_BROWN_1",
              value: 1,
            },
            {
              name: "Trash bin",
              key: "PROPERTY_BROWN_2",
              value: 1,
            },
          ],
          tags: ["property"],
          colorCode: "#824b00",
          rent: {
            "1": 1,
            "2": 2,
          },
        },
      },
      wild: {
        all: {
          type: "property",
          key: "SUPER_WILD_PROPERTY",
          class: "wildPropertyAll",
          count: 2,
          tags: ["wild", "superWild", "property"],
          sets: [
            "blue",
            "green",
            "yellow",
            "red",
            "orange",
            "black",
            "purple",
            "cyan",
            "teal",
            "brown",
          ],
          value: 0,
        },
        "red/yellow": {
          type: "property",
          key: "WILD_PROPERTY_RED_YELLOW",
          class: "wildPropertyLimited",
          sets: ["red", "yellow"],
          tags: ["wild", "property"],
          value: 3,
          count: 2,
        },
        "green/blue": {
          type: "property",
          key: "WILD_PROPERTY_GREEN_BLUE",
          class: "wildPropertyLimited",
          sets: ["green", "blue"],
          tags: ["wild", "property"],
          value: 4,
          count: 1,
        },
        "cyan/brown": {
          type: "property",
          key: "WILD_PROPERTY_CYAN_BROWN",
          class: "wildPropertyLimited",
          sets: ["cyan", "brown"],
          tags: ["wild", "property"],
          value: 1,
          count: 1,
        },
        "cyan/black": {
          type: "property",
          key: "WILD_PROPERTY_CYAN_BLACK",
          class: "wildPropertyLimited",
          sets: ["cyan", "black"],
          tags: ["wild", "property"],
          value: 4,
          count: 1,
        },
        "green/black": {
          type: "property",
          key: "WILD_PROPERTY_GREEN_BLACK",
          class: "wildPropertyLimited",
          sets: ["green", "black"],
          tags: ["wild", "property"],
          value: 4,
          count: 1,
        },
        "teal/black": {
          type: "property",
          key: "WILD_PROPERTY_TEAL_BLACK",
          class: "wildPropertyLimited",
          sets: ["teal", "black"],
          tags: ["wild", "property"],
          value: 2,
          count: 1,
        },

        "orange/purple": {
          type: "property",
          key: "WILD_PROPERTY_ORANGE_PURPLE",
          class: "wildPropertyLimited",
          sets: ["orange", "purple"],
          tags: ["wild", "property"],
          value: 2,
          count: 2,
        },
      },
    };

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
      if (isDef(set) && sets.includes(set)) {
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

      let set = isDef(data.sets[0]) ? data.sets[0] : null;
      let sets = data.sets;
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
      Object.keys(instructions.cash).forEach((mxdValue) => {
        let value = parseInt(mxdValue, 10);
        let count = instructions.cash[value];
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
          let count = details.count;
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
        let count = details.count;
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
          let count = details.count;
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
      if (isArr(card.sets)) return [...card.sets];
      else if (isDef(card.set)) return [card.set];
    } else {
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

  function serialize() {
    return stateSerialize(mState, mExcludeKeys);
  }

  const pubicInterface = {
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
    serialize,

    allCards: mCardMap.toArray,
    cardCount: mCardMap.count,
    findCard: mCardMap.find,
    mapCards: mCardMap.map,
    forEachCard: mCardMap.forEach,
    filterCards: mCardMap.filter,
    filterCardsKeyed: mCardMap.filterKeyed,
  };

  function getPublic() {
    return { ...pubicInterface };
  }

  return getPublic();
}

module.exports = CardManager;
