import React, { useState } from "react";
import RelLayer from "../../../components/layers/RelLayer";
import AbsLayer from "../../../components/layers/AbsLayer";
import sounds from "../../../assets/sounds";

const ActionButton = ({
  children,
  className = "",
  disabled = false,
  title = "",
  percent = 0,
  onClick = () => {},
}) => {
  const [isHovered, _setIsHovered] = useState(false);
  function setIsHovered(val) {
    if (val) {
      sounds.buttonHover.play();
    }
    _setIsHovered(val);
  }

  function handleOnClick() {
    if (disabled) {
      sounds.buttonDisabled.play();
    } else {
      sounds.buttonClick.play();
    }
    onClick();
  }

  let baseRad = Math.floor((percent / 100) * 360);

  let startRad = baseRad % 360;
  let endRad = (baseRad + 1) % 360;

  let width = 100;
  let height = 100;

  let disabledStyle = disabled ? { opacity: 0.5 } : {};

  let progressStyle = true
    ? {}
    : {
        backgroundImage: `conic-gradient(#ffffff4a ${startRad}deg, #00000000 ${endRad}deg 200deg)`,
      };

  return (
    <div
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={title}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: "100%",
        backdropFilter: "blur(15px)",
        ...disabledStyle,
      }}
    >
      <RelLayer>
        <AbsLayer>
          <div
            style={{
              ...progressStyle,
              mixBlendMode: "overlay",
              width: `${width}px`,
              height: `${height}px`,
              borderRadius: "100%",
              border: "5px solid white",
            }}
          />
        </AbsLayer>
        <AbsLayer>
          <div
            style={{
              mixBlendMode: isHovered ? "normal" : "overlay",
              width: `${width}px`,
              height: `${height}px`,
              borderRadius: "100%",
              transition: `all 300ms linear`,
              border: isHovered ? "5px solid white" : "5px solid transparent",
            }}
          />
        </AbsLayer>
        <AbsLayer>
          <div
            onClick={handleOnClick}
            style={{
              cursor: disabled ? "not-allowed" : "pointer",
              width: `${width}px`,
              height: `${height}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            {children}
          </div>
        </AbsLayer>
      </RelLayer>
    </div>
  );
};

export default ActionButton;
