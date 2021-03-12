import "./CreateWindow.scss";
import {
  React,
  useState,
  Utils,
  FillFooter,
  DragListH,
  DragListV,
  wallpapers,
  wallpaperNames,
  SizeBackgroundColor,
  motion,
  useSpring,
  useTransform,
  motionValue,
} from "../../Components/Imports/";
import ReactScrollWheelHandler from "react-scroll-wheel-handler";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";

import FillContainer from "../../Components/Containers/FillContainer/FillContainer";
import FillContent from "../../Components/Containers/FillContainer/FillContent";
import FillHeader from "../../Components/Containers/FillContainer/FillHeader";
import Input from "@material-ui/core/Input";
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

function WindowAComponent(props) {
  const { size, position, containerSize } = props;
  let horizontalItems = {
    0: (
      <div style={{ backgroundColor: "black", padding: "10px", margin: "4px" }}>
        item 0
      </div>
    ),
    1: (
      <div style={{ backgroundColor: "black", padding: "10px", margin: "4px" }}>
        item 1
      </div>
    ),
    2: (
      <div style={{ backgroundColor: "black", padding: "10px", margin: "4px" }}>
        item 2
      </div>
    ),
  };

  let _horizontalOrder = [0, 1, 2];
  const [horizontalOrder, setHorizontalOrder] = useState(_horizontalOrder);

  return (
    <SizeBackgroundColor>
      <div {...classes("body", "grow")}>
        <div {...classes("grow")}>
          <div {...classes("column")}>
            <div {...classes("row")}>
              <div {...classes("column", "align-left")}>
                size:{" "}
                <pre style={{ padding: "100px" }}>
                  <xmp>{JSON.stringify(size, null, 2)}</xmp>
                </pre>
              </div>
              <div {...classes("column", "align-left")}>
                position:
                <pre style={{ padding: "100px" }}>
                  <xmp>{JSON.stringify(position, null, 2)}</xmp>
                </pre>
              </div>
            </div>

            <DragListV />
            <DragListH
              items={horizontalItems}
              order={horizontalOrder}
              setOrder={setHorizontalOrder}
            />
          </div>
        </div>
      </div>
    </SizeBackgroundColor>
  );
}

// Only execute onClick when the mouse down and up is withing a threshold
function useSmartClick(...args) {
  let [isDragging, setDragging] = useState();
  let [startMousePos, setStartMousePos] = useState();

  function makelisteners(props = {}, opts = {}) {
    let { threshold = 10 } = opts;
    let onClick = (...args) => {
      let funcName = "onClick";
      isDef(props[funcName]) ? props[funcName](...args) : null;
    };

    let onDrop = (...args) => {
      let funcName = "onDrop";
      isDef(props[funcName]) ? props[funcName](...args) : null;
    };

    let onMouseDown = (...args) => {
      let funcName = "onMouseDown";
      isDef(props[funcName]) ? props[funcName](...args) : null;

      let e = args[0];
      setStartMousePos({ x: e.screenX, y: e.screenY });
    };

    let onRelease = (...args) => {
      let e = args[0];
      let currentPos = { x: e.screenX, y: e.screenY };
      let calcDist = (A, B) => {
        let dX = Math.abs(B.x - A.x);
        let dY = Math.abs(B.y - A.y);
        return Math.sqrt(Math.pow(dX, 2) + Math.pow(dY, 2));
      };

      // If the distanct is within threshold execute onClick else execute onDrop
      let dist = calcDist(startMousePos, currentPos);
      if (dist <= threshold) {
        onClick(...args);
      } else {
        onDrop(...args);
      }
    };

    let onMouseUp = (...args) => {
      let funcName = "onMouseUp";
      isDef(props[funcName]) ? props[funcName](...args) : null;
      onRelease(...args);
    };

    let onMoving = (...args) => {
      setDragging(true);
      let funcName = "onMoving";
      isDef(props[funcName]) ? props[funcName](...args) : null;
    };

    let onMouseMove = (...args) => {
      onMoving(...args);
    };

    const listeners = {
      onMouseDown,
      onMouseUp,
      onMouseMove,
    };
    return listeners;
  }

  return makelisteners;
}

function createWallpaperWindow(windowManager, isFocused = true) {
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

function createSetUsernameWindow(windowManager, game, isFocused = true) {
  const isFullSize = false;

  const size = {
    width: 400,
    height: 200,
  };
  const containerSize = windowManager.getContainerSize();
  const position = {
    left: containerSize.width / 2 - size.width / 2,
    top: containerSize.height / 2 - size.height / 2,
  };

  const children = (props) => {
    //=========================================
    // Unpack props
    //=========================================
    const { window } = props;

    //=========================================
    // State
    //=========================================
    // Global state
    let globalState = windowManager.getState();

    // Local state
    const [isLoading, setIsLoading] = useState(true);
    const [nameInputValue, setNameInputValue] = useState("\\");

    //=========================================
    // Set current name if exists and is filler value "\"
    //=========================================
    let me = game.me();
    let currentName = "";
    if (isDef(me)) {
      currentName = me.name;
      if (nameInputValue === "\\") {
        setNameInputValue(currentName);
        setIsLoading(false);
      }
    }

    //=========================================
    // Define callbacks
    //=========================================
    let onNameChangeConfirm = async () => {
      await game.updateMyName(nameInputValue);
      windowManager.removeWindow(window.id);
    };

    const onNameKeyPress = (event) => {
      if (event.key === "Enter") {
        onNameChangeConfirm();
      }
    };
    const onNameChange = () => {
      let newValue = event.target.value;
      newValue = newValue.charAt(0).toUpperCase() + newValue.slice(1);
      setNameInputValue(newValue);
    };

    //=========================================
    // Decide the contents of the window
    //=========================================
    let contents = null;
    if (isLoading) {
      contents = (
        <FillContainer>
          <WindowContent>
            <div {...classes("flex", "full", "center-center")}>
              <CircularProgress disableShrink />
            </div>
          </WindowContent>
        </FillContainer>
      );
    } else {
      contents = (
        <FillContainer>
          <WindowContent>
            <div
              {...classes(
                "full",
                "flex",
                "column",
                "grow",
                "column",
                "center-center"
              )}
            >
              <div {...classes("row")}>
                <Input
                  {...classes("username-field")}
                  variant="filled"
                  autoFocus
                  onKeyPress={onNameKeyPress}
                  value={nameInputValue}
                  onChange={onNameChange}
                />
              </div>
            </div>
          </WindowContent>
          <WindowFooter>
            <div {...classes("spacer")} />
            <div {...classes("button")} onClick={onNameChangeConfirm}>
              Confirm
            </div>
          </WindowFooter>
        </FillContainer>
      );
    }

    return contents;
  };

  // Dragable Lists window
  let windowId = windowManager.createWindow({
    title: "Enter a username",
    key: "usernamePicker",
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

function createWindowA(windowManager, isFocused = true) {
  // Dragable Lists window
  windowManager.createWindow({
    title: "Window A",
    isFocused,
    position: {
      left: 300,
      top: 50,
    },
    size: {
      width: 700,
      height: 700,
    },
    children: WindowAComponent,
    actions: () => (
      <FillFooter
        height={40}
        classNames={["footer", "actions", "center-center"]}
      >
        <div {...classes("spacer")} />
        <div {...classes("button", "not-allowed")}>Cancel</div>
        <div {...classes("button", "not-allowed")}>Confirm</div>
      </FillFooter>
    ),
  });
}

function createTrooperIframe(windowManager, isFocused = true) {
  // Stom trooper dancing iframe
  windowManager.createWindow({
    title: "Trooper - IFrame",
    key: "trooper",
    isFocused,
    disablePointerEventsOnBlur: true,
    position: {
      left: 100,
      top: 50,
    },
    size: {
      width: 400,
      height: 600,
    },
    children: ({ size, position, containerSize }) => (
      <iframe
        src="https://threejs.org/examples/webgl_loader_collada_skinning.html"
        style={{ height: "100%", width: "100%" }}
      />
    ),
  });
}

function createDebugger(windowManager, isFocused = true) {
  // Debuger window
  windowManager.createWindow({
    key: "debugger",
    title: "Debuger",
    isFocused,
    position: {
      left: 1000,
      top: 50,
    },
    size: {
      width: 400,
      height: 600,
    },
    children: ({ size, position, containerSize }) => (
      <pre {...classes("column", "align-left", "full-width")}>
        <xmp>
          state:
          {JSON.stringify(windowManager.getState().get(), null, 2)}
        </xmp>
      </pre>
    ),
  });
}

export {
  createDebugger,
  createTrooperIframe,
  createWindowA,
  createWallpaperWindow,
  createSetUsernameWindow,
};
