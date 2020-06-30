import React, { useState } from "react";
import StateBuffer from "../../utils/StateBuffer";
import { withResizeDetector } from "react-resize-detector";
import { withRouter } from "react-router";
import pluralize from "pluralize";
import {
  els,
  isDef,
  isDefNested,
  isArr,
  getNestedValue,
  emptyFunc,
} from "../../utils/";

// Socket related
import { connect } from "react-redux";
import roomActions from "../../App/actions/roomActions";
import gameActions from "../../App/actions/gameActions";
import generalActions from "../../App/actions/generalActions";
import gameGetters from "../../App/getters/gameGetters";
import generalGetters from "../../App/getters/generalGetters";
import GeneralController from "../../App/controllers/generalController";

const reduxState = GeneralController.getInstance();
const _InnerComp = (props) => {
  reduxState.interceptProps(props);
  return (
    <div>
      <pre>
        <xmp>{JSON.stringify(reduxState.get(), null, 2)}</xmp>
      </pre>
      <button
        onClick={() => {
          reduxState.set(["general", "a"], "first");
          let val = reduxState.get(["general", "a"]);
          reduxState.set(["general", "b"], 0);
          reduxState.set(["general", "c"], `${val} second`);
          reduxState.set(["general", "e"], `${val} second`);
          reduxState.set(["general", "f"], `${val} second`);
          reduxState.set(["general", "g"], `${val} second`);
          reduxState.set(["general", "h"], `${val} second`);
          reduxState.set(["general", "i"], `${val} second`);
          reduxState.set(["general", "j"], `${val} second`);
        }}
      >
        +
      </button>
      <button
        onClick={() => {
          reduxState.inc(["general", "b"], 1);
        }}
      >
        ++
      </button>
      <button onClick={() => reduxState.set(["general"], {})}>-</button>
    </div>
  );
};
const InnerComp = reduxState.connect()(_InnerComp);

const StateDev = (props) => {
  reduxState.interceptProps(props);

  return (
    <div>
      <pre>
        <xmp>{JSON.stringify(reduxState.get(), null, 2)}</xmp>
      </pre>
      <button
        onClick={() => {
          reduxState.set(["general", "a"], "first");
          reduxState.set(["general", "b"], "second");
        }}
      >
        +
      </button>
      <button onClick={() => reduxState.set(["general"], {})}>-</button>
      <InnerComp />
    </div>
  );
};

export default reduxState.connect()(StateDev);
