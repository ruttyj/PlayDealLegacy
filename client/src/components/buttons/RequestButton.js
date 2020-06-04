import React, { useState } from "react";

import sounds from "../../assets/sounds";
const RequestButton = ({
  children,
  onClick = () => {},
  style = {},
  disabled = false,
}) => {
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
    onClick(e);
  }

  let disabledStyle = {};
  if (disabled) {
    disabledStyle = {
      cursor: "not-allowed",
      opacity: 0.5,
    };
  }

  let defaultStyle = {
    border: "3px solid white",
    borderRadius: "10px",
    padding: "10px 20px",
    margin: "20px",
    marginTop: "0px",
    textTransform: "uppercase",
    cursor: "pointer",
  };
  return (
    <div
      style={{ ...defaultStyle, ...disabledStyle, ...style }}
      onClick={handleOnClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
};

export default RequestButton;
