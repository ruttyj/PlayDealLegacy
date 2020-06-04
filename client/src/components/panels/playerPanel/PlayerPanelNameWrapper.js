import React from "react";

export default ({ children }) => {
  return (
    <div
      style={{
        height: "100%",
        flexDirection: "column",
        display: "inline-flex",
        paddingRight: "20px",
        borderRight: "3px solid #00000038",
        transition: "all 150ms linear",
      }}
    >
      {children}
    </div>
  );
};
