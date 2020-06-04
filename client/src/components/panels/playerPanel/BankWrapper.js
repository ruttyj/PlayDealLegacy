import React from "react";

export default ({ children, renderTotal }) => {
  let isDef = v => v !== undefined && v !== null;
  let bankValue = isDef(renderTotal) ? renderTotal() : "";
  return (
    <div
      style={{
        flexDirection: "column",
        display: "inline-flex",
        width: "110px",
        flexShrink: "0",
        flexBasis: "auto",
        textAlign: "right"
      }}
    >
      <div style={{ textAlign: "right" }}>{bankValue} Bank</div>
      {children}
    </div>
  );
};
