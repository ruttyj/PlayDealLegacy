import React from "react";
import { makeStyles } from "@material-ui/core/styles";

import Paper from "@material-ui/core/Paper";

const useStyles = makeStyles(theme => ({
  theirMessage: {
    backgroundColor: "#f1f1f1",
    color: "black",
    padding: theme.spacing(1),
    textAlign: "left",
    maxWidth: "70%",
    margin: "6px",
    wordBreak: "break-word"
  }
}));

const TheirMessageBlock = function({ children }) {
  const classes = useStyles();
  return (
    <Paper xs={8} className={classes.theirMessage}>
      {children}
    </Paper>
  );
};
export default TheirMessageBlock;
