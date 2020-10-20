const { identity } = require("../../server/utils");

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

    // make a game
    // serialize game

    // restart game
    // load from serialized

    // check

    // Load Tripple No Scenario

    // Check result


    // Imoplementation #1

    let game;
    let gameState;
    let gameDump;
    let gameJson;
    let dump = (template) => console.log("@@@@@", JSON.stringify(template, null, 2));
    let template;
    let currentPlayerKey;
    let collection
    let playerManager;
    let activePlayer;
    let activeTurnHand;
    
    // ===================================
    // Create a game to reload later
    if(1){
      game = GameInstance();
      game.newGame();
      game.updateConfig({
        [CONFIG.SHUFFLE_DECK]: false,
        [CONFIG.ALTER_SET_COST_ACTION]: false,
        //[CONFIG.ACTION_AUGMENT_CARDS_COST_ACTION]: true,
      });

      game.createPlayer("A");
      game.createPlayer("B");
      game.createPlayer("C");

      game.startGame();
      game.nextPlayerTurn();
      
      //playerManager = game.getPlayerManager();
      //activePlayer = game.getPlayer(currentPlayerKey);
      //activeTurnHand = activePlayer.getHand().getAllCards();
      currentPlayerKey = game.getCurrentTurn().getPlayerKey();
      
      collection = game.playCardFromHandToNewCollection(currentPlayerKey, 93);

      dump({collectionManager: game.getCollectionManager().serialize()});
    }
  
    template = game.serialize();
    //console.log("@@@@@", JSON.stringify(template, null, 2));

   
    // ===================================
    // Create a blank game abd load from above
    if(1){
      game = GameInstance();
      game.newGame();
      // Add different players
      game.createPlayer("E");
      game.createPlayer("F");
      game.createPlayer("G");
      game.startGame();
      game.nextPlayerTurn();

      // Attempt to reset game and load previous one
      game.unserialize(template);

      //dump({playerManager: game.getPlayerManager().serialize()});
      //dump({collectionManager: game.getCollectionManager().serialize()});
    }
  });
}); // end App description
