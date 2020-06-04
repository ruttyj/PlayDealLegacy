import React from "react";
import { makeStyles } from "@material-ui/core/styles";
const CurrencyText = ({ children, prices, fontSizeEm = "0.6" }) => {
  const styles = makeStyles(theme => ({
    center: {
      marginTop: "10px",
      left: "50%",
      width: "100%",
      position: "absolute",
      transform: "translateX(-50%)"
    },
    currency_symbol: {
      transform: "rotate(180deg)",
      display: "inline-block",
      fontFamily: "Verdana",
      fontSize: `${fontSizeEm}em`,
      opacity: "0.7"
    }
  }));
  const classes = styles();

  let symbol = "\u20A9";
  return (
    <>
      <span className={classes.currency_symbol}>{symbol}</span>
      {children}
    </>
  );
};

export default CurrencyText;
