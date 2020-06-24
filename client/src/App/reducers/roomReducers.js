import { GET_ROOMS, CREATE_ROOM, SET_CURRENT_ROOM } from "../actions/types";

const initialState = {
  currentRoom: null,
  items: {},
};

function getRooms(state, action) {
  return {
    ...state,
    items: action.payload,
  };
}

function createRoom(state, action) {
  let newState;
  let { payload } = action;
  let { key, item } = payload;

  let items = { ...state.items };
  items[key] = item;
  newState = {
    ...state,
    items,
  };
  return newState;
}

function setCurrentRoom(state, action) {
  let { payload } = action;
  let newState = {
    ...state,
    currentRoom: payload,
  };
  return newState;
}

const reducer = function(state = initialState, action) {
  switch (action.type) {
    case "RESET":
      return JSON.parse(JSON.stringify(initialState));
    case GET_ROOMS:
      return getRooms(state, action);
    case CREATE_ROOM:
      return createRoom(state, action);
    case SET_CURRENT_ROOM:
      return setCurrentRoom(state, action);
    default:
      return state;
  }
};

export { initialState };
export default reducer;
