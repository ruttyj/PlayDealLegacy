import React from "react";
import Utils from "../../../Utils";
const { classes } = Utils;
export default ({ children, style = {}, classNames = [], className = "" }) => {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        flexGrow: 1,
        display: "flex",
        ...style,
      }}
      {...classes(className, classNames)}
    >
      {children}
    </div>
  );
};
