import React, { useState, useEffect } from "react";
import { withStyles, makeStyles } from "@material-ui/core/styles";
import Tooltip from "@material-ui/core/Tooltip";

const useStylesBootstrap = makeStyles((theme) => ({
  arrow: {
    color: theme.palette.common.black,
  },
  tooltip: {
    backgroundColor: theme.palette.common.black,
  },
}));

function BootstrapTooltip(props) {
  const classes = useStylesBootstrap();

  const filteredProps = { ...props };
  let children = null;
  if (filteredProps.children !== undefined) {
    children = filteredProps.children;
    delete filteredProps.children;
  }

  // Tooltip component needs to be able to set a class on the direct descendant.
  return (
    <Tooltip arrow classes={classes} {...filteredProps}>
      <div style={{ display: "inline-flex" }}>{children}</div>
    </Tooltip>
  );
}

export default BootstrapTooltip;
