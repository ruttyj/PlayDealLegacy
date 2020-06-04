import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";

const primaryButtonStyles = makeStyles(theme => ({
  spacing: {
    margin: theme.spacing(1)
  }
}));
const PrimaryButton = ({ onClick, children, disabled = false }) => {
  const classes = primaryButtonStyles();

  return (
    <Button
      variant="contained"
      color="primary"
      disabled={disabled}
      className={classes.spacing}
      onClick={() => onClick()}
    >
      {children}
    </Button>
  );
};

export default PrimaryButton;
