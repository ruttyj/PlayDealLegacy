import React, { useState } from "react";
//import CheckIcon from '@material-ui/icons/Check';
import CancelIcon from "@material-ui/icons/Cancel";
import CloseIcon from "@material-ui/icons/Close";
import AutorenewIcon from "@material-ui/icons/Autorenew";
import Tooltip from "@material-ui/core/Tooltip";
//import RelLayer from "../components/layers/RelLayer";
//import AbsLayer from "../components/layers/AbsLayer";

const AutoPassTurnButton = ({ disabled = false, value = false, style = {}, onClick = () => {} }) => {
  //const [isHovered, setIsHovered] = useState(false);
  let buttonStyle = { color: "#3f50b5" };

  let disabledStyle = disabled ? { opacity: 0, borderColor: "#ffffff00" } : { opacity: 1, borderColor: "white" };
  let wrapperStyle = { display: "flex", position: "absolute", top: "-40px", left: "10px", width: "40px", height: "40px" };
  let innerStyle = {
    position: "absolute",
    width: "100%",
    border: "5px solid white",
    borderRadius: "100%",
    backgroundColor: "white",
    mixBlendMode: "normal !important",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: disabled ? "not-allowed" : "pointer"
  };

  let icon = value ? <AutorenewIcon fontSize="large" style={buttonStyle} /> : <CloseIcon fontSize="large" style={buttonStyle} />;

  let toolTipMessage = value ? "Disable Auto-end Turn" : "Enable Auto-end Turn";
  return disabled ? (
    ""
  ) : (
    <div style={{ ...wrapperStyle, ...disabledStyle, ...style }} onClick={onClick}>
      <div style={innerStyle}>
        <Tooltip title={toolTipMessage} placement="top">
          {icon}
        </Tooltip>
      </div>
    </div>
  );
};

export default AutoPassTurnButton;
