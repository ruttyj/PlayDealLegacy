import { isDef } from "../../../../utils/";

function getIsMobile() {
  const toMatch = [
    /Android/i,
    /webOS/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i,
  ];

  return toMatch.some((toMatchItem) => {
    return navigator.userAgent.match(toMatchItem);
  });
}

function getIsFullScreen() {
  return document.fullscreenElement;
}

function toggleFullScreen(forceValue = null) {
  let newValue;
  if (isDef(forceValue)) {
    newValue = forceValue;
  } else {
    newValue = !getIsFullScreen();
  }
  if (newValue) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

export { getIsFullScreen, toggleFullScreen, getIsMobile };
