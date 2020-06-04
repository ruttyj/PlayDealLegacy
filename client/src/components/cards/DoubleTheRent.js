import React from "react";

import BaseDealCard from "./BaseDealCard";
import { isDef } from "../../utils/";
import MiniPriceDiamond from "./elements/MiniPriceDiamond";
//#################################################################

import { makeStyles } from "@material-ui/core/styles";

const styles = makeStyles((theme) => ({
  card_image_wrapper: {
    height: "90px",
    margin: "10px auto",
    marginBottom: "10px",
    width: "90px",
    background: "#ffffffc2",
    border: "4px solid black",
    color: "white",
    fontWeight: "bold",
    borderRadius: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
  icon_text: {
    color: "black",
    display: "flex",
    fontWeight: "bold",
    fontSize: "45px",
    lineHeight: "0.95em",
    alignItems: "center",
    justifyContent: "center",
    WebkitTextStroke: "2px #ffffff26",
  },
}));

export default ({ card = {}, style = {} }) => {
  let cardValue = isDef(card) && isDef(card.value) ? card.value : 0;

  const classes = styles();
  return (
    <BaseDealCard style={style}>
      <div className={classes.card_wrapper}>
        <div className={classes.card_image_wrapper}>
          <div className={classes.icon_text}>2x</div>
        </div>
        <div className={classes.card_title}>
          Double
          <br />
          The Rent
        </div>
      </div>
      <MiniPriceDiamond value={cardValue} />
    </BaseDealCard>
  );
};
