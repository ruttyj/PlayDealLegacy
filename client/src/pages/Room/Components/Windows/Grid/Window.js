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

const makeComponent = ({ windowManager }) => (props) => {
  const [sizeCache, setSizeCache] = useState({ width: -1, height: -1 });
  // Get the size of the window contents
  let { contentSize } = props;
  let { width, height } = contentSize;

  if (isDef(width) && isDef(height)) {
    if (width > 0 && height > 0) {
      if (width !== sizeCache.width || height !== sizeCache.height) {
        setSizeCache({
          width,
          height,
        });
      }
    }
  }

  let globalState = windowManager.getState();
  const { window } = props;

  const onDragEnd = () => {};

  let finalContents = <div></div>; // must have 1 DOM node to have a size
  // Render display ======================

  console.log(JSON.stringify(contentSize));
  // Render main contents
  let mainContents = (
    <div
      style={{ backgroundColor: "#f90", width: "100%", height: "100%" }}
      {...classes("full flex column overflow-hidden")}
    >
      <div {...classes("center-center")}>
        contentSize: {JSON.stringify(contentSize)}
        <br />
        sizeCache: {JSON.stringify(sizeCache)}
        <br />
      </div>
    </div>
  );
  let Wrapper = ({ children }) => (
    <div {...classes("full wrap bkgd-selection")}>
      <div {...classes("full")}>{children}</div>
    </div>
  );

  finalContents = (
    <Wrapper>
      <div {...classes("full")}>{mainContents}</div>
    </Wrapper>
  );

  // end render ==========================

  return finalContents;
};

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
    title: "Drag and Drop",
    key: "d&d",
    isFocused,
    isFullSize: false,
    position,
    size,
    children: makeContents({ windowManager }),
  });

  if (windowManager) {
    windowManager.toggleWindowFullSize(windowId, isFullSize);
  }

  if (isFocused) {
    windowManager.setFocused(windowId);
  }
  return windowId;
}

export default createWallpaperWindow;
