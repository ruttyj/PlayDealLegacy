import React from "react";

export default () => {
  let inertState = (
    <div
      style={{
        top: "50%",
        left: "3px",
        width: "3px",
        height: "30px",
        position: "absolute",
        transform: "translateY(-50%)",
        mixBlendMode: "overlay",
        backgroundColor: "white",
        borderRadius: "5px"
      }}
    />
  );
  return (
    <React.Fragment>
      {inertState}
      <div
        style={{
          top: "50%",
          left: "3px",
          width: "3px",
          height: "30px",
          position: "absolute",
          transform: "translateY(-50%)",
          backgroundColor: "white",
          opacity: "0.2",
          borderRadius: "5px"
        }}
      />
    </React.Fragment>
  );
};
