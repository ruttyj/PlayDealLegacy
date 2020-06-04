import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import MyMessageBlock from "./MyMessageBlock";
import Avatar from "@material-ui/core/Avatar";
import Grid from "@material-ui/core/Grid";

const useStyles = makeStyles(theme => ({
  messageWrapper: {
    padding: "12px"
  },
  avatar: {
    margin: "6px"
  }
}));

const MyMessage = function({ chatItem, i }) {
  let { user, message, event } = chatItem;
  const classes = useStyles();
  return typeof event !== "undefined" ? (
    <Grid
      key={i}
      container
      alignItems="center"
      direction="row"
      justify="flex-end"
      className={classes.messageWrapper}
    >
      <MyMessageBlock>you {event}</MyMessageBlock>
      <Avatar src={user.image} className={classes.avatar} />
    </Grid>
  ) : (
    <Grid
      key={i}
      container
      alignItems="center"
      direction="row"
      justify="flex-end"
      className={classes.messageWrapper}
    >
      <MyMessageBlock>{message}</MyMessageBlock>
      <Avatar src={user.image} className={classes.avatar} />
    </Grid>
  );
};
export default MyMessage;
