const serverFolder      = '..';
const builderFolder     = `${serverFolder}/Builders`;
const thisDir           = '.';
const buildAffected     = require(`${serverFolder}/Builders/Objects/Affected`);
const buildOrderedTree  = require(`${serverFolder}/Builders/Objects/OrderedTree`);
const buildGame     = require(`${builderFolder}/Objects/PlayDeal/Game`);
const pluralize         = require(`pluralize`);
const constants         = require(`${thisDir}/config/constants.js`);
const {
  els,
  isDef,
  isArr,
  isDefNested,
  getNestedValue,
  getKeyFromProp,
  reduceToKeyed,
} = require(`${thisDir}/utils.js`);
const CardContainer     = require(`${thisDir}/card/cardContainer.js`);
const PlayerManager     = require(`${thisDir}/player/playerManager.js`);
const CardManager       = require(`${thisDir}/card/cardManager.js`);
const TurnManager       = require(`${thisDir}/player/turnManager.js`);
const Transaction       = require(`${thisDir}/player/request/transfer/Transaction.js`);
const OrderedTree       = buildOrderedTree();
const Affected          = buildAffected({OrderedTree});


module.exports = buildGame({
  els,
  isDef,
  isArr,
  isDefNested,
  getNestedValue,
  getKeyFromProp,
  reduceToKeyed,
  pluralize,

  Affected,
  Transaction,
  TurnManager,
  CardManager,
  PlayerManager,
  CardContainer,

  constants,
});