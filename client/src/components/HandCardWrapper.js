import React, { useState } from "react";
import { isDef } from "../utils/";
const HandCardWrapper = ({
  children,
  style = {},
  onClick = () => {},
  overlap = "20px",
}) => {
  const [isHover, setIsHover] = useState(false);

  if (!isDef(overlap)) {
    overlap = "20px";
  }

  let currentStyle = {
    transition: "all 500ms linear",
  };

  if (isHover) {
    Object.assign(currentStyle, { margin: `0px ${overlap} 0px ${overlap}` });
  } else {
    Object.assign(currentStyle, { margin: `0px -${overlap} 0px -${overlap}` });
  }

  return (
    <div
      style={{ ...currentStyle, ...style }}
      onClick={() => onClick()}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      {children}
    </div>
  );
};

export default HandCardWrapper;
