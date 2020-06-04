import React, { useState } from "react";

import RelLayer from "../../layers/RelLayer";
import AbsLayer from "../../layers/AbsLayer";
import ApartmentIcon from "@material-ui/icons/Apartment";
import HomeIcon from "@material-ui/icons/Home";
import CheckLayer from "../../../components/layers/CheckLayer";

const SetCardWrapper = ({ children, top = 0, right = 0, rotation = 0 }) => {
  const [isHovering, setIsHover] = useState(false);

  let style = {
    position: "absolute",
    display: "flex",
    transition: "all 150ms linear"
  };

  if (isHovering) {
    Object.assign(style, {
      top: `${top}px`,
      right: `${right}px`,
      transform: "scale(2)",
      zIndex: 2
    });
  } else {
    Object.assign(style, {
      top: `${top}px`,
      right: `${right}px`,
      transform: `rotate(${rotation}deg)`
    });
  }

  return (
    <div
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      style={{
        ...style
      }}
    >
      {children}
    </div>
  );
};

export default ({
  collectionId = 0,
  cards = [],
  rotation = 0,
  transparent = false,
  isFull = false,
  hasHotel = false,
  hasHouse = false,
  selectionEnabled = false,
  selectType = "add",
  isSelectable = false,
  isSelected = false,
  clickProps = {},
  maxOffset = 60,
  onSelected = () => {}
}) => {
  let numCards = cards.length;
  let offset = maxOffset / numCards;

  let nudge = maxOffset / 3;

  let rightOffset = 15;
  let cardWidth = 37;

  let cardHeight = 60;

  let heightOffset = hasHotel || hasHouse ? "10px" : "0px";

  let calcWidth = cardWidth + rightOffset + offset * (numCards - 1);
  let calcHeight = cardHeight + rightOffset + offset * (numCards - 1);

  let wrappedCards = cards.map((card, i) => {
    return (
      <SetCardWrapper key={i} rotation={rotation} top={offset * i} right={offset * i + nudge}>
        {card}
      </SetCardWrapper>
    );
  });

  let fullSetIndicator = (
    <>
      <fieldset
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          border: "5px solid white",
          borderStyle: "solid",
          borderRadius: "10px",
          mixBlendMode: "overlay"
        }}
      >
        <legend
          style={{
            width: "auto",
            textAlign: "center",
            padding: "0px 5px",
            color: "white",
            fontSize: "10px",
            margin: "auto"
          }}
        >
          Full Set
        </legend>
      </fieldset>
      <fieldset
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          border: "1px solid white",
          borderStyle: "solid",
          borderRadius: "10px",
          opacity: 0.1
        }}
      >
        <legend
          style={{
            width: "auto",
            textAlign: "center",
            padding: "0px 5px",
            color: "white",
            fontSize: "10px",
            margin: "auto"
          }}
        >
          Full Set
        </legend>
      </fieldset>
    </>
  );

  let backdropStyle = transparent ? {} : { backgroundColor: "#00000026", backdropFilter: "blur(15px)" };

  return (
    <div
      style={{
        position: "relative",
        width: "fit-content",
        height: "fit-content",
        ...backdropStyle
      }}
    >
      {isFull ? fullSetIndicator : ""}
      <CheckLayer
        disabled={!selectionEnabled}
        isSelectable={selectionEnabled && isSelectable}
        notApplicable={selectionEnabled && !isSelectable}
        value={selectionEnabled && isSelected}
        success={selectType === "add"}
        onClick={() => {
          if (selectionEnabled && isSelectable) {
            onSelected({ ...clickProps, is: "collection", collectionId, isSelected });
          }
        }}
      >
        <div
          style={{
            margin: "10px",
            position: "relative",
            height: "120px",
            width: "90px",
            display: "inline-flex"
          }}
        >
          <RelLayer>
            <div
              style={{
                position: "absolute",
                top: `calc(50% - ${heightOffset})`,
                left: "50%",
                content: `${calcWidth}`,
                width: `${calcWidth}px`,
                height: `${calcHeight}px`,
                transform: "translateX(-50%) translateY(-50%)"
              }}
            >
              <RelLayer>{wrappedCards}</RelLayer>
            </div>
            <div
              style={{
                position: "absolute",
                bottom: "0px",
                left: "0px",
                color: "black",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-evenly",
                width: "100%"
              }}
            >
              {hasHouse ? <HomeIcon style={{ color: "#00a700" }} /> : ""}
              {hasHotel ? <ApartmentIcon style={{ color: "#ab0000" }} /> : ""}
            </div>
          </RelLayer>
        </div>
      </CheckLayer>
    </div>
  );
};
