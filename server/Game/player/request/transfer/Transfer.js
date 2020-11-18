const { makeVar, makeMap, isDef, isArr } = require("../../../utils.js");

const buildTransfer = require(`../../../../Builders/Objects/PlayDeal/Transfer/Transfer`)

module.exports = buildTransfer({
  makeVar, makeMap, isDef, isArr
});
