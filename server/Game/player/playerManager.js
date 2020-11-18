const { isDef, isDefNested, isObj, makeMap, getKeyFromProp } = require("../utils.js");
const TurnManager = require("./turnManager.js");
const CollectionManager = require("../collection/collectionManager.js");
const Player = require("./player.js");
const constants = require("../config/constants.js");

const buildPlayerManager = require(`../../Builders/Objects/PlayDeal/PlayerManager`)


module.exports = buildPlayerManager({
  isDef, isDefNested, isObj, makeMap, getKeyFromProp,
  TurnManager,
  CollectionManager,
  Player,
  constants
});
