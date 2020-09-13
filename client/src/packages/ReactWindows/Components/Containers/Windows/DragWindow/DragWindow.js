import React, { useState, useEffect } from "react";
import useConstant from "use-constant";
import { motion, useTransform, useMotionValue } from "framer-motion";
import { withResizeDetector } from "react-resize-detector";
import CloseIcon from "@material-ui/icons/Close";
import FlareIcon from "@material-ui/icons/Flare";
import LockIcon from "@material-ui/icons/Lock";
import LockOpenIcon from "@material-ui/icons/LockOpen";

import MinimizeIcon from "@material-ui/icons/Minimize";
import FillContainer from "../../../../Components/Containers/FillContainer/FillContainer";
import FillContent from "../../../../Components/Containers/FillContainer/FillContent";
import FillHeader from "../../../../Components/Containers/FillContainer/FillHeader";
import DragHandle from "../../../../Components/Functional/DragHandle/";
import Utils from "../../../../Utils/";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import Button from "@material-ui/core/Button";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import "./DragWindow.scss";
const {
  getNestedValue,
  classes,
  setImmutableValue,
  isFunc,
  isDef,
  isTruthy,
  els,
} = Utils;
let ef = () => {}; // empty function
/*
 * Please excuse the mess
 */

const DragWindow = withResizeDetector(function(props) {
  let CONFIG = {
    state: {
      write: true,
    },
  };

  let {
    window = {},
    containerSize,
    classNames = [],
    minSize = {},
    title = "Untitled",
    snapIndicator = {},
    children,
    actions,
    hideTitle = false,
    windowManager,
  } = props;
  let {
    onSet = ef,
    onSetFocus = ef,
    onSetSize = ef,
    onSetPosition = ef,
    onClose = ef,
    onDown: handleOnDown = ef,
    onUp: handleOnUp = ef,
    onToggleWindow: handleOnToggleWindow,
    setSnapIndicator = ef,
    onSnapEnter = ef,
    onSnapLeave = ef,
    onSnapRelease = ef,
  } = props;
  const [menuAnchorElement, setMenuAnchorElement] = useState(null);
  const [cachedDragHandleContents, setCachedDragHandleContents] = useState();

  const zIndex = getNestedValue(window, "zIndex", 0);

  const isFocused = getNestedValue(window, "isFocused", false);

  const isTempDisablePointerEvents = getNestedValue(
    window,
    "isTempDisablePointerEvents",
    false
  );
  const disablePointerEventsOnBlur = getNestedValue(
    window,
    "disablePointerEventsOnBlur",
    false
  );

  // Use motion values to store anything which needs to update faster than the state
  const motionValue = {
    isFullSize: useMotionValue(window.isFullSize),
    isDragging: useMotionValue(window.isDragging),
    backgroundColor: useMotionValue("transparent"), // used to set the background color before the state has a chance to refresh
    isChangingLocation: useMotionValue(false),
  };

  let isFullSize = motionValue.isFullSize.get();
  const setFullSize = (newValue) => {
    if (isFullSize !== newValue) {
      motionValue.isFullSize.set(newValue);

      if (newValue) {
        // set to full screen

        // Cache the previous window size
        let preSize = { ...window.size };
        setSize({ ...containerSize });
        onSet("prevSize", preSize);
        window = windowManager.getWindow(window.id);
      } else {
        // return to normal size
        if (isDef(window.prevSize)) {
          setSize(window.prevSize);
          onSet("prevSize", null);
        }
      }
      onSet("isFullSize", newValue);
    }
  };

  const isDragDisabled = getNestedValue(window, "isDragDisabled", false);
  const setDragDisabled = (value) => {
    onSet("isDragDisabled", value);
  };

  const isResizeDisabled =
    isFullSize || getNestedValue(window, "isResizeDisabled", false);
  const setResizeDisabled = (value) => {
    onSet("isResizeDisabled", value);
  };
  const toggleResizeDisabled = () => {
    setResizeDisabled(!isResizeDisabled);
  };

  const getIsDragging = () => {
    return motionValue.isDragging.get();
  };

  /** /////////////////////////////////////////////////////////
   *  isChangingLocation
   *  =========================================================
   *  If the container is resizing or if the window is resizing
   *  Alter the state so that buggy re-rendering
   *  (like brower background blur)
   *  is mitigated
   */
  const lastChangedId = useMotionValue(0);
  const [lastChangedTime, setLastChangedTime] = useState(null);
  const getIsChangingLocation = () => {
    return motionValue.isChangingLocation.get();
  };
  const getCurrentTime = () => {
    return new Date().getTime();
  };
  // Return the state to an non-activly changing state
  const debouncedsSetNotChanging = () => {
    let timeout = 500;
    function makeCheckInactive(currentCheckId) {
      return function() {
        let isCurrentlyChanging = motionValue.isChangingLocation.get();
        if (isCurrentlyChanging) {
          // detect if is the most recent call of the method... to acheive the debounce effect
          let isLastExecution = currentCheckId === lastChangedId.get();
          if (isLastExecution) {
            let delta = getCurrentTime() - lastChangedTime;
            if (isDef(lastChangedTime) && delta >= timeout) {
              setLastChangedTime(null);
              motionValue.isChangingLocation.set(false);
              setIsChangingLocation(false);
            }
          }
        }
      };
    }
    let newId = lastChangedId.get() + 1;
    lastChangedId.set(newId);
    setTimeout(makeCheckInactive(newId), timeout);
  };

  const setIsChangingLocation = (value) => {
    motionValue.isChangingLocation.set(value);
    if (value) {
      setLastChangedTime(getCurrentTime());
      if (value) {
        debouncedsSetNotChanging();
      }
      motionValue.backgroundColor.set("#f90");
    } else {
      motionValue.backgroundColor.set("transparent");
    }
  };

  // end isChangingLocation ////////////////////////////////////////////

  let isMouseEventsDisabled = getIsDragging();

  const getMinSize = () => {
    return {
      height: getNestedValue(minSize, "height", 100),
      width: getNestedValue(minSize, "width", 250),
    };
  };

  // Get size from motion value to make butery smooth
  const anchorPosY = useMotionValue(window.position.top);
  const anchorPosX = useMotionValue(window.position.left);
  const getPosition = () => {
    return {
      left: anchorPosX.get(),
      top: anchorPosY.get(),
    };
  };
  const setPosition = (newValue) => {
    anchorPosY.set(newValue.top);
    anchorPosX.set(newValue.left);
    onSetPosition(newValue);
  };

  const winSizeY = useMotionValue(window.size.height);
  const winSizeX = useMotionValue(window.size.width);
  const getSize = () => {
    return {
      height: winSizeY.get(),
      width: winSizeX.get(),
    };
  };
  const setSize = (newValue) => {
    winSizeY.set(newValue.height);
    winSizeX.set(newValue.width);
    if (
      newValue.height !== window.size.height ||
      newValue.width !== window.size.width
    ) {
      onSetSize(newValue);
    }
  };

  const setFocused = (newValue) => {
    onSetFocus(newValue);
  };

  const initialSize = getSize();

  // Set the position if not defined on original object

  const toggleDragEnabled = () => {
    setDragDisabled(!isDragDisabled);
  };

  // Handle full size so values are always correct
  if (isFullSize) {
    let changed = {
      position: false,
      size: false,
    };

    // Update position for full size
    let currentPos = getPosition();
    if (currentPos.left !== 0) {
      changed.position = true;
      currentPos.left = 0;
    }
    if (currentPos.top !== 0) {
      changed.position = true;
      currentPos.top = 0;
    }
    if (changed.position) {
      setPosition(currentPos);
    }

    // Update size for full size
    let currentSize = getSize();
    if (currentSize.width !== containerSize.width) {
      changed.size = true;
      currentSize.width = containerSize.width;
    }
    if (currentSize.height !== containerSize.height) {
      changed.size = true;
      currentSize.height = containerSize.height;
    }
    if (changed.size) {
      setSize(currentSize);
    }
  }

  // Dont allow to resize outside of bounds
  function restrictAxis(
    pos,
    posField,
    size,
    sizeField,
    minSize,
    containerSize
  ) {
    // Limit drag position
    if (pos[posField] < 0) pos[posField] = 0;

    if (containerSize[sizeField] < size[sizeField])
      size[sizeField] = containerSize[sizeField];

    let limitBounds;
    let difference;
    limitBounds = pos[posField] + size[sizeField];
    if (limitBounds > containerSize[sizeField]) {
      if (pos[posField] > 0) {
        difference = limitBounds - containerSize[sizeField];
        if (difference < pos[posField]) {
          pos[posField] -= difference;
        } else {
          pos[posField] = 0;
        }
      } else {
        limitBounds = pos[posField] + size[sizeField];
        difference = limitBounds - containerSize[sizeField];
        if (difference > 0) {
          size[sizeField] = containerSize[sizeField];
        }
      }
    }

    if (size[sizeField] < minSize[sizeField])
      size[sizeField] = minSize[sizeField];
  }

  // Side effect: will mutate the input values
  const updatePosAndSize = (newPos, newSize, minSize, containerSize) => {
    restrictAxis(newPos, "top", newSize, "height", minSize, containerSize);
    restrictAxis(newPos, "left", newSize, "width", minSize, containerSize);
    anchorPosY.set(newPos.top);
    anchorPosX.set(newPos.left);

    setIsChangingLocation(true);
    setPosition(newPos);
    setSize(newSize);
    //*
    let boundaries = {
      w: newPos.left,
      e: newPos.left + newSize.width,
      n: newPos.top,
      s: newPos.top + newSize.height,
    };

    let isWithinRange = {
      w: newPos.left < 4,
      e: containerSize.width - boundaries.e < 4,
      n: newPos.top < 4,
      s: containerSize.height - boundaries.s < 4,
    };

    let indicators = {
      w: els(snapIndicator.w, false),
      e: els(snapIndicator.e, false),
      n: els(snapIndicator.n, false),
      s: els(snapIndicator.s, false),
    };

    // left indicator active
    if (isWithinRange.w && !indicators.w) {
      setSnapIndicator("w", true);
    }
    if (!isWithinRange.w && indicators.w) {
      setSnapIndicator("w", false);
    }

    // right indicator active
    if (isWithinRange.e && !indicators.e) {
      setSnapIndicator("e", true);
    }
    if (!isWithinRange.e && indicators.e) {
      setSnapIndicator("e", false);
    }

    // right indicator active
    if (isWithinRange.n && !indicators.n) {
      setSnapIndicator("n", true);
    }
    if (!isWithinRange.n && indicators.n) {
      setSnapIndicator("n", false);
    }

    // right indicator active
    if (isWithinRange.s && !indicators.s) {
      setSnapIndicator("s", true);
    }
    if (!isWithinRange.s && indicators.s) {
      setSnapIndicator("s", false);
    }
    //*/
  };

  const computePosAndSize = (info) => {};

  const onDrag = (e, info) => {
    if (!isDragDisabled) {
      if (isFullSize) {
        setFullSize(false);
      }

      setIsChangingLocation(true);

      let delta = info.delta;
      if (delta.x !== 0 || delta.y !== 0) {
        const newPos = {
          left: anchorPosX.get() + delta.x,
          top: anchorPosY.get() + delta.y,
        };
        const newSize = {
          height: winSizeY.get(),
          width: winSizeX.get(),
        };
        if (isTruthy(CONFIG.state.write)) {
          updatePosAndSize(newPos, newSize, getMinSize(), containerSize);
          setFocused(true);
        }
      }
    }
  };

  const onDown = () => {
    if (!getIsDragging()) {
      onSet("isDragging", true);
      // let the parent know the window is being interacted with
    }

    handleOnDown(window);
  };

  const onResizeDown = () => {
    let newResizingValue = false;
    if (!isResizeDisabled) {
      newResizingValue = true;
    }
    if (!isFocused) {
      setFocused(true);
    }
    onSet("isResizing", newResizingValue);
    onDown();
  };

  const onUp = (e, info) => {
    onSet("isResizing", false);
    onSet("isDragging", false);
    setIsChangingLocation(false);

    // let the parent know the window is no longer being interacted with
    handleOnUp(window);
  };

  // Resize window
  const makeOnDragReize = (key) => {
    return function(e, info) {
      let delta = info.delta;
      if (!isResizeDisabled) {
        const size = {
          height: winSizeY.get(),
          width: winSizeX.get(),
        };
        setIsChangingLocation(true);

        if (delta.x !== 0 || delta.y !== 0) {
          let originalWidth = getNestedValue(size, "width", null);
          if (Number.isNaN(originalWidth)) originalWidth = initialSize.width;

          let originalHeight = getNestedValue(size, "height", null);
          if (Number.isNaN(originalHeight)) originalHeight = initialSize.height;

          let newPos = getPosition();

          // Make sure values are defined
          let newSize = size;
          if (Number.isNaN(size.height)) {
            newSize = setImmutableValue(newSize, "height", originalHeight);
          }
          if (Number.isNaN(size.width)) {
            newSize = setImmutableValue(newSize, "width", originalWidth);
          }

          // Right side
          if (["e", "se", "ne"].includes(key)) {
            newSize = setImmutableValue(
              newSize,
              "width",
              originalWidth + delta.x
            );
          }

          // Left side
          if (["w", "sw", "nw"].includes(key)) {
            newSize = setImmutableValue(
              newSize,
              "width",
              originalWidth - delta.x
            );
            newPos = setImmutableValue(newPos, "left", newPos.left + delta.x);
          }

          // Top side
          if (["n", "ne", "nw"].includes(key)) {
            newSize = setImmutableValue(
              newSize,
              "height",
              originalHeight - delta.y
            );
            newPos = setImmutableValue(newPos, "top", newPos.top + delta.y);
          }

          // Bottom side
          if (["s", "se", "sw"].includes(key)) {
            newSize = setImmutableValue(
              newSize,
              "height",
              originalHeight + delta.y
            );
          }

          if (isTruthy(CONFIG.state.write)) {
            updatePosAndSize(newPos, newSize, getMinSize(), containerSize);
          }
        }
      }
    };
  };

  // Refresh size of model screen resized
  useEffect(() => {
    let newPos = { ...getPosition() };
    let newSize = { ...getSize() };
    if (isTruthy(CONFIG.state.write)) {
      updatePosAndSize(newPos, newSize, getMinSize(), containerSize);
      setIsChangingLocation(true);
    }
  }, [containerSize.width, containerSize.height]);

  let dragHandleContents = null;

  if (true || isDef(cachedDragHandleContents)) {
    // Drag handles
    dragHandleContents = (
      <>
        <DragHandle
          onDrag={makeOnDragReize("e")}
          onDown={onResizeDown}
          onUp={onUp}
          disabled={isResizeDisabled}
          classNames={["resize-handle", "resize-handle-e"]}
        />
        <DragHandle
          onDrag={makeOnDragReize("w")}
          onDown={onResizeDown}
          onUp={onUp}
          disabled={isResizeDisabled}
          classNames={["resize-handle", "resize-handle-w"]}
        />
        <DragHandle
          onDrag={makeOnDragReize("n")}
          onDown={onResizeDown}
          onUp={onUp}
          disabled={isResizeDisabled}
          classNames={["resize-handle", "resize-handle-n"]}
        />
        <DragHandle
          onDrag={makeOnDragReize("s")}
          onDown={onResizeDown}
          onUp={onUp}
          disabled={isResizeDisabled}
          classNames={["resize-handle", "resize-handle-s"]}
        />
        <DragHandle
          onDrag={makeOnDragReize("se")}
          onDown={onResizeDown}
          onUp={onUp}
          disabled={isResizeDisabled}
          classNames={["resize-handle-corner", "resize-handle-se"]}
        />
        <DragHandle
          onDrag={makeOnDragReize("ne")}
          onDown={onResizeDown}
          onUp={onUp}
          disabled={isResizeDisabled}
          classNames={["resize-handle-corner", "resize-handle-ne"]}
        />
        <DragHandle
          onDrag={makeOnDragReize("nw")}
          onDown={onResizeDown}
          onUp={onUp}
          disabled={isResizeDisabled}
          classNames={["resize-handle-corner", "resize-handle-nw"]}
        />
        <DragHandle
          onDrag={makeOnDragReize("sw")}
          onDown={onResizeDown}
          onUp={onUp}
          disabled={isResizeDisabled}
          classNames={["resize-handle-corner", "resize-handle-sw"]}
        />
      </>
    );
  }

  const toggleFullSize = () => {
    setFullSize(!isFullSize);
  };

  const childArgs = {
    window: windowManager.getWindow(window.id),
    containerSize,
    size: getSize(),
    position: getPosition(),
    do: {
      close: onClose,
      minimize: handleOnToggleWindow,
      maxamize: toggleFullSize,
    },
  };

  const handleMenuClick = (event) => {
    setMenuAnchorElement(event.currentTarget);
  };
  const handleCloseMenu = () => {
    setMenuAnchorElement(null);
  };
  // Define the contents of the UI
  let headerContents = "";
  let titleContents = (
    <DragHandle
      onDrag={onDrag}
      onDown={() => onDown()}
      onUp={onUp}
      onClick={() => setFocused()}
      classNames={["title", isDragDisabled ? "not-allowed" : ""]}
    >
      {isDef(title) ? (isFunc(title) ? title(childArgs) : title) : ""}
    </DragHandle>
  );
  let leftHeaderActionContents = (
    <div {...classes("actions", "row")}>
      <div {...classes("button")} title="Close" onClick={() => onClose()}>
        <div {...classes("circle red")} />
      </div>

      <div {...classes("button")} onClick={() => handleOnToggleWindow()}>
        <div {...classes("circle yellow")} />
      </div>

      <div
        {...classes("button")}
        onClick={toggleFullSize}
        title={isFullSize ? "Restore size" : "Maximize size"}
      >
        <div {...classes("circle green")} />
      </div>
    </div>
  );

  let lockDragLabel = isDragDisabled ? "Drag disabled" : "Drag enabled";
  let lockResizeLabel = isResizeDisabled ? "Resize disabled" : "Resize enabled";

  let rightHeaderActionContents = (
    <div {...classes("actions", "row", "right")} style={{ width: "102px" }}>
      <div {...classes("button")} onClick={handleMenuClick}>
        <MoreVertIcon />
      </div>

      <Menu
        id="simple-menu"
        anchorEl={menuAnchorElement}
        keepMounted
        open={Boolean(menuAnchorElement)}
        onClose={handleCloseMenu}
      >
        <MenuItem
          onClick={handleCloseMenu}
          onClick={() => {
            toggleDragEnabled();
          }}
        >
          <ListItemIcon>
            {!isDragDisabled ? <LockOpenIcon /> : <LockIcon />}
          </ListItemIcon>{" "}
          {lockDragLabel}
        </MenuItem>

        <MenuItem
          onClick={() => {
            toggleResizeDisabled();
          }}
        >
          <ListItemIcon>
            {!isResizeDisabled ? <LockOpenIcon /> : <LockIcon />}
          </ListItemIcon>
          {lockResizeLabel}
        </MenuItem>
      </Menu>
    </div>
  );

  const size = getSize();
  if (size.width > 300) {
    headerContents = (
      <div {...classes("header", "no-select")}>
        <div {...classes("row")}>
          {leftHeaderActionContents}
          {titleContents}
          {rightHeaderActionContents}
        </div>
      </div>
    );
  } else {
    headerContents = (
      <div {...classes("header", "no-select")}>
        <div {...classes("row")}>
          {leftHeaderActionContents}
          <DragHandle
            onDrag={onDrag}
            onDown={() => onDown()}
            onUp={onUp}
            onClick={() => setFocused()}
            classNames={["title", isDragDisabled ? "not-allowed" : ""]}
          />
          {rightHeaderActionContents}
        </div>
        <div {...classes("row")}>{titleContents}</div>
      </div>
    );
  }

  let childContents = "";
  if (isDef(children)) {
    if (isFunc(children)) {
      let Child = children;
      childContents = <Child {...childArgs} />;
    } else {
      childContents = children;
    }
  }

  //------------------------------------
  // Window animation
  let animateState;
  if (window.isOpen) {
    animateState = "visible";
  } else {
    animateState = "hidden";
  }
  const variants = {
    hidden: {
      opacity: 0,
      y: 100,
      transition: "linear",
      transitionEnd: {
        display: "none",
      },
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: "linear",
      display: "flex",
    },
  };

  let disablePointerEvents =
    isMouseEventsDisabled ||
    isTempDisablePointerEvents ||
    (disablePointerEventsOnBlur && !isFocused);

  const windowSize = getSize();
  const windowPos = getPosition();
  let top = anchorPosY;
  let left = anchorPosX;
  let width = winSizeX;
  let height = winSizeY;
  // Draw Window
  return (
    <motion.div
      onAnimationStart={() => {
        setIsChangingLocation(true);
      }}
      onAnimationComplete={() => {
        setIsChangingLocation(false);
      }}
      {...classes(
        "window",
        classNames,
        getIsChangingLocation() ? "dragging" : ""
      )}
      onMouseDown={() => {
        if (!isFocused) setFocused(true);
      }}
      onMouseDown={() => {
        if (!isFocused) setFocused(true);
      }}
      onTapStart={() => {
        if (!isFocused) setFocused(true);
      }}
      variants={variants}
      initial="hidden"
      exit="hidden"
      animate={animateState}
      style={{
        top,
        left,
        position: "absolute",
        zIndex: zIndex,

        ...(isFullSize
          ? {
              height: containerSize.height,
              width: containerSize.width,
              maxHeight: containerSize.height,
              maxWidth: containerSize.width,
            }
          : {
              width,
              height,
              maxHeight: windowSize.height,
              maxWidth: windowSize.width,
            }),
      }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      <div {...classes("window-inner", "relative")}>
        <motion.div
          {...classes("full", "fade-background", "relative")}
          style={{
            backgroundColor: motionValue.backgroundColor,
          }}
        >
          <div {...classes("window-shell", "grow")}>
            {dragHandleContents}
            <div {...classes(["inner-content", "grow", "column"])}>
              <FillContainer>
                {!hideTitle && <FillHeader>{headerContents}</FillHeader>}

                <FillContent
                  classNames={[
                    "overflow-hidden",
                    "relative",
                    "column",
                    disablePointerEvents && "disable-pointer-events",
                  ]}
                >
                  {childContents}
                </FillContent>

                {isDef(actions)
                  ? isFunc(actions)
                    ? actions(childArgs)
                    : actions
                  : ""}
              </FillContainer>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

export default DragWindow;
