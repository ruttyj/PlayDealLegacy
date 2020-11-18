const { isObj, isDef, arrSum, makeMap } = require("../../../utils.js");

const Transfer = require("./Transfer.js");

const buildWealthTransfer = require(`../../../../Builders/Objects/PlayDeal/Transfer/WealthTransfer`)

module.exports = buildWealthTransfer({
  Transfer,
  isObj, isDef, arrSum, makeMap,
});
