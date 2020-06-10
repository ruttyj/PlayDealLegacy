import React, { Component } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import CssBaseline from "@material-ui/core/CssBaseline";
import store from "./store";
import { Provider } from "react-redux";
import { isDef } from "../utils";

import Home from "../pages/Home/";
import Dev from "../pages/Dev";
import Room from "../pages/Room";
import Dev4 from "../pages/Dev4";

class App extends Component {
  constructor(props, context) {
    super(props, context);
  }

  render() {
    return (
      <Provider store={store}>
        <React.Fragment>
          <BrowserRouter>
            <CssBaseline />
            <Switch>
              <Route
                key="dev"
                exact
                path="/dev"
                render={(props) => {
                  return <Dev />;
                }}
              />

              <Route
                key="home"
                exact
                path="/"
                render={(props) => {
                  return <Home />;
                }}
              />

              <Route
                key="dev4"
                exact
                path="/dev4"
                render={(props) => {
                  return <Dev4 />;
                }}
              />

              <Route
                key="room/"
                exact
                path="/room/*"
                render={(props) => {
                  let roomCode = String(props.match.params[0]).replace(
                    /\//g,
                    ""
                  );
                  if (!isDef(roomCode)) {
                    roomCode = "AAAA";
                  }
                  roomCode = String(roomCode).trim().toUpperCase();
                  if (roomCode.length === 0) {
                    roomCode = "AAAA";
                  }

                  return <Room room={roomCode} />;
                }}
              />

              <Route
                key="room/"
                exact
                path="/room/*"
                render={(props) => {
                  let roomCode = String(props.match.params[0]).replace(
                    /\//g,
                    ""
                  );
                  return <Room room={roomCode} />;
                }}
              />
            </Switch>
          </BrowserRouter>
        </React.Fragment>
      </Provider>
    );
  }
}

export default App;
