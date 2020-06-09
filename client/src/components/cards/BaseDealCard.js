import React, { memo } from "react";
import { isDef } from "../../utils/";
import { makeStyles } from "@material-ui/core/styles";
var classNames = require("classnames");

let grey = "grey";
const BaseDealCard = memo(({ children, color = grey, style = {} }) => {
  const styles = makeStyles((theme) => ({
    root: {
      cursor: "pointer",
      border: "2px groove #404040;",
      display: "inline-block",
      backgroundColor: "white",
      width: "150px",
      height: "225px",
      borderRadius: "10px",
      padding: "10px",
    },

    border: {
      width: "100%",
      border: "3px solid black",
      height: "100%",
      content: "",
      display: "block",
      padding: "7px",
      backgroundSize: "350px 350px",
      backgroundColor: color,
      backgroundRepeat: "repeat",
      backgroundBlendMode: "darken",
      transition: "all 150ms linear",
    },

    cardInnerBkgd: {
      width: "100%",
      height: "100%",
      position: "relative",
      backdropFilter: "blur(5px)",
      border: "2px solid #00000047",
    },

    cardInnerBkgdOverlay: {
      content: "",
      position: "absolute",
      height: "100%",
      width: "100%",
      top: "0px",
      left: "0px",
      backgroundColor: color,
      transition: "all 300ms linear",
      opacity: "0.8",
    },

    childContainer: {
      content: "",
      position: "absolute",
      height: "100%",
      width: "100%",
      top: "0px",
      left: "0px",
    },
  }));
  const classes = styles();

  let combinesClases = classNames(
    classes.cardInnerBkgdOverlay,
    "currency_card_gloss"
  );
  return (
    <div className={classes.root} style={style}>
      <div
        className={classes.border}
        style={{ backgroundImage: `url(/img/bkgd.png)` }}
      >
        <div className={classes.cardInnerBkgd}>
          <div className={combinesClases} />
          <div className={classes.childContainer}>{children}</div>
        </div>
      </div>
    </div>
  );
});

export default React.memo(BaseDealCard);
