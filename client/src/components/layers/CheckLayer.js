import React, { useState } from "react";
import { isDef, isDefNested } from "../../utils/";
import AbsLayer from "./AbsLayer";
import RelLayer from "./RelLayer";
import DoneIcon from "@material-ui/icons/Done";
import CloseIcon from "@material-ui/icons/Close";
import RemoveCircleOutlineIcon from "@material-ui/icons/RemoveCircleOutline";
import { red, green } from "@material-ui/core/colors";
import Avatar from "@material-ui/core/Avatar";
import PulseCheckBox from "../buttons/PulseCheckBox.js";

// Check overlay allows the content to be interactable as per usuail
// if enabled clicking the child will toggle the value
const CheckLayer = ({
  children,
  disabled = true,
  notApplicable = false,
  isSelectable = false,
  value = true,
  success = false,
  borderRadius = "10px",
  append = "",
  appendOverlay = "",
  onClick = () => {},
}) => {
  let [size, setSize] = useState(20);

  let notSelectableStyle = {};

  if (!disabled && !isSelectable) {
    notApplicable = true;
    Object.assign(notSelectableStyle, {
      //opacity: 0.5
      //border: "3px dashed #ffffff",
    });
  }

  let icon;
  let layerColor;
  let solidLayerColor;
  let blockUnderContent = false;
  let cursor;

  let disableSelectStyle = {};
  if (!disabled) {
    disableSelectStyle = {
      WebkitTouchCallout: "none",
      WebkitUserSelect: "none",
      KhtmlUserSelect: "none",
      MozUserSelect: "none",
      MsUserSelect: "none",
      userSelect: "none",
    };
  }

  if (!disabled) {
    blockUnderContent = true;
    cursor = "pointer";
  }

  // Switch the state of the overlay
  let selectableLayerStyle = {};
  let opacity = 0;
  if (notApplicable) {
    opacity = 1;
    disabled = false;
    cursor = "not-allowed";
    blockUnderContent = true;
    layerColor = "#404040a8";
    selectableLayerStyle = {
      backgroundColor: "transparent",
    };
    icon = (
      <RemoveCircleOutlineIcon
        style={{ width: `${size}px`, height: `${size}px`, color: "#0000004d" }}
      />
    );
    success = true;
    value = true;
  } else if (value && success) {
    opacity = 1;
    cursor = "pointer";
    layerColor = "#008000cc";
    selectableLayerStyle = {
      backgroundColor: green[700],
    };
    icon = <DoneIcon />;
  } else if (value && !success) {
    opacity = 1;

    cursor = "pointer";
    layerColor = "#a70000bf";
    selectableLayerStyle = {
      backgroundColor: red[700],
    };
    icon = <CloseIcon />;
  } else if (isSelectable) {
    opacity = 1;
    cursor = "pointer";
    layerColor = "#ffffff00";
    selectableLayerStyle = {
      backgroundColor: "rgba(0, 0, 0, 0)",
      backgroundImage: "radial-gradient(black, transparent)",
    };
    icon = <PulseCheckBox value={false} indeterminate={false} />;
  }

  let appendContent = "";

  if (isDef(append)) {
    appendContent = (
      <div
        style={{
          position: "absolute",
          bottom: "0px",
          left: "50%",
          fontSize: "3em",
          transform: "translateX(-50%)",
        }}
      >
        {append}
      </div>
    );
  }

  return (
    <div
      ref={(divElement) => {
        divElement && setSize(divElement.offsetWidth / 2);
      }}
      style={{
        ...disableSelectStyle,
        flexDireciton: "column",
        display: "flex",
        position: "relative",
        width: "fit-content",
        height: "fit-content",
      }}
    >
      {children}
      <AbsLayer
        style={{
          ...notSelectableStyle,
          pointerEvents: blockUnderContent ? "all" : "none",
          cursor: cursor,
        }}
      >
        <div
          style={{ width: "100%", height: "100%" }}
          alt="here"
          onClick={() => {
            if (!disabled && !notApplicable) onClick();
          }}
        />
      </AbsLayer>
      <AbsLayer style={{ pointerEvents: "none" }}>
        <div
          style={{
            opacity: value ? 1 : 0,
            transition: "all 150ms linear",
            content: "",
            height: "100%",
            width: "100%",
            backgroundColor: layerColor,
            borderRadius: borderRadius,
          }}
        />
      </AbsLayer>
      <AbsLayer style={{ pointerEvents: "none" }}>
        <div
          style={{
            opacity: opacity,
            transition: "all 150ms linear",
            content: "",
            cursor: cursor,
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translateX(-50%) translateY(-50%)",
          }}
        >
          <Avatar
            style={{
              ...selectableLayerStyle,
              width: `${size}px`,
              height: `${size}px`,
            }}
          >
            {icon}
          </Avatar>
        </div>
      </AbsLayer>
      <AbsLayer style={{ pointerEvents: "none" }}>{appendContent}</AbsLayer>
      {appendOverlay}
    </div>
  );
};

export default CheckLayer;
