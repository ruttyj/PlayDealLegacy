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
} from "../../../../../packages/ReactWindows/Components/Imports/";
const {
  els,
  isDef,
  isArr,
  isFunc,
  classes,
  getNestedValue,
  setImmutableValue,
} = Utils;

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

export { useSmartClick };
