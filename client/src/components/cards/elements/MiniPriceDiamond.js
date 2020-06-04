import React from "react";
import { makeStyles } from "@material-ui/core/styles";
var classNames = require("classnames");

const MiniPriceDiamond = ({ value = 1, color = "#212121" }) => {
  const cardSymbol = "\u20A9";
  const styles = makeStyles(theme => ({
    priceDiamond: {
      transform: "rotate(45deg)",
      color: "white",
      float: "left",
      border: "2px solid #00000073",
      fontSize: "13px",
      trasnfrom: "rotate(45deg)",
      fontWeight: "bold",
      width: "30px",
      height: "30px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },

    priceDiamondOverlay: {
      content: "",
      height: "100%",
      position: "absolute",
      width: "100%",
      top: "0px",
      left: "0px",
      border: "1px solid #ffffffa3",
      backgroundColor: color,
      backgroundBlendMode: "overlay"
    },

    counterRotate: {
      transform: "rotate(-45deg)"
    },

    cardInnerBkgdOverlay: {
      content: "",
      height: "100%",
      position: "absolute",
      width: "100%",
      top: "0px",
      left: "0px",
      backgroundColor: color,
      opacity: "0.8"
    },

    currencySymbol: {
      transform: "rotate(180deg)",
      display: "inline-block",
      fontFamily: "Verdana",
      fontSize: "0.6em",
      opacity: "0.7"
    }
  }));
  const classes = styles();

  let isInfinate = value === "â" || value === Infinity || value === "Infinity";

  let content = "";

  let infinateSymbol = "\u221E";
  if (isInfinate) {
    content = (
      <>
        <span style={{ fontSize: "2em" }}>{infinateSymbol}</span>
      </>
    );
  } else {
    content = (
      <>
        <span className={classes.currencySymbol}>{cardSymbol}</span>
        {value}
      </>
    );
  }
  return (
    <div style={{ position: "absolute", width: "100%", bottom: "-6px", left: "-6px" }}>
      <div className={classes.rotate}>
        <div className={[classes.priceDiamond]}>
          <div className={[classes.priceDiamondOverlay]} />
          <div className={classes.counterRotate}>{content}</div>
        </div>
      </div>
    </div>
  );
};

export default MiniPriceDiamond;
