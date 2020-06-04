import React from "react";

import BaseDealCard from "./BaseDealCard";
import { els } from "../../utils/";
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
    textTransform: "uppercase",
    borderRadius: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  img_style: {
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
  let cardValue = els(card.value, 0);
  const classes = styles();
  return (
    <BaseDealCard style={style}>
      <div className={classes.card_wrapper}>
        <div className={classes.card_image_wrapper}>
          <img
            src="https://cdn.onlinewebfonts.com/svg/img_481249.png"
            alt="Hotel"
            className={classes.img_style}
          />
        </div>
        <div className={classes.card_title}>Hotel</div>
      </div>
      <MiniPriceDiamond value={cardValue} />
    </BaseDealCard>
  );
};
