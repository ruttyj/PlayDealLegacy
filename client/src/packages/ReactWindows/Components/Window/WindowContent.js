import { React, Utils } from "../../Components/Imports/";

import FillContent from "../../Components/Containers/FillContainer/FillContent";
const {
  els,
  isDef,
  isArr,
  isFunc,
  classes,
  getNestedValue,
  setImmutableValue,
} = Utils;

function WindowContent({ children }) {
  return (
    <FillContent
      {...classes("window-content", "tint-bkgd", "column", "overflow-auto", "grow")}
    >
      {children}
    </FillContent>
  );
}

export default WindowContent;
