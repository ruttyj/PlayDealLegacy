import React from "react";

const Dump = ({ value = {}, title = "" }) => {
  return (
    <pre>
      {title}
      <xmp>{JSON.stringify(value, null, 2)}</xmp>
    </pre>
  );
};

export { Dump };
