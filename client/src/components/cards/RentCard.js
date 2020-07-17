import React from "react";
import { isDef } from "../../utils/";

import BaseDealCard from "./BaseDealCard";
import MiniPriceDiamond from "./elements/MiniPriceDiamond";

//#################################################################

import { makeStyles } from "@material-ui/core/styles";

//@TODO get the actuall color codes
let defaultColors = [
  "brown",
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "cyan",
  "blue",
  "purple",
  "black",
];
export default ({
  colors = defaultColors,
  target = "one",
  propertySets,
  card,
  style = {},
}) => {
  let colorCount = colors.length;

  let interval = Math.floor(100 / colorCount + 0.5);

  let runningInterval = 0;
  let sections;
  let sectionsJoin;
  sections = colors.map((color, index) => {
    if (isDef(color)) {
      let propertySet = propertySets[color];
      let colorCode = propertySet.colorCode;
      if (color === "black") {
        colorCode = "#292929";
      }
      let result = [colorCode];
      result.push(`${runningInterval}%`);
      runningInterval += interval;
      result.push(`${runningInterval - 1}%`);

      return result.join(" ");
    }
    return "";
  });
  sectionsJoin = `conic-gradient(${sections.join(", ")})`;

  const styles = makeStyles((theme) => ({
    rent_colors: {
      backgroundImage: sectionsJoin,
      color: "white",
      width: "90px",
      border: "4px solid black",
      height: "90px",
      margin: "10px auto",
      display: "flex",
      alignItems: "center",
      fontWeight: "bold",
      borderRadius: "100%",
      marginBottom: "10px",
      textTransform: "uppercase",
      justifyContent: "center",
    },
    rent_inner: {
      display: "flex",
      transform: "ultra-expanded",
      background: "black",
      height: "85%",
      width: "85%",
      color: "white",
      WebkitTextStroke: "2px #ffffff26",
      alignItems: "center",
      fontWeight: "bold",
      fontSize: "20px",
      borderRadius: "100%",
      textTransform: "uppercase",
      justifyContent: "center",
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
    trump: {
      color: "black",
      display: "flex",
      fontSize: "85px",
      lineHeight: "0.95em",
      alignItems: "center",
      justifyContent: "center",
      WebkitTextStroke: "2px #ffffff26",
    },
  }));
  const classes = styles();
  let cardValue = isDef(card) && isDef(card.value) ? card.value : 0;
  return (
    <BaseDealCard style={style}>
      <MiniPriceDiamond value={cardValue} />
      <div className={classes.card_wrapper}>
        <div className={classes.rent_colors}>
          <div className={classes.rent_inner}>
            <small style={{ textAlign: "center" }}>IRON BANK</small>
          </div>
        </div>
        <div className={classes.card_title}>
          {target === "one" ? (
            <React.Fragment>
              CHARGE <br />
              ONE PERSON
              <br /> RENT
            </React.Fragment>
          ) : (
            <React.Fragment>CHARGE EVERYONE RENT</React.Fragment>
          )}
        </div>
      </div>
    </BaseDealCard>
  );
};
