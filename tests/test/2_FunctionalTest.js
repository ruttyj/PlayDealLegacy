const rootFolder = `../..`;
const serverFolder = `${rootFolder}/server`;
const socketFolder = `${serverFolder}/sockets`;
const clientFolder = `${rootFolder}/client`;
const utilsFolder = `${serverFolder}/utils`;
const playDealFolder = `${serverFolder}/Game`;
const gameFolder = `${serverFolder}/Game`;
const GameInstance = require(`${gameFolder}/`);
const {
  CONFIG, // CONFIG Options
  IS_TEST_MODE,
  AMBIGUOUS_SET_KEY,
  NON_PROPERTY_SET_KEYS,
} = require(`${gameFolder}/config/constants.js`);


const assert = require("chai").assert;
const {
  isDef,
  isArr,
  getNestedValue,
  makeListenerMap,
  makeVar,
  jsonLog,
} = require(`${utilsFolder}`);

console.clear();
describe("App", async function () {
  it(`Do something`, async () => {
    
    // @TODO

    let game;
    
    game = GameInstance();
    game.newGame();
    game.updateConfig({
      [CONFIG.SHUFFLE_DECK]: true,
      [CONFIG.ALTER_SET_COST_ACTION]: false,
      [CONFIG.ACTION_AUGMENT_CARDS_COST_ACTION]: true,
    });

    game.createPlayer("A");
    game.createPlayer("B");
    game.createPlayer("C");

    game.startGame();
    game.nextPlayerTurn();

    // B
    game.playerTurnStartingDraw(game.getCurrentTurn().getPlayerKey());
    game.nextPlayerTurn();

    // C
    game.playerTurnStartingDraw(game.getCurrentTurn().getPlayerKey());
    game.nextPlayerTurn();

    // A
    game.playerTurnStartingDraw(game.getCurrentTurn().getPlayerKey());
    game.nextPlayerTurn();

    let gameDump = game.serialize();


    let gameState = JSON.stringify(gameDump, null, 2);
    console.log("@@@@@", gameState);


    

    // make a game
    // serialize game

    // restart game
    // load from serialized

    // check

    // Load Tripple No Scenario

    // Check result

  });
}); // end App description