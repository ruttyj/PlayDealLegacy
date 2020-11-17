const {
  isDef,
  isArr,
  makeVar,
  makeList,
  getKeyFromProp,
  reduceArrayToMap,
} = require("../utils.js");
const utils = require("./cardUtils.js");
const constants = require("../config/constants.js");
const buildCardContainer = require(`../../Builders/Objects/PlayDeal/CardContainer`)

const CardContainer = buildCardContainer({
  isDef,
  isArr,
  makeVar,
  makeList,
  getKeyFromProp,
  reduceArrayToMap,
  utils,
  constants
})

module.exports = CardContainer;
