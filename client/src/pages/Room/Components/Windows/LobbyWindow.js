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

import { ArrowToolTip } from "../../../../packages/ReactWindows/Exports/Exports";

import List from "@material-ui/core/List";
import Divider from "@material-ui/core/Divider";

import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import PersonListItem from "../../../../components/game/PersonListItem/";
import { deepOrange, green, grey } from "@material-ui/core/colors";
import CreateIcon from "@material-ui/icons/Create";

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

function createSetUsernameWindow(props) {
  let { windowManager, game, action, isFocused = true } = props;

  let commonData = {
    title: "Lobby",
    key: "lobbyWindow",
  };

  const isFullSize = true;
  const size = {
    width: 320,
    height: 1000,
  };
  // Position at this pelative part of the container
  const relativePos = {
    left: 0,
    top: 1 / 4,
  };

  // Offset on with to center the window
  const relativeSizeOffset = {
    left: 1 / 2,
    top: 1 / 2,
  };

  const containerSize = windowManager.getContainerSize();

  const positionWindowAt = {
    left: containerSize.width * relativePos.left,
    top: containerSize.height * relativePos.top,
  };

  const windowOffset = {
    left: size.width * relativeSizeOffset.left,
    top: size.height * relativeSizeOffset.top,
  };

  const position = {
    left: positionWindowAt.left - windowOffset.left,
    top: positionWindowAt.top - windowOffset.top,
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
      let personContents = (
        <List
          {...classes("full")}
          style={{
            display: "inline-flex",
            flexDirection: "column",
          }}
        >
          {game.getLobbyUsers().map((person, i) => {
            let isMe = game.isMyId(person.id);
            let personNameInput = globalState.get("nameInput");
            let isChangingMyName = globalState.get("isChangingMyName");

            let toggleEditName = () => {
              let person = game.me();
              let name = personNameInput;
              if (isDef(person)) {
                name = person.name;
              }
              globalState.set("nameInput", name);
              globalState.set("isChangingMyName", !isChangingMyName);
            };

            let onNameChangeConfirm = async () => {
              await game.updateMyName(personNameInput);
              toggleEditName();
            };

            let onKeyPressNameInput = (event) => {
              if (event.key === "Enter") {
                onNameChangeConfirm();
              }
            };
            let onNameChange = (event) =>
              this.setState({
                nameInput: event.target.value,
              });

            let toggleEditMyName = () => {
              if (isMe) {
                toggleEditName();
              }
            };

            let context = {
              name: person.name,
              key: person.name,
              isMe,
              isHost: game.person.isHost(person.id),
              isReady: game.isPersonReady(person.id),
            };

            context.bkgd = context.isReady ? green[700] : deepOrange[900];

            // const strToStyle = (mxd) => {
            //   let strs = isArr(mxd) ? mxd : [mxd];
            //   strs.forEach((str) => {
            //     let split = str.split(";");
            //   })
            // }

            return (
              <div
                key={context.key}
                {...classes(["center-center", "column", "no-select"])}
                style={{
                  padding: "20px",
                  backgroundColor: context.bkgd,
                  margin: "2px",
                }}
              >
                <div {...classes(["full", "grow", "column", "center-center"])}>
                  <div {...classes(["full", "grow", "row", "center-center"])}>
                    <div {...classes(["full", "grow", "row", "center-center"])}>
                      {context.isHost ? " ⭐ " : ""}
                      {context.name}
                      {context.isHost ? " ⭐" : ""}
                    </div>
                    <div {...classes(["center-center", "row"])}>
                      {isMe && (
                        <>
                          <div
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              windowManager.toggleWindow("usernamePicker");
                              console.log("do the thing");
                            }}
                          >
                            <ArrowToolTip
                              title={"Edit my username"}
                              placement="right"
                            >
                              <CreateIcon />
                            </ArrowToolTip>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <Divider />
        </List>
      );

      let amIReady = game.isPersonReady(game.myId());

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
              <div {...classes("full grow column")}>
                <div {...classes("full grow")}>{personContents}</div>
                <div {...classes("row")}>
                  <div
                    {...classes("full row center-center no-select")}
                    style={{
                      padding: "20px",
                      backgroundColor: amIReady ? green[700] : deepOrange[900],
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      game.toggleReady();
                    }}
                  >
                    {amIReady ? "I'm Ready!" : "Ready Up"}
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

  // Dragable Lists window
  let windowId = windowManager.createWindow({
    title: commonData.title,
    key: commonData.key,
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

export default createSetUsernameWindow;
