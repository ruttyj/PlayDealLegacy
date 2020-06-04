import React from "react";

const ActionButtonWrapper = ({ children, style = {} }) => {
  return (
    <div
      className="no_select"
      style={{
        transition: "all 150ms linear",
        width: "150px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        ...style
      }}
    >
      {children}
    </div>
  );
};

export default ActionButtonWrapper;
