import React from "react";
import { render } from "react-dom";
import App from "./App/App.jsx";

if (!window.renderedApp) {
  window.renderedApp = true;
  console.log(
    `================================================================`
  );
  console.log(
    `                                                                `
  );
  console.log(
    `██████  ██       █████  ██    ██ ██████  ███████  █████  ██     `
  );
  console.log(
    `██   ██ ██      ██   ██  ██  ██  ██   ██ ██      ██   ██ ██     `
  );
  console.log(
    `██████  ██      ███████   ████   ██   ██ █████   ███████ ██     `
  );
  console.log(
    `██      ██      ██   ██    ██    ██   ██ ██      ██   ██ ██     `
  );
  console.log(
    `██      ███████ ██   ██    ██    ██████  ███████ ██   ██ ███████`
  );
  console.log(
    `                                                                `
  );
  console.log(
    `================================================================`
  );
  render(<App />, document.getElementById("app"));
}
