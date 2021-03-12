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

import {
  getIsFullScreen,
  toggleFullScreen,
  getIsMobile,
} from "../Logic/fullscreen";

import Input from "@material-ui/core/Input";
import "./PlayerTurnWindow.scss";

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








function styles (value) {
  // @TODO return toCamelCase(fromKibabCase(split(";", value)))
  return {}
}















function WindowFooter(props = {}) {
  const { children } = props;
  return (
    <FillFooter height={40} classNames={["footer", "actions", "center-center"]}>
      {children}
    </FillFooter>
  );
}




function CreateWindow(props) {
  let { windowManager, game, isFocused = true, key } = props;
  const containerSize = windowManager.getContainerSize();

  //=========================================
  // Define Window Data
  //=========================================
  let windowData = {
    title: "Player Turn",
    key: "playerTurnOverlay",
  };


  /////////////////////////////////////////////
  //          Attribute Functions
  /////////////////////////////////////////////
  const dynamicSize = ({containerSize}) => {
    containerSize = containerSize || {width:100, height: 100};
    return {
      width:    containerSize.width,
      height:   200,
    };
  }

  const dynamicPosition = ({containerSize, window, size}) => {
    containerSize = containerSize || {width:100, height: 100};
    let widnowSize = size || window.size || {width:100, height: 100};
    return {
      left:   containerSize.width * 0.5 - widnowSize.width * 0.5,
      top:    containerSize.height * 0.5 - widnowSize.height * 0.5,
    };
  }
  

  /////////////////////////////////////////////
  //             Window Attributes
  /////////////////////////////////////////////
  const size = dynamicSize({containerSize});
  const position = dynamicPosition({containerSize, size});

  console.log({
    position,
    size
  });
  const isFullSize = false;



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
      let turn = {
        current: {
          person: game.turn.getPerson()
        }
      }

      let currentTurnContents = "";
      if (isDefNested(turn, ['current', 'person'])) {
        if(game.turn.isMyTurn()) {
          //getNested
          currentTurnContents = (<div {...classes("column full center-center center")}>
                                  <h3>Your turn!</h3>
                                </div>);
        } else {
          currentTurnContents = (<div {...classes("column full center-center center")}>
                                  <h3>{turn.current.person.name}'s turn</h3>
                                </div>);
        }
      } else {

        
          let messageContents = '';
          if (game.getPersonCount() < 2) {
            messageContents = (
                <h4>Waiting for players to join</h4>
            );
          } else {
            if (!game.amIReady()) {
              messageContents = (
                <h4>I need to ready up</h4>
              );
            } else {
              if (game.isEveryoneReady()) {
                if (game.amIHost()) {
                  messageContents = (
                    <h3>Everyone is Ready!</h3>
                  );
                } else {
                  messageContents = (
                    <h3>Waiting to Start</h3>
                  );
                }
              } else {
                messageContents = (
                    <h4>Waiting for people to ready up</h4>
                );
              }
            }
          }

          currentTurnContents = (
            <div {...classes("column full center-center center")}>
              {messageContents}
            </div>
          );
          
        
        
      }
      contents = (
        <FillContainer>
          <WindowContent>
            <div {...classes("full flex column grow column player-turn-notice no-select" )} onClick={() => { 
                      console.log("Clicked", window);
                      windowManager.toggleWindow(window.id, false);
                    }}>
              <div {...classes("column full ")}>
                <div
                  {...classes("column full center-center ")}
                  style={{ minHeight: "10px" }}
                >
                  <div {...classes("column")}>
                    {currentTurnContents}
                  </div>
                </div>
              </div>
            </div>
          </WindowContent>
        </FillContainer>
      );
    }

    return contents;
  };




  /////////////////////////////////////////////
  //             Define Window
  /////////////////////////////////////////////
  // Dragable Lists window
  let windowId = windowManager.createWindow({
    ...windowData,
    isFocused,
    isFullSize: false,
    isTitleHidden: true,
    isResizeDisabled: true,
    visibility: "transparent", // visible, solid, semiSolid, transparent, hidden
    position,
    dynamicPosition,
    dynamicSize,
    size,
    children: windowContents,
  });

  // Once Initialized properly set size / focus
  // @TODO move this shared logic to common location
  if (isFullSize) {
    windowManager.toggleWindowFullSize(windowId, isFullSize);
  }

  if (isFocused) {
    windowManager.setFocused(windowId);
  }


  return windowId;
}

export default CreateWindow;
