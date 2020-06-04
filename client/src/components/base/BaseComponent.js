import React from "react";
import StateBuffer from "../../App/buffers/StateBuffer";

class BaseComponent extends React.Component {
  constructor(props, context) {
    super(props, context);
    // Init State
    this.state = {};
    this.currentState = StateBuffer(this.state);
    this.setState = this.setState.bind(this);
    this.currentState.setSetter(this.setState);
    this.set = this.currentState.set;
    this.is = this.currentState.is;
    this.get = this.currentState.get;
    this.inc = this.currentState.inc;
    this.dec = this.currentState.dec;
    this.map = this.currentState.map;
    this.toggle = this.currentState.toggle;
    this.forEach = this.currentState.forEach;
  }
}

export default BaseComponent;
