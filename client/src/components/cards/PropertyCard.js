import React from "react";
import BaseDealCard from "./BaseDealCard";
import PropertyTitle from "./elements/PropertyTitle";
import MiniPriceDiamond from "./elements/MiniPriceDiamond";
import RentPrices from "./elements/RentPrices";
import { els, isDef, getNestedValue } from "../../utils/";
var classNames = require("classnames");

let red = "#a50c0c";
let purple = "#940194";
let blue = "#0193d2";
let green = "#049004";
let orange = "orange";
let grey = "grey";

let colors = {
  red: "#a50c0c",
  yellow: "#e8c700",
  orange: "orange",
  green: "#049004",
  teal: "teal",
  cyan: "#00b3d6",
  blue: "#134bbf",
  purple: "#940194",
  black: "#555",
  brown: "#824b00",
};

const PropertyCard = ({
  card = {},
  onClick,
  children,
  disabled = false,
  propertySets = {},
  style = {},
}) => {
  let bkgdColor = getNestedValue(propertySets, [card.set, "colorCode"], "grey");
  let cardValue = isDef(card) && isDef(card.value) ? card.value : 0;

  let keyedRent = getNestedValue(propertySets, [card.set, "rent"], {});
  let rentCount = getNestedValue(propertySets, [card.set, "size"], 0);

  let rentPrices = [];
  for (let i = 1; i <= rentCount; ++i) {
    rentPrices.push(keyedRent[i]);
  }

  return (
    <BaseDealCard color={bkgdColor} style={style}>
      <PropertyTitle title={card.name} />
      <div
        style={{
          position: "absolute",
          top: "45px",
          width: "100%",
          height: "100%",
        }}
      >
        <RentPrices prices={rentPrices} />
      </div>

      <MiniPriceDiamond value={cardValue} />
    </BaseDealCard>
  );
};

export default PropertyCard;
