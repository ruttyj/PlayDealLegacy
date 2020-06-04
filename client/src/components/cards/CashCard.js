import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import BaseDealCard from "./BaseDealCard";
import PriceDiamond from "./elements/PriceDiamond";
import { els } from "../../utils/";

let red = "#a50c0c";
let purple = "#940194";
let blue = "#0193d2";
let green = "#049004";
let orange = "orange";
let grey = "grey";

const DealCashCard = ({ card = {}, style = {} }) => {
  let bkgdColor;

  let value = els(card.value, 0);
  switch (value) {
    case 10:
      bkgdColor = red;
      break;

    case 5:
      bkgdColor = purple;
      break;

    case 4:
      bkgdColor = blue;
      break;

    case 3:
      bkgdColor = green;
      break;

    case 2:
      bkgdColor = orange;
      break;

    case 1:
    default:
      bkgdColor = grey;
      break;
  }

  const styles = makeStyles((theme) => ({
    center: {
      top: "50%",
      left: "50%",
      position: "absolute",
      transform: "translateX(-50%) translateY(-50%)",
    },
  }));
  const classes = styles();

  return (
    <BaseDealCard color={bkgdColor} style={style}>
      <div className={classes.center}>
        <PriceDiamond value={value} color={bkgdColor} />
      </div>
    </BaseDealCard>
  );
};

export default DealCashCard;
