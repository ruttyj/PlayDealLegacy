import {
  React,
  useState,
  Utils,
  wallpaperNames,
  motion,
  useSpring,
  useTransform,
  motionValue,
} from "../../../../../packages/ReactWindows/Components/Imports/";
import ReactScrollWheelHandler from "react-scroll-wheel-handler";
import { useSmartClick } from "../Gestures/useSmartClick";
import { DragDropContext } from "react-beautiful-dnd";
import "./style.scss";
const {
  els,
  isDef,
  isDefNested,
  isArr,
  isFunc,
  classes,
  getNestedValue,
  setImmutableValue,
} = Utils;

const WINDOW = window;

const makeComponent = ({ windowManager }) => (props) => {
  const { windowManager } = props;
  const [sizeCache, setSizeCache] = useState({ width: -1, height: -1 });

  let globalState = windowManager.getState();
  // Get the size of the window contents
  let { contentSize } = props;
  let { width, height } = contentSize;

  const isSizeValidLive =
    isDef(width) && isDef(height) && width > 0 && height > 0;

  if (isSizeValidLive) {
    if (width !== sizeCache.width || height !== sizeCache.height) {
      setSizeCache({
        width,
        height,
      });
    }
  }

  const isSizeValid =
    isDef(sizeCache.width) &&
    isDef(sizeCache.height) &&
    sizeCache.width > 0 &&
    sizeCache.height > 0;
  width = sizeCache.width;
  height = sizeCache.height;

  const { window } = props;

  const onDragEnd = () => {};

  const defaultContents = <div></div>; // must have 1 DOM node to have a size
  let finalContents = defaultContents;
  // Render display ======================

  console.log(JSON.stringify(contentSize));
  // Render main contents
  let mainContents = defaultContents;
  if (isSizeValid) {
    mainContents = (
      <div
        style={{ backgroundColor: "#f90", width: "100%", height: "100%" }}
        {...classes("full flex column overflow-hidden")}
      >
        <div {...classes("center-center")}>
          contentSize: {JSON.stringify(contentSize)}
          <br />
          sizeCache: {JSON.stringify(sizeCache)}
          <br />
          isSizeValid: {JSON.stringify(isSizeValid)}
        </div>
        {width > 500 && (
          <div {...classes("flex column grow")}>
            <div {...classes("flex row grow")}>
              <div
                {...classes("flex column grow center-center")}
                style={{ backgroundColor: "#09f" }}
              >
                A
              </div>
              <div
                {...classes("flex column grow center-center")}
                style={{ backgroundColor: "#00a1ff" }}
              >
                B
              </div>
            </div>

            <div {...classes("flex row grow")}>
              <div
                {...classes("flex column grow center-center")}
                style={{ backgroundColor: "#00a1ff" }}
              >
                C
              </div>
              <div
                {...classes("flex column grow center-center")}
                style={{ backgroundColor: "#0099ff" }}
              >
                D
              </div>
            </div>
            <div {...classes("flex row grow")}>
              <div
                {...classes("flex column grow center-center")}
                style={{ backgroundColor: "black" }}
              >
                E
              </div>
            </div>
          </div>
        )}
      </div>
    );

    let temp = globalState.get(["windowCache", window.id], undefined);
    if (!isDef(temp) || temp !== mainContents) {
      // causes an update re-render loop
      //globalState.set(["windowCache", window.id], mainContents);
    }
  }
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
export default makeComponent;
