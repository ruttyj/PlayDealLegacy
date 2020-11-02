const { identity, isObj, nDeep } = require("../../server/utils");
const rootFolder = `../..`;
const serverFolder = `${rootFolder}/server`;
const socketFolder = `${serverFolder}/sockets`;
const clientFolder = `${rootFolder}/client`;
const utilsFolder = `${serverFolder}/utils`;
const playDealFolder = `${serverFolder}/Game`;
const gameFolder = `${serverFolder}/Game`;
const GameInstance = require(`${gameFolder}/`);
const fs = require('fs');
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
let dump = (template) => console.log("@@@@@", JSON.stringify(template, null, 2));

describe("App", async function () {
  it(`Tripple just say no`, async () => {

    let game;
    let template;
    
    // Load state from file
    template = JSON.parse(fs.readFileSync(`${__dirname}/../data/TrippleJustSayNo.json`, 'utf8'));
    game = GameInstance();
    game.unserialize(template);
    game.nextPlayerTurn();

    // Get commonly used managers
    let requestManager = game.getRequestManager();

    // Play "RENT_BLUE_GREEN" 53
    if (1) {
      let checkpoints = new Map();
      let affected = {
        requests: false,
      };
      let affectedIds = {
        requests: [],
      };
      let thisPersonId = 1;
      let validAugmentCardsIds = [];
      let targetPeopleIds = [2];
      let baseValue = 8;

      game.requestRent({
        player: game.getCurrentTurnPlayer(),
        cardId: 54, 
        collectionId: 1,
        baseValue,
        targetPeopleIds,
        validAugmentCardsIds,
        thisPersonId, 
        affectedIds, 
        affected, 
        checkpoints,
      })
    }

    // Player 2 Declines rent with "Just say no #24"
    if (1) {
      let request = requestManager.getRequest(1);
      let checkpoints = new Map();
      let thisPersonId = 2;
      let cardId = 24;// 23, 24, 25
      
      let affected = {
        hand: false,
        bank: false,
        requests: false,
        collections: false,
      };
      let affectedIds = {
        requests: [],
        playerRequests: [],
        collections: [],
        playerCollections: [],
      };

      game.declineCollectValueRequest({
        request,
        checkpoints,
        game,
        thisPersonId,
        cardId,
        affected,
        affectedIds,
      })
    }

    // Player 1 Declines the "Just say no #23" insisting on payment
    if (1) {
      let thisPersonId = 1;
      let requestId = 2;
      let cardId = 23;// 23, 24, 25
      let responseKey = "decline";

      let request = requestManager.getRequest(requestId);
      let checkpoints = new Map();
      let affected = {
        hand: false,
        bank: false,
        requests: false,
        collections: false,
      };
      let affectedIds = {
        requests: [],
        playerRequests: [],
        collections: [],
        playerCollections: [],
      };

      game.respondToJustSayNo({ 
        cardId, 
        requestId, 
        responseKey, 
        affected,
        affectedIds,
        checkpoints,
        thisPersonId 
      });

    }

    // Player 2 Declines the insistance with a "Just say no #25"
    if (1) {
      let thisPersonId = 2;
      let requestId = 3;
      let cardId = 25;// 23, 24, 25
      let responseKey = "decline";

      let request = requestManager.getRequest(requestId);
      let checkpoints = new Map();
      let affected = {
        hand: false,
        bank: false,
        requests: false,
        collections: false,
      };
      let affectedIds = {
        requests: [],
        playerRequests: [],
        collections: [],
        playerCollections: [],
      };

      game.respondToJustSayNo({ 
        cardId, 
        requestId, 
        responseKey, 
        affected,
        affectedIds,
        checkpoints,
        thisPersonId 
      });

    }

    // Player 1 accepts the "Just say no"
    if (1) {
      let thisPersonId = 1;
      let requestId = 4;
      let cardId = null;// 23, 24, 25
      let responseKey = "accept";

      let request = requestManager.getRequest(requestId);
      let checkpoints = new Map();
      let affected = {
        hand: false,
        bank: false,
        requests: false,
        collections: false,
      };
      let affectedIds = {
        requests: [],
        playerRequests: [],
        collections: [],
        playerCollections: [],
      };

      game.respondToJustSayNo({ 
        cardId, 
        requestId, 
        responseKey, 
        affected,
        affectedIds,
        checkpoints,
        thisPersonId 
      });

    }

    // Confirm the state of the request
    if (1) {
      let request;
      let serialized;

      request = requestManager.getRequest(4);
      assert.exists(request, "request exists");
      serialized = request.serialize();
      assert.equal(serialized.type, "justSayNo");
      assert.equal(serialized.authorKey, 2);
      assert.equal(serialized.targetKey, 1);

      request = requestManager.getRequest(5);
      assert.notExists(request);
    }

    /*
      // DUMP HAND
      let player = game.getPlayer(thisPersonId);
      player.getHand().getAllCardIds().forEach(cardId => {
        dump(game.getCard(cardId));
      })
    //*/
  });

  it(`Just say no`, async () => {});

}); // end App description
