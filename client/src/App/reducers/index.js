import { combineReducers } from "redux";

import roomReducers from "./roomReducers";
import peopleReducers from "./peopleReducers";
import gameReducers from "./gameReducers";

export default combineReducers({
  rooms: roomReducers,
  people: peopleReducers,
  game: gameReducers
});
