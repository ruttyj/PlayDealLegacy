import React from "react";

export default ({ children }) => {
  return (
    <div style={{ display: "flex", flexGrow: 1 }}>
      <div style={{ position: "relative", height: "100%", width: "100%" }}>
        {children}
      </div>
    </div>
  );
};
