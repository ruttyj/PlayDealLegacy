import { isDef, setImmutableValue } from "../../utils/";
import {
  makeGetItemized,
  makeGetOrderedItemized,
  makeData,
} from "./reducerUtils";

import {
  GET_PEOPLE,
  REMOVE_PEOPLE,
  GET_HOST,
  GET_MY_ID,
  UPDATE_MY_NAME,
} from "../actions/types";

const peopleInitialState = {
  myId: null,
  host: null,
  items: {},
  order: [],
};

function getPeople(state, { payload }) {
  let newState = { ...state };

  let fetchedItems = payload.items;
  let fetchedOrder = payload.order;

  let updatedOrder = [...newState.order];
  let updatedItems = { ...newState.items };
  Object.keys(fetchedItems).forEach((key) => {
    let item = fetchedItems[key];
    updatedItems[key] = item;
  });

  fetchedOrder.forEach((key) => {
    updatedOrder.push(key);
  });
  updatedOrder = Array.from(new Set(updatedOrder));

  newState.items = updatedItems;
  newState.order = updatedOrder;
  return newState;
}

function removePeople(state, { payload }) {
  let newState = { ...state };
  let ids = payload.ids.map(String);
  if (isDef(ids)) {
    let newOrder = state.order.filter((id) => !ids.includes(String(id)));
    let newItems = {};
    Object.keys(state.items).forEach((key) => {
      if (!ids.includes(String(key))) {
        newItems[key] = state.items[key];
      }
    });
    newState.items = newItems;
    newState.order = newOrder;
  }
  return newState;
}

function getHost(state, { payload }) {
  let newState = { ...state };
  newState.host = payload.host;
  return newState;
}

function getMyId(state, { payload }) {
  let newState = { ...state };
  newState.myId = payload.me;
  return newState;
}

const reducer = function(state = peopleInitialState, action) {
  let updatedState = state;
  switch (action.type) {
    case "RESET":
      return JSON.parse(JSON.stringify(peopleInitialState));

    case GET_PEOPLE:
      updatedState = getPeople(state, action);
      return updatedState;

    case REMOVE_PEOPLE:
      updatedState = removePeople(state, action);
      return updatedState;
    case GET_HOST:
      updatedState = getHost(state, action);
      return updatedState;

    case GET_MY_ID:
      updatedState = getMyId(state, action);
      return updatedState;

    default:
      return state;
  }
};

export { peopleInitialState };
export default reducer;
