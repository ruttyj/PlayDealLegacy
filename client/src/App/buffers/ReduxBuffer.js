import gameReducers from "../reducers/gameReducers";
import { getNestedValue } from "../../utils/";
import _ from "lodash";
import { isDef } from "../../../../server/utils";

function ReduxBuffer(_initialState = {}) {
  const initialState = _initialState;
  let inValidated = true;
  let currentState = initialState;

  let tempDispatch = null;
  const _flush = _.debounce(async function () {
    flush(tempDispatch);
  }, 100);

  function dispatch(original, action) {
    tempDispatch = original;
    inValidated = true;
    currentState = gameReducers(currentState, action);
    _flush();
  }

  function flush(_dispatch) {
    if (isDef(_dispatch)) {
      if (inValidated) {
        _dispatch({
          type: "SET_STATE",
          payload: currentState,
        });
      }
    }
  }

  function getState() {
    return currentState;
  }

  function get(path = [], fallback) {
    return getNestedValue(currentState, path, fallback);
  }

  const publicScope = {
    dispatch,
    flush,
    get,
    getState,
  };

  function getPublic() {
    return publicScope;
  }

  return getPublic();
}

export default ReduxBuffer;
