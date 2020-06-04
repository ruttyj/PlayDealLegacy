import React from "react";
import BaseDealCard from "./BaseDealCard";

//#################################################################

import { makeStyles } from "@material-ui/core/styles";

const styles = makeStyles(theme => ({
  wild_all: {
    position: "absolute",
    top: "0px",
    left: "0px",
    width: "100%",
    height: "100%",
    mixBlendMode: "hard-light",
    opacity: "1",
    backgroundImage: "conic-gradient(from -138deg, red, orange, yellow, green, teal, cyan, blue, purple, black, brown, red)"
  },
  wild_content: {
    position: "absolute",
    top: "0px",
    left: "0px",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  wild_text: {
    height: "90px",
    width: "90px",
    borderRadius: "100%",
    border: "5px solid white",
    fontSize: "11px",
    display: "flex",
    color: "white",
    backgroundColor: "black",
    fontWeight: "bold",
    textAlign: "center",
    alignItems: "center",
    justifyItems: "center"
  }
}));

export default (style = {}) => {
  const classes = styles();
  return (
    <BaseDealCard style={style}>
      <div className={classes.wild_all} />
      <div className={classes.wild_content}>
        <div className={classes.wild_text}>WILD PROPERTY</div>
      </div>
    </BaseDealCard>
  );
};
