import React from "react";
import { makeStyles } from "@material-ui/core/styles";

import Paper from "@material-ui/core/Paper";

const useStyles = makeStyles(theme => ({
  myMessage: {
    backgroundColor: "#0974da",
    color: "white",
    padding: theme.spacing(1),
    textAlign: "left",
    maxWidth: "70%",
    margin: "6px",
    wordBreak: "break-word"
  }
}));

const MyMessageBlock = function({ children }) {
  const classes = useStyles();
  return (
    <Paper xs={8} className={classes.myMessage}>
      {children}
    </Paper>
  );
};
export default MyMessageBlock;
