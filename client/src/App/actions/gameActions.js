///"START_GAME";//GAME.START

import ReduxState from "../controllers/reduxState";
import gameReducers from "../reducers/gameReducers";
import { isDef, makeListenerMap, getNestedValue } from "../../utils/";
import {
  GET_GAME_PROPERTY_SETS,
  GET_PLAYER_HANDS,
  GET_PLAYER_BANKS,
  GET_PLAYER_COLLECTIONS,
  GET_COLLECTIONS,
  GET_PLAYER_REQUESTS,
  GET_REQUESTS,
  REMOVE_ALL_PLAYER_REQUESTS,
  REMOVE_ALL_REQUESTS,
  GET_GAME_CARDS,
  GET_DRAW_PILE,
  GET_ACTIVE_PILE,
  GET_DISCARD_PILE,
  GET_PLAYER_TURN,
  GAME_STATUS,
  RESET_GAME,
  GET_PLAYERS,
  DISCARD_CARDS,
  REMOVE_COLLECTIONS,
  UPDATE_DISPLAY_MODE,
} from "./types";

const reduxState = ReduxState.getInstance();

const defaultProps = (roomCode, moreProps = {}) => {
  return {
    props: {
      ...moreProps,
      roomCode,
    },
  };
};

const setPreviousRequests = (idsKeyed) => async (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `SET_PREVIOUS_REQUESTS`,
    payload: idsKeyed,
  });
  return Promise.resolve();
};

const resetGame = (con, roomCode) => async (dispatch) => {
  let responses = await con.emitSingleRequest(
    "GAME",
    "RESET",
    defaultProps(roomCode)
  );
  return responses;
};

const startGame = (con, roomCode) => async (dispatch) => {
  let responses = await con.emitSingleRequest(
    "GAME",
    "START",
    defaultProps(roomCode)
  );
  return responses;
};

const drawTurnStartingCards = (con, roomCode) => async (dispatch) => {
  let response = await con.emitSingleRequest(
    "MY_TURN",
    "TURN_STARTING_DRAW",
    defaultProps(roomCode)
  );
  return response;
};

const passTurn = (con, roomCode) => async (dispatch) => {
  let result = await con.emitSingleRequest(
    "MY_TURN",
    "FINISH_TURN",
    defaultProps(roomCode)
  );
  return result;
};

const discardCards = (con, roomCode, cardIds = []) => async (dispatch) => {
  await con.emitSingleRequest(
    "MY_TURN",
    "DISCARD_REMAINING",
    defaultProps(roomCode, { cardIds })
  );
};

const addCardToMyBank = (con, roomCode, cardId) => async (dispatch) => {
  await con.emitSingleRequest(
    "MY_TURN",
    "ADD_CARD_TO_MY_BANK_FROM_HAND",
    defaultProps(roomCode, { cardId })
  );
};


const addCardEmptySetFromHand = (con, roomCode, cardId) => async (dispatch) => {
  await con.emitSingleRequest(
    "MY_TURN",
    "ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND",
    defaultProps(roomCode, { cardId })
  );
};

const addPropertyToExistingCollectionFromHand = (
  con,
  roomCode,
  cardId,
  collectionId
) => async (dispatch) => {
  await con.emitSingleRequest(
    "MY_TURN",
    "ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND",
    defaultProps(roomCode, { cardId, collectionId })
  );
};

const addAugmentToExistingCollectionFromHand = (
  con,
  roomCode,
  cardId,
  collectionId
) => async (dispatch) => {
  await con.emitSingleRequest(
    "MY_TURN",
    "ADD_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_HAND",
    defaultProps(roomCode, { cardId, collectionId })
  );
};

const playPassGo = (con, roomCode, cardId) => async (dispatch) => {
  let result = await con.emitSingleRequest(
    "MY_TURN",
    "PLAY_PASS_GO",
    defaultProps(roomCode, { cardId })
  );
  return result;
};

const transferPropertyToNewCollection = (
  con,
  roomCode,
  cardId,
  fromCollectionId
) => async (dispatch) => {
  let result = await con.emitSingleRequest(
    "MY_TURN",
    "TRANSFER_PROPERTY_TO_NEW_COLLECTION_FROM_COLLECTION",
    defaultProps(roomCode, { cardId, fromCollectionId })
  );
  return result;
};

// From one collection to another
const transferPropertyToExistingCollection = (
  con,
  roomCode,
  cardId,
  fromCollectionId,
  toCollectionId
) => async (dispatch) => {
  let result = await con.emitSingleRequest(
    "MY_TURN",
    "TRANSFER_PROPERTY_TO_EXISTING_COLLECTION_FROM_COLLECTION",
    defaultProps(roomCode, { cardId, fromCollectionId, toCollectionId })
  );
  return result;
};

const transferSetAugmentToExistingCollection = (
  con,
  roomCode,
  cardId,
  fromCollectionId,
  toCollectionId
) => async (dispatch) => {
  let result = await con.emitSingleRequest(
    "MY_TURN",
    "TRANSFER_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_COLLECTION",
    defaultProps(roomCode, { cardId, fromCollectionId, toCollectionId })
  );
  return result;
};

const transferSetAugmentToNewCollection = (
  con,
  roomCode,
  cardId,
  fromCollectionId
) => async (dispatch) => {
  let result = await con.emitSingleRequest(
    "MY_TURN",
    "TRANSFER_SET_AUGMENT_TO_NEW_COLLECTION_FROM_COLLECTION",
    defaultProps(roomCode, { cardId, fromCollectionId })
  );
  return result;
};

const changeWildPropertySetKey = (
  con,
  roomCode,
  cardId,
  chosenSetKey,
  collectionId
) => async (dispatch) => {
  let fetchedData = await con.emitSingleRequest(
    "MY_TURN",
    "CHANGE_CARD_ACTIVE_SET",
    defaultProps(roomCode, { cardId, chosenSetKey, collectionId })
  );

  if (isDef(fetchedData)) {
    let response = fetchedData.find(
      (r) => r.action === "CHANGE_CARD_ACTIVE_SET"
    );
    if (isDef(response)) {
      return response.status === "success";
    }
  }
  return false;
};

const chargeRentForCollection = (
  con,
  roomCode,
  { cardId, collectionId, augmentCardsIds, targetIds, targetId }
) => async (dispatch) => {
  let result = await con.emitSingleRequest(
    "MY_TURN",
    "CHARGE_RENT",
    defaultProps(roomCode, {
      cardId,
      collectionId,
      augmentCardsIds,
      targetIds,
      targetId,
    })
  );
  return result;
};

const respondToValueRequest = (
  con,
  roomCode,
  { requestId, responseKey, cardId, payWithBank, payWithProperty }
) => async (dispatch) => {
  let result = await con.emitSingleRequest(
    "RESPONSES",
    "RESPOND_TO_COLLECT_VALUE",
    defaultProps(roomCode, {
      requestId,
      responseKey,
      cardId,
      payWithBank,
      payWithProperty,
    })
  );
  return result;
};

const collectCardToBank = (con, roomCode, requestId, cardId) => async (
  dispatch
) => {
  let result = await con.emitSingleRequest(
    "RESPONSES",
    "COLLECT_CARD_TO_BANK",
    defaultProps(roomCode, { requestId, cardId })
  );
  return result;
};

const collectCardToCollection = (
  con,
  roomCode,
  requestId,
  cardId,
  collectionId = null
) => async (dispatch) => {
  let result = await con.emitSingleRequest(
    "RESPONSES",
    "COLLECT_CARD_TO_COLLECTION",
    defaultProps(roomCode, { requestId, cardId, collectionId })
  );
  return result;
};

const collectNothingToNothing = (con, roomCode, requestId) => async (
  dispatch
) => {
  let result = await con.emitSingleRequest(
    "RESPONSES",
    "ACKNOWLEDGE_COLLECT_NOTHING",
    defaultProps(roomCode, { requestId })
  );
  return result;
};

const valueCollection = (
  con,
  roomCode,
  { cardId, augmentCardsIds, targetIds }
) => async (dispatch) => {
  let result = await con.emitSingleRequest(
    "MY_TURN",
    "VALUE_COLLECTION",
    defaultProps(roomCode, { cardId, augmentCardsIds, targetIds })
  );
  return result;
};

const swapProperties = (
  con,
  roomCode,
  { cardId, myPropertyCardId, theirPropertyCardId }
) => async (dispatch) => {
  let result = await con.emitSingleRequest(
    "MY_TURN",
    "SWAP_PROPERTY",
    defaultProps(roomCode, { cardId, myPropertyCardId, theirPropertyCardId })
  );
  return result;
};

const stealProperties = (
  con,
  roomCode,
  { cardId, theirPropertyCardId }
) => async (dispatch) => {
  let result = await con.emitSingleRequest(
    "MY_TURN",
    "STEAL_PROPERTY",
    defaultProps(roomCode, { cardId, theirPropertyCardId })
  );
  return result;
};

const respondToStealProperty = (
  con,
  roomCode,
  { cardId, requestId, responseKey }
) => async (dispatch) => {
  let result = await con.emitSingleRequest(
    "RESPONSES",
    "RESPOND_TO_STEAL_PROPERTY",
    defaultProps(roomCode, { cardId, requestId, responseKey })
  );
  return result;
};

const respondToPropertyTransfer = (
  con,
  roomCode,
  { cardId, requestId, responseKey }
) => async (dispatch) => {
  let result = await con.emitSingleRequest(
    "RESPONSES",
    "RESPOND_TO_PROPERTY_SWAP",
    defaultProps(roomCode, { cardId, requestId, responseKey })
  );
  return result;
};

const respondToJustSayNo = (
  con,
  roomCode,
  { cardId, requestId, responseKey }
) => async (dispatch) => {
  let result = await con.emitSingleRequest(
    "RESPONSES",
    "RESPOND_TO_JUST_SAY_NO",
    defaultProps(roomCode, { cardId, requestId, responseKey })
  );
  return result;
};

const stealCollection = (
  con,
  roomCode,
  { cardId, theirCollectionId }
) => async (dispatch) => {
  let result = await con.emitSingleRequest(
    "MY_TURN",
    "STEAL_COLLECTION",
    defaultProps(roomCode, { cardId, theirCollectionId })
  );
  return result;
};

const respondToStealCollection = (
  con,
  roomCode,
  { cardId, requestId, responseKey }
) => async (dispatch) => {
  let result = await con.emitSingleRequest(
    "RESPONSES",
    "RESPOND_TO_STEAL_COLLECTION",
    defaultProps(roomCode, { cardId, requestId, responseKey })
  );
  return result;
};

const collectCollection = (con, roomCode, { requestId }) => async (
  dispatch
) => {
  let result = await con.emitSingleRequest(
    "RESPONSES",
    "COLLECT_COLLECTION",
    defaultProps(roomCode, { requestId })
  );
  return result;
};

const updateActionData = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `UPDATE_ACTION_DATA`,
    payload: value,
  });
  return Promise.resolve();
};

const updateDisplayMode = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `UPDATE_DISPLAY_MODE`,
    payload: value,
  });
  return Promise.resolve();
};

const resetDisplayData = () => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `RESET_DISPLAY_DATA`,
    payload: null,
  });
  return Promise.resolve();
};

const updateDisplayData = ({ path, value }) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `UPDATE_DISPLAY_DATA`,
    payload: { path, value },
  });
  return Promise.resolve();
};

const resetCustomUi = () => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `RESET_CUSTOM_UI`,
    payload: null,
  });
  return Promise.resolve();
};

const setCustomUi = (path = [], value = {}) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `UPDATE_CUSTOM_UI`,
    payload: { path, value },
  });
  return Promise.resolve();
};

// CARD

const cardSelection_setMeta = (path, value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `CARD_SELECTION_META`,
    payload: { path, value },
  });
  return Promise.resolve();
};

const cardSelection_reset = () => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `CARD_SELECTION_RESET`,
    payload: null,
  });
  return Promise.resolve();
};
const cardSelection_setEnable = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `CARD_SET_SELECTION_ENABLE`,
    payload: value,
  });
  return Promise.resolve();
};
const cardSelection_setType = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `CARD_SET_SELECTION_TYPE`,
    payload: value,
  });
  return Promise.resolve();
};
const cardSelection_setLimit = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `CARD_SET_SELECTION_LIMIT`,
    payload: value,
  });
  return Promise.resolve();
};
const cardSelection_setSelectable = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `CARD_SET_SELECTABLE`,
    payload: value,
  });
  return Promise.resolve();
};
const cardSelection_addSelectable = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `CARD_ADD_SELECTABLE_VALUE`,
    payload: value,
  });
  return Promise.resolve();
};
const cardSelection_removeSelectable = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `CARD_REMOVE_SELECTABLE_VALUE`,
    payload: value,
  });
  return Promise.resolve();
};
const cardSelection_toggleSelectable = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `CARD_TOGGLE_SELECTABLE_VALUE`,
    payload: value,
  });
  return Promise.resolve();
};
const cardSelection_setSelected = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `CARD_SET_SELECTED`,
    payload: value,
  });
  return Promise.resolve();
};
const cardSelection_addSelected = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `CARD_ADD_SELECTED_VALUE`,
    payload: value,
  });
  return Promise.resolve();
};
const cardSelection_removeSelected = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `CARD_REMOVE_SELECTED_VALUE`,
    payload: value,
  });
  return Promise.resolve();
};
const cardSelection_toggleSelected = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `CARD_TOGGLE_SELECTED_VALUE`,
    payload: value,
  });
  return Promise.resolve();
};

// COLLECTION
const collectionSelection_reset = () => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `COLLECTION_SELECTION_RESET`,
    payload: null,
  });
  return Promise.resolve();
};
const collectionSelection_setEnable = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `COLLECTION_SET_SELECTION_ENABLE`,
    payload: value,
  });
  return Promise.resolve();
};
const collectionSelection_setType = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `COLLECTION_SET_SELECTION_TYPE`,
    payload: value,
  });
  return Promise.resolve();
};
const collectionSelection_setLimit = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `COLLECTION_SET_SELECTION_LIMIT`,
    payload: value,
  });
  return Promise.resolve();
};
const collectionSelection_setSelectable = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `COLLECTION_SET_SELECTABLE`,
    payload: value,
  });
  return Promise.resolve();
};
const collectionSelection_addSelectable = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `COLLECTION_ADD_SELECTABLE_VALUE`,
    payload: value,
  });
  return Promise.resolve();
};
const collectionSelection_removeSelectable = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `COLLECTION_REMOVE_SELECTABLE_VALUE`,
    payload: value,
  });
  return Promise.resolve();
};
const collectionSelection_toggleSelectable = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `COLLECTION_TOGGLE_SELECTABLE_VALUE`,
    payload: value,
  });
  return Promise.resolve();
};
const collectionSelection_setSelected = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `COLLECTION_SET_SELECTED`,
    payload: value,
  });
  return Promise.resolve();
};
const collectionSelection_addSelected = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `COLLECTION_ADD_SELECTED_VALUE`,
    payload: value,
  });
  return Promise.resolve();
};
const collectionSelection_removeSelected = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `COLLECTION_REMOVE_SELECTED_VALUE`,
    payload: value,
  });
  return Promise.resolve();
};
const collectionSelection_toggleSelected = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `COLLECTION_TOGGLE_SELECTED_VALUE`,
    payload: value,
  });
  return Promise.resolve();
};

// PERSON
const personSelection_reset = () => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `PERSON_SELECTION_RESET`,
    payload: null,
  });
  return Promise.resolve();
};
const personSelection_setEnable = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `PERSON_SET_SELECTION_ENABLE`,
    payload: value,
  });
  return Promise.resolve();
};
const personSelection_setType = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `PERSON_SET_SELECTION_TYPE`,
    payload: value,
  });
  return Promise.resolve();
};
const personSelection_setLimit = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `PERSON_SET_SELECTION_LIMIT`,
    payload: value,
  });
  return Promise.resolve();
};
const personSelection_setSelectable = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `PERSON_SET_SELECTABLE`,
    payload: value,
  });
  return Promise.resolve();
};
const personSelection_addSelectable = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `PERSON_ADD_SELECTABLE_VALUE`,
    payload: value,
  });
  return Promise.resolve();
};
const personSelection_removeSelectable = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `PERSON_REMOVE_SELECTABLE_VALUE`,
    payload: value,
  });
  return Promise.resolve();
};
const personSelection_toggleSelectable = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `PERSON_TOGGLE_SELECTABLE_VALUE`,
    payload: value,
  });
  return Promise.resolve();
};
const personSelection_setSelected = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `PERSON_SET_SELECTED`,
    payload: value,
  });
  return Promise.resolve();
};
const personSelection_addSelected = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `PERSON_ADD_SELECTED_VALUE`,
    payload: value,
  });
  return Promise.resolve();
};
const personSelection_removeSelected = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `PERSON_REMOVE_SELECTED_VALUE`,
    payload: value,
  });
  return Promise.resolve();
};
const personSelection_toggleSelected = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `PERSON_TOGGLE_SELECTED_VALUE`,
    payload: value,
  });
  return Promise.resolve();
};

const setCards = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `GET_GAME_CARDS`,
    payload: value,
  });
  return Promise.resolve();
};


const sendSound = (con, roomCode, soundKey) => async (dispatch) => {
  await con.emitSingleRequest(
    "CHAT",
    "SEND_MESSAGE",
    defaultProps(roomCode, {
      type: "sound",
      value: soundKey,
    })
  );
};


const attachGameListeners = (con) => (dispatch) => {
  let listnerTree = con.listnerTree;

  let mapEvents = {
    GET_GAME_PROPERTY_SETS: ["PROPERTY_SETS", "GET_KEYED"],
    GET_GAME_CARDS: ["CARDS", "GET_KEYED"],
    GET_PLAYER_HANDS: ["PLAYER_HANDS", "GET_KEYED"],
    GET_PLAYER_BANKS: ["PLAYER_BANKS", "GET_KEYED"],
    GET_PLAYER_COLLECTIONS: ["PLAYER_COLLECTIONS", "GET_KEYED"],
    GET_COLLECTIONS: ["COLLECTIONS", "GET_KEYED"],
    REMOVE_COLLECTIONS: ["COLLECTIONS", "REMOVE_KEYED"],
    GET_DRAW_PILE: ["DRAW_PILE", "GET"],
    GET_DISCARD_PILE: ["DISCARD_PILE", "GET"],
    GET_ACTIVE_PILE: ["ACTIVE_PILE", "GET"],
    GET_PLAYER_TURN: ["PLAYER_TURN", "GET"],
    GAME_STATUS: ["GAME", "STATUS"],
    GET_PLAYERS: ["PLAYERS", "GET"],
    DRAW_TURN_STARTING_CARDS: ["MY_TURN", "TURN_STARTING_DRAW"],
    GET_PLAYER_REQUESTS: ["PLAYER_REQUESTS", "GET_KEYED"],
    GET_REQUESTS: ["REQUESTS", "GET_KEYED"],
    REMOVE_ALL_PLAYER_REQUESTS: ["PLAYER_REQUESTS", "REMOVE_ALL"],
    REMOVE_ALL_REQUESTS: ["REQUESTS", "REMOVE_ALL"],
    PERSON_DREW_CARDS_KEYED: ["PLAYERS", "PERSON_DREW_CARDS_KEYED"],
  };

  Object.keys(mapEvents).forEach((eventType) => {
    let eventBranch = mapEvents[eventType];
    listnerTree.on(eventBranch, (data) => {
      let [subject, action] = eventBranch;
      let { payload } = data;
      reduxState.directDispatch("game", dispatch, gameReducers, {
        type: eventType,
        payload: payload,
      });

      //Check: is this emitted after the thunk store update?
      listnerTree.emit([subject, `${action}__STORE_UPDATED`], data);
    });
  });
};

const resetGameData = (value) => (dispatch) => {
  reduxState.directDispatch("game", dispatch, gameReducers, {
    type: `RESET`,
    payload: value,
  });
  return Promise.resolve();
};

export default {
  resetGameData,
  setPreviousRequests,

  //Game life cycle
  resetGame,
  startGame,
  attachGameListeners,
  setCards,

  // Start turn
  drawTurnStartingCards,

  // Chat
  sendSound,

  // Property actions
  changeWildPropertySetKey,
  addCardEmptySetFromHand,
  addAugmentToExistingCollectionFromHand,
  addPropertyToExistingCollectionFromHand,
  transferPropertyToNewCollection,
  transferPropertyToExistingCollection,
  transferSetAugmentToExistingCollection,
  transferSetAugmentToNewCollection,

  // Add to bank
  addCardToMyBank,

  // Other actions
  playPassGo,
  chargeRentForCollection,
  respondToValueRequest,
  collectCardToBank,
  collectCardToCollection,
  collectNothingToNothing,
  valueCollection,
  swapProperties,
  stealProperties,
  respondToPropertyTransfer,
  respondToStealProperty,
  respondToJustSayNo,
  stealCollection,
  respondToStealCollection,
  collectCollection,

  // End turn
  discardCards,
  passTurn,

  // ActionButton
  updateActionData,

  // Display mode
  updateDisplayMode,
  resetDisplayData,
  updateDisplayData,

  setCustomUi,
  resetCustomUi,

  // Selection actions
  cardSelection_setMeta,
  cardSelection_reset,
  cardSelection_setEnable,
  cardSelection_setType,
  cardSelection_setLimit,
  cardSelection_setSelectable,
  cardSelection_addSelectable,
  cardSelection_removeSelectable,
  cardSelection_toggleSelectable,
  cardSelection_setSelected,
  cardSelection_addSelected,
  cardSelection_removeSelected,
  cardSelection_toggleSelected,

  collectionSelection_reset,
  collectionSelection_setEnable,
  collectionSelection_setType,
  collectionSelection_setLimit,
  collectionSelection_setSelectable,
  collectionSelection_addSelectable,
  collectionSelection_removeSelectable,
  collectionSelection_toggleSelectable,
  collectionSelection_setSelected,
  collectionSelection_addSelected,
  collectionSelection_removeSelected,
  collectionSelection_toggleSelected,

  personSelection_reset,
  personSelection_setEnable,
  personSelection_setType,
  personSelection_setLimit,
  personSelection_setSelectable,
  personSelection_addSelectable,
  personSelection_removeSelectable,
  personSelection_toggleSelectable,
  personSelection_setSelected,
  personSelection_addSelected,
  personSelection_removeSelected,
  personSelection_toggleSelected,
};
