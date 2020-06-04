import React from "react";

export default ({ children }) => {
  return (
    <div
      style={{
        padding: "10px",
        width: "100%",
        display: "flex",
        flexDirection: "row"
      }}
    >
      {children}
    </div>
  );
};
