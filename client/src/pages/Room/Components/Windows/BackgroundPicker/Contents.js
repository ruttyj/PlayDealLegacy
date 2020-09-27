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
  // Get the size of the window contents
  let { contentSize } = props;
  let { width, height } = contentSize;

  let state = windowManager.getState();
  const { window } = props;

  const Storage = isDefNested(WINDOW, ["localStorage"]);

  let makelisteners = useSmartClick();
  const contentOffsetY = motionValue(0);
  const y = useTransform(contentOffsetY, [0, -100], [0, 50]);

  function TrackScroll() {
    return { contentOffsetY: contentOffsetY };
  }

  const ease = [0.6, 0.05, -0.01, 0.99];
  const x = useSpring(0, { stiffness: 300, damping: 200, ease: ease });

  let activeBackground = state.get(["theme", "wallpaper"], null);
  //activeBackground
  const limitLeft = -2000;
  let makeContents = wallpaperNames.map((name) => {
    let url = `/img/Wallpapers/${name}.png`;
    let urlFullSize = `/img/Wallpapers/${name} (1).png`;
    let onClick = () => {
      let state = windowManager.getState();
      state.set(["theme", "wallpaper"], urlFullSize);
      WINDOW.localStorage.setItem("background", urlFullSize);
    };
    return (
      <div
        key={url}
        style={{
          backgroundImage: `url(${url})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          content: "",
          width: "25%",
          height: "150px",
          cursor: "pointer",
          margin: "5px",
        }}
        {...classes([
          "grid-item",
          activeBackground === urlFullSize ? "border" : "",
        ])}
        {...makelisteners({
          onClick,
        })}
      />
    );
  });

  let incPos = (amount) => {
    let oldVal = x.get();
    let newVal = oldVal + amount;
    x.stop();
    x.set(newVal);
  };
  let fullWidth = 400;

  let navClasses = ["flex", "column", "grid-nav", "center-center", "no-select"];
  let gridSection = ["full", "flex", "row", "grid-section"];
  let itemSection = ["full", "flex", "column", "overflow-hidden"];
  let scrollAmount = 155;

  let scrollRight = () => incPos(scrollAmount);
  let scrollLeft = () => incPos(-1 * scrollAmount);

  let leftScrollButton = (
    <div {...classes(...navClasses, "left")} onClick={() => incPos(fullWidth)}>
      {"<"}
    </div>
  );

  let rightScrollButton = (
    <div
      {...classes(...navClasses, "right")}
      onClick={() => incPos(-1 * fullWidth)}
    >
      {">"}
    </div>
  );
  let mainContents = (
    <div {...classes(...itemSection)}>
      <ReactScrollWheelHandler
        style={{ width: "100%", height: "100%" }}
        upHandler={scrollRight}
        downHandler={scrollLeft}
        leftHandler={scrollLeft}
        rightHandler={scrollRight}
        timeout={100}
      >
        <motion.div
          dragConstraints={{ left: limitLeft, right: 0 }}
          drag={"x"}
          style={{ x }}
          {...classes(["flex", "full", "column", "wrap", "center-center"])}
        >
          {makeContents}
        </motion.div>
      </ReactScrollWheelHandler>
    </div>
  );

  let wrapper = (contents) => (
    <div {...classes("full", "wrap", "bkgd-selection")}>
      <div {...classes(...gridSection)}>{contents}</div>
    </div>
  );

  let finalContents = <div></div>; // must have 1 DOM node to have a size

  if (isDef(width) && isDef(height)) {
    if (width > 500) {
      finalContents = wrapper(
        <div {...classes(...gridSection)}>
          {leftScrollButton}
          {mainContents}
          {rightScrollButton}
        </div>
      );
    } else {
      finalContents = wrapper(
        <div {...classes(...gridSection)}>
          <div {...classes("full column")}>
            {mainContents}
            <div {...classes("row center-center")}>
              {leftScrollButton}
              {rightScrollButton}
            </div>
          </div>
        </div>
      );
    }
  }

  return finalContents;
};
export default makeComponent;
