import RadioButtonUncheckedIcon from "@material-ui/icons/RadioButtonUnchecked";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import RemoveCircleOutlineIcon from "@material-ui/icons/RemoveCircleOutline";
import React, { useState } from "react";

function PulseCheckBox({ value, indeterminate, onClick = () => {} }) {
  function handleOnClick(e) {
    e.persist();
    onClick(e);
  }
  let boxContent;
  if (value) {
    boxContent = (
      <CheckCircleIcon
        fontSize="large"
        onClick={handleOnClick}
        style={{ borderRadius: "100%", cursor: "pointer" }}
      />
    );
  } else if (indeterminate) {
    boxContent = (
      <RemoveCircleOutlineIcon
        fontSize="large"
        onClick={handleOnClick}
        style={{ borderRadius: "100%", cursor: "not-allowed" }}
      />
    );
  } else {
    boxContent = (
      <RadioButtonUncheckedIcon
        fontSize="large"
        onClick={handleOnClick}
        style={{ borderRadius: "100%", cursor: "pointer" }}
        className={"pulse_white"}
      />
    );
  }

  return boxContent;
}

export default PulseCheckBox;
