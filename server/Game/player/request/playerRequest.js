const {
  makeVar,
  emptyFunction,
  isDef,
  isFunc,
  isArr,
  recursiveBuild,
  getNestedValue,
} = require("../../utils.js");

const buildPlayerRequest = require(`../../../Builders/Objects/PlayDeal/PlayerRequest`)

module.exports = buildPlayerRequest({
  makeVar,
  emptyFunction,
  isDef,
  isFunc,
  isArr,
  recursiveBuild,
  getNestedValue,
});
