const {
  AMBIGUOUS_SET_KEY,
  USELESS_PROPERTY_SET_KEY,
} = require("../config/constants.js");

/**
 * IDEAS:
 * Events:
 *  Go to Music festivals
 *  Go to Starwars convention
 *  Car unexpectdly blows up
 *
 * Posessions:
 *  Car
 *  House
 *  Hotel
 *  NightClub
 *  Resteraunt
 *  Service
 */

const deckTemplate = {
  cardCounts: {
    // Draw Cards
    DRAW_CARDS: 10,

    // Request Cards
    DEAL_BREAKER: 2,
    STEAL_PROPERTY: 3,
    SWAP_PROPERTY: 3,
    DEBT_COLLECTOR: 3,
    ITS_MY_BIRTHDAY: 3,

    // Request Counters
    JUST_SAY_NO: 3,

    // Request Augment
    DOUBLE_THE_RENT: 2,

    // Set Augment
    HOUSE: 3,
    HOTEL: 2,

    // Rent
    SUPER_RENT: 3,
    RENT_BLUE_GREEN: 2,
    RENT_ORANGE_PURPLE: 2,
    RENT_BLACK_PINK: 2,
    RENT_YELLOW_ORANGE: 2,
    RENT_BROWN_CYAN: 2,

    // Cash
    CASH_10: 1,
    CASH_5: 2,
    CASH_4: 3,
    CASH_3: 3,
    CASH_2: 5,
    CASH_1: 6,

    // Wild properties
    SUPER_WILD_PROPERTY: 2,
    WILD_PROPERTY_ORANGE_PURPLE: 2,
    WILD_PROPERTY_RED_YELLOW: 2,
    WILD_PROPERTY_PINK_BLACK: 1,
    WILD_PROPERTY_GREEN_BLACK: 1,
    WILD_PROPERTY_CYAN_BLACK: 1,
    WILD_PROPERTY_CYAN_BROWN: 1,
    WILD_PROPERTY_GREEN_BLUE: 1,
  },
  cash: {
    CASH_10: {
      value: 10,
    },
    CASH_5: {
      value: 5,
    },
    CASH_4: {
      value: 4,
    },
    CASH_3: {
      value: 3,
    },
    CASH_2: {
      value: 2,
    },
    CASH_1: {
      value: 1,
    },
  },
  action: {
    DEAL_BREAKER: {
      name: "Steal Collection",
      key: "DEAL_BREAKER",
      tags: ["request", "stealCollection", "contestable", "bankable"],
      class: "stealCollection",
      target: "one",
      canBePrevented: true,
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
      value: 4,
    },
    STEAL_PROPERTY: {
      name: "Steal property",
      key: "STEAL_PROPERTY",
      class: "stealProperty",
      tags: ["request", "stealProperty", "contestable", "bankable"],
      target: "one",
      canBePrevented: true,
      value: 3,
    },
    SWAP_PROPERTY: {
      name: "Swap properties",
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
      value: 1,
    },
    HOUSE: {
      name: "House",
      value: 3,
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
    /*
    HOUSE: {
      name: "House",
      value: 3,
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
    //*/
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
        "pink",
        "brown",
      ],
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
    },
    RENT_BLACK_PINK: {
      class: "collection",
      key: "RENT_BLACK_PINK",
      name: "Rent",
      tags: ["rent", "request", "contestable", "bankable"],
      canBePrevented: true,
      target: "all",
      sets: ["black", "pink"],
      value: 1,
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
    },
  },
  properties: {
    blue: {
      set: "blue",
      tags: ["property"],
      colorCode: "#134bbf",
      rent: {
        "1": 3,
        "2": 8,
      },
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
    },
    green: {
      set: "green",
      tags: ["property"],
      colorCode: "#049004",
      rent: {
        "1": 2,
        "2": 4,
        "3": 7,
      },
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
    },
    yellow: {
      set: "yellow",
      tags: ["property"],
      colorCode: "#e8c700",
      rent: {
        "1": 2,
        "2": 4,
        "3": 6,
      },
      cards: [
        {
          name: "College Dorms",
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
    },
    red: {
      set: "red",
      tags: ["property"],
      colorCode: "#a50c0c",
      rent: {
        "1": 2,
        "2": 3,
        "3": 6,
      },
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
    },
    orange: {
      set: "orange",
      tags: ["property"],
      colorCode: "#ff7100",
      rent: {
        "1": 1,
        "2": 3,
        "3": 5,
      },
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
    },
    black: {
      set: "black",
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
      set: "purple",
      tags: ["property"],
      colorCode: "#940194",
      rent: {
        "1": 1,
        "2": 2,
        "3": 4,
      },
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
    },
    cyan: {
      set: "cyan",
      tags: ["property"],
      colorCode: "#00b3d6",
      rent: {
        "1": 1,
        "2": 2,
        "3": 3,
      },
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
    },
    pink: {
      set: "pink",
      tags: ["property", "utility"],
      colorCode: "pink",
      rent: {
        "1": 1,
        "2": 2,
      },
      cards: [
        {
          name: "Internet provider",
          key: "PROPERTY_PINK_1",
          value: 2,
        },
        {
          name: "Streaming Services",
          key: "PROPERTY_PINK_2",
          value: 2,
        },
      ],
    },
    brown: {
      set: "brown",
      tags: ["property"],
      colorCode: "#824b00",
      rent: {
        "1": 1,
        "2": 2,
      },
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
    },
  },
  wild: {
    SUPER_WILD_PROPERTY: {
      type: "property",
      key: "SUPER_WILD_PROPERTY",
      class: "wildPropertyAll",
      tags: ["wild", "superWild", AMBIGUOUS_SET_KEY, "property"],
      set: AMBIGUOUS_SET_KEY,
      sets: [
        "blue",
        "green",
        "yellow",
        "red",
        "orange",
        "black",
        "purple",
        "cyan",
        "pink",
        "brown",
        AMBIGUOUS_SET_KEY,
      ],
      value: 0,
    },
    WILD_PROPERTY_RED_YELLOW: {
      type: "property",
      key: "WILD_PROPERTY_RED_YELLOW",
      class: "wildPropertyLimited",
      set: "red",
      sets: ["red", "yellow"],
      tags: ["wild", "property"],
      value: 3,
    },
    WILD_PROPERTY_GREEN_BLUE: {
      type: "property",
      key: "WILD_PROPERTY_GREEN_BLUE",
      class: "wildPropertyLimited",
      set: "blue",
      sets: ["green", "blue"],
      tags: ["wild", "property"],
      value: 4,
    },
    WILD_PROPERTY_CYAN_BROWN: {
      type: "property",
      key: "WILD_PROPERTY_CYAN_BROWN",
      class: "wildPropertyLimited",
      set: "brown",
      sets: ["cyan", "brown"],
      tags: ["wild", "property"],
      value: 1,
    },
    WILD_PROPERTY_CYAN_BLACK: {
      type: "property",
      key: "WILD_PROPERTY_CYAN_BLACK",
      class: "wildPropertyLimited",
      set: "cyan",
      sets: ["cyan", "black"],
      tags: ["wild", "property"],
      value: 4,
    },
    WILD_PROPERTY_GREEN_BLACK: {
      type: "property",
      key: "WILD_PROPERTY_GREEN_BLACK",
      class: "wildPropertyLimited",
      set: "green",
      sets: ["green", "black"],
      tags: ["wild", "property"],
      value: 4,
    },
    WILD_PROPERTY_PINK_BLACK: {
      type: "property",
      key: "WILD_PROPERTY_PINK_BLACK",
      class: "wildPropertyLimited",
      set: "pink",
      sets: ["pink", "black"],
      tags: ["wild", "property"],
      value: 2,
    },
    WILD_PROPERTY_ORANGE_PURPLE: {
      type: "property",
      key: "WILD_PROPERTY_ORANGE_PURPLE",
      class: "wildPropertyLimited",
      set: "purple",
      sets: ["orange", "purple"],
      tags: ["wild", "property"],
      value: 2,
    },
  },
};

module.exports = deckTemplate;
