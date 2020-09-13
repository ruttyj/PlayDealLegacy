import {
  React,
  Utils,
} from "../../../../packages/ReactWindows/Components/Imports/";
const { classes } = Utils;

function makeWindowComponent(props) {
  let { windowManager, isFocused = true } = props;
  // Stom trooper dancing iframe
  let windowId = windowManager.createWindow({
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

  if (isFocused) {
    windowManager.setFocused(windowId);
  }
  return windowId;
}

export default makeWindowComponent;
