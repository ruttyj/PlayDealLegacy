import { combineReducers } from "redux";

import generalReducers from "./generalReducers";
export default combineReducers({
  general: generalReducers,
});
