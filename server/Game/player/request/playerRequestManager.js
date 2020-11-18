const PlayerRequest = require("./playerRequest.js");
const {
  makeVar,
  isDef,
  isObj,
  makeListener,
  makeMap,
  emptyFunc,
} = require("../../utils.js");
const Transaction = require("./transfer/Transaction.js");

const serverFolder = '../../..';
const buildAffected = require(`${serverFolder}/Builders/Objects/Affected`);
const buildOrderedTree = require(`${serverFolder}/Builders/Objects/OrderedTree`);
const OrderedTree = buildOrderedTree();
const Affected = buildAffected({OrderedTree});


const buildPlayerRequestManager = require(`../../../Builders/Objects/PlayDeal/PlayerRequestManager`)



module.exports = buildPlayerRequestManager({
  makeVar,
  isDef,
  isObj,
  makeListener,
  makeMap,
  emptyFunc,
  Transaction,
  Affected,
  PlayerRequest,
});
