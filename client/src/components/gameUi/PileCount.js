import React from "react";
const PileCount = ({ children }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        textAlign: "center",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "30px",
        fontFamily: "monospace",
        padding: "5px 10px",
        backgroundColor: "#000000d4",
        borderRadius: "10px",
        transform: "translateX(-50%) translateY(-50%)"
      }}
    >
      {children}
    </div>
  );
};

export default PileCount;
