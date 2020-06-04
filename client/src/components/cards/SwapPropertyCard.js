import React from "react";

import BaseDealCard from "./BaseDealCard";
import { isDef } from "../../utils/";
import MiniPriceDiamond from "./elements/MiniPriceDiamond";
//#################################################################

import { makeStyles } from "@material-ui/core/styles";

const styles = makeStyles((theme) => ({
  root: {
    backgroundColor: "#333",
    color: "white",
    height: "100%",
  },

  card_image_wrapper: {
    height: "90px",
    margin: "10px auto",
    marginBottom: "10px",
    width: "90px",
    background: "#ffffffc2",
    border: "4px solid black",
    color: "white",
    fontWeight: "bold",
    textTransform: "uppercase",
    borderRadius: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  deal_breaker: {
    height: "90px",
    margin: "20px auto",
    marginBottom: "10px",
    width: "90px",
    background: "#ffffffc2",
    border: "4px solid black",
    color: "white",
    fontWeight: "bold",
    textTransform: "uppercase",
    borderRadius: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  trump: {
    color: "black",
    display: "flex",
    fontSize: "85px",
    lineHeight: "0.95em",
    alignItems: "center",
    justifyContent: "center",
    WebkitTextStroke: "2px #ffffff26",
  },
  img_style: {
    width: "75px",
    height: "75px",
    margin: "auto",
  },
  img_style_smaller: {
    width: "50px",
    height: "50px",
    margin: "auto",
  },
  card_wrapper: {
    position: "absolute",
    height: "100%",
    width: "100%",
  },
  card_title: {
    color: "white",
    fontWeight: "bold",
    textTransform: "uppercase",
    textAlign: "center",
  },
}));
export default ({ card = {}, style = {} }) => {
  let color = "#0193d2";
  let cardValue = isDef(card) && isDef(card.value) ? card.value : 0;
  const classes = styles();
  return (
    <BaseDealCard color={color} style={style}>
      <div className={classes.card_wrapper}>
        <div className={classes.card_image_wrapper}>
          <img
            src="https://static.thenounproject.com/png/344049-200.png"
            alt="Swap Property"
            className={classes.img_style_smaller}
          />
        </div>
        <div className={classes.card_title}>Swap Property</div>
      </div>
      <MiniPriceDiamond value={cardValue} color={color} />
    </BaseDealCard>
  );
};
