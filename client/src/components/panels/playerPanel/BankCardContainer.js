import React from "react";
import RelLayer from "../../layers/RelLayer";

export default ({ cards = [] }) => {
  let maxOffset = 20;
  let numCards = cards.length;
  let offset = maxOffset / numCards;

  let wrappedCards = cards.map((card, i) => {
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          display: "flex",
          top: `${offset * i}px`,
          right: `${offset * i}px`,
          transform: "rotate(90deg)"
        }}
      >
        {card}
      </div>
    );
  });

  return (
    <div
      style={{
        height: "70px",
        width: "100px",
        display: "inline-flex",
        position: "relative"
      }}
    >
      <RelLayer>{wrappedCards}</RelLayer>
    </div>
  );
};
