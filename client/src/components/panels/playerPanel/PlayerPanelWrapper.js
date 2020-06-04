import React from "react";

export default ({ children, style = {} }) => {
  return (
    <div
      style={{
        padding: "10px 40px",
        ...style
      }}
    >
      {children}
    </div>
  );
};
