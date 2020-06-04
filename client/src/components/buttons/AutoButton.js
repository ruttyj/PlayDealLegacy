import React, { useState } from "react";
import { getNestedValue, emptyFunc } from "../../utils/";

import Button from "@material-ui/core/Button";
import sounds from "../../assets/sounds";

const AutoButton = ({ details }) => {
  const [isHovered, _setIsHovered] = useState(false);
  function setIsHovered(val) {
    if (val) {
      sounds.buttonHover.play();
    }
    _setIsHovered(val);
  }

  function handleOnClick(e) {
    e.persist();
    if (disabled) {
      sounds.buttonDisabled.play();
    } else {
      sounds.buttonClick.play();
    }
    let clickFunc = getNestedValue(details, "onClick", emptyFunc);
    if (isDef(clickFunc)) {
      clickFunc(e);
    }
  }

  return (
    <Button
      disabled={getNestedValue(details, "disabled", false)}
      color="primary"
      style={{
        margin: "4px",
        height: "fit-content",
        ...getNestedValue(details, "style", {}),
      }}
      variant="contained"
      onClick={handleOnClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {getNestedValue(details, "label", "")}
    </Button>
  );
};

export default AutoButton;
