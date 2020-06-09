import { isArr, isDef, setImmutableValue, getNestedValue } from "../../utils/";
import {
  makeGetOrdered,
  makeGetItemized,
  makeRemoveItemized,
  makeGetOrderedItemized,
  makeData,
  resetData,
} from "./reducerUtils";
import {
  UPDATE_DISPLAY_MODE,
  GET_GAME_PROPERTY_SETS,
  GET_PLAYER_HANDS,
  GET_PLAYER_BANKS,
  GET_PLAYER_COLLECTIONS,
  GET_COLLECTIONS,
  REMOVE_COLLECTIONS,
  GET_PLAYER_REQUESTS,
  REMOVE_ALL_PLAYER_REQUESTS,
  GET_GAME_CARDS,
  GET_DRAW_PILE,
  GET_ACTIVE_PILE,
  GET_DISCARD_PILE,
  GET_PLAYER_TURN,
  GAME_STATUS,
  GET_PLAYERS,
  GET_REQUESTS,
  REMOVE_ALL_REQUESTS,
  CARD_SET_SELECTION_ENABLE,
  CARD_SET_SELECTION_TYPE,
  CARD_SET_SELECTION_LIMIT,
  CARD_SET_SELECTABLE,
  CARD_ADD_SELECTABLE_VALUE,
  CARD_REMOVE_SELECTABLE_VALUE,
  CARD_TOGGLE_SELECTABLE_VALUE,
  CARD_SET_SELECTED,
  CARD_ADD_SELECTED_VALUE,
  CARD_REMOVE_SELECTED_VALUE,
  CARD_TOGGLE_SELECTED_VALUE,
  COLLECTION_SET_SELECTION_ENABLE,
  COLLECTION_SET_SELECTION_TYPE,
  COLLECTION_SET_SELECTION_LIMIT,
  COLLECTION_SET_SELECTABLE,
  COLLECTION_ADD_SELECTABLE_VALUE,
  COLLECTION_REMOVE_SELECTABLE_VALUE,
  COLLECTION_TOGGLE_SELECTABLE_VALUE,
  COLLECTION_SET_SELECTED,
  COLLECTION_ADD_SELECTED_VALUE,
  COLLECTION_REMOVE_SELECTED_VALUE,
  COLLECTION_TOGGLE_SELECTED_VALUE,
  PERSON_SET_SELECTION_ENABLE,
  PERSON_SET_SELECTION_TYPE,
  PERSON_SET_SELECTION_LIMIT,
  PERSON_SET_SELECTABLE,
  PERSON_ADD_SELECTABLE_VALUE,
  PERSON_REMOVE_SELECTABLE_VALUE,
  PERSON_TOGGLE_SELECTABLE_VALUE,
  PERSON_SET_SELECTED,
  PERSON_ADD_SELECTED_VALUE,
  PERSON_REMOVE_SELECTED_VALUE,
  PERSON_TOGGLE_SELECTED_VALUE,
} from "../actions/types";

function makeSelectionControlInitialState() {
  return {
    enable: false,
    type: "add",
    limit: 0,
    selectable: [],
    selected: [],
  };
}

function addSelectionControlInitialState(state, name) {
  state[name] = makeSelectionControlInitialState();
}

const addToArray = (value, arr) => Array.from(new Set([...arr, value]));
const removeFromArray = (value, arr) => arr.filter((v) => v !== value);
function setValue(path) {
  return function (state, { payload }) {
    return setImmutableValue(state, path, payload);
  };
}
function setSelectionProp(name, field) {
  return function (state, { payload }) {
    return setImmutableValue(state, [name, field], payload);
  };
}
function setSelectionValue(name, field) {
  return function (state, { payload }) {
    if (isArr(payload)) return setImmutableValue(state, [name, field], payload);
    return state;
  };
}
function addSelectionValue(name, field) {
  return function (state, { payload }) {
    let updatedState = state;
    let priorValue = getNestedValue(updatedState, [name, field], []);
    let newValue = addToArray(payload, priorValue);
    updatedState = setImmutableValue(updatedState, [name, field], newValue);
    return updatedState;
  };
}
function removeSelectionValue(name, field) {
  return function (state, { payload }) {
    let updatedState = state;
    let priorValue = getNestedValue(updatedState, [name, field], []);
    let newValue = removeFromArray(payload, priorValue);
    updatedState = setImmutableValue(updatedState, [name, field], newValue);
    return updatedState;
  };
}
function toggleSelectionValue(name, field) {
  return function (state, { payload }) {
    let updatedState = state;
    let priorValue = getNestedValue(updatedState, [name, field], []);
    let newValue;
    if (priorValue.includes(payload)) {
      newValue = removeFromArray(payload, priorValue);
    } else {
      newValue = addToArray(payload, priorValue);
    }
    updatedState = setImmutableValue(updatedState, [name, field], newValue);
    return updatedState;
  };
}

function updateStateData(basePath) {
  return function (state, { payload }) {
    let { path, value } = payload;

    let _path = isDef(path) ? (isArr(path) ? path : [path]) : [];
    let _basePath = isArr(basePath) ? basePath : [basePath];
    let updatedState = state;
    let fullPath = [..._basePath, ..._path];
    updatedState = setImmutableValue(updatedState, fullPath, value);
    return updatedState;
  };
}

const initialState = {
  uiCustomize: {
    autoPassTurn: true,
  },
  gameStatus: null, // contains isGameStarted, isInProgress, isGameOver
  winningPlayerId: null,
  propertySets: {
    items: {},
  },
  cards: {
    items: {},
    order: [],
  },
  drawPile: null, //DRAW_PILE
  activePile: null, //ACTIVE_PILE
  discardPile: null, //DISCARD_PILE
  playerTurnPrevious: null,
  playerTurn: null,
  players: {
    order: [],
  },
  playerHands: {
    items: {},
  },
  playerBanks: {
    items: {},
  },
  collections: {
    items: {},
  },
  playerCollections: {
    items: {},
  },
  requests: {
    items: {},
  },
  previousRequests: {},
  playerRequests: {
    items: {},
  },
  displayMode: null,
  displayData: {},
};
addSelectionControlInitialState(initialState, "cardSelect");
addSelectionControlInitialState(initialState, "collectionSelect");
addSelectionControlInitialState(initialState, "personSelect");

function resetSelectionControl(name) {
  return function (state, { payload }) {
    return setImmutableValue(state, [name], makeSelectionControlInitialState());
  };
}
/*
requirements:
  swap properties:
    select a card from their collection
    select a card from my collection
  
  steal set:
    select a collection

  charge rent:
    select a collection
    select augment cards
    select people*

  its my birthday
    nothing
  
    debt collector:
      select people


  let subject;

  cardSelection_getEnable,
  cardSelection_getType,
  cardSelection_getLimit,
  cardSelection_getSelectable,
  cardSelection_getSelected,

  collectionSelection_getEnable,
  collectionSelection_getType,
  collectionSelection_getLimit,
  collectionSelection_getSelectable,
  collectionSelection_getSelected,

  personSelection_getEnable,
  personSelection_getType,
  personSelection_getLimit,
  personSelection_getSelectable,
  personSelection_getSelected,


*/

const reducer = function (state = initialState, action) {
  let subjectName;
  let updatedState;
  switch (action.type) {
    case "RESET":
      return JSON.parse(JSON.stringify(initialState));
    case "SET_STATE":
      return action.payload;
    case GET_GAME_PROPERTY_SETS:
      return makeGetItemized("propertySets")(state, action);
    case GET_GAME_CARDS:
      return makeGetOrderedItemized("cards")(state, action);
    case GET_PLAYERS:
      return makeData("players")(state, action);
    case GET_PLAYER_HANDS:
      return makeGetItemized("playerHands")(state, action);
    case GET_PLAYER_BANKS:
      return makeGetItemized("playerBanks")(state, action);
    case GET_PLAYER_COLLECTIONS:
      return makeGetItemized("playerCollections")(state, action);
    case GET_COLLECTIONS:
      return makeGetItemized("collections")(state, action);
    case REMOVE_COLLECTIONS:
      return makeRemoveItemized("collections")(state, action);
    case GET_PLAYER_REQUESTS:
      return makeGetItemized("playerRequests")(state, action);
    case REMOVE_ALL_PLAYER_REQUESTS:
      return setImmutableValue(state, ["playerRequests"], {
        items: {},
      });
    case GET_REQUESTS:
      updatedState = state;
      let requests = getNestedValue(updatedState, ["requests", "items"], {});
      let existing = {};
      Object.keys(requests).forEach((id) => {
        existing[id] = true;
      });
      updatedState = setImmutableValue(
        updatedState,
        ["previousRequests"],
        existing
      );
      updatedState = makeGetItemized("requests")(updatedState, action);
      return updatedState;
    case REMOVE_ALL_REQUESTS:
      updatedState = setImmutableValue(state, ["requests"], {
        items: {},
      });
      updatedState = setImmutableValue(updatedState, ["previousRequests"], {});
      return updatedState;
    case GET_DRAW_PILE:
      return makeData("drawPile")(state, action);
    case GET_ACTIVE_PILE:
      return makeData("activePile")(state, action);
    case GET_DISCARD_PILE:
      return makeData("discardPile")(state, action);
    case GET_PLAYER_TURN:
      let oldData = getNestedValue(state, "playerTurn", null);
      updatedState = makeData("playerTurn")(state, action);
      return setImmutableValue(updatedState, ["playerTurnPrevious"], oldData);
    case GAME_STATUS:
      return makeData("gameStatus")(state, action);
    case UPDATE_DISPLAY_MODE:
      return setValue("displayMode")(state, action);

    case "UPDATE_CUSTOM_UI":
      return updateStateData("uiCustomize")(state, action);
    case "RESET_CUSTOM_UI":
      return updateStateData("uiCustomize")(state, {
        payload: { path: [], value: {} },
      });

    case "UPDATE_DISPLAY_DATA":
      return updateStateData("displayData")(state, action);
    case "RESET_DISPLAY_DATA":
      return updateStateData("displayData")(state, {
        payload: { path: [], value: {} },
      });

    case "UPDATE_ACTION_DATA":
      return updateStateData("actionData")(state, action);

    case "CARD_SELECTION_RESET":
      return resetSelectionControl("cardSelect")(state, action);
    case CARD_SET_SELECTION_ENABLE:
      updatedState = setSelectionProp("cardSelect", "enable")(state, action);

      return updatedState;
    case "CARD_SELECTION_META":
      return updateStateData(["cardSelect", "meta"])(state, action);
    case CARD_SET_SELECTION_TYPE:
      return setSelectionProp("cardSelect", "type")(state, action);
    case CARD_SET_SELECTION_LIMIT:
      return setSelectionProp("cardSelect", "limit")(state, action);
    case CARD_SET_SELECTABLE:
      return setSelectionValue("cardSelect", "selectable")(state, action);
    case CARD_ADD_SELECTABLE_VALUE:
      return addSelectionValue("cardSelect", "selectable")(state, action);
    case CARD_REMOVE_SELECTABLE_VALUE:
      return removeSelectionValue("cardSelect", "selectable")(state, action);
    case CARD_TOGGLE_SELECTABLE_VALUE:
      return toggleSelectionValue("cardSelect", "selectable")(state, action);
    case CARD_SET_SELECTED:
      return setSelectionValue("cardSelect", "selected")(state, action);
    case CARD_ADD_SELECTED_VALUE:
      return addSelectionValue("cardSelect", "selected")(state, action);
    case CARD_REMOVE_SELECTED_VALUE:
      return removeSelectionValue("cardSelect", "selected")(state, action);
    case CARD_TOGGLE_SELECTED_VALUE:
      return toggleSelectionValue("cardSelect", "selected")(state, action);

    case "COLLECTION_SELECTION_RESET":
      return resetSelectionControl("collectionSelect")(state, action);
    case COLLECTION_SET_SELECTION_ENABLE:
      return setSelectionProp("collectionSelect", "enable")(state, action);
    case COLLECTION_SET_SELECTION_TYPE:
      return setSelectionProp("collectionSelect", "type")(state, action);
    case COLLECTION_SET_SELECTION_LIMIT:
      return setSelectionProp("collectionSelect", "limit")(state, action);
    case COLLECTION_SET_SELECTABLE:
      console.log("COLLECTION_SET_SELECTABLE", action);
      return setSelectionValue("collectionSelect", "selectable")(state, action);
    case COLLECTION_ADD_SELECTABLE_VALUE:
      return addSelectionValue("collectionSelect", "selectable")(state, action);
    case COLLECTION_REMOVE_SELECTABLE_VALUE:
      return removeSelectionValue("collectionSelect", "selectable")(
        state,
        action
      );
    case COLLECTION_TOGGLE_SELECTABLE_VALUE:
      return toggleSelectionValue("collectionSelect", "selectable")(
        state,
        action
      );
    case COLLECTION_SET_SELECTED:
      return setSelectionValue("collectionSelect", "selected")(state, action);
    case COLLECTION_ADD_SELECTED_VALUE:
      return addSelectionValue("collectionSelect", "selected")(state, action);
    case COLLECTION_REMOVE_SELECTED_VALUE:
      return removeSelectionValue("collectionSelect", "selected")(
        state,
        action
      );
    case COLLECTION_TOGGLE_SELECTED_VALUE:
      return toggleSelectionValue("collectionSelect", "selected")(
        state,
        action
      );

    case "PERSON_SELECTION_RESET":
      return resetSelectionControl("personSelect")(state, action);
    case PERSON_SET_SELECTION_ENABLE:
      return setSelectionProp("personSelect", "enable")(state, action);
    case PERSON_SET_SELECTION_TYPE:
      return setSelectionProp("personSelect", "type")(state, action);
    case PERSON_SET_SELECTION_LIMIT:
      return setSelectionProp("personSelect", "limit")(state, action);
    case PERSON_SET_SELECTABLE:
      return setSelectionValue("personSelect", "selectable")(state, action);
    case PERSON_ADD_SELECTABLE_VALUE:
      return addSelectionValue("personSelect", "selectable")(state, action);
    case PERSON_REMOVE_SELECTABLE_VALUE:
      return removeSelectionValue("personSelect", "selectable")(state, action);
    case PERSON_TOGGLE_SELECTABLE_VALUE:
      return toggleSelectionValue("personSelect", "selectable")(state, action);
    case PERSON_SET_SELECTED:
      return setSelectionValue("personSelect", "selected")(state, action);
    case PERSON_ADD_SELECTED_VALUE:
      return addSelectionValue("personSelect", "selected")(state, action);
    case PERSON_REMOVE_SELECTED_VALUE:
      return removeSelectionValue("personSelect", "selected")(state, action);
    case PERSON_TOGGLE_SELECTED_VALUE:
      return toggleSelectionValue("personSelect", "selected")(state, action);

    default:
      return state;
  }
};

export default reducer;
export { initialState };
