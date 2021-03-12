import React, { Component } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import CssBaseline from "@material-ui/core/CssBaseline";
import { MuiThemeProvider, createMuiTheme } from "@material-ui/core/styles";
import store from "./store";
import { Provider } from "react-redux";
import { isDef } from "../utils";
import { withResizeDetector } from "react-resize-detector";

import HomeRaw from "../pages/Home/";
import DevRaw from "../pages/Dev";
import RoomRaw from "../pages/Room/";
import Dev4Raw from "../pages/Dev4";
import Drag from "../pages/Drag";

import ReactWindowsExamplePage from "../pages/Windows/";

const Home = withResizeDetector(HomeRaw);
const Dev = withResizeDetector(DevRaw);
const Room = withResizeDetector(RoomRaw);
const Dev4 = withResizeDetector(Dev4Raw);

const theme = createMuiTheme({
  palette: {
    primary: {
      main: "#000",
    },
  },
});

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
            <MuiThemeProvider theme={theme}>
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
                  key="windows"
                  exact
                  path="/windows"
                  render={(props) => {
                    return <ReactWindowsExamplePage />;
                  }}
                />

                <Route
                  key="Drag"
                  exact
                  path="/drag"
                  render={(props) => {
                    return <Drag />;
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
                    roomCode = String(roomCode)
                      .trim()
                      .toUpperCase();
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
            </MuiThemeProvider>
          </BrowserRouter>
        </React.Fragment>
      </Provider>
    );
  }
}

export default App;
