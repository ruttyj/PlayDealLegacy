import React from "react";

//RelativeLayer
export default ({ children, style = {} }) => {
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: "100%",
        height: "100%",
        ...style
      }}
    >
      {children}
    </div>
  );
};
