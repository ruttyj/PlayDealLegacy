const rootFolder = `../..`;
const serverFolder = `${rootFolder}/server`;
const gameFolder = `${serverFolder}/Game`;
const GameInstance = require(`${gameFolder}/`);
const fs = require('fs');
const assert = require("chai").assert;

const buildAffected = require(`${serverFolder}/Lib/Affected`);
const buildOrderedTree = require(`${serverFolder}/Lib/OrderedTree`);

const OrderedTree = buildOrderedTree();
const Affected = buildAffected({OrderedTree});

describe("Just Say No", async function () {
  it(`Tripple JSN`, async () => {

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
      let _Affected = new Affected();
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
        _Affected,
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
      let _Affected = new Affected();
      
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
        _Affected,
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
      let _Affected = new Affected();

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
        _Affected,
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
      let _Affected = new Affected();

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
        _Affected,
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
      let _Affected = new Affected();

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
        _Affected,
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

  it(`JSN to Rent`, async () => {/* @TODO */});
  it(`JSN to Birthday`, async () => {/* @TODO */});
  it(`JSN to Swap Property`, async () => {/* @TODO */});
  it(`JSN to Steal Property`, async () => {/* @TODO */});
  it(`JSN to Steal Collection`, async () => {/* @TODO */});

}); // end App description
