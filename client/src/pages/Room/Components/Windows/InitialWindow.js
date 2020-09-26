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
} from "../../../../packages/ReactWindows/Components/Imports/";
import ReactScrollWheelHandler from "react-scroll-wheel-handler";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";

import FillContainer from "../../../../packages/ReactWindows/Components/Containers/FillContainer/FillContainer";
import FillContent from "../../../../packages/ReactWindows/Components/Containers/FillContainer/FillContent";
import FillHeader from "../../../../packages/ReactWindows/Components/Containers/FillContainer/FillHeader";

import WindowContent from "../../../../packages/ReactWindows/Components/Window/WindowContent";
import FancyButton from "../../../../components/buttons/FancyButton";

import makeContents from "./BackgroundPicker/Contents";

import {
  getIsFullScreen,
  toggleFullScreen,
  getIsMobile,
} from "../Logic/fullscreen";

import Input from "@material-ui/core/Input";

const WINDOW = window;
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

function WindowFooter(props = {}) {
  const { children } = props;
  return (
    <FillFooter height={40} classNames={["footer", "actions", "center-center"]}>
      {children}
    </FillFooter>
  );
}

function createSetUsernameWindow(props) {
  let { windowManager, game, isFocused = true } = props;

  //=========================================
  // Define Window Data
  //=========================================
  let windowData = {
    title: "Welcome",
    key: "welcomeScreen",
  };

  const isFullSize = true;
  const size = {
    width: 400,
    height: 400,
  };
  const containerSize = windowManager.getContainerSize();
  const position = {
    left: containerSize.width / 2 - size.width / 2,
    top: containerSize.height / 2 - size.height / 2,
  };

  /////////////////////////////////////////////
  //             Window Contents
  /////////////////////////////////////////////
  const windowContents = (props) => {
    let { contentSize } = props;
    let { width, height } = contentSize;
    //=========================================
    // Unpack props
    //=========================================
    const { window } = props;
    const Storage = isDefNested(WINDOW, ["localStorage"]);

    //=========================================
    // State
    //=========================================
    // Global state
    let globalState = windowManager.getState();

    // Local state
    const [isLoading, setIsLoading] = useState(true);
    const [nameInputValue, setNameInputValue] = useState("\\");
    const [isInit, setIsInit] = useState(false);

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

    if (!isInit) {
      if (typeof Storage !== "undefined") {
        // Code for localStorage
        let localStorageUsername = WINDOW.localStorage.getItem("username");

        setNameInputValue(localStorageUsername);
      } else {
        // No web storage Support.
      }
      setIsInit(true);
    }

    //=========================================
    // Define callbacks
    //=========================================
    let onNameChangeConfirm = async () => {
      await game.updateMyName(nameInputValue);
      if (typeof Storage !== "undefined") {
        WINDOW.localStorage.setItem("username", nameInputValue);
      }
      windowManager.removeWindow(window.id);
      if (getIsMobile()) {
        toggleFullScreen(true);
      }
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

    const onReadyUp = () => {
      onNameChangeConfirm();
      game.updateMyStatus(game.const.READY);
    };

    //=========================================
    // Decide the contents of the window
    //=========================================
    let BackgroundPicker = makeContents({ windowManager });
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
              <div {...classes("column full center-center")}>
                <div {...classes("column full center-center")}>
                  <div {...classes("column")}>
                    <h3>Welcome Player!</h3>
                    <div {...classes("center")} style={{ padding: "10px" }}>
                      Enter your name to start
                    </div>
                  </div>
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
              </div>

              <div {...classes("column full center-center")}>
                <div
                  {...classes("row full  center-center")}
                  style={{ height: "250px" }}
                >
                  <BackgroundPicker
                    height={300}
                    width={width}
                    {...props}
                  ></BackgroundPicker>
                </div>
              </div>
            </div>
          </WindowContent>
          <WindowFooter>
            <FancyButton variant="secondary" onClick={onNameChangeConfirm}>
              Enter room
            </FancyButton>
            <FancyButton variant="primary" onClick={onReadyUp}>
              Ready Up
            </FancyButton>
          </WindowFooter>
        </FillContainer>
      );
    }

    return contents;
  };

  // Dragable Lists window
  let windowId = windowManager.createWindow({
    ...windowData,
    isFocused,
    isFullSize,
    position,
    size,
    children: windowContents,
  });
  if (isFocused) {
    windowManager.setFocused(windowId);
  }
  return windowId;
}

export default createSetUsernameWindow;
