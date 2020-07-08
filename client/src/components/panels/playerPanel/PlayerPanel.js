import React from "react";
import BlurredBackground from "../../../packages/ReactWindows/Components/Containers/BlurredWrapper/";
export default ({ children, style = {} }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        backgroundColor: "#3d3d3d",
        position: "relative",
        ...style,
      }}
    >
      <BlurredBackground>{children}</BlurredBackground>
    </div>
  );
};
