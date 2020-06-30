import React, { useState } from "react";
import generalActions from "../../App/actions/generalActions";
import generalGetters from "../../App/getters/generalGetters";
import { connect } from "react-redux";
import utils from "../../utils/index";
import StateBuffer from "../../utils/StateBuffer";

const reduxConnect = connect;

const { isDef } = utils;

const GeneralController = (_initialState = {}) => {
  const stateBuffer = StateBuffer();

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

    //const middleMan = (OriginalComp) => {
    //    return <OriginalComp />
    //}

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

  const publicScope = {
    connect,
    interceptProps,
    dispatch,
    ...stateBuffer,
  };

  function getPublic() {
    return publicScope;
  }
  return getPublic();
};

var GeneralControllerSingleton = (function() {
  let instance;

  function createInstance() {
    const object = GeneralController();
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

export default GeneralControllerSingleton;
