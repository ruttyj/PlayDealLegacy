import {
  React,
  useState,
  Utils,
  FillFooter,
  wallpaperNames,
  motion,
  useSpring,
  useTransform,
  motionValue,
} from "../../../../../packages/ReactWindows/Components/Imports/";
import { withResizeDetector } from "react-resize-detector";
import ReactScrollWheelHandler from "react-scroll-wheel-handler";
import { useSmartClick } from "../Gestures/useSmartClick";
import FillContent from "../../../../../packages/ReactWindows/Components/Containers/FillContainer/FillContent";
import makeContents from "./Contents";
const {
  els,
  isDef,
  isArr,
  isFunc,
  classes,
  getNestedValue,
  setImmutableValue,
} = Utils;

function WindowFooter(props = {}) {
  const { children } = props;
  return (
    <FillFooter height={40} classNames={["footer", "actions", "center-center"]}>
      {children}
    </FillFooter>
  );
}

function WindowContent({ children }) {
  return (
    <FillContent
      {...classes("window-content", "tint-bkgd", "column", "overflow-auto")}
    >
      {children}
    </FillContent>
  );
}

function createWallpaperWindow(props) {
  let { windowManager, isFocused = true } = props;

  const isFullSize = false;

  const size = {
    width: 900,
    height: 550,
  };

  const containerSize = windowManager.getContainerSize();
  const position = {
    left: containerSize.width / 2 - size.width / 2,
    top: containerSize.height / 2 - size.height / 2,
  };

  // Dragable Lists window
  let windowId = windowManager.createWindow({
    title: "Choose a background",
    key: "backgroundPicker",
    isFocused,
    isFullSize,
    position,
    size,
    children: makeContents({ windowManager }),
  });

  if (isFocused) {
    windowManager.setFocused(windowId);
  }
  return windowId;
}

export default createWallpaperWindow;
