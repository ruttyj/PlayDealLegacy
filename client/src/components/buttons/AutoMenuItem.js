import React, { useState } from "react";
import { getNestedValue, emptyFunc } from "../../utils/";
import MenuItem from "@material-ui/core/MenuItem";

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
    <MenuItem
      disabled={getNestedValue(details, "disabled", false)}
      style={{
        ...getNestedValue(details, "style", {}),
      }}
      variant="contained"
      onClick={handleOnClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {getNestedValue(details, "label", "")}
    </MenuItem>
  );
};

export default AutoButton;
