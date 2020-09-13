import {
  React,
  Utils,
  FillFooter,
  wallpaperNames,
  motion,
  useSpring,
  useTransform,
  motionValue,
} from "../../../../packages/ReactWindows/Components/Imports/";
import ReactScrollWheelHandler from "react-scroll-wheel-handler";
import { useSmartClick } from "./Gestures/useSmartClick";
import FillContent from "../../../../packages/ReactWindows/Components/Containers/FillContainer/FillContent";
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

  const children = (props) => {
    let state = windowManager.getState();

    let makelisteners = useSmartClick();
    const contentOffsetY = motionValue(0);
    const y = useTransform(contentOffsetY, [0, -100], [0, 50]);

    function TrackScroll() {
      return { contentOffsetY: contentOffsetY };
    }

    const ease = [0.6, 0.05, -0.01, 0.99];
    const x = useSpring(0, { stiffness: 300, damping: 200, ease: ease });

    let activeBackground = state.get(["theme", "wallpaper"], null);
    const limitLeft = -2000;
    let makeContents = wallpaperNames.map((name) => {
      let url = `/img/Wallpapers/${name}.png`;
      let urlFullSize = `/img/Wallpapers/${name} (1).png`;
      let onClick = () => {
        let state = windowManager.getState();
        state.set(["theme", "wallpaper"], urlFullSize);
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

    let navClasses = [
      "flex",
      "column",
      "grid-nav",
      "center-center",
      "no-select",
    ];
    let gridSection = ["full", "flex", "row", "grid-section"];
    let itemSection = ["full", "flex", "column", "overflow-hidden"];
    let scrollAmount = 155;

    let scrollRight = () => incPos(scrollAmount);
    let scrollLeft = () => incPos(-1 * scrollAmount);
    return (
      <div {...classes("full", "wrap", "bkgd-selection")}>
        <div {...classes(...gridSection)}>
          <div
            {...classes(...navClasses, "left")}
            onClick={() => incPos(fullWidth)}
          >
            {"<"}
          </div>
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
                {...classes(["flex", "full", "column", "wrap"])}
              >
                {makeContents}
              </motion.div>
            </ReactScrollWheelHandler>
          </div>
          <div
            {...classes(...navClasses, "right")}
            onClick={() => incPos(-1 * fullWidth)}
          >
            {">"}
          </div>
        </div>
      </div>
    );
  };

  // Dragable Lists window
  let windowId = windowManager.createWindow({
    title: "Choose a background",
    key: "backgroundPicker",
    isFocused,
    isFullSize,
    position,
    size,
    children,
  });

  if (isFocused) {
    windowManager.setFocused(windowId);
  }
  return windowId;
}

export default createWallpaperWindow;
