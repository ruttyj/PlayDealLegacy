const { makeMap } = require("../utils.js");
const PersonManager = require("../person/personManager");

const buildRoom = require(`../../Builders/Objects/Room`)

module.exports = buildRoom({ PersonManager, makeMap }) 