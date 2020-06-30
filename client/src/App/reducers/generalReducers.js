import { isArr, isDef, setImmutableValue, getNestedValue } from "../../utils/";

const initialState = {
  heyYall: true,
};
const reducer = function(state = initialState, action) {
  let subjectName;
  let updatedState;
  let path, _path;
  let value, _value;
  switch (action.type) {
    case "SET":
      _path = getNestedValue(action, ["payload", "path"], []);
      path = isArr(_path) ? _path : [_path];
      value = getNestedValue(action, ["payload", "value"], {});

      let updatedState = state;
      updatedState = setImmutableValue(updatedState, path, value);
      return updatedState;
    default:
      return state;
  }
};

export default reducer;
export { initialState };
