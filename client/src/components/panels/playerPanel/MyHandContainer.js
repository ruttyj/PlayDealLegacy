import React from "react";

export default ({ children, hasTooManyCards = false, style = {} }) => {
  let tooManyCardsStyle = hasTooManyCards ? { backgroundColor: "#ff000078" } : { backgroundColor: "rgba(0, 0, 0, 0.23)" };

  return (
    <div
      style={{
        flexGrow: "1",
        display: "flex",
        flexDirection: "column",
        margin: "0px 00px 0px 10px",
        ...style
      }}
    >
      <div
        style={{
          display: "flex",
          flexGrow: "1"
        }}
      >
        <div
          style={{
            backdropFilter: "blur(15px)",
            height: "100%",
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            display: "flex",
            //borderRadius: "20px",
            border: "3px solid #2b2b2b57",
            margin: "0px 0px 0px 20px",
            borderStyle: "outset",
            boxShadow: "inset 0px -1px 20px 20px rgba(0, 0, 0, 0.2)",
            transition: "all, 150ms linear",
            ...tooManyCardsStyle
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
