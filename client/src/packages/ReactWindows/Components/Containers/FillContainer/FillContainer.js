import React from "react";
import Utils from "../../../Utils";
const { classes } = Utils;
// Children will fill space
export default ({ children, classNames = [], className = null }) => {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        height: "100%",
        flexGrow: 1,
        flexDirection: "column",
      }}
      {...classes(classNames, className)}
    >
      {children}
    </div>
  );
};
