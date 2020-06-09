import React from "react";
import Typography from "@material-ui/core/Typography";

const HeaderTitle = ({ children, style = {}, variant = "h4" }) => (
  <Typography
    style={{ textAlign: "center", ...style }}
    variant={variant}
    gutterBottom
  >
    {children}
  </Typography>
);

export default HeaderTitle;
