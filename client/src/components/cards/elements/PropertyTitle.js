import React from "react";
import { makeStyles } from "@material-ui/core/styles";
var classNames = require("classnames");

const PropertyTitle = ({ title, color = null }) => {
  const styles = makeStyles(theme => ({
    title: {
      position: "absolute",
      height: "45px",
      backgroundColor: "black",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      fontSize: "12px",
      fontWeight: "bold",
      textTransform: "uppercase",
      fontFamily: "sans-serif",
      opacity: "1",
      color: "white",
      textAlign: "center"
    }
  }));
  const classes = styles();

  return <div className={classes.title}>{title}</div>;
};

export default PropertyTitle;
