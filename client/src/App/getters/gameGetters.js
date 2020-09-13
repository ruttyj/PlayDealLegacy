import { isArr } from "../../utils/";
import ReduxState from "../controllers/reduxState";
const reduxState = ReduxState.getInstance();

const makeGetters = (state) => {
  const publicScope = {};

  const cardSelection = {
    cardSelection_getMeta(path, fallback = null) {
      let _path = isArr(path) ? path : [path];
      return reduxState.get(["game", "cardSelect", ..._path], fallback);
    },
    cardSelection_getAll() {
      return reduxState.get(["game", "cardSelect"], null);
    },
    cardSelection_getEnable() {
      return reduxState.get(["game", "cardSelect", "enable"], false);
    },
    cardSelection_getType() {
      return reduxState.get(["game", "cardSelect", "type"], "add");
    },
    cardSelection_getLimit() {
      return reduxState.get(["game", "cardSelect", "limit"], 0);
    },
    cardSelection_getSelectable() {
      return reduxState.get(["game", "cardSelect", "selectable"], []);
    },
    cardSelection_hasSelectableValue(value) {
      return publicScope.cardSelection_getSelectable().includes(value);
    },
    cardSelection_getSelected() {
      return reduxState.get(["game", "cardSelect", "selected"], []);
    },
    cardSelection_hasSelectedValue(value) {
      return publicScope.cardSelection_getSelected().includes(value);
    },
    cardSelection_canSelectMoreValues() {
      return (
        publicScope.cardSelection_getLimit() -
          publicScope.cardSelection_getSelected().length >
        0
      );
    },
  };

  const collectionSelection = {
    collectionSelection_getAll() {
      return reduxState.get(["game", "collectionSelect"], null);
    },
    collectionSelection_getEnable() {
      return reduxState.get(["game", "collectionSelect", "enable"], false);
    },
    collectionSelection_getType() {
      return reduxState.get(["game", "collectionSelect", "type"], "add");
    },
    collectionSelection_getLimit() {
      return reduxState.get(["game", "collectionSelect", "limit"], 0);
    },
    collectionSelection_getSelectable() {
      return reduxState.get(["game", "collectionSelect", "selectable"], []);
    },
    collectionSelection_hasSelectableValue(value) {
      return publicScope.collectionSelection_getSelectable().includes(value);
    },
    collectionSelection_getSelected() {
      return reduxState.get(["game", "collectionSelect", "selected"], []);
    },
    collectionSelection_hasSelectedValue(value) {
      return publicScope.collectionSelection_getSelected().includes(value);
    },
  };

  const personSelection = {
    personSelection_getAll() {
      return reduxState.get(["game", "personSelect"], null);
    },
    personSelection_getEnable() {
      return reduxState.get(["game", "personSelect", "enable"], false);
    },
    personSelection_getType() {
      return reduxState.get(["game", "personSelect", "type"], "add");
    },
    personSelection_getLimit() {
      return reduxState.get(["game", "personSelect", "limit"], 0);
    },
    personSelection_getSelectable() {
      return reduxState.get(["game", "personSelect", "selectable"], []);
    },
    personSelection_hasSelectableValue(value) {
      return publicScope.personSelection_getSelectable().includes(value);
    },
    personSelection_getSelected() {
      return reduxState.get(["game", "personSelect", "selected"], []);
    },
    personSelection_hasSelectedValue(value) {
      return publicScope.personSelection_getSelected().includes(value);
    },
    personSelection_canSelectMoreValues() {
      return (
        publicScope.personSelection_getLimit() -
          publicScope.personSelection_getSelected().length >
        0
      );
    },
  };

  Object.assign(publicScope, {
    // GAME STATUS

    ...cardSelection,
    ...collectionSelection,
    ...personSelection,
  });

  return publicScope;
};

export default makeGetters;
