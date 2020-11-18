const { makeVar, makeList } = require("../utils.js");
const CardContainer = require("../card/cardContainer.js");
const buildPlayer = require(`../../Builders/Objects/PlayDeal/Player`);

module.exports = buildPlayer({
  makeVar, makeList, CardContainer
})