import React from "react";

const Flex = ({ children, style = {} }) => {
  return <div style={{ display: "flex", ...style }}>{children}</div>;
};

const FlexRow = ({ children, style = {} }) => {
  return (
    <div style={{ display: "flex", flexDirection: "row", ...style }}>
      {children}
    </div>
  );
};

const FlexRowCenter = ({ children, style = {} }) => {
  return (
    <div
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

const FlexColumn = ({ children, style = {} }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", ...style }}>
      {children}
    </div>
  );
};

const FlexColumnCenter = ({ children, style = {} }) => {
  return (
    <div
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

const FlexCenter = ({ children, style = {} }) => {
  return (
    <div
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

const FullFlexCenter = ({ children, style = {} }) => {
  return (
    <Flex
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

const FullFlexColumn = ({ children, style = {} }) => {
  return (
    <FlexColumn style={{ width: "100%", ...style }}>{children}</FlexColumn>
  );
};

const FullFlexColumnCenter = ({ children, style = {} }) => {
  return (
    <FlexColumn
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

const FullFlexRow = ({ children, style = {} }) => {
  return <FlexRow style={{ width: "100%", ...style }}>{children}</FlexRow>;
};

const FullFlexRowCenter = ({ children, style = {} }) => {
  return (
    <FlexRow
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
};
