import { isArr, setImmutableValue, getNestedValue } from "../../utils/";

const initialState = {};
const reducer = function(state = initialState, action) {
  let updatedState;
  let path, _path;
  let value;
  switch (action.type) {
    case "SET":
      _path = getNestedValue(action, ["payload", "path"], []);
      path = isArr(_path) ? _path : [_path];
      value = getNestedValue(action, ["payload", "value"], {});

      updatedState = state;
      updatedState = setImmutableValue(updatedState, path, value);
      return updatedState;
    default:
      return state;
  }
};

export default reducer;
export { initialState };
