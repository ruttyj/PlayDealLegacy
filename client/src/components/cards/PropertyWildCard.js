import React, { useState } from "react";
import { isDef, isFunc, getNestedValue } from "../../utils/";
import MiniPriceDiamond from "./elements/MiniPriceDiamond";
import BaseDealCard from "./BaseDealCard";
import PropertyTitle from "./elements/PropertyTitle";
import RentPrices from "./elements/RentPrices";
import { makeStyles } from "@material-ui/core/styles";

const PropertyWildCard = ({
  onClick,
  children,
  card = {},
  disabled = false,
  propertySets = {},
  onActiveSetChange,
  style = {},
}) => {
  let cardValue = isDef(card) && isDef(card.value) ? card.value : 0;
  let getColorForSetKey = (propertySetKey) =>
    getNestedValue(propertySets, [propertySetKey, "colorCode"], "grey");
  let getPropertySetRent = (propertySetKey) => {
    let result = [];
    let propertySet = getNestedValue(propertySets, [propertySetKey], null);
    if (isDef(propertySet)) {
      for (let i = 1; i <= propertySet.size; ++i) {
        if (isDef(propertySet.rent[i])) result.push(propertySet.rent[i]);
      }
    }
    return result;
  };

  let classDefs = {
    toggle: {
      position: "absolute",
      top: "45px",
      width: "100%",
      display: "flex",
      content: " ",
      height: "Calc(100% - 45px)",
    },

    color_block: {
      height: "100%",
      display: "inline-block",
    },
  };

  Object.keys(propertySets).forEach((propertySetKey) => {
    let propertySet = propertySets[propertySetKey];
    let color = propertySet.colorCode;
    classDefs[`color_${propertySetKey}`] = {
      backgroundColor: color,
      mixBlendMode: "color",
    };
  });

  const styles = makeStyles((theme) => classDefs);
  const classes = styles();
  let renderOptions = card.sets.map((propertySetKey) => {
    let thisColor = getColorForSetKey(propertySetKey);
    let isActive = propertySetKey === card.set;
    return (
      <div
        key={propertySetKey}
        onClick={() => {
          if (isFunc(onActiveSetChange))
            onActiveSetChange({ cardId: card.id, propertySetKey });
        }}
        className={classes.color_block}
        style={{
          border: `2px solid black`,
          width: isActive ? `100%` : `20px`,
          transition: "all 150ms linear",
        }}
      >
        <div
          className={classes.color_block}
          style={{
            backgroundColor: isActive ? "transparent" : thisColor,
            opacity: isActive ? "1" : "0.8",
            width: `100%`,
            height: "100%",
            position: "relative",
          }}
        >
          {isActive ? (
            <RentPrices prices={getPropertySetRent(propertySetKey)} />
          ) : (
            <br />
          )}
        </div>
      </div>
    );
  });

  return (
    <BaseDealCard color={getColorForSetKey(card.set)} style={style}>
      <PropertyTitle title="Wild Card" />
      <div className={classes.toggle}>{renderOptions}</div>
      <MiniPriceDiamond value={cardValue} />
    </BaseDealCard>
  );
};

export default PropertyWildCard;
