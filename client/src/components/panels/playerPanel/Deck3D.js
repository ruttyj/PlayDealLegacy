import React, { useState } from "react";

const ScaleDeck = ({ children, percent = 100 }) => {
  let originalSize = {
    width: 150,
    height: 225
  };

  let scale = percent / 100;
  let spacing = 1.5;
  let newSize = {
    width: originalSize.width * scale * spacing,
    height: originalSize.height * scale * spacing
  };

  return (
    <div
      style={{
        display: "inline-block",
        position: "relative",
        width: newSize.width,
        height: newSize.height
      }}
    >
      <div
        style={{
          transform: ` scale(${scale})`
        }}
      >
        <div
          style={{
            transform: `translateX(-50%) translateY(-80%)`
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default ({ children, thickness = 100, rotateX = 30, percent = 100 }) => {
  let [isHovered, setIsHovered] = useState(false);

  let maxThickness = 90;
  let displayThickness = Math.max(
    5,
    Math.ceil((maxThickness * thickness) / 100)
  );

  const variableStyle = {
    margin: "40px",
    DeckThickness: "90px"
  };

  const transformRotationStyle = {};

  if (isHovered) {
    Object.assign(transformRotationStyle, {
      transform: `translateZ(0px) rotateX(0deg) rotateY( 0deg)`
    });
  } else {
    Object.assign(transformRotationStyle, {
      transform: `translateZ(0px) rotateX(${rotateX}deg) rotateY( 0deg)`
    });
  }

  return (
    <ScaleDeck percent={percent}>
      <div
        className="scene"
        style={{
          "--deck-thickness": `${displayThickness}px`,
          ...variableStyle
        }}
      >
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="pile "
          style={transformRotationStyle}
        >
          <div className="pile__face pile__face--front">{children}</div>
          <div className="pile__face pile__face--back" />
          <div className="pile__face pile__face--right" />
          <div className="pile__face pile__face--left" />
          <div className="pile__face pile__face--top" />
          <div className="pile__face pile__face--bottom" />
        </div>
      </div>
    </ScaleDeck>
  );
};
