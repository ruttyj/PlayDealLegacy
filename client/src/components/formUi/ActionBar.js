import React from "react";
import { FlexRow } from "../Flex";

const ActionBar = ({ children }) => {
  return <FlexRow style={{ justifyContent: "flex-end", position: "absolute", bottom: "0px", width: "100%", padding: "10px 20px" }}>{children}</FlexRow>;
};

export default ActionBar;
