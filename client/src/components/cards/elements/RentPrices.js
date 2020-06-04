import React from "react";
import { makeStyles } from "@material-ui/core/styles";
var classNames = require("classnames");

const RentPrices = ({ prices }) => {
  const styles = makeStyles(theme => ({
    title: {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignIitems: "center",
      justifyContent: "center",
      fontSize: "12px",
      fontWeight: "bold",
      textTransform: "uppercase",
      fontFamily: "sans-serif",
      opacity: "1",
      color: "white",
      textAlign: "center"
    },
    left_block: {
      width: "100%",
      opacity: "1",
      color: "white",
      fontWeight: "bold !important",
      fontSize: "0.8em",
      borderBottom: "1px solid #ffffff00",
      flexDirection: "row",
      justifyContent: "space-evenly",
      display: "inline-flex"
    },
    center: {
      marginTop: "10px",
      left: "50%",
      width: "100%",
      position: "absolute",
      transform: "translateX(-50%)"
    },
    count: {
      display: "inline-flex",
      flexGrow: "0",
      alignItems: "center",
      justifyContent: "center"
    },
    value: {
      display: "inline-flex",
      flexGrow: "0",
      alignItems: "center",
      justifyContent: "center"
    },
    row: {
      display: "flex",
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-evenly",
      color: "white",
      fontWeight: "bold"
    },
    currency_symbol: {
      transform: "rotate(180deg)",
      display: "inline-block",
      fontFamily: "Verdana",
      fontSize: "0.6em",
      opacity: "0.7"
    }
  }));
  const classes = styles();
  let symbol = "\u20A9";
  return (
    <div className={classes.center}>
      <div className={classes.title}>
        <div className={classes.left_block}>
          <div className={classes.count}>#</div>
          <div className={classes.value}>Rent</div>
        </div>
      </div>
      {prices.map((price, index) => (
        <div key={index} className={classes.row}>
          <div className={classes.count}>{index + 1}</div>
          <div className={classes.value}>
            <span className={classes.currency_symbol}>{symbol}</span>
            {price}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RentPrices;
