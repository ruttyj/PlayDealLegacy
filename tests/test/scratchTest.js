const rootFolder = `../..`;
const serverFolder = `${rootFolder}/server`;
const socketFolder = `${serverFolder}/sockets`;
const clientFolder = `${rootFolder}/client`;
const utilsFolder = `${serverFolder}/utils`;
const playDealFolder = `${serverFolder}/Game`;

const assert = require("chai").assert;
const {
  isDef,
  isArr,
  getNestedValue,
  makeListenerMap,
  makeVar,
  jsonLog,
} = require(`${utilsFolder}`);
const gameConstants = require(`${playDealFolder}/config/constants.js`);
const { CONFIG } = gameConstants;
const checks = require(`../checks/`);
const FakeHost = require(`${socketFolder}/FakeHost.js`);
const attachServerSideHandlers = require(`${socketFolder}/serverSocketHandlers.js`);
const createConnection = require(`${clientFolder}/src/utils/clientSocket.js`);

const defaultProps = (roomCode, props = {}) => ({
  props: { roomCode, ...props },
});

console.clear();
describe("App", async function () {
  // TOGGLE EXECUTION
  let executeUnill = 150;
  let testNumber = 0;
  const host = FakeHost(attachServerSideHandlers);

  let player1Con = createConnection(host.io());
  let player2Con = createConnection(host.io());
  const numberOfPlayers = 2;
  const initalHandSize = 5;
  const intialDrawPileSize = 96;
  let runningDrawPileSize = intialDrawPileSize;

  const roomCode = "AAAA";
  const player1Name = "Peter";
  const player2Name = "Merry";
  const player1Id = 1;
  const player2Id = 2;
  const allPlayerNames = [player1Name, player2Name];
  const allPlayerIds = [player1Id, player2Id];
  const allPlayers = [player1Con, player2Con];
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
  const getPerson = (personId) =>
    allPlayers[allPlayerIds.findIndex((id) => id === personId)];
  const getPersonName = (personId) =>
    allPlayerNames[allPlayerIds.findIndex((id) => id === personId)];
  const getOtherPlayers = (myId) =>
    allPlayerList.filter((player) => player.id !== myId);
  const getOtherPlayersIds = (myId) =>
    allPlayerIds.filter((id) => String(id) !== String(myId));
  const getNextPlayerId = (myId) =>
    allPlayerIds[
      (allPlayerIds.length + allPlayerIds.findIndex((id) => id === myId) + 1) %
        allPlayerIds.length
    ];

  const dumpHand = async (connection) =>
    jsonLog(
      await connection.emitSingleRequest(
        "PLAYER_HANDS",
        "GET_KEYED",
        defaultProps(roomCode)
      )
    );
  const dumpCollections = async (connection, mxdCollectionIds) =>
    jsonLog(
      await connection.emitSingleRequest(
        "COLLECTIONS",
        "GET_KEYED",
        defaultProps(roomCode, {
          collectionIds: isArr(mxdCollectionIds)
            ? mxdCollectionIds
            : [mxdCollectionIds],
        })
      )
    );

  const dumpCurrentTurn = async (connection) => {
    jsonLog(
      await connection.emitSingleRequest(
        "PLAYER_TURN",
        "GET",
        defaultProps(roomCode)
      )
    );
  };

  let fetchPlayerCollections = async (connection, personId) => {
    let subject = `PLAYER_COLLECTIONS`;
    let action = `GET_KEYED`;
    let resultPath = ["payload", "items", personId];
    let responses = await connection.emitSingleRequest(
      subject,
      action,
      defaultProps(roomCode, { personId })
    );
    let playerCollectionsResponse = responses.find(
      (r) => r.subject === subject && r.action === action
    );
    return getNestedValue(playerCollectionsResponse, resultPath, []);
  };

  let fetchPlayerBank = async (connection, personId) => {
    let subject = `PLAYER_BANKS`;
    let action = `GET_KEYED`;
    let resultPath = ["payload", "items", personId];
    let responses = await connection.emitSingleRequest(
      subject,
      action,
      defaultProps(roomCode, { personId })
    );
    let playerCollectionsResponse = responses.find(
      (r) => r.subject === subject && r.action === action
    );
    return getNestedValue(playerCollectionsResponse, resultPath, []);
  };

  let dumpPlayerCollections = async (connection, playerId) => {
    let collectionIds = await fetchPlayerCollections(connection, playerId);
    await dumpCollections(connection, collectionIds);
  };

  let fetchPlayerRequests = async (connection, personId) => {
    let subject = `PLAYER_REQUESTS`;
    let action = `GET_KEYED`;
    let resultPath = ["payload", "items", personId];
    let responses = await connection.emitSingleRequest(
      subject,
      action,
      defaultProps(roomCode, { personId })
    );
    let playerCollectionsResponse = responses.find(
      (r) => r.subject === subject && r.action === action
    );
    return getNestedValue(playerCollectionsResponse, resultPath, []);
  };

  let fetchRequests = async (connection, requestIds) => {
    let subject = `REQUESTS`;
    let action = `GET_KEYED`;
    let responses = await connection.emitSingleRequest(
      subject,
      action,
      defaultProps(roomCode, { requestIds })
    );
    let playerCollectionsResponse = responses.find(
      (r) => r.subject === subject && r.action === action
    );

    let result = {};
    requestIds.forEach((requestId) => {
      let item = getNestedValue(
        playerCollectionsResponse,
        ["payload", "items", requestId],
        null
      );
      if (isDef(item)) {
        result[requestId] = item;
      }
    });

    return result;
  };

  let dumpPlayerRequests = async (connection, personId) => {
    let requestIds = await fetchPlayerRequests(connection, personId);
    let requests = await fetchRequests(connection, requestIds);
    jsonLog(requests);
  };

  let dumpPlayerBank = async (connection, personId) => {
    jsonLog(await fetchPlayerBank(connection, personId));
  };

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
  };

  let getExcessCardsFromTail = (cardIds) => {
    let result = [];
    if (cardIds.length > 7) {
      let handSize = cardIds.length;
      for (let i = handSize - 1; i >= 7; --i) {
        result.unshift(cardIds[i]);
      }
    }
    return result;
  };

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
  };

  if (++testNumber < executeUnill)
    it(`${testNumber} - create room ${roomCode}`, async () => {
        await (
            async () => {
                console.log(`${testNumber} - create room ${roomCode}`)
                let result = await player1Con.emitSingleRequest(
                    "ROOM",
                    "CREATE",
                    defaultProps(roomCode)
                );
                assert.equal(result[0].status, "success");
            }
        )()

        await (
            async () => {
                console.log(`${++testNumber} - room ${roomCode} exists`);
                let responses = await player1Con.emitSingleRequest(
                    "ROOM",
                    "EXISTS",
                    defaultProps(roomCode)
                );
                assert.exists(responses[0]);
                assert.equal(responses[0].status, "success");
                assert.exists(responses[0].payload.exists[roomCode]);
                assert.equal(responses[0].payload.exists[roomCode], true);
            }
        )()
    });




  //if (++testNumber < executeUnill)
  //  it(`${testNumber} - FORCE STATE`, async () => {
  //    let connection, thisPersonId;
  //    let responses, confirm;
  //    [connection, thisPersonId] = [player1Con, player1Id];
  //    responses = await connection.emitSingleRequest("CHEAT", "FORCE_STATE", defaultProps(roomCode));
  //    jsonLog(responses);
  //  });

  /*
    todo: 
        handle win condition
        add super wild card to existing collection
        adding action cards to bank should not trigger request phase


    */

  /*
  if (++testNumber < executeUnill)
    it(`${testNumber} - ${player1Name} Add Property to wildcard set then attempt to flip`, async () => {
      //@TODO
    });
  */
  //jsonLog(playerHands);
  //if (++testNumber < executeUnill)
  //  it(`${testNumber} - ${player2Name} -`, async () => {
  //    let thisPersonId = player2Id;
  //    let thisPerson = player2;
  //    let subject = "MY_TURN";
  //    let action = "TRANSFER_ACTION_CARD_TO_BANK_FROM_HAND";
  //
  //    let responses = await thisPerson.emitSingleRequest(subject, action, defaultProps(roomCode));
  //    jsonLog(responses);
  //
  //    //let confirm = responses.find(r => r.subject === subject && r.action === action);
  //    //assert.equal(confirm.status, "success", "confirm action was sucessfull");
  //  });

  // await dumpHand(connection)
  // await dumpPlayerCollections(connection, thisPersonId)
  // await dumpPlayerRequests(connection, thisPersonId)
  // await dumpPlayerBank(connection, thisPersonId)
  // await dumpCurrentTurn(connection)
}); // end run tests
