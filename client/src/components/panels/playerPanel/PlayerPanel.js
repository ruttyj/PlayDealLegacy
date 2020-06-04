import React from "react";

export default ({ children, style = {} }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        backgroundColor: "#00000026",
        backdropFilter: "blur(15px)",
        position: "relative",
        ...style
      }}
    >
      {children}
    </div>
  );
};
