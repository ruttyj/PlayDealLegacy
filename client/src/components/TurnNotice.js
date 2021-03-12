import React from "react";
const TurnNotice = ({ children }) => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "0px",
        padding: "20px 0px",
        width: "100%",
        backgroundColor: "#00000073",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 5,
      }}
    >
      {children}
    </div>
  );
};
export default TurnNotice;
