import React from "react";

export default ({ children }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row-reverse",
        flexGrow: "1"
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          flexDirection: "row-reverse",
          flexWrap: "wrap"
        }}
      >
        <div style={{ textAlign: "right" }}>Collections</div>

        <div
          style={{
            display: "flex",
            width: "100%",
            flexDirection: "row",
            justifyContent: "flex-end",
            flexWrap: "wrap"
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
