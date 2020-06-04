import React from "react";

export default () => {
  let inertState = (
    <div
      style={{
        left: "50%",
        bottom: "3px",
        width: "30px",
        height: "3px",
        position: "absolute",
        transform: "translateX(-50%)",
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
          left: "50%",
          bottom: "3px",
          width: "30px",
          height: "3px",
          position: "absolute",
          transform: "translateX(-50%)",
          mixBlendMode: "overlay",
          backgroundColor: "white",
          borderRadius: "5px",
          opacity: "0.2"
        }}
      />
    </React.Fragment>
  );
};
