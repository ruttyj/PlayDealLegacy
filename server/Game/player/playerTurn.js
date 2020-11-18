const { isDef, makeVar } = require("../utils.js");
const PlayerRequestManager = require("./request/playerRequestManager.js");

const buildPlayerTurn = require(`../../Builders/Objects/PlayDeal/PlayerTurn`);

module.exports = buildPlayerTurn({
  isDef, makeVar, PlayerRequestManager
});
