import React from "react";

import "react-splitter-layout/lib/index.css";
import { Flex } from "../Flex";

const BlurredPanel = ({ children, style = {} }) => {
  return <Flex style={{ backdropFilter: "blur(15px)", height: "100%", border: "1px solid #ffffff1c", overflow: "auto", padding: "10px", ...style }}>{children}</Flex>;
};

export default BlurredPanel;
