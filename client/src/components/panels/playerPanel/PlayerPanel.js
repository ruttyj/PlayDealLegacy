import React from "react";

export default ({ children, style = {} }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        backgroundColor: "#3d3d3d",
        position: "relative",
        ...style,
      }}
    >
      {children}
    </div>
  );
};
