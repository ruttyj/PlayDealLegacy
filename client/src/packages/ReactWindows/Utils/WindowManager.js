import React, { useState, useEffect } from "react";
import Utils from "../Utils";

const {
  els,
  elsFn,
  isFunc,
  isDef,
  isDefNested,
  isArr,
  getNestedValue,
  setImmutableValue,
  classes,
} = Utils;

function WindowManager(state) {
  let topWindowId = 0;
  const taskbarOrderPath = ["windows", "taskbarOrder"];
  const renderOrderPath = ["windows", "renderOrder"];
  const keyDictionaryPath = ["windows", "keyDictionary"];
  const containerSizePath = ["windows", "containerSize"];

  let maxZindex = 0;
  function setMaxZ(value) {
    maxZindex = value;
  }
  function getMaxZ(value) {
    return maxZindex + 1;
  }
  state.set("windows", {
    containerSize: { width: -1, height: -1 },
    snapIndicator: {
      n: false,
      s: false,
      e: false,
      w: false,
    },
    taskbarOrder: [],
    renderOrder: [],
    keyDictionary: {},
    items: {},
  });

  // create a window instance
  function _makeWindow(props) {
    
    let { key, title } = props;
    let {
      isOpen = false,
      isFocused = false,
      isFullSize = false,
      isDragDisabled = false,
      isResizeDisabled = false,
      disablePointerEventsOnBlur = false,
      isTitleHidden = false,
      position = null,
      dynamicPosition = null,
      dynamicSize = null,
      zIndex = 1,
      size = null,
      actions = null,
      visibility = "solid",
    } = props;

    if (isFocused) {
      isOpen = isFocused;
    }
    position = elsFn(position, () => ({
      left: 0,
      top: 0,
    }));
    size = elsFn(size, () => ({
      width: 700,
      height: 700,
    }));

    let id = ++topWindowId;
    key = els(key, `#${id}`);

    const selfManager = getProtected();

    const setValue = (path, value) =>
      selfManager.windowSetValue(id, path, value);

    

    //selfManager.
    return {
      id,
      key,
      set: setValue,
      title: els(title, `Window #${topWindowId}`),
      isOpen,
      visibility,
      zIndex,
      position,
      dynamicPosition,
      size,
      dynamicSize,
      isFocused,
      isFullSize,
      isDragging: false,
      isResizing: false,
      isTitleHidden,
      isDragDisabled,
      isResizeDisabled,
      disablePointerEventsOnBlur,
      isTempDisablePointerEvents: false,
      actions,
    };
  }

  // create a window and add to manager
  function createWindow(props = {}) {
    const { children } = props;
    let window = _makeWindow(props);

    let windowContents = "";
    if (isFunc(children)) {
      windowContents = (cprops) => children(cprops);
    } else {
      windowContents = children;
    }
    state.set(["windows", "contents", window.id], windowContents);
    state.set(["windows", "items", window.id], window);
    state.set([...keyDictionaryPath, window.key], window.id);
    state.push(taskbarOrderPath, window.id);
    state.push(renderOrderPath, window.id);
    if (props.isFocused) {
      setFocused(window.id, true);
    }
    return window.id;
  }

  function removeWindow(id) {
    let window = getWindow(id);
    if (isDef(window)) {
      // Remove taskbar order
      let oldWindowTaskBarOrder = state.get(taskbarOrderPath, []);
      let newWindowTaskBarOrder = oldWindowTaskBarOrder.filter((v) => v !== id);
      state.set(taskbarOrderPath, newWindowTaskBarOrder);

      // Remove render order
      let oldWindowRenderOrder = state.get(renderOrderPath, []);
      let newWindowRenderOrder = oldWindowRenderOrder.filter((v) => v !== id);
      state.set(renderOrderPath, newWindowRenderOrder);

      // Remove from lookups
      state.remove([...keyDictionaryPath, window.key]);

      // Remove window
      state.remove(["windows", "items", id]);
    }
  }

  // Get window or nested value
  function getWindow(id, path = [], fallback = null) {
    let _path = isArr(path) ? path : [path];
    return state.get(["windows", "items", id, ..._path], fallback);
  }

  function getWindowByKey(key) {
    let lookupId = state.get([...keyDictionaryPath, key], null);
    if (isDef(lookupId)) {
      return getWindow(lookupId);
    }
    return null;
  }

  function setValue(id, path, value) {
    let _path = isArr(path) ? path : [path];
    state.set(["windows", "items", id, ..._path], value);
  }

  function getValue(id, path, fallback) {
    let _path = isArr(path) ? path : [path];
    return state.get(["windows", "items", id, ..._path], fallback);
  }

  // @alias setValue
  function windowSetValue(...args) {
    return setValue(...args);
  }

  function setWindow(id, window) {
    state.set(["windows", "items", id], window);
  }

  function getOrderedWindows() {
    let idIndexedWindows = getWindowsKeyed();
    let result = [];
    getTaskbarOrder().forEach((id) => {
      if (isDef(idIndexedWindows[id])) {
        result.push(idIndexedWindows[id]);
      }
    });
    return result;
  }

  function getTaskbarOrder() {
    return state.get(["windows", "taskbarOrder"], []);
  }

  function setTaskbarOrder(value) {
    state.set(["windows", "taskbarOrder"], value);
  }

  function getRenderOrder() {
    return state.get(renderOrderPath, []);
  }

  function getWindowsKeyed() {
    return state.get(["windows", "items"], {});
  }

  // Get windows so frames are not rerendered when reordering taskbar
  function getAllWindows() {
    let items = state.get(["windows", "items"], {});
    return Object.keys(items).map((key) => items[key]);
  }

  function getRenderOrderedWindows() {
    let idIndexedWindows = getWindowsKeyed();
    return getRenderOrder().map((id) => idIndexedWindows[id]);
  }

  function getKey(key) {
    return getOrderedWindows().find((w) => isDef(w.key) && w.key === key);
  }

  function setPosition(id, position) {
    let window = getWindow(id);
    if (isDef(window)) {
      let clonedValue = setImmutableValue(window, "position", {
        ...position,
      });
      setWindow(id, clonedValue);
    }
  }

  function setSize(id, size) {
    let window = getWindow(id);
    if (isDef(window)) {
      let clonedValue = setImmutableValue(window, "size", { ...size });
      setWindow(id, clonedValue);
    }
  }

  function setFocused(id, value = true) {
    // Check if we need to default the value
    let isFocused = !isDef(value) ? true : value;

    // Try top Focus the window
    if (isFocused) {
      // Was previously focused?
      const wasFocused = getWindow(id, "isFocused", false);
      const wasOpen = getWindow(id, "isOpen", false);
      if (!wasFocused) {
        // change the render order
        let foundIndex = getRenderOrder().findIndex((v) => v === id);
        if (foundIndex > -1) {
          let fromPath = [...renderOrderPath, foundIndex];
          let val = state.get(fromPath);
          state.remove(fromPath);
          state.push(renderOrderPath, val);
        }
      }

      if (!wasOpen) {
        setValue(window.id, "isOpen", true);
      }
      // Set the new render order for all open windows
      let zIndex = 0;
      getRenderOrder().forEach((windowId) => {
        let zi = zIndex++;
        setValue(windowId, "zIndex", zi);
        setMaxZ(zi);
        if (windowId === id) {
          setValue(windowId, "isFocused", isFocused);
          if (isFocused) {
            setValue(id, "isOpen", isFocused);
          }
        } else {
          setValue(windowId, "isFocused", false);
        }
      });
    }
  }

  function toggleWindow(id, forcedToggle = false) {
    let window = getWindow(id);
    if (isDef(window)) {
      const wasOpen = getNestedValue(window, "isOpen", false);
      const wasFocused = getNestedValue(window, "isFocused", false);
      let isOpen = !wasOpen;
      let isFocused;
      if (forcedToggle) {
        isFocused = isOpen;
      } else {
        // Was not open
        if (!wasOpen) {
          isOpen = true;
          isFocused = true;
        }
        // Was open
        else {
          // but was not focused
          if (!wasFocused) {
            isOpen = true;
            isFocused = true;
          } else {
            //open and focused
            isOpen = false;
            isFocused = false;
          }
        }
      }

      setFocused(id, isFocused);
      setValue(id, "isOpen", isOpen);
    } else {
      windowManager.invokeWindow(key);
    }
  }

  function toggleOtherWindowsPointerEvents(id, value = true) {
    getRenderOrder().forEach((windowId) => {
      let window = getWindow(windowId);
      if (window.isOpen) {
        if (windowId !== id) {
          setWindow(
            windowId,
            setImmutableValue(window, "isTempDisablePointerEvents", value)
          );
        }
      }
    });
  }

  let onContainerSizeInitCallback = null;
  function setOnContainerSizeInit(fn) {
    onContainerSizeInitCallback = fn;
  }

  function setContainerSize(size) {
    if (isDefNested(size, "width") && isDefNested(size, "height")) {
      let prevSize = getContainerSize();
      if (size.width !== prevSize.width || size.height !== prevSize.height) {
        state.set(containerSizePath, { ...size });
      }
      if (prevSize.width === -1 && prevSize.height === -1) {
        if (isFunc(onContainerSizeInitCallback)) {
          onContainerSizeInitCallback();
        }
      }
    }
  }

  function getContainerSize(fallback = { width: -1, height: -1 }) {
    return state.get(containerSizePath, fallback);
  }

  function getState() {
    return state;
  }

  const registry = {};
  function registerWindow(name, callback) {
    registry[name] = callback;
  }

  function invokeWindow(name, ...args) {

    if (!state.get([...keyDictionaryPath, name], undefined)) {
      if (isFunc(registry[name])) {
        registry[name](...args);
      }
    } else {
      toggleWindow(name, true);
    }
  }

  // @TODO allow id or key
  function toggleWindow(key, forceValue=null) {
    let id;
    let window = getWindowByKey(key);

    if(isDef(window)){
      id = window.id;
    } else {
      id = key;
      window = getWindow(id);
    }


    let closeWindow = () => {
      if (!window.isFocused) {
        setFocused(window.id);
      } else {
        setValue(window.id, "isOpen", false);
        setFocused(window.id, false);
      }
    }
    let openWindow = () => {
      setValue(window.id, "isOpen", true);
      setFocused(window.id);
    }

    if (isDef(window)) {
      let newValue = forceValue;
      if(!isDef(newValue)){
        if (window.isOpen){
          newValue = false;
        } else {
          newValue = true;
        }
      }
    
      if (newValue) {
        openWindow();
      } else {
        closeWindow();
      }
    } else {
      invokeWindow(key);
    }
  }

  function toggleWindowFullSize(id, newValue) {
    let window = getWindow(id);
    if (isDef(window)) {
      if (window.isFullSize !== newValue) {
        if (newValue) {
          // set to full screen
          let preSize = { ...window.size };
          setValue(window.id, "size", { ...getContainerSize() });
          setValue(window.id, "prevSize", { ...preSize });
        } else {
          // return to normal size
          if (isDef(window.prevSize)) {
            setValue(window.id, "size", window.prevSize);
            setValue(window.id, "prevSize", null);
          }
        }
        setValue(window.id, "isFullSize", newValue);
      }
    }
  }

  function getWindowChildren(id){
    return state.get(["windows", "contents", id], null);
  }

  const publicScope = {
    getState,
    createWindow,
    registerWindow,
    invokeWindow,
    toggleWindow,
    getWindowByKey,
    getWindow,
    setWindow,
    setValue,
    getValue,
    windowSetValue,
    getOrderedWindows,
    getAllWindows,
    getTaskbarOrder,
    setTaskbarOrder,
    getRenderOrder,
    getWindowsKeyed,
    getRenderOrderedWindows,
    getKey,
    setPosition,
    setSize,
    setFocused,
    removeWindow,
    toggleWindow,
    toggleWindowFullSize,
    toggleOtherWindowsPointerEvents,
    setOnContainerSizeInit,
    setContainerSize,
    getContainerSize,
    getMaxZ,
    getWindowChildren,
  };

  function getPublic() {
    return publicScope;
  }

  function getProtected() {
    return {
      ...getPublic(),
      // Protected methods go here
    };
  }

  return getPublic();
}

export default WindowManager;
