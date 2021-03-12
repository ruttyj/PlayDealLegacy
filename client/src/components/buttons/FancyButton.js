import React, { useState } from "react";
import PropTypes, { object } from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { makeStyles } from "@material-ui/core/styles";

import Button from "@material-ui/core/Button";
import { motion } from "framer-motion";
import sounds from "../../assets/sounds";
import { isDef, getNestedValue } from "../../utils/";

const useStyles = makeStyles({
  root: {
    boxShadow: "rgba(33, 203, 243, 0.3) 0px 3px 5px 2px",
    background:
      "linear-gradient(45deg, rgb(33, 150, 243) 30%, rgb(33, 203, 243) 90%)",
    border: 0,
    borderRadius: 3,
    color: "white",
    height: 48,
    padding: "0 30px",
    margin: "5px",
    outline: "none",
  },
});

let emptyFunc = () => {};

export default function FancyButton(props) {
  const {
    children,
    disabled = false,
    style = {},
    variant = "primary",
    isLoading = false,
  } = props;
  const classes = useStyles();
  const [isHovered, _setIsHovered] = useState(false);

  function setIsHovered(val) {
    if (val) sounds.buttonHover.play();
    _setIsHovered(val);
  }

  function handleOnClick(e) {
    e.persist();
    if (disabled) {
      sounds.buttonDisabled.play();
    } else {
      sounds.buttonClick.play();
    }
    let clickFunc = getNestedValue(props, "onClick", emptyFunc);
    if (isDef(clickFunc)) {
      clickFunc(e);
    }
  }

  const combinedStyle = {
    height: "48px",
    margin: "5px",
    outline: "none",
    padding: "0 30px",
    cursor: "pointer",
    transform: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textTransform: "uppercase",
  };

  if (variant === "primary") {
    Object.assign(combinedStyle, {
      boxShadow: "rgba(33, 203, 243, 0.3) 0px 3px 5px 2px",
      background:
        "linear-gradient(45deg, rgb(33, 150, 243) 30%, rgb(33, 203, 243) 90%)",
    });
  } else {
    Object.assign(combinedStyle, {
      background:
        "linear-gradient(45deg, rgb(107, 107, 107) 30%, rgb(136, 136, 136) 90%)",
      boxShadow: "rgba(148, 148, 148, 0.3) 0px 3px 5px 2px",
    });
  }

  if (disabled) {
    Object.assign(combinedStyle, {
      cursor: "not-allowed",
    });
  } else {
    Object.assign(combinedStyle, {
      cursor: "pointer",
    });
  }

  let buttonContents;
  if (isLoading) {
    buttonContents = "loading...";
  } else {
    buttonContents = children;
  }

  return (
    <motion.div
      style={combinedStyle}
      className={classes.root}
      onClick={handleOnClick}
      initial={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {buttonContents}
    </motion.div>
  );
}
