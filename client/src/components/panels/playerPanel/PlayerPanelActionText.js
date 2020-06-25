import React from "react";

export default ({ children }) => {
  return (
    <div
      style={{
        textAlign: "center",
        height: "30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  );
};
