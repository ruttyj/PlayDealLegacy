import React from "react";
import { classes } from "../utils/";
const Flex = ({ children, style = {}, ...attrs }) => {
  return <div style={{ display: "flex", ...style }}>{children}</div>;
};

const FlexRow = ({ children, style = {}, ...attrs }) => {
  return (
    <div {...attrs} style={{ display: "flex", flexDirection: "row", ...style }}>
      {children}
    </div>
  );
};

const FlexRowCenter = ({ children, style = {}, ...attrs }) => {
  return (
    <div
      {...attrs}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const FlexColumn = ({ children, style = {}, ...attrs }) => {
  return (
    <div
      {...attrs}
      style={{ display: "flex", flexDirection: "column", ...style }}
    >
      {children}
    </div>
  );
};

const FlexColumnCenter = ({ children, style = {}, ...attrs }) => {
  return (
    <div
      {...attrs}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const FlexCenter = ({ children, style = {}, ...attrs }) => {
  return (
    <div
      {...attrs}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const FullFlexCenter = ({ children, style = {}, ...attrs }) => {
  return (
    <Flex
      {...attrs}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {children}
    </Flex>
  );
};

const FullFlexColumn = ({ children, style = {}, ...attrs }) => {
  return (
    <FlexColumn {...attrs} style={{ width: "100%", ...style }}>
      {children}
    </FlexColumn>
  );
};

const FullFlexColumnCenter = ({ children, style = {}, ...attrs }) => {
  return (
    <FlexColumn
      {...attrs}
      style={{
        width: "100%",
        height: "100%",
        width: "height%",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {children}
    </FlexColumn>
  );
};

const FullFlexRow = ({ children, classNames = "", style = {}, ...attrs }) => {
  return (
    <FlexRow
      {...attrs}
      {...classes(classNames)}
      style={{ width: "100%", ...style }}
    >
      {children}
    </FlexRow>
  );
};

const FullFlexRowCenter = ({ children, style = {}, ...attrs }) => {
  return (
    <FlexRow
      {...attrs}
      style={{
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {children}
    </FlexRow>
  );
};

const FullFlexGrow = ({ children, style = {}, ...attrs }) => {
  return (
    <Flex
      {...attrs}
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        flexGrow: "1",
        ...style,
      }}
    >
      {children}
    </Flex>
  );
};

export {
  Flex,
  FlexRow,
  FlexColumn,
  FlexColumnCenter,
  FlexRowCenter,
  FlexCenter,
  FullFlexCenter,
  FullFlexColumn,
  FullFlexColumnCenter,
  FullFlexRow,
  FullFlexRowCenter,
  FullFlexGrow,
};
