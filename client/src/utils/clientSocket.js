const {
  els,
  isDef,
  isFunc,
  isArr,
  makeVar,
  makeMap,
  makeListenerMap,
  log,
  makeListnerTree,
} = require("./utils");
let decodeResponse = (v) => JSON.parse(v);
let jsonEncode = (v) => JSON.stringify(v, null, 2);

//##################################################

//          CLIENT SIDE SOCKET HANDLERS

//##################################################
function createSocketConnection(socket) {
  const mState = {};
  const responseCount = makeVar(mState, "responseCount", 0);

  const mRetreived = {};
  const ROOM = makeMap(mRetreived, "ROOM");
  const CHAT = makeMap(mRetreived, "CHAT");

  const PEROPLE = makeMap(mRetreived, "PEOPLE");
  const PLAYERS = makeMap(mRetreived, "PLAYERS");
  const GAME = makeMap(mRetreived, "GAME");
  const DISCARD_PILE = makeMap(mRetreived, "DISCARD_PILE");
  const ACTIVE_PILE = makeMap(mRetreived, "ACTIVE_PILE");
  const DRAW_PILE = makeMap(mRetreived, "DRAW_PILE");

  const GAME_CONFIG = makeMap(mRetreived, "GAME_CONFIG");
  const CARDS = makeMap(mRetreived, "CARDS");
  const PROPERTY_SETS = makeMap(mRetreived, "PROPERTY_SETS");
  const PILES = makeMap(mRetreived, "PILES");
  const PLAYER_BANKS = makeMap(mRetreived, "PLAYER_BANKS");
  const PLAYER_HANDS = makeMap(mRetreived, "PLAYER_HANDS");

  const PLAYER_COLLECTIONS = makeMap(mRetreived, "PLAYER_COLLECTIONS");
  const COLLECTIONS = makeMap(mRetreived, "COLLECTIONS");

  const PLAYER_REQUESTS = makeMap(mRetreived, "PLAYER_REQUESTS");
  const REQUESTS = makeMap(mRetreived, "REQUESTS");
  const RESPONSES = makeMap(mRetreived, "RESPONSES");

  const PLAYER_TURN = makeMap(mRetreived, "PLAYER_TURN");
  const MY_TURN = makeMap(mRetreived, "MY_TURN");
  const CHEAT = makeMap(mRetreived, "CHEAT");
  const CLIENTS = makeMap(mRetreived, "CLIENTS");

  const listnerTree = makeListnerTree();

  function attachSocketHandlers(thisClient) {
    const clientId = thisClient.id;

    //==================================================

    //                      HANDLERS

    //==================================================

    // Handle setting of state for GET ops
    function handleGernericKeyGetter(subject, payload) {
      if (isDef(payload)) {
        let items = payload.items;
        let order = payload.order;
        order.forEach((itemKey) => {
          let item = items[itemKey];
          mRetreived[subject].set(itemKey, item);
        });
      }
    }

    function handleGenericGetter(subject, payload) {
      if (isDef(payload)) {
        mRetreived[subject].set(payload);
      }
    }

    function handleResponse(encodedData) {
      let responses = decodeResponse(encodedData);
      if (0) {
        console.log(
          `#${responseCount.get()}`,
          clientId,
          JSON.stringify(responses)
        ); //#HERE , null, 2
      }
      responseCount.inc();
      if (isArr(responses)) {
        responses.forEach((response) => {
          if (isDef(response)) {
            let subject = els(response.subject, null);
            let action = els(response.action, null);

            if (subject === "CHEAT") {
              console.log(subject, action, response);
            }
            let payload = els(response.payload, null);
            if (isDef(mRetreived[subject])) {
              listnerTree.emit([subject, action], { payload, subject, action });
              listnerTree.emit([subject, `${action}_RESULT`], responses);

              if (action === "GET") {
                handleGenericGetter(subject, payload);
              } else if (action === "GET_KEYED") {
                handleGernericKeyGetter(subject, payload);
              }
            }
          } else {
          }
        });
      }
    }

    thisClient.on("response", handleResponse);
  } // end attachSocketHandlers

  async function emitPromise(subject, action, data) {
    return new Promise((resolve, reject) => {
      listnerTree.once([subject, `${action}_RESULT`], (responses) => {
        resolve(responses);
      });
      socket.emit("request", jsonEncode(data));
    });
  }

  async function emitSingleRequest(subject, action, other = {}) {
    let data = [
      subject,
      action,
      {
        subject,
        action,
        ...other,
      },
    ];
    return await emitPromise(subject, action, [
      {
        subject,
        action,
        ...other,
      },
    ]);
  }

  function emit(eventName, data) {
    socket.emit(eventName, data);
  }

  function getRetreived(key) {
    return mRetreived[key];
  }

  function serialize() {
    return {
      ROOM: ROOM.serialize(),
      PEROPLE: PEROPLE.serialize(),
      PLAYERS: PLAYERS.serialize(),
      GAME: GAME.serialize(),
      DISCARD_PILE: DISCARD_PILE.serialize(),
      ACTIVE_PILE: ACTIVE_PILE.serialize(),
      DRAW_PILE: DRAW_PILE.serialize(),

      GAME_CONFIG: GAME_CONFIG.serialize(),
      CHAT: CHAT.serialize(),
      CARDS: CARDS.serialize(),
      PROPERTY_SETS: PROPERTY_SETS.serialize(),
      PILES: PILES.serialize(),
      PLAYER_BANKS: PLAYER_BANKS.serialize(),
      PLAYER_HANDS: PLAYER_HANDS.serialize(),
      PLAYER_REQUESTS: PLAYER_REQUESTS.serialize(),
      REQUESTS: REQUESTS.serialize(),
      RESPONSES: RESPONSES.serialize(),
      PLAYER_COLLECTIONS: PLAYER_COLLECTIONS.serialize(),
      COLLECTIONS: COLLECTIONS.serialize(),
      PLAYER_TURN: PLAYER_TURN.serialize(),
      MY_TURN: MY_TURN.serialize(),
      CHEAT: CHEAT.serialize(),

      CLIENTS: CLIENTS.serialize(),
    };
  }

  function destroy() {
    console.log("destroy");
    listnerTree.destroy();
    socket.emit("disconnect");
    socket.disconnect();
    socket.off();
  }

  attachSocketHandlers(socket);

  return {
    emitPromise,
    emitSingleRequest,
    emit,
    socket,
    attachSocketHandlers,
    data: {
      ROOM,
    },
    listnerTree,
    serialize,
    getRetreived,
    destroy,
  };
}

module.exports = createSocketConnection;
