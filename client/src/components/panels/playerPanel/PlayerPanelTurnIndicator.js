import React from "react";

export default ({ children }) => {
  return (
    <div
      style={{
        content: "",
        backgroundColor: "#ffffff73",
        position: "absolute",
        width: "20px",
        height: "100%",
        left: "-20px",
        mixBlendMode: "overlay"
      }}
    >
      {children}
    </div>
  );
};
