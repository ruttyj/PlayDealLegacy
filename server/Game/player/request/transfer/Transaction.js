const {
  isObj,
  isDef,
  arrSum,
  makeMap,
} = require("../../../utils.js");

const WealthTransfer = require("./MultiTransfer.js");
const buildTransaction = require(`../../../../Builders/Objects/PlayDeal/Transfer/Transaction`)

module.exports = buildTransaction({
  isObj,
  isDef,
  arrSum,
  makeMap,
  WealthTransfer
});
