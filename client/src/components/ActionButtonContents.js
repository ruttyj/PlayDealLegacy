import React from "react";

const actionButtonContents = {
  waiting: "",
  drawCards: (
    <img
      src="https://static.thenounproject.com/png/219514-200.png"
      alt="Draw Cards"
      style={{
        width: "50px",
        height: "50px",
        filter: "invert(1)"
      }}
    />
  ),
  startGame: (
    <img
      src="/img/start.png"
      alt="Pass Turn"
      style={{
        width: "50px",
        height: "50px",
        filter: "invert(1)"
      }}
    />
  ),
  discard: (
    <img
      src="https://straylightwar.github.io/straylightgames/images/figures/6-2.png"
      alt="Discard Cards"
      style={{
        width: "50px",
        height: "50px",
        filter: "invert(1)"
      }}
    />
  ),
  confirm: (
    <img
      src="/img/check.png"
      alt="confirm"
      style={{
        width: "50px",
        height: "50px",
        filter: "invert(1)"
        //...extraStyle
      }}
    />
  ),
  close: (
    <img
      src="/img/close.png"
      alt="Pass Turn"
      style={{
        width: "50px",
        height: "50px",
        filter: "invert(1)"
      }}
    />
  ),
  nextPhase: (
    <img
      src="https://cdn3.iconfinder.com/data/icons/virtual-notebook/16/button_rotate-512.png"
      alt="Pass Turn"
      style={{
        width: "50px",
        height: "50px",
        filter: "invert(1)"
      }}
    />
  )
};

export default actionButtonContents;
