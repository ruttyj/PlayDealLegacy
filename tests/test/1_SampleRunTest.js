const rootFolder          = `../..`;
const builderFolder       = `../../server/Builders`;

const serverFolder        = `${rootFolder}/server`;
const clientFolder        = `${rootFolder}/client`;
const assert              = require("chai").assert;

const clientConnection    = require(`${clientFolder}/src/utils/clientSocket.js`)    // Client Connection
const utils               = require(`${serverFolder}/utils/index.js`)

const buildTestHost       = require(`${builderFolder}/Objects/TestUtil/TestHost`)
const buildConstants      = require(`${builderFolder}/Data/Constants`)
const buildPlaydealServer = require(`${builderFolder}/Objects/Server`)

const TestHost            = buildTestHost(utils)
const constants           = buildConstants({});
const PlayDealServer      = buildPlaydealServer({utils});

// Check the responses on the client's side of the socket
const checks = require(`../checks/`);

function buildSampleRunTestCase({
  defaultProps,
  constants,
  player1Con,
  player2Con,
  numberOfPlayers,
  roomCode,
  player1Name,
  player2Name,
  player1Id,
  player2Id,
  allPlayerIds,
  getOtherPlayers,
  getOtherPlayersIds,
  getNextPlayerId,
  skipTurn,
}){
  const runTestCases = true;
  const { CONFIG } = constants;
  const initalHandSize      = 5;
  const intialDrawPileSize  = 96;
  let runningDrawPileSize   = intialDrawPileSize;
  
  if (runTestCases) {
    let testNumber    = 0;
    let executeUnill  = 577777; // @TOGGLE execution of tests until number
    if (++testNumber < executeUnill)
      it(`${testNumber} - create room ${roomCode}`, async () => {
        let result = await player1Con.emitSingleRequest(
          "ROOM",
          "CREATE",
          defaultProps(roomCode)
        );
        assert.equal(result[0].status, "success");
      });

    if (testNumber < executeUnill)
      it(`${++testNumber} - room ${roomCode} exists`, async () => {
        let responses = await player1Con.emitSingleRequest(
          "ROOM",
          "EXISTS",
          defaultProps(roomCode)
        );
        assert.exists(responses[0]);
        assert.equal(responses[0].status, "success");
        assert.exists(responses[0].payload.exists[roomCode]);
        assert.equal(responses[0].payload.exists[roomCode], true);
      });

    // Player one joins the room
    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} - Joined room ${roomCode}`, async () => {
        let responses = await player1Con.emitSingleRequest(
          "ROOM",
          "JOIN",
          defaultProps(roomCode, { username: player1Name })
        );
        assert.isArray(responses);

        let confirm = responses.find(
          (r) => r.subject === "ROOM" && r.action === "JOIN"
        );
        let roomDetails = responses.find(
          (r) => r.subject === "ROOM" && r.action === "GET_CURRENT"
        );
        let peopleList = responses.find(
          (r) => r.subject === "PEOPLE" && r.action === "GET_KEYED"
        );
        let hostDetails = responses.find(
          (r) => r.subject === "PEOPLE" && r.action === "GET_HOST"
        );
        let myDetails = responses.find(
          (r) => r.subject === "PEOPLE" && r.action === "ME"
        );

        assert.exists(confirm, "confirm exists");
        assert.exists(roomDetails, "roomDetails exists");
        assert.exists(peopleList, "peopleList exists");
        assert.exists(hostDetails, "hostDetails exists");
        assert.exists(myDetails, "myDetails exists");

        assert.equal(confirm.status, "success");
        assert.equal(roomDetails.payload.code, roomCode, "Room code matches");
        assert.isObject(peopleList.payload.items, "keyed person map exists");
        assert.isArray(peopleList.payload.order, "keyed person order exists");
        assert.isAtLeast(
          peopleList.payload.order.length,
          1,
          "correct order list"
        );
        assert.equal(
          hostDetails.payload.host,
          player1Id,
          "Player 1 should be host"
        );
        assert.equal(myDetails.payload.me, player1Id, "player 1 expected id");
      });

    // Player 2 joins the room
    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Joined room ${roomCode}`, async () => {
        // Player 1 should be notified when another player joins
        let notifiedPromise = new Promise((resolve) =>
          player1Con.listnerTree.once(["PEOPLE", "GET_KEYED"], resolve)
        );

        let responses = await player2Con.emitSingleRequest(
          "ROOM",
          "JOIN",
          defaultProps(roomCode, { username: player2Name })
        );
        assert.isArray(responses);

        let confirm = responses.find(
          (r) => r.subject === "ROOM" && r.action === "JOIN"
        );
        let roomDetails = responses.find(
          (r) => r.subject === "ROOM" && r.action === "GET_CURRENT"
        );
        let peopleList = responses.find(
          (r) => r.subject === "PEOPLE" && r.action === "GET_KEYED"
        );
        let hostDetails = responses.find(
          (r) => r.subject === "PEOPLE" && r.action === "GET_HOST"
        );
        let myDetails = responses.find(
          (r) => r.subject === "PEOPLE" && r.action === "ME"
        );

        assert.exists(confirm, "confirm exists");
        assert.exists(roomDetails, "roomDetails exists");
        assert.exists(peopleList, "peopleList exists");
        assert.exists(hostDetails, "hostDetails exists");
        assert.exists(myDetails, "myDetails exists");

        assert.equal(confirm.status, "success");
        assert.equal(roomDetails.payload.code, roomCode, "Room code matches");
        assert.isObject(peopleList.payload.items, "keyed person map exists");
        assert.isArray(peopleList.payload.order, "keyed person order exists");
        assert.isAtLeast(
          peopleList.payload.order.length,
          2,
          "correct order list"
        );

        assert.equal(
          myDetails.payload.me,
          player2Id,
          `${player2Name} expected id`
        );

        let notifyPlayer1 = await notifiedPromise;
        assert.exists(
          notifyPlayer1.payload.items[String(player2Id)],
          `${player1Name} notified when ${player2Name} joined`
        );
      });

    // Player 1 readys up
    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} - Ready up`, async () => {
        const newStatus = "ready";

        // player 2 gets notified when player 1 changes their status
        let notifiedPromise = new Promise((resolve) =>
          player2Con.listnerTree.once(["PEOPLE", "GET_KEYED"], resolve)
        );

        let responses = await player1Con.emitSingleRequest(
          "PEOPLE",
          "UPDATE_MY_STATUS",
          defaultProps(roomCode, { status: newStatus })
        );

        let confirm = responses.find(
          (r) => r.subject === "PEOPLE" && r.action === "UPDATE_MY_STATUS"
        );
        let updatedPersonData = responses.find(
          (r) => r.subject === "PEOPLE" && r.action === "GET_KEYED"
        );
        let gameCanStart = responses.find(
          (r) => r.subject === "GAME" && r.action === "CAN_START"
        );

        assert.exists(confirm, "confirm exists");
        assert.exists(updatedPersonData, "updatedPersonData exists");
        assert.exists(gameCanStart, "gameCanStart exists");

        assert.equal(confirm.status, "success");
        assert.equal(
          updatedPersonData.payload.items[String(player1Id)].status,
          newStatus,
          "retreived new status"
        );
        assert.equal(gameCanStart.payload.value, false, "cannot start game yet");

        let notified = await notifiedPromise;
        assert.equal(
          notified.payload.items[String(player1Id)].status,
          newStatus,
          `${player1Name} notified when ${player2Name} joined`
        );

        //let responses2 = await player1.emitSingleRequest("PEOPLE", "GET_ALL_KEYED", defaultProps(roomCode));
      });

    // Player 2 readys up
    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Ready up`, async () => {
        const newStatus = "ready";

        // player 1 gets notified when player 1 changes their status
        let p1NotifiedPromise = new Promise((resolve) =>
          player1Con.listnerTree.once(["PEOPLE", "GET_KEYED"], resolve)
        );
        let p1CanStartGamePromise = new Promise((resolve) =>
          player1Con.listnerTree.once(["GAME", "CAN_START"], resolve)
        );

        let responses = await player2Con.emitSingleRequest(
          "PEOPLE",
          "UPDATE_MY_STATUS",
          defaultProps(roomCode, { status: newStatus })
        );
        let confirm = responses.find(
          (r) => r.subject === "PEOPLE" && r.action === "UPDATE_MY_STATUS"
        );
        let updatedPersonData = responses.find(
          (r) => r.subject === "PEOPLE" && r.action === "GET_KEYED"
        );
        //let gameCanStart = responses.find(r => r.subject === "GAME" && r.action === "CAN_START");

        assert.exists(confirm, "confirm exists");
        assert.exists(updatedPersonData, "updatedPersonData exists");
        //assert.exists(gameCanStart, "gameCanStart exists");

        assert.equal(confirm.status, "success");
        assert.equal(
          updatedPersonData.payload.items[String(player2Id)].status,
          newStatus,
          "retreived new status"
        );
        //assert.equal(gameCanStart.payload.value, true, "can now start game");

        let notifyPlayer1 = await p1NotifiedPromise;
        assert.exists(
          notifyPlayer1.payload.items[String(player2Id)],
          `${player1Name} notified when ${player2Name} joined`
        );


        let p1CanStartGame = await p1CanStartGamePromise;
        assert.equal(
          p1CanStartGame.payload.value,
          true,
          "Player 1 can start the game"
        );
        //fs.writeFile(`test_${testNumber}.json`, JSON.stringify(template), () => {});
      });

    let otherResp = null;
    let currentPlayerTurnId = player2Id;

    // Player 1 starts game
    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} - Starts GAME`, async () => {
        let responses;
        let subject = "GAME";
        let action = `START`;
        let currentPlayerTurnId = player2Id;

        let otherPeople = getOtherPlayers(player1Id);
        // Start watching for the results for other people
        otherResp = Promise.all(
          otherPeople.map((player) => {
            let somePromise = new Promise((resolve) => {
              player.connection.listnerTree.once(
                [subject, `${action}_RESULT`],
                (responses) => {
                  resolve({ personId: player.id, response: responses });
                }
              );
            });
            return somePromise;
          })
        );

        // Set desired game config ------------------------------
        let desiredConfig = {
          [CONFIG.SHUFFLE_DECK]: false,
          [CONFIG.ALTER_SET_COST_ACTION]: false,
        };
        responses = await player1Con.emitSingleRequest(
          "GAME",
          "UPDATE_CONFIG",
          defaultProps(roomCode, {
            config: desiredConfig,
          })
        );
        let gameConfig = responses.find(
          (r) => r.subject === "GAME" && r.action === "GET_CONFIG"
        );
        assert.equal(gameConfig.status, "success", "config was affected");

        let configKeys = Object.keys(desiredConfig);
        configKeys.forEach((key) => {
          assert.equal(
            gameConfig.payload.updatedConfig[key],
            desiredConfig[key],
            "config should be as expected"
          );
        });
        //___________________________________________________________

        // START GAME -----------------------------------------------
        responses = await player1Con.emitSingleRequest(
          subject,
          action,
          defaultProps(roomCode)
        );
        checks.startGameCheck({
          responses,
          numberOfPlayers,
          playerTurnId: currentPlayerTurnId,
          allPlayerIds: allPlayerIds,
          initalHandSize,
          intialDrawPileSize,
          personId: player1Id,
          otherPeopleIds: [player2Id],
        });
      });

    // Player 1 starts game
    if (++testNumber < executeUnill)
      it(`${testNumber} - Others get initial game data when ${player1Name} starts game`, async () => {
        // Process the results for other people
        let otherResults = await otherResp;
        otherResults.forEach((result) => {
          let personId = result.personId;
          let theirResponses = result.response;

          checks.startGameCheck({
            responses: theirResponses,
            numberOfPlayers,
            playerTurnId: currentPlayerTurnId,
            allPlayerIds: allPlayerIds,
            initalHandSize,
            intialDrawPileSize,
            personId: personId,
            otherPeopleIds: getOtherPlayersIds(personId),
          });
        });
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Draws turn starting cards`, async () => {
        runningDrawPileSize -= 2;
        let thisPersonId = player2Id;
        let thisPerson = player2Con;

        let responses = await thisPerson.emitSingleRequest(
          "MY_TURN",
          "TURN_STARTING_DRAW",
          defaultProps(roomCode)
        );
        checks.handleTurnStartingDrawCheck({
          responses,
          personId: thisPersonId,
          handSize: 7,
          drawPileSize: runningDrawPileSize,
        });
      });

    //handleTurnStartingDrawCheck({responses, personId, handSize, drawPileSize})
    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Plays a cyan card #95 to an empty collection #1 has 1 card`, async () => {
        let thisPersonId = player2Id;
        let thisPerson = player2Con;
        let expectedTurnPhase = "action";
        let expectedActionCount = 1;
        let expectedPropertyCount = 1;
        let exprectedCollectionId = 1;
        let expectedHandCount = 6;
        let cardId = 95;
        let cardPropertySetKey = "cyan";
        let responses = await thisPerson.emitSingleRequest(
          "MY_TURN",
          "ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND",
          defaultProps(roomCode, { cardId })
        );

        checks.expectedAddPropertyToNewCollectionFromHandCheck({
          responses,
          thisPersonId,
          expectedHandCount,
          expectedTurnPhase,
          expectedActionCount,
          expectedPropertyCount,
          exprectedCollectionId,
          cardId,
          cardPropertySetKey,
        });
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Plays another cyan card #96 to an empty collection #2 has 1 card`, async () => {
        let thisPersonId = player2Id;
        let thisPerson = player2Con;
        let expectedActionCount = 2;
        let expectedPropertyCount = 1;
        let exprectedCollectionId = 2;
        let expectedTurnPhase = "action";
        let expectedHandCount = 5;
        let cardId = 96;
        let cardPropertySetKey = "cyan";
        let responses = await thisPerson.emitSingleRequest(
          "MY_TURN",
          "ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND",
          defaultProps(roomCode, { cardId })
        );
        checks.expectedAddPropertyToNewCollectionFromHandCheck({
          responses,
          thisPersonId,
          expectedHandCount,
          expectedActionCount,
          expectedPropertyCount,
          expectedTurnPhase,
          exprectedCollectionId,
          cardId,
          cardPropertySetKey,
        });
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Plays another cyan card #97 existing collection #2 has 2 cards`, async () => {
        let thisPersonId = player2Id;
        let thisPerson = player2Con;
        let expectedActionCount = 3;
        let expectedPropertyCount = 2;
        let expectedHandCount = 4;
        let cardId = 97;
        let collectionId = 2;
        let expectedTurnPhase = "done";
        let cardPropertySetKey = "cyan";
        let responses = await thisPerson.emitSingleRequest(
          "MY_TURN",
          "ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND",
          defaultProps(roomCode, { cardId, collectionId })
        );
        checks.expectedAddPropertyToExistingCollectionFromHandCheck({
          responses,
          thisPersonId,
          expectedHandCount,
          expectedActionCount,
          expectedPropertyCount,
          expectedTurnPhase,
          collectionId,
          cardId,
          cardPropertySetKey,
        });
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Transfers card #97 from collection #2 to #1; collection #2 has 1 card`, async () => {
        let thisPersonId = player2Id;
        let thisPerson = player2Con;

        let cardId = 97;
        let fromCollectionId = 2;
        let expectedFromCollectionPropertyCount = 1;
        let toCollectionId = 1;
        let expectedToCollectionPropertyCount = 2;

        let affectedCollections = [fromCollectionId, toCollectionId];
        let responses = await thisPerson.emitSingleRequest(
          "MY_TURN",
          "TRANSFER_PROPERTY_TO_EXISTING_COLLECTION_FROM_COLLECTION",
          defaultProps(roomCode, { cardId, fromCollectionId, toCollectionId })
        );

        let collectionData = responses.find(
          (r) => r.subject === "COLLECTIONS" && r.action === "GET_KEYED"
        );
        affectedCollections.forEach((collectionId) => {
          assert.exists(
            collectionData.payload.items[collectionId],
            "Collection exists"
          );
        });

        assert.notInclude(
          collectionData.payload.items[fromCollectionId].cardIds,
          cardId,
          "card was removed from one set"
        );
        assert.equal(
          collectionData.payload.items[fromCollectionId].propertyCount,
          expectedFromCollectionPropertyCount,
          "expected property count in the from collection"
        );

        assert.include(
          collectionData.payload.items[toCollectionId].cardIds,
          cardId,
          "card was added to the other set"
        );
        assert.equal(
          collectionData.payload.items[toCollectionId].propertyCount,
          expectedToCollectionPropertyCount,
          "expected property count in the to collection"
        );
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Transfers last card from collection #2 to #1; collection #2 is destroyed`, async () => {
        let thisPersonId = player2Id;
        let thisPerson = player2Con;

        let cardId = 96;
        let fromCollectionId = 2;
        let toCollectionId = 1;
        let expectedToCollectionPropertyCount = 3;

        let responses = await thisPerson.emitSingleRequest(
          "MY_TURN",
          "TRANSFER_PROPERTY_TO_EXISTING_COLLECTION_FROM_COLLECTION",
          defaultProps(roomCode, { cardId, fromCollectionId, toCollectionId })
        );
        checks.transferPropertyBetweenSetsToCompleteSetDestroyingPreviousSetChecks(
          {
            responses,
            toCollectionId,
            isFullSet: true,
            fromCollectionId,
            thisPersonId,
            expectedToCollectionPropertyCount,
          }
        );
      });

    // Define This Person

    // Finish Turn
    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Finishes turn`, async () => {
        let thisPersonId = player2Id;
        let thisPerson = player2Con;
        let nextPersonId = getNextPlayerId(thisPersonId);
        let responses = await player2Con.emitSingleRequest(
          "MY_TURN",
          "FINISH_TURN",
          defaultProps(roomCode)
        );

        let confirm = responses.find(
          (r) => r.subject === "MY_TURN" && r.action === "FINISH_TURN"
        );
        assert.equal(confirm.status, "success", "Confirm action success");

        let currentTurn = responses.find(
          (r) => r.subject === "PLAYER_TURN" && r.action === "GET"
        );
        assert.exists(confirm, "Confirm message exists");
        checks.currentTurnCheck({
          data: currentTurn,
          phase: "draw",
          actionCount: 0,
          actionLimit: 3,
          playerTurnId: nextPersonId,
        });
      });

    // Player 1 Turn
    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} - Turn starting draw`, async () => {
        runningDrawPileSize -= 2;
        let thisPersonId = player1Id;

        let responses = await player1Con.emitSingleRequest(
          "MY_TURN",
          "TURN_STARTING_DRAW",
          defaultProps(roomCode)
        );
        checks.handleTurnStartingDrawCheck({
          responses,
          personId: thisPersonId,
          handSize: 7,
          drawPileSize: runningDrawPileSize,
        });
      });

    // Finish Turn
    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} finishes turn`, async () => {
        let thisPersonId = player1Id;
        let thisPerson = player1Con;
        let nextPersonId = getNextPlayerId(thisPersonId);
        let responses = await thisPerson.emitSingleRequest(
          "MY_TURN",
          "FINISH_TURN",
          defaultProps(roomCode)
        );

        let confirm = responses.find(
          (r) => r.subject === "MY_TURN" && r.action === "FINISH_TURN"
        );
        assert.equal(confirm.status, "success", "Confirm action success");

        let currentTurn = responses.find(
          (r) => r.subject === "PLAYER_TURN" && r.action === "GET"
        );
        assert.exists(confirm, "Confirm message exists");
        checks.currentTurnCheck({
          data: currentTurn,
          phase: "draw",
          actionCount: 0,
          actionLimit: 3,
          playerTurnId: nextPersonId,
        });
      });

    // Player 2 start turn
    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Draws turn starting cards`, async () => {
        runningDrawPileSize -= 2;
        let thisPersonId = player2Id;
        let thisPerson = player2Con;
        let expectedHandSize = 6;

        let responses = await thisPerson.emitSingleRequest(
          "MY_TURN",
          "TURN_STARTING_DRAW",
          defaultProps(roomCode)
        );

        checks.handleTurnStartingDrawCheck({
          responses,
          personId: thisPersonId,
          handSize: expectedHandSize,
          drawPileSize: runningDrawPileSize,
        });
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Add Hotel to full set #1 from hand But _house_ is not presant, should fail`, async () => {
        let thisPersonId = player2Id;
        let thisPerson = player2Con;
        let cardId = 105;
        let collectionId = 1;

        let responses = await thisPerson.emitSingleRequest(
          "MY_TURN",
          "ADD_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_HAND",
          defaultProps(roomCode, { cardId, collectionId })
        );
        let confirm = responses.find(
          (r) =>
            r.subject === "MY_TURN" &&
            r.action === "ADD_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_HAND"
        );
        assert.equal(confirm.status, "failure", "Add Hotel should fail");
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Add House to full set`, async () => {
        let thisPersonId = player2Id;
        let thisPerson = player2Con;
        let cardId = 103;
        let collectionId = 1;

        //await dumpCollections(thisPerson, [1]);
        let responses = await thisPerson.emitSingleRequest(
          "MY_TURN",
          "ADD_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_HAND",
          defaultProps(roomCode, { cardId, collectionId })
        );
        let confirm = responses.find(
          (r) =>
            r.subject === "MY_TURN" &&
            r.action === "ADD_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_HAND"
        );
        //await dumpCollections(thisPerson, [1]);
        assert.equal(confirm.status, "success", "Confirm action success");

        let collections = responses.find(
          (r) => r.subject === "COLLECTIONS" && r.action === "GET_KEYED"
        );
        assert.include(
          collections.payload.items[collectionId].cardIds,
          cardId,
          "Collection contains house card now."
        );

        let hands = responses.find(
          (r) => r.subject === "PLAYER_HANDS" && r.action === "GET_KEYED"
        );
        assert.exists(hands, "Hand data is present");
        assert.notInclude(
          hands.payload.items[thisPersonId].cardIds,
          cardId,
          "card is no longer in hand"
        );
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Add Hotel to full set with house on it`, async () => {
        let thisPersonId = player2Id;
        let thisPerson = player2Con;
        let cardId = 105;
        let collectionId = 1;

        let responses = await thisPerson.emitSingleRequest(
          "MY_TURN",
          "ADD_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_HAND",
          defaultProps(roomCode, { cardId, collectionId })
        );
        let confirm = responses.find(
          (r) =>
            r.subject === "MY_TURN" &&
            r.action === "ADD_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_HAND"
        );
        assert.equal(confirm.status, "success", "Confirm action success");

        let collections = responses.find(
          (r) => r.subject === "COLLECTIONS" && r.action === "GET_KEYED"
        );
        assert.include(
          collections.payload.items[collectionId].cardIds,
          cardId,
          "Collection contains house card now."
        );

        let hands = responses.find(
          (r) => r.subject === "PLAYER_HANDS" && r.action === "GET_KEYED"
        );
        assert.exists(hands, "Hand data is present");
        assert.notInclude(
          hands.payload.items[thisPersonId].cardIds,
          cardId,
          "card is no longer in hand"
        );
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Transfer property from partial Collection #1 with house on it to new collection; house should be placed into junk set.`, async () => {
        let thisPersonId = player2Id;
        let thisPerson = player2Con;
        let cardId = 96;
        let fromCollectionId = 1;
        let fromCollectionIsFull = false;
        let expcectedFromCollectionAugmentCount = 0;
        let expcectedFromCollectionPropertyCount = 2;

        let uselessCollectionId = 4;
        let expectedUselessAugmentCount = 2;
        let expectedUselessPropertyCount = 2;
        let houseCard = 103;
        let hotelCard = 105;
        let expectedNewCollectionId = 3;
        let subject = "MY_TURN";
        let action = "TRANSFER_PROPERTY_TO_NEW_COLLECTION_FROM_COLLECTION";

        let responses = await thisPerson.emitSingleRequest(
          "MY_TURN",
          action,
          defaultProps(roomCode, { cardId, fromCollectionId })
        );

        let confirm = responses.find(
          (r) => r.subject === subject && r.action === action
        );
        assert.equal(confirm.status, "success", "Confirm action success");

        let collections = responses.find(
          (r) => r.subject === "COLLECTIONS" && r.action === "GET_KEYED"
        );
        assert.exists(
          collections.payload.items[fromCollectionId],
          "old set still exists"
        );
        assert.equal(
          collections.payload.items[fromCollectionId].propertyCount,
          expcectedFromCollectionPropertyCount,
          "property count in from collection"
        );
        assert.equal(
          collections.payload.items[fromCollectionId].augmentCount,
          expcectedFromCollectionAugmentCount,
          "augment count in from collection"
        );
        assert.equal(
          collections.payload.items[fromCollectionId].isFullSet,
          fromCollectionIsFull,
          "the collection is no longer complete"
        );
        assert.notInclude(
          collections.payload.items[fromCollectionId].cardIds,
          cardId,
          fromCollectionIsFull,
          "the moved card is no longer in the old set"
        );
        assert.notInclude(
          collections.payload.items[fromCollectionId].cardIds,
          houseCard,
          fromCollectionIsFull,
          "the _house_ card is no longer in the old set"
        );
        assert.notInclude(
          collections.payload.items[fromCollectionId].cardIds,
          hotelCard,
          fromCollectionIsFull,
          "the _hotel_ card is no longer in the old set"
        );

        assert.exists(
          collections.payload.items[expectedNewCollectionId],
          "expected new collection exists"
        );
        assert.include(
          collections.payload.items[expectedNewCollectionId].cardIds,
          cardId,
          "moved card is in expected collection"
        );

        assert.exists(
          collections.payload.items[uselessCollectionId],
          "A collection was created to hold the junk cards"
        );
        assert.exists(
          collections.payload.items[uselessCollectionId],
          "A collection was created to hold the junk cards"
        );

        assert.exists(
          collections.payload.items[uselessCollectionId],
          "Useless collection has been created"
        );
        assert.equal(
          collections.payload.items[uselessCollectionId].propertySetKey,
          constants.USELESS_PROPERTY_SET_KEY,
          "Useless collection the appropriate set key"
        );
        assert.include(
          collections.payload.items[uselessCollectionId].cardIds,
          houseCard,
          "the _house_ card is in the junk set"
        );
        assert.include(
          collections.payload.items[uselessCollectionId].cardIds,
          hotelCard,
          "the _hotel_ card is in the junk set"
        );
        assert.equal(
          collections.payload.items[uselessCollectionId].augmentCount,
          expectedUselessAugmentCount,
          "augment count is as expected on junk collection"
        );
        assert.equal(
          collections.payload.items[uselessCollectionId].augmentCount,
          expectedUselessPropertyCount,
          "property count is as expected on junk collection"
        );
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Transfer property from full col #1 to junk col #4, should fail.`, async () => {
        let thisPerson = player2Con;

        let cardId = 95;
        let fromCollectionId = 1;
        let uselessCollectionId = 4;
        let subject = "MY_TURN";
        let action = "TRANSFER_PROPERTY_TO_EXISTING_COLLECTION_FROM_COLLECTION";

        let responses = await thisPerson.emitSingleRequest(
          subject,
          action,
          defaultProps(roomCode, {
            cardId,
            fromCollectionId,
            toCollectionId: uselessCollectionId,
          })
        );
        let confirm = responses.find(
          (r) => r.subject === subject && r.action === action
        );
        assert.equal(confirm.status, "failure", "Confirm action success");
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Add House to partial set #1 from other set, should fail`, async () => {
        let thisPerson = player2Con;
        let cardId = 105;
        let fromCollectionId = 1;
        let toCollectionId = 1;
        let subject = "MY_TURN";
        let action =
          "TRANSFER_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_COLLECTION";

        let responses = await thisPerson.emitSingleRequest(
          subject,
          action,
          defaultProps(roomCode, {
            cardId,
            fromCollectionId,
            toCollectionId,
          })
        );
        let confirm = responses.find(
          (r) => r.subject === subject && r.action === action
        );
        assert.equal(
          confirm.status,
          "failure",
          "Add House to partial set should fail from empty set"
        );
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Transfer property #96 from col #3 to col #1 to complete set`, async () => {
        let thisPersonId = player2Id;
        let thisPerson = player2Con;

        let cardId = 96;
        let fromCollectionId = 3;
        let toCollectionId = 1;
        let expectedToCollectionPropertyCount = 3;

        let responses = await thisPerson.emitSingleRequest(
          "MY_TURN",
          "TRANSFER_PROPERTY_TO_EXISTING_COLLECTION_FROM_COLLECTION",
          defaultProps(roomCode, { cardId, fromCollectionId, toCollectionId })
        );

        checks.transferPropertyBetweenSetsToCompleteSetDestroyingPreviousSetChecks(
          {
            responses,
            isFullSet: true,
            toCollectionId,
            fromCollectionId,
            thisPersonId,
            expectedToCollectionPropertyCount,
          }
        );
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Move house from junk col #4 to complete cyan col #1`, async () => {
        let thisPerson = player2Con;
        let subject = "MY_TURN";
        let action =
          "TRANSFER_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_COLLECTION";
        let fromCollectionId = 4;
        let toCollectionId = 1;
        let cardId = 103;

        //await dumpCollections(thisPerson, [1, 4]);

        let responses = await thisPerson.emitSingleRequest(
          subject,
          action,
          defaultProps(roomCode, {
            fromCollectionId,
            toCollectionId,
            cardId,
          })
        );

        let confirm = responses.find(
          (r) => r.subject === subject && r.action === action
        );
        assert.equal(confirm.status, "success", "confirm action was sucessfull");

        let collections = responses.find(
          (r) => r.subject === "COLLECTIONS" && r.action === "GET_KEYED"
        );
        assert.include(
          collections.payload.items[toCollectionId].cardIds,
          cardId,
          "toCollection contains house card now."
        );
        assert.notInclude(
          collections.payload.items[fromCollectionId].cardIds,
          cardId,
          "fromCollection no longer contains house card."
        );
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Move hotel from junk col #4 to complete cyan col #1 with house; destroying junk set`, async () => {
        let thisPerson = player2Con;
        let subject = "MY_TURN";
        let action =
          "TRANSFER_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_COLLECTION";
        let fromCollectionId = 4;
        let toCollectionId = 1;
        let cardId = 105;

        let responses = await thisPerson.emitSingleRequest(
          subject,
          action,
          defaultProps(roomCode, {
            fromCollectionId,
            toCollectionId,
            cardId,
          })
        );

        let confirm = responses.find(
          (r) => r.subject === subject && r.action === action
        );
        assert.equal(confirm.status, "success", "confirm action was sucessfull");

        let collections = responses.find(
          (r) => r.subject === "COLLECTIONS" && r.action === "GET_KEYED"
        );
        assert.include(
          collections.payload.items[toCollectionId].cardIds,
          cardId,
          "toCollection contains house card now."
        );
        assert.notExists(
          collections.payload.items[fromCollectionId],
          "fromCollection is not in the get result."
        );

        let removeCollections = responses.find(
          (r) => r.subject === "COLLECTIONS" && r.action === "REMOVE_KEYED"
        );
        assert.include(
          removeCollections.payload.removeItemsIds,
          fromCollectionId,
          "from collection should be removed"
        );
        assert.equal(
          removeCollections.payload.removeItemsIds.length,
          1,
          "only 1 collection should be removed"
        );
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Transfer house to new collection creating a junk collection which should also contain the hotel`, async () => {
        let thisPersonId = player2Id;
        let thisPerson = player2Con;
        let subject = "MY_TURN";
        let action = "TRANSFER_SET_AUGMENT_TO_NEW_COLLECTION_FROM_COLLECTION";

        let fromCollectionId = 1;
        let expectedJunkCollection = 5;
        let houseCardId = 103;
        let hotelCardId = 105;

        let responses = await thisPerson.emitSingleRequest(
          subject,
          action,
          defaultProps(roomCode, {
            fromCollectionId,
            cardId: houseCardId,
          })
        );

        let confirm = responses.find(
          (r) => r.subject === subject && r.action === action
        );
        assert.equal(confirm.status, "success", "confirm action was sucessfull");

        let collections = responses.find(
          (r) => r.subject === "COLLECTIONS" && r.action === "GET_KEYED"
        );
        assert.exists(
          collections.payload.items[fromCollectionId],
          "old collection still exists"
        );
        assert.notInclude(
          collections.payload.items[fromCollectionId].cardIds,
          houseCardId,
          "moved card is no longer in from collection"
        );
        assert.notInclude(
          collections.payload.items[fromCollectionId].cardIds,
          hotelCardId,
          "the hotel card should also be removed since dependency not satisfied"
        );

        assert.exists(
          collections.payload.items[expectedJunkCollection],
          "new collection exists"
        );
        assert.equal(
          collections.payload.items[expectedJunkCollection].propertySetKey,
          constants.USELESS_PROPERTY_SET_KEY,
          "new collection is indeed junk collection"
        );
        assert.include(
          collections.payload.items[expectedJunkCollection].cardIds,
          houseCardId,
          "card is now in new collection"
        );
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Transfer Hotel from the junk set an to empty set, should remain in same set`, async () => {
        let thisPersonId = player2Id;
        let thisPerson = player2Con;
        let subject = "MY_TURN";
        let action = "TRANSFER_SET_AUGMENT_TO_NEW_COLLECTION_FROM_COLLECTION";

        let fromCollectionId = 5;
        let expectedJunkCollection = 5;
        let cardId = 103;

        let responses = await thisPerson.emitSingleRequest(
          subject,
          action,
          defaultProps(roomCode, {
            fromCollectionId,
            cardId,
          })
        );

        let confirm = responses.find(
          (r) => r.subject === subject && r.action === action
        );
        assert.equal(confirm.status, "success", "confirm action was sucessfull");

        let collections = responses.find(
          (r) => r.subject === "COLLECTIONS" && r.action === "GET_KEYED"
        );
        assert.exists(
          collections.payload.items[fromCollectionId],
          "old collection still exists"
        );
        if (fromCollectionId !== expectedJunkCollection) {
          assert.notInclude(
            collections.payload.items[fromCollectionId].cardIds,
            cardId,
            "moved card is no longer in from collection"
          );
        }
        assert.exists(
          collections.payload.items[expectedJunkCollection],
          "previous junk colelction still exists"
        );
        assert.equal(
          collections.payload.items[expectedJunkCollection].propertySetKey,
          constants.USELESS_PROPERTY_SET_KEY,
          "junk collection still exists"
        );
        assert.include(
          collections.payload.items[expectedJunkCollection].cardIds,
          cardId,
          "card is now in new collection"
        );
      });

    // Finish Turn
    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} finishes turn`, async () => {
        let thisPersonId = player2Id;
        let thisPerson = player2Con;
        let nextPersonId = getNextPlayerId(thisPersonId);
        let responses = await thisPerson.emitSingleRequest(
          "MY_TURN",
          "FINISH_TURN",
          defaultProps(roomCode)
        ); 

        let confirm = responses.find(
          (r) => r.subject === "MY_TURN" && r.action === "FINISH_TURN"
        );
        assert.equal(confirm.status, "success", "Confirm action success");

        let currentTurn = responses.find(
          (r) => r.subject === "PLAYER_TURN" && r.action === "GET"
        );
        assert.exists(confirm, "Confirm message exists");
        checks.currentTurnCheck({
          data: currentTurn,
          phase: "draw",
          actionCount: 0,
          actionLimit: 3,
          playerTurnId: nextPersonId,
        });
      });

    // Player 1 Turn
    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} - Turn starting draw`, async () => {
        runningDrawPileSize -= 2;
        let thisPersonId = player1Id;
        let thisPerson = player1Con;

        let responses = await thisPerson.emitSingleRequest(
          "MY_TURN",
          "TURN_STARTING_DRAW",
          defaultProps(roomCode)
        );
        checks.handleTurnStartingDrawCheck({
          responses,
          personId: thisPersonId,
          handSize: 9,
          drawPileSize: runningDrawPileSize,
        });
      });

    // Attempt to Finish Turn
    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} - attempts to finish turn with 9 cards; should fail and move to discard phase`, async () => {
        let thisPersonId = player1Id;
        let thisPerson = player1Con;
        let expectedDiscardNum = 2;

        let responses = await thisPerson.emitSingleRequest(
          "MY_TURN",
          "FINISH_TURN",
          defaultProps(roomCode)
        );

        let confirm = responses.find(
          (r) => r.subject === "MY_TURN" && r.action === "FINISH_TURN"
        );
        assert.equal(
          confirm.status,
          "failure",
          "should not allow to proceed to next turn"
        );
        assert.equal();

        let currentTurn = responses.find(
          (r) => r.subject === "PLAYER_TURN" && r.action === "GET"
        );
        assert.equal(
          currentTurn.payload.phaseData.remainingCountToDiscard,
          expectedDiscardNum,
          "amount remaining to discount should be updated"
        );
        checks.currentTurnCheck({
          data: currentTurn,
          phase: "discard",
          actionCount: 0,
          actionLimit: 3,
          playerTurnId: thisPersonId,
        });
      });

    // Discard 1/2 cards
    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} - only discard 1/2 cards; should update the remaining qty`, async () => {
        let thisPersonId = player1Id;
        let thisPerson = player1Con;
        let expectedDiscardNum = 1;
        let cardIds = [89];
        let subject = "MY_TURN";
        let action = "DISCARD_REMAINING";

        let responses = await thisPerson.emitSingleRequest(
          subject,
          action,
          defaultProps(roomCode, { cardIds })
        );

        let confirm = responses.find(
          (r) => r.subject === subject && r.action === action
        );
        assert.equal(
          confirm.status,
          "discard",
          "should let you know your not done"
        );

        let playerHands = responses.find(
          (r) => r.subject === "PLAYER_HANDS" && r.action === "GET_KEYED"
        );
        checks.handCheck({
          handSize: 8,
          data: playerHands,
          personId: thisPersonId,
          excludeCardIds: [89],
        });

        let currentTurn = responses.find(
          (r) => r.subject === "PLAYER_TURN" && r.action === "GET"
        );
        assert.equal(
          currentTurn.payload.phaseData.remainingCountToDiscard,
          expectedDiscardNum,
          "amount remaining to discount should be updated"
        );
        checks.currentTurnCheck({
          data: currentTurn,
          phase: "discard",
          actionCount: 0,
          actionLimit: 3,
          playerTurnId: thisPersonId,
        });
      });

    // Discard too many cards
    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} - discard too many cards remaining, turn should be finished`, async () => {
        let thisPersonId = player1Id;
        let thisPerson = player1Con;
        let nextPersonId = getNextPlayerId(thisPersonId);
        let cardIds = [90, 100];
        let subject = "MY_TURN";
        let action = "DISCARD_REMAINING";

        let responses = await thisPerson.emitSingleRequest(
          subject,
          action,
          defaultProps(roomCode, { cardIds })
        );
        //await dumpHand(thisPerson);

        let confirm = responses.find(
          (r) => r.subject === subject && r.action === action
        );
        assert.equal(confirm.status, "success", "should succeed");

        let currentTurn = responses.find(
          (r) => r.subject === "PLAYER_TURN" && r.action === "GET"
        );
        assert.equal(
          currentTurn.payload.phaseData,
          null,
          "Phase data should be removed"
        );
        checks.currentTurnCheck({
          data: currentTurn,
          phase: "done",
          actionCount: 0,
          actionLimit: 3,
          playerTurnId: thisPersonId,
        });

        let playerHands = responses.find(
          (r) => r.subject === "PLAYER_HANDS" && r.action === "GET_KEYED"
        );
        checks.handCheck({
          handSize: 7,
          data: playerHands,
          personId: thisPersonId,
          includeCardIds: [100],
          excludeCardIds: [90],
        });
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} - Finishes turn`, async () => {
        let thisPersonId = player1Id;
        let thisPerson = player1Con;
        let nextPersonId = getNextPlayerId(thisPersonId);
        let responses = await thisPerson.emitSingleRequest(
          "MY_TURN",
          "FINISH_TURN",
          defaultProps(roomCode)
        );

        let confirm = responses.find(
          (r) => r.subject === "MY_TURN" && r.action === "FINISH_TURN"
        );
        assert.equal(confirm.status, "success", "Confirm action success");

        let currentTurn = responses.find(
          (r) => r.subject === "PLAYER_TURN" && r.action === "GET"
        );
        assert.exists(confirm, "Confirm message exists");
        checks.currentTurnCheck({
          data: currentTurn,
          phase: "draw",
          actionCount: 0,
          actionLimit: 3,
          playerTurnId: nextPersonId,
        });
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} - Skip some turns`, async () => {
        let responses;
        responses = await player2Con.emitSingleRequest(
          "MY_TURN",
          "TURN_STARTING_DRAW",
          defaultProps(roomCode)
        );
        runningDrawPileSize -= 2;
        responses = await player2Con.emitSingleRequest(
          "MY_TURN",
          "FINISH_TURN",
          defaultProps(roomCode)
        );
        responses = await player1Con.emitSingleRequest(
          "MY_TURN",
          "TURN_STARTING_DRAW",
          defaultProps(roomCode)
        );
        runningDrawPileSize -= 2;
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} - Transfer _Hotel_ to new collection from _hand_`, async () => {
        let thisPersonId = player1Id;
        let thisPerson = player1Con;
        let expectedCollectionId = 6;
        let subject = "MY_TURN";
        let action = "TRANSFER_SET_AUGMENT_TO_NEW_COLLECTION_FROM_HAND";

        let cardId = 106;
        let responses = await thisPerson.emitSingleRequest(
          subject,
          action,
          defaultProps(roomCode, { cardId })
        );

        let confirm = responses.find(
          (r) => r.subject === subject && r.action === action
        );
        assert.equal(confirm.status, "success", "confirm action was sucessfull");

        let collections = responses.find(
          (r) => r.subject === "COLLECTIONS" && r.action === "GET_KEYED"
        );
        assert.exists(
          collections.payload.items[expectedCollectionId],
          "Expected collection exists"
        );
        let collection = collections.payload.items[expectedCollectionId];
        assert.equal(
          collection.propertySetKey,
          constants.USELESS_PROPERTY_SET_KEY,
          "is junk collection"
        );
        assert.include(
          collection.cardIds,
          cardId,
          "card exists in junk collection"
        );

        let playerHands = responses.find(
          (r) => r.subject === "PLAYER_HANDS" && r.action === "GET_KEYED"
        );
        assert.exists(playerHands, "hand data exists");
        checks.handCheck({
          handSize: 8,
          data: playerHands,
          personId: thisPersonId,
          excludeCardIds: [106],
        });
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} - Skip ahead`, async () => {
        let responses;
        let confirm;

        responses = await skipTurn(player1Con, roomCode, player1Id);

        responses = await player2Con.emitSingleRequest(
          "MY_TURN",
          "TURN_STARTING_DRAW",
          defaultProps(roomCode)
        );
        responses = await skipTurn(player2Con, roomCode, player2Id);

        responses = await player1Con.emitSingleRequest(
          "MY_TURN",
          "TURN_STARTING_DRAW",
          defaultProps(roomCode)
        );
        responses = await skipTurn(player1Con, roomCode, player1Id);

        responses = await player2Con.emitSingleRequest(
          "MY_TURN",
          "TURN_STARTING_DRAW",
          defaultProps(roomCode)
        );
        responses = await skipTurn(player2Con, roomCode, player2Id);
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} Add action card to bank in DrawPhase - should fail`, async () => {
        let thisPerson = player1Con;
        let subject = "MY_TURN";
        let action = "ADD_CARD_TO_MY_BANK_FROM_HAND";
        let cardId = 104;

        let responses = await thisPerson.emitSingleRequest(
          subject,
          action,
          defaultProps(roomCode, { cardId })
        );
        let confirm = responses.find(
          (r) => r.subject === subject && r.action === action
        );
        assert.equal(confirm.status, "failure", "confirm action was sucessfull");
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} Add action card to bank during action phase should succeed`, async () => {
        let thisPersonId = player1Id;
        let thisPerson = player1Con;
        let subject = "MY_TURN";
        let action = "ADD_CARD_TO_MY_BANK_FROM_HAND";
        let cardId = 104;

        let responses;

        responses = await player1Con.emitSingleRequest(
          "MY_TURN",
          "TURN_STARTING_DRAW",
          defaultProps(roomCode)
        );
        responses = await thisPerson.emitSingleRequest(
          subject,
          action,
          defaultProps(roomCode, { cardId })
        );
        let confirm = responses.find(
          (r) => r.subject === subject && r.action === action
        );
        assert.equal(confirm.status, "success", "confirm action was sucessfull");

        let playerHands = responses.find(
          (r) => r.subject === "PLAYER_HANDS" && r.action === "GET_KEYED"
        );
        assert.exists(playerHands, "hand data exists");
        checks.handCheck({
          handSize: 8,
          data: playerHands,
          personId: thisPersonId,
          excludeCardIds: [cardId],
        });

        let playerBanks = responses.find(
          (r) => r.subject === "PLAYER_BANKS" && r.action === "GET_KEYED"
        );
        assert.exists(playerBanks, "player banks exists");
        assert.exists(
          playerBanks.payload.items[thisPersonId],
          "this player has bank"
        );
        let bank = playerBanks.payload.items[thisPersonId];
        assert.include(bank.cardIds, cardId, "player banks exists");
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} Skip until we find a wild card`, async () => {
        let thisPersonId = player1Id;
        let connection = player1Con;

        let searchForCardId = 73;

        let responses;
        [connection, thisPersonId] = [player1Con, player1Id];
        responses = await skipTurn(connection, roomCode, thisPersonId);

        [connection, thisPersonId] = [player2Con, player2Id];
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "TURN_STARTING_DRAW",
          defaultProps(roomCode)
        );
        responses = await skipTurn(connection, roomCode, thisPersonId);

        [connection, thisPersonId] = [player1Con, player1Id];
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "TURN_STARTING_DRAW",
          defaultProps(roomCode)
        );
        //responses = await skipTurn(connection, roomCode, thisPersonId);

        let playerHands = responses.find(
          (r) => r.subject === "PLAYER_HANDS" && r.action === "GET_KEYED"
        );
        assert.include(
          playerHands.payload.items[thisPersonId].cardIds,
          searchForCardId,
          "Desired card found"
        );
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} Attemt to flip wild card to colour not from set, should fail`, async () => {
        let responses;
        let [subject, action] = [null, null];
        let [connection, thisPersonId] = [player1Con, player1Id];

        let cardId = 73;
        let chosenSetKey = "green";

        [subject, action] = ["MY_TURN", "CHANGE_CARD_ACTIVE_SET"];
        responses = await connection.emitSingleRequest(
          subject,
          action,
          defaultProps(roomCode, { cardId, chosenSetKey })
        );

        [subject, action] = ["MY_TURN", "CHANGE_CARD_ACTIVE_SET"];
        let playerHands = responses.find(
          (r) => r.subject === subject && r.action === action
        );
        assert.equal(playerHands.status, "failure", "Confirm action status");

        [subject, action] = ["CARDS", "GET_KEYED"];
        let cardDefns = responses.find(
          (r) => r.subject === subject && r.action === action
        );
        assert.notExists(cardDefns, "card data should not be changed");
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} Attemt to flip wild card to different colour`, async () => {
        let responses;
        let [subject, action] = [null, null];

        let cardId = 73;
        let chosenSetKey = "purple";

        [subject, action] = ["MY_TURN", "CHANGE_CARD_ACTIVE_SET"];
        responses = await player1Con.emitSingleRequest(
          subject,
          action,
          defaultProps(roomCode, { cardId, chosenSetKey })
        );
        checks.handleChangeWildCardSetInHandCheck({
          responses,
          cardId,
          chosenSetKey,
        });
      });
    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} Play Orange/Purple wildcard #73 to new col #7 as purple`, async () => {
        let [connection, thisPersonId] = [player1Con, player1Id];

        //await dumpHand(connection);
        let expectedTurnPhase = "action";
        let expectedActionCount = 1;
        let expectedPropertyCount = 1;
        let exprectedCollectionId = 7;
        let expectedHandCount = 8;
        let cardId = 73;
        let cardPropertySetKey = "purple";

        let responses = await connection.emitSingleRequest(
          "MY_TURN",
          "ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND",
          defaultProps(roomCode, { cardId })
        );
        checks.expectedAddPropertyToNewCollectionFromHandCheck({
          responses,
          thisPersonId,
          expectedHandCount,
          expectedTurnPhase,
          expectedActionCount,
          expectedPropertyCount,
          exprectedCollectionId,
          cardId,
          cardPropertySetKey,
        });
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} Change only card #73 (wild orange/purple) in collection #7 from purple to orange; should change set to orange`, async () => {
        let connection = player1Con;
        let otherPersonConnection = player2Con;

        let chosenSetKey = "orange";
        let [subject, action] = ["MY_TURN", "CHANGE_CARD_ACTIVE_SET"];

        let exprectedCollectionId = 7;
        let cardId = 73;
        let otherPersonCardUpdatePromise = new Promise((resolve) =>
          otherPersonConnection.listnerTree.once(["CARDS", "GET_KEYED"], resolve)
        );
        let otherPersonCollectionUpdatePromise = new Promise((resolve) =>
          otherPersonConnection.listnerTree.once(
            ["COLLECTIONS", "GET_KEYED"],
            resolve
          )
        );

        let responses = await connection.emitSingleRequest(
          subject,
          action,
          defaultProps(roomCode, {
            cardId,
            chosenSetKey,
            collectionId: exprectedCollectionId,
          })
        );

        // Changes for me
        if (1) {
          checks.handleChangeWildCardSetInHandCheck({
            responses,
            cardId,
            chosenSetKey,
          });

          // Collection should be converted from purple to orange
          let collections = responses.find(
            (r) => r.subject === "COLLECTIONS" && r.action === "GET_KEYED"
          );
          assert.equal(
            collections.payload.items[exprectedCollectionId].propertySetKey,
            chosenSetKey,
            "Collection was sucessfully converted to orange"
          );

          // card should be converted from purple to orange
          let cardsUpdate = responses.find(
            (r) => r.subject === "CARDS" && r.action === "GET_KEYED"
          );
          assert.equal(
            cardsUpdate.payload.items[cardId].set,
            chosenSetKey,
            "card is now orange"
          );
        }

        // Changes for other people
        if (1) {
          let otherPersonCards = await otherPersonCardUpdatePromise;

          // other player should see updated card
          assert.equal(
            otherPersonCards.payload.items[cardId].set,
            chosenSetKey,
            "Card should be converted to orange for other people"
          );

          let otherPersonCollections = await otherPersonCollectionUpdatePromise;
          assert.equal(
            otherPersonCollections.payload.items[exprectedCollectionId]
              .propertySetKey,
            chosenSetKey,
            "Collection was sucessfully converted to orange for other people"
          );
        }
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - Skip to super-wild-card `, async () => {
        let connection, thisPersonId;
        [connection, thisPersonId] = [player1Con, player1Id];

        // Let otherPersonConnection = player2Con;
        let responses;
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND",
          defaultProps(roomCode, { cardId: 94 })
        );
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND",
          defaultProps(roomCode, { collectionId: 8, cardId: 93 })
        );
        responses = await skipTurn(connection, roomCode, thisPersonId);

        [connection, thisPersonId] = [player2Con, player2Id];
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "TURN_STARTING_DRAW",
          defaultProps(roomCode)
        );
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND",
          defaultProps(roomCode, { cardId: 87 })
        );
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND",
          defaultProps(roomCode, { collectionId: 9, cardId: 72 })
        );
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND",
          defaultProps(roomCode, { cardId: 92 })
        );
        responses = await skipTurn(connection, roomCode, thisPersonId);

        [connection, thisPersonId] = [player1Con, player1Id];
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "TURN_STARTING_DRAW",
          defaultProps(roomCode)
        );
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND",
          defaultProps(roomCode, { collectionId: 7, cardId: 86 })
        );
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND",
          defaultProps(roomCode, { cardId: 100 })
        );
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND",
          defaultProps(roomCode, { cardId: 98 })
        );
        responses = await skipTurn(connection, roomCode, thisPersonId);

        [connection, thisPersonId] = [player2Con, player2Id];
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "TURN_STARTING_DRAW",
          defaultProps(roomCode)
        );
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND",
          defaultProps(roomCode, { cardId: 101 })
        );
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND",
          defaultProps(roomCode, { cardId: 71 })
        );
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND",
          defaultProps(roomCode, { cardId: 84 })
        );
        responses = await skipTurn(connection, roomCode, thisPersonId);

        [connection, thisPersonId] = [player1Con, player1Id];
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "TURN_STARTING_DRAW",
          defaultProps(roomCode)
        );
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND",
          defaultProps(roomCode, { cardId: 66 })
        );
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND",
          defaultProps(roomCode, { collectionId: 16, cardId: 65 })
        );

        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "CHANGE_CARD_ACTIVE_SET",
          defaultProps(roomCode, { cardId: 70, chosenSetKey: "black" })
        );
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "CHANGE_CARD_ACTIVE_SET",
          defaultProps(roomCode, { cardId: 69, chosenSetKey: "black" })
        );
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND",
          defaultProps(roomCode, { cardId: 70 })
        );
        responses = await skipTurn(connection, roomCode, thisPersonId);

        [connection, thisPersonId] = [player2Con, player2Id];
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "TURN_STARTING_DRAW",
          defaultProps(roomCode)
        );

        //await dumpHand(connection);
        //let chosenSetKey = "orange";
        //let [subject, action] = ["MY_TURN", "CHANGE_CARD_ACTIVE_SET"];
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - Play super-wild-card to new collection`, async () => {
        let connection, thisPersonId;
        [connection, thisPersonId] = [player2Con, player2Id];
        let expectedCollectionId = 18;
        let cardId = 63;

        let responses;
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND",
          defaultProps(roomCode, { cardId })
        );
        //responses = await connection.emitSingleRequest("MY_TURN", "ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND", defaultProps(roomCode, { cardId: 63 }));

        let confirm = responses.find(
          (r) =>
            r.subject === "MY_TURN" &&
            r.action === "ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND"
        );
        assert.equal(confirm.status, "success", "action should succeed");

        let collections = responses.find(
          (r) => r.subject === "COLLECTIONS" && r.action === "GET_KEYED"
        );
        assert.include(
          collections.payload.items[expectedCollectionId].cardIds,
          cardId,
          "Card is in set"
        );
        assert.equal(
          collections.payload.items[expectedCollectionId].propertySetKey,
          constants.AMBIGUOUS_SET_KEY,
          "Set key is as expected"
        );
        assert.equal(
          collections.payload.items[expectedCollectionId].isFullSet,
          false,
          "set should not be full"
        );
        assert.equal(
          collections.payload.items[expectedCollectionId].propertyCount,
          1,
          "property count should be 1"
        );
      });

    //  if (++testNumber < executeUnill)
    //    it(`${testNumber} - Play another super-wild to existing ambigious collection`, async () => {
    //      let connection, thisPersonId;
    //      [connection, thisPersonId] = [player2Con, player2Id];
    //      let cardId = 64;
    //
    //      let responses;
    //      responses = await connection.emitSingleRequest("MY_TURN", "ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND", defaultProps(roomCode, { cardId }));
    //      jsonLog(responses);
    //      let confirm = responses.find(r => r.subject === "MY_TURN" && r.action === "ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND");
    //      assert.equal(confirm.status, "success", "action should succeed");
    //    });
    //  executeUnill = 0;

    //if (++testNumber < executeUnill)
    //  it(`${testNumber} - Play another super-wild to existing concreet collection`, async () => {
    //   let connection, thisPersonId;
    //   [connection, thisPersonId] = [player2Con, player2Id];
    //   let expectedCollectionId = 10;
    //   let cardId = 64;

    //   let responses;
    //   responses = await connection.emitSingleRequest("MY_TURN", "ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND", defaultProps(roomCode, { collectionId: expectedCollectionId, cardId }));
    //   //await dumpPlayerCollections(connection, thisPersonId);

    //   let confirm = responses.find(r => r.subject === "MY_TURN" && r.action === "ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND");
    //   assert.equal(confirm.status, "success", "action should succeed");

    //   let collections = responses.find(r => r.subject === "COLLECTIONS" && r.action === "GET_KEYED");
    //   assert.include(collections.payload.items[expectedCollectionId].cardIds, cardId, "Card is in set");
    //   assert.equal(collections.payload.items[expectedCollectionId].propertySetKey, "purple", "Set key is as expected");
    //   assert.equal(collections.payload.items[expectedCollectionId].isFullSet, false, "set should not be full");
    //   assert.equal(collections.payload.items[expectedCollectionId].propertyCount, 2, "property count should be 2");
    //  });
    //executeUnill = 0;

    if (++testNumber < executeUnill)
      it(`${testNumber} - Play another super-wild to existing ambigious collection`, async () => {
        let connection, thisPersonId;
        [connection, thisPersonId] = [player2Con, player2Id];
        let expectedCollectionId = 18;
        let cardId = 64;

        let responses;
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND",
          defaultProps(roomCode, { collectionId: expectedCollectionId, cardId })
        );
        //responses = await connection.emitSingleRequest("MY_TURN", "ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND", defaultProps(roomCode, { cardId: 63 }));

        let confirm = responses.find(
          (r) =>
            r.subject === "MY_TURN" &&
            r.action === "ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND"
        );
        assert.equal(confirm.status, "success", "action should succeed");

        let collections = responses.find(
          (r) => r.subject === "COLLECTIONS" && r.action === "GET_KEYED"
        );
        assert.include(
          collections.payload.items[expectedCollectionId].cardIds,
          cardId,
          "Card is in set"
        );
        assert.equal(
          collections.payload.items[expectedCollectionId].propertySetKey,
          constants.AMBIGUOUS_SET_KEY,
          "Set key is as expected"
        );
        assert.equal(
          collections.payload.items[expectedCollectionId].isFullSet,
          false,
          "set should not be full"
        );
        assert.equal(
          collections.payload.items[expectedCollectionId].propertyCount,
          2,
          "property count should be 2"
        );
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - Play a blue onto a collection of 2 wild cards - should fail`, async () => {
        let connection, thisPersonId;
        [connection, thisPersonId] = [player2Con, player2Id];
        let expectedCollectionId = 18;
        let cardId = 67;
        let switchCardToSetKey = "blue";
        let expectedSetKey = constants.AMBIGUOUS_SET_KEY;
        let expectedPropertyCount = 2;

        let responses, confirm;

        // Change the card to blue and attempt to add to a set with 2 super wilds - should fail
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "CHANGE_CARD_ACTIVE_SET",
          defaultProps(roomCode, { cardId, chosenSetKey: switchCardToSetKey })
        );
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND",
          defaultProps(roomCode, { collectionId: expectedCollectionId, cardId })
        );
        confirm = responses.find(
          (r) =>
            r.subject === "MY_TURN" &&
            r.action === "ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND"
        );
        assert.equal(confirm.status, "failure", "action should fail");

        // Fetch the collecitons to confirm
        responses = await connection.emitSingleRequest(
          "COLLECTIONS",
          "GET_KEYED",
          defaultProps(roomCode, { collectionId: expectedCollectionId })
        );
        let collections = responses.find(
          (r) => r.subject === "COLLECTIONS" && r.action === "GET_KEYED"
        );
        assert.equal(
          collections.payload.items[expectedCollectionId].propertySetKey,
          expectedSetKey,
          "property set reamins the same"
        );
        assert.equal(
          collections.payload.items[expectedCollectionId].propertyCount,
          expectedPropertyCount,
          "property count is as expected"
        );
        assert.equal(
          collections.payload.items[expectedCollectionId].isFullSet,
          false,
          "is still not a complete set"
        );
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - Play green card #67 onto col #18 of 2 wild cards - should succeed`, async () => {
        let connection, thisPersonId;
        let responses, confirm;
        [connection, thisPersonId] = [player2Con, player2Id];
        let expectedCollectionId = 18;
        let cardId = 67;
        let switchCardToSetKey = "green";
        let expectedSetKey = "green";
        let expectedPropertyCount = 3;

        // Change the card to blue and attempt to add to a set with 2 super wilds - should fail
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "CHANGE_CARD_ACTIVE_SET",
          defaultProps(roomCode, { cardId, chosenSetKey: switchCardToSetKey })
        );
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND",
          defaultProps(roomCode, { collectionId: expectedCollectionId, cardId })
        );
        confirm = responses.find(
          (r) =>
            r.subject === "MY_TURN" &&
            r.action === "ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND"
        );
        assert.equal(confirm.status, "success", "action should succeed");

        // Fetch the collecitons to confirm
        let collections = responses.find(
          (r) => r.subject === "COLLECTIONS" && r.action === "GET_KEYED"
        );
        assert.equal(
          collections.payload.items[expectedCollectionId].propertySetKey,
          expectedSetKey,
          "property set was switched to green"
        );
        assert.equal(
          collections.payload.items[expectedCollectionId].propertyCount,
          expectedPropertyCount,
          "property count is as expected"
        );
        assert.equal(
          collections.payload.items[expectedCollectionId].isFullSet,
          true,
          "is a complete set"
        );
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - Transfer set augments onto green wild set - should succeed`, async () => {
        let connection, thisPersonId;
        let responses, confirm;
        [connection, thisPersonId] = [player2Con, player2Id];

        let fromCollectionId = 5;
        let toCollectionId = 18;
        let houseCard = 103;
        let hotelCard = 105;

        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "TRANSFER_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_COLLECTION",
          defaultProps(roomCode, {
            cardId: houseCard,
            fromCollectionId,
            toCollectionId,
          })
        );
        confirm = responses.find(
          (r) =>
            r.subject === "MY_TURN" &&
            r.action ===
              "TRANSFER_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_COLLECTION"
        );
        assert.equal(confirm.status, "success", "confirm transfer of card");

        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "TRANSFER_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_COLLECTION",
          defaultProps(roomCode, {
            cardId: hotelCard,
            fromCollectionId,
            toCollectionId,
          })
        );
        confirm = responses.find(
          (r) =>
            r.subject === "MY_TURN" &&
            r.action ===
              "TRANSFER_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_COLLECTION"
        );
        assert.equal(confirm.status, "success", "confirm transfer of card");
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - Remove the green from the wildcard set - should revert to being ambigious`, async () => {
        let connection, thisPersonId;
        let responses, confirm;
        [connection, thisPersonId] = [player2Con, player2Id];

        let cardId = 67;
        let fromCollectionId = 18;
        let toCollectionId = 19;
        let newJunkCollection = 20;
        let houseCard = 103;
        let hotelCard = 105;
        let expectedFromCollectionKey = constants.AMBIGUOUS_SET_KEY;
        let expectedToCollectionKey = "green";

        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "TRANSFER_PROPERTY_TO_NEW_COLLECTION_FROM_COLLECTION",
          defaultProps(roomCode, {
            cardId,
            fromCollectionId,
            toCollectionId,
          })
        );
        confirm = responses.find(
          (r) =>
            r.subject === "MY_TURN" &&
            r.action === "TRANSFER_PROPERTY_TO_NEW_COLLECTION_FROM_COLLECTION"
        );
        assert.equal(confirm.status, "success", "Confirm action success");

        let collections = responses.find(
          (r) => r.subject === "COLLECTIONS" && r.action === "GET_KEYED"
        );
        assert.equal(
          collections.payload.items[fromCollectionId].propertySetKey,
          expectedFromCollectionKey,
          "Collection should revert back to being ambigious"
        );
        assert.equal(
          collections.payload.items[toCollectionId].propertySetKey,
          expectedToCollectionKey,
          "To collection should be as expected"
        );

        assert.equal(
          collections.payload.items[newJunkCollection].propertySetKey,
          constants.USELESS_PROPERTY_SET_KEY,
          "Junk set should be created"
        );
        assert.include(
          collections.payload.items[newJunkCollection].cardIds,
          houseCard,
          "house card moved to junk set"
        );
        assert.include(
          collections.payload.items[newJunkCollection].cardIds,
          hotelCard,
          "hotel card moved to junk set"
        );
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - Move super wild to a purple set`, async () => {
        let connection, thisPersonId;
        let responses, confirm;
        [connection, thisPersonId] = [player2Con, player2Id];

        let cardId = 63;
        let fromCollectionId = 18;
        let toCollectionId = 10;

        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "TRANSFER_PROPERTY_TO_EXISTING_COLLECTION_FROM_COLLECTION",
          defaultProps(roomCode, {
            cardId,
            fromCollectionId,
            toCollectionId,
          })
        );
        confirm = responses.find(
          (r) =>
            r.subject === "MY_TURN" &&
            r.action ===
              "TRANSFER_PROPERTY_TO_EXISTING_COLLECTION_FROM_COLLECTION"
        );
        assert.equal(confirm.status, "success", "Confirm action success");

        let collections = responses.find(
          (r) => r.subject === "COLLECTIONS" && r.action === "GET_KEYED"
        );
        assert.include(
          collections.payload.items[toCollectionId].cardIds,
          cardId,
          "Purple set should contain wild card"
        );
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - Move last super wild to a purple set`, async () => {
        let connection, thisPersonId;
        let responses, confirm;
        [connection, thisPersonId] = [player2Con, player2Id];

        let cardId = 64;
        let fromCollectionId = 18;
        let toCollectionId = 10;

        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "TRANSFER_PROPERTY_TO_EXISTING_COLLECTION_FROM_COLLECTION",
          defaultProps(roomCode, {
            cardId,
            fromCollectionId,
            toCollectionId,
          })
        );
        confirm = responses.find(
          (r) =>
            r.subject === "MY_TURN" &&
            r.action ===
              "TRANSFER_PROPERTY_TO_EXISTING_COLLECTION_FROM_COLLECTION"
        );
        assert.equal(confirm.status, "success", "Confirm action success");

        let collections = responses.find(
          (r) => r.subject === "COLLECTIONS" && r.action === "GET_KEYED"
        );
        assert.include(
          collections.payload.items[toCollectionId].cardIds,
          cardId,
          "Purple set should contain wild card"
        );
        assert.equal(
          collections.payload.items[toCollectionId].isFullSet,
          true,
          "Set should be full"
        );

        let removeCollections = responses.find(
          (r) => r.subject === "COLLECTIONS" && r.action === "REMOVE_KEYED"
        );
        assert.include(
          removeCollections.payload.removeItemsIds,
          fromCollectionId,
          "empty set should be removed"
        );
        responses = await skipTurn(connection, roomCode, thisPersonId);
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - Add action cards to bank`, async () => {
        let connection, thisPersonId;
        let responses, confirm;
        [connection, thisPersonId] = [player1Con, player1Id];

        let cardId, playerTurn, playerBanks, playerHands;

        cardId = 102;
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "TURN_STARTING_DRAW",
          defaultProps(roomCode)
        );
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "ADD_CARD_TO_MY_BANK_FROM_HAND",
          defaultProps(roomCode, { cardId })
        );

        cardId = 62;
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "ADD_CARD_TO_MY_BANK_FROM_HAND",
          defaultProps(roomCode, { cardId })
        );

        //PLAYER_TURN
        playerTurn = responses.find(
          (r) => r.subject === "PLAYER_TURN" && r.action === "GET"
        );
        assert.equal(
          playerTurn.payload.phase,
          "action",
          "should still be action phase"
        );

        playerBanks = responses.find(
          (r) => r.subject === "PLAYER_BANKS" && r.action === "GET_KEYED"
        );
        assert.include(
          playerBanks.payload.items[thisPersonId].cardIds,
          cardId,
          "bank includes card"
        );

        playerHands = responses.find(
          (r) => r.subject === "PLAYER_HANDS" && r.action === "GET_KEYED"
        );
        assert.notInclude(
          playerHands.payload.items[thisPersonId].cardIds,
          cardId,
          "card is no longer in hand"
        );

        cardId = 61;
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "ADD_CARD_TO_MY_BANK_FROM_HAND",
          defaultProps(roomCode, { cardId })
        );
        playerTurn = responses.find(
          (r) => r.subject === "PLAYER_TURN" && r.action === "GET"
        );
        assert.equal(playerTurn.payload.phase, "done", "should be done");

        playerBanks = responses.find(
          (r) => r.subject === "PLAYER_BANKS" && r.action === "GET_KEYED"
        );
        assert.include(
          playerBanks.payload.items[thisPersonId].cardIds,
          cardId,
          "bank includes card"
        );

        playerHands = responses.find(
          (r) => r.subject === "PLAYER_HANDS" && r.action === "GET_KEYED"
        );
        assert.notInclude(
          playerHands.payload.items[thisPersonId].cardIds,
          cardId,
          "card is no longer in hand"
        );
        responses = await skipTurn(connection, roomCode, thisPersonId);
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Request rent for orange set`, async () => {
        let connection, thisPersonId;
        let responses, confirm;
        [connection, thisPersonId] = [player2Con, player2Id];

        //let cardId, playerTurn, playerBanks, playerHands;

        let [otherPlayerCollection, otherPlayerId] = [player1Con, player1Id];
        let otherPlayerRequestPromise = new Promise((resolve, reject) =>
          otherPlayerCollection.listnerTree.once(
            ["REQUESTS", "GET_KEYED_RESULT"],
            resolve
          )
        );

        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "TURN_STARTING_DRAW",
          defaultProps(roomCode)
        );
        let cardId = 59;
        let collectionId = 9; // orange set of 2 cards
        let targetPlayerIds = [player1Id];
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "CHARGE_RENT",
          defaultProps(roomCode, {
            cardId,
            collectionId,
            targetIds: [player1Id],
          })
        );

        confirm = responses.find(
          (r) => r.subject === "MY_TURN" && r.action === "CHARGE_RENT"
        );
        assert.equal(confirm.status, "success", "confirm action succeeded");

        let playerHand = responses.find(
          (r) => r.subject === "PLAYER_HANDS" && r.action === "GET_KEYED"
        );
        assert.notInclude(
          playerHand.payload.items[thisPersonId].cardIds,
          cardId,
          "rent card should no longer be in hand"
        );

        let activePile = responses.find(
          (r) => r.subject === "ACTIVE_PILE" && r.action === "GET"
        );
        assert.include(
          activePile.payload.cardIds,
          cardId,
          "card was found in active pile"
        );

        let currentTurn = responses.find(
          (r) => r.subject === "PLAYER_TURN" && r.action === "GET"
        );
        assert.equal(
          currentTurn.payload.phase,
          "request",
          "phase should be request"
        );
        assert.equal(
          currentTurn.payload.actionCount,
          1,
          "action should be consumed"
        );

        let playerRequests = responses.find(
          (r) => r.subject === "PLAYER_REQUESTS" && r.action === "GET_KEYED"
        );
        let requests = responses.find(
          (r) => r.subject === "REQUESTS" && r.action === "GET_KEYED"
        );

        targetPlayerIds.forEach((targetId) => {
          assert.exists(
            playerRequests.payload.items[targetId],
            "Author should see their requests"
          );
        });
        assert.exists(requests.payload.items[1], "Request should exist");

        // Check data received by other person
        let otherPlayerRequestResponses = await otherPlayerRequestPromise;
        let otherPlayerRequests = otherPlayerRequestResponses.find(
          (r) => r.subject === "REQUESTS" && r.action === "GET_KEYED"
        );
        assert.exists(
          otherPlayerRequests.payload.items[player1Id],
          "other player should see request associated to player"
        );

        let otherRequests = otherPlayerRequestResponses.find(
          (r) => r.subject === "REQUESTS" && r.action === "GET_KEYED"
        );
        assert.exists(
          otherRequests.payload.items[1],
          "other player should see request"
        );
      });
    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Responds to request own request - should fail`, async () => {
        let connection, thisPersonId;
        let responses, confirm;
        [connection, thisPersonId] = [player2Con, player2Id];

        let requestId = 1;
        responses = await connection.emitSingleRequest(
          "RESPONSES",
          "RESPOND_TO_COLLECT_VALUE",
          defaultProps(roomCode, {
            //bank: [],
            requestId: requestId,
            responseKey: "accept",
            payWithProperty: [
              {
                collectionId: 20,
                cardId: 105,
              },
            ],
          })
        );

        confirm = responses.find(
          (r) =>
            r.subject === "RESPONSES" && r.action === "RESPOND_TO_COLLECT_VALUE"
        );
        assert.equal(confirm.status, "failure", "action should fail");
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} - pays request with bank`, async () => {
        let connection, thisPersonId;
        let responses, confirm;
        [connection, thisPersonId] = [player1Con, player1Id];

        let payWithCardId = 102;
        let requestId = 1;

        responses = await connection.emitSingleRequest(
          "RESPONSES",
          "RESPOND_TO_COLLECT_VALUE",
          defaultProps(roomCode, {
            //bank: [],
            requestId: requestId,
            responseKey: "accept",
            payWithBank: [{ cardId: payWithCardId }],
          })
        );

        confirm = responses.find(
          (r) => r.subject === "RESPONSES" && r.action === "RESPOND_TO_COLLECT_VALUE"
        );
        assert.equal(confirm.status, "success", "action should succeed");

        let playerBank = responses.find(
          (r) => r.subject === "PLAYER_BANKS" && r.action === "GET_KEYED"
        );
        assert.exists(playerBank.payload.items[thisPersonId], "player bank has been sent");
        assert.notInclude(
          playerBank.payload.items[thisPersonId].cardIds,
          payWithCardId,
          "payment card is not longer in bank"
        );

        let request = responses.find(
          (r) => r.subject === "REQUESTS" && r.action === "GET_KEYED"
        );

        assert.include(
          request.payload.items[requestId].payload.transaction.items.toAuthor.items.bank.items,
          payWithCardId,
          "card is flagged to be transfered to author"
        );
      });

    //collects rent to bank`
    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - collects rent to bank`, async () => {
        let connection, thisPersonId;
        let responses, confirm;
        [connection, thisPersonId] = [player2Con, player2Id];

        let requestId = 1;
        let payWithCardId = 102;

        responses = await connection.emitSingleRequest(
          "RESPONSES",
          "COLLECT_CARD_TO_BANK_AUTO",
          defaultProps(roomCode, {
            requestId: requestId,
          })
        );

        confirm = responses.find(
          (r) =>
            r.subject === "RESPONSES" && r.action === "COLLECT_CARD_TO_BANK_AUTO"
        );
        assert.equal(confirm.status, "success", "action should succeed");

        let playerBank = responses.find(
          (r) => r.subject === "PLAYER_BANKS" && r.action === "GET_KEYED"
        );
        assert.include(
          playerBank.payload.items[thisPersonId].cardIds,
          payWithCardId,
          "payment card should be in the bank"
        );

        let request = responses.find(
          (r) => r.subject === "REQUESTS" && r.action === "GET_KEYED"
        );
        assert.equal(
          request.payload.items[requestId].payload.transaction.isComplete,
          true,
          "should be fully collected"
        );
        assert.equal(
          request.payload.items[requestId].isClosed,
          true,
          "request should be clsoed"
        );

        let currentTurn = responses.find(
          (r) => r.subject === "PLAYER_TURN" && r.action === "GET"
        );
        assert.equal(
          currentTurn.payload.phase,
          "action",
          "should return to action phase"
        );
        assert.equal(
          currentTurn.payload.actionCount,
          1,
          "1 action should have been used"
        );
        assert.equal(
          currentTurn.payload.playerKey,
          thisPersonId,
          "Should still be the same turn"
        );

        //responses = await skipTurn(connection, roomCode, thisPersonId);
        //await dumpHand(connection)
        //await dumpPlayerCollections(connection, thisPersonId)
        //await dumpCurrentTurn(connection)
        //await dumpPlayerBank(connection, thisPersonId)
      });

    //Charge rent again
    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Charge rent again`, async () => {
        let connection, thisPersonId;
        let responses, confirm;
        [connection, thisPersonId] = [player2Con, player2Id];

        let actionCount = 2;
        let requestId = 2;
        let cardId = 60;
        let collectionId = 9; // orange set of 2 cards
        let targetPlayerIds = [player1Id];
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "CHARGE_RENT",
          defaultProps(roomCode, {
            cardId,
            collectionId,
            targetIds: [player1Id],
          })
        );

        confirm = responses.find(
          (r) => r.subject === "MY_TURN" && r.action === "CHARGE_RENT"
        );
        assert.equal(confirm.status, "success", "confirm action succeeded");

        let playerHand = responses.find(
          (r) => r.subject === "PLAYER_HANDS" && r.action === "GET_KEYED"
        );
        assert.notInclude(
          playerHand.payload.items[thisPersonId].cardIds,
          cardId,
          "rent card should no longer be in hand"
        );

        let activePile = responses.find(
          (r) => r.subject === "ACTIVE_PILE" && r.action === "GET"
        );
        assert.include(
          activePile.payload.cardIds,
          cardId,
          "card was found in active pile"
        );

        let currentTurn = responses.find(
          (r) => r.subject === "PLAYER_TURN" && r.action === "GET"
        );
        assert.equal(
          currentTurn.payload.phase,
          "request",
          "phase should be request"
        );
        assert.equal(
          currentTurn.payload.actionCount,
          actionCount,
          "action should be consumed"
        );

        let playerRequests = responses.find(
          (r) => r.subject === "PLAYER_REQUESTS" && r.action === "GET_KEYED"
        );
        let requests = responses.find(
          (r) => r.subject === "REQUESTS" && r.action === "GET_KEYED"
        );
        targetPlayerIds.forEach((targetId) => {
          assert.exists(
            playerRequests.payload.items[targetId],
            "Author should see their requests"
          );
        });
        assert.exists(requests.payload.items[requestId], "Request should exist");
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} - pays request with property`, async () => {
        let connection, thisPersonId;
        let responses, confirm;
        [connection, thisPersonId] = [player1Con, player1Id];

        if (1) {
          let payWithCardId = 106;
          let payFromCollectionId = 6;
          let requestId = 2;

          responses = await connection.emitSingleRequest(
            "RESPONSES",
            "RESPOND_TO_COLLECT_VALUE",
            defaultProps(roomCode, {
              //bank: [],
              requestId: requestId,
              responseKey: "accept",
              payWithProperty: [
                {
                  collectionId: payFromCollectionId,
                  cardId: payWithCardId,
                },
              ],
            })
          );

          confirm = responses.find(
            (r) =>
              r.subject === "RESPONSES" && r.action === "RESPOND_TO_COLLECT_VALUE"
          );
          assert.equal(confirm.status, "success", "action should succeed");

          let request = responses.find(
            (r) => r.subject === "REQUESTS" && r.action === "GET_KEYED"
          );
          assert.include(
            request.payload.items[requestId].payload.transaction.items.toAuthor
              .items.property.items,
            payWithCardId,
            "card is flagged to be transfered to author"
          );
        }
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} - Accept properties from request`, async () => {
        let connection, thisPersonId;
        let responses, confirm;
        [connection, thisPersonId] = [player2Con, player2Id];

        //await dumpPlayerCollections(connection, thisPersonId)

        let requestId = 2;
        let cardId = 106;
        let collectionId = 20;
        let actionCount = 2;
        responses = await connection.emitSingleRequest(
          "RESPONSES",
          "COLLECT_CARD_TO_COLLECTION",
          defaultProps(roomCode, {
            requestId: requestId,
            cardId,
            collectionId: collectionId,
          })
        );

        confirm = responses.find(
          (r) =>
            r.subject === "RESPONSES" && r.action === "COLLECT_CARD_TO_COLLECTION"
        );
        assert.equal(confirm.status, "success", "action should succeed");

        let currentTurn = responses.find(
          (r) => r.subject === "PLAYER_TURN" && r.action === "GET"
        );
        assert.equal(
          currentTurn.payload.phase,
          "action",
          "should return to action phase"
        );
        assert.equal(
          currentTurn.payload.actionCount,
          actionCount,
          "1 action should have been used"
        );
        assert.equal(
          currentTurn.payload.playerKey,
          thisPersonId,
          "Should still be the same turn"
        );

        let request = responses.find(
          (r) => r.subject === "REQUESTS" && r.action === "GET_KEYED"
        );
        assert.equal(
          request.payload.items[requestId].payload.transaction.isComplete,
          true,
          "should be fully collected"
        );
        assert.equal(
          request.payload.items[requestId].isClosed,
          true,
          "request should be clsoed"
        );

        let collections = responses.find(
          (r) => r.subject === "COLLECTIONS" && r.action === "GET_KEYED"
        );
        assert.include(
          collections.payload.items[collectionId].cardIds,
          cardId,
          "card appears in expected set"
        );
        responses = await skipTurn(connection, roomCode, thisPersonId);
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} - charge rent for black card #58`, async () => {
        let connection, thisPersonId;
        let responses, confirm;
        [connection, thisPersonId] = [player1Con, player1Id];

        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "TURN_STARTING_DRAW",
          defaultProps(roomCode)
        );
        //await dumpHand(connection);
        let actionCount = 1;
        let requestId = 1;
        let collectionId = 17; // black sest
        let cardId = 58; // 57 also same card
        let targetPlayerIds = [player2Id];
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "CHARGE_RENT",
          defaultProps(roomCode, {
            cardId,
            collectionId,
            targetIds: [player2Id],
          })
        );

        confirm = responses.find(
          (r) => r.subject === "MY_TURN" && r.action === "CHARGE_RENT"
        );
        assert.equal(confirm.status, "success", "confirm action succeeded");

        let playerHand = responses.find(
          (r) => r.subject === "PLAYER_HANDS" && r.action === "GET_KEYED"
        );
        assert.notInclude(
          playerHand.payload.items[thisPersonId].cardIds,
          cardId,
          "rent card should no longer be in hand"
        );

        let activePile = responses.find(
          (r) => r.subject === "ACTIVE_PILE" && r.action === "GET"
        );
        assert.include(
          activePile.payload.cardIds,
          cardId,
          "card was found in active pile"
        );

        let currentTurn = responses.find(
          (r) => r.subject === "PLAYER_TURN" && r.action === "GET"
        );
        assert.equal(
          currentTurn.payload.phase,
          "request",
          "phase should be request"
        );
        assert.equal(
          currentTurn.payload.actionCount,
          actionCount,
          "action should be consumed"
        );

        let playerRequests = responses.find(
          (r) => r.subject === "PLAYER_REQUESTS" && r.action === "GET_KEYED"
        );
        let requests = responses.find(
          (r) => r.subject === "REQUESTS" && r.action === "GET_KEYED"
        );
        targetPlayerIds.forEach((targetId) => {
          assert.exists(
            playerRequests.payload.items[targetId],
            "Author should see their requests"
          );
        });
        assert.exists(requests.payload.items[requestId], "Request should exist");
      });

    if (++testNumber < executeUnill) {
      it(`${testNumber} - ${player2Name} - gives a hotel as payment from junk set`, async () => {
        let connection, thisPersonId;
        let responses, confirm;
        [connection, thisPersonId] = [player2Con, player2Id];

        let requestId = 1;
        let cardId = 105;
        let collectionId = 20;

        //await dumpPlayerRequests(connection, thisPersonId);
        let payWithProperty = [
          {
            location: "collection",
            playerId: thisPersonId,
            cardId: cardId,
            collectionId: collectionId,
          },
        ];
        let payWithBank = [];
        let responseKey = "accept";

        responses = await connection.emitSingleRequest(
          "RESPONSES",
          "RESPOND_TO_COLLECT_VALUE",
          defaultProps(roomCode, {
            requestId,
            responseKey,
            payWithBank,
            payWithProperty,
          })
        );
        //await dumpPlayerCollections(connection, thisPersonId);

        let requests = responses.find(
          (r) => r.subject === "REQUESTS" && r.action === "GET_KEYED"
        );
        assert.equal(
          requests.payload.items[requestId].status,
          "accept",
          "request was accepted"
        );
        assert.equal(
          requests.payload.items[requestId].hasTargetSatisfied,
          true,
          "was satisfied from the targets perspective"
        );
        assert.equal(
          requests.payload.items[requestId].payload.transaction.isComplete,
          false,
          "transaction is not complete"
        );
        assert.include(
          requests.payload.items[requestId].payload.transaction.items.toAuthor
            .items.property.items,
          cardId,
          "card is included to be transfered"
        );
        assert.notInclude(
          requests.payload.items[requestId].payload.transaction.items.toAuthor
            .items.property.transfered,
          cardId,
          "but card was not yet transfered"
        );

        let removeCollections = responses.find(
          (r) => r.subject === "COLLECTIONS" && r.action === "REMOVE_KEYED"
        );
        assert.notExists(removeCollections, "no collections are to be removed");

        let collections = responses.find(
          (r) => r.subject === "COLLECTIONS" && r.action === "GET_KEYED"
        );
        assert.exists(
          collections.payload.items[collectionId],
          "collection still exists"
        );
        assert.notInclude(
          collections.payload.items[collectionId].cardIds,
          cardId,
          "card was removed from collection"
        );

        let playerTurn = responses.find(
          (r) => r.subject === "PLAYER_TURN" && r.action === "GET"
        );
        assert.exists(playerTurn, "Player turn is defiend");

        let playerTurnIndex = responses.findIndex(
          (r) => r.subject === "PLAYER_TURN" && r.action === "GET"
        );
        assert.equal(
          playerTurnIndex,
          responses.length - 1,
          "turn update must be the last item in resposne"
        );
      });
    }

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} - collect property to new collection`, async () => {
        let connection, thisPersonId;
        let responses, confirm;
        [connection, thisPersonId] = [player1Con, player1Id];

        //await dumpPlayerCollections(connection, thisPersonId)

        let requestId = 1;
        let cardId = 105;
        let actionCount = 1;
        responses = await connection.emitSingleRequest(
          "RESPONSES",
          "COLLECT_CARD_TO_COLLECTION",
          defaultProps(roomCode, {
            requestId: requestId,
            cardId,
          })
        );

        confirm = responses.find(
          (r) =>
            r.subject === "RESPONSES" && r.action === "COLLECT_CARD_TO_COLLECTION"
        );
        assert.equal(confirm.status, "success", "action should succeed");

        let currentTurn = responses.find(
          (r) => r.subject === "PLAYER_TURN" && r.action === "GET"
        );
        assert.equal(
          currentTurn.payload.phase,
          "action",
          "should return to action phase"
        );
        assert.equal(
          currentTurn.payload.actionCount,
          actionCount,
          "1 action should have been used"
        );
        assert.equal(
          currentTurn.payload.playerKey,
          thisPersonId,
          "Should still be the same turn"
        );

        let request = responses.find(
          (r) => r.subject === "REQUESTS" && r.action === "GET_KEYED"
        );
        assert.equal(
          request.payload.items[requestId].payload.transaction.isComplete,
          true,
          "should be fully collected"
        );
        assert.equal(
          request.payload.items[requestId].isClosed,
          true,
          "request should be clsoed"
        );

        responses = await skipTurn(connection, roomCode, thisPersonId);
      });

    if (++testNumber < executeUnill) {
      it(`${testNumber} - ${player2Name} - Charge rent for a junk set using a 10 color rent card - should fail`, async () => {
        let connection, thisPersonId;
        let responses, confirm;

        [connection, thisPersonId] = [player2Con, player2Id];
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "TURN_STARTING_DRAW",
          defaultProps(roomCode)
        );
        responses = await skipTurn(connection, roomCode, thisPersonId);

        [connection, thisPersonId] = [player1Con, player1Id];
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "TURN_STARTING_DRAW",
          defaultProps(roomCode)
        );
        responses = await skipTurn(connection, roomCode, thisPersonId);

        [connection, thisPersonId] = [player2Con, player2Id];
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "TURN_STARTING_DRAW",
          defaultProps(roomCode)
        );

        //let actionCount = 1;
        //let requestId = 1;
        let collectionId = 20; // black sest
        let cardId = 51; // 57 also same card
        responses = await connection.emitSingleRequest(
          "MY_TURN",
          "CHARGE_RENT",
          defaultProps(roomCode, {
            cardId,
            collectionId,
            targetIds: [player2Id],
          })
        );
        confirm = responses.find(
          (r) => r.subject === "MY_TURN" && r.action === "CHARGE_RENT"
        );
        assert.equal(
          confirm.status,
          "failure",
          "action should fail, cant charge for junk set"
        );

        responses = await skipTurn(connection, roomCode, thisPersonId);
      });
    }

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} - play double the rent - collect both property and bank`, async () => {
        let connection, thisPersonId;
        let responses, confirm;

        // Charge double the rent
        if (1) {
          [connection, thisPersonId] = [player1Con, player1Id];
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "TURN_STARTING_DRAW",
            defaultProps(roomCode)
          );
          //await dumpPlayerCollections(connection, thisPersonId);
          let requestId = 1;
          let collectionId = 8; // purple sest
          let cardId = 50; // 57 also same card
          let augmentCardsIds = [49]; //double the rent
          let expectedRent = 4;
          let baseValue = 2;
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "CHARGE_RENT",
            defaultProps(roomCode, {
              cardId,
              collectionId,
              augmentCardsIds,
              targetIds: [player2Id],
            })
          );
          confirm = responses.find(
            (r) => r.subject === "MY_TURN" && r.action === "CHARGE_RENT"
          );
          assert.equal(confirm.status, "success", "should succeed");

          let requests = responses.find(
            (r) => r.subject === "REQUESTS" && r.action === "GET_KEYED"
          );
          assert.equal(
            requests.payload.items[requestId].payload.amountDue,
            expectedRent,
            "amountDue is as expected"
          );
          assert.equal(
            requests.payload.items[requestId].payload.baseValue,
            baseValue,
            "baseValue is as expected"
          );
          assert.equal(
            requests.payload.items[requestId].payload.actionCollectionId,
            collectionId,
            "collection specified"
          );
          assert.equal(
            requests.payload.items[requestId].payload.actionCardId,
            cardId,
            "action card specified"
          );
          assert.include(
            requests.payload.items[requestId].payload.augmentCardIds,
            augmentCardsIds[0],
            "augment card is listed"
          );
        }

        // Pay with bank and property
        if (1) {
          [connection, thisPersonId] = [player2Con, player2Id];
          let requestId = 1;
          let cardId = 105;
          let collectionId = 20;

          let payWithProperty = [
            {
              location: "collection",
              playerId: thisPersonId,
              cardId: 103,
              collectionId: 20,
            },
          ];
          let payWithBank = [
            {
              location: "bank",
              playerId: thisPersonId,
              cardId: 102,
            },
          ];
          let responseKey = "accept";

          responses = await connection.emitSingleRequest(
            "RESPONSES",
            "RESPOND_TO_COLLECT_VALUE",
            defaultProps(roomCode, {
              requestId,
              responseKey,
              payWithBank,
              payWithProperty,
            })
          );
          confirm = responses.find(
            (r) =>
              r.subject === "RESPONSES" && r.action === "RESPOND_TO_COLLECT_VALUE"
          );
          assert.equal(confirm.status, "success", "should succeed");

          let requests = responses.find(
            (r) => r.subject === "REQUESTS" && r.action === "GET_KEYED"
          );
          assert.equal(
            requests.payload.items[requestId].status,
            "accept",
            "action should succeed"
          );
          assert.equal(
            requests.payload.items[requestId].hasTargetSatisfied,
            true,
            "shoule be satisfied"
          );
        }

        // Collect
        if (1) {
          [connection, thisPersonId] = [player1Con, player1Id];
          let requestId = 1;

          // Collect property
          if (1) {
            let cardId = 103;
            responses = await connection.emitSingleRequest(
              "RESPONSES",
              "COLLECT_CARD_TO_COLLECTION",
              defaultProps(roomCode, {
                requestId: requestId,
                cardId,
              })
            );

            confirm = responses.find(
              (r) =>
                r.subject === "RESPONSES" &&
                r.action === "COLLECT_CARD_TO_COLLECTION"
            );
            assert.equal(confirm.status, "success", "action should succeed");
            let requests = responses.find(
              (r) => r.subject === "REQUESTS" && r.action === "GET_KEYED"
            );
            assert.equal(
              requests.payload.items[requestId].status,
              "accept",
              "action should succeed"
            );
            assert.equal(
              requests.payload.items[requestId].isClosed,
              false,
              "should not be closed yet"
            );
            assert.include(
              requests.payload.items[requestId].payload.transaction.items.toAuthor
                .items.property.transfered,
              cardId,
              "card was confirmed"
            );
          }
          // Collect bank
          if (1) {
            let cardId = 102;
            responses = await connection.emitSingleRequest(
              "RESPONSES",
              "COLLECT_CARD_TO_BANK",
              defaultProps(roomCode, {
                requestId: requestId,
                cardId: cardId,
              })
            );
            confirm = responses.find(
              (r) =>
                r.subject === "RESPONSES" && r.action === "COLLECT_CARD_TO_BANK"
            );
            assert.equal(confirm.status, "success", "action should succeed");
            let requests = responses.find(
              (r) => r.subject === "REQUESTS" && r.action === "GET_KEYED"
            );
            assert.equal(
              requests.payload.items[requestId].isClosed,
              true,
              "should be closed"
            );
            assert.include(
              requests.payload.items[requestId].payload.transaction.items.toAuthor
                .items.bank.transfered,
              cardId,
              "card was confirmed"
            );
          }

          if (1) {
            responses = await skipTurn(connection, roomCode, thisPersonId);
          }
        }
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Play It's my birthday`, async () => {
        let connection, thisPersonId;
        let responses, confirm;

        if (1) {
          [connection, thisPersonId] = [player2Con, player2Id];
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "TURN_STARTING_DRAW",
            defaultProps(roomCode)
          );
          //responses = await skipTurn(connection, roomCode, thisPersonId);
          let cardId = 47;
          let targetIds = [player1Id];
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "VALUE_COLLECTION",
            defaultProps(roomCode, { cardId, targetIds })
          );
        }

        if (1) {
          [connection, thisPersonId] = [player1Con, player1Id];
          //await dumpPlayerBank(connection, thisPersonId);
          //await dumpPlayerCollections(connection, thisPersonId);
          let payWithProperty = [
            //  {
            //    location: "collection",
            //    playerId: thisPersonId,
            //    cardId: 103,
            //    collectionId: 20
            //  }
          ];
          let requestId = 1;
          let payWithBank = [
            {
              location: "bank",
              playerId: thisPersonId,
              cardId: 104,
            },
            {
              location: "bank",
              playerId: thisPersonId,
              cardId: 62,
            },
          ];
          let responseKey = "accept";
          responses = await connection.emitSingleRequest(
            "RESPONSES",
            "RESPOND_TO_COLLECT_VALUE",
            defaultProps(roomCode, {
              requestId,
              responseKey,
              payWithBank,
              payWithProperty,
            })
          );
          confirm = responses.find(
            (r) =>
              r.subject === "RESPONSES" && r.action === "RESPOND_TO_COLLECT_VALUE"
          );
          assert.equal(confirm.status, "success", "should succeed");

          let requests = responses.find(
            (r) => r.subject === "REQUESTS" && r.action === "GET_KEYED"
          );
          assert.equal(
            requests.payload.items[requestId].hasTargetSatisfied,
            true,
            "request is satisfied"
          );
        }

        if (1) {
          [connection, thisPersonId] = [player2Con, player2Id];
          let requestId = 1;
          responses = await connection.emitSingleRequest(
            "RESPONSES",
            "COLLECT_CARD_TO_BANK_AUTO",
            defaultProps(roomCode, {
              requestId: requestId,
            })
          );
          confirm = responses.find(
            (r) =>
              r.subject === "RESPONSES" &&
              r.action === "COLLECT_CARD_TO_BANK_AUTO"
          );
          assert.equal(confirm.status, "success", "should succeed");
          responses = await skipTurn(connection, roomCode, thisPersonId);
        }
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - Debt collector`, async () => {
        let connection, thisPersonId;
        let responses, confirm;

        if (1) {
          [connection, thisPersonId] = [player1Con, player1Id];
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "TURN_STARTING_DRAW",
            defaultProps(roomCode)
          );
          responses = await skipTurn(connection, roomCode, thisPersonId);
        }

        if (1) {
          [connection, thisPersonId] = [player2Con, player2Id];
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "TURN_STARTING_DRAW",
            defaultProps(roomCode)
          );

          let cardId = 44;
          let targetIds = [player1Id];
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "VALUE_COLLECTION",
            defaultProps(roomCode, { cardId, targetIds })
          );

          //responses = await skipTurn(connection, roomCode, thisPersonId);
        }

        if (1) {
          [connection, thisPersonId] = [player1Con, player1Id];
          let requestId = 1;
          let payWithProperty = [];
          let payWithBank = [
            {
              location: "bank",
              playerId: thisPersonId,
              cardId: 62,
            },
            {
              location: "bank",
              playerId: thisPersonId,
              cardId: 61,
            },
            {
              location: "bank",
              playerId: thisPersonId,
              cardId: 102,
            },
          ];
          let responseKey = "accept";
          responses = await connection.emitSingleRequest(
            "RESPONSES",
            "RESPOND_TO_COLLECT_VALUE",
            defaultProps(roomCode, {
              requestId,
              responseKey,
              payWithBank,
              payWithProperty,
            })
          );
          confirm = responses.find(
            (r) =>
              r.subject === "RESPONSES" && r.action === "RESPOND_TO_COLLECT_VALUE"
          );
          assert.equal(confirm.status, "success", "should succeed");
        }

        if (1) {
          [connection, thisPersonId] = [player2Con, player2Id];
          let requestId = 1;
          responses = await connection.emitSingleRequest(
            "RESPONSES",
            "COLLECT_CARD_TO_BANK_AUTO",
            defaultProps(roomCode, {
              requestId: requestId,
            })
          );
          confirm = responses.find(
            (r) =>
              r.subject === "RESPONSES" &&
              r.action === "COLLECT_CARD_TO_BANK_AUTO"
          );
          assert.equal(confirm.status, "success", "should succeed");
          responses = await skipTurn(connection, roomCode, thisPersonId);
        }
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} - Play pass go`, async () => {
        let connection, thisPersonId;
        let responses, confirm;

        if (1) {
          [connection, thisPersonId] = [player1Con, player1Id];
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "TURN_STARTING_DRAW",
            defaultProps(roomCode)
          );
          //responses = await skipTurn(connection, roomCode, thisPersonId);
          let cardId = 41;
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "PLAY_PASS_GO",
            defaultProps(roomCode, { cardId })
          );
          confirm = responses.find(
            (r) => r.subject === "PLAYER_HANDS" && r.action === "GET_KEYED"
          );
          assert.equal(
            confirm.payload.items[thisPersonId].count,
            10,
            "hand count is correct"
          );
          responses = await skipTurn(connection, roomCode, thisPersonId);
        }
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} - swap property`, async () => {
        let connection, thisPersonId;
        let responses, confirm;

        if (1) {
          [connection, thisPersonId] = [player2Con, player2Id];
          //await dumpPlayerCollections(connection, thisPersonId);
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "TURN_STARTING_DRAW",
            defaultProps(roomCode)
          );
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "PLAY_PASS_GO",
            defaultProps(roomCode, { cardId: 37 })
          );
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "PLAY_PASS_GO",
            defaultProps(roomCode, { cardId: 35 })
          );
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "PLAY_PASS_GO",
            defaultProps(roomCode, { cardId: 33 })
          );
          responses = await skipTurn(connection, roomCode, thisPersonId);
        }

        if (1) {
          [connection, thisPersonId] = [player1Con, player1Id];
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "TURN_STARTING_DRAW",
            defaultProps(roomCode)
          );

          if (1) {
            let cardId = 30;
            let myPropertyCardId = 103; //house
            let theirPropertyCardId = 64; // WILD_PROPERTY_GREEN_BLUE
            responses = await connection.emitSingleRequest(
              "MY_TURN",
              "SWAP_PROPERTY",
              defaultProps(roomCode, {
                cardId,
                myPropertyCardId,
                theirPropertyCardId,
              })
            );

            confirm = responses.find(
              (r) => r.subject === "MY_TURN" && r.action === "SWAP_PROPERTY"
            );
            assert.equal(
              confirm.status,
              "failure",
              "cant swap a house for a property"
            );
          }

          if (1) {
            let cardId = 30;
            let myPropertyCardId = 70; //house
            let theirPropertyCardId = 67; // WILD_PROPERTY_GREEN_BLUE
            responses = await connection.emitSingleRequest(
              "MY_TURN",
              "SWAP_PROPERTY",
              defaultProps(roomCode, {
                cardId,
                myPropertyCardId,
                theirPropertyCardId,
              })
            );

            confirm = responses.find(
              (r) => r.subject === "MY_TURN" && r.action === "SWAP_PROPERTY"
            );
            assert.equal(confirm.status, "success", "should be able to swap");
          }
        }
        if (1) {
          [connection, thisPersonId] = [player2Con, player2Id];
          let cardId = undefined;
          let requestId = 1;
          let responseKey = "accept";
          responses = await connection.emitSingleRequest(
            "RESPONSES",
            "RESPOND_TO_PROPERTY_SWAP",
            defaultProps(roomCode, { cardId, requestId, responseKey })
          );
          confirm = responses.find(
            (r) =>
              r.subject === "RESPONSES" && r.action === "RESPOND_TO_PROPERTY_SWAP"
          );
          assert.equal(confirm.status, "success", "should succeed");
          let myCard = 70;
          responses = await connection.emitSingleRequest(
            "RESPONSES",
            "COLLECT_CARD_TO_COLLECTION",
            defaultProps(roomCode, {
              requestId: 1,
              cardId: myCard,
            })
          );
          confirm = responses.find(
            (r) =>
              r.subject === "RESPONSES" &&
              r.action === "COLLECT_CARD_TO_COLLECTION"
          );
          assert.equal(confirm.status, "success", "should succeed");

          let collections = responses.find(
            (r) => r.subject === "COLLECTIONS" && r.action === "GET_KEYED"
          );
          assert.include(
            collections.payload.items[23].cardIds,
            myCard,
            "collect card"
          );

          let requests = responses.find(
            (r) => r.subject === "REQUESTS" && r.action === "GET_KEYED"
          );
          assert.equal(
            requests.payload.items[1].payload.transaction.items.toTarget
              .isComplete,
            true,
            "items collected"
          );
        }

        if (1) {
          [connection, thisPersonId] = [player1Con, player1Id];
          let myCard = 67;
          responses = await connection.emitSingleRequest(
            "RESPONSES",
            "COLLECT_CARD_TO_COLLECTION",
            defaultProps(roomCode, {
              requestId: 1,
              cardId: myCard,
            })
          );
          confirm = responses.find(
            (r) =>
              r.subject === "RESPONSES" &&
              r.action === "COLLECT_CARD_TO_COLLECTION"
          );
          let collections = responses.find(
            (r) => r.subject === "COLLECTIONS" && r.action === "GET_KEYED"
          );
          assert.include(
            collections.payload.items[24].cardIds,
            myCard,
            "card added to collection"
          );

          let requests = responses.find(
            (r) => r.subject === "REQUESTS" && r.action === "GET_KEYED"
          );
          assert.equal(
            requests.payload.items[1].isClosed,
            true,
            "request should be closed"
          );
          assert.equal(
            requests.payload.items[1].payload.transaction.isComplete,
            true,
            "transaciton should be done"
          );
          responses = await skipTurn(connection, roomCode, thisPersonId);
        }
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} - steal property, decline`, async () => {
        let connection, thisPersonId;
        let responses, confirm;

        if (1) {
          [connection, thisPersonId] = [player2Con, player2Id];
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "TURN_STARTING_DRAW",
            defaultProps(roomCode)
          );
          responses = await skipTurn(connection, roomCode, thisPersonId);
        }

        if (1) {
          [connection, thisPersonId] = [player1Con, player1Id];
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "TURN_STARTING_DRAW",
            defaultProps(roomCode)
          );
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "ADD_CARD_TO_MY_BANK_FROM_HAND",
            defaultProps(roomCode, { cardId: 49 })
          );
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "ADD_CARD_TO_MY_BANK_FROM_HAND",
            defaultProps(roomCode, { cardId: 53 })
          );
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "ADD_CARD_TO_MY_BANK_FROM_HAND",
            defaultProps(roomCode, { cardId: 54 })
          );
          responses = await skipTurn(connection, roomCode, thisPersonId);
        }

        if (1) {
          [connection, thisPersonId] = [player2Con, player2Id];
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "TURN_STARTING_DRAW",
            defaultProps(roomCode)
          );
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "ADD_CARD_TO_MY_BANK_FROM_HAND",
            defaultProps(roomCode, { cardId: 52 })
          );
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "ADD_CARD_TO_MY_BANK_FROM_HAND",
            defaultProps(roomCode, { cardId: 55 })
          );
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "ADD_CARD_TO_MY_BANK_FROM_HAND",
            defaultProps(roomCode, { cardId: 56 })
          );
          responses = await skipTurn(connection, roomCode, thisPersonId);
          //await dumpPlayerCollections(connection, thisPersonId);
        }

        if (1) {
          [connection, thisPersonId] = [player1Con, player1Id];
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "TURN_STARTING_DRAW",
            defaultProps(roomCode)
          );
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "ADD_CARD_TO_MY_BANK_FROM_HAND",
            defaultProps(roomCode, { cardId: 57 })
          );

          let cardId = 26;
          let theirPropertyCardId = 84;
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "STEAL_PROPERTY",
            defaultProps(roomCode, { cardId, theirPropertyCardId })
          );
        }
        if (1) {
          [connection, thisPersonId] = [player2Con, player2Id];
          let cardId = 23;
          let requestId = 1;
          let responseKey = "decline";
          responses = await connection.emitSingleRequest(
            "RESPONSES",
            "RESPOND_TO_STEAL_PROPERTY",
            defaultProps(roomCode, { cardId, requestId, responseKey })
          );
        }
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player1Name} - responds to "just say no", with a "just say no"`, async () => {
        let connection, thisPersonId;
        let responses, confirm;

        let requestId = 2;
        let responseKey = "decline";
        let cardId = 25;
        [connection, thisPersonId] = [player1Con, player1Id];

        let expectedNewRequestId = 3;
        responses = await connection.emitSingleRequest(
          "RESPONSES",
          "RESPOND_TO_JUST_SAY_NO",
          defaultProps(roomCode, { cardId, requestId, responseKey })
        );

        let requests = responses.find(
          (r) => r.subject === "REQUESTS" && r.action === "GET_KEYED"
        );
        assert.equal(
          requests.payload.items[requestId].status,
          "decline",
          "original req is declined"
        );
        assert.equal(
          requests.payload.items[requestId].isClosed,
          true,
          "is closed"
        );

        assert.equal(
          requests.payload.items[expectedNewRequestId].status,
          "open",
          "new say no request"
        );
        assert.equal(
          requests.payload.items[expectedNewRequestId].isClosed,
          false,
          "is not closed"
        );
      });

    if (++testNumber < executeUnill)
      it(`${testNumber} - ${player2Name} - responds to "just say no", with a "just say no", response`, async () => {
        let connection, thisPersonId;
        let responses, confirm;

        let requestedCardId = 84;

        let requestId = 3;
        let expectedNewRequestId = 4;

        if (1) {
          let responseKey = "accept";
          [connection, thisPersonId] = [player2Con, player2Id];

          responses = await connection.emitSingleRequest(
            "RESPONSES",
            "RESPOND_TO_JUST_SAY_NO",
            defaultProps(roomCode, { requestId, responseKey })
          );
          let requests = responses.find(
            (r) => r.subject === "REQUESTS" && r.action === "GET_KEYED"
          );
          assert.equal(
            requests.payload.items[requestId].status,
            "accept",
            "accept the no to the no"
          );
          assert.equal(
            requests.payload.items[expectedNewRequestId].status,
            "open",
            "accept the no to the no"
          );
          assert.equal(
            requests.payload.items[expectedNewRequestId].type,
            "stealProperty",
            "It's baaaaack..."
          );
          assert.include(
            requests.payload.items[expectedNewRequestId].payload.transaction.items
              .fromTarget.items.property.items,
            requestedCardId,
            "requested card is there"
          );
          assert.equal(
            requests.payload.items[expectedNewRequestId].targetKey,
            player2Id,
            "target is correct"
          );
          assert.equal(
            requests.payload.items[expectedNewRequestId].authorKey,
            player1Id,
            "author is correct"
          );

          responseKey = "accept";
          responses = await connection.emitSingleRequest(
            "RESPONSES",
            "RESPOND_TO_STEAL_PROPERTY",
            defaultProps(roomCode, {
              requestId: expectedNewRequestId,
              responseKey,
            })
          );
          confirm = responses.find(
            (r) =>
              r.subject === "RESPONSES" &&
              r.action === "RESPOND_TO_STEAL_PROPERTY"
          );
          assert.equal(requests.status, "success", "it should be gone");

          let playerCollections = responses.find(
            (r) => r.subject === "PLAYER_COLLECTIONS" && r.action === "GET_KEYED"
          );
          assert.notInclude(
            playerCollections.payload.items[thisPersonId],
            2,
            "collection should be gone"
          );
        }

        if (1) {
          [connection, thisPersonId] = [player1Con, player1Id];
          let cardId = requestedCardId;

          responses = await connection.emitSingleRequest(
            "RESPONSES",
            "COLLECT_CARD_TO_COLLECTION",
            defaultProps(roomCode, {
              requestId: expectedNewRequestId,
              cardId,
            })
          );
          confirm = responses.find(
            (r) =>
              r.subject === "RESPONSES" &&
              r.action === "COLLECT_CARD_TO_COLLECTION"
          );
          assert.equal(confirm.status, "success", "it worked");
        }
      });

    //STEAL_COLLECTION
    if (++testNumber < executeUnill)
      it(`${testNumber} - DEAL_BREAKER / STEAL_COLLECTION`, async () => {
        let connection, thisPersonId;
        let responses, confirm;

        if (1) {
          [connection, thisPersonId] = [player1Con, player1Id];

          let cardId = 21;
          let theirCollectionId = 10;
          responses = await connection.emitSingleRequest(
            "MY_TURN",
            "STEAL_COLLECTION",
            defaultProps(roomCode, { cardId, theirCollectionId })
          );

          confirm = responses.find(
            (r) => r.subject === "MY_TURN" && r.action === "STEAL_COLLECTION"
          );
          assert.equal(confirm.status, "success", "it worked");
        }

        if (1) {
          [connection, thisPersonId] = [player2Con, player2Id];
          let requestId = 5;
          let responseKey = "accept";
          responses = await connection.emitSingleRequest(
            "RESPONSES",
            "RESPOND_TO_STEAL_COLLECTION",
            defaultProps(roomCode, { requestId, responseKey })
          );
        }

        if (1) {
          [connection, thisPersonId] = [player1Con, player1Id];
          let requestId = 5;
          responses = await connection.emitSingleRequest(
            "RESPONSES",
            "COLLECT_COLLECTION",
            defaultProps(roomCode, { requestId })
          );
          confirm = responses.find(
            (r) => r.subject === "RESPONSES" && r.action === "COLLECT_COLLECTION"
          );
          assert.equal(confirm.status, "success", "it worked");
        }
        
    });
  }
}

function buildHelperMethods({
  getNestedValue,
  defaultProps,
  allPlayerIds,
  allPlayerList,
}) {
  const getOtherPlayers = (myId) =>
    allPlayerList.filter((player) => player.id !== myId);
  const getOtherPlayersIds = (myId) =>
    allPlayerIds.filter((id) => String(id) !== String(myId));
  const getNextPlayerId = (myId) =>
    allPlayerIds[
      (allPlayerIds.length + allPlayerIds.findIndex((id) => id === myId) + 1) %
        allPlayerIds.length
    ]

  let fetchPlayerHandCardIds = async (thisPerson, roomCode, thisPersonId) => {
    let responses = await thisPerson.emitSingleRequest(
      "PLAYER_HANDS",
      "GET_KEYED",
      defaultProps(roomCode)
    );
    let collections = responses.find(
      (r) => r.subject === "PLAYER_HANDS" && r.action === "GET_KEYED"
    );
    return getNestedValue(
      collections,
      ["payload", "items", thisPersonId, "cardIds"],
      []
    );
  }

  let getExcessCardsFromTail = (cardIds) => {
    let result = [];
    if (cardIds.length > 7) {
      let handSize = cardIds.length;
      for (let i = handSize - 1; i >= 7; --i) {
        result.unshift(cardIds[i]);
      }
    }
    return result;
  }

  let skipTurn = async (connection, roomCode, playerId) => {
    let responses;
    let confirm;
    let cardIds = await fetchPlayerHandCardIds(connection, roomCode, playerId);
    let excessCardIds = getExcessCardsFromTail(cardIds);
    if (excessCardIds.length > 0) {
      responses = await connection.emitSingleRequest(
        "MY_TURN",
        "DISCARD_REMAINING",
        defaultProps(roomCode, { cardIds: excessCardIds })
      );
    }
    responses = await connection.emitSingleRequest(
      "MY_TURN",
      "FINISH_TURN",
      defaultProps(roomCode)
    );
    confirm = responses.find(
      (r) => r.subject === "MY_TURN" && r.action === "FINISH_TURN"
    );
    assert.equal(confirm.status, "success", "Confirmed action success");
    return responses;
  }

  return {
    getOtherPlayers,
    getOtherPlayersIds,
    getNextPlayerId,
    fetchPlayerHandCardIds,
    getExcessCardsFromTail,
    skipTurn,
  }
}


describe("Sample Game", async function () {

  // TOGGLE EXECUTION

  const { getNestedValue }    = utils
  const playDealServer = new PlayDealServer();
  const defaultProps          = (roomCode, props = {}) => ({
                                props: { roomCode, ...props },
                              });
  
  // Create a Host and have it execute on connection
  const host = TestHost(function(socket){
    playDealServer.onConnected(socket);
  });


  // Create some connections
  let player1Con = clientConnection(host.io());
  let player2Con = clientConnection(host.io());


  const numberOfPlayers     = 2;
  
  const intialDrawPileSize  = 96;

  const roomCode    = "AAAA";
  const player1Name = "Peter";
  const player2Name = "Merry";
  const player1Id   = 1;
  const player2Id   = 2;
  const allPlayerIds = [player1Id, player2Id];
  const allPlayerList = [
    {
      id: player1Id,
      connection: player1Con,
    },
    {
      id: player2Id,
      connection: player2Con,
    },
  ];


  buildSampleRunTestCase({
    constants,
    getNestedValue,
    playDealServer,
    defaultProps,
    host,
    player1Con,
    player2Con,
    numberOfPlayers,
    roomCode,
    player1Name,
    player2Name,
    player1Id,
    player2Id,
    allPlayerIds,
    allPlayerList,
    ...buildHelperMethods({
      getNestedValue,
      defaultProps,
      allPlayerIds,
      allPlayerList,
    }),
  })
  
}); // end run tests
