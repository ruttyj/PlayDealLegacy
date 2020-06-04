import React, { useState } from "react";

export default ({ children, percent = 60, hoverPercent }) => {
  const [isHovering, setIsHovering] = useState(false);
  let originalSize = {
    width: 145,
    height: 225
  };

  let scale = percent / 100;
  if (isHovering) {
    scale = hoverPercent / 100;
  }

  let newSize = {
    width: originalSize.width * scale,
    height: originalSize.height * scale
  };

  return (
    <div
      style={{
        display: "inline-block",
        position: "relative",
        transition: "all 400ms linear",
        width: `${newSize.width}px`,
        height: `${newSize.height}px`,
        transform: `scale(${scale})`
      }}
    >
      <div
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{
          top: "50%",
          left: "50%",
          position: "absolute",
          transition: "all 1000ms linear",
          transform: `translateX(-50%) translateY(calc(-50%))`
        }}
      >
        {children}
      </div>
    </div>
  );
};
