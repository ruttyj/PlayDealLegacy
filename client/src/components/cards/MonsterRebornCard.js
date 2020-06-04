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
    width: "100%",
    height: "100%",
    margin: "auto",
    borderRadius: "100%",
  },
  card_wrapper: {
    position: "absolute",
    height: "100%",
    width: "100%",
    backgroundImage: "url('/img/Lolz/monsterReborn.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  card_title: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    textTransform: "uppercase",
    backgroundColor: "#000000ba",
    position: "absolute",
    padding: "5px 0px",
    top: "65%",
    width: "100%",
  },
}));
export default ({ card = {}, style = {} }) => {
  let color = "#0193d2";
  let cardValue = isDef(card) && isDef(card.value) ? card.value : 0;
  const classes = styles();
  return (
    <BaseDealCard color={color} style={style}>
      <div className={classes.card_wrapper}>
        <div className={classes.card_title}>Reborn</div>
      </div>
      <MiniPriceDiamond value={cardValue} color={color} />
    </BaseDealCard>
  );
};
