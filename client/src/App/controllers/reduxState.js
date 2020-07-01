import React, { useState } from "react";
import generalActions from "../../App/actions/generalActions";
import generalGetters from "../../App/getters/generalGetters";
import { peopleInitialState } from "../reducers/peopleReducers";
import { gameInitialState } from "../../App/reducers/gameReducers";
import { roomsInitialState } from "../../App/reducers/roomReducers";

import { connect } from "react-redux";
import utils from "../../utils/index";
import StateBuffer from "../../utils/StateBuffer";

const reduxConnect = connect;

const { isDef } = utils;

const ReduxState = (_initialState = {}) => {
  const stateBuffer = StateBuffer(_initialState);

  // Connect to redux
  function connect() {
    // data will be in generalState
    const mapStateToProps = (state) => ({
      ...generalGetters(state),
    });

    // actions can only be 1 level deep
    const mapDispatchToProps = {
      ...generalActions,
    };

    const connectedComp = reduxConnect(mapStateToProps, mapDispatchToProps);
    return connectedComp;
  }

  function interceptProps(props) {
    stateBuffer.setSetter(props.set);
  }

  function dispatch(storeName, reducers, action) {
    let updatedState = stateBuffer.get(storeName, {});
    updatedState = reducers(updatedState, action);
    stateBuffer.set(storeName, updatedState);
  }

  async function directDispatch(storeName, disp, reducers, action) {
    let updatedState = stateBuffer.get(storeName, {});
    updatedState = reducers(updatedState, action);
    const setter = (path, value) => {
      disp({
        type: "SET",
        action: {
          path,
          value,
        },
      });
    };
    stateBuffer.setSetter(setter);
    await stateBuffer.set(storeName, updatedState);
  }

  const publicScope = {
    connect,
    interceptProps,
    dispatch,
    directDispatch,
    ...stateBuffer,
  };

  function getPublic() {
    return publicScope;
  }
  return getPublic();
};

// Have only 1 global instance
var ReduxStateSingleton = (function() {
  let instance;

  function createInstance() {
    const object = ReduxState({
      game: gameInitialState,
      people: peopleInitialState,
      rooms: roomsInitialState,
    });
    return object;
  }

  return {
    getInstance: function() {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    },
  };
})();

export default ReduxStateSingleton;
