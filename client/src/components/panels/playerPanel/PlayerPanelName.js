import React from "react";

export default ({ children }) => {
  return (
    <div
      style={{
        fontSize: "20px",
        textTransform: "uppercase",
        fontWeight: "bold",
        textAlign: "center"
      }}
    >
      {children}
    </div>
  );
};
