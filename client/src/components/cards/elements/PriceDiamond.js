import React from "react";
import { makeStyles } from "@material-ui/core/styles";
var classNames = require("classnames");

const PriceDiamond = ({ value = 1, color = "grey" }) => {
  const cardSymbol = "\u20A9";
  const styles = makeStyles(theme => ({
    priceDiamond: {
      transform: "rotate(45deg)",
      color: "white",
      float: "left",
      border: "8px solid #00000073",
      fontSize: "25px",
      trasnfrom: "rotate(45deg)",
      fontWeight: "bold",
      width: "70px",
      height: "70px",
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
      opacity: "0.5",
      border: "1px solid #ffffffa3",
      backgroundColor: color,
      backgroundImage: "linear-gradient(#c3c3c3, #504c4496)",
      backgroundBlendMode: "overlay"
    },

    center: {
      top: "50%",
      left: "50%",
      position: "absolute",
      transform: "translateX(-50%) translateY(-50%)"
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

  return (
    <div className={classes.rotate}>
      <div className={[classes.priceDiamond]}>
        <div className={[classes.priceDiamondOverlay]} />
        <div className={classes.counterRotate}>
          <span className={classes.currencySymbol}>{cardSymbol}</span>
          {value}
        </div>
      </div>
    </div>
  );
};

export default PriceDiamond;
