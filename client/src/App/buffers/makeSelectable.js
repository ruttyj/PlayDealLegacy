export default function makeSelectable(reduxState, prefix, nestedPath) {
  function getMeta(path, fallback = null) {
    let _path = isArr(path) ? path : [path];
    return reduxState.get([...nestedPath, ..._path], fallback);
  }
  function getAll() {
    return reduxState.get([...nestedPath], null);
  }
  function getEnable() {
    return reduxState.get([...nestedPath, "enable"], false);
  }
  function getType() {
    return reduxState.get([...nestedPath, "type"], "add");
  }
  function getLimit() {
    return reduxState.get([...nestedPath, "limit"], 0);
  }
  function getSelectable() {
    return reduxState.get([...nestedPath, "selectable"], []);
  }
  function hasSelectableValue(value) {
    return getSelectable().includes(value);
  }
  function getSelected() {
    return reduxState.get([...nestedPath, "selected"], []);
  }
  function hasSelectedValue(value) {
    return getSelected().includes(value);
  }
  function canSelectMoreValues() {
    return (
      getLimit() - getSelected().length > 0
    );
  }

  const publicScope = {};
  publicScope[`${prefix}_getMeta`] = getMeta;
  publicScope[`${prefix}_getAll`] = getAll;
  publicScope[`${prefix}_getEnable`] = getEnable;
  publicScope[`${prefix}_getType`] = getType;
  publicScope[`${prefix}_getLimit`] = getLimit;
  publicScope[`${prefix}_getSelectable`] = getSelectable;
  publicScope[`${prefix}_hasSelectableValue`] = hasSelectableValue;
  publicScope[`${prefix}_getSelected`] = getSelected;
  publicScope[`${prefix}_hasSelectedValue`] = hasSelectedValue;
  publicScope[`${prefix}_canSelectMoreValues`] = canSelectMoreValues;

  return publicScope;
}