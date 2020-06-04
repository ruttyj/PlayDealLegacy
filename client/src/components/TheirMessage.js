import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import TheirMessageBlock from "./TheirMessageBlock";
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

const TheirMessage = function({ chatItem }) {
  let { user, message, event } = chatItem;
  const classes = useStyles();
  return typeof event !== "undefined" ? (
    <Grid
      container
      alignItems="center"
      direction="row"
      justify="flex-start"
      className={classes.messageWrapper}
    >
      <Avatar src={user.image} className={classes.avatar} />
      <TheirMessageBlock>
        {user.name} {event}
      </TheirMessageBlock>
    </Grid>
  ) : (
    <Grid
      container
      alignItems="center"
      direction="row"
      justify="flex-start"
      className={classes.messageWrapper}
    >
      <Avatar src={user.image} className={classes.avatar} />
      <TheirMessageBlock>{message}</TheirMessageBlock>
    </Grid>
  );
};
export default TheirMessage;
