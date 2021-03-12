import React from "react";

export default ({ children }) => {
  return (
    <div
      style={{
        padding: "10px",
        width: "100%",
        display: "flex",
        flexDirection: "row",
        backgroundColor: "#0000003b",
      }}
    >
      {children}
    </div>
  );
};
