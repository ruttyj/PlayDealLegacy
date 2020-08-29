import {
  React,
  useState,
  useEffect,
  Utils,
  motion,
  AnimatePresence,
  AddIcon,
  FillContainer,
  FillContent,
  FillHeader,
  FillFooter,
  DragWindow,
  WindowContainer,
  DragListH,
  StateBuffer,
  BlurredWrapper,
  AppSidebar,
  AppHeader,
  WindowManager,
  BugReportIcon,
  EmojiPeopleIcon,
  ArrowToolTip,
  wallpapers,
  PhotoSizeSelectActualIcon,
  TextField,
  PublicIcon,
  createDebugger,
  createTrooperIframe,
  createWindowA,
  createWallpaperWindow,
} from "../../Components/Imports/";
const {
  els,
  isDef,
  isArr,
  isFunc,
  classes,
  getNestedValue,
  setImmutableValue,
} = Utils;

const state = StateBuffer({});
const windowManager = WindowManager(state);

state.set("theme", {
  wallpaper: els(wallpapers[8], wallpapers[0]), // set default url
});

createWindowA(windowManager, false);
createWallpaperWindow(windowManager, true);
function Home(props) {
  //console.log("#####################################################");
  const [isLeftSnapIndicator, setIsLeftSnapIndicator] = useState(false);
  const [_state, _setState] = useState(state.get());
  state.setSetter(_setState);

  const addWindow = () => {
    windowManager.createWindow({
      isFocused: true,
      title: "Drag and Drop Grids - IFrame",
      children(props) {
        return (
          <iframe
            {...classes(["full"])}
            style={{
              backgroundColor: "white",
            }}
            src={`https://csb-7svhq-7wti992fk.vercel.app/`}
          />
        );
      },
    });
  };

  const addPlayDealWindow = () => {
    windowManager.createWindow({
      isFocused: true,
      title: "PlayDeal",
      children(props) {
        return (
          <iframe
            {...classes(["full"])}
            style={{
              backgroundColor: "white",
            }}
            src={`https://playdeal.live/`}
          />
        );
      },
    });
  };

  const addInternetExplorerWindow = () => {
    let defaultUrl = "https://threejs.org/examples/#css3d_sprites";
    windowManager.createWindow({
      isFocused: true,
      title: "Internet Explorer",
      children(props) {
        const { window } = props;

        // Url is global - (not window independant)
        const goFn = () => {
          state.set("url", state.get("url_input"));
        };
        let onKeyPressInput = (event) => {
          if (event.key === "Enter") {
            goFn();
          }
        };
        return (
          <div {...classes("column full")}>
            <div {...classes("row ")}>
              <TextField
                {...classes("full-width")}
                style={{ backgroundColor: "white" }}
                label="Url"
                value={state.get("url_input", defaultUrl)}
                onChange={(e) => state.set("url_input", e.target.value)}
                onKeyPress={onKeyPressInput}
                variant="filled"
              />
              <button onClick={goFn}>Go</button>
            </div>
            <iframe
              {...classes(["full"])}
              style={{
                backgroundColor: "white",
              }}
              src={state.get("url", defaultUrl)}
            />
          </div>
        );
      },
    });
  };

  const addThreeJSWindow = () => {
    windowManager.createWindow({
      isFocused: true,
      title: "ThreeJS",
      size: {
        width: 700,
        height: 300,
      },
      children(props) {
        return (
          <iframe
            {...classes(["full"])}
            style={{
              backgroundColor: "white",
            }}
            src={`https://threejs.org/examples/#css3d_sprites`}
          />
        );
      },
    });
  };

  const addFireworksWindow = () => {
    windowManager.createWindow({
      isFocused: true,
      title: "Fireworks",
      children(props) {
        return (
          <iframe
            {...classes(["full"])}
            style={{
              backgroundColor: "white",
            }}
            src={`https://mrgoonie.github.io/three.confetti.explosion.js/`}
          />
        );
      },
    });
  };

  const openDebugger = () => {
    let window = windowManager.getWindowByKey("debugger");
    if (isDef(window)) {
      windowManager.setFocused(window.id);
    } else {
      createDebugger(windowManager);
    }
  };

  const openDebuggerV2 = () => {
    let window = windowManager.getWindowByKey("debuggerV2");
    if (isDef(window)) {
      windowManager.setFocused(window.id);
    } else {
      createDebugger(windowManager);
    }
  };

  const openDancingTrooper = () => {
    let window = windowManager.getWindowByKey("trooper");
    if (isDef(window)) {
      windowManager.setFocused(window.id);
    } else {
      createTrooperIframe(windowManager);
    }
  };

  const openBackgroundPicker = () => {
    let window = windowManager.getWindowByKey("backgroundPicker");
    if (isDef(window)) {
      windowManager.setFocused(window.id);
    } else {
      createWallpaperWindow(windowManager);
    }
  };

  let taskBarItems = {};
  windowManager.getOrderedWindows().forEach((window) => {
    let outterClasses = [];
    if (window.isOpen) outterClasses.push("open");
    if (window.isFocused) outterClasses.push("focused");

    taskBarItems[window.id] = (
      <ArrowToolTip title={window.title} placement="top">
        <div
          {...classes("button", "no-select", outterClasses)}
          key={window.id}
          onClick={() => windowManager.toggleWindow(window.id)}
        >
          <div {...classes("truncate-inner")} key={window.id}>
            {window.title}
          </div>
        </div>
      </ArrowToolTip>
    );
  });

  let wallpaper = state.get(["theme", "wallpaper"]);
  const style = {
    "--bkgd-image": `url("${wallpaper}")`,
  };

  let menu = (
    <>
      <div {...classes("button")} onClick={() => openDancingTrooper()}>
        <EmojiPeopleIcon />
      </div>
      <div {...classes("button")} onClick={() => openBackgroundPicker()}>
        <PhotoSizeSelectActualIcon />
      </div>
      <div {...classes("button")} onClick={() => openDebugger()}>
        <BugReportIcon />
      </div>
      <div {...classes("button")} onClick={() => openDebuggerV2()}>
        <BugReportIcon />
      </div>
      <div {...classes("button")} onClick={() => addWindow()}>
        <AddIcon />
      </div>
      <div {...classes("button")} onClick={() => addPlayDealWindow()}>
        <AddIcon />
      </div>
      <div {...classes("button")} onClick={() => addFireworksWindow()}>
        <AddIcon />
      </div>
      <div {...classes("button")} onClick={() => addThreeJSWindow()}>
        <AddIcon />
      </div>
      <div {...classes("button")} onClick={() => addInternetExplorerWindow()}>
        <PublicIcon />
      </div>
    </>
  );
  return (
    <motion.div {...classes("full", "row", "main-bkgd")} style={style}>
      <AppSidebar>{menu}</AppSidebar>
      <FillContainer>
        <FillHeader>
          <AppHeader />
        </FillHeader>
        <FillContent>
          <WindowContainer
            windowManager={windowManager}
            children={({ containerSize }) => (
              <>
                {windowManager.getAllWindows().map((window) => {
                  const Child = window.children;
                  const contents = (
                    <DragWindow
                      window={window}
                      onSet={(path, value) =>
                        windowManager.setWindow(
                          window.id,
                          setImmutableValue(window, path, value)
                        )
                      }
                      onSetSize={(...args) =>
                        windowManager.setSize(window.id, ...args)
                      }
                      onSetPosition={(...args) => {
                        windowManager.setPosition(window.id, ...args);
                      }}
                      onClose={() => windowManager.removeWindow(window.id)}
                      onToggleWindow={() =>
                        windowManager.toggleWindow(window.id, true)
                      }
                      onSetFocus={(value) =>
                        windowManager.setFocused(window.id, value)
                      }
                      onDown={(window) => {
                        // allow dragging to be unaffected incase the other window prevents event propagation
                        windowManager.toggleOtherWindowsPointerEvents(
                          window.id,
                          true
                        );
                      }}
                      onUp={(window) => {
                        // renable pointer events for other windows
                        windowManager.toggleOtherWindowsPointerEvents(
                          window.id,
                          false
                        );
                      }}
                      title={window.title}
                      snapIndicator={state.get(["windows", "snapIndicator"])}
                      setSnapIndicator={(key, value) =>
                        state.set(["windows", "snapIndicator", key], value)
                      }
                      containerSize={containerSize}
                      children={<Child />}
                      actions={window.actions}
                    />
                  );
                  return (
                    <AnimatePresence key={window.id}>
                      {contents}
                    </AnimatePresence>
                  );
                })}
              </>
            )}
          />
        </FillContent>
        <FillFooter height={60}>
          <div {...classes("full")}>
            <BlurredWrapper>
              <div {...classes("taskbar", "full", "tinted-dark")}>
                <DragListH
                  items={taskBarItems}
                  order={windowManager.getTaskbarOrder()}
                  setOrder={(newOrder) => {
                    windowManager.setTaskbarOrder(newOrder);
                  }}
                />
              </div>
            </BlurredWrapper>
          </div>
        </FillFooter>
      </FillContainer>
    </motion.div>
  );
}

export default Home;
