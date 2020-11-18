const { isDef } = require("../utils.js");
const PlayerTurn = require("./playerTurn.js");
const buildPlayerTurnManager = require(`../../Builders/Objects/PlayDeal/PlayerTurnManager`);

module.exports = buildPlayerTurnManager({
    isDef, 
    PlayerTurn,
})