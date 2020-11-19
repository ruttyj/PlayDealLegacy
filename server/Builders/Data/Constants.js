module.exports = function buildConstants({}){
  return {
    IS_TEST_MODE: true,
    INCLUDE_DEBUG_DATA: false,
    USELESS_PROPERTY_SET_KEY: "_USELESS_SET_", // used for placeholder set which only contain set augments and no properties
    AMBIGUOUS_SET_KEY: "_AMBIGUOUS_SET_", // used for sets only containing super wild cards
    NON_PROPERTY_SET_KEYS: ["_AMBIGUOUS_SET_", "_USELESS_SET_"],
    CONFIG: {
      SHUFFLE_DECK: "shuffleDeck",
      ALTER_SET_COST_ACTION: "alterSetCostAction",
      ACTION_AUGMENT_CARDS_COST_ACTION: "actionAugmentCardsCostAction",
    },
  }
}
